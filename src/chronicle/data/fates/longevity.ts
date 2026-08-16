/**
 * 天寿。司馬懿・趙雲など、畳の上で死ぬ者。
 * 回避すべき運命が無いので、代わりに「何を成したか」が問われる型。
 */

import type { FateArchetype } from '../../types';

const archetype: FateArchetype = {
  kind: 'longevity',
  name: '天寿',
  description:
    '定められた死に方はない。抗う相手がいない代わりに、' +
    '「長く生きて、何を残したか」だけが記録される型。架空の人物も基本はこれ。',

  defaultEscape: (fate, officer) => [
    {
      id: `fate_${officer.id}:deeds`,
      label: '史書に残る働きをする',
      hint: '死は避けられる。だが、忘れられることは避けられない。',
      test: (c) => c.renown >= 350,
    },
    {
      id: `fate_${officer.id}:outlive`,
      label: 'その年を越えて生きる',
      test: (c) => c.year > fate.year,
    },
  ],

  omen: (_fate, officer, yearsLeft) => {
    if (yearsLeft <= 0) return `${officer.name}は、静かに目を閉じた。`;
    return '急ぐ理由はない。ただ、時は等しく過ぎていく。';
  },
};

export default archetype;
