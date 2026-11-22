const API = 'https://api.navamsha.in/api/v1/panchang';
const ASTRO_API = 'https://api.astrologics.in/v1';
const EXTRA_API = 'https://api.gopixel.in/api/v1';
const LAT = 27.565;
const LON = 77.659;
const TZ = 5.5;
const independentEngine = require('./panchang-astronomy');
const dailyEngine = require('./panchang-daily');

function independentFallback(reason) {
  const date = todayIST();
  const ymd=date.year+'-'+String(date.month).padStart(2,'0')+'-'+String(date.date).padStart(2,'0');
  const calculated = independentEngine.calculate({
    date: date.year+'-'+String(date.month).padStart(2,'0')+'-'+String(date.date).padStart(2,'0'),
    time: '12:00:00', timezone: TZ, ayanamsha: 'lahiri'
  });
  return {
    date,
    location: {name:'श्रीधाम वृंदावन',latitude:LAT,longitude:LON,timezone:'Asia/Kolkata',ayanamsha:'Lahiri'},
    data: {
      tithi:calculated.limbs.tithi, tithiEnd:calculated.endsAt.tithi,
      nakshatra:calculated.limbs.nakshatra, nakshatraEnd:calculated.endsAt.nakshatra,
      yoga:calculated.limbs.yoga, karana:calculated.limbs.karana,
      sunrise:null,sunset:null,moonrise:null,moonset:null,
      rahuKaal:null,gulika:null,yamagand:null,abhijit:null,brahma:null,amrit:null,
      choghadiya:null,hora:null
    },
    traditional:{},details:{choghadiya:daily.choghadiya,hora:daily.hora,periods:daily.periods},astroAvailable:false,extendedAvailable:false,
    providers:{navamsha:false,astroLogics:false,goPixel:false,independent:true},
    fallback:true, fallbackReason:reason,
    accuracyNotice:calculated.accuracyNotice,
    updatedAt:new Date().toISOString()
  };
}

function todayIST() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return {year:Number(p.year),month:Number(p.month),date:Number(p.day)};
}
function first(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    const v=obj[key];
    if (v == null) continue;
    if (typeof v==='string'||typeof v==='number') return String(v);
    if (typeof v==='object' && !Array.isArray(v)) {
      const name=v.name_hi||v.nameHi||v.hindi||v.name||v.label_hi||v.label||v.value||v.sign_hi||v.sign_name_hi||v.sign_name||v.sign;
      if(name) return String(name);
    }
  }
  return null;
}
function deepFind(obj, keys, depth=0) {
  if(!obj||typeof obj!=='object'||depth>6)return null;
  const direct=first(obj,keys);
  if(direct)return direct;
  for(const value of Object.values(obj)){
    const found=deepFind(value,keys,depth+1);
    if(found)return found;
  }
  return null;
}
function element(obj, key) {
  const v=obj && obj[key];
  if (!v) return first(obj,[key]);
  if (typeof v !== 'object') return String(v);
  const name=first(v,['name_hi','nameHi','hindi','name','label_hi','label']);
  const extra=[];
  if(v.paksha) extra.push(v.paksha==='Shukla'?'शुक्ल पक्ष':v.paksha==='Krishna'?'कृष्ण पक्ष':v.paksha);
  if(v.pada) extra.push('पाद '+v.pada);
  return [...extra,name].filter(Boolean).join(' • ') || null;
}
function timeValue(obj, keys) { const value=first(obj,keys)||deepFind(obj,keys); return value ? clock(value) : null; }
function compact(value, depth=0) {
  if (value == null || depth > 4) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(v=>compact(v,depth+1)).filter(Boolean).join('\\n');
  if (typeof value === 'object') {
    if (value.start && value.end) return clock(value.start)+' – '+clock(value.end);
    if (value.start_time && value.end_time) return clock(value.start_time)+' – '+clock(value.end_time);
    const labels={day:'दिन',night:'रात्रि',morning:'प्रातःकाल',afternoon:'दोपहर',evening:'सायंकाल',name:'नाम',period:'काल',time:'समय',start:'आरम्भ',end:'समाप्ति',good:'शुभ',bad:'अशुभ',choghadiya:'चौघड़िया',hora:'होरा',amrit:'अमृत',kaal:'काल',rahu:'राहु',gulika:'गुलिक',yamaganda:'यमगण्ड'};
    const out=[];
    for (const [k,v] of Object.entries(value)) {
      if (['statusCode','utc_datetime','weekday_basis','number','degrees_remaining','lord'].includes(k)) continue;
      const val=compact(v,depth+1);
      if(val) out.push((labels[k.toLowerCase()]||k.replace(/_/g,' '))+' : '+val);
    }
    return out.join('\\n');
  }
  return '';
}
const signs={Aries:'मेष',Taurus:'वृषभ',Gemini:'मिथुन',Cancer:'कर्क',Leo:'सिंह',Virgo:'कन्या',Libra:'तुला',Scorpio:'वृश्चिक',Sagittarius:'धनु',Capricorn:'मकर',Aquarius:'कुम्भ',Pisces:'मीन'};
const hindiNames={
  pratipada:'प्रतिपदा',dwitiya:'द्वितीया',tritiya:'तृतीया',chaturthi:'चतुर्थी',panchami:'पंचमी',shashthi:'षष्ठी',saptami:'सप्तमी',ashtami:'अष्टमी',navami:'नवमी',dashami:'दशमी',ekadashi:'एकादशी',dwadashi:'द्वादशी',trayodashi:'त्रयोदशी',chaturdashi:'चतुर्दशी',purnima:'पूर्णिमा',amavasya:'अमावस्या',
  ashwini:'अश्विनी',bharani:'भरणी',krittika:'कृत्तिका',rohini:'रोहिणी',mrigashira:'मृगशिरा',ardra:'आर्द्रा',punarvasu:'पुनर्वसु',pushya:'पुष्य',ashlesha:'आश्लेषा',magha:'मघा',purva_phalguni:'पूर्वा फाल्गुनी',uttara_phalguni:'उत्तरा फाल्गुनी',hasta:'हस्त',chitra:'चित्रा',swati:'स्वाती',vishakha:'विशाखा',anuradha:'अनुराधा',jyeshtha:'ज्येष्ठा',mula:'मूल',purva_ashadha:'पूर्वाषाढ़ा',uttara_ashadha:'उत्तराषाढ़ा',shravana:'श्रवण',dhanishta:'धनिष्ठा',shatabhisha:'शतभिषा',purva_bhadrapada:'पूर्वाभाद्रपद',uttara_bhadrapada:'उत्तराभाद्रपद',revati:'रेवती',
  vishkambha:'विष्कुम्भ',priti:'प्रीति',ayushman:'आयुष्मान',saubhagya:'सौभाग्य',shobhana:'शोभन',atiganda:'अतिगण्ड',sukarma:'सुकर्मा',dhriti:'धृति',shula:'शूल',ganda:'गण्ड',vriddhi:'वृद्धि',dhruva:'ध्रुव',vyaghata:'व्याघात',harshana:'हर्षण',vajra:'वज्र',siddhi:'सिद्धि',vyatipata:'व्यतीपात',variyan:'वरीयान',parigha:'परिघ',shiva:'शिव',siddha:'सिद्ध',sadhya:'साध्य',shubha:'शुभ',shukla_yoga:'शुक्ल',brahma:'ब्रह्म',indra:'इन्द्र',vaidhriti:'वैधृति',
  bava:'बव',balava:'बालव',kaulava:'कौलव',taitila:'तैतिल',garaja:'गर',vanija:'वणिज',vishti:'विष्टि',shakuni:'शकुनि',chatushpada:'चतुष्पद',naga:'नाग',kimstughna:'किंस्तुघ्न',
  shukla:'शुक्ल पक्ष',krishna:'कृष्ण पक्ष',sunday:'रविवार',monday:'सोमवार',tuesday:'मंगलवार',wednesday:'बुधवार',thursday:'गुरुवार',friday:'शुक्रवार',saturday:'शनिवार',
  chaitra:'चैत्र',vaishakha:'वैशाख',jyeshtha_month:'ज्येष्ठ',ashadha:'आषाढ़',shravana_month:'श्रावण',bhadrapada:'भाद्रपद',ashwin:'आश्विन',kartika:'कार्तिक',margashirsha:'मार्गशीर्ष',pausha:'पौष',magha_month:'माघ',phalguna:'फाल्गुन'
};
function hindiName(value){
  if(value==null)return value;
  let out=String(value);
  for(const [key,val] of Object.entries(hindiNames).sort((a,b)=>b[0].length-a[0].length)){
    out=out.replace(new RegExp('(^|[^a-z])'+key+'(?=$|[^a-z])','gi'),(m,prefix)=>prefix+val);
  }
  return out;
}
function grahaList(payload){
  const root=payload?.data||payload?.output||payload;
  let list=root?.grahas||root?.planets||root?.positions||root?.planet_positions||root?.planetPositions;
  if(!Array.isArray(list)&&list&&typeof list==='object') list=Object.entries(list).map(([name,value])=>({name,...(typeof value==='object'?value:{sign:value})}));
  if(!Array.isArray(list))return [];
  return list.map(p=>{
    const name=first(p,['name_hi','nameHi','hindi','name','planet_hi','planet'])||'';
    const sign=first(p,['sign_hi','signHi','rashi_hi','rashi','zodiac_sign_name','sign_name_hi','sign_name','sign']);
    const hindiSign=sign? (signs[sign]||sign):'';
    return name&&hindiSign?{name,sign:hindiSign}:null;
  }).filter(Boolean);
}
async function getAstro(path, key){
  const r=await fetch(ASTRO_API+path,{headers:{'Authorization':'Bearer '+key,'Accept':'application/json'}});
  const j=await r.json();
  if(!r.ok)throw new Error(j.message||j.error||'AstroLogics provider error');
  return j.data||j;
}
function clock(value){
  if(!value)return '';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?String(value):new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
}
function astroWindow(value){
  if(!value||!value.start||!value.end)return '';
  return clock(value.start)+' – '+clock(value.end);
}
async function postAstro(path, key, body){
  const r=await fetch(ASTRO_API+path,{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();
  if(!r.ok)throw new Error(j.message||j.error||'AstroLogics provider error');
  return j.data||j;
}
const planetHi={sun:'सूर्य',moon:'चन्द्र',mars:'मंगल',mercury:'बुध',jupiter:'बृहस्पति',venus:'शुक्र',saturn:'शनि',rahu:'राहु',ketu:'केतु'};
const signHi={aries:'मेष',taurus:'वृषभ',gemini:'मिथुन',cancer:'कर्क',leo:'सिंह',virgo:'कन्या',libra:'तुला',scorpio:'वृश्चिक',sagittarius:'धनु',capricorn:'मकर',aquarius:'कुम्भ',pisces:'मीन'};
function solarSeason(sign){
  const ritu={pisces:'वसन्त ऋतु',aries:'वसन्त ऋतु',taurus:'ग्रीष्म ऋतु',gemini:'ग्रीष्म ऋतु',cancer:'वर्षा ऋतु',leo:'वर्षा ऋतु',virgo:'शरद ऋतु',libra:'शरद ऋतु',scorpio:'हेमन्त ऋतु',sagittarius:'हेमन्त ऋतु',capricorn:'शिशिर ऋतु',aquarius:'शिशिर ऋतु'};
  const uttar=['capricorn','aquarius','pisces','aries','taurus','gemini'];
  return {ritu:ritu[sign]||'',ayana:sign?(uttar.includes(sign)?'उत्तरायण':'दक्षिणायन'):''};
}
async function getExtra(path, key){
  const r=await fetch(EXTRA_API+path,{headers:{'x-api-key':key,'Accept':'application/json'}});
  const j=await r.json();
  if(!r.ok)throw new Error(j.message||j.error||'Calendar provider error');
  return j;
}
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const date=todayIST();
    const ymd=date.year+'-'+String(date.month).padStart(2,'0')+'-'+String(date.date).padStart(2,'0');
    const calculated=independentEngine.calculate({date:ymd,time:'12:00:00',timezone:TZ,ayanamsha:'lahiri'});
    const daily=dailyEngine.calculate(ymd);
    const timeText=value=>value?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)):null;
    const rangeText=value=>value?timeText(value.start)+' – '+timeText(value.end):null;
    const data={
      vara:daily.weekday,
      tithi:calculated.limbs.tithi,tithiEnd:calculated.endsAt.tithi,
      nakshatra:calculated.limbs.nakshatra,nakshatraEnd:calculated.endsAt.nakshatra,
      yoga:calculated.limbs.yoga,karana:calculated.limbs.karana,
      sunrise:timeText(daily.sunrise),sunset:timeText(daily.sunset),
      moonrise:null,moonset:null,
      rahuKaal:rangeText(daily.periods.rahuKaal),
      gulika:rangeText(daily.periods.gulika),
      yamagand:rangeText(daily.periods.yamagand),
      abhijit:rangeText(daily.periods.abhijit),
      brahma:rangeText(daily.periods.brahma),
      amrit:null,choghadiya:daily.choghadiya,hora:daily.hora
    };
    return res.status(200).json({
      date,
      location:{name:'श्रीधाम वृंदावन',latitude:LAT,longitude:LON,timezone:'Asia/Kolkata',ayanamsha:'Lahiri'},
      data,traditional:{},details:{choghadiya:daily.choghadiya,hora:daily.hora,periods:daily.periods,astronomy:calculated.positions,grahas:calculated.grahas},
      astroAvailable:false,extendedAvailable:false,
      providers:{navamsha:false,astroLogics:false,goPixel:false,independent:true},
      fallback:false,engine:calculated.engine,engineVersion:calculated.engineVersion,
      accuracyNotice:calculated.accuracyNotice,
      updatedAt:new Date().toISOString()
    });
  } catch(error) {
    console.error('Independent Panchang engine:',error.stack||error.message);
    return res.status(500).json({error:'स्वतंत्र पंचांग गणना में त्रुटि हुई।',detail:error.message});
  }
};
