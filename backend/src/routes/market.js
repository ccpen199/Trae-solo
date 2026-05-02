const express = require('express');
const { authenticateToken } = require('./auth');
const marketDataEngine = require('../market-data-engine');
const matchingEngine = require('../matching-engine');

const router = express.Router();

router.use(authenticateToken);

router.get('/securities', async (req, res) => {
  try {
    const securities = marketDataEngine.getAllSecurities();
    res.json(securities);
  } catch (error) {
    console.error('获取证券列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/securities/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const data = marketDataEngine.getLatestMarketData(code);
    
    if (!data) {
      return res.status(404).json({ error: '证券不存在' });
    }

    res.json(data);
  } catch (error) {
    console.error('获取证券行情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/securities/:code/kline', async (req, res) => {
  try {
    const { code } = req.params;
    const { period = 'day', limit = 100 } = req.query;
    
    const klineData = marketDataEngine.getKLineData(code, period, parseInt(limit));
    res.json(klineData);
  } catch (error) {
    console.error('获取K线数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/orderbook/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const orderBook = matchingEngine.getOrderBook(code);
    
    const formattedBook = {
      securityCode: code,
      bids: orderBook.buy.map(o => ({
        price: o.price,
        quantity: o.remaining_quantity,
        orders: 1
      })),
      asks: orderBook.sell.map(o => ({
        price: o.price,
        quantity: o.remaining_quantity,
        orders: 1
      })),
      timestamp: Date.now()
    };

    res.json(formattedBook);
  } catch (error) {
    console.error('获取订单簿错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
