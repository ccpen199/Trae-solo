const CryptoJS = require('crypto-js');
const { getDb, saveDb } = require('../database');

function generateHash(data, previousHash) {
  const hashInput = JSON.stringify(data) + previousHash + process.env.HASH_CHAIN_SECRET;
  return CryptoJS.SHA256(hashInput).toString(CryptoJS.enc.Hex);
}

function getLastHash() {
  const sql = getDb();
  const result = sql.exec('SELECT hash FROM hash_chain ORDER BY id DESC LIMIT 1');
  
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return '0';
}

function addHashRecord(recordType, recordId, data) {
  const sql = getDb();
  const lastHash = getLastHash();
  const hash = generateHash(data, lastHash);
  
  const id = `hc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sql.run(`
    INSERT INTO hash_chain (id, record_type, record_id, hash, previous_hash)
    VALUES (?, ?, ?, ?, ?)
  `, [id, recordType, recordId, hash, lastHash]);
  
  saveDb();
  return hash;
}

function verifyChain() {
  const sql = getDb();
  const result = sql.exec('SELECT id, record_type, record_id, hash, previous_hash FROM hash_chain ORDER BY id ASC');
  
  if (result.length === 0 || result[0].values.length === 0) {
    return { valid: true, message: 'Hash chain is empty' };
  }
  
  const records = result[0].values;
  let previousHash = '0';
  
  for (const record of records) {
    const [id, recordType, recordId, currentHash, storedPreviousHash] = record;
    
    if (storedPreviousHash !== previousHash) {
      return { 
        valid: false, 
        message: `Hash chain broken at record ${id}. Previous hash mismatch.` 
      };
    }
    
    const data = getRecordData(recordType, recordId);
    const expectedHash = generateHash(data, previousHash);
    
    if (expectedHash !== currentHash) {
      return { 
        valid: false, 
        message: `Hash chain broken at record ${id}. Hash verification failed.` 
      };
    }
    
    previousHash = currentHash;
  }
  
  return { valid: true, message: 'Hash chain is valid' };
}

function getRecordData(recordType, recordId) {
  const sql = getDb();
  let query = '';
  let params = [recordId];
  
  switch (recordType) {
    case 'charging_session':
      query = 'SELECT * FROM charging_sessions WHERE id = ?';
      break;
    case 'payment':
      query = 'SELECT * FROM payments WHERE id = ?';
      break;
    case 'settlement':
      query = 'SELECT * FROM settlements WHERE id = ?';
      break;
    case 'charging_record':
      query = 'SELECT * FROM charging_records WHERE id = ?';
      break;
    default:
      return {};
  }
  
  const result = sql.exec(query, params);
  if (result.length > 0 && result[0].values.length > 0) {
    const columns = result[0].columns;
    const values = result[0].values[0];
    const data = {};
    columns.forEach((col, idx) => {
      data[col] = values[idx];
    });
    return data;
  }
  return {};
}

module.exports = {
  addHashRecord,
  verifyChain,
  getLastHash
};
