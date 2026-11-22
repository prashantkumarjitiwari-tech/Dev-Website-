// Vercel serverless endpoint for the website's unified AI / Help Desk.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI_SETUP_REQUIRED' });
  }
  try {
    const body = req.body || {};
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    const mode = body.mode === 'helpdesk' ? 'helpdesk' : 'knowledge';
    if (!message) return res.status(400).json({ error: 'कृपया अपना प्रश्न लिखें।' });
    const history = Array.isArray(body.history) ? body.history.slice(-8).map(item => ({
      role: item && item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item && item.content || '').slice(0, 2000)
    })).filter(item => item.content) : [];
    const instructions = mode === 'helpdesk'
      ? 'आप आचार्य देव तिवारी जी महाराज की वेबसाइट के विनम्र Help Desk सहायक हैं। हिंदी में सरल, स्पष्ट और सम्मानजनक उत्तर दें। वेबसाइट की सेवाओं, उपलब्ध सामग्री, अपॉइंटमेंट और उपयोग संबंधी सामान्य सहायता दें। वेबसाइट पर उपलब्ध न होने वाली फीस, समय, पते, बुकिंग की पुष्टि या निजी जानकारी कभी न गढ़ें। जानकारी निश्चित न हो तो साफ बताएं और उपयोगकर्ता को वेबसाइट पर दिए आधिकारिक संपर्क विकल्प से टीम से पुष्टि करने को कहें। पासवर्ड, OTP या भुगतान विवरण न मांगें।'
      : 'आप “पूछें आचार्य AI” हैं, आचार्य देव तिवारी जी महाराज की वेबसाइट के आध्यात्मिक एवं संस्कृत ज्ञान सहायक। हिंदी में सहज और आदरपूर्ण उत्तर दें; उपयोगकर्ता संस्कृत या अंग्रेज़ी में पूछे तो उसी भाषा में उत्तर दें। संस्कृत व्याकरण, श्लोक, स्तोत्र, भगवद्गीता, पुराण, कथा और सनातन परंपरा पर सावधानी से सहायता करें। श्लोक का स्रोत या पाठ निश्चित न हो तो अनिश्चितता बताएं, मनगढ़ंत उद्धरण न दें। चिकित्सा, कानूनी या वित्तीय विषयों पर विशेषज्ञ सलाह का विकल्प होने का दावा न करें।';
    const input = history.concat([{ role: 'user', content: message }]);
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-6.1-sol',
        instructions,
        input,
        max_output_tokens: 700
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('OpenAI API error:', upstream.status, data && data.error && data.error.message);
      return res.status(502).json({ error: 'अभी AI सेवा उत्तर नहीं दे पा रही है। कृपया बाद में प्रयास करें।' });
    }
    const reply = (typeof data.output_text === 'string' ? data.output_text : (Array.isArray(data.output) ? data.output.flatMap(item => Array.isArray(item.content) ? item.content : []).filter(part => part && part.type === 'output_text' && typeof part.text === 'string').map(part => part.text).join('\\n') : '')).trim();
    if (!reply) return res.status(502).json({ error: 'अभी उत्तर उपलब्ध नहीं है। कृपया पुनः प्रयास करें।' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI endpoint error:', error);
    return res.status(500).json({ error: 'सेवा में अस्थायी समस्या है। कृपया बाद में प्रयास करें।' });
  }
};
