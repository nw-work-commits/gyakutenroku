/**
 * 一騎討ちの二騎を描く。
 *
 * この場面はゲームの見せ場なのに、これまで馬の絵文字が二つ並んでいるだけだった。
 * 誰が誰か分からず、打ち合っている感じもない。
 *
 * ここでは馬も人も得物も組み上げ、合わせるたびに踏み込ませる。
 *   ・打ち込む側は前傾して得物を振り下ろす
 *   ・受ける側は仰け反り、馬が前脚を上げる
 *   ・消耗すると背が丸まり、馬の首も落ちる
 */

export interface DuelistView {
  /** 足元。 */
  x: number;
  y: number;
  /** 背丈のもとになる寸法。 */
  scale: number;
  /** 右を向くか左を向くか。 */
  facing: 1 | -1;
  /** 衣の色。旗から取る。 */
  robe: string;
  /** 打ち込んでいる度合い 0〜1。 */
  striking: number;
  /** 打たれて仰け反っている度合い 0〜1。 */
  reeling: number;
  /** 残った気力 0〜1。減るほど構えが落ちる。 */
  vigor: number;
  time: number;
}

function shade(color: string, amount: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());
  if (!m) return color;
  const mix = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `rgb(${mix(Number.parseInt(m[1]!, 16))},${mix(Number.parseInt(m[2]!, 16))},${mix(Number.parseInt(m[3]!, 16))})`;
}

export function drawDuelist(ctx: CanvasRenderingContext2D, v: DuelistView): void {
  const s = v.scale;
  const f = v.facing;
  const light = shade(v.robe, 0.32);
  const dark = shade(v.robe, -0.42);

  // 息づかい。気力が減るほど大きく上下する
  const breath = Math.sin(v.time / (260 - v.vigor * 120)) * s * (0.02 + (1 - v.vigor) * 0.03);
  // 打たれると仰け反り、馬が跳ねる
  const rear = v.reeling * s * 0.18;
  const lean = v.striking * 0.8 - v.reeling * 0.6;
  // 疲れると前のめりに崩れる
  const droop = (1 - v.vigor) * 0.35;

  ctx.save();
  ctx.translate(v.x, v.y);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.95, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, breath - rear * 0.4);

  // ---- 馬
  const bodyY = -s * 0.78;

  // 後脚（奥・手前）。掛け足で前後に開く
  const gait = Math.sin(v.time / 150) * 0.5 + v.striking * 0.6;
  ctx.lineCap = 'round';
  for (const [ox, depth, phase] of [
    [-0.42, 0.55, 1],
    [-0.3, 1, -1],
    [0.34, 0.55, -1],
    [0.46, 1, 1],
  ] as [number, number, number][]) {
    ctx.strokeStyle = depth < 1 ? '#3a2d22' : '#54432f';
    ctx.lineWidth = s * 0.11 * depth;
    const front = ox > 0;
    const lift = front ? rear : 0;
    const swing = gait * phase * s * 0.16;
    ctx.beginPath();
    ctx.moveTo(f * ox * s, bodyY + s * 0.22);
    ctx.lineTo(f * (ox * s + swing) + (front ? f * lift * 0.6 : 0), -lift * (front ? 1 : 0));
    ctx.stroke();
  }

  // 胴。背は明るく腹は暗い
  const horse = ctx.createLinearGradient(0, bodyY - s * 0.28, 0, bodyY + s * 0.28);
  horse.addColorStop(0, '#8a6f57');
  horse.addColorStop(0.55, '#6b543f');
  horse.addColorStop(1, '#3f3227');
  ctx.fillStyle = horse;
  ctx.beginPath();
  ctx.ellipse(0, bodyY, s * 0.72, s * 0.27, 0, 0, Math.PI * 2);
  ctx.fill();

  // 尻
  ctx.beginPath();
  ctx.ellipse(-f * s * 0.6, bodyY - s * 0.02, s * 0.24, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // 尾
  ctx.strokeStyle = '#2f251c';
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(-f * s * 0.78, bodyY - s * 0.1);
  ctx.quadraticCurveTo(-f * s * 1.02, bodyY + s * 0.12, -f * s * 0.92, bodyY + s * 0.4);
  ctx.stroke();

  // 首。仰け反ると持ち上がる
  const neckTop = bodyY - s * (0.5 + rear / s * 0.8) + droop * s * 0.24;
  ctx.strokeStyle = '#6b543f';
  ctx.lineWidth = s * 0.22;
  ctx.beginPath();
  ctx.moveTo(f * s * 0.5, bodyY - s * 0.06);
  ctx.lineTo(f * s * 0.86, neckTop);
  ctx.stroke();

  // 鬣
  ctx.strokeStyle = '#2f251c';
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(f * s * 0.46, bodyY - s * 0.14);
  ctx.lineTo(f * s * 0.82, neckTop - s * 0.04);
  ctx.stroke();

  // 頭。面長にして耳をつける
  ctx.save();
  ctx.translate(f * s * 0.92, neckTop - s * 0.04);
  ctx.rotate(f * 0.5);
  ctx.fillStyle = '#7a6250';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.22, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f3227';
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.06);
  ctx.lineTo(-s * 0.14, -s * 0.18);
  ctx.lineTo(-s * 0.02, -s * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ---- 騎手
  const seat = bodyY - s * 0.22;
  const torso = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
  torso.addColorStop(0, f > 0 ? light : dark);
  torso.addColorStop(1, f > 0 ? dark : light);

  // 胴
  ctx.strokeStyle = torso as unknown as string;
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-f * s * 0.06, seat);
  ctx.lineTo(f * (lean * s * 0.3) - f * s * 0.02, seat - s * 0.56);
  ctx.lineWidth = s * 0.34;
  ctx.lineCap = 'round';
  ctx.strokeStyle = torso as unknown as string;
  ctx.stroke();

  // 肩当て
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(
    f * lean * s * 0.28,
    seat - s * 0.5,
    s * 0.25,
    s * 0.14,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // 頭と兜
  const headX = f * lean * s * 0.38;
  const headY = seat - s * 0.74;
  ctx.fillStyle = '#e9c49c';
  ctx.beginPath();
  ctx.arc(headX, headY, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a4650';
  ctx.beginPath();
  ctx.arc(headX, headY - s * 0.02, s * 0.165, Math.PI, Math.PI * 2);
  ctx.fill();
  // 兜の房
  ctx.strokeStyle = '#b8434a';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(headX, headY - s * 0.15);
  ctx.lineTo(headX - f * s * 0.06, headY - s * 0.3);
  ctx.stroke();

  // ---- 得物。打ち込むと振り下ろされる
  const swing = -0.9 + v.striking * 1.9 + droop * 0.4;
  ctx.save();
  ctx.translate(headX + f * s * 0.18, seat - s * 0.46);
  ctx.rotate(f * swing);
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(f * s * 0.9, 0);
  ctx.stroke();
  // 刃
  ctx.fillStyle = '#dfe6ea';
  ctx.beginPath();
  ctx.moveTo(f * s * 0.86, -s * 0.03);
  ctx.lineTo(f * s * 1.32, -s * 0.16);
  ctx.lineTo(f * s * 1.36, s * 0.02);
  ctx.lineTo(f * s * 0.86, s * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
