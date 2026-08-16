/**
 * 暦。
 *
 * 同じマップの中を歩くだけでは時は進まない（歩き回るのが苦にならないように）。
 * 州をまたぐ移動と、討伐や修練といった行動が日を食う。
 */

export interface CalendarDate {
  year: number;
  /** 1〜12。 */
  month: number;
  /** 1〜30。ひと月は30日として扱う。 */
  day: number;
}

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;

/** 中国風の月名。表示に使う。 */
const MONTH_NAME = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

export function makeDate(year: number, month = 1, day = 1): CalendarDate {
  return { year, month, day };
}

/** 日数を進める。年が変わったら true を返す（史実の適用はそこで走らせる）。 */
export function advanceDays(date: CalendarDate, days: number): { yearsPassed: number } {
  let total = date.day + days;
  let month = date.month;
  let year = date.year;

  while (total > DAYS_PER_MONTH) {
    total -= DAYS_PER_MONTH;
    month++;
    if (month > MONTHS_PER_YEAR) {
      month = 1;
      year++;
    }
  }

  const yearsPassed = year - date.year;
  date.day = total;
  date.month = month;
  date.year = year;
  return { yearsPassed };
}

export function formatDate(date: CalendarDate): string {
  return `${date.year}年 ${MONTH_NAME[date.month - 1] ?? `${date.month}月`}`;
}

export function formatFull(date: CalendarDate): string {
  return `${date.year}年 ${MONTH_NAME[date.month - 1] ?? `${date.month}月`} ${date.day}日`;
}

/** 二つの日付の差（日数）。 */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  const toDays = (d: CalendarDate) =>
    d.year * MONTHS_PER_YEAR * DAYS_PER_MONTH + (d.month - 1) * DAYS_PER_MONTH + d.day;
  return toDays(b) - toDays(a);
}

/** 移動や行動にかかる日数の目安。 */
export const COST = {
  /** 隣の郡へ（同じ州の中）。 */
  shortTravel: 3,
  /** 州をまたぐ。 */
  crossProvince: 12,
  /** 町に入って用を足す。 */
  visit: 1,
  /** 賊の討伐。 */
  campaign: 20,
  /** 徴兵・調練など、腰を据えた行動。 */
  action: 30,
} as const;
