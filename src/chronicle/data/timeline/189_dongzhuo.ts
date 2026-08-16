/**
 * 中平六年（189）。宮中の火と、西涼の兵。
 * 呂布でプレイするなら、ここが最初の分かれ道になる（丁原を殺すか否か）。
 */

import type { HistoryEvent } from '../../types';

const events: HistoryEvent[] = [
  {
    id: 'ev_shichangshi',
    year: 189,
    name: '十常侍の乱',
    weight: 5,
    factions: ['han', 'dongzhuo', 'caocao', 'yuanshao'],
    record: '何進、宮中に誘い出されて斬らる。袁紹ら宦官二千余を尽く殺す',
    scenes: [
      {
        id: 'as_court',
        when: (c) => c.factionId === 'han',
        text:
          '大将軍が宮中へ召された。剣を帯びずに、ひとりで。\n' +
          '「罠です」と誰かが言った。大将軍は笑って行った。\n' +
          'しばらくして、門の内から悲鳴が上がった。',
        choices: [
          {
            label: '門を破って宦官を討つ',
            historical: true,
            effect: {
              deed: '宮門を破り、宦官を誅す',
              flags: { 'joined:ev_shichangshi': true, 'won:ev_shichangshi': true },
              battle: { enemies: ['zhangrang', 'eunuch'], escapable: false },
              renown: 35,
              virtue: -5,
            },
          },
          {
            label: '大将軍を止めておく',
            effect: {
              deed: '大将軍の宮中入りを諫めて止める',
              flags: { 'saved:hejin': true },
              renown: 20,
              virtue: 10,
            },
          },
          {
            label: '帝を連れて宮を脱する',
            effect: {
              deed: '混乱の中、幼帝を連れて宮を脱す',
              // 宦官の側から見れば、これは「帝を人質に逃げ延びる」ことでもある
              flags: { 'protected:emperor': true, 'retreated:ev_shichangshi': true },
              renown: 40,
              virtue: 12,
            },
          },
        ],
      },
      {
        id: 'as_outsider',
        when: (c) => c.factionId !== 'han',
        text:
          '洛陽の空が赤い。宮中で火の手が上がったという。\n' +
          '天子は行方知れず。都は主を失った。',
        choices: [
          {
            label: '兵を率いて都へ入る',
            historical: true,
            effect: {
              deed: '兵を率いて洛陽に入る',
              flags: { 'joined:ev_shichangshi': true },
              renown: 30,
            },
          },
          {
            label: '様子を見る',
            effect: { deed: '都の乱を遠くから眺める', renown: -5 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_dingyuan',
    year: 189,
    name: '赤兎馬',
    weight: 3,
    factions: ['han', 'dongzhuo', 'lvbu'],
    record: '呂布、義父丁原を斬り、董卓に降る',
    scenes: [
      {
        id: 'as_lvbu',
        when: (c) => c.officerId === 'lvbu',
        text:
          '李粛が酒を提げて来た。うしろに、赤い馬がいる。\n' +
          '「一日に千里を走ります」と男は言った。\n' +
          '「董公は、あなたのような方を待っておられる」\n\n' +
          '天幕の向こうで、丁原が眠っている。',
        choices: [
          {
            label: '丁原を斬り、董卓に降る',
            historical: true,
            effect: {
              deed: '義父丁原を斬り、董卓に降る',
              flags: { 'betrayed:dingyuan': true, 'joined:ev_dingyuan': true },
              renown: 40,
              virtue: -25,
              joinFaction: 'dongzhuo',
            },
          },
          {
            label: '馬だけ受け取り、話は断る',
            effect: {
              deed: '赤兎馬を受け取るも、義父を売らず',
              flags: { 'kept:dingyuan': true },
              renown: 15,
              virtue: 10,
            },
          },
          {
            label: '李粛を斬って丁原に差し出す',
            effect: {
              deed: '使者を斬り、董卓の誘いを退ける',
              flags: { 'kept:dingyuan': true, 'refused:dongzhuo': true },
              renown: 10,
              virtue: 22,
            },
          },
        ],
      },
      {
        id: 'as_witness',
        when: (c) => c.factionId === 'dongzhuo' || c.factionId === 'han',
        text:
          '并州の陣から、ひとりの武将が寝返ったという。\n' +
          '義父の首を提げて。手綱を握るのは、赤い馬。',
        choices: [
          {
            label: 'あの男を味方に引き入れる',
            historical: true,
            effect: {
              deed: '呂布を迎え入れる',
              flags: { 'favor:lvbu': true },
              renown: 20,
              virtue: -8,
            },
          },
          {
            label: '義父を殺す者は信じられぬ、と退ける',
            effect: { deed: '呂布を用いず、遠ざける', virtue: 8 },
          },
        ],
      },
    ],
  },

  {
    id: 'ev_feidi',
    year: 189,
    name: '廃立',
    weight: 4,
    factions: ['han', 'dongzhuo', 'caocao', 'yuanshao'],
    record: '董卓、少帝を廃して陳留王を立つ。異を唱えし者は席を蹴って去る',
    scenes: [
      {
        id: 'default',
        text:
          '広間に群臣が並んでいる。董卓が言った。\n' +
          '「今の天子は暗愚である。陳留王を立てる。異論のある者は」\n\n' +
          '誰も動かない。剣を鳴らす音だけがする。',
        choices: [
          {
            label: '黙って従う',
            historical: true,
            effect: { deed: '廃立の議に黙して従う', renown: 5, virtue: -10 },
          },
          {
            label: '声を上げて反対する',
            effect: {
              deed: '満座の中、董卓の廃立に異を唱える',
              flags: { 'defied:dongzhuo': true },
              renown: 35,
              virtue: 20,
            },
          },
          {
            label: '席を蹴って都を去る',
            effect: {
              deed: '職を捨てて洛陽を去る',
              flags: { 'defied:dongzhuo': true },
              renown: 20,
              virtue: 15,
              joinFaction: 'ronin',
            },
          },
        ],
      },
    ],
  },
];

export default events;
