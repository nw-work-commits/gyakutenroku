/** 建安二十五年〜章武三年（220〜223）。漢が終わり、三国が並び、劉備が沈む。 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_han_ends',
    year: 220,
    name: '禅譲',
    weight: 5,
    factions: ['han', 'caocao', 'wei', 'liubei', 'wu'],
    record: '曹操没し、曹丕位に即く。献帝、位を譲りて漢四百年終わる',
    aftermath: {
      news: '漢、四百年をもって絶ゆ。天下の旗はすべて書き替えられた',
    },
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'caocao' || c.factionId === 'wei',
        text:
          '魏王が薨じた。世子が跡を継いだ。\n' +
          '群臣が上表している。「天命はすでに移りました」と。\n' +
          '——帝から、位を受け取るか。',
        choices: [
          {
            label: '禅譲を受ける',
            historical: true,
            effect: {
              deed: '漢帝より禅譲を受け、魏を建つ',
              flags: { 'joined:ev_han_ends': true },
              renown: 70,
              virtue: -20,
              joinFaction: 'wei',
            },
          },
          {
            label: '漢臣のまま留まる',
            effect: {
              deed: '禅譲に与せず、漢の臣たるを守る',
              flags: { 'loyal:han': true },
              renown: 25,
              virtue: 35,
            },
          },
        ],
      },
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'liubei' || c.factionId === 'shu',
        text:
          '許都から報せが来た。帝が位を譲ったという。\n' +
          '——いや、殺されたという噂もある。\n' +
          '「漢は絶えました」と、群臣は言う。',
        choices: [
          {
            label: '帝位に即き、漢を継ぐ',
            historical: true,
            effect: {
              deed: '成都にて帝位に即き、漢を継ぐ',
              flags: { 'joined:ev_han_ends': true },
              renown: 60,
              joinFaction: 'shu',
            },
          },
          {
            label: '帝が生きているか確かめてからにする',
            effect: {
              deed: '帝の安否を確かめるまで即位を拒む',
              flags: { 'verified:emperor': true },
              renown: 30,
              virtue: 25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_zhangfei_death',
    year: 221,
    name: '閬中の夜',
    weight: 3,
    factions: ['shu'],
    record: '張飛、出陣を前に部下范彊・張達に寝首を掻かる',
    scenes: [
      {
        id: 'as_zhangfei',
        when: (c) => c.officerId === 'zhangfei',
        text:
          '兄が死んだ。三日で白い旗を三万作れと命じた。\n' +
          '范彊と張達が「できませぬ」と言うので、鞭で打った。\n\n' +
          '今夜も、酒がうまくない。',
        choices: [
          {
            label: '飲んで寝る',
            historical: true,
            effect: {
              deed: '閬中にて酒に酔い、床に就く',
              flags: { 'strain:drink': true, 'joined:ev_zhangfei_death': true },
              virtue: -8,
            },
          },
          {
            label: '酒を断ち、二人を許す',
            effect: {
              deed: '酒を断ち、罰した部下を許す',
              flags: { 'spared:fanjiang': true },
              renown: 15,
              virtue: 25,
            },
          },
          {
            label: '期日を延ばしてやる',
            effect: {
              deed: '無理な期日を改め、兵を労う',
              renown: 10,
              virtue: 18,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yiling',
    year: 222,
    name: '夷陵の戦い',
    weight: 5,
    factions: ['shu', 'wu'],
    record: '劉備、七百里に営を連ねる。陸遜、火を放ちて蜀軍を焼く',
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '諸葛亮が言う。「呉と結び、魏に当たるべきです」\n' +
          '趙雲も同じことを言う。\n\n' +
          '——だが、兄弟の仇である。',
        choices: [
          {
            label: '呉を討つ',
            historical: true,
            effect: {
              deed: '大軍を発して呉を討つ',
              flags: { 'joined:ev_yiling': true },
              renown: 30,
              virtue: -10,
              troops: 800,
            },
          },
          {
            label: '諸葛亮の諫言を容れ、思いとどまる',
            effect: {
              deed: '諸葛亮の諫めを容れ、東征を止める',
              flags: { 'heeded:zhugeliang': true },
              renown: 20,
              virtue: 30,
            },
          },
          {
            label: '出兵するが、営を連ねず水軍を用いる',
            effect: {
              deed: '水陸並び進み、火計に備える',
              flags: { 'joined:ev_yiling': true, 'won:ev_yiling': true },
              battle: { enemies: ['luxun'], escapable: true },
              renown: 55,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '蜀軍が七百里にわたって営を連ねている。\n' +
          '諸将は「今すぐ討つべし」と言う。書生と侮る声もある。\n' +
          '——夏になれば、林は乾く。',
        choices: [
          {
            label: '待つ。夏まで、ひたすら待つ',
            historical: true,
            effect: {
              deed: '半年を耐え、機を待って火を放つ',
              flags: { 'joined:ev_yiling': true, 'won:ev_yiling': true },
              renown: 80,
            },
          },
          {
            label: 'すぐに打って出る',
            effect: {
              deed: '諸将の言に従い、早期に決戦を挑む',
              flags: { 'joined:ev_yiling': true },
              battle: { enemies: ['liubei', 'huangzhong'], escapable: true },
              renown: 25,
            },
          },
          {
            label: '和議を申し入れる',
            effect: {
              deed: '蜀に和議を申し入れ、干戈を収める',
              flags: { 'peace:shu': true },
              renown: 30,
              virtue: 25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_baidicheng',
    year: 223,
    name: '白帝城',
    weight: 5,
    factions: ['shu'],
    record: '劉備、永安宮にて諸葛亮に後事を託して崩ず。「其の才、曹丕に十倍す」',
    scenes: [
      {
        id: 'as_liubei',
        when: (c) => c.officerId === 'liubei',
        text:
          '成都へは帰れなかった。\n' +
          '諸葛亮が枕元にいる。子が、まだ十七。\n\n' +
          '——この男に、何と言い遺すか。',
        choices: [
          {
            label: '「嗣子が輔けるに足らずんば、君自ら取れ」',
            historical: true,
            effect: {
              deed: '諸葛亮に後事を託し、国を譲る意まで示す',
              flags: { 'joined:ev_baidicheng': true },
              renown: 40,
              virtue: 30,
            },
          },
          {
            label: '息子を頼む、とだけ言う',
            effect: {
              deed: '諸葛亮に子の後見を託す',
              flags: { 'joined:ev_baidicheng': true },
              renown: 25,
              virtue: 15,
            },
          },
          {
            label: '呉との同盟を回復するよう遺言する',
            effect: {
              deed: '呉との和を回復するよう遺言す',
              flags: { 'joined:ev_baidicheng': true, 'peace:wu': true },
              renown: 35,
              virtue: 25,
            },
          },
        ],
      },
      {
        id: 'as_zhugeliang',
        when: (c) => c.officerId === 'zhugeliang',
        text:
          '永安宮に呼ばれた。\n' +
          '「君の才は曹丕に十倍する。嗣子が輔けるに足らずんば、君自ら取れ」\n\n' +
          '——試されているのか。本気なのか。',
        choices: [
          {
            label: '涙して、股肱の力を尽くすと誓う',
            historical: true,
            effect: {
              deed: '死を以て嗣子を輔けんと誓う',
              flags: { 'joined:ev_baidicheng': true, 'oath:liushan': true },
              renown: 40,
              virtue: 30,
            },
          },
          {
            label: '国を継ぐことを承知する',
            effect: {
              deed: '後事を受け、自ら国を担うことを承知す',
              flags: { 'joined:ev_baidicheng': true, 'took:throne': true },
              renown: 50,
              virtue: -20,
            },
          },
        ],
      },
    ],
  },
];

export default events;
