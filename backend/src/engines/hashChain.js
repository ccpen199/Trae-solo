const crypto = require('crypto');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class HashChainEngine {
  constructor() {
    this.ALGORITHM = 'sha256';
  }

  generateHash(data) {
    const hash = crypto.createHash(this.ALGORITHM);
    hash.update(JSON.stringify(data, Object.keys(data).sort()));
    return hash.digest('hex');
  }

  generateMerkleRoot(hashes) {
    if (hashes.length === 0) {
      return this.generateHash('empty');
    }

    let tempHashes = [...hashes];

    while (tempHashes.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < tempHashes.length; i += 2) {
        const left = tempHashes[i];
        const right = tempHashes[i + 1] || tempHashes[i];
        const combined = this.generateHash(left + right);
        nextLevel.push(combined);
      }
      tempHashes = nextLevel;
    }

    return tempHashes[0];
  }

  async getLastBlock() {
    return await db.get(
      'SELECT * FROM hash_chains ORDER BY block_height DESC LIMIT 1'
    );
  }

  async createBlock(transactionIds, blockType = 'transaction') {
    const lastBlock = await this.getLastBlock();
    const newHeight = lastBlock ? lastBlock.block_height + 1 : 0;
    const previousHash = lastBlock ? lastBlock.current_hash : '0';

    const transactionHashes = [];
    for (const txId of transactionIds) {
      const tx = await db.get(
        'SELECT * FROM transactions WHERE id = ?',
        [txId]
      );
      if (tx) {
        transactionHashes.push(this.generateHash(tx));
      }
    }

    const merkleRoot = this.generateMerkleRoot(transactionHashes);
    const blockData = {
      height: newHeight,
      previousHash,
      merkleRoot,
      transactionIds: JSON.stringify(transactionIds),
      timestamp: new Date().toISOString()
    };

    const currentHash = this.generateHash(blockData);
    const blockId = uuidv4();

    await db.run(
      `INSERT INTO hash_chains (
        id, block_height, previous_hash, current_hash, merkle_root, transaction_ids, block_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        blockId,
        newHeight,
        previousHash,
        currentHash,
        merkleRoot,
        JSON.stringify(transactionIds),
        blockType
      ]
    );

    return {
      blockId,
      height: newHeight,
      previousHash,
      currentHash,
      merkleRoot,
      transactionIds,
      timestamp: blockData.timestamp
    };
  }

  async verifyBlock(blockHeight) {
    const block = await db.get(
      'SELECT * FROM hash_chains WHERE block_height = ?',
      [blockHeight]
    );

    if (!block) {
      return { valid: false, reason: '区块不存在' };
    }

    const blockData = {
      height: block.block_height,
      previousHash: block.previous_hash,
      merkleRoot: block.merkle_root,
      transactionIds: block.transaction_ids,
      timestamp: block.timestamp
    };

    const calculatedHash = this.generateHash(blockData);
    if (calculatedHash !== block.current_hash) {
      return { 
        valid: false, 
        reason: '区块哈希验证失败: 数据可能被篡改',
        expected: block.current_hash,
        calculated: calculatedHash
      };
    }

    if (block.block_height > 0) {
      const previousBlock = await db.get(
        'SELECT * FROM hash_chains WHERE block_height = ?',
        [block.block_height - 1]
      );

      if (previousBlock && previousBlock.current_hash !== block.previous_hash) {
        return {
          valid: false,
          reason: '前区块哈希不匹配: 可能存在链式篡改',
          expectedPrevious: previousBlock.current_hash,
          blockPrevious: block.previous_hash
        };
      }
    }

    return { valid: true, block, verifiedAt: new Date().toISOString() };
  }

  async verifyChain(startHeight = 0, endHeight = null) {
    const blocks = await db.all(
      `SELECT * FROM hash_chains 
       WHERE block_height >= ? 
       ${endHeight !== null ? 'AND block_height <= ?' : ''}
       ORDER BY block_height`,
      endHeight !== null ? [startHeight, endHeight] : [startHeight]
    );

    if (blocks.length === 0) {
      return { valid: true, message: '没有区块需要验证', blocksVerified: 0 };
    }

    const results = [];
    let allValid = true;

    for (const block of blocks) {
      const verification = await this.verifyBlock(block.block_height);
      results.push(verification);
      if (!verification.valid) {
        allValid = false;
      }
    }

    return {
      valid: allValid,
      blocksVerified: blocks.length,
      validBlocks: results.filter(r => r.valid).length,
      invalidBlocks: results.filter(r => !r.valid).length,
      details: results,
      verifiedAt: new Date().toISOString()
    };
  }

  async traceTransaction(transactionId) {
    const blocks = await db.all(
      `SELECT * FROM hash_chains 
       WHERE json_extract(transaction_ids, '$[*]') LIKE ?
       ORDER BY block_height`,
      [`%${transactionId}%`]
    );

    const blocksContainingTx = [];
    for (const block of blocks) {
      const txIds = JSON.parse(block.transaction_ids);
      if (txIds.includes(transactionId)) {
        blocksContainingTx.push(block);
      }
    }

    if (blocksContainingTx.length === 0) {
      return { found: false, message: '交易未在哈希链中找到' };
    }

    const transaction = await db.get(
      `SELECT t.*, 
              fa.account_number as from_account,
              ta.account_number as to_account,
              fu.username as from_username,
              fu.real_name as from_real_name,
              tu.username as to_username,
              tu.real_name as to_real_name
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       LEFT JOIN users fu ON fa.user_id = fu.id
       LEFT JOIN users tu ON ta.user_id = tu.id
       WHERE t.id = ?`,
      [transactionId]
    );

    const ledgerEntries = await db.all(
      `SELECT le.*, a.account_number, u.username, u.real_name
       FROM ledger_entries le
       JOIN accounts a ON le.account_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE le.transaction_id = ?
       ORDER BY le.created_at`,
      [transactionId]
    );

    return {
      found: true,
      transaction,
      ledgerEntries,
      blocks: blocksContainingTx,
      canBeTraced: true
    };
  }

  async traceFundPath(accountId, startDate = null, endDate = null) {
    let query = `
      SELECT DISTINCT 
        t.id as transaction_id,
        t.transaction_no,
        t.amount,
        t.transaction_type,
        t.status,
        t.created_at,
        fa.account_number as from_account,
        ta.account_number as to_account,
        fu.id as from_user_id,
        fu.username as from_username,
        tu.id as to_user_id,
        tu.username as to_username
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN users fu ON fa.user_id = fu.id
      LEFT JOIN users tu ON ta.user_id = tu.id
      WHERE t.from_account_id = ? OR t.to_account_id = ?
    `;

    const params = [accountId, accountId];

    if (startDate) {
      query += ' AND date(t.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date(t.created_at) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY t.created_at';

    const transactions = await db.all(query, params);

    const path = [];
    for (const tx of transactions) {
      const direction = tx.from_account === 
        (await db.get('SELECT account_number FROM accounts WHERE id = ?', [accountId]))?.account_number 
        ? 'outgoing' : 'incoming';
      
      const verification = await this.traceTransaction(tx.transaction_id);
      
      path.push({
        ...tx,
        direction,
        hashChainVerified: verification.found,
        blocks: verification.blocks
      });
    }

    return {
      accountId,
      startDate,
      endDate,
      transactionCount: path.length,
      path,
      tracedAt: new Date().toISOString()
    };
  }

  async createAuditLog(auditData) {
    const auditId = uuidv4();
    const auditHash = this.generateHash({
      ...auditData,
      timestamp: new Date().toISOString()
    });

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, target_type, target_id, detail
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        auditData.userId || null,
        'audit',
        auditData.targetType || null,
        auditData.targetId || null,
        JSON.stringify({ ...auditData, hash: auditHash })
      ]
    );

    return { auditId, hash: auditHash };
  }

  async getFullAuditReport(startDate = null, endDate = null) {
    const chainVerification = await this.verifyChain();

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        COUNT(DISTINCT from_account_id) as active_senders,
        COUNT(DISTINCT to_account_id) as active_receivers
      FROM transactions 
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND date(created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date(created_at) <= ?';
      params.push(endDate);
    }

    const transactionStats = await db.get(query, params);

    const riskStats = await db.get(
      `SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN is_handled = 0 THEN 1 ELSE 0 END) as pending_alerts,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk_alerts,
        SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical_alerts
       FROM risk_events
       WHERE 1=1
       ${startDate ? 'AND date(created_at) >= ?' : ''}
       ${endDate ? 'AND date(created_at) <= ?' : ''}`,
      [startDate, endDate].filter(Boolean)
    );

    return {
      period: { startDate, endDate },
      chainValidity: chainVerification,
      transactionStats: {
        totalTransactions: transactionStats.total_transactions || 0,
        totalVolume: transactionStats.total_volume || 0,
        activeSenders: transactionStats.active_senders || 0,
        activeReceivers: transactionStats.active_receivers || 0
      },
      riskStats: {
        totalAlerts: riskStats.total_alerts || 0,
        pendingAlerts: riskStats.pending_alerts || 0,
        highRiskAlerts: riskStats.high_risk_alerts || 0,
        criticalAlerts: riskStats.critical_alerts || 0
      },
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new HashChainEngine();
