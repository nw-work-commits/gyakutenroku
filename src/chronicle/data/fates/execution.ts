/** 処刑。呂布・陳宮など。敵に捕らわれ、斬られる。抗いかたは「人との関係」。 */

import { officerIdByName } from '../../lookup';
import type { EscapeCondition, FateArchetype } from '../../types';

const archetype: FateArchetype = {
  kind: 'execution',
  name: '処刑',
  description: '敗れて捕らわれ、首を落とされる。剣ではなく、徳と縁で抗う型。',

  defaultEscape: (fate, officer) => {
    const key = fate.at ?? `fate_${officer.id}`;
    // 「誰に」は表示用の名前で書かれているので、武将IDに直してからフラグを引く。
    // 「十常侍」のように武将として定義していない相手なら、この条件自体を出さない。
    const byId = officerIdByName(fate.by);

    const conditions: EscapeCondition[] = [
      {
        id: `${key}:mercy`,
        label: '斬る者に、斬れぬ理由を作る',
        hint: '徳が高ければ、勝者は殺すより使いたくなる。',
        test: (c) => c.virtueDelta >= 25 || c.flags[`spared:${key}`] === true,
      },
      {
        id: `${key}:escape`,
        label: 'そもそも捕らわれない',
        test: (c) => !c.flags[`captured:${key}`],
      },
    ];

    if (byId) {
      conditions.splice(1, 0, {
        id: `${key}:ally`,
        label: 'その者と、かつて縁を結んでおく',
        hint: `${fate.by}に一度でも情をかけていれば、話は変わる。`,
        test: (c) => c.flags[`favor:${byId}`] === true,
      });
    }
    return conditions;
  },

  omen: (fate, officer, yearsLeft) => {
    if (yearsLeft <= 0) return `${officer.name}は縄を打たれた。あとは、斬る者の心ひとつ。`;
    if (yearsLeft === 1) return `${fate.by ?? '誰か'}の前に引き出される日が、すぐそこにある。`;
    return `あと${yearsLeft}年。敵を増やしすぎるな。`;
  },
};

export default archetype;
