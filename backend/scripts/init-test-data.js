require('dotenv').config({ path: '../../.env' });
const db = require('../src/config/database');

const initTestData = () => {
  const tx = db.transaction(() => {
    console.log('=== 开始插入测试数据 ===\n');

    const coopStmt = db.prepare(`
      INSERT OR IGNORE INTO cooperatives (name, contact_person, phone, address, guarantee_limit, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    
    coopStmt.run('丰收种植合作社', '王社长', '13800138001', '山东省德州市齐河县', 500000);
    coopStmt.run('绿源农业合作社', '李主任', '13800138002', '山东省济南市章丘区', 300000);
    console.log('✓ 合作社数据插入完成');

    const storeStmt = db.prepare(`
      INSERT OR IGNORE INTO stores (name, owner_name, phone, address, cooperative_id, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    
    storeStmt.run('齐河农资第一门市部', '张老板', '13900139001', '齐河县城区阳光路88号', 1);
    storeStmt.run('章丘农家服务中心', '刘老板', '13900139002', '章丘区明水街道', 2);
    console.log('✓ 门店数据插入完成');

    const farmerStmt = db.prepare(`
      INSERT OR IGNORE INTO farmers (name, id_card, phone, address, planting_area, historical_yield, 
        cooperative_id, has_cooperative_guarantee, guarantee_amount, past_repayment_history, 
        insurance_info, subsidy_info, risk_tags, credit_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    farmerStmt.run(
      '张三', '371425198001011234', '13700137001', '齐河县胡官屯镇', 50, 25000,
      1, 1, 50000, '连续3年无逾期', '小麦保险50亩', '种粮补贴120元/亩', '低风险', 750
    );
    farmerStmt.run(
      '李四', '371425198502022345', '13700137002', '齐河县焦庙镇', 30, 15000,
      1, 0, 0, '1次逾期3天', '玉米保险30亩', '种粮补贴120元/亩', '中风险', 620
    );
    farmerStmt.run(
      '王五', '370181199003033456', '13700137003', '章丘区刁镇', 100, 60000,
      2, 1, 80000, '信用良好', '小麦玉米各50亩', '种粮补贴+农机补贴', '低风险', 800
    );
    farmerStmt.run(
      '赵六', '370181198804044567', '13700137004', '章丘区水寨镇', 20, 8000,
      2, 0, 0, '逾期超过30天记录', '无保险', '基础种粮补贴', '高风险', 450
    );
    console.log('✓ 农户数据插入完成（正常2个、边界1个、高风险1个）');

    const creditStmt = db.prepare(`
      INSERT OR IGNORE INTO credit_approvals (farmer_id, cooperative_id, crop_cycle, product_category,
        requested_amount, approved_amount, used_amount, available_amount, validity_start, validity_end,
        risk_tags, approval_status, approver_id, approval_notes, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?, CURRENT_TIMESTAMP)
    `);

    creditStmt.run(
      1, 1, '2024年夏播', '化肥农药', 50000, 50000, 0, 50000,
      '2024-06-01', '2024-12-31', '低风险,担保足额', '合作社担保,额度充足'
    );
    creditStmt.run(
      2, 1, '2024年夏播', '化肥', 30000, 20000, 20000, 0,
      '2024-06-01', '2024-12-31', '中风险,无担保', '无担保,缩减额度'
    );
    creditStmt.run(
      3, 2, '2024年秋种', '种子化肥农药', 100000, 80000, 30000, 50000,
      '2024-09-01', '2025-06-30', '低风险,规模种植', '优质农户,大额授信'
    );
    console.log('✓ 授信审批数据插入完成（含额度用尽边界案例）');

    const productStmt = db.prepare(`
      INSERT OR IGNORE INTO products (name, category, specification, unit, price, store_id, stock_quantity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    productStmt.run('尿素', '化肥', '40kg/袋', '袋', 120, 1, 500);
    productStmt.run('复合肥', '化肥', '50kg/袋', '袋', 180, 1, 300);
    productStmt.run('小麦种子', '种子', '25kg/袋', '袋', 150, 1, 200);
    productStmt.run('草甘膦', '农药', '1L/瓶', '瓶', 45, 1, 100);
    productStmt.run('玉米种子', '种子', '2kg/袋', '袋', 60, 2, 400);
    productStmt.run('磷酸二铵', '化肥', '50kg/袋', '袋', 200, 2, 250);
    console.log('✓ 商品数据插入完成');

    const orderStmt = db.prepare(`
      INSERT OR IGNORE INTO orders (order_no, farmer_id, store_id, credit_approval_id, total_amount,
        account_period_days, due_date, signed_by_farmer, signed_at, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?)
    `);

    const orderItemStmt = db.prepare(`
      INSERT OR IGNORE INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    orderStmt.run('ORD20240601001', 1, 1, 1, 24000, 180, '2024-11-28', 'completed', '正常订单-尿素200袋');
    orderItemStmt.run(1, 1, '尿素', 200, 120, 24000);

    orderStmt.run('ORD20240602001', 2, 1, 2, 20000, 180, '2024-11-29', 'completed', '额度用尽边界订单');
    orderItemStmt.run(2, 2, '复合肥', 100, 180, 18000);
    orderItemStmt.run(2, 4, '草甘膦', 44.44, 45, 2000);

    orderStmt.run('ORD20240915001', 3, 2, 3, 30000, 270, '2025-06-13', 'active', '大额订单-跨作物周期');
    orderItemStmt.run(3, 5, '玉米种子', 100, 60, 6000);
    orderItemStmt.run(3, 6, '磷酸二铵', 120, 200, 24000);
    console.log('✓ 订单数据插入完成（正常、边界、大额三类）');

    const repaymentStmt = db.prepare(`
      INSERT OR IGNORE INTO repayments (repayment_no, order_id, farmer_id, total_amount, paid_amount,
        remaining_amount, due_date, actual_paid_date, status, is_overdue, overdue_days, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const recordStmt = db.prepare(`
      INSERT OR IGNORE INTO repayment_records (repayment_id, amount, payment_method, payment_date, operator, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    repaymentStmt.run('REP20241128001', 1, 1, 24000, 24000, 0, '2024-11-28', '2024-11-25', 'paid', 0, 0, '提前还款');
    recordStmt.run(1, 24000, '银行转账', '2024-11-25', '财务小张', '正常结清');

    repaymentStmt.run('REP20241129001', 2, 2, 20000, 10000, 10000, '2024-11-29', '2024-11-28', 'partial', 0, 0, '部分还款');
    recordStmt.run(2, 10000, '现金', '2024-11-28', '财务小李', '第一期还款');

    repaymentStmt.run('REP20250613001', 3, 3, 30000, 0, 30000, '2025-06-13', null, 'pending', 0, 0, '未到期');

    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 15);
    const dueDateStr = pastDueDate.toISOString().split('T')[0];
    
    repaymentStmt.run('REP20240501001', 2, 2, 5000, 0, 5000, dueDateStr, null, 'overdue', 1, 15, '逾期15天-冲突测试用');
    console.log('✓ 还款数据插入完成（正常结清、部分还款、未到期、逾期四类）');

    const collectionStmt = db.prepare(`
      INSERT OR IGNORE INTO collection_tasks (repayment_id, farmer_id, assignee, task_status, priority, 
        last_contact_date, contact_result, next_followup_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    collectionStmt.run(4, 2, '催收员小王', 'in_progress', 'high', 
      new Date().toISOString().split('T')[0], '承诺一周内还款', 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      '逾期15天，第二次催收');
    console.log('✓ 催收任务数据插入完成');

    console.log('\n=== 测试数据分类说明 ===');
    console.log('📋 正常样例:');
    console.log('  - 农户张三: 低风险+750分+合作社担保');
    console.log('  - 授信审批ID=1: 5万足额审批');
    console.log('  - 订单ORD20240601001: 正常完成订单');
    console.log('  - 还款REP20241128001: 提前结清');
    console.log('');
    console.log('📏 边界样例:');
    console.log('  - 农户李四: 620分临界点+历史逾期3天');
    console.log('  - 授信审批ID=2: 2万额度已用尽');
    console.log('  - 订单ORD20240602001: 刚好用尽全部额度');
    console.log('  - 还款REP20241129001: 50%部分还款');
    console.log('');
    console.log('⚔️ 冲突样例:');
    console.log('  - 授信额度用尽后创建新订单应被拦截');
    console.log('  - 逾期农户申请新授信应被拒绝');
    console.log('  - 还款REP20240501001: 已逾期15天(冲突状态)');
    console.log('');
    console.log('❌ 失败样例:');
    console.log('  - 农户赵六: 450分高风险+超30天逾期记录');
    console.log('  - 超额度创建订单应失败');
    console.log('  - 无效农户ID创建订单应失败');
    console.log('');
    console.log('=== 测试数据初始化完成 ===');
    console.log('导出核对: 可执行 SELECT * FROM 表名 查看具体数据');
  });

  tx();
};

initTestData();
db.close();
