/** 暗殺・内紛。董卓・孫策。強すぎる者が、身内か恨みに討たれる型。 */

import type { FateArchetype } from '../../types';

const archetype: FateArchetype = {
  kind: 'assassination',
  name: '暗殺',
  description: '戦場ではなく、身近な場所で討たれる。備えと人望だけが盾になる。',

  defaultEscape: (fate, officer) => [
    {
      id: `fate_${officer.id}:guard`,
      label: '身辺を固める',
      hint: '信の置ける者を、常にそばに置く。',
      test: (c) => c.roster.length >= 2 && c.flags['guarded'] === true,
    },
    {
      id: `fate_${officer.id}:mercy`,
      label: '恨みを買いすぎない',
      hint: '討たれる者には、討たれるだけの由来がある。',
      test: (c) => c.virtueDelta >= 15,
    },
    {
      id: `fate_${officer.id}:alone`,
      label: '単独で出歩かない',
      // guarded は「常に供を連れる」という生き方そのもの。年ごとの escort でも代用できる。
      test: (c) => c.flags['guarded'] === true || c.flags[`escort:${fate.year}`] === true,
    },
  ],

  omen: (_fate, officer, yearsLeft) => {
    if (yearsLeft <= 0) return `${officer.name}の背に、影が立った。`;
    if (yearsLeft === 1) return '近頃、視線を感じる。誰のものかは分からぬ。';
    return `あと${yearsLeft}年。敵は、外にいるとは限らない。`;
  },
};

export default archetype;
