/**
 * 建安十四年〜二十三年（209〜218）。赤壁のあと、三つの勢力が形になるまで。
 *
 * 劉備が初めて土地を持ち、曹操が王を称し、孫権が合肥で手痛く学ぶ十年。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_sijun',
    year: 209,
    name: '荊南四郡',
    weight: 3,
    factions: ['liubei', 'liubiao'],
    record: '劉備、武陵・長沙・桂陽・零陵を降し、初めて己の地を得る',
    aftermath: {
      news: '荊州の南四郡、劉備のものとなる',
    },
    scenes: [
      {
        id: 'as_liubei',
        when: (c) => c.factionId === 'liubei',
        text:
          '赤壁で曹操が退いた。荊州の南は、いま誰のものでもない。\n' +
          '——半生を人の客として過ごしてきた。\n' +
          'ここが、初めて自分の土地になる。',
        choices: [
          {
            label: '四郡を降し、民を安んずる',
            historical: true,
            effect: {
              deed: '荊南の四郡を降し、初めて己の地を得る',
              flags: { 'joined:ev_sijun': true, 'holds:jingnan': true },
              renown: 45,
              virtue: 10,
              gold: 250,
              troops: 300,
            },
          },
          {
            label: '呉と分け合い、貸しを作らない',
            effect: {
              deed: '荊南を呉と分かち、後の禍根を断つ',
              flags: { 'joined:ev_sijun': true, 'peace:wu': true },
              renown: 25,
              virtue: 20,
              gold: 120,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_zhouyu_dies',
    year: 210,
    name: '巴丘の病',
    weight: 3,
    factions: ['wu', 'liubei'],
    record: '周瑜、益州を取る策を抱いたまま巴丘に没す。三十六',
    aftermath: {
      news: '周瑜没す。呉の鋒は、ここで鈍った',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '都督が倒れた。益州を取り、蜀と呉で天下を二分する——\n' +
          'その策を書いた紙が、まだ机の上にある。\n\n' +
          '「人生に死あり、修短は命なり」と、最後まで惜しんでいたという。',
        choices: [
          {
            label: '魯粛を後任に推す',
            historical: true,
            effect: {
              deed: '周瑜の遺志により、魯粛を後任に推す',
              flags: { 'joined:ev_zhouyu_dies': true, 'backed:lusu': true },
              renown: 25,
              virtue: 12,
            },
          },
          {
            label: '周瑜の策を継ぎ、益州へ兵を出す',
            effect: {
              deed: '周瑜の遺策を継ぎ、益州へ向かう',
              flags: { 'joined:ev_zhouyu_dies': true, 'attempted:yizhou': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 40,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_ruxukou',
    year: 213,
    name: '濡須口',
    weight: 3,
    factions: ['caocao', 'wu'],
    record: '曹操、孫権の軍容を望んで「子を生まば当に孫仲謀の如くなるべし」と嘆ず',
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '対岸に曹操の旗が並んでいる。\n' +
          '大船を出して、自ら川筋を見に行くこともできる。\n' +
          '——矢が飛んでくるだろうが、相手の陣立ても見える。',
        choices: [
          {
            label: '船を出し、自ら敵陣を望む',
            historical: true,
            effect: {
              deed: '船を出して曹操の陣を望み、矢を受けて悠々と帰る',
              flags: { 'joined:ev_ruxukou': true, 'won:ev_ruxukou': true },
              renown: 45,
              virtue: 5,
            },
          },
          {
            label: '陣を固めて動かない',
            effect: {
              deed: '濡須に拠って守りを固める',
              flags: { 'joined:ev_ruxukou': true },
              renown: 20,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '対岸の船が整然と並んでいる。若い当主が、自ら舳先に立っているという。\n' +
          '——劉景升の子らとは、まるで違う。',
        choices: [
          {
            label: '射させず、その軍容を見届ける',
            historical: true,
            effect: {
              deed: '孫権の軍容を望み、「子を生まば孫仲謀の如くなるべし」と嘆ず',
              flags: { 'joined:ev_ruxukou': true },
              renown: 25,
              virtue: 10,
            },
          },
          {
            label: '矢を浴びせて沈める',
            effect: {
              deed: '濡須にて孫権の船に矢を浴びせる',
              flags: { 'joined:ev_ruxukou': true },
              battle: { enemies: ['ganning', 'lvmeng'], escapable: true },
              renown: 30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_weiwang',
    year: 216,
    name: '魏王',
    weight: 4,
    factions: ['caocao', 'han'],
    record: '曹操、魏王となる。異姓の王は、高祖の誓いに背く',
    aftermath: {
      news: '曹操、魏王となる。漢の臣に異姓の王は無いはずであった',
    },
    scenes: [
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '公から王へ。誰も口には出さないが、次に何が来るかは皆が知っている。\n' +
          '荀彧はもういない。あの男は、公になる段でさえ首を横に振った。\n\n' +
          '——受けるか。',
        choices: [
          {
            label: '王位を受ける',
            historical: true,
            effect: {
              deed: '魏王の位を受ける',
              flags: { 'joined:ev_weiwang': true, 'became:weiwang': true },
              renown: 60,
              virtue: -20,
            },
          },
          {
            label: '固辞し、漢の臣に留まる',
            effect: {
              deed: '王位を固辞し、漢の丞相に留まる',
              flags: { 'declined:weiwang': true, 'loyal:han': true },
              renown: 30,
              virtue: 35,
            },
          },
        ],
      },
      {
        id: 'as_han',
        when: (c) => c.factionId === 'han',
        text:
          '高祖の誓いに曰く、「劉氏に非ずして王たらば、天下ともにこれを撃て」。\n' +
          '——その誓いが、いま破られようとしている。',
        choices: [
          {
            label: '朝議で異を唱える',
            effect: {
              deed: '曹操の王位に異を唱える',
              flags: { 'opposed:weiwang': true, 'loyal:han': true },
              renown: 30,
              virtue: 30,
            },
          },
          {
            label: '黙って見送る',
            historical: true,
            effect: {
              deed: '魏王の冊立を黙して見送る',
              flags: { 'joined:ev_weiwang': true },
              renown: 5,
              virtue: -5,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_hanzhong',
    year: 218,
    name: '漢中争奪',
    weight: 4,
    factions: ['caocao', 'liubei', 'wei'],
    record: '劉備、漢中を得て王を称す。曹操は「鶏肋」と言い残して兵を返す',
    aftermath: {
      seize: [{ city: 'jiange', faction: 'liubei' }],
      news: '漢中は劉備のものとなり、劉備は漢中王を称す',
    },
    scenes: [
      {
        id: 'as_liubei',
        when: (c) => c.factionId === 'liubei',
        text:
          '定軍山で夏侯淵を斬った。曹操は自ら出てきたが、山を隔てて動かない。\n' +
          '法正が言う。「険に拠って待てば、退きます」\n' +
          '——待つか、押すか。',
        choices: [
          {
            label: '険に拠って動かず、退くのを待つ',
            historical: true,
            effect: {
              deed: '漢中の険に拠って曹操を退かせ、漢中王を称す',
              flags: { 'joined:ev_hanzhong': true, 'won:ev_hanzhong': true, 'became:hanzhongwang': true },
              renown: 80,
              troops: 400,
            },
          },
          {
            label: '山を下りて決戦を挑む',
            effect: {
              deed: '漢中にて曹操と正面から戦う',
              flags: { 'joined:ev_hanzhong': true },
              battle: { enemies: ['xuchu', 'zhanghe', 'xuhuang'], escapable: true },
              renown: 50,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao' || c.factionId === 'wei',
        text:
          '兵糧は続かず、進めば険に阻まれる。\n' +
          '夜の合言葉を問われて、鶏の骨を見ながら口をついて出た。\n\n' +
          '「鶏肋」——食うところは無いが、捨てるには惜しい。',
        choices: [
          {
            label: '兵を返す',
            historical: true,
            effect: {
              deed: '漢中を捨てて兵を返す',
              flags: { 'joined:ev_hanzhong': true, 'retreated:hanzhong': true },
              renown: -15,
              troops: -300,
            },
          },
          {
            label: '踏みとどまり、長期戦に持ち込む',
            effect: {
              deed: '漢中に踏みとどまって持久する',
              flags: { 'joined:ev_hanzhong': true, 'held:hanzhong': true },
              battle: { enemies: ['zhangfei', 'machao'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },
];

export default events;
