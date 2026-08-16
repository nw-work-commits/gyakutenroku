/**
 * 事件が起きる場所。
 *
 * 「誰がどの事件に居合わせるか」を、所属だけでなく**位置**で決めるための表。
 * ここに書いていない事件は天下全体の出来事として、どこにいても関われる。
 *
 * 年表ファイル側に書かず一箇所にまとめてあるのは、
 * 地理の割り当ては地図を見ながらまとめて直したくなるため。
 */

export const EVENT_PROVINCE: Record<string, string> = {
  // 184 黄巾（蜂起そのものは天下一斉なので場所を持たせない）
  ev_daxing: 'you',
  ev_qingzhou: 'qing',
  ev_guangzong: 'ji',
  ev_xiaquyang: 'ji',
  ev_beihai: 'qing',

  // 189〜192 洛陽と長安
  ev_shichangshi: 'si',
  ev_dingyuan: 'si',
  ev_feidi: 'si',
  ev_coalition: 'si',
  ev_hulaoguan: 'si',
  ev_luoyang_fire: 'si',
  ev_diaochan: 'si',
  ev_lijue: 'si',
  ev_xiangyang: 'jing',

  // 193〜199 群雄割拠
  ev_xuzhou: 'xu',
  ev_yanzhou: 'yan',
  ev_yingemperor: 'si',
  ev_wancheng: 'yu',
  ev_xiapi: 'xu',
  ev_baimenlou: 'xu',
  ev_yijing: 'you',

  // 200〜207 官渡と河北平定
  ev_yidaizhao: 'si',
  ev_baima: 'yan',
  ev_yanjin: 'yan',
  ev_guandu: 'yan',
  ev_sunce_hunt: 'yang',
  ev_sangu: 'jing',
  ev_runan: 'yu',
  ev_yuanshao_dies: 'ji',
  ev_ye_falls: 'ji',
  ev_bailangshan: 'you',

  // 208〜211 赤壁と潼関
  ev_changban: 'jing',
  ev_chibi: 'jing',
  ev_huarongdao: 'jing',
  ev_mateng: 'si',
  ev_tongguan: 'si',

  // 209〜218 荊州・漢中・魏王
  ev_sijun: 'jing',
  ev_zhouyu_dies: 'jing',
  ev_ruxukou: 'yang',
  ev_weiwang: 'si',
  ev_hanzhong: 'yi',

  // 214〜219 益州と荊州
  ev_luofeng: 'yi',
  ev_chengdu: 'yi',
  ev_hefei: 'yang',
  ev_dingjunshan: 'yi',
  ev_fancheng: 'jing',
  ev_maicheng: 'jing',

  // 220〜223 三国鼎立と夷陵
  ev_han_ends: 'si',
  ev_zhangfei_death: 'yi',
  ev_yiling: 'jing',
  ev_baidicheng: 'yi',

  // 224〜233 三国鼎立
  ev_guangling: 'yang',
  ev_caopi_dies: 'si',
  ev_wu_emperor: 'yang',

  // 225〜234 南征と北伐
  ev_nanman: 'jiao',
  ev_chushibiao: 'yi',
  ev_jieting: 'liang',
  ev_mumendao: 'liang',
  ev_wuzhangyuan: 'si',

  // 235〜248 空白の十四年
  ev_liaodong: 'you',
  ev_caorui_dies: 'si',
  ev_xingshi: 'yi',
  ev_simayi_feigns: 'si',

  // 249〜280 三国の終わり
  ev_sunquan_dies: 'yang',
  ev_caomao: 'si',
  ev_xiling: 'jing',
  ev_yanghu_dies: 'jing',
  ev_gaopingling: 'si',
  ev_jiangwei_beifa: 'yi',
  ev_shu_falls: 'yi',
  ev_jin_founded: 'si',
  ev_wu_falls: 'yang',

  // 241〜245 三国のあいだの、空いていた年
  ev_jiangwan: 'yi',
  ev_erguan: 'yang',

  // 256〜279 終わりまでの二十四年
  ev_duangu: 'liang',
  ev_zhugedan: 'yang',
  ev_sunchen: 'yang',
  ev_tazhong: 'yi',
  ev_zhonghui: 'yi',
  ev_sunhao: 'yang',
  ev_yanghu_jing: 'jing',
  ev_sunhao_beifa: 'yang',
  ev_lukang_dies: 'jing',
  ev_wu_raids: 'jing',
  ev_tufa: 'liang',
  ev_yanghu_shu: 'si',
  ev_wangjun: 'jing',
};

/** その事件はどの州で起きるか。天下全体の出来事なら null。 */
export function placeOf(eventId: string): string | null {
  return EVENT_PROVINCE[eventId] ?? null;
}
