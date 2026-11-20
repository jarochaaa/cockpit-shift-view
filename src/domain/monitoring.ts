// Multi-Store Monitoring mock: one fictional market on a peak evening (Groceries Day promo).
// Store, people and market names are placeholders; amounts in AED.

export type RegionId = 'mena' | 'latam' | 'europe' | 'apac';
export type CountryId = 'ae' | 'kw' | 'bh' | 'eg' | 'qa' | 'ar' | 'cl' | 'uy' | 'gr' | 'se' | 'at' | 'tw' | 'th' | 'my';
export type Zone = 'dubai' | 'abuDhabi' | 'sharjah' | 'kuwaitCity' | 'hawalli' | 'farwaniya' | 'manama' | 'muharraq' | 'cairo' | 'giza' | 'alexandria' | 'doha' | 'alRayyan'
  | 'buenosAires' | 'cordoba' | 'santiago' | 'valparaiso' | 'montevideo'
  | 'athens' | 'thessaloniki' | 'stockholm' | 'gothenburg' | 'vienna'
  | 'taipei' | 'kaohsiung' | 'bangkok' | 'chiangMai' | 'kualaLumpur' | 'penang';

/** MENA markets: local currency, cities used as zones, and the basket size each reports. */
export const COUNTRIES: { id: CountryId; region: RegionId; currency: string; zones: Zone[]; basket: number }[] = [
  { id: 'ae', region: 'mena', currency: 'AED', zones: ['dubai', 'abuDhabi', 'sharjah'], basket: 87.5 },
  { id: 'kw', region: 'mena', currency: 'KWD', zones: ['kuwaitCity', 'hawalli', 'farwaniya'], basket: 7.85 },
  { id: 'bh', region: 'mena', currency: 'BHD', zones: ['manama', 'muharraq'], basket: 8.4 },
  { id: 'eg', region: 'mena', currency: 'EGP', zones: ['cairo', 'giza', 'alexandria'], basket: 545 },
  { id: 'qa', region: 'mena', currency: 'QAR', zones: ['doha', 'alRayyan'], basket: 92.3 },
  { id: 'ar', region: 'latam', currency: 'ARS', zones: ['buenosAires', 'cordoba'], basket: 18500 },
  { id: 'cl', region: 'latam', currency: 'CLP', zones: ['santiago', 'valparaiso'], basket: 21000 },
  { id: 'uy', region: 'latam', currency: 'UYU', zones: ['montevideo'], basket: 980 },
  { id: 'gr', region: 'europe', currency: 'EUR', zones: ['athens', 'thessaloniki'], basket: 32.4 },
  { id: 'se', region: 'europe', currency: 'SEK', zones: ['stockholm', 'gothenburg'], basket: 365 },
  { id: 'at', region: 'europe', currency: 'EUR', zones: ['vienna'], basket: 34.9 },
  { id: 'tw', region: 'apac', currency: 'TWD', zones: ['taipei', 'kaohsiung'], basket: 820 },
  { id: 'th', region: 'apac', currency: 'THB', zones: ['bangkok', 'chiangMai'], basket: 690 },
  { id: 'my', region: 'apac', currency: 'MYR', zones: ['kualaLumpur', 'penang'], basket: 95 },
];
export type Band = 'high' | 'mild' | 'meets' | 'exceeds';
export type SignalKey = 'late' | 'assign' | 'unassigned' | 'prep' | 'pickers' | 'instore' | 'awt' | 'pfr' | 'fail' | 'age';
export type ActionKey = 'borrow' | 'riders' | 'escalate' | 'jira' | 'staff' | 'watch' | 'donor' | 'none';

export interface StoreRow {
  id: string;
  name: string;
  country: CountryId;
  zone: Zone;
  owner: string; // area manager
  orders: number; // orders in the last hour, used as weight
  late: number; // % late orders
  usualLate: number;
  assign: number; // min
  pick: number;
  pack: number;
  awt: number; // rider waiting, min
  estPickup: number; // estimated pickup time, min
  unassigned: number;
  active: number;
  planned: number;
  idle: number;
  pfr: number; // %
  usualPfr: number;
  fail: number; // %
  age: number; // consecutive days off target
}

const ZONE_OWNER = (z: Zone) => `Area manager ${COUNTRIES.flatMap((c) => c.zones).indexOf(z) + 1}`;
export const LEADER = 'Regional ops lead';
export const ESCALATE_DAY = 4; // day 4 off target escalates to the area manager's leader

// name, zone, orders, late, usualLate, assign, pick, pack, awt, unassigned, active, planned, idle, pfr, usualPfr, fail, age
const RAW: [string, Zone, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number][] = [
  ['01', 'sharjah', 42, 5, 5, 3.8, 6.2, 2.1, 6.5, 1, 6, 6, 0, 2.9, 3.0, 1.4, 0],
  ['02', 'sharjah', 38, 7, 6, 4.6, 6.8, 2.3, 7.2, 2, 5, 6, 0, 3.2, 3.1, 1.8, 1],
  ['05', 'sharjah', 40, 6, 5, 4.2, 6.5, 2.2, 6.8, 1, 6, 6, 0, 7.4, 3.2, 1.9, 1],
  ['08', 'sharjah', 30, 4, 5, 3.5, 5.9, 2.0, 5.9, 0, 4, 4, 0, 2.6, 2.7, 1.1, 0],
  ['11', 'sharjah', 45, 14, 6, 4.4, 6.0, 2.1, 14.0, 1, 6, 6, 0, 3.1, 3.0, 1.6, 1],
  ['13', 'sharjah', 35, 9, 6, 5.4, 7.0, 2.4, 7.8, 3, 5, 6, 0, 3.4, 3.2, 2.1, 2],
  ['03', 'dubai', 28, 3, 4, 2.1, 5.6, 1.9, 5.5, 0, 6, 6, 3, 2.4, 2.5, 1.0, 0],
  ['04', 'dubai', 44, 10, 6, 5.8, 7.1, 2.5, 8.1, 4, 5, 6, 0, 3.5, 3.3, 2.2, 1],
  ['06', 'dubai', 41, 8, 7, 5.2, 6.6, 2.3, 7.4, 2, 6, 6, 0, 3.0, 3.0, 1.7, 0],
  ['07', 'dubai', 52, 21, 7, 9.0, 7.4, 2.6, 8.4, 12, 4, 7, 0, 3.6, 3.4, 2.6, 2],
  ['09', 'dubai', 39, 7, 6, 4.9, 6.4, 2.2, 7.0, 2, 6, 6, 0, 7.9, 3.1, 2.0, 1],
  ['10', 'dubai', 36, 6, 6, 4.5, 6.3, 2.2, 6.6, 1, 5, 5, 0, 3.0, 3.0, 1.5, 0],
  ['12', 'abuDhabi', 33, 9, 6, 5.1, 6.9, 2.4, 7.1, 2, 5, 5, 0, 9.8, 3.5, 2.4, 4],
  ['14', 'abuDhabi', 37, 8, 6, 5.6, 6.7, 2.3, 7.3, 3, 5, 6, 0, 7.1, 3.0, 1.9, 1],
  ['15', 'abuDhabi', 43, 12, 7, 6.6, 7.2, 2.5, 8.6, 5, 5, 6, 0, 3.3, 3.2, 2.3, 2],
  ['16', 'abuDhabi', 34, 6, 5, 4.6, 6.2, 2.1, 6.9, 1, 5, 5, 0, 6.8, 2.9, 1.8, 1],
  ['17', 'abuDhabi', 29, 5, 5, 4.1, 6.0, 2.0, 6.2, 1, 4, 4, 0, 2.8, 2.8, 1.3, 0],
  ['18', 'abuDhabi', 46, 11, 7, 6.2, 7.0, 2.4, 8.0, 4, 6, 7, 0, 3.4, 3.3, 2.0, 1],
];

// Placeholder store names by neighbourhood (no real store names).
const UAE_NAME: Record<string, string> = {
  '01': 'Al Nahda', '02': 'Al Majaz', '05': 'Muwaileh', '08': 'Al Khan', '11': 'Al Taawun', '13': 'Al Qasimia',
  '03': 'Al Barsha', '04': 'Business Bay', '06': 'Jumeirah', '07': 'Dubai Marina', '09': 'Deira', '10': 'JLT',
  '12': 'Khalifa City', '14': 'Al Reem', '15': 'Mussafah', '16': 'Al Khalidiyah', '17': 'Corniche', '18': 'Yas',
};
const AREAS: Partial<Record<Zone, string[]>> = {
  kuwaitCity: ['Sharq', 'Dasman', 'Qibla'],
  hawalli: ['Salmiya', 'Jabriya', 'Rumaithiya'],
  farwaniya: ['Khaitan', 'Ardiya', 'Jleeb'],
  manama: ['Juffair', 'Seef', 'Adliya'],
  muharraq: ['Busaiteen', 'Amwaj', 'Arad'],
  cairo: ['Maadi', 'Heliopolis', 'Nasr City', 'Zamalek'],
  giza: ['Dokki', 'Mohandessin', 'Sheikh Zayed', '6th of October'],
  alexandria: ['Smouha', 'Sidi Gaber', 'Miami', 'Gleem'],
  doha: ['West Bay', 'Al Sadd', 'The Pearl', 'Msheireb'],
  alRayyan: ['Al Waab', 'Muaither', 'Al Gharafa', 'Abu Hamour'],
  buenosAires: ['Palermo', 'Recoleta', 'Belgrano', 'Caballito'],
  cordoba: ['Nueva Córdoba', 'Cerro de las Rosas', 'General Paz'],
  santiago: ['Providencia', 'Las Condes', 'Ñuñoa', 'Vitacura'],
  valparaiso: ['Viña del Mar', 'Cerro Alegre', 'Reñaca'],
  montevideo: ['Pocitos', 'Carrasco', 'Punta Carretas', 'Cordón', 'Malvín'],
  athens: ['Kolonaki', 'Glyfada', 'Marousi', 'Kifisia'],
  thessaloniki: ['Kalamaria', 'Ladadika', 'Toumba'],
  stockholm: ['Södermalm', 'Östermalm', 'Vasastan', 'Kungsholmen'],
  gothenburg: ['Haga', 'Linné', 'Majorna'],
  vienna: ['Neubau', 'Leopoldstadt', 'Döbling', 'Margareten', 'Josefstadt'],
  taipei: ['Xinyi', "Da'an", 'Zhongshan', 'Neihu'],
  kaohsiung: ['Lingya', 'Zuoying', 'Gushan'],
  bangkok: ['Sukhumvit', 'Silom', 'Ari', 'Thonglor'],
  chiangMai: ['Nimman', 'Old City', 'Santitham'],
  kualaLumpur: ['Bangsar', 'Mont Kiara', 'KLCC', 'Cheras'],
  penang: ['George Town', 'Tanjung Tokong', 'Bayan Lepas'],
};

const UAE: StoreRow[] = RAW.map(([n, zone, orders, late, usualLate, assign, pick, pack, awt, unassigned, active, planned, idle, pfr, usualPfr, fail, age]) => ({
  id: `st-${n}`,
  name: UAE_NAME[n],
  country: 'ae' as CountryId,
  zone,
  owner: ZONE_OWNER(zone),
  orders,
  late,
  usualLate,
  assign,
  pick,
  pack,
  awt,
  estPickup: 16,
  unassigned,
  active,
  planned,
  idle,
  pfr,
  usualPfr,
  fail,
  age,
}));

// Other MENA markets: healthy baselines with a few realistic amber spots (deterministic, no randomness).
const BASE = UAE.filter((r) => ['st-01', 'st-02', 'st-06', 'st-08', 'st-10', 'st-17'].includes(r.id));
const OTHER: [CountryId, number, number][] = [
  ['kw', 9, 1.0],
  ['bh', 6, 0.95],
  ['eg', 12, 1.12],
  ['qa', 7, 0.9],
  ['ar', 8, 1.15],
  ['cl', 6, 1.0],
  ['uy', 5, 0.9],
  ['gr', 6, 1.05],
  ['se', 6, 0.85],
  ['at', 5, 0.9],
  ['tw', 6, 0.95],
  ['th', 6, 1.1],
  ['my', 6, 1.0],
];
let next = 21;
const GENERATED: StoreRow[] = OTHER.flatMap(([country, n, load]) => {
  const zones = COUNTRIES.find((c) => c.id === country)!.zones;
  return Array.from({ length: n }, (_, i) => {
    const b = BASE[i % BASE.length];
    const f = load * (0.9 + ((i * 37) % 25) / 100);
    const num = String(next++);
    const zone = zones[i % zones.length];
    const area = AREAS[zone]![Math.floor(i / zones.length) % AREAS[zone]!.length];
    return {
      ...b,
      id: `st-${num}`,
      name: area,
      country,
      zone,
      owner: ZONE_OWNER(zone),
      orders: Math.round(b.orders * (country === 'eg' ? 1.4 : 0.8) * (0.85 + (i % 4) / 10)),
      late: Math.round(b.late * f),
      assign: +(b.assign * f).toFixed(1),
      awt: +(b.awt * (country === 'eg' && i === 4 ? 1.6 : f)).toFixed(1),
      unassigned: Math.round(b.unassigned * f),
      pfr: +(b.pfr * (country === 'kw' && i === 2 ? 1.6 : 1)).toFixed(1),
      age: country === 'eg' && i === 4 ? 2 : b.age,
    };
  });
});

export const STORES: StoreRow[] = [...UAE, ...GENERATED];

/** Country targets (lower is better, except pickers which is a coverage ratio). */
export const TARGET = { late: 6, assign: 4, instore: 20, awt: 8, pfr: 4, fail: 2, unassigned: 2, age: 1 };
/** Market-specific alert thresholds quoted in the rationale. */
export const ALERT = { assignMin: 5, awtMin: 10 };

export const prep = (s: StoreRow) => s.assign + s.pick + s.pack;
export const instore = (s: StoreRow) => prep(s) + s.awt;
export const coverage = (s: StoreRow) => s.active / s.planned;

/** Attainment band from value / target, for lower-is-better signals. */
export function band(value: number, target: number): Band {
  const r = value / target;
  return r > 1.25 ? 'high' : r > 1 ? 'mild' : r > 0.85 ? 'meets' : 'exceeds';
}
const coverageBand = (c: number): Band => (c < 0.75 ? 'high' : c < 0.9 ? 'mild' : c < 1 ? 'meets' : 'exceeds');

/** Cell tone per signal for one store; high = red, mild = amber. */
export function cell(s: StoreRow, k: SignalKey): Band {
  switch (k) {
    case 'late':
      return s.late > Math.max(TARGET.late, s.usualLate) * 1.25 ? 'high' : s.late > Math.max(TARGET.late, s.usualLate) ? 'mild' : 'meets';
    case 'assign':
      return s.assign > ALERT.assignMin ? 'high' : s.assign > TARGET.assign ? 'mild' : 'meets';
    case 'unassigned':
      return s.unassigned >= 6 ? 'high' : s.unassigned >= 3 ? 'mild' : 'meets';
    case 'prep':
      return prep(s) > s.estPickup ? 'high' : prep(s) > s.estPickup * 0.9 ? 'mild' : 'meets';
    case 'pickers':
      return coverageBand(coverage(s));
    case 'instore':
      return band(instore(s), TARGET.instore);
    case 'awt':
      return s.awt > ALERT.awtMin ? 'high' : s.awt > TARGET.awt ? 'mild' : 'meets';
    case 'pfr':
      return s.pfr > s.usualPfr * 1.8 ? 'high' : s.pfr > TARGET.pfr ? 'mild' : 'meets';
    case 'fail':
      return band(s.fail, TARGET.fail) === 'high' ? 'high' : s.fail > TARGET.fail ? 'mild' : 'meets';
    case 'age':
      return s.age >= ESCALATE_DAY ? 'high' : s.age >= 2 ? 'mild' : 'meets';
  }
}

const weighted = (f: (s: StoreRow) => number, list: StoreRow[]) => list.reduce((n, s) => n + f(s) * s.orders, 0) / Math.max(1, list.reduce((n, s) => n + s.orders, 0));

/** Market totals for a set of stores (a country, or the stores in scope), weighted by order volume. */
export function aggregate(list: StoreRow[]) {
  return {
    orders: list.reduce((n, s) => n + s.orders, 0),
    late: weighted((s) => s.late, list),
    assign: weighted((s) => s.assign, list),
    instore: weighted(instore, list),
    prep: weighted(prep, list),
    awt: weighted((s) => s.awt, list),
    pfr: weighted((s) => s.pfr, list),
    fail: weighted((s) => s.fail, list),
    unassigned: list.reduce((n, s) => n + s.unassigned, 0),
    active: list.reduce((n, s) => n + s.active, 0),
    planned: list.reduce((n, s) => n + s.planned, 0),
  };
}
const COUNTRY_INSTORE = Object.fromEntries(COUNTRIES.map((c) => [c.id, aggregate(STORES.filter((s) => s.country === c.id)).instore])) as Record<CountryId, number>;

/** Secondary market signals (asked for by single markets). */
export const SECONDARY = { nsfr: 96.4, refunds: 1.2, vsForecast: 22 };
export const PROMO = { name: 'Groceries Day', cashback: 30, window: '18:00–23:00' };

/** Distance from the store's own usual level and from the country weighted average. */
export function deviation(s: StoreRow) {
  const late = s.late / s.usualLate - 1;
  const pfr = s.pfr / s.usualPfr - 1;
  const usual = Math.max(late, pfr);
  const country = instore(s) / COUNTRY_INSTORE[s.country] - 1;
  // The signal that drifted most from the store's own usual level, and how worrying the drift is.
  const signal: 'late' | 'pfr' = pfr > late ? 'pfr' : 'late';
  const tone: Band = usual > 0.5 ? 'high' : usual > 0.2 ? 'mild' : 'meets';
  return { usual, country, signal, tone };
}

/** Ranking score: how far off target, own usual and country average, weighted by signal priority, plus deviation age. */
export function score(s: StoreRow) {
  const over = (v: number, t: number) => Math.max(0, v / t - 1);
  const d = deviation(s);
  return (
    3 * over(s.late, Math.max(TARGET.late, s.usualLate)) +
    2.5 * over(s.assign, TARGET.assign) +
    1.5 * over(s.unassigned, TARGET.unassigned) * 0.3 +
    1.5 * over(prep(s), s.estPickup) +
    1.5 * Math.max(0, 1 - coverage(s)) * 2 +
    1 * Math.max(0, d.country) +
    1.2 * over(s.awt, TARGET.awt) +
    1.2 * over(s.pfr, s.usualPfr) * 0.6 +
    0.8 * over(s.fail, TARGET.fail) +
    0.25 * s.age
  );
}

/** Next action per store, from the signal that is furthest off (the playbook in the brief). */
export function nextAction(s: StoreRow): ActionKey {
  if (s.age >= ESCALATE_DAY) return 'escalate';
  if (cell(s, 'assign') === 'high' && coverage(s) < 0.75) return 'borrow';
  if (cell(s, 'awt') === 'high' && cell(s, 'prep') !== 'high') return 'riders';
  if (cell(s, 'pfr') === 'high') return 'jira';
  if (s.idle > 0 && score(s) < 0.5) return 'donor';
  if (cell(s, 'pickers') === 'high' || cell(s, 'pickers') === 'mild' || cell(s, 'assign') === 'high') return 'staff';
  if (score(s) > 0.6) return 'watch';
  return 'none';
}

export const DONOR = 'st-03';
export const SYSTEM_ISSUE = ['st-05', 'st-09', 'st-14', 'st-16'];

export type AlertKey = 'storeA' | 'country' | 'system' | 'escalated' | 'riders' | 'promo';
export interface AlertItem {
  key: AlertKey;
  tone: 'error' | 'warning' | 'info';
  stores: string[];
  minutesAgo: number;
  escalated?: boolean;
}
export const ALERTS: AlertItem[] = [
  { key: 'storeA', tone: 'error', stores: ['st-07'], minutesAgo: 4 },
  { key: 'country', tone: 'error', stores: [], minutesAgo: 6 },
  { key: 'escalated', tone: 'error', stores: ['st-12'], minutesAgo: 12, escalated: true },
  { key: 'system', tone: 'warning', stores: SYSTEM_ISSUE, minutesAgo: 9 },
  { key: 'riders', tone: 'warning', stores: ['st-11'], minutesAgo: 14 },
  { key: 'promo', tone: 'info', stores: [], minutesAgo: 62 },
];

/**
 * Feasibility to consume or configure each data point, in %. A design estimate from where the data lives today:
 * live in SMC at store level is high, a new calculation or an outside tool is lower, null means unknown (shown as "Unknown").
 */
export const FEASIBILITY: Record<string, number | null> = {
  scope: null, live: 90, kpis: 80, late: 90, assign: 90, unassigned: 90, prep: 85, pickers: 50, instore: 75, awt: null, pfr: 85, fail: 85,
  age: null, secondary: null, ranking: 75, deviation: null, owner: null, action: null, drill: 90, alerts: null, promo: null,
};
