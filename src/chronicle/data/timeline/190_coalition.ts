/** 初平元年〜三年（190〜192）。反董卓連合、洛陽炎上、そして連環の計。 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_coalition',
    year: 190,
    name: '反董卓連合',
    weight: 5,
    factions: ['han', 'yuanshao', 'caocao', 'sunjian', 'gongsunzan', 'liubei', 'yuanshu', 'dongzhuo'],
    record: '関東の諸侯、袁紹を盟主として兵を挙ぐ。十八路の諸侯と称す',
    scenes: [
      {
        id: 'as_coalition',
        when: (c) => c.factionId !== 'dongzhuo',
        text:
          '曹操の檄文が天下を巡った。\n' +
          '諸侯が集まる。旗が林のように立つ。\n' +
          'だが酒宴の席で、誰も先陣を志願しない。',
        choices: [
          {
            label: '先陣を買って出る',
            historical: true,
            effect: {
              deed: '連合軍の先陣を志願す',
              flags: { 'joined:ev_coalition': true },
              renown: 40,
              troops: 400,
            },
          },
          {
            label: '兵糧の差配を引き受ける',
            effect: {
              deed: '連合軍の兵糧を差配す',
              flags: { 'joined:ev_coalition': true },
              renown: 20,
              gold: 300,
            },
          },
          {
            label: 'この連合は長続きしないと見る',
            effect: {
              deed: '連合に加わらず、自らの地盤を固める',
              renown: -10,
              troops: 600,
            },
          },
        ],
      },
      {
        id: 'as_dongzhuo',
        when: (c) => c.factionId === 'dongzhuo',
        text:
          '関東の鼠どもが集まったという。十八路、と称しているらしい。\n' +
          '董卓は笑った。「呂布ひとりで足りる」',
        choices: [
          {
            label: '虎牢関で迎え撃つ',
            historical: true,
            effect: {
              deed: '虎牢関にて関東の諸侯を迎え撃つ',
              flags: { 'joined:ev_coalition': true },
              renown: 35,
              troops: 500,
            },
          },
          {
            label: '守りを固め、長期戦に持ち込む',
            effect: { deed: '関を閉ざして持久を図る', renown: 15, troops: 300 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_hulaoguan',
    year: 190,
    name: '虎牢関',
    weight: 4,
    factions: ['dongzhuo', 'lvbu', 'yuanshao', 'liubei', 'gongsunzan'],
    record: '呂布、関前に立ちはだかる。劉備・関羽・張飛、三人がかりでようやく退ける',
    attribution: {
      work: 'yanyi',
      standing: 'invention',
      insteadTruly:
        '三英が呂布と渡り合った記述は無い。劉備たちが連合の主力として関に当たった話も見えない。' +
        '董卓軍を実際に破って洛陽へ迫ったのは孫堅で、華雄を斬ったのもその軍である（孫堅伝）。',
    },
    scenes: [
      {
        id: 'as_lvbu',
        when: (c) => c.officerId === 'lvbu' || c.factionId === 'lvbu' || c.factionId === 'dongzhuo',
        text:
          '関の前に出た。諸侯の将が次々に馬を出しては、次々に落ちていく。\n' +
          'やがて三騎が同時に向かってきた。\n' +
          '髭の長い男、目を吊り上げた男、そして大人しそうな男。',
        choices: [
          {
            label: '三人まとめて相手をする',
            historical: true,
            effect: {
              deed: '虎牢関にて三将を同時に相手取る',
              flags: { 'joined:ev_hulaoguan': true },
              battle: { enemies: ['liubei', 'guanyu', 'zhangfei'], escapable: true },
              renown: 60,
            },
          },
          {
            label: '深追いせず、関に退く',
            effect: {
              deed: '関を守り、深追いを避ける',
              flags: { 'retreated:ev_hulaoguan': true },
              renown: 20,
            },
          },
        ],
      },
      {
        id: 'as_coalition',
        when: (c) => c.factionId !== 'dongzhuo' && c.factionId !== 'lvbu',
        text:
          '関の前に、赤い馬の武将がひとり立っている。\n' +
          'すでに味方の将が四人、馬から落ちた。\n' +
          '「人中に呂布あり」——聞いてはいたが。',
        choices: [
          {
            label: '馬を出して挑む',
            historical: true,
            effect: {
              deed: '虎牢関にて呂布に挑む',
              flags: { 'joined:ev_hulaoguan': true },
              battle: { enemies: ['lvbu'], escapable: true },
              renown: 55,
            },
          },
          {
            label: '味方を援護し、共に当たる',
            effect: {
              deed: '味方と力を合わせて呂布を退ける',
              flags: { 'joined:ev_hulaoguan': true, 'won:ev_hulaoguan': true },
              renown: 40,
              virtue: 8,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_luoyang_fire',
    year: 190,
    name: '洛陽炎上',
    weight: 5,
    factions: ['dongzhuo', 'han', 'yuanshao', 'caocao', 'sunjian'],
    record: '董卓、洛陽を焼いて長安へ遷る。二百年の都、灰となる',
    scenes: [
      {
        id: 'default',
        text:
          '都が燃えている。\n' +
          '数十万の民が、鞭に追われて西へ歩かされていく。\n' +
          '道端に倒れた者は、そのまま置いていかれる。',
        choices: [
          {
            label: '追撃する',
            historical: true,
            effect: {
              deed: '遷都する董卓軍を追撃す',
              flags: { 'joined:ev_luoyang_fire': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 30,
            },
          },
          {
            label: '民を助ける',
            effect: {
              deed: '道に倒れた民を救い、糧を分ける',
              virtue: 20,
              renown: 15,
              gold: -200,
            },
          },
          {
            label: '焼け跡から玉璽を探す',
            effect: {
              deed: '焼け跡より伝国の玉璽を得る',
              flags: { 'has:imperial_seal': true },
              renown: 25,
              virtue: -10,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_xiangyang',
    year: 191,
    name: '襄陽の矢',
    weight: 3,
    factions: ['sunjian', 'liubiao'],
    record: '孫堅、劉表を攻めて岘山にて伏兵の矢に当たり没す',
    scenes: [
      {
        id: 'as_sunjian',
        when: (c) => c.factionId === 'sunjian',
        text:
          '劉表の兵は弱い。追えば追うほど逃げていく。\n' +
          '岘山の道は狭く、木が深い。\n' +
          '——それでも、追うか。',
        choices: [
          {
            label: '一気に追い詰める',
            historical: true,
            effect: {
              deed: '襄陽に劉表を攻め、岘山まで追う',
              flags: { 'joined:ev_xiangyang': true },
              battle: { enemies: ['huangzu'], escapable: false },
              renown: 30,
            },
          },
          {
            label: '深い山道を避け、兵を返す',
            effect: {
              deed: '伏兵を警戒し、兵を退く',
              flags: { 'retreated:ev_xiangyang': true },
              renown: 5,
            },
          },
          {
            label: '斥候を出してから進む',
            effect: {
              deed: '斥候を放ち、伏兵を暴いてから進む',
              flags: { 'joined:ev_xiangyang': true, 'won:ev_xiangyang': true },
              renown: 35,
            },
          },
        ],
      },
      {
        id: 'as_liubiao',
        when: (c) => c.factionId === 'liubiao',
        text: '江東の虎が攻めてきた。正面では勝てない。だが山道なら。',
        choices: [
          {
            label: '岘山に伏兵を置く',
            historical: true,
            effect: {
              deed: '岘山に伏兵を伏せ、孫堅を討つ',
              flags: { 'joined:ev_xiangyang': true, 'won:ev_xiangyang': true },
              renown: 40,
            },
          },
          {
            label: '城を固めてやり過ごす',
            effect: { deed: '襄陽に籠もり、孫堅の兵糧切れを待つ', renown: 15 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_diaochan',
    year: 192,
    name: '連環の計',
    weight: 5,
    factions: ['han', 'dongzhuo', 'lvbu'],
    record: '王允、貂蝉を用いて董卓と呂布を離間す。呂布、董卓を戟にて刺す',
    attribution: {
      work: 'yanyi',
      standing: 'dramatized',
      insteadTruly:
        '王允が呂布を説いて董卓を討たせたことは正史（呂布伝）にある。' +
        '呂布が董卓の侍婢と通じ、露見を恐れていたことも書かれている。' +
        'ただしその侍婢の名は伝わらず、貂蝉という女も、連環の計という筋書きも演義の作。',
    },
    scenes: [
      {
        id: 'as_lvbu',
        when: (c) => c.officerId === 'lvbu',
        text:
          '鳳儀亭で、あの娘が泣いていた。\n' +
          '——太師に奪われた、と。\n\n' +
          '背後で足音がする。董卓が、戟を手に立っている。',
        choices: [
          {
            label: '董卓を討つ',
            historical: true,
            effect: {
              deed: '董卓を戟にて刺し殺す',
              flags: { 'betrayed:dongzhuo': true, 'joined:ev_diaochan': true },
              renown: 50,
              virtue: -15,
              joinFaction: 'lvbu',
            },
          },
          {
            label: '娘を連れて、都を出る',
            effect: {
              deed: '女を連れて洛陽を去る',
              flags: { 'kept:dongzhuo': true },
              renown: -15,
              virtue: 10,
              joinFaction: 'ronin',
            },
          },
          {
            label: '計に気づき、王允を問い詰める',
            effect: {
              deed: '離間の計を見抜き、王允を問い詰める',
              flags: { 'saw_through:wangyun': true, 'kept:dongzhuo': true },
              renown: 20,
              virtue: 12,
            },
          },
        ],
      },
      {
        id: 'as_wangyun',
        when: (c) => c.factionId === 'han',
        text:
          '正面から董卓を討つ手はない。\n' +
          'だが、あの二人は同じものを欲しがる。\n' +
          '——ひとりの娘に、天下を賭けられるか。',
        choices: [
          {
            label: '連環の計を進める',
            historical: true,
            effect: {
              deed: '連環の計を以て董卓と呂布を離間す',
              flags: { 'joined:ev_diaochan': true, 'won:ev_diaochan': true },
              renown: 50,
              virtue: -5,
            },
          },
          {
            label: '娘を巻き込まぬ道を探す',
            effect: {
              deed: '女を用いず、諸将の説得に賭ける',
              flags: { 'joined:ev_diaochan': true },
              renown: 20,
              virtue: 18,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_lijue',
    year: 192,
    name: '李傕の反攻',
    weight: 3,
    factions: ['han', 'dongzhuo', 'lvbu'],
    record: '賈詡の献策により董卓の残党が長安を陥とす。王允、殺さる',
    scenes: [
      {
        id: 'default',
        text:
          '董卓が死んで、都は喜びに沸いた。ひと月だけ。\n' +
          '西涼の兵が戻ってきた。今度は赦しを乞うためではなく。',
        choices: [
          {
            label: '長安を守って戦う',
            historical: true,
            effect: {
              deed: '長安に拠って西涼の兵と戦う',
              flags: { 'joined:ev_lijue': true },
              battle: { enemies: ['lijue', 'general'], escapable: true },
              renown: 30,
            },
          },
          {
            label: '帝を奉じて東へ落ちる',
            effect: {
              deed: '帝を奉じて長安を脱す',
              flags: { 'protected:emperor': true, 'retreated:ev_lijue': true },
              renown: 45,
              virtue: 18,
            },
          },
          {
            label: '西涼の兵に恩赦を布告する',
            effect: {
              // 史実の王允は恩赦を拒み、それが長安陥落を招いた
              deed: '董卓の旧臣に恩赦を布告し、兵を解かしむ',
              flags: { 'favor:lijue': true, 'won:ev_lijue': true },
              renown: 35,
              virtue: 25,
            },
          },
        ],
      },
    ],
  },
];

export default events;
