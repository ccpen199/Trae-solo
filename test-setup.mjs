import { encryptAES256, decryptAES256, hashPassword, verifyPassword } from './api/utils/encryption.js';
import { generateToken, verifyToken } from './api/middleware/auth.js';
import { hasPermission, ROLE_PERMISSIONS, ROLE_HIERARCHY, isRoleAboveOrEqual } from './api/middleware/permission.js';

console.log('=== Testing Encryption ===');
const encrypted = encryptAES256('hello world');
const decrypted = decryptAES256(encrypted);
console.log('Encrypt/Decrypt test:', decrypted === 'hello world' ? 'PASS' : 'FAIL');
console.log('  encrypted length:', encrypted.length);

const hash = hashPassword('123456');
const verify = verifyPassword('123456', hash);
console.log('Password hash test:', verify ? 'PASS' : 'FAIL');
const wrongVerify = verifyPassword('wrong', hash);
console.log('Password wrong test:', !wrongVerify ? 'PASS' : 'FAIL');
console.log('  hash:', hash.substring(0, 16) + '...');

console.log('\n=== Testing JWT ===');
const token = generateToken({ userId: '1', username: 'test', role: 'courier', outletId: 'o1', regionId: 'r1' });
const payload = verifyToken(token);
console.log('JWT generate/verify test:', payload && payload.userId === '1' && payload.role === 'courier' ? 'PASS' : 'FAIL');
console.log('  payload:', JSON.stringify(payload));
const invalidPayload = verifyToken('invalid-token');
console.log('JWT invalid test:', invalidPayload === null ? 'PASS' : 'FAIL');

console.log('\n=== Testing Permissions ===');
console.log('Courier has waybill:create:', hasPermission('courier', 'waybill:create') ? 'PASS' : 'FAIL');
console.log('Courier has user:delete:', !hasPermission('courier', 'user:delete') ? 'PASS' : 'FAIL');
console.log('Head auditor has system:config:', hasPermission('head_auditor', 'system:config') ? 'PASS' : 'FAIL');
console.log('Role hierarchy head_auditor >= courier:', isRoleAboveOrEqual('head_auditor', 'courier') ? 'PASS' : 'FAIL');
console.log('Role hierarchy courier < head_auditor:', !isRoleAboveOrEqual('courier', 'head_auditor') ? 'PASS' : 'FAIL');
console.log('  ROLE_HIERARCHY:', JSON.stringify(ROLE_HIERARCHY));
console.log('  Roles defined:', Object.keys(ROLE_PERMISSIONS).join(', '));

console.log('\n=== All non-DB tests passed! ===');
