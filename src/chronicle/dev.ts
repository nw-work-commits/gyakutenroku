/**
 * データ骨組みを手で確かめるための入口。ゲーム本体にはまだ繋がっていない。
 * コンソールから `(await __rpg.chronicle()).report()` などで叩く。
 */

import { baseAbilities, currentAbilities } from './abilities';
import { escapeConditions, omenFor, writeBiography } from './biography';
import { lifeOf } from './lore';
import { allegianceOf, officer, playableAt, searchOfficers } from './registry';
import { STARTING_GOLD, maxTroops, morale, recruitChance, spoilsOf } from './rules';
import { LAST_YEAR, blankChronicle, rankName, tryPromote } from './runner';
import { ROLES } from './data/roles';
import { UNITS } from './data/units';
import { campsAt, foesOf, markCleared } from './systems/bandits';
import { PROVINCE_BY_ID } from './data/world/overworld';
import { advanceWorld, deathYearOf, powersAt, stateOfTheRealm } from './systems/world';
import {
  CAPTIVE_FATE_TEXT,
  DuelBook,
  captureChance,
  decideCaptiveFate,
  makeDuelSide,
  renownForDuel,
  resolveDuel,
  runBouts,
  startDuel,
  willAcceptDuel,
} from './systems/duel';
import type { Side } from './systems/war';
import { computeDamage, formRegiments } from './systems/war';
import type { Chronicle, Officer } from './types';
import { auditEscapes, chronicleStats, validateChronicleData } from './validate';

export { auditEscapes, chronicleStats, validateChronicleData, searchOfficers, playableAt };

/** その武将で始めたときの初期状態。 */
export function startAs(id: string, year?: number): Chronicle {
  const who = officer(id);
  const first = allegianceOf(who)[0]!;
  return blankChronicle({
    officerId: who.id,
    year: year ?? first.from,
    factionId: first.factionId,
    rankId: first.rankId ?? 'commoner',
  });
}

/** 武将1人の見え方をまとめて確認する。 */
export function inspect(id: string) {
  const who = officer(id);
  const c = startAs(id);
  return {
    name: who.name,
    role: who.roleId,
    abilities: baseAbilities(who),
    /** データに書いていない値は自動生成されていることの確認 */
    generated: !who.stats,
    maxTroops: maxTroops(who, c),
    fate: who.fate ? `${who.fate.year}年 ${who.fate.kind}` : 'なし',
    omen: omenFor(who, c),
    escape: escapeConditions(who).map((e) => e.label),
  };
}

/** 列伝の生成を確かめる。史実どおりの道と、外れた道を並べて見る。 */
export function sampleBiography(id: string, diverge = true): string {
  const who: Officer = officer(id);
  const c = startAs(id);
  const fateYear = who.fate?.year ?? c.year + 10;

  c.deeds.push({ year: c.year, text: '義兵に応じ、黄巾討伐に加わる' });
  c.deeds.push({ year: c.year + 3, text: '一軍を率いて城を守る' });
  if (diverge) {
    c.deeds.push({ year: fateYear - 1, text: '仇敵と和を結ぶ', diverged: true });
    c.survived = true;
    c.year = fateYear + 6;
    c.renown = 640;
    c.rankId = 'general';
  } else {
    c.year = fateYear;
    c.alive = false;
    c.renown = 380;
  }
  c.roster = ['zhouchang'];

  const bio = writeBiography(who, c);
  return [bio.title, '', ...bio.lines].join('\n');
}

/** 登用の効きぐあいを確認する（劉備の徳100で、呂布はどれくらい落ちないか）。 */
export function recruitTable(factionVirtue: number, ids: string[]) {
  return ids.map((id) => {
    const who = officer(id);
    const ab = currentAbilities(who, 0);
    return {
      name: who.name,
      virtue: ab.virtue,
      chance: `${Math.round(recruitChance(factionVirtue, ab, 300) * 100)}%`,
    };
  });
}

/** 一騎討ちを何度も回して、勝率と「捕らえるか死か」の分かれ方を確かめる。 */
export function duelTest(aId: string, bId: string, times = 400) {
  const a = officer(aId);
  const b = officer(bId);
  let aWins = 0;
  let captures = 0;
  let kills = 0;
  let draws = 0;
  let bouts = 0;
  const deaths: Record<string, number> = { [a.name]: 0, [b.name]: 0 };

  for (let i = 0; i < times; i++) {
    const result = resolveDuel(makeDuelSide(a), makeDuelSide(b));
    if (result.winner === 'a') aWins++;
    bouts += result.bouts;
    if (result.outcome === 'draw') draws++;
    else if (result.outcome === 'capture') captures++;
    else {
      kills++;
      deaths[(result.winner === 'a' ? b : a).name]!++;
    }
  }

  const abA = currentAbilities(a, 0);
  const abB = currentAbilities(b, 0);
  const pct = (n: number) => `${Math.round((n / times) * 100)}%`;
  return {
    組み合わせ: `${a.name}(武${abA.war}) vs ${b.name}(武${abB.war})`,
    武力差: Math.abs(abA.war - abB.war),
    [`${a.name}の勝率`]: pct(aWins),
    勝負つかず: pct(draws),
    捕縛: pct(captures),
    死亡: pct(kills),
    平均合数: Math.round(bouts / times),
    誰が死んだか: deaths,
  };
}

/** 捕縛率の表。設計どおり「差が開くほど捕らえられる」か。 */
export function captureTable() {
  return [0, 5, 10, 15, 20, 25, 30, 40].map((gap) => ({
    武力差: gap,
    捕縛率: `${Math.round(captureChance(gap) * 100)}%`,
  }));
}

/** 挑まれたとき、誰が受けて誰が断るか。 */
export function duelAcceptanceTable(challengerId: string, defenderIds: string[]) {
  const challenger = currentAbilities(officer(challengerId), 0);
  return defenderIds.map((id) => {
    const who = officer(id);
    const ab = currentAbilities(who, 0);
    let accepted = 0;
    for (let i = 0; i < 400; i++) if (willAcceptDuel(ab, challenger)) accepted++;
    return {
      挑まれる側: who.name,
      武力: ab.war,
      知力: ab.intel,
      応じる確率: `${Math.round((accepted / 400) * 100)}%`,
    };
  });
}

/** 捕虜の扱われ方。誰に捕まると生き延びられるか。 */
export function captiveTable(captiveId: string, captorIds: string[]) {
  const captive = currentAbilities(officer(captiveId), 0);
  return captorIds.map((id) => {
    const captor = officer(id);
    const ab = currentAbilities(captor, 0);
    return {
      捕らえた者: captor.name,
      徳: ab.virtue,
      処遇: CAPTIVE_FATE_TEXT[decideCaptiveFate(ab, captive)],
    };
  });
}

/**
 * 三英戦呂布。ひとりでは勝てない相手に、代わる代わる挑めば勝てるか。
 * 各挑戦者は「30合まで打ち合って、決まらなければ退く」を繰り返す。
 */
export function threeAgainstOne(bossId = 'lvbu', challengerIds = ['zhangfei', 'guanyu', 'liubei'], times = 300) {
  const boss = officer(bossId);
  let bossFell = 0;
  let challengerLosses = 0;
  const log: string[] = [];

  for (let t = 0; t < times; t++) {
    const book = new DuelBook();
    const bossSide = book.side(boss);
    let decided = false;

    for (const id of challengerIds) {
      if (decided) break;
      const who = officer(id);
      // 挑戦者は毎回新手（疲れていない）。呂布だけが消耗を持ち越す。
      const state = startDuel(makeDuelSide(who), bossSide);
      runBouts(state, 30);
      if (t === 0) {
        log.push(
          `${who.name}が挑む → ${state.result ? outcomeText(state.result, who.name, boss.name) : '30合、決まらず退く'}` +
            `（呂布の消耗 ${Math.round(book.fatigue(boss.id) * 100)}%）`,
        );
      }
      if (state.result && state.result.outcome !== 'draw') {
        decided = true;
        if (state.result.winner === 'a') bossFell++;
        else challengerLosses++;
      }
    }
  }

  return {
    相手: boss.name,
    挑んだ順: challengerIds.map((id) => officer(id).name),
    [`${boss.name}が倒れた`]: `${Math.round((bossFell / times) * 100)}%`,
    挑戦者が倒れた: `${Math.round((challengerLosses / times) * 100)}%`,
    誰も決められず: `${Math.round(((times - bossFell - challengerLosses) / times) * 100)}%`,
    一例: log,
  };
}

function outcomeText(result: { outcome: string; winner: string | null }, aName: string, bName: string): string {
  if (result.outcome === 'draw') return '勝負つかず';
  const winner = result.winner === 'a' ? aName : bName;
  const loser = result.winner === 'a' ? bName : aName;
  return `${winner}が${loser}を${result.outcome === 'capture' ? '捕らえた' : '討ち取った'}`;
}

/** 名声の見返り表。誰に挑むのが得か。 */
export function duelRewardTable(selfId: string, opponentIds: string[]) {
  const self = currentAbilities(officer(selfId), 0);
  return opponentIds.map((id) => {
    const opp = currentAbilities(officer(id), 0);
    return {
      相手: officer(id).name,
      武力差: opp.war - self.war,
      勝てば: renownForDuel('capture', true, self, opp),
      引き分けても: renownForDuel('draw', false, self, opp),
    };
  });
}

/** 兵科の相性表。1000の兵で殴り合ったときの一撃あたりの損害。 */
export function matchupTable(attackerId = 'guanyu', defenderId = 'guanyu') {
  const atk = makeSide(attackerId, 100);
  const def = makeSide(defenderId, 100);
  const ids = ['infantry', 'cavalry', 'archer', 'rattan'];
  return ids.map((a) => {
    const row: Record<string, string | number> = { 攻: UNITS[a]!.name };
    for (const d of ids) {
      const ar = formRegiments(null, 1000, [{ unitId: a, share: 1 }])[0]!;
      const dr = formRegiments(null, 1000, [{ unitId: d, share: 1 }])[0]!;
      const results = Array.from({ length: 200 }, () => computeDamage(atk, ar, def, dr).amount);
      row[UNITS[d]!.name] = Math.round(results.reduce((s, v) => s + v, 0) / results.length);
    }
    return row;
  });
}

/** 藤甲兵に火計を入れるとどうなるか。 */
export function rattanTest() {
  const atk = makeSide('zhugeliang', 100);
  const def = makeSide('menghuo', 100);
  const attacker = formRegiments(null, 1000, [{ unitId: 'infantry', share: 1 }])[0]!;
  const rattan = formRegiments(null, 1000, [{ unitId: 'rattan', share: 1 }])[0]!;
  const infantry = formRegiments(null, 1000, [{ unitId: 'infantry', share: 1 }])[0]!;

  const avg = (fn: () => number) =>
    Math.round(Array.from({ length: 200 }, fn).reduce((s, v) => s + v, 0) / 200);

  return {
    藤甲兵に白兵: avg(() => computeDamage(atk, attacker, def, rattan, { kind: 'melee' }).amount),
    藤甲兵に矢: avg(() => computeDamage(atk, attacker, def, rattan, { kind: 'arrow' }).amount),
    藤甲兵に火計: avg(
      () => computeDamage(atk, attacker, def, rattan, { kind: 'fire', power: 1.0 }).amount,
    ),
    ふつうの歩兵に火計: avg(
      () => computeDamage(atk, attacker, def, infantry, { kind: 'fire', power: 1.0 }).amount,
    ),
  };
}

function makeSide(officerId: string, morale: number): Side {
  const who = officer(officerId);
  return {
    commander: currentAbilities(who, 0),
    commanderName: who.name,
    regiments: [],
    morale,
  };
}

/**
 * 誰も手を出さなかったときの世界。
 * 184年から最後まで放っておくと、史書のとおりに天下が動いていくかを見る。
 */
export function worldRun(officerId = 'liubei', toYear = LAST_YEAR) {
  const c = startAs(officerId, 184);
  const news = advanceWorld(c, toYear);
  const snapshot = (year: number) =>
    powersAt(c.world!, year)
      .filter((p) => p.factionId !== 'ronin')
      .map((p) => `${p.name}${p.cities.length}`)
      .join(' / ');

  return {
    報せの数: news.length,
    城の主が動いた回数: news.filter((n) => n.kind === 'seize').length,
    訃報: news.filter((n) => n.kind === 'death').length,
    滅んだ勢力: news.filter((n) => n.kind === 'ruin').map((n) => n.text),
    版図: {
      '190年': snapshot(190),
      '200年': snapshot(200),
      '210年': snapshot(210),
      '225年': snapshot(225),
      '250年': snapshot(250),
      '265年': snapshot(265),
    },
    結び: stateOfTheRealm(c.world!, toYear),
  };
}

/** 白門楼で呂布を逃がすと、世界はどう変わるか。 */
export function spareTest() {
  const before = startAs('liubei', 184);
  advanceWorld(before, 220);

  const after = startAs('liubei', 184);
  after.deeds.push({ year: 199, eventId: 'ev_baimenlou', text: '呂布の助命を勧める', diverged: true });
  after.world!.spared.push('lvbu');
  advanceWorld(after, 220);

  const lvbu = officer('lvbu');
  return {
    史実: deathYearOf(before.world!, lvbu),
    助命したとき: deathYearOf(after.world!, lvbu),
    白門楼の扱い: after.world!.news.filter((n) => n.eventId === 'ev_baimenlou').map((n) => n.text),
  };
}

/**
 * その年、天下のどこに賊が構えているか。
 * 「布衣で始めて、最初に討てる相手が近くにいるか」を見るための表。
 */
export function banditMap(year = 184, officerId = 'liubei') {
  const c = startAs(officerId, year);
  c.year = year;
  return campsAt(c).map((camp) => {
    const spoils = spoilsOf(camp.strength);
    return {
      州: PROVINCE_BY_ID[camp.provinceId]?.name ?? camp.provinceId,
      砦: camp.name,
      手強さ: camp.strength,
      賊: foesOf(camp).troops,
      実入り: `金${spoils.gold} 兵${spoils.captives} 名声${spoils.renown}`,
    };
  });
}

/**
 * 遊びの輪が閉じているかの検算。
 * 支度金だけで始めて、徴兵 → 討伐 → 徴兵 と回したとき、
 * 手勢と資金が伸びていくか。減っていくなら討伐の実入りが足りない。
 */
export function economyRun(officerId = 'liubei', rounds = 6) {
  const who = officer(officerId);
  const c = startAs(officerId, 184);
  c.gold = STARTING_GOLD;
  const log: Record<string, string | number>[] = [];

  for (let i = 1; i <= rounds; i++) {
    // 兵舎：出せるだけ出す
    const room = Math.max(0, maxTroops(who, c) - c.troops);
    const levied = Math.min(room, Math.floor(c.gold / 2));
    c.gold -= levied * 2;
    c.troops += levied;

    // その手勢で挑める、いちばん手強い砦を選ぶ。
    // 勝てるかどうかは勘で決めず、実際の戦の式を回して確かめる。
    const candidates = campsAt(c).sort((a, b) => b.strength - a.strength);
    let target: (typeof candidates)[number] | null = null;
    let survivors = 0;
    for (const camp of candidates) {
      const left = raidOutcome(who, c, camp);
      if (left > 0) {
        target = camp;
        survivors = left;
        break;
      }
    }
    if (!target) {
      const weakest = Math.min(...candidates.map((camp) => foesOf(camp).troops));
      log.push({ 回: i, 兵: c.troops, 金: c.gold, 討てる砦: `なし（最弱でも賊${weakest}）` });
      break;
    }

    const strength = target.strength;
    const spoils = spoilsOf(strength);
    markCleared(c, target); // 同じ砦を二度討たないように
    c.troops = Math.min(maxTroops(who, c), survivors + spoils.captives);
    c.gold += spoils.gold;
    c.renown += spoils.renown;
    tryPromote(c);

    log.push({
      回: i,
      徴兵: levied,
      討った砦: `${target.name}(手強さ${strength})`,
      兵: c.troops,
      金: c.gold,
      名声: c.renown,
      位: rankName(c),
    });
  }
  return log;
}

/**
 * その砦に挑んだら、兵はいくつ残るか。0なら勝てない。
 * 突撃だけを撃ち合わせる乱暴な見立てだが、係数は本物なので目安になる。
 */
function raidOutcome(who: Officer, c: Chronicle, camp: ReturnType<typeof campsAt>[number]): number {
  const { enemies, troops } = foesOf(camp);
  const me = makeSide(who.id, morale([currentAbilities(who, c.virtueDelta).virtue]));
  me.regiments = formRegiments(who.id, c.troops, [{ unitId: 'infantry', share: 1 }]);

  const foeRole = ROLES[enemies[0]!];
  const foe: Side = {
    commander: foeRole
      ? {
          war: (foeRole.range.war[0] + foeRole.range.war[1]) / 2,
          intel: (foeRole.range.intel[0] + foeRole.range.intel[1]) / 2,
          lead: (foeRole.range.lead[0] + foeRole.range.lead[1]) / 2,
          mobility: 40,
          virtue: 25,
        }
      : { war: 40, intel: 30, lead: 25, mobility: 40, virtue: 25 },
    commanderName: camp.name,
    regiments: formRegiments(null, troops, [{ unitId: 'infantry', share: 1 }]),
    morale: 70,
  };

  for (let turn = 0; turn < 40; turn++) {
    const mine = me.regiments[0];
    const theirs = foe.regiments[0];
    if (!mine || mine.troops <= 0) return 0;
    if (!theirs || theirs.troops <= 0) return mine.troops;
    theirs.troops -= computeDamage(me, mine, foe, theirs).amount;
    if (theirs.troops <= 0) return mine.troops;
    mine.troops -= computeDamage(foe, theirs, me, mine).amount;
  }
  return me.regiments[0]?.troops ?? 0;
}

/** 人物伝を文字にして読む。事典に出るのと同じ中身。 */
export function readLife(id: string): string {
  const life = lifeOf(officer(id));
  const out: string[] = [];
  out.push(`${life.name}　${life.courtesy}　${life.span}`);
  out.push('伝わりの厚さ ' + '●'.repeat(life.attestation) + '○'.repeat(5 - life.attestation));
  out.push('');
  out.push(...life.opening);
  if (life.years.length > 0) {
    out.push('', '[年譜]');
    for (const y of life.years) {
      const mark = y.certainty === 'recorded' ? '確' : y.certainty === 'inferred' ? '推' : '己';
      out.push(`  ${y.year}年 (${mark}) ${y.text}`);
      if (y.note) out.push(`           ${y.note}`);
    }
  }
  out.push('', '[最期]', ...life.closing.map((l) => '  ' + l));
  if (life.silences.length > 0) {
    out.push('', '[史書が伝えないこと]', ...life.silences.map((l) => '  ・' + l));
  }
  return out.join('\n');
}

/** 全体の健康診断。 */
export function report() {
  return {
    stats: chronicleStats(),
    problems: validateChronicleData(),
    unreachable: auditEscapes(),
    morale: {
      劉備あり: morale([100]),
      呂布のみ: morale([12]),
    },
  };
}
