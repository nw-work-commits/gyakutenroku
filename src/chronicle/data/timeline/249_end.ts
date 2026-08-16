/**
 * 正始十年〜太康元年（249〜280）。三国が畳まれていく時代。
 *
 * 多くの読者にとって物語は 263 年の劉禅の降伏で終わる（横山光輝版もそこで筆を置く）。
 * ここでは 263 を情の頂点として厚く書き、265〜280 は薄い後日談として置く。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_gaopingling',
    year: 249,
    name: '高平陵の変',
    weight: 5,
    factions: ['wei'],
    record: '司馬懿、曹爽の留守を突いて洛陽を制す。以後、魏の実権は司馬氏に帰す',
    scenes: [
      {
        id: 'as_sima',
        when: (c) => c.factionId === 'wei',
        text:
          '十年、病と称して床にいた。粥をこぼして見せもした。\n' +
          '曹爽は、それを信じた。\n\n' +
          '今日、あの男は帝を奉じて城の外にいる。\n' +
          '——洛陽の門は、開いている。',
        choices: [
          {
            label: '兵を挙げ、洛陽を制する',
            historical: true,
            effect: {
              deed: '高平陵の変を起こし、魏の実権を握る',
              flags: { 'joined:ev_gaopingling': true, 'won:ev_gaopingling': true },
              renown: 70,
              virtue: -25,
            },
          },
          {
            label: '曹爽に降伏を勧め、命は助ける',
            effect: {
              deed: '曹爽を降し、その命を助ける',
              flags: { 'joined:ev_gaopingling': true, 'spared:caoshuang': true },
              renown: 50,
              virtue: 15,
            },
          },
          {
            label: '動かず、臣として終える',
            effect: {
              deed: '兵を挙げず、魏の臣たるを守る',
              flags: { 'loyal:wei': true },
              renown: 20,
              virtue: 35,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_jiangwei_beifa',
    year: 255,
    name: '姜維の北伐',
    weight: 3,
    factions: ['shu', 'wei'],
    record: '姜維、前後九たび中原に出づ。蜀の国力、これにて尽く',
    scenes: [
      {
        id: 'as_jiangwei',
        when: (c) => c.officerId === 'jiangwei' || c.factionId === 'shu',
        text:
          '丞相の志は、まだ果たされていない。\n' +
          'だが国は小さく、民は疲れ、廟堂には宦官がいる。\n\n' +
          '——それでも、出るか。',
        choices: [
          {
            label: '出る。何度でも',
            historical: true,
            effect: {
              deed: '前後九たび中原に出づ',
              flags: {
                'joined:ev_jiangwei_beifa': true,
                'strain:northern1': true,
                'strain:northern2': true,
                'strain:northern3': true,
                'strain:northern4': true,
              },
              renown: 45,
              troops: -400,
            },
          },
          {
            label: '国を養い、守りに徹する',
            effect: {
              deed: '出兵を控え、漢中の防備を厚くす',
              flags: { 'joined:ev_jiangwei_beifa': true, 'strain:northern1': true },
              renown: 20,
              gold: 800,
            },
          },
          {
            label: '宦官を退け、まず朝廷を正す',
            effect: {
              deed: '黄皓を退け、朝廷を正す',
              flags: { 'dismissed:huanghao': true },
              renown: 35,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_shu_falls',
    year: 263,
    name: '成都、開く',
    weight: 5,
    factions: ['shu', 'wei'],
    record:
      '鄧艾、陰平の険を越えて綿竹を破る。劉禅、輿櫬を舁きて降る。蜀漢、ここに滅ぶ',
    scenes: [
      {
        id: 'as_liushan',
        when: (c) => c.officerId === 'liushan',
        text:
          '鄧艾が、山を越えてきたという。\n' +
          '道なき陰平を、毛氈にくるまって転がり落ちながら。\n\n' +
          '姜維はまだ剣閣で持ちこたえている。城には兵もいる。\n' +
          '譙周が言った。「降られませ。民のために」\n\n' +
          '子の劉諶は、祖廟で泣いている。',
        choices: [
          {
            label: '降伏する',
            historical: true,
            effect: {
              deed: '輿櫬を舁きて降り、蜀漢を畳む',
              flags: { 'joined:ev_shu_falls': true, 'surrendered:chengdu': true },
              renown: -20,
              virtue: 10,
              joinFaction: 'wei',
            },
          },
          {
            label: '成都に籠もり、姜維の帰りを待つ',
            effect: {
              deed: '成都に拠って戦い、援軍を待つ',
              flags: { 'joined:ev_shu_falls': true },
              battle: { enemies: ['dengai'], escapable: false },
              renown: 40,
              virtue: 20,
            },
          },
          {
            label: '南中へ落ち、再起を図る',
            effect: {
              deed: '南中に落ち延び、再起を図る',
              flags: { 'joined:ev_shu_falls': true, 'retreated:ev_shu_falls': true },
              renown: 25,
              troops: 200,
            },
          },
        ],
      },
      {
        id: 'as_jiangwei',
        when: (c) => c.officerId === 'jiangwei',
        text:
          '剣閣は破られていない。鍾会の十万を、ここで止めている。\n' +
          'そこへ報せが来た。——成都が、開いた。\n\n' +
          '降伏せよ、との勅である。\n' +
          '兵たちが、石を斬りつけて泣いた。',
        choices: [
          {
            label: '鍾会に降り、彼を唆して蜀を復す',
            historical: true,
            effect: {
              deed: '鍾会に降り、これを唆して蜀の再興を図る',
              flags: { 'joined:ev_shu_falls': true, 'plot:zhonghui': true },
              renown: 50,
              virtue: 10,
            },
          },
          {
            label: '勅に従い、素直に降る',
            effect: {
              deed: '勅に従って降り、武器を置く',
              flags: { 'joined:ev_shu_falls': true, 'surrendered:jiange': true },
              renown: 10,
              virtue: 5,
            },
          },
          {
            label: '勅を拒み、剣閣で戦い続ける',
            effect: {
              deed: '降伏の勅を拒み、剣閣に踏みとどまる',
              flags: { 'joined:ev_shu_falls': true, 'abandoned:hanzhong': false },
              battle: { enemies: ['zhonghui'], escapable: true },
              renown: 45,
              virtue: 25,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '剣閣は堅い。正面からは抜けない。\n' +
          '地図の西に、道でない道がある。陰平。七百里の無人の険。\n\n' +
          '——兵が半分死んでも、越えるか。',
        choices: [
          {
            label: '陰平を越える',
            historical: true,
            effect: {
              deed: '陰平の険を越え、綿竹を破って成都に迫る',
              flags: { 'joined:ev_shu_falls': true, 'won:ev_shu_falls': true },
              battle: { enemies: ['general', 'officer'], escapable: false },
              renown: 90,
            },
          },
          {
            label: '正攻法で剣閣を攻め続ける',
            effect: {
              deed: '剣閣を攻めあぐね、兵糧を費やす',
              flags: { 'joined:ev_shu_falls': true },
              battle: { enemies: ['jiangwei'], escapable: true },
              renown: 30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_jin_founded',
    year: 265,
    name: '晋',
    weight: 4,
    factions: ['wei', 'jin'],
    record: '司馬炎、魏帝より禅譲を受けて晋を建つ。四十五年前、魏が漢にしたのと同じ形で',
    scenes: [
      {
        id: 'default',
        text:
          '魏帝が位を譲った。\n' +
          '四十五年前、曹丕が献帝にさせたのと、まったく同じ手順で。\n\n' +
          '「今日の事、昔の事と何ぞ異ならん」と、誰かが呟いた。',
        choices: [
          {
            label: '禅譲を受け、晋を建てる',
            historical: true,
            effect: {
              deed: '禅譲を受けて晋を建つ',
              flags: { 'joined:ev_jin_founded': true },
              renown: 60,
              virtue: -15,
              joinFaction: 'jin',
            },
          },
          {
            label: '魏の臣として、これに与しない',
            effect: {
              deed: '禅譲に与せず、官を辞す',
              flags: { 'loyal:wei': true },
              renown: 20,
              virtue: 30,
              joinFaction: 'ronin',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_wu_falls',
    year: 280,
    name: '天下、一に帰す',
    weight: 5,
    factions: ['wu', 'jin'],
    record:
      '晋、大挙して江を渡る。孫皓、降る。九十六年の分裂ここに終わり、天下は一つとなる',
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '陸抗が死んで六年。江の守りを継ぐ者はいない。\n' +
          '鎖を沈めて船を止めようとしたが、筏と炬火で焼き切られた。\n\n' +
          '——王濬の楼船が、もう石頭城の下にいる。',
        choices: [
          {
            label: '降る',
            historical: true,
            effect: {
              deed: '面縛輿櫬して降り、呉を畳む',
              flags: { 'joined:ev_wu_falls': true, 'surrendered:jianye': true },
              renown: -15,
              joinFaction: 'jin',
            },
          },
          {
            label: '最後まで江を守って戦う',
            effect: {
              deed: '石頭城に拠り、最後の一戦を交える',
              flags: { 'joined:ev_wu_falls': true },
              battle: { enemies: ['yanghu', 'general'], escapable: false },
              renown: 40,
              virtue: 20,
            },
          },
        ],
      },
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin' || c.factionId === 'wei',
        text:
          '羊祜は「今こそ」と言い遺して死んだ。\n' +
          '長江を、二十万で渡る。\n\n' +
          '——黄巾が蜂起してから、九十六年になる。',
        choices: [
          {
            label: '江を渡り、天下を一つにする',
            historical: true,
            effect: {
              deed: '江を渡って呉を平らげ、天下を一に帰す',
              flags: { 'joined:ev_wu_falls': true, 'won:ev_wu_falls': true, 'unified:tianxia': true },
              renown: 120,
            },
          },
          {
            label: '降を勧め、血を流さずに収める',
            effect: {
              deed: '呉主に降を勧め、兵を用いずして統一を成す',
              flags: { 'joined:ev_wu_falls': true, 'unified:tianxia': true },
              renown: 100,
              virtue: 30,
            },
          },
        ],
      },
    ],
  },
];

export default events;
