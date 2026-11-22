'use strict';

// Independent Panchang astronomy core (Meeus-style low-precision series).
// This is a foundational engine, not a certified ephemeris. Validate against
// a high-precision ephemeris and published almanacs before using for rituals.

const DEG = Math.PI / 180;
const norm = x => ((x % 360) + 360) % 360;
const sin = x => Math.sin(x * DEG);
const cos = x => Math.cos(x * DEG);

function julianDay(date) {
  let y = date.getUTCFullYear(), m = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + (date.getUTCHours() + (date.getUTCMinutes() + date.getUTCSeconds()/60)/60)/24;
  if (m <= 2) { y--; m += 12; }
  const a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

function centuries(jd) { return (jd - 2451545.0) / 36525; }

function solarLongitude(jd) {
  const T = centuries(jd);
  const L0 = norm(280.46646 + 36000.76983*T + 0.0003032*T*T);
  const M = norm(357.52911 + 35999.05029*T - 0.0001537*T*T + T*T*T/24490000);
  const C = (1.914602 - 0.004817*T - 0.000014*T*T)*sin(M)
    + (0.019993 - 0.000101*T)*sin(2*M) + 0.000289*sin(3*M);
  const omega = 125.04 - 1934.136*T;
  return norm(L0 + C - 0.00569 - 0.00478*sin(omega));
}

function lunarLongitude(jd) {
  const T = centuries(jd), Lp = norm(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000);
  const D = norm(297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - T*T*T*T/113065000);
  const M = norm(357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000);
  const Mp = norm(134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - T*T*T*T/14712000);
  const F = norm(93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000);
  const terms = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
    [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
    [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
    [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
    [2,0,-1,2,-2602],[2,-1,-2,0,2390]
  ];
  let sum = 0;
  for (const [d,m,mp,f,c] of terms) sum += c * sin(d*D + m*M + mp*Mp + f*F);
  return norm(Lp + sum/1000000);
}

function ayanamsha(jd, system='lahiri') {
  const T = (jd - 2451545.0) / 36525;
  // Approximate epoch-based offsets. Replace with validated constants/series
  // before claiming publication-grade Lahiri/KP/Raman results.
  const lahiri = 23.85675 + 1.3969713*T + 0.0003086*T*T;
  if (system === 'raman') return lahiri - 1.46;
  if (system === 'kp') return lahiri + 0.0; // KP commonly uses a Lahiri-derived value; edition settings may differ.
  return lahiri;
}

const TITHI_NAMES = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा'];
const NAKSHATRAS = ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपद','उत्तराभाद्रपद','रेवती'];
const YOGAS = ['विष्कुम्भ','प्रीति','आयुष्मान','सौभाग्य','शोभन','अतिगण्ड','सुकर्मा','धृति','शूल','गण्ड','वृद्धि','ध्रुव','व्याघात','हर्षण','वज्र','सिद्धि','व्यतीपात','वरीयान','परिघ','शिव','सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म','इन्द्र','वैधृति'];
const KARANAS = ['बव','बालव','कौलव','तैतिल','गर','वणिज','विष्टि'];
function limbNames(sunSid, moonSid) {
  const elongation = norm(moonSid - sunSid);
  const tithiNo = Math.floor(elongation / 12);
  const paksha = tithiNo < 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
  const tithiIndex = tithiNo % 15;
  const nakIndex = Math.floor(norm(moonSid) / (360/27));
  const yogaIndex = Math.floor(norm(sunSid + moonSid) / (360/27));
  const karanaNo = Math.floor(elongation / 6);
  let karana;
  if (karanaNo === 0) karana = 'किंस्तुघ्न';
  else if (karanaNo >= 57) karana = ['शकुनि','चतुष्पद','नाग'][karanaNo-57] || 'नाग';
  else karana = KARANAS[(karanaNo-1)%7];
  return {
    tithi: paksha + ' • ' + (tithiNo === 29 ? 'अमावस्या' : (tithiNo === 14 ? 'पूर्णिमा' : TITHI_NAMES[tithiIndex])),
    tithiNumber: tithiNo + 1,
    nakshatra: NAKSHATRAS[nakIndex],
    nakshatraPada: Math.floor((norm(moonSid) % (360/27)) / (360/108)) + 1,
    yoga: YOGAS[yogaIndex],
    karana
  };
}

function calculate(input={}) {
  const dateText = input.date || new Date().toISOString().slice(0,10);
  const timeText = input.time || '12:00:00';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error('date must be YYYY-MM-DD');
  const [y,m,d] = dateText.split('-').map(Number);
  const [hh,mm,ss=0] = timeText.split(':').map(Number);
  const offset = Number.isFinite(Number(input.timezone)) ? Number(input.timezone) : 5.5;
  const utc = new Date(Date.UTC(y,m-1,d,hh,mm,ss) - offset*3600000);
  if (Number.isNaN(utc.getTime())) throw new Error('Invalid date/time');
  const jd = julianDay(utc), ay = ayanamsha(jd, input.ayanamsha || 'lahiri');
  const sunTropical = solarLongitude(jd), moonTropical = lunarLongitude(jd);
  const sunSidereal = norm(sunTropical - ay), moonSidereal = norm(moonTropical - ay);
  return {
    engine: 'independent-meeus-lite',
    engineVersion: '0.1.0',
    julianDay: Number(jd.toFixed(6)),
    utc: utc.toISOString(),
    ayanamsha: { system: input.ayanamsha || 'lahiri', degrees: Number(ay.toFixed(6)), status: 'approximate' },
    positions: {
      sun: { tropicalLongitude: Number(sunTropical.toFixed(6)), siderealLongitude: Number(sunSidereal.toFixed(6)) },
      moon: { tropicalLongitude: Number(moonTropical.toFixed(6)), siderealLongitude: Number(moonSidereal.toFixed(6)) }
    },
    limbs: limbNames(sunSidereal, moonSidereal),
    accuracyNotice: 'प्रारंभिक स्वतंत्र गणना: सूर्य/चन्द्रमा के निम्न-परिशुद्धता सूत्र। अयनांश व पंचांग परिणामों का उच्च-परिशुद्धता ephemeris तथा प्रमाणित पंचांग से मिलान बाकी है; इसे अभी धार्मिक निर्णय का अंतिम आधार न मानें।'
  };
}

module.exports = { calculate, julianDay, solarLongitude, lunarLongitude, ayanamsha };
