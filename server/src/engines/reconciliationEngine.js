const { get, run, all, transaction } = require('../database');

const DIFF_TYPES = {
  CREDIT_LIMIT: 'credit_limit',
  EXCHANGE_RATE: 'exchange_rate',
  INVOICE: 'invoice',
  CALLBACK: 'callback',
  RECONCILIATION: 'reconciliation'
};

const RECON_TYPES = {
  BANK: 'bank',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier'
};

const TOLERANCE_THRESHOLD = 0.01;

const createReconciliationRecord = async (reconData) => {
  const reconNo = `RECON${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const diffAmount = Math.abs(reconData.expectedAmount - reconData.actualAmount);
  
  let reconStatus = 'pending';
  if (diffAmount <= TOLERANCE_THRESHOLD) {
    reconStatus = 'matched';
  } else {
    reconStatus = 'unmatched';
  }

  const result = await run(`
    INSERT INTO reconciliation_records 
    (recon_no, bill_id, recon_type, expected_amount, actual_amount, 
     diff_amount, recon_status, operator_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    reconNo,
    reconData.billId || null,
    reconData.reconType,
    reconData.expectedAmount,
    reconData.actualAmount,
    diffAmount,
    reconStatus,
    reconData.operatorId || null
  ]);

  if (reconStatus === 'unmatched') {
    await createDifferenceOrder({
      billId: reconData.billId,
      diffType: DIFF_TYPES.RECONCILIATION,
      diffDescription: `对账差异: 预期金额 ${reconData.expectedAmount}, 实际金额 ${reconData.actualAmount}, 差异 ${diffAmount}`,
      operatorId: reconData.operatorId
    });
  }

  return {
    id: result.lastID,
    reconNo,
    reconStatus,
    diffAmount
  };
};

const createDifferenceOrder = async (diffData) => {
  const diffNo = `DIFF${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  const result = await run(`
    INSERT INTO difference_orders 
    (diff_no, bill_id, diff_type, diff_description, original_status, 
     current_status, operator_id, created_at)
    VALUES (?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP)
  `, [
    diffNo,
    diffData.billId,
    diffData.diffType,
    diffData.diffDescription,
    diffData.originalStatus || null,
    diffData.operatorId || null
  ]);

  if (diffData.billId) {
    const bill = await get(`SELECT status FROM bills WHERE id = ?`, [diffData.billId]);
    
    await run(`
      UPDATE bills 
      SET status = 'difference', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [diffData.billId]);

    await run(`
      INSERT INTO bill_status_history 
      (bill_id, from_status, to_status, action, operator_id, comment, created_at)
      VALUES (?, ?, 'difference', '转入差异单', ?, ?, CURRENT_TIMESTAMP)
    `, [diffData.billId, bill?.status, diffData.operatorId, diffData.diffDescription]);
  }

  return {
    id: result.lastID,
    diffNo
  };
};

const correctReconciliation = async (reconId, correctedAmount, correctionComment, operatorId) => {
  return transaction(async () => {
    const reconRecord = await get(
      `SELECT * FROM reconciliation_records WHERE id = ?`,
      [reconId]
    );

    if (!reconRecord) {
      throw new Error(`对账记录 ${reconId} 不存在`);
    }

    const newDiffAmount = Math.abs(reconRecord.expected_amount - correctedAmount);
    const newStatus = newDiffAmount <= TOLERANCE_THRESHOLD ? 'corrected' : 'unmatched';

    await run(`
      UPDATE reconciliation_records 
      SET corrected_amount = ?, 
          correction_comment = ?,
          recon_status = ?,
          operator_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [correctedAmount, correctionComment, newStatus, operatorId, reconId]);

    if (reconRecord.bill_id) {
      const diffOrders = await all(
        `SELECT id FROM difference_orders WHERE bill_id = ? AND current_status = 'open'`,
        [reconRecord.bill_id]
      );

      for (const diffOrder of diffOrders) {
        await run(`
          UPDATE difference_orders 
          SET current_status = 'resolved',
              resolved_at = CURRENT_TIMESTAMP,
              resolution_comment = ?,
              operator_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [correctionComment, operatorId, diffOrder.id]);
      }

      const allDiffResolved = await get(
        `SELECT COUNT(*) as count FROM difference_orders WHERE bill_id = ? AND current_status IN ('open', 'processing')`,
        [reconRecord.bill_id]
      );

      if (allDiffResolved.count === 0) {
        const originalStatus = await get(
          `SELECT original_status FROM difference_orders WHERE bill_id = ? ORDER BY created_at DESC LIMIT 1`,
          [reconRecord.bill_id]
        );

        const nextStatus = originalStatus?.original_status || 'pending_input';
        
        await run(`
          UPDATE bills 
          SET status = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [nextStatus, reconRecord.bill_id]);

        await run(`
          INSERT INTO bill_status_history 
          (bill_id, from_status, to_status, action, operator_id, comment, created_at)
          VALUES (?, 'difference', ?, '差异已解决', ?, ?, CURRENT_TIMESTAMP)
        `, [reconRecord.bill_id, nextStatus, operatorId, correctionComment]);
      }
    }

    return {
      reconId,
      correctedAmount,
      newStatus,
      resolvedAt: new Date().toISOString()
    };
  });
};

const checkAndHandleAnomalies = async (checkData) => {
  const anomalies = [];

  if (checkData.creditLimitCheck) {
    const { companyName, amount, billId } = checkData.creditLimitCheck;
    const creditLimit = await get(
      `SELECT * FROM credit_limits WHERE company_name = ?`,
      [companyName]
    );

    if (creditLimit) {
      const newUsed = creditLimit.used_limit + amount;
      if (newUsed > creditLimit.total_limit) {
        anomalies.push({
          type: DIFF_TYPES.CREDIT_LIMIT,
          description: `授信额度超限: 总额度 ${creditLimit.total_limit}, 已使用 ${creditLimit.used_limit}, 申请 ${amount}`,
          billId
        });
      }
    }
  }

  if (checkData.reconciliationCheck) {
    const { expectedAmount, actualAmount, billId, reconType } = checkData.reconciliationCheck;
    const diffAmount = Math.abs(expectedAmount - actualAmount);
    
    if (diffAmount > TOLERANCE_THRESHOLD) {
      anomalies.push({
        type: DIFF_TYPES.RECONCILIATION,
        description: `对账差异: 预期 ${expectedAmount}, 实际 ${actualAmount}, 差异 ${diffAmount}`,
        billId,
        reconType
      });
    }
  }

  if (checkData.callbackCheck) {
    const { callbackStatus, expectedStatus, billId } = checkData.callbackCheck;
    if (callbackStatus !== expectedStatus) {
      anomalies.push({
        type: DIFF_TYPES.CALLBACK,
        description: `回调状态异常: 预期 ${expectedStatus}, 实际 ${callbackStatus}`,
        billId
      });
    }
  }

  if (checkData.invoiceCheck) {
    const { invoiceAmount, billAmount, billId } = checkData.invoiceCheck;
    const diffAmount = Math.abs(invoiceAmount - billAmount);
    
    if (diffAmount > TOLERANCE_THRESHOLD) {
      anomalies.push({
        type: DIFF_TYPES.INVOICE,
        description: `发票金额差异: 票据金额 ${billAmount}, 发票金额 ${invoiceAmount}`,
        billId
      });
    }
  }

  if (checkData.exchangeRateCheck) {
    const { expectedRate, actualRate, billId, threshold = 0.01 } = checkData.exchangeRateCheck;
    const rateDiff = Math.abs(expectedRate - actualRate);
    
    if (rateDiff > threshold) {
      anomalies.push({
        type: DIFF_TYPES.EXCHANGE_RATE,
        description: `汇率差异: 预期汇率 ${expectedRate}, 实际汇率 ${actualRate}`,
        billId
      });
    }
  }

  for (const anomaly of anomalies) {
    await createDifferenceOrder({
      billId: anomaly.billId,
      diffType: anomaly.type,
      diffDescription: anomaly.description,
      operatorId: checkData.operatorId
    });
  }

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
    handledAt: new Date().toISOString()
  };
};

const getDifferenceOrders = async (filters = {}) => {
  let sql = `SELECT * FROM difference_orders WHERE 1=1`;
  const params = [];

  if (filters.billId) {
    sql += ` AND bill_id = ?`;
    params.push(filters.billId);
  }

  if (filters.currentStatus) {
    sql += ` AND current_status = ?`;
    params.push(filters.currentStatus);
  }

  if (filters.diffType) {
    sql += ` AND diff_type = ?`;
    params.push(filters.diffType);
  }

  sql += ` ORDER BY created_at DESC`;

  return await all(sql, params);
};

module.exports = {
  DIFF_TYPES,
  RECON_TYPES,
  TOLERANCE_THRESHOLD,
  createReconciliationRecord,
  createDifferenceOrder,
  correctReconciliation,
  checkAndHandleAnomalies,
  getDifferenceOrders
};
