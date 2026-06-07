const express = require('express');
const router = express.Router();

const faultsRouter = require('./faults');
const ordersRouter = require('./orders');
const engineersRouter = require('./engineers');
const adminRouter = require('./admin');

router.use('/faults', faultsRouter);
router.use('/orders', ordersRouter);
router.use('/engineers', engineersRouter);
router.use('/admin', adminRouter);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '3C Repair O2O API is running'
  });
});

module.exports = router;
