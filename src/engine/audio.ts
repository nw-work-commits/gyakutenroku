/**
 * 素材ファイルを持たずに WebAudio だけで鳴らす効果音とBGM。
 * 矩形波と三角波の2声だけの、いかにも8bitな音。
 */

export type SfxName =
  | 'cursor'
  | 'confirm'
  | 'cancel'
  | 'attack'
  | 'hit'
  | 'magic'
  | 'heal'
  | 'miss'
  | 'levelup'
  | 'encounter'
  | 'gold'
  | 'door'
  | 'defeat';

/** 音名 → 周波数。'-' は休符。 */
function freq(note: string): number {
  if (note === '-') return 0;
  const table: Record<string, number> = {
    C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4,
    'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2,
  };
  const match = /^([A-G]#?)(-?\d)$/.exec(note);
  if (!match) return 0;
  const semitone = table[match[1]!]!;
  const octave = Number(match[2]);
  return 440 * Math.pow(2, (semitone + (octave - 4) * 12) / 12);
}

interface Track {
  /** 1拍あたりのミリ秒。 */
  beat: number;
  lead: [string, number][];
  bass: [string, number][];
}

export type BgmName = 'title' | 'town' | 'field' | 'cave' | 'battle' | 'boss';

const TRACKS: Record<BgmName, Track> = {
  title: {
    beat: 340,
    lead: [['A4', 2], ['E4', 1], ['F4', 1], ['G4', 2], ['E4', 2], ['F4', 2], ['C5', 2], ['B4', 3], ['-', 1]],
    bass: [['A2', 2], ['A2', 2], ['C3', 2], ['C3', 2], ['F2', 2], ['F2', 2], ['E2', 2], ['E2', 2]],
  },
  town: {
    beat: 230,
    lead: [
      ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['F5', 1], ['E5', 1], ['D5', 2],
      ['C5', 1], ['D5', 1], ['E5', 1], ['G5', 1], ['A5', 2], ['G5', 2],
    ],
    bass: [['C3', 2], ['G2', 2], ['C3', 2], ['G2', 2], ['F2', 2], ['C3', 2], ['G2', 2], ['G2', 2]],
  },
  field: {
    beat: 210,
    lead: [
      ['E5', 1], ['G5', 1], ['A5', 2], ['G5', 1], ['E5', 1], ['D5', 2],
      ['C5', 1], ['D5', 1], ['E5', 2], ['D5', 1], ['C5', 1], ['A4', 2],
    ],
    bass: [['A2', 2], ['E3', 2], ['A2', 2], ['E3', 2], ['F2', 2], ['C3', 2], ['G2', 2], ['E3', 2]],
  },
  cave: {
    beat: 300,
    lead: [['D4', 2], ['F4', 2], ['E4', 2], ['A#3', 2], ['C4', 2], ['E4', 2], ['D4', 4]],
    bass: [['D2', 4], ['A#1', 4], ['C2', 4], ['D2', 4]],
  },
  battle: {
    beat: 145,
    lead: [
      ['E4', 1], ['E4', 1], ['E5', 1], ['E4', 1], ['D5', 1], ['C5', 1], ['B4', 1], ['A4', 1],
      ['G4', 1], ['A4', 1], ['B4', 1], ['C5', 1], ['B4', 2], ['E4', 2],
    ],
    bass: [['E2', 1], ['E2', 1], ['E2', 1], ['E2', 1], ['C2', 1], ['C2', 1], ['C2', 1], ['C2', 1],
      ['G2', 1], ['G2', 1], ['G2', 1], ['G2', 1], ['E2', 2], ['E2', 2]],
  },
  boss: {
    beat: 130,
    lead: [
      ['A3', 1], ['A3', 1], ['C4', 1], ['A3', 1], ['D4', 2], ['C4', 1], ['A3', 1],
      ['A#3', 1], ['A#3', 1], ['D4', 1], ['A#3', 1], ['F4', 2], ['E4', 2],
    ],
    bass: [['A1', 1], ['A1', 1], ['A1', 1], ['A1', 1], ['A1', 1], ['A1', 1], ['A1', 1], ['A1', 1],
      ['A#1', 1], ['A#1', 1], ['A#1', 1], ['A#1', 1], ['F1', 2], ['E1', 2]],
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private timer: number | null = null;
  private current: BgmName | null = null;
  enabled = true;

  /** ブラウザの自動再生制限があるので、最初の入力で呼ぶ。 */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    if (this.current) this.playBgm(this.current, true);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.35 : 0;
    if (!on) this.stopBgm(true);
    else if (this.current) this.playBgm(this.current, true);
  }

  private tone(
    type: OscillatorType,
    hz: number,
    startAt: number,
    duration: number,
    volume: number,
    destination: AudioNode,
    slideTo?: number,
  ): void {
    if (!this.ctx || hz <= 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, startAt);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  private noise(startAt: number, duration: number, volume: number): void {
    if (!this.ctx || !this.master) return;
    const frames = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, Math.max(1, frames), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(this.master);
    src.start(startAt);
  }

  sfx(name: SfxName): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const sq: OscillatorType = 'square';
    switch (name) {
      case 'cursor':
        this.tone(sq, 880, t, 0.05, 0.16, this.master);
        break;
      case 'confirm':
        this.tone(sq, 660, t, 0.06, 0.2, this.master);
        this.tone(sq, 990, t + 0.06, 0.09, 0.2, this.master);
        break;
      case 'cancel':
        this.tone(sq, 440, t, 0.07, 0.18, this.master);
        this.tone(sq, 300, t + 0.06, 0.09, 0.18, this.master);
        break;
      case 'attack':
        this.noise(t, 0.11, 0.28);
        this.tone('sawtooth', 320, t, 0.1, 0.16, this.master, 90);
        break;
      case 'hit':
        this.noise(t, 0.18, 0.34);
        this.tone('square', 180, t, 0.16, 0.2, this.master, 60);
        break;
      case 'magic':
        for (let i = 0; i < 6; i++) this.tone('triangle', 500 + i * 180, t + i * 0.035, 0.14, 0.13, this.master);
        break;
      case 'heal':
        this.tone('triangle', 660, t, 0.12, 0.18, this.master);
        this.tone('triangle', 880, t + 0.1, 0.12, 0.18, this.master);
        this.tone('triangle', 1180, t + 0.2, 0.2, 0.18, this.master);
        break;
      case 'miss':
        this.tone('triangle', 700, t, 0.14, 0.14, this.master, 320);
        break;
      case 'levelup':
        [523, 659, 784, 1046].forEach((hz, i) =>
          this.tone(sq, hz, t + i * 0.11, 0.2, 0.2, this.master!),
        );
        break;
      case 'encounter':
        for (let i = 0; i < 5; i++) this.tone(sq, 300 + i * 60, t + i * 0.07, 0.06, 0.22, this.master);
        break;
      case 'gold':
        this.tone(sq, 1046, t, 0.07, 0.18, this.master);
        this.tone(sq, 1318, t + 0.07, 0.12, 0.18, this.master);
        break;
      case 'door':
        this.tone('triangle', 220, t, 0.18, 0.2, this.master, 440);
        break;
      case 'defeat':
        [440, 392, 349, 262].forEach((hz, i) =>
          this.tone('triangle', hz, t + i * 0.17, 0.3, 0.2, this.master!),
        );
        break;
    }
  }

  playBgm(name: BgmName, force = false): void {
    if (this.current === name && !force) return;
    this.stopBgm(true);
    this.current = name;
    if (!this.enabled || !this.ctx || !this.master) return;

    // 曲ごとに専用のGainを作る。切り替えはこのノードごと捨てれば予約済みの音も一緒に消える。
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.5;
    this.bgmGain.connect(this.master);

    const track = TRACKS[name];
    const beat = track.beat / 1000;
    const leadBeats = track.lead.reduce((sum, n) => sum + n[1], 0);
    const bassBeats = track.bass.reduce((sum, n) => sum + n[1], 0);
    const loopBeats = Math.max(leadBeats, bassBeats);
    const loopSec = loopBeats * beat;

    const schedule = (base: number) => {
      if (!this.ctx || !this.bgmGain) return;
      let at = base;
      for (const [note, beats] of track.lead) {
        this.tone('square', freq(note), at, beats * beat * 0.85, 0.1, this.bgmGain);
        at += beats * beat;
      }
      at = base;
      for (const [note, beats] of track.bass) {
        this.tone('triangle', freq(note), at, beats * beat * 0.9, 0.13, this.bgmGain);
        at += beats * beat;
      }
    };

    let nextAt = this.ctx.currentTime + 0.08;
    schedule(nextAt);
    nextAt += loopSec;
    // 少し先まで予約し続けることで、タイマー揺れによる切れ目をなくす
    this.timer = window.setInterval(() => {
      if (!this.ctx) return;
      while (nextAt < this.ctx.currentTime + loopSec) {
        schedule(nextAt);
        nextAt += loopSec;
      }
    }, Math.max(200, (loopSec * 1000) / 2));
  }

  stopBgm(keepCurrent = false): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (!keepCurrent) this.current = null;
    const gain = this.bgmGain;
    this.bgmGain = null;
    if (gain && this.ctx) {
      const now = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.06);
      window.setTimeout(() => gain.disconnect(), 150);
    }
  }
}

export const audio = new AudioEngine();
