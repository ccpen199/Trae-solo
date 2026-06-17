import { userAccounts, roleConfig } from './src/mock/data.ts';

function testLogin(username, password, role) {
  const account = userAccounts.find(a => a.username === username.trim().toLowerCase());
  if (!account) return { success: false, errorCode: 'ACCOUNT_NOT_FOUND' };
  if (account.accountStatus === 'locked') return { success: false, errorCode: 'ACCOUNT_LOCKED' };
  if (account.password !== password) return { success: false, errorCode: 'PASSWORD_ERROR', expected: account.password };
  const effectiveRole = role === 'auto' ? account.defaultRole : role;
  if (role !== 'auto' && !account.roles.includes(role)) return { success: false, errorCode: 'NO_ROLE_PERMISSION' };
  const redirectRoute = roleConfig[effectiveRole]?.defaultRoute || '/';
  return { success: true, redirectRoute, loginRole: effectiveRole, userName: account.user.name };
}

const roles = ['citizen', 'enterprise', 'staff', 'platform', 'ops', 'admin'];
let allPass = true;
roles.forEach(r => {
  const result = testLogin(r, '123456', r);
  const status = result.success ? '✅' : '❌';
  if (!result.success) allPass = false;
  console.log(`${status} ${r}: ${JSON.stringify(result)}`);
});

console.log('\n--- Error scenarios ---');
const errors = [
  { u: 'admin', p: 'wrong', r: 'admin', expect: 'PASSWORD_ERROR' },
  { u: 'nobody', p: '123456', r: 'citizen', expect: 'ACCOUNT_NOT_FOUND' },
  { u: 'citizen', p: '123456', r: 'admin', expect: 'NO_ROLE_PERMISSION' },
  { u: 'locked_user', p: '123456', r: 'citizen', expect: 'ACCOUNT_LOCKED' },
];
errors.forEach(e => {
  const result = testLogin(e.u, e.p, e.r);
  const pass = result.errorCode === e.expect;
  if (!pass) allPass = false;
  console.log(`${pass ? '✅' : '❌'} ${e.u}/${e.p}/${e.r} → ${result.errorCode} (expected: ${e.expect})`);
});

console.log(`\n${allPass ? '🎉 All tests passed!' : '⚠️ Some tests failed!'}`);
