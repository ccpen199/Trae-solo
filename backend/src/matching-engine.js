const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');
const OrderStateMachine = require('./state-machine');

class MatchingEngine {
  constructor() {
    this.orderBook = { buy: [], sell: [] };
  }

  initialize() {
    const pendingOrders = db.prepare(`
      SELECT id, order_no, user_id, security_code, direction, price, quantity, 
           filled_quantity, created_at
      FROM orders 
      WHERE status IN ('accepted', 'partially_filled')
      ORDER BY created_at
    `).all();

    for (const order of pendingOrders) {
      this.addToOrderBook(order);
    }

    console.log('撮合引擎初始化完成，加载订单数量:', pendingOrders.length);
  }

  addToOrderBook(order) {
    const remainingQty = order.quantity - order.filled_quantity;
    if (remainingQty <= 0) return;

    const orderEntry = {
      ...order,
      remaining_quantity: remainingQty
    };

    if (order.direction === 'buy') {
      this.orderBook.buy.push(orderEntry);
      this.orderBook.buy.sort((a, b) => {
        if (b.price !== a.price) return b.price - a.price;
        return a.created_at - b.created_at;
      });
    } else {
      this.orderBook.sell.push(orderEntry);
      this.orderBook.sell.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.created_at - b.created_at;
      });
    }
  }

  removeFromOrderBook(orderId) {
    this.orderBook.buy = this.orderBook.buy.filter(o => o.id !== orderId);
    this.orderBook.sell = this.orderBook.sell.filter(o => o.id !== orderId);
  }

  matchOrder(newOrder) {
    const trades = [];
    let remainingQty = newOrder.quantity - newOrder.filled_quantity;

    if (newOrder.direction === 'buy') {
      const matchingOrders = this.orderBook.sell.filter(
        o => o.price <= newOrder.price && o.security_code === newOrder.security_code
      );

      for (const sellOrder of matchingOrders) {
        if (remainingQty <= 0) break;

        const matchQty = Math.min(remainingQty, sellOrder.remaining_quantity);
        const matchPrice = sellOrder.price;

        const trade = this.executeTrade(newOrder, sellOrder, matchPrice, matchQty);
        trades.push(trade);

        remainingQty -= matchQty;
        sellOrder.remaining_quantity -= matchQty;

        this.updateOrderStatus(sellOrder.id, matchQty, matchPrice);

        if (sellOrder.remaining_quantity <= 0) {
          this.orderBook.sell = this.orderBook.sell.filter(o => o.id !== sellOrder.id);
        }
      }
    } else {
      const matchingOrders = this.orderBook.buy.filter(
        o => o.price >= newOrder.price && o.security_code === newOrder.security_code
      );

      for (const buyOrder of matchingOrders) {
        if (remainingQty <= 0) break;

        const matchQty = Math.min(remainingQty, buyOrder.remaining_quantity);
        const matchPrice = buyOrder.price;

        const trade = this.executeTrade(newOrder, buyOrder, matchPrice, matchQty);
        trades.push(trade);

        remainingQty -= matchQty;
        buyOrder.remaining_quantity -= matchQty;

        this.updateOrderStatus(buyOrder.id, matchQty, matchPrice);

        if (buyOrder.remaining_quantity <= 0) {
          this.orderBook.buy = this.orderBook.buy.filter(o => o.id !== buyOrder.id);
        }
      }
    }

    const filledQty = newOrder.quantity - remainingQty;
    if (filledQty > 0) {
      this.updateOrderStatus(newOrder.id, filledQty, newOrder.price);
    }

    if (remainingQty > 0) {
      this.addToOrderBook({
        ...newOrder,
        filled_quantity: filledQty,
        remaining_quantity: remainingQty
      });
    }

    return trades;
  }

  executeTrade(takerOrder, makerOrder, price, quantity) {
    const tradeId = uuidv4();
    const tradeNo = `T${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const amount = price * quantity;
    const commission = amount * 0.0003;
    const stampTax = takerOrder.direction === 'sell' ? amount * 0.001 : 0;
    const transferFee = amount * 0.00002;

    db.prepare(`
      INSERT INTO trades (id, trade_no, order_id, user_id, security_code, direction, 
                          price, quantity, amount, commission, stamp_tax, transfer_fee, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tradeId, tradeNo, takerOrder.id, takerOrder.user_id, takerOrder.security_code,
      takerOrder.direction, price, quantity, amount, commission, stampTax, transferFee, 'completed'
    );

    this.updateUserFunds(takerOrder.user_id, takerOrder.direction, amount, commission, stampTax, transferFee);
    this.updateUserPosition(takerOrder.user_id, takerOrder.security_code, takerOrder.direction, quantity, price);

    return {
      id: tradeId,
      trade_no: tradeNo,
      order_id: takerOrder.id,
      security_code: takerOrder.security_code,
      direction: takerOrder.direction,
      price: price,
      quantity: quantity,
      amount: amount,
      commission: commission,
      stamp_tax: stampTax,
      transfer_fee: transferFee
    };
  }

  updateOrderStatus(orderId, quantity, price) {
    const order = db.prepare(
      'SELECT id, quantity, filled_quantity, status FROM orders WHERE id = ?'
    ).get(orderId);

    if (!order) return;

    const newFilledQty = order.filled_quantity + quantity;
    const newFilledAmount = (order.filled_amount || 0) + (quantity * price);

    db.prepare(`
      UPDATE orders 
      SET filled_quantity = ?, filled_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(newFilledQty, newFilledAmount, Date.now(), orderId);

    if (newFilledQty >= order.quantity) {
      OrderStateMachine.transition(orderId, 'filled', '全部成交');
    } else if (order.status === 'accepted') {
      OrderStateMachine.transition(orderId, 'partially_filled', '部分成交');
    }
  }

  updateUserFunds(userId, direction, amount, commission, stampTax, transferFee) {
    const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(userId);
    if (!funds) return;

    let newTotal = funds.total_balance;
    let newAvailable = funds.available_balance;
    let newFrozen = funds.frozen_balance;

    if (direction === 'buy') {
      const totalCost = amount + commission + transferFee;
      newFrozen -= totalCost;
      newTotal -= totalCost;
    } else {
      const totalIncome = amount - commission - stampTax - transferFee;
      newAvailable += totalIncome;
      newTotal += totalIncome;
    }

    db.prepare(`
      UPDATE funds 
      SET total_balance = ?, available_balance = ?, frozen_balance = ?, updated_at = ?
      WHERE user_id = ?
    `).run(newTotal, newAvailable, newFrozen, Date.now(), userId);
  }

  updateUserPosition(userId, securityCode, direction, quantity, price) {
    const existing = db.prepare(
      'SELECT * FROM positions WHERE user_id = ? AND security_code = ?'
    ).get(userId, securityCode);

    if (direction === 'buy') {
      if (existing) {
        const newTotalQty = existing.total_quantity + quantity;
        const newAvgCost = (
          (existing.avg_cost_price * existing.total_quantity) + (price * quantity)
        ) / newTotalQty;
        const newAvailableQty = existing.available_quantity + quantity;

        db.prepare(`
          UPDATE positions 
          SET total_quantity = ?, available_quantity = ?, avg_cost_price = ?, updated_at = ?
          WHERE user_id = ? AND security_code = ?
        `).run(newTotalQty, newAvailableQty, newAvgCost, Date.now(), userId, securityCode);
      } else {
        db.prepare(`
          INSERT INTO positions (id, user_id, security_code, total_quantity, available_quantity, avg_cost_price, current_price)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), userId, securityCode, quantity, quantity, price, price);
      }
    } else {
      if (existing) {
        const newTotalQty = existing.total_quantity - quantity;
        const newAvailableQty = existing.available_quantity - quantity;

        if (newTotalQty <= 0) {
          db.prepare('DELETE FROM positions WHERE user_id = ? AND security_code = ?').run(userId, securityCode);
        } else {
          db.prepare(`
            UPDATE positions 
            SET total_quantity = ?, available_quantity = ?, updated_at = ?
            WHERE user_id = ? AND security_code = ?
          `).run(newTotalQty, newAvailableQty, Date.now(), userId, securityCode);
        }
      }
    }
  }

  cancelOrder(orderId, operator = null) {
    const order = db.prepare(
      'SELECT id, status, direction, quantity, filled_quantity, user_id, price, security_code FROM orders WHERE id = ?'
    ).get(orderId);

    if (!order) throw new Error('订单不存在');

    if (!['accepted', 'partially_filled'].includes(order.status)) {
      throw new Error('订单状态不可撤销');
    }

    this.removeFromOrderBook(orderId);

    const unfilledQty = order.quantity - order.filled_quantity;
    if (unfilledQty > 0) {
      if (order.direction === 'buy') {
        const frozenAmount = order.price * unfilledQty;
        const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(order.user_id);
        if (funds) {
          db.prepare(`
            UPDATE funds 
            SET available_balance = available_balance + ?, frozen_balance = frozen_balance - ?, updated_at = ?
            WHERE user_id = ?
          `).run(frozenAmount, frozenAmount, Date.now(), order.user_id);
        }
      } else {
        const position = db.prepare(
          'SELECT * FROM positions WHERE user_id = ? AND security_code = ?'
        ).get(order.user_id, order.security_code);
        if (position) {
          db.prepare(`
            UPDATE positions 
            SET available_quantity = available_quantity + ?, frozen_quantity = frozen_quantity - ?, updated_at = ?
            WHERE user_id = ? AND security_code = ?
          `).run(unfilledQty, unfilledQty, Date.now(), order.user_id, order.security_code);
        }
      }
    }

    OrderStateMachine.transition(orderId, 'cancelled', '用户撤销', operator);

    return true;
  }

  getOrderBook(securityCode) {
    const buyOrders = this.orderBook.buy.filter(o => o.security_code === securityCode);
    const sellOrders = this.orderBook.sell.filter(o => o.security_code === securityCode);

    return {
      buy: buyOrders.slice(0, 10),
      sell: sellOrders.slice(0, 10)
    };
  }
}

module.exports = new MatchingEngine();
