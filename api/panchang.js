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
const NAKSHATRA_NAMES=['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वाफाल्गुनी','उत्तराफाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपद','उत्तराभाद्रपद','रेवती'];
// विषघटी की पारंपरिक आरंभ-घटी; रोहिणी का 40 घटी मान प्रकाशित सारणियों में अनुमानित है।
const VARJYA_GHATI=[50,24,30,40,14,21,30,20,32,30,20,18,21,20,14,14,10,14,56,24,20,10,10,18,16,24,30];
function localDateJd(date, hour=0){
  const [y,m,d]=date.split('-').map(Number);
  return astronomy.julianDay(new Date(Date.UTC(y,m-1,d,hour)-TZ_OFFSET*3600000));
}
function jdIso(jd){return new Date((jd-2440587.5)*86400000).toISOString();}
function isVishti(index){return index>=1&&index<=56&&index%7===0;}
function calculateBhadraAndVarjya(date,system){
  const start=localDateJd(date,0),end=start+1;
  const bhadra=[],varjya=[];
  // Walk exact Karana/Nakshatra transitions across the local civil day.
  let cursor=start;
  for(let guard=0;guard<12&&cursor<end;guard++){
    const ix=astronomy.limbIndices(cursor+1e-8,system);
    const boundary=astronomy.nextBoundary(cursor+1e-8,'karana',system);
    if(!boundary||boundary<=cursor)break;
    if(isVishti(ix.karana)&&boundary>start&&cursor<end){
      bhadra.push({name:'भद्रा (विष्टि करण)',start:jdIso(Math.max(cursor,start)),end:jdIso(Math.min(boundary,end))});
    }
    cursor=boundary+1e-8;
  }
  cursor=start;
  for(let guard=0;guard<5&&cursor<end;guard++){
    const ix=astronomy.limbIndices(cursor+1e-8,system);
    const boundary=astronomy.nextBoundary(cursor+1e-8,'nakshatra',system);
    if(!boundary||boundary<=cursor)break;
    const n=ix.nakshatra,span=boundary-cursor;
    const vStart=cursor+span*VARJYA_GHATI[n]/60;
    const vEnd=cursor+span*(VARJYA_GHATI[n]+4)/60;
    if(vEnd>start&&vStart<end)varjya.push({name:'वर्ज्य काल • '+NAKSHATRA_NAMES[n],start:jdIso(Math.max(vStart,start)),end:jdIso(Math.min(vEnd,end)),nakshatra:NAKSHATRA_NAMES[n]});
    cursor=boundary+1e-8;
  }
  return {bhadra,varjya};
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
    const day = daily.calculate(date);\n    const inauspicious = calculateBhadraAndVarjya(date, calculated.ayanamsha.system);
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
        periods: day.periods, durmuhurta: day.durmuhurta, bhadra: inauspicious.bhadra, varjya: inauspicious.varjya, choghadiya: day.choghadiya, hora: day.hora,
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
