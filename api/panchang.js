const API = 'https://api.navamsha.in/api/v1/panchang';
const EXTRA_API = 'https://api.gopixel.in/api/v1';
const LAT = 27.565;
const LON = 77.659;
const TZ = 5.5;

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
function timeValue(obj, keys) { return first(obj,keys); }
function compact(value, depth=0) {
  if (value == null || depth > 4) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(v=>compact(v,depth+1)).filter(Boolean).join('  •  ');
  if (typeof value === 'object') {
    const out=[];
    for (const [k,v] of Object.entries(value)) {
      if (['statusCode','utc_datetime','weekday_basis','number','degrees_remaining','lord'].includes(k)) continue;
      const val=compact(v,depth+1);
      if(val) out.push(k.replace(/_/g,' ')+': '+val);
    }
    return out.join('  |  ');
  }
  return '';
}
const signs={Aries:'मेष',Taurus:'वृषभ',Gemini:'मिथुन',Cancer:'कर्क',Leo:'सिंह',Virgo:'कन्या',Libra:'तुला',Scorpio:'वृश्चिक',Sagittarius:'धनु',Capricorn:'मकर',Aquarius:'कुम्भ',Pisces:'मीन'};
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
async function getExtra(path, key){
  const r=await fetch(EXTRA_API+path,{headers:{'x-api-key':key,'Accept':'application/json'}});
  const j=await r.json();
  if(!r.ok)throw new Error(j.message||j.error||'Calendar provider error');
  return j;
}
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','s-maxage=43200, stale-while-revalidate=86400');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const key=process.env.NAVAMSHA_API_KEY;
  if(!key) return res.status(503).json({error:'पंचांग सेवा अभी सेटअप नहीं हुई है।'});
  try {
    const date=todayIST();
    const body={...date,hours:12,minutes:0,latitude:LAT,longitude:LON,timezone:TZ,lang:'hi'};
    const headers={'X-API-Key':key,'Content-Type':'application/json'};
    const routes=['full','sun-times','inauspicious-periods','moon-times','abhijit-muhurat','brahma-muhurta','amrit-kaal','choghadiya','hora'];
    const settled=await Promise.all(routes.map(async route=>{
      try {
        const r=await fetch(API+'/'+route,{method:'POST',headers,body:JSON.stringify(body)});
        const j=await r.json();
        if(!r.ok) throw new Error(j.message||j.error||'Provider error');
        return {route,data:j.output||j.data||j};
      } catch(error) {
        console.warn('Optional Panchang route '+route+':',error.message);
        return {route,data:null};
      }
    }));
    const result=Object.fromEntries(settled.map(x=>[x.route,x.data]));
    if(!result.full) throw new Error('Full Panchang endpoint unavailable');
    const full=result.full, sun=result['sun-times']||{}, bad=result['inauspicious-periods']||{}, moon=result['moon-times']||{};
    const data={
      tithi:element(full,'tithi'), vara:element(full,'weekday')||element(full,'vara'),
      nakshatra:element(full,'nakshatra'), yoga:element(full,'yoga'), karana:element(full,'karana'),
      sunrise:timeValue(sun,['sunrise','sunrise_time','sunriseTime']),
      sunset:timeValue(sun,['sunset','sunset_time','sunsetTime']),
      moonrise:timeValue(moon,['moonrise','moonrise_time','moonriseTime']),
      moonset:timeValue(moon,['moonset','moonset_time','moonsetTime']),
      rahuKaal:compact(bad.rahu_kaal||bad.rahukaal||bad.rahuKaal||bad.rahu_kalam),
      gulika:compact(bad.gulika_kaal||bad.gulikaKaal||bad.gulika),
      yamagand:compact(bad.yamaganda||bad.yama_ganda||bad.yamaganda_kaal),
      abhijit:compact(result['abhijit-muhurat']),brahma:compact(result['brahma-muhurta']),
      amrit:compact(result['amrit-kaal']),choghadiya:compact(result.choghadiya),hora:compact(result.hora)
    };

    // Extended Hindu calendar and nine-graha positions use a separate provider.
    // Its key is optional so the existing daily Panchang remains available.
    let traditional={};
    const extraKey=process.env.GOPIXEL_API_KEY;
    if(extraKey){
      const ymd=date.year+'-'+String(date.month).padStart(2,'0')+'-'+String(date.date).padStart(2,'0');
      const optional=await Promise.allSettled([
        getExtra('/tool?name=hindu&y='+date.year+'&m='+date.month+'&d='+date.date+'&lat='+LAT+'&lon='+LON,extraKey),
        getExtra('/graha?date='+ymd+'&hour=12&lang=hi',extraKey)
      ]);
      const hindu=optional[0].status==='fulfilled'?optional[0].value:null;
      const planets=optional[1].status==='fulfilled'?optional[1].value:null;
      if(hindu){
        const h=hindu.output||hindu.data||hindu;
        traditional={
          vikramSamvat:deepFind(h,['vikram_samvat','vikramSamvat','vikram','samvat_vikram','vs']),
          samvatsara:deepFind(h,['samvatsara','samvatsar','year_name','samvatsara_name']),
          ayana:deepFind(h,['ayana','ayan']),
          ritu:deepFind(h,['ritu','season']),
          lunarMonth:deepFind(h,['lunar_month','lunarMonth','masa','month_name','maas']),
          paksha:deepFind(h,['paksha','fortnight']),
          festival:deepFind(h,['festival','festivals','parva'])
        };
      }
      if(planets)traditional.grahas=grahaList(planets);
      if(optional.some(x=>x.status==='rejected'))console.warn('Some extended Panchang fields unavailable');
    }
    return res.status(200).json({date,data,traditional,extendedAvailable:Boolean(extraKey)});
  } catch(error) {
    console.error('Panchang API:',error.message);
    return res.status(502).json({error:'पंचांग डेटा प्राप्त नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।'});
  }
};
