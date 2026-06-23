import type { Database as DbType } from 'better-sqlite3';
type Database = DbType;
import bcrypt from 'bcrypt';
import crypto from 'crypto';

function generateId(): string {
  return crypto.randomUUID();
}

function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function seedDatabase(db: Database) {
  const insert = db.transaction(() => {
    const now = new Date();

    const outlets = [
      { id: generateId(), name: '中心网点', address: '北京市朝阳区建国路88号', contact: '张经理', phone: '13800138001', status: 'active' },
      { id: generateId(), name: '东区分部', address: '北京市东城区王府井大街138号', contact: '李主管', phone: '13800138002', status: 'active' },
      { id: generateId(), name: '西区分部', address: '北京市海淀区中关村大街1号', contact: '王站长', phone: '13800138003', status: 'active' },
    ];

    const insertOutlet = db.prepare(
      'INSERT INTO outlets (id, name, address, contact, phone, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    outlets.forEach(outlet => {
      insertOutlet.run(outlet.id, outlet.name, outlet.address, outlet.contact, outlet.phone, outlet.status, formatDate(now));
    });

    const users = [
      { id: generateId(), username: 'courier1', password: hashPasswordSync('courier123'), name: '张三', phone: '13900139001', role: 'courier', outletId: outlets[0].id, certificationStatus: 'approved' },
      { id: generateId(), username: 'courier2', password: hashPasswordSync('courier123'), name: '李四', phone: '13900139002', role: 'courier', outletId: outlets[1].id, certificationStatus: 'approved' },
      { id: generateId(), username: 'courier3', password: hashPasswordSync('courier123'), name: '王五', phone: '13900139003', role: 'courier', outletId: outlets[2].id, certificationStatus: 'approved' },
      { id: generateId(), username: 'admin1', password: hashPasswordSync('admin123'), name: '赵管理员', phone: '13900139004', role: 'admin', outletId: outlets[0].id, certificationStatus: 'approved' },
      { id: generateId(), username: 'admin2', password: hashPasswordSync('admin123'), name: '钱管理员', phone: '13900139005', role: 'admin', outletId: outlets[1].id, certificationStatus: 'approved' },
      { id: generateId(), username: 'admin3', password: hashPasswordSync('admin123'), name: '孙管理员', phone: '13900139006', role: 'admin', outletId: outlets[2].id, certificationStatus: 'approved' },
      { id: generateId(), username: 'operator1', password: hashPasswordSync('operator123'), name: '周运营', phone: '13900139007', role: 'operator', certificationStatus: 'approved' },
      { id: generateId(), username: 'operator2', password: hashPasswordSync('operator123'), name: '吴运营', phone: '13900139008', role: 'operator', certificationStatus: 'approved' },
      { id: generateId(), username: 'courier4', password: hashPasswordSync('courier123'), name: '郑六', phone: '13900139009', role: 'courier', outletId: outlets[0].id, certificationStatus: 'approved' },
    ];

    const insertUser = db.prepare(
      'INSERT INTO users (id, username, password_hash, name, phone, role, outlet_id, certification_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    users.forEach(user => {
      insertUser.run(user.id, user.username, user.password, user.name, user.phone, user.role, user.outletId || null, user.certificationStatus, formatDate(now));
    });

    const courierUsers = users.filter(u => u.role === 'courier');
    const orderStatuses = ['created', 'assigned', 'picked', 'printed', 'shipped', 'completed', 'cancelled'];
    const taskStatuses = ['pending', 'assigned', 'picked', 'in_transit', 'completed', 'exception', 'cancelled'];
    const itemTypes = ['文件', '服装', '电子产品', '食品', '家居用品', '图书', '化妆品', '其他'];

    const orders: any[] = [];
    const tasks: any[] = [];

    for (let i = 0; i < 20; i++) {
      const orderId = generateId();
      const taskId = generateId();
      const orderNo = `ORD${Date.now()}${String(i).padStart(4, '0')}`;
      const taskNo = `TASK${Date.now()}${String(i).padStart(4, '0')}`;
      const pickupCode = String(Math.floor(100000 + Math.random() * 900000));
      const outletIndex = i % 3;
      const courier = courierUsers[i % courierUsers.length];
      const isToday = i < 12;
      const daysAgo = isToday ? 0 : Math.floor(Math.random() * 6) + 1;
      const orderDate = addDays(now, -daysAgo);
      const baseHour = isToday ? (8 + (i % 10)) : (2 + Math.floor(Math.random() * 6));
      const appointmentTime = addHours(orderDate, baseHour);
      const statusIndex = i < 5 ? 0 : i < 10 ? 1 : i < 15 ? 2 : 3;

      const order = {
        id: orderId,
        orderNo,
        senderName: `寄件人${i + 1}`,
        senderPhone: `136001360${String(i).padStart(2, '0')}`,
        senderProvince: '北京市',
        senderCity: '北京市',
        senderDistrict: ['朝阳区', '海淀区', '东城区', '西城区'][i % 4],
        senderAddress: `某某街道${i + 1}号小区${i + 1}栋${i + 1}单元`,
        receiverName: `收件人${i + 1}`,
        receiverPhone: `137001370${String(i).padStart(2, '0')}`,
        receiverProvince: ['上海市', '广东省', '浙江省', '江苏省'][i % 4],
        receiverCity: ['上海市', '广州市', '杭州市', '南京市'][i % 4],
        receiverDistrict: ['浦东新区', '天河区', '西湖区', '鼓楼区'][i % 4],
        receiverAddress: `收货地址${i + 1}号`,
        itemType: itemTypes[i % itemTypes.length],
        estimatedWeight: Number((0.5 + Math.random() * 10).toFixed(2)),
        actualWeight: statusIndex >= 2 ? Number((0.5 + Math.random() * 10).toFixed(2)) : null,
        appointmentTime: formatDate(appointmentTime),
        pickupCode,
        status: orderStatuses[statusIndex],
        createdAt: formatDate(orderDate),
        updatedAt: formatDate(orderDate),
      };
      orders.push(order);

      const taskStatus = taskStatuses[statusIndex];
      const task = {
        id: taskId,
        taskNo,
        orderId,
        orderNo,
        courierId: courier.id,
        courierName: courier.name,
        outletId: outlets[outletIndex].id,
        pickupCode,
        senderAddress: `${order.senderProvince}${order.senderCity}${order.senderDistrict}${order.senderAddress}`,
        senderPhone: order.senderPhone,
        itemType: order.itemType,
        estimatedWeight: order.estimatedWeight,
        actualWeight: order.actualWeight,
        appointmentTime: formatDate(appointmentTime),
        status: taskStatus,
        weightCheckRule: 'tolerance',
        weightTolerance: 0.5,
        freight: statusIndex >= 2 ? Number((8 + order.estimatedWeight * 2).toFixed(2)) : null,
        paymentMethod: statusIndex >= 2 ? ['wechat', 'alipay', 'cash'][i % 3] : null,
        waybillNo: statusIndex >= 3 ? `SF${Date.now()}${String(i).padStart(6, '0')}` : null,
        printedAt: statusIndex >= 3 ? formatDate(addHours(appointmentTime, 1)) : null,
        synced: true,
        pickedAt: statusIndex >= 2 ? formatDate(addHours(appointmentTime, 0.5)) : null,
        completedAt: statusIndex >= 5 ? formatDate(addHours(appointmentTime, 4)) : null,
        createdAt: formatDate(orderDate),
        updatedAt: formatDate(orderDate),
      };
      tasks.push(task);
    }

    const insertOrder = db.prepare(
      `INSERT INTO orders (id, order_no, sender_name, sender_phone, sender_province, sender_city, sender_district, sender_address,
       receiver_name, receiver_phone, receiver_province, receiver_city, receiver_district, receiver_address,
       item_type, estimated_weight, actual_weight, appointment_time, pickup_code, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    orders.forEach(order => {
      insertOrder.run(
        order.id, order.orderNo, order.senderName, order.senderPhone, order.senderProvince, order.senderCity,
        order.senderDistrict, order.senderAddress, order.receiverName, order.receiverPhone, order.receiverProvince,
        order.receiverCity, order.receiverDistrict, order.receiverAddress, order.itemType, order.estimatedWeight,
        order.actualWeight, order.appointmentTime, order.pickupCode, order.status, order.createdAt, order.updatedAt
      );
    });

    const insertTask = db.prepare(
      `INSERT INTO pickup_tasks (id, task_no, order_id, order_no, courier_id, outlet_id, pickup_code,
       sender_address, sender_phone, item_type, estimated_weight, actual_weight, appointment_time, weight_check_rule,
       weight_tolerance, freight, payment_method, waybill_no, printed_at, status, synced, picked_at, completed_at,
       created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    tasks.forEach(task => {
      insertTask.run(
        task.id, task.taskNo, task.orderId, task.orderNo, task.courierId, task.outletId,
        task.pickupCode, task.senderAddress, task.senderPhone, task.itemType, task.estimatedWeight, task.actualWeight,
        task.appointmentTime, task.weightCheckRule, task.weightTolerance, task.freight, task.paymentMethod,
        task.waybillNo, task.printedAt, task.status, task.synced ? 1 : 0, task.pickedAt, task.completedAt,
        task.createdAt, task.updatedAt
      );
    });

    const insertWaybillAccount = db.prepare(
      `INSERT INTO waybill_accounts (id, outlet_id, outlet_name, balance, frozen_balance, total_recharged, total_used,
       template_id, template_name, paper_size, font_size, show_logo, low_balance_threshold, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    outlets.forEach((outlet, index) => {
      const balance = 5000 - index * 1000;
      insertWaybillAccount.run(
        generateId(), outlet.id, outlet.name, balance, 0, 10000, 10000 - balance,
        'tpl001', '标准模板', '100x150', 'medium', 1, 500, formatDate(now), formatDate(now)
      );
    });

    const insertRechargeRecord = db.prepare(
      `INSERT INTO recharge_records (id, account_id, amount, payment_method, transaction_id, status, operator_id,
       operator_name, remark, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < 8; i++) {
      const outlet = outlets[i % 3];
      const account = db.prepare('SELECT id FROM waybill_accounts WHERE outlet_id = ?').get(outlet.id) as any;
      const amount = [1000, 2000, 500, 3000][i % 4];
      const rechargeDate = addDays(now, -(i + 1));
      insertRechargeRecord.run(
        generateId(), account.id, amount, ['wechat', 'alipay', 'bank'][i % 3],
        `TXN${Date.now()}${i}`, 'success', users[6].id, users[6].name,
        `充值${amount}元`, formatDate(rechargeDate), formatDate(addHours(rechargeDate, 0.1))
      );
    }

    const messageTypes = ['pickup_reminder', 'balance_alert', 'suspension_notice', 'system_announcement', 'exception_alert'];
    const messages = [
      { type: 'pickup_reminder', title: '新任务提醒', content: '您有3个新的揽收任务待处理，请及时查看。', targetCourierId: courierUsers[0].id },
      { type: 'pickup_reminder', title: '任务即将超时', content: '任务TASK001即将超过预约时间，请尽快处理。', targetCourierId: courierUsers[0].id },
      { type: 'balance_alert', title: '余额不足提醒', content: '您的电子面单账户余额不足500元，请及时充值。', targetOutletId: outlets[0].id },
      { type: 'system_announcement', title: '系统维护通知', content: '系统将于今晚22:00-24:00进行维护升级，请提前做好准备。' },
      { type: 'exception_alert', title: '异常任务提醒', content: '任务TASK005出现异常：客户不在家，请重新预约时间。', targetCourierId: courierUsers[1].id },
      { type: 'pickup_reminder', title: '新任务提醒', content: '您有2个新的揽收任务待处理。', targetCourierId: courierUsers[1].id },
      { type: 'pickup_reminder', title: '新任务提醒', content: '您有5个新的揽收任务待处理。', targetCourierId: courierUsers[2].id },
      { type: 'balance_alert', title: '余额不足提醒', content: '西区分部面单账户余额不足，请及时充值。', targetOutletId: outlets[2].id },
      { type: 'system_announcement', title: '新规通知', content: '自即日起，所有电子产品需额外进行安检。' },
      { type: 'suspension_notice', title: '账号风控提醒', content: '检测到异常登录行为，请确认是否为本人操作。', targetCourierId: courierUsers[0].id },
      { type: 'exception_alert', title: '重量异常提醒', content: '任务TASK008称重重量与预估差异超过20%，请核实。', targetCourierId: courierUsers[0].id },
      { type: 'pickup_reminder', title: '预约提醒', content: '您明天上午有3个预约揽收任务，请合理安排时间。', targetCourierId: courierUsers[1].id },
      { type: 'system_announcement', title: '功能更新', content: '面单打印功能已优化，支持自定义模板。' },
      { type: 'balance_alert', title: '充值成功', content: '您的账户已成功充值2000元，当前余额2500元。', targetOutletId: outlets[1].id },
      { type: 'pickup_reminder', title: '新任务提醒', content: '您有1个新的揽收任务待处理。', targetCourierId: courierUsers[2].id },
    ];

    const insertMessage = db.prepare(
      `INSERT INTO messages (id, type, title, content, target_role, target_outlet_id, target_courier_id,
       related_id, related_type, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    messages.forEach((msg, index) => {
      insertMessage.run(
        generateId(), msg.type, msg.title, msg.content, null,
        msg.targetOutletId || null, msg.targetCourierId || null,
        null, null, index > 10 ? 1 : 0, formatDate(addDays(now, -(index % 5)))
      );
    });

    const insertDailyFinance = db.prepare(
      `INSERT INTO daily_finances (id, date, outlet_id, outlet_name, total_orders, total_weight,
       total_freight, waybill_cost, platform_fee, net_income, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let day = 0; day < 30; day++) {
      const financeDate = addDays(now, -day);
      const dateStr = formatDateOnly(financeDate);
      
      outlets.forEach((outlet, outletIndex) => {
        const orderCount = Math.floor(Math.random() * 15) + 5;
        const totalWeight = Number((orderCount * (1 + Math.random() * 3)).toFixed(2));
        const totalFreight = Number((orderCount * (10 + Math.random() * 20)).toFixed(2));
        const waybillCost = Number((orderCount * 1.5).toFixed(2));
        const platformFee = Number((totalFreight * 0.1).toFixed(2));
        const netIncome = Number((totalFreight - waybillCost - platformFee).toFixed(2));

        const detail = JSON.stringify(
          Array.from({ length: Math.min(orderCount, 5) }, (_, i) => ({
            taskId: generateId(),
            orderNo: `ORD${day}${outletIndex}${i}`,
            weight: Number((0.5 + Math.random() * 5).toFixed(2)),
            freight: Number((8 + Math.random() * 20).toFixed(2)),
            waybillCost: 1.5,
            platformFee: Number((1 * 0.1).toFixed(2)),
          }))
        );

        insertDailyFinance.run(
          generateId(), dateStr, outlet.id, outlet.name, orderCount, totalWeight,
          totalFreight, waybillCost, platformFee, netIncome, detail
        );
      });
    }

    const insertBankCard = db.prepare(
      `INSERT INTO bank_cards (id, outlet_id, bank_name, bank_branch, card_number, card_holder, phone,
       is_default, verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const banks = [
      { bankName: '中国工商银行', bankBranch: '北京朝阳支行' },
      { bankName: '中国建设银行', bankBranch: '北京中关村支行' },
      { bankName: '招商银行', bankBranch: '北京王府井支行' },
    ];
    outlets.forEach((outlet, outletIndex) => {
      for (let i = 0; i < 2; i++) {
        const bank = banks[(outletIndex * 2 + i) % banks.length];
        insertBankCard.run(
          generateId(), outlet.id, bank.bankName, bank.bankBranch,
          `622202****${String(1000 + outletIndex * 10 + i)}`,
          `${outlet.name}财务`, `138001380${String(10 + outletIndex * 2 + i).padStart(2, '0')}`,
          i === 0 ? 1 : 0, 1, formatDate(now)
        );
      }
    });

    const insertWithdrawRecord = db.prepare(
      `INSERT INTO withdraw_records (id, outlet_id, bank_card_id, amount, bank_name, card_number, card_holder,
       status, auditor_id, auditor_name, audit_remark, transfer_transaction_id, applicant_id, applicant_name,
       created_at, audited_at, transferred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const withdrawStatuses: any[] = ['pending', 'approved', 'transferred', 'rejected', 'approved'];
    for (let i = 0; i < 10; i++) {
      const outlet = outlets[i % 3];
      const card = db.prepare('SELECT id, bank_name, card_number, card_holder FROM bank_cards WHERE outlet_id = ? ORDER BY is_default DESC').get(outlet.id) as any;
      const amount = [1000, 2000, 500, 3000, 1500][i % 5];
      const status = withdrawStatuses[i % withdrawStatuses.length];
      const withdrawDate = addDays(now, -(i + 1));
      const adminUser = users.find(u => u.role === 'admin' && u.outletId === outlet.id) || users[3];

      insertWithdrawRecord.run(
        generateId(), outlet.id, card.id, amount, card.bank_name, card.card_number, card.card_holder,
        status,
        status !== 'pending' ? users[6].id : null,
        status !== 'pending' ? users[6].name : null,
        status === 'rejected' ? '财务信息不完整，请补充' : (status !== 'pending' ? '审核通过' : null),
        status === 'transferred' ? `TRF${Date.now()}${i}` : null,
        adminUser.id, adminUser.name,
        formatDate(withdrawDate),
        status !== 'pending' ? formatDate(addHours(withdrawDate, 2)) : null,
        status === 'transferred' ? formatDate(addHours(withdrawDate, 24)) : null
      );
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const insertPrintLog = db.prepare(
      `INSERT INTO print_logs (id, task_id, waybill_no, printer_name, paper_size, printed_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    completedTasks.slice(0, 5).forEach((task, i) => {
      insertPrintLog.run(
        generateId(), task.id, task.waybillNo, 'Printer-001', '100x150',
        task.courierId || users[0].id, task.printedAt || formatDate(now)
      );
    });
  });

  insert();
  console.log('数据库初始化完成');
}
