const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

class RiskCheckEngine {
  static CHECK_TYPES = {
    BALANCE_CHECK: 'balance_check',
    POSITION_CHECK: 'position_check',
    PRICE_LIMIT_CHECK: 'price_limit_check',
    QUANTITY_LIMIT_CHECK: 'quantity_limit_check',
    MARKET_STATUS_CHECK: 'market_status_check'
  };

  static checkOrder(order, user) {
    const checkResults = [];
    
    checkResults.push(this.checkMarketStatus(order));
    checkResults.push(this.checkQuantityLimit(order));
    
    if (order.direction === 'buy') {
      checkResults.push(this.checkBalance(order, user));
      checkResults.push(this.checkPriceLimit(order, 'buy'));
    } else {
      checkResults.push(this.checkPosition(order, user));
      checkResults.push(this.checkPriceLimit(order, 'sell'));
    }

    const allPassed = checkResults.every(r => r.result === 'passed');
    const details = checkResults.map(r => ({
      type: r.type,
      result: r.result,
      message: r.message
    }));

    this.logRiskCheck(order.id, user.id, checkResults);

    return {
      passed: allPassed,
      details: details,
      reason: allPassed ? null : checkResults.find(r => r.result === 'failed')?.message
    };
  }

  static checkMarketStatus(order) {
    const security = db.prepare('SELECT status FROM securities WHERE code = ?').get(order.security_code);
    
    if (!security || security.status !== 'trading') {
      return {
        type: this.CHECK_TYPES.MARKET_STATUS_CHECK,
        result: 'failed',
        message: `证券 ${order.security_code} 当前不可交易`
      };
    }

    return {
      type: this.CHECK_TYPES.MARKET_STATUS_CHECK,
      result: 'passed',
      message: '市场状态正常'
    };
  }

  static checkQuantityLimit(order) {
    if (order.quantity < 100 || order.quantity % 100 !== 0) {
      return {
        type: this.CHECK_TYPES.QUANTITY_LIMIT_CHECK,
        result: 'failed',
        message: '委托数量必须为100的整数倍'
      };
    }

    if (order.quantity > 1000000) {
      return {
        type: this.CHECK_TYPES.QUANTITY_LIMIT_CHECK,
        result: 'failed',
        message: '单次委托数量不能超过100万股'
      };
    }

    return {
      type: this.CHECK_TYPES.QUANTITY_LIMIT_CHECK,
      result: 'passed',
      message: '委托数量合法'
    };
  }

  static checkBalance(order, user) {
    const funds = db.prepare('SELECT available_balance FROM funds WHERE user_id = ?').get(user.id);
    
    if (!funds) {
      return {
        type: this.CHECK_TYPES.BALANCE_CHECK,
        result: 'failed',
        message: '资金账户不存在'
      };
    }

    const estimatedCost = order.price * order.quantity;
    const commission = estimatedCost * 0.0003;
    const totalCost = estimatedCost + commission;

    if (funds.available_balance < totalCost) {
      return {
        type: this.CHECK_TYPES.BALANCE_CHECK,
        result: 'failed',
        message: `可用资金不足，需要 ${totalCost.toFixed(2)} 元，当前可用 ${funds.available_balance.toFixed(2)} 元`
      };
    }

    return {
      type: this.CHECK_TYPES.BALANCE_CHECK,
      result: 'passed',
      message: `资金充足，预计需要 ${totalCost.toFixed(2)} 元`
    };
  }

  static checkPosition(order, user) {
    const position = db.prepare(
      'SELECT available_quantity FROM positions WHERE user_id = ? AND security_code = ?'
    ).get(user.id, order.security_code);

    if (!position || position.available_quantity < order.quantity) {
      return {
        type: this.CHECK_TYPES.POSITION_CHECK,
        result: 'failed',
        message: `可用持仓不足，当前可用 ${position?.available_quantity || 0} 股，需要 ${order.quantity} 股`
      };
    }

    return {
      type: this.CHECK_TYPES.POSITION_CHECK,
      result: 'passed',
      message: `持仓充足，当前可用 ${position.available_quantity} 股`
    };
  }

  static checkPriceLimit(order, direction) {
    const security = db.prepare(
      'SELECT prev_close, current_price FROM securities WHERE code = ?'
    ).get(order.security_code);

    if (!security) {
      return {
        type: this.CHECK_TYPES.PRICE_LIMIT_CHECK,
        result: 'failed',
        message: '证券信息不存在'
      };
    }

    const upperLimit = security.prev_close * 1.1;
    const lowerLimit = security.prev_close * 0.9;

    if (order.price > upperLimit || order.price < lowerLimit) {
      return {
        type: this.CHECK_TYPES.PRICE_LIMIT_CHECK,
        result: 'failed',
        message: `委托价格超出涨跌幅限制，限制范围 ${lowerLimit.toFixed(2)} - ${upperLimit.toFixed(2)}`
      };
    }

    return {
      type: this.CHECK_TYPES.PRICE_LIMIT_CHECK,
      result: 'passed',
      message: '委托价格在限制范围内'
    };
  }

  static logRiskCheck(orderId, userId, checkResults) {
    for (const result of checkResults) {
      const logId = uuidv4();
      db.prepare(`
        INSERT INTO risk_check_logs (id, order_id, user_id, check_type, check_result, check_message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        logId,
        orderId,
        userId,
        result.type,
        result.result,
        result.message,
        Date.now()
      );
    }
  }
}

module.exports = RiskCheckEngine;
