/**
 * 隊を「兵の集まり」として描く。
 *
 * 一隊を絵文字ひとつで表すと、盤の上の駒にしかならない。
 * 兵科の違いも、数の減りも、突っ込んだことも、絵から伝わらない。
 *
 * ここでは一隊を**十数体の小さな兵**として描く。
 *   ・数が減れば、立っている兵が減る
 *   ・歩兵は槍と盾で密に並び、騎馬は馬に乗って疎に散り、
 *     弓は後ろで弓を引き、暗殺部隊は輪郭が滲む
 *   ・突撃すれば前傾して踏み込み、討たれれば揺れて血が飛ぶ
 *
 * 素材ファイルを持たない方針なので、すべて線と円で組む。
 * 絵文字と違って大きさも色も向きも操れるから、こちらのほうが動かせる。
 */

/**
 * 一隊に立たせる兵の最大数と、ひとりの大きさ。
 * 兵科で変える。馬は場所を食うので数を減らし、弓は横一列に並べる。
 * ここを欲張ると、隊が生垣のように潰れて何も見えなくなる。
 */
const SHAPE: Record<string, { max: number; rows: number; scale: number; gap: number }> = {
  infantry: { max: 11, rows: 2, scale: 9, gap: 15 },
  rattan: { max: 11, rows: 2, scale: 9, gap: 15 },
  cavalry: { max: 5, rows: 1, scale: 11, gap: 0 },
  archer: { max: 7, rows: 1, scale: 9, gap: 0 },
};

const DEFAULT_SHAPE = SHAPE.infantry!;

/** 突撃で踏み込む距離。両軍の間合いより少し短く取り、陣の手前で噛み合わせる。 */
const CHARGE_REACH = 86;

function shapeOf(unitId: string) {
  return SHAPE[unitId] ?? DEFAULT_SHAPE;
}

export interface CompanyView {
  unitId: string;
  troops: number;
  maxTroops: number;
  /** 隊の中心。 */
  cx: number;
  cy: number;
  /** 横幅。ここに兵を並べる。 */
  width: number;
  /** 自分の隊か。向きと色が変わる。 */
  mine: boolean;
  /** 突撃で前に出ている量 -1〜1。 */
  lunge: number;
  /** 被弾の横揺れ。 */
  shake: number;
  /** 被弾の白光り 0〜1。 */
  flash: number;
  guarding: boolean;
  routed: boolean;
  /** 潰走してから消えるまで 0〜1。 */
  fade: number;
  /** 経過時間。歩調と息づかいに使う。 */
  time: number;
  /** 弓を引いている・斬りかかっている度合い 0〜1。 */
  acting: number;
}

interface Palette {
  cloth: string;
  metal: string;
  skin: string;
  accent: string;
}

const MINE: Palette = { cloth: '#3f6f52', metal: '#cfd6d8', skin: '#e8c39a', accent: '#8fe0b0' };
const FOE: Palette = { cloth: '#6f3a3f', metal: '#d8ccc4', skin: '#dcb08c', accent: '#e08a8a' };

/** 兵ひとりが表す人数。隊が満員のとき最大数になるように割る。 */
function figureCount(unitId: string, troops: number, maxTroops: number): number {
  if (troops <= 0) return 0;
  const ratio = maxTroops > 0 ? troops / maxTroops : 1;
  return Math.max(1, Math.round(shapeOf(unitId).max * Math.sqrt(Math.min(1, ratio))));
}

/**
 * 兵の立ち位置。
 * 種類ごとに並び方が違う。歩兵は密な二列、騎馬は疎な一列、弓は後ろ、暗殺は散開。
 */
function layout(unitId: string, n: number, width: number): { x: number; y: number }[] {
  const shape = shapeOf(unitId);
  const spots: { x: number; y: number }[] = [];
  const rows = Math.min(shape.rows, n);
  const perRow = Math.ceil(n / rows);

  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const count = Math.min(perRow, n - row * perRow);
    const step = count > 1 ? width / (count - 1) : 0;
    const x = count > 1 ? -width / 2 + step * col : 0;
    // 後列は少し下げ、半歩ずらして前列の隙間から覗かせる
    const y = row * shape.gap;
    const jitter = ((i * 17) % 5) - 2;
    spots.push({ x: x + (row % 2 ? step / 2 : 0) + jitter * 0.5, y });
  }
  return spots;
}

// ---------------------------------------------------------------- 兵ひとり

/** 立っている人の芯。頭と胴。 */
function drawBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  lean: number,
  pal: Palette,
): void {
  // 胴（前傾するぶんだけ上が前に出る）
  ctx.strokeStyle = pal.cloth;
  ctx.lineWidth = s * 0.36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + lean * s * 0.5, y - s * 0.9);
  ctx.stroke();

  // 頭
  ctx.fillStyle = pal.skin;
  ctx.beginPath();
  ctx.arc(x + lean * s * 0.62, y - s * 1.15, s * 0.26, 0, Math.PI * 2);
  ctx.fill();
}

function drawInfantry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  facing: number,
  lean: number,
  pal: Palette,
  guarding: boolean,
): void {
  // 槍。守備のときは寝かせて構える
  ctx.strokeStyle = pal.metal;
  ctx.lineWidth = s * 0.13;
  ctx.beginPath();
  if (guarding) {
    ctx.moveTo(x - facing * s * 0.5, y - s * 0.7);
    ctx.lineTo(x + facing * s * 1.1, y - s * 0.95);
  } else {
    ctx.moveTo(x + facing * s * 0.25, y - s * 1.9);
    ctx.lineTo(x + facing * s * 0.05, y - s * 0.1);
  }
  ctx.stroke();

  drawBody(ctx, x, y, s, lean, pal);

  // 盾
  ctx.fillStyle = pal.cloth;
  ctx.strokeStyle = pal.metal;
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.ellipse(x - facing * s * 0.42, y - s * 0.72, s * 0.3, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawCavalry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  facing: number,
  lean: number,
  pal: Palette,
  gallop: number,
): void {
  const bob = Math.sin(gallop) * s * 0.12;

  // 馬体
  ctx.fillStyle = '#5b4636';
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.45 + bob, s * 0.85, s * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // 首と頭
  ctx.strokeStyle = '#5b4636';
  ctx.lineWidth = s * 0.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + facing * s * 0.6, y - s * 0.55 + bob);
  ctx.lineTo(x + facing * s * 1.05, y - s * 0.95 + bob);
  ctx.stroke();

  // 脚。掛け足で前後に開く
  ctx.lineWidth = s * 0.12;
  const swing = Math.sin(gallop) * s * 0.35;
  for (const [ox, dir] of [
    [-0.5, 1],
    [0.5, -1],
  ] as [number, number][]) {
    ctx.beginPath();
    ctx.moveTo(x + ox * s, y - s * 0.3 + bob);
    ctx.lineTo(x + ox * s + swing * dir, y + s * 0.12);
    ctx.stroke();
  }

  // 騎手
  drawBody(ctx, x - facing * s * 0.1, y - s * 0.75 + bob, s * 0.8, lean, pal);

  // 得物
  ctx.strokeStyle = pal.metal;
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.moveTo(x + facing * s * 0.3, y - s * 1.5 + bob);
  ctx.lineTo(x + facing * s * 0.95, y - s * 1.9 + bob);
  ctx.stroke();
}

function drawArcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  facing: number,
  lean: number,
  pal: Palette,
  draw: number,
): void {
  drawBody(ctx, x, y, s, lean * 0.4, pal);

  // 弓。引くほど弦がたわむ
  const bx = x + facing * s * 0.45;
  const by = y - s * 0.95;
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.arc(bx, by, s * 0.55, -Math.PI * 0.45 * facing + (facing > 0 ? 0 : Math.PI), Math.PI * 0.45 * facing + (facing > 0 ? 0 : Math.PI), facing < 0);
  ctx.stroke();

  // 弦と矢
  ctx.strokeStyle = pal.metal;
  ctx.lineWidth = s * 0.07;
  const pull = s * (0.15 + draw * 0.4);
  ctx.beginPath();
  ctx.moveTo(bx + facing * s * 0.02, by - s * 0.5);
  ctx.lineTo(bx - facing * pull, by);
  ctx.lineTo(bx + facing * s * 0.02, by + s * 0.5);
  ctx.stroke();

  if (draw > 0.15) {
    ctx.beginPath();
    ctx.moveTo(bx - facing * pull, by);
    ctx.lineTo(bx + facing * s * 0.7, by);
    ctx.stroke();
  }
}

function drawRattan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  facing: number,
  lean: number,
  pal: Palette,
): void {
  drawBody(ctx, x, y, s, lean, pal);
  // 藤で編んだ鎧。編み目を横線で
  ctx.strokeStyle = '#9a8244';
  ctx.lineWidth = s * 0.1;
  for (let i = 0; i < 3; i++) {
    const yy = y - s * (0.35 + i * 0.25);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.34, yy);
    ctx.lineTo(x + s * 0.34, yy);
    ctx.stroke();
  }
  ctx.strokeStyle = pal.metal;
  ctx.lineWidth = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(x + facing * s * 0.2, y - s * 1.7);
  ctx.lineTo(x + facing * s * 0.05, y - s * 0.2);
  ctx.stroke();
}

// ---------------------------------------------------------------- 一隊

/**
 * 一隊を描く。
 * 兵の数だけ人が立ち、兵科ごとに違う構えを取り、突撃すれば前傾する。
 */
export function drawCompany(ctx: CanvasRenderingContext2D, view: CompanyView): void {
  const n = figureCount(view.unitId, view.troops, view.maxTroops);
  if (n <= 0 && view.fade >= 1) return;

  const pal = view.mine ? MINE : FOE;
  const facing = view.mine ? 1 : -1;
  const s = shapeOf(view.unitId).scale;
  const spots = layout(view.unitId, Math.max(n, 1), view.width);

  /**
   * 突撃。lunge は 1 から 0 へ落ちるので、sin に通して「出て・当たって・戻る」にする。
   * 1 で自陣、0.5 で相手の陣、0 で戻ってきたところ。
   */
  const advance = view.lunge > 0 ? Math.sin((1 - view.lunge) * Math.PI) : 0;
  const forward = advance * CHARGE_REACH * (view.mine ? -1 : 1);
  const lean = advance * facing * 1.1;
  const shake = view.shake > 0 ? Math.sin(view.shake / 14) * (view.shake / 34) : 0;

  // 潰走した隊は背を向けて、自陣の後ろへ走り去る
  const flee = view.routed ? view.fade * 70 * (view.mine ? 1 : -1) : 0;
  const heading = view.routed ? -facing : facing;

  ctx.save();
  ctx.globalAlpha = view.routed ? Math.max(0, 1 - view.fade * 0.9) : 1;
  ctx.translate(view.cx + shake, view.cy + forward + flee);

  // 隊の影。地に足がついて見える
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 6, view.width * 0.42, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 駆けているあいだは砂塵が立つ
  if (advance > 0.05 || view.routed) {
    const dust = view.routed ? 0.5 : advance;
    ctx.fillStyle = `rgba(180,164,132,${0.16 * dust})`;
    for (let i = 0; i < 6; i++) {
      const px = (((i * 53) % 100) / 100 - 0.5) * view.width;
      const r = 5 + ((i * 31) % 9);
      ctx.beginPath();
      ctx.arc(px, 6 + ((i * 17) % 5), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 後列から描いて重なりを自然に
  const ordered = spots
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (view.mine ? a.p.y - b.p.y : b.p.y - a.p.y));

  for (const { p, i } of ordered) {
    // 息づかい。ひとりずつ位相をずらす
    const breath = Math.sin(view.time / 340 + i * 1.7) * 0.8;
    const x = p.x;
    const y = (view.mine ? -p.y : p.y) + breath;

    ctx.save();
    if (view.flash > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14 * view.flash;
    }
    // 潰走中は逃げ足に合わせて上下に跳ねる
    const flight = view.routed ? Math.abs(Math.sin(view.time / 70 + i)) * -4 : 0;
    switch (view.unitId) {
      case 'cavalry':
        drawCavalry(ctx, x, y + flight, s, heading, lean, pal, view.time / (view.lunge > 0 ? 45 : 90) + i);
        break;
      case 'archer':
        drawArcher(ctx, x, y + flight, s, heading, lean, pal, view.acting);
        break;
      case 'rattan':
        drawRattan(ctx, x, y + flight, s, heading, lean, pal);
        break;
      default:
        drawInfantry(ctx, x, y + flight, s, heading, lean, pal, view.guarding && view.lunge <= 0);
    }
    ctx.restore();
  }

  // 打たれた瞬間の血しぶき
  if (view.flash > 0.05) {
    ctx.fillStyle = `rgba(180,40,50,${view.flash * 0.8})`;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + view.time / 200;
      const r = (1 - view.flash) * 34 + 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.5 - 8, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
