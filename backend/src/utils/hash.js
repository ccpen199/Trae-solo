const crypto = require('crypto');

function calculateHash(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

function calculateBlockHash(parcelId, eventType, location, timestamp, previousHash) {
  const data = `${parcelId}|${eventType}|${location}|${timestamp}|${previousHash}`;
  return calculateHash(data);
}

module.exports = { calculateHash, calculateBlockHash };
