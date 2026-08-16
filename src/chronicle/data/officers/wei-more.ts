/** 魏の面々。多くは能力値を書かず、役柄からの自動生成に任せている。 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  {
    id: 'zhangliao', name: '張遼', courtesy: '文遠', roleId: 'veteran_general',
    // 逍遥津。八百の兵を選んで十万の陣を突き崩した（三国志）
    aptitude: { cavalry: 1 },
    allegiance: [
      { from: 189, factionId: 'dongzhuo' },
      { from: 192, factionId: 'lvbu' },
      { from: 199, factionId: 'caocao' },
      { from: 220, factionId: 'wei' },
    ],
    born: 169, died: 222,
    epithet: '遼来来',
    life: [
      {
        year: 215, text: '合肥にて八百の兵で十万を破り、孫権の本陣に迫る', supersedes: 'ev_hefei',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '張遼伝',
          insteadTruly:
            '夜明けに自ら先頭を切り、名乗って敵陣を割った。' +
            '囲まれた味方を見て引き返し、また救い出したことまで正史にある。' +
            '呉では子どもが泣き止まぬとき「遼来遼来」と言えば黙った、と伝わるほど恐れられた。',
        },
      },
      {
        year: 222, text: '病のまま出陣し、呉軍を破って間もなく没す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '張遼伝' },
      },
    ],
    stats: { war: 92, intel: 78, lead: 93, mobility: 80, virtue: 76 },
    fate: { kind: 'illness', year: 222, record: '病を押して出陣し、まもなく没す' },
  },
  {
    id: 'xuhuang', name: '徐晃', courtesy: '公明', roleId: 'veteran_general',
    allegiance: [{ from: 196, factionId: 'caocao' }, { from: 220, factionId: 'wei' }],
    died: 227,
    life: [
      {
        year: 219, text: '樊城の囲みを解き、関羽の陣を破る', supersedes: 'ev_fancheng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '徐晃伝',
          insteadTruly:
            '曹操は「敵の囲みを突き破ってこれほど勝った例を聞かぬ。将軍の功は孫武・穰苴に勝る」と讃え、' +
            '軍規の正しさを見て「周亜夫の風あり」と評した。',
        },
      },
    ],
    stats: { war: 90, intel: 72, lead: 86, mobility: 68, virtue: 74 },
    fate: { kind: 'illness', year: 227 },
  },
  {
    id: 'yujin', name: '于禁', courtesy: '文則', roleId: 'general',
    allegiance: [{ from: 192, factionId: 'caocao' }, { from: 220, factionId: 'wei' }],
    died: 221,
    life: [
      {
        year: 219, text: '樊城にて水に沈められ、龐徳と違って降る', supersedes: 'ev_fancheng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '于禁伝',
          insteadTruly:
            '三十年仕えた古参で、曹操は「乱に臨みて節を全うするは、于禁に及ばずと思っていた」と嘆じた。' +
            '呉から返されたのち、曹丕は関羽に降る場面を描いた壁画をわざと見せ、于禁は恥じて病み、まもなく没した。',
        },
      },
    ],
    stats: { war: 78, intel: 68, lead: 85, mobility: 60, virtue: 50 },
    fate: {
      kind: 'illness', year: 221,
      record: '樊城に降ったことを恥じ、憤死す',
    },
  },
  {
    id: 'zhanghe', name: '張郃', courtesy: '儁乂', roleId: 'veteran_general',
    allegiance: [
      { from: 190, factionId: 'yuanshao' },
      { from: 200, factionId: 'caocao' },
      { from: 220, factionId: 'wei' },
    ],
    died: 231,
    life: [
      {
        year: 231, text: '退く蜀軍を追って木門道に入り、伏兵の矢に当たって没す', supersedes: 'ev_mumendao',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '張郃伝',
          insteadTruly:
            '裴注が引く魏略は、張郃が追撃に反対したのを司馬懿が強いた、と書く。' +
            '本文にその含みは無い。演義は諸葛亮の計として描く。',
        },
      },
    ],
    stats: { war: 89, intel: 76, lead: 88, mobility: 75, virtue: 62 },
    fate: { kind: 'battle', year: 231, at: 'ev_mumendao', record: '木門道にて伏兵の矢に当たる' },
  },
  {
    id: 'xiahouyuan', name: '夏侯淵', courtesy: '妙才', roleId: 'fierce_general',
    // 「三日に五百里、六日に千里」。速さで鳴らした（三国志）
    aptitude: { cavalry: 1 },
    allegiance: [{ from: 189, factionId: 'caocao' }],
    died: 219,
    epithet: '三日に五百里',
    life: [
      {
        year: 219, text: '定軍山にて、自ら鹿角の修復に出たところを黄忠に討たれる', supersedes: 'ev_dingjunshan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '夏侯淵伝',
          insteadTruly:
            '曹操は以前から「将たる者は臆病であるべき時もある。勇のみを恃むな」と戒めていた。' +
            '陳寿も「淵は勇にして謀に乏し」と評しており、その通りの死に方をした。',
        },
      },
    ],
    stats: { war: 91, intel: 52, lead: 82, mobility: 92, virtue: 60 },
    fate: { kind: 'battle', year: 219, at: 'ev_dingjunshan', by: '黄忠' },
  },
  {
    id: 'caoren', name: '曹仁', courtesy: '子孝', roleId: 'veteran_general',
    // 樊城に籠もり、水の中で降らなかった。守る戦の人（三国志）
    aptitude: { infantry: 1, cavalry: -1 },
    allegiance: [{ from: 189, factionId: 'caocao' }, { from: 220, factionId: 'wei' }],
    died: 223,
    life: [
      {
        year: 219, text: '樊城を水に囲まれながら守り抜き、関羽の北進を止める', supersedes: 'ev_fancheng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '曹仁伝',
          insteadTruly:
            '城は数板を残して水に沈み、兵は数千しかなかったが、白馬を沈めて死守を誓った。' +
            '演義では敗将として扱われがちだが、関羽の勢いを止めたのはこの籠城である。',
        },
      },
    ],
    stats: { war: 86, intel: 68, lead: 90, mobility: 62, virtue: 68 },
    fate: { kind: 'illness', year: 223 },
  },
  {
    id: 'dianwei', name: '典韋', roleId: 'fierce_general',
    allegiance: [{ from: 194, factionId: 'caocao' }],
    died: 197,
    epithet: '古の悪来',
    life: [
      {
        year: 197, text: '宛にて張繡の夜襲を受け、門を塞いで曹操を逃がし、討たれる', supersedes: 'ev_wancheng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '典韋伝',
          insteadTruly:
            '双戟が盗まれていたので長矛で戦い、十余人を突き殺し、' +
            '死してのち誰も前に進めなかったと正史にある。' +
            '曹操はこの戦で長男の曹昂と甥の曹安民も失ったが、後に泣いたのは典韋であったという。',
        },
      },
    ],
    stats: { war: 95, intel: 25, lead: 60, mobility: 70, virtue: 70 },
    fate: {
      kind: 'battle', year: 197, at: 'ev_wancheng', by: '張繡',
      record: '主を逃がすため門を守り、力尽きて立ったまま死す',
    },
  },
  {
    id: 'xunyu', name: '荀彧', courtesy: '文若', roleId: 'strategist',
    allegiance: [{ from: 191, factionId: 'caocao' }],
    born: 163, died: 212,
    epithet: '王佐の才',
    life: [
      {
        year: 196, text: '献帝を許に迎えることを勧める', supersedes: 'ev_yingemperor',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '荀彧伝' },
      },
      {
        year: 212, text: '曹操が魏公となることに反対し、その年のうちに没す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '荀彧伝',
          insteadTruly:
            '本伝は「憂を以て薨ず」と書くのみ。空の器を送られて自ら死んだという話は' +
            '裴注が引く魏氏春秋による。漢の臣として曹操を助けた者が、' +
            '漢が終わる段になって最も強く抗った、という筋はどちらの書でも変わらない。',
        },
      },
    ],
    stats: { war: 25, intel: 96, lead: 78, mobility: 45, virtue: 88 },
    fate: {
      kind: 'illness', year: 212,
      record: '魏公就任に反対し、憂憤のうちに没す',
    },
  },
  {
    id: 'jiaxu', name: '賈詡', courtesy: '文和', roleId: 'advisor',
    life: [
      {
        year: 192, text: '散り散りになろうとした董卓の残党を止め、長安を襲わせる', supersedes: 'ev_lijue',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '賈詡伝',
          insteadTruly:
            'この一言が長安を陥とし、王允を殺し、献帝を流浪させた。' +
            '賈詡自身は身を守るための策と言ったが、後世これを最も咎められている。',
        },
      },
      {
        year: 211, text: '潼関にて離間の計を献じ、馬超と韓遂を裂く', supersedes: 'ev_tongguan',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '賈詡伝' },
      },
      {
        year: 217, text: '後継ぎを問われ、袁紹と劉表の末路を思い出させるだけで答える',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '賈詡伝',
          insteadTruly:
            '曹操が「何を考えている」と問うと「袁本初と劉景升の父子を思っておりました」と答えた。' +
            '曹操は笑い、長子の曹丕を立てた。晩年は門を閉ざし、子の縁組も高位の家とは結ばなかった。',
        },
      },
    ],
    allegiance: [
      { from: 189, factionId: 'dongzhuo' },
      { from: 197, factionId: 'caocao' },
      { from: 220, factionId: 'wei' },
    ],
    born: 147, died: 223,
    epithet: '毒士',
    stats: { war: 30, intel: 95, lead: 65, mobility: 50, virtue: 35 },
    fate: { kind: 'longevity', year: 223, record: '身を慎み、七十七まで生きる' },
  },
  {
    id: 'yanliang', name: '顔良', roleId: 'fierce_general',
    allegiance: 'yuanshao', died: 200,
    life: [
      {
        year: 200, text: '白馬にて、万軍の中を駆けた関羽に刺し殺される', supersedes: 'ev_baima',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '関羽伝',
          insteadTruly:
            '「羽、良の麾蓋を望見し、馬を策ちて良を万衆の中に刺す」——正史に明記された数少ない討ち取りの場面。' +
            '沮授が袁紹に「顔良は性が偏狭だ。独りで任せてはならぬ」と諌めていたことも記録にある。',
        },
      },
    ],
    fate: { kind: 'battle', year: 200, at: 'ev_baima', by: '関羽' },
  },
  {
    id: 'wenchou', name: '文醜', roleId: 'fierce_general',
    allegiance: 'yuanshao', died: 200,
    life: [
      {
        year: 200, text: '延津にて、輜重に群がる兵を追ううちに討たれる', supersedes: 'ev_yanjin',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '武帝紀',
          insteadTruly:
            '正史は乱戦のうちに討たれたと書くだけで、誰が斬ったとも書かない。' +
            '関羽が斬ったとするのは演義。顔良と対にして「関羽の武」を立てるための配置である。',
        },
      },
    ],
    fate: { kind: 'battle', year: 200, at: 'ev_yanjin', by: '関羽' },
  },
  {
    id: 'tianfeng', name: '田豊', courtesy: '元皓', roleId: 'advisor',
    allegiance: 'yuanshao', died: 200,
    life: [
      {
        year: 200, text: '持久を説いて容れられず獄に下され、袁紹が敗れて帰るとかえって殺される',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '袁紹伝',
          insteadTruly:
            '獄中の田豊は「勝てば私は助かるが、負ければ私は死ぬ」と言い当てていた、と裴注にある。' +
            '袁紹は敗れて「田豊に笑われる」と言い、これを殺した。',
        },
      },
    ],
    stats: { war: 25, intel: 92, lead: 60, mobility: 40, virtue: 70 },
    fate: {
      kind: 'execution', year: 200, by: '袁紹',
      record: '諫言を容れられず、獄中にて死を賜る',
    },
  },
  {
    id: 'caopi', name: '曹丕', courtesy: '子桓', roleId: 'ruler',
    allegiance: [{ from: 200, factionId: 'caocao' }, { from: 220, factionId: 'wei' }],
    born: 187, died: 226,
    life: [
      {
        year: 220, text: '献帝の禅譲を受けて帝位に即く', supersedes: 'ev_han_ends',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '文帝紀' },
      },
      {
        year: 220, text: '弟の曹植に七歩あゆむ間に詩を作れと命じる',
        attribution: {
          work: 'folk', standing: 'invention',
          insteadTruly:
            '七歩の詩は正史に無く、南朝の逸話集『世説新語』に出る。演義はこれを採った。' +
            '兄弟が険悪であったこと自体は正史にあるが、この場面は後世の作である。',
        },
      },
    ],
    stats: { war: 66, intel: 82, lead: 78, mobility: 60, virtue: 45 },
    fate: { kind: 'illness', year: 226, record: '四十にして崩ず' },
  },
  {
    id: 'zhangxiu', name: '張繡', roleId: 'general',
    allegiance: [{ from: 196, factionId: 'ronin' }, { from: 199, factionId: 'caocao' }],
    died: 207,
    life: [
      {
        year: 197, text: '一度降ってから叛き、宛に曹操を襲う', supersedes: 'ev_wancheng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '張繡伝',
          insteadTruly:
            '曹操が張繡の叔父の未亡人を召したことが叛いた理由として挙がる。' +
            'この夜襲で曹操は長男の曹昂・甥の曹安民・典韋を一度に失っている。',
        },
      },
      {
        year: 200, text: '賈詡の勧めで再び曹操に降り、迎え入れられる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '賈詡伝',
          insteadTruly:
            '子を殺された相手を、曹操は咎めずに厚く遇した。' +
            '官渡を前に一人でも味方が要る、という計算による。',
        },
      },
    ],
    fate: { kind: 'illness', year: 207 },
  },
];

export default officers;
