const db = require('./database');

function seedDemoData() {
  db.prepare('BEGIN TRANSACTION').run();

  try {
    db.prepare('DELETE FROM revisits').run();
    db.prepare('DELETE FROM churns').run();
    db.prepare('DELETE FROM intentions').run();
    db.prepare('DELETE FROM follow_ups').run();
    db.prepare('DELETE FROM visits').run();
    db.prepare('DELETE FROM agent_transfers').run();
    db.prepare('DELETE FROM customers').run();
    db.prepare("UPDATE properties SET status = 'available'").run();
    const customers = [
      { name: '张三', phone: '13800000001', id_card: '110101199001010001', channel_id: 1, intended_layout: '三室两厅', budget_min: 1500000, budget_max: 2000000, family_structure: '三口之家', agent_id: 2, stage: 'signed', remarks: '优质客户，购房意向明确' },
      { name: '李四', phone: '13800000002', id_card: '110101199002020002', channel_id: 2, intended_layout: '四室两厅', budget_min: 2000000, budget_max: 3000000, family_structure: '四口之家+老人', agent_id: 2, stage: 'subscription', remarks: '老业主推荐，关注学区' },
      { name: '王五', phone: '13800000003', id_card: '110101199003030003', channel_id: 3, intended_layout: '两室一厅', budget_min: 1000000, budget_max: 1500000, family_structure: '单身', agent_id: 3, stage: 'deposit', remarks: '线上广告引流，刚需客户' },
      { name: '赵六', phone: '13800000004', id_card: '110101199004040004', channel_id: 4, intended_layout: '三室两厅', budget_min: 1800000, budget_max: 2500000, family_structure: '两口之家', agent_id: 3, stage: 'visited', remarks: '中介渠道带看，价格敏感' },
      { name: '钱七', phone: '13800000005', id_card: '110101199005050005', channel_id: 1, intended_layout: '两室一厅', budget_min: 1000000, budget_max: 1300000, family_structure: '三口之家', agent_id: 2, stage: 'lead', remarks: '自然到访，首次接触' },
      { name: '孙八', phone: '13800000006', id_card: '110101199006060006', channel_id: 3, intended_layout: '四室两厅', budget_min: 2500000, budget_max: 3500000, family_structure: '三代同堂', agent_id: 3, stage: 'churned', remarks: '选择了竞品项目' },
      { name: '周九', phone: '13800000007', id_card: '110101199007070007', channel_id: 2, intended_layout: '三室两厅', budget_min: 1600000, budget_max: 2200000, family_structure: '三口之家', agent_id: 2, stage: 'visited', remarks: '老业主复购，关注楼层' },
      { name: '吴十', phone: '13800000008', id_card: '110101199008080008', channel_id: 1, intended_layout: '两室一厅', budget_min: 900000, budget_max: 1200000, family_structure: '单身', agent_id: 3, stage: 'deposit', remarks: '投资客，关注回报率' },
      { name: '郑十一', phone: '13800000009', id_card: '110101199009090009', channel_id: 4, intended_layout: '三室两厅', budget_min: 1700000, budget_max: 2300000, family_structure: '四口之家', agent_id: 2, stage: 'lead', remarks: '中介转介绍，需持续跟进' },
      { name: '冯十二', phone: '13800000010', id_card: '110101199010100010', channel_id: 3, intended_layout: '四室两厅', budget_min: 2800000, budget_max: 3800000, family_structure: '二胎家庭', agent_id: 3, stage: 'signed', remarks: '改善型需求，已签约' }
    ];

    const insertCustomer = db.prepare(`
      INSERT INTO customers (name, phone, id_card, channel_id, first_visit_date, latest_visit_date, intended_layout, budget_min, budget_max, family_structure, agent_id, stage, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const customerIds = [];
    const now = new Date();
    customers.forEach((c, idx) => {
      const visitDate = new Date(now - (idx * 3 + 1) * 24 * 60 * 60 * 1000).toISOString();
      const result = insertCustomer.run(
        c.name, c.phone, c.id_card, c.channel_id, visitDate, visitDate,
        c.intended_layout, c.budget_min, c.budget_max, c.family_structure,
        c.agent_id, c.stage, c.remarks
      );
      customerIds.push(result.lastInsertRowid);
    });

    const insertVisit = db.prepare(`
      INSERT INTO visits (customer_id, visit_type, visit_date, receiver_id, route, showrooms, feedback, next_follow_date, next_follow_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const visitData = [
      [customerIds[0], 'visit', new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(), 2, '沙盘→样板间→洽谈区', 'A户型、B户型', '对户型和地段都很满意，预算充足', new Date(now - 27 * 24 * 60 * 60 * 1000).toISOString(), '电话回访确认意向'],
      [customerIds[0], 'showing', new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(), 2, '工地实景→样板间', 'A户型', '再次确认楼层视野，准备认筹', new Date(now - 22 * 24 * 60 * 60 * 1000).toISOString(), '邀约认筹'],
      [customerIds[1], 'visit', new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(), 2, '沙盘→样板间', 'C户型', '大户型很满意，需要和家人商量', new Date(now - 17 * 24 * 60 * 60 * 1000).toISOString(), '跟进家人意见'],
      [customerIds[2], 'visit', new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(), 3, '沙盘→区位图→样板间', 'A户型', '刚需客户，关注价格和优惠', new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(), '推送优惠信息'],
      [customerIds[3], 'showing', new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), 3, '样板间→周边配套', 'B户型', '对周边配套满意，觉得价格偏高', new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), '申请特殊优惠'],
      [customerIds[5], 'visit', new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(), 3, '沙盘→样板间', 'C户型', '初始意向很好，后续跟进中', null, ''],
      [customerIds[6], 'visit', new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), 2, '沙盘→样板间', 'B户型', '老业主推荐，对小区很熟悉', new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), '确认房号'],
      [customerIds[7], 'visit', new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(), 3, '沙盘→样板间', 'A户型', '投资目的，关注租金回报', new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(), '分析投资价值'],
      [customerIds[9], 'showing', new Date(now - 35 * 24 * 60 * 60 * 1000).toISOString(), 3, '沙盘→样板间→洽谈区', 'C户型', '改善型需求，一步到位选择大户型', new Date(now - 32 * 24 * 60 * 60 * 1000).toISOString(), '确认认购时间']
    ];

    visitData.forEach(v => insertVisit.run(...v));

    const insertFollowUp = db.prepare(`
      INSERT INTO follow_ups (customer_id, agent_id, follow_date, method, content, result, next_follow_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const followUpData = [
      [customerIds[0], 2, new Date(now - 27 * 24 * 60 * 60 * 1000).toISOString(), '电话', '回访确认购房意向', '客户表示意向强烈，约定再次带看', new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString()],
      [customerIds[0], 2, new Date(now - 22 * 24 * 60 * 60 * 1000).toISOString(), '微信', '发送认筹须知和优惠信息', '客户确认认筹，次日到店', null],
      [customerIds[1], 2, new Date(now - 17 * 24 * 60 * 60 * 1000).toISOString(), '电话', '确认家人看房时间', '约定周末全家来看房', new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()],
      [customerIds[1], 2, new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), '面谈', '全家看房，讲解户型细节', '家人都满意，准备认购', new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()],
      [customerIds[2], 3, new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(), '微信', '发送最新优惠活动', '客户询问首付细节', new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString()],
      [customerIds[2], 3, new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), '电话', '解答首付贷款问题', '客户理解，同意认筹', null],
      [customerIds[3], 3, new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), '电话', '反馈优惠申请结果', '申请到99折，客户考虑中', new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()],
      [customerIds[6], 2, new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), '微信', '推荐精选楼层', '客户选定8层，约定签约', new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()],
      [customerIds[7], 3, new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(), '面谈', '详细分析投资回报率', '客户认可，决定认筹', null],
      [customerIds[9], 3, new Date(now - 32 * 24 * 60 * 60 * 1000).toISOString(), '电话', '确认认购准备情况', '客户资金已到位，准备签约', null]
    ];

    followUpData.forEach(f => insertFollowUp.run(...f));

    const insertIntention = db.prepare(`
      INSERT INTO intentions (customer_id, type, property_id, deposit_amount, discount_amount, payment_method, approval_status, approver_id, approval_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const intentionData = [
      [customerIds[0], 'deposit', 1, 50000, 20000, '商业贷款', 'approved', 1, new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(), '首套房，正常优惠'],
      [customerIds[0], 'subscription', 1, 100000, 30000, '商业贷款', 'approved', 1, new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(), '准时签约再享99折'],
      [customerIds[0], 'signing', 1, 500000, 50000, '商业贷款', 'approved', 1, new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), '正式签约，1号楼1单元101室'],
      [customerIds[1], 'deposit', 120, 50000, 30000, '公积金贷款', 'approved', 1, new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), '老业主推荐额外优惠'],
      [customerIds[1], 'subscription', 120, 100000, 40000, '公积金贷款', 'pending', null, null, '等待审批'],
      [customerIds[2], 'deposit', 45, 20000, 10000, '商业贷款', 'approved', 1, new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), '刚需小户型'],
      [customerIds[7], 'deposit', 30, 30000, 15000, '一次性付款', 'approved', 1, new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), '投资客，一次性付款享95折'],
      [customerIds[9], 'deposit', 100, 100000, 50000, '组合贷款', 'approved', 1, new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString(), '改善型大户型'],
      [customerIds[9], 'subscription', 100, 200000, 60000, '组合贷款', 'approved', 1, new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString(), '认购顺利'],
      [customerIds[9], 'signing', 100, 800000, 80000, '组合贷款', 'approved', 1, new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(), '正式签约完成']
    ];

    intentionData.forEach(i => insertIntention.run(...i));

    db.prepare("UPDATE properties SET status = 'sold' WHERE id IN (1, 100)").run();

    const insertChurn = db.prepare(`
      INSERT INTO churns (customer_id, churn_date, reason, competitor, price_sensitivity, recontact_plan, recontact_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const churnData = [
      [customerIds[5], new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(), '选择竞品', '隔壁花园', '单价超出预算5%', '节日推送优惠信息', new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), '竞品有现房优势，我们期房'],
      [customerIds[4], new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), '资金问题', null, '首付缺口较大', '半年后再跟进', new Date(now + 180 * 24 * 60 * 60 * 1000).toISOString(), '客户表示需要筹集资金']
    ];

    churnData.forEach(c => insertChurn.run(...c));

    db.prepare('UPDATE customers SET stage = ? WHERE id = ?').run('churned', customerIds[5]);

    db.prepare('COMMIT').run();
    console.log('✅ 演示数据创建成功！');
    console.log(`   - 创建了 ${customers.length} 个客户`);
    console.log(`   - 创建了 ${visitData.length} 条来访带看记录`);
    console.log(`   - 创建了 ${followUpData.length} 条跟进记录`);
    console.log(`   - 创建了 ${intentionData.length} 条认筹/认购/签约记录`);
    console.log(`   - 创建了 ${churnData.length} 条流失记录`);

  } catch (e) {
    db.prepare('ROLLBACK').run();
    console.error('❌ 数据创建失败:', e.message);
    throw e;
  }
}

seedDemoData();
