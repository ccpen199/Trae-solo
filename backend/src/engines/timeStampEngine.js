const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class TimeStampEngine {
  constructor() {
    this.name = 'Time-Stamp Engine';
    this.version = '1.0.0';
  }

  generateTimestamp(data, extraInfo = {}) {
    const timestamp = new Date().toISOString();
    const combinedData = {
      data,
      timestamp,
      nonce: crypto.randomBytes(16).toString('hex'),
      ...extraInfo
    };
    
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(combinedData))
      .digest('hex');
    
    const timeToken = this._generateTimeToken(combinedData, hash);
    
    return {
      success: true,
      timestamp,
      hash,
      timeToken,
      engineInfo: {
        name: this.name,
        version: this.version
      }
    };
  }

  verifyTimestamp(hash, timeToken) {
    try {
      const tokenData = this._decodeTimeToken(timeToken);
      const reHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(tokenData.combinedData))
        .digest('hex');
      
      return {
        success: reHash === hash,
        verifiedAt: new Date().toISOString(),
        originalTimestamp: tokenData.combinedData.timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  _generateTimeToken(combinedData, hash) {
    const tokenPayload = {
      combinedData,
      hash,
      issuedAt: new Date().toISOString(),
      tokenId: uuidv4()
    };
    
    const signature = crypto
      .createHmac('sha256', 'timestamp-secret-key')
      .update(JSON.stringify(tokenPayload))
      .digest('hex');
    
    return Buffer.from(JSON.stringify({
      payload: tokenPayload,
      signature
    })).toString('base64');
  }

  _decodeTimeToken(timeToken) {
    const decoded = Buffer.from(timeToken, 'base64').toString();
    const token = JSON.parse(decoded);
    
    const expectedSignature = crypto
      .createHmac('sha256', 'timestamp-secret-key')
      .update(JSON.stringify(token.payload))
      .digest('hex');
    
    if (expectedSignature !== token.signature) {
      throw new Error('时间戳令牌签名验证失败');
    }
    
    return token.payload;
  }

  lockInitialState(contractId, fileHash, initiatorId) {
    const lockData = {
      contractId,
      fileHash,
      initiatorId,
      lockType: 'initial_state_lock',
      operation: 'document_uploaded'
    };
    
    return this.generateTimestamp(lockData, {
      operation: '状态锁定',
      action: '文档上传完成，锁定初始状态'
    });
  }
}

module.exports = new TimeStampEngine();
