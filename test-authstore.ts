const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
(global as any).localStorage = mockLocalStorage;

import { useAuthStore } from './src/store/authStore.ts';

console.log('=== Initial state ===');
let state = useAuthStore.getState();
console.log('isAuthenticated:', state.isAuthenticated);
console.log('isLoading:', state.isLoading);
console.log('user:', state.user?.name || 'null');
console.log('loginRole:', state.loginRole);
console.log('defaultRoute:', state.getDefaultRoute());

const roles = ['citizen', 'enterprise', 'staff', 'platform', 'ops', 'admin'] as const;

async function runTests() {
  console.log('\n=== Running 6-role login tests ===\n');
  let allPass = true;

  for (const role of roles) {
    console.log(`\n--- Testing role: ${role} ---`);
    useAuthStore.getState().logout();

    const username = role;
    const password = '123456';

    const result = await useAuthStore.getState().login(username, password, role);
    const postState = useAuthStore.getState();

    console.log('  login result.success:', result.success);
    if (!result.success) {
      console.log('  login result.errorCode:', result.errorCode);
      console.log('  login result.errorInfo.detail:', result.errorInfo?.detail);
    }
    console.log('  store.isAuthenticated:', postState.isAuthenticated);
    console.log('  store.isLoading:', postState.isLoading);
    console.log('  store.user:', postState.user?.name || 'null');
    console.log('  store.loginRole:', postState.loginRole);
    console.log('  store.defaultRoute:', postState.getDefaultRoute());
    console.log('  result.redirectRoute:', result.redirectRoute);
    console.log('  result.availableRoles:', result.availableRoles);

    const rolePass =
      result.success === true &&
      postState.isAuthenticated === true &&
      postState.loginRole === role &&
      result.redirectRoute === postState.getDefaultRoute();

    if (!rolePass) {
      allPass = false;
      console.log('  ❌ FAIL');
    } else {
      console.log('  ✅ PASS');
    }
  }

  console.log('\n=== Error scenario tests ===\n');

  const errorTests = [
    { name: 'PASSWORD_ERROR', u: 'admin', p: 'wrongpass', r: 'admin', expect: 'PASSWORD_ERROR' },
    { name: 'ACCOUNT_NOT_FOUND', u: 'nobody_here', p: '123456', r: 'citizen', expect: 'ACCOUNT_NOT_FOUND' },
    { name: 'NO_ROLE_PERMISSION', u: 'citizen', p: '123456', r: 'admin', expect: 'NO_ROLE_PERMISSION' },
    { name: 'ACCOUNT_LOCKED', u: 'locked_user', p: '123456', r: 'citizen', expect: 'ACCOUNT_LOCKED' },
  ];

  for (const t of errorTests) {
    useAuthStore.getState().logout();
    const result = await useAuthStore.getState().login(t.u, t.p, t.r);
    const pass = result.success === false && result.errorCode === t.expect;
    if (!pass) allPass = false;
    console.log(`${pass ? '✅' : '❌'} ${t.name}: ${result.errorCode} (expected: ${t.expect})`);
    if (!pass) {
      console.log('   detail:', result.errorInfo?.detail);
    }
  }

  console.log('\n=== checkAuth (localStorage restore) test ===\n');
  useAuthStore.getState().logout();
  await useAuthStore.getState().login('citizen', '123456', 'citizen');
  const beforeReset = useAuthStore.getState();
  console.log('After login: isAuthenticated =', beforeReset.isAuthenticated);

  const initialState = {
    user: null,
    token: null,
    loginRole: null,
    isAuthenticated: false,
    isLoading: false,
    lastLoginResult: null,
    loginLogs: [],
    failAttempts: {},
  };
  useAuthStore.setState(initialState as any);
  console.log('After reset: isAuthenticated =', useAuthStore.getState().isAuthenticated);

  useAuthStore.getState().checkAuth();
  const afterCheck = useAuthStore.getState();
  console.log('After checkAuth: isAuthenticated =', afterCheck.isAuthenticated);
  console.log('After checkAuth: loginRole =', afterCheck.loginRole);
  console.log('After checkAuth: user =', afterCheck.user?.name);

  const restorePass = afterCheck.isAuthenticated && afterCheck.loginRole === 'citizen';
  if (!restorePass) allPass = false;
  console.log(restorePass ? '✅ checkAuth PASS' : '❌ checkAuth FAIL');

  console.log('\n' + (allPass ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED!'));

  useAuthStore.getState().logout();
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
