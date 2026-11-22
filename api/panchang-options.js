// Panchang calculation profiles.
// These profiles are deliberately kept separate: an almanac tradition,
// an ayanamsha, and an observance rule-set are different configuration axes.
// Do not label an astronomical calculation as a published Panchang unless
// it has been validated against that publication's rules and edition.

const profiles = {
  kashi_vishwanath: {
    id: 'kashi_vishwanath',
    label: 'काशी विश्वनाथ पंचांग',
    category: 'published_panchang',
    status: 'needs_validation',
    description: 'काशी परंपरा का अलग प्रोफाइल; प्रकाशित संस्करण के नियमों से मिलान आवश्यक।'
  },
  rishikesh: {
    id: 'rishikesh',
    label: 'ऋषिकेश पंचांग',
    category: 'published_panchang',
    status: 'needs_publisher_identification',
    description: 'प्रकाशक/संस्करण की पुष्टि के बाद इसके विशिष्ट नियम जोड़े जाएंगे।'
  },
  drik: {
    id: 'drik',
    label: 'दृक गणना',
    category: 'astronomical_method',
    status: 'planned',
    description: 'खगोलीय गणना आधारित प्रोफाइल; एपhemeris और स्थानीय क्षितिज गणना से सत्यापन होगा।'
  },
  vaishnav_braj: {
    id: 'vaishnav_braj',
    label: 'वैष्णव / ब्रज परंपरा',
    category: 'observance_rules',
    status: 'planned',
    description: 'व्रत, उत्सव और पारण के लिए वैष्णव/ब्रज नियम अलग रखे जाएंगे।'
  }
};

const ayanamshas = {
  lahiri: { id: 'lahiri', label: 'लाहिड़ी (चित्रपक्ष)', status: 'planned' },
  kp: { id: 'kp', label: 'के.पी. (Krishnamurti)', status: 'planned' },
  raman: { id: 'raman', label: 'रमन', status: 'planned' }
};

const observanceRules = {
  smarta: { id: 'smarta', label: 'स्मार्त' },
  vaishnava: { id: 'vaishnava', label: 'वैष्णव' },
  braj: { id: 'braj', label: 'ब्रज' }
};

function resolveSelection(query = {}) {
  const p = profiles[query.profile] ? query.profile : 'kashi_vishwanath';
  const a = ayanamshas[query.ayanamsha] ? query.ayanamsha : 'lahiri';
  const o = observanceRules[query.observance] ? query.observance : 'braj';
  return {
    profile: profiles[p],
    ayanamsha: ayanamshas[a],
    observance: observanceRules[o]
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const q = req.query || {};
  const selected = resolveSelection(q);
  return res.status(200).json({
    location: { name: 'श्रीधाम वृंदावन', latitude: 27.565, longitude: 77.659, timezone: 'Asia/Kolkata' },
    defaults: { profile: 'kashi_vishwanath', ayanamsha: 'lahiri', observance: 'braj' },
    selected,
    options: {
      profiles: Object.values(profiles),
      ayanamshas: Object.values(ayanamshas),
      observanceRules: Object.values(observanceRules)
    },
    note: 'यह विकल्प-संरचना है। जिन प्रोफाइल का status planned/needs_validation है, उनकी गणना को प्रमाणित होने से पहले आधिकारिक परिणाम न मानें।'
  });
};

module.exports.resolveSelection = resolveSelection;
