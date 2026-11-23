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
  kp: ['KpNew', 'KPNew', 'Krishnamurti'],
  raman: ['Raman', 'BVRaman']
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

    const jd = utcJulianDay(swe, input.date, input.time);
    const positions = {};
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
      ephemeris: actualEphemeris,
      engine: '@kuntay/swisseph',
      engineVersion: '0.2.2'
    };
  } finally {
    if (typeof swe.dispose === 'function') swe.dispose();
    else if (typeof swe.close === 'function') swe.close();
  }
}

module.exports = { calculateSwiss };
