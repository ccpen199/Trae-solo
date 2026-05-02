const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

class SealManagerEngine {
  constructor() {
    this.name = 'Seal-Manager Engine';
    this.version = '1.0.0';
  }

  async createSeal(userId, sealName, sealType = 'personal', customImage = null) {
    const sealId = uuidv4();
    
    const sealImage = customImage || this._generateDefaultSealImage(sealName, sealType);
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO seals (id, user_id, seal_name, seal_type, seal_image, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [sealId, userId, sealName, sealType, sealImage],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              success: true,
              sealId,
              sealName,
              sealType,
              userId,
              createdAt: new Date().toISOString(),
              engineInfo: {
                name: 'Seal-Manager Engine',
                version: '1.0.0'
              }
            });
          }
        }
      );
    });
  }

  _generateDefaultSealImage(sealName, sealType) {
    const svgContent = this._generateSealSVG(sealName, sealType);
    return Buffer.from(svgContent);
  }

  _generateSealSVG(sealName, sealType) {
    const isOrganization = sealType === 'organization' || sealType === 'official';
    const radius = isOrganization ? 60 : 45;
    const centerX = 80;
    const centerY = 80;
    
    const textSize = isOrganization ? 12 : 10;
    const starRadius = isOrganization ? 15 : 10;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#C41E3A" stroke-width="3"/>
      <circle cx="${centerX}" cy="${centerY}" r="${radius - 5}" fill="none" stroke="#C41E3A" stroke-width="1"/>
      <polygon 
        points="${centerX},${centerY - starRadius} ${centerX - starRadius * 0.588},${centerY + starRadius * 0.809} ${centerX + starRadius * 0.951},${centerY - starRadius * 0.309} ${centerX - starRadius * 0.951},${centerY - starRadius * 0.309} ${centerX + starRadius * 0.588},${centerY + starRadius * 0.809}"
        fill="#C41E3A"/>
      <text x="${centerX}" y="${centerY + radius - 20}" text-anchor="middle" 
        font-family="SimSun, STSong, serif" font-size="${textSize}" fill="#C41E3A" font-weight="bold">
        ${sealName.length > 8 ? sealName.substring(0, 8) + '...' : sealName}
      </text>
      <text x="${centerX}" y="${centerY + radius - 5}" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="8" fill="#C41E3A">
        ${sealType === 'personal' ? 'PERSONAL' : 'OFFICIAL'}
      </text>
    </svg>`;
  }

  async getUserSeals(userId, includeInactive = false) {
    const query = includeInactive 
      ? `SELECT * FROM seals WHERE user_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM seals WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC`;
    
    return new Promise((resolve, reject) => {
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            userId,
            seals: rows.map(row => ({
              sealId: row.id,
              sealName: row.seal_name,
              sealType: row.seal_type,
              isActive: row.is_active === 1,
              createdAt: row.created_at
            }))
          });
        }
      });
    });
  }

  async getSealById(sealId, userId = null) {
    const query = userId 
      ? `SELECT * FROM seals WHERE id = ? AND user_id = ?`
      : `SELECT * FROM seals WHERE id = ?`;
    const params = userId ? [sealId, userId] : [sealId];
    
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve({ success: false, error: '印章不存在' });
        } else {
          resolve({
            success: true,
            sealId: row.id,
            userId: row.user_id,
            sealName: row.seal_name,
            sealType: row.seal_type,
            isActive: row.is_active === 1,
            sealImage: row.seal_image,
            createdAt: row.created_at
          });
        }
      });
    });
  }

  async deactivateSeal(sealId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE seals SET is_active = 0 WHERE id = ? AND user_id = ?`,
        [sealId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            resolve({ success: false, error: '印章不存在或无权限' });
          } else {
            resolve({
              success: true,
              sealId,
              deactivatedAt: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  async verifySealAccess(sealId, userId) {
    const seal = await this.getSealById(sealId, userId);
    
    if (!seal.success) {
      return {
        success: false,
        error: seal.error,
        canUse: false
      };
    }
    
    if (!seal.isActive) {
      return {
        success: false,
        error: '印章已被停用',
        canUse: false
      };
    }
    
    return {
      success: true,
      canUse: true,
      seal: {
        sealId: seal.sealId,
        sealName: seal.sealName,
        sealType: seal.sealType
      }
    };
  }

  async getSealForSigning(contractId, signerId) {
    const userSeals = await this.getUserSeals(signerId);
    
    if (!userSeals.success || userSeals.seals.length === 0) {
      const defaultSeal = await this.createSeal(
        signerId,
        `签署专用章_${signerId.substring(0, 8)}`,
        'personal'
      );
      
      return {
        success: true,
        isNewlyCreated: true,
        seal: {
          sealId: defaultSeal.sealId,
          sealName: defaultSeal.sealName,
          sealType: defaultSeal.sealType
        }
      };
    }
    
    const activeSeals = userSeals.seals.filter(s => s.isActive);
    
    return {
      success: true,
      isNewlyCreated: false,
      seal: activeSeals[0],
      availableSeals: activeSeals
    };
  }

  async generateSealVerificationToken(sealId, contractId) {
    const seal = await this.getSealById(sealId);
    
    if (!seal.success) {
      return { success: false, error: seal.error };
    }
    
    const verificationData = {
      sealId,
      contractId,
      userId: seal.userId,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    const token = crypto
      .createHmac('sha256', 'seal-verification-secret')
      .update(JSON.stringify(verificationData))
      .digest('hex');
    
    return {
      success: true,
      verificationToken: token,
      verificationData,
      sealInfo: {
        sealId: seal.sealId,
        sealName: seal.sealName,
        sealType: seal.sealType
      }
    };
  }
}

module.exports = new SealManagerEngine();
