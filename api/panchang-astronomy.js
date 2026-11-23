'use strict';

// Independent Panchang calculation core. Meeus-style low-precision Sun/Moon series.
// Not a certified ephemeris: compare against a high-precision source and named almanacs
// before using the output as the final authority for religious observances.

const DEG = Math.PI / 180;
const norm = x => ((x % 360) + 360) % 360;
const sin = x => Math.sin(x * DEG);
const cos = x => Math.cos(x * DEG);
const NAK_SPAN = 360 / 27;
const YOGA_SPAN = 360 / 27;

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
  const lahiri = 23.85675 + 1.3969713*T + 0.0003086*T*T;
  if (system === 'raman') return lahiri - 1.46;
  if (system === 'kp') return lahiri; // Provisional only; true KP settings require validation.
  return lahiri;
}

const TITHI_NAMES = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा'];
const NAKSHATRAS = ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपद','उत्तराभाद्रपद','रेवती'];
const YOGAS = ['विष्कुम्भ','प्रीति','आयुष्मान','सौभाग्य','शोभन','अतिगण्ड','सुकर्मा','धृति','शूल','गण्ड','वृद्धि','ध्रुव','व्याघात','हर्षण','वज्र','सिद्धि','व्यतीपात','वरीयान','परिघ','शिव','सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म','इन्द्र','वैधृति'];
const KARANAS = ['बव','बालव','कौलव','तैतिल','गर','वणिज','विष्टि'];

function anglesAt(jd, system) {
  const ay = ayanamsha(jd, system);
  const sun = norm(solarLongitude(jd) - ay);
  const moon = norm(lunarLongitude(jd) - ay);
  return { sun, moon, elongation: norm(moon - sun) };
}
function limbIndices(jd, system) {
  const p = anglesAt(jd, system);
  return {
    tithi: Math.floor(p.elongation / 12),
    nakshatra: Math.floor(p.moon / NAK_SPAN),
    yoga: Math.floor(norm(p.sun + p.moon) / YOGA_SPAN),
    karana: Math.floor(p.elongation / 6)
  };
}
function karanaName(n) {
  if (n === 0) return 'किंस्तुघ्न';
  if (n >= 57) return ['शकुनि','चतुष्पद','नाग'][n-57] || 'नाग';
  return KARANAS[(n-1)%7];
}
function describeLimbs(jd, system) {
  const p = anglesAt(jd, system), ix = limbIndices(jd, system);
  const tithiIndex = ix.tithi % 15;
  return {
    tithi: (ix.tithi < 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष') + ' • ' +
      (ix.tithi === 29 ? 'अमावस्या' : (ix.tithi === 14 ? 'पूर्णिमा' : TITHI_NAMES[tithiIndex])),
    tithiNumber: ix.tithi + 1,
    nakshatra: NAKSHATRAS[ix.nakshatra],
    nakshatraPada: Math.floor((p.moon % NAK_SPAN) / (360/108)) + 1,
    yoga: YOGAS[ix.yoga],
    karana: karanaName(ix.karana)
  };
}

// Locate the next boundary of each anga, then bisect it to about one second.
// The hourly scan is safe for the expected angular speeds of these four limbs.
function nextBoundary(jd, key, system) {
  const startIndex = limbIndices(jd, system)[key];
  let lo = jd, hi = jd, found = false;
  for (let i = 0; i < 96; i++) {
    hi = jd + (i + 1) / 24;
    if (limbIndices(hi, system)[key] !== startIndex) { lo = jd + i / 24; found = true; break; }
  }
  if (!found) return null;
  for (let i = 0; i < 42; i++) {
    const mid = (lo + hi) / 2;
    if (limbIndices(mid, system)[key] === startIndex) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
function localIsoFromJd(jd, offset) {
  const local = new Date((jd - 2440587.5) * 86400000 + offset * 3600000);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset), oh = String(Math.floor(abs)).padStart(2,'0');
  const om = String(Math.round((abs - Math.floor(abs))*60)).padStart(2,'0');
  return local.toISOString().replace('Z', sign + oh + ':' + om);
}


const RASHIS = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
function orbitalPosition(name, d) {
  const el = {
    mercury:[48.3313+3.24587e-5*d,7.0047+5e-8*d,29.1241+1.01444e-5*d,0.387098,0.205635+5.59e-10*d,168.6562+4.0923344368*d],
    venus:[76.6799+2.4659e-5*d,3.3946+2.75e-8*d,54.8910+1.38374e-5*d,0.723330,0.006773-1.302e-9*d,48.0052+1.6021302244*d],
    mars:[49.5574+2.11081e-5*d,1.8497-1.78e-8*d,286.5016+2.92961e-5*d,1.523688,0.093405+2.516e-9*d,18.6021+0.5240207766*d],
    jupiter:[100.4542+2.76854e-5*d,1.3030-1.557e-7*d,273.8777+1.64505e-5*d,5.20256,0.048498+4.469e-9*d,19.8950+0.0830853001*d],
    saturn:[113.6634+2.3898e-5*d,2.4886-1.081e-7*d,339.3939+2.97661e-5*d,9.55475,0.055546-9.499e-9*d,316.9670+0.0334442282*d]
  }[name];
  const [N,i,w,a,e,M0]=el, M=norm(M0);
  let E=M+e/DEG*sin(M)*(1+e*cos(M));
  for(let k=0;k<6;k++) E-= (E-e/DEG*sin(E)-M)/(1-e*cos(E));
  const xv=a*(cos(E)-e), yv=a*Math.sqrt(1-e*e)*sin(E);
  const v=Math.atan2(yv,xv)/DEG, r=Math.hypot(xv,yv);
  const xh=r*(cos(N)*cos(v+w)-sin(N)*sin(v+w)*cos(i));
  const yh=r*(sin(N)*cos(v+w)+cos(N)*sin(v+w)*cos(i));
  const zh=r*sin(v+w)*sin(i);
  return {x:xh,y:yh,z:zh};
}
function planetaryLongitudes(jd, ay) {
  const d=jd-2451543.5;
  const sunLon=solarLongitude(jd);
  const sunR=1.00014*(1.00014); // scale is immaterial to longitude; refined Earth radius below
  const earthAngle=(sunLon+180)*DEG;
  const earth={x:Math.cos(earthAngle),y:Math.sin(earthAngle),z:0};
  const planets=[];
  for(const name of ['mercury','venus','mars','jupiter','saturn']){
    const p=orbitalPosition(name,d);
    const lon=norm(Math.atan2(p.y+Math.sin(sunLon*DEG),p.x+Math.cos(sunLon*DEG))/DEG-ay);
    const sid=norm(lon);
    planets.push({name,longitude:Number(sid.toFixed(4)),rashi:RASHIS[Math.floor(sid/30)],degrees:Number((sid%30).toFixed(4)),calculation:'approximate'});
  }
  const node=norm(125.04452-1934.136261*centuries(jd)+0.0020708*Math.pow(centuries(jd),2));
  const rahu=norm(node-ay), ketu=norm(rahu+180);
  planets.push({name:'राहु',longitude:Number(rahu.toFixed(4)),rashi:RASHIS[Math.floor(rahu/30)],degrees:Number((rahu%30).toFixed(4)),calculation:'mean lunar node'});
  planets.push({name:'केतु',longitude:Number(ketu.toFixed(4)),rashi:RASHIS[Math.floor(ketu/30)],degrees:Number((ketu%30).toFixed(4)),calculation:'opposite mean node'});
  const sunSid=norm(sunLon-ay), moonSid=norm(lunarLongitude(jd)-ay);
  planets.unshift(
    {name:'सूर्य',longitude:Number(sunSid.toFixed(4)),rashi:RASHIS[Math.floor(sunSid/30)],degrees:Number((sunSid%30).toFixed(4)),calculation:'approximate'},
    {name:'चन्द्र',longitude:Number(moonSid.toFixed(4)),rashi:RASHIS[Math.floor(moonSid/30)],degrees:Number((moonSid%30).toFixed(4)),calculation:'approximate'}
  );
  return planets;
}


function ascendantLongitude(jd, latitude, longitude, ay) {
  const T=centuries(jd);
  const gmst=norm(280.46061837+360.98564736629*(jd-2451545)+0.000387933*T*T-T*T*T/38710000);
  const theta=norm(gmst+longitude)*DEG;
  const eps=(23.439291-0.0130042*T)*DEG;
  const phi=latitude*DEG;
  const tropical=norm(Math.atan2(-Math.cos(theta),Math.sin(eps)*Math.tan(phi)+Math.cos(eps)*Math.sin(theta))/DEG);
  return norm(tropical-ay);
}
function lunarLatitude(jd) {
  const T=centuries(jd);
  const D=norm(297.8501921+445267.1114034*T-0.0018819*T*T);
  const Mp=norm(134.9633964+477198.8675055*T+0.0087414*T*T);
  const F=norm(93.2720950+483202.0175233*T-0.0036539*T*T);
  return 5.128189*sin(F)+0.280606*sin(Mp+F)+0.277693*sin(Mp-F)
    +0.173238*sin(2*D-F)+0.055413*sin(2*D-Mp+F)
    +0.046272*sin(2*D+F)+0.032573*sin(2*Mp+F)
    +0.017198*sin(2*D+Mp-F)+0.009267*sin(2*D-Mp-F);
}
function altitudeAt(jd, lat, lon, body) {
  const T=centuries(jd), eps=(23.439291-0.0130042*T)*DEG;
  const lambda=(body==='sun'?solarLongitude(jd):lunarLongitude(jd))*DEG;
  const beta=(body==='sun'?0:lunarLatitude(jd))*DEG;
  const ra=Math.atan2(Math.sin(lambda)*Math.cos(eps)-Math.tan(beta)*Math.sin(eps),Math.cos(lambda));
  const dec=Math.asin(Math.sin(beta)*Math.cos(eps)+Math.cos(beta)*Math.sin(eps)*Math.sin(lambda));
  const jd0=Math.floor(jd-0.5)+0.5;
  const H=(280.46061837+360.98564736629*(jd-jd0)+lon-ra/DEG);
  const hour=((H%360)+360)%360*DEG;
  const phi=lat*DEG;
  return Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(hour))/DEG;
}
function riseSetForLocalDate(dateText, lat, lon, offset, body) {
  const [y,m,d]=dateText.split('-').map(Number);
  const start=julianDay(new Date(Date.UTC(y,m-1,d)-offset*3600000));
  const threshold=body==='sun'?-0.833:0.125;
  let prevT=start, prev=altitudeAt(start,lat,lon,body)-threshold;
  let rise=null,set=null;
  for(let i=1;i<=288;i++){
    const t=start+i/288, val=altitudeAt(t,lat,lon,body)-threshold;
    if(prev<=0&&val>0) rise=bisectAltitude(prevT,t,lat,lon,body,threshold);
    if(prev>=0&&val<0) set=bisectAltitude(prevT,t,lat,lon,body,threshold);
    prevT=t;prev=val;
  }
  return {rise:rise===null?null:localIsoFromJd(rise,offset),set:set===null?null:localIsoFromJd(set,offset),method:'approximate-geocentric-horizon'};
}
function bisectAltitude(lo,hi,lat,lon,body,threshold){
  for(let i=0;i<35;i++){const mid=(lo+hi)/2;if((altitudeAt(mid,lat,lon,body)-threshold)>0)hi=mid;else lo=mid;}
  return (lo+hi)/2;
}

function calculate(input={}) {
  const dateText = input.date || new Date().toISOString().slice(0,10);
  const timeText = input.time || '12:00:00';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error('date must be YYYY-MM-DD');
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(timeText)) throw new Error('time must be HH:MM or HH:MM:SS');
  const [y,m,d] = dateText.split('-').map(Number);
  const [hh,mm,ss=0] = timeText.split(':').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59 || ss > 59) throw new Error('Invalid date/time');
  const offset = input.timezone === undefined ? 5.5 : Number(input.timezone);
  if (!Number.isFinite(offset) || offset < -12 || offset > 14) throw new Error('timezone must be a UTC offset from -12 to +14');
  const check = new Date(Date.UTC(y,m-1,d,hh,mm,ss));
  if (check.getUTCFullYear() !== y || check.getUTCMonth()+1 !== m || check.getUTCDate() !== d) throw new Error('Invalid calendar date');
  const system = String(input.ayanamsha || 'lahiri').toLowerCase();
  if (!['lahiri','kp','raman'].includes(system)) throw new Error('ayanamsha must be lahiri, kp, or raman');
  const utc = new Date(check.getTime() - offset*3600000);
  const jd = julianDay(utc), ay = ayanamsha(jd, system);
  const sunTropical = solarLongitude(jd), moonTropical = lunarLongitude(jd);
  const limbs = describeLimbs(jd, system);
  const riseSet = input.latitude !== undefined && input.longitude !== undefined ? {
    sun: riseSetForLocalDate(dateText, Number(input.latitude), Number(input.longitude), offset, 'sun'),
    moon: riseSetForLocalDate(dateText, Number(input.latitude), Number(input.longitude), offset, 'moon')
  } : null;
  const grahas = planetaryLongitudes(jd, ay);
  const lagnaLongitude=ascendantLongitude(jd,Number(input.latitude||0),Number(input.longitude||0),ay);
  const lagnaRashi=Math.floor(lagnaLongitude/30);
  const kundali={lagna:{longitude:Number(lagnaLongitude.toFixed(4)),rashi:RASHIS[lagnaRashi],degrees:Number((lagnaLongitude%30).toFixed(4))},houses:Array.from({length:12},(_,i)=>({house:i+1,rashi:RASHIS[(lagnaRashi+i)%12],signIndex:(lagnaRashi+i)%12,grahas:[]}))};
  grahas.forEach(g=>{const house=((RASHIS.indexOf(g.rashi)-lagnaRashi+12)%12)+1;g.house=house;kundali.houses[house-1].grahas.push(g.name);});
  const endsAt = {};
  for (const key of ['tithi','nakshatra','yoga','karana']) {
    const boundary = nextBoundary(jd, key, system);
    endsAt[key] = boundary === null ? null : localIsoFromJd(boundary, offset);
  }
  return {
    engine: 'independent-meeus-lite',
    engineVersion: '0.4.0',
    julianDay: Number(jd.toFixed(6)),
    utc: utc.toISOString(),
    ayanamsha: { system, degrees: Number(ay.toFixed(6)), status: 'approximate' },
    positions: {
      sun: { tropicalLongitude: Number(sunTropical.toFixed(6)), siderealLongitude: Number(norm(sunTropical-ay).toFixed(6)) },
      moon: { tropicalLongitude: Number(moonTropical.toFixed(6)), siderealLongitude: Number(norm(moonTropical-ay).toFixed(6)) }
    },
    limbs,
    grahas,
    riseSet,
    endsAt,
    accuracyNotice: 'प्रारंभिक स्वतंत्र गणना: सूर्य/चन्द्रमा के निम्न-परिशुद्धता सूत्र और अनुमानित अयनांश। अंगों के समाप्ति समय संख्यात्मक रूप से निकाले गए हैं, पर उच्च-परिशुद्धता ephemeris तथा प्रमाणित काशी/ऋषिकेश पंचांग से मिलान बाकी है; अभी इसे धार्मिक निर्णय का अंतिम आधार न मानें।'
  };
}

module.exports = { calculate, julianDay, solarLongitude, lunarLongitude, ayanamsha, limbIndices, nextBoundary, planetaryLongitudes, riseSetForLocalDate, lunarLatitude, ascendantLongitude };
