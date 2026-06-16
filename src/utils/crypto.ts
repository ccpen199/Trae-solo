const FIXED_PASSWORD = 'resume-workbench-default-secret-key';
const PBKDF2_SALT = new TextEncoder().encode('resume-workbench-salt');
const PBKDF2_ITERATIONS = 10000;
const AES_GCM_TAG_LENGTH = 128;
const IV_LENGTH = 12;

async function deriveKey(): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(FIXED_PASSWORD),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: unknown): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_LENGTH },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

export async function decrypt<T = unknown>(encryptedData: string): Promise<T> {
  const key = await deriveKey();
  const binary = atob(encryptedData);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_LENGTH },
    key,
    data
  );
  const decoded = new TextDecoder().decode(decrypted);
  return JSON.parse(decoded) as T;
}
