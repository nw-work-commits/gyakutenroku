import './style.css';

import { ChronicleApp } from './chronicle/app';
import { ChronicleTitle } from './chronicle/scenes/title';
import { validateChronicleData } from './chronicle/validate';
import { audio } from './engine/audio';
import { SCREEN_H, SCREEN_W } from './engine/ui';

const canvas = document.getElementById('screen') as HTMLCanvasElement | null;
const touchPad = document.getElementById('touch') as HTMLElement | null;
if (!canvas || !touchPad) throw new Error('画面の要素が見つかりません');

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2Dコンテキストを 取得できません');

// 千人規模のデータは必ず壊れるので、開発時は起動のたびに全部なめる
if (import.meta.env.DEV) {
  for (const problem of validateChronicleData()) console.warn('[chronicle]', problem);
}

/** 高解像度ディスプレイでも文字がぼやけないように実解像度を上げる。 */
function resize(): void {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas!.width = Math.round(SCREEN_W * dpr);
  canvas!.height = Math.round(SCREEN_H * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx!.imageSmoothingEnabled = true;
}
resize();
window.addEventListener('resize', resize);

// 指で操作する端末ではソフトキーを出す
if (window.matchMedia('(pointer: coarse)').matches) touchPad.hidden = false;

const app = new ChronicleApp();
app.input.attach(canvas, touchPad);
app.returnToTitle = () => {
  app.scenes.fade(() => app.scenes.reset(new ChronicleTitle(app)));
};
app.scenes.push(new ChronicleTitle(app));

// 自動再生の制限があるので、最初の操作で音を起こす
const unlock = () => audio.unlock();
window.addEventListener('keydown', unlock, { once: true });
window.addEventListener('pointerdown', unlock, { once: true });

function tick(dt: number): void {
  app.input.update(dt);
  app.scenes.update(dt, app.input);
  app.scenes.render(ctx!);
}

let last = performance.now();

function frame(now: number): void {
  tick(Math.min(50, now - last));
  last = now;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// 開発時だけ、コンソールから状態を覗いたり手動でコマを進めたりできるようにする
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__rpg = {
    app,
    tick,
    /** ms ぶんを 16ms 刻みで進める。 */
    run: (ms: number) => {
      for (let t = 0; t < ms; t += 16) tick(16);
    },
    chronicle: () => import('./chronicle/dev'),
  };
}
