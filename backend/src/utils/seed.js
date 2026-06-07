const { db } = require('./database');
const bcrypt = require('bcryptjs');

function seedData() {
  const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get().count;
  if (orgCount > 0) {
    console.log('种子数据已存在，跳过初始化');
    return;
  }

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO organizations (name, type, parent_id, address, contact) VALUES 
      ('省燃气集团有限公司', 'province', NULL, '省会城市燃气大厦', '400-888-0001'),
      ('市第一分公司', 'branch', 1, '市中区文化路100号', '0531-88880001'),
      ('市第二分公司', 'branch', 1, '历下区解放路200号', '0531-88880002'),
      ('历下区服务站', 'station', 2, '历下区历山路150号', '0531-88881001'),
      ('市中区服务站', 'station', 2, '市中区经七路200号', '0531-88881002')`).run();

    const passwordHash = bcrypt.hashSync('123456', 10);

    db.prepare(`INSERT INTO users (username, password, real_name, id_card, phone, email, address, role, org_id, status) VALUES 
      ('admin', ?, '系统管理员', '370101199001010001', '13800000001', 'admin@gas.com', '系统内部', 'admin', 1, 'active'),
      ('operator1', ?, '运营人员张', '370101199002020002', '13800000002', 'op1@gas.com', '公司宿舍', 'operator', 2, 'active'),
      ('grid1', ?, '网格员李', '370101199003030003', '13800000003', 'grid1@gas.com', '历下区小区', 'grid_worker', 4, 'active'),
      ('user1', ?, '测试用户王', '370101199004040004', '13800000004', 'user1@gas.com', '历下区历山路100号1号楼101', 'user', NULL, 'active'),
      ('user2', ?, '测试用户刘', '370101199005050005', '13800000005', 'user2@gas.com', '市中区经七路150号2号楼202', 'user', NULL, 'active')`).run(passwordHash, passwordHash, passwordHash, passwordHash, passwordHash);

    db.prepare(`INSERT INTO user_profiles (user_id, gas_user_no, meter_no, household_type, building_area, population, gas_equipment, bank_account, auto_pay) VALUES 
      (4, 'GS202400001', 'MTR000001', 'residential', 95.5, 3, '燃气热水器,燃气灶', '622202********1234', 1),
      (5, 'GS202400002', 'MTR000002', 'residential', 120.0, 4, '燃气热水器,燃气灶,燃气壁挂炉', NULL, 0)`).run();

    db.prepare(`INSERT INTO meters (meter_no, user_id, location, gis_coords, install_date, last_read_date, last_read_value, status) VALUES 
      ('MTR000001', 4, '历山路100号1号楼101厨房', '117.012345,36.678901', '2020-01-15', '2024-12-01', 2456.5, 'normal'),
      ('MTR000002', 5, '经七路150号2号楼202厨房', '117.023456,36.667890', '2019-06-20', '2024-12-01', 3789.2, 'normal')`).run();

    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const cycle = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const baseVal1 = 2000 + i * 38 + Math.floor(Math.random() * 15);
      const baseVal2 = 3200 + i * 47 + Math.floor(Math.random() * 20);
      
      db.prepare(`INSERT INTO meter_readings (user_id, meter_id, reading_value, reading_type, reading_date, billing_cycle, status, verified_by, verified_at) VALUES 
        (4, 1, ?, 'automatic', ?, ?, 'verified', 2, ?),
        (5, 2, ?, 'automatic', ?, ?, 'verified', 2, ?)`).run(
        baseVal1, date.toISOString().split('T')[0], cycle, date.toISOString(),
        baseVal2, date.toISOString().split('T')[0], cycle, date.toISOString()
      );

      const usage1 = i === 0 ? 38 : (baseVal1 - (2000 + (i - 1) * 38));
      const usage2 = i === 0 ? 47 : (baseVal2 - (3200 + (i - 1) * 47));
      const unitPrice = 3.28;
      
      db.prepare(`INSERT INTO bills (user_id, reading_id, billing_cycle, gas_usage, unit_price, total_amount, pay_amount, status, pay_method, pay_time, auto_pay) VALUES 
        (4, ?, ?, ?, ?, ?, ?, 'paid', 'auto_pay', ?, 1),
        (5, ?, ?, ?, ?, ?, ?, 'paid', 'wechat', ?, 0)`).run(
        i * 2 + 1, cycle, usage1, unitPrice, usage1 * unitPrice, usage1 * unitPrice, date.toISOString(),
        i * 2 + 2, cycle, usage2, unitPrice, usage2 * unitPrice, usage2 * unitPrice, date.toISOString()
      );
    }

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisCycle = `${thisMonth.getFullYear()}${String(thisMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastCycle = `${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const lastReading1 = db.prepare('SELECT id, reading_value FROM meter_readings WHERE user_id = 4 ORDER BY reading_date DESC LIMIT 1').get();
    const lastReading2 = db.prepare('SELECT id, reading_value FROM meter_readings WHERE user_id = 5 ORDER BY reading_date DESC LIMIT 1').get();

    const newReading1 = lastReading1.reading_value + 42 + Math.floor(Math.random() * 10);
    const newReading2 = lastReading2.reading_value + 51 + Math.floor(Math.random() * 12);

    const readingInfo1 = db.prepare(`INSERT INTO meter_readings (user_id, meter_id, reading_value, reading_type, reading_date, billing_cycle, status, verified_by, verified_at) VALUES
      (4, 1, ?, 'automatic', ?, ?, 'verified', 2, ?)`).run(
      newReading1, thisMonth.toISOString().split('T')[0], thisCycle, thisMonth.toISOString()
    );
    const readingInfo2 = db.prepare(`INSERT INTO meter_readings (user_id, meter_id, reading_value, reading_type, reading_date, billing_cycle, status, verified_by, verified_at) VALUES
      (5, 2, ?, 'automatic', ?, ?, 'verified', 2, ?)`).run(
      newReading2, thisMonth.toISOString().split('T')[0], thisCycle, thisMonth.toISOString()
    );

    const newReadingId1 = readingInfo1.lastInsertRowid;
    const newReadingId2 = readingInfo2.lastInsertRowid;

    const usage1 = newReading1 - lastReading1.reading_value;
    const usage2 = newReading2 - lastReading2.reading_value;
    const unitPrice = 3.28;

    db.prepare(`INSERT INTO bills (user_id, reading_id, billing_cycle, gas_usage, unit_price, total_amount, pay_amount, status, pay_method, pay_time, auto_pay) VALUES
      (4, ?, ?, ?, ?, ?, ?, 'unpaid', NULL, NULL, 1),
      (5, ?, ?, ?, ?, ?, ?, 'unpaid', NULL, NULL, 0)`).run(
      newReadingId1, thisCycle, usage1, unitPrice, usage1 * unitPrice, usage1 * unitPrice,
      newReadingId2, thisCycle, usage2, unitPrice, usage2 * unitPrice, usage2 * unitPrice
    );

    const avgUsage1 = 40;
    if (usage1 > avgUsage1 * 1.5) {
      db.prepare(`INSERT INTO usage_anomalies (user_id, anomaly_type, detected_date, current_usage, expected_usage, deviation_percent, historical_data, status, notified_at) VALUES
        (4, 'sudden_increase', ?, ?, ?, ?, ?, 'notified', ?)`).run(
        thisMonth.toISOString().split('T')[0],
        usage1,
        avgUsage1,
        Math.round((usage1 - avgUsage1) / avgUsage1 * 100),
        JSON.stringify({ billing_cycle: thisCycle, meter_id: 1 }),
        thisMonth.toISOString()
      );
    }

    db.prepare(`INSERT INTO notification_logs (user_id, type, title, content, read, created_at) VALUES
      (4, 'bill', '新账单提醒', ? || '月账单已出，应缴金额' || round(? * ?, 2) || '元', 0, ?),
      (4, 'safety', '安全检查提醒', '冬季用气高峰，请检查燃气胶管是否老化，确保用气安全', 0, ?),
      (5, 'bill', '新账单提醒', ? || '月账单已出，应缴金额' || round(? * ?, 2) || '元', 0, ?)`).run(
      thisMonth.getMonth() + 1, usage1, unitPrice, thisMonth.toISOString(),
      thisMonth.toISOString(),
      thisMonth.getMonth() + 1, usage2, unitPrice, thisMonth.toISOString()
    );

    db.prepare(`INSERT INTO auto_pay_agreements (user_id, bank_name, bank_account, account_name, id_card, monthly_limit, status, signed_at) VALUES 
      (4, '中国工商银行', '622202********1234', '王', '370101199004040004', 500.0, 'active', '2023-01-01')`).run();

    db.prepare(`INSERT INTO work_orders (order_no, user_id, type, title, description, location, priority, status, assigned_to, assign_time, sla_due_time, created_at) VALUES 
      ('WO20241200001', 4, 'repair', '燃气灶打不着火', '昨天开始燃气灶左侧炉头打不着火，右侧正常', '历山路100号1号楼101', 'normal', 'completed', 3, datetime('now','-2 days'), datetime('now','-1 days'), datetime('now','-3 days')),
      ('WO20241200002', 5, 'install', '申请安装燃气报警器', '希望在厨房安装燃气报警器', '经七路150号2号楼202', 'low', 'assigned', 3, datetime('now','-1 day'), datetime('now','+2 days'), datetime('now','-2 days')),
      ('WO20241200003', 4, 'complaint', '缴费后仍显示欠费', '昨天通过微信缴费500元，但账户仍显示欠费', '线上', 'high', 'pending', NULL, NULL, datetime('now','+1 day'), datetime('now'))`).run();

    db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark) VALUES 
      (1, 2, 'assign', '指派给网格员李处理'),
      (1, 3, 'start', '已上门开始处理'),
      (1, 3, 'complete', '更换点火针后恢复正常'),
      (1, 4, 'review', '用户评价：5星，服务很好'),
      (2, 2, 'assign', '指派给网格员李处理')`).run();

    db.prepare(`INSERT INTO products (sku, name, category, brand, price, original_price, stock, description, specs, warranty_months, is_new, is_hot, status) VALUES 
      ('SKU001', '嵌入式燃气灶（双眼）', 'gas_appliance', '万家乐', 1299.00, 1599.00, 50, '钢化玻璃面板，4.5KW大火力，一级能效', '{"尺寸":"750x430x150mm","热负荷":"4.5KW","能效等级":"一级"}', 36, 1, 1, 'online'),
      ('SKU002', '13升燃气热水器', 'gas_appliance', '美的', 1899.00, 2299.00, 30, '智能恒温，低压启动，一级能效', '{"容量":"13L","能效等级":"一级","点火方式":"电子脉冲"}', 36, 0, 1, 'online'),
      ('SKU003', '燃气壁挂炉24KW', 'gas_appliance', '海尔', 6999.00, 7999.00, 15, '采暖热水两用，智能温控，节能环保', '{"功率":"24KW","适用面积":"80-150㎡","能效等级":"二级"}', 24, 1, 0, 'online'),
      ('SKU004', '家用燃气报警器', 'gas_appliance', '霍尼韦尔', 299.00, 399.00, 100, '天然气泄漏检测，声光报警，联动电磁阀', '{"检测气体":"天然气","报警方式":"声光+联动","电源":"AC220V"}', 12, 1, 1, 'online'),
      ('SKU005', '55寸智能电视', 'home_appliance', '海信', 2999.00, 3499.00, 20, '4K超高清，AI智能语音，超薄全面屏', '{"尺寸":"55寸","分辨率":"3840x2160","内存":"2GB+16GB"}', 12, 0, 0, 'online'),
      ('SKU006', '对开门冰箱550L', 'home_appliance', '容声', 3599.00, 4299.00, 18, '风冷无霜，变频节能，大容量存储', '{"容量":"550L","制冷方式":"风冷","能效等级":"一级"}', 12, 1, 0, 'online'),
      ('SKU007', '章丘铁锅', 'local_specialty', '章丘', 399.00, 499.00, 50, '传统手工锻造，无涂层，物理不粘', '{"直径":"32cm","材质":"精铁","工艺":"手工锻造"}', 12, 1, 1, 'online'),
      ('SKU008', '龙山小米2.5kg', 'local_specialty', '龙山', 68.00, 88.00, 200, '国家地理标志产品，米油丰富，营养健康', '{"重量":"2.5kg","产地":"山东章丘","保质期":"12个月"}', 6, 0, 1, 'online'),
      ('SKU009', '阿胶糕500g', 'local_specialty', '东阿阿胶', 298.00, 368.00, 80, '正宗东阿阿胶，手工熬制，滋补养生', '{"重量":"500g","保质期":"18个月","食用方法":"开袋即食"}', 12, 0, 0, 'online')`).run();

    db.prepare(`INSERT INTO product_orders (order_no, user_id, product_id, quantity, unit_price, total_amount, status, receiver_name, receiver_phone, receiver_address, pay_time, ship_time, deliver_time, warranty_no) VALUES 
      ('PO20241200001', 4, 1, 1, 1299.00, 1299.00, 'delivered', '王', '13800000004', '历下区历山路100号1号楼101', datetime('now','-5 days'), datetime('now','-4 days'), datetime('now','-2 days'), 'WR202412001')`).run();

    db.prepare(`INSERT INTO warranties (warranty_no, order_id, product_id, user_id, start_date, end_date, status, terms) VALUES 
      ('WR202412001', 1, 1, 4, date('now','-2 days'), date('now','+3 years'), 'active', '整机保修3年，主要部件保修5年')`).run();

    db.prepare(`INSERT INTO safety_knowledge (title, category, content, ar_asset_path, step_by_step, sort_order, status) VALUES 
      ('燃气泄漏应急处置', 'leak', '发现燃气泄漏时，请立即：1. 打开门窗通风；2. 关闭燃气总阀；3. 不要开关任何电器；4. 不要使用明火；5. 到室外安全地带拨打燃气公司报警电话。', '/ar/leak-guide.glb', '["打开门窗","关闭燃气阀","撤离现场","室外报警"]', 1, 'published'),
      ('如何检查燃气泄漏', 'leak', '日常检漏方法：1. 闻气味，天然气中添加了臭剂，泄漏时有明显臭味；2. 用肥皂水涂抹管道接口，如有气泡说明泄漏；3. 观察燃气表，不用气时指针是否走动。', NULL, '["闻气味","肥皂水检漏","观察燃气表"]', 2, 'published'),
      ('AR泄漏处置指引', 'ar_guide', '通过AR技术模拟燃气泄漏处置流程，让您身临其境学习正确的处置方法。', '/ar/leak-simulation.glb', '["启动AR","识别环境","虚拟操作","完成演练"]', 3, 'published'),
      ('燃气火灾处置', 'fire', '发生燃气火灾时：1. 如小火，可用干粉灭火器扑救；2. 关闭气源；3. 如火势较大，立即撤离并拨打119。', NULL, '["小火扑救","关闭气源","撤离报警"]', 4, 'published'),
      ('日常安全用气须知', 'daily', '1. 使用燃气时有人照看；2. 用完燃气关闭灶前阀；3. 定期检查胶管，老化及时更换；4. 保持通风良好；5. 安装燃气报警器。', NULL, '["使用时照看","用完关阀","定期检查","保持通风"]', 5, 'published')`).run();

    db.prepare(`INSERT INTO usage_anomalies (user_id, anomaly_type, detected_date, current_usage, expected_usage, deviation_percent, historical_data, status, notified_at) VALUES 
      (4, 'sudden_increase', '2024-11-01', 85, 40, 112.5, '{"history":[38,42,35,40,45,38,85]}', 'notified', datetime('now','-30 days')),
      (5, 'abnormal_pattern', '2024-10-01', 15, 48, -68.75, '{"history":[50,48,52,45,47,15,48]}', 'resolved', datetime('now','-60 days'))`).run();

    db.prepare(`INSERT INTO grid_collaborations (grid_worker_id, user_id, task_type, title, description, status, scheduled_date, completed_date, result) VALUES 
      (3, 4, 'safety_check', '季度安全检查', '对用户家中燃气设施进行安全检查', 'completed', '2024-12-01', '2024-12-01', '检查正常，胶管状态良好'),
      (3, 5, 'follow_up', '异常用量跟进', '上月用量异常偏低，上门核实', 'completed', '2024-10-05', '2024-10-05', '用户全家外出旅游，已确认无异常')`).run();
  });

  try {
    tx();
    console.log('种子数据初始化成功');
  } catch (err) {
    console.error('种子数据初始化失败:', err);
    throw err;
  }
}

module.exports = { seedData };
