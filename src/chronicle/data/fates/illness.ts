/**
 * 病没・過労。諸葛亮・周瑜・郭嘉。
 * 敵が「時間」そのものになる唯一の型で、働くほど死期が早まる。
 */

import type { FateArchetype } from '../../types';

/** 無理を重ねた回数が、そのまま寿命を削る。 */
export function strainOf(flags: Record<string, boolean>): number {
  return Object.keys(flags).filter((key) => key.startsWith('strain:')).length;
}

const archetype: FateArchetype = {
  kind: 'illness',
  name: '病没',
  description:
    '刃ではなく身体に斃れる。急げば死期は早まり、休めば遠のく。' +
    '「何も成さずに長く生きる」か「成して早く死ぬ」かを、常に選ばされる型。',

  defaultEscape: (fate, officer) => [
    {
      id: `fate_${officer.id}:rest`,
      label: '無理を重ねない',
      hint: '急いだ回数だけ、その日が早く来る。',
      test: (c) => strainOf(c.flags) <= 2,
    },
    {
      id: `fate_${officer.id}:physician`,
      label: '良医を得る',
      test: (c) => c.flags['physician'] === true,
    },
    {
      id: `fate_${officer.id}:successor`,
      label: '後を託せる者を育てる',
      hint: '死は避けられずとも、志は続く。',
      test: (c) => c.roster.length >= 3 && c.year >= fate.year - 2,
    },
  ],

  omen: (_fate, officer, yearsLeft) => {
    if (yearsLeft <= 0) return `${officer.name}は筆を置いた。灯が、細い。`;
    if (yearsLeft === 1) return '咳が止まらぬ。あと一年、と医者は言葉を濁した。';
    return `あと${yearsLeft}年。身体はもう、若くない。`;
  },
};

export default archetype;
