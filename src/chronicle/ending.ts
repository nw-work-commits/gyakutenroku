/**
 * 結び。
 *
 * これまで、この遊びには終わりが無かった。280年に達しても何も起きず、
 * 運命の日を越えた者は、越えたきり何十年も歩けるだけだった。
 * 目指す先が無いのだから、始めた者は何のために歩いているのか分からない。
 *
 * ここでは一生を締めて、三つのことを数える。
 *
 *   ・どこまで昇ったか    —— 出世の話。分かりやすいが、いちばん浅い
 *   ・史をどれだけ外したか —— 「違う道を進んだらどうなるか」の答え
 *   ・幾人の生涯を見届けたか —— このゲームがそもそも何のためにあるか
 *
 * 三つ目を最後に置いてあるのは、それがこの遊びの本題だからである。
 * 天下を取った者より、八十四人の生涯を最後まで見た者のほうを、ここでは讃える。
 */

import { ageAt } from './abilities';
import { reachLabel } from './data/ranks';
import { FACTIONS } from './data/factions';
import { ALL_OFFICERS, OFFICERS } from './registry';
import { citiesOf, ensureWorld, stateOfTheRealm } from './systems/world';
import type { Chronicle, Officer } from './types';

/** 一生の閉じ方。 */
export type EndingKind =
  /** 討たれた・病んだ。生涯がそこで切れた */
  | 'slain'
  /** 世の終わりまで生きた。280年を越えた */
  | 'outlived'
  /** 天下を一つにした */
  | 'unified'
  /** 老いに追いつかれた。史書の外まで生きた者にだけ訪れる */
  | 'aged';

export interface Tally {
  /** 見届けた生涯の数と、世に在った武将の総数。 */
  witnessed: number;
  witnessable: number;
  /** 史書から外した事柄の数。 */
  divergence: number;
  /** 史書より長く生かした者。 */
  spared: string[];
  /** 史書より早く死なせた者。 */
  hastened: string[];
  /** 史実と違う主のものになった城。 */
  seized: number;
}

export interface Ending {
  kind: EndingKind;
  /** 大書する一行。 */
  headline: string;
  /** 何年に閉じたか。 */
  year: number;
  /** 享年。生年が伝わらない者は null。 */
  age: number | null;
  /** 一景ずつ。順に捲って読ませる。 */
  scenes: EndingScene[];
  tally: Tally;
}

export interface EndingScene {
  /** 見出し。 */
  title: string;
  lines: string[];
  /** 数え上げ。あれば見出しの下に大きく出す。 */
  figure?: { value: string; note: string };
}

/**
 * その者の生涯を見届けたことにする。
 *
 * 伝を最後まで開いた者を数える。名を聞いただけでは数えない——
 * 「名を知ることと、生涯を知ることは違う」というのが、この遊びの言い分だから。
 */
export function witness(c: Chronicle, officerId: string): void {
  if (officerId === c.officerId) return;
  if (!c.met) c.met = [];
  if (!c.met.includes(officerId)) c.met.push(officerId);
}

/** 見届けた生涯を数える。名簿に載せた者と、伝を読んだ者を合わせる。 */
export function witnessedCount(c: Chronicle): number {
  const seen = new Set<string>([...(c.met ?? []), ...c.roster]);
  seen.delete(c.officerId);
  return seen.size;
}

/**
 * 史書をどれだけ外したか。
 *
 * 自分の事績のうち史実に無かったもの、助けた者、早く死なせた者、
 * 主の変わった城——数え方は違うが、どれも「史書に無い一行」である。
 */
export function tallyOf(c: Chronicle): Tally {
  const world = ensureWorld(c);
  const me = c.officerId;

  const spared = world.spared.filter((id) => id !== me);
  // 史実の没年より早く死んだ者だけを数える。史実どおりの死は史書の内
  const hastened = Object.entries(world.slain)
    .filter(([id, year]) => {
      if (id === me) return false;
      const who = OFFICERS[id];
      return who ? year < who.died : false;
    })
    .map(([id]) => id);

  const seized = Object.keys(world.seized).length;
  const ownDeeds = c.deeds.filter((d) => d.diverged).length;

  return {
    witnessed: witnessedCount(c),
    // 自分を除いた、名の伝わる者すべて
    witnessable: ALL_OFFICERS.length - 1,
    divergence: ownDeeds + spared.length + hastened.length + seized,
    spared,
    hastened,
    seized,
  };
}

function names(ids: string[], limit = 5): string {
  const list = ids.map((id) => OFFICERS[id]?.name).filter((n): n is string => Boolean(n));
  if (list.length === 0) return '';
  const head = list.slice(0, limit).join('・');
  return list.length > limit ? `${head}ほか${list.length - limit}人` : head;
}

/** 見届けた数に一言添える。数字だけでは何が良いのか伝わらない。 */
function witnessNote(seen: number, total: number): string {
  const ratio = total > 0 ? seen / total : 0;
  if (seen === 0) return 'ひとりの生涯も、最後まで聞かなかった。';
  if (ratio < 0.05) return '通りすがりに、幾人かの名を聞いた。';
  if (ratio < 0.15) return '袖の触れ合った者を、覚えて帰った。';
  if (ratio < 0.35) return 'この乱世の、少なからぬ顔を知っている。';
  if (ratio < 0.6) return '名のある者の多くと、どこかで会っている。';
  return 'この時代に生きた者を、ほとんど見届けた。';
}

/** 史を外した量に一言添える。 */
function divergenceNote(n: number): string {
  if (n === 0) return '史書は、一字も書き換わらなかった。';
  if (n <= 3) return '史書の隅に、細かな食い違いが残った。';
  if (n <= 10) return '後の世の史家が、首をかしげる程度には変えた。';
  if (n <= 25) return 'これはもう、別の三國志である。';
  return '史書はもはや、この世の写しではない。';
}

export function writeEnding(officer: Officer, c: Chronicle, kind: EndingKind): Ending {
  const world = ensureWorld(c);
  const tally = tallyOf(c);
  const year = c.year;
  const age = officer.born ? ageAt(officer, year) : null;

  const headline =
    kind === 'unified'
      ? '天下、一つとなる'
      : kind === 'outlived'
        ? '世の終わりまで'
        : kind === 'aged'
          ? '天寿を全うす'
          : c.survived
            ? '史書より長く'
            : '生涯、ここに閉ず';

  const scenes: EndingScene[] = [];

  // 一景　どこまで昇ったか
  const rank: string[] = [];
  rank.push(`${officer.name}、${year}年${age !== null ? `　享年 ${age}` : ''}。`);
  if (kind === 'slain' && !c.survived && officer.fate) {
    rank.push(`史に曰く、${officer.fate.year}年、${officer.fate.record ?? '没す'}。`);
    rank.push(year === officer.fate.year ? 'その日は、史書のとおりに来た。' : '');
  } else if (c.survived && officer.fate) {
    rank.push(`史書はこの者を ${officer.fate.year}年に葬っている。`);
    rank.push(`**然れども、${year}年に至るまで世にあった。**`);
  } else if (kind === 'outlived') {
    rank.push('乱世は、ここで一つの区切りを迎えた。');
  }
  if (kind === 'unified') {
    rank.push('史書のどこにも、この結末は書かれていない。');
  }
  if (kind === 'aged') {
    rank.push('床にあって、静かに息を引き取った。');
    // ここは史書に無い。無いものを書いた以上、そう断る
    rank.push('史書は、史書から外れた者の晩年を書いていない。');
  }
  const faction = FACTIONS[c.factionId]?.name;
  if (faction && c.factionId !== 'ronin') rank.push(`${faction}に属し、${c.troops}の兵を率いた。`);
  scenes.push({
    title: 'その身の行方',
    lines: rank.filter(Boolean),
    figure: { value: reachLabel(c.rankId, c.renown), note: `名声 ${c.renown}` },
  });

  // 二景　史をどれだけ外したか
  const div: string[] = [divergenceNote(tally.divergence)];
  if (tally.spared.length > 0) {
    div.push('');
    div.push(`**この者ゆえに、史書より長く生きた者——**`);
    div.push(`　${names(tally.spared)}`);
  }
  if (tally.hastened.length > 0) {
    div.push('');
    div.push(`**この者ゆえに、史書より早く死んだ者——**`);
    div.push(`　${names(tally.hastened)}`);
  }
  if (tally.seized > 0) {
    div.push('');
    div.push(`史実と違う旗の立った城　${tally.seized}`);
  }
  if (tally.spared.length === 0 && tally.hastened.length === 0 && tally.seized === 0) {
    div.push('');
    div.push('誰も救わず、誰も余分には殺さなかった。');
    div.push('それもまた、一つの生き方ではある。');
  }
  scenes.push({
    title: '史書との食い違い',
    lines: div,
    figure: { value: `${tally.divergence}`, note: '史書に無い事柄' },
  });

  // 三景　幾人の生涯を見届けたか —— ここが本題
  const seen: string[] = [];
  seen.push(witnessNote(tally.witnessed, tally.witnessable));
  seen.push('');
  seen.push('名を知ることと、生涯を知ることは違う。');
  seen.push('この乱世に生きた者の一人ひとりに、始まりと終わりがあった。');
  if (tally.witnessed < tally.witnessable) {
    seen.push('');
    seen.push(`まだ ${tally.witnessable - tally.witnessed} 人の生涯が、読まれずに残っている。`);
  }
  scenes.push({
    title: '見届けた生涯',
    lines: seen,
    figure: {
      value: `${tally.witnessed} / ${tally.witnessable}`,
      note: '人',
    },
  });

  // 四景　天下はどうなったか
  const realm: string[] = [`${stateOfTheRealm(world, Math.min(year, 280))}。`];
  const own = world.founded;
  if (own) {
    const held = citiesOf(world, own.id, Math.min(year, 280)).length;
    realm.push('');
    realm.push(`${own.from}年、${officer.name}は自らの旗を挙げた。`);
    realm.push(`${own.name}の版図——`);
    realm.push(`${held} 城。史書にこの勢力は無い。`);
  }
  scenes.push({ title: 'その後の天下', lines: realm });

  return { kind, headline, year, age, scenes, tally };
}
