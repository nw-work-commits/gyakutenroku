/** 戦死。関羽・張飛・呂布…もっとも数が多い型。 */

import type { FateArchetype } from '../../types';

const archetype: FateArchetype = {
  kind: 'battle',
  name: '戦死',
  description: '定められた戦場で討たれる。抗うには、行かないか、勝つか、退くか。',

  defaultEscape: (fate, officer) => {
    // 舞台が年表にある武将は、その戦をどう扱ったかで決まる。
    if (fate.at) {
      return [
        {
          id: `${fate.at}:absent`,
          label: 'その戦場に赴かない',
          hint: '歴史が呼んでも、行かねば死なぬ。ただし名も上がらぬ。',
          test: (c) => !c.flags[`joined:${fate.at}`],
        },
        {
          id: `${fate.at}:survive`,
          label: 'その戦を勝つか、退くか',
          hint: '敗走は恥ではない。生きていれば次がある。',
          test: (c) => c.flags[`won:${fate.at}`] === true || c.flags[`retreated:${fate.at}`] === true,
        },
      ];
    }

    // 専用の場面を持たない武将は、名もなき小競り合いで死ぬ。
    // 抗う手は「そこに一兵卒として立っていない」こと。
    return [
      {
        id: `fate_${officer.id}:renown`,
        label: '名を上げ、一隊を任される身になる',
        hint: '前線に立たされるのは、名の無い者から。',
        test: (c) => c.renown >= 100,
      },
      {
        id: `fate_${officer.id}:troops`,
        label: '手勢を保っておく',
        test: (c) => c.troops >= 100,
      },
    ];
  },

  omen: (fate, officer, yearsLeft) => {
    if (yearsLeft <= 0) return `${officer.name}よ、その日が来た。`;
    if (yearsLeft === 1) return `翌年、${officer.name}は戦場に斃れる —— と、史書は言う。`;
    return `あと${yearsLeft}年。${fate.by ? `${fate.by}の手が待っている。` : '戦場が待っている。'}`;
  },
};

export default archetype;
