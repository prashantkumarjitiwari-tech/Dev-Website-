'use strict';

// Per-request Swiss Ephemeris adapter. This module is intentionally separate
// from the legacy Meeus engine until all dependent Panchang routines are migrated.
const norm = value => ((value % 360) + 360) % 360;

const BODY_KEYS = {
  sun: ['Sun'],
  moon: ['Moon'],
  mars: ['Mars'],
  mercury: ['Mercury'],
  jupiter: ['Jupiter'],
  venus: ['Venus'],
  saturn: ['Saturn'],
  rahu: ['TrueNode', 'MeanNode']
};
const AYANAMSHA_KEYS = {
  lahiri: ['Lahiri', 'IndianLahiri'],
  kp: ['Krishnamurti'],
  raman: ['Raman']
};

function enumValue(source, keys, label) {
  for (const key of keys) {
    if (source && source[key] !== undefined) return source[key];
  }
  throw new Error('Swiss Ephemeris enum missing: ' + label);
}

function utcJulianDay(swe, date, time) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  const decimalLocalHour = hour + minute / 60 + (second || 0) / 3600;
  return swe.julianDay(year, month, day, decimalLocalHour - 5.5);
}


const TITHI_NAMES = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा'];
const NAKSHATRAS = ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपद','उत्तराभाद्रपद','रेवती'];
const YOGAS = ['विष्कुम्भ','प्रीति','आयुष्मान','सौभाग्य','शोभन','अतिगण्ड','सुकर्मा','धृति','शूल','गण्ड','वृद्धि','ध्रुव','व्याघात','हर्षण','वज्र','सिद्धि','व्यतीपात','वरीयान','परिघ','शिव','सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म','इन्द्र','वैधृति'];
const KARANAS = ['बव','बालव','कौलव','तैतिल','गर','वणिज','विष्टि'];
const RASHIS = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
function karanaName(n) {
  if (n === 0) return 'किंस्तुघ्न';
  if (n >= 57) return ['शकुनि','चतुष्पद','नाग'][n - 57] || 'नाग';
  return KARANAS[(n - 1) % 7];
}
function localIsoFromJd(jd) {
  return new Date((jd - 2440587.5) * 86400000 + 5.5 * 3600000).toISOString().replace('Z', '+05:30');
}
function calculateSwissLimbs(swe, Body, flags, jd) {
  const sunBody = enumValue(Body, BODY_KEYS.sun, 'Sun');
  const moonBody = enumValue(Body, BODY_KEYS.moon, 'Moon');
  const cache = new Map();
  const angles = at => {
    const key = at.toFixed(9);
    if (cache.has(key)) return cache.get(key);
    const sun = norm(swe.calc(at, sunBody, { flags }).longitude);
    const moon = norm(swe.calc(at, moonBody, { flags }).longitude);
    const elongation = norm(moon - sun);
    const value = {
      sun, moon, elongation,
      tithi: Math.floor(elongation / 12),
      nakshatra: Math.floor(moon / (360 / 27)),
      yoga: Math.floor(norm(sun + moon) / (360 / 27)),
      karana: Math.floor(elongation / 6)
    };
    cache.set(key, value);
    return value;
  };
  const current = angles(jd);
  const endsAt = {};
  for (const key of ['tithi','nakshatra','yoga','karana']) {
    let lo = jd, hi = jd, found = false;
    for (let step = 1; step <= 72; step++) {
      hi = jd + step / 24;
      if (angles(hi)[key] !== current[key]) {
        lo = jd + (step - 1) / 24;
        found = true;
        break;
      }
    }
    if (!found) { endsAt[key] = null; continue; }
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (angles(mid)[key] === current[key]) lo = mid;
      else hi = mid;
    }
    endsAt[key] = localIsoFromJd((lo + hi) / 2);
  }
  const t = current.tithi;
  const n = current.nakshatra;
  return {
    limbs: {
      tithi: (t < 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष') + ' • ' + (t === 29 ? 'अमावस्या' : t === 14 ? 'पूर्णिमा' : TITHI_NAMES[t % 15]),
      tithiNumber: t + 1,
      nakshatra: NAKSHATRAS[n],
      nakshatraPada: Math.floor((current.moon % (360 / 27)) / (360 / 108)) + 1,
      yoga: YOGAS[current.yoga],
      karana: karanaName(current.karana)
    },
    endsAt,
    indices: { tithi: current.tithi, nakshatra: current.nakshatra, yoga: current.yoga, karana: current.karana }
  };
}

async function calculateSwiss(input) {
  const pkg = await import('@kuntay/swisseph');
  const createSwissEph = pkg.createSwissEph || (pkg.default && pkg.default.createSwissEph);
  if (typeof createSwissEph !== 'function') throw new Error('Swiss Ephemeris initializer unavailable');

  const swe = await createSwissEph();
  try {
    const system = String(input.ayanamsha || 'lahiri').toLowerCase();
    const mode = enumValue(pkg.Ayanamsa || (pkg.default && pkg.default.Ayanamsa), AYANAMSHA_KEYS[system] || AYANAMSHA_KEYS.lahiri, system);
    const Flag = pkg.Flag || (pkg.default && pkg.default.Flag);
    const Body = pkg.Body || (pkg.default && pkg.default.Body);
    const siderealFlag = enumValue(Flag, ['Sidereal'], 'Flag.Sidereal');
    const speedFlag = enumValue(Flag, ['Speed'], 'Flag.Speed');
    swe.setSiderealMode(mode);

    const [calcYear] = input.date.split('-').map(Number);
    let dataStatus = { loaded: [], missing: [], bytes: 0 };
    if (typeof pkg.FetchEphemeris === 'function' && typeof swe.loadEphemeris === 'function') {
      dataStatus = await swe.loadEphemeris(new pkg.FetchEphemeris(), {
        fromYear: Math.max(1800, calcYear),
        toYear: Math.min(2399, calcYear),
        fixedStars: false
      });
    }

    const jd = utcJulianDay(swe, input.date, input.time);
    const positions = {};
    const swissLimbs = calculateSwissLimbs(swe, Body, siderealFlag | speedFlag, jd);
    let actualEphemeris = 'swiss';
    for (const [key, aliases] of Object.entries(BODY_KEYS)) {
      const body = enumValue(Body, aliases, aliases[0]);
      const result = swe.calc(jd, body, { flags: siderealFlag | speedFlag });
      positions[key] = {
        longitude: norm(result.longitude),
        longitudeSpeed: result.longitudeSpeed,
        retrograde: result.longitudeSpeed < 0,
        ephemeris: result.ephemeris
      };
      if (result.ephemeris !== 'swiss') actualEphemeris = result.ephemeris;
    }
    positions.ketu = {
      longitude: norm(positions.rahu.longitude + 180),
      longitudeSpeed: positions.rahu.longitudeSpeed,
      retrograde: positions.rahu.retrograde,
      ephemeris: positions.rahu.ephemeris
    };
    return {
      julianDay: jd,
      ayanamsha: swe.ayanamsa(jd),
      positions,
      limbs: swissLimbs.limbs,
      endsAt: swissLimbs.endsAt,
      limbIndices: swissLimbs.indices,
      ephemeris: actualEphemeris,
      ephemerisData: dataStatus,
      engine: '@kuntay/swisseph',
      engineVersion: '0.2.2'
    };
  } finally {
    if (typeof swe.dispose === 'function') swe.dispose();
    else if (typeof swe.close === 'function') swe.close();
  }
}

module.exports = { calculateSwiss };
