import type { Authorization, ArtistProfile, User } from '../../../shared/types';

export const SENSITIVE_FIELDS: Record<string, 'phone' | 'email' | 'realName' | 'idCard'> = {
  phone: 'phone',
  email: 'email',
  realName: 'realName',
  idCard: 'idCard',
  contactPhone: 'phone',
  contactPerson: 'realName',
};

export type SensitiveFieldType = 'phone' | 'email' | 'realName' | 'idCard';

export function maskValue(value: string, fieldType: SensitiveFieldType): string {
  if (!value) return value;

  switch (fieldType) {
    case 'phone': {
      if (value.length >= 11) {
        return value.slice(0, 3) + '****' + value.slice(-4);
      }
      return value.slice(0, Math.floor(value.length / 2)) + '****';
    }
    case 'email': {
      const [username, domain] = value.split('@');
      if (!username || !domain) return value;
      const maskedUsername = username.length > 2
        ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
        : '*'.repeat(username.length);
      return `${maskedUsername}@${domain}`;
    }
    case 'realName': {
      if (value.length <= 1) return value;
      if (value.length === 2) return value[0] + '*';
      return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
    }
    case 'idCard': {
      if (value.length >= 18) {
        return value.slice(0, 6) + '********' + value.slice(-4);
      }
      if (value.length >= 8) {
        return value.slice(0, Math.floor(value.length / 4)) +
          '****' +
          value.slice(-Math.floor(value.length / 4));
      }
      return '*'.repeat(value.length);
    }
    default:
      return '*'.repeat(Math.max(0, value.length));
  }
}

export function isFieldAuthorized(
  field: string,
  authorization?: Authorization | null
): boolean {
  if (!authorization) return false;
  if (authorization.isRevoked) return false;
  if (authorization.expiresAt && new Date(authorization.expiresAt) < new Date()) return false;
  return authorization.dataScope.includes(field) || authorization.dataScope.includes('*');
}

export function maskData<T extends Record<string, any>>(
  data: T,
  authorization?: Authorization | null
): T {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => maskData(item, authorization)) as unknown as T;
  }

  const masked = { ...data };

  for (const [key, value] of Object.entries(masked)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      masked[key as keyof T] = maskData(value, authorization);
      continue;
    }

    const sensitiveFieldType = SENSITIVE_FIELDS[key];
    if (sensitiveFieldType && typeof value === 'string') {
      if (!isFieldAuthorized(key, authorization)) {
        masked[key as keyof T] = maskValue(value, sensitiveFieldType) as unknown as T[keyof T];
      }
    }
  }

  return masked;
}

export function maskArtistProfile(
  artist: ArtistProfile,
  authorization?: Authorization | null
): ArtistProfile {
  return maskData(artist, authorization);
}

export function maskUser(
  user: User,
  authorization?: Authorization | null
): User {
  return maskData(user, authorization);
}

export function generatePrivacyScore(authorizations: Authorization[], consents: { granted: boolean }[]): number {
  let score = 50;

  const activeAuthorizations = authorizations.filter(a => !a.isRevoked);
  score -= activeAuthorizations.length * 2;

  const grantedConsents = consents.filter(c => c.granted).length;
  score -= grantedConsents * 3;

  const expiredAuthorizations = authorizations.filter(
    a => a.expiresAt && new Date(a.expiresAt) < new Date()
  );
  score += expiredAuthorizations.length * 5;

  const revokedAuthorizations = authorizations.filter(a => a.isRevoked);
  score += revokedAuthorizations.length * 3;

  return Math.max(0, Math.min(100, score));
}
