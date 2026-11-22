const API = 'https://api.navamsha.in/api/v1/panchang';
const LAT = 27.565; // Shri Dham Vrindavan
const LON = 77.659;
const TZ = 5.5;
function todayIST() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return {year:Number(p.year),month:Number(p.month),date:Number(p.day)};
}
function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (obj[key] != null) {
      const v=obj[key];
      if (typeof v==='string'||typeof v==='number') return String(v);
      if (typeof v==='object') return v.name_hi||v.nameHi||v.hindi||v.name||v.label_hi||v.label||v.value||null;
    }
  }
  for (const value of Object.values(obj)) if (value && typeof value==='object') {
    const found=pick(value,keys); if(found) return found;
  }
  return null;
}
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=3600');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const key=process.env.NAVAMSHA_API_KEY;
  if(!key) return res.status(503).json({error:'पंचांग सेवा अभी सेटअप नहीं हुई है।'});
  try {
    const date=todayIST();
    const body={...date,hours:12,minutes:0,latitude:LAT,longitude:LON,timezone:TZ,lang:'hi'};
    const headers={'X-API-Key':key,'Content-Type':'application/json'};
    const routes=['full','sun-times','inauspicious-periods'];
    const results=await Promise.all(routes.map(async route=>{
      const r=await fetch(API+'/'+route,{method:'POST',headers,body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok) throw new Error(j.message||j.error||'Panchang provider error');
      return j.output||j.data||j;
    }));
    const [full,sun,bad]=results;
    const combined={full,sun,bad};
    const data={
      tithi:pick(full,['tithi','tithi_name','tithiName']),
      vara:pick(full,['vara','weekday','day_name','dayName']),
      nakshatra:pick(full,['nakshatra','nakshatra_name','nakshatraName']),
      yoga:pick(full,['yoga','yoga_name','yogaName']),
      karana:pick(full,['karana','karana_name','karanaName']),
      sunrise:pick(sun,['sunrise','sunrise_time','sunriseTime']),
      sunset:pick(sun,['sunset','sunset_time','sunsetTime']),
      rahuKaal:pick(bad,['rahu_kaal','rahukaal','rahuKaal','rahu_kalam'])
    };
    return res.status(200).json({date,data,raw:combined});
  } catch(error) {
    console.error('Panchang API:',error.message);
    return res.status(502).json({error:'पंचांग डेटा प्राप्त नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।'});
  }
};