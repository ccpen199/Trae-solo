const crypto = require('crypto');
const db = require('../database/init');
const { v4: uuidv4 } = require('uuid');

class EvidenceBlock {
  static generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static generateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  static async storeEvidence(caseId, uploadedBy, title, type, filePath, fileName, fileSize, description) {
    const hash = await this.generateFileHash(filePath);
    const blockchainTxId = this.simulateBlockchainTransaction(hash, caseId, uploadedBy);

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO evidences (case_id, uploaded_by, title, type, file_path, file_name, file_size, hash, blockchain_tx_id, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [caseId, uploadedBy, title, type, filePath, fileName, fileSize, hash, blockchainTxId, description],
        function (err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            caseId,
            title,
            hash,
            blockchainTxId,
            uploadedAt: new Date().toISOString()
          });
        }
      );
    });
  }

  static simulateBlockchainTransaction(hash, caseId, userId) {
    const timestamp = Date.now();
    const txData = `${hash}:${caseId}:${userId}:${timestamp}`;
    const txHash = crypto.createHash('sha256').update(txData).digest('hex');
    return `tx_${txHash.substring(0, 16)}`;
  }

  static verifyEvidence(evidenceId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM evidences WHERE id = ?',
        [evidenceId],
        async (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error('证据不存在'));

          try {
            const currentHash = await this.generateFileHash(row.file_path);
            const isValid = currentHash === row.hash;
            
            resolve({
              valid: isValid,
              storedHash: row.hash,
              currentHash,
              blockchainTxId: row.blockchain_tx_id,
              evidence: row
            });
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  static getCaseEvidences(caseId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT e.*, u.name as uploader_name
         FROM evidences e
         LEFT JOIN users u ON e.uploaded_by = u.id
         WHERE e.case_id = ?
         ORDER BY e.created_at DESC`,
        [caseId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = EvidenceBlock;
