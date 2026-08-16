/**
 * データの整合性チェック。
 * 千人規模になると必ず壊れるので、開発モードの起動時に全部なめて警告を出す。
 */

import { escapeConditions } from './biography';
import { FACTIONS } from './data/factions';
import { RANKS } from './data/ranks';
import { ROLES } from './data/roles';
import { SOURCES, isHistorical } from './data/sources';
import { CITY_CONTROL, validateControl } from './data/world/control';
import { ALL_EVENTS, ALL_OFFICERS, EVENTS, FATE_ARCHETYPES, OFFICERS, allegianceOf } from './registry';
import { blankChronicle } from './runner';
import { validateBandits } from './systems/bandits';
import type { Aftermath, Chronicle } from './types';

export function validateChronicleData(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const officer of ALL_OFFICERS) {
    const where = `武将 ${officer.name}(${officer.id})`;

    if (seen.has(officer.id)) problems.push(`${where}: IDが重複している`);
    seen.add(officer.id);

    if (!ROLES[officer.roleId]) problems.push(`${where}: 未定義の役柄 ${officer.roleId}`);

    if (officer.born !== undefined && officer.born > officer.died) {
      problems.push(`${where}: 生年(${officer.born}) が没年(${officer.died}) より後`);
    }

    const list = allegianceOf(officer);
    if (list.length === 0) problems.push(`${where}: 所属が空`);

    for (const a of list) {
      const faction = FACTIONS[a.factionId];
      if (!faction) {
        problems.push(`${where}: 未定義の勢力 ${a.factionId}`);
        continue;
      }
      if (a.from < faction.from || (faction.to !== undefined && a.from > faction.to)) {
        problems.push(
          `${where}: ${a.from}年に ${faction.name}(${faction.from}〜${faction.to ?? '—'}) には所属できない`,
        );
      }
      if (a.rankId && !RANKS[a.rankId]) problems.push(`${where}: 未定義の地位 ${a.rankId}`);
    }

    // 名指しした場面が年表に無いと、人物伝がその一行を静かに落とす
    for (const id of officer.events ?? []) {
      if (!EVENTS[id]) problems.push(`${where}: 語られる場面 ${id} が年表に無い`);
    }

    // 出典の筋が通っているか。ここが崩れると人物伝が嘘をつく。
    const source = officer.attribution;
    const invented = source ? !isHistorical(source.work, source.standing) : false;
    if (invented && !officer.fictional) {
      problems.push(`${where}: 正史にいない人物なのに fictional が立っていない`);
    }
    if (officer.fictional && !source) {
      problems.push(`${where}: fictional なのに、どの書物が世に出した人物か書いていない`);
    }
    for (const entry of officer.life ?? []) {
      const a = entry.attribution;
      if (!SOURCES[a.work]) problems.push(`${where}: 未定義の出典 ${a.work}`);
      if (entry.year < 100 || entry.year > 300) {
        problems.push(`${where}: 逸話の年 ${entry.year} が年表の外`);
      }
      // 演義の人物に正史の逸話は付けられない
      if (invented && isHistorical(a.work, a.standing)) {
        problems.push(`${where}: 正史にいない人物に、正史由来の逸話「${entry.text}」が付いている`);
      }
      // 史実と違うと言うなら、正史のほうも書く（勉強の要はそこにある）
      if (a.standing === 'invention' && !a.insteadTruly && !invented) {
        problems.push(`${where}: 創作とされる「${entry.text}」に、正史ではどうだったかが無い`);
      }
    }

    const fate = officer.fate;
    if (fate) {
      if (!FATE_ARCHETYPES[fate.kind]) problems.push(`${where}: 未定義の運命の型 ${fate.kind}`);
      if (fate.at && !EVENTS[fate.at]) {
        // 年表がまだ薄い段階では普通に起きるので、注意どまりにしておく
        problems.push(`${where}: 運命の舞台 ${fate.at} が年表に無い（未実装なら無視してよい）`);
      }
      if (fate.year !== officer.died) {
        problems.push(`${where}: 運命の年(${fate.year}) と没年(${officer.died}) が食い違う`);
      }
      for (const [key, value] of Object.entries(officer.stats ?? {})) {
        if (value < 1 || value > 100) problems.push(`${where}: ${key} が範囲外 (${value})`);
      }
    }
  }

  for (const event of ALL_EVENTS) {
    const where = `事件 ${event.name}(${event.id})`;
    for (const factionId of event.factions) {
      if (!FACTIONS[factionId]) problems.push(`${where}: 未定義の勢力 ${factionId}`);
    }
    if (event.scenes.length === 0) problems.push(`${where}: 場面がひとつも無い`);
    problems.push(...checkAftermath(event.aftermath, where, event.year));
    if (event.attribution) {
      const a = event.attribution;
      if (!SOURCES[a.work]) problems.push(`${where}: 未定義の出典 ${a.work}`);
      if (a.standing !== 'record' && !a.insteadTruly) {
        problems.push(`${where}: ${a.standing} とするなら、正史ではどうだったかを書く`);
      }
    }

    for (const scene of event.scenes) {
      if (scene.choices.length === 0) problems.push(`${where}/${scene.id}: 選択肢が無い`);
      for (const choice of scene.choices) {
        for (const id of choice.effect.battle?.enemies ?? []) {
          // 敵は武将IDか役柄IDのどちらでもよい
          if (!OFFICERS[id] && !ROLES[id]) {
            problems.push(`${where}/${scene.id}: 敵 ${id} が武将にも役柄にも無い`);
          }
        }
        const join = choice.effect.joinFaction;
        if (join && !FACTIONS[join]) problems.push(`${where}/${scene.id}: 未定義の勢力 ${join}`);
        problems.push(
          ...checkAftermath(choice.effect.aftermath, `${where}/${scene.id}`, event.year),
        );
      }
    }
  }

  problems.push(...validateControl());
  problems.push(...validateBandits());

  return problems;
}

/**
 * 世界に残す痕跡の点検。
 * 存在しない城市や武将を書くと、静かに何も起きないので気づけない。
 */
function checkAftermath(after: Aftermath | undefined, where: string, year: number): string[] {
  if (!after) return [];
  const problems: string[] = [];

  for (const id of [...(after.spares ?? []), ...(after.slays ?? [])]) {
    if (!OFFICERS[id]) problems.push(`${where}: 痕跡に未登録の武将 ${id}`);
  }
  for (const id of after.spares ?? []) {
    const who = OFFICERS[id];
    // その年に死なない者を「助ける」と書いても、何も変わらない
    if (who && who.died !== year) {
      problems.push(`${where}: ${who.name}は${year}年に没しない（没年 ${who.died}）ので助けようがない`);
    }
  }
  for (const { city, faction } of after.seize ?? []) {
    if (!CITY_CONTROL[city]) problems.push(`${where}: 痕跡に未登録の城市 ${city}`);
    const def = FACTIONS[faction];
    if (!def) {
      problems.push(`${where}: 痕跡に未定義の勢力 ${faction}`);
      continue;
    }
    if (year < def.from || (def.to !== undefined && year > def.to)) {
      problems.push(
        `${where}: ${year}年に ${def.name}(${def.from}〜${def.to ?? '—'}) は城を取れない`,
      );
    }
  }
  return problems;
}

/**
 * 回避条件が「年表から本当に満たせるか」の監査。
 *
 * 条件には「Xをする」型と「Xをしない」型があるので、
 *   ・何もしていない状態
 *   ・出世も登用もしたが、余計なことはしていない状態
 *   ・年表のあらゆるフラグが立った状態
 * の3つで試し、どれでも満たせないものだけを本当の行き止まりとして報告する。
 * 真ん中がないと「4人集めて、かつ無理をしない」のような条件を取りこぼす。
 */
export function auditEscapes(): string[] {
  const everyFlag: Record<string, boolean> = {};
  for (const event of ALL_EVENTS) {
    for (const scene of event.scenes) {
      for (const choice of scene.choices) {
        Object.assign(everyFlag, choice.effect.flags ?? {});
      }
    }
  }

  const blank: Chronicle = blankChronicle({ year: 0 });
  /** 立場は上がっているが、余計なフラグは立てていない状態。 */
  const grown: Chronicle = {
    ...blank, year: 9999, rankId: 'general',
    renown: 9999, virtueDelta: 100, troops: 9999, gold: 9999,
    roster: ['a', 'b', 'c', 'd'],
  };
  const maxed: Chronicle = { ...grown, flags: everyFlag };

  const dead: string[] = [];
  for (const who of ALL_OFFICERS) {
    for (const cond of escapeConditions(who)) {
      const passes = (c: Chronicle) => {
        try {
          return cond.test(c);
        } catch {
          return false;
        }
      };
      if (!passes(blank) && !passes(grown) && !passes(maxed)) {
        dead.push(`${who.name}(${who.id}): 「${cond.label}」は年表のどこからも満たせない`);
      }
    }
  }
  return dead;
}

/** 集計。データがどれだけ育ったかを一目で見るため。 */
export function chronicleStats() {
  const byRole = new Map<string, number>();
  for (const o of ALL_OFFICERS) byRole.set(o.roleId, (byRole.get(o.roleId) ?? 0) + 1);
  return {
    officers: ALL_OFFICERS.length,
    withCustomStats: ALL_OFFICERS.filter((o) => o.stats).length,
    withOwnEscape: ALL_OFFICERS.filter((o) => o.fate?.escape?.length).length,
    events: ALL_EVENTS.length,
    factions: Object.keys(FACTIONS).length,
    roles: Object.keys(ROLES).length,
    fateKinds: Object.keys(FATE_ARCHETYPES).length,
    byRole: Object.fromEntries(byRole),
  };
}
