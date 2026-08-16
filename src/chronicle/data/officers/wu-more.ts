/** 呉と、荊州・益州の群雄。 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  {
    id: 'sunquan', name: '孫権', courtesy: '仲謀', roleId: 'ruler',
    allegiance: [{ from: 194, factionId: 'sunce' }, { from: 200, factionId: 'wu', rankId: 'lord' }],
    born: 182, died: 252,
    epithet: '生子当に孫仲謀の如くなるべし',
    life: [
      {
        year: 200, text: '十九にして兄の跡を継ぎ、江東を保つ',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '呉主伝' },
      },
      {
        year: 208, text: '机の角を斬って主戦を決す', supersedes: 'ev_chibi',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '江表伝',
          insteadTruly:
            '「敢えて復た曹に降るを言う者あらば、この案の如くならん」と机を斬った場面は、' +
            '裴注が引く江表伝による。本文が書くのは、周瑜と魯粛の主戦論を容れたことまで。',
        },
      },
      {
        year: 213, text: '濡須にて曹操と対峙し、曹操に「子を生まば当に孫仲謀の如くなるべし」と嘆じさせる',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '呉歴',
          insteadTruly:
            '演義の草船借箭は、この時の一件が下敷きになっている。' +
            '裴注の魏略に、孫権の船が矢を受けて傾いたので船を回して反対側にも受け、' +
            '均衡を取って帰った、とある。矢を集めるために出たのではないし、諸葛亮でもない。',
        },
      },
      {
        year: 229, text: '帝位に即く。三国の中でいちばん遅い',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '呉主伝' },
      },
      {
        year: 250, text: '晩年、後継ぎを巡って群臣を裂き、多くを殺す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呉主伝',
          insteadTruly:
            '陳寿は「性は猜忌多く、殺戮を果断す」と晩年を厳しく評した。' +
            '陸遜もこの争いに巻き込まれて憤死している。',
        },
      },
    ],
    stats: { war: 68, intel: 84, lead: 88, mobility: 65, virtue: 74 },
    fate: { kind: 'longevity', year: 252, record: '三国の主のうち、最も長く座に在り' },
  },
  {
    id: 'lusu', name: '魯粛', courtesy: '子敬', roleId: 'strategist',
    allegiance: [{ from: 200, factionId: 'wu' }],
    born: 172, died: 217,
    life: [
      {
        year: 200, text: '孫権に「漢室は復すべからず。江東を保ちて天下を鼎立せよ」と説く',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '魯粛伝',
          insteadTruly:
            '天下三分を最初に説いたのは魯粛で、諸葛亮の隆中対より七年早い。' +
            '演義は魯粛を、周瑜と諸葛亮の間で右往左往する人の好い男として描くが、' +
            '正史では呉の大局を決めた人物である。',
        },
      },
      {
        year: 208, text: '衆が降伏に傾く中、ただ一人「粛らは降るべきも、将軍は降るべからず」と説く',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '魏書・江表伝',
          insteadTruly:
            '「臣下は降っても身は保てるが、あなたが降ればどこに行き着くのか」と説いた。' +
            '孫権はこれを聞いて「此れ天の卿を以て我に賜うなり」と嘆じたと伝わる。',
        },
      },
      {
        year: 215, text: '単刀を提げて関羽と会見し、荊州の返還を迫る',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '魯粛伝',
          insteadTruly:
            '演義はこれを「単刀赴会」として関羽の胆力の見せ場に仕立てるが、' +
            '正史では乗り込んで談判したのは魯粛のほう。関羽の部下が口を挟むと魯粛が叱りつけ、' +
            '関羽は黙って引いた、と書かれている。主客がまるで逆になっている。',
        },
      },
    ],
    stats: { war: 42, intel: 90, lead: 78, mobility: 55, virtue: 85 },
    fate: { kind: 'illness', year: 217, record: '劉備との和を守り抜いて没す' },
  },
  {
    id: 'luxun', name: '陸遜', courtesy: '伯言', roleId: 'strategist',
    allegiance: [{ from: 203, factionId: 'wu' }],
    born: 183, died: 245,
    epithet: '書生に非ず',
    life: [
      {
        year: 219, text: '若輩を装った書を関羽に送り、警戒を解かせる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '陸遜伝' },
      },
      {
        year: 222, text: '夷陵にて、七百里に連なる劉備の営を焼く', supersedes: 'ev_yiling',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '陸遜伝',
          insteadTruly:
            '諸将が「書生に何ができる」と侮る中、半年も守って動かず、' +
            '夏を待って一挙に焼いた。この一戦が呉の存続を決めている。' +
            '八陣図に迷って諸葛亮の岳父に助けられたという件は演義の作。',
        },
      },
      {
        year: 245, text: '後継ぎ争いを諌めて孫権に責められ、憤りのうちに没す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '陸遜伝',
          insteadTruly:
            '「憤恚して卒す」と正史にある。呉を二度救った人物の最期がこれである。',
        },
      },
    ],
    stats: { war: 60, intel: 95, lead: 94, mobility: 68, virtue: 78 },
    fate: {
      kind: 'illness', year: 245,
      record: '後継争いに巻き込まれ、孫権に責められて憤死す',
    },
  },
  {
    id: 'huanggai', name: '黄蓋', courtesy: '公覆', roleId: 'general',
    allegiance: [{ from: 184, factionId: 'sunjian' }, { from: 200, factionId: 'wu' }],
    died: 215,
    epithet: '苦肉の計',
    life: [
      {
        year: 208, text: '偽りの降伏を申し出て曹操の船団に近づき、火を放つ', supersedes: 'ev_chibi',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '周瑜伝',
          insteadTruly:
            '詐降と火計は正史にある。だが打ち据えられて信じ込ませた「苦肉の計」は演義の作で、' +
            '正史に鞭打たれる場面は無い。火計を献じたことも、周瑜伝が黄蓋の言として書いている。',
        },
      },
    ],
    stats: { war: 82, intel: 70, lead: 80, mobility: 62, virtue: 80 },
    fate: { kind: 'longevity', year: 215 },
  },
  {
    id: 'taishici', name: '太史慈', courtesy: '子義', roleId: 'fierce_general',
    // 「猿臂善射」。城楼に手を釘づけたと伝わる（三国志）
    aptitude: { archer: 2 },
    allegiance: [{ from: 199, factionId: 'sunce' }, { from: 200, factionId: 'wu' }],
    born: 166, died: 206,
    life: [
      {
        year: 193, text: '北海の囲みを単騎で破り、劉備に救援を請う', supersedes: 'ev_beihai',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '太史慈伝',
          insteadTruly:
            '数日にわたって城外で弓を射る稽古をしてみせ、賊が慣れて動かなくなったところを' +
            '駆け抜けた、という手立てまで正史に書かれている。',
        },
      },
      {
        year: 195, text: '神亭にて孫策と渡り合い、互いの兜と手戟を奪い合う',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '太史慈伝',
          insteadTruly:
            '一騎討ちの場面が正史にはっきり書かれている数少ない例。' +
            '「慈、策の兜鍪を得、策、慈の頸後の手戟を得たり」とある。',
        },
      },
      {
        year: 206, text: '「大丈夫、生まれて七尺の剣を帯び、天子の階に昇るべし」と言い遺して没す。四十一',
        attribution: { work: 'peizhu', standing: 'record', locus: '呉書' },
      },
    ],
    stats: { war: 92, intel: 66, lead: 80, mobility: 88, virtue: 82 },
    fate: {
      kind: 'illness', year: 206,
      record: '「志を果たさぬまま死ぬのか」と言い遺す',
    },
  },
  {
    id: 'ganning', name: '甘寧', courtesy: '興覇', roleId: 'fierce_general',
    // 百余騎で曹操の陣を夜襲し、一人も失わずに帰った（三国志）
    aptitude: { cavalry: 1 },
    allegiance: [{ from: 200, factionId: 'liubiao' }, { from: 208, factionId: 'wu' }],
    died: 215,
    epithet: '錦帆賊',
    life: [
      {
        year: 213, text: '百騎を率いて夜に曹操の陣を襲い、一人も欠かさず帰る',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '江表伝',
          insteadTruly:
            '孫権が「孟徳に張遼あり、孤に興覇あり。以て相敵すべし」と言ったのも同じ書。' +
            '若い頃、鈴を鳴らし錦の帆を張って川を荒らした賊であったことは本伝にある。',
        },
      },
    ],
    stats: { war: 93, intel: 60, lead: 78, mobility: 90, virtue: 48 },
    fate: { kind: 'illness', year: 215 },
  },
  {
    id: 'huangzu', name: '黄祖', roleId: 'general',
    allegiance: 'liubiao', died: 208,
    life: [
      {
        year: 191, text: '劉表の将として孫堅を防ぎ、これを射殺す',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '孫堅伝' },
      },
      {
        year: 208, text: '孫権に江夏を攻められ、討たれる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呉主伝',
          insteadTruly:
            '孫権は三度に分けて江夏を攻め、十七年越しで父の仇を討った。' +
            '甘寧がもとこの人の下にいて、軽んじられて呉に移ったことも記録にある。',
        },
      },
    ],
    fate: { kind: 'battle', year: 208, by: '孫権' },
  },
  {
    id: 'sunhao', name: '孫皓', courtesy: '元宗', roleId: 'ruler',
    allegiance: [{ from: 264, factionId: 'wu', rankId: 'lord' }],
    born: 242, died: 284,
    life: [
      {
        year: 280, text: '晋の軍が建業に至り、棺を運ばせて降る', supersedes: 'ev_wu_falls',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '孫皓伝',
          insteadTruly:
            '司馬炎が「この席をあなたのために設けて久しい」と言うと' +
            '「臣も南方に同じ席を設けて陛下を待っておりました」と応じた、という一件が裴注にある。' +
            '在位中は人の顔の皮を剥ぎ目を抉ったと記録され、呉を滅ぼしたのは晋よりこの人であった。',
        },
      },
    ],
    stats: { war: 55, intel: 60, lead: 50, mobility: 50, virtue: 15 },
    fate: {
      kind: 'longevity', year: 284,
      record: '晋に降り、帰命侯に封ぜらる',
    },
  },
  {
    id: 'lukang', name: '陸抗', courtesy: '幼節', roleId: 'veteran_general',
    allegiance: [{ from: 246, factionId: 'wu' }],
    born: 226, died: 274,
    epithet: '呉最後の柱石',
    life: [
      {
        year: 272, text: '国境を挟んだ羊祜と礼を交わし、薬を贈られてためらわず飲む',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '陸抗伝',
          insteadTruly:
            '敵味方でありながら互いを敬い、境を侵さなかった。' +
            '孫皓がこれを咎めると「一邑一郷すら信義無かるべからず、況んや大国をや」と答えたと伝わる。',
        },
      },
      {
        year: 274, text: '西陵の守りを厚くするよう上疏を重ねるが容れられず、没す',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '陸抗伝',
          insteadTruly: 'この六年後、晋は陸抗が守れと言った西陵から攻め下って呉を滅ぼした。',
        },
      },
    ],
    stats: { war: 78, intel: 92, lead: 93, mobility: 65, virtue: 82 },
    fate: { kind: 'illness', year: 274, record: 'この人が没して六年、呉は滅ぶ' },
  },

  // ------------------------------------------------ 荊州・益州
  {
    id: 'liubiao', name: '劉表', courtesy: '景升', roleId: 'warlord',
    allegiance: [{ from: 190, factionId: 'liubiao', rankId: 'lord' }],
    born: 142, died: 208,
    life: [
      {
        year: 190, text: '単騎で荊州に入り、宗族と豪族を束ねて八郡を治める',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '劉表伝',
          insteadTruly:
            '学者を集め、戦乱を避けた人々が荊州に流れ込んだ。' +
            '「座談の客」と評されるのは動かなかったからだが、二十年近く一州を平穏に保ってもいる。',
        },
      },
    ],
    stats: { war: 50, intel: 75, lead: 70, mobility: 45, virtue: 76 },
    fate: { kind: 'illness', year: 208, record: '曹操の南下を前に病没す' },
  },
  {
    id: 'liuzhang', name: '劉璋', courtesy: '季玉', roleId: 'warlord',
    allegiance: [{ from: 194, factionId: 'liuzhang', rankId: 'lord' }, { from: 214, factionId: 'liubei' }],
    died: 219,
    life: [
      {
        year: 211, text: '張魯を恐れて劉備を益州に招き入れる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '劉璋伝',
          insteadTruly:
            '黄権も王累も強く諌めたが聞かなかった。招いた相手に国を取られることになる。',
        },
      },
      {
        year: 214, text: '「わが百姓を戦わせるに忍びず」と言って城を開く', supersedes: 'ev_chengdu',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '劉璋伝',
          insteadTruly:
            '成都にはまだ三万の兵と一年分の兵糧があり、民は死守を望んでいた。' +
            'それでも開城した。暗愚と評されるが、正史のこの一行だけは違う響きを持つ。',
        },
      },
    ],
    stats: { war: 35, intel: 55, lead: 45, mobility: 40, virtue: 70 },
    fate: { kind: 'longevity', year: 219, record: '国を譲り、静かに余生を送る' },
  },
  {
    id: 'yuanshu', name: '袁術', courtesy: '公路', roleId: 'warlord',
    allegiance: [{ from: 190, factionId: 'yuanshu', rankId: 'lord' }],
    died: 199,
    epithet: '僭称の帝',
    life: [
      {
        year: 197, text: '伝国の玉璽を得たとして帝を称し、天下に背かれる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '袁術伝',
          insteadTruly:
            '「代漢者当塗高（漢に代わる者は当塗高なり）」の讖を自分の字（公路）に当てはめた、' +
            'と正史にある。孫策も呂布もこれを機に離れ、僅か二年で立ち行かなくなった。',
        },
      },
      {
        year: 199, text: '落ち延びる途上、蜜水すら得られず、血を吐いて死す',
        attribution: {
          work: 'peizhu', standing: 'record', locus: '呉書',
          insteadTruly:
            '「蜜水が飲みたい」と言い、麦の屑しか無いと答えられて' +
            '「我、此に至れるか」と嘆じ、血を吐いて死んだ——この最期は裴注が引く呉書による。',
        },
      },
    ],
    stats: { war: 55, intel: 50, lead: 60, mobility: 50, virtue: 20 },
    fate: {
      kind: 'illness', year: 199,
      record: '蜜水すら得られず、血を吐いて死す',
    },
  },
  {
    id: 'gongsunzan', name: '公孫瓚', courtesy: '伯珪', roleId: 'warlord',
    // 白馬義従。白馬ばかりを選んで従え、烏桓は「白馬長史を避けよ」と語り合った（後漢書）
    aptitude: { cavalry: 2, infantry: -1 },
    allegiance: [{ from: 188, factionId: 'gongsunzan', rankId: 'lord' }],
    died: 199,
    epithet: '白馬長史',
    life: [
      {
        year: 190, text: '白馬に乗る精鋭を率い、烏丸に恐れられる',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '公孫瓚伝',
          insteadTruly:
            '「白馬長史」の名は、烏丸が瓚の白馬を見ただけで避けたことから来ている。' +
            '劉備が若い頃この人のもとにいたことも正史にある。',
        },
      },
      {
        year: 199, text: '易京に楼を築いて籠もるが、地下道から崩され、妻子を殺して自ら焼く', supersedes: 'ev_yijing',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '公孫瓚伝',
          insteadTruly:
            '十重の塹壕と高さ十丈の楼を築き、三百万斛の穀を蓄えて「天下の事は定まらん」と言った。' +
            '外の味方を救わなくなったので、誰も彼を救わなくなった、と正史は書く。',
        },
      },
    ],
    stats: { war: 82, intel: 60, lead: 78, mobility: 85, virtue: 55 },
    fate: {
      kind: 'battle', year: 199, at: 'ev_yijing', by: '袁紹',
      record: '易京の楼に火を放ち、自ら死す',
    },
  },
  {
    id: 'mateng', name: '馬騰', courtesy: '寿成', roleId: 'warlord',
    // 涼州に拠った。子の馬超と同じ馬の土地（三国志）
    aptitude: { cavalry: 1 },
    allegiance: [{ from: 190, factionId: 'matengs', rankId: 'lord' }],
    died: 212,
    life: [
      {
        year: 211, text: '許都に召されて衛尉となり、鄴に留め置かれる',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '馬超伝' },
      },
      {
        year: 212, text: '子の馬超が叛いたため、一族もろとも誅される', supersedes: 'ev_mateng',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '馬超伝',
          insteadTruly:
            '順序が演義と逆である。演義は馬騰が先に殺され、馬超が仇討ちに挙兵したとするが、' +
            '正史では馬超が先に叛き、その報いとして父と一族二百余人が誅された。',
        },
      },
    ],
    fate: {
      kind: 'execution', year: 212, at: 'ev_mateng', by: '曹操',
      record: '許都に召し出され、一族もろとも誅さる',
    },
  },
  {
    id: 'hansui', name: '韓遂', courtesy: '文約', roleId: 'warlord',
    // 同じく涼州。羌の騎兵を背にした（三国志）
    aptitude: { cavalry: 1 },
    allegiance: [{ from: 190, factionId: 'matengs' }],
    died: 215,
    life: [
      {
        year: 211, text: '潼関にて馬超と結ぶが、曹操の離間の計に疑われて割れる', supersedes: 'ev_tongguan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '武帝紀',
          insteadTruly:
            '曹操が韓遂と馬上で旧交を語り、後から字を塗り潰した書を送った。' +
            '馬超は「なぜ書が汚れているのか」と疑い、そこから離れていった。',
        },
      },
    ],
    fate: { kind: 'illness', year: 215 },
  },
  {
    id: 'menghuo', name: '孟獲', roleId: 'warlord',
    // 南中の主。藤甲を編む兵は、この地より外に出ない（華陽国志・演義）
    aptitude: { rattan: 2 },
    allegiance: [{ from: 225, factionId: 'nanman', rankId: 'lord' }],
    died: 240,
    epithet: '七縦七擒',
    life: [
      {
        year: 225, text: '南中に叛き、諸葛亮に七たび捕らえられて七たび放たれる', supersedes: 'ev_nanman',
        attribution: {
          work: 'peizhu', standing: 'variant', locus: '漢晋春秋',
          insteadTruly:
            '孟獲という名は三国志の本文に無く、裴注の漢晋春秋と華陽国志にのみ見える。' +
            '本文が書くのは「其の年の秋、悉く平らぐ」だけ。' +
            '祝融夫人も、藤甲兵も、木獣も、演義がこの隙間に足したものである。',
        },
      },
    ],
    stats: { war: 80, intel: 45, lead: 70, mobility: 70, virtue: 65 },
    fate: { kind: 'longevity', year: 240, record: '心より服し、二度と背かず' },
  },
];

export default officers;
