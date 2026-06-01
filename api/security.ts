import crypto from 'crypto';
import db from './db.js';

export class SM4 {
  private key: Buffer;
  
  constructor(key: string) {
    const hash = crypto.createHash('sha256').update(key).digest();
    this.key = hash.subarray(0, 16);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-128-cbc', this.key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

const sm4Key = process.env.SM4_KEY || 'tax_service_sm4_key_2024';
export const sm4 = new SM4(sm4Key);

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function addBlockchainRecord(recordType: string, referenceId: number, data: object): number {
  const dataStr = JSON.stringify(data);
  const dataHash = hashData(dataStr);
  
  const lastRecord = db.prepare('SELECT data_hash, block_number FROM blockchain_records ORDER BY id DESC LIMIT 1').get() as { data_hash: string; block_number: number } | undefined;
  
  const previousHash = lastRecord?.data_hash || '0';
  const blockNumber = (lastRecord?.block_number || 0) + 1;
  
  const result = db.prepare(`
    INSERT INTO blockchain_records (record_type, reference_id, data_hash, previous_hash, block_number)
    VALUES (?, ?, ?, ?, ?)
  `).run(recordType, referenceId, dataHash, previousHash, blockNumber);
  
  return result.lastInsertRowid as number;
}

export function logOperation(
  operation: string,
  userId?: number,
  officerId?: number,
  ipAddress?: string,
  userAgent?: string,
  requestData?: object,
  responseData?: object
): number {
  const result = db.prepare(`
    INSERT INTO operation_logs (user_id, officer_id, operation, ip_address, user_agent, request_data, response_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId || null,
    officerId || null,
    operation,
    ipAddress || null,
    userAgent || null,
    requestData ? JSON.stringify(requestData) : null,
    responseData ? JSON.stringify(responseData) : null
  );
  
  return result.lastInsertRowid as number;
}

export function verifyBlockchain(): { valid: boolean; message: string } {
  const records = db.prepare('SELECT * FROM blockchain_records ORDER BY id ASC').all() as Array<{
    id: number;
    data_hash: string;
    previous_hash: string;
  }>;
  
  for (let i = 0; i < records.length; i++) {
    if (i === 0) {
      if (records[i].previous_hash !== '0') {
        return { valid: false, message: `第${i + 1}条记录的前哈希不正确` };
      }
    } else {
      if (records[i].previous_hash !== records[i - 1].data_hash) {
        return { valid: false, message: `第${i + 1}条记录与前一条记录的哈希不匹配` };
      }
    }
  }
  
  return { valid: true, message: '区块链存证验证通过' };
}
