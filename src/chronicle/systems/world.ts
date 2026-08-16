/**
 * 世界のうつろい。
 *
 * これまでは、居合わせなかった事件は「史実どおり」と表示されるだけで、
 * 実際には誰も死なず、城もひとつも動かなかった。ここがそれを引き受ける。
 *
 * 設計は年表と同じ考え方でいく。**史実は data 側から引けるので持たない。**
 * WorldState が抱えるのは史実との差分だけで、
 *   ・命拾いした者（spared）
 *   ・史実と違う形で死んだ者（slain）
 *   ・主が史実と食い違う城市（seized）
 * の三つしかない。何も変えていない世界は、空っぽの WorldState で表せる。
 *
 * 解決するのは「過ぎ去った年」だけ。今年の事件はまだ本人が駆けつけられるので、
 * advanceWorld には c.year - 1 を渡す。
 */

import { birthYear } from '../abilities';
import { FACTIONS, raiseBanner } from '../data/factions';
import { CITY_CONTROL, historicalRuler } from '../data/world/control';
import { CITIES, PROVINCE_BY_ID } from '../data/world/overworld';
import type { CityDef } from '../data/world/overworld';
import { OFFICERS, eventsIn } from '../registry';
import { resolveCampaigns } from './campaign';
import type {
  Aftermath,
  Chronicle,
  FoundedFaction,
  Officer,
  WorldNews,
  WorldState,
} from '../types';

/**
 * 覚えておく報せの数。古いものから捨てる。
 * 184年から280年まで通しても300件ほどなので、一生ぶんは丸ごと残る。
 */
const NEWS_LIMIT = 400;

export function blankWorld(startYear: number): WorldState {
  return {
    resolvedTo: startYear - 1,
    spared: [],
    slain: {},
    seized: {},
    news: [],
  };
}

/** 古いセーブには world が無い。そのときは「今日までは史実どおり」と見なす。 */
export function ensureWorld(c: Chronicle): WorldState {
  if (!c.world) c.world = blankWorld(c.year);
  // 自前の旗は世界状態にしか無いので、触るたびに名簿へ足し直す。
  // 読み込み直後でも、色や名前の引きが空にならないように
  const own = c.world.founded;
  if (own && !FACTIONS[own.id]) {
    raiseBanner({ id: own.id, name: own.name, color: own.color, from: own.from });
  }
  return c.world;
}

/**
 * 旗を挙げる。
 *
 * これまで joinFaction は既にある旗の間を移るだけで、自分の勢力は持てなかった。
 * 城をいくつ取っても史実の版図に戻ってしまうので、
 * 「違う道を進んだらどうなるか」が列伝の文言だけの話に留まっていた。
 */
export function foundFaction(
  c: Chronicle,
  name: string,
  color: string,
): FoundedFaction {
  const w = ensureWorld(c);
  const own: FoundedFaction = {
    id: `own:${c.officerId}`,
    name,
    color,
    from: c.year,
    lordId: c.officerId,
  };
  w.founded = own;
  raiseBanner({ id: own.id, name: own.name, color: own.color, from: own.from });
  // いま持っている城は、そのまま新しい旗のものになる
  for (const [cityId, held] of Object.entries(w.seized)) {
    if (held.factionId === c.factionId) w.seized[cityId] = { factionId: own.id, year: c.year };
  }
  c.factionId = own.id;
  return own;
}

// ---------------------------------------------------------------- 生死

/**
 * 命拾いした者が、それでもいつかは迎える終わり。
 * 運命を外れても不老不死になるわけではない、というだけの線引き。
 */
function naturalEnd(who: Officer): number {
  return Math.max(who.died + 12, birthYear(who) + 64);
}

/** その者が実際に世を去る年。史実と食い違っていることがある。 */
export function deathYearOf(w: WorldState, who: Officer): number {
  const slain = w.slain[who.id];
  if (slain !== undefined) return slain;
  if (w.spared.includes(who.id)) return naturalEnd(who);
  return who.died;
}

/** その年、まだ世にあるか。 */
export function aliveIn(w: WorldState, who: Officer, year: number): boolean {
  return deathYearOf(w, who) >= year;
}

/** 史実では没するはずの者を生かす。 */
export function spare(w: WorldState, officerId: string): void {
  if (!OFFICERS[officerId]) return;
  delete w.slain[officerId];
  if (!w.spared.includes(officerId)) w.spared.push(officerId);
}

/** 史実と違う形で命を落とさせる。 */
export function slay(w: WorldState, officerId: string, year: number): void {
  if (!OFFICERS[officerId]) return;
  w.spared = w.spared.filter((id) => id !== officerId);
  const known = w.slain[officerId];
  if (known === undefined || year < known) w.slain[officerId] = year;
}

// ---------------------------------------------------------------- 版図

/**
 * その年、その城市を持っている勢力。史実を、世界に起きた変化で上書きする。
 *
 * 奪った旗が効くのは、その勢力が世にあるあいだだけ。
 * 袁紹が官渡に勝って許昌を取っても、袁紹軍そのものが207年に絶えれば、
 * その先は史書の流れに戻る（絶えた勢力の跡目まではこの仕組みでは追えない）。
 */
export function rulerNow(w: WorldState, cityId: string, year: number): string | null {
  const seized = w.seized[cityId];
  if (!seized || seized.year > year) return historicalRuler(cityId, year);

  /**
   * その記録は、史実どおりの推移だったか。
   *
   * 事件の aftermath は正史の城の移りも差分に書き込む（214年の成都など）。
   * それを「奪った城」として扱うと、その後の史実の推移まで上書きしてしまい、
   * 何もしていない世界が勝手に別の三國志になる。
   *
   * 史実と一致していた記録は、地図の上では何も起きなかったのと同じ。
   * 以後もその城は史書の線に乗ったまま進む。
   */
  if (historicalRuler(cityId, seized.year) === seized.factionId) {
    return historicalRuler(cityId, year);
  }

  // ここから先は、史書に無い形で主の変わった城
  if (factionExists(seized.factionId, year)) return seized.factionId;
  // 取った勢力が名を改めただけなら、城は跡目のものになる（劉備軍→蜀漢）
  const heir = heirOf(seized.factionId, year);
  if (heir) return heir;
  /**
   * 跡目もなく絶えた。史書の主に返しはしない——返してよいなら、
   * そもそも奪った意味が消える。しばらく**主なき地**として、周りが取り合う。
   */
  return null;
}

/**
 * 滅んだ／名を改めた勢力の跡目。
 * 劉備軍→蜀漢、曹操軍→魏のように、同じ色を継いだ勢力を跡目とみなす。
 */
function heirOf(factionId: string, year: number): string | null {
  const dead = FACTIONS[factionId];
  if (!dead || dead.to === undefined || year <= dead.to) return null;
  for (const f of Object.values(FACTIONS)) {
    if (f.id === factionId) continue;
    if (f.color !== dead.color) continue;
    if (f.from < dead.to) continue;
    if (!factionExists(f.id, year)) continue;
    return f.id;
  }
  return null;
}

/** その勢力が、その年に世にあるか。 */
export function factionExists(factionId: string, year: number): boolean {
  const def = FACTIONS[factionId];
  if (!def) return false;
  return year >= def.from && (def.to === undefined || year <= def.to);
}

export function seize(w: WorldState, cityId: string, factionId: string, year: number): void {
  if (!CITY_CONTROL[cityId]) return;
  w.seized[cityId] = { factionId, year };
}

/** その勢力がいま持っている城市。 */
export function citiesOf(w: WorldState, factionId: string, year: number): CityDef[] {
  return CITIES.filter((city) => rulerNow(w, city.id, year) === factionId);
}

export interface Power {
  factionId: string;
  name: string;
  color: string;
  cities: CityDef[];
}

/** いまの天下の分かれよう。城の多い順。 */
export function powersAt(w: WorldState, year: number): Power[] {
  const byFaction = new Map<string, CityDef[]>();
  for (const city of CITIES) {
    const ruler = rulerNow(w, city.id, year);
    if (!ruler) continue;
    const list = byFaction.get(ruler) ?? [];
    list.push(city);
    byFaction.set(ruler, list);
  }
  return [...byFaction.entries()]
    .map(([factionId, cities]) => ({
      factionId,
      name: FACTIONS[factionId]?.name ?? factionId,
      color: FACTIONS[factionId]?.color ?? '#6b6b6b',
      cities,
    }))
    .sort((a, b) => b.cities.length - a.cities.length);
}

/**
 * 州ごとの旗。その州の城市を最も多く持つ勢力のもの、と割り切る。
 * 地図を勢力の色で塗るために使う。
 */
export function provinceHolders(w: WorldState, year: number): Record<string, string> {
  const tally = new Map<string, Map<string, number>>();
  for (const city of CITIES) {
    const ruler = rulerNow(w, city.id, year);
    if (!ruler) continue;
    const inner = tally.get(city.provinceId) ?? new Map<string, number>();
    // 城は町より重い。襄陽が動けば荊州の色が変わる。
    inner.set(ruler, (inner.get(ruler) ?? 0) + (city.kind === 'castle' ? 2 : 1));
    tally.set(city.provinceId, inner);
  }
  const result: Record<string, string> = {};
  for (const [provinceId, inner] of tally) {
    const best = [...inner.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) result[provinceId] = best[0];
  }
  return result;
}

// ---------------------------------------------------------------- 痕跡の適用

/**
 * 事件が世界に残す痕跡を刻む。
 * 事件側の aftermath（史実どおりに片づいた場合）と、
 * 選択肢側の aftermath（自分が史実を曲げた場合）の両方がここを通る。
 *
 * @param protectId この者の生き死にだけは書き換えない。
 *   自分自身の運命は回避条件の判定が持ち場なので、白門楼の aftermath が
 *   「呂布は死ぬ」と言っても、呂布を演じている本人には及ばない。
 */
export function applyAftermath(
  w: WorldState,
  after: Aftermath | undefined,
  year: number,
  protectId?: string,
): void {
  if (!after) return;
  for (const id of after.spares ?? []) if (id !== protectId) spare(w, id);
  for (const id of after.slays ?? []) if (id !== protectId) slay(w, id, year);
  for (const { city, faction } of after.seize ?? []) seize(w, city, faction, year);
}

/** 世に一報を流す。年送りを待たず、その場で起きたことに使う。 */
export function record(w: WorldState, item: WorldNews): void {
  w.news.push(item);
  if (w.news.length > NEWS_LIMIT) w.news.splice(0, w.news.length - NEWS_LIMIT);
}

// ---------------------------------------------------------------- 年送り

/**
 * 過ぎ去った年を、世界の側で決着させる。
 *
 * @param toYear ここまでを解決する。ふつうは「今年の前の年」。
 * @returns 新たに世に流れた報せ。
 */
export function advanceWorld(c: Chronicle, toYear: number): WorldNews[] {
  const w = ensureWorld(c);
  const fresh: WorldNews[] = [];
  if (toYear <= w.resolvedTo) return fresh;

  // 何十年も飛ばすことがあるので、年ごとに順に解く
  for (let year = w.resolvedTo + 1; year <= toYear; year++) {
    const before = fresh.length;
    resolveEvents(c, w, year, fresh);
    // 事件がすでに語った死を、訃報でもう一度流さないための下敷き
    const told = fresh
      .slice(before)
      .map((n) => n.text)
      .join('\n');
    resolveDeaths(c, w, year, fresh, told);

    const rulerAt = (cityId: string, at: number) => rulerNow(w, cityId, at);

    // 盤面が史実と食い違っていれば、勢力同士が城を取り合う
    const campaign = resolveCampaigns(
      c,
      w,
      year,
      (id) => factionExists(id, year),
      (id) => {
        const who = OFFICERS[id];
        return who ? aliveIn(w, who, year) : false;
      },
      rulerAt,
    );
    fresh.push(...campaign.news);

    resolveMap(c, w, year, fresh, campaign.taken);
  }

  w.resolvedTo = toYear;
  w.news.push(...fresh);
  if (w.news.length > NEWS_LIMIT) w.news.splice(0, w.news.length - NEWS_LIMIT);
  return fresh;
}

/** その年の事件を、居合わせなかったぶんも含めて片づける。 */
function resolveEvents(c: Chronicle, w: WorldState, year: number, out: WorldNews[]): void {
  for (const event of eventsIn(year)) {
    const deed = c.deeds.find((d) => d.eventId === event.id);

    // 自分が史実を曲げたなら、事件の痕跡は残らない。
    // 曲げたぶんの痕跡は、選んだその場で applyEffect が刻んでいる。
    if (deed?.diverged) {
      // その場で報せを流していれば、それが世に伝わった話になる
      if (outcomeOf(w, event.id)) continue;
      out.push({
        year,
        eventId: event.id,
        kind: 'divergence',
        text: `${event.name}は、史書のとおりにはならなかった`,
      });
      continue;
    }

    applyAftermath(w, event.aftermath, year, c.officerId);
    out.push({
      year,
      eventId: event.id,
      kind: 'history',
      text: event.aftermath?.news ?? event.record,
    });
  }
}

/**
 * その年に世を去る者。訃報は、名の通った者だけ流す。
 *
 * @param told その年の事件がすでに語ったこと。
 *   五丈原の報せが「諸葛亮没す」と言っているのに、
 *   そのあとで訃報として同じことをもう一度流すと、ただの重複になる。
 */
function resolveDeaths(
  c: Chronicle,
  w: WorldState,
  year: number,
  out: WorldNews[],
  told: string,
): void {
  for (const who of Object.values(OFFICERS)) {
    // 自分の生き死には運命の判定が受け持つ
    if (who.id === c.officerId) continue;
    if (deathYearOf(w, who) !== year) continue;

    const inRoster = c.roster.includes(who.id);
    if (inRoster) {
      c.roster = c.roster.filter((id) => id !== who.id);
      // 心の記録も畳む。名簿から消えた者の心を持ち続ける意味はない
      if (c.hearts) delete c.hearts[who.id];
    }

    // 配下の死だけは、事件が語っていても自分ごととして知らせる
    if (!inRoster) {
      if (!notable(who)) continue;
      if (told.includes(who.name)) continue;
    }
    out.push({ year, kind: 'death', text: obituary(w, who, year, inRoster) });
  }
}

/**
 * 訃報を流す価値のある者。
 * 手で書き込んだ痕跡（字・二つ名・能力値・運命・固有事件）が一つでもあれば、
 * それは作り手が「名のある者」として扱った武将だと見なす。
 */
function notable(who: Officer): boolean {
  return Boolean(
    who.epithet || who.fate || who.stats || who.courtesy || (who.events?.length ?? 0) > 0,
  );
}

function obituary(w: WorldState, who: Officer, year: number, inRoster: boolean): string {
  const age = Math.max(1, year - birthYear(who));
  if (inRoster) return `配下の${who.name}が世を去った。${age}`;
  // 史実どおりに没したなら、史書の一文をそのまま流す
  const record = who.fate?.year === year ? who.fate.record : undefined;
  if (record) return `${who.name}、${record}`;
  if (w.spared.includes(who.id)) return `${who.name}、天寿を全うして没す。${age}`;
  return `${who.name}、没す。${age}`;
}

/** 城の主が変わった年と、勢力が消えた年。 */
function resolveMap(
  c: Chronicle,
  w: WorldState,
  year: number,
  out: WorldNews[],
  taken: Set<string> = new Set(),
): void {
  for (const city of CITIES) {
    // 世界の戦がすでに語った城は、もう一度報せない
    if (taken.has(city.id)) continue;
    const before = rulerNow(w, city.id, year - 1);
    const after = rulerNow(w, city.id, year);
    if (before === after) continue;
    const from = before ? (FACTIONS[before]?.name ?? before) : '主なき地';
    const to = after ? (FACTIONS[after]?.name ?? after) : '主なき地';
    const province = PROVINCE_BY_ID[city.provinceId]?.name ?? '';
    out.push({
      year,
      kind: 'seize',
      text: `${province}${city.name}、${from}の手を離れて${to}のものとなる`,
    });
  }

  for (const faction of Object.values(FACTIONS)) {
    if (faction.id === 'ronin') continue;
    if (faction.to === undefined || faction.to !== year - 1) continue;
    // 城をひとつでも保っているなら、まだ滅んでいない
    if (citiesOf(w, faction.id, year).length > 0) continue;

    const heir = successorOf(w, faction.id, year);
    const heirName = heir ? (FACTIONS[heir]?.name ?? heir) : null;
    /**
     * 跡目が「その年に興った勢力」なら代替わり（孫策軍→呉、曹操軍→魏）。
     * すでに世にあった勢力が引き取ったのなら、それは併呑である（蜀漢→魏）。
     */
    const inherited = heir !== null && (FACTIONS[heir]?.from ?? 0) >= (faction.to ?? 0);

    out.push({
      year,
      kind: 'ruin',
      text: !heirName
        ? `${faction.name}、ここに絶ゆ`
        : inherited
          ? `${faction.name}の旗は${heirName}に継がれた`
          : `${faction.name}、${heirName}に併呑さる`,
    });

    // 主家が消えれば、跡目に移るか、行き場を失う
    if (c.factionId === faction.id) {
      c.factionId = inherited && heir ? heir : 'ronin';
      out.push({
        year,
        kind: 'ruin',
        text:
          inherited && heirName
            ? `旗が替わり、${heirName}に属することとなった`
            : '仕えるべき家を失い、無所属となった',
      });
    }
  }
}

/**
 * 消えた勢力の跡目。
 * その勢力が前年に持っていた城を、いま最も多く持っている者を跡目とみなす。
 * 城ごと奪われたなら跡目ではなく征服者が出るが、
 * 「その旗の下にいた者がどこへ行くか」という問いの答えとしては、それで正しい。
 */
function successorOf(w: WorldState, factionId: string, year: number): string | null {
  // 旗を降ろす年と城が動く年はぴったり重なるとは限らないので、
  // 最後に城を持っていた年まで少し遡って探す（孫策軍は呉に替わる前年に城を手放している）。
  let lost: CityDef[] = [];
  for (let back = 1; back <= 4 && lost.length === 0; back++) {
    lost = CITIES.filter((city) => rulerNow(w, city.id, year - back) === factionId);
  }

  const tally = new Map<string, number>();
  for (const city of lost) {
    const now = rulerNow(w, city.id, year);
    if (!now || now === factionId) continue;
    tally.set(now, (tally.get(now) ?? 0) + 1);
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// ---------------------------------------------------------------- 読み出し

/** 新しい順に、直近の報せ。 */
export function recentNews(w: WorldState, count: number): WorldNews[] {
  return w.news.slice(-count).reverse();
}

/** その事件が、世界の側でどう片づいたか。年代記の「現状」欄に出す。 */
export function outcomeOf(w: WorldState, eventId: string): WorldNews | null {
  for (let i = w.news.length - 1; i >= 0; i--) {
    const item = w.news[i]!;
    if (item.eventId === eventId) return item;
  }
  return null;
}

/** 天下がいくつに分かれているかの一行。列伝の結びに使う。 */
/**
 * 天下を一つにした勢力。まだ割れているなら null。
 *
 * 南蛮は数えない。あそこは中原の版図の外という扱いで、
 * 諸葛亮が七度捕えて七度放したのも、取らずに服させるためだった。
 */
export function unifiedBy(w: WorldState, year: number): string | null {
  const powers = powersAt(w, year).filter(
    (p) => p.factionId !== 'ronin' && p.factionId !== 'nanman',
  );
  return powers.length === 1 ? powers[0]!.factionId : null;
}

export function stateOfTheRealm(w: WorldState, year: number): string {
  const powers = powersAt(w, year).filter((p) => p.factionId !== 'ronin');
  if (powers.length === 0) return '天下に旗を立てる者なし';
  if (powers.length === 1) return `天下は${powers[0]!.name}のもとに一つであった`;
  const named = powers.slice(0, 3).map((p) => `${p.name}(${p.cities.length})`);
  return `天下は${named.join('・')}に分かれていた`;
}
