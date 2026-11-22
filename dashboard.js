/* Daily Panchang: enrich the existing card only; never create a second dashboard. */
(() => {
  const root = document.getElementById('daily-panchang');
  if (!root || root.dataset.completeRenderer === '1') return;
  root.dataset.completeRenderer = '1';

  const style = document.createElement('style');
  style.textContent = `
    #daily-panchang .panchang-complete{margin-top:18px;border-top:1px solid rgba(168,121,40,.22);padding-top:16px}
    #daily-panchang .panchang-complete h3{margin:18px 0 10px;color:#76521d;font-size:17px}
    #daily-panchang .panchang-complete-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #daily-panchang .panchang-complete-item{min-width:0;padding:12px;border:1px solid rgba(168,121,40,.18);border-radius:12px;background:rgba(255,255,255,.78)}
    #daily-panchang .panchang-complete-item b{display:block;color:#806b4d;font-size:12px;margin-bottom:5px}
    #daily-panchang .panchang-complete-item span{display:block;color:#493b2b;font-size:13px;line-height:1.65;overflow-wrap:anywhere;white-space:pre-wrap}
    #daily-panchang .panchang-complete-note{font-size:11px;color:#806b4d;margin-top:12px;line-height:1.6}
    @media(max-width:650px){#daily-panchang .panchang-complete-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const area = document.createElement('div');
  area.className = 'panchang-complete';
  area.id = 'panchang-complete-sections';
  const oldMore = root.querySelector('.panchang-more');
  if (oldMore) oldMore.insertAdjacentElement('afterend', area);
  else root.appendChild(area);

  const labels = {
    tithi:'तिथि',paksha:'पक्ष',nakshatra:'नक्षत्र',pada:'चरण',yoga:'योग',karana:'करण',
    weekday:'वार',vara:'वार',sunrise:'सूर्योदय',sunset:'सूर्यास्त',moonrise:'चन्द्रोदय',moonset:'चन्द्रास्त',
    rahu_kaal:'राहुकाल',rahuKaal:'राहुकाल',gulika_kaal:'गुलिक काल',gulika:'गुलिक काल',
    yamaganda:'यमगण्ड',abhijit:'अभिजित मुहूर्त',brahma:'ब्रह्म मुहूर्त',amrit:'अमृत काल',
    choghadiya:'चौघड़िया',hora:'ग्रह होरा',vikramSamvat:'विक्रम संवत',samvatsara:'संवत्सर',
    ayana:'अयन',ritu:'ऋतु',lunarMonth:'चन्द्र मास',festival:'व्रत / त्योहार',grahas:'ग्रहों की राशि स्थिति',
    start:'आरम्भ',end:'समाप्ति',start_time:'आरम्भ समय',end_time:'समाप्ति समय',
    day:'दिन',night:'रात्रि',periods:'समय खण्ड',name:'नाम',lord:'स्वामी',sign:'राशि',
    tithi_end:'तिथि समाप्ति',nakshatra_end:'नक्षत्र समाप्ति'
  };
  const hindiKey = key => labels[key] || String(key).replace(/_/g,' ').replace(/\b[a-z]/g,x=>x.toUpperCase());
  const scalar = value => {
    if (value == null || value === '') return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(scalar).filter(Boolean).join(' • ');
    if (typeof value === 'object') {
      const preferred = value.name_hi || value.nameHi || value.hindi || value.label_hi || value.label || value.name || value.value;
      if (preferred) {
        const extras = [];
        if (value.paksha) extras.push(value.paksha);
        if (value.pada) extras.push('चरण ' + value.pada);
        if (value.start || value.start_time) extras.push('आरम्भ ' + (value.start || value.start_time));
        if (value.end || value.end_time || value.ends_at) extras.push('समाप्ति ' + (value.end || value.end_time || value.ends_at));
        return [preferred,...extras].join(' • ');
      }
      return Object.entries(value).filter(([k,v]) => v != null && v !== '' && !['number','degrees_remaining','utc_datetime','weekday_basis'].includes(k))
        .map(([k,v]) => hindiKey(k)+': '+scalar(v)).filter(x=>!x.endsWith(': ')).join('\n');
    }
    return '';
  };
  function card(label,value){
    const text = scalar(value);
    if (!text || text === '—') return null;
    const item=document.createElement('div');item.className='panchang-complete-item';
    const title=document.createElement('b');title.textContent=label;
    const body=document.createElement('span');body.textContent=text;
    item.append(title,body);return item;
  }
  function section(title, entries){
    const valid=entries.map(([label,value])=>card(label,value)).filter(Boolean);
    if(!valid.length)return;
    const heading=document.createElement('h3');heading.textContent=title;
    const grid=document.createElement('div');grid.className='panchang-complete-grid';
    valid.forEach(el=>grid.appendChild(el));area.append(heading,grid);
  }
  function routeEntries(obj){
    if(!obj || typeof obj!=='object')return [];
    const out=[];
    for(const [key,value] of Object.entries(obj)){
      if(['statusCode','utc_datetime','weekday_basis','number','degrees_remaining','metadata','calculation'].includes(key))continue;
      if(value==null || value==='')continue;
      out.push([hindiKey(key),value]);
    }
    return out;
  }
  let lastDay='';
  async function load(){
    const now=new Date();
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    try{
      const response=await fetch('/api/panchang?day='+encodeURIComponent(day),{headers:{Accept:'application/json'},cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'पंचांग उपलब्ध नहीं है');
      const d=payload.data||{},t=payload.traditional||{},details=payload.details||{};
      area.replaceChildren();
      section('पंचांग के पाँच अंग',[
        ['तिथि / पक्ष',d.tithi],['नक्षत्र / चरण',d.nakshatra],['योग',d.yoga],['करण',d.karana],['वार',d.vara]
      ]);
      section('सूर्य और चन्द्रमा',[
        ['सूर्योदय',d.sunrise],['सूर्यास्त',d.sunset],['चन्द्रोदय',d.moonrise],['चन्द्रास्त',d.moonset]
      ]);
      section('शुभ और अशुभ काल',[
        ['राहुकाल',d.rahuKaal],['गुलिक काल',d.gulika],['यमगण्ड',d.yamagand],
        ['अभिजित मुहूर्त',d.abhijit],['ब्रह्म मुहूर्त',d.brahma],['अमृत काल',d.amrit]
      ]);
      section('चौघड़िया और होरा',[
        ['दिन एवं रात्रि चौघड़िया',details.choghadiya||d.choghadiya],
        ['दिन एवं रात्रि ग्रह होरा',details.hora||d.hora]
      ]);
      section('विक्रमादित्य कालगणना एवं पर्व',[
        ['विक्रम संवत',t.vikramSamvat],['संवत्सर',t.samvatsara],['अयन',t.ayana],
        ['ऋतु',t.ritu],['चन्द्र मास',t.lunarMonth],['पक्ष',t.paksha],['आज के व्रत / त्योहार',t.festival]
      ]);
      section('नवग्रह राशि स्थिति',[
        ['ग्रहों की स्थिति',(t.grahas||[]).map(g=>g.name+' — '+g.sign).join(' • ')]
      ]);
      const routeNames={
        full:'पंचांग गणना का विस्तृत डेटा','sun-times':'सूर्य समय का विस्तृत डेटा',
        'moon-times':'चन्द्र समय का विस्तृत डेटा','inauspicious-periods':'अशुभ काल की गणना',
        'abhijit-muhurat':'अभिजित मुहूर्त की गणना','brahma-muhurta':'ब्रह्म मुहूर्त की गणना',
        'amrit-kaal':'अमृत काल की गणना',choghadiya:'चौघड़िया के सभी समय खण्ड',hora:'दिन और रात्रि की सभी होरा'
      };
      for(const [route,title] of Object.entries(routeNames)){
        const entries=routeEntries(details[route]);
        if(route==='full')continue;
        if(entries.length)section(title,entries);
      }
      const note=document.createElement('p');note.className='panchang-complete-note';
      note.textContent='गणना स्थान: श्रीधाम वृंदावन • लाहिड़ी अयनांश • भारतीय मानक समय (IST) • तिथि बदलने पर नया दैनिक डेटा स्वतः प्राप्त होगा।';
      area.appendChild(note);
      const status=document.getElementById('panchang-status');
      if(status)status.textContent='आज का पंचांग स्वतः अपडेट • अंतिम प्राप्ति: '+new Intl.DateTimeFormat('hi-IN',{timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date());
      lastDay=day;
    }catch(error){
      const status=document.getElementById('panchang-status');
      if(status)status.textContent='पंचांग अपडेट नहीं हो पाया: '+error.message;
    }
  }
  load();
  setInterval(()=>{
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(day!==lastDay)load();
  },60000);
})();