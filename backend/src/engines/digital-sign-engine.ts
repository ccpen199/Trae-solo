import * as forge from 'node-forge';
import * as crypto from 'crypto';
import { knex } from '../database/connection';
import { config } from '../config';

export interface SignRequest {
  content: string;
  userId: string;
  username: string;
  userName: string;
  certificateNumber?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface SignResult {
  success: boolean;
  signature?: string;
  timestamp?: Date;
  certificateSerial?: string;
  hash?: string;
  error?: string;
}

export interface VerifyRequest {
  content: string;
  signature: string;
  hash?: string;
}

export interface VerifyResult {
  valid: boolean;
  signedBy?: string;
  signedAt?: Date;
  certificateValid?: boolean;
  error?: string;
}

export interface SignatureRecord {
  id: string;
  documentType: string;
  documentId: string;
  userId: string;
  userName: string;
  signature: string;
  documentHash: string;
  timestamp: Date;
  ipAddress: string | null;
  certificateSerial: string | null;
  metadata: any;
}

export class DigitalSignatureEngine {
  private keyPair: forge.pki.rsa.KeyPair | null = null;
  private certificate: forge.pki.Certificate | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.keyPair = forge.pki.rsa.generateKeyPair(2048);

      this.certificate = forge.pki.createCertificate();
      this.certificate.publicKey = this.keyPair.publicKey;
      this.certificate.serialNumber = this.generateSerialNumber();
      this.certificate.validity.notBefore = new Date();
      this.certificate.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const attrs = [
        { name: 'commonName', value: 'EMR System CA' },
        { name: 'countryName', value: 'CN' },
        { name: 'organizationName', value: 'Hospital EMR System' },
      ];

      this.certificate.setSubject(attrs);
      this.certificate.setIssuer(attrs);

      this.certificate.sign(this.keyPair.privateKey, forge.md.sha256.create());

      this.initialized = true;
      console.log('🔐 Digital signature engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize digital signature engine:', error);
      throw error;
    }
  }

  private generateSerialNumber(): string {
    const bytes = crypto.randomBytes(16);
    return bytes.toString('hex').toUpperCase();
  }

  async sign(request: SignRequest): Promise<SignResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const timestamp = new Date();

      const contentWithMeta = JSON.stringify({
        content: request.content,
        userId: request.userId,
        username: request.username,
        userName: request.userName,
        timestamp: timestamp.toISOString(),
        certificateNumber: request.certificateNumber,
        metadata: request.metadata,
      });

      const md = forge.md.sha256.create();
      md.update(contentWithMeta, 'utf8');
      const hash = md.digest().toHex();

      const privateKey = this.keyPair!.privateKey;
      const signature = privateKey.sign(md);
      const signatureHex = forge.util.bytesToHex(signature);

      const certificateSerial = this.certificate?.serialNumber || '';

      const result: SignResult = {
        success: true,
        signature: signatureHex,
        timestamp,
        certificateSerial,
        hash,
      };

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Signature failed',
      };
    }
  }

  async verify(request: VerifyRequest): Promise<VerifyResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const publicKey = this.keyPair!.publicKey;

      const md = forge.md.sha256.create();
      md.update(request.content, 'utf8');

      const signatureBytes = forge.util.hexToBytes(request.signature);

      const valid = publicKey.verify(md.digest().getBytes(), signatureBytes);

      return {
        valid,
        certificateValid: true,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Verification failed',
      };
    }
  }

  computeHash(content: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(content, 'utf8');
    return hash.digest('hex');
  }

  async saveSignatureRecord(
    documentType: string,
    documentId: string,
    request: SignRequest,
    signResult: SignResult
  ): Promise<string> {
    const recordId = crypto.randomUUID();

    await knex('audit_logs').insert({
      id: recordId,
      user_id: request.userId,
      username: request.username,
      action: 'SIGN',
      module: 'DIGITAL_SIGNATURE',
      table_name: documentType,
      record_id: documentId,
      new_value: JSON.stringify({
        signature: signResult.signature,
        hash: signResult.hash,
        timestamp: signResult.timestamp,
        certificateSerial: signResult.certificateSerial,
        metadata: request.metadata,
      }),
      ip_address: request.ipAddress,
      description: `对 ${documentType} 文档 ${documentId} 进行电子签名`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return recordId;
  }

  async getSignatureHistory(documentType: string, documentId: string): Promise<SignatureRecord[]> {
    const logs = await knex('audit_logs')
      .where('action', 'SIGN')
      .where('module', 'DIGITAL_SIGNATURE')
      .where('table_name', documentType)
      .where('record_id', documentId)
      .orderBy('created_at', 'desc');

    return logs.map((log) => ({
      id: log.id,
      documentType: log.table_name,
      documentId: log.record_id,
      userId: log.user_id,
      userName: log.username,
      signature: log.new_value?.signature,
      documentHash: log.new_value?.hash,
      timestamp: log.created_at,
      ipAddress: log.ip_address,
      certificateSerial: log.new_value?.certificateSerial,
      metadata: log.new_value?.metadata,
    }));
  }

  lockDocument(
    documentType: string,
    documentId: string,
    userId: string
  ): Promise<number> {
    switch (documentType) {
      case 'medical_records':
        return knex('medical_records')
          .where('id', documentId)
          .update({
            is_locked: true,
            signed_by: userId,
            signed_at: new Date(),
            updated_at: new Date(),
          });

      case 'visits':
        return knex('visits')
          .where('id', documentId)
          .update({
            signed_by: userId,
            signed_at: new Date(),
            updated_at: new Date(),
          });

      case 'prescriptions':
        return knex('prescriptions')
          .where('id', documentId)
          .update({
            status: 'APPROVED',
            signed_by: userId,
            signed_at: new Date(),
            updated_at: new Date(),
          });

      case 'exam_orders':
        return knex('exam_orders')
          .where('id', documentId)
          .update({
            signed_by: userId,
            signed_at: new Date(),
            updated_at: new Date(),
          });

      default:
        return Promise.resolve(0);
    }
  }

  async signAndLock(
    documentType: string,
    documentId: string,
    content: string,
    user: {
      id: string;
      username: string;
      name: string;
      certificateNumber?: string;
    },
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<SignResult> {
    const signRequest: SignRequest = {
      content,
      userId: user.id,
      username: user.username,
      userName: user.name,
      certificateNumber: user.certificateNumber,
      ipAddress,
      metadata,
    };

    const result = await this.sign(signRequest);

    if (result.success) {
      await this.saveSignatureRecord(documentType, documentId, signRequest, result);
      await this.lockDocument(documentType, documentId, user.id);
    }

    return result;
  }

  async verifyDocumentSignature(
    documentType: string,
    documentId: string,
    content: string
  ): Promise<VerifyResult> {
    const history = await this.getSignatureHistory(documentType, documentId);

    if (history.length === 0) {
      return {
        valid: false,
        error: 'No signature found for this document',
      };
    }

    const latest = history[0];

    const computedHash = this.computeHash(content);

    if (latest.documentHash !== computedHash) {
      return {
        valid: false,
        signedBy: latest.userName,
        signedAt: latest.timestamp,
        error: 'Document has been modified since signing',
      };
    }

    return {
      valid: true,
      signedBy: latest.userName,
      signedAt: latest.timestamp,
      certificateValid: true,
    };
  }

  generateTimestampToken(content: string): string {
    const timestamp = Date.now().toString();
    const data = `${content}|${timestamp}`;
    const hmac = crypto.createHmac('sha256', config.jwt.secret);
    hmac.update(data);
    const signature = hmac.digest('hex');
    return `${timestamp}|${signature}`;
  }

  verifyTimestampToken(content: string, token: string): { valid: boolean; timestamp?: Date } {
    const [timestampStr, signature] = token.split('|');

    if (!timestampStr || !signature) {
      return { valid: false };
    }

    const data = `${content}|${timestampStr}`;
    const hmac = crypto.createHmac('sha256', config.jwt.secret);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    return {
      valid: true,
      timestamp: new Date(parseInt(timestampStr, 10)),
    };
  }
}

export const digitalSignEngine = new DigitalSignatureEngine();
