const { sm4 } = require('sm-crypto');
const config = require('../config');

const SM4_KEY = config.sm4Key;

function encrypt(data) {
  try {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    return sm4.encrypt(data, SM4_KEY);
  } catch (e) {
    console.error('SM4 encrypt error:', e);
    return null;
  }
}

function decrypt(encrypted) {
  try {
    const decrypted = sm4.decrypt(encrypted, SM4_KEY);
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (e) {
    console.error('SM4 decrypt error:', e);
    return null;
  }
}

function encryptBuffer(buffer) {
  try {
    return Buffer.from(sm4.encrypt(buffer.toString('base64'), SM4_KEY));
  } catch (e) {
    console.error('SM4 encryptBuffer error:', e);
    return buffer;
  }
}

function decryptBuffer(encryptedBuffer) {
  try {
    const decrypted = sm4.decrypt(encryptedBuffer.toString(), SM4_KEY);
    return Buffer.from(decrypted, 'base64');
  } catch (e) {
    console.error('SM4 decryptBuffer error:', e);
    return encryptedBuffer;
  }
}

function encryptStreamMiddleware() {
  return (req, res, next) => {
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      if (req.headers['x-sm4-encrypt'] === 'true') {
        const encrypted = encrypt(data);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('X-Encrypted', 'sm4');
        return res.send(encrypted);
      }
      return originalJson(data);
    };

    next();
  };
}

function decryptRequestMiddleware() {
  return (req, res, next) => {
    if (req.headers['x-sm4-encrypt'] === 'true' && req.body && typeof req.body === 'string') {
      const decrypted = decrypt(req.body);
      if (decrypted) {
        req.body = decrypted;
      }
    }
    next();
  };
}

module.exports = {
  encrypt,
  decrypt,
  encryptBuffer,
  decryptBuffer,
  encryptStreamMiddleware,
  decryptRequestMiddleware
};
