/**
 * 興平元年〜建安四年（194〜199）。呂布の最期まで。
 * 呂布でプレイする者にとっては、ここが本編の終わりになる。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_xuzhou',
    year: 193,
    name: '徐州の虐殺',
    weight: 4,
    factions: ['caocao', 'liubei', 'lvbu'],
    record: '曹操、父の仇として徐州を攻む。泗水は屍で流れを止めたという',
    scenes: [
      {
        id: 'as_caocao',
        when: (c) => c.factionId === 'caocao',
        text:
          '父が徐州で殺された。\n' +
          '兵は怒っている。曹操も止めない。\n' +
          '——城を落とした後、どうする。',
        choices: [
          {
            label: '城を屠り、恨みを晴らす',
            historical: true,
            effect: {
              deed: '徐州を攻め、城邑を屠る',
              flags: { 'joined:ev_xuzhou': true },
              renown: 25,
              virtue: -30,
              troops: 400,
            },
          },
          {
            label: '兵を制し、民を殺させない',
            effect: {
              deed: '兵の暴虐を制し、徐州の民を救う',
              flags: { 'joined:ev_xuzhou': true, 'spared:xuzhou': true },
              renown: 20,
              virtue: 25,
            },
          },
        ],
      },
      {
        id: 'as_defender',
        when: (c) => c.factionId !== 'caocao',
        text:
          '徐州から使いが来た。助けてくれ、と。\n' +
          '兵は少ない。行けば曹操と正面から当たることになる。',
        choices: [
          {
            label: '寡兵でも救援に行く',
            historical: true,
            effect: {
              deed: '寡兵を率いて徐州を救う',
              flags: { 'joined:ev_xuzhou': true },
              renown: 45,
              virtue: 22,
            },
          },
          {
            label: '行かない',
            effect: { deed: '徐州の求援に応じず', renown: -20, virtue: -10 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yanzhou',
    year: 194,
    name: '兗州の裏切り',
    weight: 4,
    factions: ['caocao', 'lvbu'],
    record: '陳宮ら叛して呂布を迎え入れ、曹操は本拠を失いかける',
    scenes: [
      {
        id: 'as_lvbu',
        when: (c) => c.factionId === 'lvbu',
        text:
          '陳宮が来た。「兗州が空いています」と言う。\n' +
          '曹操は徐州へ出払っている。今なら獲れる。\n' +
          '——この男の言うことを、聞いてみるか。',
        choices: [
          {
            label: '陳宮の策に乗る',
            historical: true,
            effect: {
              deed: '陳宮の策を容れ、兗州を襲う',
              flags: { 'heeded:chengong': true, 'joined:ev_yanzhou': true },
              renown: 40,
              troops: 800,
            },
          },
          {
            label: '自分の考えで動く',
            effect: {
              deed: '独断で兵を出し、機を逸す',
              flags: { 'joined:ev_yanzhou': true },
              renown: 15,
              troops: 300,
            },
          },
        ],
      },
      {
        id: 'as_caocao',
        when: (c) => c.factionId === 'caocao',
        text:
          '徐州から急使。兗州が寝返ったという。\n' +
          '残ったのは三城のみ。帰る場所が、ほとんど無い。',
        choices: [
          {
            label: 'すべてを捨てて引き返す',
            historical: true,
            effect: {
              deed: '徐州を捨てて兗州へ取って返す',
              flags: { 'joined:ev_yanzhou': true },
              battle: { enemies: ['lvbu'], escapable: true },
              renown: 35,
            },
          },
          {
            label: '袁紹に頼る',
            effect: {
              deed: '袁紹に身を寄せ、再起を図る',
              renown: -15,
              virtue: -5,
              joinFaction: 'yuanshao',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yingemperor',
    year: 196,
    name: '天子を許に迎える',
    weight: 5,
    factions: ['caocao', 'han', 'yuanshao', 'lvbu'],
    record: '曹操、献帝を許に迎う。以後、天子を奉じて諸侯に令す',
    scenes: [
      {
        id: 'default',
        text:
          '流浪の天子が、洛陽の焼け跡で雨に濡れている。\n' +
          '諸侯は誰も迎えに行かない。厄介だからだ。\n' +
          '——だが、天子を持つ者が、天下に令することになる。',
        choices: [
          {
            label: '天子を迎える',
            historical: true,
            effect: {
              deed: '天子を迎え、これを奉ず',
              flags: { 'has:emperor': true, 'joined:ev_yingemperor': true },
              renown: 60,
            },
          },
          {
            label: '天子を迎え、真に漢室を興そうとする',
            effect: {
              deed: '天子を迎え、漢室の再興を誓う',
              flags: { 'has:emperor': true, 'loyal:han': true },
              renown: 50,
              virtue: 25,
            },
          },
          {
            label: '関わらない',
            effect: { deed: '天子の擁立に関わらず', renown: -5 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_wancheng',
    year: 197,
    name: '宛城の夜',
    weight: 3,
    factions: ['caocao'],
    record: '張繡、降ってのち叛す。典韋・曹昂ら死す',
    scenes: [
      {
        id: 'default',
        text:
          '張繡は降った。祝いの酒が出ている。\n' +
          '曹操は上機嫌で、亡き張済の未亡人を召した。\n' +
          '——将たちが、目を伏せた。',
        choices: [
          {
            label: '何も言わない',
            historical: true,
            effect: {
              deed: '宛城の夜襲に遭い、主を落とし延ばす',
              flags: { 'joined:ev_wancheng': true },
              battle: { enemies: ['zhangxiu', 'general'], escapable: false },
              renown: 30,
              virtue: 15,
            },
          },
          {
            label: '主を諫める',
            effect: {
              deed: '主の振る舞いを諫め、叛意を未然に防ぐ',
              flags: { 'prevented:wancheng': true, 'won:ev_wancheng': true },
              renown: 35,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_xiapi',
    year: 198,
    name: '下邳の水攻め',
    weight: 4,
    factions: ['lvbu', 'caocao', 'liubei'],
    record: '曹操、沂水・泗水を決して下邳を水に沈む。呂布、城中に孤立す',
    scenes: [
      {
        id: 'as_lvbu',
        when: (c) => c.factionId === 'lvbu',
        text:
          '陳宮が言う。「城を出て野に陣を張り、内外から挟むべきです」\n' +
          '妻が言う。「あなたが出ていけば、この城は誰が守るのです」\n\n' +
          '酒を飲んだ。判断が鈍る。',
        choices: [
          {
            label: '陳宮の策を容れる',
            effect: {
              deed: '陳宮の策を容れ、城外に陣を張る',
              flags: { 'heeded:chengong': true, 'joined:ev_xiapi': true },
              renown: 30,
              virtue: 10,
            },
          },
          {
            label: '城に籠もる',
            historical: true,
            effect: {
              deed: '下邳に籠城し、水に囲まれる',
              flags: { 'joined:ev_xiapi': true, 'captured:ev_baimenlou': true },
              renown: 5,
            },
          },
          {
            label: '酒を断ち、兵とともに城壁に立つ',
            effect: {
              deed: '酒を断ち、自ら城壁に立って兵を励ます',
              flags: { 'joined:ev_xiapi': true },
              renown: 25,
              virtue: 20,
            },
          },
        ],
      },
      {
        id: 'as_besieger',
        when: (c) => c.factionId !== 'lvbu',
        text:
          '下邳の城は堅い。力攻めでは兵が減るばかり。\n' +
          '荀攸が地図を指した。「川を、切りましょう」',
        choices: [
          {
            label: '水攻めにする',
            historical: true,
            effect: {
              deed: '沂水を決して下邳を水に沈む',
              flags: { 'joined:ev_xiapi': true, 'won:ev_xiapi': true },
              renown: 40,
              virtue: -8,
            },
          },
          {
            label: '城内の離間を図る',
            effect: {
              deed: '城中に間者を放ち、内から崩す',
              flags: { 'joined:ev_xiapi': true, 'won:ev_xiapi': true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_baimenlou',
    year: 199,
    name: '白門楼',
    weight: 5,
    factions: ['lvbu', 'caocao', 'liubei'],
    record: '呂布、縛られて曹操の前に引き出さる。劉備の一言により、縊り殺さる',
    // 下邳が曹操のものになるのは史実どおりなので、支配表のほうが受け持つ。
    // ここに書くのは「史書と違うこと」だけでよい。
    aftermath: {
      slays: ['lvbu', 'chengong'],
      news: '白門楼に呂布縊り殺さる。徐州は曹操のものとなる',
    },
    scenes: [
      {
        id: 'as_lvbu',
        when: (c) => c.officerId === 'lvbu',
        text:
          '縄を打たれた。楼の上に曹操がいる。\n' +
          '「縄が、きつい」と言うと、曹操は笑った。\n\n' +
          '「明公が歩兵を率い、この呂布が騎兵を率いれば、天下は定まりましょう」\n' +
          '曹操の目が動いた。——助かるかもしれない。\n\n' +
          'そのとき、傍らの男が口を開いた。\n' +
          '「公は、丁原と董卓のことをお忘れか」',
        choices: [
          {
            label: '命乞いを続ける',
            historical: true,
            effect: {
              deed: '白門楼にて命を乞う',
              flags: { 'joined:ev_baimenlou': true },
              virtue: -10,
            },
          },
          {
            label: '黙って死を受け入れる',
            effect: {
              deed: '白門楼にて一言も発せず、刑に就く',
              flags: { 'joined:ev_baimenlou': true },
              renown: 20,
              virtue: 20,
            },
          },
          {
            label: '陳宮を先に助けるよう頼む',
            effect: {
              deed: '己より先に、陳宮の助命を乞う',
              flags: { 'joined:ev_baimenlou': true, 'spared:ev_baimenlou': true },
              renown: 25,
              virtue: 35,
              aftermath: { spares: ['chengong'], news: '呂布の願いにより、陳宮ひとり赦さる' },
            },
          },
        ],
      },
      {
        id: 'as_caocao_side',
        when: (c) => c.factionId === 'caocao' || c.factionId === 'liubei',
        text:
          '縛られた呂布が、楼の下にいる。\n' +
          '「私を用いれば、天下は定まる」と男は言った。\n' +
          '曹操が、こちらを見た。意見を求めている。',
        choices: [
          {
            label: '「丁原と董卓をお忘れか」と言う',
            historical: true,
            effect: {
              deed: '呂布の助命に反対し、これを死に至らしむ',
              flags: { 'joined:ev_baimenlou': true },
              renown: 20,
              virtue: -12,
            },
          },
          {
            label: '助命を勧める',
            effect: {
              deed: '呂布の助命を勧める',
              flags: { 'joined:ev_baimenlou': true, 'spared:ev_baimenlou': true, 'favor:lvbu': true },
              renown: 15,
              virtue: 15,
              // 縄を解かれた呂布は、この年を越えて生きる。以後、町で会える。
              aftermath: { spares: ['lvbu'], news: '呂布、死を免れて曹操に降る' },
            },
          },
          {
            label: '陳宮だけでも助けるよう頼む',
            effect: {
              deed: '陳宮の才を惜しみ、助命を請う',
              flags: { 'joined:ev_baimenlou': true, 'favor:chengong': true },
              virtue: 18,
              aftermath: { spares: ['chengong'], slays: ['lvbu'], news: '陳宮ひとり、死を免る' },
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yijing',
    year: 199,
    name: '易京の火',
    weight: 3,
    factions: ['gongsunzan', 'yuanshao', 'liubei'],
    record: '公孫瓚、易京に高楼を築いて籠もるも、地下道より攻められて自ら焼く',
    scenes: [
      {
        id: 'default',
        text:
          '白馬長史も、いまは楼の中から出てこない。\n' +
          '楼は高く、堀は深い。だが袁紹は地面を掘っていた。',
        choices: [
          {
            label: '最後まで楼を守る',
            historical: true,
            effect: {
              deed: '易京の楼に籠もり、火を放って果てる',
              flags: { 'joined:ev_yijing': true },
              battle: { enemies: ['yanliang', 'wenchou'], escapable: false },
              renown: 20,
            },
          },
          {
            label: '楼を捨てて野戦に出る',
            effect: {
              deed: '籠城を捨て、野に出て戦う',
              flags: { 'joined:ev_yijing': true, 'retreated:ev_yijing': true },
              renown: 25,
            },
          },
        ],
      },
    ],
  },
];

export default events;
