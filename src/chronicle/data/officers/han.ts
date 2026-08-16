/** 漢朝と、乱の初期に舞台を作った人々。 */

import type { Officer } from '../../types';

const officers: Officer[] = [
  {
    id: 'huangfusong', name: '皇甫嵩', courtesy: '義真', roleId: 'veteran_general',
    allegiance: 'han', born: 137, died: 195,
    epithet: '黄巾を平らげし者',
    life: [
      {
        year: 184, text: '広宗・下曲陽に張梁・張宝を破り、黄巾の乱を平らげる', supersedes: 'ev_guangzong',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '下曲陽では首級十万余を京観（死体を積んだ塚）に築いたと後漢書にある。' +
            '乱を鎮めた功第一の人物だが、演義では劉備たちの背景に退いている。',
        },
      },
      {
        year: 188, text: '兵権を握りながら、董卓を討てという勧めを退ける',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '甥の皇甫酈が「董卓を除くべし」と説いたが、詔を待つべきだとして動かなかった。' +
            'のちに董卓が権を握ると、その前に膝を屈することになる。',
        },
      },
    ],
    stats: { war: 78, intel: 80, lead: 90, mobility: 60, virtue: 80 },
    fate: { kind: 'longevity', year: 195, record: '乱世を見届け、病にて没す' },
  },
  {
    id: 'luzhi', name: '盧植', courtesy: '子幹', roleId: 'civil_official',
    allegiance: 'han', died: 192,
    epithet: '劉備の師',
    life: [
      {
        year: 184, text: '広宗に張角を囲むが、賄賂を拒んで宦官に讒せられ、檻車で召還される',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '若い頃の劉備が学んだ師でもある。' +
            '後に董卓が少帝を廃そうとしたとき、満座でただ一人反対して席を蹴った。',
        },
      },
    ],
    stats: { war: 55, intel: 85, lead: 78, mobility: 45, virtue: 88 },
    fate: { kind: 'longevity', year: 192 },
  },
  {
    id: 'zhujun', name: '朱儁', courtesy: '公偉', roleId: 'general',
    allegiance: 'han', died: 195,
    life: [
      {
        year: 184, text: '南陽に黄巾を破り、皇甫嵩とともに乱を平らげる',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 195, text: '李傕に人質を取られ、憤りのうちに没す',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
    ],
    fate: { kind: 'longevity', year: 195 },
  },
  {
    id: 'hejin', name: '何進', courtesy: '遂高', roleId: 'general',
    allegiance: 'han', died: 189,
    epithet: '肉屋の大将軍',
    life: [
      {
        year: 189, text: '宦官を誅そうとして董卓ら外の兵を都に呼び寄せる',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '曹操は「宦官を除くなら獄吏一人で足りる。なぜ外の兵を招くのか」と笑い、' +
            '陳琳も強く諌めたが聞かなかった。乱世の門を開けたのは、この一手である。',
        },
      },
      {
        year: 189, text: '宮中に呼び出され、宦官に斬られる', supersedes: 'ev_shichangshi',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
    ],
    stats: { war: 60, intel: 25, lead: 55, mobility: 45, virtue: 40 },
    fate: {
      kind: 'assassination', year: 189, at: 'ev_shichangshi', by: '十常侍',
      record: '宮中に呼び出され、斬らる',
    },
  },
  {
    id: 'zhangrang', name: '張讓', roleId: 'eunuch',
    allegiance: 'han', died: 189,
    epithet: '十常侍の首',
    life: [
      {
        year: 189, text: '何進を宮中に誘い出して斬る', supersedes: 'ev_shichangshi',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '袁紹らが宮中に踏み込み、宦官二千余人を皆殺しにした。' +
            '髭の無い者は宦官と見なされて殺されたとまで書かれている。',
        },
      },
      {
        year: 189, text: '少帝を連れて逃げ、追われて河に身を投ずる',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
    ],
    fate: { kind: 'battle', year: 189, at: 'ev_shichangshi', record: '追われて河に身を投ず' },
  },
  {
    id: 'dingyuan', name: '丁原', courtesy: '建陽', roleId: 'warlord',
    allegiance: 'han', died: 189,
    epithet: '呂布の義父',
    life: [
      {
        year: 189, text: '并州から兵を率いて洛陽に入り、董卓と対立する',
        attribution: { work: 'sanguozhi', standing: 'record', locus: '呂布伝' },
      },
      {
        year: 189, text: '主簿として重んじていた呂布に斬られる', supersedes: 'ev_dingyuan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂布伝',
          insteadTruly:
            '正史は「大いに親しみ待遇す」と書くのみで、義父子の縁組は記していない。' +
            '呂布が丁原を義父と呼んだのも、赤兎馬と引き換えだったという筋も演義の作。',
        },
      },
    ],
    stats: { war: 70, intel: 50, lead: 72, mobility: 55, virtue: 60 },
    fate: {
      kind: 'assassination', year: 189, at: 'ev_dingyuan', by: '呂布',
      record: '義子の手にかかる',
    },
  },
  {
    id: 'wangyun', name: '王允', courtesy: '子師', roleId: 'civil_official',
    allegiance: 'han', born: 137, died: 192,
    epithet: '連環の計',
    life: [
      {
        year: 189, text: '董卓のもとで司徒を務め、機を窺う',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 192, text: '呂布を説いて董卓を討たせる', supersedes: 'ev_diaochan',
        attribution: {
          work: 'sanguozhi', standing: 'record', locus: '呂布伝',
          insteadTruly:
            '呂布が董卓の侍婢と通じて怯えていたところへ、同郷の縁を頼って王允が説いた、' +
            'というのが正史の筋。養女の貂蝉を使った連環の計は演義の作である。',
        },
      },
      {
        year: 192, text: '董卓の残党の赦しを拒み、長安を落とされて殺される', supersedes: 'ev_lijue',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '李傕らが赦しを乞うたのを王允が退けたため、彼らは賈詡の勧めで長安を襲った。' +
            '董卓を除いた功は、この判断ひとつで潰えている。',
        },
      },
    ],
    stats: { war: 30, intel: 86, lead: 55, mobility: 40, virtue: 72 },
    fate: {
      kind: 'execution', year: 192, at: 'ev_lijue', by: '李傕',
      record: '董卓の残党に攻められ、殺さる',
    },
  },
  {
    id: 'lijue', name: '李傕', courtesy: '稚然', roleId: 'general',
    allegiance: [{ from: 189, factionId: 'dongzhuo' }, { from: 192, factionId: 'ronin' }],
    died: 198,
    life: [
      {
        year: 192, text: '賈詡の勧めで長安を襲い、王允を殺して権を握る', supersedes: 'ev_lijue',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 195, text: '郭汜と争って献帝を奪い合い、都を戦場にする',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '帝を自陣に囲い込んで互いに攻め合い、長安の民は食い尽くして人が人を食ったと記録にある。',
        },
      },
    ],
    fate: { kind: 'battle', year: 198 },
  },
  {
    id: 'liuxie', name: '劉協', courtesy: '伯和', roleId: 'ruler',
    allegiance: 'han', born: 181, died: 234,
    epithet: '献帝',
    life: [
      {
        year: 196, text: '曹操に迎えられ、許に都を置く', supersedes: 'ev_yingemperor',
        attribution: { work: 'houhanshu', standing: 'record' },
      },
      {
        year: 220, text: '位を曹丕に譲り、山陽公となる', supersedes: 'ev_han_ends',
        attribution: {
          work: 'houhanshu', standing: 'record',
          insteadTruly:
            '殺されたのではない。山陽公として十四年を生き、234年に没した。' +
            '諸葛亮より後まで生きており、蜀が「帝は害された」として喪を発したのは誤報に基づく。' +
            '晩年は医を学んで民を診たと伝わる。',
        },
      },
    ],
    stats: { war: 25, intel: 70, lead: 40, mobility: 40, virtue: 85 },
    fate: {
      kind: 'longevity', year: 234,
      record: '位を曹丕に譲り、山陽公として天寿を全う',
    },
  },
];

export default officers;
