const { Router } = require('express');
const { mockServiceRecords } = require('../data');
const { authMiddleware } = require('./auth');

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status } = req.query;
  let list = mockServiceRecords.filter((r) => r.userId === req.user.id);
  if (status && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }
  res.json({
    code: 0,
    message: 'ok',
    data: { total: list.length, list },
  });
});

router.get('/:id', (req, res) => {
  const record = mockServiceRecords.find(
    (r) => r.id === req.params.id && r.userId === req.user.id
  );
  if (!record) {
    return res.status(404).json({ code: 404, message: '记录不存在', data: null });
  }
  res.json({ code: 0, message: 'ok', data: record });
});

module.exports = router;
