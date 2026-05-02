const crypto = require('crypto');
const dayjs = require('dayjs');
const db = require('../database');

class PolicyVaultEngine {
  constructor() {
    this.hashAlgorithm = 'sha256';
    this.ensureVaultTable();
  }

  ensureVaultTable() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS vault_records (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        record_type TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        previous_hash TEXT,
        block_number INTEGER,
        metadata TEXT,
        stored_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_vault_entity ON vault_records(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_vault_hash ON vault_records(content_hash);
    `);
  }

  generateHash(content, previousHash = null) {
    const timestamp = dayjs().toISOString();
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const hashInput = previousHash 
      ? `${previousHash}:${contentString}:${timestamp}` 
      : `${contentString}:${timestamp}`;
    
    return {
      hash: crypto.createHash(this.hashAlgorithm).update(hashInput).digest('hex'),
      timestamp,
      algorithm: this.hashAlgorithm
    };
  }

  getPreviousHash(entityType, entityId) {
    const stmt = db.prepare(`
      SELECT content_hash FROM vault_records 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY stored_at DESC 
      LIMIT 1
    `);
    const result = stmt.get(entityType, entityId);
    return result ? result.content_hash : null;
  }

  storeRecord(entityType, entityId, recordType, content, metadata = {}) {
    const id = crypto.randomUUID();
    const previousHash = this.getPreviousHash(entityType, entityId);
    const { hash, timestamp } = this.generateHash(content, previousHash);
    
    const blockStmt = db.prepare(`
      SELECT MAX(block_number) as max_block FROM vault_records
    `);
    const maxBlock = blockStmt.get();
    const blockNumber = (maxBlock.max_block || 0) + 1;
    
    const stmt = db.prepare(`
      INSERT INTO vault_records 
      (id, entity_type, entity_id, record_type, content_hash, previous_hash, block_number, metadata, stored_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      entityType,
      entityId,
      recordType,
      hash,
      previousHash,
      blockNumber,
      JSON.stringify(metadata),
      timestamp
    );

    console.log(`[VAULT] Stored ${recordType} for ${entityType}:${entityId} - Hash: ${hash.substring(0, 16)}...`);

    return {
      id,
      hash,
      previousHash,
      blockNumber,
      timestamp,
      entityType,
      entityId,
      recordType
    };
  }

  verifyChain(entityType, entityId) {
    const stmt = db.prepare(`
      SELECT * FROM vault_records 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY stored_at ASC
    `);
    const records = stmt.all(entityType, entityId);
    
    if (records.length === 0) {
      return { valid: true, message: 'No records found' };
    }

    let previousHash = null;
    for (const record of records) {
      const content = this.retrieveContent(record);
      const { hash } = this.generateHash(content, previousHash);
      
      if (hash !== record.content_hash) {
        return {
          valid: false,
          message: 'Hash verification failed',
          failedRecord: record.id,
          expectedHash: hash,
          storedHash: record.content_hash
        };
      }
      previousHash = record.content_hash;
    }

    return {
      valid: true,
      recordCount: records.length,
      latestHash: previousHash,
      verifiedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
  }

  retrieveContent(record) {
    const entityType = record.entity_type;
    const entityId = record.entity_id;
    
    try {
      if (entityType === 'policy') {
        const stmt = db.prepare('SELECT * FROM policies WHERE id = ?');
        return stmt.get(entityId);
      }
      if (entityType === 'claim') {
        const stmt = db.prepare('SELECT * FROM claims WHERE id = ?');
        return stmt.get(entityId);
      }
      if (entityType === 'product') {
        const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
        return stmt.get(entityId);
      }
    } catch (e) {
      console.error('Failed to retrieve content:', e);
    }
    
    return null;
  }

  getAuditTrail(entityType, entityId) {
    const stmt = db.prepare(`
      SELECT * FROM vault_records 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY stored_at DESC
    `);
    const records = stmt.all(entityType, entityId);
    
    return records.map(r => ({
      ...r,
      metadata: r.metadata ? JSON.parse(r.metadata) : {}
    }));
  }

  generateComplianceReport(entityType, entityId) {
    const verification = this.verifyChain(entityType, entityId);
    const auditTrail = this.getAuditTrail(entityType, entityId);
    
    return {
      reportId: crypto.randomUUID(),
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      entityType,
      entityId,
      verification,
      auditTrail,
      recordCount: auditTrail.length,
      complianceStatus: verification.valid ? 'compliant' : 'non_compliant'
    };
  }

  archiveRecord(entityType, entityId) {
    const records = this.getAuditTrail(entityType, entityId);
    const archiveHash = this.generateHash(records);
    
    return this.storeRecord(
      entityType, 
      entityId, 
      'archive', 
      records, 
      {
        archiveHash: archiveHash.hash,
        recordCount: records.length,
        archivedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    );
  }
}

module.exports = new PolicyVaultEngine();
