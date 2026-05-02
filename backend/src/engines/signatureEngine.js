const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class DigitalSignatureEngine {
  constructor() {
    this.name = 'Digital-Signature Engine';
    this.version = '1.0.0';
    this.certificateAuthority = {
      name: '电子签约系统证书机构',
      rootCertificate: this._generateRootCertificate()
    };
  }

  _generateRootCertificate() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    return {
      privateKey,
      publicKey,
      serialNumber: 'CA-' + uuidv4(),
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  generateKeyPair(userId) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: userId + '-secret-passphrase'
      }
    });
    
    return {
      privateKey,
      publicKey,
      keyId: uuidv4(),
      generatedAt: new Date().toISOString()
    };
  }

  signDocument(documentHash, privateKey, userId) {
    const sign = crypto.createSign('SHA256');
    sign.update(documentHash);
    sign.end();
    
    const signature = sign.sign(privateKey, 'hex');
    
    return {
      success: true,
      signature,
      algorithm: 'SHA256withRSA',
      signerId: userId,
      timestamp: new Date().toISOString(),
      engineInfo: {
        name: this.name,
        version: this.version
      }
    };
  }

  verifySignature(documentHash, signature, publicKey) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(documentHash);
      verify.end();
      
      const isValid = verify.verify(publicKey, signature, 'hex');
      
      return {
        success: isValid,
        verifiedAt: new Date().toISOString(),
        algorithm: 'SHA256withRSA'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  computeFileHash(fileBuffer, algorithm = 'sha256') {
    return crypto
      .createHash(algorithm)
      .update(fileBuffer)
      .digest('hex');
  }

  issueCertificate(contractId, signerInfo, documentInfo) {
    const certificateNumber = 'CERT-' + uuidv4().toUpperCase();
    
    const certificateData = {
      certificateNumber,
      contractId,
      issuedTo: signerInfo,
      documentInfo,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      issuer: this.certificateAuthority.name,
      caSerialNumber: this.certificateAuthority.rootCertificate.serialNumber
    };
    
    const certificateHash = this.computeFileHash(
      Buffer.from(JSON.stringify(certificateData))
    );
    
    const caSignature = crypto.createSign('SHA256');
    caSignature.update(certificateHash);
    caSignature.end();
    
    const signedCertificate = caSignature.sign(
      this.certificateAuthority.rootCertificate.privateKey,
      'hex'
    );
    
    return {
      success: true,
      certificateNumber,
      certificateData,
      caSignature: signedCertificate,
      hash: certificateHash,
      engineInfo: {
        name: this.name,
        version: this.version
      }
    };
  }

  verifyCertificate(certificateData, caSignature) {
    const certificateHash = this.computeFileHash(
      Buffer.from(JSON.stringify(certificateData))
    );
    
    const verify = crypto.createVerify('SHA256');
    verify.update(certificateHash);
    verify.end();
    
    const isValid = verify.verify(
      this.certificateAuthority.rootCertificate.publicKey,
      caSignature,
      'hex'
    );
    
    const now = new Date();
    const validUntil = new Date(certificateData.validUntil);
    const isNotExpired = now < validUntil;
    
    return {
      success: isValid && isNotExpired,
      signatureValid: isValid,
      notExpired: isNotExpired,
      verifiedAt: new Date().toISOString()
    };
  }
}

module.exports = new DigitalSignatureEngine();
