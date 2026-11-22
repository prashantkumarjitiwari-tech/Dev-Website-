'use strict';
const engine = require('./panchang-astronomy');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const q = req.query || {};
    const result = engine.calculate({
      date: q.date,
      time: q.time || '12:00:00',
      timezone: q.timezone || '5.5',
      ayanamsha: q.ayanamsha || 'lahiri'
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Invalid Panchang engine request' });
  }
};
