(() => {
  const style = document.createElement('style');
  style.textContent = `
    #daily-panchang{width:min(1180px,calc(100% - 36px));margin:18px auto 28px;padding:24px;border:1px solid rgba(168,121,40,.28);border-radius:22px;background:linear-gradient(135deg,#fffdf8 0%,#f5ead5 100%);box-shadow:0 14px 34px rgba(76,55,24,.10);color:#33291f}
    #daily-panchang .p-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}
    #daily-panchang .p-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;color:#98702e;text-transform:uppercase}
    #daily-panchang h2{font-size:clamp(21px,3vw,28px);color:#654719;margin:3px 0}
    #daily-panchang .p-date{font-size:13px;color:#756b5d}
    #daily-panchang .p-badge{padding:8px 13px;border-radius:20px;background:#eee1c5;color:#76521d;font-size:11px;font-weight:800;white-space:nowrap}
    #daily-panchang .p-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
    #daily-panchang .p-item{padding:14px 12px;border:1px solid rgba(168,121,40,.17);border-radius:14px;background:rgba(255,255,255,.72);min-width:0}
    #daily-panchang .p-item small{display:block;color:#8a7655;font-size:11px;margin-bottom:5px}
    #daily-panchang .p-item strong{display:block;color:#493516;font-size:15px;overflow-wrap:anywhere}
    #daily-panchang .p-times{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
    #daily-panchang .p-times .p-item{background:#f4eddf}
    #daily-panchang .p-status{font-size:12px;color:#756b5d;margin-top:13px}
    #daily-panchang .p-refresh{border:1px solid #c7a568;background:#fffaf0;color:#76521d;border-radius:20px;padding:8px 12px;font-family:inherit;font-size:11px;font-weight:600;cursor:pointer}
    #daily-panchang .p-refresh:disabled{opacity:.6}
    #ai-acharya{position:fixed;right:18px;bottom:18px;z-index:1100;font-family:inherit}
    #ai-acharya .ai-toggle{border:0;border-radius:28px;padding:13px 18px;background:linear-gradient(135deg,#315d53,#21473f);color:#fff;box-shadow:0 8px 24px rgba(30,67,58,.25);font-weight:700;cursor:pointer}
    #ai-acharya .ai-panel{display:none;position:absolute;right:0;bottom:60px;width:min(370px,calc(100vw - 28px));height:min(530px,calc(100dvh - 110px));border:1px solid rgba(168,121,40,.3);border-radius:18px;background:#fffdf8;box-shadow:0 18px 48px rgba(40,30,15,.22);overflow:hidden;flex-direction:column}
    #ai-acharya.open .ai-panel{display:flex}
    #ai-acharya .ai-head{padding:15px 16px;background:linear-gradient(135deg,#315d53,#21473f);color:#fff}
    #ai-acharya .ai-head strong{display:block;font-size:15px}
    #ai-acharya .ai-head small{display:block;font-size:11px;opacity:.85;margin-top:3px}
    #ai-acharya .ai-messages{padding:14px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px;background:#faf6ed}
    #ai-acharya .ai-msg{max-width:90%;padding:10px 12px;border-radius:13px;font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
    #ai-acharya .ai-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e8ddc8;color:#403525}
    #ai-acharya .ai-msg.user{align-self:flex-end;background:#e8efea;color:#24483d}
    #ai-acharya .ai-form{display:flex;gap:8px;padding:11px;border-top:1px solid #eadfc9;background:#fffdf8}
    #ai-acharya .ai-form input{flex:1;min-width:0;border:1px solid #d8c8a7;border-radius:20px;padding:11px 13px;font-family:inherit;font-size:13px}
    #ai-acharya .ai-form button{border:0;border-radius:20px;padding:0 15px;background:#315d53;color:#fff;font-weight:700}
    @media(max-width:700px){#daily-panchang{width:calc(100% - 20px);margin:12px auto 20px;padding:17px 13px;border-radius:17px}#daily-panchang .p-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#daily-panchang .p-times{grid-template-columns:1fr 1fr}#daily-panchang .p-head{align-items:flex-start}#daily-panchang .p-badge{font-size:9px;padding:7px 9px}#ai-acharya{right:12px;bottom:12px}#ai-acharya .ai-toggle{padding:12px 15px;font-size:12px}}
  `;
  document.head.appendChild(style);

  const panchang = document.createElement('section');
  panchang.id = 'daily-panchang';
  panchang.setAttribute('aria-labelledby','panchang-title');
  panchang.innerHTML = `
    <div class="p-head"><div><span class="p-kicker">दैनिक वैदिक पंचांग</span><h2 id="panchang-title">☀️ आज का पंचांग</h2><div class="p-date" id="p-date">श्रीधाम वृंदावन</div></div><span class="p-badge">श्रीधाम वृंदावन</span></div>
    <div class="p-grid">
      <div class="p-item"><small>तिथि</small><strong id="p-tithi">लोड हो रहा है…</strong></div>
      <div class="p-item"><small>वार</small><strong id="p-vara">—</strong></div>
      <div class="p-item"><small>नक्षत्र</small><strong id="p-nakshatra">—</strong></div>
      <div class="p-item"><small>योग</small><strong id="p-yoga">—</strong></div>
      <div class="p-item"><small>करण</small><strong id="p-karana">—</strong></div>
    </div>
    <div class="p-times">
      <div class="p-item"><small>🌅 सूर्योदय</small><strong id="p-sunrise">—</strong></div>
      <div class="p-item"><small>🌇 सूर्यास्त</small><strong id="p-sunset">—</strong></div>
      <div class="p-item"><small>राहुकाल</small><strong id="p-rahu">—</strong></div>
    </div>
    <div class="p-status" id="p-status" role="status">पंचांग की जानकारी प्राप्त की जा रही है…</div>`;
  const hero = document.querySelector('.profile-cover-hero');
  if (hero && hero.parentNode) hero.parentNode.insertBefore(panchang, hero);
  else document.body.insertBefore(panchang, document.body.firstChild);

  const dateEl = document.getElementById('p-date');
  dateEl.textContent = new Intl.DateTimeFormat('hi-IN',{dateStyle:'full',timeZone:'Asia/Kolkata'}).format(new Date())+' • श्रीधाम वृंदावन';
  const status = document.getElementById('p-status');
  const set = (id,val) => { document.getElementById(id).textContent = val || '—'; };
  async function loadPanchang(){
    try{
      const response=await fetch('/api/panchang',{headers:{Accept:'application/json'}});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || 'पंचांग अभी उपलब्ध नहीं है।');
      const d=data.data||data;
      set('p-tithi',d.tithi);set('p-vara',d.vara);set('p-nakshatra',d.nakshatra);set('p-yoga',d.yoga);set('p-karana',d.karana);
      set('p-sunrise',d.sunrise);set('p-sunset',d.sunset);set('p-rahu',d.rahuKaal);
      status.textContent='अंतिम अपडेट: '+new Intl.DateTimeFormat('hi-IN',{timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date())+' • पंचांग स्थानीय समयानुसार।';
    }catch(e){status.textContent=e.message+' सेवा सक्रिय करने के लिए वेबसाइट सर्वर पर NAVAMSHA_API_KEY जोड़ना होगा।';}
  }
  loadPanchang();
  const chat=document.createElement('div');chat.id='ai-acharya';
  chat.innerHTML=`<button class="ai-toggle" type="button" aria-expanded="false">✦ पूछें आचार्य AI</button><div class="ai-panel" role="dialog" aria-label="आचार्य AI संवाद"><div class="ai-head"><strong>✦ पूछें आचार्य AI</strong><small>संस्कृत • शास्त्र • सनातन ज्ञान • वेबसाइट सहायता</small></div><div class="ai-messages" aria-live="polite"><div class="ai-msg bot">राधे राधे! 🙏 संस्कृत, श्लोक, स्तोत्र, भागवत कथा और सनातन परंपरा से जुड़ा अपना प्रश्न पूछें।</div></div><form class="ai-form"><input type="text" maxlength="1200" placeholder="अपना प्रश्न लिखें…" aria-label="अपना प्रश्न लिखें" required><button type="submit">भेजें</button></form></div>`;
  document.body.appendChild(chat);
  const toggle=chat.querySelector('.ai-toggle'),panel=chat.querySelector('.ai-panel'),messages=chat.querySelector('.ai-messages'),form=chat.querySelector('form'),input=form.querySelector('input'),send=form.querySelector('button');
  toggle.addEventListener('click',()=>{const open=chat.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));if(open)input.focus();});
  function bubble(text,kind){const el=document.createElement('div');el.className='ai-msg '+kind;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el;}
  form.addEventListener('submit',async e=>{e.preventDefault();const question=input.value.trim();if(!question)return;bubble(question,'user');input.value='';send.disabled=true;const pending=bubble('विचार कर रहा हूँ…','bot');try{const r=await fetch('/api/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})});const j=await r.json();if(!r.ok)throw new Error(j.error||'अभी उत्तर नहीं मिल पाया।');pending.textContent=j.answer||'क्षमा करें, उत्तर उपलब्ध नहीं है।';}catch(err){pending.textContent=err.message+' AI सेवा सक्रिय करने के लिए Vercel में OPENAI_API_KEY जोड़ना होगा।';}finally{send.disabled=false;input.focus();}});
})();