/**
 * 劉備軍〜蜀漢。ここは「列伝級」の書き方の見本で、
 * 固有の回避条件と史書の一文まで持たせている。
 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  {
    id: 'liubei', name: '劉備', courtesy: '玄徳', roleId: 'ruler',
    allegiance: [
      { from: 184, factionId: 'liubei', rankId: 'commoner' },
      { from: 221, factionId: 'shu', rankId: 'lord' },
    ],
    born: 161, died: 223,
    epithet: '仁を以て人を集めし者',
    stats: { war: 73, intel: 74, lead: 77, mobility: 72, virtue: 100 },
    life: [
      {
        year: 184, text: '涿郡に義兵を集め、黄巾討伐に加わる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '先主伝',
          insteadTruly:
            '若い頃は学問を好まず、犬馬と音楽と美服を好んだと書かれている。' +
            '筵を織り履を売って暮らしを立てたのも正史の記述。',
        },
      },
      {
        year: 194, text: '陶謙の遺言により徐州を領す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '先主伝' },
      },
      {
        year: 199, text: '曹操に「今、天下の英雄は君と操のみ」と言われ、箸を取り落とす',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '先主伝',
          insteadTruly:
            '箸を落としたことまでが正史。折しも雷が鳴ったので取り繕ったという件は演義の脚色で、' +
            '正史はただ「先主、方に食し、匙箸を失す」と書く。',
        },
      },
      {
        year: 207, text: '三たび隆中の草廬を訪ね、諸葛亮を得る', supersedes: 'ev_sangu',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '出師表',
          insteadTruly:
            '諸葛亮自身が出師表に「三たび臣を草廬の中に顧みる」と書いている。' +
            'ただし裴注が引く魏略と九州春秋は、逆に諸葛亮のほうから劉備を訪ねたとする。' +
            '裴松之はこの異説を退けているが、両方が並んで残っている。',
        },
      },
      {
        year: 214, text: '成都を囲み、劉璋の降を容れて益州を領す', supersedes: 'ev_chengdu',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '先主伝' },
      },
      {
        year: 221, text: '成都にて帝位に即き、国を漢と号す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '先主伝' },
      },
      {
        year: 223, text: '諸葛亮に「その才、曹丕に十倍す。嗣子輔くべくんば輔けよ。' +
          '如し不才ならば、君自ら取るべし」と告げる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '諸葛亮伝' },
      },
    ],
    fate: {
      kind: 'illness',
      year: 223,
      at: 'ev_baidicheng',
      record: '夷陵に敗れ、白帝城にて崩ず',
      escape: [
        {
          id: 'liubei:no_yiling',
          label: '関羽の仇討ちを思いとどまる',
          hint: '義を選ぶか、国を選ぶか。史実の劉備は義を選び、国を傾けた。',
          test: (c) => !c.flags['joined:ev_yiling'],
        },
        {
          id: 'liubei:heed_zhugeliang',
          label: '諸葛亮の諫言を容れる',
          test: (c) => c.flags['heeded:zhugeliang'] === true,
        },
      ],
    },
  },
  {
    id: 'guanyu', name: '関羽', courtesy: '雲長', roleId: 'veteran_general',
    allegiance: [
      { from: 184, factionId: 'liubei' },
      { from: 200, factionId: 'caocao' },
      { from: 200, factionId: 'liubei' },
    ],
    born: 160, died: 219,
    epithet: '万人の敵',
    stats: { war: 97, intel: 75, lead: 95, mobility: 70, virtue: 90 },
    events: ['ev_baima', 'ev_huarongdao', 'ev_fancheng'],
    life: [
      {
        year: 184, text: '劉備・張飛と、恩は兄弟の如く交わる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '関羽伝',
          insteadTruly:
            '「先主と恩は兄弟の若く、寝るときは牀を同じくした」とあるのみ。' +
            '桃園で義を結ぶ儀式は演義の作で、正史に誓いの場面は無い。',
        },
      },
      {
        year: 200, text: '下邳に敗れて曹操に降り、厚くもてなされる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '関羽伝' },
      },
      {
        year: 200, text: '賜わったものをことごとく封じ、書を残して劉備のもとへ去る',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '関羽伝',
          insteadTruly:
            '五関を突破して六将を斬った話は演義の作。正史は「羽は賜わる所を尽く封じ、書を拝して辞し、先主のもとへ奔る」と書くのみで、' +
            '曹操は追わせなかった。',
        },
      },
      {
        year: 219, text: '矢傷の毒を削り取らせ、その間も飲み食いして談笑す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '関羽伝',
          insteadTruly:
            '骨を削って毒を除いたことは正史にある。ただし医者の名は書かれていない。' +
            '華佗が執刀したとするのは演義で、華佗はこの十年前に世を去っている。',
        },
      },
      {
        year: 219, text: '潘璋の部下馬忠に捕らえられ、臨沮にて斬らる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '関羽伝' },
      },
    ],
    fate: {
      kind: 'battle',
      year: 219,
      at: 'ev_maicheng',
      by: '孫権',
      record: '麦城に囲まれ、捕らえられて斬らる',
      escape: [
        {
          id: 'guanyu:hold_jingzhou',
          label: '荊州の守りに三万を残す',
          hint: '樊城へ全軍を注ぎ込めば、背後は空く。',
          test: (c) => c.flags['jingzhou_garrison'] === true,
        },
        {
          id: 'guanyu:peace_lvmeng',
          label: '呂蒙との和睦に応じる',
          hint: '呉を蔑ろにしたことが、そもそもの始まりだった。',
          test: (c) => c.flags['peace:lvmeng'] === true,
        },
        {
          id: 'guanyu:mend_liufeng',
          label: '劉封・孟達との関係を修復する',
          hint: '援軍が来なかったのは、偶然ではない。',
          test: (c) => c.flags['favor:liufeng'] === true,
        },
      ],
    },
  },
  {
    id: 'zhangfei', name: '張飛', courtesy: '益徳', roleId: 'fierce_general',
    allegiance: [{ from: 184, factionId: 'liubei' }],
    born: 165, died: 221,
    epithet: '一万に当たる',
    stats: { war: 98, intel: 30, lead: 62, mobility: 76, virtue: 45 },
    life: [
      {
        year: 208, supersedes: 'ev_changban', text: '長坂にて橋を背に踏みとどまり、「我こそは張益徳、来たりて共に死を決せん」と叫ぶ',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '張飛伝',
          insteadTruly:
            'この一喝で誰も近づけなかったことまでが正史。二十騎で追手を止めたとも書かれている。' +
            '橋を打ち落とした話や、曹操の将が驚いて落馬し死んだという件は演義の脚色。',
        },
      },
      {
        year: 214, text: '厳顔を捕らえ、その気概に感じて縄を解き、賓客として遇す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '張飛伝' },
      },
      {
        year: 218, text: '宕渠にて張郃を破り、山道に追い詰める',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '張飛伝' },
      },
      {
        year: 221, text: '刑罰が過ぎ、日ごとに兵を鞭打っていた。' +
          '出陣を前に、部下の范彊・張達に寝首を掻かれる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '張飛伝',
          insteadTruly:
            '「刑殺すること既に過差、又日ごとに健児を鞭撾す」と正史にあり、' +
            '劉備がそれを戒めていたことも書かれている。乱暴者という像は演義の誇張ではなく、記録に沿う。',
        },
      },
    ],
    fate: {
      kind: 'assassination',
      year: 221,
      by: '范彊・張達',
      record: '出陣を前に、部下に寝首を掻かる',
      escape: [
        {
          id: 'zhangfei:stop_drinking',
          label: '酒を控える',
          hint: '酔えば鞭を振るう。鞭を振るわれた者は、いつか刃を持つ。',
          test: (c) => !c.flags['strain:drink'],
        },
        {
          id: 'zhangfei:spare_men',
          label: '部下を鞭打たない',
          test: (c) => c.virtueDelta >= 10,
        },
      ],
    },
  },
  {
    id: 'zhaoyun', name: '趙雲', courtesy: '子龍', roleId: 'veteran_general',
    allegiance: [
      { from: 191, factionId: 'gongsunzan' },
      { from: 200, factionId: 'liubei' },
    ],
    born: 168, died: 229,
    epithet: '一身、都(すべ)て是れ胆なり',
    stats: { war: 96, intel: 76, lead: 91, mobility: 88, virtue: 82 },
    life: [
      {
        year: 208, text: '長坂にて、幼い劉禅を懐に抱いて陣を脱す', supersedes: 'ev_changban',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '趙雲伝',
          insteadTruly:
            '正史は「雲、身に弱子を抱く。即ち後主なり」と一行書くのみで、' +
            '甘夫人も守り通したとある。七進七出して曹操の将五十余人を斬ったという件は演義の脚色。',
        },
      },
      {
        year: 219, text: '漢水にて陣門を開いて旗を伏せ、疑った曹操軍を退かせる',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '趙雲別伝',
          insteadTruly:
            'この一件は陳寿の本文には無く、裴松之が引く趙雲別伝に載る。' +
            '劉備が翌朝この陣を見て「子龍は一身都て是れ胆なり」と評したのも同じ書。' +
            '別伝は趙雲の事績を厚く伝えるが、裴松之は出所を明かしておらず、確かさは本伝に及ばない。',
        },
      },
      {
        year: 229, text: '病を得て没す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '趙雲伝',
          insteadTruly:
            '関・張・馬・黄・趙を「五虎大将」と呼ぶのは演義の作。' +
            '正史は五人を同じ巻に並べているだけで、そのような称号は無い。' +
            '生前の位も、趙雲は他の四人より一段低い。',
        },
      },
    ],
    fate: { kind: 'longevity', year: 229, record: '病にて没す。生涯、大敗を知らず' },
  },
  {
    id: 'zhugeliang', name: '諸葛亮', courtesy: '孔明', roleId: 'strategist',
    // 連弩「元戎」を作り、一度に十矢を放たせたという（三国志）
    aptitude: { archer: 1 },
    allegiance: [
      { from: 207, factionId: 'liubei' },
      { from: 221, factionId: 'shu' },
    ],
    born: 181, died: 234,
    epithet: '臥龍',
    stats: { war: 38, intel: 100, lead: 92, mobility: 60, virtue: 88 },
    life: [
      {
        year: 207, text: '天下三分の計を説く（隆中対）',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '諸葛亮伝' },
      },
      {
        year: 208, text: '呉に使いし、孫権を説いて同盟を結ばせる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '諸葛亮伝',
          insteadTruly:
            '孫権を説き伏せたことは正史にある。だが呉の群臣と論を戦わせた「舌戦群儒」、' +
            '藁船で矢を集めた「草船借箭」、七星壇で東南の風を祈った件は、いずれも演義の作。' +
            '赤壁の戦いそのものを采配したのは周瑜である。',
        },
      },
      {
        year: 225, text: '南中を平らげ、孟獲を降す', supersedes: 'ev_nanman',
        attribution: {
          work: 'peizhu', standing: 'variant', locus: '漢晋春秋',
          insteadTruly:
            '正史本文は「其の年の秋、悉く平らぐ」と簡潔に書くのみ。' +
            '七たび捕らえて七たび放したという話は、裴注が引く漢晋春秋に載る。' +
            '孟獲という名も本文には無く、この注に拠っている。',
        },
      },
      {
        year: 227, text: '出師表を奉って漢中に進む', supersedes: 'ev_chushibiao',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '諸葛亮伝' },
      },
      {
        year: 228, text: '街亭に敗れ、馬謖を斬って衆に謝す', supersedes: 'ev_jieting',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '諸葛亮伝',
          insteadTruly:
            '西城で城門を開き琴を弾いて司馬懿を退けた「空城の計」は、この敗走の場面に置かれるが演義の作。' +
            '下敷きは裴注が引く郭沖の五事だが、裴松之自身が「当時、司馬懿は荊州にいた」として退けている。',
        },
      },
      {
        year: 234, text: '五丈原の陣中に没す。退く蜀軍を追った司馬懿が、その備えを見て舌を巻く', supersedes: 'ev_wuzhangyuan',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '漢晋春秋',
          insteadTruly:
            '「死せる諸葛、生ける仲達を走らす」という言葉は、裴注が引く漢晋春秋に見える。' +
            '司馬懿自身が陣跡を見て「天下の奇才なり」と嘆じたことは正史本文にある。',
        },
      },
    ],
    fate: {
      kind: 'illness',
      year: 234,
      at: 'ev_wuzhangyuan',
      record: '五丈原の陣中にて没す。享年五十四',
      escape: [
        {
          id: 'zhugeliang:delegate',
          label: '細事を人に任せる',
          hint: '罰二十以上を自ら決裁す —— 司馬懿はそれを聞いて、勝ちを確信した。',
          test: (c) => c.roster.length >= 4 && !c.flags['strain:overwork'],
        },
        {
          id: 'zhugeliang:one_campaign',
          label: '北伐を急がない',
          hint: '出兵のたびに寿命が削れる。何度出るかは、あなたが決める。',
          test: (c) =>
            Object.keys(c.flags).filter((f) => f.startsWith('strain:northern')).length <= 2,
        },
      ],
    },
  },
  {
    id: 'pangtong', name: '龐統', courtesy: '士元', roleId: 'strategist',
    allegiance: [{ from: 209, factionId: 'liubei' }],
    born: 179, died: 214,
    epithet: '鳳雛',
    stats: { war: 30, intel: 96, lead: 78, mobility: 58, virtue: 70 },
    life: [
      {
        year: 211, text: '劉備に益州を取ることを勧め、上中下の三策を献ず',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '龐統伝' },
      },
      {
        year: 214, text: '雒城を攻めるさなか、流矢に当たって没す。享年三十六', supersedes: 'ev_luofeng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '龐統伝',
          insteadTruly:
            '正史は「城を統攻め、流矢の中る所と為り、卒す。時に年三十六」と書くのみ。' +
            '「落鳳坡」という地名も、鳳雛の名にかけて張任が待ち伏せたという筋も演義の作で、' +
            '劉備の的盧に乗り替えていたという件も同じ。',
        },
      },
      {
        year: 208, text: '赤壁にて曹操に船を鎖で繋ぐことを勧める（連環の計）',
        attribution: {
          work: 'yanyi', standing: 'invention',
          insteadTruly:
            '正史に龐統が曹操の陣へ入った記述は無い。この頃は周瑜の功曹であった。' +
            '船を繋いだこと自体は正史にあるが、誰の勧めとも書かれていない。',
        },
      },
    ],
    fate: {
      kind: 'battle',
      year: 214,
      at: 'ev_luofeng',
      record: '雒城を攻めるさなか、流矢に当たって没す',
    },
  },
  {
    id: 'huangzhong', name: '黄忠', courtesy: '漢升', roleId: 'veteran_general',
    allegiance: [
      { from: 190, factionId: 'liubiao' },
      { from: 209, factionId: 'liubei' },
    ],
    born: 148, died: 220,
    stats: { war: 93, intel: 62, lead: 80, mobility: 55, virtue: 78 },
    life: [
      {
        year: 219, text: '定軍山にて、一鼓のうちに夏侯淵を斬る', supersedes: 'ev_dingjunshan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '黄忠伝',
          insteadTruly:
            '「忠、推鋒必ず進み、勧率士卒、金鼓振天…一戦にして淵を斬る」と正史にある。' +
            '生涯で最も大きな功で、この戦いが漢中の帰趨を決めた。',
        },
      },
      {
        year: 219, text: '関羽と並んで後将軍に任じられ、関羽が不服を漏らす',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '費詩伝',
          insteadTruly: '関羽は「大丈夫、終に老兵と伍を為さず」と言ったと伝わる。',
        },
      },
      {
        year: 209, text: '長沙にて関羽と斬り結び、互いに手心を加える',
        attribution: {
          work: 'yanyi', standing: 'invention',
          insteadTruly:
            '正史では、曹操が荊州を平定したのち黄忠はそのまま長沙にあり、' +
            '劉備が南の四郡を降したときに従った。関羽との一騎討ちも、韓玄の一件も記述が無い。',
        },
      },
    ],
    fate: { kind: 'longevity', year: 220, record: '老いてなお矢を外さず、病にて没す' },
  },
  {
    id: 'machao', name: '馬超', courtesy: '孟起', roleId: 'fierce_general',
    // 羌胡を率いて関中に立つ。曹操が「涼州の兵は精悍」と評した（三国志）
    aptitude: { cavalry: 2 },
    allegiance: [
      { from: 200, factionId: 'matengs' },
      { from: 214, factionId: 'liubei' },
    ],
    born: 176, died: 222,
    epithet: '錦馬超',
    stats: { war: 97, intel: 44, lead: 82, mobility: 95, virtue: 60 },
    life: [
      {
        year: 211, text: '関中の諸将を糾合して潼関に曹操を迎え撃ち、あと一歩まで追い詰める', supersedes: 'ev_tongguan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '武帝紀・馬超伝',
          insteadTruly:
            '曹操が「馬児死せずんば、吾に葬地無からん」と言ったのは正史。' +
            'ただし演義は、父馬騰を殺された仇討ちとして挙兵させる。' +
            '正史は逆で、馬超が先に叛いたために、鄴にいた馬騰ら一族が誅された。',
        },
      },
      {
        year: 211, text: '賈詡の離間の計により韓遂と割れ、敗れる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '武帝紀' },
      },
      {
        year: 214, text: '劉備に降る。その名を聞いただけで成都の城中が震え、劉璋が降を決める',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '馬超伝' },
      },
      {
        year: 222, text: '「一門二百余口、ことごとく孟徳に誅せられ」と上疏して没す。享年四十七',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '馬超伝' },
      },
    ],
    fate: {
      kind: 'illness',
      year: 222,
      record: '一族を失い、志を得ぬまま病没す',
      escape: [
        {
          id: 'machao:save_family',
          label: '一族を長安から逃がす',
          hint: '挙兵の前に手を打てば、二百余人は死なずに済む。',
          test: (c) => c.flags['saved:mateng'] === true,
        },
      ],
    },
  },
];

export default officers;
