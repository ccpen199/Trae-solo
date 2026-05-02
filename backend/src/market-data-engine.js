const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class MarketDataEngine {
  constructor() {
    this.subscriptions = new Map();
    this.priceGenerators = new Map();
    this.isRunning = false;
  }

  initialize() {
    const securities = db.prepare('SELECT code, name, current_price, prev_close FROM securities').all();
    
    for (const sec of securities) {
      this.priceGenerators.set(sec.code, {
        code: sec.code,
        basePrice: sec.current_price,
        currentPrice: sec.current_price,
        prevClose: sec.prev_close,
        volatility: 0.002,
        tickInterval: 1000
      });
    }

    this.isRunning = true;
    this.startDataGeneration();
    console.log('行情引擎初始化完成');
  }

  startDataGeneration() {
    setInterval(() => {
      if (!this.isRunning) return;
      
      this.priceGenerators.forEach((generator, code) => {
        const priceChange = (Math.random() - 0.5) * 2 * generator.volatility * generator.currentPrice;
        const newPrice = Math.max(
          generator.prevClose * 0.9,
          Math.min(generator.prevClose * 1.1, generator.currentPrice + priceChange)
        );
        
        const oldPrice = generator.currentPrice;
        generator.currentPrice = Math.round(newPrice * 100) / 100;
        
        const volume = Math.floor(Math.random() * 10000) + 100;
        
        this.generateMarketData(code, generator.currentPrice, volume, oldPrice, generator.prevClose);
        
        db.prepare(`
          UPDATE securities 
          SET current_price = ?, volume = volume + ?, amount = amount + ?, updated_at = ?
          WHERE code = ?
        `).run(generator.currentPrice, volume, generator.currentPrice * volume, Date.now(), code);

        this.broadcastToSubscribers(code, 'tick', {
          code,
          price: generator.currentPrice,
          volume,
          timestamp: Date.now(),
          change: generator.currentPrice - generator.prevClose,
          changePercent: ((generator.currentPrice - generator.prevClose) / generator.prevClose * 100)
        });
      });
    }, 1000);
  }

  generateMarketData(securityCode, price, volume, oldPrice, prevClose) {
    const bidLevels = [];
    const askLevels = [];

    for (let i = 0; i < 5; i++) {
      const bidPrice = Math.round((price - (i + 1) * 0.01) * 100) / 100;
      const bidVolume = Math.floor(Math.random() * 50000) + 1000;
      bidLevels.push({ price: bidPrice, volume: bidVolume });

      const askPrice = Math.round((price + (i + 1) * 0.01) * 100) / 100;
      const askVolume = Math.floor(Math.random() * 50000) + 1000;
      askLevels.push({ price: askPrice, volume: askVolume });
    }

    const marketDataId = db.prepare(`
      INSERT INTO market_data (
        security_code, timestamp, price, volume,
        bid_price_1, bid_volume_1, bid_price_2, bid_volume_2, bid_price_3, bid_volume_3,
        bid_price_4, bid_volume_4, bid_price_5, bid_volume_5,
        ask_price_1, ask_volume_1, ask_price_2, ask_volume_2, ask_price_3, ask_volume_3,
        ask_price_4, ask_volume_4, ask_price_5, ask_volume_5
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      securityCode, Date.now(), price, volume,
      bidLevels[0].price, bidLevels[0].volume,
      bidLevels[1].price, bidLevels[1].volume,
      bidLevels[2].price, bidLevels[2].volume,
      bidLevels[3].price, bidLevels[3].volume,
      bidLevels[4].price, bidLevels[4].volume,
      askLevels[0].price, askLevels[0].volume,
      askLevels[1].price, askLevels[1].volume,
      askLevels[2].price, askLevels[2].volume,
      askLevels[3].price, askLevels[3].volume,
      askLevels[4].price, askLevels[4].volume
    );

    const security = db.prepare('SELECT * FROM securities WHERE code = ?').get(securityCode);
    if (security) {
      const newHigh = Math.max(security.high || price, price);
      const newLow = Math.min(security.low || price, price);
      db.prepare(`
        UPDATE securities 
        SET high = ?, low = ?, updated_at = ?
        WHERE code = ?
      `).run(newHigh, newLow, Date.now(), securityCode);
    }

    return marketDataId;
  }

  subscribe(connectionId, subscriptionType, securityCode = null) {
    const key = `${subscriptionType}:${securityCode || 'all'}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key).add(connectionId);
    
    if (subscriptionType === 'market_data' && securityCode) {
      const latestData = this.getLatestMarketData(securityCode);
      return latestData;
    }
    
    return null;
  }

  unsubscribe(connectionId, subscriptionType, securityCode = null) {
    const key = `${subscriptionType}:${securityCode || 'all'}`;
    
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).delete(connectionId);
    }
  }

  removeConnection(connectionId) {
    this.subscriptions.forEach((connections) => {
      connections.delete(connectionId);
    });
  }

  broadcastToSubscribers(securityCode, eventType, data) {
    const key = `market_data:${securityCode}`;
    
    if (this.subscriptions.has(key)) {
      const connections = this.subscriptions.get(key);
      const message = JSON.stringify({
        type: eventType,
        data: data,
        timestamp: Date.now()
      });

      connections.forEach(connId => {
        if (global.wsConnections && global.wsConnections.has(connId)) {
          try {
            const ws = global.wsConnections.get(connId);
            if (ws.readyState === 1) {
              ws.send(message);
            }
          } catch (err) {
            console.error('发送行情数据失败:', err);
          }
        }
      });
    }
  }

  getLatestMarketData(securityCode) {
    const security = db.prepare('SELECT * FROM securities WHERE code = ?').get(securityCode);
    
    if (!security) {
      return null;
    }

    const latestData = db.prepare(`
      SELECT * FROM market_data 
      WHERE security_code = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).get(securityCode);

    return {
      code: security.code,
      name: security.name,
      currentPrice: security.current_price,
      prevClose: security.prev_close,
      open: security.open,
      high: security.high,
      low: security.low,
      volume: security.volume,
      amount: security.amount,
      change: security.current_price - security.prev_close,
      changePercent: ((security.current_price - security.prev_close) / security.prev_close * 100),
      bidLevels: latestData ? [
        { price: latestData.bid_price_1, volume: latestData.bid_volume_1 },
        { price: latestData.bid_price_2, volume: latestData.bid_volume_2 },
        { price: latestData.bid_price_3, volume: latestData.bid_volume_3 },
        { price: latestData.bid_price_4, volume: latestData.bid_volume_4 },
        { price: latestData.bid_price_5, volume: latestData.bid_volume_5 }
      ] : [],
      askLevels: latestData ? [
        { price: latestData.ask_price_1, volume: latestData.ask_volume_1 },
        { price: latestData.ask_price_2, volume: latestData.ask_volume_2 },
        { price: latestData.ask_price_3, volume: latestData.ask_volume_3 },
        { price: latestData.ask_price_4, volume: latestData.ask_volume_4 },
        { price: latestData.ask_price_5, volume: latestData.ask_volume_5 }
      ] : [],
      timestamp: Date.now()
    };
  }

  getAllSecurities() {
    return db.prepare('SELECT * FROM securities').all().map(sec => ({
      code: sec.code,
      name: sec.name,
      currentPrice: sec.current_price,
      prevClose: sec.prev_close,
      change: sec.current_price - sec.prev_close,
      changePercent: ((sec.current_price - sec.prev_close) / sec.prev_close * 100),
      volume: sec.volume,
      amount: sec.amount,
      status: sec.status
    }));
  }

  getKLineData(securityCode, period = 'day', limit = 100) {
    const marketData = db.prepare(`
      SELECT * FROM market_data 
      WHERE security_code = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(securityCode, limit * 10);

    const kLines = [];
    let currentPeriod = null;
    let periodData = null;

    for (const data of marketData.reverse()) {
      const periodKey = this.getPeriodKey(data.timestamp, period);
      
      if (periodKey !== currentPeriod) {
        if (periodData) {
          kLines.push(periodData);
        }
        currentPeriod = periodKey;
        periodData = {
          time: periodKey,
          open: data.price,
          high: data.price,
          low: data.price,
          close: data.price,
          volume: data.volume,
          amount: data.price * data.volume
        };
      } else {
        periodData.high = Math.max(periodData.high, data.price);
        periodData.low = Math.min(periodData.low, data.price);
        periodData.close = data.price;
        periodData.volume += data.volume;
        periodData.amount += data.price * data.volume;
      }
    }

    if (periodData) {
      kLines.push(periodData);
    }

    return kLines.slice(-limit);
  }

  getPeriodKey(timestamp, period) {
    const date = new Date(timestamp);
    
    switch (period) {
      case 'minute':
        return Math.floor(timestamp / 60000) * 60000;
      case 'hour':
        return Math.floor(timestamp / 3600000) * 3600000;
      case 'day':
      default:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = new MarketDataEngine();
