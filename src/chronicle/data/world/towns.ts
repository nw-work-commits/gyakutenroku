/**
 * 町の中。
 *
 * 19都市ぶんの地形を手描きすると死ぬので、間取りは3種類だけ作って共用し、
 * **誰がいて、どの施設が置かれているか**だけを都市ごとに変える。
 * 洛陽と成都で地形が同じでも、いる人物と受けられる用が違えば行く意味は変わる。
 */

export type FacilityId = 'castle' | 'barracks' | 'tavern' | 'market' | 'inn';

export interface FacilityInfo {
  id: FacilityId;
  name: string;
  glyph: string;
  desc: string;
}

export const FACILITIES: Record<FacilityId, FacilityInfo> = {
  castle: { id: 'castle', name: '城', glyph: '🏯', desc: '主に会う。仕官を願い出る。' },
  barracks: { id: 'barracks', name: '兵舎', glyph: '⚔️', desc: '兵を集め、調練する。' },
  tavern: { id: 'tavern', name: '酒楼', glyph: '🍶', desc: '人が集まる。噂も、士も。' },
  market: { id: 'market', name: '市', glyph: '🏮', desc: '商いの声がやかましい。' },
  inn: { id: 'inn', name: '宿', glyph: '🛏️', desc: '旅の疲れを落とす。' },
};

// ---------------------------------------------------------------- 地形

export interface TownTile {
  name: string;
  color: string;
  glyph?: string;
  glyphScale?: number;
  walkable: boolean;
}

export const TOWN_TILES: Record<string, TownTile> = {
  '.': { name: '地面', color: '#6a6152', walkable: true },
  ',': { name: '石畳', color: '#8a8272', walkable: true },
  '#': { name: '塀', color: '#3b352c', walkable: false },
  H: { name: '建物', color: '#5c4a38', glyph: '🏠', glyphScale: 0.9, walkable: false },
  D: { name: '入口', color: '#3a2c1e', walkable: true },
  T: { name: '木', color: '#3c5c33', glyph: '🌲', glyphScale: 0.85, walkable: false },
  '~': { name: '池', color: '#2b5b8f', walkable: false },
  f: { name: '花壇', color: '#5d7a41', glyph: '🌸', glyphScale: 0.5, walkable: true },
  '^': { name: '崖', color: '#5a5350', glyph: '⛰️', glyphScale: 0.9, walkable: false },
};

export function townTile(ch: string): TownTile {
  return TOWN_TILES[ch] ?? { name: '虚空', color: '#000', walkable: false };
}

// ---------------------------------------------------------------- 間取り

export interface TownLayout {
  id: string;
  tiles: string[];
  /** 施設の入口。ここに置かれる施設は都市データの順で決まる。 */
  doors: [number, number][];
  /** 世界地図へ戻る出口。 */
  exit: [number, number];
  /** 住人が立てる場所。 */
  spots: [number, number][];
  /** 入場したときの立ち位置。 */
  entry: [number, number];
}

/** 城市。施設5つ。 */
const CASTLE: TownLayout = {
  id: 'castle',
  tiles: [
    '####################',
    '#..................#',
    '#..HHHH....HHHH....#',
    '#..HHDH....HHDH....#',
    '#..................#',
    '#.....HHHHHHHH.....#',
    '#.....HHHHHHHH.....#',
    '#.......HHDH.......#',
    '#..................#',
    '#..HHHH....HHHH....#',
    '#..HHDH....HHDH....#',
    '#..................#',
    '#.........,........#',
    '##########,#########',
    '##########,#########',
  ],
  doors: [
    [10, 7], // 中央の大きな建物＝城
    [5, 3],
    [13, 3],
    [5, 10],
    [13, 10],
  ],
  exit: [10, 14],
  spots: [
    [8, 4], [12, 4], [4, 8], [15, 8], [8, 11], [12, 11], [7, 1], [13, 1],
  ],
  entry: [10, 12],
};

/** 町。施設3つ。 */
const TOWN: TownLayout = {
  id: 'town',
  tiles: [
    '####################',
    '#TT..............TT#',
    '#T................T#',
    '#....HHHH..HHHH....#',
    '#....HHDH..HHDH....#',
    '#..................#',
    '#..................#',
    '#....~~~......f....#',
    '#....~~~...........#',
    '#..................#',
    '#......HHHHHH......#',
    '#......HHDHHH......#',
    '#.........,........#',
    '#TTTTTTTTT,TTTTTTTT#',
    '#TTTTTTTTT,TTTTTTTT#',
  ],
  doors: [
    [9, 11],
    [7, 4],
    [13, 4],
  ],
  exit: [10, 14],
  spots: [[10, 6], [4, 9], [15, 9], [12, 8], [6, 2], [14, 2]],
  entry: [10, 12],
};

/** 関所。施設1つ。 */
const PASS: TownLayout = {
  id: 'pass',
  tiles: [
    '####################',
    '#^^^^^^^^^^^^^^^^^^#',
    '#^^^^^^^^^^^^^^^^^^#',
    '#^^^^..........^^^^#',
    '#^^^^..HHHH....^^^^#',
    '#^^^^..HHDH....^^^^#',
    '#^^^^..........^^^^#',
    '#^^^^..........^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
    '#^^^^^^^^,,^^^^^^^^#',
  ],
  doors: [[9, 5]],
  exit: [9, 14],
  spots: [[6, 6], [12, 6], [11, 3]],
  entry: [9, 12],
};

export const LAYOUTS: Record<string, TownLayout> = {
  castle: CASTLE,
  town: TOWN,
  pass: PASS,
};

// ---------------------------------------------------------------- 都市の中身

export interface TownDef {
  cityId: string;
  layoutId: string;
  /** 入口の順に対応する施設。 */
  facilities: FacilityId[];
  /** その町ならではの一言。町人が言う。 */
  flavor?: string[];
}

const CASTLE_SET: FacilityId[] = ['castle', 'barracks', 'market', 'tavern', 'inn'];
const TOWN_SET: FacilityId[] = ['tavern', 'market', 'inn'];
const PASS_SET: FacilityId[] = ['barracks'];

function castleTown(cityId: string, flavor?: string[]): TownDef {
  return { cityId, layoutId: 'castle', facilities: CASTLE_SET, flavor };
}

function plainTown(cityId: string, flavor?: string[]): TownDef {
  return { cityId, layoutId: 'town', facilities: TOWN_SET, flavor };
}

function passTown(cityId: string, flavor?: string[]): TownDef {
  return { cityId, layoutId: 'pass', facilities: PASS_SET, flavor };
}

const TOWN_LIST: TownDef[] = [
  castleTown('luoyang', ['二百年の都です。ここが揺らげば、天下が揺らぐ。']),
  castleTown('changan', ['西の都。函谷関より西は、また別の国のようだ。']),
  castleTown('ye', ['河北の要。ここを取れば、天下の半ばを取ったも同じ。']),
  castleTown('xuchang', ['天子はここにおわす。……名目の上では。']),
  castleTown('puyang', ['兗州は平らかで、兵を養うに良い土地です。']),
  castleTown('chengdu', ['蜀の道は険しい。だから、ここは攻められにくい。']),
  castleTown('jianye', ['長江さえあれば、北の騎馬など恐るるに足らず。']),
  castleTown('xiangyang', ['荊州は天下の腹。ここを制した者が、南北を分ける。']),
  castleTown('ji_city', ['北は烏丸、鮮卑。塞の外には、また別の戦がある。']),
  castleTown('jinyang', ['并州の兵は強い。だが、まとめる者がいない。']),
  castleTown('tianshui', ['西涼の馬は、中原のものとは足が違う。']),
  castleTown('shouchun', ['淮南は米どころ。だが、主が代わるたびに焼かれる。']),
  castleTown('xiapi', ['泗水と沂水に挟まれて、水の多い土地です。']),
  castleTown('beihai', ['孔北海は学を好む。文人がよく集まります。']),
  castleTown('jiangling', ['ここには荊州の兵糧がすべて積んである。']),
  plainTown('zhuo', ['この村から、むしろを織って売る男が出たそうだ。']),
  plainTown('chaisang', ['長江を見張るには、ここが良い。']),
  passTown('hulao', ['この関を抜かねば、洛陽へは入れぬ。']),
  passTown('jiange', ['一夫関に当たれば、万夫も開くこと莫し。']),
];

export const TOWNS: Record<string, TownDef> = Object.fromEntries(
  TOWN_LIST.map((t) => [t.cityId, t]),
);

export function townOf(cityId: string): TownDef | undefined {
  return TOWNS[cityId];
}

export function layoutOf(town: TownDef): TownLayout {
  return LAYOUTS[town.layoutId] ?? CASTLE;
}

/** 開発時の点検。間取りの幅、施設と入口の数が合っているか。 */
export function validateTowns(): string[] {
  const problems: string[] = [];
  for (const layout of Object.values(LAYOUTS)) {
    const width = layout.tiles[0]?.length ?? 0;
    layout.tiles.forEach((row, y) => {
      if (row.length !== width) problems.push(`間取り ${layout.id}: ${y}行目の幅が ${row.length}`);
    });
    for (const [x, y] of layout.doors) {
      if (layout.tiles[y]?.[x] !== 'D') problems.push(`間取り ${layout.id}: (${x},${y}) が入口でない`);
    }
    for (const [x, y] of [...layout.spots, layout.entry, layout.exit]) {
      const ch = layout.tiles[y]?.[x];
      if (!ch || !townTile(ch).walkable) {
        problems.push(`間取り ${layout.id}: (${x},${y}) が歩けない`);
      }
    }
  }
  for (const town of TOWN_LIST) {
    const layout = LAYOUTS[town.layoutId];
    if (!layout) {
      problems.push(`町 ${town.cityId}: 間取り ${town.layoutId} が無い`);
      continue;
    }
    if (town.facilities.length !== layout.doors.length) {
      problems.push(
        `町 ${town.cityId}: 施設 ${town.facilities.length} に対して入口 ${layout.doors.length}`,
      );
    }
  }
  return problems;
}
