const express = require('express');
const router = express.Router();
const BacktestSimulator = require('../engines/backtest-simulator');

const backtestSimulator = new BacktestSimulator();

router.post('/start', async (req, res) => {
  try {
    const { ruleId, options } = req.body;
    
    if (!ruleId) {
      return res.status(400).json({ success: false, error: '必须指定 ruleId' });
    }
    
    const result = await backtestSimulator.startBacktest(ruleId, options || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:backtestId/status', (req, res) => {
  try {
    const { backtestId } = req.params;
    const status = backtestSimulator.getBacktestStatus(backtestId);
    
    if (!status) {
      return res.status(404).json({ success: false, error: '回测任务不存在' });
    }
    
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:backtestId/results', (req, res) => {
  try {
    const { backtestId } = req.params;
    const results = backtestSimulator.getBacktestResults(backtestId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const backtests = backtestSimulator.getAllBacktests();
    res.json({ success: true, data: backtests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
