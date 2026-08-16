/** 建安十九年〜二十四年（214〜219）。益州、合肥、そして荊州が崩れるまで。 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_luofeng',
    year: 214,
    name: '雒城の流矢',
    weight: 3,
    factions: ['liubei', 'liuzhang'],
    record: '龐統、雒城を攻めるさなか流矢に当たり没す。三十六',
    attribution: {
      work: 'sanguozhi',
      standing: 'record',
      locus: '龐統伝',
      insteadTruly:
        '「落鳳坡」という地名は演義の造語で、鳳雛の号にかけたもの。' +
        '正史はただ「城を統攻め、流矢の中る所と為り、卒す」と書く。',
    },
    scenes: [
      {
        id: 'as_pangtong',
        when: (c) => c.officerId === 'pangtong',
        text:
          '道が二つに分かれている。細い道と、広い道。\n' +
          '土地の者が言う。「細いほうを、落鳳坡と申します」\n\n' +
          '——鳳が、落ちる坂。\n' +
          '自分の号は、鳳雛という。',
        choices: [
          {
            label: '構わず細い道を進む',
            historical: true,
            effect: {
              deed: '落鳳坡に踏み入る',
              flags: { 'joined:ev_luofeng': true },
              battle: { enemies: ['officer', 'soldier'], escapable: false },
              renown: 20,
            },
          },
          {
            label: '名を嫌って広い道を行く',
            effect: {
              deed: '不吉を避けて大道を進む',
              flags: { 'retreated:ev_luofeng': true },
              renown: 10,
            },
          },
          {
            label: '主に白馬を返してから進む',
            effect: {
              deed: '主より借りた白馬を返し、然る後に進む',
              flags: { 'joined:ev_luofeng': true, 'won:ev_luofeng': true },
              renown: 25,
              virtue: 12,
            },
          },
        ],
      },
      {
        id: 'as_other',
        when: (c) => c.factionId === 'liubei' || c.factionId === 'liuzhang',
        text: '蜀への道は狭い。伏兵を置くには、これ以上の地形はない。',
        choices: [
          {
            label: '伏兵を置く',
            historical: true,
            effect: {
              deed: '落鳳坡に伏兵を置く',
              flags: { 'joined:ev_luofeng': true },
              renown: 25,
            },
          },
          {
            label: '斥候を先に出す',
            effect: {
              deed: '斥候を先行させ、伏兵を暴く',
              flags: { 'joined:ev_luofeng': true, 'won:ev_luofeng': true },
              renown: 30,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_chengdu',
    year: 214,
    name: '成都入城',
    weight: 4,
    factions: ['liubei', 'liuzhang'],
    record: '劉璋、城を出て降る。劉備、益州を得て蜀の基を成す',
    scenes: [
      {
        id: 'as_liubei',
        when: (c) => c.factionId === 'liubei',
        text:
          '成都はまだ落ちていない。兵糧も一年ぶんある。\n' +
          'だが劉璋が、自ら城門を開けて出てきた。\n' +
          '「私のために民が死ぬのは、忍びない」',
        choices: [
          {
            label: '礼を尽くして迎える',
            historical: true,
            effect: {
              deed: '劉璋を礼を以て遇し、益州を得る',
              flags: { 'joined:ev_chengdu': true, 'won:ev_chengdu': true },
              renown: 60,
              virtue: 15,
              gold: 2000,
            },
          },
          {
            label: '同族を討った己を恥じ、益州を返す',
            effect: {
              deed: '同族より奪うを恥じ、益州を辞す',
              flags: { 'refused:yizhou': true },
              renown: -20,
              virtue: 40,
            },
          },
        ],
      },
      {
        id: 'as_liuzhang',
        when: (c) => c.factionId === 'liuzhang',
        text:
          '兵糧はまだある。城壁も厚い。\n' +
          'だが、外では毎日人が死んでいる。',
        choices: [
          {
            label: '城を開けて降る',
            historical: true,
            effect: {
              deed: '成都を開き、民を戦火から救う',
              flags: { 'surrendered:chengdu': true },
              renown: 10,
              virtue: 30,
              joinFaction: 'liubei',
            },
          },
          {
            label: '籠城して戦い抜く',
            effect: {
              deed: '成都に籠もり、最後まで戦う',
              flags: { 'joined:ev_chengdu': true },
              battle: { enemies: ['zhangfei', 'zhaoyun'], escapable: false },
              renown: 30,
              virtue: -10,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_hefei',
    year: 215,
    name: '合肥',
    weight: 3,
    factions: ['wu', 'caocao'],
    record: '張遼、八百を率いて十万に当たる。呉の児、その名を聞いて泣き止む',
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'caocao' || c.factionId === 'wei',
        text:
          '孫権が十万で来た。こちらは七千。\n' +
          '曹操の書には「張遼・李典は出て戦え、楽進は城を守れ」とある。\n' +
          '——出るのか。この兵数で。',
        choices: [
          {
            label: '八百を選んで夜討ちをかける',
            historical: true,
            effect: {
              deed: '八百を率いて十万の陣に斬り込む',
              flags: { 'joined:ev_hefei': true, 'won:ev_hefei': true },
              battle: { enemies: ['sunquan', 'ganning'], escapable: true },
              renown: 75,
            },
          },
          {
            label: '城を固く守る',
            effect: {
              deed: '合肥に籠もり、援軍を待つ',
              flags: { 'joined:ev_hefei': true },
              renown: 20,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '十万で囲めば、七千の城など。\n' +
          'そう思っていたところへ、暁闇を裂いて騎馬が突っ込んできた。',
        choices: [
          {
            label: '踏みとどまって迎え撃つ',
            historical: true,
            effect: {
              deed: '合肥にて張遼の突撃を受け止める',
              flags: { 'joined:ev_hefei': true },
              battle: { enemies: ['zhangliao'], escapable: true },
              renown: 35,
            },
          },
          {
            label: '主君を逃がして殿を務める',
            effect: {
              deed: '殿を務め、主君を逍遙津より逃がす',
              flags: { 'joined:ev_hefei': true, 'retreated:ev_hefei': true },
              renown: 45,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_dingjunshan',
    year: 219,
    name: '定軍山',
    weight: 3,
    factions: ['liubei', 'caocao'],
    record: '黄忠、法正の策により夏侯淵を斬る',
    scenes: [
      {
        id: 'default',
        text:
          '定軍山の頂に、白い旗が立っている。\n' +
          '法正が言った。「あの旗が下りたら、太鼓を」\n' +
          '待つのは、辛い。',
        choices: [
          {
            label: '合図まで待ち、一気に駆け下りる',
            historical: true,
            effect: {
              deed: '定軍山にて夏侯淵を斬る',
              flags: { 'joined:ev_dingjunshan': true, 'won:ev_dingjunshan': true },
              battle: { enemies: ['xiahouyuan'], escapable: false },
              renown: 60,
            },
          },
          {
            label: '待ちきれずに攻めかかる',
            effect: {
              deed: '合図を待たず攻めかかり、苦戦す',
              flags: { 'joined:ev_dingjunshan': true },
              battle: { enemies: ['xiahouyuan', 'zhanghe'], escapable: true },
              renown: 25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_fancheng',
    year: 219,
    name: '樊城の水',
    weight: 5,
    factions: ['liubei', 'caocao', 'wei'],
    record: '関羽、漢水を決して七軍を沈む。于禁降り、龐徳は降らずして斬らる。威、華夏を震わす',
    scenes: [
      {
        id: 'as_guanyu',
        when: (c) => c.officerId === 'guanyu' || c.factionId === 'liubei',
        text:
          '秋の長雨で漢水が膨れている。\n' +
          '于禁の七軍は、低地に陣を敷いたままだ。\n\n' +
          '——ただ、荊州が手薄になる。\n' +
          '呂蒙は病と称して建業に下がったと聞くが。',
        choices: [
          {
            label: '全軍を樊城に注ぎ込む',
            historical: true,
            effect: {
              deed: '漢水を決して七軍を水に沈む',
              flags: { 'joined:ev_fancheng': true, 'won:ev_fancheng': true },
              battle: { enemies: ['pangde', 'yujin'], escapable: false },
              renown: 90,
            },
          },
          {
            label: '荊州に三万を残してから攻める',
            effect: {
              deed: '荊州の守りに三万を残し、然る後に北上す',
              flags: { 'joined:ev_fancheng': true, 'won:ev_fancheng': true, jingzhou_garrison: true },
              renown: 70,
            },
          },
          {
            label: '呂蒙の病を疑い、北上を見送る',
            effect: {
              deed: '呉の動きを警戒し、樊城攻めを見送る',
              flags: { jingzhou_garrison: true, 'suspect:lvmeng': true },
              renown: 15,
            },
          },
        ],
      },
      {
        id: 'as_pangde',
        when: (c) => c.officerId === 'pangde',
        text:
          '棺を作らせ、陣に置いた。\n' +
          '兄は蜀にいる。「降るつもりだろう」と陰口を叩く者がいる。\n\n' +
          '水が、陣を呑み込んでいく。',
        choices: [
          {
            label: '最後まで戦い、降らない',
            historical: true,
            effect: {
              deed: '水中に矢を放ち、降らずして捕らわる',
              flags: { 'joined:ev_fancheng': true, 'captured:ev_fancheng': true },
              renown: 50,
              virtue: 25,
            },
          },
          {
            label: '高地へ兵を移してから戦う',
            effect: {
              deed: '長雨を警戒して高地に陣を移す',
              flags: { 'joined:ev_fancheng': true, 'retreated:ev_fancheng': true },
              renown: 40,
            },
          },
          {
            label: '兄のもとへ降る',
            effect: {
              deed: '関羽に降り、蜀に仕う',
              flags: { 'joined:ev_fancheng': true, 'spared:ev_fancheng': true },
              renown: 10,
              virtue: -15,
              joinFaction: 'liubei',
            },
          },
          {
            label: '戦う前に、捕虜の扱いを申し合わせる',
            effect: {
              // 兄が蜀にいる縁を頼り、敵将と話をつけておく
              deed: '兄の縁を頼み、関羽と捕虜の扱いを申し合わす',
              flags: { 'joined:ev_fancheng': true, 'favor:guanyu': true },
              renown: 20,
              virtue: 18,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_maicheng',
    year: 219,
    name: '麦城',
    weight: 5,
    factions: ['liubei', 'wu'],
    record: '呂蒙、白衣にて荊州を襲う。関羽、麦城に孤立し、捕らえられて斬らる',
    scenes: [
      {
        id: 'as_guanyu',
        when: (c) => c.officerId === 'guanyu',
        text:
          '荊州が落ちた。背後から。\n' +
          '兵は夜ごとに減っていく。家族が呉の手にあると知って、帰っていくのだ。\n\n' +
          '上庸の劉封に援軍を求めた。返事はない。\n' +
          '——麦城の兵、三百。',
        choices: [
          {
            label: '囲みを破って西へ走る',
            historical: true,
            effect: {
              deed: '麦城を脱するも、臨沮にて捕らわる',
              flags: { 'joined:ev_maicheng': true, 'captured:ev_maicheng': true },
              battle: { enemies: ['lvmeng', 'general'], escapable: false },
              renown: 30,
            },
          },
          {
            label: '呉に和を請う',
            effect: {
              deed: '呉に使いを送り、和睦を請う',
              flags: { 'joined:ev_maicheng': true, 'peace:lvmeng': true },
              renown: 10,
              virtue: 10,
            },
          },
          {
            label: '劉封に自ら詫び、援軍を頼む',
            effect: {
              deed: '過去の非礼を詫び、劉封に援軍を請う',
              flags: { 'joined:ev_maicheng': true, 'favor:liufeng': true },
              renown: 15,
              virtue: 22,
            },
          },
        ],
      },
      {
        id: 'as_liufeng',
        when: (c) => c.officerId === 'liufeng' || c.officerId === 'mengda',
        text:
          '麦城から使いが来た。援軍を出せ、という。\n' +
          '上庸を得たばかりで、兵を動かせば城が危うい。\n\n' +
          '——それに、あの人は自分を「養子ふぜい」と呼んだ。',
        choices: [
          {
            label: '兵は出せぬと断る',
            historical: true,
            effect: {
              deed: '上庸の情勢を理由に、関羽への援軍を断る',
              flags: { 'refused:guanyu': true },
              renown: -25,
              virtue: -20,
            },
          },
          {
            label: '私情を捨てて援軍を出す',
            effect: {
              deed: '私怨を捨てて兵を発し、麦城を救う',
              flags: {
                'joined:ev_maicheng': true,
                'won:ev_maicheng': true,
                'favor:liubei': true,
                'favor:liufeng': true,
              },
              renown: 50,
              virtue: 30,
            },
          },
          {
            label: '自ら少数を率いて様子を見に行く',
            effect: {
              deed: '少数を率いて麦城の様子を探る',
              flags: { 'joined:ev_maicheng': true, 'favor:liubei': true },
              renown: 20,
              virtue: 15,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '関羽は北へ出払っている。荊州の砦は、烽火だけが頼り。\n' +
          '呂蒙が言った。「兵を商人に化けさせます。白い衣で」',
        choices: [
          {
            label: '白衣渡江を決行する',
            historical: true,
            effect: {
              deed: '白衣にて江を渡り、荊州を奪う',
              flags: { 'joined:ev_maicheng': true, 'won:ev_maicheng': true },
              renown: 70,
              virtue: -15,
            },
          },
          {
            label: '関羽と和を結び、共に魏に当たる',
            effect: {
              deed: '関羽と和を結び、荊州を侵さず',
              flags: { 'peace:lvmeng': true },
              renown: 30,
              virtue: 30,
            },
          },
        ],
      },
    ],
  },
];

export default events;
