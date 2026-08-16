/** 世界地図の地形。1文字＝1マス。 */

export interface WorldTile {
  name: string;
  color: string;
  glyph?: string;
  glyphScale?: number;
  walkable: boolean;
  /** 賊に襲われやすさ。0なら安全。 */
  danger?: number;
  /**
   * 一歩に食う日数。省略すれば一日。
   *
   * 街道と平地は一日で越えられるが、森も丘も砂も、抜けるのに二日かかる。
   * だから地図を見て「遠回りでも街道を辿る」判断に意味が出る。
   * 険しい土地は守りやすいが動きにくい、という戦の理屈とも噛み合う。
   */
  travel?: number;
}

export const WORLD_TILES: Record<string, WorldTile> = {
  '.': { name: '平野', color: '#4c6b3c', walkable: true, danger: 1, travel: 1 },
  ',': { name: '街道', color: '#8a7a52', walkable: true, danger: 0.35, travel: 1 },
  '"': { name: '草原', color: '#5d7a41', walkable: true, danger: 1.4, travel: 1 },
  '^': { name: '山', color: '#5a5350', walkable: false },
  'v': { name: '丘陵', color: '#6b6144', walkable: true, danger: 1.8, travel: 2 },
  'T': { name: '森', color: '#3c5c33', walkable: true, danger: 1.6, travel: 2 },
  '~': { name: '大河', color: '#2b5b8f', walkable: false },
  '=': { name: '海', color: '#1c4270', walkable: false },
  'B': { name: '渡し', color: '#9a8258', walkable: true, danger: 0.3, travel: 3 },
  ':': { name: '砂', color: '#8f8156', walkable: true, danger: 1.2, travel: 2 },
  'C': { name: '城市', color: '#8d7f6a', walkable: true, danger: 0, travel: 1 },
  'G': { name: '関所', color: '#6e6459', walkable: true, danger: 0, travel: 1 },
};

export const VOID_TILE: WorldTile = { name: '虚空', color: '#0a0a10', walkable: false };

export function worldTile(ch: string): WorldTile {
  return WORLD_TILES[ch] ?? VOID_TILE;
}

/** そのマスを越えるのに食う日数。 */
export function travelCost(ch: string): number {
  return worldTile(ch).travel ?? 1;
}

// ---------------------------------------------------------------- 戦場としての地形

/**
 * その土地で戦うと、何が効いて何が効かなくなるか。
 *
 * 見た目だけ変えても仕方がない。荊州の森で騎馬を並べても意味がなく、
 * 城壁を背にすれば守りが固い——それが数字にも出るようにする。
 *
 * `unit` は兵科ごとの攻めの通りやすさ、`guard` は守備の効き、
 * `fire` は火計の通りやすさ。1が等倍。
 */
export interface BattleGround {
  /** 画面に出す土地の名。 */
  name: string;
  /** 遊ぶ人に伝える一言。 */
  note: string;
  unit: Partial<Record<string, number>>;
  guard: number;
  fire: number;
}

const OPEN: BattleGround = {
  name: '平野',
  note: '遮るものが無い。騎馬が存分に駆ける。',
  unit: { cavalry: 1.2, archer: 1.05 },
  guard: 1,
  fire: 1,
};

export const BATTLE_GROUND: Record<string, BattleGround> = {
  '.': OPEN,
  ',': { ...OPEN, name: '街道', note: '道は広い。隊列を組んだまま当たれる。' },
  '"': {
    name: '草原',
    note: '草が高い。騎馬は走れるが、火がよく回る。',
    unit: { cavalry: 1.25 },
    guard: 0.95,
    fire: 1.35,
  },
  T: {
    name: '森',
    note: '木が矢を止め、馬が進めない。歩兵の戦になる。',
    unit: { archer: 0.6, cavalry: 0.55, infantry: 1.15 },
    guard: 1.15,
    fire: 1.4,
  },
  v: {
    name: '丘陵',
    note: '起伏が馬の足を鈍らせる。高みに拠れば守りやすい。',
    unit: { cavalry: 0.7, archer: 1.15 },
    guard: 1.25,
    fire: 1,
  },
  '^': {
    name: '山中',
    note: '道は細く、大軍の利が消える。守るに易く、攻めるに難い。',
    unit: { cavalry: 0.45, infantry: 1.1 },
    guard: 1.4,
    fire: 0.9,
  },
  '~': {
    name: '水辺',
    note: '足を取られて馬が使えない。船に火がつけば止まらない。',
    unit: { cavalry: 0.4, archer: 1.1 },
    guard: 0.9,
    fire: 1.6,
  },
  B: {
    name: '渡し',
    note: '渡りきるまでは無防備。守りが利かない。',
    unit: { cavalry: 0.5 },
    guard: 0.7,
    fire: 1.4,
  },
  '=': {
    name: '水上',
    note: '船の上では馬も歩兵も踏ん張れない。火だけがよく通る。',
    unit: { cavalry: 0.3, infantry: 0.85, archer: 1.15 },
    guard: 0.85,
    fire: 1.8,
  },
  ':': {
    name: '砂地',
    note: '砂に足を取られ、風が矢を流す。',
    unit: { archer: 0.75, cavalry: 0.85, infantry: 0.95 },
    guard: 0.95,
    fire: 0.8,
  },
  C: {
    name: '城下',
    note: '城壁を背にできる。守りが固く、暗殺者は紛れやすい。',
    unit: { cavalry: 0.75 },
    guard: 1.5,
    fire: 1.1,
  },
  G: {
    name: '関前',
    note: '狭い口を塞げばよい。数の差が意味を失う。',
    unit: { cavalry: 0.6, archer: 1.2 },
    guard: 1.6,
    fire: 1,
  },
};

export function battleGround(ch: string): BattleGround {
  return BATTLE_GROUND[ch] ?? OPEN;
}
