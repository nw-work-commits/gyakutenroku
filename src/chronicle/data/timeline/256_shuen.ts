/**
 * 甘露元年〜咸寧五年（256〜279）。終わりまでの二十四年。
 *
 * ここは年表がほとんど空いていた。256から279のあいだに事件が三つしか無く、
 * 姜維や羊祜で始めた者は、ただ地図を往復するだけの二十年を過ごすことになる。
 *
 * この時代の戦は、ほとんどが「もう手遅れだと分かっている者」の戦である。
 * 姜維は国力の尽きた蜀で九度出て、羊祜は十年かけて呉を攻めずに備え、
 * 陸抗は主君に見放されながら西陵を守った。勝ち負けより、
 * **見込みのない務めをどう果たすか**が問われる場面ばかりになる。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_duangu',
    year: 256,
    name: '段谷の戦い',
    weight: 4,
    factions: ['shu', 'wei'],
    record: '姜維、段谷にて鄧艾に大敗す。約した胡済は来たらず、蜀の兵は星散す',
    aftermath: {
      news: '姜維、段谷に敗る。蜀の精鋭、この一戦で失わる',
    },
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '祁山へ出ると決めた。胡済の軍が上邽で合流する手はずである。\n' +
          '——だが、約の日が来ても、胡済は現れない。\n\n' +
          '目の前には鄧艾。背後に退路はあるが、退けば九度目の北伐も空に終わる。',
        choices: [
          {
            label: '来ぬ味方は待たぬ。このまま当たる',
            historical: true,
            effect: {
              deed: '段谷にて鄧艾と当たる',
              flags: { 'joined:ev_duangu': true },
              battle: { enemies: ['dengai'], escapable: true },
              renown: 15,
              troops: -400,
            },
          },
          {
            label: '兵を退く。この兵は代えが利かない',
            effect: {
              deed: '段谷にて兵を退き、蜀の精鋭を残す',
              flags: { 'joined:ev_duangu': true, 'kept:shu_army': true },
              renown: -10,
              virtue: 10,
            },
          },
          {
            label: '責を負って自ら位を下げる',
            historical: true,
            effect: {
              deed: '敗戦の責を負い、自ら後将軍に降る',
              flags: { 'joined:ev_duangu': true },
              renown: 10,
              virtue: 25,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '鄧艾は言った。「姜維は必ず出てくる。武城山に拠って待てばよい」\n' +
          '——果たして蜀軍は来た。しかも、味方を待つ気配がある。',
        choices: [
          {
            label: '鄧艾に従って迎え撃つ',
            historical: true,
            effect: {
              deed: '段谷にて姜維を破る',
              flags: { 'joined:ev_duangu': true },
              battle: { enemies: ['jiangwei'], escapable: true },
              renown: 35,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_zhugedan',
    year: 257,
    name: '諸葛誕の乱',
    weight: 4,
    factions: ['wei', 'wu'],
    record: '諸葛誕、寿春に拠って司馬氏に叛す。呉に援を請うも、翌年城陥ちて誅さる',
    aftermath: {
      news: '寿春の乱、鎮まる。淮南に三たび挙がった旗は、これで絶えた',
    },
    scenes: [
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '王淩、毌丘倹に続いて三度目である。寿春の諸葛誕が兵を挙げた。\n' +
          '曹氏の魏はもう名ばかりで、討つ側に立てば司馬氏の臣となる。\n\n' +
          '——どちらが「魏」なのか、もう誰にも分からない。',
        choices: [
          {
            label: '司馬昭に従って寿春を囲む',
            historical: true,
            effect: {
              deed: '寿春を囲み、諸葛誕を討つ',
              flags: { 'joined:ev_zhugedan': true, 'served:sima': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 30,
            },
          },
          {
            label: '諸葛誕に加わる。魏の臣は曹氏の臣である',
            effect: {
              deed: '寿春に入り、曹氏のために旗を挙げる',
              flags: { 'joined:ev_zhugedan': true, 'loyal:cao': true },
              battle: { enemies: ['simazhao'], escapable: true },
              renown: 35,
              virtue: 30,
            },
          },
          {
            label: 'どちらにも与しない',
            effect: {
              deed: '淮南の乱に与せず',
              flags: { 'joined:ev_zhugedan': true },
              virtue: -5,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '寿春から使者が来た。諸葛誕が援を請うている。\n' +
          '淮南を得れば長江の北に足がかりができる。だが、\n' +
          '差し向けた兵は寿春の城に閉じ込められることにもなる。',
        choices: [
          {
            label: '援軍を出す',
            historical: true,
            effect: {
              deed: '寿春へ援軍を率いる',
              flags: { 'joined:ev_zhugedan': true },
              battle: { enemies: ['simazhao'], escapable: true },
              renown: 25,
            },
          },
          {
            label: '出さない。呉の兵を魏の内輪もめに費やすことはない',
            effect: {
              deed: '寿春への援軍に反対する',
              flags: { 'joined:ev_zhugedan': true },
              renown: 5,
              virtue: -5,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_sunchen',
    year: 258,
    name: '孫綝の誅殺',
    weight: 3,
    factions: ['wu'],
    record: '孫綝、幼帝孫亮を廃して孫休を立つ。孫休、その年のうちに孫綝を誅す',
    aftermath: {
      news: '呉の権臣孫綝、誅さる。帝が臣を斬り返した',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '孫綝は帝を廃し、意に沿う者を立てた。だがその新帝が動いた。\n' +
          '「臘の宴に招け」——ただそれだけの命である。\n\n' +
          '孫綝は来るだろうか。来れば、その場で斬られる。',
        choices: [
          {
            label: '帝の側に立ち、宴の座を用意する',
            historical: true,
            effect: {
              deed: '孫綝誅殺の謀に加わる',
              flags: { 'joined:ev_sunchen': true },
              renown: 30,
              virtue: 5,
            },
          },
          {
            label: '孫綝に危うさを告げる',
            effect: {
              deed: '孫綝に宴の危うきを告ぐ',
              flags: { 'joined:ev_sunchen': true, 'warned:sunchen': true },
              renown: 10,
              virtue: -10,
            },
          },
          {
            label: '関わらない。どちらが勝っても呉は弱る',
            effect: {
              deed: '呉の内訌に与せず',
              flags: { 'joined:ev_sunchen': true },
              virtue: 5,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_tazhong',
    year: 262,
    name: '沓中の屯田',
    weight: 3,
    factions: ['shu'],
    record: '姜維、宦官黄皓を憚りて成都に還らず、沓中に屯田して兵を養う',
    aftermath: {
      news: '蜀の大将軍、都に還らず。国の守りは、前線に偏った',
    },
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '黄皓が帝の耳を握っている。姜維を退けて閻宇を代えようという話まで出た。\n' +
          '大将軍は成都に還らず、沓中で麦を蒔いている。\n\n' +
          '——都に居場所の無い将は、国境で兵を養うほかない。\n' +
          'だが、そのぶん漢中の守りは薄くなる。',
        choices: [
          {
            label: '沓中に留まる。都に戻れば命が危うい',
            historical: true,
            effect: {
              deed: '沓中に屯田して兵を養う',
              flags: { 'joined:ev_tazhong': true, 'left:chengdu': true },
              renown: 10,
              troops: 300,
            },
          },
          {
            label: '都へ還り、黄皓を除く',
            effect: {
              deed: '成都に還り、黄皓を除かんとす',
              flags: { 'joined:ev_tazhong': true, 'struck:huanghao': true },
              renown: 30,
              virtue: 10,
            },
          },
          {
            label: '漢中の守りを厚くしておく',
            effect: {
              deed: '漢中の囲みを固め、陽平関に兵を置く',
              flags: { 'joined:ev_tazhong': true, 'held:hanzhong': true },
              renown: 15,
              virtue: 10,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_zhonghui',
    year: 264,
    name: '鍾会の乱',
    weight: 5,
    factions: ['wei', 'shu'],
    record: '鍾会、成都に拠って叛し、姜維これに与す。事漏れて乱軍の中に二人とも死す',
    aftermath: {
      news: '成都に乱。鍾会も姜維も、乱兵の中で死んだ',
    },
    scenes: [
      {
        id: 'as_shu',
        when: (c) => c.factionId === 'shu',
        text:
          '国は降った。だが姜維は剣を捨てず、鍾会に取り入っている。\n' +
          '「願わくは陛下、数日の辱めを忍びたまえ」——後主に密書を送ったという。\n\n' +
          '魏の将を叛かせ、その混乱から蜀を建て直す。\n' +
          '——成る見込みは、ほとんど無い。',
        choices: [
          {
            label: '姜維に従う。万に一つでも社稷が戻るなら',
            historical: true,
            effect: {
              deed: '成都の乱に加わり、漢の再興を図る',
              flags: { 'joined:ev_zhonghui': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 45,
              virtue: 35,
            },
          },
          {
            label: '止める。もう人が死ぬだけだ',
            effect: {
              deed: '成都の謀を止め、これ以上の死を避ける',
              flags: { 'joined:ev_zhonghui': true, 'stopped:zhonghui': true },
              renown: 15,
              virtue: 25,
              aftermath: { spares: ['jiangwei'] },
            },
          },
          {
            label: '鄧艾の側に報せる',
            effect: {
              deed: '鍾会の叛意を魏に告げる',
              flags: { 'joined:ev_zhonghui': true },
              renown: 25,
              virtue: -25,
            },
          },
        ],
      },
      {
        id: 'as_wei',
        when: (c) => c.factionId === 'wei',
        text:
          '鍾会が蜀の兵を手に入れ、成都で兵を集めている。\n' +
          '鄧艾はすでに檻車で送られた。次は誰の番か分からない。\n\n' +
          '——城の外には、まだ十万の魏兵がいる。',
        choices: [
          {
            label: '兵をまとめて鍾会を討つ',
            historical: true,
            effect: {
              deed: '成都にて鍾会を討つ',
              flags: { 'joined:ev_zhonghui': true },
              battle: { enemies: ['zhonghui', 'jiangwei'], escapable: true },
              renown: 40,
            },
          },
          {
            label: '鍾会に付く。天下は取れるかもしれない',
            effect: {
              deed: '鍾会に与して蜀に拠る',
              flags: { 'joined:ev_zhonghui': true },
              battle: { enemies: ['general', 'general'], escapable: true },
              renown: 35,
              virtue: -20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_sunhao',
    year: 264,
    name: '孫皓の即位',
    weight: 3,
    factions: ['wu'],
    record: '孫休崩じ、孫皓立つ。はじめ明主と称されしが、ほどなく苛政に転ず',
    aftermath: {
      news: '呉に新帝立つ。江東の最後の主である',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '蜀が滅んだ。呉に残された時は、もう長くない。\n' +
          '幼い太子を措いて、二十三の孫皓が立った。\n' +
          '濮陽興と張布が推した人である。\n\n' +
          '——後にこの二人は、その孫皓に殺される。',
        choices: [
          {
            label: '新帝を輔け、呉を保つ',
            historical: true,
            effect: {
              deed: '孫皓を輔けて呉の政に立つ',
              flags: { 'joined:ev_sunhao': true },
              renown: 25,
              virtue: 5,
            },
          },
          {
            label: '幼主を立てるべきだと諌める',
            effect: {
              deed: '孫皓の擁立に異を唱える',
              flags: { 'joined:ev_sunhao': true, 'opposed:sunhao': true },
              renown: 15,
              virtue: 20,
            },
          },
          {
            label: '兵を握っておく。政は当てにならない',
            effect: {
              deed: '都の政に近づかず、兵を手元に置く',
              flags: { 'joined:ev_sunhao': true },
              troops: 500,
              virtue: -5,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yanghu_jing',
    year: 269,
    name: '羊祜、荊州に鎮す',
    weight: 3,
    factions: ['jin', 'wu'],
    record: '羊祜、都督荊州諸軍事となる。以後十年、攻めずして呉の民心を得たり',
    aftermath: {
      news: '晋の羊祜、荊州に鎮す。境の民は、その名を敬んで呼んだ',
    },
    scenes: [
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '荊州へ遣わされた。呉を伐つための備えである。\n' +
          '羊祜のやり方は変わっていた。境で獲った獲物に呉の矢が立っていれば返し、\n' +
          '呉の兵が降れば帰りたい者は帰らせ、田を刈れば絹で購う。\n\n' +
          '「呉を取るのは十年後でよい。人を取るのは今日でよい」',
        choices: [
          {
            label: '羊祜に倣う。境の民を敵にしない',
            historical: true,
            effect: {
              deed: '荊州の境にて信を以て呉の民に接す',
              flags: { 'joined:ev_yanghu_jing': true, 'trust:border': true },
              renown: 25,
              virtue: 35,
            },
          },
          {
            label: '今すぐ攻める。備えなど整うことはない',
            effect: {
              deed: '荊州より呉を攻める',
              flags: { 'joined:ev_yanghu_jing': true },
              battle: { enemies: ['lukang'], escapable: true },
              renown: 20,
              virtue: -10,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '対岸に羊祜が来た。攻めてこない。\n' +
          'それどころか、こちらの負傷兵を手当てして返してくる。\n\n' +
          '陸抗は言った。「彼が徳を専らにし、我が暴を専らにすれば、\n' +
          '　戦わずして負ける。境を侵すな」',
        choices: [
          {
            label: '陸抗に従い、境を犯さない',
            historical: true,
            effect: {
              deed: '羊祜に対して信を以て応ずる',
              flags: { 'joined:ev_yanghu_jing': true, 'trust:border': true },
              renown: 25,
              virtue: 35,
            },
          },
          {
            label: '油断を突く。敵は敵である',
            effect: {
              deed: '晋の陣を襲う',
              flags: { 'joined:ev_yanghu_jing': true },
              battle: { enemies: ['yanghu'], escapable: true },
              renown: 15,
              virtue: -25,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_sunhao_beifa',
    year: 271,
    name: '孫皓の北伐',
    weight: 3,
    factions: ['wu'],
    record: '孫皓、大軍を率いて北へ出づ。道嶮しく糧尽き、兵怨みて還る',
    aftermath: {
      news: '呉帝の北伐、成らず。兵は道半ばで引き返した',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '「荊州に王気あり」という童謡を真に受けて、帝が自ら出た。\n' +
          '後宮も御物も引き連れての大行軍である。\n\n' +
          '雪の中、車を挽く兵が凍えて倒れていく。\n' +
          '「陛下が捕らわれれば、我らはそれで楽になる」——そう囁く者まで出た。',
        choices: [
          {
            label: '諌めて引き返させる',
            historical: true,
            effect: {
              deed: '帝を諌めて北伐を止める',
              flags: { 'joined:ev_sunhao_beifa': true },
              renown: 20,
              virtue: 25,
            },
          },
          {
            label: '黙って従う。諌めれば斬られる',
            effect: {
              deed: '帝の北伐に黙して従う',
              flags: { 'joined:ev_sunhao_beifa': true },
              renown: 5,
              virtue: -15,
              troops: -200,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_lukang_dies',
    year: 274,
    name: '陸抗の遺言',
    weight: 4,
    factions: ['wu'],
    record: '陸抗没す。死に臨みて「西陵・建平は国の藩表なり」と上疏す',
    aftermath: {
      news: '陸抗没す。呉の西の壁が、ここで失われた',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '陸遜の子が逝く。二年前に西陵を取り返した、あの人である。\n' +
          '最後の上疏はこうだった。\n\n' +
          '「西陵と建平は国の藩表であり、上流にあって敵と二千里を接する。\n' +
          '　もし此処を失えば、江南はもはや我らのものではない。\n' +
          '　どうか八万の兵を、この地に。」\n\n' +
          '——帝は、この上疏を容れなかった。',
        choices: [
          {
            label: '遺言のとおり、西の守りに就く',
            historical: false,
            effect: {
              deed: '陸抗の遺言に従い、西陵の守りに就く',
              flags: { 'joined:ev_lukang_dies': true, 'held:xiling': true },
              renown: 25,
              virtue: 25,
              troops: 400,
            },
          },
          {
            label: '帝に上疏を容れるよう重ねて請う',
            effect: {
              deed: '陸抗の遺策を容れるよう重ねて請う',
              flags: { 'joined:ev_lukang_dies': true },
              renown: 20,
              virtue: 20,
            },
          },
          {
            label: '見送る。もはや誰が言っても同じだ',
            historical: true,
            effect: {
              deed: '陸抗を送り、その遺策の容れられぬを見る',
              flags: { 'joined:ev_lukang_dies': true },
              virtue: 5,
            },
          },
        ],
      },
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '対岸の陸抗が死んだ。羊祜が長く「呉に人あり」と言って攻めなかった、その人である。\n\n' +
          '——壁が無くなった。',
        choices: [
          {
            label: '伐呉を上表する',
            historical: true,
            effect: {
              deed: '陸抗の死を機に、伐呉を上表す',
              flags: { 'joined:ev_lukang_dies': true, 'urged:conquest': true },
              renown: 25,
            },
          },
          {
            label: 'まだ早い。船が足りない',
            effect: {
              deed: '伐呉の時機を待ち、益州にて船を造る',
              flags: { 'joined:ev_lukang_dies': true, 'built:fleet': true },
              renown: 15,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_wangjun',
    year: 279,
    name: '王濬、船を下す',
    weight: 4,
    factions: ['jin', 'wu'],
    record: '晋、六道より呉を伐つ。王濬、益州にて造りし楼船を長江に下す',
    aftermath: {
      news: '晋の水軍、長江を下る。呉の鉄鎖も、炬火に焼き切られた',
    },
    scenes: [
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '羊祜が死ぬ前に遺した言葉のとおり、杜預が事を継いだ。\n' +
          '益州で七年かけて造った楼船が、ついに流れに乗る。\n\n' +
          '呉は江の底に鉄鎖を張り、鉄錐を沈めて待っているという。',
        choices: [
          {
            label: '筏を先に流し、炬火で鎖を焼く',
            historical: true,
            effect: {
              deed: '長江の鉄鎖を焼き切り、水路を開く',
              flags: { 'joined:ev_wangjun': true },
              renown: 40,
            },
          },
          {
            label: '陸から攻める。水は呉の庭である',
            effect: {
              deed: '陸路より荊州へ攻め入る',
              flags: { 'joined:ev_wangjun': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 25,
            },
          },
        ],
      },
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '上流から船が下ってくる。数えきれない。\n' +
          '鉄鎖は焼かれ、鉄錐は筏に持って行かれた。\n\n' +
          '——陸抗が「八万を西に」と言ったのは、五年前のことである。',
        choices: [
          {
            label: '江上に出て迎え撃つ',
            historical: true,
            effect: {
              deed: '長江にて晋の水軍を迎え撃つ',
              flags: { 'joined:ev_wangjun': true },
              battle: { enemies: ['general', 'general'], escapable: true },
              renown: 30,
              virtue: 15,
            },
          },
          {
            label: '建業の守りを固める',
            effect: {
              deed: '建業に退いて城を固める',
              flags: { 'joined:ev_wangjun': true, 'held:jianye': true },
              renown: 15,
              troops: -200,
            },
          },
          {
            label: '降を勧める。これ以上は民が死ぬだけだ',
            effect: {
              deed: '降を勧め、江東の民を戦火から遠ざける',
              flags: { 'joined:ev_wangjun': true, 'urged:surrender': true },
              renown: 5,
              virtue: 20,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_wu_raids',
    year: 268,
    name: '呉の三道出撃',
    weight: 3,
    factions: ['wu', 'jin'],
    record: '呉、江夏・襄陽・合肥の三道に兵を出す。いずれも利あらずして還る',
    aftermath: {
      news: '呉、三道より晋を衝くも、いずれも実らず',
    },
    scenes: [
      {
        id: 'as_wu',
        when: (c) => c.factionId === 'wu',
        text:
          '晋が立ってから三年。こちらから動かねば、動かれる番が来る。\n' +
          '施績は江夏へ、丁奉は合肥へ、万彧は襄陽へ。\n\n' +
          '——だが対岸には羊祜がいる。備えは、こちらより厚い。',
        choices: [
          {
            label: '三道の一つを率いて出る',
            historical: true,
            effect: {
              deed: '晋の境へ兵を出す',
              flags: { 'joined:ev_wu_raids': true },
              battle: { enemies: ['yanghu'], escapable: true },
              renown: 20,
            },
          },
          {
            label: '出兵に反対する。国力が持たない',
            effect: {
              deed: '出兵を諌め、民を休ませるよう請う',
              flags: { 'joined:ev_wu_raids': true },
              renown: 10,
              virtue: 20,
            },
          },
        ],
      },
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '呉が三道から出てきた。羊祜は慌てない。\n' +
          '「彼らは長く保てぬ。守っていれば、勝手に還る」\n\n' +
          '——実際、そのとおりになる。',
        choices: [
          {
            label: '守りを固めて待つ',
            historical: true,
            effect: {
              deed: '呉の三道の攻めを守り切る',
              flags: { 'joined:ev_wu_raids': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 25,
            },
          },
          {
            label: '追撃する。今こそ江を渡る好機だ',
            effect: {
              deed: '退く呉軍を追って江へ迫る',
              flags: { 'joined:ev_wu_raids': true },
              battle: { enemies: ['lukang'], escapable: true },
              renown: 20,
              virtue: -5,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_tufa',
    year: 270,
    name: '禿髪樹機能の乱',
    weight: 3,
    factions: ['jin'],
    record: '禿髪樹機能、涼州に叛す。秦州刺史胡烈これに敗れて死す。乱は十年に及ぶ',
    aftermath: {
      news: '涼州に大乱。晋の兵は西に釘づけとなった',
    },
    scenes: [
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '西で鮮卑が叛いた。胡烈が討ちに出て、万斛堆で討たれた。\n\n' +
          '呉を伐つ話は、これでまた後回しになる。\n' +
          '羊祜は荊州で十年待っているが、朝廷の兵は西へ向かうばかりである。',
        choices: [
          {
            label: '西へ向かい、乱を鎮める',
            historical: true,
            effect: {
              deed: '涼州の乱を鎮めに向かう',
              flags: { 'joined:ev_tufa': true },
              battle: { enemies: ['general', 'officer'], escapable: true },
              renown: 30,
            },
          },
          {
            label: '西は捨て置き、呉を伐つべきだと説く',
            effect: {
              deed: '西を捨て、南を先にすべしと説く',
              flags: { 'joined:ev_tufa': true, 'urged:conquest': true },
              renown: 15,
              virtue: -10,
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_yanghu_shu',
    year: 276,
    name: '羊祜の上表',
    weight: 3,
    factions: ['jin'],
    record: '羊祜、呉を伐つべしと上表す。賈充ら異を唱え、議は容れられず',
    aftermath: {
      news: '晋の朝議、伐呉を容れず。羊祜の策は、机に留め置かれた',
    },
    scenes: [
      {
        id: 'as_jin',
        when: (c) => c.factionId === 'jin',
        text:
          '陸抗が死んで二年。羊祜は書を奉った。\n\n' +
          '「呉は孫皓の暴によって上下が離れております。いま伐てば取れます。\n' +
          '　もし孫皓が死んで賢主が立てば、長江を隔てた敵は百万の兵でも取れません」\n\n' +
          '——だが朝議は動かない。賈充は西の乱を理由に反対している。',
        choices: [
          {
            label: '羊祜に与して、伐呉を強く請う',
            historical: true,
            effect: {
              deed: '羊祜とともに伐呉を請う',
              flags: { 'joined:ev_yanghu_shu': true, 'urged:conquest': true },
              renown: 25,
              virtue: 10,
            },
          },
          {
            label: '西の乱が先だと説く',
            effect: {
              deed: '涼州の乱を先にすべしと説く',
              flags: { 'joined:ev_yanghu_shu': true },
              renown: 10,
            },
          },
          {
            label: '黙って船を造り続ける',
            effect: {
              deed: '議に加わらず、益州にて船を造り続ける',
              flags: { 'joined:ev_yanghu_shu': true, 'built:fleet': true },
              renown: 15,
              gold: -60,
            },
          },
        ],
      },
    ],
  },
];

export default events;
