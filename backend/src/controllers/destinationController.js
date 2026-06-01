const db = require('../database');

const getDestinations = (req, res) => {
  try {
    const destinations = db.prepare('SELECT * FROM destinations ORDER BY name').all();
    res.json(destinations);
  } catch (error) {
    console.error('获取目的地列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getDestinations };
