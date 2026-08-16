/**
 * 出典の書物。
 *
 * 「どの話がどこに書かれているか」を出すための表。
 * 遊ぶ人が三国志の史料構成を知らなくても読めるように、
 * 書物そのものの説明（いつ・誰が・どういう性格の本か）まで持たせてある。
 *
 * 並び順は「真実に近いとされる順」。人物伝はこの順を基準線にする。
 */

import type { SourceWork, Standing } from '../types';

export interface SourceDef {
  id: SourceWork;
  /** 「三国志」 */
  name: string;
  /** 一覧に出す短い印。 */
  tag: string;
  /** 成立年（西暦）。同時代からどれだけ離れているか。 */
  compiled: number;
  author: string;
  /** どういう性格の本か。 */
  note: string;
}

const LIST: SourceDef[] = [
  {
    id: 'sanguozhi',
    name: '三国志',
    tag: '正史',
    compiled: 285,
    author: '陳寿',
    note: '乱世の終わりに、それを見た世代が書いた。現存する記録では最も同時代に近い。ただし簡潔にすぎ、書かれなかったことも多い。',
  },
  {
    id: 'peizhu',
    name: '三国志 裴松之注',
    tag: '裴注',
    compiled: 429,
    author: '裴松之',
    note: '陳寿の簡潔さを補うため、二百種近い書を引いて注を付けた。本伝と食い違う話も、食い違うまま並べてある。異説の宝庫。',
  },
  {
    id: 'houhanshu',
    name: '後漢書',
    tag: '後漢書',
    compiled: 445,
    author: '范曄',
    note: '後漢側から見た記録。漢の滅び方や、宦官・党錮の禍はこちらが詳しい。',
  },
  {
    id: 'jinshu',
    name: '晋書',
    tag: '晋書',
    compiled: 648,
    author: '房玄齢ら',
    note: '唐が官撰した晋の正史。司馬氏の事績はここが最も詳しいが、四百年を隔てた編纂で、怪異や逸話も採る。晋を建てた側の視点で書かれていることにも注意が要る。',
  },
  {
    id: 'tongjian',
    name: '資治通鑑',
    tag: '通鑑',
    compiled: 1084,
    author: '司馬光',
    note: '八百年後に編まれた編年体。年次の整理は行き届いているが、取捨と解釈が入っている。',
  },
  {
    id: 'yanyi',
    name: '三国志演義',
    tag: '演義',
    compiled: 1400,
    author: '羅貫中ら',
    note: '千二百年後の小説。人々が「三国志」として思い浮かべる場面の多くはここから来ている。物語としては本物だが、史実ではない。',
  },
  {
    id: 'folk',
    name: '民間伝承',
    tag: '伝承',
    compiled: 1300,
    author: '——',
    note: '雑劇や講談、後世の付会。書いた人も、いつできたかも定かでない。',
  },
];

export const SOURCES: Record<SourceWork, SourceDef> = Object.fromEntries(
  LIST.map((s) => [s.id, s]),
) as Record<SourceWork, SourceDef>;

export const SOURCE_ORDER: SourceWork[] = LIST.map((s) => s.id);

/** 真実との隔たりの呼び名。 */
export const STANDING_LABEL: Record<Standing, string> = {
  record: '記載',
  variant: '異説',
  dramatized: '脚色',
  invention: '創作',
};

export const STANDING_NOTE: Record<Standing, string> = {
  record: 'その書がそう記している。',
  variant: '他の書と食い違う。どちらが正しいとも決まっていない。',
  dramatized: '下敷きになる記録はあるが、膨らませてある。',
  invention: '下敷きが無い。その書が作った話。',
};

/** 正史そのものか。人物伝の基準線を引くのに使う。 */
export function isHistorical(work: SourceWork, standing: Standing): boolean {
  if (standing === 'invention' || standing === 'dramatized') return false;
  return work !== 'yanyi' && work !== 'folk';
}

/** 何も書かれていないときの既定。正史に記載あり、とみなす。 */
export const DEFAULT_ATTRIBUTION = {
  work: 'sanguozhi' as SourceWork,
  standing: 'record' as Standing,
};
