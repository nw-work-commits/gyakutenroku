/** シーンスタック。フィールドの上にメニュー、その上に戦闘…と積み重ねて管理する。 */

import type { Input } from './input';

export interface Scene {
  onEnter?(): void;
  onExit?(): void;
  /** 再び最前面に戻ってきたとき（上のシーンが pop された直後）。 */
  onResume?(): void;
  update(dt: number, input: Input): void;
  render(ctx: CanvasRenderingContext2D): void;
  /** true なら1つ下のシーンも描画する（メニューのオーバーレイ用）。 */
  transparent?: boolean;
}

type PendingOp =
  | { op: 'push'; scene: Scene }
  | { op: 'pop' }
  | { op: 'replace'; scene: Scene }
  | { op: 'reset'; scene: Scene };

const FADE_DURATION = 220;

export class SceneManager {
  private stack: Scene[] = [];
  private pending: PendingOp[] = [];

  /** 暗転演出の状態。0 = 透明、1 = 真っ暗。 */
  private fadeAmount = 0;
  private fadePhase: 'none' | 'out' | 'in' = 'none';
  private fadeAction: (() => void) | null = null;

  get current(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  get depth(): number {
    return this.stack.length;
  }

  /** 暗転中は入力を止めたい。 */
  get busy(): boolean {
    return this.fadePhase !== 'none';
  }

  push(scene: Scene): void {
    this.pending.push({ op: 'push', scene });
  }

  pop(): void {
    this.pending.push({ op: 'pop' });
  }

  replace(scene: Scene): void {
    this.pending.push({ op: 'replace', scene });
  }

  /** スタックを空にしてから積む。タイトルへ戻る・ゲーム開始時に使う。 */
  reset(scene: Scene): void {
    this.pending.push({ op: 'reset', scene });
  }

  /** 暗転 → action() → 明転。マップ移動やゲーム開始の切り替えに。 */
  fade(action: () => void): void {
    if (this.fadePhase !== 'none') {
      // 多重呼び出しは最後の行動で上書きする
      this.fadeAction = action;
      return;
    }
    this.fadePhase = 'out';
    this.fadeAction = action;
  }

  update(dt: number, input: Input): void {
    if (this.fadePhase === 'out') {
      this.fadeAmount = Math.min(1, this.fadeAmount + dt / FADE_DURATION);
      if (this.fadeAmount >= 1) {
        const action = this.fadeAction;
        this.fadeAction = null;
        this.fadePhase = 'in';
        action?.();
        this.applyPending();
        input.flush();
      }
      return;
    }

    if (this.fadePhase === 'in') {
      this.fadeAmount = Math.max(0, this.fadeAmount - dt / FADE_DURATION);
      if (this.fadeAmount <= 0) this.fadePhase = 'none';
      return;
    }

    this.current?.update(dt, input);
    this.applyPending();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // transparent なシーンが続く限り下へ辿り、下から順に描く
    let from = this.stack.length - 1;
    while (from > 0 && this.stack[from]?.transparent) from--;
    for (let i = from; i < this.stack.length; i++) this.stack[i]!.render(ctx);

    if (this.fadeAmount > 0) {
      ctx.save();
      ctx.globalAlpha = this.fadeAmount;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }

  private applyPending(): void {
    if (this.pending.length === 0) return;
    const ops = this.pending;
    this.pending = [];
    for (const item of ops) {
      switch (item.op) {
        case 'push':
          this.stack.push(item.scene);
          item.scene.onEnter?.();
          break;
        case 'pop': {
          const gone = this.stack.pop();
          gone?.onExit?.();
          this.current?.onResume?.();
          break;
        }
        case 'replace': {
          const gone = this.stack.pop();
          gone?.onExit?.();
          this.stack.push(item.scene);
          item.scene.onEnter?.();
          break;
        }
        case 'reset': {
          while (this.stack.length > 0) this.stack.pop()?.onExit?.();
          this.stack.push(item.scene);
          item.scene.onEnter?.();
          break;
        }
      }
    }
  }
}
