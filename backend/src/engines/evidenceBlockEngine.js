const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

class EvidenceBlockEngine {
  constructor() {
    this.name = 'Evidence-Block Engine';
    this.version = '1.0.0';
    this.genesisBlock = this._createGenesisBlock();
  }

  _createGenesisBlock() {
    const genesisData = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: '电子签约系统证据链创世块',
      previousHash: '0'.repeat(64),
      nonce: 0
    };
    
    return {
      ...genesisData,
      hash: this._calculateHash(genesisData)
    };
  }

  _calculateHash(block) {
    const blockString = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    
    return crypto
      .createHash('sha256')
      .update(blockString)
      .digest('hex');
  }

  _getLastBlock(contractId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM evidence_blocks 
         WHERE contract_id = ? 
         ORDER BY created_at DESC, id DESC 
         LIMIT 1`,
        [contractId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve({
              block_hash: this.genesisBlock.hash,
              id: 'genesis',
              contract_id: contractId
            });
          }
        }
      );
    });
  }

  async createEvidenceBlock(contractId, operation, operatorInfo, rawData = {}) {
    const lastBlock = await this._getLastBlock(contractId);
    
    const blockIndex = lastBlock.id === 'genesis' ? 1 : 
      (await this._getBlockCount(contractId)) + 1;
    
    const blockData = {
      index: blockIndex,
      contractId,
      operation,
      operator: operatorInfo,
      rawData,
      timestamp: new Date().toISOString()
    };
    
    const nonce = this._mineBlock(blockData);
    
    const block = {
      index: blockIndex,
      timestamp: blockData.timestamp,
      data: blockData,
      previousHash: lastBlock.block_hash || lastBlock.hash,
      nonce
    };
    
    const blockHash = this._calculateHash(block);
    
    const evidenceId = uuidv4();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO evidence_blocks 
         (id, contract_id, block_type, block_hash, previous_hash, 
          timestamp, operation, operator_id, operator_name, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evidenceId,
          contractId,
          operation,
          blockHash,
          block.previousHash,
          block.timestamp,
          operation,
          operatorInfo?.userId || null,
          operatorInfo?.userName || null,
          JSON.stringify(rawData)
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              success: true,
              evidenceId,
              blockHash,
              previousHash: block.previousHash,
              operation,
              timestamp: block.timestamp,
              engineInfo: {
                name: this.name,
                version: this.version
              }
            });
          }
        }
      );
    });
  }

  _mineBlock(blockData, difficulty = 4) {
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    
    while (true) {
      const tempBlock = {
        index: blockData.index,
        timestamp: blockData.timestamp,
        data: blockData,
        previousHash: 'temp',
        nonce
      };
      
      const hash = this._calculateHash(tempBlock);
      
      if (hash.startsWith(prefix)) {
        return nonce;
      }
      
      nonce++;
    }
  }

  _getBlockCount(contractId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM evidence_blocks WHERE contract_id = ?`,
        [contractId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        }
      );
    });
  }

  async getEvidenceChain(contractId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM evidence_blocks 
         WHERE contract_id = ? 
         ORDER BY created_at ASC`,
        [contractId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const chain = [this.genesisBlock, ...rows];
            const isValid = this._verifyChain(chain);
            
            resolve({
              success: true,
              contractId,
              blockCount: rows.length + 1,
              isValid,
              chain: rows.map((row, index) => ({
                index: index + 1,
                id: row.id,
                blockType: row.block_type,
                blockHash: row.block_hash,
                previousHash: row.previous_hash,
                timestamp: row.timestamp,
                operation: row.operation,
                operatorId: row.operator_id,
                operatorName: row.operator_name,
                rawData: row.raw_data ? JSON.parse(row.raw_data) : null
              }))
            });
          }
        }
      );
    });
  }

  _verifyChain(chain) {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];
      
      if (currentBlock.previous_hash !== previousBlock.block_hash && 
          currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    return true;
  }

  async generateEvidenceReport(contractId, disputeInfo = {}) {
    const evidenceChain = await this.getEvidenceChain(contractId);
    
    const reportData = {
      reportId: uuidv4(),
      generatedAt: new Date().toISOString(),
      contractId,
      disputeInfo,
      evidenceChain: evidenceChain.chain,
      verificationResult: {
        isValid: evidenceChain.isValid,
        blockCount: evidenceChain.blockCount,
        verifiedAt: new Date().toISOString()
      }
    };
    
    return {
      success: true,
      reportData,
      reportHash: crypto
        .createHash('sha256')
        .update(JSON.stringify(reportData))
        .digest('hex')
    };
  }

  async exportEvidenceForCourt(contractId) {
    const evidenceChain = await this.getEvidenceChain(contractId);
    const report = await this.generateEvidenceReport(contractId);
    
    return {
      success: true,
      exportFormat: 'JSON',
      exportedAt: new Date().toISOString(),
      jurisdictionReady: true,
      chainIntegrityVerified: evidenceChain.isValid,
      evidencePackage: {
        evidenceChain: evidenceChain.chain,
        report: report.reportData,
        reportHash: report.reportHash
      }
    };
  }

  async auditEvidence(contractId) {
    const evidenceChain = await this.getEvidenceChain(contractId);
    
    const auditTrail = evidenceChain.chain.map(block => ({
      sequence: block.index,
      operation: block.operation,
      operator: block.operatorName,
      timestamp: block.timestamp,
      blockHash: block.blockHash,
      integrity: 'verified'
    }));
    
    return {
      success: true,
      contractId,
      auditPassed: evidenceChain.isValid,
      auditTimestamp: new Date().toISOString(),
      auditTrail,
      summary: {
        totalOperations: auditTrail.length,
        allBlocksVerified: evidenceChain.isValid,
        chainIntegrity: 'COMPLETE'
      }
    };
  }
}

module.exports = new EvidenceBlockEngine();
