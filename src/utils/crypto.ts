const SHIFT = 3;

export function encrypt(text: string): string {
  const shifted = text
    .split('')
    .map((char) => String.fromCharCode(char.charCodeAt(0) + SHIFT))
    .join('');
  return btoa(unescape(encodeURIComponent(shifted)));
}

export function decrypt(text: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(text)));
    return decoded
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) - SHIFT))
      .join('');
  } catch {
    return '';
  }
}

export function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
