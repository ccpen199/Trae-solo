const sm2 = require('sm-crypto').sm2;
const sm4 = require('sm-crypto').sm4;
const sm3 = require('sm-crypto').sm3;

const generateSm2KeyPair = () => {
  const keypair = sm2.generateKeyPairHex();
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
  };
};

const sm2Encrypt = (data, publicKey) => {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  const cipherMode = 1;
  return sm2.doEncrypt(data, publicKey, cipherMode);
};

const sm2Decrypt = (encryptData, privateKey) => {
  const cipherMode = 1;
  const decrypted = sm2.doDecrypt(encryptData, privateKey, cipherMode);
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

const sm2Sign = (data, privateKey) => {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  return sm2.doSignature(data, privateKey, { hash: true, der: true });
};

const sm2Verify = (data, sign, publicKey) => {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  return sm2.doVerifySignature(data, sign, publicKey, { hash: true, der: true });
};

const sm4Key = '0123456789abcdeffedcba9876543210';

const sm4Encrypt = (data, key = sm4Key) => {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  return sm4.encrypt(data, key);
};

const sm4Decrypt = (encryptData, key = sm4Key) => {
  const decrypted = sm4.decrypt(encryptData, key);
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

const sm3Hash = (data) => {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  return sm3(data);
};

const sensitiveDataEncrypt = (data) => {
  if (typeof data === 'object') {
    const encrypted = { ...data };
    ['id_card', 'id_card_no', 'phone', 'bank_card', 'address'].forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = sm4Encrypt(encrypted[field]);
        encrypted[`_${field}_encrypted`] = true;
      }
    });
    return encrypted;
  }
  return sm4Encrypt(data);
};

const sensitiveDataDecrypt = (data) => {
  if (typeof data === 'object') {
    const decrypted = { ...data };
    ['id_card', 'id_card_no', 'phone', 'bank_card', 'address'].forEach(field => {
      if (decrypted[`_${field}_encrypted`] && decrypted[field]) {
        decrypted[field] = sm4Decrypt(decrypted[field]);
        delete decrypted[`_${field}_encrypted`];
      }
    });
    return decrypted;
  }
  return sm4Decrypt(data);
};

const maskSensitiveData = (data) => {
  if (typeof data === 'object') {
    const masked = { ...data };
    if (masked.phone) {
      masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    if (masked.id_card_no) {
      masked.id_card_no = masked.id_card_no.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
    }
    if (masked.id_card) {
      masked.id_card = masked.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
    }
    return masked;
  }
  return data;
};

module.exports = {
  generateSm2KeyPair,
  sm2Encrypt,
  sm2Decrypt,
  sm2Sign,
  sm2Verify,
  sm4Encrypt,
  sm4Decrypt,
  sm3Hash,
  sensitiveDataEncrypt,
  sensitiveDataDecrypt,
  maskSensitiveData,
};
