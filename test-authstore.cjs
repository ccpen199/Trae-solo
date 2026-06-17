const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
global.localStorage = mockLocalStorage;

const fs = require('fs');

async function run() {
  const { useAuthStore } = await import('./src/store/authStore.ts');
  const lines = [];
  const log = (s) => { lines.push(String(s)); process.stdout.write(s + '\n'); };

  log('=== Initial state ===');
  let state = useAuthStore.getState();
  log('isAuthenticated: ' + state.isAuthenticated);
  log('isLoading: ' + state.isLoading);

  const roles = ['citizen', 'enterprise', 'staff', 'platform', 'ops', 'admin'];
  let allPass = true;

  for (const role of roles) {
    log('\n--- Testing: ' + role + ' ---');
    useAuthStore.getState().logout();
    const result = await useAuthStore.getState().login(role, '123456', role);
    const post = useAuthStore.getState();
    log('  result.success: ' + result.success);
    if (!result.success) {
      log('  errorCode: ' + result.errorCode);
      log('  detail: ' + (result.errorInfo?.detail || ''));
    }
    log('  store.isAuthenticated: ' + post.isAuthenticated);
    log('  store.loginRole: ' + post.loginRole);
    log('  redirectRoute: ' + result.redirectRoute);
    const pass = result.success && post.isAuthenticated && post.loginRole === role;
    if (!pass) allPass = false;
    log('  ' + (pass ? 'PASS' : 'FAIL'));
  }

  log('\n' + (allPass ? 'ALL PASS' : 'SOME FAIL'));
  fs.writeFileSync('/tmp/test-out.txt', lines.join('\n'));
}
run().catch(e => {
  const fs = require('fs');
  fs.writeFileSync('/tmp/test-out.txt', 'ERROR: ' + e.stack);
  process.exit(1);
});
