const db = require('./database');

console.log('开始创建示例数据...\n');

const stmt1 = db.prepare(`
  INSERT INTO achievements (name, type, inventors, college, maturity_level, ownership_clear, ownership_remark, patent_number, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const r1 = stmt1.run('新型智能物联网传感器', 'patent', '张教授,李博士,王研究员', '计算机科学与技术学院', 'TRL6', 1, '学校独立研发，权属清晰', 'CN202410012345.6', 'registered');
console.log(`✅ 创建成果1: 新型智能物联网传感器 (ID: ${r1.lastInsertRowid})`);

const stmt2 = db.prepare(`
  INSERT INTO achievements (name, type, inventors, college, maturity_level, ownership_clear, ownership_remark, software_copyright, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const r2 = stmt2.run('深度学习图像识别算法', 'software', '陈教授,刘博士', '人工智能学院', 'TRL5', 1, '学校自主研发', '2024SR0012345', 'registered');
console.log(`✅ 创建成果2: 深度学习图像识别算法 (ID: ${r2.lastInsertRowid})`);

const stmt3 = db.prepare(`
  INSERT INTO achievements (name, type, inventors, college, maturity_level, ownership_clear, ownership_remark, paper_doi, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const r3 = stmt3.run('基于区块链的供应链溯源系统', 'paper', '赵教授', '信息管理学院', 'TRL4', 0, '与企业合作研发，权属待确认', '10.1000/xyz123', 'draft');
console.log(`✅ 创建成果3: 基于区块链的供应链溯源系统 (ID: ${r3.lastInsertRowid}) - 权属不清`);

const stmt4 = db.prepare(`
  INSERT INTO companies (name, contact_person, contact_phone, contact_email, industry)
  VALUES (?, ?, ?, ?, ?)
`);
const c1 = stmt4.run('科技创新有限公司', '陈经理', '13800138000', 'chen@techcorp.com', '智能制造');
console.log(`✅ 创建企业1: 科技创新有限公司 (ID: ${c1.lastInsertRowid})`);

const c2 = stmt4.run('智慧物联科技股份有限公司', '周总', '13900139000', 'zhou@smartiot.com', '物联网');
console.log(`✅ 创建企业2: 智慧物联科技股份有限公司 (ID: ${c2.lastInsertRowid})`);

const evalStmt = db.prepare(`
  INSERT INTO evaluations (achievement_id, version, market_scene, tech_advantage, conclusion, expert_opinion, valuation_basis, valuation_amount, status, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
evalStmt.run(r1.lastInsertRowid, 1, '工业物联网、智能制造、智慧城市', '低功耗、高精度、响应速度快、抗干扰能力强', '技术成熟度高，市场前景广阔，建议进行技术转化', '专家组一致同意通过评估，建议估值500万元', '基于同类技术市场交易价格及未来3年收益预测', 5000000, 'approved', 'admin');
console.log(`✅ 创建评估: 成果1评估通过，估值500万元`);

evalStmt.run(r2.lastInsertRowid, 1, '安防监控、医疗影像、自动驾驶', '识别准确率98.5%，比同类算法高3-5个百分点', '技术优势明显，但需进一步工程化优化', '专家组建议退回完善工程化方案后再审', '算法性能指标优异，但落地场景需明确', 3000000, 'rejected', 'admin');
console.log(`✅ 创建评估: 成果2评估退回`);

const updateStmt = db.prepare('UPDATE achievements SET status = ? WHERE id = ?');
updateStmt.run('evaluated', r1.lastInsertRowid);

const contractStmt = db.prepare(`
  INSERT INTO contracts (achievement_id, contract_number, license_type, amount, inventor_share, college_share, status, signed_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const contract = contractStmt.run(r1.lastInsertRowid, 'HT2024001', 'exclusive', 3000000, 40, 20, 'signed', '2024-03-15');
console.log(`✅ 创建合同: HT2024001，金额300万元 (ID: ${contract.lastInsertRowid})`);

const paymentStmt = db.prepare(`
  INSERT INTO payments (contract_id, amount, due_date, actual_date, status)
  VALUES (?, ?, ?, ?, ?)
`);
paymentStmt.run(contract.lastInsertRowid, 1500000, '2024-03-20', '2024-03-18', 'received');
paymentStmt.run(contract.lastInsertRowid, 1500000, '2024-06-30', null, 'pending');
console.log(`✅ 创建付款计划: 首付款150万已到账，尾款150万待支付`);

const ledgerStmt = db.prepare(`
  INSERT INTO revenue_ledger (payment_id, contract_id, achievement_id, amount, inventor_amount, college_amount, university_amount)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
ledgerStmt.run(1, contract.lastInsertRowid, r1.lastInsertRowid, 1500000, 600000, 300000, 600000);
console.log(`✅ 收益分配: 发明人60万，学院30万，学校60万`);

console.log('\n🎉 示例数据创建完成！');
console.log('\n📊 统计:');
console.log(`   成果总数: 3 (其中1个权属不清)`);
console.log(`   企业总数: 2`);
console.log(`   评估记录: 2 (1通过, 1退回)`);
console.log(`   合同总数: 1`);
console.log(`   到账金额: 150万元`);
