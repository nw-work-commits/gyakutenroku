/**
 * 中国全土の地図。
 *
 * 60×46 のマスを手で数えると必ずずれるので、地形は宣言的に塗って組み立てる。
 * 山・河・州・街道・城市を順に重ねていくだけなので、後から地形を足すのも簡単。
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProvinceDef {
  id: string;
  name: string;
  /** 州の広がり。重なった場合は後に塗ったほうが勝つ。 */
  area: Rect[];
}

export interface CityDef {
  id: string;
  name: string;
  x: number;
  y: number;
  provinceId: string;
  /** 城市か、関所や集落か。 */
  kind: 'castle' | 'town' | 'pass';
  note?: string;
}

export const WORLD_W = 60;
export const WORLD_H = 46;

// ---------------------------------------------------------------- 州

export const PROVINCES: ProvinceDef[] = [
  { id: 'liang', name: '涼州', area: [{ x: 2, y: 6, w: 13, h: 12 }] },
  { id: 'bing', name: '并州', area: [{ x: 16, y: 4, w: 11, h: 11 }] },
  { id: 'you', name: '幽州', area: [{ x: 33, y: 2, w: 19, h: 9 }] },
  { id: 'ji', name: '冀州', area: [{ x: 27, y: 11, w: 16, h: 8 }] },
  { id: 'qing', name: '青州', area: [{ x: 43, y: 12, w: 10, h: 9 }] },
  { id: 'si', name: '司隷', area: [{ x: 14, y: 15, w: 13, h: 9 }] },
  { id: 'yan', name: '兗州', area: [{ x: 28, y: 19, w: 13, h: 6 }] },
  { id: 'xu', name: '徐州', area: [{ x: 41, y: 21, w: 12, h: 7 }] },
  { id: 'yu', name: '豫州', area: [{ x: 24, y: 25, w: 15, h: 6 }] },
  { id: 'yi', name: '益州', area: [{ x: 2, y: 22, w: 15, h: 15 }] },
  { id: 'jing', name: '荊州', area: [{ x: 17, y: 31, w: 17, h: 8 }] },
  { id: 'yang', name: '揚州', area: [{ x: 34, y: 28, w: 19, h: 11 }] },
  { id: 'jiao', name: '交州', area: [{ x: 20, y: 39, w: 21, h: 6 }] },
];

// ---------------------------------------------------------------- 城市

export const CITIES: CityDef[] = [
  { id: 'ji_city', name: '薊', x: 42, y: 5, provinceId: 'you', kind: 'castle' },
  { id: 'zhuo', name: '涿県', x: 39, y: 8, provinceId: 'you', kind: 'town', note: '劉備の故郷' },
  { id: 'jinyang', name: '晋陽', x: 21, y: 9, provinceId: 'bing', kind: 'castle' },
  { id: 'ye', name: '鄴', x: 34, y: 14, provinceId: 'ji', kind: 'castle', note: '袁紹の本拠' },
  { id: 'beihai', name: '北海', x: 48, y: 17, provinceId: 'qing', kind: 'castle' },
  { id: 'tianshui', name: '天水', x: 8, y: 12, provinceId: 'liang', kind: 'castle' },
  { id: 'changan', name: '長安', x: 17, y: 19, provinceId: 'si', kind: 'castle', note: '西の都' },
  { id: 'luoyang', name: '洛陽', x: 24, y: 20, provinceId: 'si', kind: 'castle', note: '漢の都' },
  { id: 'hulao', name: '虎牢関', x: 27, y: 20, provinceId: 'si', kind: 'pass' },
  { id: 'puyang', name: '濮陽', x: 34, y: 21, provinceId: 'yan', kind: 'castle' },
  { id: 'xiapi', name: '下邳', x: 46, y: 24, provinceId: 'xu', kind: 'castle' },
  { id: 'xuchang', name: '許昌', x: 31, y: 27, provinceId: 'yu', kind: 'castle', note: '曹操の本拠' },
  { id: 'chengdu', name: '成都', x: 8, y: 29, provinceId: 'yi', kind: 'castle', note: '蜀の都' },
  { id: 'jiange', name: '剣閣', x: 13, y: 25, provinceId: 'yi', kind: 'pass' },
  { id: 'xiangyang', name: '襄陽', x: 25, y: 32, provinceId: 'jing', kind: 'castle' },
  { id: 'jiangling', name: '江陵', x: 22, y: 36, provinceId: 'jing', kind: 'castle' },
  { id: 'shouchun', name: '寿春', x: 38, y: 30, provinceId: 'yang', kind: 'castle' },
  { id: 'jianye', name: '建業', x: 46, y: 33, provinceId: 'yang', kind: 'castle', note: '呉の都' },
  { id: 'chaisang', name: '柴桑', x: 38, y: 35, provinceId: 'yang', kind: 'town' },
];

// ---------------------------------------------------------------- 組み立て

type Grid = string[][];

function blank(fill: string): Grid {
  return Array.from({ length: WORLD_H }, () => Array.from({ length: WORLD_W }, () => fill));
}

function fillRect(grid: Grid, rect: Rect, ch: string): void {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (grid[y]?.[x] !== undefined) grid[y]![x] = ch;
    }
  }
}

/** 折れ線を引く。河や街道に使う。 */
function polyline(grid: Grid, points: [number, number][], ch: string, thickness = 1): void {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      for (let d = 0; d < thickness; d++) {
        if (grid[y + d]?.[x] !== undefined) grid[y + d]![x] = ch;
      }
    }
  }
}

/** ばらまき。森や丘を自然に散らす。id を種にして毎回同じ形にする。 */
function scatter(grid: Grid, rect: Rect, ch: string, density: number, seed: number): void {
  let state = seed || 1;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (grid[y]?.[x] === '.' && next() < density) grid[y]![x] = ch;
    }
  }
}

function buildTerrain(): Grid {
  const g = blank('.');

  // ---- 外周と海
  fillRect(g, { x: 0, y: 0, w: WORLD_W, h: 3 }, '^'); // 北の山脈
  fillRect(g, { x: 0, y: 0, w: 2, h: WORLD_H }, '^'); // 西の果て
  fillRect(g, { x: 0, y: WORLD_H - 1, w: WORLD_W, h: 1 }, '^');
  fillRect(g, { x: 53, y: 8, w: 7, h: 30 }, '='); // 東の海
  fillRect(g, { x: 41, y: 38, w: 19, h: 8 }, '='); // 南東の海
  fillRect(g, { x: 0, y: 3, w: 16, h: 3 }, ':'); // 北西の砂

  // ---- 山地
  fillRect(g, { x: 2, y: 6, w: 5, h: 32 }, '^'); // 西の大山脈
  fillRect(g, { x: 8, y: 20, w: 10, h: 3 }, '^'); // 秦嶺（司隷と益州を隔てる）
  fillRect(g, { x: 27, y: 3, w: 6, h: 6 }, '^'); // 并州と幽州のあいだ
  fillRect(g, { x: 15, y: 6, w: 3, h: 8 }, '^');
  scatter(g, { x: 3, y: 23, w: 14, h: 13 }, 'v', 0.35, 7); // 益州の山がち
  scatter(g, { x: 17, y: 33, w: 16, h: 6 }, 'v', 0.18, 11);
  fillRect(g, { x: 20, y: 40, w: 20, h: 4 }, 'v'); // 南嶺

  // ---- 森と草原
  scatter(g, { x: 33, y: 3, w: 19, h: 8 }, '"', 0.3, 3); // 幽州の草原
  scatter(g, { x: 16, y: 4, w: 11, h: 10 }, '"', 0.25, 5);
  scatter(g, { x: 17, y: 31, w: 17, h: 8 }, 'T', 0.28, 13); // 荊州の森
  scatter(g, { x: 34, y: 28, w: 18, h: 10 }, 'T', 0.22, 17);
  scatter(g, { x: 20, y: 39, w: 20, h: 5 }, 'T', 0.4, 19); // 交州の密林

  // ---- 大河。黄河と長江が地図を三つに分ける
  polyline(g, [[7, 13], [16, 16], [26, 17], [34, 17], [44, 19], [53, 20]], '~');
  polyline(g, [[6, 31], [14, 32], [22, 34], [30, 34], [38, 34], [46, 35], [53, 35]], '~');

  // ---- 渡し場（河を越えられる場所を限る）
  for (const [x, y] of [
    [16, 16], [26, 17], [34, 17], [44, 19],
    [22, 34], [30, 34], [38, 34], [46, 35],
  ] as [number, number][]) {
    if (g[y]?.[x] !== undefined) g[y]![x] = 'B';
  }

  // ---- 街道。城市どうしを結ぶ
  const roads: [number, number][][] = [
    [[42, 5], [39, 8], [34, 14], [34, 17], [34, 21]], // 幽州 → 冀州 → 兗州
    [[21, 9], [24, 14], [24, 17], [24, 20]], // 并州 → 洛陽
    [[8, 12], [12, 15], [17, 19], [24, 20]], // 涼州 → 長安 → 洛陽
    [[24, 20], [27, 20], [31, 27]], // 洛陽 → 虎牢関 → 許昌
    [[34, 21], [40, 22], [46, 24]], // 濮陽 → 下邳
    [[46, 24], [48, 20], [48, 17]], // 下邳 → 北海
    [[31, 27], [38, 30], [46, 33]], // 許昌 → 寿春 → 建業
    [[31, 27], [25, 32], [22, 36]], // 許昌 → 襄陽 → 江陵
    [[25, 32], [30, 34], [38, 35]], // 襄陽 → 柴桑
    [[17, 19], [13, 25], [8, 29]], // 長安 → 剣閣 → 成都
  ];
  for (const road of roads) {
    for (let i = 0; i < road.length - 1; i++) {
      const [x0, y0] = road[i]!;
      const [x1, y1] = road[i + 1]!;
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const x = Math.round(x0 + (x1 - x0) * t);
        const y = Math.round(y0 + (y1 - y0) * t);
        const current = g[y]?.[x];
        // 河と海は街道で潰さない（渡しはすでに置いてある）
        if (current === undefined || current === '~' || current === '=') continue;
        g[y]![x] = ',';
      }
    }
  }

  // ---- 城市
  for (const city of CITIES) {
    if (g[city.y]?.[city.x] !== undefined) {
      g[city.y]![city.x] = city.kind === 'pass' ? 'G' : 'C';
    }
  }

  return g;
}

const TERRAIN = buildTerrain();

export const OVERWORLD_TILES: string[] = TERRAIN.map((row) => row.join(''));

// ---------------------------------------------------------------- 州の判定

function buildProvinceGrid(): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: WORLD_H }, () =>
    Array.from({ length: WORLD_W }, () => null),
  );
  for (const province of PROVINCES) {
    for (const rect of province.area) {
      for (let y = rect.y; y < rect.y + rect.h; y++) {
        for (let x = rect.x; x < rect.x + rect.w; x++) {
          if (grid[y]?.[x] !== undefined) grid[y]![x] = province.id;
        }
      }
    }
  }
  return grid;
}

const PROVINCE_GRID = buildProvinceGrid();

export const PROVINCE_BY_ID: Record<string, ProvinceDef> = Object.fromEntries(
  PROVINCES.map((p) => [p.id, p]),
);

/** その位置がどの州か。州の外（辺境）なら null。 */
export function provinceAt(x: number, y: number): ProvinceDef | null {
  const id = PROVINCE_GRID[y]?.[x] ?? null;
  return id ? (PROVINCE_BY_ID[id] ?? null) : null;
}

export function cityAt(x: number, y: number): CityDef | undefined {
  return CITIES.find((c) => c.x === x && c.y === y);
}

export const CITY_BY_ID: Record<string, CityDef> = Object.fromEntries(
  CITIES.map((c) => [c.id, c]),
);

/** 開発時の点検。城市が海の中にいないか、州がどこにも無い城市はないか。 */
export function validateWorld(): string[] {
  const problems: string[] = [];
  for (const city of CITIES) {
    const ch = OVERWORLD_TILES[city.y]?.[city.x];
    if (ch === undefined) problems.push(`城市 ${city.name} が地図の外 (${city.x},${city.y})`);
    if (!PROVINCE_BY_ID[city.provinceId]) problems.push(`城市 ${city.name} の州が未定義`);
    const province = provinceAt(city.x, city.y);
    if (province && province.id !== city.provinceId) {
      problems.push(`城市 ${city.name} は ${city.provinceId} のはずが ${province.id} の上にある`);
    }
  }
  const width = OVERWORLD_TILES[0]?.length ?? 0;
  OVERWORLD_TILES.forEach((row, y) => {
    if (row.length !== width) problems.push(`地図 ${y}行目の幅が ${row.length}`);
  });
  return problems;
}
