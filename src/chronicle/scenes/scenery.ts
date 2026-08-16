/**
 * 地形と建物を描く。
 *
 * 絵文字のタイルは、どの端末で見ても同じ形にならず、向きも光も持たない。
 * キャラだけ立体にすると、その上だけが浮いてしまう。
 *
 * ここでは同じ線と面で地面を作る。要は三つ。
 *   ・上から光が当たっているとみなし、明るい面と陰る面を必ず作る
 *   ・山も木も家も、地面に**影を落とす**。それだけで厚みが出る
 *   ・同じ地形でも位置ごとに少しずつ形を変える（並ぶと壁紙に見えるため）
 *
 * マスの座標を種にして形を決めるので、何度描いても同じ丘が同じ場所に立つ。
 */

/** マスの座標から決まる 0..1 の値。並べたときに規則が見えない程度にばらす。 */
function noise(x: number, y: number, salt = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// ---------------------------------------------------------------- 地面

/**
 * マスの下地。
 * 平らな色で塗るだけだと紙のように見えるので、まだらを混ぜて土の粒を作る。
 */
function ground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  base: string,
  gx: number,
  gy: number,
): void {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, size, size);

  // 土や草のむら
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 3; i++) {
    const nx = x + noise(gx, gy, i) * size;
    const ny = y + noise(gx, gy, i + 10) * size;
    const r = size * (0.1 + noise(gx, gy, i + 20) * 0.16);
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 草。地面から生える短い線を数本。 */
function grass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.045);
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const bx = x + (0.15 + noise(gx, gy, i + 30) * 0.7) * size;
    const by = y + (0.55 + noise(gx, gy, i + 40) * 0.4) * size;
    const lean = (noise(gx, gy, i + 50) - 0.5) * size * 0.18;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + lean, by - size * 0.2);
    ctx.stroke();
  }
}

/** 影。地に落ちる楕円。これがあるだけで物が浮かなくなる。 */
function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- 地物

/** 山。三角の稜線と、光の当たる面・陰る面、そして雪。 */
function mountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
  snow: boolean,
): void {
  const cx = x + size / 2;
  const base = y + size * 0.9;
  const h = size * (0.72 + noise(gx, gy, 3) * 0.2);
  const w = size * 0.46;

  shadow(ctx, cx + size * 0.06, base, w * 0.95, size * 0.08);

  // 陰る側（右）
  ctx.fillStyle = '#4a4450';
  ctx.beginPath();
  ctx.moveTo(cx, base - h);
  ctx.lineTo(cx + w, base);
  ctx.lineTo(cx - w * 0.2, base);
  ctx.closePath();
  ctx.fill();

  // 光の当たる側（左）
  ctx.fillStyle = '#6d6570';
  ctx.beginPath();
  ctx.moveTo(cx, base - h);
  ctx.lineTo(cx - w, base);
  ctx.lineTo(cx - w * 0.2, base);
  ctx.closePath();
  ctx.fill();

  if (snow) {
    ctx.fillStyle = '#e8eef2';
    ctx.beginPath();
    ctx.moveTo(cx, base - h);
    ctx.lineTo(cx + w * 0.3, base - h * 0.68);
    ctx.lineTo(cx + w * 0.1, base - h * 0.72);
    ctx.lineTo(cx - w * 0.12, base - h * 0.62);
    ctx.lineTo(cx - w * 0.3, base - h * 0.7);
    ctx.closePath();
    ctx.fill();
  }
}

/** 丘。低く丸い盛り上がり。 */
function hill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
): void {
  const cx = x + size / 2;
  const base = y + size * 0.82;
  const w = size * (0.36 + noise(gx, gy, 5) * 0.1);

  shadow(ctx, cx + size * 0.05, base, w, size * 0.07);

  ctx.fillStyle = '#6b6144';
  ctx.beginPath();
  ctx.ellipse(cx, base, w, size * 0.3, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // 陽の当たる肩
  ctx.fillStyle = '#8a7d58';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.28, base - size * 0.04, w * 0.55, size * 0.2, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

/** 木。幹と、二段の葉。 */
function tree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
): void {
  const cx = x + size * (0.35 + noise(gx, gy, 7) * 0.3);
  const base = y + size * (0.82 + noise(gx, gy, 8) * 0.08);
  const h = size * (0.6 + noise(gx, gy, 9) * 0.2);

  shadow(ctx, cx + size * 0.08, base, size * 0.2, size * 0.06);

  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = size * 0.09;
  ctx.beginPath();
  ctx.moveTo(cx, base);
  ctx.lineTo(cx, base - h * 0.45);
  ctx.stroke();

  for (const [ty, tw, shade] of [
    [0.45, 0.3, '#2f5230'],
    [0.72, 0.22, '#3f6b3c'],
  ] as [number, number, string][]) {
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(cx, base - h * (ty + 0.32));
    ctx.lineTo(cx + size * tw, base - h * ty);
    ctx.lineTo(cx - size * tw, base - h * ty);
    ctx.closePath();
    ctx.fill();
  }
}

/** 水。帯を重ねて流れを作る。 */
function water(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
  deep: boolean,
): void {
  ctx.fillStyle = deep ? '#1b4068' : '#2b5b8f';
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = deep ? 'rgba(150,200,240,0.22)' : 'rgba(190,225,255,0.3)';
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const wy = y + size * (0.3 + i * 0.34 + noise(gx, gy, i + 60) * 0.12);
    const wx = x + size * (0.12 + noise(gx, gy, i + 70) * 0.3);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + size * 0.2, wy - size * 0.08, wx + size * 0.42, wy);
    ctx.stroke();
  }
}

/** 街道。轍の二本線。 */
function road(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.strokeStyle = 'rgba(90,72,44,0.5)';
  ctx.lineWidth = Math.max(1, size * 0.06);
  for (const t of [0.36, 0.64]) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * t);
    ctx.lineTo(x + size, y + size * t);
    ctx.stroke();
  }
}

/** 城市。城壁と楼閣。 */
function castle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const cx = x + size / 2;
  const base = y + size * 0.88;

  shadow(ctx, cx + size * 0.05, base, size * 0.4, size * 0.08);

  // 壁
  ctx.fillStyle = '#8d8272';
  ctx.fillRect(cx - size * 0.36, base - size * 0.34, size * 0.72, size * 0.34);
  ctx.fillStyle = '#6f6656';
  ctx.fillRect(cx + size * 0.12, base - size * 0.34, size * 0.24, size * 0.34);
  // 狭間
  ctx.fillStyle = '#a49881';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(cx - size * 0.36 + i * size * 0.19, base - size * 0.42, size * 0.11, size * 0.09);
  }
  // 楼
  ctx.fillStyle = '#7d3b3b';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3, base - size * 0.44);
  ctx.lineTo(cx, base - size * 0.72);
  ctx.lineTo(cx + size * 0.3, base - size * 0.44);
  ctx.closePath();
  ctx.fill();
  // 門
  ctx.fillStyle = '#3a2c1e';
  ctx.fillRect(cx - size * 0.09, base - size * 0.2, size * 0.18, size * 0.2);
}

/** 関所。柵と旗。 */
function pass(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const cx = x + size / 2;
  const base = y + size * 0.86;

  shadow(ctx, cx, base, size * 0.32, size * 0.07);

  ctx.strokeStyle = '#5a4a38';
  ctx.lineWidth = size * 0.09;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.26, base);
  ctx.lineTo(cx - size * 0.26, base - size * 0.5);
  ctx.moveTo(cx + size * 0.26, base);
  ctx.lineTo(cx + size * 0.26, base - size * 0.5);
  ctx.stroke();
  ctx.lineWidth = size * 0.07;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.36, base - size * 0.46);
  ctx.lineTo(cx + size * 0.36, base - size * 0.46);
  ctx.stroke();

  ctx.fillStyle = '#b8434a';
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.26, base - size * 0.5);
  ctx.lineTo(cx + size * 0.52, base - size * 0.42);
  ctx.lineTo(cx + size * 0.26, base - size * 0.34);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------- 世界地図

/**
 * 世界地図の一マス。
 * ch は data/world/terrain.ts の一文字。
 */
export function drawWorldTile(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
): void {
  switch (ch) {
    case '^':
      ground(ctx, x, y, size, '#5a5350', gx, gy);
      mountain(ctx, x, y, size, gx, gy, true);
      return;
    case 'v':
      ground(ctx, x, y, size, '#6b6144', gx, gy);
      hill(ctx, x, y, size, gx, gy);
      return;
    case 'T':
      ground(ctx, x, y, size, '#3c5c33', gx, gy);
      tree(ctx, x, y, size, gx, gy);
      return;
    case '~':
      water(ctx, x, y, size, gx, gy, false);
      return;
    case '=':
      water(ctx, x, y, size, gx, gy, true);
      return;
    case 'B':
      water(ctx, x, y, size, gx, gy, false);
      // 渡しの板
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(x + size * 0.1, y + size * 0.42, size * 0.8, size * 0.16);
      return;
    case ':':
      ground(ctx, x, y, size, '#8f8156', gx, gy);
      return;
    case '"':
      ground(ctx, x, y, size, '#5d7a41', gx, gy);
      grass(ctx, x, y, size, gx, gy, 'rgba(150,190,110,0.75)');
      return;
    case ',':
      ground(ctx, x, y, size, '#8a7a52', gx, gy);
      road(ctx, x, y, size);
      return;
    case 'C':
      ground(ctx, x, y, size, '#7c7360', gx, gy);
      castle(ctx, x, y, size);
      return;
    case 'G':
      ground(ctx, x, y, size, '#6e6459', gx, gy);
      pass(ctx, x, y, size);
      return;
    default:
      ground(ctx, x, y, size, '#4c6b3c', gx, gy);
      if (noise(gx, gy, 90) > 0.72) grass(ctx, x, y, size, gx, gy, 'rgba(130,170,95,0.6)');
  }
}

// ---------------------------------------------------------------- 町

/** 町の家。瓦屋根と壁と、光の当たる面。 */
function house(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, gx: number, gy: number): void {
  const cx = x + size / 2;
  const base = y + size * 0.94;
  const w = size * 0.42;

  shadow(ctx, cx + size * 0.05, base, w * 1.05, size * 0.07);

  // 壁
  ctx.fillStyle = '#c9b493';
  ctx.fillRect(cx - w, base - size * 0.46, w * 2, size * 0.46);
  // 陰る側
  ctx.fillStyle = '#a28f72';
  ctx.fillRect(cx + w * 0.35, base - size * 0.46, w * 0.65, size * 0.46);

  // 瓦屋根。反りをつける
  ctx.fillStyle = '#6d4a48';
  ctx.beginPath();
  ctx.moveTo(cx - w * 1.28, base - size * 0.44);
  ctx.quadraticCurveTo(cx - w * 0.5, base - size * 0.78, cx, base - size * 0.8);
  ctx.quadraticCurveTo(cx + w * 0.5, base - size * 0.78, cx + w * 1.28, base - size * 0.44);
  ctx.closePath();
  ctx.fill();
  // 棟の照り
  ctx.fillStyle = '#8a5f5c';
  ctx.beginPath();
  ctx.moveTo(cx - w * 1.28, base - size * 0.44);
  ctx.quadraticCurveTo(cx - w * 0.5, base - size * 0.78, cx, base - size * 0.8);
  ctx.lineTo(cx, base - size * 0.72);
  ctx.quadraticCurveTo(cx - w * 0.5, base - size * 0.7, cx - w * 1.1, base - size * 0.42);
  ctx.closePath();
  ctx.fill();

  // 戸と窓
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(cx - w * 0.24, base - size * 0.28, w * 0.48, size * 0.28);
  if (noise(gx, gy, 11) > 0.5) {
    ctx.fillStyle = '#e8c98a';
    ctx.fillRect(cx - w * 0.72, base - size * 0.36, w * 0.3, size * 0.12);
  }
}

/** 町の一マス。 */
export function drawTownTile(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  size: number,
  gx: number,
  gy: number,
): void {
  switch (ch) {
    case 'H':
      ground(ctx, x, y, size, '#6a6152', gx, gy);
      house(ctx, x, y, size, gx, gy);
      return;
    case 'T':
      ground(ctx, x, y, size, '#4a5a3a', gx, gy);
      tree(ctx, x, y, size, gx, gy);
      return;
    case '^':
      ground(ctx, x, y, size, '#5a5350', gx, gy);
      mountain(ctx, x, y, size, gx, gy, false);
      return;
    case '~':
      water(ctx, x, y, size, gx, gy, false);
      return;
    case '#':
      // 塀。瓦を載せた土塀
      ground(ctx, x, y, size, '#3b352c', gx, gy);
      ctx.fillStyle = '#7a6f5c';
      ctx.fillRect(x, y + size * 0.28, size, size * 0.6);
      ctx.fillStyle = '#5d5445';
      ctx.fillRect(x, y + size * 0.6, size, size * 0.28);
      ctx.fillStyle = '#6d4a48';
      ctx.fillRect(x, y + size * 0.2, size, size * 0.12);
      return;
    case 'D':
      ground(ctx, x, y, size, '#8a8272', gx, gy);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
      return;
    case 'f':
      ground(ctx, x, y, size, '#5d7a41', gx, gy);
      // 花
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = ['#e59ec0', '#e8d68a', '#c9a2e0'][i]!;
        ctx.beginPath();
        ctx.arc(
          x + (0.25 + noise(gx, gy, i + 80) * 0.5) * size,
          y + (0.4 + noise(gx, gy, i + 85) * 0.4) * size,
          size * 0.09,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      return;
    case ',':
      // 石畳
      ground(ctx, x, y, size, '#8a8272', gx, gy);
      ctx.strokeStyle = 'rgba(60,54,44,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      return;
    default:
      ground(ctx, x, y, size, '#6a6152', gx, gy);
  }
}

// ---------------------------------------------------------------- 地物（単体）

/** 賊の天幕。強いほど大きく、旗が濃くなる。 */
export function drawCamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  size: number,
  strength: number,
  flag: string,
): void {
  const w = size * (0.34 + strength * 0.04);
  shadow(ctx, cx + size * 0.05, base, w * 1.15, size * 0.07);

  // 天幕。稜線で明暗を割る
  ctx.fillStyle = '#6a5236';
  ctx.beginPath();
  ctx.moveTo(cx, base - size * 0.72);
  ctx.lineTo(cx + w, base);
  ctx.lineTo(cx, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a6f49';
  ctx.beginPath();
  ctx.moveTo(cx, base - size * 0.72);
  ctx.lineTo(cx - w, base);
  ctx.lineTo(cx, base);
  ctx.closePath();
  ctx.fill();

  // 入口
  ctx.fillStyle = '#2e2419';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.24, base);
  ctx.lineTo(cx, base - size * 0.34);
  ctx.lineTo(cx + w * 0.24, base);
  ctx.closePath();
  ctx.fill();

  // 旗
  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.moveTo(cx, base - size * 0.72);
  ctx.lineTo(cx, base - size * 1.0);
  ctx.stroke();
  ctx.fillStyle = flag;
  ctx.beginPath();
  ctx.moveTo(cx, base - size * 1.0);
  ctx.lineTo(cx + size * 0.3, base - size * 0.92);
  ctx.lineTo(cx, base - size * 0.84);
  ctx.closePath();
  ctx.fill();
}

/** 町の施設の看板。中身は呼び出し側が字で添える。 */
export function drawSignboard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  size: number,
  tint: string,
): void {
  shadow(ctx, cx, base, size * 0.3, size * 0.06);
  // 幟
  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = size * 0.07;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.26, base);
  ctx.lineTo(cx - size * 0.26, base - size * 0.86);
  ctx.stroke();
  ctx.fillStyle = tint;
  ctx.fillRect(cx - size * 0.22, base - size * 0.84, size * 0.44, size * 0.56);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - size * 0.22, base - size * 0.84, size * 0.44, size * 0.56);
}

// ---------------------------------------------------------------- 戦場

/** 戦場の下地。どこで戦っているかで、地面も空も変わる。 */
export interface FieldLook {
  /** 遠くの空。 */
  sky: [string, string];
  /** 手前の地面。 */
  soil: [string, string];
  /** 地平に並べる遠景。 */
  horizon: 'mountain' | 'forest' | 'water' | 'dune' | 'wall' | 'none';
  /** 地面に散らす草の色。無ければ生やさない。 */
  scatter?: string;
}

/**
 * 地形の一文字から戦場の見え方を決める。
 * 世界地図で立っていたマスがそのまま渡ってくるので、
 * 赤壁は水辺で、剣閣は山あいで、街道の遭遇戦は土の上で戦うことになる。
 */
export function fieldLook(ch: string): FieldLook {
  switch (ch) {
    case '~':
    case 'B':
      return { sky: ['#2b3f52', '#4a5f6b'], soil: ['#3d4a44', '#243029'], horizon: 'water' };
    case '=':
      return { sky: ['#233648', '#3f5866'], soil: ['#37453f', '#1f2a25'], horizon: 'water' };
    case 'T':
      return { sky: ['#2a3324', '#3f4a33'], soil: ['#2f3a26', '#1b2318'], horizon: 'forest', scatter: 'rgba(120,160,90,0.5)' };
    case '^':
    case 'v':
      return { sky: ['#33303a', '#4b4650'], soil: ['#3d3a33', '#242219'], horizon: 'mountain' };
    case ':':
      return { sky: ['#4a4030', '#6b5c40'], soil: ['#6b5f42', '#453c28'], horizon: 'dune' };
    case 'C':
    case 'G':
      return { sky: ['#2e2a2c', '#443c38'], soil: ['#4a443a', '#2a2620'], horizon: 'wall' };
    case '"':
      return { sky: ['#2b3524', '#465132'], soil: ['#3a4a2c', '#222c1a'], horizon: 'none', scatter: 'rgba(150,190,110,0.55)' };
    default:
      return { sky: ['#2a2f24', '#414734'], soil: ['#38402c', '#20261a'], horizon: 'none', scatter: 'rgba(140,175,100,0.45)' };
  }
}

/**
 * 戦場を描く。
 * 上を空、下を地面にし、境目に遠景を並べる。
 * 盤の上ではなく、どこかの土地の上で戦っている感じを出すための下地。
 */
export function drawBattlefield(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
): void {
  const look = fieldLook(ch);
  const horizonY = y + h * 0.28;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // 空
  const sky = ctx.createLinearGradient(0, y, 0, horizonY);
  sky.addColorStop(0, look.sky[0]);
  sky.addColorStop(1, look.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, horizonY - y);

  // 地面
  const soil = ctx.createLinearGradient(0, horizonY, 0, y + h);
  soil.addColorStop(0, look.soil[0]);
  soil.addColorStop(1, look.soil[1]);
  ctx.fillStyle = soil;
  ctx.fillRect(x, horizonY, w, y + h - horizonY);

  // 遠景
  switch (look.horizon) {
    case 'mountain':
      ctx.fillStyle = 'rgba(40,38,46,0.85)';
      for (let i = -1; i < 7; i++) {
        const mx = x + i * (w / 6) + ((i * 37) % 20);
        const mh = h * (0.1 + ((i * 53) % 10) / 100);
        ctx.beginPath();
        ctx.moveTo(mx, horizonY);
        ctx.lineTo(mx + w / 12, horizonY - mh);
        ctx.lineTo(mx + w / 6, horizonY);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'forest':
      ctx.fillStyle = 'rgba(28,42,26,0.9)';
      for (let i = 0; i < 26; i++) {
        const tx = x + (i / 25) * w;
        const th = h * (0.06 + ((i * 29) % 7) / 120);
        ctx.beginPath();
        ctx.moveTo(tx - 7, horizonY);
        ctx.lineTo(tx, horizonY - th);
        ctx.lineTo(tx + 7, horizonY);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'water': {
      // 対岸と、揺れる水面
      ctx.fillStyle = 'rgba(30,44,52,0.9)';
      ctx.fillRect(x, horizonY - h * 0.05, w, h * 0.05);
      ctx.strokeStyle = 'rgba(150,195,225,0.22)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const wy = horizonY + h * (0.04 + i * 0.045);
        ctx.beginPath();
        for (let px = x; px < x + w; px += 18) {
          ctx.moveTo(px, wy + Math.sin((px + time / 12 + i * 30) / 26) * 2);
          ctx.lineTo(px + 10, wy + Math.sin((px + 10 + time / 12 + i * 30) / 26) * 2);
        }
        ctx.stroke();
      }
      break;
    }
    case 'dune':
      ctx.fillStyle = 'rgba(90,78,54,0.75)';
      for (let i = -1; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(x + i * (w / 4) + 40, horizonY + 4, w / 5, h * 0.06, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'wall':
      ctx.fillStyle = 'rgba(58,52,44,0.95)';
      ctx.fillRect(x, horizonY - h * 0.09, w, h * 0.09);
      ctx.fillStyle = 'rgba(78,70,58,0.95)';
      for (let i = 0; i < 22; i++) {
        ctx.fillRect(x + i * (w / 21), horizonY - h * 0.12, w / 42, h * 0.03);
      }
      break;
    default:
      break;
  }

  // 地面の草や小石。奥ほど小さく、手前ほど大きい
  if (look.scatter) {
    ctx.strokeStyle = look.scatter;
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const t = ((i * 17) % 100) / 100;
      const gy = horizonY + t * t * (y + h - horizonY);
      const gx = x + (((i * 53) % 100) / 100) * w;
      const size = 2 + t * 5;
      ctx.lineWidth = 1 + t;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + size * 0.3, gy - size);
      ctx.stroke();
    }
  }

  ctx.restore();
}
