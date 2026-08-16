/** 三国志側のゲーム全体で1つだけ持ちまわす入れ物。 */

import { Input } from '../engine/input';
import { SceneManager } from '../engine/scene';
import { lowerBanners } from './data/factions';
import { homeCityOf } from './data/world/homes';
import { CITY_BY_ID } from './data/world/overworld';
import { allegianceOf, factionAt, officer as findOfficer } from './registry';
import { STARTING_FOOD, STARTING_GOLD } from './rules';
import { blankWorld, ensureWorld } from './systems/world';
import type { Chronicle, Officer } from './types';

const SAVE_KEY = 'gyakutenroku:save';

export class ChronicleApp {
  /** 進行中の記録。武将を選ぶまでは null。 */
  chronicle: Chronicle | null = null;
  /** 架空武将なら chronicle.custom を、実在なら登録簿を見る。 */
  officer: Officer | null = null;

  readonly scenes = new SceneManager();
  readonly input = new Input();

  /**
   * 初めの画面に戻す手。
   *
   * 場面どうしを上向きに参照させない（タイトル→世界地図→年代記と下りているので、
   * 年代記からタイトルを直に読むと輪になる）ために、
   * 起動側が入れておいた手をここから呼ぶ。
   */
  returnToTitle: (() => void) | null = null;

  begin(who: Officer, startYear?: number): void {
    // 前の一生で立てた旗を仕舞う。持ち越すと二人の君主が同じ名で並ぶ
    lowerBanners();
    const first = allegianceOf(who)[0]!;
    const year = startYear ?? first.from;
    // 途中の年から始めるときは、その年の所属で立たせる。
    // 一つ目の所属を使うと、256年の姜維が魏の側に立ってしまう
    const factionId = factionAt(who, year);
    const home = CITY_BY_ID[homeCityOf(factionId)] ?? CITY_BY_ID['luoyang']!;
    // 位も、その年までに就いていたものを拾う
    const seat = allegianceOf(who).filter((a) => a.from <= year).pop() ?? first;
    this.officer = who;
    this.chronicle = {
      officerId: who.id,
      custom: who.fictional ? who : undefined,
      year,
      month: 1,
      day: 1,
      x: home.x,
      y: home.y,
      where: 'world',
      dir: 'down',
      factionId,
      rankId: seat.rankId ?? first.rankId ?? 'commoner',
      renown: 0,
      virtueDelta: 0,
      troops: 0,
      // 兵は自分で募るところから。そのぶんの支度金だけを持たせる
      gold: STARTING_GOLD,
      // ひと月ぶんの糧。あとは主君から給わるか、市で贖うか、城から取る
      food: STARTING_FOOD,
      roster: [],
      deeds: [],
      flags: {},
      escaped: [],
      survived: false,
      alive: true,
      // ここから先だけが「まだ決まっていない世界」。前年までは史書のとおり。
      world: blankWorld(year),
    };
  }

  get state(): Chronicle {
    if (!this.chronicle) throw new Error('まだ武将を選んでいない');
    return this.chronicle;
  }

  get who(): Officer {
    if (!this.officer) throw new Error('まだ武将を選んでいない');
    return this.officer;
  }

  save(): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.chronicle));
      return true;
    } catch {
      return false;
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as Chronicle;
      if (!data?.officerId) return false;
      // 前の一生の旗を仕舞ってから、記録に残っている旗を立て直す
      lowerBanners();
      // 世界を持たない古いセーブは「そこまでは史実どおり」として引き継ぐ
      ensureWorld(data);
      this.chronicle = data;
      this.officer = data.custom ?? findOfficer(data.officerId);
      return true;
    } catch {
      return false;
    }
  }

  hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }
}
