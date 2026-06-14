const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateFakeBlockchain(affairId) {
  const hash = crypto.createHash('sha256').update(String(affairId) + Date.now()).digest('hex');
  const txHash = '0x' + hash;
  const blockHeight = 100000 + Math.floor(Math.random() * 1000);
  return { txHash, blockHeight };
}

function parseJSONFields(affair) {
  if (!affair) return affair;
  try {
    if (affair.content && affair.content.startsWith('{')) {
      affair.content = JSON.parse(affair.content);
    }
  } catch (e) {}
  return affair;
}

router.get('/affairs', (req, res) => {
  try {
    const type = req.query.type;
    const status = req.query.status;

    let sql = 'SELECT * FROM village_affairs WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const affairs = db.prepare(sql).all(...params).map(parseJSONFields);

    res.json(affairs);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/affairs', authMiddleware, (req, res) => {
  try {
    const { type, title, content, status = 'draft', publisher } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: '类型和标题不能为空', code: 400 });
    }

    const result = db.prepare(
      `INSERT INTO village_affairs (type, title, content, status, publisher)
       VALUES (?, ?, ?, ?, ?)`
    ).run(type, title, content || null, status, publisher || null);

    if (status === 'published') {
      const { txHash, blockHeight } = generateFakeBlockchain(result.lastInsertRowid);
      const contentObj = typeof content === 'object' ? JSON.stringify(content) : JSON.stringify({ text: content });
      db.prepare(
        `INSERT INTO village_blockchain (type, title, content, tx_hash, block_height)
         VALUES (?, ?, ?, ?, ?)`
      ).run(type, title, contentObj, txHash, blockHeight);
    }

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.put('/affairs/:id', authMiddleware, (req, res) => {
  try {
    const { type, title, content, status, publisher } = req.body;
    const affair = db.prepare('SELECT * FROM village_affairs WHERE id = ?').get(req.params.id);
    if (!affair) {
      return res.status(404).json({ error: '村务信息不存在', code: 404 });
    }

    const oldStatus = affair.status;

    db.prepare(
      `UPDATE village_affairs SET type = COALESCE(?, type), title = COALESCE(?, title),
       content = COALESCE(?, content), status = COALESCE(?, status),
       publisher = COALESCE(?, publisher), updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      type || null, title || null, content || null,
      status || null, publisher || null,
      req.params.id
    );

    if (status === 'published' && oldStatus !== 'published') {
      const { txHash, blockHeight } = generateFakeBlockchain(req.params.id);
      const finalTitle = title || affair.title;
      const finalType = type || affair.type;
      const finalContent = typeof content === 'object' ? JSON.stringify(content) : JSON.stringify({ text: content || affair.content });
      db.prepare(
        `INSERT INTO village_blockchain (type, title, content, tx_hash, block_height)
         VALUES (?, ?, ?, ?, ?)`
      ).run(finalType, finalTitle, finalContent, txHash, blockHeight);
    }

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/blockchain/:id', (req, res) => {
  try {
    const evidence = db.prepare(
      `SELECT vb.*, va.id as affair_id, va.status as affair_status
       FROM village_blockchain vb
       LEFT JOIN village_affairs va ON vb.title = va.title
       WHERE vb.id = ?`
    ).get(req.params.id);

    if (!evidence) {
      return res.status(404).json({ error: '区块链存证信息不存在', code: 404 });
    }

    parseJSONFields(evidence);
    res.json(evidence);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

function verifyBlockchainEvidence(req, res) {
  try {
    const tx_hash = req.body.tx_hash || req.body.txHash;
    if (!tx_hash) {
      return res.status(400).json({ error: '交易哈希不能为空', code: 400 });
    }

    const evidence = db.prepare('SELECT * FROM village_blockchain WHERE tx_hash = ?').get(tx_hash);
    if (!evidence) {
      return res.json({ verified: false, message: '该哈希未在链上找到对应的存证信息' });
    }

    res.json({
      verified: true,
      message: '存证信息验证成功，内容未被篡改',
      evidence: {
        id: evidence.id,
        type: evidence.type,
        title: evidence.title,
        tx_hash: evidence.tx_hash,
        block_height: evidence.block_height,
        created_at: evidence.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
}

router.post('/blockchain/verify', verifyBlockchainEvidence);
router.post('/verify', verifyBlockchainEvidence);

module.exports = router;
