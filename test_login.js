const normalizeEmail = (input) => {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === 'test') return 'test@example.com';
  if (trimmed === 'admin') return 'admin@resume.com';
  if (trimmed === 'platform') return 'admin@resume.com';
  if (trimmed === 'word') return 'test@example.com';
  if (!trimmed.includes('@')) return trimmed + '@example.com';
  return trimmed;
};

console.log('=== 快捷账号自动补全测试:');
console.log('test ->', normalizeEmail('test'));
console.log('admin ->', normalizeEmail('admin'));
console.log('word ->', normalizeEmail('word'));
console.log('platform ->', normalizeEmail('platform'));
console.log('zhangsan ->', normalizeEmail('zhangsan'));
console.log('test@example.com ->', normalizeEmail('test@example.com'));
