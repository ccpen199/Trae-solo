import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('🧪 开始初始化测试数据...\n');

try {
  db.exec('BEGIN TRANSACTION');

  console.log('📋 清理旧测试数据...');
  db.exec("DELETE FROM customers WHERE name IN ('李四-单人借款', '王五-夫妻共借', '赵六-资料补正', '钱七-征信失败')");

  const now = new Date().toISOString();

  console.log('\n🏠 案例1: 单人借款 - 完整流程已完成');
  const cust1 = db.prepare(`
    INSERT INTO customers (name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '李四-单人借款', '310101199202022222', '13800138002', 'lisi@example.com', 'single', '上海市浦东新区', 1, 1500000, 'approved', 1, now, now
  );
  const cust1Id = cust1.lastInsertRowid;

  const docs1 = db.prepare(`
    INSERT INTO documents (customer_id, type, name, status, version, uploaded_by, reviewed_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  docs1.run(cust1Id, 'purchase_contract', '购房合同', 'approved', 1, 1, 3, now);
  docs1.run(cust1Id, 'income_flow', '收入流水', 'approved', 1, 1, 3, now);
  docs1.run(cust1Id, 'credit_auth', '征信授权书', 'approved', 1, 1, 3, now);
  docs1.run(cust1Id, 'marriage_cert', '婚姻证明', 'approved', 1, 1, 3, now);
  docs1.run(cust1Id, 'down_payment', '首付款凭证', 'approved', 1, 1, 3, now);

  const creditReport1 = JSON.stringify({
    score: 785, scoreLevel: 'A', overdueCount: 0, totalLoanAmount: '50.50万',
    creditCardCount: 3, queryCount: 5, riskLevel: '低风险',
    suggestion: '建议正常审批', reportNo: 'CR' + Date.now(), reportTime: now
  });
  db.prepare(`
    INSERT INTO credit_authorizations (customer_id, borrower_type, status, query_time, expire_time, credit_report, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cust1Id, 'main', 'success', now, new Date(Date.now() + 30*24*60*60*1000).toISOString(), creditReport1, 1, now);

  db.prepare(`
    INSERT INTO approval_records (customer_id, node, version, operator_id, opinion, risk_tips, amount_suggestion, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cust1Id, 'review', 1, 3, '资料齐全，征信良好，建议通过', '无明显风险', 1500000, 'approved', now);
  db.prepare(`
    INSERT INTO approval_records (customer_id, node, version, operator_id, opinion, risk_tips, amount_suggestion, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cust1Id, 'final', 2, 4, '同意初审意见，批准放款', '无', 1500000, 'approved', now);

  console.log('   ✅ 李四-单人借款: 初审+终审通过');

  console.log('\n👨‍👩‍👧 案例2: 夫妻共同借款 - 资料审核中');
  const cust2 = db.prepare(`
    INSERT INTO customers (name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '王五-夫妻共借', '320101199303033333', '13800138003', 'wangwu@example.com', 'married', '杭州市西湖区', 2, 2800000, 'pending', 1, now, now
  );
  const cust2Id = cust2.lastInsertRowid;

  db.prepare(`
    INSERT INTO co_borrowers (customer_id, name, id_card, phone, relationship, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cust2Id, '陈翠花', '320101199404044444', '13800138004', 'spouse', now);

  const docs2 = db.prepare(`
    INSERT INTO documents (customer_id, type, name, status, version, uploaded_by, reviewed_by, reject_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  docs2.run(cust2Id, 'purchase_contract', '购房合同', 'approved', 1, 1, 3, null, now);
  docs2.run(cust2Id, 'income_flow', '主借人收入流水', 'approved', 1, 1, 3, null, now);
  docs2.run(cust2Id, 'credit_auth', '征信授权书', 'submitted', 1, 1, null, null, now);
  docs2.run(cust2Id, 'marriage_cert', '婚姻证明', 'submitted', 1, 1, null, null, now);
  docs2.run(cust2Id, 'down_payment', '首付款凭证', 'pending', 1, null, null, null, now);
  docs2.run(cust2Id, 'co_borrower', '共同借款人资料', 'pending', 1, null, null, null, now);

  console.log('   ✅ 王五-夫妻共借: 部分资料待审核');

  console.log('\n✏️  案例3: 资料补正 - 被退回待修改');
  const cust3 = db.prepare(`
    INSERT INTO customers (name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '赵六-资料补正', '330101199404045555', '13800138005', 'zhaoliu@example.com', 'married', '广州市天河区', 1, 1200000, 'pending', 1, now, now
  );
  const cust3Id = cust3.lastInsertRowid;

  const docs3 = db.prepare(`
    INSERT INTO documents (customer_id, type, name, status, version, uploaded_by, reviewed_by, reject_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  docs3.run(cust3Id, 'purchase_contract', '购房合同', 'approved', 1, 1, 3, null, now);
  docs3.run(cust3Id, 'income_flow', '收入流水', 'rejected', 1, 1, 3, '银行流水缺少最近3个月记录，需补充', now);
  docs3.run(cust3Id, 'credit_auth', '征信授权书', 'approved', 1, 1, 3, null, now);
  docs3.run(cust3Id, 'marriage_cert', '婚姻证明', 'approved', 1, 1, 3, null, now);
  docs3.run(cust3Id, 'down_payment', '首付款凭证', 'approved', 1, 1, 3, null, now);

  const creditReport3 = JSON.stringify({
    score: 742, scoreLevel: 'B', overdueCount: 1, totalLoanAmount: '30.00万',
    creditCardCount: 2, queryCount: 8, riskLevel: '低风险',
    suggestion: '建议关注还款能力', reportNo: 'CR' + (Date.now() + 100), reportTime: now
  });
  db.prepare(`
    INSERT INTO credit_authorizations (customer_id, borrower_type, status, query_time, expire_time, credit_report, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cust3Id, 'main', 'success', now, new Date(Date.now() + 30*24*60*60*1000).toISOString(), creditReport3, 1, now);

  db.prepare(`
    INSERT INTO todos (user_id, customer_id, type, title, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(1, cust3Id, 'correction', '客户赵六-资料补正 - 收入流水需补正', '银行流水缺少最近3个月记录，请补充后重新提交', 'pending', now);

  console.log('   ✅ 赵六-资料补正: 收入流水被退回，待办已生成');

  console.log('\n❌ 案例4: 征信失败 - 需重新查询');
  const cust4 = db.prepare(`
    INSERT INTO customers (name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '钱七-征信失败', '340101199505056666', '13800138006', 'qianqi@example.com', 'single', '深圳市南山区', 1, 900000, 'pending', 1, now, now
  );
  const cust4Id = cust4.lastInsertRowid;

  const docs4 = db.prepare(`
    INSERT INTO documents (customer_id, type, name, status, version, uploaded_by, reviewed_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  docs4.run(cust4Id, 'purchase_contract', '购房合同', 'approved', 1, 1, 3, now);
  docs4.run(cust4Id, 'income_flow', '收入流水', 'approved', 1, 1, 3, now);
  docs4.run(cust4Id, 'credit_auth', '征信授权书', 'approved', 1, 1, 3, now);
  docs4.run(cust4Id, 'marriage_cert', '婚姻证明', 'approved', 1, 1, 3, now);
  docs4.run(cust4Id, 'down_payment', '首付款凭证', 'approved', 1, 1, 3, now);

  db.prepare(`
    INSERT INTO credit_authorizations (customer_id, borrower_type, status, query_time, fail_reason, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(cust4Id, 'main', 'failed', now, '客户信息不匹配，身份证号与姓名不一致', 1, now);

  console.log('   ✅ 钱七-征信失败: 征信查询失败，需重新查询');

  console.log('\n⏳ 案例5: 办理中断 - 待初审（刷新页面继续办理演示）');
  const cust5 = db.prepare(`
    INSERT INTO customers (name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '孙八-待初审', '350101199606067777', '13800138007', 'sunba@example.com', 'single', '成都市武侯区', 1, 800000, 'reviewing', 1, now, now
  );
  const cust5Id = cust5.lastInsertRowid;

  const docs5 = db.prepare(`
    INSERT INTO documents (customer_id, type, name, status, version, uploaded_by, reviewed_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  docs5.run(cust5Id, 'purchase_contract', '购房合同', 'approved', 1, 1, 3, now);
  docs5.run(cust5Id, 'income_flow', '收入流水', 'approved', 1, 1, 3, now);
  docs5.run(cust5Id, 'credit_auth', '征信授权书', 'approved', 1, 1, 3, now);
  docs5.run(cust5Id, 'marriage_cert', '婚姻证明', 'approved', 1, 1, 3, now);
  docs5.run(cust5Id, 'down_payment', '首付款凭证', 'approved', 1, 1, 3, now);

  const creditReport5 = JSON.stringify({
    score: 820, scoreLevel: 'A', overdueCount: 0, totalLoanAmount: '0万',
    creditCardCount: 1, queryCount: 2, riskLevel: '低风险',
    suggestion: '建议正常审批', reportNo: 'CR' + (Date.now() + 200), reportTime: now
  });
  db.prepare(`
    INSERT INTO credit_authorizations (customer_id, borrower_type, status, query_time, expire_time, credit_report, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cust5Id, 'main', 'success', now, new Date(Date.now() + 30*24*60*60*1000).toISOString(), creditReport5, 1, now);

  db.prepare(`
    INSERT INTO todos (user_id, customer_id, type, title, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(3, cust5Id, 'approval', '客户孙八-待初审 资料已齐全，请初审', 'pending', now);

  console.log('   ✅ 孙八-待初审: 初审待办已生成，等待审批');

  db.exec('COMMIT');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 测试数据初始化完成！');
  console.log('='.repeat(60));
  console.log('\n📋 测试案例清单：\n');
  console.log('  1️⃣  李四-单人借款    | 完整流程 | 已放款 ✅');
  console.log('  2️⃣  王五-夫妻共借    | 共同借款人 | 资料审核中 📄');
  console.log('  3️⃣  赵六-资料补正    | 收入流水退回 | 待办已生成 ✏️');
  console.log('  4️⃣  钱七-征信失败    | 征信查询失败 | 需重新查询 ❌');
  console.log('  5️⃣  孙八-待初审      | 资料齐全 | 待审批 ⏳');
  console.log('\n💡 提示：切换不同角色账号可看到不同的待办和数据权限');
  console.log('💡 刷新页面后数据仍然保留，可测试"刷新页面继续办理"');
  console.log('\n' + '='.repeat(60));

} catch (err) {
  db.exec('ROLLBACK');
  console.error('❌ 初始化失败:', err.message);
  process.exit(1);
} finally {
  db.close();
}
