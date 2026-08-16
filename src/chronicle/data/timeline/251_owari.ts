/**
 * 嘉平三年〜泰始十五年（251〜279）。三国が、内から順に崩れていく。
 *
 * 外の戦より内の粛清で人が死ぬ時代。羊祜と陸抗だけが、その中で例外だった。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_sunquan_dies',
    year: 252,
    name: '呉大帝の崩御',
    weight: 4,
    factions: ['wu'],
    record: '孫権、七十一にして崩ず。後継ぎ争いに国を裂いたまま逝く',
    aftermath: {
      news: '孫権崩ず。呉の政は、ここから乱れ始める',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '五十二年、江東を保った人が逝った。\n' +
          '——だが晩年の十年で、太子は廃され、魯王は死を賜り、\n' +
          '陸遜は憤りのうちに没した。残ったのは、十の子ども。',
        choices: [
          {
            label: '幼主を輔け、国を保つ',
            historical: true,
            effect: {
              deed: '幼主を輔けて呉の政を支える',
              flags: { 'joined:ev_sunquan_dies': true },
              renown: 30,
              virtue: 15,
            },
          },
          {
            label: '実権を握り、思うままに政を執る',
            effect: {
              deed: '幼主を擁して政を専らにす',
              flags: { 'joined:ev_sunquan_dies': true, 'seized:wu_power': true },
              renown: 40,
              virtue: -30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_caomao',
    year: 260,
    name: '甘露の変',
    weight: 5,
    factions: ['wei'],
    record: '曹髦、「司馬昭の心は路人も知る」と言って自ら討ちに出で、殺さる',
    aftermath: {
      news: '帝、臣下の手にかかる。魏はもはや名ばかりとなった',
    },
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '帝が剣を取って立ち上がった。二十歳の若さである。\n' +
          '「司馬昭の心は、路ゆく人も知っている。座して辱めを受けるより、\n' +
          '　共に出て討とう」\n\n' +
          '——臣として、どうする。',
        choices: [
          {
            label: '帝に従って出る',
            effect: {
              deed: '帝に従って剣を取る',
              flags: { 'joined:ev_caomao': true, 'loyal:han': true },
              battle: { enemies: ['general', 'officer'], escapable: false },
              renown: 40,
              virtue: 40,
            },
          },
          {
            label: '止める。死なせるわけにはいかない',
            effect: {
              deed: '帝の袖を取って諌め、留めようとする',
              flags: { 'joined:ev_caomao': true, 'stopped:caomao': true },
              renown: 25,
              virtue: 30,
            },
          },
          {
            label: '何もしない',
            historical: true,
            effect: {
              deed: '帝の死を、黙って見る',
              flags: { 'joined:ev_caomao': true },
              renown: 5,
              virtue: -20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_xiling',
    year: 272,
    name: '西陵の役',
    weight: 4,
    factions: ['wu', 'jin'],
    record: '陸抗、叛いた歩闡を討ち、救援に来た晋の大軍をことごとく退ける',
    aftermath: {
      news: '西陵に晋軍破れる。呉は、まだ落ちない',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '西陵の歩闡が晋に降った。晋は八万を出して救いに来る。\n' +
          '諸将は「早く城を落とせ」と言う。\n\n' +
          '——だが先に囲みを固めなければ、内と外から挟まれる。',
        choices: [
          {
            label: '先に囲みの壁を築き、晋の援軍を止める',
            historical: true,
            effect: {
              deed: '西陵を囲んで晋の大軍を退け、歩闡を討つ',
              flags: { 'joined:ev_xiling': true, 'won:ev_xiling': true },
              renown: 70,
            },
          },
          {
            label: '力攻めで一気に城を落とす',
            effect: {
              deed: '西陵を力攻めにする',
              flags: { 'joined:ev_xiling': true },
              battle: { enemies: ['general', 'general'], escapable: true },
              renown: 30,
              troops: -400,
            },
          },
        ],
      },
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '西陵が降ってきた。呉の喉元である。\n' +
          '——だが向こうの将は陸抗。羊祜は「急いてはならぬ」と言っている。',
        choices: [
          {
            label: '救援に急ぐ',
            historical: true,
            effect: {
              deed: '西陵の救援に向かい、陸抗に阻まれる',
              flags: { 'joined:ev_xiling': true },
              battle: { enemies: ['lukang'], escapable: true },
              renown: 20,
            },
          },
          {
            label: '兵を退き、時を待つ',
            effect: {
              deed: '陸抗ある間は攻めずと決め、兵を退く',
              flags: { 'joined:ev_xiling': true, 'waited:lukang': true },
              renown: 30,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yanghu_dies',
    year: 278,
    name: '襄陽の別れ',
    weight: 3,
    factions: ['jin', 'wu'],
    record: '羊祜、呉を伐つべしと説き遺して没す。荊州の民、市を閉じて哭す',
    aftermath: {
      news: '羊祜没す。遺言により杜預が後を継ぐ',
    },
    scenes: [
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '陸抗はもう四年前に世を去った。呉には、それを継ぐ者がいない。\n' +
          '病床の羊祜が言う。\n' +
          '「呉を取るなら、今をおいて時は無い。私の代わりには杜預を」\n\n' +
          '——敵地の民までが、この人の死を悼んで泣いているという。',
        choices: [
          {
            label: '遺言のとおり杜預を推す',
            historical: true,
            effect: {
              deed: '羊祜の遺志を継ぎ、杜預を後任に推す',
              flags: { 'joined:ev_yanghu_dies': true, 'backed:duyu': true },
              renown: 35,
              virtue: 20,
            },
          },
          {
            label: '呉との和を続け、伐たない',
            effect: {
              deed: '呉を伐つに忍びずと説き、和を保つ',
              flags: { 'joined:ev_yanghu_dies': true, 'peace:wu': true },
              renown: 20,
              virtue: 35,
            },
          },
        ],
      },
    ],
  },
];

export default events;
