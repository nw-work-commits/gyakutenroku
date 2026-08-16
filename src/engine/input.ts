/** キーボードとタッチの入力を、6つの論理キーに正規化する。 */

export type GameKey = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel';

const KEY_MAP: Record<string, GameKey> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyZ: 'confirm',
  Enter: 'confirm',
  Space: 'confirm',
  KeyX: 'cancel',
  Escape: 'cancel',
  Backspace: 'cancel',
};

const DIRECTIONS: GameKey[] = ['up', 'down', 'left', 'right'];

/** 押しっぱなしでカーソルが動き出すまでの時間と、その後の間隔（ミリ秒）。 */
const REPEAT_DELAY = 320;
const REPEAT_INTERVAL = 90;

export class Input {
  private readonly held = new Set<GameKey>();
  private readonly repeatAt = new Map<GameKey, number>();
  /** 押しっぱなしのまま画面が切り替わったキー。離すまでリピートさせない。 */
  private readonly muted = new Set<GameKey>();
  private queue: GameKey[] = [];
  private elapsed = 0;

  attach(root: HTMLElement, touchPad: HTMLElement): void {
    window.addEventListener('keydown', (e) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      e.preventDefault();
      if (e.repeat) return; // リピートはこちらで作る（間隔を揃えるため）
      this.press(key);
    });

    window.addEventListener('keyup', (e) => {
      const key = KEY_MAP[e.code];
      if (key) this.release(key);
    });

    // フォーカスを失ったら押しっぱなし状態を解除する
    window.addEventListener('blur', () => this.releaseAll());

    for (const button of touchPad.querySelectorAll<HTMLButtonElement>('button[data-key]')) {
      const key = button.dataset.key as GameKey;
      const start = (e: Event) => {
        e.preventDefault();
        this.press(key);
      };
      const end = (e: Event) => {
        e.preventDefault();
        this.release(key);
      };
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('pointerleave', end);
      button.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // 画面タップ = 決定。読み進めるだけならこれで足りる。
    root.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.press('confirm');
      this.release('confirm');
    });
  }

  private press(key: GameKey): void {
    this.held.add(key);
    this.muted.delete(key);
    this.queue.push(key);
    if (DIRECTIONS.includes(key)) this.repeatAt.set(key, this.elapsed + REPEAT_DELAY);
  }

  private release(key: GameKey): void {
    this.held.delete(key);
    this.repeatAt.delete(key);
    this.muted.delete(key);
  }

  private releaseAll(): void {
    this.held.clear();
    this.repeatAt.clear();
    this.muted.clear();
  }

  update(dt: number): void {
    this.elapsed += dt;
    for (const key of DIRECTIONS) {
      if (!this.held.has(key) || this.muted.has(key)) continue;
      const at = this.repeatAt.get(key);
      if (at !== undefined && this.elapsed >= at) {
        this.queue.push(key);
        this.repeatAt.set(key, this.elapsed + REPEAT_INTERVAL);
      }
    }
  }

  /** 押された（またはリピートした）キーを1つ取り出す。無ければ null。 */
  consume(): GameKey | null {
    return this.queue.shift() ?? null;
  }

  /**
   * 未処理の入力を捨てる。シーン切り替え時の暴発防止。
   * 歩きながら店に入ったとき、押しっぱなしの方向キーが
   * そのまま店のカーソルを動かしてしまうのを防ぐため、
   * いま押されているキーのリピートも離すまで止める。
   */
  flush(): void {
    this.queue = [];
    for (const key of this.held) this.muted.add(key);
  }

  isDown(key: GameKey): boolean {
    return this.held.has(key);
  }

  /** 押されている方向のうち1つ。歩行の継続入力用。 */
  heldDirection(): GameKey | null {
    return DIRECTIONS.find((key) => this.held.has(key)) ?? null;
  }
}
