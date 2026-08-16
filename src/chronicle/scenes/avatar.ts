/**
 * 地図と町を歩く人。
 *
 * 絵文字は向きを持たず、光も当たらず、歩きもしない。
 * 一枚の記号でしかないので、どちらを向いているのかも分からない。
 *
 * ここでは同じ canvas の線と面で組み直す。
 *   ・上下左右の四方に向く
 *   ・一歩ごとに脚と腕が入れ替わる
 *   ・胴と頭に光の当たる側と陰る側を作って、厚みを出す
 *   ・足元に落ちる影で、地面に立っていることを示す
 *
 * 衣の色は所属の旗から取る。誰の旗の下にいるかが、そのまま身なりになる。
 */

import type { Dir } from '../types';

export interface AvatarView {
  /** 足元の位置。 */
  x: number;
  y: number;
  /** 背丈。タイルの大きさに合わせる。 */
  height: number;
  dir: Dir;
  /** 歩いている度合い 0〜1。一歩のあいだに 0→1 と進む。 */
  step: number;
  walking: boolean;
  /** 衣の色。勢力の旗から。 */
  robe: string;
  /** 笠をかぶるか。旅装の目印。 */
  hat?: boolean;
  /**
   * 人ごとの見分け。武将IDなどを渡すと、背丈・髪・髭・冠が決まる。
   * 同じ姿が並ぶと、町が人形の陳列になってしまう。
   */
  seed?: string;
  /** 役柄。冠り物と体つきが変わる。 */
  role?: string;
}

/** 文字列から決まる 0..1。同じ人は何度描いても同じ姿になる。 */
function seeded(text: string, salt: number): number {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 1000) / 1000;
}

/** 冠り物。役柄で決まる。 */
type Headwear = 'none' | 'cap' | 'crown' | 'scarf' | 'helmet';

function headwearOf(role: string | undefined): Headwear {
  switch (role) {
    case 'ruler':
    case 'warlord':
      return 'crown';
    case 'strategist':
    case 'advisor':
    case 'civil_official':
      return 'cap';
    case 'yellowturban_leader':
    case 'yellowturban_captain':
    case 'yellowturban_mob':
      return 'scarf';
    case 'fierce_general':
    case 'veteran_general':
    case 'general':
    case 'officer':
      return 'helmet';
    default:
      return 'none';
  }
}

/** 明るい側と暗い側を作る。厚みはこの差から出る。 */
function shade(color: string, amount: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());
  if (!m) return color;
  const mix = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))));
  const [r, g, b] = [
    mix(Number.parseInt(m[1]!, 16)),
    mix(Number.parseInt(m[2]!, 16)),
    mix(Number.parseInt(m[3]!, 16)),
  ];
  return `rgb(${r},${g},${b})`;
}

const SKIN = '#e9c49c';
const SKIN_DARK = '#c99a72';
const HAIR = '#241d22';

/**
 * 人ひとりを描く。
 * x,y は足元。そこから上へ組み上げる。
 */
export function drawAvatar(ctx: CanvasRenderingContext2D, v: AvatarView): void {
  // 背丈と肩幅を人ごとに少しずらす。並んだときに同じ人形に見えないように
  const vary = v.seed ? seeded(v.seed, 1) : 0.5;
  const girth = v.seed ? seeded(v.seed, 2) : 0.5;
  const h = v.height * (0.9 + vary * 0.2);
  const w = h * (0.46 + girth * 0.12);
  const dir = v.dir;
  const side = dir === 'left' ? -1 : 1;
  const facingUp = dir === 'up';
  const profile = dir === 'left' || dir === 'right';

  // 歩調。一歩のあいだに脚が一度入れ替わる
  const swing = v.walking ? Math.sin(v.step * Math.PI * 2) : 0;
  // 踏み出すたびに重心が沈む
  const bounce = v.walking ? -Math.abs(Math.sin(v.step * Math.PI)) * h * 0.06 : 0;

  const light = shade(v.robe, 0.34);
  const dark = shade(v.robe, -0.4);

  ctx.save();
  ctx.translate(v.x, v.y);

  // 影。歩くたびに少し縮む
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.52 - Math.abs(bounce) * 0.3, h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bounce);

  // ---- 脚。前後に振る
  ctx.strokeStyle = '#2f2a33';
  ctx.lineWidth = h * 0.1;
  ctx.lineCap = 'round';
  for (const [phase, ox] of [
    [1, -0.13],
    [-1, 0.13],
  ] as [number, number][]) {
    const reach = profile ? swing * phase * h * 0.17 : 0;
    const lift = profile ? 0 : Math.max(0, swing * phase) * h * 0.07;
    ctx.beginPath();
    ctx.moveTo(ox * w, -h * 0.3);
    ctx.lineTo(ox * w + reach, -lift);
    ctx.stroke();
  }

  // ---- 胴。裾に向かって広がる衣。左右で明暗を分けて厚みを出す
  const bodyTop = -h * 0.76;
  const bodyBottom = -h * 0.2;
  const grad = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
  if (side > 0) {
    grad.addColorStop(0, light);
    grad.addColorStop(0.55, v.robe);
    grad.addColorStop(1, dark);
  } else {
    grad.addColorStop(0, dark);
    grad.addColorStop(0.45, v.robe);
    grad.addColorStop(1, light);
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, bodyTop);
  ctx.lineTo(w * 0.3, bodyTop);
  ctx.lineTo(w * 0.46, bodyBottom);
  ctx.lineTo(-w * 0.46, bodyBottom);
  ctx.closePath();
  ctx.fill();

  // 打ち合わせの線。正面から見たときだけ入れる
  if (!profile) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = h * 0.03;
    ctx.beginPath();
    ctx.moveTo(0, bodyTop + h * 0.02);
    ctx.lineTo(facingUp ? 0 : w * 0.06, bodyBottom);
    ctx.stroke();
  }

  // 帯
  ctx.fillStyle = dark;
  ctx.fillRect(-w * 0.42, bodyBottom - h * 0.09, w * 0.84, h * 0.06);

  // ---- 腕。脚と逆に振る
  ctx.strokeStyle = v.robe;
  ctx.lineWidth = h * 0.085;
  for (const [phase, ox] of [
    [-1, -0.34],
    [1, 0.34],
  ] as [number, number][]) {
    const reach = profile ? swing * phase * h * 0.13 : 0;
    ctx.beginPath();
    ctx.moveTo(ox * w, bodyTop + h * 0.06);
    ctx.lineTo(ox * w + reach, bodyBottom + h * 0.02);
    ctx.stroke();
  }

  // ---- 首と頭
  const headR = h * 0.17;
  const headY = bodyTop - headR * 0.72;

  ctx.strokeStyle = SKIN_DARK;
  ctx.lineWidth = h * 0.07;
  ctx.beginPath();
  ctx.moveTo(0, bodyTop);
  ctx.lineTo(0, bodyTop - h * 0.05);
  ctx.stroke();

  // 頭は球。光の当たる側を明るく置いて丸みを出す
  const headGrad = ctx.createRadialGradient(
    -side * headR * 0.35,
    headY - headR * 0.35,
    headR * 0.15,
    0,
    headY,
    headR * 1.15,
  );
  headGrad.addColorStop(0, '#f6dcbd');
  headGrad.addColorStop(0.6, SKIN);
  headGrad.addColorStop(1, SKIN_DARK);
  ctx.fillStyle = facingUp ? HAIR : headGrad;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // 髪。後ろ向きなら頭がまるごと髪になる
  if (!facingUp) {
    // 白髪まじりの者もいる
    const grey = v.seed ? seeded(v.seed, 5) : 0;
    ctx.fillStyle = grey > 0.82 ? '#8f8a86' : grey > 0.7 ? '#4a4038' : HAIR;
    ctx.beginPath();
    ctx.arc(0, headY, headR, Math.PI, Math.PI * 2);
    ctx.fill();
    // 横顔のときは後頭部を覆う
    if (profile) {
      ctx.beginPath();
      ctx.arc(-side * headR * 0.32, headY, headR * 0.86, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 目。正面と横顔だけ
  if (!facingUp) {
    ctx.fillStyle = '#2a2028';
    const eyes: number[] = profile ? [side * headR * 0.38] : [-headR * 0.34, headR * 0.34];
    for (const ex of eyes) {
      ctx.beginPath();
      ctx.ellipse(ex, headY + headR * 0.12, headR * 0.1, headR * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- 髭。三国志の顔は髭で見分ける
  const beard = v.seed ? seeded(v.seed, 7) : 0;
  if (!facingUp && beard > 0.45) {
    ctx.fillStyle = beard > 0.9 ? '#6f6a66' : '#2f2620';
    const long = beard > 0.75;
    ctx.beginPath();
    if (profile) {
      ctx.ellipse(side * headR * 0.3, headY + headR * (long ? 0.85 : 0.6), headR * 0.34, headR * (long ? 0.8 : 0.42), 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, headY + headR * (long ? 0.85 : 0.62), headR * 0.42, headR * (long ? 0.8 : 0.4), 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // ---- 冠り物。役柄で変わる
  const wear = headwearOf(v.role);
  if (v.hat === false && wear !== 'none') {
    const topY = headY - headR * 0.82;
    switch (wear) {
      case 'crown':
        // 冠。板と垂れ玉
        ctx.fillStyle = '#20242c';
        ctx.fillRect(-headR * 1.05, topY - headR * 0.18, headR * 2.1, headR * 0.3);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(-headR * 0.9, topY + headR * 0.1, headR * 1.8, headR * 0.16);
        break;
      case 'cap':
        // 進賢冠。前が低く後ろが高い
        ctx.fillStyle = '#2b2f38';
        ctx.beginPath();
        ctx.moveTo(-headR * 0.85, headY - headR * 0.55);
        ctx.lineTo(headR * 0.85, headY - headR * 0.55);
        ctx.lineTo(headR * 0.5, topY - headR * 0.25);
        ctx.lineTo(-headR * 0.5, topY - headR * 0.25);
        ctx.closePath();
        ctx.fill();
        break;
      case 'scarf':
        // 黄色い頭巾
        ctx.fillStyle = '#d0b24f';
        ctx.beginPath();
        ctx.arc(0, headY - headR * 0.12, headR * 1.02, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-headR, headY - headR * 0.2, headR * 2, headR * 0.28);
        break;
      case 'helmet':
        ctx.fillStyle = '#4a4650';
        ctx.beginPath();
        ctx.arc(0, headY - headR * 0.05, headR * 1.05, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b8434a';
        ctx.lineWidth = headR * 0.22;
        ctx.beginPath();
        ctx.moveTo(0, headY - headR * 1.0);
        ctx.lineTo(0, headY - headR * 1.5);
        ctx.stroke();
        break;
      default:
        break;
    }
  }

  // ---- 笠。旅装。つばで顔に影が落ちる
  if (v.hat !== false) {
    const brim = headR * 1.2;
    const hatY = headY - headR * 0.5;
    const hatGrad = ctx.createLinearGradient(-brim, hatY, brim, hatY);
    hatGrad.addColorStop(0, '#c9a86a');
    hatGrad.addColorStop(side > 0 ? 0.5 : 0.4, '#a9884c');
    hatGrad.addColorStop(1, '#7d6134');
    ctx.fillStyle = hatGrad;
    ctx.beginPath();
    ctx.ellipse(0, hatY, brim, headR * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // 山の部分
    ctx.beginPath();
    ctx.ellipse(0, hatY - headR * 0.2, headR * 0.62, headR * 0.34, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // つばの下の影
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, hatY + headR * 0.12, brim * 0.8, headR * 0.12, 0, 0, Math.PI);
    ctx.fill();
  }

  ctx.restore();
}
