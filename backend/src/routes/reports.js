const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

router.get('/order-summary', async (req, res) => {
  try {
    const { start_date, end_date, status, role } = req.query;
    const params = {
      startDate: start_date,
      endDate: end_date,
      status,
      role
    };
    
    const report = await orderService.getReport('order_summary', params);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/exception-analysis', async (req, res) => {
  try {
    const { start_date, end_date, status, exception_type } = req.query;
    const params = {
      startDate: start_date,
      endDate: end_date,
      status,
      exceptionType: exception_type
    };
    
    const report = await orderService.getReport('exception_analysis', params);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trajectory-review', async (req, res) => {
  try {
    const { order_no, start_date, end_date } = req.query;
    
    if (!order_no) {
      res.status(400).json({ success: false, error: 'order_no 为必填项' });
      return;
    }
    
    const params = {
      orderNo: order_no,
      startDate: start_date,
      endDate: end_date
    };
    
    const report = await orderService.getReport('trajectory_review', params);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
