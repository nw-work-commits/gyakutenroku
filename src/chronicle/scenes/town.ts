/**
 * 町の中。
 *
 * 「行動」をメニューに並べるとノベルに戻ってしまうので、
 * 動詞は**場所**に紐づける。仕官は城で、徴兵は兵舎で、人を招くのは酒楼で。
 */

import { chance } from '../../engine/rng';
import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_H, SCREEN_W, drawGauge, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { abilitiesAt, ageAt, lifeStage } from '../abilities';
import { FACTIONS } from '../data/factions';
import { CITIES, CITY_BY_ID } from '../data/world/overworld';
import { FACILITIES, layoutOf, townOf, townTile } from '../data/world/towns';
import type { FacilityId, TownDef, TownLayout } from '../data/world/towns';
import { maxTroops, recoverTroops, recruitChance } from '../rules';
import { catchUpWorld, eventsThisYear, rankName, residentsOf } from '../runner';
import { factionAt } from '../registry';
import { PROVINCE_BY_ID } from '../data/world/overworld';
import { advanceDays } from '../systems/calendar';
import {
  aliveIn,
  ensureWorld,
  factionExists,
  foundFaction,
  record,
  recentNews,
  rulerNow,
  seize,
} from '../systems/world';
import type { Dir, Officer } from '../types';
import { drawAvatar } from './avatar';
import { drawSignboard, drawTownTile } from './scenery';
import {
  foodNote,
  grainPrice,
  settleUpkeep,
  stipendOf,
  upkeepLine,
} from '../systems/provisions';
import type { Upkeep } from '../systems/provisions';
import { heartLabel, heartOf, welcome } from '../systems/hearts';
import { LoreScene } from './lore';
import { WarScene } from './battle';
import { INK, backdrop, blink, panel, rule } from './theme';

/** 主のない城を押さえるのに要る兵。ひと隊では城門は塞げない。 */
const CLAIM_TROOPS = 800;
/** 自らの旗を立てるのに要る名声。名も無い者に人は従わない。 */
const BANNER_RENOWN = 250;
/** 自前の旗の色。史実のどの勢力とも違う紫にしておく。 */
const BANNER_COLOR = '#8f4a8f';

const TILE = 26;
const OX = 60;
const OY = 8;
const MOVE_MS = 95;

/** 施設ごとの幟の色。城は朱、兵舎は鉄、酒楼は琥珀、市は紅、宿は藍。 */
const FACILITY_TINT: Record<string, string> = {
  castle: '#a83a3a',
  barracks: '#6b7278',
  tavern: '#c9922f',
  market: '#b8434a',
  inn: '#3f5f8f',
};

const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

type Mode = 'walk' | 'talk' | 'facility';

interface Resident {
  officer: Officer;
  x: number;
  y: number;
}

export class TownScene implements Scene {
  private town: TownDef;
  private layout: TownLayout;
  private residents: Resident[] = [];

  private x = 0;
  private y = 0;
  private dir: Dir = 'up';
  private fromX = 0;
  private fromY = 0;
  private moveT = 1;
  private walkPhase = 0;
  private time = 0;

  private mode: Mode = 'walk';
  private message: string[] = [];
  private menu = new Menu([], 1);
  private facility: FacilityId | null = null;
  private talking: Officer | null = null;

  constructor(
    private app: ChronicleApp,
    private cityId: string,
  ) {
    const town = townOf(cityId);
    if (!town) throw new Error(`町が未定義: ${cityId}`);
    this.town = town;
    this.layout = layoutOf(town);
  }

  onEnter(): void {
    this.app.input.flush();
    audio.playBgm('town');
    const [ex, ey] = this.layout.entry;
    this.x = ex;
    this.y = ey;
    this.fromX = ex;
    this.fromY = ey;
    this.refreshResidents();
  }

  onResume(): void {
    this.app.input.flush();
    audio.playBgm('town');
    this.settleSiege();
    this.refreshResidents();
  }

  /** 城攻めの最中か。戻ったときに旗を書き換えるため。 */
  private sieging = false;

  /** 城攻めから戻った。勝っていれば旗が変わる。 */
  private settleSiege(): void {
    if (!this.sieging) return;
    this.sieging = false;
    const c = this.app.state;
    if (!c.flags[`won:siege:${this.cityId}`]) {
      this.facility = 'castle';
      this.say('城は落ちなかった。', [{ label: '立ち去る', value: 'close' }]);
      return;
    }
    delete c.flags[`won:siege:${this.cityId}`];
    this.takeCity();
    audio.sfx('levelup');
    this.facility = 'castle';
    this.say(`${CITY_BY_ID[this.cityId]?.name ?? ''}、落つ。旗が変わった。（名声 +40）`, [
      { label: '立ち去る', value: 'close' },
    ]);
  }

  /** 城を守る将。その旗に属し、その年に生きている者から選ぶ。 */
  private defenderOf(factionId: string | null): string[] {
    const c = this.app.state;
    if (!factionId) return ['soldier'];
    const world = ensureWorld(c);
    const here = residentsOf(c, this.cityId, [c.officerId, ...c.roster])
      .filter((o) => factionAt(o, c.year) === factionId && aliveIn(world, o, c.year))
      .slice(0, 2)
      .map((o) => o.id);
    return here.length > 0 ? here : ['general'];
  }

  /** 誰がこの町にいるかは、その年の所属から実行時に決まる。 */
  private refreshResidents(): void {
    const c = this.app.state;
    const list = residentsOf(c, this.cityId, [c.officerId, ...c.roster]);
    this.residents = list.slice(0, this.layout.spots.length).map((officer, i) => ({
      officer,
      x: this.layout.spots[i]![0],
      y: this.layout.spots[i]![1],
    }));
  }

  // ------------------------------------------------------------ 判定

  private tileChar(x: number, y: number): string {
    return this.layout.tiles[y]?.[x] ?? '#';
  }

  private residentAt(x: number, y: number): Resident | undefined {
    return this.residents.find((r) => r.x === x && r.y === y);
  }

  private facilityAt(x: number, y: number): FacilityId | null {
    const index = this.layout.doors.findIndex(([dx, dy]) => dx === x && dy === y);
    return index >= 0 ? (this.town.facilities[index] ?? null) : null;
  }

  private walkable(x: number, y: number): boolean {
    if (!townTile(this.tileChar(x, y)).walkable) return false;
    return !this.residentAt(x, y);
  }

  // ------------------------------------------------------------ 更新

  update(dt: number, input: Input): void {
    this.time += dt;

    if (this.moveT < 1) {
      this.moveT = Math.min(1, this.moveT + dt / MOVE_MS);
      this.walkPhase += dt;
      if (this.moveT >= 1) this.onArrive();
      return;
    }

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (this.mode === 'talk') {
        if (key === 'confirm' || key === 'cancel') {
          if (this.menu.items.length > 0) {
            if (key === 'confirm') {
              this.onTalkChoice();
              return;
            }
            this.closeMessage();
            return;
          }
          this.closeMessage();
        } else if (this.menu.items.length > 0 && this.menu.move(key)) {
          audio.sfx('cursor');
        }
        continue;
      }
      if (this.mode === 'facility') {
        if (key === 'cancel') {
          audio.sfx('cancel');
          this.closeMessage();
          return;
        }
        if (key === 'confirm') {
          this.onFacilityChoice();
          return;
        }
        if (this.menu.move(key)) audio.sfx('cursor');
        continue;
      }
      if (key === 'confirm') {
        this.interact();
        return;
      }
      if (key === 'cancel') {
        audio.sfx('cancel');
        this.leave();
        return;
      }
    }

    const dir = input.heldDirection();
    if (!dir) return;
    this.dir = dir as Dir;
    const [dx, dy] = DELTA[this.dir];
    if (!this.walkable(this.x + dx, this.y + dy)) {
      this.walkPhase += dt;
      return;
    }
    this.fromX = this.x;
    this.fromY = this.y;
    this.x += dx;
    this.y += dy;
    this.moveT = 0;
  }

  private onArrive(): void {
    const [exX, exY] = this.layout.exit;
    if (this.x === exX && this.y === exY) this.leave();
  }

  private leave(): void {
    const c = this.app.state;
    c.where = 'world';
    audio.sfx('door');
    this.app.scenes.pop();
  }

  private closeMessage(): void {
    this.mode = 'walk';
    this.message = [];
    this.menu.setItems([]);
    this.facility = null;
    this.talking = null;
  }

  private say(text: string, choices: { label: string; value: string }[] = []): void {
    this.message = wrapText(text, SCREEN_W - 100, 15);
    this.menu.setItems(choices);
    this.mode = choices.length > 0 && this.facility ? 'facility' : 'talk';
  }

  // ------------------------------------------------------------ 交流

  private interact(): void {
    const [dx, dy] = DELTA[this.dir];
    const fx = this.x + dx;
    const fy = this.y + dy;

    const resident = this.residentAt(fx, fy);
    if (resident) {
      audio.sfx('confirm');
      this.openTalk(resident.officer);
      return;
    }

    const facility = this.facilityAt(fx, fy) ?? this.facilityAt(this.x, this.y);
    if (facility) {
      audio.sfx('door');
      this.openFacility(facility);
      return;
    }

    const flavor = this.town.flavor?.[0];
    this.say(flavor ? `町の者「${flavor}」` : '人の行き交う音がする。');
  }

  private openTalk(who: Officer): void {
    const c = this.app.state;
    const ab = abilitiesAt(who, c.year, 0);
    this.talking = who;
    const intro =
      `${who.name}${who.courtesy ? `（${who.courtesy}）` : ''}　${ageAt(who, c.year)}歳・${lifeStage(who, c.year)}\n` +
      `武${ab.war} 知${ab.intel} 統${ab.lead} 徳${ab.virtue}` +
      (who.epithet ? `\n「${who.epithet}」と称される。` : '');

    const canInvite = !c.roster.includes(who.id) && c.roster.length < 8;
    this.mode = 'talk';
    this.message = wrapText(intro, SCREEN_W - 100, 15);
    // 道で会った者の生涯を、その場で引けるようにしておく。
    // 名も知らぬ武将こそ、史書が何を伝えていないかを読む値打ちがある。
    this.menu.setItems([
      ...(canInvite ? [{ label: '招く', value: 'invite' }] : []),
      { label: '生涯を聞く', value: 'lore' },
      { label: '別れる', value: 'leave' },
    ]);
  }

  private onTalkChoice(): void {
    const value = this.menu.selected?.value;
    const who = this.talking;
    if (who && value === 'lore') {
      audio.sfx('confirm');
      this.closeMessage();
      this.app.scenes.push(new LoreScene(this.app, who));
      return;
    }
    if (!who || value !== 'invite') {
      audio.sfx('cancel');
      this.closeMessage();
      return;
    }
    const c = this.app.state;
    const me = abilitiesAt(this.app.who, c.year, c.virtueDelta);
    const target = abilitiesAt(who, c.year, 0);
    // 名のある者ほど落ちにくい。武と知の高さを名声の代わりに使う。
    const fame = (target.war + target.intel) * 1.4;
    const rate = recruitChance(me.virtue, target, fame);

    audio.sfx('confirm');
    if (chance(rate)) {
      c.roster.push(who.id);
      // 迎えた者に初めの心を置く。徳のある主のもとには、はじめから寄る
      welcome(c, who.id);
      c.renown += 15;
      audio.sfx('levelup');
      this.message = wrapText(
        `${who.name}「よろしい。あなたに従いましょう」\n\n` +
          `${who.name}が配下に加わった。（成功率 ${Math.round(rate * 100)}%）\n` +
          `心は「${heartLabel(heartOf(c, who.id))}」。`,
        SCREEN_W - 100,
        15,
      );
    } else {
      this.message = wrapText(
        `${who.name}「……いまは、その気になれませぬ」\n\n断られた。（成功率 ${Math.round(rate * 100)}%）徳を高めれば、また変わる。`,
        SCREEN_W - 100,
        15,
      );
    }
    this.menu.setItems([]);
  }

  // ------------------------------------------------------------ 施設

  private openFacility(id: FacilityId): void {
    this.facility = id;
    const c = this.app.state;
    const info = FACILITIES[id];

    switch (id) {
      case 'castle': {
        const world = ensureWorld(c);
        const ruler = rulerNow(world, this.cityId, c.year);
        const name = ruler ? (FACTIONS[ruler]?.name ?? ruler) : null;
        const own = world.founded;
        const options: { label: string; value: string }[] = [];
        const lines: string[] = [];

        // 自分の旗の城、あるいは主のない城
        if (!ruler || ruler === c.factionId) {
          lines.push(name ? `${info.name} —— ${name}の城。` : `${info.name} —— いまは主なき城だ。`);

          // 主のない城は、兵さえあれば押さえられる
          if (!ruler && c.troops >= CLAIM_TROOPS) {
            lines.push(`${CLAIM_TROOPS}の兵があれば、この城は取れる。`);
            options.push({ label: 'この城を取る', value: 'claim' });
          } else if (!ruler) {
            lines.push(`城を押さえるには ${CLAIM_TROOPS} の兵がいる（いま ${c.troops}）。`);
          }

          // 旗揚げ。城を持ち、名も知れていることが条件
          if (!own && this.heldCities() > 0 && c.renown >= BANNER_RENOWN) {
            lines.push('城を持ち、名も知れた。自らの旗を立てることもできる。');
            options.push({ label: '旗を挙げる', value: 'found' });
          } else if (!own && this.heldCities() > 0) {
            lines.push(`旗を挙げるには名声 ${BANNER_RENOWN} がいる（いま ${c.renown}）。`);
          }

          options.push({ label: '立ち去る', value: 'close' });
          this.say(lines.join('\n'), options);
          return;
        }

        // よその旗の城。仕えるか、攻めるか
        lines.push(`${info.name} —— ${name}の城。`);
        lines.push(`守兵およそ ${this.garrisonOf()}（こちら ${c.troops}）`);
        lines.push(`仕官を願い出れば、この旗の下に加わる。（名声 ${c.renown}／必要 30）`);
        options.push({ label: `${name}に仕官する`, value: 'serve' });
        if (c.troops > 0) options.push({ label: 'この城を攻める', value: 'siege' });
        options.push({ label: '立ち去る', value: 'close' });
        this.say(lines.join('\n'), options);
        return;
      }
      case 'barracks': {
        const max = maxTroops(this.app.who, c);
        const room = Math.max(0, max - c.troops);
        const affordable = Math.floor(c.gold / 2);
        // 給付で養いきれる頭数。ここまでなら糧を買わずに保てる
        const sustainable = Math.max(0, stipendOf(c) * 90 - c.troops);
        this.say(
          `${info.name} —— 兵を募っている。\n` +
            `兵ひとりに二金。いまの兵 ${c.troops}／${max}、資金 ${c.gold}金。\n` +
            `${upkeepLine(c, this.provinceId())}`,
          [
            { label: `百人（200金）`, value: 'levy100' },
            { label: `千人（2000金）`, value: 'levy1000' },
            {
              label: `養える数だけ（${Math.min(room, affordable, sustainable)}人）`,
              value: 'levyfit',
            },
            { label: `募れるだけ（${Math.min(room, affordable)}人）`, value: 'levy' },
            { label: '立ち去る', value: 'close' },
          ],
        );
        return;
      }
      case 'tavern':
        this.say(`${info.name} —— 酒と、人の噂で騒がしい。`, [
          { label: '噂を聞く', value: 'rumor' },
          { label: '立ち去る', value: 'close' },
        ]);
        return;
      case 'market': {
        // 相場は州と年で決まる。益州の米は安く、涼州の米は高い
        const price = grainPrice(this.provinceId(), c.year);
        const canBuy = Math.floor(c.gold / price);
        this.say(
          `${info.name} —— 米が積まれている。\n` +
            `${PROVINCE_BY_ID[this.provinceId() ?? '']?.name ?? 'この地'}の相場、一石 ${price}金。\n` +
            `${upkeepLine(c, this.provinceId())}\n` +
            `${foodNote(c)}。`,
          [
            { label: `米を買う（十石 ${Math.round(price * 10)}金）`, value: 'buy10' },
            { label: `米を買う（百石 ${Math.round(price * 100)}金）`, value: 'buy100' },
            { label: `買えるだけ買う（${canBuy}石）`, value: 'buyall' },
            { label: '米を売る（十石）', value: 'sell10' },
            { label: '立ち去る', value: 'close' },
          ],
        );
        return;
      }
      case 'inn':
        this.say(`${info.name} —— ひと月、腰を落ち着けるか。`, [
          { label: '休む（ひと月）', value: 'rest' },
          { label: '立ち去る', value: 'close' },
        ]);
        return;
    }
  }

  /**
   * この城の守兵。
   *
   * 表で持たず、城の格と時勢から出す。大きな城ほど厚く、
   * 天下が固まってからは兵も集まりやすい——という程度の当て推量である。
   */
  private garrisonOf(): number {
    const c = this.app.state;
    const world = ensureWorld(c);
    const ruler = rulerNow(world, this.cityId, c.year);
    if (!ruler) return 0;
    // 持ち城の多い勢力ほど、一城に置ける兵も多い
    const held = CITIES.filter((city) => rulerNow(world, city.id, c.year) === ruler).length;
    const base = 900 + held * 260;
    return Math.round(base * (townOf(this.cityId) ? 1.25 : 1));
  }

  /**
   * 立てる旗の名。
   *
   * 「劉備軍」で始めた者が「劉備軍」を興しても、どちらの旗か分からない。
   * 同じ名が史書に既にあるときは、拠った州の名を借りる（徐州軍、涼州軍）。
   * 州の名を勢力名にするのは、白波賊や西涼の兵と同じ呼び方でもある。
   */
  private bannerName(): string {
    const mine = `${this.app.who.name}軍`;
    const taken = Object.values(FACTIONS).some((f) => f.name === mine);
    if (!taken) return mine;
    const city = CITY_BY_ID[this.cityId];
    const province = city ? PROVINCE_BY_ID[city.provinceId] : undefined;
    return province ? `${province.name}軍` : `${this.app.who.name}の一党`;
  }

  /** この町のある州。米の相場に効く。 */
  private provinceId(): string | null {
    return CITY_BY_ID[this.cityId]?.provinceId ?? null;
  }

  /** いま自分の旗の下にある城の数。 */
  private heldCities(): number {
    const c = this.app.state;
    const world = ensureWorld(c);
    return CITIES.filter((city) => {
      const ruler = rulerNow(world, city.id, c.year);
      return ruler !== null && ruler === c.factionId && world.seized[city.id] !== undefined;
    }).length;
  }

  /** 城を落とした。旗が変わり、世に報せが流れる。 */
  private takeCity(): void {
    const c = this.app.state;
    const world = ensureWorld(c);
    const city = CITY_BY_ID[this.cityId];

    // 掲げる旗がもう無いことがある。
    // 公孫瓚が滅んだあとの趙雲のように、主家の消えた者が城を取ったとき——
    // その城を史実の主に返してしまっては、取った意味が消える。
    // 旗を失った者が城を取れば、その城のほうが新しい旗になる。
    if (c.factionId === 'ronin' || !factionExists(c.factionId, c.year)) {
      const own = world.founded ?? foundFaction(c, this.bannerName(), BANNER_COLOR);
      c.factionId = own.id;
      if (c.rankId !== 'lord') c.rankId = 'lord';
      c.deeds.push({ year: c.year, text: `${own.name}の旗を挙げる`, diverged: true });
      record(world, {
        year: c.year,
        kind: 'divergence',
        text: `${this.app.who.name}、拠るところを得て旗を挙ぐ`,
      });
    }

    seize(world, this.cityId, c.factionId, c.year);
    const flag = FACTIONS[c.factionId]?.name ?? c.factionId;
    record(world, {
      year: c.year,
      kind: 'seize',
      text: `${city?.name ?? this.cityId}、${flag}の手に落つ`,
    });
    c.deeds.push({ year: c.year, text: `${city?.name ?? this.cityId}を取る`, diverged: true });
    c.renown += 40;
  }

  private onFacilityChoice(): void {
    const value = this.menu.selected?.value;
    const c = this.app.state;
    audio.sfx('confirm');

    switch (value) {
      case 'claim': {
        if (c.troops < CLAIM_TROOPS) {
          this.say('兵が足りぬ。', [{ label: '立ち去る', value: 'close' }]);
          return;
        }
        this.takeCity();
        audio.sfx('levelup');
        this.say(`${CITY_BY_ID[this.cityId]?.name ?? ''}に旗を立てた。（名声 +40）`, [
          { label: '立ち去る', value: 'close' },
        ]);
        return;
      }
      case 'siege': {
        // 守兵と一戦する。勝てば城が手に入る
        this.sieging = true;
        const ruler = rulerNow(ensureWorld(c), this.cityId, c.year);
        const defender = this.defenderOf(ruler);
        audio.sfx('encounter');
        this.app.scenes.push(
          new WarScene(this.app, {
            enemies: defender,
            escapable: true,
            eventName: `${CITY_BY_ID[this.cityId]?.name ?? ''}の攻防`,
            eventId: `siege:${this.cityId}`,
            foeTroops: this.garrisonOf(),
            terrain: '#',
          }),
        );
        return;
      }
      case 'found': {
        const own = foundFaction(c, this.bannerName(), BANNER_COLOR);
        c.rankId = 'lord';
        c.deeds.push({ year: c.year, text: `${own.name}の旗を挙げる`, diverged: true });
        record(ensureWorld(c), {
          year: c.year,
          kind: 'divergence',
          text: `${this.app.who.name}、自ら旗を挙ぐ`,
        });
        audio.sfx('levelup');
        this.say(
          `${own.name}の旗が立った。
史書にこの勢力は無い。ここから先は、誰も知らない天下である。`,
          [{ label: '立ち去る', value: 'close' }],
        );
        return;
      }
    }

    switch (value) {
      case 'serve': {
        const ruler = rulerNow(ensureWorld(c), this.cityId, c.year);
        if (!ruler) return;
        if (c.renown < 30) {
          this.say('門番「名も知らぬ者を、主の前には通せぬ」', [
            { label: '立ち去る', value: 'close' },
          ]);
          return;
        }
        c.factionId = ruler;
        if (c.rankId === 'commoner') c.rankId = 'soldier';
        c.deeds.push({ year: c.year, text: `${FACTIONS[ruler]?.name ?? ruler}に仕える` });
        audio.sfx('levelup');
        this.say(`${FACTIONS[ruler]?.name ?? ruler}に仕えることとなった。`, [
          { label: '立ち去る', value: 'close' },
        ]);
        return;
      }
      case 'levy100':
      case 'levy1000':
      case 'levyfit':
      case 'levy': {
        const max = maxTroops(this.app.who, c);
        const room = Math.max(0, max - c.troops);
        const affordable = Math.floor(c.gold / 2);
        const want =
          value === 'levy100'
            ? 100
            : value === 'levy1000'
              ? 1000
              : value === 'levyfit'
                ? Math.max(0, stipendOf(c) * 90 - c.troops)
                : room;
        const got = Math.min(want, room, affordable);
        if (got <= 0) {
          this.say(
            room <= 0
              ? 'これ以上は率いられぬ。位を上げるか、人を得るほかない。'
              : value === 'levyfit'
                ? 'いまの給付では、これ以上は養えぬ。糧を買うなら市へ。'
                : '資金が足りぬ。',
            [{ label: '立ち去る', value: 'close' }],
          );
          return;
        }
        c.gold -= got * 2;
        c.troops += got;
        this.spendDays(30);
        audio.sfx('gold');
        this.say(`${got}の兵が集まった。（ひと月が過ぎた）${this.upkeepNote()}`, [
          { label: '立ち去る', value: 'close' },
        ]);
        return;
      }
      case 'buy10':
      case 'buy100':
      case 'buyall': {
        const price = grainPrice(this.provinceId(), c.year);
        const want =
          value === 'buy10' ? 10 : value === 'buy100' ? 100 : Math.floor(c.gold / price);
        const got = Math.min(want, Math.floor(c.gold / price));
        if (got <= 0) {
          this.say('銭が足りぬ。', [{ label: '立ち去る', value: 'close' }]);
          return;
        }
        const cost = Math.round(got * price);
        c.gold -= cost;
        c.food = (c.food ?? 0) + got;
        audio.sfx('gold');
        this.say(`米 ${got}石を購った。（-${cost}金）\n${foodNote(c)}。`, [
          { label: '立ち去る', value: 'close' },
        ]);
        return;
      }
      case 'sell10': {
        const price = grainPrice(this.provinceId(), c.year);
        const have = Math.floor(c.food ?? 0);
        if (have < 10) {
          this.say('売るほどの蓄えがない。', [{ label: '立ち去る', value: 'close' }]);
          return;
        }
        // 買い叩かれる。商人が儲けねば店は開かない
        const gain = Math.round(10 * price * 0.7);
        c.food = have - 10;
        c.gold += gain;
        audio.sfx('gold');
        this.say(`米 十石を売った。（+${gain}金）\n${foodNote(c)}。`, [
          { label: '立ち去る', value: 'close' },
        ]);
        return;
      }
      case 'rumor': {
        // 今年これから起きること（行き先の手がかり）と、
        // すでに世で起きたこと（自分がいないあいだに進んだぶん）を並べる。
        const coming = eventsThisYear(c)
          .slice(0, 3)
          .map(({ event, place }) => {
            const where = place ? (PROVINCE_BY_ID[place]?.name ?? '') : '天下';
            return `・${where}にて ${event.name}`;
          });
        const passed = recentNews(ensureWorld(c), 3)
          .filter((n) => n.kind !== 'history')
          .map((n) => `・${n.year}年、${n.text}`);

        if (coming.length === 0 && passed.length === 0) {
          this.say('「今年は、これといった話は聞かぬな」', [
            { label: '立ち去る', value: 'close' },
          ]);
          return;
        }
        const body = [
          ...(passed.length > 0 ? ['「近ごろ、こんな話が回っている」', ...passed] : []),
          ...(coming.length > 0 ? [`「${c.year}年のこと、こうも聞く」`, ...coming] : []),
        ].join('\n');
        this.say(body, [{ label: '立ち去る', value: 'close' }]);
        return;
      }
      case 'rest': {
        const back = Math.min(recoverTroops(this.app.who, c), maxTroops(this.app.who, c) - c.troops);
        c.troops += Math.max(0, back);
        this.spendDays(30);
        audio.sfx('heal');
        this.say(
          (back > 0 ? `ひと月を休んだ。兵が ${back} 戻った。` : 'ひと月を休んだ。') +
            this.upkeepNote(),
          [{ label: '立ち去る', value: 'close' }],
        );
        return;
      }
      default:
        audio.sfx('cancel');
        this.closeMessage();
    }
  }

  /** 町での用は日を食う。時が過ぎれば年も変わり、その間に世界も動く。 */
  private spendDays(days: number): void {
    const c = this.app.state;
    const date = { year: c.year, month: c.month, day: c.day };
    advanceDays(date, days);
    c.year = date.year;
    c.month = date.month;
    c.day = date.day;
    // 兵は日ごとに食う。休むことにも値が付いた
    this.lastUpkeep = settleUpkeep(c, days);
    catchUpWorld(c);
    this.refreshResidents();
  }

  /** 直前に日を送ったときの糧の勘定。文の後ろに添える。 */
  private lastUpkeep: Upkeep | null = null;

  /** 糧と俸禄の増減を一行にする。何も動かなければ空。 */
  private upkeepNote(): string {
    const u = this.lastUpkeep;
    this.lastUpkeep = null;
    if (!u || u.months <= 0) return '';
    const parts: string[] = [];
    if (u.ate > 0) parts.push(`糧 -${u.ate}石`);
    if (u.granted > 0) parts.push(`給 +${u.granted}石`);
    if (u.paid > 0) parts.push(`俸禄 +${u.paid}金`);
    if (u.starved > 0) parts.push(`**糧尽きて ${u.starved} が去った**`);
    return parts.length > 0 ? `\n${parts.join('　')}` : '';
  }

  // ------------------------------------------------------------ 描画

  render(ctx: CanvasRenderingContext2D): void {
    const c = this.app.state;
    backdrop(ctx, SCREEN_W, SCREEN_H);

    const width = this.layout.tiles[0]?.length ?? 0;
    const height = this.layout.tiles.length;

    // 地面
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        drawTownTile(ctx, this.tileChar(x, y), OX + x * TILE, OY + y * TILE, TILE, x, y);
      }
    }

    // 施設の看板
    this.layout.doors.forEach(([dx, dy], i) => {
      const id = this.town.facilities[i];
      if (!id) return;
      const info = FACILITIES[id];
      const sx = OX + dx * TILE + TILE / 2;
      const sy = OY + dy * TILE;
      drawSignboard(ctx, sx, sy + TILE * 0.9, TILE, FACILITY_TINT[id] ?? '#8a6a3a');
      drawText(ctx, info.name, sx, sy - 12, {
        size: 11,
        align: 'center',
        color: INK.accent,
        stroke: 'rgba(0,0,0,0.9)',
      });
    });

    // 出口
    const [exX, exY] = this.layout.exit;
    drawText(ctx, '出口', OX + exX * TILE + TILE / 2, OY + exY * TILE + 4, {
      size: 10,
      align: 'center',
      color: INK.dim,
      stroke: 'rgba(0,0,0,0.9)',
    });

    // 住人。旗の色の衣を着て、こちらを向いて立っている
    for (const r of this.residents) {
      const sx = OX + r.x * TILE + TILE / 2;
      const sy = OY + r.y * TILE + TILE / 2;
      drawAvatar(ctx, {
        x: sx,
        y: sy + TILE * 0.34,
        height: TILE * 1.2,
        dir: 'down',
        step: 0,
        walking: false,
        robe: FACTIONS[factionAt(r.officer, c.year)]?.color ?? '#6b6b6b',
        hat: false,
        seed: r.officer.id,
        role: r.officer.roleId,
      });
      drawText(ctx, r.officer.name, sx, sy + TILE * 0.5, {
        size: 10,
        align: 'center',
        color: INK.text,
        stroke: 'rgba(0,0,0,0.9)',
      });
    }

    // 自分
    const t = this.moveT;
    const px = OX + (this.fromX + (this.x - this.fromX) * t) * TILE + TILE / 2;
    const py = OY + (this.fromY + (this.y - this.fromY) * t) * TILE + TILE / 2;
    drawAvatar(ctx, {
      x: px,
      y: py + TILE * 0.36,
      height: TILE * 1.25,
      dir: this.dir,
      step: this.moveT < 1 ? this.moveT : 0,
      walking: this.moveT < 1,
      robe: FACTIONS[c.factionId]?.color ?? '#6b6b6b',
    });

    this.drawHud(ctx);
    if (this.mode !== 'walk') this.drawMessage(ctx);
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    const c = this.app.state;
    const city = CITY_BY_ID[this.cityId];
    const top = OY + this.layout.tiles.length * TILE + 6;
    panel(ctx, 8, top, SCREEN_W - 16, SCREEN_H - top - 8);

    drawText(ctx, city?.name ?? '', 26, top + 12, { size: 17, color: INK.accent });
    const ruler = rulerNow(ensureWorld(c), this.cityId, c.year);
    drawText(ctx, ruler ? (FACTIONS[ruler]?.name ?? '') : '主なし', 26, top + 36, {
      size: 11,
      color: INK.dim,
    });

    drawText(ctx, `${c.year}年`, 170, top + 12, { size: 14, color: INK.text });
    drawText(ctx, rankName(c), 170, top + 34, { size: 11, color: INK.dim });

    const max = maxTroops(this.app.who, c);
    drawText(ctx, `兵 ${c.troops}/${max}`, 280, top + 10, { size: 12, color: INK.dim });
    drawGauge(ctx, 280, top + 28, 110, 6, max > 0 ? c.troops / max : 0, INK.blood);

    drawText(ctx, `${c.gold} 金`, 420, top + 10, { size: 13, color: INK.accent });
    drawText(ctx, `配下 ${c.roster.length}`, 420, top + 32, { size: 11, color: INK.dim });

    drawText(ctx, 'X: 出る', SCREEN_W - 26, top + 12, {
      size: 11,
      align: 'right',
      color: INK.dim,
    });
  }

  private drawMessage(ctx: CanvasRenderingContext2D): void {
    // 噂は行数が多い。本文のぶんだけ窓を伸ばす。
    const lines = Math.min(6, Math.max(4, this.message.length));
    const body = 22 + lines * 22;
    const h = body + 26 + (this.menu.items.length > 0 ? this.menu.items.length * 28 : 0);
    const y = SCREEN_H - h - 8;
    panel(ctx, 30, y, SCREEN_W - 60, h);
    this.message.slice(0, lines).forEach((line, i) => {
      drawText(ctx, line, 50, y + 16 + i * 22, { size: 15, color: INK.text });
    });
    if (this.menu.items.length > 0) {
      rule(ctx, 50, y + body, SCREEN_W - 100);
      this.menu.draw(ctx, 50, y + body + 12, SCREEN_W - 120, {
        size: 15,
        lineHeight: 26,
        blink: blink(this.time),
      });
    } else {
      drawText(ctx, '▼', SCREEN_W - 60, y + h - 26, {
        size: 13,
        color: INK.accent,
        alpha: this.time % 1000 < 600 ? 1 : 0.25,
      });
    }
  }
}
