'use strict';

// Fully local Panchang endpoint. No third-party Panchang API is called.
const LAT = 27.565;
const LON = 77.659;
const TZ_OFFSET = 5.5;
const TIME_ZONE = 'Asia/Kolkata';
const astronomy = require('./panchang-astronomy');
const daily = require('./panchang-daily');

function todayIST() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return { year: Number(p.year), month: Number(p.month), date: Number(p.day) };
}
function formatTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}
function formatRange(value) {
  return value && value.start && value.end
    ? formatTime(value.start) + ' – ' + formatTime(value.end)
    : null;
}

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const today = todayIST();
    const requested = req.query && req.query.date;
    const date = requested || [today.year, String(today.month).padStart(2, '0'), String(today.date).padStart(2, '0')].join('-');
    const calculated = astronomy.calculate({
      date, time: '12:00:00', timezone: TZ_OFFSET,
      ayanamsha: (req.query && req.query.ayanamsha) || 'lahiri',
      latitude: LAT, longitude: LON
    });
    const day = daily.calculate(date);
    const data = {
      vara: day.weekday,
      tithi: calculated.limbs.tithi,
      tithiEnd: calculated.endsAt.tithi,
      nakshatra: calculated.limbs.nakshatra,
      nakshatraPada: calculated.limbs.nakshatraPada,
      nakshatraEnd: calculated.endsAt.nakshatra,
      yoga: calculated.limbs.yoga,
      yogaEnd: calculated.endsAt.yoga,
      karana: calculated.limbs.karana,
      karanaEnd: calculated.endsAt.karana,
      sunrise: formatTime(day.sunrise),
      sunset: formatTime(day.sunset),
      moonrise: formatTime(calculated.riseSet && calculated.riseSet.moon && calculated.riseSet.moon.rise),
      moonset: formatTime(calculated.riseSet && calculated.riseSet.moon && calculated.riseSet.moon.set),
      rahuKaal: formatRange(day.periods.rahuKaal),
      gulika: formatRange(day.periods.gulika),
      yamagand: formatRange(day.periods.yamagand),
      abhijit: formatRange(day.periods.abhijit),
      brahma: formatRange(day.periods.brahma),
      amrit: null,
      choghadiya: day.choghadiya,
      hora: day.hora,
      grahas: calculated.grahas
    };
    return res.status(200).json({
      date: { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), date: Number(date.slice(8, 10)) },
      location: { name: 'श्रीधाम वृंदावन', latitude: LAT, longitude: LON, timezone: TIME_ZONE, ayanamsha: calculated.ayanamsha.system },
      data,
      traditional: {},
      details: {
        periods: day.periods, choghadiya: day.choghadiya, hora: day.hora,
        astronomy: calculated.positions, grahas: calculated.grahas,
        riseSet: calculated.riseSet, astronomyEndsAt: calculated.endsAt,
        julianDay: calculated.julianDay
      },
      astroAvailable: false,
      extendedAvailable: false,
      providers: { navamsha: false, astroLogics: false, goPixel: false, independent: true },
      fallback: false,
      engine: calculated.engine,
      engineVersion: calculated.engineVersion,
      accuracyNotice: calculated.accuracyNotice,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Independent Panchang engine:', error.stack || error.message);
    return res.status(400).json({ error: 'स्वतंत्र पंचांग गणना में त्रुटि हुई।', detail: error.message });
  }
};
