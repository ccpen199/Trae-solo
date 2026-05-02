const crypto = require('crypto');

class BidSecurity {
  constructor(secretKey) {
    this.secretKey = secretKey || process.env.ENCRYPTION_KEY;
    this.algorithm = 'aes-256-gcm';
  }

  generateSignature(data, timestamp = Date.now()) {
    const stringToSign = this.normalizeData(data) + timestamp + this.secretKey;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(stringToSign)
      .digest('hex');
    return {
      signature,
      timestamp,
      algorithm: 'HMAC-SHA256'
    };
  }

  verifySignature(data, signature, timestamp) {
    const { signature: expectedSignature } = this.generateSignature(data, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey.substring(0, 32), iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      tag,
      algorithm: this.algorithm
    };
  }

  decrypt(encryptedData, iv, tag) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey.substring(0, 32),
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  hash(data) {
    return crypto.createHash('sha256').update(this.normalizeData(data)).digest('hex');
  }

  generateChainHash(currentData, previousHash) {
    const combined = this.normalizeData(currentData) + (previousHash || '');
    return this.hash(combined);
  }

  normalizeData(data) {
    if (typeof data === 'string') return data;
    if (data === null || data === undefined) return '';
    const sorted = {};
    Object.keys(data).sort().forEach(key => {
      sorted[key] = data[key];
    });
    return JSON.stringify(sorted);
  }

  generateOperationSignature(operation) {
    const { userId, operationType, resourceId, data, timestamp } = operation;
    const signatureData = {
      userId,
      operationType,
      resourceId,
      dataHash: this.hash(data),
      timestamp
    };
    return this.generateSignature(signatureData, timestamp);
  }

  generateBidSignature(bidData) {
    const { projectId, bidderId, amount, bidTime } = bidData;
    const signatureData = {
      projectId,
      bidderId,
      amount: String(amount),
      bidTime: bidTime || Date.now()
    };
    return this.generateSignature(signatureData, signatureData.bidTime);
  }

  generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateProjectNumber(prefix = 'XM') {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}${dateStr}-${random.slice(0, 4)}`;
  }

  generateRegistrationNumber() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `REG${timestamp.slice(-8)}${random}`;
  }

  generateBidNumber() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `BID${timestamp.slice(-8)}${random}`;
  }
}

module.exports = new BidSecurity();
