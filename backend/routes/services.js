const { Router } = require('express');
const { mockServices } = require('../data');

const router = Router();

router.get('/', (req, res) => {
  const { keyword, category, bureau, city, hot } = req.query;
  let list = [...mockServices];

  if (city) {
    list = list.filter((s) => s.city.includes(city));
  }
  if (category && category !== 'all') {
    list = list.filter((s) => s.category === category);
  }
  if (bureau && bureau !== 'all') {
    list = list.filter((s) => s.bureau === bureau);
  }
  if (hot === 'true' || hot === '1') {
    list = list.filter((s) => s.isHot);
  }
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        s.bureau.toLowerCase().includes(kw) ||
        s.category.toLowerCase().includes(kw)
    );
  }

  res.json({
    code: 0,
    message: 'ok',
    data: {
      total: list.length,
      list,
    },
  });
});

router.get('/:id', (req, res) => {
  const service = mockServices.find((s) => s.id === req.params.id);
  if (!service) {
    return res.status(404).json({ code: 404, message: '服务不存在', data: null });
  }
  res.json({ code: 0, message: 'ok', data: service });
});

router.post('/:id/submit', (req, res) => {
  res.json({
    code: 0,
    message: '提交成功，已进入办理流程',
    data: {
      recordId: 'B' + Date.now(),
      serviceId: req.params.id,
      submitTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'pending',
    },
  });
});

module.exports = router;
