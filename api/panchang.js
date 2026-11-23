'use strict';

// Fully local Panchang endpoint. No third-party Panchang API is called.
const RASHI_NAMES_FOR_API = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
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
function currentTimeIST() {
  return new Intl.DateTimeFormat('en-GB',{timeZone:TIME_ZONE,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date());
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
const SAMVATSARA_NAMES=['प्रभव','विभव','शुक्ल','प्रमोद','प्रजापति','आङ्गिरस','श्रीमुख','भाव','युव','धाता','ईश्वर','बहुधान्य','प्रमाथी','विक्रम','वृष','चित्रभानु','स्वभानु','तारण','पार्थिव','व्यय','सर्वजित्','सर्वधारी','विरोधी','विकृति','खर','नन्दन','विजय','जय','मन्मथ','दुर्मुख','हेमलम्बी','विलम्बी','विकारी','शार्वरी','प्लव','शुभकृत्','शोभकृत्','क्रोधी','विश्वावसु','पराभव','प्लवंग','कीलक','सौम्य','साधारण','विरोधकृत्','परिधावी','प्रमादी','आनन्द','राक्षस','अनल','पिङ्गल','कालयुक्ति','सिद्धार्थी','रौद्र','दुर्मति','दुन्दुभि','रुधिरोद्गारी','रक्ताक्ष','क्रोधन','क्षय'];
const RASHI_NAMES=['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
const LUNAR_MONTHS=['चैत्र','वैशाख','ज्येष्ठ','आषाढ़','श्रावण','भाद्रपद','आश्विन','कार्तिक','मार्गशीर्ष','पौष','माघ','फाल्गुन'];
function findLunationNewMoon(jd, direction, system) {
  // Find the nearest 29 -> 0 tithi transition, sampling every six hours.
  let previous=jd;
  let previousIndex=astronomy.limbIndices(previous,system).tithi;
  for(let step=1;step<=160;step++){
    const current=jd+direction*step/4;
    const currentIndex=astronomy.limbIndices(current,system).tithi;
    const older=direction<0?current:previous;
    const newer=direction<0?previous:current;
    const olderIndex=direction<0?currentIndex:previousIndex;
    const newerIndex=direction<0?previousIndex:currentIndex;
    if(olderIndex===29&&newerIndex===0){
      let lo=older,hi=newer;
      for(let i=0;i<42;i++){
        const mid=(lo+hi)/2;
        if(astronomy.limbIndices(mid,system).tithi===29)lo=mid;
        else hi=mid;
      }
      return hi;
    }
    previous=current;
    previousIndex=currentIndex;
  }
  return null;
}
function siderealSolarSign(jd,system){
  const tropical=astronomy.solarLongitude(jd);
  const ay=astronomy.ayanamsha(jd,system);
  return Math.floor((((tropical-ay)%360)+360)%360/30);
}

function chaitraSamvatsaraBounds(jd,system){
 let ingress=null,previous=jd,prevSign=siderealSolarSign(previous,system);
 for(let i=1;i<=1600;i++){
  const t=jd-i*0.25,sign=siderealSolarSign(t,system);
  if(sign===11&&prevSign!==11){
   let lo=t,hi=previous;
   for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(siderealSolarSign(mid,system)===11)hi=mid;else lo=mid;}
   ingress=hi;break;
  }
  previous=t;prevSign=sign;
 }
 if(ingress===null)return null;
 const start=findLunationNewMoon(ingress+0.02,1,system);
 if(start===null)return null;
 let nextIngress=null,prev=ingress+300,prevSign2=siderealSolarSign(prev,system);
 for(let i=1;i<=400;i++){
  const t=ingress+300+i*0.25,sign=siderealSolarSign(t,system);
  if(sign===11&&prevSign2!==11){let lo=prev,hi=t;for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(siderealSolarSign(mid,system)===11)hi=mid;else lo=mid;}nextIngress=hi;break;}
  prev=t;prevSign2=sign;
 }
 const end=nextIngress===null?null:findLunationNewMoon(nextIngress+0.02,1,system);
 return end&&end>start?{start,end}:null;
}

function traditionalCalendar(date, calculated) {
  const jd=calculated.julianDay;
  const system=calculated.ayanamsha.system;
  const tithiIndex=astronomy.limbIndices(jd,system).tithi;
  const previousNewMoon=findLunationNewMoon(jd,-1,system);
  const nextNewMoon=findLunationNewMoon(jd,1,system);
  const [year,month]=date.split('-').map(Number);
  if(previousNewMoon===null||nextNewMoon===null){
    return {status:'preliminary',festival:'प्रकाशित पंचांग एवं व्रत-निर्णय से सत्यापन शेष',note:'चन्द्र मास की सीमा नहीं निकाली जा सकी; पर्व-व्रत निर्णय प्रमाणित नहीं है।'};
  }
  const solarSign=siderealSolarSign(previousNewMoon,system);
  const nextSolarSign=siderealSolarSign(nextNewMoon,system);
  const monthIndex=(solarSign+1)%12;
  const adhika=solarSign===nextSolarSign;
  const vikramSamvat=year+((monthIndex===11&&month<=3)?56:57);
  const samvatsaraIndex=((vikramSamvat-2044)%60+60)%60;
  const ritu=['वसन्त','वसन्त','ग्रीष्म','ग्रीष्म','वर्षा','वर्षा','शरद्','शरद्','हेमन्त','हेमन्त','शिशिर','शिशिर'][monthIndex];
  const ayana=(siderealSolarSign(jd,system)>=9||siderealSolarSign(jd,system)<=2)?'उत्तरायण':'दक्षिणायन';
  return {
    vikramSamvat:String(vikramSamvat),
    samvatsara:SAMVATSARA_NAMES[samvatsaraIndex],
    ayana,ritu,
    lunarMonth:(adhika?'अधिक ':'')+LUNAR_MONTHS[monthIndex],
    paksha:tithiIndex<15?'शुक्ल पक्ष':'कृष्ण पक्ष',
    festival:'प्रकाशित पंचांग एवं व्रत-निर्णय से सत्यापन शेष',
    status:'preliminary',
    adhikaMasa:adhika,
    lunationStart:jdIso(previousNewMoon),
    nextLunationStart:jdIso(nextNewMoon),
    note:'चन्द्र मास अमावस्या-सीमा और सूर्य की राशि से निकाला गया है; अधिक मास की पहचान प्रारंभिक है। संवत्सर/अयन तथा पर्व-व्रत निर्णय को प्रकाशित पंचांग से मिलान करना शेष है।'
  };
}
function formatRange(value) {
  return value && value.start && value.end
    ? formatTime(value.start) + ' – ' + formatTime(value.end)
    : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const today = todayIST();
    const requested = req.query && req.query.date;
    const date = requested || [today.year, String(today.month).padStart(2, '0'), String(today.date).padStart(2, '0')].join('-');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('तिथि YYYY-MM-DD प्रारूप में होनी चाहिए।');
    const [year, month, dayOfMonth] = date.split('-').map(Number);
    const checkDate = new Date(Date.UTC(year, month - 1, dayOfMonth));
    if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() + 1 !== month || checkDate.getUTCDate() !== dayOfMonth) throw new Error('अमान्य कैलेंडर तिथि।');
    const query = req.query || {};
    const ayanamsha = ['lahiri','kp','raman'].includes(query.ayanamsha) ? query.ayanamsha : 'lahiri';
    const profile = ['kashi_vishwanath','rishikesh','drik','vaishnav_braj'].includes(query.profile) ? query.profile : 'kashi_vishwanath';
    const observance = ['smarta','vaishnava','braj'].includes(query.observance) ? query.observance : 'braj';
    const options = require('./panchang-options');
    const selected = options.resolveSelection({ profile, ayanamsha, observance });
    const time = query.time || (requested ? '12:00:00' : currentTimeIST());
    const calculated = astronomy.calculate({
      date, time, timezone: TZ_OFFSET,
      ayanamsha,
      latitude: LAT, longitude: LON
    });
    let ephemeris = { available: false, engine: 'meeus-fallback', note: 'स्विस एफेमेरिस उपलब्ध न होने पर प्रारंभिक ग्रह-गणना उपयोग हुई।' };
    try {
      const swiss = await require('./swiss-ephemeris').calculateSwiss({ date, time, ayanamsha });
      const names = { sun: 'सूर्य', moon: 'चन्द्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु' };
      const planetMeta = {
        'सूर्य': { exalt: 0, debil: 6, own: [4] },
        'चन्द्र': { exalt: 1, debil: 7, own: [3] },
        'मंगल': { exalt: 9, debil: 3, own: [0, 7], combust: 17 },
        'बुध': { exalt: 5, debil: 11, own: [2, 5], combust: 14 },
        'गुरु': { exalt: 3, debil: 9, own: [8, 11], combust: 11 },
        'शुक्र': { exalt: 11, debil: 5, own: [1, 6], combust: 10 },
        'शनि': { exalt: 6, debil: 0, own: [9, 10], combust: 15 },
        'राहु': { exalt: 1, debil: 7, own: [] },
        'केतु': { exalt: 7, debil: 1, own: [] }
      };
      const sunLongitude = swiss.positions.sun.longitude;
      const swissGrahas = Object.entries(names).map(([key, name]) => {
        const p = swiss.positions[key];
        const longitude = ((p.longitude % 360) + 360) % 360;
        const rashiIndex = Math.floor(longitude / 30);
        const meta = planetMeta[name] || {};
        const distance = Math.abs(((longitude - sunLongitude + 540) % 360) - 180);
        const dignity = rashiIndex === meta.exalt ? 'उच्च' : rashiIndex === meta.debil ? 'नीच' : (meta.own || []).includes(rashiIndex) ? 'स्वराशि' : 'सम राशि';
        return {
          name, longitude: Number(longitude.toFixed(6)), rashi: RASHI_NAMES_FOR_API[rashiIndex],
          degrees: Number((longitude % 30).toFixed(6)), retrograde: !!p.retrograde,
          combust: meta.combust !== undefined && distance <= meta.combust,
          angularDistanceFromSun: Number(distance.toFixed(2)), dignity,
          strengthHint: dignity === 'उच्च' || dignity === 'स्वराशि' ? 'राशि-बल अनुकूल' : dignity === 'नीच' ? 'राशि-बल प्रतिकूल' : 'राशि-बल सामान्य',
          calculation: 'swiss-ephemeris', ephemeris: p.ephemeris
        };
      });
      const lagnaIndex = RASHI_NAMES_FOR_API.indexOf(calculated.kundali.lagna.rashi);
      swissGrahas.forEach(g => { g.house = ((RASHI_NAMES_FOR_API.indexOf(g.rashi) - lagnaIndex + 12) % 12) + 1; });
      calculated.grahas = swissGrahas;
      calculated.limbs = swiss.limbs;
      calculated.endsAt = swiss.endsAt;
      calculated.kundali.houses.forEach(h => { h.grahas = swissGrahas.filter(g => g.house === h.house); });
      calculated.positions.sun.siderealLongitude = swiss.positions.sun.longitude;
      calculated.positions.moon.siderealLongitude = swiss.positions.moon.longitude;
      calculated.ayanamsha.degrees = Number(swiss.ayanamsha.toFixed(6));
      calculated.ayanamsha.status = 'swiss-ephemeris';
      ephemeris = { available: true, engine: swiss.engine, version: swiss.engineVersion, source: swiss.ephemeris, data: swiss.ephemerisData, note: 'ग्रहों की निरयन स्थिति तथा तिथि, नक्षत्र, योग, करण और उनकी समाप्ति स्विस एफेमेरिस से निकाली गई है।' };
    } catch (swissError) {
      ephemeris = { available: false, engine: 'meeus-fallback', error: swissError.message, note: 'स्विस एफेमेरिस लोड नहीं हुआ; ग्रह-स्थिति प्रारंभिक Meeus सूत्रों से दिखाई गई है।' };
    }
    const day = daily.calculate(date);
    const inauspicious = calculateBhadraAndVarjya(date, calculated.ayanamsha.system);
    const traditional = traditionalCalendar(date, calculated);
    const samvatsaraBounds=chaitraSamvatsaraBounds(calculated.julianDay,calculated.ayanamsha.system);
    const annualGrahaTransits=samvatsaraBounds?astronomy.samvatsaraGrahaTransits(samvatsaraBounds.start,samvatsaraBounds.end,calculated.ayanamsha.system,TZ_OFFSET):[];
    if(samvatsaraBounds){
      traditional.samvatsaraPeriod={start:jdIso(samvatsaraBounds.start),end:jdIso(samvatsaraBounds.end)};
      traditional.samvatsaraTransits=annualGrahaTransits;
    }
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
      amrit: 'प्रकाशित पंचांग से सत्यापन शेष',
      bhadra: inauspicious.bhadra,
      varjya: inauspicious.varjya,
      durmuhurta: day.durmuhurta,
      choghadiya: day.choghadiya,
      hora: day.hora,
      grahas: calculated.grahas,
      kundali: calculated.kundali,
      nextEvents: calculated.nextEvents
    };
    return res.status(200).json({
      date: { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), date: Number(date.slice(8, 10)) },
      calculationTime: time,
      location: { name: 'श्रीधाम वृंदावन', latitude: LAT, longitude: LON, timezone: TIME_ZONE, ayanamsha: calculated.ayanamsha.system },
      data,
      traditional,
      calculationSelection: selected,
      details: {
        periods: day.periods, durmuhurta: day.durmuhurta, bhadra: inauspicious.bhadra, varjya: inauspicious.varjya, choghadiya: day.choghadiya, hora: day.hora,
        astronomy: calculated.positions, grahas: calculated.grahas, annualGrahaTransits,
        riseSet: calculated.riseSet, astronomyEndsAt: calculated.endsAt, nextEvents: calculated.nextEvents,
        julianDay: calculated.julianDay
      },
      astroAvailable: false,
      extendedAvailable: false,
      providers: { navamsha: false, astroLogics: false, goPixel: false, independent: true },
      fallback: false,
      engine: ephemeris.available ? ephemeris.engine : calculated.engine,
      engineVersion: ephemeris.available ? ephemeris.version : calculated.engineVersion,
      ephemeris,
      accuracyNotice: (ephemeris.available ? ephemeris.note + ' कुछ स्थानीय दैनिक काल, वर्ज्य/भद्रा नियम और पंचांग-परंपरा के निर्णयों का स्वतंत्र सत्यापन शेष है।' : ephemeris.note + ' ' + calculated.accuracyNotice),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Independent Panchang engine:', error.stack || error.message);
    return res.status(400).json({ error: 'स्वतंत्र पंचांग गणना में त्रुटि हुई।', detail: error.message });
  }
};
