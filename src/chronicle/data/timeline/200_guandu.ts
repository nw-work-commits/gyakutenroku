/** 建安五年〜十二年（200〜207）。官渡と、江東の代替わり。 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_yidaizhao',
    year: 200,
    name: '衣帯詔',
    weight: 4,
    factions: ['han', 'caocao', 'liubei'],
    record: '董承ら密詔を受けて曹操を除かんとするも露見し、皆殺さる',
    scenes: [
      {
        id: 'default',
        text:
          '帯の裏に縫い込まれた詔が回ってきた。\n' +
          '曹操を除け、と天子は書いている。\n' +
          '名を連ねれば、後戻りはできない。',
        choices: [
          {
            label: '署名する',
            historical: true,
            effect: {
              deed: '衣帯の詔に名を連ねる',
              flags: { 'joined:ev_yidaizhao': true, 'loyal:han': true },
              renown: 30,
              virtue: 20,
            },
          },
          {
            label: '署名し、すぐに都を出る',
            effect: {
              deed: '詔に応じ、機を見て都を脱す',
              flags: { 'joined:ev_yidaizhao': true, 'loyal:han': true },
              renown: 25,
              virtue: 12,
              joinFaction: 'ronin',
            },
          },
          {
            label: '曹操に密告する',
            effect: {
              deed: '密詔の企てを曹操に告げる',
              flags: { 'favor:caocao': true },
              renown: 20,
              virtue: -25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_baima',
    year: 200,
    name: '白馬の戦い',
    weight: 3,
    factions: ['caocao', 'yuanshao'],
    record: '関羽、万軍の中に顔良を斬る',
    scenes: [
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '顔良の旗が見える。すでに味方の将が二人斬られた。\n' +
          '曹操が言った。「誰か、あれを」',
        choices: [
          {
            label: '単騎で駆け、顔良を斬る',
            historical: true,
            effect: {
              deed: '白馬にて万軍の中に顔良を斬る',
              flags: { 'joined:ev_baima': true, 'won:ev_baima': true },
              battle: { enemies: ['yanliang'], escapable: false },
              renown: 70,
            },
          },
          {
            label: '弓兵を前に出して崩す',
            effect: {
              deed: '弓を並べて袁紹軍の陣を崩す',
              flags: { 'joined:ev_baima': true, 'won:ev_baima': true },
              renown: 30,
            },
          },
        ],
      },
      {
        id: 'as_yuan',
        when: (c) => c.factionId === 'yuanshao',
        text: '数ではこちらが上。だが敵陣から、赤ら顔の武将が一騎で駆けてくる。',
        choices: [
          {
            label: '陣を固めて迎え撃つ',
            historical: true,
            effect: {
              deed: '白馬にて曹操軍と戦う',
              flags: { 'joined:ev_baima': true },
              battle: { enemies: ['guanyu'], escapable: true },
              renown: 30,
            },
          },
          {
            label: '無理をせず、本隊に合流する',
            effect: { deed: '白馬より兵を退き、本隊に合す', renown: 10 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yanjin',
    year: 200,
    name: '延津',
    weight: 2,
    factions: ['caocao', 'yuanshao'],
    record: '文醜、輜重に群がる兵を追って討たる',
    scenes: [
      {
        id: 'default',
        text:
          '曹操は輜重をわざと道に捨てた。\n' +
          '追撃してきた兵が、我先に荷を漁っている。\n' +
          '——隊列が、崩れた。',
        choices: [
          {
            label: '崩れたところを突く',
            historical: true,
            effect: {
              deed: '延津にて敵の乱れを突き、文醜を討つ',
              flags: { 'joined:ev_yanjin': true, 'won:ev_yanjin': true },
              battle: { enemies: ['wenchou'], escapable: false },
              renown: 45,
            },
          },
          {
            label: '兵を叱って隊列を戻させる',
            effect: {
              deed: '兵の略奪を制し、隊列を保つ',
              flags: { 'joined:ev_yanjin': true },
              renown: 25,
              virtue: 12,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_guandu',
    year: 200,
    name: '官渡の戦い',
    weight: 5,
    factions: ['caocao', 'yuanshao'],
    record: '曹操、烏巣を焼いて袁紹の兵糧を絶つ。十倍の敵を破る',
    aftermath: {
      news: '官渡に袁紹敗る。河北の勢い、ここに折れた',
    },
    scenes: [
      {
        id: 'as_cao',
        when: (c) => c.factionId === 'caocao',
        text:
          '兵糧が尽きかけている。兵は十分の一。\n' +
          'そこへ、袁紹の陣から降ってきた男が言った。\n' +
          '「烏巣に、袁紹の兵糧がすべてあります」\n\n' +
          '——罠かもしれない。',
        choices: [
          {
            label: '自ら精兵を率いて烏巣を焼く',
            historical: true,
            effect: {
              deed: '烏巣を焼き、袁紹の兵糧を絶つ',
              flags: { 'joined:ev_guandu': true, 'won:ev_guandu': true },
              battle: { enemies: ['general', 'officer'], escapable: false },
              renown: 80,
            },
          },
          {
            label: '守りを固め、持久する',
            effect: {
              deed: '官渡に拠って守りを固める',
              flags: { 'joined:ev_guandu': true },
              renown: 20,
            },
          },
          {
            label: '許都へ退く',
            effect: {
              deed: '官渡を捨てて許都に退く',
              flags: { 'retreated:ev_guandu': true },
              renown: -20,
            },
          },
        ],
      },
      {
        id: 'as_yuan',
        when: (c) => c.factionId === 'yuanshao',
        text:
          '田豊は「持久せよ」と言い、獄に入れた。\n' +
          '沮授は「烏巣を厚く守れ」と言った。\n' +
          '——十倍の兵がある。急ぐ必要が、あるだろうか。',
        choices: [
          {
            label: '一気に押し潰す',
            historical: true,
            effect: {
              deed: '大軍を以て官渡に押し寄せる',
              flags: { 'joined:ev_guandu': true },
              renown: 20,
            },
          },
          {
            label: '烏巣の守りを厚くする',
            effect: {
              deed: '沮授の言を容れ、烏巣に精兵を置く',
              flags: { 'joined:ev_guandu': true, 'won:ev_guandu': true, 'heeded:jushou': true },
              renown: 50,
              // 兵糧が焼けなければ、十倍の兵がそのまま効く。中原は袁紹のものになる。
              aftermath: {
                seize: [
                  { city: 'puyang', faction: 'yuanshao' },
                  { city: 'xuchang', faction: 'yuanshao' },
                ],
                news: '官渡に曹操敗る。兗州・豫州は袁紹の旗に替わった',
              },
            },
          },
          {
            label: '田豊を獄から出し、意見を聞く',
            effect: {
              deed: '田豊を獄より出し、その策を用う',
              flags: { 'joined:ev_guandu': true, 'saved:tianfeng': true, 'favor:yuanshao': true },
              renown: 40,
              virtue: 18,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_sunce_hunt',
    year: 200,
    name: '丹徒の狩り',
    weight: 3,
    factions: ['sunce', 'wu'],
    record: '孫策、狩りの途上に許貢の食客に襲われ、傷より没す。二十六',
    scenes: [
      {
        id: 'as_sunce',
        when: (c) => c.officerId === 'sunce' || c.factionId === 'sunce',
        text:
          '馬が速い。供の者が追いつかない。\n' +
          '林の中はひどく静かで、鹿の影も見えない。\n' +
          '——ふと、木の間に人の気配がした。',
        choices: [
          {
            label: '構わず馬を進める',
            historical: true,
            effect: {
              deed: '単騎で狩りに出て、刺客に襲わる',
              flags: { 'joined:ev_sunce_hunt': true },
              battle: { enemies: ['bandit', 'bandit'], escapable: false },
              renown: 10,
            },
          },
          {
            label: '供の者を待ってから進む',
            effect: {
              deed: '供を待ち、常に護衛を身近に置く',
              flags: { 'escort:200': true, guarded: true },
              renown: 5,
              virtue: 5,
            },
          },
          {
            label: '狩りをやめて城に戻る',
            effect: {
              deed: '不穏を察して狩りを切り上げる',
              flags: { guarded: true },
              renown: -5,
            },
          },
        ],
      },
      {
        id: 'as_other',
        when: (c) => c.factionId !== 'sunce',
        text: '江東の小覇王が死んだという。二十六だったそうだ。',
        choices: [
          {
            label: '弔問の使いを出す',
            effect: { deed: '江東へ弔問の使いを送る', virtue: 8, renown: 5 },
          },
          {
            label: 'これを機と見る',
            historical: true,
            effect: { deed: '江東の代替わりを機と見て備える', renown: 10, virtue: -5 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_sangu',
    year: 207,
    name: '三顧の礼',
    weight: 4,
    factions: ['liubei'],
    record: '劉備、三たび草廬を訪ねて諸葛亮を得る',
    scenes: [
      {
        id: 'as_liubei',
        when: (c) => c.factionId === 'liubei',
        text:
          '二度訪ねて、二度とも留守だった。\n' +
          '張飛が「縛って連れてくればいい」と言っている。\n' +
          '雪が降っている。三度目を、行くか。',
        choices: [
          {
            label: '三度目を訪ねる',
            historical: true,
            effect: {
              deed: '三たび草廬を訪ね、臥龍を得る',
              flags: { 'joined:ev_sangu': true, 'has:zhugeliang': true },
              renown: 50,
              virtue: 25,
            },
          },
          {
            label: '使いを立てて招く',
            effect: {
              deed: '書を送って招くも、応じられず',
              renown: 5,
            },
          },
        ],
      },
      {
        id: 'as_zhugeliang',
        when: (c) => c.officerId === 'zhugeliang',
        text:
          '三度目の客が来た。雪の中を、歩いて。\n' +
          '兄は呉に仕えている。曹操なら、いくらでも席がある。\n' +
          '——この、城も持たない男を選ぶか。',
        choices: [
          {
            label: '草廬を出て、この人に仕える',
            historical: true,
            effect: {
              deed: '草廬を出でて劉備に仕う',
              flags: { 'joined:ev_sangu': true },
              renown: 40,
              virtue: 20,
              joinFaction: 'liubei',
            },
          },
          {
            label: '断って、隆中に留まる',
            effect: {
              deed: '仕官を断り、田を耕して過ごす',
              renown: -20,
              virtue: 5,
            },
          },
          {
            label: '曹操のもとへ行く',
            effect: {
              deed: '許都に赴き、曹操に仕う',
              flags: { 'served:caocao': true },
              renown: 30,
              joinFaction: 'caocao',
            },
          },
        ],
      },
    ],
  },
];

export default events;
