const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ClearingSettlementEngine {
  calculateTradeFees(trade) {
    const amount = trade.price * trade.quantity;
    const commission = Math.max(5, amount * 0.0003);
    const stampTax = trade.direction === 'sell' ? amount * 0.001 : 0;
    const transferFee = Math.max(1, amount * 0.00002);

    return {
      commission,
      stampTax,
      transferFee,
      total: commission + stampTax + transferFee
    };
  }

  settleTrade(tradeId) {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);
    
    if (!trade || trade.status !== 'pending') {
      return null;
    }

    const settlementDate = moment().add(1, 'days').format('YYYY-MM-DD');
    const fees = this.calculateTradeFees(trade);

    db.prepare(`
      UPDATE trades 
      SET commission = ?, stamp_tax = ?, transfer_fee = ?, 
          settlement_date = ?, status = ?
      WHERE id = ?
    `).run(
      fees.commission, fees.stampTax, fees.transferFee,
      settlementDate, 'settled', tradeId
    );

    this.updatePositionPnL(trade.user_id, trade.security_code);

    return { ...trade, ...fees, settlementDate, status: 'settled' };
  }

  updatePositionPnL(userId, securityCode) {
    const position = db.prepare(
      'SELECT * FROM positions WHERE user_id = ? AND security_code = ?'
    ).get(userId, securityCode);

    const security = db.prepare(
      'SELECT current_price FROM securities WHERE code = ?'
    ).get(securityCode);

    if (!position || !security) return;

    const marketValue = position.total_quantity * security.current_price;
    const costValue = position.total_quantity * position.avg_cost_price;
    const profitLoss = marketValue - costValue;
    const profitLossRatio = costValue > 0 ? (profitLoss / costValue * 100) : 0;

    db.prepare(`
      UPDATE positions 
      SET current_price = ?, market_value = ?, profit_loss = ?, profit_loss_ratio = ?, updated_at = ?
      WHERE user_id = ? AND security_code = ?
    `).run(
      security.current_price, marketValue, profitLoss, profitLossRatio,
      Date.now(), userId, securityCode
    );
  }

  runDailySettlement(reportDate = null) {
    const date = reportDate || moment().format('YYYY-MM-DD');
    const investors = db.prepare(
      "SELECT id, username, name FROM users WHERE role = 'investor'"
    ).all();

    const reports = [];

    for (const investor of investors) {
      const report = this.generateSettlementReport(investor.id, date);
      reports.push(report);
    }

    this.updateAllPositionsPnL();

    return reports;
  }

  generateSettlementReport(userId, reportDate) {
    const existingReport = db.prepare(
      'SELECT * FROM settlement_reports WHERE user_id = ? AND report_date = ?'
    ).get(userId, reportDate);

    if (existingReport) {
      return existingReport;
    }

    const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(userId);
    
    if (!funds) {
      return null;
    }

    const startOfDay = moment(reportDate).startOf('day').valueOf();
    const endOfDay = moment(reportDate).endOf('day').valueOf();

    const trades = db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? AND created_at >= ? AND created_at <= ?
    `).all(userId, startOfDay, endOfDay);

    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalCommission = 0;
    let totalStampTax = 0;
    let totalTransferFee = 0;

    for (const trade of trades) {
      if (trade.direction === 'buy') {
        totalBuyAmount += trade.amount;
      } else {
        totalSellAmount += trade.amount;
      }
      totalCommission += trade.commission || 0;
      totalStampTax += trade.stamp_tax || 0;
      totalTransferFee += trade.transfer_fee || 0;
    }

    const positions = db.prepare(
      'SELECT profit_loss FROM positions WHERE user_id = ?'
    ).all(userId);

    const positionProfitLoss = positions.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

    const netProfitLoss = totalSellAmount - totalBuyAmount - totalCommission - totalStampTax - totalTransferFee + positionProfitLoss;

    const reportId = uuidv4();
    
    db.prepare(`
      INSERT INTO settlement_reports (
        id, report_date, user_id, opening_balance, closing_balance,
        total_buy_amount, total_sell_amount, total_commission,
        total_stamp_tax, total_transfer_fee, position_profit_loss, net_profit_loss, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId, reportDate, userId, funds.total_balance, funds.total_balance,
      totalBuyAmount, totalSellAmount, totalCommission,
      totalStampTax, totalTransferFee, positionProfitLoss, netProfitLoss, 'generated'
    );

    return db.prepare('SELECT * FROM settlement_reports WHERE id = ?').get(reportId);
  }

  updateAllPositionsPnL() {
    const positions = db.prepare('SELECT * FROM positions').all();

    for (const pos of positions) {
      this.updatePositionPnL(pos.user_id, pos.security_code);
    }
  }

  getSettlementReports(userId, startDate, endDate) {
    let query = 'SELECT * FROM settlement_reports WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND report_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND report_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY report_date DESC';

    return db.prepare(query).all(...params);
  }

  getSettlementReportDetails(reportId) {
    const report = db.prepare('SELECT * FROM settlement_reports WHERE id = ?').get(reportId);
    
    if (!report) {
      return null;
    }

    const user = db.prepare('SELECT username, name FROM users WHERE id = ?').get(report.user_id);
    const positions = db.prepare(
      'SELECT * FROM positions WHERE user_id = ?'
    ).all(report.user_id);

    const startOfDay = moment(report.report_date).startOf('day').valueOf();
    const endOfDay = moment(report.report_date).endOf('day').valueOf();

    const trades = db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      ORDER BY created_at
    `).all(report.user_id, startOfDay, endOfDay);

    return {
      report,
      user,
      positions,
      trades
    };
  }

  exportSettlementVoucher(reportId) {
    const details = this.getSettlementReportDetails(reportId);
    
    if (!details) {
      return null;
    }

    const voucherData = {
      voucherNo: `V${moment().format('YYYYMMDD')}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      voucherDate: details.report.report_date,
      user: {
        id: details.report.user_id,
        username: details.user.username,
        name: details.user.name
      },
      summary: {
        openingBalance: details.report.opening_balance,
        closingBalance: details.report.closing_balance,
        totalBuyAmount: details.report.total_buy_amount,
        totalSellAmount: details.report.total_sell_amount,
        totalCommission: details.report.total_commission,
        totalStampTax: details.report.total_stamp_tax,
        totalTransferFee: details.report.total_transfer_fee,
        positionProfitLoss: details.report.position_profit_loss,
        netProfitLoss: details.report.net_profit_loss
      },
      positions: details.positions.map(p => ({
        securityCode: p.security_code,
        totalQuantity: p.total_quantity,
        availableQuantity: p.available_quantity,
        avgCostPrice: p.avg_cost_price,
        currentPrice: p.current_price,
        marketValue: p.market_value,
        profitLoss: p.profit_loss
      })),
      trades: details.trades.map(t => ({
        tradeNo: t.trade_no,
        securityCode: t.security_code,
        direction: t.direction,
        price: t.price,
        quantity: t.quantity,
        amount: t.amount,
        commission: t.commission,
        stampTax: t.stamp_tax,
        transferFee: t.transfer_fee
      })),
      generatedAt: Date.now()
    };

    return voucherData;
  }
}

module.exports = new ClearingSettlementEngine();
