/**
 * 建安六年〜十二年（201〜207）。官渡のあと、袁氏が兄弟で割れて滅ぶまで。
 *
 * 演義がほとんど飛ばす七年だが、曹操が中原の主になったのはこの間である。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_runan',
    year: 201,
    name: '汝南の潰走',
    weight: 3,
    factions: ['caocao', 'liubei'],
    record: '劉備、汝南に敗れて荊州へ落ち、劉表を頼る',
    scenes: [
      {
        id: 'as_liubei',
        when: (c) => c.factionId === 'liubei',
        text:
          '袁紹が折れた以上、曹操は南を向く。\n' +
          '兵は千に満たず、城もない。\n' +
          '——どこへ行く。',
        choices: [
          {
            label: '荊州へ落ち、劉表を頼る',
            historical: true,
            effect: {
              deed: '汝南を捨てて荊州に入り、劉表の客将となる',
              flags: { 'joined:ev_runan': true, 'guest:liubiao': true },
              renown: -10,
              troops: -200,
            },
          },
          {
            label: '汝南に踏みとどまって戦う',
            effect: {
              deed: '汝南に踏みとどまり、曹操の軍を迎え撃つ',
              flags: { 'joined:ev_runan': true },
              battle: { enemies: ['caoren', 'xuhuang'], escapable: true },
              renown: 25,
            },
          },
          {
            label: '江東の孫権を頼る',
            effect: {
              deed: '長江を渡り、江東に身を寄せる',
              flags: { 'guest:wu': true },
              renown: 5,
              joinFaction: 'ronin',
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '汝南の劉備が退いた。追えば討てるかもしれない。\n' +
          'だが背には、まだ袁氏の河北が丸ごと残っている。',
        choices: [
          {
            label: '深追いせず、河北へ向き直る',
            historical: true,
            effect: {
              deed: '劉備を追わず、兵を河北へ向ける',
              flags: { 'joined:ev_runan': true },
              renown: 20,
            },
          },
          {
            label: '荊州まで追い、劉備を討つ',
            effect: {
              deed: '劉備を荊州まで追う',
              flags: { 'chased:liubei': true },
              battle: { enemies: ['zhangfei', 'guanyu'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yuanshao_dies',
    year: 202,
    name: '袁紹の死',
    weight: 4,
    factions: ['yuanshao', 'caocao'],
    record: '袁紹、官渡の敗より立ち直れず血を吐いて没す。袁譚と袁尚が跡目を争う',
    aftermath: {
      news: '袁紹没す。河北は袁譚と袁尚に割れた',
    },
    scenes: [
      {
        id: 'as_yuan',
        when: (c) => c.factionId === 'yuanshao',
        text:
          '主が倒れた。三人の子のうち、末の袁尚が跡を継ぐという。\n' +
          '長子の袁譚は、それを認めない。\n' +
          '——河北は、内から割れようとしている。',
        choices: [
          {
            label: '長幼の序を説き、袁譚を立てる',
            effect: {
              deed: '長子袁譚を立てるべしと説く',
              flags: { 'joined:ev_yuanshao_dies': true, 'backed:yuantan': true },
              renown: 20,
              virtue: 10,
            },
          },
          {
            label: '袁尚に従う',
            historical: true,
            effect: {
              deed: '袁尚を主と仰ぐ',
              flags: { 'joined:ev_yuanshao_dies': true, 'backed:yuanshang': true },
              renown: 15,
            },
          },
          {
            label: '兄弟を和させることに力を尽くす',
            effect: {
              deed: '袁氏の兄弟を和させようと奔走す',
              flags: { 'joined:ev_yuanshao_dies': true, 'mended:yuan': true },
              renown: 30,
              virtue: 20,
            },
          },
        ],
      },
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '袁紹が死んだ。子らが争っているという。\n' +
          '——今すぐ攻めれば、彼らは手を結んで抗うだろう。\n' +
          '待てば、勝手に潰し合う。',
        choices: [
          {
            label: '待つ。兄弟が食い合うのを待つ',
            historical: true,
            effect: {
              deed: '袁氏の内訌を待ち、兵を動かさず',
              flags: { 'joined:ev_yuanshao_dies': true, 'waited:yuan': true },
              renown: 30,
            },
          },
          {
            label: '喪に乗じて一気に攻める',
            effect: {
              deed: '袁紹の喪に乗じて河北へ攻め入る',
              flags: { 'joined:ev_yuanshao_dies': true },
              battle: { enemies: ['zhanghe', 'general'], escapable: true },
              renown: 25,
              virtue: -15,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_ye_falls',
    year: 204,
    name: '鄴の陥落',
    weight: 4,
    factions: ['caocao', 'yuanshao'],
    record: '曹操、鄴を陥として河北の本拠を得る。以後ここを己の都とす',
    aftermath: {
      news: '鄴陥ちて、河北は曹操のものとなる',
    },
    scenes: [
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '漳水を切って城を囲んだ。半年で、城の中は食い尽くされている。\n' +
          '——袁氏四代の府庫が、この門の向こうにある。',
        choices: [
          {
            label: '城を開かせ、袁紹の墓に詣でて泣く',
            historical: true,
            effect: {
              deed: '鄴を得て、旧友袁紹の墓に涙す',
              flags: { 'joined:ev_ye_falls': true, 'won:ev_ye_falls': true },
              renown: 50,
              virtue: 10,
              gold: 300,
            },
          },
          {
            label: '力攻めにして城を屠る',
            effect: {
              deed: '鄴を力攻めにして陥とす',
              flags: { 'joined:ev_ye_falls': true, 'won:ev_ye_falls': true },
              battle: { enemies: ['general', 'officer'], escapable: false },
              renown: 40,
              virtue: -25,
              gold: 400,
            },
          },
        ],
      },
      {
        id: 'as_yuan',
        when: (c) => c.factionId === 'yuanshao',
        text:
          '水を切られ、糧が尽きた。城内では餓死者が半ばを超えたという。\n' +
          '——四代三公の家が、ここで終わろうとしている。',
        choices: [
          {
            label: '城を枕に討ち死にする',
            historical: true,
            effect: {
              deed: '鄴に籠もり、最後まで戦う',
              flags: { 'joined:ev_ye_falls': true },
              battle: { enemies: ['xuchu', 'xuhuang'], escapable: true },
              renown: 30,
              virtue: 15,
            },
          },
          {
            label: '城を出て北へ落ち、烏丸を頼る',
            effect: {
              deed: '鄴を捨てて北へ落ち、烏丸に身を寄せる',
              flags: { 'fled:north': true },
              renown: -10,
              troops: -300,
            },
          },
          {
            label: '降る',
            effect: {
              deed: '鄴にて曹操に降る',
              flags: { 'surrendered:ye': true },
              renown: -20,
              joinFaction: 'caocao',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_bailangshan',
    year: 207,
    name: '白狼山',
    weight: 4,
    factions: ['caocao'],
    record: '曹操、塞を越えて烏丸を破る。帰路、郭嘉没す',
    aftermath: {
      news: '白狼山に烏丸破れ、北辺定まる。ただし郭嘉、帰路に没す',
    },
    scenes: [
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '道は水に浸かって進めない。案内の者が、廃れた間道を知っていると言う。\n' +
          '五百里の山道を、輜重を捨てて越えることになる。\n\n' +
          '郭嘉が言った。「兵は神速を貴びます」\n' +
          '——その郭嘉が、もう馬に乗れないほど痩せている。',
        choices: [
          {
            label: '輜重を捨て、間道を越える',
            historical: true,
            effect: {
              deed: '輜重を捨てて塞外に出で、白狼山に烏丸を破る',
              flags: { 'joined:ev_bailangshan': true, 'won:ev_bailangshan': true },
              battle: { enemies: ['general', 'officer'], escapable: false },
              renown: 60,
              troops: -400,
            },
          },
          {
            label: '兵を返す。郭嘉を死なせたくない',
            effect: {
              deed: '北伐を切り上げ、兵を返す',
              flags: { 'spared:guojia': true },
              aftermath: {
                spares: ['guojia'],
                news: '曹操、塞外への遠征を切り上げる。郭嘉、命を拾う',
              },
              renown: -15,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },
];

export default events;
