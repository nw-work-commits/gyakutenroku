/**
 * 世界地図を歩く画面。
 *
 * ここが「自由」を表す場所。史実は世界の側で勝手に進み、
 * その州にいるかどうかで居合わせるかが決まる。
 *
 * 一歩＝一日。だから移動そのものが時を食う。
 * 洛陽から成都まで歩けば、ふた月が過ぎている。
 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import {
  Menu,
  SCREEN_H,
  SCREEN_W,
  drawGauge,
  drawText,
} from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { abilitiesAt } from '../abilities';
import { FACTIONS } from '../data/factions';
import {
  CITIES,
  OVERWORLD_TILES,
  PROVINCE_BY_ID,
  WORLD_H,
  WORLD_W,
  cityAt,
  provinceAt,
} from '../data/world/overworld';
import { travelCost, worldTile } from '../data/world/terrain';
import { drawCamp, drawWorldTile } from './scenery';
import { townOf } from '../data/world/towns';
import { maxTroops, spoilsOf } from '../rules';
import {
  LAST_YEAR,
  advanceYear,
  agedOut,
  catchUpWorld,
  eventsThisYear,
  pending,
  rankName,
} from '../runner';
import { campsAt, foesOf, markCleared } from '../systems/bandits';
import type { BanditCamp } from '../systems/bandits';
import { advanceDays, formatDate } from '../systems/calendar';
import type { CalendarDate } from '../systems/calendar';
import { ensureWorld, provinceHolders, record, rulerNow, unifiedBy } from '../systems/world';
import type { Dir, WorldNews } from '../types';
import {
  foodPerMonth,
  monthsOfFood,
  settleUpkeep,
  stipendOf,
} from '../systems/provisions';
import { driftHearts, heartOf, partWith, setHeart, whoLeaves } from '../systems/hearts';
import { drawAvatar } from './avatar';
import { EndingScene } from './ending';
import { INK, panel } from './theme';
import { AnnalsScene } from './annals';
import { WarScene } from './battle';
import { EventScene } from './event';
import { FateScene } from './fate';
import { TownScene } from './town';

export const TILE = 24;
const MOVE_MS = 105;
/** 賊に襲われるまでの猶予（歩数）。 */
const ENCOUNTER_GRACE = 8;

const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export class WorldScene implements Scene {
  private fromX = 0;
  private fromY = 0;
  private moveT = 1;
  private walkPhase = 0;
  private banner = 0;
  private bannerText = '';
  private stepsSinceBattle = 0;
  private notice = '';
  private noticeColor: string = INK.jade;
  private noticeTimer = 0;
  /** 自分のいないところで起きたこと。ひとつずつ順に読み上げる。 */
  private newsQueue: WorldNews[] = [];

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    const c = this.app.state;
    this.fromX = c.x;
    this.fromY = c.y;
    this.moveT = 1;
    audio.playBgm('field');
    this.showBanner(provinceAt(c.x, c.y)?.name ?? '辺境');
    this.app.input.flush();
    this.catchUp();
  }

  onResume(): void {
    audio.playBgm('field');
    this.app.input.flush();
    // 戦から戻ったが、生きていないことがある
    if (this.checkClosed()) return;
    // 討伐から戻ってきたのなら、戦果の始末が先。年の報せはそのあとでよい
    if (this.settleSubjugation()) return;
    this.catchUp();
    this.checkYearEvents();
    // 分捕り品の一行は最後に出す。年の報せに上書きされては、取り分が分からない
    this.settleSkirmish();
  }

  /** 世界のほうを、いまの年に追いつかせる。 */
  private catchUp(): void {
    const fresh = catchUpWorld(this.app.state);
    // 城が動いたことと人が死んだことは、読み飛ばされると困る。
    // 何十年ぶんも一度に追いつくことがあるので、読み上げるのは新しいほうから。
    const worth = fresh.filter((n) => n.kind !== 'history');
    if (worth.length > 0) this.newsQueue.push(...worth.slice(-8));
  }

  private showBanner(text: string): void {
    this.bannerText = text;
    this.banner = 2000;
  }

  private say(text: string, color: string = INK.jade): void {
    this.notice = text;
    this.noticeColor = color;
    this.noticeTimer = 2600;
  }

  private static NEWS_COLOR: Record<WorldNews['kind'], string> = {
    history: INK.dim,
    divergence: INK.jade,
    death: INK.blood,
    seize: INK.water,
    ruin: INK.blood,
  };

  /** 溜まった報せを、間を空けて一つずつ流す。 */
  private tickNews(): void {
    if (this.noticeTimer > 0 || this.newsQueue.length === 0) return;
    const item = this.newsQueue.shift()!;
    this.say(`${item.year}年　${item.text}`, WorldScene.NEWS_COLOR[item.kind]);
  }

  // ------------------------------------------------------------ 判定

  private get date(): CalendarDate {
    const c = this.app.state;
    return { year: c.year, month: c.month, day: c.day };
  }

  private tileChar(x: number, y: number): string {
    return OVERWORLD_TILES[y]?.[x] ?? ' ';
  }

  private walkable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false;
    return worldTile(this.tileChar(x, y)).walkable;
  }

  // ------------------------------------------------------------ 更新

  update(dt: number, input: Input): void {
    if (this.banner > 0) this.banner -= dt;
    if (this.noticeTimer > 0) this.noticeTimer -= dt;
    this.tickNews();

    if (this.moveT < 1) {
      this.moveT = Math.min(1, this.moveT + dt / this.stepMs);
      this.walkPhase += dt;
      if (this.moveT >= 1) this.onArrive();
      return;
    }

    const c = this.app.state;
    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (this.choice) {
        this.handleChoice(key);
        return;
      }
      if (key === 'confirm') {
        this.interact();
        return;
      }
      if (key === 'cancel') {
        audio.sfx('cancel');
        this.app.scenes.push(new AnnalsScene(this.app));
        return;
      }
    }

    const dir = input.heldDirection();
    if (!dir) {
      this.walking = false;
      return;
    }
    this.walking = true;
    c.dir = dir as Dir;
    const [dx, dy] = DELTA[c.dir];
    const nx = c.x + dx;
    const ny = c.y + dy;
    if (!this.walkable(nx, ny)) {
      this.walkPhase += dt;
      this.walking = false;
      return;
    }
    this.fromX = c.x;
    this.fromY = c.y;
    const beforeProvince = provinceAt(c.x, c.y)?.id;
    c.x = nx;
    c.y = ny;
    this.moveT = 0;
    // 険しい土地は足取りも重い。日数の重さが動きにも出る
    this.stepMs = MOVE_MS * (0.75 + travelCost(this.tileChar(nx, ny)) * 0.4);
    this.crossed = beforeProvince !== provinceAt(nx, ny)?.id;
  }

  private crossed = false;
  /** 方向キーを押し続けているか。歩きの繋ぎ方を変える。 */
  private walking = false;
  /** いま踏み出している一歩にかける時間。険しい土地ほど遅い。 */
  private stepMs = MOVE_MS;

  /** 城市の上で戦も起きているときの二択。討伐の可否と戦果の始末もここを通る。 */
  private choice: { text: string; options: { label: string; value: string }[] } | null = null;
  private choiceMenu = new Menu([], 1);
  /** いま討ちに入っている砦。戦から戻ったときに戦果を数えるため。 */
  private raiding: BanditCamp | null = null;
  /** 落としたが、まだ戦果を分けていない砦。 */
  private spoilsFor: BanditCamp | null = null;

  private ask(text: string, options: { label: string; value: string }[]): void {
    this.choice = { text, options };
    this.choiceMenu.setItems(options);
  }

  private handleChoice(key: GameKey): void {
    if (key === 'cancel') {
      audio.sfx('cancel');
      this.choice = null;
      return;
    }
    if (key !== 'confirm') {
      if (this.choiceMenu.move(key)) audio.sfx('cursor');
      return;
    }
    const value = this.choiceMenu.selected?.value;
    this.choice = null;
    audio.sfx('confirm');

    if (value === 'town') {
      const city = cityAt(this.app.state.x, this.app.state.y);
      if (city) this.enterTown(city.id);
      return;
    }
    if (value === 'event') {
      const here = pending(this.app.state);
      if (here.length > 0) this.app.scenes.push(new EventScene(this.app, here[0]!));
      return;
    }
    if (value === 'raid') {
      if (this.app.state.troops <= 0) {
        this.say('兵が無くては、砦は落とせぬ。城市で兵を募るほかない。', INK.blood);
        return;
      }
      this.raid();
      return;
    }
    if (value?.startsWith('spoils:')) {
      this.takeSpoils(value.slice(7));
    }
  }

  // ------------------------------------------------------------ 討伐

  /** 賊の砦へ攻め込む。相手の頭数は先に決まっているので、逃げ場もある。 */
  private raid(): void {
    const camp = this.campHere();
    if (!camp) return;
    const { enemies, troops } = foesOf(camp);
    this.raiding = camp;
    audio.sfx('encounter');
    this.app.scenes.push(
      new WarScene(this.app, {
        enemies,
        escapable: true,
        eventName: camp.name,
        eventId: camp.id,
        foeTroops: troops,
        terrain: this.tileChar(camp.x, camp.y),
      }),
    );
  }

  /**
   * 討伐から戻ったときの始末。
   * 勝っていれば戦果の分け方を訊く。ここが「金の入り口」になる。
   */
  private settleSubjugation(): boolean {
    const camp = this.raiding;
    if (!camp) return false;
    this.raiding = null;

    const c = this.app.state;
    if (!c.flags[`won:${camp.id}`]) {
      this.say('砦は落ちなかった。賊はまだそこにいる。', INK.blood);
      return false;
    }

    markCleared(c, camp);
    this.campCache = null; // 討った砦は地図から消える
    this.spoilsFor = camp;
    const spoils = spoilsOf(camp.strength);
    this.ask(
      `${camp.name}を落とした。\n蓄え ${spoils.gold}金、降った者 ${spoils.captives}人。`,
      [
        { label: '降兵を召し抱える', value: 'spoils:keep' },
        { label: '兵は帰し、蓄えだけ取る', value: 'spoils:free' },
        { label: '蓄えを村に返す', value: 'spoils:give' },
      ],
    );
    return true;
  }

  /**
   * 戦果の分け方。
   * 兵が要るか、徳が要るか。序盤はほぼ必ず兵が欲しくなるので、
   * 徳を選ぶことがそのまま「何かを諦める」ことになる。
   */
  private takeSpoils(kind: string): void {
    const c = this.app.state;
    const camp = this.spoilsFor;
    if (!camp) return;
    this.spoilsFor = null;
    const spoils = spoilsOf(camp.strength);
    const room = Math.max(0, maxTroops(this.app.who, c) - c.troops);

    let gold = spoils.gold;
    let captives = spoils.captives;
    let virtue = 0;

    if (kind === 'keep') {
      virtue = -4; // 賊を兵にするのは、乱世では当たり前で、褒められはしない
    } else if (kind === 'free') {
      captives = Math.round(captives / 3); // それでも行き場のない者は残る
      virtue = 6;
    } else {
      captives = Math.round(captives / 3);
      gold = Math.round(gold / 4);
      virtue = 14;
    }

    const got = Math.min(captives, room);
    c.gold += gold;
    c.troops += got;
    c.renown += spoils.renown;
    c.virtueDelta += virtue;
    c.deeds.push({
      year: c.year,
      text: `${PROVINCE_BY_ID[camp.provinceId]?.name ?? ''}の${camp.name}を討つ`,
    });

    audio.sfx('gold');
    const parts = [`金 +${gold}`, got > 0 ? `兵 +${got}` : null, `名声 +${spoils.renown}`];
    if (virtue !== 0) parts.push(`徳 ${virtue > 0 ? '+' : ''}${virtue}`);
    this.say(parts.filter(Boolean).join('　'), INK.accent);
  }

  /** 一歩ぶんの移動が終わった瞬間。ここで一日が過ぎる。 */
  private onArrive(): void {
    const c = this.app.state;
    this.stepsSinceBattle++;

    const before = c.year;
    const date = this.date;
    // 一歩に食う日数は土地で違う。森も丘も、抜けるのに二日かかる
    const cost = travelCost(this.tileChar(c.x, c.y));
    advanceDays(date, cost);
    c.year = date.year;
    c.month = date.month;
    c.day = date.day;
    this.eat(cost);

    if (this.crossed) {
      const province = provinceAt(c.x, c.y);
      this.showBanner(province?.name ?? '辺境');
      this.crossed = false;
    }

    if (c.year !== before) {
      this.onNewYear();
      return;
    }
    this.checkEncounter();
  }

  /**
   * 日を送ったぶんの糧を食う。
   *
   * 一歩ごとに勘定すると小数が積もるので、端数は持ち越して月ごとに締める。
   * 「歩けば腹が減る」だけの話だが、これが無いと戦の前に必ず満兵まで
   * 休むのが常に正しくなり、時が資源にならない。
   */
  private eatDebt = 0;

  private eat(days: number): void {
    const c = this.app.state;
    this.eatDebt += days;
    if (this.eatDebt < 30) return;
    const settle = Math.floor(this.eatDebt / 30) * 30;
    this.eatDebt -= settle;
    const u = settleUpkeep(c, settle);
    // 主の徳のほうへ、心はゆっくり寄っていく
    driftHearts(c, settle / 30);
    this.partWithTheDisaffected();
    if (u.starved > 0) {
      // 食わせられぬ主のもとには、人も残らない
      for (const id of c.roster) setHeart(c, id, heartOf(c, id) - 6);
      this.say(`兵糧が尽きた。${u.starved} が陣を去った。`, INK.blood);
    } else if (u.paid > 0 && u.months >= 1) {
      // 俸禄は静かに入る。毎月言われても煩いので、報せるのは金が動いたときだけ
      this.say(`俸禄 +${u.paid}金　糧 -${u.ate}石`, INK.dim);
    }
  }

  /**
   * 心の尽きた者を送り出す。
   *
   * 斬るのではなく、去られるのである。世界の帳簿に死は刻まない——
   * その者は、どこかで生きて、いずれ別の旗の下に立つ。
   */
  private partWithTheDisaffected(): string[] {
    const c = this.app.state;
    const gone: string[] = [];
    for (const who of whoLeaves(c)) {
      partWith(c, who.id);
      gone.push(who.name);
      c.deeds.push({ year: c.year, text: `${who.name}に去られる`, diverged: true });
      record(ensureWorld(c), {
        year: c.year,
        kind: 'divergence',
        text: `${who.name}、${this.app.who.name}のもとを去る`,
      });
    }
    if (gone.length > 0) audio.sfx('cancel');
    return gone;
  }

  /** 年が改まった。史実が世界を動かす。 */
  private onNewYear(): void {
    const c = this.app.state;
    this.showBanner(`${c.year}年`);
    audio.sfx('door');
    this.catchUp();
    if (this.checkClosed()) return;
    this.checkYearEvents();
  }

  /**
   * 一生が閉じていないか。
   *
   * これまで、討たれても世は終わらず、280年に達しても何も起きなかった。
   * 終わりの無い遊びには目指す先も無いので、ここで必ず結びに送る。
   */
  private checkClosed(): boolean {
    const c = this.app.state;

    // 天下が一つになった。自分の旗の下でなら、それがこの一生の結び
    const unifier = unifiedBy(ensureWorld(c), c.year);
    if (unifier && unifier === c.factionId && c.alive) {
      this.app.scenes.fade(() => this.app.scenes.reset(new EndingScene(this.app, 'unified')));
      return true;
    }

    // 史書の外まで生きた者にも、老いは来る
    if (c.alive && agedOut(c, this.app.who)) {
      c.alive = false;
      c.deeds.push({ year: c.year, text: '老いて世を去る', diverged: true });
      this.app.scenes.fade(() => this.app.scenes.reset(new EndingScene(this.app, 'aged')));
      return true;
    }

    if (!c.alive) {
      this.app.scenes.fade(() => this.app.scenes.reset(new EndingScene(this.app, 'slain')));
      return true;
    }
    if (c.year > LAST_YEAR) {
      this.app.scenes.fade(() => this.app.scenes.reset(new EndingScene(this.app, 'outlived')));
      return true;
    }
    return false;
  }

  /**
   * いまいる州で、居合わせられる史実の事件があるか。
   * 無ければ何も起きない（＝歴史は勝手に進む）。
   */
  private checkYearEvents(): void {
    const c = this.app.state;
    const who = this.app.who;

    if (who.fate && c.year >= who.fate.year && !c.survived && c.alive) {
      this.app.scenes.push(new FateScene(this.app));
      return;
    }

    const here = pending(c);
    if (here.length > 0) {
      this.say(`${here[0]!.name}が起きている　― 決定キーで加わる`);
      return;
    }

    // 居合わせていないなら、せめてどこで何が起きているかは知らせる
    // （世情の報せが溜まっているときは、そちらを先に読ませる）
    const elsewhere = eventsThisYear(c).filter((e) => e.place !== null);
    if (this.newsQueue.length === 0 && elsewhere.length > 0) {
      const first = elsewhere[0]!;
      const place = first.place ? (PROVINCE_BY_ID[first.place]?.name ?? '') : '';
      this.say(`${place}で ${first.event.name} が起きているという`);
    }
  }

  private checkEncounter(): void {
    const c = this.app.state;
    if (this.stepsSinceBattle < ENCOUNTER_GRACE) return;
    const danger = worldTile(this.tileChar(c.x, c.y)).danger ?? 0;
    if (danger <= 0) return;
    if (Math.random() >= 0.012 * danger) return;
    this.stepsSinceBattle = 0;

    // 兵を連れていない旅人は、戦にならない。身ぐるみを剥がれて終わる。
    // ここで戦をさせると、勝ち目のない戦に引きずり込まれるだけになる。
    if (c.troops <= 0) {
      const loss = Math.min(c.gold, 10 + Math.floor(Math.random() * 25));
      c.gold -= loss;
      audio.sfx('cancel');
      this.say(
        loss > 0 ? `野盗に囲まれ、路銀を奪われた。　金 -${loss}` : '野盗に囲まれたが、奪われるものも無かった。',
        INK.blood,
      );
      return;
    }

    audio.sfx('encounter');
    // 前の遭遇の勝敗は持ち越さない
    delete c.flags['won:skirmish'];
    this.skirmishing = true;
    this.app.scenes.push(
      new WarScene(this.app, {
        enemies: ['bandit'],
        escapable: true,
        eventName: '野盗との遭遇',
        eventId: 'skirmish',
        terrain: this.tileChar(c.x, c.y),
      }),
    );
  }

  /** 道中の野盗と斬り結んでいる最中か。戻ったときに分捕り品を数えるため。 */
  private skirmishing = false;

  /**
   * 野盗を退けたときの分捕り品。
   * 少額でも入れておかないと、道中の戦いが「歩くと損をする」だけの仕掛けになる。
   */
  private settleSkirmish(): void {
    if (!this.skirmishing) return;
    this.skirmishing = false;
    const c = this.app.state;
    if (!c.flags['won:skirmish']) return;
    const gold = 12 + Math.floor(Math.random() * 18);
    c.gold += gold;
    c.renown += 2;
    this.say(`野盗の荷を検めた。　金 +${gold}　名声 +2`, INK.accent);
  }

  /**
   * このマスで手をつけられること。
   * 城市・史実の事件・賊の砦は同じマスに重なりうるので、一つに絞らず全部並べる。
   */
  private interact(): void {
    const c = this.app.state;
    const city = cityAt(c.x, c.y);
    const here = pending(c);
    const camp = this.campHere();

    const options: { label: string; value: string }[] = [];
    const lines: string[] = [];

    if (here.length > 0) options.push({ label: `${here[0]!.name}に加わる`, value: 'event' });
    if (camp) {
      const { troops } = foesOf(camp);
      const spoils = spoilsOf(camp.strength);
      lines.push(`${camp.name}　賊およそ${troops}　（こちら ${c.troops}）`);
      lines.push(`落とせば 金${spoils.gold}・降兵${spoils.captives}。`);
      options.push({ label: c.troops > 0 ? '砦を討つ' : '砦を討つ（兵がいる）', value: 'raid' });
    }
    if (city) options.push({ label: `${city.name}に入る`, value: 'town' });

    // 時を待つ。
    //
    // 一歩が一日から三日なので、事件の無い年を歩いて越えるには数百歩を要した。
    // 240年代の姜維で始めた者は、ただ地図を往復することになる。
    // 何も無い野でだけ「次に何かが起きる年まで待つ」を出す。
    // 城市や事件の上では出さない——そこには先にやることがある。
    if (options.length === 0) {
      this.waitForYears();
      return;
    }
    audio.sfx('confirm');

    // 一つしかないなら、いちいち訊かない
    if (options.length === 1 && !camp) {
      if (options[0]!.value === 'event') {
        this.app.scenes.push(new EventScene(this.app, here[0]!));
      } else if (city) {
        audio.sfx('door');
        this.enterTown(city.id);
      }
      return;
    }

    options.push({ label: 'やめる', value: 'close' });
    this.ask(lines.join('\n'), options);
  }

  /**
   * 何かが起きる年まで待つ。
   *
   * 兵は統率に応じて戻り、名声が足りていれば位も上がる。
   * 待っているあいだにも世界は動くので、戻ったときには天下の形が変わっている。
   */
  private waitForYears(): void {
    const c = this.app.state;
    const before = c.year;
    const result = advanceYear(c, this.app.who);
    // 年をまたいだので、暦も改める
    c.month = 1;
    c.day = 1;
    // 待っているあいだも兵は食う
    const fed = settleUpkeep(c, Math.max(0, c.year - before) * 360);
    driftHearts(c, Math.max(0, c.year - before) * 12);
    const parted = this.partWithTheDisaffected();
    if (result.news.length > 0) this.newsQueue.push(...result.news.slice(-8));

    // 待っているあいだに老いた
    if (result.aged) {
      c.deeds.push({ year: c.year, text: '老いて世を去る', diverged: true });
      this.app.scenes.fade(() => this.app.scenes.reset(new EndingScene(this.app, 'aged')));
      return;
    }

    const span = c.year - before;
    const parts = [span > 0 ? `${span}年が過ぎた` : '時が流れた'];
    if (result.recovered > 0) parts.push(`兵 +${result.recovered}`);
    if (fed.paid > 0) parts.push(`俸禄 +${fed.paid}金`);
    if (fed.starved > 0) parts.push(`糧尽きて -${fed.starved}兵`);
    if (result.promoted) parts.push(`${result.promoted}に上がる`);
    if (parted.length > 0) parts.push(`${parted.join('・')}が去った`);
    this.showBanner(`${c.year}年`);
    audio.sfx(result.promoted ? 'levelup' : 'door');
    this.say(parts.join('　'), result.promoted ? INK.accent : INK.jade);

    if (this.checkClosed()) return;
    this.checkYearEvents();
  }

  private enterTown(cityId: string): void {
    const c = this.app.state;
    if (!townOf(cityId)) {
      this.say('小さな集落だ。立ち寄れるところはない。');
      return;
    }
    c.where = cityId;
    this.app.scenes.push(new TownScene(this.app, cityId));
  }

  // ------------------------------------------------------------ 勢力図

  /** 州の旗は年に一度しか変わらないので、年ごとに作り置きする。 */
  private holderCache: { year: number; holders: Record<string, string> } | null = null;

  private holders(): Record<string, string> {
    const c = this.app.state;
    if (this.holderCache?.year !== c.year) {
      this.holderCache = { year: c.year, holders: provinceHolders(ensureWorld(c), c.year) };
    }
    return this.holderCache.holders;
  }

  /**
   * 賊の砦。州のマスを総なめして探すので、毎フレーム引き直さずに持っておく。
   * 年が変われば湧き方も変わるので、年を鍵にする。討ち取ったときは自分で捨てる。
   */
  private campCache: { year: number; camps: BanditCamp[] } | null = null;

  private camps(): BanditCamp[] {
    const c = this.app.state;
    if (this.campCache?.year !== c.year) {
      this.campCache = { year: c.year, camps: campsAt(c) };
    }
    return this.campCache.camps;
  }

  private campHere(): BanditCamp | null {
    const c = this.app.state;
    return this.camps().find((camp) => camp.x === c.x && camp.y === c.y) ?? null;
  }

  /** 州を、いま旗を立てている勢力の色で薄く染める。 */
  private factionTint(x: number, y: number): string | null {
    const province = provinceAt(x, y);
    if (!province) return null;
    const holder = this.holders()[province.id];
    if (!holder || holder === 'ronin') return null;
    return FACTIONS[holder]?.color ?? null;
  }

  // ------------------------------------------------------------ 描画

  render(ctx: CanvasRenderingContext2D): void {
    const c = this.app.state;
    // 一歩ごとに緩めると、歩き続けているときに毎歩つっかえる。
    // 押しっぱなしのあいだは等速で流し、止まる一歩だけ緩める。
    const t = this.walking ? this.moveT : 1 - (1 - this.moveT) * (1 - this.moveT);
    const px = (this.fromX + (c.x - this.fromX) * t) * TILE;
    const py = (this.fromY + (c.y - this.fromY) * t) * TILE;

    const mapW = WORLD_W * TILE;
    const mapH = WORLD_H * TILE;
    const viewH = SCREEN_H - 96;
    const camX = clamp(px + TILE / 2 - SCREEN_W / 2, mapW, SCREEN_W);
    const camY = clamp(py + TILE / 2 - viewH / 2, mapH, viewH);

    ctx.fillStyle = '#07060c';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const x0 = Math.max(0, Math.floor(camX / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE));
    const x1 = Math.min(WORLD_W - 1, Math.ceil((camX + SCREEN_W) / TILE));
    const y1 = Math.min(WORLD_H - 1, Math.ceil((camY + viewH) / TILE));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const sx = x * TILE - camX;
        const sy = y * TILE - camY;
        drawWorldTile(ctx, this.tileChar(x, y), sx, sy, TILE, x, y);
        // 誰の土地かを、地面の色に薄く混ぜる。年が進むと地図の色が塗り替わっていく。
        const tint = this.factionTint(x, y);
        if (tint) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = tint;
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.restore();
        }
      }
    }

    // 城市の名と、そこに立っている旗
    const world = ensureWorld(c);
    for (const city of CITIES) {
      const sx = city.x * TILE - camX;
      const sy = city.y * TILE - camY;
      if (sx < -40 || sy < -20 || sx > SCREEN_W + 40 || sy > viewH) continue;
      const ruler = rulerNow(world, city.id, c.year);
      const color = ruler ? (FACTIONS[ruler]?.color ?? null) : null;
      if (color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(sx + TILE / 2 - 5, sy - 1, 10, 4);
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + TILE / 2 - 5.5, sy - 1.5, 11, 5);
        ctx.restore();
      }
      drawText(ctx, city.name, sx + TILE / 2, sy + TILE - 2, {
        size: 11,
        align: 'center',
        color: '#f2e6cd',
        stroke: 'rgba(0,0,0,0.9)',
      });
    }

    // 賊の砦。強いものほど旗が赤い
    for (const camp of this.camps()) {
      const sx = camp.x * TILE - camX;
      const sy = camp.y * TILE - camY;
      if (sx < -40 || sy < -20 || sx > SCREEN_W + 40 || sy > viewH) continue;
      drawCamp(ctx, sx + TILE / 2, sy + TILE * 0.92, TILE, camp.strength, camp.strength >= 4 ? '#b8434a' : '#c9a227');
      drawText(ctx, '▲'.repeat(Math.min(3, Math.ceil(camp.strength / 2))), sx + TILE / 2, sy - 4, {
        size: 9,
        align: 'center',
        color: camp.strength >= 4 ? INK.blood : INK.accent,
        stroke: 'rgba(0,0,0,0.9)',
      });
      drawText(ctx, camp.name, sx + TILE / 2, sy + TILE - 2, {
        size: 10,
        align: 'center',
        color: '#e8c6b0',
        stroke: 'rgba(0,0,0,0.9)',
      });
    }

    // 自分。衣は掲げている旗の色を取る
    const sx = px - camX;
    const sy = py - camY;
    drawAvatar(ctx, {
      x: sx + TILE / 2,
      y: sy + TILE - 3,
      height: TILE * 1.35,
      dir: c.dir,
      step: this.moveT < 1 ? this.moveT : 0,
      walking: this.moveT < 1,
      robe: FACTIONS[c.factionId]?.color ?? '#6b6b6b',
    });

    // 視界の外を暗く（画面下のUIぶん）
    ctx.fillStyle = '#07060c';
    ctx.fillRect(0, viewH, SCREEN_W, SCREEN_H - viewH);

    this.drawHud(ctx, viewH);
    if (this.banner > 0) this.drawBanner(ctx, viewH);
    if (this.choice) this.drawChoice(ctx, viewH);
  }

  private drawChoice(ctx: CanvasRenderingContext2D, viewH: number): void {
    const lines = (this.choice?.text ?? '').split('\n');
    const head = 16 + lines.length * 18;
    const h = head + 22 + this.choiceMenu.items.length * 30;
    const y = viewH - h - 60;
    panel(ctx, 80, y, SCREEN_W - 160, h);
    lines.forEach((line, i) => {
      drawText(ctx, line, SCREEN_W / 2, y + 12 + i * 18, {
        size: 13,
        align: 'center',
        color: INK.dim,
      });
    });
    this.choiceMenu.draw(ctx, 120, y + head + 10, SCREEN_W - 240, {
      size: 15,
      lineHeight: 28,
      blink: 0.55 + 0.45 * Math.sin(Date.now() / 160),
    });
  }

  private drawHud(ctx: CanvasRenderingContext2D, top: number): void {
    const c = this.app.state;
    const who = this.app.who;
    const ab = abilitiesAt(who, c.year, c.virtueDelta);
    panel(ctx, 8, top + 6, SCREEN_W - 16, SCREEN_H - top - 14);

    const y = top + 18;
    drawText(ctx, `${who.name}`, 26, y, { size: 16, color: INK.text });
    drawText(ctx, rankName(c), 26, y + 22, { size: 12, color: INK.accent });
    drawText(ctx, FACTIONS[c.factionId]?.name ?? '', 26, y + 40, { size: 11, color: INK.dim });

    drawText(ctx, formatDate(this.date), 200, y, { size: 15, color: INK.accent });
    const here = worldTile(this.tileChar(c.x, c.y));
    const cost = travelCost(this.tileChar(c.x, c.y));
    drawText(ctx, cost > 1 ? `${here.name}　一歩に${cost}日` : here.name, 200, y + 40, {
      size: 11,
      color: cost > 1 ? INK.blood : INK.dim,
    });

    const province = provinceAt(c.x, c.y);
    const holder = province ? this.holders()[province.id] : undefined;
    drawText(
      ctx,
      `${province?.name ?? '辺境'}${holder ? `　${FACTIONS[holder]?.name ?? ''}` : ''}`,
      200,
      y + 22,
      { size: 12, color: holder ? (FACTIONS[holder]?.color ?? INK.dim) : INK.dim },
    );

    const max = maxTroops(who, c);
    drawText(ctx, `兵 ${c.troops}/${max}`, 320, y, { size: 12, color: INK.dim });
    drawGauge(ctx, 320, y + 18, 120, 6, max > 0 ? c.troops / max : 0, INK.blood);

    // 兵糧。あと何ヶ月もつかを、歩き出す前に見せる
    const left = monthsOfFood(c);
    const tight = left < 3;
    const grain = Number.isFinite(left)
      ? `糧 ${Math.round(c.food ?? 0)}石（${Math.floor(left)}ヶ月）`
      : `糧 ${Math.round(c.food ?? 0)}石`;
    drawText(ctx, grain, 320, y + 32, {
      size: 11,
      color: tight ? INK.blood : INK.dim,
    });
    drawText(
      ctx,
      `月々 ${foodPerMonth(c.troops)}石　給 ${stipendOf(c)}石　名声 ${c.renown}`,
      320,
      y + 46,
      { size: 10, color: INK.dim },
    );

    drawText(ctx, `武${ab.war} 知${ab.intel} 統${ab.lead}`, 470, y, { size: 12, color: INK.dim });
    const fate = who.fate;
    if (fate && !c.survived) {
      const left = fate.year - c.year;
      drawText(ctx, left > 0 ? `運命まで ${left}年` : '運命の年', 470, y + 22, {
        size: 12,
        color: left <= 2 ? INK.blood : INK.dim,
      });
    }
    drawText(ctx, 'X: 年代記', 470, y + 40, { size: 11, color: INK.dim });

    if (this.noticeTimer > 0) {
      drawText(ctx, this.notice, SCREEN_W / 2, top + 74, {
        size: 13,
        align: 'center',
        color: this.noticeColor,
      });
      // まだ読んでいない報せがあることは知らせておく
      if (this.newsQueue.length > 0) {
        drawText(ctx, `ほか ${this.newsQueue.length} 件`, SCREEN_W - 26, top + 74, {
          size: 10,
          align: 'right',
          color: INK.dim,
        });
      }
    }
  }

  private drawBanner(ctx: CanvasRenderingContext2D, viewH: number): void {
    const alpha = Math.min(1, this.banner / 400);
    ctx.save();
    ctx.globalAlpha = alpha;
    panel(ctx, SCREEN_W / 2 - 90, viewH - 62, 180, 40);
    drawText(ctx, this.bannerText, SCREEN_W / 2, viewH - 50, {
      size: 17,
      align: 'center',
      color: INK.accent,
    });
    ctx.restore();
  }
}

function clamp(value: number, mapSize: number, screenSize: number): number {
  if (mapSize <= screenSize) return (mapSize - screenSize) / 2;
  return Math.max(0, Math.min(value, mapSize - screenSize));
}
