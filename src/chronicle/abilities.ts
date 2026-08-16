/**
 * 能力値の決定。
 *
 * 千人ぶんを手入力しないための仕掛け。役柄のレンジから ID を種にして決定的に生成し、
 * 武将データに書かれた値だけを上書きする。同じ武将は何度読み込んでも同じ値になる。
 */

import { ROLES } from './data/roles';
import type { AbilityKey, Abilities, Officer } from './types';

const KEYS: AbilityKey[] = ['war', 'intel', 'lead', 'mobility', 'virtue'];

/** FNV-1a。短い文字列を安定した数値に潰すだけの用途。 */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** 種から 0..1 の値を作る。 */
function unit(seed: number): number {
  // xorshift を1回まわして偏りをならす
  let x = seed || 1;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5;
  x >>>= 0;
  return x / 0xffffffff;
}

/**
 * 素の能力値。徳の増減（生き方で動くぶん）は含まない。
 * 役柄が未定義なら、真ん中あたりの平凡な値にしておく（データ不足で落とさない）。
 */
export function baseAbilities(officer: Officer): Abilities {
  const range = ROLES[officer.roleId]?.range;
  const result = {} as Abilities;

  for (const key of KEYS) {
    const override = officer.stats?.[key];
    if (override !== undefined) {
      result[key] = clamp(override);
      continue;
    }
    if (!range) {
      result[key] = 50;
      continue;
    }
    const [min, max] = range[key];
    const roll = unit(hash(`${officer.id}:${key}`));
    result[key] = clamp(Math.round(min + (max - min) * roll));
  }
  return result;
}

/**
 * 生き方で動いたぶんを足した、その者の「完成形」。
 * 実際に振るえる力は年齢で変わるので、遊びの中では abilitiesAt を使う。
 */
export function currentAbilities(officer: Officer, virtueDelta: number): Abilities {
  const base = baseAbilities(officer);
  return { ...base, virtue: clamp(base.virtue + virtueDelta) };
}

// ---------------------------------------------------------------- 年齢と熟成

/**
 * 能力ごとの熟し方。
 * 呂布とて、生まれたときから武力100だったわけではない。
 *
 *   武力・機動 … 早く伸びて、早く衰える
 *   知力       … ゆっくり伸びて、ほとんど衰えない
 *   統率       … 経験で伸びる。衰えは遅い
 *   徳         … 生き方で育つ。歳を重ねても落ちない
 */
interface Maturity {
  /** 伸び始める歳。 */
  rise: number;
  /** ここから全盛。 */
  peak: number;
  /** ここから衰え始める。 */
  decline: number;
  /** 少年期の実現度。 */
  floor: number;
  /** 十分に老いたときの実現度。 */
  late: number;
  /** floor から 1.0 まで、また 1.0 から late まで何年かけるか。 */
  fade: number;
}

const CURVES: Record<AbilityKey, Maturity> = {
  war: { rise: 14, peak: 25, decline: 42, floor: 0.42, late: 0.68, fade: 34 },
  mobility: { rise: 13, peak: 23, decline: 38, floor: 0.48, late: 0.58, fade: 32 },
  intel: { rise: 12, peak: 30, decline: 72, floor: 0.52, late: 0.9, fade: 25 },
  lead: { rise: 16, peak: 34, decline: 62, floor: 0.32, late: 0.84, fade: 30 },
  virtue: { rise: 12, peak: 34, decline: 200, floor: 0.55, late: 1, fade: 40 },
};

/** その歳における実現度 0..1。 */
function maturity(age: number, curve: Maturity): number {
  if (age <= curve.rise) return curve.floor;
  if (age < curve.peak) {
    const t = (age - curve.rise) / (curve.peak - curve.rise);
    return curve.floor + (1 - curve.floor) * t;
  }
  if (age <= curve.decline) return 1;
  const t = Math.min(1, (age - curve.decline) / curve.fade);
  return 1 - (1 - curve.late) * t;
}

/**
 * 生年。書いていない武将は死に方から推し量る。
 * 討たれた者は働き盛りで、病没や天寿の者は老いていた、と見なす。
 */
export function birthYear(officer: Officer): number {
  if (officer.born !== undefined) return officer.born;
  const kind = officer.fate?.kind;
  const span = kind === 'illness' || kind === 'longevity' ? 58 : 36;
  return officer.died - span;
}

export function ageAt(officer: Officer, year: number): number {
  return Math.max(1, year - birthYear(officer));
}

/** その年に実際に振るえる能力。これが遊びの中で使われる値。 */
export function abilitiesAt(officer: Officer, year: number, virtueDelta = 0): Abilities {
  const peak = currentAbilities(officer, virtueDelta);
  const age = ageAt(officer, year);
  const result = {} as Abilities;
  for (const key of KEYS) {
    result[key] = clamp(peak[key] * maturity(age, CURVES[key]));
  }
  return result;
}

/** いまが伸び盛りか、盛りか、下り坂か。画面に出して分からせる。 */
export function lifeStage(officer: Officer, year: number): '若年' | '伸び盛り' | '全盛' | '円熟' | '老境' {
  const age = ageAt(officer, year);
  if (age <= 15) return '若年';
  if (age < 25) return '伸び盛り';
  if (age <= 42) return '全盛';
  if (age <= 62) return '円熟';
  return '老境';
}

function clamp(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

/** 能力値の高低を言葉にする。列伝や人物紹介で使う。 */
export function describe(value: number): string {
  if (value >= 95) return '無双';
  if (value >= 85) return '傑出';
  if (value >= 70) return '優れる';
  if (value >= 55) return '人並み以上';
  if (value >= 40) return '人並み';
  if (value >= 25) return '劣る';
  return '見るべきものなし';
}
