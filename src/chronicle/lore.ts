/**
 * 人物伝の生成。「史書がこの者について伝えること」を一人ぶん組み立てる。
 *
 * このゲームの主眼はここにある。三国志の武将ひとりひとりが、
 * いつ生まれ、誰の旗の下に立ち、どの戦に居合わせ、どう死んだのか。
 * それを八十四人ぶん手で書くわけにはいかないので、持っているデータから組む。
 *
 * ただし、**知らないことを知っているように書かない**のが此処の一番の掟。
 *
 *   ・データに書いてあること      … 確かなこと（recorded）
 *   ・所属と年から導いたこと      … 推し量ったこと（inferred）
 *   ・そもそも書かれていないこと  … 伝わらないこととして、明示する
 *
 * 高昇のように三行しか書かれていない武将は、伝が薄いのではない。
 * **史書がそこまでしか伝えていない**のであって、それ自体がこの者について
 * 語りうる唯一のことになる。だから薄い伝ほど、末尾の「伝わらぬこと」が効く。
 */

import { currentAbilities, describe } from './abilities';
import { DEFAULT_ATTRIBUTION, SOURCES, STANDING_LABEL, isHistorical } from './data/sources';
import { FACTIONS } from './data/factions';
import { ROLES } from './data/roles';
import { ALL_EVENTS, ALL_OFFICERS, EVENTS, allegianceOf, factionAt } from './registry';
import type { Attribution, Chronicle, HistoryEvent, Officer } from './types';

/** その一行が、どれくらい確かか。 */
export type Certainty =
  /** データに書いてある。史書が伝えていること。 */
  | 'recorded'
  /** 所属と年から導いた。「その場にいたはず」であって、いたという記述ではない。 */
  | 'inferred'
  /** 遊んだ本人がそうしたこと。史実ではない。 */
  | 'yours';

export interface LifeLine {
  year: number;
  text: string;
  /** 事件の史実の結末など、一段下げて添える一文。 */
  note?: string;
  certainty: Certainty;
  /** どの書物の、どういう性格の話か。 */
  attribution?: Attribution;
}

export interface Life {
  officerId: string;
  name: string;
  /** 「字は雲長」あるいは「字を伝えず」。 */
  courtesy: string;
  epithet: string | null;
  /** 「猛将」「黄巾の頭目」。 */
  standing: string;
  /** 生没の一行。 */
  span: string;
  /** 人となりの数行。分からなければ、分からないと書く。 */
  opening: string[];
  /** 年譜。 */
  years: LifeLine[];
  /** 最期。 */
  closing: string[];
  /** 史書が伝えないこと。薄い伝ほど、ここが本文になる。 */
  silences: string[];
  /**
   * 伝わりの厚さ 0〜5。
   * 事典の一覧で「どれくらい記録が残っている人物か」を示す。
   */
  attestation: number;
  /**
   * この伝の中に名の出てくる武将。
   * 一人の生涯は必ず他の誰かの生涯と絡むので、そこから辿れるようにする。
   */
  mentions: string[];
}

/** 年譜に並べる、推し量った事件の上限。曹操のような者は全部載せると年表になる。 */
const INFERRED_LIMIT = 9;

// ---------------------------------------------------------------- 生没

function courtesyLine(who: Officer): string {
  return who.courtesy ? `字は${who.courtesy}` : '字を伝えず';
}

/**
 * 生没の一行。
 * 生年が書かれていない武将は、死に方から推し量った値を持っているが、
 * それは**遊びのために要る数字**であって史実ではないので、伝には出さない。
 */
function spanLine(who: Officer): string {
  if (who.born !== undefined) {
    return `${who.born}年 — ${who.died}年（${who.died - who.born}歳）`;
  }
  return `生年不詳 — ${who.died}年`;
}

// ---------------------------------------------------------------- 人となり

/**
 * 人となり。
 *
 * 能力値は、手で書かれていないかぎり役柄から自動生成した数字なので、
 * それを「史書によれば武勇に優れ」と書くのは嘘になる。
 * 手が入っている武将だけ、人物評として出す。
 */
function openingOf(who: Officer): string[] {
  const lines: string[] = [];
  const role = ROLES[who.roleId]?.name ?? '素性知れず';
  const first = allegianceOf(who)[0];
  const faction = first ? FACTIONS[first.factionId] : undefined;

  if (faction && faction.id !== 'ronin') {
    lines.push(`${faction.name}に属す。${role}。`);
  } else {
    lines.push(`${role}。旗を持たず。`);
  }

  if (who.epithet) lines.push(`世に「${who.epithet}」と称さる。`);

  const source = who.attribution;
  const invented = Boolean(source && !isHistorical(source.work, source.standing));

  if (who.stats) {
    const ab = currentAbilities(who, 0);
    const portrait =
      `武を以て${describe(ab.war)}、智を以て${describe(ab.intel)}、` +
      `兵を率いては${describe(ab.lead)}`;
    // 正史にいない人物の人物像を「と伝わる」で結ぶと、史書がそう書いたことになる
    lines.push(invented && source ? `${portrait}と、${SOURCES[source.work].name}は描く。` : `${portrait}と伝わる。`);
  } else {
    // 自動生成の数字を史書の評として語らない
    lines.push('その人となりを伝える記述は、残っていない。');
  }

  // 正史にいない人物は、そのことを最初に断る。
  // 「記録が薄い」のと「そもそも記録が無い」のは、まったく違う。
  if (invented && source) {
    lines.push('');
    lines.push(
      `——この人物は${SOURCES[source.work].name}の${STANDING_LABEL[source.standing]}であり、` +
        '正史に見えない。以下は物語の中の生涯である。',
    );
  }

  return lines;
}

// ---------------------------------------------------------------- 年譜

/** 所属が動いた年。同じ年に二度動くこともある（関羽の降漢不降曹）。 */
function allegianceLines(who: Officer): LifeLine[] {
  const list = allegianceOf(who);
  const lines: LifeLine[] = [];

  /**
   * 旗の下に立った年が、史料から来ているか。
   * 遍歴を年つきで書いてあるときだけ確かで、
   * 一言で `allegiance: 'han'` と書いた者の出仕年は、元服の齢から当てた数字にすぎない。
   */
  const firstIsKnown = typeof who.allegiance !== 'string';

  list.forEach((entry, i) => {
    const faction = FACTIONS[entry.factionId];
    if (!faction) return;
    const previous = i > 0 ? FACTIONS[list[i - 1]!.factionId] : undefined;

    if (i === 0) {
      lines.push({
        year: entry.from,
        text: faction.id === 'ronin' ? '旗を持たず、世に出る' : `${faction.name}の下に立つ`,
        certainty: firstIsKnown ? 'recorded' : 'inferred',
      });
      return;
    }
    lines.push({
      year: entry.from,
      text: previous
        ? `${previous.name}を離れ、${faction.name}に属す`
        : `${faction.name}に属す`,
      certainty: 'recorded',
    });
  });

  return lines;
}

/**
 * その者が名指しで結びつけられている話。
 * 年表の事件（events）と、その人ひとりの逸話（life）の両方を拾う。
 * どちらも出典を持つので、正史と演義が同じ列に並んでも取り違えない。
 */
function ownEventLines(who: Officer): { lines: LifeLine[]; missing: string[] } {
  const lines: LifeLine[] = [];
  const missing: string[] = [];

  for (const id of who.events ?? []) {
    const event = EVENTS[id];
    if (!event) {
      missing.push(id);
      continue;
    }
    lines.push({
      year: event.year,
      text: event.name,
      note: event.record,
      certainty: 'recorded',
      attribution: event.attribution ?? DEFAULT_ATTRIBUTION,
    });
  }

  for (const entry of who.life ?? []) {
    lines.push({
      year: entry.year,
      text: entry.text,
      certainty: 'recorded',
      attribution: entry.attribution,
    });
  }

  return { lines, missing };
}

/**
 * 居合わせたはずの事件。
 *
 * 「その年に生きていて、その旗の下にいた」から導く。
 * 表で持たない代わりに、**確かなことではないと断って**並べる。
 */
function inferredEventLines(who: Officer, exclude: Set<string>): LifeLine[] {
  const list = allegianceOf(who);
  const entered = list[0]?.from ?? who.died;
  const candidates: { event: HistoryEvent; line: LifeLine }[] = [];

  for (const event of ALL_EVENTS) {
    if (exclude.has(event.id)) continue;
    if (event.year < entered || event.year > who.died) continue;
    // 子どものうちは戦場に出ない
    if (who.born !== undefined && event.year - who.born < 14) continue;
    if (!event.factions.includes(factionAt(who, event.year))) continue;
    // 起きなかった出来事に「居合わせたはず」は成り立たない。
    // 演義の創作は、名指しで結びつけたときにだけ伝に載る。
    const source = event.attribution;
    if (source && source.standing === 'invention') continue;

    candidates.push({
      event,
      line: {
        year: event.year,
        text: event.name,
        note: event.record,
        certainty: 'inferred' as const,
        attribution: event.attribution ?? DEFAULT_ATTRIBUTION,
      },
    });
  }

  // 大きな事件から拾って、拾い終えたら年順に戻す
  return candidates
    .sort((a, b) => b.event.weight - a.event.weight)
    .slice(0, INFERRED_LIMIT)
    .map((c) => c.line)
    .sort((a, b) => a.year - b.year);
}

// ---------------------------------------------------------------- 最期

function closingOf(who: Officer): string[] {
  const fate = who.fate;
  const lines: string[] = [];

  if (!fate) {
    lines.push(`${who.died}年に没したことのほか、その最期を伝えない。`);
    return lines;
  }

  const stage = fate.at ? EVENTS[fate.at] : undefined;
  const where = stage ? `${stage.name}にて。` : '';

  if (fate.record) {
    lines.push(`${fate.year}年、${fate.record}。${where}`);
  } else if (fate.by) {
    lines.push(`${fate.year}年、${fate.by}の手にかかる。${where}`);
  } else {
    lines.push(`${fate.year}年、没す。${where}`);
  }

  if (fate.by && fate.record) lines.push(`討ったのは${fate.by}と伝わる。`);

  return lines;
}

// ---------------------------------------------------------------- 伝わらぬこと

function silencesOf(
  who: Officer,
  years: LifeLine[],
  missingEvents: string[],
  attestation: number,
): string[] {
  const silences: string[] = [];

  // 正史にいない人物に「生年を伝えない」と言うのは筋が違う。
  // 陳寿が書き落としたのではなく、そもそも書くべき人がいなかったのだから。
  const source = who.attribution;
  if (source && !isHistorical(source.work, source.standing)) {
    silences.push(`正史にこの者の記載は無い。${SOURCES[source.work].name}が世に出した人物。`);
    if (source.insteadTruly) silences.push(source.insteadTruly);
    return silences;
  }

  if (who.born === undefined) silences.push('生年を伝えない。');
  if (!who.courtesy) silences.push('字を伝えない。');
  if (!who.stats) silences.push('人となりを伝えない。');
  if (!who.fate?.record) silences.push('最期の様子を、詳らかにしない。');

  /**
   * 「事績を伝えない」は、史書の薄さについて言う。
   *
   * ここで書いた行数だけを見ると、**まだこちらが書いていないだけ**の武将にも
   * 史書が黙っていることにしてしまう（曹叡の明帝紀は決して薄くない）。
   * だから伝わりの厚さを併せて見て、両方とも乏しいときにだけ言う。
   */
  const recorded = years.filter((l) => l.certainty === 'recorded').length;
  if (recorded <= 2 && attestation <= 2) {
    silences.push('事績を、ほとんど伝えない。');
  }
  for (const id of missingEvents) {
    // データの取りこぼしを黙って隠さない
    silences.push(`語り伝えられる場面（${id}）が、この年表には収められていない。`);
  }

  return silences;
}

/**
 * 正史にどれだけ残っている人物か。事典の一覧で「伝わりの厚さ」として出す。
 * 演義の人物は、どれだけ物語が厚くても、正史の厚さは 0。
 */
function attestationOf(who: Officer): number {
  const source = who.attribution;
  if (source && !isHistorical(source.work, source.standing)) return 0;

  let score = 0;
  if (who.born !== undefined) score++;
  if (who.courtesy) score++;
  if (who.epithet) score++;
  if (who.stats) score++;
  if (who.fate?.record) score++;
  if (allegianceOf(who).length > 1) score++;
  // 正史に根のある逸話が結びついているか
  if ((who.life ?? []).some((e) => isHistorical(e.attribution.work, e.attribution.standing))) {
    score++;
  }
  return Math.min(5, score);
}

// ---------------------------------------------------------------- 人から人へ

/**
 * その伝に名の出てくる武将。
 *
 * 索引を持たず、本文を読んで拾う。武将を足すたびに繋ぎ直す必要が無いし、
 * 逸話を書き足せば、そこに出てくる者への道が勝手に通る。
 *
 * 現れる順に並べるので、読んだ流れのまま辿れる。
 */
function mentionsIn(who: Officer, text: string): string[] {
  return namesIn(text, who.id);
}

/**
 * 文の中に出てくる武将の名を、現れた順に拾う。
 *
 * 伝の中だけでなく、事件の本文や戦の記録からも同じ拾い方をする。
 * 「陸抗の遺言」を読んでいるときに陸抗の生涯を引けないのでは、
 * 事典が別室に置いてあるのと変わらない。
 */
export function namesIn(text: string, exclude?: string): string[] {
  const found: { id: string; at: number }[] = [];
  for (const other of ALL_OFFICERS) {
    if (other.id === exclude) continue;
    const at = text.indexOf(other.name);
    if (at >= 0) found.push({ id: other.id, at });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.id);
}

// ---------------------------------------------------------------- 組み立て

/** その者について、史書が伝えること。 */
export function lifeOf(who: Officer): Life {
  const own = ownEventLines(who);
  // 自分の言葉で語ってある場面は、推し量った行のほうを引っ込める
  const claimed = new Set([
    ...(who.events ?? []),
    ...(who.life ?? []).flatMap((e) => (e.supersedes ? [e.supersedes] : [])),
    ...(who.fate?.at ? [who.fate.at] : []),
  ]);

  const years = [...allegianceLines(who), ...own.lines, ...inferredEventLines(who, claimed)].sort(
    (a, b) => a.year - b.year,
  );

  const opening = openingOf(who);
  const closing = closingOf(who);
  const attestation = attestationOf(who);
  const silences = silencesOf(who, years, own.missing, attestation);

  // 本文をぜんぶ繋いでから名前を拾う。出典の注記に出てくる者も辿れるように。
  const body = [
    ...opening,
    ...years.flatMap((y) => [y.text, y.note ?? '', y.attribution?.insteadTruly ?? '']),
    ...closing,
    ...silences,
  ].join('\n');

  return {
    officerId: who.id,
    name: who.name,
    courtesy: courtesyLine(who),
    epithet: who.epithet ?? null,
    standing: ROLES[who.roleId]?.name ?? '素性知れず',
    span: spanLine(who),
    opening,
    years,
    closing,
    silences,
    attestation,
    mentions: mentionsIn(who, body),
  };
}

/**
 * 史実の生涯に、自分が歩んだ道を重ねる。
 *
 * 同じ一枚に並べるのがこの画面の眼目で、
 * 「知るゲーム」と「外れるゲーム」がここで一つになる。
 */
export function lifeWithYours(who: Officer, c: Chronicle | null): Life {
  const life = lifeOf(who);
  if (!c || c.officerId !== who.id) return life;

  const yours: LifeLine[] = c.deeds.map((deed) => ({
    year: deed.year,
    text: deed.text,
    certainty: 'yours' as const,
    note: deed.diverged ? '史書にこの記述なし' : undefined,
  }));

  if (c.survived && who.fate) {
    yours.push({
      year: who.fate.year,
      text: 'この年を越えて生きた',
      note: '史書から外れた',
      certainty: 'yours',
    });
  }

  // 史書の最期はそのまま残す。越えたことは、その後ろに書き足す。
  const closing = c.survived
    ? [...life.closing, `——然れども、あなたの${who.name}は、この年を越えた。`]
    : life.closing;

  return {
    ...life,
    closing,
    years: [...life.years, ...yours].sort((a, b) => a.year - b.year),
  };
}
