/**
 * 三国志「もしも」RPG の中核データ型。
 *
 * 設計の柱は3つ:
 *  1. 武将は「名前・所属・退場年」だけで成立する。能力値は役柄から自動生成し、
 *     こだわりたい武将だけ上書きする（千人規模を手入力しないため）。
 *  2. 誰がどの事件に居合わせるかは表で持たない。所属と地位と年から実行時に決める。
 *  3. エンディングは書かない。やったこと（Deed）から列伝を生成する。
 */

/** 向き。地図の上を歩くのに使う。 */
export type Dir = 'up' | 'down' | 'left' | 'right';

// ---------------------------------------------------------------- 能力値

export interface Abilities {
  /** 武力。斬り合いの強さ。 */
  war: number;
  /** 知力。計略の威力と、相手の計略への耐性。 */
  intel: number;
  /** 統率。部隊の硬さと、兵力の上限。 */
  lead: number;
  /** 機動。行動順と、戦場からの離脱。 */
  mobility: number;
  /**
   * 徳。登用の成否と士気に効く。
   * 五つのうち、これだけは生き方によって動く（呂布が信を得ることもありうる）。
   */
  virtue: number;
}

export type AbilityKey = keyof Abilities;

export const ABILITY_LABEL: Record<AbilityKey, string> = {
  war: '武力',
  intel: '知力',
  lead: '統率',
  mobility: '機動',
  virtue: '徳',
};

/** 能力値は 1〜100。史料に無い武将は役柄のレンジから決定的に生成する。 */
export type AbilityRange = Record<AbilityKey, [number, number]>;

export interface Role {
  id: string;
  /** 「黄巾の頭目」「軍師」「猛将」など。 */
  name: string;
  range: AbilityRange;
}

// ---------------------------------------------------------------- 兵科と部隊

/** 部隊に出せる命令。 */
export type OrderId =
  /** 突撃。三すくみが効く。 */
  | 'charge'
  /** 斉射。弓のみ。反撃を受けない代わりに威力は控えめ。 */
  | 'volley'
  /** 守備。被害を抑える。 */
  | 'guard'
  /** 計略。知力勝負。 */
  | 'stratagem'
  /** 一騎討ちを挑む。 */
  | 'duel'
  /** 退却。兵を失うが生きて帰る。 */
  | 'retreat';

/** ダメージの種類。藤甲兵のように、種類で通り方が変わる兵科がある。 */
export type DamageKind = 'melee' | 'arrow' | 'fire';

export interface UnitType {
  id: string;
  name: string;
  desc: string;
  /** 戦場に置く駒の見た目。 */
  glyph: string;
  /** 武力に掛かる攻撃係数。 */
  attack: number;
  /** 統率に掛かる防御係数。 */
  defense: number;
  /** 行動順の補正。 */
  speed: number;
  /** 兵1人あたりの徴募費用。 */
  cost: number;
  /** 三すくみで有利に立てる相手。 */
  strongAgainst: string[];
  orders: OrderId[];
  /** ダメージ種別ごとの通りやすさ。1が等倍、小さいほど硬い。 */
  resist?: Partial<Record<DamageKind, number>>;
  /** 徴募できる勢力。省略なら誰でも。 */
  recruitableAt?: string[];
  /** 用いるたびに下がる徳。 */
  virtueCost?: number;
}

/** 戦場に浮かぶ損害の数字。 */
export interface Popup {
  text: string;
  color: string;
  life: number;
}

/**
 * 実際に率いている一隊。
 * flash 以下は戦闘中の見せ方のためだけの値で、記録には残らない。
 */
export interface Regiment {
  /** 誰の隊か。武将IDか、名もなき部隊なら null。 */
  officerId: string | null;
  unitId: string;
  troops: number;
  maxTroops: number;
  /** 守備中は被害が減る。 */
  guarding: boolean;
  /** 混乱していると命令が通らない残りターン。 */
  confused: number;
  /** 潰走したか。 */
  routed: boolean;

  /** 被弾の白光り。 */
  flash: number;
  /** 横揺れ。 */
  shake: number;
  /** 突撃で前に出ている量（-1〜1）。 */
  lunge: number;
  /** 潰走してから消えるまで。 */
  fade: number;
  popups: Popup[];
}

// ---------------------------------------------------------------- 勢力と地位

export interface Faction {
  id: string;
  name: string;
  /** 存続期間。範囲外の年には所属できない。 */
  from: number;
  to?: number;
  color: string;
}

/**
 * 出世の階段。実在武将も架空武将も同じ梯子を登る。
 * reach はその地位で「居合わせられる」事件の重要度上限。
 */
export interface Rank {
  id: string;
  name: string;
  tier: number;
  reach: number;
  /** この地位で養える兵の上限にかかる倍率。 */
  troopFactor: number;
}

/** 所属遍歴。配列の順序が時系列（同じ年に複数回移ることもあるため）。 */
export interface Allegiance {
  from: number;
  factionId: string;
  /** 判明していれば初期の地位。 */
  rankId?: string;
}

// ---------------------------------------------------------------- 運命

export type FateKind = 'battle' | 'execution' | 'illness' | 'assassination' | 'longevity';

/**
 * 「本来なるべき」退場。ゲームのラスボスの位置にこれが座る。
 * escape を書かなければ、型ごとの既定の回避条件が使われる。
 */
export interface Fate {
  kind: FateKind;
  year: number;
  /** どの事件で。省略時はその年の所属勢力の戦にあてがわれる。 */
  at?: string;
  /** 誰の手で。列伝の文面に使う。 */
  by?: string;
  /** 史書の一文。そのまま列伝に引く。 */
  record?: string;
  /** 固有の回避条件。列伝級の武将だけが持つ。 */
  escape?: EscapeCondition[];
}

export interface EscapeCondition {
  id: string;
  /** プレイヤーに見せる文言。「呂蒙との和睦に応じる」 */
  label: string;
  /** どうすれば満たせるかの示唆。伏せたいときは省略。 */
  hint?: string;
  test(c: Chronicle): boolean;
}

/** 運命の型ごとの振る舞い。data/fates/ に1ファイル1型で置く。 */
export interface FateArchetype {
  kind: FateKind;
  name: string;
  /** 何と戦うことになるのかの説明。 */
  description: string;
  /** 固有の回避条件が無いときに使う既定の条件。 */
  defaultEscape(fate: Fate, officer: Officer): EscapeCondition[];
  /** 運命の日が近づいたときの予兆。 */
  omen(fate: Fate, officer: Officer, yearsLeft: number): string;
}

// ---------------------------------------------------------------- 出典

/**
 * その話が、どの書物に書かれているか。
 * 上ほど真実に近いとされる。並び順に意味がある。
 */
export type SourceWork =
  /** 陳寿『三国志』本伝。同時代に最も近い記録で、ここが基準線になる。 */
  | 'sanguozhi'
  /** 裴松之注が引く諸書。本伝と食い違う異説の宝庫。 */
  | 'peizhu'
  /** 范曄『後漢書』。後漢側から見た記録。 */
  | 'houhanshu'
  /** 房玄齢ら『晋書』。司馬氏の事績はここが詳しいが、四百年後の編纂。 */
  | 'jinshu'
  /** 司馬光『資治通鑑』。後世の編年体。取捨が入っている。 */
  | 'tongjian'
  /** 羅貫中『三国志演義』。千二百年後の小説。 */
  | 'yanyi'
  /** 民間伝承・雑劇・後世の付会。 */
  | 'folk';

/**
 * その話と、真実との隔たり。
 * 出典とは別の軸で持つ。演義にしか無い話でも、下敷きのある脚色と、
 * まるごとの創作とでは、勉強の上での意味がまるで違うため。
 */
export type Standing =
  /** その書がそう記している。 */
  | 'record'
  /** 他の書と食い違う異説。どちらが正しいとも決まっていない。 */
  | 'variant'
  /** 下敷きになる記録はあるが、膨らませてある。 */
  | 'dramatized'
  /** 下敷きが無い。その書が作った話。 */
  | 'invention';

/**
 * 一つの話の出どころ。
 *
 * 「勉強できるように」の要は insteadTruly にある。
 * 華容道が演義の創作だと言うだけでは足りず、
 * **では正史は何と書いているのか**まで並べて、はじめて学べる。
 */
export interface Attribution {
  work: SourceWork;
  standing: Standing;
  /** その書物のどこか。「関羽伝」「出師表」「山陽公載記」。 */
  locus?: string;
  /** 史実と隔たりがあるとき、正史のほうは何と伝えるか。 */
  insteadTruly?: string;
}

/** 武将が名指しで結びつけられている、その人ひとりの逸話。 */
export interface LifeEvent {
  year: number;
  /** 「万軍の中に顔良を斬る」 */
  text: string;
  attribution: Attribution;
  /**
   * この一行が言い換えている年表の事件。
   * 書いておくと、その事件の「居合わせたはず」の行は年譜から落ちる。
   * 同じ場面が、推し量った行と出典つきの行で二度出るのを防ぐため。
   */
  supersedes?: string;
}

// ---------------------------------------------------------------- 武将

export interface Officer {
  id: string;
  /** 姓名。 */
  name: string;
  /** 字。 */
  courtesy?: string;
  /** 役柄。能力値の自動生成に使う。 */
  roleId: string;
  /** 所属遍歴。1つしかないなら文字列でよい。 */
  allegiance: string | Allegiance[];
  born?: number;
  /** 退場年。名前が出る以上、いつ消えるかは決められる。 */
  died: number;
  fate?: Fate;
  /** 自動生成を上書きしたい能力値だけ書く。 */
  stats?: Partial<Abilities>;
  /**
   * 兵科の得手不得手。-2〜2。
   *
   * 史料が「その者らしい兵」を書き残している場合にだけ手で書く。
   * 白馬義従、西涼の騎兵、弩を引いた老将——そういう手掛かりのある者に限る。
   * 書かなければ能力値から推し量るが、それは史実ではない（systems/aptitude）。
   */
  aptitude?: Record<string, number>;
  /** 「万人の敵」「臥龍」。列伝の素材になる。 */
  epithet?: string;
  /** 固有イベントのID。列伝級だけが持つ。 */
  events?: string[];
  /**
   * その人ひとりの逸話。年表の事件にならない場面はここに置く。
   * 一行ずつ出典を持たせるので、正史と演義が同じ伝の中に並んでも取り違えない。
   */
  life?: LifeEvent[];
  /**
   * この人物そのものの出どころ。
   * 貂蝉のように演義が作った人物は、生涯すべてが物語の中の話になる。
   * 書かなければ「正史に記載あり」とみなす。
   */
  attribution?: Attribution;
  /** 架空の人物か。運命を持たない代わりに、目標が変わる。 */
  fictional?: boolean;
}

// ---------------------------------------------------------------- 年表

export interface HistoryEvent {
  id: string;
  year: number;
  name: string;
  /** 重要度 1〜5。地位の reach が届かないと居合わせられない。 */
  weight: number;
  /** 関わる勢力。所属が一致すると出席の候補になる。 */
  factions: string[];
  /** 史実の結末。プレイヤーの結果と突き合わせて「然れども」を出す。 */
  record: string;
  /** この事件そのものの出どころ。書かなければ「正史に記載あり」とみなす。 */
  attribution?: Attribution;
  /**
   * 居合わせなかったとき（あるいは史実どおりに振る舞ったとき）、
   * 世界の側で実際に起きること。書かなければ、誰も死なず城も動かない。
   */
  aftermath?: Aftermath;
  /** 立場ごとの場面。上から順に、最初に条件を満たしたものを使う。 */
  scenes: EventScene[];
}

/**
 * 世界に残る痕跡。
 *
 * 「誰が死ぬか」は原則として武将の没年から勝手に出るので、ここに書くのは
 * **その年に起きるはずのないことを起こす**ときだけでよい（城が動く、命拾いする）。
 */
export interface Aftermath {
  /** この事件で城市の主が変わる。 */
  seize?: { city: string; faction: string }[];
  /** 史実では没する年なのに、生き延びる者。 */
  spares?: string[];
  /** 史実より早く、あるいは史実と別の形で命を落とす者。 */
  slays?: string[];
  /** 世に流れる報せの一文。省略すれば record がそのまま流れる。 */
  news?: string;
}

export interface EventScene {
  id: string;
  /** 出席条件。省略なら誰でも。 */
  when?(c: Chronicle): boolean;
  text: string;
  choices: EventChoice[];
}

export interface EventChoice {
  label: string;
  /** 史実どおりの選択か。列伝で「然れども」を出すかの判定に使う。 */
  historical?: boolean;
  /** 選べる条件。満たさないときは灰色で見せる。 */
  requires?(c: Chronicle): boolean;
  effect: ChoiceEffect;
}

export interface ChoiceEffect {
  /** 記録に残る一文。これが積もって列伝になる。 */
  deed: string;
  flags?: Record<string, boolean>;
  renown?: number;
  /** 徳の増減。生き方で動く唯一の能力値。 */
  virtue?: number;
  troops?: number;
  gold?: number;
  /** 戦うなら。相手は武将IDか、兵の役柄ID。 */
  battle?: { enemies: string[]; escapable?: boolean };
  /** 勢力を移る。 */
  joinFaction?: string;
  /**
   * この選択が世界に残す痕跡。
   * 史実から外れた選択でだけ意味を持つ（史実どおりなら事件側の aftermath が使われる）。
   * 呂布を斬らずに逃がしたなら、ここに `spares: ['lvbu']` と書く。
   */
  aftermath?: Aftermath;
}

// ---------------------------------------------------------------- 進行状態

/** 列伝の一行になる出来事。 */
export interface Deed {
  year: number;
  eventId?: string;
  text: string;
  /** 史実と違うことをしたか。列伝で強調される。 */
  diverged?: boolean;
}

/** セーブデータそのもの。「この人物が歩んだ道の記録」。 */
export interface Chronicle {
  /** 実在武将ならそのID。 */
  officerId: string;
  /** 架空武将なら定義ごと持ち歩く。 */
  custom?: Officer;
  year: number;
  /** 月と日。移動そのものが時を食う。 */
  month: number;
  day: number;
  /** 地図上のどこにいるか。 */
  x: number;
  y: number;
  /** 'world' なら世界地図の上。城市の中にいるならその城市ID。 */
  where: string;
  dir: Dir;
  factionId: string;
  rankId: string;
  /** 名声。出世と登用に効く。 */
  renown: number;
  /** 徳の増減ぶん。素の徳に足して使う。 */
  virtueDelta: number;
  troops: number;
  gold: number;
  /**
   * 兵糧（石）。
   *
   * 兵は食う。仕官していれば主君から給わり、自立していれば城の実りか市で贖う。
   * 尽きれば兵は斬られるのではなく、去っていく（systems/provisions）。
   * 古い記録には無いので省略可。
   */
  food?: number;
  /** 登用した武将のID。 */
  roster: string[];
  /**
   * 配下ひとりずつの心。0〜100。
   *
   * 主の生き方を、隣で見ている者たちの評価。徳に従って動き、
   * 尽きれば黙って陣を去る（systems/hearts）。
   */
  hearts?: Record<string, number>;
  /**
   * 生涯を聞いた者のID。
   *
   * このゲームの本題は「各武将の歴史を知ること」なので、
   * 何人ぶんの生涯を最後まで読んだかを数えておく。結びで讃えるのはこの数である。
   */
  met?: string[];
  deeds: Deed[];
  flags: Record<string, boolean>;
  /** 満たした回避条件のID。 */
  escaped: string[];
  /** 運命の日を越えたか。 */
  survived: boolean;
  alive: boolean;
  /** 自分の与り知らぬところで進んだ世界。古い記録には無いので省略可。 */
  world?: WorldState;
}

// ---------------------------------------------------------------- 世界

/** 世に流れた報せ。年代記と酒楼の噂の素になる。 */
export interface WorldNews {
  year: number;
  text: string;
  /**
   * history  … 史実どおりに片づいた
   * divergence … 自分が関わったせいで史書と違う形になった
   * death    … 誰かが世を去った
   * seize    … 城の主が変わった
   * ruin     … 勢力が滅んだ
   */
  kind: 'history' | 'divergence' | 'death' | 'seize' | 'ruin';
  eventId?: string;
}

/**
 * 自ら立てた旗。
 *
 * 史実の勢力は data 側に固定で並んでいるが、これは史書に無い勢力なので
 * 世界の差分として持ち歩く。読み込むたびに勢力名簿へ足し直す。
 */
export interface FoundedFaction {
  id: string;
  name: string;
  color: string;
  /** 旗を挙げた年。 */
  from: number;
  /** 挙げた者。 */
  lordId: string;
}

/**
 * 自分がいない場所で進んだぶんの世界。
 *
 * 史実そのものは data 側から引けるので、ここには**史実との差分だけ**を持つ。
 * こうしておけば、セーブデータが太らないし、
 * 「何も変えていない世界」は空っぽの WorldState で表せる。
 */
export interface WorldState {
  /** この年までは世界の側で解決済み。 */
  resolvedTo: number;
  /** 史実では没するはずが、生き延びている者。 */
  spared: string[];
  /** 史実と違う年・違う形で世を去った者。武将ID → 没年。 */
  slain: Record<string, number>;
  /** 主が史実と食い違う城市。城市ID → いつから誰のものか。 */
  seized: Record<string, { factionId: string; year: number }>;
  /** 史書に無い、自前の旗。 */
  founded?: FoundedFaction;

  /** 世に流れた報せ。古い順。 */
  news: WorldNews[];
}
