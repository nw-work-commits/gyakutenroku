/**
 * 役柄。史料に能力値の無い武将は、ここのレンジから自動生成する。
 * 「名前が出るやつ全員」を扱うための要。新しい役柄はここに足す。
 */

import type { Role } from '../types';

const ROLE_LIST: Role[] = [
  // ------------------------------------------------ 兵・雑兵
  {
    id: 'soldier', name: '兵卒',
    range: { war: [18, 38], intel: [10, 28], lead: [8, 25], mobility: [25, 50], virtue: [20, 50] },
  },
  {
    id: 'bandit', name: '賊',
    range: { war: [30, 55], intel: [12, 32], lead: [18, 38], mobility: [35, 60], virtue: [8, 30] },
  },

  // ------------------------------------------------ 黄巾
  {
    id: 'yellowturban_mob', name: '黄巾兵',
    range: { war: [22, 45], intel: [10, 25], lead: [10, 28], mobility: [28, 50], virtue: [15, 40] },
  },
  {
    id: 'yellowturban_captain', name: '黄巾の頭目',
    range: { war: [48, 66], intel: [18, 38], lead: [35, 55], mobility: [40, 62], virtue: [12, 38] },
  },
  {
    id: 'yellowturban_leader', name: '黄巾の渠帥',
    range: { war: [58, 74], intel: [40, 68], lead: [55, 75], mobility: [45, 65], virtue: [30, 60] },
  },

  // ------------------------------------------------ 武
  {
    id: 'officer', name: '将校',
    range: { war: [55, 72], intel: [30, 55], lead: [45, 65], mobility: [45, 68], virtue: [35, 65] },
  },
  {
    id: 'general', name: '将軍',
    range: { war: [70, 85], intel: [45, 68], lead: [60, 80], mobility: [55, 75], virtue: [40, 72] },
  },
  {
    id: 'fierce_general', name: '猛将',
    range: { war: [86, 98], intel: [22, 50], lead: [55, 78], mobility: [60, 85], virtue: [25, 60] },
  },
  {
    id: 'veteran_general', name: '宿将',
    range: { war: [80, 93], intel: [55, 78], lead: [78, 92], mobility: [45, 68], virtue: [55, 82] },
  },

  // ------------------------------------------------ 智
  {
    id: 'strategist', name: '軍師',
    range: { war: [25, 50], intel: [82, 96], lead: [65, 88], mobility: [40, 62], virtue: [50, 80] },
  },
  {
    id: 'civil_official', name: '文官',
    range: { war: [15, 40], intel: [65, 85], lead: [40, 65], mobility: [30, 55], virtue: [50, 80] },
  },
  {
    id: 'advisor', name: '謀臣',
    range: { war: [30, 55], intel: [72, 90], lead: [50, 72], mobility: [40, 60], virtue: [30, 60] },
  },

  // ------------------------------------------------ 主
  {
    id: 'warlord', name: '群雄',
    range: { war: [55, 80], intel: [60, 85], lead: [70, 90], mobility: [55, 78], virtue: [45, 78] },
  },
  {
    id: 'ruler', name: '君主',
    range: { war: [60, 82], intel: [72, 92], lead: [80, 96], mobility: [60, 80], virtue: [60, 90] },
  },

  // ------------------------------------------------ その他
  {
    id: 'eunuch', name: '宦官',
    range: { war: [8, 25], intel: [55, 80], lead: [20, 45], mobility: [20, 40], virtue: [5, 25] },
  },
  {
    id: 'wanderer', name: '流浪の人',
    range: { war: [25, 60], intel: [25, 60], lead: [20, 50], mobility: [40, 70], virtue: [30, 70] },
  },
];

export const ROLES: Record<string, Role> = Object.fromEntries(
  ROLE_LIST.map((role) => [role.id, role]),
);

export function role(id: string): Role {
  const found = ROLES[id];
  if (!found) throw new Error(`未定義の役柄: ${id}`);
  return found;
}

export const ROLE_IDS = ROLE_LIST.map((r) => r.id);
