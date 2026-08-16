/**
 * 年送りの仕組み。
 *
 * 「誰がどの事件に居合わせるか」を表で持たないのがこの設計の要。
 * 所属している勢力と、その年に起きる事件を突き合わせて、実行時に決める。
 */

import { RANKS, RANK_ORDER, nextRank } from './data/ranks';
import { placeOf } from './data/world/event-places';
import { homeCityOf } from './data/world/homes';
import { provinceAt } from './data/world/overworld';
import { ageAt } from './abilities';
import { chance } from '../engine/rng';
import { escapeProgress } from './biography';
import { reactToDeed } from './systems/hearts';
import { ALL_OFFICERS, eventsIn, factionAt } from './registry';
import { maxTroops, recoverTroops, renownForRank } from './rules';
import {
  advanceWorld,
  aliveIn,
  applyAftermath,
  blankWorld,
  ensureWorld,
  record,
  slay,
  spare,
} from './systems/world';
import type {
  ChoiceEffect,
  Chronicle,
  EventScene,
  HistoryEvent,
  Officer,
  WorldNews,
} from './types';

/** 年表の端。ここを越えたら物語は終わり。 */
export const LAST_YEAR = 280;

/** まっさらな記録。検証や試算で「まだ何もしていない状態」を作るのに使う。 */
export function blankChronicle(overrides: Partial<Chronicle> = {}): Chronicle {
  const c: Chronicle = {
    officerId: '',
    year: 184,
    month: 1,
    day: 1,
    x: 0,
    y: 0,
    where: 'world',
    dir: 'down',
    factionId: 'ronin',
    rankId: 'commoner',
    renown: 0,
    virtueDelta: 0,
    troops: 0,
    gold: 0,
    roster: [],
    deeds: [],
    flags: {},
    escaped: [],
    survived: false,
    alive: true,
    ...overrides,
  };
  // 世界は「始めた年の前年までは史実どおり」から動き出す
  if (!c.world) c.world = blankWorld(c.year);
  return c;
}

/**
 * その年に、その立場で、**その場所にいるから**居合わせられる事件。
 *
 * 表で持たずに実行時に決めるのがこの設計の要。
 * 荊州にいなければ赤壁には出られないし、出られなければ史実どおりに終わる。
 */
export function attendable(c: Chronicle): HistoryEvent[] {
  const here = provinceAt(c.x, c.y)?.id ?? null;
  return eventsIn(c.year).filter((event) => {
    if (!event.factions.includes(c.factionId)) return false;
    const place = placeOf(event.id);
    // 場所を持たない事件は天下一斉の出来事なので、どこにいても関われる
    if (place !== null && place !== here) return false;
    // 見られる場面がひとつも無い事件は、そもそも出席できない
    return sceneFor(event, c) !== null;
  });
}

/** その年に起きる事件と、その場所。行き先を知らせるために使う。 */
export function eventsThisYear(c: Chronicle): { event: HistoryEvent; place: string | null }[] {
  return eventsIn(c.year)
    .filter((event) => !isDone(c, event.id))
    .map((event) => ({ event, place: placeOf(event.id) }));
}

/** 立場に応じた場面をひとつ選ぶ。上から順に、最初に条件を満たしたもの。 */
export function sceneFor(event: HistoryEvent, c: Chronicle): EventScene | null {
  for (const scene of event.scenes) {
    if (!scene.when || scene.when(c)) return scene;
  }
  return null;
}

/** すでに片づけた事件か。 */
export function isDone(c: Chronicle, eventId: string): boolean {
  return c.flags[`done:${eventId}`] === true;
}

export function markDone(c: Chronicle, eventId: string): void {
  c.flags[`done:${eventId}`] = true;
}

/** まだ手をつけていない、今年の事件。 */
export function pending(c: Chronicle): HistoryEvent[] {
  return attendable(c).filter((e) => !isDone(c, e.id));
}

// ---------------------------------------------------------------- 選択の適用

export interface EffectReport {
  lines: string[];
  battle?: { enemies: string[]; escapable: boolean };
}

/** 選択肢の効果を記録に反映する。戦闘が要るなら呼び出し側に返す。 */
/**
 * 徳の動いた行いに、配下が反応する。
 * 事件の選択も、戦場の振る舞いも、すべてここを通す。
 */
export function stirRetinue(c: Chronicle, virtueDelta: number, what: string): string[] {
  return reactToDeed(c, virtueDelta, what).map((r) => r.line);
}

export function applyEffect(
  c: Chronicle,
  who: Officer,
  effect: ChoiceEffect,
  event: HistoryEvent,
  historical: boolean,
): EffectReport {
  const lines: string[] = [];

  c.deeds.push({
    year: c.year,
    eventId: event.id,
    text: effect.deed,
    // 史実どおりでない選択は、列伝で「然れども」と書かれる
    diverged: !historical,
  });

  if (effect.flags) Object.assign(c.flags, effect.flags);

  if (effect.renown) {
    c.renown = Math.max(0, c.renown + effect.renown);
    lines.push(`名声 ${effect.renown > 0 ? '+' : ''}${effect.renown}`);
  }
  if (effect.virtue) {
    c.virtueDelta += effect.virtue;
    lines.push(`徳 ${effect.virtue > 0 ? '+' : ''}${effect.virtue}`);
  }
  if (effect.gold) {
    c.gold = Math.max(0, c.gold + effect.gold);
    lines.push(`資金 ${effect.gold > 0 ? '+' : ''}${effect.gold}`);
  }
  if (effect.troops) {
    const before = c.troops;
    c.troops = Math.max(0, Math.min(maxTroops(who, c), c.troops + effect.troops));
    const diff = c.troops - before;
    if (diff !== 0) lines.push(`兵 ${diff > 0 ? '+' : ''}${diff}`);
  }
  if (effect.joinFaction && effect.joinFaction !== c.factionId) {
    c.factionId = effect.joinFaction;
    lines.push('所属が変わった');
  }

  // その場で世界に痕跡を残す。呂布を逃がしたなら、呂布はこの年を越えて生きる。
  const world = ensureWorld(c);
  applyAftermath(world, effect.aftermath, c.year, c.officerId);
  if (!historical) {
    // 史実を曲げたことは、その場で世に流れる。
    // 何が起きたかを書いてあればそれを、無ければやったことをそのまま。
    record(world, {
      year: c.year,
      eventId: event.id,
      kind: 'divergence',
      text: effect.aftermath?.news ?? effect.deed,
    });
  }

  markDone(c, event.id);

  return {
    lines,
    battle: effect.battle
      ? { enemies: effect.battle.enemies, escapable: effect.battle.escapable ?? true }
      : undefined,
  };
}

// ---------------------------------------------------------------- 年送り

export interface YearAdvance {
  /** 何年進んだか。事件の無い年は飛ばす。 */
  skipped: number;
  promoted: string | null;
  recovered: number;
  /** 年表の終わりに達した。 */
  finished: boolean;
  /** 待っているあいだに老いに追いつかれた。 */
  aged: boolean;
  /** そのあいだに世界の側で起きたこと。 */
  news: WorldNews[];
}

/**
 * 次に何かが起きる年まで進める。
 *
 * 止まる条件を「いまいる州で居合わせられる事件」にすると、
 * 益州で待っている者は荊州の事件を全部素通りして二十年を飛ばす。
 * それでは天下が進んでいく様子を見られないので、
 * **どこであれ史実の事件がある年**で止める。行くかどうかは本人が決めればよい。
 */
export function advanceYear(c: Chronicle, who: Officer): YearAdvance {
  let skipped = 0;
  let recovered = 0;

  do {
    c.year++;
    skipped++;
    // 散った兵は少しずつ戻る。統率が高いほど早い。
    const back = Math.min(recoverTroops(who, c), maxTroops(who, c) - c.troops);
    if (back > 0) {
      c.troops += back;
      recovered += back;
    }
    // 老いは一年ずつ来る。まとめて飛ばした年のぶんも、一年ずつ数える
    if (agedOut(c, who)) {
      c.alive = false;
      return { skipped, promoted: null, recovered, finished: false, aged: true, news: catchUpWorld(c) };
    }
    if (c.year > LAST_YEAR) {
      return { skipped, promoted: null, recovered, finished: true, aged: false, news: catchUpWorld(c) };
    }
    // 運命の年に来たら、事件が無くても止まる
    if (who.fate && c.year === who.fate.year) break;
  } while (eventsThisYear(c).length === 0 && skipped < 60);

  const news = catchUpWorld(c);
  return { skipped, promoted: tryPromote(c), recovered, finished: false, aged: false, news };
}

/**
 * 自分がいないあいだに、世界が進む。
 *
 * 今年ぶんは解かない。まだ本人が現場に駆けつけられるから、
 * 決着させてよいのは前の年までになる。
 */
export function catchUpWorld(c: Chronicle): WorldNews[] {
  return advanceWorld(c, c.year - 1);
}

/** 名声が足りていれば位が上がる。率いられる部隊も増える。 */
export function tryPromote(c: Chronicle): string | null {
  const next = nextRank(c.rankId);
  if (!next) return null;
  if (c.renown < renownForRank(RANKS[c.rankId]!.tier)) return null;
  c.rankId = next.id;
  return next.name;
}

/**
 * その城市にいる武将。
 *
 * 誰がどこにいるかを表で持たず、「その年に生きていて、その勢力の本拠がこの城」から出す。
 * 曹操は濮陽に、劉備は涿県に、勝手に立っていることになる。
 *
 * 生死は史実の没年ではなく**世界の側の帳簿**で見る。
 * 白門楼で逃がした呂布は、その後も下邳の町に立っている。
 */
export function residentsOf(c: Chronicle, cityId: string, exclude: string[] = []): Officer[] {
  const world = ensureWorld(c);
  return ALL_OFFICERS.filter((who) => {
    if (exclude.includes(who.id)) return false;
    if (!aliveIn(world, who, c.year)) return false;
    if (ageAt(who, c.year) < 14) return false; // 子どもは表に出ない
    return homeCityOf(factionAt(who, c.year)) === cityId;
  });
}

/** その地位で率いられる部隊の数。 */
export function regimentSlots(c: Chronicle): number {
  const tier = RANKS[c.rankId]?.tier ?? 0;
  if (tier >= 8) return 4;
  if (tier >= 5) return 3;
  if (tier >= 2) return 2;
  return 1;
}

// ---------------------------------------------------------------- 運命

export function fateDue(c: Chronicle, who: Officer): boolean {
  return !!who.fate && c.year >= who.fate.year && !c.survived && c.alive;
}

export interface FateOutcome {
  survived: boolean;
  met: string[];
  total: number;
}

/** 運命の日の判定。回避条件をすべて満たしていれば、史書から外れる。 */
export function resolveFate(c: Chronicle, who: Officer): FateOutcome {
  const progress = escapeProgress(who, c);
  const world = ensureWorld(c);
  c.escaped = progress.met;
  if (progress.all) {
    c.survived = true;
    // 世界の帳簿の上でも、この者は死んでいないことにする
    spare(world, c.officerId);
    return { survived: true, met: progress.met, total: progress.conditions.length };
  }
  c.alive = false;
  slay(world, c.officerId, c.year);
  return { survived: false, met: progress.met, total: progress.conditions.length };
}

/**
 * 老いによる死。
 *
 * 運命の日を越えた者に何も起きなければ、その者は永遠に歩き続けることになる。
 * 関羽が281年に享年121で健在、というのはさすがに世界のほうが壊れている。
 *
 * ただしここは**完全な創作**であることを断っておく。史書は、史書から外れた者の
 * 晩年を書いていない。書いていないものを埋めるのだから、せめて緩い坂にする。
 * 六十を過ぎたあたりから少しずつ、九十でおよそ半々。
 */
export function ageOutChance(age: number): number {
  if (age < 60) return 0;
  const t = (age - 60) / 45;
  return Math.min(0.85, t * t);
}

/** その年、老いに追いつかれたか。 */
export function agedOut(c: Chronicle, who: Officer): boolean {
  if (!c.alive) return false;
  const age = ageAt(who, c.year);
  if (age <= 0) return false;
  return chance(ageOutChance(age));
}

/** 到達した位の名前。 */
export function rankName(c: Chronicle): string {
  return RANKS[c.rankId]?.name ?? '布衣';
}

/** 次の位までの名声。 */
export function renownToNext(c: Chronicle): number | null {
  const tier = RANKS[c.rankId]?.tier ?? 0;
  if (tier >= RANK_ORDER.length - 1) return null;
  return Math.max(0, renownForRank(tier) - c.renown);
}
