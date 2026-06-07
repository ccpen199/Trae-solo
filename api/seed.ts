import db from './db.js';
import bcrypt from 'bcryptjs';

const tollStations = [
  '北京南收费站', '上海虹桥收费站', '广州天河收费站', '深圳福田收费站',
  '成都绕城东收费站', '杭州萧山收费站', '武汉汉口收费站', '西安雁塔收费站',
  '南京江宁收费站', '苏州工业园收费站', '无锡东收费站', '常州北收费站',
  '济南西收费站', '青岛胶州湾收费站', '天津塘沽收费站', '重庆九龙坡收费站',
  '郑州新区收费站', '长沙雨花收费站', '沈阳苏家屯收费站', '哈尔滨绕城收费站',
];

const manufacturers = ['华为', '中兴', '大唐电信', '东信和平', '握奇数据', '金溢科技'];
const obuModels = ['OBU-Pro-2024', 'Smart-OBU-X1', 'ETC-Plus-V3', 'Mini-OBU-S2', 'Ultra-OBU-5G'];
const carBrands = ['大众', '丰田', '本田', '别克', '奥迪', '奔驰', '宝马', '比亚迪', '特斯拉', '吉利'];
const carColors = ['黑色', '白色', '银色', '灰色', '蓝色', '红色', '金色', '棕色'];
const provinces = ['京', '沪', '粤', '苏', '浙', '鲁', '川', '鄂', '湘', '豫', '冀', '津', '渝', '辽', '黑'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function padZero(num: number, length: number): string {
  return String(num).padStart(length, '0');
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function dateFromNow(days: number, hours = 0, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function randomPlate(): string {
  const province = randomItem(provinces);
  const letter = String.fromCharCode(65 + randomInt(0, 25));
  const digits = padZero(randomInt(0, 99999), 5);
  return `${province}${letter}${digits}`;
}

export function seedData(): void {
  const tx = db.transaction(() => {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 1) return;

    const hash123 = bcrypt.hashSync('123456', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone, email, fleet_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const userIds: number[] = [];
    const users = [
      { username: 'operation', role: 'operation', name: '运营小王', phone: '13800000001', email: 'operation@etc.com', fleetId: null },
      { username: 'maintenance', role: 'maintenance', name: '运维小李', phone: '13800000002', email: 'maintenance@etc.com', fleetId: null },
      { username: 'fleet_admin', role: 'fleet_admin', name: '车队老张', phone: '13800000003', email: 'fleet@etc.com', fleetId: 1 },
      { username: 'owner', role: 'owner', name: '车主老刘', phone: '13800000004', email: 'owner@etc.com', fleetId: null },
    ];
    for (const u of users) {
      const info = insertUser.run(u.username, hash123, u.role, u.name, u.phone, u.email, u.fleetId);
      userIds.push(Number(info.lastInsertRowid));
    }

    const insertFleet = db.prepare(`
      INSERT INTO fleets (name, code, contact_person, contact_phone, address, vehicle_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const fleets = [
      { name: '华东企业运输车队', code: 'FL-ENT-001', contact: '王经理', phone: '13900000001', addr: '上海市浦东新区张江高科技园区', count: 8 },
      { name: '北方物流运输车队', code: 'FL-LOG-001', contact: '李队长', phone: '13900000002', addr: '北京市顺义区物流园', count: 7 },
      { name: '城市出租车运营公司', code: 'FL-TAXI-001', contact: '赵总', phone: '13900000003', addr: '广州市天河区珠江新城', count: 5 },
    ];
    for (const f of fleets) {
      insertFleet.run(f.name, f.code, f.contact, f.phone, f.addr, f.count);
    }

    db.prepare('UPDATE users SET fleet_id = 1 WHERE username = ?').run('fleet_admin');

    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (plate_number, vehicle_type, vehicle_class, brand, model, color, register_date, fleet_id, owner_id, obu_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const vehicleIds: number[] = [];
    const usedPlates = new Set<string>();

    for (let i = 0; i < 20; i++) {
      let plate: string;
      do {
        plate = randomPlate();
      } while (usedPlates.has(plate));
      usedPlates.add(plate);

      const isTruck = i >= 8;
      const type = isTruck ? 'truck' : 'passenger';
      const vClass = String(isTruck ? randomInt(2, 6) : 1) as '1' | '2' | '3' | '4' | '5' | '6';
      const brand = randomItem(carBrands);
      const model = `${brand}-${isTruck ? 'T' : 'C'}${randomInt(100, 999)}`;
      const color = randomItem(carColors);
      const regDate = formatDate(dateFromNow(randomInt(365, 1095), 0, 0)).slice(0, 10);

      let fleetId: number | null = null;
      let ownerId: number | null = null;

      if (i < 8) {
        fleetId = 1;
      } else if (i < 15) {
        fleetId = 2;
      } else if (i < 20) {
        fleetId = 3;
      }

      if (i >= 18) {
        fleetId = null;
        ownerId = userIds[3];
      }

      const obuId = i < 20 ? i + 1 : null;

      const info = insertVehicle.run(plate, type, vClass, brand, model, color, regDate, fleetId, ownerId, obuId);
      vehicleIds.push(Number(info.lastInsertRowid));
    }

    const insertObu = db.prepare(`
      INSERT INTO obu_devices (sn, manufacturer, model, firmware_version, status, vehicle_id, activated_at, deactivated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const obuIds: number[] = [];
    for (let i = 0; i < 20; i++) {
      const sn = `OBU${padZero(2024, 4)}${padZero(i + 1, 8)}`;
      const manufacturer = randomItem(manufacturers);
      const model = randomItem(obuModels);
      const firmware = `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`;

      let status: 'inventory' | 'activated' | 'deactivated' | 'scrapped';
      let vehicleId: number | null = null;
      let activatedAt: string | null = null;
      let deactivatedAt: string | null = null;

      if (i < 15) {
        status = 'activated';
        vehicleId = vehicleIds[i];
        activatedAt = formatDate(dateFromNow(randomInt(30, 180), 10, 0));
      } else if (i < 17) {
        status = 'deactivated';
        vehicleId = vehicleIds[i];
        activatedAt = formatDate(dateFromNow(randomInt(180, 365), 10, 0));
        deactivatedAt = formatDate(dateFromNow(randomInt(10, 30), 15, 0));
      } else if (i === 19) {
        status = 'scrapped';
        activatedAt = formatDate(dateFromNow(randomInt(365, 730), 10, 0));
        deactivatedAt = formatDate(dateFromNow(randomInt(60, 120), 15, 0));
      } else {
        status = 'inventory';
      }

      const info = insertObu.run(sn, manufacturer, model, firmware, status, vehicleId, activatedAt, deactivatedAt);
      obuIds.push(Number(info.lastInsertRowid));
    }

    const insertTollRecord = db.prepare(`
      INSERT INTO toll_records (
        record_no, vehicle_id, obu_id, toll_station, entry_station, exit_station,
        entry_time, exit_time, mileage, vehicle_type, vehicle_class,
        base_fee, bridge_fee, tunnel_fee, surcharge, discount, paid_amount,
        payment_method, transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tollRecordIds: number[] = [];

    for (let i = 0; i < 500; i++) {
      const daysAgo = randomInt(0, 90);
      const hour = randomInt(6, 22);
      const minute = randomInt(0, 59);

      const vehicleIdx = randomInt(0, vehicleIds.length - 1);
      const vehicleId = vehicleIds[vehicleIdx];
      const vehicle = db.prepare('SELECT vehicle_type, vehicle_class FROM vehicles WHERE id = ?').get(vehicleId) as { vehicle_type: string; vehicle_class: string };

      const entryStation = randomItem(tollStations);
      let exitStation = randomItem(tollStations);
      while (exitStation === entryStation) exitStation = randomItem(tollStations);

      const entryTime = dateFromNow(daysAgo, hour, minute);
      const durationMinutes = randomInt(30, 240);
      const exitTime = new Date(entryTime.getTime() + durationMinutes * 60 * 1000);

      const mileage = randomFloat(20, 500);
      const baseFee = Number((mileage * 0.45).toFixed(2));
      const bridgeFee = Math.random() > 0.6 ? randomFloat(5, 50) : 0;
      const tunnelFee = Math.random() > 0.7 ? randomFloat(3, 30) : 0;
      const surcharge = Math.random() > 0.85 ? randomFloat(2, 15) : 0;
      const discount = Math.random() > 0.5 ? randomFloat(1, 20) : 0;
      const paidAmount = Number((baseFee + bridgeFee + tunnelFee + surcharge - discount).toFixed(2));

      const recordNo = `TOL${new Date().getFullYear()}${padZero(i + 1, 10)}`;
      const txId = `TXN${Date.now()}${padZero(i + 1, 6)}`;

      const obuIdx = vehicleIdx < obuIds.length ? vehicleIdx : 0;

      const info = insertTollRecord.run(
        recordNo, vehicleId, obuIds[obuIdx], randomItem([entryStation, exitStation]),
        entryStation, exitStation,
        formatDate(entryTime), formatDate(exitTime),
        mileage, vehicle.vehicle_type, vehicle.vehicle_class,
        baseFee, bridgeFee, tunnelFee, surcharge, discount, paidAmount,
        'ETC账户', txId
      );
      tollRecordIds.push(Number(info.lastInsertRowid));
    }

    const insertTollTrace = db.prepare(`
      INSERT INTO toll_traces (toll_record_id, gps_longitude, gps_latitude, speed, heading, altitude, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < 20; i++) {
      const recordId = tollRecordIds[i];
      const record = db.prepare('SELECT entry_time FROM toll_records WHERE id = ?').get(recordId) as { entry_time: string };
      const baseTime = new Date(record.entry_time.replace(' ', 'T'));

      const startLng = randomFloat(116.0, 121.5, 6);
      const startLat = randomFloat(30.0, 40.0, 6);

      for (let j = 0; j < 5; j++) {
        const traceTime = new Date(baseTime.getTime() + j * 15 * 60 * 1000);
        insertTollTrace.run(
          recordId,
          startLng + j * randomFloat(0.01, 0.05, 6),
          startLat + j * randomFloat(0.01, 0.05, 6),
          randomFloat(40, 120, 1),
          randomFloat(0, 360, 1),
          randomFloat(5, 500, 1),
          formatDate(traceTime)
        );
      }
    }

    const insertBill = db.prepare(`
      INSERT INTO monthly_bills (
        bill_no, year, month, vehicle_id, owner_id, fleet_id,
        total_trips, total_mileage, total_base_fee, total_bridge_fee,
        total_tunnel_fee, total_surcharge, total_discount, total_amount,
        paid_amount, status, due_date, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date();
    for (let m = 0; m < 3; m++) {
      const billMonth = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = billMonth.getFullYear();
      const month = billMonth.getMonth() + 1;

      for (let v = 0; v < 4; v++) {
        const vehicleId = vehicleIds[v];
        const vehicle = db.prepare('SELECT fleet_id, owner_id FROM vehicles WHERE id = ?').get(vehicleId) as { fleet_id: number | null; owner_id: number | null };

        const trips = randomInt(5, 25);
        const mileage = randomFloat(200, 1500);
        const baseFee = Number((mileage * 0.45).toFixed(2));
        const bridgeFee = randomFloat(0, 150);
        const tunnelFee = randomFloat(0, 80);
        const surcharge = randomFloat(0, 50);
        const discount = randomFloat(0, 60);
        const totalAmount = Number((baseFee + bridgeFee + tunnelFee + surcharge - discount).toFixed(2));
        const status = m === 0 ? (Math.random() > 0.5 ? 'unpaid' : 'paid') : 'paid';
        const paidAmount = status === 'paid' ? totalAmount : (status === 'waived' ? 0 : randomFloat(0, totalAmount));

        const dueDate = new Date(year, month, 25);
        const paidAt = status === 'paid' ? formatDate(new Date(year, month - 1, randomInt(10, 25), 14, 30)) : null;

        const billNo = `MBL${year}${padZero(month, 2)}${padZero(v + 1, 6)}`;

        insertBill.run(
          billNo, year, month, vehicleId, vehicle.owner_id, vehicle.fleet_id,
          trips, mileage, baseFee, bridgeFee, tunnelFee, surcharge, discount, totalAmount,
          paidAmount, status, formatDate(dueDate).slice(0, 10), paidAt
        );
      }
    }

    const insertAppeal = db.prepare(`
      INSERT INTO appeals (
        appeal_no, toll_record_id, user_id, type, title, description,
        status, claimed_amount, refund_amount, handler_id, handle_remark, handled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const appealTypes: Array<'overcharge' | 'wrong_vehicle' | 'duplicate' | 'other'> = ['overcharge', 'wrong_vehicle', 'duplicate', 'other'];
    const appealStatuses: Array<'pending' | 'reviewing' | 'approved' | 'rejected' | 'closed'> = ['pending', 'reviewing', 'approved', 'rejected', 'closed'];
    const appealTitles = {
      overcharge: '高速费用多收',
      wrong_vehicle: '车辆信息不符',
      duplicate: '重复扣费申诉',
      other: '其他异常问题',
    };

    for (let i = 0; i < 15; i++) {
      const type = randomItem(appealTypes);
      const status = appealStatuses[i % 5];
      const recordId = tollRecordIds[i];
      const record = db.prepare('SELECT paid_amount FROM toll_records WHERE id = ?').get(recordId) as { paid_amount: number };

      const appealNo = `APL${padZero(2024, 4)}${padZero(i + 1, 8)}`;
      const claimed = record.paid_amount;
      const refund = status === 'approved' ? claimed : (status === 'closed' ? randomFloat(0, claimed) : null);
      const handlerId = status !== 'pending' ? userIds[0] : null;
      const handledAt = status !== 'pending' ? formatDate(dateFromNow(randomInt(1, 15), 15, 0)) : null;
      const remark = status === 'approved' ? '已核实情况，全额退款' :
                     status === 'rejected' ? '经核实扣费无误，不予退款' :
                     status === 'closed' ? '协商一致，部分退款' : null;

      insertAppeal.run(
        appealNo, recordId, userIds[3], type, appealTitles[type],
        `${appealTitles[type]}，请求核查处理。通行记录显示费用异常，请协助核实。`,
        status, claimed, refund, handlerId, remark, handledAt
      );
    }

    const insertAccount = db.prepare(`
      INSERT INTO etc_accounts (
        account_no, user_id, balance, frozen_balance, total_recharge, total_consumption,
        status, last_recharge_at, last_consumption_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < 5; i++) {
      const accountNo = `ETC${padZero(2024, 4)}${padZero(i + 1, 10)}`;
      const userId = i === 0 ? 1 : userIds[i - 1];
      const totalRecharge = randomFloat(1000, 10000);
      const totalConsumption = randomFloat(500, totalRecharge * 0.8);
      const balance = Number((totalRecharge - totalConsumption).toFixed(2));
      const frozen = Math.random() > 0.8 ? randomFloat(100, 500) : 0;
      const status: 'normal' | 'frozen' | 'disabled' = i === 4 ? 'frozen' : 'normal';

      insertAccount.run(
        accountNo, userId, balance, frozen, totalRecharge, totalConsumption,
        status, formatDate(dateFromNow(randomInt(1, 30), 10, 0)),
        formatDate(dateFromNow(randomInt(0, 7), 18, 0))
      );
    }

    const insertUpgradeTask = db.prepare(`
      INSERT INTO obu_upgrade_tasks (
        task_no, name, description, firmware_version, firmware_url, status,
        total_devices, success_count, failed_count, created_by, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const taskStatuses: Array<'pending' | 'running' | 'paused' | 'completed' | 'cancelled'> = ['pending', 'running', 'paused', 'completed', 'cancelled'];
    const taskNames = [
      'OBU固件 v2.5.0 批量升级',
      'ETC设备安全补丁升级',
      '5G OBU模块固件更新',
      '兼容性优化升级',
      '紧急安全漏洞修复',
    ];
    const taskIds: number[] = [];

    for (let i = 0; i < 5; i++) {
      const taskNo = `UPG${padZero(2024, 4)}${padZero(i + 1, 8)}`;
      const status = taskStatuses[i];
      const total = randomInt(5, 15);
      const success = status === 'completed' ? total : (status === 'running' ? randomInt(1, total - 1) : 0);
      const failed = status === 'completed' ? randomInt(0, 2) : 0;
      const version = `v${2 + i}.${randomInt(0, 9)}.${randomInt(0, 9)}`;
      const startedAt = status !== 'pending' ? formatDate(dateFromNow(randomInt(1, 10), 9, 0)) : null;
      const completedAt = status === 'completed' || status === 'cancelled' ? formatDate(dateFromNow(randomInt(1, 5), 17, 0)) : null;

      const info = insertUpgradeTask.run(
        taskNo, taskNames[i], `固件版本 ${version} 升级任务，包含性能优化和Bug修复。`,
        version, `https://firmware.etc.com/${version}/upgrade.bin`,
        status, total, success, failed, 1, startedAt, completedAt
      );
      taskIds.push(Number(info.lastInsertRowid));
    }

    const insertUpgradeLog = db.prepare(`
      INSERT INTO obu_upgrade_logs (task_id, obu_id, status, progress, error_message, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const logStatuses: Array<'pending' | 'downloading' | 'installing' | 'success' | 'failed'> = ['pending', 'downloading', 'installing', 'success', 'failed'];

    let logIdx = 0;
    for (const taskId of taskIds) {
      const task = db.prepare('SELECT status, total_devices FROM obu_upgrade_tasks WHERE id = ?').get(taskId) as { status: string; total_devices: number };

      for (let i = 0; i < task.total_devices && logIdx < 30; i++) {
        const obuId = obuIds[i % obuIds.length];
        let status: UpgradeLogStatus;
        let progress: number;
        let error: string | null = null;
        let startedAt: string | null = null;
        let completedAt: string | null = null;

        if (task.status === 'pending') {
          status = 'pending';
          progress = 0;
        } else if (task.status === 'running') {
          status = i < 3 ? 'installing' : (i < 6 ? 'downloading' : 'pending');
          progress = status === 'installing' ? randomInt(30, 80) : (status === 'downloading' ? randomInt(10, 50) : 0);
          startedAt = status !== 'pending' ? formatDate(dateFromNow(randomInt(0, 1), 14, 0)) : null;
        } else if (task.status === 'completed') {
          status = i < task.total_devices - 1 ? 'success' : 'failed';
          progress = 100;
          error = status === 'failed' ? '设备无响应，升级超时' : null;
          startedAt = formatDate(dateFromNow(randomInt(1, 5), 10, randomInt(0, 59)));
          completedAt = formatDate(dateFromNow(randomInt(1, 5), 11, randomInt(0, 59)));
        } else if (task.status === 'cancelled') {
          status = 'pending';
          progress = 0;
        } else {
          status = i < 3 ? 'success' : 'pending';
          progress = status === 'success' ? 100 : 0;
          startedAt = status === 'success' ? formatDate(dateFromNow(randomInt(2, 10), 10, 0)) : null;
          completedAt = status === 'success' ? formatDate(dateFromNow(randomInt(2, 10), 11, 0)) : null;
        }

        insertUpgradeLog.run(
          taskId, obuId, status, progress, error, startedAt, completedAt
        );
        logIdx++;
      }
    }

    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, detail, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const actions: AuditAction[] = ['login', 'create', 'update', 'delete', 'approve', 'reject', 'activate', 'deactivate', 'upgrade', 'export'];
    const resources = ['user', 'fleet', 'vehicle', 'obu_device', 'toll_record', 'monthly_bill', 'appeal', 'etc_account', 'obu_upgrade_task', 'system'];

    for (let i = 0; i < 50; i++) {
      const userId = i % 5 === 0 ? 1 : userIds[randomInt(0, userIds.length - 1)];
      const action = randomItem(actions);
      const resource = randomItem(resources);
      const resourceId = randomInt(1, 50);
      const detail = `执行操作: ${action}，资源类型: ${resource}，资源ID: ${resourceId}`;
      const ip = `${randomInt(10, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}`;
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      insertAudit.run(userId, action, resource, resourceId, detail, ip, ua);
    }

    db.prepare('UPDATE fleets SET vehicle_count = (SELECT COUNT(*) FROM vehicles WHERE vehicles.fleet_id = fleets.id)').run();
  });

  tx();
}

type UpgradeLogStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed';
type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'activate' | 'deactivate' | 'upgrade' | 'export';
