/** 魏・呉・群雄。中くらいの密度（能力値は書くが、固有の回避条件までは書かない）。 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  // ------------------------------------------------ 魏
  {
    id: 'caocao', name: '曹操', courtesy: '孟徳', roleId: 'ruler',
    allegiance: [
      { from: 184, factionId: 'han' },
      { from: 189, factionId: 'caocao', rankId: 'general' },
    ],
    born: 155, died: 220,
    epithet: '治世の能臣、乱世の姦雄',
    life: [
      {
        year: 189, text: '董卓の招きを断って洛陽を脱し、郷里で兵を挙げる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '武帝紀',
          insteadTruly:
            '呂伯奢の一家を殺した件は本文に無く、裴注が三通りの異説を引く。' +
            '魏書は「先に襲われたので応戦した」とし、世語は「疑心から殺した」とし、' +
            '孫盛の雑記だけが「寧ろ我人に負くとも、人をして我に負かしむること勿かれ」の言葉を載せる。' +
            'いま知られている台詞は、三つのうち最も曹操に厳しい一本を演義が採ったもの。',
        },
      },
      {
        year: 196, text: '献帝を許に迎え、屯田を布いて兵糧を蓄える', supersedes: 'ev_yingemperor',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '武帝紀' },
      },
      {
        year: 200, text: '烏巣を焼いて袁紹の兵糧を絶ち、十倍の敵を破る', supersedes: 'ev_guandu',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '武帝紀' },
      },
      {
        year: 208, text: '赤壁に敗れ、船を焼かれて北へ退く', supersedes: 'ev_chibi',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '武帝紀',
          insteadTruly:
            '武帝紀は「公、赤壁に至り、劉備と戦うも利あらず。時に疫疾大いに興り、' +
            '吏士多く死す。乃ち軍を引きて還る」と書き、火計にも周瑜にも触れない。' +
            '負けを軽く書くのは陳寿が魏を正統とするため。呉側の記録では周瑜の火計が主となる。',
        },
      },
      {
        year: 219, text: '関羽の勢いに都を移そうとするが、司馬懿らに止められる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '武帝紀' },
      },
      {
        year: 220, text: '洛陽にて没す。享年六十六。位は魏王のまま、帝を称さず',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '武帝紀',
          insteadTruly:
            '生涯を通じて漢の臣という形を崩さなかった。帝位に即いたのは死後、子の曹丕である。' +
            '演義が描く簒奪者の像とは、ここが最も食い違う。',
        },
      },
    ],
    stats: { war: 72, intel: 91, lead: 96, mobility: 80, virtue: 60 },
    fate: { kind: 'illness', year: 220, record: '洛陽にて薨ず。天下は三分のまま' },
  },
  {
    id: 'simayi', name: '司馬懿', courtesy: '仲達', roleId: 'strategist',
    allegiance: [
      { from: 208, factionId: 'caocao' },
      { from: 220, factionId: 'wei' },
    ],
    born: 179, died: 251,
    epithet: '狼顧の相',
    life: [
      {
        year: 208, text: '曹操に召されるが、風痺と称して七年のあいだ仕官を渋る',
        attribution: {
          work: 'jinshu', standing: 'record', locus: '宣帝紀',
          insteadTruly:
            '三国志には司馬懿の独立した伝が無い。魏を簒った家の祖なので、陳寿は書けなかった。' +
            '前半生の記述はもっぱら晋書に拠るが、それは晋が自らの祖を書いたものであり、' +
            '四百年後の編纂でもある。首だけを後ろに回す「狼顧の相」も、晋書の載せる話。',
        },
      },
      {
        year: 228, text: '孟達の離反を察し、上表を待たず八日で上庸に至って討つ',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '明帝紀' },
      },
      {
        year: 234, text: '五丈原に諸葛亮と対峙し、ひたすら守って戦わず',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '明帝紀',
          insteadTruly:
            '諸葛亮が女物の衣を送って挑発し、司馬懿が受け流したという話は' +
            '裴注が引く魏氏春秋による。本文は守って出なかったことだけを書く。',
        },
      },
      {
        year: 249, text: '高平陵の変。曹爽から兵権を奪い、魏の実権を握る', supersedes: 'ev_gaopingling',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '曹爽伝' },
      },
    ],
    stats: { war: 63, intel: 98, lead: 94, mobility: 70, virtue: 42 },
    fate: { kind: 'longevity', year: 251, record: '天寿を全うし、子孫が天下を継ぐ' },
  },
  {
    id: 'xiahoudun', name: '夏侯惇', courtesy: '元譲', roleId: 'veteran_general',
    allegiance: [{ from: 189, factionId: 'caocao' }],
    born: 157, died: 220,
    epithet: '盲夏侯',
    life: [
      {
        year: 198, text: '流矢に左目を射抜かれる',
        attribution: {
          work: 'peizhu', standing: 'variant', locus: '魏略',
          insteadTruly:
            '目を失ったことは本伝にあるが、抜いた矢に付いた眼球を' +
            '「父母の精なり」と言って飲み込んだという件は、裴注が引く魏略にのみ載る。',
        },
      },
      {
        year: 220, text: '曹丕の即位から数月で没す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '夏侯惇伝' },
      },
    ],
    stats: { war: 90, intel: 60, lead: 85, mobility: 78, virtue: 70 },
    fate: { kind: 'longevity', year: 220 },
  },
  {
    id: 'xuchu', name: '許褚', courtesy: '仲康', roleId: 'fierce_general',
    allegiance: [{ from: 197, factionId: 'caocao' }],
    died: 230,
    epithet: '虎痴',
    life: [
      {
        year: 197, text: '宛にて曹操を守り、包囲を破って逃がす',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '許褚伝' },
      },
      {
        year: 211, text: '潼関にて曹操を舟に担ぎ入れ、鞍を盾にして矢を防ぐ',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '許褚伝',
          insteadTruly:
            '馬超と裸で組み討ちしたという場面は演義の作。' +
            '正史にあるのは、馬超が会見の席で許褚の目を見て手を出せなかった、という一件のほう。',
        },
      },
    ],
    stats: { war: 96, intel: 30, lead: 70, mobility: 65, virtue: 55 },
    fate: { kind: 'longevity', year: 230 },
  },
  {
    id: 'guojia', name: '郭嘉', courtesy: '奉孝', roleId: 'advisor',
    allegiance: [{ from: 196, factionId: 'caocao' }],
    born: 170, died: 207,
    life: [
      {
        year: 200, text: '孫策が北へ向かおうとしたとき、「必ず匹夫の手に死なん」と言い当てる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '郭嘉伝',
          insteadTruly:
            '正史にある言葉だが、陳寿は「策の死は果たして嘉の言の如し」と結ぶ。' +
            '予言が当たったという書き方そのものが、後から整えられた可能性を含む。',
        },
      },
      {
        year: 207, text: '烏丸征伐の途上に病を得て没す。三十八',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '郭嘉伝',
          insteadTruly:
            '赤壁の敗戦のあと曹操が「郭奉孝あらば、孤をしてこの如くならしめず」と嘆いたのも正史。' +
            'ただし十勝十敗の論は裴注が引く傅子によるもので、本文には無い。',
        },
      },
    ],
    stats: { war: 20, intel: 97, lead: 55, mobility: 45, virtue: 50 },
    fate: { kind: 'illness', year: 207, record: '烏丸征伐の途上、三十八にして没す' },
  },
  {
    id: 'pangde', name: '龐徳', courtesy: '令明', roleId: 'fierce_general',
    // 涼州の出。馬に乗って関羽の額を射た（三国志）
    aptitude: { cavalry: 1 },
    allegiance: [
      { from: 200, factionId: 'matengs' },
      { from: 215, factionId: 'caocao' },
    ],
    died: 219,
    epithet: '棺を負いて出陣す',
    life: [
      {
        year: 219, text: '棺を担いで樊城に出陣し、水に沈められて捕らわれ、降を拒んで斬らる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '龐徳伝',
          insteadTruly:
            '兄が蜀に仕えていたため疑われ、それを晴らすために棺を用意したことまで正史にある。' +
            '同じ戦で降った于禁と対にして書かれており、陳寿の筆はここで最も分かりやすく人を裁いている。',
        },
      },
    ],
    stats: { war: 92, intel: 55, lead: 78, mobility: 72, virtue: 72 },
    fate: { kind: 'execution', year: 219, at: 'ev_fancheng', by: '関羽', record: '降らず、斬らる' },
  },

  // ------------------------------------------------ 呉
  {
    id: 'sunjian', name: '孫堅', courtesy: '文台', roleId: 'warlord',
    allegiance: [{ from: 184, factionId: 'sunjian' }],
    born: 155, died: 191,
    epithet: '江東の虎',
    life: [
      {
        year: 190, text: '董卓軍を破って洛陽に入り、焼け跡を清めて宗廟を祭る',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '孫堅伝',
          insteadTruly:
            '連合軍の中で董卓の軍を実際に破ったのは孫堅ひとり。華雄を斬ったのもこの軍である。' +
            '演義がこれを関羽の功に移し替えたため、孫堅の働きは物語からほとんど消えた。',
        },
      },
      {
        year: 191, text: '劉表を攻め、黄祖の兵に射られて没す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '孫堅伝',
          insteadTruly:
            '洛陽で伝国の玉璽を拾ったという話は、裴注が引く呉書と山陽公載記にある。' +
            '裴松之はこれを疑わしいとしており、本文には載らない。',
        },
      },
    ],
    stats: { war: 91, intel: 68, lead: 87, mobility: 85, virtue: 72 },
    fate: { kind: 'battle', year: 191, at: 'ev_xiangyang', by: '黄祖' },
  },
  {
    id: 'sunce', name: '孫策', courtesy: '伯符', roleId: 'warlord',
    allegiance: [
      { from: 191, factionId: 'yuanshu' },
      { from: 194, factionId: 'sunce' },
    ],
    born: 175, died: 200,
    epithet: '小覇王',
    life: [
      {
        year: 195, text: '袁術のもとを離れ、千余の兵で江東を渡り、数年で六郡を平らげる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '孫策伝' },
      },
      {
        year: 200, text: '単騎で狩りに出たところを許貢の食客に襲われ、その傷がもとで没す。二十六',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '孫策伝',
          insteadTruly:
            '于吉という道士を斬った祟りで死んだという筋は、裴注が引く江表伝に載り、演義がこれを採る。' +
            '本伝が書くのは刺客の矢傷のみ。弟の孫権に「江東を挙げて敵と争うは、卿は我に如かず。' +
            '賢を挙げ能を任じて江東を保つは、我は卿に如かず」と遺した言葉も正史にある。',
        },
      },
    ],
    stats: { war: 92, intel: 68, lead: 86, mobility: 88, virtue: 78 },
    fate: {
      kind: 'assassination', year: 200, by: '許貢の食客',
      record: '狩りの最中、矢傷より没す。二十六',
    },
  },
  {
    id: 'zhouyu', name: '周瑜', courtesy: '公瑾', roleId: 'strategist',
    allegiance: [{ from: 195, factionId: 'sunce' }, { from: 200, factionId: 'wu' }],
    born: 175, died: 210,
    epithet: '美周郎',
    life: [
      {
        year: 208, text: '衆議の降伏論を退けて主戦を説き、赤壁に曹操の船団を焼く', supersedes: 'ev_chibi',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '周瑜伝',
          insteadTruly:
            '赤壁の采配は終始周瑜のもの。諸葛亮の東南の風も、草船借箭も、' +
            '周瑜が諸葛亮の才を妬んで殺そうとした筋も、すべて演義の作である。',
        },
      },
      {
        year: 210, text: '巴丘にて病没す。三十六',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '周瑜伝',
          insteadTruly:
            '「既に瑜を生みて、何ぞ亮を生ずる」という嘆きは演義の創作。' +
            '正史の周瑜は「性度恢廓」——度量が広く人に慕われた人物として書かれ、' +
            '程普が「公瑾と交わるは、醇酒を飲むが如し」と評した言葉が残る。',
        },
      },
    ],
    stats: { war: 71, intel: 96, lead: 93, mobility: 74, virtue: 75 },
    fate: { kind: 'illness', year: 210, record: '巴丘にて病没す。三十六' },
  },
  {
    id: 'lvmeng', name: '呂蒙', courtesy: '子明', roleId: 'general',
    allegiance: [
      { from: 198, factionId: 'sunce' },
      { from: 200, factionId: 'wu' },
    ],
    born: 178, died: 220,
    epithet: '呉下の阿蒙にあらず',
    life: [
      {
        year: 200, text: '孫権に学問を勧められ、書を読み始める',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '江表伝',
          insteadTruly:
            '魯粛が「もはや呉下の阿蒙にあらず」と驚き、呂蒙が「士別れて三日、' +
            '即ち更に刮目して相待すべし」と応じた一節は、裴注が引く江表伝による。本文には無い。',
        },
      },
      {
        year: 219, text: '病と偽って警戒を解かせ、兵を商人に扮させて荊州を奪う', supersedes: 'ev_maicheng',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '呂蒙伝' },
      },
      {
        year: 220, text: '荊州を得た直後に病没す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂蒙伝',
          insteadTruly:
            '関羽の霊に取り憑かれて死んだという場面は演義の作。' +
            '正史は以前からの病が重くなったと書き、孫権が壁に穴を開けて容態を覗いたとまで記す。',
        },
      },
    ],
    stats: { war: 78, intel: 88, lead: 88, mobility: 70, virtue: 58 },
    fate: { kind: 'illness', year: 220, record: '荊州を得た直後に没す' },
  },

  // ------------------------------------------------ 群雄
  {
    id: 'lvbu', name: '呂布', courtesy: '奉先', roleId: 'fierce_general',
    // 「弓馬に便し、膂力人に過ぐ」——正史がそう書き残した数少ない一人（三国志）
    aptitude: { cavalry: 2, archer: 1 },
    allegiance: [
      { from: 189, factionId: 'dongzhuo' },
      { from: 192, factionId: 'lvbu', rankId: 'general' },
    ],
    born: 161, died: 199,
    epithet: '人中に呂布あり、馬中に赤兎あり',
    life: [
      {
        year: 189, text: '義父の丁原を斬って董卓に降る', supersedes: 'ev_dingyuan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂布伝',
          insteadTruly:
            '丁原を殺して董卓に付いたことは正史にある。ただし赤兎馬と引き換えだったという筋は演義の作。' +
            '呂布が赤兎という名馬に乗っていたことは正史にあるが、貰った経緯は書かれていない。',
        },
      },
      {
        year: 192, text: '王允と謀って董卓を刺す', supersedes: 'ev_diaochan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂布伝',
          insteadTruly:
            '正史が書くのは、董卓の侍婢と通じて露見を恐れていたところへ、' +
            '王允が説いた、という筋。その侍婢に名は無く、貂蝉という女も連環の計も演義の作。',
        },
      },
      {
        year: 199, text: '下邳に囲まれ、部下に縛られて曹操の前に引き出される', supersedes: 'ev_baimenlou',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂布伝',
          insteadTruly:
            '「明公は布の丁建陽および董太師に事えしを見ずや」と劉備が言い、' +
            'それで曹操が殺す気を固めたことまで正史にある。' +
            '陳寿の評は「布は虓虎の勇ありて、英奇の略無し」——強いが謀が無い、と手厳しい。',
        },
      },
    ],
    stats: { war: 100, intel: 26, lead: 84, mobility: 90, virtue: 12 },
    fate: {
      kind: 'execution',
      year: 199,
      at: 'ev_baimenlou',
      by: '曹操',
      record: '白門楼にて縊り殺さる',
      escape: [
        {
          id: 'lvbu:trust_chengong',
          label: '陳宮の献策を容れる',
          hint: '一度でも軍師の言を聞いていれば、下邳は落ちなかった。',
          test: (c) => c.flags['heeded:chengong'] === true,
        },
        {
          id: 'lvbu:no_betrayal',
          label: '主を二度殺さない',
          hint: '丁原を殺し、董卓を殺した男を、誰が信じる。',
          test: (c) => !c.flags['betrayed:dingyuan'] || !c.flags['betrayed:dongzhuo'],
        },
        {
          id: 'lvbu:earn_virtue',
          label: '徳を四十まで高める',
          hint: '呂布の徳は十二。人として何かを得ねば、誰も庇わない。',
          test: (c) => c.virtueDelta >= 28,
        },
      ],
    },
  },
  {
    id: 'dongzhuo', name: '董卓', courtesy: '仲穎', roleId: 'warlord',
    allegiance: [{ from: 184, factionId: 'han' }, { from: 189, factionId: 'dongzhuo' }],
    born: 139, died: 192,
    life: [
      {
        year: 189, text: '洛陽に入り、少帝を廃して陳留王を立てる', supersedes: 'ev_feidi',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '董卓伝' },
      },
      {
        year: 190, text: '洛陽を焼き、百万の民を長安へ追い立てる', supersedes: 'ev_luoyang_fire',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '宮室・宗廟・官府・民家をことごとく焼き、二百里に人の姿が絶えたと後漢書にある。' +
            '歴代の陵墓を暴いて宝を取ったことも書かれている。' +
            '暴君として描かれる董卓像は、演義の誇張ではなく記録そのものに近い。',
        },
      },
      {
        year: 192, text: '呂布に刺し殺される。臍に灯心を立てられ、数日燃え続けたという',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '肥えていたので脂が燃えた、と後漢書は書く。' +
            '長安の民が集まって喜んだことも記録にある。',
        },
      },
    ],
    stats: { war: 82, intel: 55, lead: 78, mobility: 50, virtue: 5 },
    fate: { kind: 'assassination', year: 192, by: '呂布', record: '義子の戟に貫かる' },
  },
  {
    id: 'chengong', name: '陳宮', courtesy: '公台', roleId: 'advisor',
    allegiance: [{ from: 192, factionId: 'caocao' }, { from: 194, factionId: 'lvbu' }],
    died: 199,
    life: [
      {
        year: 194, text: '兗州を挙げて叛き、呂布を迎え入れる', supersedes: 'ev_yanzhou',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂布伝',
          insteadTruly:
            '曹操が兗州の名士を殺したことに背いた、というのが叛いた理由として挙がる。' +
            '曹操を捕らえておきながら「乱世の姦雄」と見て逃がした、という出会いの場面は演義の作で、' +
            '正史の陳宮は最初から曹操の配下だった。',
        },
      },
      {
        year: 199, text: '下邳に降を拒み、「請う、就刑せん」と言って歩み出る', supersedes: 'ev_baimenlou',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '典略',
          insteadTruly:
            '曹操が老母と娘を案じると「孝を以て天下を治める者は人の親を害せず」と答えた、' +
            'という応酬は裴注が引く典略による。曹操は涙を流して見送り、' +
            'その家族を手厚く養ったとも同じ書にある。',
        },
      },
    ],
    stats: { war: 35, intel: 88, lead: 70, mobility: 50, virtue: 68 },
    fate: {
      kind: 'execution', year: 199, at: 'ev_baimenlou', by: '曹操',
      record: '降を拒み、自ら刑に就く',
    },
  },
  {
    id: 'yuanshao', name: '袁紹', courtesy: '本初', roleId: 'warlord',
    allegiance: [{ from: 184, factionId: 'han' }, { from: 190, factionId: 'yuanshao' }],
    born: 154, died: 202,
    epithet: '四世三公',
    life: [
      {
        year: 189, text: '宮中に入って宦官二千余人を誅す', supersedes: 'ev_shichangshi',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '袁紹伝' },
      },
      {
        year: 190, text: '諸侯に推されて反董卓連合の盟主となる', supersedes: 'ev_coalition',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '袁紹伝',
          insteadTruly:
            '「十八路の諸侯」という数え方は演義のもので、正史に挙がる名はもっと少ない。' +
            'また連合はほとんど動かず、董卓と実際に戦ったのは孫堅と曹操だけであった。',
        },
      },
      {
        year: 200, text: '官渡に大軍を擁しながら敗れる', supersedes: 'ev_guandu',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '袁紹伝',
          insteadTruly:
            '田豊の諫言を容れず獄に下し、敗れて帰ってからこれを殺したことも正史にある。' +
            '陳寿は「外は寛雅にして雅量あるも、内は忌み克つ」と評した。',
        },
      },
    ],
    stats: { war: 68, intel: 65, lead: 82, mobility: 60, virtue: 66 },
    fate: { kind: 'illness', year: 202, record: '官渡に敗れ、血を吐いて没す' },
  },
  {
    id: 'diaochan', name: '貂蝉', roleId: 'wanderer',
    allegiance: [{ from: 189, factionId: 'han' }],
    died: 199,
    epithet: '傾国',
    stats: { war: 28, intel: 85, lead: 35, mobility: 78, virtue: 65 },
    fictional: true,
    attribution: {
      work: 'yanyi',
      standing: 'invention',
      insteadTruly:
        '正史にこの名の女はいない。呂布伝に「布は卓の侍婢と私通し、事の発覚を恐れて心中安からず」とあるのみで、' +
        'その侍婢の名も素性も伝わらない。貂蝉という名と、王允の養女という素性と、' +
        '連環の計の筋書きは、元代の雑劇から演義にかけて形づくられたもの。',
    },
    life: [
      {
        year: 192, text: '王允の計に応じ、董卓と呂布のあいだに立つ',
        attribution: { work: 'yanyi', standing: 'invention' },
      },
      {
        year: 192, text: '鳳儀亭にて呂布と会い、董卓に見咎められる',
        attribution: { work: 'yanyi', standing: 'invention' },
      },
    ],
    fate: { kind: 'longevity', year: 199, record: '以後の消息、詳らかならず' },
  },
];

export default officers;
