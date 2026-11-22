/* Existing Panchang accordion chart renderer. No duplicate content is created. */
(() => {
 const ids={ch:{day:'panchang-choghadiya-day',night:'panchang-choghadiya-night'},hr:{day:'panchang-hora-day',night:'panchang-hora-night'}};
 const hi={sun:'सूर्य',moon:'चन्द्र',mars:'मंगल',mercury:'बुध',jupiter:'गुरु',venus:'शुक्र',saturn:'शनि'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nm=x=>typeof x==='string'||typeof x==='number'?String(x):x?(x.name_hi||x.nameHi||x.hindi||x.label_hi||x.label||x.name||x.lord_hi||x.lord||x.planet||''):'';
 const tm=x=>{if(!x)return '';let v=typeof x==='object'?(x.ist||x.local||x.time||x.value||x.start||x.start_time||''):x;if(!v)return '';let d=new Date(v);if(String(v).includes('T')&&!isNaN(d))return new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}).format(d);let m=String(v).match(/\b\d{1,2}:\d{2}\b/);return m?m[0]:String(v)};
 const arr=x=>Array.isArray(x)?x:x&&typeof x==='object'?['periods','items','segments','data'].map(k=>x[k]).find(Array.isArray)||[]:[];
 function draw(id,data,part){
  const el=document.getElementById(id);if(!el)return;
  let list=[];
  if(data&&typeof data==='object'&&!Array.isArray(data)){
   const candidate=data[part]||data[part==='day'?'daytime':'nighttime']||data[part==='day'?'day_periods':'night_periods'];
   list=arr(candidate);
   if(!list.length)list=arr(data).filter(x=>String(x.part||x.period||x.type||'').toLowerCase().includes(part));
  } else if(Array.isArray(data)) list=data.filter(x=>String(x.part||x.period||x.type||'').toLowerCase().includes(part));
  else if(typeof data==='string')list=data.split(/\s*[•|\n]+\s*/).filter(Boolean).filter(x=>part==='night'?/रात्रि|night/i.test(x):!/रात्रि|night/i.test(x));
  el.innerHTML=list.length?list.map(x=>{
   const title=nm(x)||'समय खण्ड',a=tm(x.start||x.start_time||x.from),b=tm(x.end||x.end_time||x.to),lord=nm(x.lord||x.planet||x.ruler),range=a&&b?a+' – '+b:(x.time||x.duration||''),sub=[range,lord&&lord!==title?'स्वामी: '+(hi[String(lord).toLowerCase()]||lord):''].filter(Boolean).join(' • ');
   return '<span class="panchang-chart-card"><b>'+esc(title)+'</b><small>'+esc(sub||'समय उपलब्ध नहीं')+'</small></span>';
  }).join(''):'<span class="panchang-chart-empty">इस भाग का अलग समय-चार्ट स्रोत से उपलब्ध नहीं हुआ।</span>';
 }
 async function load(){try{const r=await fetch('/api/panchang',{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)return;const p=await r.json(),d=p.data||{},x=p.details||{};draw(ids.ch.day,x.choghadiya||d.choghadiya,'day');draw(ids.ch.night,x.choghadiya||d.choghadiya,'night');draw(ids.hr.day,x.hora||d.hora,'day');draw(ids.hr.night,x.hora||d.hora,'night');}catch(e){console.warn('Panchang chart render:',e)}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();