/**
 * 青龍三年〜正始九年（235〜248）。年表でいちばん長く空いていた十四年。
 *
 * 諸葛亮も曹操も呂布もいない。英雄の代が終わり、
 * 残された者たちが国を保つ——あるいは、内から食い破る。
 * 高平陵の変は、この十四年の澱みの果てに起きる。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_jiangwan',
    year: 241,
    name: '蒋琬の涪への移鎮',
    weight: 3,
    factions: ['shu', 'wu'],
    record: '蒋琬、漢中より涪に移る。水路より魏を伐たんとせしが、衆議これを危ぶむ',
    aftermath: {
      news: '蜀の政、守りに転ず。北伐の兵は、しばらく動かない',
    },
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '諸葛亮が逝ってから七年。蒋琬は北伐を再開せず、国を休ませてきた。\n' +
          'だが病を得て、いま新しい策を出している。\n\n' +
          '「秦嶺の道は嶮しく、糧が続かぬ。漢水を下って魏興・上庸を襲うべし」\n' +
          '——退路の無い策である、と衆議は言う。',
        choices: [
          {
            label: '水路の策に賛同する',
            effect: {
              deed: '蒋琬の水路東下の策を支持す',
              flags: { 'joined:ev_jiangwan': true },
              renown: 15,
              virtue: 5,
            },
          },
          {
            label: '涪に退いて守るべきだと説く',
            historical: true,
            effect: {
              deed: '涪に鎮して国を養うべしと説く',
              flags: { 'joined:ev_jiangwan': true, 'rest:shu': true },
              renown: 20,
              virtue: 15,
            },
          },
          {
            label: '自ら兵を率いて隴西を窺う',
            effect: {
              deed: '蒋琬の下で隴西を窺う',
              flags: { 'joined:ev_jiangwan': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 25,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '芍陂に出た。魏の王淩と、四月にわたって睨み合っている。\n' +
          '同じ年、朱然は樊城を囲み、諸葛瑾は柤中に入った。\n' +
          '呉が四道から北へ出た年である。\n\n' +
          '——だが、どの道も抜けなかった。',
        choices: [
          {
            label: '芍陂に踏みとどまる',
            historical: true,
            effect: {
              deed: '芍陂にて魏軍と当たる',
              flags: { 'joined:ev_jiangwan': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 20,
            },
          },
          {
            label: '兵を退く。四道はどれも実らない',
            effect: {
              deed: '芍陂より兵を退く',
              flags: { 'joined:ev_jiangwan': true },
              renown: 5,
              troops: -100,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_erguan',
    year: 245,
    name: '二宮の変',
    weight: 4,
    factions: ['wu'],
    record: '孫和と孫覇の争い、朝を二つに裂く。陸遜、責められて憤死す',
    aftermath: {
      news: '呉の朝、後継ぎ争いに裂かる。陸遜、憤りのうちに没す',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '太子孫和と魯王孫覇。帝が二人を同じ扱いにしたところから、朝が割れた。\n' +
          'どちらに付くかで、呉の臣は真っ二つになっている。\n\n' +
          '陸遜は「嫡庶を分かつべし」と繰り返し上疏し、\n' +
          '孫権はそのたびに使者を送って責めた。\n' +
          '——夷陵で劉備を焼いた人が、いま書面で責められて痩せていく。',
        choices: [
          {
            label: '陸遜とともに嫡庶の分を説く',
            historical: true,
            effect: {
              deed: '二宮の争いに嫡庶の分を説く',
              flags: { 'joined:ev_erguan': true, 'stood:luxun': true },
              renown: 25,
              virtue: 30,
            },
          },
          {
            label: '魯王に付く。勝つ側に立たねば身が危うい',
            effect: {
              deed: '魯王孫覇に与す',
              flags: { 'joined:ev_erguan': true },
              renown: 20,
              virtue: -25,
            },
          },
          {
            label: 'どちらにも与しない',
            effect: {
              deed: '二宮のいずれにも与せず',
              flags: { 'joined:ev_erguan': true },
              renown: 5,
              virtue: 10,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_liaodong',
    year: 238,
    name: '遼東征伐',
    weight: 4,
    factions: ['wei'],
    record: '司馬懿、公孫淵を襄平に滅ぼす。往復千里を一年で果たす',
    aftermath: {
      news: '遼東の公孫氏滅ぶ。司馬懿の名、いよいよ重くなる',
    },
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '帝に「往還にどれほどかかる」と問われた。\n' +
          '「往くに百日、攻むるに百日、還るに百日、休むに六十日。一年で足ります」\n\n' +
          '——言ったとおりの日数で、襄平の城が見えてきた。',
        choices: [
          {
            label: '城を囲み、水の引くのを待って一気に落とす',
            historical: true,
            effect: {
              deed: '襄平を囲み、公孫淵を滅ぼす',
              flags: { 'joined:ev_liaodong': true, 'won:ev_liaodong': true },
              battle: { enemies: ['general', 'officer'], escapable: false },
              renown: 55,
            },
          },
          {
            label: '降を容れ、遼東の民を殺さない',
            effect: {
              deed: '遼東の降を容れ、殺戮を避ける',
              flags: { 'joined:ev_liaodong': true, 'spared:liaodong': true },
              renown: 35,
              virtue: 25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_caorui_dies',
    year: 239,
    name: '明帝の遺詔',
    weight: 5,
    factions: ['wei'],
    record: '曹叡没す。八つの養子を、曹爽と司馬懿に託す',
    aftermath: {
      news: '曹叡没し、幼帝が立つ。政は曹爽と司馬懿の二人に委ねられた',
    },
    scenes: [
      {
        id: 'as_simayi',
        when: (c) => c.officerId === 'simayi',
        text:
          '危篤の報せに、遼東から三日で駆けつけた。\n' +
          '帝は手を取って言った。「死を忍びてこれを待つ。相見ることを得て、恨むこと無し」\n\n' +
          '幼い斉王が横にいる。もう一人の後見は、曹爽。',
        choices: [
          {
            label: '謹んで受け、曹爽を立てる',
            historical: true,
            effect: {
              deed: '明帝の遺詔を受け、曹爽とともに幼帝を輔く',
              flags: { 'joined:ev_caorui_dies': true, 'regent:wei': true },
              renown: 50,
            },
          },
          {
            label: '固辞して兵権を返し、身を退く',
            effect: {
              deed: '後見を固辞し、兵権を返して郷里に退く',
              flags: { 'declined:regency': true },
              renown: 20,
              virtue: 35,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '曹叡が三十六で没した。跡を継ぐのは、八つの養子。\n' +
          '曹爽と司馬懿、二人が後見に立つという。\n' +
          '——二人でひとつの政が、いつまでもつだろうか。',
        choices: [
          {
            label: '曹爽に付く',
            effect: {
              deed: '曹爽の側に立つ',
              flags: { 'joined:ev_caorui_dies': true, 'backed:caoshuang': true },
              renown: 25,
            },
          },
          {
            label: '司馬懿に付く',
            effect: {
              deed: '司馬懿の側に立つ',
              flags: { 'joined:ev_caorui_dies': true, 'backed:simayi': true },
              renown: 25,
            },
          },
          {
            label: 'どちらにも与せず、職を守る',
            historical: true,
            effect: {
              deed: '党を作らず、己の職を守る',
              flags: { 'joined:ev_caorui_dies': true, neutral: true },
              renown: 15,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_xingshi',
    year: 244,
    name: '興勢の役',
    weight: 3,
    factions: ['wei', 'shu'],
    record: '曹爽、十万を率いて漢中を攻めるも、王平に阻まれて大敗す',
    aftermath: {
      news: '曹爽、興勢に敗れる。その威は、この一戦で地に落ちた',
    },
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '漢中の兵は三万に満たない。敵は十万を号している。\n' +
          '「陽平関まで退いて待つべきだ」と言う者が多い。\n\n' +
          '王平が言った。「興勢の険を先に取れば、通せません」',
        choices: [
          {
            label: '興勢の険を先に取る',
            historical: true,
            effect: {
              deed: '興勢の険に拠り、十万を通さず',
              flags: { 'joined:ev_xingshi': true, 'won:ev_xingshi': true },
              renown: 55,
            },
          },
          {
            label: '陽平関まで退いて待つ',
            effect: {
              deed: '漢中の外を捨て、陽平関に退いて守る',
              flags: { 'joined:ev_xingshi': true },
              battle: { enemies: ['general', 'general'], escapable: true },
              renown: 20,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '大将軍が功を欲しがっている。蜀を攻めれば名が立つ、と。\n' +
          '——道は細く、糧を運ぶ牛馬が次々に倒れている。',
        choices: [
          {
            label: '進む',
            historical: true,
            effect: {
              deed: '漢中へ進み、興勢の険に阻まれる',
              flags: { 'joined:ev_xingshi': true },
              battle: { enemies: ['wangping'], escapable: true },
              renown: -10,
              troops: -500,
            },
          },
          {
            label: '諌めて兵を返させる',
            effect: {
              deed: '曹爽を諌めて兵を返させる',
              flags: { 'joined:ev_xingshi': true, 'warned:caoshuang': true },
              renown: 30,
              virtue: 15,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_simayi_feigns',
    year: 247,
    name: '病と称して',
    weight: 4,
    factions: ['wei'],
    record: '司馬懿、病と称して門を閉ざす。曹爽は油断し、備えを解いた',
    scenes: [
      {
        id: 'as_simayi',
        when: (c) => c.officerId === 'simayi',
        text:
          '曹爽が兵権をことごとく己の兄弟に移した。もはや朝廷に居場所はない。\n' +
          '見舞いの使いが来る。李勝——曹爽の腹心。\n\n' +
          '——粥をこぼし、荊州を并州と聞き違えてみせるか。',
        choices: [
          {
            label: '老いぼれを演じ、相手を油断させる',
            historical: true,
            effect: {
              deed: '病と称して門を閉ざし、時を待つ',
              flags: { 'joined:ev_simayi_feigns': true, 'feigned:illness': true },
              renown: 10,
              virtue: -15,
            },
          },
          {
            label: '偽らず、正面から兵権の返還を求める',
            effect: {
              deed: '偽らず、朝議にて曹爽を糺す',
              flags: { 'joined:ev_simayi_feigns': true, 'confronted:caoshuang': true },
              renown: 35,
              virtue: 30,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '太傅が病に臥せっているという。見舞いに行った者が言うには、\n' +
          '粥を口からこぼし、人の言葉も聞き取れなかったと。\n\n' +
          '——本当だろうか。',
        choices: [
          {
            label: '本当だと思う。もはや案ずるに足りない',
            historical: true,
            effect: {
              deed: '司馬懿はもはや老いたりと見る',
              flags: { 'joined:ev_simayi_feigns': true, 'misjudged:simayi': true },
              renown: 5,
            },
          },
          {
            label: '偽りを疑い、備えを解かぬよう説く',
            effect: {
              deed: '司馬懿の病を疑い、備えを解くなと説く',
              flags: { 'joined:ev_simayi_feigns': true, 'suspected:simayi': true },
              renown: 30,
            },
          },
        ],
      },
    ],
  },
];

export default events;
