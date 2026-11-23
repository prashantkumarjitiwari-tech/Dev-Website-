'use strict';

// Local daily periods for Shri Dham Vrindavan.
// Solar events use the NOAA sunrise equation; periods are derived locally,
// without requesting data from a third-party Panchang API.
const LAT=27.565, LON=77.659, OFFSET=5.5;
const norm=x=>((x%360)+360)%360;
const rad=x=>x*Math.PI/180;
const deg=x=>x*180/Math.PI;
function solarEvent(date, rise) {
  const [y,m,d]=date.split('-').map(Number);
  const n=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/86400000);
  const lngHour=LON/15, t=n+((rise?6:18)-lngHour)/24;
  const M=0.9856*t-3.289;
  let L=M+1.916*Math.sin(rad(M))+0.020*Math.sin(2*rad(M))+282.634;
  L=norm(L);
  let RA=deg(Math.atan(0.91764*Math.tan(rad(L))));
  RA=norm(RA); RA+=(Math.floor(L/90)*90-Math.floor(RA/90)*90); RA/=15;
  const sinDec=0.39782*Math.sin(rad(L)), cosDec=Math.cos(Math.asin(sinDec));
  const cosH=(Math.cos(rad(90.833))-sinDec*Math.sin(rad(LAT)))/(cosDec*Math.cos(rad(LAT)));
  if(cosH>1||cosH< -1)return null;
  const H=(rise?360-deg(Math.acos(cosH)):deg(Math.acos(cosH)))/15;
  const utc=H+RA-0.06571*t-6.622-lngHour;
  const local=((utc+OFFSET)%24+24)%24;
  const base=Date.UTC(y,m-1,d);
  const mins=Math.round(local*60);
  // mins is local wall-clock time; convert it to the actual UTC instant.
  return new Date(base+mins*60000-OFFSET*3600000).toISOString();
}
function fmt(iso){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso));}
function addMinutes(iso,mins){return new Date(new Date(iso).getTime()+mins*60000).toISOString();}
function interval(start,end,a,b){return {start:addMinutes(start,a),end:addMinutes(start,b)};}
const rahu=[8,2,7,5,6,4,3], gulika=[6,5,4,3,2,1,0], yama=[4,3,2,1,0,6,5];
const weekdayNames=['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
const horaLords=['सूर्य','शुक्र','बुध','चन्द्र','शनि','बृहस्पति','मंगल'];
const choghadiya={
  0:['उद्वेग','चर','लाभ','अमृत','काल','शुभ','रोग'],
  1:['अमृत','काल','शुभ','रोग','उद्वेग','चर','लाभ'],
  2:['रोग','उद्वेग','चर','लाभ','अमृत','काल','शुभ'],
  3:['लाभ','अमृत','काल','शुभ','रोग','उद्वेग','चर'],
  4:['शुभ','रोग','उद्वेग','चर','लाभ','अमृत','काल'],
  5:['चर','लाभ','अमृत','काल','शुभ','रोग','उद्वेग'],
  6:['काल','शुभ','रोग','उद्वेग','चर','लाभ','अमृत']
};
function calculate(date) {
  const sunrise=solarEvent(date,true), sunset=solarEvent(date,false);
  if(!sunrise||!sunset)throw new Error('सूर्योदय/सूर्यास्त इस स्थान के लिए निर्धारित नहीं हो सके');
  const [y,m,d]=date.split('-').map(Number), dow=new Date(Date.UTC(y,m-1,d)).getUTCDay();
  const dayMs=new Date(sunset)-new Date(sunrise), nightMs=24*60*60000-dayMs, unit=dayMs/8/60000;
  const dayDurmuhurta={0:[14],1:[9,12],2:[4],3:[8],4:[6,12],5:[4,9],6:[1,2]};
  const nightDurmuhurta={0:[],1:[8],2:[7],3:[],4:[],5:[8],6:[1]};
  const durmuhurta=[
    ...dayDurmuhurta[dow].map(n=>({part:'day',number:n,name:'दुर्मुहूर्त',...interval(sunrise,sunset,(n-1)*dayMs/15/60000,n*dayMs/15/60000)})),
    ...nightDurmuhurta[dow].map(n=>({part:'night',number:n,name:'दुर्मुहूर्त',...interval(sunset,addMinutes(sunset,nightMs/60000),(n-1)*nightMs/15/60000,n*nightMs/15/60000)}))
  ];
  const periods={
    rahuKaal:interval(sunrise,sunset,rahu[dow]*unit,(rahu[dow]+1)*unit),
    gulika:interval(sunrise,sunset,gulika[dow]*unit,(gulika[dow]+1)*unit),
    yamagand:interval(sunrise,sunset,yama[dow]*unit,(yama[dow]+1)*unit),
    abhijit:interval(sunrise,sunset,dayMs/2/60000-unit/2,dayMs/2/60000+unit/2),
    brahma: {start:addMinutes(sunrise,-96),end:addMinutes(sunrise,-48)}
  };
  const nextSunrise=addMinutes(sunrise,1440);
  const hora=[];
  // Chaldean planetary-hour sequence starts with weekday lord.
  const order=['शनि','बृहस्पति','मंगल','सूर्य','शुक्र','बुध','चन्द्र'];
  const weekdayLord=['सूर्य','चन्द्र','मंगल','बुध','बृहस्पति','शुक्र','शनि'][dow];
  let index=order.indexOf(weekdayLord);
  for(let i=0;i<24;i++){
    const night=i>=12, duration=(night?nightMs:dayMs)/12/60000;
    const start=night?addMinutes(sunset,(i-12)*duration):addMinutes(sunrise,i*duration);
    hora.push({part:night?'night':'day',lord:order[index],start,end:addMinutes(start,duration)});
    index=(index+1)%7;
  }
  const dayNames=[...choghadiya[dow],choghadiya[dow][0]], nightNames=[...choghadiya[(dow+1)%7],choghadiya[(dow+1)%7][0]];
  const makeCh=(start,total,names,part)=>names.map((name,i)=>({name,part,start:addMinutes(start,i*total/8),end:addMinutes(start,(i+1)*total/8)}));
  const ch=[...makeCh(sunrise,dayMs/60000,dayNames,'day'),...makeCh(sunset,nightMs/60000,nightNames,'night')];
  return {weekday:weekdayNames[dow],sunrise,sunset,periods,durmuhurta,hora,choghadiya:ch};
}
module.exports={calculate};
