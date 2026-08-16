/**
 * 黄巾。「名前が出るだけ」の武将はここまで薄く書ける、という見本。
 * 能力値は書かない（役柄から自動生成される）。1人3行で登録できる。
 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  // ------------------------------------------------ 渠帥
  {
    id: 'zhangjiao', name: '張角', courtesy: '', roleId: 'yellowturban_leader',
    allegiance: 'yellowturban', born: 140, died: 184,
    epithet: '大賢良師',
    life: [
      {
        year: 175, text: '太平道を布き、十余年で数十万の信徒を得る',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '符水（呪符を溶かした水）で病を治すとして人を集めた。' +
            '八州にまたがり三十六方に組織したことも後漢書にある。',
        },
      },
      {
        year: 184, text: '「蒼天已に死す、黄天当に立つべし」を掲げて一斉に蜂起する', supersedes: 'ev_yellowturban_rise',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 184, text: '広宗を囲まれる中、病を得て陣没す', supersedes: 'ev_guangzong',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '戦って敗れたのではなく病死である。' +
            '皇甫嵩は棺を暴いて首を斬り、都へ送ったと記録にある。' +
            '風を呼び妖術を使う道士という姿は、演義が膨らませたもの。',
        },
      },
    ],
    fate: { kind: 'illness', year: 184, record: '広宗を囲まれる中、病にて没す' },
    stats: { intel: 82, virtue: 66, war: 40 },
  },
  {
    id: 'zhangbao', name: '張宝', roleId: 'yellowturban_leader',
    allegiance: 'yellowturban', died: 184,
    life: [
      {
        year: 184, text: '地公将軍を称し、兄の張角とともに立つ',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 184, text: '下曲陽に破れて討たれ、首級十万余が塚に積まれる', supersedes: 'ev_xiaquyang',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '妖術を用いて砂石を飛ばし、劉備たちが犬や羊の血で破ったという件は演義の作。' +
            '後漢書が書くのは、囲まれて敗れ、十余万が斬られたということだけである。',
        },
      },
    ],
    fate: { kind: 'battle', year: 184, at: 'ev_xiaquyang', by: '皇甫嵩' },
  },
  {
    id: 'zhangliang', name: '張梁', roleId: 'yellowturban_leader',
    allegiance: 'yellowturban', died: 184,
    life: [
      {
        year: 184, text: '人公将軍を称す',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 184, text: '広宗にて夜明けの奇襲を受け、三万が斬られ、五万が河に溺れる', supersedes: 'ev_guangzong',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '皇甫嵩は攻めあぐねて陣を閉ざし、相手が油断したところを鶏鳴に突いた。' +
            '兄の張角はすでに病死しており、その棺は暴かれて首を都へ送られた。',
        },
      },
    ],
    fate: { kind: 'battle', year: 184, at: 'ev_guangzong', by: '皇甫嵩' },
  },

  // ------------------------------------------------ 頭目。ここから下が「名前が出るだけ」の層
  {
    id: 'chengyuanzhi', name: '程遠志', roleId: 'yellowturban_captain',
    allegiance: 'yellowturban', died: 184, fictional: true,
    attribution: {
      work: 'yanyi', standing: 'invention',
      insteadTruly: '正史にこの名は無い。劉備が黄巾討伐で功を立てたことは書かれているが、誰を斬ったかは記されていない。',
    },
    fate: { kind: 'battle', year: 184, at: 'ev_daxing', by: '関羽', record: '関羽の一刀に斬らる' },
  },
  {
    id: 'dengmao', name: '鄧茂', roleId: 'yellowturban_captain',
    allegiance: 'yellowturban', died: 184, fictional: true,
    attribution: {
      work: 'yanyi', standing: 'invention',
      insteadTruly: '正史にこの名は無い。演義が劉備たちの初陣を書くために置いた相手役。',
    },
    fate: { kind: 'battle', year: 184, at: 'ev_daxing', by: '張飛' },
  },
  {
    id: 'gaosheng', name: '高昇', roleId: 'yellowturban_captain',
    allegiance: 'yellowturban', died: 184, fictional: true,
    attribution: {
      work: 'yanyi', standing: 'invention',
      insteadTruly: '正史にこの名は無い。趙雲が世に出るのは公孫瓚のもとにあった190年前後で、黄巾の乱には間に合わない。',
    },
    fate: { kind: 'battle', year: 184, at: 'ev_qingzhou', by: '趙雲' },
  },
  {
    id: 'zhouchang', name: '周倉', roleId: 'officer',
    allegiance: [
      { from: 184, factionId: 'yellowturban' },
      { from: 200, factionId: 'liubei' },
    ],
    died: 219, fictional: true,
    epithet: '関羽に従いし者',
    attribution: {
      work: 'yanyi', standing: 'invention',
      insteadTruly: '正史にこの名は無い。関羽の青龍偃月刀を担いだ従者という姿は、演義と後世の関帝信仰が育てたもの。',
    },
    fate: { kind: 'battle', year: 219, at: 'ev_maicheng', record: '麦城にて自刎す' },
  },
  {
    id: 'peiyuanshao', name: '裴元紹', roleId: 'bandit',
    allegiance: 'yellowturban', died: 200, fictional: true,
    attribution: {
      work: 'yanyi', standing: 'invention',
      insteadTruly: '正史にこの名は無い。周倉と同じく、関羽の千里行を彩るために置かれた人物。',
    },
    fate: { kind: 'battle', year: 200, by: '趙雲' },
  },
  {
    id: 'guansihai', name: '管亥', roleId: 'yellowturban_captain',
    allegiance: 'yellowturban', died: 193,
    // この者は演義の創作ではない。太史慈伝に、北海を囲んだ賊として名が出る。
    life: [
      {
        year: 193, text: '青州黄巾を率いて北海を囲み、孔融を苦しめる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '太史慈伝' },
      },
      {
        year: 193, text: '関羽に斬られる',
        attribution: {
          work: 'yanyi', standing: 'invention',
          insteadTruly:
            '正史では、太史慈の求めに応じた劉備が兵三千を送り、賊は囲みを解いて散った。' +
            '管亥がどうなったかは書かれていない。',
        },
      },
    ],
    fate: { kind: 'battle', year: 193, at: 'ev_beihai', record: '北海の囲みを解かれ、以後の消息を伝えず' },
  },
];

export default officers;
