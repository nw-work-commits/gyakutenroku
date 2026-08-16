/**
 * 武将だけを集める層。
 *
 * registry.ts から切り出してあるのは、運命の型（data/fates/）が
 * 「誰に討たれるか」を名前からIDに直したいのに、registry を読むと
 * 循環参照になってしまうため。ここは年表も運命も読まないので安全に参照できる。
 */

import type { Officer } from './types';

const officerModules = import.meta.glob<{ default: Officer[] }>('./data/officers/*.ts', {
  eager: true,
});

export const ALL_OFFICERS: Officer[] = Object.values(officerModules).flatMap((m) => m.default);

export const OFFICERS: Record<string, Officer> = Object.fromEntries(
  ALL_OFFICERS.map((o) => [o.id, o]),
);

const BY_NAME: Record<string, string> = Object.fromEntries(
  ALL_OFFICERS.map((o) => [o.name, o.id]),
);

/**
 * 表示用の名前からIDを引く。
 * 「十常侍」「許貢の食客」のように武将として定義していない相手は null になる。
 */
export function officerIdByName(name: string | undefined): string | null {
  if (!name) return null;
  return BY_NAME[name] ?? null;
}
