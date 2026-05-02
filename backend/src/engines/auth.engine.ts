import { APIKeyRepository } from '../repositories/index.js';
import { hashAPIKey, verifyAPIKey, now } from '../utils/index.js';
import type { AuthResult } from '../domains/core/types.js';

export class AuthGuardEngine {
  private apiKeyRepository: APIKeyRepository;
  private tokenCache: Map<string, { apiKeyId: string; serviceId: string; expiresAt: number }>;

  constructor() {
    this.apiKeyRepository = new APIKeyRepository();
    this.tokenCache = new Map();
  }

  validateToken(authHeader: string | undefined): AuthResult {
    if (!authHeader) {
      return {
        success: false,
        error: 'Missing authorization header',
        errorCode: 'AUTH_MISSING_HEADER',
      };
    }

    const apiKey = this.extractAPIKey(authHeader);
    if (!apiKey) {
      return {
        success: false,
        error: 'Invalid authorization format. Expected: Bearer <api-key>',
        errorCode: 'AUTH_INVALID_FORMAT',
      };
    }

    const cached = this.tokenCache.get(apiKey);
    const currentTime = now();
    
    if (cached && cached.expiresAt > currentTime) {
      return {
        success: true,
        apiKeyId: cached.apiKeyId,
        serviceId: cached.serviceId,
      };
    }

    const keyHash = hashAPIKey(apiKey);
    const apiKeyRecord = this.apiKeyRepository.findByKeyHash(keyHash);

    if (!apiKeyRecord) {
      return {
        success: false,
        error: 'Invalid API key',
        errorCode: 'AUTH_INVALID_KEY',
      };
    }

    if (apiKeyRecord.status !== 'ACTIVE') {
      return {
        success: false,
        error: `API key is ${apiKeyRecord.status.toLowerCase()}`,
        errorCode: 'AUTH_KEY_DISABLED',
      };
    }

    if (apiKeyRecord.expires_at && apiKeyRecord.expires_at < currentTime) {
      return {
        success: false,
        error: 'API key has expired',
        errorCode: 'AUTH_KEY_EXPIRED',
      };
    }

    const cacheExpiry = currentTime + 300;
    this.tokenCache.set(apiKey, {
      apiKeyId: apiKeyRecord.id,
      serviceId: apiKeyRecord.service_id,
      expiresAt: cacheExpiry,
    });

    if (this.tokenCache.size > 10000) {
      const entriesToDelete = Array.from(this.tokenCache.entries())
        .filter(([_, v]) => v.expiresAt <= currentTime)
        .slice(0, 1000);
      entriesToDelete.forEach(([k]) => this.tokenCache.delete(k));
    }

    return {
      success: true,
      apiKeyId: apiKeyRecord.id,
      serviceId: apiKeyRecord.service_id,
    };
  }

  private extractAPIKey(authHeader: string): string | null {
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch) {
      return bearerMatch[1].trim();
    }

    const apikeyMatch = authHeader.match(/^Apikey\s+(.+)$/i);
    if (apikeyMatch) {
      return apikeyMatch[1].trim();
    }

    if (authHeader.startsWith('agk-')) {
      return authHeader.trim();
    }

    return null;
  }

  clearCache(): void {
    this.tokenCache.clear();
  }

  invalidateKey(apiKey: string): void {
    this.tokenCache.delete(apiKey);
  }
}
