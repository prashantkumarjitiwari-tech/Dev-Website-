module.exports = async (req,res) => {
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(503).json({error:'AI सेवा अभी सेटअप नहीं हुई है।'});
  const message=String((req.body&&req.body.message)||'').trim();
  if(!message||message.length>1200) return res.status(400).json({error:'कृपया 1 से 1200 अक्षरों के बीच प्रश्न लिखें।'});
  try {
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'gpt-5.4-mini',
        instructions:'आप आचार्य देव तिवारी जी महाराज की वेबसाइट के आध्यात्मिक अध्ययन सहायक हैं। विनम्र, स्पष्ट और स्वाभाविक हिन्दी में उत्तर दें; उपयोगकर्ता जिस भाषा में पूछे उसी भाषा में उत्तर दें। मुख्य विषय: संस्कृत व्याकरण, श्लोक और स्तोत्र का शुद्ध पाठ व अर्थ, श्रीमद्भागवत, रामायण, पुराण, सनातन धर्म, वैदिक परंपरा, सामान्य ज्योतिष-शास्त्रीय जानकारी और वेबसाइट की सेवाएँ। जहाँ मत/सम्प्रदाय/पाठभेद हों, उन्हें स्पष्ट करें; शास्त्रीय उद्धरण गढ़ें नहीं। व्यक्तिगत चिकित्सा, कानूनी या वित्तीय निर्णय न दें। प्रश्न विषय से बाहर हो तो संक्षेप में उपयोगी उत्तर दें और अपनी विशेषज्ञता की सीमा स्पष्ट रखें। स्वयं को वास्तविक आचार्य या मनुष्य बताने का दावा न करें।',
        input:message,
        max_output_tokens:650
      })
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error&&data.error.message||'AI provider error');
    const answer=data.output_text||((data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n'));
    return res.status(200).json({answer:answer||'क्षमा करें, अभी उत्तर तैयार नहीं हो पाया।'});
  } catch(error) {
    console.error('AI chat error:',error.message);
    return res.status(502).json({error:'अभी उत्तर नहीं मिल पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।'});
  }
};