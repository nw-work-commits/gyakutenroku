/**
 * データの自動収集。
 *
 * data/officers/ と data/timeline/ と data/fates/ にファイルを置くだけで登録される。
 * 索引ファイルを書き換える必要がないので、武将やイベントを足す作業が
 * 「1ファイル作る」「既存ファイルに1件足す」のどちらかだけで済む。
 */

import { birthYear } from './abilities';
import { FACTIONS } from './data/factions';
import { ALL_OFFICERS, OFFICERS } from './lookup';
import type { Allegiance, FateArchetype, HistoryEvent, Officer } from './types';

export { ALL_OFFICERS, OFFICERS, officerIdByName } from './lookup';

/** 各ファイルは HistoryEvent[] を default export する。 */
const timelineModules = import.meta.glob<{ default: HistoryEvent[] }>('./data/timeline/*.ts', {
  eager: true,
});

/** 各ファイルは FateArchetype を1つ default export する。 */
const fateModules = import.meta.glob<{ default: FateArchetype }>('./data/fates/*.ts', {
  eager: true,
});

export const ALL_EVENTS: HistoryEvent[] = Object.values(timelineModules)
  .flatMap((m) => m.default)
  .sort((a, b) => a.year - b.year);

export const EVENTS: Record<string, HistoryEvent> = Object.fromEntries(
  ALL_EVENTS.map((e) => [e.id, e]),
);

export const FATE_ARCHETYPES = Object.fromEntries(
  Object.values(fateModules).map((m) => [m.default.kind, m.default]),
) as Record<FateArchetype['kind'], FateArchetype>;

export function officer(id: string): Officer {
  const found = OFFICERS[id];
  if (!found) throw new Error(`未登録の武将: ${id}`);
  return found;
}

/**
 * 所属遍歴の正規化。
 * 文字列で書いたときは「その者が世に出た年」と「その勢力の成立年」の遅いほうを取る。
 * こうしないと、張角が140年に黄巾へ所属していることになってしまう。
 *
 * 「世に出た年」は元服の齢から当てる。生年をそのまま使うと王允が1歳で漢に仕え、
 * 勢力の成立年をそのまま使うと朱儁が紀元前206年から漢に仕えていることになる。
 * 遍歴を年つきで書いてある武将は、そちらが優先されるので影響を受けない。
 */
const COMING_OF_AGE = 15;

export function allegianceOf(who: Officer): Allegiance[] {
  if (typeof who.allegiance !== 'string') return who.allegiance;
  const faction = FACTIONS[who.allegiance];
  const grownUp = Math.min(birthYear(who) + COMING_OF_AGE, who.died);
  return [{ from: Math.max(grownUp, faction?.from ?? grownUp), factionId: who.allegiance }];
}

/** その時点で所属している勢力。 */
export function factionAt(who: Officer, year: number): string {
  const list = allegianceOf(who);
  let current = list[0]!.factionId;
  for (const entry of list) {
    if (entry.from <= year) current = entry.factionId;
  }
  return current;
}

export function historyEvent(id: string): HistoryEvent | undefined {
  return EVENTS[id];
}

/** その年に起きる出来事。 */
export function eventsIn(year: number): HistoryEvent[] {
  return ALL_EVENTS.filter((e) => e.year === year);
}

/** 名前・字での検索。武将選択画面のため。 */
export function searchOfficers(query: string): Officer[] {
  const q = query.trim();
  if (!q) return ALL_OFFICERS;
  return ALL_OFFICERS.filter(
    (o) => o.name.includes(q) || (o.courtesy ?? '').includes(q) || o.id.includes(q.toLowerCase()),
  );
}

/** その年に生きていて、選べる武将。 */
export function playableAt(year: number): Officer[] {
  return ALL_OFFICERS.filter((o) => (o.born ?? o.died - 20) <= year && o.died >= year);
}
