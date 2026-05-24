const db = require('../backend/src/db');
const fetch = require('node-fetch');

const API = 'http://127.0.0.1:53669/api';

async function login(username, password, type = 'staff') {
  const endpoint = type === 'staff' ? '/auth/staff/login' : '/auth/member/login';
  const body = type === 'staff' ? { username, password } : { phone: username, password };
  const res = await fetch(API + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function test() {
  console.log('=== 1. 测试总部账号登录 ===');
  const adminLogin = await login('admin', 'admin123', 'staff');
  console.log('  admin登录:', adminLogin.token ? '✅ 成功' : '❌ 失败', adminLogin.token ? '' : adminLogin.error);
  const token = adminLogin.token;

  console.log('\n=== 2. 获取发票列表 ===');
  const invoices = await fetch(API + '/report/invoices', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());
  console.log('  发票总数:', invoices.length);
  invoices.forEach(i => console.log('    ID:', i.id, '金额:', i.amount, '状态:', i.status, '发票号:', i.invoice_number || '-'));

  console.log('\n=== 3. 测试发票号必填校验 ===');
  const pendingInv = invoices.find(i => i.status === 'pending');
  if (pendingInv) {
    const res1 = await fetch(API + `/report/invoices/${pendingInv.id}/issue`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: '' })
    }).then(r => r.json());
    console.log('  空发票号:', res1.error ? '✅ 正确拦截 - ' + res1.error : '❌ 未拦截');
  }

  console.log('\n=== 4. 测试发票号重复校验 ===');
  const issuedInv = invoices.find(i => i.status === 'issued' && i.invoice_number);
  if (pendingInv && issuedInv) {
    const res2 = await fetch(API + `/report/invoices/${pendingInv.id}/issue`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: issuedInv.invoice_number })
    }).then(r => r.json());
    console.log('  重复发票号:', res2.error ? '✅ 正确拦截 - ' + res2.error : '❌ 未拦截');
  }

  console.log('\n=== 5. 测试正常开具发票 ===');
  if (pendingInv) {
    const newInvoiceNum = 'INV' + Date.now().toString().slice(-8);
    const res3 = await fetch(API + `/report/invoices/${pendingInv.id}/issue`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: newInvoiceNum })
    }).then(r => r.json());
    console.log('  新发票号 ' + newInvoiceNum + ':', res3.message ? '✅ 成功 - ' + res3.message : '❌ 失败 - ' + res3.error);
  }

  console.log('\n=== 6. 验证数据库发票号唯一性 ===');
  const dup = db.prepare('SELECT invoice_number, COUNT(*) as cnt FROM invoices WHERE invoice_number IS NOT NULL GROUP BY invoice_number HAVING cnt > 1').all();
  console.log('  重复发票号:', dup.length === 0 ? '✅ 无重复' : '❌ 有重复 - ' + dup.map(d => d.invoice_number).join(', '));

  console.log('\n=== 7. 测试员工账号登录（station1_cash1）===');
  const cashLogin = await login('station1_cash1', 'cashier123', 'staff');
  console.log('  收银员登录:', cashLogin.token ? '✅ 成功，角色:' + cashLogin.user.role : '❌ 失败');

  console.log('\n=== 8. 测试会员账号登录（13800000001）===');
  const memberLogin = await login('13800000001', '123456', 'member');
  console.log('  会员登录:', memberLogin.token ? '✅ 成功，余额:' + memberLogin.member.balance : '❌ 失败');

  console.log('\n✅ 所有测试完成');
}

setTimeout(test, 3000);
