/**
 * 黄初五年〜青龍元年（224〜233）。三国が揃い、そして睨み合いに入る。
 *
 * 孫権が最後に帝を称した年に、三国は本当に三国になった。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_guangling',
    year: 224,
    name: '広陵の水',
    weight: 3,
    factions: ['wei', 'wu'],
    record: '曹丕、長江を望んで「天の南北を限る所」と嘆じ、兵を返す',
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '十万の兵を並べて広陵に至った。だが対岸には、見渡すかぎり城壁が続いている。\n' +
          '——一夜のうちに葦で組んだ偽の城だと、後で知れた。\n\n' +
          'そして目の前の川は、あまりに広い。',
        choices: [
          {
            label: '「これは天が南北を限るところだ」と言って返す',
            historical: true,
            effect: {
              deed: '長江を望んで渡らず、兵を返す',
              flags: { 'joined:ev_guangling': true },
              renown: -10,
            },
          },
          {
            label: '渡る。船を並べて押し渡る',
            effect: {
              deed: '長江を押し渡ろうと試みる',
              flags: { 'joined:ev_guangling': true, 'crossed:changjiang': true },
              battle: { enemies: ['luxun', 'ganning'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '魏の大軍が対岸に着いた。こちらの兵は足りない。\n' +
          '——ならば、有るように見せるほかない。',
        choices: [
          {
            label: '一夜で葦の城を組み、旗を立て並べる',
            historical: true,
            effect: {
              deed: '一夜にして偽城を築き、魏軍を退かせる',
              flags: { 'joined:ev_guangling': true, 'won:ev_guangling': true },
              renown: 45,
            },
          },
          {
            label: '水軍を出して渡河を阻む',
            effect: {
              deed: '水軍を出して魏軍の渡河を阻む',
              flags: { 'joined:ev_guangling': true },
              battle: { enemies: ['caoren'], escapable: true },
              renown: 30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_caopi_dies',
    year: 226,
    name: '曹丕の崩御',
    weight: 4,
    factions: ['wei'],
    record: '曹丕、四十にして崩ず。曹叡が立ち、司馬懿ら四人が輔く',
    aftermath: {
      news: '曹丕崩じ、曹叡が立つ',
    },
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '帝が四十で崩じた。位に就いてわずか七年。\n' +
          '「文を以て名を成した」と言われた人が、天下を一つにする前に逝った。\n\n' +
          '——跡を継ぐのは、二十三の曹叡。',
        choices: [
          {
            label: '新帝を輔け、国を保つ',
            historical: true,
            effect: {
              deed: '曹叡を輔けて魏の政を支える',
              flags: { 'joined:ev_caopi_dies': true },
              renown: 30,
            },
          },
          {
            label: 'この機に呉か蜀へ通じる',
            effect: {
              deed: '魏の代替わりに乗じ、外と通ず',
              flags: { 'betrayed:wei': true },
              renown: 15,
              virtue: -30,
              joinFaction: 'ronin',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_wu_emperor',
    year: 229,
    name: '呉、帝を称す',
    weight: 4,
    factions: ['wu', 'shu'],
    record: '孫権、武昌にて帝位に即く。ここに天下は名実ともに三分す',
    aftermath: {
      news: '孫権、帝を称す。三国は名実ともに揃った',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '曹丕が帝を称してから九年、劉備からは八年。\n' +
          '——ようやく、こちらの番が来た。',
        choices: [
          {
            label: '帝位に即く',
            historical: true,
            effect: {
              deed: '武昌にて帝位に即く',
              flags: { 'joined:ev_wu_emperor': true, 'became:wuemperor': true },
              renown: 60,
            },
          },
          {
            label: '王のままに留まり、蜀との盟を重んじる',
            effect: {
              deed: '帝を称さず、蜀との盟を重んじる',
              flags: { 'declined:wuemperor': true, 'peace:shu': true },
              renown: 25,
              virtue: 25,
            },
          },
        ],
      },
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '呉が帝を称した。漢を継ぐと言ってきたこちらとしては、認められる話ではない。\n' +
          '群臣は「盟を絶つべし」と言う。\n\n' +
          '——だが、北にはもっと大きな敵がいる。',
        choices: [
          {
            label: '認め、盟を続ける',
            historical: true,
            effect: {
              deed: '呉の帝号を認め、盟を保つ',
              flags: { 'joined:ev_wu_emperor': true, 'peace:wu': true },
              renown: 30,
              virtue: 15,
            },
          },
          {
            label: '筋を通し、盟を絶つ',
            effect: {
              deed: '漢の正統を守り、呉との盟を絶つ',
              flags: { 'joined:ev_wu_emperor': true, 'broke:wu': true },
              renown: 25,
              virtue: 10,
            },
          },
        ],
      },
    ],
  },
];

export default events;
