/** 乱数ユーティリティ。戦闘の揺らぎはすべてここを通す。 */

/** min 以上 max 以下の整数。 */
export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** min 以上 max 未満の実数。 */
export function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 確率 p (0..1) で true。 */
export function chance(p: number): boolean {
  return Math.random() < p;
}

export function pick<T>(list: readonly T[]): T {
  return list[randInt(0, list.length - 1)]!;
}

/** weight プロパティを持つ候補から重み付き抽選。候補が空なら null。 */
export function pickWeighted<T extends { weight: number }>(list: readonly T[]): T | null {
  const total = list.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const entry of list) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return list[list.length - 1] ?? null;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * 文字列から決まる 0..1 の値。同じ文字列なら、何度読み込んでも同じ値になる。
 *
 * 「どこに賊が湧くか」のように、表で持ちたくないが毎回同じであってほしいものに使う。
 * 能力値の生成にも同じ仕掛けがあるが、あちらは種を変えると全武将の数値が
 * 総入れ替えになるので、共有せずに別々に持っている。
 */
export function seededUnit(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h << 13;
  h >>>= 0;
  h ^= h >> 17;
  h ^= h << 5;
  h >>>= 0;
  return h / 0xffffffff;
}
