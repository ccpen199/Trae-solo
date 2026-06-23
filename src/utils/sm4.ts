export const SM4_KEY = '0123456789abcdef0123456789abcdef';
const SM4_BLOCK_SIZE = 16;
const SBOX = [
  0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
  0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
  0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
  0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
  0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
  0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
  0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
  0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
  0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xd8, 0xe3, 0x88, 0x0a, 0x6e, 0x1f, 0x92, 0xee,
  0xb1, 0x8c, 0x48, 0x55, 0xf9, 0xbd, 0x2d, 0x7f, 0xa5, 0x5c, 0x96, 0x77, 0x09, 0x61, 0xb4, 0xae,
  0x69, 0x53, 0x0c, 0x03, 0x5b, 0x23, 0x37, 0x0d, 0x15, 0x7b, 0xe2, 0x12, 0x18, 0x1b, 0xf0, 0x8d,
  0x11, 0x6f, 0x1a, 0x79, 0xc5, 0x41, 0x10, 0xe5, 0x7e, 0xf2, 0x6c, 0xa1, 0x89, 0x66, 0x60, 0xca,
  0x29, 0x4d, 0x82, 0x39, 0x45, 0x3a, 0x3e, 0x30, 0x5f, 0xb8, 0xb9, 0xc1, 0x2e, 0xd7, 0x51, 0x2f,
  0xf7, 0xc0, 0x31, 0xba, 0x34, 0x6d, 0x6c, 0x65, 0x32, 0x76, 0x50, 0x4e, 0x6a, 0x58, 0x49, 0x7d,
  0x13, 0x44, 0xa3, 0x2e, 0x9b, 0x7e, 0x72, 0x15, 0xf5, 0xac, 0xe0, 0xa4, 0xc6, 0xef, 0x6e, 0x84,
  0x18, 0xf0, 0x92, 0x9a, 0x88, 0x14, 0x11, 0x4f, 0x7f, 0x97, 0xc9, 0x5a, 0x7a, 0x5b, 0x6b, 0xc7
];
const FK = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];
const CK = [
  0x00070e15, 0x1c232a31, 0x383f464d, 0x545b6269,
  0x70777e85, 0x8c939aa1, 0xa8afb6bd, 0xc4cbd2d9,
  0xe0e7eef5, 0xfc030a11, 0x181f262d, 0x343b4249,
  0x50575e65, 0x6c737a81, 0x888f969d, 0xa4abb2b9,
  0xc0c7ced5, 0xdce3eaf1, 0xf8ff060d, 0x141b2229,
  0x30373e45, 0x4c535a61, 0x686f767d, 0x848b9299,
  0xa0a7aeb5, 0xbcc3cad1, 0xd8dfd6dd, 0xf4fbf2f9,
  0x10171e25, 0x2c333a41, 0x484f565d, 0x747b8289
];

function rotateLeft(x: number, n: number): number {
  return (x << n) | (x >>> (32 - n));
}

function byteSub(a: number): number {
  const b0 = (a >>> 24) & 0xff;
  const b1 = (a >>> 16) & 0xff;
  const b2 = (a >>> 8) & 0xff;
  const b3 = a & 0xff;
  return (SBOX[b0] << 24) | (SBOX[b1] << 16) | (SBOX[b2] << 8) | SBOX[b3];
}

function linearTransformL(b: number): number {
  return b ^ rotateLeft(b, 2) ^ rotateLeft(b, 10) ^ rotateLeft(b, 18) ^ rotateLeft(b, 24);
}

function linearTransformLPrime(b: number): number {
  return b ^ rotateLeft(b, 13) ^ rotateLeft(b, 23);
}

function roundFunction(x: number, rk: number): number {
  const b = byteSub(x ^ rk);
  return linearTransformL(b);
}

function roundFunctionT(x: number, rk: number): number {
  const b = byteSub(x ^ rk);
  return linearTransformLPrime(b);
}

function expandKey(key: string): number[] {
  const keyBytes = hexToBytes(key);
  const k = new Array(4);
  for (let i = 0; i < 4; i++) {
    k[i] = (keyBytes[i * 4] << 24) | (keyBytes[i * 4 + 1] << 16) | (keyBytes[i * 4 + 2] << 8) | keyBytes[i * 4 + 3];
  }
  const k0 = k[0] ^ FK[0];
  const k1 = k[1] ^ FK[1];
  const k2 = k[2] ^ FK[2];
  const k3 = k[3] ^ FK[3];
  const rk: number[] = new Array(32);
  const K: number[] = [k0, k1, k2, k3];
  for (let i = 0; i < 32; i++) {
    const x = K[i + 1] ^ K[i + 2] ^ K[i + 3] ^ CK[i];
    K[i + 4] = K[i] ^ roundFunctionT(x, 0);
    rk[i] = K[i + 4];
  }
  return rk;
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3f));
    } else {
      bytes.push(0xe0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    }
  }
  return bytes;
}

function bytesToString(bytes: number[]): string {
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if (byte1 < 0xe0) {
      const byte2 = bytes[i++];
      str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      str += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
    }
  }
  return str;
}

function pkcs7Pad(data: number[], blockSize: number): number[] {
  const padLen = blockSize - (data.length % blockSize);
  const result = [...data];
  for (let i = 0; i < padLen; i++) {
    result.push(padLen);
  }
  return result;
}

function pkcs7Unpad(data: number[]): number[] {
  const padLen = data[data.length - 1];
  return data.slice(0, -padLen);
}

function encryptBlock(block: number[], rk: number[]): number[] {
  const x: number[] = new Array(36);
  x[0] = (block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3];
  x[1] = (block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7];
  x[2] = (block[8] << 24) | (block[9] << 16) | (block[10] << 8) | block[11];
  x[3] = (block[12] << 24) | (block[13] << 16) | (block[14] << 8) | block[15];
  for (let i = 0; i < 32; i++) {
    x[i + 4] = x[i] ^ roundFunction(x[i + 1] ^ x[i + 2] ^ x[i + 3], rk[i]);
  }
  const y = [x[35], x[34], x[33], x[32]];
  const result: number[] = [];
  for (let i = 0; i < 4; i++) {
    result.push((y[i] >>> 24) & 0xff);
    result.push((y[i] >>> 16) & 0xff);
    result.push((y[i] >>> 8) & 0xff);
    result.push(y[i] & 0xff);
  }
  return result;
}

function decryptBlock(block: number[], rk: number[]): number[] {
  const x: number[] = new Array(36);
  x[0] = (block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3];
  x[1] = (block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7];
  x[2] = (block[8] << 24) | (block[9] << 16) | (block[10] << 8) | block[11];
  x[3] = (block[12] << 24) | (block[13] << 16) | (block[14] << 8) | block[15];
  for (let i = 0; i < 32; i++) {
    x[i + 4] = x[i] ^ roundFunction(x[i + 1] ^ x[i + 2] ^ x[i + 3], rk[31 - i]);
  }
  const y = [x[35], x[34], x[33], x[32]];
  const result: number[] = [];
  for (let i = 0; i < 4; i++) {
    result.push((y[i] >>> 24) & 0xff);
    result.push((y[i] >>> 16) & 0xff);
    result.push((y[i] >>> 8) & 0xff);
    result.push(y[i] & 0xff);
  }
  return result;
}

export function encryptECB(plaintext: string, key: string = SM4_KEY): string {
  try {
    console.log('[SM4] Encrypting data...');
    const rk = expandKey(key);
    const dataBytes = stringToBytes(plaintext);
    const paddedData = pkcs7Pad(dataBytes, SM4_BLOCK_SIZE);
    const cipherBytes: number[] = [];
    for (let i = 0; i < paddedData.length; i += SM4_BLOCK_SIZE) {
      const block = paddedData.slice(i, i + SM4_BLOCK_SIZE);
      const encryptedBlock = encryptBlock(block, rk);
      cipherBytes.push(...encryptedBlock);
    }
    return bytesToHex(cipherBytes);
  } catch (error) {
    console.error('[SM4] Encryption failed:', error);
    throw new Error('SM4 encryption failed');
  }
}

export function decryptECB(ciphertext: string, key: string = SM4_KEY): string {
  try {
    console.log('[SM4] Decrypting data...');
    const rk = expandKey(key);
    const cipherBytes = hexToBytes(ciphertext);
    const plainBytes: number[] = [];
    for (let i = 0; i < cipherBytes.length; i += SM4_BLOCK_SIZE) {
      const block = cipherBytes.slice(i, i + SM4_BLOCK_SIZE);
      const decryptedBlock = decryptBlock(block, rk);
      plainBytes.push(...decryptedBlock);
    }
    const unpaddedData = pkcs7Unpad(plainBytes);
    return bytesToString(unpaddedData);
  } catch (error) {
    console.error('[SM4] Decryption failed:', error);
    throw new Error('SM4 decryption failed');
  }
}

export function generateSM4Key(): string {
  const chars = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export default {
  encryptECB,
  decryptECB,
  generateSM4Key
};
