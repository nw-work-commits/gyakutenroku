/**
 * 列伝の生成。
 *
 * エンディングを武将ごとに書かないための仕掛け。やったこと（Deed）を年順に並べ、
 * 史実と食い違った箇所だけ「然れども」で立てる。千人ぶんの結末がここから出る。
 */

import { currentAbilities, describe } from './abilities';
import { reachLabel } from './data/ranks';
import { FATE_ARCHETYPES, OFFICERS } from './registry';
import { ensureWorld, stateOfTheRealm } from './systems/world';
import type { Chronicle, Officer } from './types';

/** 中国式の年号表記まではやらず、西暦で通す（あとで足せる）。 */
function yearLabel(year: number): string {
  return `${year}年`;
}

export interface Biography {
  title: string;
  lines: string[];
  /** 史実からどれだけ外れたか。0 なら史実どおり。 */
  divergence: number;
}

export function writeBiography(officer: Officer, c: Chronicle): Biography {
  const lines: string[] = [];
  const abilities = currentAbilities(officer, c.virtueDelta);

  // 冒頭：人物の紹介
  const who = officer.courtesy ? `${officer.name}、字は${officer.courtesy}。` : `${officer.name}。`;
  lines.push(who + (officer.epithet ? `世に「${officer.epithet}」と称さる。` : ''));
  lines.push(`武を以て${describe(abilities.war)}、智を以て${describe(abilities.intel)}。`);
  lines.push('');

  // 本文：やったこと
  let diverged = 0;
  for (const deed of c.deeds) {
    if (deed.diverged) {
      diverged++;
      lines.push(`　${yearLabel(deed.year)}、${deed.text}。**然れども、史書にこの記述なし。**`);
    } else {
      lines.push(`　${yearLabel(deed.year)}、${deed.text}。`);
    }
  }
  lines.push('');

  // 結び：運命をどうしたか
  const fate = officer.fate;
  if (!fate) {
    lines.push(`　${officer.name}の名は、正史に見えず。`);
  } else if (c.survived) {
    const archetype = FATE_ARCHETYPES[fate.kind];
    lines.push(`　史に曰く、${yearLabel(fate.year)}、${fate.record ?? archetype?.name ?? '没す'}。`);
    lines.push('');
    lines.push(`　**然れども、その者はこの年を越えて生きた。**`);
    if (c.year > fate.year) {
      lines.push(`　${yearLabel(c.year)}に至るまで、なお世にあり。`);
    }
  } else if (!c.alive) {
    lines.push(`　${yearLabel(fate.year)}、${fate.record ?? '没す'}。`);
    lines.push('');
    lines.push('　—— 史書のとおりであった。');
  } else {
    lines.push(`　${yearLabel(fate.year)}、その日はまだ来ていない。`);
  }

  // 世界のほう：この者がいなくても進んだ天下と、この者のせいで狂った史書
  lines.push('');
  const world = ensureWorld(c);
  lines.push(`　この頃、${stateOfTheRealm(world, c.year)}。`);

  const saved = world.spared.filter((id) => id !== officer.id).map((id) => OFFICERS[id]?.name);
  const savedNames = saved.filter((name): name is string => Boolean(name));
  if (savedNames.length > 0) {
    diverged += savedNames.length;
    lines.push(
      `　**${savedNames.slice(0, 4).join('・')}は、この者のゆえに史書より外れて生きた。**`,
    );
  }

  lines.push('');
  lines.push(`　到達　${reachLabel(c.rankId, c.renown)}`);
  lines.push(`　名声　${c.renown}`);
  if (c.roster.length > 0) lines.push(`　従いし者　${c.roster.length}人`);

  return {
    title: `${officer.name}伝`,
    lines,
    divergence: diverged,
  };
}

/** 運命の日までの予兆。画面の隅に出し続ける想定。 */
export function omenFor(officer: Officer, c: Chronicle): string | null {
  const fate = officer.fate;
  if (!fate || c.survived) return null;
  const archetype = FATE_ARCHETYPES[fate.kind];
  if (!archetype) return null;
  return archetype.omen(fate, officer, fate.year - c.year);
}

/** 回避条件の一覧。固有指定が無ければ型の既定を使う。 */
export function escapeConditions(officer: Officer) {
  const fate = officer.fate;
  if (!fate) return [];
  if (fate.escape && fate.escape.length > 0) return fate.escape;
  return FATE_ARCHETYPES[fate.kind]?.defaultEscape(fate, officer) ?? [];
}

/** いま何個満たしているか。すべて満たせば運命を越える。 */
export function escapeProgress(officer: Officer, c: Chronicle) {
  const conditions = escapeConditions(officer);
  const met = conditions.filter((cond) => cond.test(c));
  return { conditions, met: met.map((m) => m.id), all: conditions.length > 0 && met.length === conditions.length };
}
