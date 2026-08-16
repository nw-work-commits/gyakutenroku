/**
 * 中平元年（184）黄巾の乱。
 *
 * 同じ事件を、立場によって違う席から見る —— という書き方の基本形。
 * 劉備側で出れば討伐、黄巾側で出れば蜂起、どちらでもなければ巻き込まれる。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_yellowturban_rise',
    year: 184,
    name: '黄巾蜂起',
    weight: 5,
    factions: ['han', 'yellowturban', 'liubei', 'caocao', 'sunjian'],
    record: '蒼天已に死す、黄天当に立つべし。天下三十六方、一斉に兵を挙ぐ',
    scenes: [
      {
        id: 'as_yellowturban',
        when: (c) => c.factionId === 'yellowturban',
        text:
          '黄色い布を頭に巻いた者たちが、村という村から湧き出してくる。\n' +
          '大賢良師は言った。蒼天已に死す、と。\n' +
          'あなたも、その一人だった。',
        choices: [
          {
            label: '声を上げて先頭に立つ',
            historical: true,
            effect: {
              deed: '黄巾の兵を率いて官軍に当たる',
              flags: { 'joined:ev_yellowturban_rise': true },
              renown: 20,
              troops: 500,
            },
          },
          {
            label: '略奪を止めさせる',
            effect: {
              deed: '味方の略奪を制し、民を庇う',
              virtue: 8,
              renown: 10,
              flags: { 'joined:ev_yellowturban_rise': true },
            },
          },
          {
            label: 'この乱は勝てぬと見て、離れる',
            effect: {
              deed: '蜂起に加わらず、ひとり野に下る',
              renown: -5,
              joinFaction: 'ronin',
            },
          },
        ],
      },
      {
        id: 'as_han',
        when: (c) => c.factionId !== 'yellowturban',
        text:
          '幽州にも檄文が回ってきた。義兵を募る、と書いてある。\n' +
          '賊は十万を号し、郡県はことごとく破られているという。',
        choices: [
          {
            label: '義兵に応じる',
            historical: true,
            effect: {
              deed: '義兵に応じ、黄巾討伐に加わる',
              flags: { 'joined:ev_yellowturban_rise': true },
              renown: 25,
              troops: 300,
            },
          },
          {
            label: '郷里の守りを固める',
            effect: { deed: '郷里に留まり、村を守る', virtue: 6, renown: 5, troops: 150 },
          },
          {
            label: '関わらない',
            effect: { deed: '乱を避けて身を隠す', renown: -10 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_daxing',
    year: 184,
    name: '大興山の戦い',
    weight: 2,
    factions: ['yellowturban', 'liubei'],
    record: '関羽、程遠志を斬る。張飛、鄧茂を突き落とす',
    scenes: [
      {
        id: 'as_yellowturban_captain',
        when: (c) => c.factionId === 'yellowturban',
        text:
          '五万を号して大興山に布陣した。\n' +
          '向かうは、義兵と称する五百ばかりの寄せ集め。\n' +
          'だが先頭に、髭の長い男と、目を吊り上げた男がいる。',
        choices: [
          {
            label: '数に任せて押し潰す',
            historical: true,
            effect: {
              deed: '大興山にて義兵と戦う',
              flags: { 'joined:ev_daxing': true },
              battle: { enemies: ['guanyu', 'zhangfei'], escapable: true },
            },
          },
          {
            label: '相手が寡兵と見て、包囲する',
            effect: {
              deed: '大興山にて義兵を包囲す',
              flags: { 'joined:ev_daxing': true },
              battle: { enemies: ['guanyu', 'zhangfei', 'liubei'], escapable: true },
            },
          },
          {
            label: '兵を退き、山に籠もる',
            effect: {
              deed: '戦わずして山に退く',
              flags: { 'retreated:ev_daxing': true },
              renown: -15,
            },
          },
        ],
      },
      {
        id: 'as_liubei_side',
        when: (c) => c.factionId === 'liubei' || c.factionId === 'han',
        text:
          '賊は五万を号している。こちらは五百。\n' +
          '「多寡は問題ではない」と、髭の長い男が言った。',
        choices: [
          {
            label: '先陣を切る',
            historical: true,
            effect: {
              deed: '大興山にて賊将と斬り結ぶ',
              flags: { 'joined:ev_daxing': true },
              battle: { enemies: ['chengyuanzhi', 'dengmao'], escapable: false },
              renown: 30,
            },
          },
          {
            label: '伏兵を献策する',
            effect: {
              deed: '伏兵の計を献じ、寡兵を以て賊を破る',
              flags: { 'joined:ev_daxing': true, 'won:ev_daxing': true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_qingzhou',
    year: 184,
    name: '青州の攻防',
    weight: 2,
    factions: ['yellowturban', 'han', 'gongsunzan'],
    record: '青州の黄巾、郡県を荒らす',
    scenes: [
      {
        id: 'as_yellowturban',
        when: (c) => c.factionId === 'yellowturban',
        text:
          '青州の城を囲んだ。中には官吏も、逃げ込んだ百姓もいる。\n' +
          '門を破れば、糧はいくらでも手に入る。',
        choices: [
          {
            label: '力ずくで城を落とす',
            historical: true,
            effect: {
              deed: '青州の城を攻め落とす',
              flags: { 'joined:ev_qingzhou': true, 'won:ev_qingzhou': true },
              renown: 20,
              virtue: -12,
              troops: 200,
            },
          },
          {
            label: '糧だけ求めて、人は殺さない',
            effect: {
              deed: '青州にて糧を求めるも、民を害さず',
              flags: { 'joined:ev_qingzhou': true, 'won:ev_qingzhou': true },
              renown: 12,
              virtue: 15,
              troops: 80,
            },
          },
          {
            label: '囲みを解いて去る',
            effect: {
              deed: '青州の囲みを解いて去る',
              flags: { 'retreated:ev_qingzhou': true },
              virtue: 8,
              renown: -10,
            },
          },
        ],
      },
      {
        id: 'default',
        text:
          '青州一帯が黄巾の海に沈んでいる。\n' +
          '城に籠もる者、逃げる者、加わる者。誰もが選ばされていた。',
        choices: [
          {
            label: '城を守り抜く',
            historical: true,
            effect: {
              deed: '青州にて城を守る',
              flags: { 'joined:ev_qingzhou': true },
              battle: { enemies: ['gaosheng'], escapable: true },
              renown: 20,
            },
          },
          {
            label: '民を城内に入れてから戦う',
            effect: {
              deed: '流民を城に容れ、然る後に賊を退ける',
              flags: { 'joined:ev_qingzhou': true, 'won:ev_qingzhou': true },
              virtue: 10,
              renown: 15,
            },
          },
          {
            label: '兵糧が尽きる前に退く',
            effect: { deed: '青州を捨てて退く', flags: { 'retreated:ev_qingzhou': true } },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_guangzong',
    year: 184,
    name: '広宗の戦い',
    weight: 4,
    factions: ['yellowturban', 'han'],
    record: '張角、陣中に病没す。張梁、皇甫嵩に討たる',
    scenes: [
      {
        id: 'as_yellowturban',
        when: (c) => c.factionId === 'yellowturban',
        text:
          '広宗の城は官軍に囲まれた。\n' +
          '大賢良師は、幕の奥で咳をしている。\n' +
          '呪いも符水も、もう効かない。',
        choices: [
          {
            label: '最後まで城を枕に戦う',
            historical: true,
            effect: {
              deed: '広宗にて官軍を迎え撃つ',
              flags: { 'joined:ev_guangzong': true },
              battle: { enemies: ['huangfusong'], escapable: false },
              renown: 25,
            },
          },
          {
            label: '師を連れて夜陰に脱出する',
            effect: {
              deed: '囲みを破り、師を落ち延びさせる',
              flags: { 'retreated:ev_guangzong': true, 'saved:zhangjiao': true },
              virtue: 12,
              renown: 15,
            },
          },
          {
            label: '兵を解いて民に返す',
            effect: {
              deed: '兵を解き、民をそれぞれの村へ帰す',
              flags: { 'retreated:ev_guangzong': true },
              virtue: 18,
              renown: -20,
              joinFaction: 'ronin',
            },
          },
        ],
      },
      {
        id: 'as_han',
        when: (c) => c.factionId !== 'yellowturban',
        text:
          '広宗を囲んで十日。城内では病が流行っているという。\n' +
          '皇甫嵩は「機は熟した」と言った。',
        choices: [
          {
            label: '夜襲をかける',
            historical: true,
            effect: {
              deed: '広宗に夜襲をかけ、賊軍を破る',
              flags: { 'joined:ev_guangzong': true, 'won:ev_guangzong': true },
              battle: { enemies: ['zhangliang', 'yellowturban_captain'], escapable: false },
              renown: 40,
            },
          },
          {
            label: '降を勧めてから攻める',
            effect: {
              deed: '降を勧め、応じた者を助命す',
              flags: { 'joined:ev_guangzong': true, 'won:ev_guangzong': true },
              virtue: 12,
              renown: 30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_xiaquyang',
    year: 184,
    name: '下曲陽の戦い',
    weight: 3,
    factions: ['yellowturban', 'han'],
    record: '張宝、討たる。首級十万余',
    scenes: [
      {
        id: 'as_yellowturban',
        when: (c) => c.factionId === 'yellowturban',
        text:
          '下曲陽。ここが最後の砦になる。\n' +
          '大賢良師は逝き、張宝どのも囲まれている。\n' +
          'この戦の後、官軍は首を積んで塚を築いた —— と、後の史書は書く。',
        choices: [
          {
            label: '最後まで戦う',
            historical: true,
            effect: {
              deed: '下曲陽にて官軍を迎え撃つ',
              flags: { 'joined:ev_xiaquyang': true },
              battle: { enemies: ['huangfusong'], escapable: true },
              renown: 25,
            },
          },
          {
            label: '兵を解き、名を捨てて落ち延びる',
            effect: {
              deed: '兵を解いて姓名を変え、野に沈む',
              flags: { 'retreated:ev_xiaquyang': true },
              renown: -25,
              virtue: 10,
              joinFaction: 'ronin',
            },
          },
        ],
      },
      {
        id: 'default',
        text:
          '下曲陽。ここが黄巾の最後の砦になる。\n' +
          '首を積んで塚を築いた —— と、後の史書は書く。',
        choices: [
          {
            label: '徹底して討つ',
            historical: true,
            effect: {
              deed: '下曲陽にて賊を掃討す',
              flags: { 'joined:ev_xiaquyang': true, 'won:ev_xiaquyang': true },
              battle: { enemies: ['zhangbao'], escapable: false },
              renown: 35,
              virtue: -8,
            },
          },
          {
            label: '降った者は殺さない',
            effect: {
              deed: '降人を斬らず、田に返す',
              flags: { 'joined:ev_xiaquyang': true, 'won:ev_xiaquyang': true },
              renown: 25,
              virtue: 15,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_beihai',
    year: 193,
    name: '北海の囲み',
    weight: 2,
    factions: ['yellowturban', 'han', 'liubei', 'wu'],
    record: '管亥、北海を囲む。太史慈、囲みを破って救援を請う',
    scenes: [
      {
        id: 'default',
        text:
          '北海の城が黄巾の残党に囲まれている。\n' +
          '孔融は書を送ったが、援軍の当てはない。\n' +
          '城壁の上から見れば、旗の数だけで気が滅入る。',
        choices: [
          {
            label: '単騎、囲みを破って救援を求める',
            historical: true,
            effect: {
              deed: '単騎で囲みを破り、救援を請う',
              flags: { 'joined:ev_beihai': true },
              renown: 45,
              virtue: 10,
            },
          },
          {
            label: '打って出て賊将を討つ',
            effect: {
              deed: '北海にて賊将を討ち取る',
              flags: { 'joined:ev_beihai': true, 'won:ev_beihai': true },
              battle: { enemies: ['guansihai'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },
];

export default events;
