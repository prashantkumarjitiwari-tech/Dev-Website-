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

  const methodBar = document.createElement('div');
  methodBar.className = 'panchang-complete-item';
  methodBar.style.marginBottom = '12px';
  const methodLabel = document.createElement('b');
  methodLabel.textContent = 'स्वतंत्र गणना तुलना — अयनांश चुनें';
  const methodSelect = document.createElement('select');
  methodSelect.id = 'panchang-ayanamsha-select';
  methodSelect.setAttribute('aria-label','अयनांश चुनें');
  methodSelect.style.cssText = 'width:100%;padding:10px;border:1px solid rgba(168,121,40,.35);border-radius:9px;background:#fff;color:#493b2b';
  [['lahiri','लाहिड़ी'],['kp','के.पी. (अस्थायी)'],['raman','रमन (अनुमानित)']].forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;methodSelect.appendChild(option);});
  try { methodSelect.value = localStorage.getItem('panchang-ayanamsha') || 'lahiri'; } catch (_) {}
  methodSelect.addEventListener('change',()=>{try{localStorage.setItem('panchang-ayanamsha',methodSelect.value);}catch(_){} load();});
  methodBar.append(methodLabel,methodSelect);
  area.appendChild(methodBar);

  const labels = {
    tithi:'तिथि',tithiEnd:'तिथि समाप्ति',paksha:'पक्ष',nakshatra:'नक्षत्र',nakshatraEnd:'नक्षत्र समाप्ति',pada:'चरण',yoga:'योग',karana:'करण',
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
    const text = scalar(value) || 'इस गणना स्रोत से आज का डेटा प्राप्त नहीं हुआ';
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
      let independent = null;
      try {
        const selectedAyanamsha = methodSelect.value || 'lahiri';
        const engineResponse = await fetch('/api/panchang-engine?date='+encodeURIComponent(day)+'&time=07:00:00&timezone=5.5&ayanamsha='+encodeURIComponent(selectedAyanamsha),{headers:{Accept:'application/json'},cache:'no-store'});
        const enginePayload = await engineResponse.json();
        if (engineResponse.ok) independent = enginePayload;
      } catch (engineError) { console.warn('Independent Panchang engine unavailable:',engineError); }
      area.replaceChildren(methodBar);
      if (independent) {
        const endLabel = value => value ? new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(value)) : 'उपलब्ध नहीं';
        section('स्वतंत्र गणना — प्रायोगिक तुलना',[
          ['गणना अयनांश',independent.ayanamsha?.system],
          ['तिथि',independent.limbs?.tithi],
          ['तिथि समाप्ति',endLabel(independent.endsAt?.tithi)],
          ['नक्षत्र',independent.limbs?.nakshatra+' • चरण '+independent.limbs?.nakshatraPada],
          ['नक्षत्र समाप्ति',endLabel(independent.endsAt?.nakshatra)],
          ['योग',independent.limbs?.yoga],
          ['योग समाप्ति',endLabel(independent.endsAt?.yoga)],
          ['करण',independent.limbs?.karana],
          ['करण समाप्ति',endLabel(independent.endsAt?.karana)]
        ]);
        const accuracy=document.createElement('p');accuracy.className='panchang-complete-note';accuracy.textContent=independent.accuracyNotice||'यह प्रारंभिक स्वतंत्र गणना है।';area.appendChild(accuracy);
      }
      section('पंचांग के पाँच अंग',[
        ['तिथि / पक्ष',d.tithi],['तिथि समाप्ति',d.tithiEnd],['नक्षत्र / चरण',d.nakshatra],['नक्षत्र समाप्ति',d.nakshatraEnd],['योग',d.yoga],['करण',d.karana],['वार',d.vara]
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
        ['ऋतु',t.ritu],['चन्द्र मास',t.lunarMonth],['पक्ष',t.paksha||d.tithi],['आज के व्रत / त्योहार',t.festival]
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
      note.textContent='गणना स्थान: श्रीधाम वृंदावन • भारतीय मानक समय (IST) • स्वतंत्र गणना तुलना प्रायोगिक है • तिथि बदलने पर नया दैनिक डेटा स्वतः प्राप्त होगा।';
      area.appendChild(note);
      const status=document.getElementById('panchang-status');
      if(status){const p=payload.providers||{};const sources=[p.navamsha?'Navamsha ✓':'Navamsha अनुपलब्ध',p.astroLogics?'AstroLogics ✓':'AstroLogics अनुपलब्ध',p.goPixel?'GoPixel ✓':'GoPixel अनुपलब्ध','स्वतंत्र गणना '+(independent?'✓':'अनुपलब्ध')];status.textContent='आज का पंचांग • '+sources.join(' • ')+' • प्राप्ति: '+new Intl.DateTimeFormat('hi-IN',{timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date());}
      lastDay=day;
    }catch(error){
      const status=document.getElementById('panchang-status');
      if(status)status.textContent='पंचांग अपडेट नहीं हो पाया: '+error.message;
    }
  }
  window.shareDailyPanchang = async function(){
    const button=document.getElementById('panchang-share');
    const original=button?button.innerHTML:'';
    const rows=[];
    root.querySelectorAll('.panchang-complete h3,.panchang-metric,.panchang-extra,.panchang-complete-item').forEach(el=>{
      if(el.matches('h3')){rows.push({heading:el.textContent.trim()});return;}
      const label=el.querySelector('span,b')?.textContent?.trim()||'';
      const value=el.querySelector('strong,p')?.textContent?.trim()||el.querySelector('span')?.textContent?.trim()||'';
      if(label&&value&&value!=='—')rows.push({label,value});
    });
    if(!rows.length){alert('पंचांग अभी लोड हो रहा है। थोड़ी देर बाद फिर प्रयास करें।');return;}
    if(button){button.disabled=true;button.textContent='तस्वीर तैयार हो रही है…';}
    try{
      const canvas=document.createElement('canvas'),width=1080,pad=58,lineH=44;
      const ctx=canvas.getContext('2d');ctx.font='26px "Noto Sans Devanagari",sans-serif';
      const wrap=(text,max)=>{const words=String(text).split(/\\s+/),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>max&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;};
      let height=500;
      rows.forEach(r=>{if(r.heading)height+=64;else height+=Math.max(1,wrap(r.value,850).length)*36+62;});
      canvas.width=width;canvas.height=height+150;ctx.font='26px "Noto Sans Devanagari",sans-serif';
      const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,'#fffdf8');g.addColorStop(1,'#f2e6d1');ctx.fillStyle=g;ctx.fillRect(0,0,width,canvas.height);
      ctx.strokeStyle='#a87928';ctx.lineWidth=5;ctx.strokeRect(22,22,width-44,canvas.height-44);
      ctx.textAlign='center';ctx.fillStyle='#76521d';ctx.font='bold 42px "Noto Sans Devanagari",sans-serif';
      ctx.fillText('आज का सम्पूर्ण दैनिक पंचांग',width/2,105);
      ctx.font='25px "Noto Sans Devanagari",sans-serif';ctx.fillStyle='#756b5d';
      ctx.fillText('श्रीधाम वृंदावन • लाहिड़ी अयनांश • भारतीय मानक समय',width/2,151);
      const dateText=document.getElementById('panchang-date')?.textContent?.trim()||'';
      ctx.font='bold 23px "Noto Sans Devanagari",sans-serif';ctx.fillText(dateText,width/2,190);
      ctx.textAlign='left';let y=235;
      for(const row of rows){
        if(row.heading){y+=14;ctx.fillStyle='#76521d';ctx.font='bold 29px "Noto Sans Devanagari",sans-serif';ctx.fillText(row.heading,pad,y);y+=42;continue;}
        const lines=wrap(row.value,850);const boxH=Math.max(72,lines.length*36+30);
        ctx.fillStyle='rgba(255,255,255,.88)';ctx.strokeStyle='rgba(168,121,40,.3)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.roundRect(pad,y,width-pad*2,boxH,14);ctx.fill();ctx.stroke();
        ctx.fillStyle='#806b4d';ctx.font='21px "Noto Sans Devanagari",sans-serif';ctx.fillText(row.label,pad+20,y+29);
        ctx.fillStyle='#493b2b';ctx.font='bold 25px "Noto Sans Devanagari",sans-serif';
        lines.forEach((line,i)=>ctx.fillText(line,pad+20,y+60+i*34));
        y+=boxH+10;
      }
      ctx.textAlign='center';ctx.fillStyle='#76521d';ctx.font='22px "Noto Sans Devanagari",sans-serif';
      ctx.fillText('विस्तृत जानकारी: dev-tiwari-website-v3.vercel.app',width/2,canvas.height-58);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('तस्वीर नहीं बन पाई');
      const file=new File([blob],'sampoorna-dainik-panchang.png',{type:'image/png'});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({title:'आज का सम्पूर्ण पंचांग',text:'श्रीधाम वृंदावन का दैनिक पंचांग',files:[file]});
      }else{
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
      }
    }catch(error){if(error.name!=='AbortError')alert('पंचांग तस्वीर तैयार नहीं हो पाई। कृपया पुनः प्रयास करें।');}
    finally{if(button){button.disabled=false;button.innerHTML=original;}}
  };
  load();
  setInterval(()=>{
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(day!==lastDay)load();
  },60000);
})();