/**
 * 建興三年〜十二年（225〜234）。南征と北伐、そして五丈原。
 * 諸葛亮でプレイする者にとっては、ここが「時間との戦い」の本体になる。
 * strain: で始まるフラグが寿命を削る。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_nanman',
    year: 225,
    name: '南征',
    weight: 3,
    factions: ['shu', 'nanman'],
    record: '諸葛亮、孟獲を七たび擒えて七たび放つ。南中、以後叛かず',
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '南中が叛いた。北伐の前に、背中を片づけておかねばならない。\n' +
          '馬謖が言った。「心を攻めるを上と為し、城を攻めるを下と為す」',
        choices: [
          {
            label: '捕らえては放ち、心から服させる',
            historical: true,
            effect: {
              deed: '孟獲を七たび擒えて七たび放ち、南中を平定す',
              flags: { 'joined:ev_nanman': true, 'won:ev_nanman': true, 'strain:south': true },
              battle: { enemies: ['menghuo'], escapable: true },
              renown: 55,
              virtue: 30,
            },
          },
          {
            label: '力で押さえつける',
            effect: {
              deed: '南中を力で平定し、守備兵を置く',
              flags: { 'joined:ev_nanman': true, 'won:ev_nanman': true },
              renown: 35,
              virtue: -15,
              troops: 300,
            },
          },
          {
            label: '南は捨て置き、北伐を急ぐ',
            effect: {
              deed: '南中を捨て置き、北伐の準備に入る',
              flags: { 'strain:northern1': true },
              renown: 15,
            },
          },
        ],
      },
      {
        id: 'as_nanman',
        when: (c) => c.factionId === 'nanman',
        text: '蜀の丞相が自ら来たという。何度負けても、殺されない。妙な男だ。',
        choices: [
          {
            label: '何度でも兵を集めて戦う',
            historical: true,
            effect: {
              deed: '幾度も敗れ、幾度も兵を挙ぐ',
              flags: { 'joined:ev_nanman': true },
              battle: { enemies: ['zhugeliang', 'zhaoyun'], escapable: true },
              renown: 25,
            },
          },
          {
            label: '心から降り、二度と叛かない',
            effect: {
              deed: '心より服し、以後叛かず',
              flags: { 'surrendered:nanman': true },
              renown: 20,
              virtue: 25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_chushibiao',
    year: 227,
    name: '出師の表',
    weight: 4,
    factions: ['shu'],
    record: '諸葛亮、表を奉じて北伐に出づ。「臣、鞠躬尽力、死して後已まん」',
    scenes: [
      {
        id: 'as_zhugeliang',
        when: (c) => c.officerId === 'zhugeliang',
        text:
          '国は疲れている。人も少ない。\n' +
          'それでも、天下三分は「まず魏を討つ」ことでしか終わらない。\n\n' +
          '——先帝の託を、どう果たすか。',
        choices: [
          {
            label: '表を奉じ、北伐に出る',
            historical: true,
            effect: {
              deed: '出師の表を奉じ、北伐に出づ',
              flags: { 'joined:ev_chushibiao': true, 'strain:northern1': true, 'strain:overwork': true },
              renown: 60,
              virtue: 20,
            },
          },
          {
            label: '国を養い、十年待つ',
            effect: {
              deed: '内政に専心し、国力の回復を待つ',
              flags: { 'chose:patience': true },
              renown: 20,
              gold: 1500,
            },
          },
          {
            label: '出るが、細事は人に任せる',
            effect: {
              deed: '北伐に出づるも、政務を蒋琬・費禕に委ぬ',
              flags: { 'joined:ev_chushibiao': true, 'strain:northern1': true, 'delegated:true': true },
              renown: 50,
              virtue: 15,
            },
          },
        ],
      },
      {
        id: 'as_weiyan',
        when: (c) => c.officerId === 'weiyan',
        text:
          '軍議で献策した。\n' +
          '「五千の精兵で子午谷を抜ければ、十日で長安に着きます」\n' +
          '丞相は首を振った。「危うすぎる」',
        choices: [
          {
            label: '引き下がる',
            historical: true,
            effect: {
              deed: '子午谷の策を退けられ、不満を抱く',
              flags: { 'feud:yangyi': true },
              renown: 10,
              virtue: -8,
            },
          },
          {
            label: '重ねて説き、承認を得る',
            effect: {
              deed: '重ねて説き、子午谷の奇襲を許さる',
              flags: { 'adopted:ziwugu': true },
              renown: 45,
            },
          },
          {
            label: '丞相の判断に従い、本隊を支える',
            effect: {
              deed: '己の策を捨て、丞相の下で本隊を支える',
              renown: 25,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_jieting',
    year: 228,
    name: '街亭',
    weight: 4,
    factions: ['shu', 'wei'],
    record: '馬謖、山上に布陣して水を絶たれ大敗す。諸葛亮、泣いて馬謖を斬る',
    scenes: [
      {
        id: 'as_masu',
        when: (c) => c.officerId === 'masu',
        text:
          '街亭に着いた。丞相は「道を塞げ」と言った。\n' +
          '王平も「道です」と言う。\n\n' +
          'だが兵法には「高きに拠りて下を見る」とある。\n' +
          '——山の上のほうが、明らかに有利ではないか。',
        choices: [
          {
            label: '山上に布陣する',
            historical: true,
            effect: {
              deed: '街亭の山上に布陣し、水を絶たれて大敗す',
              flags: { 'joined:ev_jieting': true, 'camped:hilltop': true },
              battle: { enemies: ['zhanghe'], escapable: false },
              renown: -30,
            },
          },
          {
            label: '命じられたとおり道を塞ぐ',
            effect: {
              deed: '街亭の道を塞ぎ、魏軍の南下を阻む',
              flags: { 'joined:ev_jieting': true, 'won:ev_jieting': true },
              renown: 45,
            },
          },
          {
            label: '王平に半数を預け、道にも兵を置く',
            effect: {
              deed: '山と道の両方に兵を置き、辛くも持ちこたえる',
              flags: { 'joined:ev_jieting': true },
              renown: 20,
            },
          },
        ],
      },
      {
        id: 'as_zhugeliang',
        when: (c) => c.officerId === 'zhugeliang',
        text:
          '街亭が落ちた。全軍を退かねばならない。\n' +
          '馬謖が縄を打たれて座っている。先帝は「言、其の実に過ぐ」と言っていた。\n\n' +
          '——軍法か、情か。',
        choices: [
          {
            label: '泣いて斬る',
            historical: true,
            effect: {
              deed: '涙を揮って馬謖を斬り、自らも位を下げる',
              flags: { 'joined:ev_jieting': true, 'executed:masu': true, 'strain:overwork': true },
              renown: 40,
              virtue: 10,
            },
          },
          {
            label: '罪を許し、次を任せる',
            effect: {
              deed: '馬謖を斬らず、汚名を雪ぐ機を与える',
              flags: { 'joined:ev_jieting': true, 'spared:masu': true },
              renown: 15,
              virtue: 20,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text: '蜀軍が街亭に出た。将は山の上に陣を敷いている。水場は、麓だ。',
        choices: [
          {
            label: '水を絶って包囲する',
            historical: true,
            effect: {
              deed: '街亭にて水を絶ち、蜀軍を破る',
              flags: { 'joined:ev_jieting': true, 'won:ev_jieting': true },
              battle: { enemies: ['masu'], escapable: false },
              renown: 50,
            },
          },
          {
            label: '正面から山を攻める',
            effect: {
              deed: '街亭の山を正面から攻める',
              flags: { 'joined:ev_jieting': true },
              battle: { enemies: ['masu', 'wangping'], escapable: true },
              renown: 25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_mumendao',
    year: 231,
    name: '木門道',
    weight: 2,
    factions: ['shu', 'wei'],
    record: '張郃、退く蜀軍を追って木門道に入り、伏兵の矢に当たる',
    scenes: [
      {
        id: 'default',
        text:
          '蜀軍が退いていく。追えば戦果になる。\n' +
          '木門道は狭く、両側は崖。\n' +
          '——追い過ぎた将が、どうなるかは知っている。',
        choices: [
          {
            label: '追撃する',
            historical: true,
            effect: {
              deed: '木門道まで蜀軍を追撃す',
              flags: { 'joined:ev_mumendao': true },
              battle: { enemies: ['weiyan', 'wangping'], escapable: false },
              renown: 25,
            },
          },
          {
            label: '追わない',
            effect: {
              deed: '深追いを避けて兵を返す',
              flags: { 'retreated:ev_mumendao': true },
              renown: 10,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_wuzhangyuan',
    year: 234,
    name: '五丈原',
    weight: 5,
    factions: ['shu', 'wei'],
    record: '諸葛亮、五丈原に没す。享年五十四。死せる孔明、生ける仲達を走らす',
    scenes: [
      {
        id: 'as_zhugeliang',
        when: (c) => c.officerId === 'zhugeliang',
        text:
          '司馬懿は出てこない。女物の衣を送っても、笑って受け取った。\n' +
          '使者が魏の陣で聞かれたという。「丞相は、よく眠られるか」\n\n' +
          '——食は少なく、事は繁い。\n' +
          '自分でも、分かっている。',
        choices: [
          {
            label: '罰二十以上を、自ら決裁し続ける',
            historical: true,
            effect: {
              deed: '軍務を一身に負い、寝食を忘れて政を執る',
              flags: { 'joined:ev_wuzhangyuan': true, 'strain:overwork': true, 'strain:northern2': true },
              renown: 40,
              virtue: 15,
            },
          },
          {
            label: '軍務を将に委ね、身体を休める',
            effect: {
              deed: '軍務を諸将に委ね、静養す',
              flags: { 'joined:ev_wuzhangyuan': true, physician: true },
              renown: 20,
              virtue: 10,
            },
          },
          {
            label: '兵を退き、次の機を待つ',
            effect: {
              deed: '五丈原より兵を退き、国力の回復を図る',
              flags: { 'retreated:ev_wuzhangyuan': true },
              renown: 15,
            },
          },
        ],
      },
      {
        id: 'as_simayi',
        when: (c) => c.factionId === 'wei',
        text:
          '蜀軍が渭水の南に陣を敷いた。挑発してくるが、出ない。\n' +
          '使者に聞いた。「丞相の食は」——「三、四升」\n' +
          '「政務は」——「二十以上の罰は、みな自ら」\n\n' +
          '——長くはない。',
        choices: [
          {
            label: '出ずに待つ',
            historical: true,
            effect: {
              deed: '守りを固めて出でず、時を味方につける',
              flags: { 'joined:ev_wuzhangyuan': true, 'won:ev_wuzhangyuan': true },
              renown: 50,
            },
          },
          {
            label: '決戦を挑む',
            effect: {
              deed: '五丈原にて蜀軍と決戦す',
              flags: { 'joined:ev_wuzhangyuan': true },
              battle: { enemies: ['zhugeliang', 'jiangwei'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },
];

export default events;
