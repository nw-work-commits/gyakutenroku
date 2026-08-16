/** 建安十三年〜十六年（208〜211）。赤壁と、西涼の恨み。 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_changban',
    year: 208,
    name: '長坂坡',
    weight: 4,
    factions: ['liubei', 'caocao'],
    record: '劉備、民を連れて南へ落ちる。趙雲、単騎で阿斗を救い出す',
    scenes: [
      {
        id: 'as_liubei_side',
        when: (c) => c.factionId === 'liubei',
        text:
          '十万の民がついてきている。一日に十里しか進まない。\n' +
          '曹操の騎兵は、一日で三百里を走る。\n' +
          '——民を、置いていくか。',
        choices: [
          {
            label: '民を連れて進む',
            historical: true,
            effect: {
              deed: '十万の民を連れて南へ落ちる',
              flags: { 'joined:ev_changban': true },
              battle: { enemies: ['xiahoudun', 'general'], escapable: true },
              renown: 30,
              virtue: 30,
            },
          },
          {
            label: '民を置いて江陵を先に取る',
            effect: {
              deed: '民を置き去りにして江陵へ急ぐ',
              flags: { 'abandoned:people': true },
              renown: 20,
              virtue: -30,
              troops: 400,
            },
          },
          {
            label: '殿(しんがり)を引き受ける',
            effect: {
              deed: '殿を務め、追撃を食い止める',
              flags: { 'joined:ev_changban': true, 'retreated:ev_changban': true },
              battle: { enemies: ['zhangliao'], escapable: true },
              renown: 45,
              virtue: 20,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '敵は民を連れて、亀のように遅い。\n' +
          '軽騎で追えば、今日中に追いつく。',
        choices: [
          {
            label: '軽騎で追撃する',
            historical: true,
            effect: {
              deed: '軽騎を率いて長坂まで追撃す',
              flags: { 'joined:ev_changban': true },
              battle: { enemies: ['zhaoyun', 'zhangfei'], escapable: true },
              renown: 35,
            },
          },
          {
            label: '民を巻き込まぬよう手加減する',
            effect: {
              deed: '民を避けて追撃し、無用の殺生を避ける',
              renown: 15,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_chibi',
    year: 208,
    name: '赤壁の戦い',
    weight: 5,
    factions: ['caocao', 'wu', 'liubei', 'liubiao'],
    record: '周瑜・黄蓋の火計により曹操の船団焼かる。天下三分の勢定まる',
    aftermath: {
      news: '赤壁に曹操の船団焼かる。北の軍は退き、江南は保たれた',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu' || c.factionId === 'liubei',
        text:
          '長江の対岸に、曹操の船が埋め尽くしている。\n' +
          '八十万を号しているという。実数はその四分の一としても。\n\n' +
          '黄蓋が言った。「船を鎖で繋いでおります。ならば——」',
        choices: [
          {
            label: '火計を用いる',
            historical: true,
            effect: {
              deed: '赤壁にて火計を献じ、曹操の船団を焼く',
              flags: { 'joined:ev_chibi': true, 'won:ev_chibi': true },
              renown: 80,
            },
          },
          {
            label: '正面から水戦を挑む',
            effect: {
              deed: '赤壁にて水軍を率いて戦う',
              flags: { 'joined:ev_chibi': true },
              battle: { enemies: ['caoren', 'yujin'], escapable: true },
              renown: 40,
            },
          },
          {
            label: '曹操に降ることを主張する',
            effect: {
              deed: '衆議において降伏を説く',
              renown: -30,
              virtue: -15,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '北の兵は船に酔う。将たちが船を鎖で繋ぐことを勧めてきた。\n' +
          '確かに揺れは収まる。だが——\n' +
          '「もし火を放たれたら」と、ひとりが言いかけて、黙った。',
        choices: [
          {
            label: '船を鎖で繋ぐ',
            historical: true,
            effect: {
              deed: '船を鎖で繋ぎ、兵の船酔いを防ぐ',
              flags: { 'joined:ev_chibi': true, 'chained:ships': true },
              renown: 15,
            },
          },
          {
            label: '繋がず、風向きを見張らせる',
            effect: {
              deed: '船を繋がず、東南の風を警戒す',
              flags: { 'joined:ev_chibi': true, 'won:ev_chibi': true },
              renown: 50,
              // 火が回らなければ、長江は越えられてしまう。天下は三分しない。
              aftermath: {
                seize: [
                  { city: 'chaisang', faction: 'caocao' },
                  { city: 'jiangling', faction: 'caocao' },
                ],
                news: '赤壁に火は回らず。曹操の軍、長江を越えて江南に入る',
              },
            },
          },
          {
            label: '疫病を理由に、一度北へ返す',
            effect: {
              deed: '疫病を憂い、兵を北へ返す',
              flags: { 'retreated:ev_chibi': true },
              renown: -10,
              virtue: 15,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_huarongdao',
    year: 208,
    name: '華容道',
    weight: 3,
    factions: ['liubei', 'caocao'],
    record: '関羽、華容道にて曹操を捕らえるも、かつての恩を思うて逃がす',
    attribution: {
      work: 'yanyi',
      standing: 'invention',
      insteadTruly:
        '曹操が華容道の泥濘を抜けて逃れたことは裴注（山陽公載記）にあり、脱出後に「劉備は我が匹だが、計を出すのが遅い」と笑ったとも伝わる。' +
        'だが待ち伏せた者はおらず、関羽はこのときそこにいない。',
    },
    scenes: [
      {
        id: 'as_guanyu',
        when: (c) => c.officerId === 'guanyu',
        text:
          '泥の道の向こうから、負け残りの兵が来る。\n' +
          '先頭にいるのは、かつて三日に小宴、五日に大宴を張ってくれた男。\n\n' +
          '軍令状には、逃がせば首を刎ねると書いた。',
        choices: [
          {
            label: '恩に報いて逃がす',
            historical: true,
            effect: {
              deed: '華容道にて曹操を逃がす',
              flags: { 'joined:ev_huarongdao': true, 'favor:caocao': true, 'spared:caocao': true },
              renown: 20,
              virtue: 25,
            },
          },
          {
            label: '軍令に従って討つ',
            effect: {
              deed: '華容道にて曹操を討ち取る',
              flags: { 'joined:ev_huarongdao': true, 'killed:caocao': true },
              battle: { enemies: ['caocao', 'zhangliao', 'xuchu'], escapable: false },
              renown: 90,
              virtue: -15,
            },
          },
          {
            label: '道を空け、無言で見送る',
            effect: {
              deed: '道を空けて曹操を見送る',
              flags: { 'joined:ev_huarongdao': true, 'favor:caocao': true },
              renown: 10,
              virtue: 15,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '泥で馬が進まない。兵は千を切った。\n' +
          '道の先に、青龍偃月刀の影が見える。',
        choices: [
          {
            label: '昔の縁に訴える',
            historical: true,
            effect: {
              deed: '華容道にて旧恩を説き、窮地を脱す',
              flags: { 'joined:ev_huarongdao': true },
              renown: 15,
              virtue: -5,
            },
          },
          {
            label: '斬り抜ける',
            effect: {
              deed: '華容道を力ずくで突破す',
              flags: { 'joined:ev_huarongdao': true },
              battle: { enemies: ['guanyu'], escapable: true },
              renown: 40,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_mateng',
    year: 211,
    name: '許都の招き',
    weight: 3,
    factions: ['matengs', 'caocao'],
    record: '馬騰、許都に召されて一族もろとも誅さる',
    scenes: [
      {
        id: 'as_ma',
        when: (c) => c.factionId === 'matengs',
        text:
          '許都から使いが来た。父を召す、という。\n' +
          '「行けば戻れぬ」と、皆が言う。\n' +
          '「行かねば叛意ありと見なされる」と、父が言う。',
        choices: [
          {
            label: '父を行かせる',
            historical: true,
            effect: {
              deed: '父を許都へ送り出す',
              flags: { 'joined:ev_mateng': true },
              renown: 5,
            },
          },
          {
            label: '一族を先に涼州へ逃がす',
            effect: {
              deed: '一族を涼州へ逃がし、然る後に事を起こす',
              flags: { 'saved:mateng': true },
              renown: 25,
              virtue: 15,
            },
          },
          {
            label: '父の代わりに自分が行く',
            effect: {
              deed: '父に代わって許都へ赴く',
              flags: { 'saved:mateng': true, 'captured:ev_mateng': true },
              renown: 30,
              virtue: 30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_tongguan',
    year: 211,
    name: '潼関の戦い',
    weight: 4,
    factions: ['matengs', 'caocao'],
    record: '馬超、曹操を追い詰めるも、賈詡の離間の計により韓遂と割れて敗る',
    scenes: [
      {
        id: 'as_ma',
        when: (c) => c.factionId === 'matengs',
        text:
          '曹操の髭を切らせ、袍を捨てさせるところまで追い詰めた。\n' +
          'だが韓遂のもとへ、曹操の書が届いたという。\n' +
          '——墨で塗り潰された、読めない書が。',
        choices: [
          {
            label: '韓遂を疑い、問い詰める',
            historical: true,
            effect: {
              deed: '韓遂を疑い、西涼の陣に亀裂を生ず',
              flags: { 'joined:ev_tongguan': true, 'feud:hansui': true },
              renown: 20,
            },
          },
          {
            label: '離間の計と見抜き、韓遂を信じる',
            effect: {
              deed: '離間の計を見抜き、韓遂と結束を保つ',
              flags: { 'joined:ev_tongguan': true, 'won:ev_tongguan': true },
              renown: 60,
              virtue: 15,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '危うく首を取られるところだった。\n' +
          '正面から西涼の騎兵に勝つのは難しい。\n' +
          '賈詡が薄く笑って言った。「墨を、少々」',
        choices: [
          {
            label: '離間の計を用いる',
            historical: true,
            effect: {
              deed: '離間の計により西涼軍を割る',
              flags: { 'joined:ev_tongguan': true, 'won:ev_tongguan': true },
              renown: 50,
              virtue: -8,
            },
          },
          {
            label: '正面から騎兵に当たる',
            effect: {
              deed: '潼関にて西涼の騎兵と正面から戦う',
              flags: { 'joined:ev_tongguan': true },
              battle: { enemies: ['machao'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },
];

export default events;
