/**
 * 後期（234〜280）。ここを埋めておくと、五丈原より後の人物でも遊べる。
 * 選べる武将が「有名どころの同時代人」に偏らないようにするための層。
 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  // ------------------------------------------------ 蜀
  {
    id: 'liushan', name: '劉禅', courtesy: '公嗣', roleId: 'ruler',
    allegiance: [
      { from: 221, factionId: 'shu', rankId: 'lord' },
      { from: 263, factionId: 'wei' },
    ],
    born: 207, died: 271,
    epithet: '楽しみて蜀を思わず',
    life: [
      {
        year: 223, text: '十七にして即位し、政を諸葛亮に委ねる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '後主伝' },
      },
      {
        year: 263, text: '譙周の勧めに従い、鄧艾に降を乞う', supersedes: 'ev_shu_falls',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '後主伝',
          insteadTruly:
            '子の劉諶は降伏に反対し、昭烈廟に哭して妻子を殺し自らも死んだと正史にある。' +
            '成都はまだ落ちておらず、姜維は剣閣を保っていた。',
        },
      },
      {
        year: 265, text: '洛陽の宴で蜀の楽を奏でられ、「此間楽しく、蜀を思わず」と答える',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '漢晋春秋',
          insteadTruly:
            'この場面は陳寿の本文には無く、裴注が引く漢晋春秋に載る。' +
            '旧臣の郤正が「先人の墓は隴蜀にあり」と答えよと教え、そのとおり言ったが' +
            '司馬昭に見抜かれた、という続きまで同じ書にある。愚昧の証と読むか、' +
            '身を守るための韜晦と読むかは、昔から分かれている。',
        },
      },
    ],
    stats: { war: 30, intel: 45, lead: 40, mobility: 40, virtue: 60 },
    fate: {
      kind: 'longevity', year: 271, at: 'ev_shu_falls',
      record: '国を失い、安楽公として洛陽に没す',
      escape: [
        {
          id: 'liushan:defend',
          label: '成都を開城せず、戦う',
          hint: '姜維はまだ剣閣で持ちこたえている。降るのは、まだ早い。',
          test: (c) => !c.flags['surrendered:chengdu'],
        },
        {
          id: 'liushan:trust_jiangwei',
          label: '姜維を信じ、宦官を退ける',
          test: (c) => c.flags['dismissed:huanghao'] === true,
        },
      ],
    },
  },
  {
    id: 'jiangwei', name: '姜維', courtesy: '伯約', roleId: 'veteran_general',
    allegiance: [{ from: 227, factionId: 'wei' }, { from: 228, factionId: 'shu' }],
    born: 202, died: 264,
    epithet: '諸葛亮の志を継ぐ者',
    life: [
      {
        year: 228, text: '天水にて疑われ、行き場を失って蜀に降る',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '姜維伝',
          insteadTruly:
            '諸葛亮に策で敗って降らせたのではない。太守が姜維らを疑って城門を閉ざしたため、' +
            '帰る先を失って蜀に投じた、というのが正史の書き方。' +
            '諸葛亮は「涼州の上士なり」と喜び、二十七歳で軍を預けている。',
        },
      },
      {
        year: 240, text: '諸葛亮の遺志を継ぎ、幾度も涼州へ兵を出す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '姜維伝' },
      },
      {
        year: 263, text: '剣閣に拠って鍾会を止めるが、鄧艾が陰平の険を越えて成都に迫る', supersedes: 'ev_shu_falls',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '姜維伝' },
      },
      {
        year: 264, text: '鍾会に叛心を吹き込んで蜀の再興を図るが、露見して斬らる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '姜維伝',
          insteadTruly:
            '劉禅に密かに「願わくは陛下、しばらくの辱めを忍ばれよ」と奉ったという件は、' +
            '裴注が引く華陽国志による。本文は謀りが露見して乱兵に殺されたと書くのみ。',
        },
      },
    ],
    stats: { war: 89, intel: 90, lead: 88, mobility: 78, virtue: 76 },
    fate: {
      kind: 'battle', year: 264, at: 'ev_shu_falls',
      record: '鍾会を唆して蜀の再興を図るも、露見して斬らる',
      escape: [
        {
          id: 'jiangwei:hold_hanzhong',
          label: '漢中の防衛線を捨てない',
          hint: '外に打って出るほど、内は薄くなる。',
          test: (c) => !c.flags['abandoned:hanzhong'],
        },
        {
          id: 'jiangwei:stop_campaigns',
          label: '北伐を切り上げる',
          hint: '九度の出兵は、蜀の国力を削り切った。',
          test: (c) =>
            Object.keys(c.flags).filter((f) => f.startsWith('strain:northern')).length <= 3,
        },
      ],
    },
  },
  {
    id: 'weiyan', name: '魏延', courtesy: '文長', roleId: 'fierce_general',
    allegiance: [{ from: 209, factionId: 'liubei' }, { from: 221, factionId: 'shu' }],
    died: 234,
    epithet: '反骨の相',
    life: [
      {
        year: 219, text: '衆望を越えて漢中太守に抜擢され、「曹操が天下を挙げて来らば、大王のために拒がん」と答える',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '魏延伝',
          insteadTruly:
            '張飛が就くと誰もが思っていた任で、劉備がこれを魏延に与えた。' +
            '一軍の将としての評価は最初から高い。',
        },
      },
      {
        year: 228, text: '子午谷より精兵五千で長安を突く策を献ずるが、容れられず',
        attribution: {
          work: 'peizhu', standing: 'variant', locus: '魏略',
          insteadTruly:
            '正史本文にこの策は無く、裴注が引く魏略にのみ載る。' +
            '本文が書くのは「延、毎に亮に随いて出づるたび、輒ち兵万人を請い…亮制して許さず」まで。' +
            '有名な「子午谷の計」は、この注が伝える一案である。',
        },
      },
      {
        year: 234, text: '諸葛亮の死後、退却の順を巡って楊儀と争い、馬岱に斬らる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '魏延伝',
          insteadTruly:
            '正史は「延の意は、北に降らずして南に還るのみ。ただ儀らを除かんと欲す」と明記し、' +
            '魏に叛く気は無かったとする。頭に反骨の相があると諸葛亮が見抜き、' +
            'あらかじめ馬岱に討たせる手筈を残したという筋は、演義の作。',
        },
      },
    ],
    stats: { war: 92, intel: 68, lead: 82, mobility: 78, virtue: 40 },
    fate: {
      kind: 'execution', year: 234, by: '馬岱',
      record: '諸葛亮の死後に孤立し、斬らる',
      escape: [
        {
          id: 'weiyan:accepted_plan',
          label: '子午谷の策を用いてもらう',
          hint: '容れられていれば、彼は忠臣として死ねた。',
          test: (c) => c.flags['adopted:ziwugu'] === true,
        },
        {
          id: 'weiyan:make_allies',
          label: '楊儀と事を構えない',
          test: (c) => !c.flags['feud:yangyi'],
        },
      ],
    },
  },
  {
    id: 'masu', name: '馬謖', courtesy: '幼常', roleId: 'advisor',
    allegiance: [{ from: 209, factionId: 'liubei' }, { from: 221, factionId: 'shu' }],
    born: 190, died: 228,
    epithet: '泣いて斬らる',
    life: [
      {
        year: 225, text: '南征に際し「心を攻むるを上と為し、城を攻むるを下と為す」と説く',
        attribution: { work: 'peizhu', standing: 'record', locus: '襄陽記' },
      },
      {
        year: 228, text: '街亭にて道を捨てて山に登り、水を断たれて崩れる', supersedes: 'ev_jieting',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '王平伝',
          insteadTruly:
            '王平が幾度も諌めたが聞かなかったことも正史にある。' +
            '劉備は死の際に「馬謖は言、其の実に過ぐ。大いに用うべからず」と諸葛亮に言い残していた。',
        },
      },
      {
        year: 228, text: '軍法により斬らる。諸葛亮、これがために涙を流す',
        attribution: {
          work: 'sanguozhi', standing: 'variant', locus: '馬謖伝・諸葛亮伝',
          insteadTruly:
            '実は書きぶりが揃っていない。諸葛亮伝は「謖を戮して衆に謝す」と斬ったと書き、' +
            '馬謖伝は「謖、下獄して物故す」＝獄中で死んだと書く。' +
            '向朗伝には、馬謖が逃亡し向朗がそれを知りながら黙っていた、ともある。' +
            '陳寿自身の筆が三通りに分かれている、珍しい箇所。',
        },
      },
    ],
    stats: { war: 45, intel: 78, lead: 50, mobility: 55, virtue: 60 },
    fate: {
      kind: 'execution', year: 228, at: 'ev_jieting', by: '諸葛亮',
      record: '街亭に敗れ、軍法により斬らる',
      escape: [
        {
          id: 'masu:hold_road',
          label: '山に登らず、道を塞ぐ',
          hint: '王平はそう言った。彼の言うとおりにすればよかった。',
          test: (c) => !c.flags['camped:hilltop'],
        },
      ],
    },
  },
  {
    id: 'liufeng', name: '劉封', roleId: 'general',
    allegiance: [{ from: 200, factionId: 'liubei' }],
    died: 220,
    life: [
      {
        year: 219, text: '孟達とともに上庸を守り、関羽の救援要請に応じない', supersedes: 'ev_maicheng',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '劉封伝' },
      },
      {
        year: 220, text: '死を賜る。劉備は泣いたと伝わる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '劉封伝',
          insteadTruly:
            '諸葛亮が「剛猛にして、劉備の死後は制しがたい」と説いたので処断された、と正史にある。' +
            '養子であり、劉禅が生まれたことで立場を失っていた。',
        },
      },
    ],
    fate: {
      kind: 'execution', year: 220, by: '劉備',
      record: '関羽を救わなかった罪を問われ、死を賜る',
    },
  },
  {
    id: 'mengda', name: '孟達', courtesy: '子度', roleId: 'general',
    allegiance: [{ from: 211, factionId: 'liubei' }, { from: 220, factionId: 'wei' }],
    died: 228,
    life: [
      {
        year: 220, text: '劉封と不和になり、魏に降る',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '劉封伝' },
      },
      {
        year: 228, text: '蜀へ戻ろうと諮るが、司馬懿が八日で駆けつけて討たれる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '明帝紀',
          insteadTruly:
            '上表を待てば往復三十日はかかると踏んでいたところへ、' +
            '司馬懿は許しを待たずに兵を出し、千二百里を八日で詰めた。',
        },
      },
    ],
    fate: { kind: 'battle', year: 228, by: '司馬懿', record: '離反を見抜かれ、討たる' },
  },
  {
    id: 'wangping', name: '王平', courtesy: '子均', roleId: 'general',
    allegiance: [{ from: 219, factionId: 'liubei' }, { from: 221, factionId: 'shu' }],
    died: 248,
    life: [
      {
        year: 228, text: '街亭にて馬謖を諌めるが容れられず、千の兵で退路を支える', supersedes: 'ev_jieting',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '王平伝',
          insteadTruly:
            '崩れた軍の中で鼓を鳴らし続け、伏兵を疑った張郃が追わなかった。' +
            'この一件だけが街亭の敗戦で賞されている。字が読めず、十字ほどしか書けなかったとも正史にある。',
        },
      },
    ],
    fate: { kind: 'longevity', year: 248 },
  },

  // ------------------------------------------------ 魏・晋
  {
    id: 'simazhao', name: '司馬昭', courtesy: '子上', roleId: 'ruler',
    allegiance: [{ from: 240, factionId: 'wei', rankId: 'grand_general' }],
    born: 211, died: 265,
    epithet: '司馬昭の心、路人も知る',
    life: [
      {
        year: 260, text: '帝の曹髦が「司馬昭の心は路人も知る」と言って自ら討ちに出て、殺される',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '漢晋春秋',
          insteadTruly:
            '曹髦の言葉と、剣を取って出た顛末は裴注が引く漢晋春秋による。' +
            '本文は帝が「卒す」とだけ書く。臣下が帝を弑した記述を、陳寿は正面から書けなかった。',
        },
      },
      {
        year: 263, text: '鍾会と鄧艾を遣わして蜀を滅ぼす', supersedes: 'ev_shu_falls',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '陳留王紀' },
      },
    ],
    stats: { war: 62, intel: 90, lead: 88, mobility: 60, virtue: 30 },
    fate: { kind: 'illness', year: 265, record: '晋王のまま没し、位は子に継がる' },
  },
  {
    id: 'simayan', name: '司馬炎', courtesy: '安世', roleId: 'ruler',
    allegiance: [{ from: 255, factionId: 'wei' }, { from: 265, factionId: 'jin', rankId: 'lord' }],
    born: 236, died: 290,
    epithet: '天下を統べし者',
    life: [
      {
        year: 265, text: '魏の禅譲を受けて晋を建てる', supersedes: 'ev_jin_founded',
        attribution: { work: 'jinshu', standing: 'record' },
      },
      {
        year: 280, text: '呉を滅ぼし、八十年ぶりに天下を一つにする', supersedes: 'ev_wu_falls',
        attribution: {
          work: 'jinshu', standing: 'record',
          insteadTruly:
            'ただし統一は長く保たなかった。この十年後に八王の乱が起き、' +
            '三国より遥かに長い分裂の時代がここから始まる。',
        },
      },
    ],
    stats: { war: 60, intel: 80, lead: 85, mobility: 55, virtue: 55 },
    fate: { kind: 'longevity', year: 290, record: '三国を一つに戻し、崩ず' },
  },
  {
    id: 'dengai', name: '鄧艾', courtesy: '士載', roleId: 'veteran_general',
    allegiance: [{ from: 240, factionId: 'wei' }],
    born: 197, died: 264,
    epithet: '陰平を越えし者',
    life: [
      {
        year: 263, text: '陰平の険を七百里、道なき道を進み、毛氈に身を包んで崖を転げ下る',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '鄧艾伝',
          insteadTruly:
            '兵は崖に縄を掛けて下り、鄧艾自身は毛氈にくるまって転がり落ちたと正史にある。' +
            '守りの無い成都の背後に出たこの一手で、蜀は戦わずして降った。',
        },
      },
      {
        year: 264, text: '鍾会に謀反を讒せられ、囚われたのち殺される',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '鄧艾伝',
          insteadTruly:
            '吃音があり、自らを言うとき「艾艾」と繰り返した。' +
            '司馬昭が「艾艾とは、いったい何人の艾か」と戯れると' +
            '「鳳や鳳や、と言っても鳳は一羽です」と応じた、という話が世説新語にある。',
        },
      },
    ],
    stats: { war: 85, intel: 92, lead: 90, mobility: 82, virtue: 60 },
    fate: {
      kind: 'execution', year: 264, at: 'ev_shu_falls',
      record: '蜀を滅ぼした直後、謀反を疑われて殺さる',
      escape: [
        {
          id: 'dengai:humility',
          label: '功を誇らない',
          hint: '蜀を平らげた将が、独断で人事を行えば、都はどう思うか。',
          test: (c) => c.virtueDelta >= 15 && !c.flags['boasted:chengdu'],
        },
      ],
    },
  },
  {
    id: 'zhonghui', name: '鍾会', courtesy: '士季', roleId: 'strategist',
    allegiance: [{ from: 250, factionId: 'wei' }],
    born: 225, died: 264,
    life: [
      {
        year: 264, text: '蜀を取ったのち姜維と結んで叛くが、兵に背かれて殺される',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '鍾会伝',
          insteadTruly:
            '若い頃から才を謳われたが、司馬昭の妻はこれを見て「乱を起こす」と言い当てていた。' +
            '蜀を滅ぼした二人——鄧艾と鍾会——が、そろって蜀の地で死んでいる。',
        },
      },
    ],
    stats: { war: 60, intel: 90, lead: 80, mobility: 60, virtue: 30 },
    fate: {
      kind: 'battle', year: 264, at: 'ev_shu_falls',
      record: '姜維と結んで叛し、乱中に斬らる',
    },
  },
  {
    id: 'yanghu', name: '羊祜', courtesy: '叔子', roleId: 'strategist',
    allegiance: [{ from: 255, factionId: 'wei' }, { from: 265, factionId: 'jin' }],
    born: 221, died: 278,
    epithet: '陸抗の好敵手',
    life: [
      {
        year: 272, text: '国境で陸抗と礼を交わし、獲物も酒も分け合って境を侵さず',
        attribution: {
          work: 'jinshu', standing: 'record',
          insteadTruly:
            '呉を取るには力ではなく信を積むべきだ、という考えによる。' +
            '羊祜が没したとき、荊州の民は市を閉じて哭したと晋書にある。',
        },
      },
      {
        year: 278, text: '呉を伐つべしと説き遺して没す。その二年後、遺策どおりに呉は滅ぶ',
        attribution: { work: 'jinshu', standing: 'record' },
      },
    ],
    stats: { war: 65, intel: 90, lead: 88, mobility: 58, virtue: 90 },
    fate: { kind: 'illness', year: 278, record: '呉の平定を見ずして没す' },
  },
  {
    id: 'caorui', name: '曹叡', courtesy: '元仲', roleId: 'ruler',
    allegiance: [{ from: 226, factionId: 'wei', rankId: 'lord' }],
    born: 204, died: 239,
    life: [
      {
        year: 231, text: '諸葛亮の北伐に対し、司馬懿に守りを命じて動かさず',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '明帝紀',
          insteadTruly:
            '曹叡の代に蜀も呉も攻め切れなかったのは、この守勢が徹底していたため。' +
            '陳寿は「沈毅にして断あり」と評しつつ、晩年の造営の贅を咎めている。',
        },
      },
    ],
    stats: { war: 55, intel: 82, lead: 80, mobility: 50, virtue: 45 },
    fate: { kind: 'illness', year: 239, record: '三十六にして崩じ、司馬氏に道を開く' },
  },
];

export default officers;
