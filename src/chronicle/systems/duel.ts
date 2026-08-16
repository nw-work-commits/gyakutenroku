/**
 * 一騎討ち。
 *
 * 決着がついた場合は「捕らえる」か「死」のどちらかで、逃げ切りはない。
 * 捕らえられるかどうかは武力差で決まる ——
 * 圧倒していれば殺さずに済むが、互角なら必死になって斬ってしまう。
 * つまり **格上に挑むより、同格と斬り合うほうが死ぬ**。
 *
 * ただし本当の互角では、そもそも刃が通らない。
 * 「百余合に及んで勝負つかず」は演義の定番で、ここでもそう終わる。
 *
 * そして消耗は戦のあいだ回復しない。だから ——
 * ひとりでは絶対に勝てない相手でも、代わる代わる挑めば削り切れる。
 * 三英が呂布を退けたのは、そういうことだった。
 */

import { chance, randFloat } from '../../engine/rng';
import { currentAbilities } from '../abilities';
import type { Abilities, Officer } from '../types';

export type DuelOutcome = 'capture' | 'kill' | 'draw';

export interface DuelSide {
  officer: Officer;
  abilities: Abilities;
  /** 一騎討ち中の消耗。0になったほうが負け。 */
  vigor: number;
  maxVigor: number;
}

export interface DuelRound {
  /** 打ち込んだ側。 */
  attacker: 'a' | 'b';
  damage: number;
  /** 演出用の一文。 */
  text: string;
}

export interface DuelResult {
  rounds: DuelRound[];
  /** 引き分けなら null。 */
  winner: 'a' | 'b' | null;
  outcome: DuelOutcome;
  /** 何合で決着したか（引き分けなら打ち切った合数）。 */
  bouts: number;
}

/** 武力差が これ以上 開いていれば、まず捕らえられる。 */
const DECISIVE_GAP = 28;
/** 互角のときの捕縛率。ここが「近い場合は運」の運。 */
const EVEN_CAPTURE = 0.45;
/** ここまで打ち合って決まらなければ「勝負つかず」。 */
const MAX_BOUTS = 60;

/**
 * 捕縛できる確率。gap は 勝者の武力 − 敗者の武力。
 * 差0で45%、差28以上でほぼ確実。
 */
export function captureChance(gap: number): number {
  const g = Math.max(0, gap);
  const value = EVEN_CAPTURE + (g / DECISIVE_GAP) * (0.98 - EVEN_CAPTURE);
  return Math.min(0.98, value);
}

/**
 * 一騎討ちで使う体力。武力と統率から出す（打たれ強さ）。
 * ここを厚くすることで、拮抗した相手は打ち切っても倒れず、勝負つかずに終わる。
 */
export function vigorOf(a: Abilities): number {
  return Math.round(a.war * 3.5 + a.lead * 1.0);
}

export function makeDuelSide(officer: Officer, virtueDelta = 0): DuelSide {
  const abilities = currentAbilities(officer, virtueDelta);
  const vigor = vigorOf(abilities);
  return { officer, abilities, vigor, maxVigor: vigor };
}

const MISS_TEXT = [
  '{a}の一撃、{b}が受け止める',
  '{a}が打ち込むが、{b}は微動だにしない',
  '{a}の突きを{b}が弾き返す',
  '{a}と{b}、得物を合わせたまま動かない',
];

const HIT_TEXT = [
  '{a}の一撃、{b}の得物を弾く',
  '{a}が踏み込み、{b}の肩を掠める',
  '{a}の突きが{b}の脇を抜ける',
  '{a}が馬をあて、{b}の体勢が崩れる',
  '{a}の斬撃、{b}の兜をかすめる',
];

const HEAVY_TEXT = [
  '{a}の渾身の一撃！{b}は鞍から落ちかける',
  '{a}が渾身の力で打ち下ろす。{b}の腕が痺れた',
  '{a}の一閃、{b}の脇腹を裂く',
];

function line(pool: string[], attacker: string, defender: string): string {
  const template = pool[Math.floor(Math.random() * pool.length)]!;
  return template.replace('{a}', attacker).replace('{b}', defender);
}

/**
 * 消耗すると武力そのものが鈍る。ここが「代わる代わる挑む」を効かせる要。
 *
 * 大きくしすぎると、疲れた側がさらに斬られやすくなる悪循環が起きて、
 * 一対一の「勝負つかず」が消えてしまう。三英が効く程度に留める。
 */
const FATIGUE_BITE = 0.3;

/** いま振るえる武力。疲れた腕は、振りも受けも鈍い。 */
export function effectiveWar(side: DuelSide): number {
  const fatigue = 1 - side.vigor / side.maxVigor;
  return side.abilities.war * (1 - fatigue * FATIGUE_BITE);
}

/**
 * 一合ぶんの打ち合い。
 *
 * 「振り」から「受け」をまるごと引くので、武力が拮抗していると刃はほとんど通らない。
 * これが「百余合、勝負つかず」を生む。差が開いていれば毎合まともに入る。
 *
 * 武力は消耗ぶんだけ鈍るので、疲れた強者は格下にも討たれうる。
 */
function exchange(attacker: DuelSide, defender: DuelSide): { damage: number; heavy: boolean } {
  const swing = effectiveWar(attacker) * randFloat(0.75, 1.25);
  const parry = effectiveWar(defender) * 0.9 * randFloat(0.8, 1.2) + defender.abilities.mobility * 0.1;
  const raw = swing - parry;
  if (raw <= 0) return { damage: 0, heavy: false };
  const heavy = raw > attacker.abilities.war * 0.25;
  return { damage: Math.round(raw * (heavy ? 1.5 : 1)), heavy };
}

/**
 * 進行中の一騎討ち。
 * 十合ずつ進めては「続けるか、退くか」を訊けるように、状態を外に持たせている。
 */
export interface DuelState {
  a: DuelSide;
  b: DuelSide;
  bouts: number;
  turn: 'a' | 'b';
  result: DuelResult | null;
}

export function startDuel(a: DuelSide, b: DuelSide): DuelState {
  return {
    a,
    b,
    bouts: 0,
    // 機動が高いほうが先に打ち込む
    turn: a.abilities.mobility >= b.abilities.mobility ? 'a' : 'b',
    result: null,
  };
}

/** 指定した合数だけ打ち合う。決着したら result が入る。 */
export function runBouts(state: DuelState, count: number): DuelRound[] {
  const rounds: DuelRound[] = [];
  if (state.result) return rounds;

  for (let i = 0; i < count && state.bouts < MAX_BOUTS; i++) {
    const attacker = state.turn === 'a' ? state.a : state.b;
    const defender = state.turn === 'a' ? state.b : state.a;
    const { damage, heavy } = exchange(attacker, defender);
    defender.vigor = Math.max(0, defender.vigor - damage);
    state.bouts++;

    const round: DuelRound = {
      attacker: state.turn,
      damage,
      text: line(
        damage === 0 ? MISS_TEXT : heavy ? HEAVY_TEXT : HIT_TEXT,
        attacker.officer.name,
        defender.officer.name,
      ),
    };
    rounds.push(round);

    if (defender.vigor <= 0) {
      // 捕らえられるかは「素の武力差」で見る。
      // 疲れて倒れた強者を、格下が生かしておけるとは限らない。
      const gap = attacker.abilities.war - defender.abilities.war;
      state.result = {
        rounds,
        winner: state.turn,
        outcome: chance(captureChance(gap)) ? 'capture' : 'kill',
        bouts: state.bouts,
      };
      return rounds;
    }
    state.turn = state.turn === 'a' ? 'b' : 'a';
  }

  // 打ち切りまで打ち合っても互いに刃が通らなかった＝勝負つかず
  if (state.bouts >= MAX_BOUTS) {
    state.result = { rounds, winner: null, outcome: 'draw', bouts: state.bouts };
  }
  return rounds;
}

/** どちらかが退いた。決着はつかないが、退いた側の士気が落ちる。 */
export function withdrawFromDuel(state: DuelState): DuelResult {
  state.result = { rounds: [], winner: null, outcome: 'draw', bouts: state.bouts };
  return state.result;
}

/** 最後まで一息に解決する（AI同士や検証用）。 */
export function resolveDuel(a: DuelSide, b: DuelSide): DuelResult {
  const state = startDuel(a, b);
  const rounds: DuelRound[] = [];
  while (!state.result) rounds.push(...runBouts(state, MAX_BOUTS));
  return { ...state.result, rounds };
}

/** 引き分けの一文。合数で言い回しを変える。 */
export function drawText(bouts: number): string {
  if (bouts >= 55) return `${bouts}合に及んで、なお勝負つかず。両軍、鉦を鳴らして兵を収めた。`;
  return `${bouts}合を戦って、勝負つかず。`;
}

// ---------------------------------------------------------------- 疲労の持ち越し

/**
 * 戦のあいだ、誰がどれだけ消耗したかを覚えておく台帳。
 *
 * これがあるから「代わる代わる挑む」が意味を持つ。
 * 一度でも打ち合った相手は、次に挑まれたとき削れた体力のまま立つことになる。
 */
export class DuelBook {
  private readonly sides = new Map<string, DuelSide>();

  side(officer: Officer, virtueDelta = 0): DuelSide {
    const existing = this.sides.get(officer.id);
    if (existing) return existing;
    const fresh = makeDuelSide(officer, virtueDelta);
    this.sides.set(officer.id, fresh);
    return fresh;
  }

  /** 消耗の度合い。0が無傷、1で立っていられない。 */
  fatigue(officerId: string): number {
    const side = this.sides.get(officerId);
    if (!side) return 0;
    return 1 - side.vigor / side.maxVigor;
  }

  /** すでに何度か打ち合っているか。 */
  hasFought(officerId: string): boolean {
    return this.sides.has(officerId);
  }
}

// ---------------------------------------------------------------- 見返り

/** 一騎討ちの結果で振れる士気。勝てば戦況がひっくり返る。 */
export const DUEL_MORALE = {
  win: 25,
  lose: -25,
  /** 引き分けは、双方わずかに上がる（見事な勝負だった）。 */
  draw: 4,
  /** 自分から退いた側は白ける。 */
  withdraw: -12,
} as const;

/**
 * 名声。**格上と引き分けること自体が戦果になる**のがここの肝。
 * 格下を倒しても大して上がらないので、「誰に挑むか」が判断になる。
 */
export function renownForDuel(
  outcome: DuelOutcome,
  won: boolean,
  self: Abilities,
  opponent: Abilities,
): number {
  const gap = opponent.war - self.war; // プラスなら相手が格上
  if (outcome === 'draw') return Math.max(0, Math.round(gap * 2.5));
  if (!won) return 0;
  return Math.round(20 + Math.max(0, gap) * 2);
}

// ---------------------------------------------------------------- 挑戦と応答

/**
 * 挑まれたときに、相手（AI）が応じるか。
 * 武将は武力に自信があるほど受け、軍師はまず受けない。
 * 徳の低い者は、不利と見れば平気で断る。
 */
export function willAcceptDuel(defender: Abilities, challenger: Abilities): boolean {
  // 武力が知力を大きく上回る者ほど、血が先に動く
  const bravado = (defender.war - defender.intel) / 100;
  const odds = (defender.war - challenger.war) / 60;
  const pride = defender.virtue / 400;
  return chance(Math.max(0.02, Math.min(0.95, 0.35 + bravado + odds + pride)));
}

/**
 * 断ったときに落ちる士気。武力自慢が断るほど、兵は白ける。
 */
export function refusalMoralePenalty(defender: Abilities): number {
  return Math.round(6 + (defender.war / 100) * 14);
}

// ---------------------------------------------------------------- 捕虜の処遇

export type CaptiveFate = 'recruit' | 'release' | 'execute' | 'imprison';

/**
 * 捕らえた側がAIのとき、捕虜をどう扱うか。
 * 徳の高い者は殺さない。徳の低い者は、使えないと見れば斬る。
 */
export function decideCaptiveFate(captor: Abilities, captive: Abilities): CaptiveFate {
  const mercy = captor.virtue + captive.virtue * 0.3;
  const worth = captive.war * 0.5 + captive.intel * 0.5;

  if (mercy >= 70 && worth >= 60) return 'recruit';
  if (mercy >= 70) return 'release';
  if (mercy >= 45) return worth >= 70 ? 'recruit' : 'imprison';
  if (mercy >= 25) return worth >= 85 ? 'imprison' : 'execute';
  return 'execute';
}

export const CAPTIVE_FATE_TEXT: Record<CaptiveFate, string> = {
  recruit: '降を勧められた',
  release: '解き放たれた',
  imprison: '囚われの身となった',
  execute: '斬られた',
};
