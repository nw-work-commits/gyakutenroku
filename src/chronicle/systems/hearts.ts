/**
 * 配下の心。
 *
 * これまで、忠誠も離反もこのコードには一行も無かった。
 * 関羽は、主が刺客を使って張郃を殺しても何も言わない。徳が7下がるだけで、
 * それは天下に対する抽象的な数字であって、隣に立っている人間の反応ではない。
 * 「人を得る」ことを軸にした遊びなのに、得た人が意見を持っていなかった。
 *
 * ここでは、配下ひとりずつが主の生き方を見ている。
 *
 * 仕掛けはひとつだけにしてある。**心は徳に従って動く**。
 * ただし動き方はその者の徳による——徳の高い者ほど、主の不義に強く傷つき、
 * 主の義に強く応える。徳の薄い者は、何をしようとあまり気にしない。
 *
 * 呂布が誰にでも従い、誰からも従われなかったのは、そういうことだったのだろう。
 */

import { abilitiesAt } from '../abilities';
import { OFFICERS } from '../lookup';
import { witness } from '../ending';
import type { Chronicle, Officer } from '../types';

/** 迎えたときの心。まだ主を見定めていない */
export const HEART_START = 55;
/** これを下回ると、いつ去ってもおかしくない */
export const HEART_LEAVING = 22;

export function heartOf(c: Chronicle, officerId: string): number {
  return c.hearts?.[officerId] ?? HEART_START;
}

export function setHeart(c: Chronicle, officerId: string, value: number): void {
  if (!c.hearts) c.hearts = {};
  c.hearts[officerId] = Math.max(0, Math.min(100, Math.round(value)));
}

/** 心のほど。数字だけでは何も伝わらないので、言葉にする。 */
export function heartLabel(value: number): string {
  if (value >= 90) return '死をも共に';
  if (value >= 72) return '心服';
  if (value >= 55) return '従う';
  if (value >= 38) return '思うところあり';
  if (value >= HEART_LEAVING) return '離れかけている';
  return '去る日を待つ';
}

export interface Reaction {
  officerId: string;
  name: string;
  /** 心の動き。 */
  delta: number;
  /** その者が漏らした一言。無ければ黙っている。 */
  line: string;
}

/**
 * 主の振る舞いに、配下がそれぞれ反応する。
 *
 * @param virtueDelta その行いの徳の増減。これがそのまま心の向きになる
 * @param what 何をしたか。台詞の素になる短い語（「刺客を放つ」など）
 */
export function reactToDeed(c: Chronicle, virtueDelta: number, what: string): Reaction[] {
  if (virtueDelta === 0) return [];
  const out: Reaction[] = [];

  for (const id of c.roster) {
    const sub = OFFICERS[id];
    if (!sub) continue;
    const theirs = abilitiesAt(sub, c.year, 0).virtue;
    // 徳の高い者ほど、主の行いに強く動く
    const weight = 0.4 + theirs / 100;
    const delta = Math.round(virtueDelta * weight);
    if (delta === 0) continue;

    setHeart(c, id, heartOf(c, id) + delta);
    out.push({
      officerId: id,
      name: sub.name,
      delta,
      line: lineFor(sub, theirs, virtueDelta, what),
    });
  }
  return out;
}

/**
 * 一言。
 *
 * 武将ごとに台詞を書き分けると千人ぶん要るので、
 * その者の徳と、行いの向きから組み立てる。
 */
function lineFor(who: Officer, theirVirtue: number, virtueDelta: number, what: string): string {
  if (virtueDelta < 0) {
    if (theirVirtue >= 80) return `${who.name}「${what}——それが、あなたの道ですか」`;
    if (theirVirtue >= 55) return `${who.name}は、何も言わずに目を伏せた。`;
    return `${who.name}「乱世です。是非を言うても始まらぬ」`;
  }
  if (theirVirtue >= 80) return `${who.name}「その一事、生涯忘れませぬ」`;
  if (theirVirtue >= 55) return `${who.name}は、深く頷いた。`;
  return `${who.name}「……こういう主も、悪くはない」`;
}

/**
 * 日ごとの寄り。
 *
 * 何もしなくても、心は主の徳のほうへゆっくり寄っていく。
 * 徳の高い者の下では上がり、低い者の下では下がる。
 * 一足飛びには動かないので、悪事ひとつで全員が去ることはない。
 */
export function driftHearts(c: Chronicle, months: number): void {
  if (months <= 0) return;
  const lord = abilitiesAt(officerOf(c), c.year, c.virtueDelta).virtue;
  for (const id of c.roster) {
    const now = heartOf(c, id);
    // 主の徳が、その者の心の落ち着き先になる
    const target = Math.max(10, Math.min(95, lord));
    const step = Math.sign(target - now) * Math.min(Math.abs(target - now), months * 0.8);
    setHeart(c, id, now + step);
  }
}

/**
 * 去る者。
 *
 * 心が尽きた者から順に、黙って陣を出ていく。斬られるのではないので、
 * 世界の帳簿には死を刻まない——その者は、どこかで生きている。
 */
export function whoLeaves(c: Chronicle): Officer[] {
  const leaving: Officer[] = [];
  for (const id of c.roster) {
    const sub = OFFICERS[id];
    if (!sub) continue;
    if (heartOf(c, id) > HEART_LEAVING) continue;
    // 心が尽きても、去るのは義理を欠くこと。徳の高い者ほど留まる
    const theirs = abilitiesAt(sub, c.year, 0).virtue;
    if (Math.random() < 0.55 - theirs / 260) leaving.push(sub);
  }
  return leaving;
}

/** 陣を去ってもらう。名簿から外し、心の記録も消す。 */
export function partWith(c: Chronicle, officerId: string): void {
  c.roster = c.roster.filter((x) => x !== officerId);
  if (c.hearts) delete c.hearts[officerId];
}

/** 迎えたばかりの者に、初めの心を置く。 */
export function welcome(c: Chronicle, officerId: string): void {
  const sub = OFFICERS[officerId];
  if (!sub) return;
  // 一度でも自分に従った者は、その生涯を見届けたうちに入る。
  // 名簿から消えても（史実どおり没しても、去られても）数から落ちないように、
  // ここで見届けた側へ写しておく
  witness(c, officerId);
  // 徳を見て来た者は、はじめから心を寄せている
  const lord = abilitiesAt(officerOf(c), c.year, c.virtueDelta).virtue;
  setHeart(c, officerId, HEART_START + Math.round((lord - 50) * 0.4));
}

function officerOf(c: Chronicle): Officer {
  return c.custom ?? OFFICERS[c.officerId]!;
}
