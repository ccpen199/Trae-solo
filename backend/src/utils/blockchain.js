
const crypto = require('crypto');
const db = require('../database/db');

const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const storeOnBlockchain = async (contractType, referenceId, data) => {
  const hash = generateHash({ contractType, referenceId, data, timestamp: Date.now() });
  const blockNumber = Math.floor(Math.random() * 1000000) + 100000;
  const txnHash = '0x' + crypto.randomBytes(32).toString('hex');

  const stmt = db.prepare(`
    INSERT INTO blockchain_records (contract_type, reference_id, hash, block_number, txn_hash, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(contractType, referenceId, hash, blockNumber, txnHash, JSON.stringify(data));

  return { hash, blockNumber, txnHash, success: true };
};

module.exports = { generateHash, storeOnBlockchain };
