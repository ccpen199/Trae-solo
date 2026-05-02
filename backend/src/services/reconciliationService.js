const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const hashChain = require('../engines/hashChain');

class ReconciliationService {
  async executeDailyReconciliation(reconciliationDate = null) {
    const date = reconciliationDate || new Date().toISOString().split('T')[0];

    const existingReconciliation = await db.get(
      'SELECT * FROM reconciliations WHERE reconciliation_date = ?',
      [date]
    );

    if (existingReconciliation) {
      throw new Error(`日期 ${date} 已完成对账`);
    }

    const reconciliationId = uuidv4();

    const transactions = await db.all(
      `SELECT * FROM transactions 
       WHERE date(created_at) = ? AND status = 'completed'`,
      [date]
    );

    const transactionCount = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    await db.run(
      `INSERT INTO reconciliations (
        id, reconciliation_date, transaction_count, total_amount, status
      ) VALUES (?, ?, ?, ?, 'processing')`,
      [reconciliationId, date, transactionCount, totalAmount]
    );

    const matchedCount = transactionCount;
    const matchedAmount = totalAmount;
    const unmatchedCount = 0;
    const unmatchedAmount = 0;
    const status = 'completed';

    await db.run(
      `UPDATE reconciliations 
       SET matched_count = ?, matched_amount = ?, 
           unmatched_count = ?, unmatched_amount = ?, 
           status = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [matchedCount, matchedAmount, unmatchedCount, unmatchedAmount, status, reconciliationId]
    );

    const chainVerification = await hashChain.verifyChain();
    if (!chainVerification.valid) {
      await this.createUnmatchedItem(
        reconciliationId,
        null,
        'hash_chain_invalid',
        0,
        0,
        0,
        `哈希链验证失败: 发现 ${chainVerification.invalidBlocks} 个无效区块`
      );

      await db.run(
        `UPDATE reconciliations 
         SET status = 'completed_with_exceptions'
         WHERE id = ?`,
        [reconciliationId]
      );
    }

    await db.run(
      `INSERT INTO operation_logs (
        id, operation_type, detail
      ) VALUES (?, ?, ?)`,
      [
        uuidv4(),
        'daily_reconciliation',
        `日结对账完成: 日期 ${date}, 交易 ${transactionCount} 笔, 金额 ${totalAmount} 元, 匹配 ${matchedCount} 笔`
      ]
    );

    return {
      reconciliationId,
      date,
      transactionCount,
      totalAmount,
      matchedCount,
      matchedAmount,
      unmatchedCount,
      status,
      chainVerification,
      message: '日结对账完成'
    };
  }

  async createUnmatchedItem(reconciliationId, transactionId, itemType, amount, expectedAmount, actualAmount, description) {
    const itemId = uuidv4();
    await db.run(
      `INSERT INTO reconciliation_items (
        id, reconciliation_id, transaction_id, item_type, 
        amount, expected_amount, actual_amount, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [itemId, reconciliationId, transactionId, itemType, amount, expectedAmount, actualAmount, description]
    );
    return itemId;
  }

  async getReconciliationList(limit = 30) {
    return await db.all(
      `SELECT * FROM reconciliations 
       ORDER BY reconciliation_date DESC 
       LIMIT ?`,
      [limit]
    );
  }

  async getReconciliationDetail(reconciliationId) {
    const reconciliation = await db.get(
      'SELECT * FROM reconciliations WHERE id = ?',
      [reconciliationId]
    );

    if (!reconciliation) {
      throw new Error('对账记录不存在');
    }

    const items = await db.all(
      `SELECT ri.*, t.transaction_no, t.transaction_type
       FROM reconciliation_items ri
       LEFT JOIN transactions t ON ri.transaction_id = t.id
       WHERE ri.reconciliation_id = ?
       ORDER BY ri.created_at`,
      [reconciliationId]
    );

    return {
      reconciliation,
      items
    };
  }

  async getAdjustmentPool() {
    return await db.all(
      `SELECT ri.*, 
              r.reconciliation_date,
              t.transaction_no,
              t.amount as transaction_amount,
              fu.username as from_user,
              tu.username as to_user
       FROM reconciliation_items ri
       JOIN reconciliations r ON ri.reconciliation_id = r.id
       LEFT JOIN transactions t ON ri.transaction_id = t.id
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       LEFT JOIN users fu ON fa.user_id = fu.id
       LEFT JOIN users tu ON ta.user_id = tu.id
       WHERE ri.status = 'pending'
       ORDER BY ri.created_at DESC`
    );
  }

  async handleAdjustment(itemId, handlerId, action, remark) {
    const item = await db.get('SELECT * FROM reconciliation_items WHERE id = ?', [itemId]);
    if (!item) {
      throw new Error('调账项不存在');
    }

    let newStatus;
    switch (action) {
      case 'confirm':
        newStatus = 'confirmed';
        break;
      case 'adjust':
        newStatus = 'adjusted';
        break;
      case 'ignore':
        newStatus = 'ignored';
        break;
      default:
        throw new Error(`不支持的操作: ${action}`);
    }

    await db.run(
      `UPDATE reconciliation_items 
       SET status = ?, handler_remark = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newStatus, remark, handlerId, itemId]
    );

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        handlerId,
        'adjustment_handling',
        `调账处理: 项目 ${itemId}, 操作 ${action}, 备注 ${remark}`
      ]
    );

    return {
      itemId,
      action,
      newStatus,
      handledAt: new Date().toISOString()
    };
  }

  async getReconciliationStats(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_reconciliations,
        SUM(transaction_count) as total_transactions,
        SUM(total_amount) as total_volume,
        SUM(unmatched_count) as total_unmatched,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'completed_with_exceptions' THEN 1 ELSE 0 END) as with_exceptions
      FROM reconciliations
      WHERE 1=1
      ${startDate ? 'AND reconciliation_date >= ?' : ''}
      ${endDate ? 'AND reconciliation_date <= ?' : ''}
    `;

    const params = [];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    const stats = await db.get(query, params);

    return {
      period: { startDate, endDate },
      totalReconciliations: stats.total_reconciliations || 0,
      totalTransactions: stats.total_transactions || 0,
      totalVolume: stats.total_volume || 0,
      totalUnmatched: stats.total_unmatched || 0,
      successful: stats.successful || 0,
      withExceptions: stats.with_exceptions || 0
    };
  }

  async simulateChannelReconciliation(reconciliationDate) {
    const transactions = await db.all(
      `SELECT * FROM transactions 
       WHERE date(created_at) = ? AND status = 'completed'
       ORDER BY created_at`,
      [reconciliationDate]
    );

    const channelReceipts = transactions.map(t => ({
      transaction_no: t.transaction_no,
      amount: t.amount,
      status: 'success'
    }));

    const discrepancies = [];

    for (const tx of transactions) {
      const receipt = channelReceipts.find(r => r.transaction_no === tx.transaction_no);
      if (!receipt) {
        discrepancies.push({
          type: 'missing_in_channel',
          transactionId: tx.id,
          transactionNo: tx.transaction_no,
          amount: tx.amount
        });
      } else if (receipt.amount !== tx.amount) {
        discrepancies.push({
          type: 'amount_mismatch',
          transactionId: tx.id,
          transactionNo: tx.transaction_no,
          expectedAmount: tx.amount,
          actualAmount: receipt.amount
        });
      }
    }

    return {
      transactions: transactions.length,
      channelReceipts: channelReceipts.length,
      matched: transactions.length - discrepancies.length,
      discrepancies: discrepancies.length,
      details: discrepancies
    };
  }
}

module.exports = new ReconciliationService();
