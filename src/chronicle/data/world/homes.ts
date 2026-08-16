/**
 * 勢力の本拠。
 *
 * 「どこから世を渡り始めるか」と「その勢力の者はどの町に立っているか」を引く。
 *
 * 「この城はいま誰のものか」は control.ts が持つ（一つの城が主を変えていくので、
 * 一対一の表では書けない）。ここは勢力から城への向き**だけ**を受け持つ。
 */

export const HOME_CITY: Record<string, string> = {
  han: 'luoyang',
  yellowturban: 'ye',
  dongzhuo: 'changan',
  lvbu: 'xiapi',
  yuanshao: 'ye',
  yuanshu: 'shouchun',
  caocao: 'puyang',
  wei: 'xuchang',
  liubei: 'zhuo',
  shu: 'chengdu',
  sunjian: 'jianye',
  sunce: 'jianye',
  wu: 'jianye',
  liubiao: 'xiangyang',
  liuzhang: 'chengdu',
  gongsunzan: 'ji_city',
  matengs: 'tianshui',
  nanman: 'jiangling',
  jin: 'luoyang',
  ronin: 'luoyang',
};

export function homeCityOf(factionId: string): string {
  return HOME_CITY[factionId] ?? 'luoyang';
}
