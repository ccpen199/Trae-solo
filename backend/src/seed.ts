import db, { initDB } from './db';
import bcrypt from 'bcryptjs';

const brands = [
  { code: 'SF', name: '顺丰速运', base_price: 18, per_kg_price: 6, avg_delivery_hours: 24, coverage_score: 95, rating: 4.8 },
  { code: 'ZTO', name: '中通快递', base_price: 10, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 92, rating: 4.5 },
  { code: 'STO', name: '申通快递', base_price: 10, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 90, rating: 4.4 },
  { code: 'YTO', name: '圆通速递', base_price: 10, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 91, rating: 4.4 },
  { code: 'YD', name: '韵达速递', base_price: 10, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 90, rating: 4.3 },
  { code: 'EMS', name: 'EMS邮政', base_price: 15, per_kg_price: 5, avg_delivery_hours: 72, coverage_score: 99, rating: 4.2 },
  { code: 'JD', name: '京东物流', base_price: 15, per_kg_price: 5, avg_delivery_hours: 24, coverage_score: 85, rating: 4.7 },
  { code: 'DBL', name: '德邦快递', base_price: 12, per_kg_price: 4, avg_delivery_hours: 48, coverage_score: 78, rating: 4.3 },
  { code: 'SFTC', name: '顺丰同城', base_price: 12, per_kg_price: 4, avg_delivery_hours: 3, coverage_score: 60, rating: 4.6 },
  { code: 'JT', name: '极兔速递', base_price: 8, per_kg_price: 2, avg_delivery_hours: 48, coverage_score: 85, rating: 4.2 },
  { code: 'UC', name: '优速快递', base_price: 9, per_kg_price: 3, avg_delivery_hours: 60, coverage_score: 70, rating: 4.0 },
  { code: 'HTKY', name: '百世快递', base_price: 9, per_kg_price: 3, avg_delivery_hours: 60, coverage_score: 82, rating: 4.1 },
  { code: 'ZJS', name: '宅急送', base_price: 11, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 65, rating: 4.0 },
  { code: 'TNT', name: 'TNT快递', base_price: 50, per_kg_price: 20, avg_delivery_hours: 120, coverage_score: 40, rating: 4.5 },
  { code: 'DHL', name: 'DHL国际', base_price: 60, per_kg_price: 25, avg_delivery_hours: 96, coverage_score: 45, rating: 4.7 },
  { code: 'FEDEX', name: '联邦快递', base_price: 55, per_kg_price: 22, avg_delivery_hours: 96, coverage_score: 42, rating: 4.6 },
  { code: 'UPS', name: 'UPS快递', base_price: 58, per_kg_price: 23, avg_delivery_hours: 96, coverage_score: 40, rating: 4.6 },
  { code: 'CXZX', name: '邮政小包', base_price: 6, per_kg_price: 1, avg_delivery_hours: 96, coverage_score: 95, rating: 3.9 },
  { code: 'ANE', name: '安能物流', base_price: 10, per_kg_price: 3, avg_delivery_hours: 60, coverage_score: 75, rating: 4.1 },
  { code: 'YZPY', name: '邮政平邮', base_price: 5, per_kg_price: 1, avg_delivery_hours: 120, coverage_score: 98, rating: 3.8 },
  { code: 'SFWL', name: '顺丰冷运', base_price: 30, per_kg_price: 10, avg_delivery_hours: 36, coverage_score: 50, rating: 4.5 },
  { code: 'XBWL', name: '信丰物流', base_price: 9, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 55, rating: 4.0 },
  { code: 'QFKD', name: '全峰快递', base_price: 8, per_kg_price: 2, avg_delivery_hours: 60, coverage_score: 60, rating: 3.9 },
  { code: 'GTO', name: '国通快递', base_price: 8, per_kg_price: 2, avg_delivery_hours: 60, coverage_score: 58, rating: 3.8 },
  { code: 'RFD', name: '如风达', base_price: 10, per_kg_price: 3, avg_delivery_hours: 48, coverage_score: 45, rating: 4.0 },
  { code: 'COE', name: '东方快递', base_price: 9, per_kg_price: 3, avg_delivery_hours: 60, coverage_score: 40, rating: 3.9 },
  { code: 'EYB', name: '邮政EMS经济快递', base_price: 8, per_kg_price: 2, avg_delivery_hours: 72, coverage_score: 90, rating: 4.0 },
  { code: 'ZYE', name: '众一快递', base_price: 8, per_kg_price: 2, avg_delivery_hours: 60, coverage_score: 35, rating: 3.8 },
  { code: 'YFHEX', name: '圆通国际', base_price: 40, per_kg_price: 15, avg_delivery_hours: 120, coverage_score: 30, rating: 4.2 },
  { code: 'SFKY', name: '顺丰空运', base_price: 25, per_kg_price: 8, avg_delivery_hours: 12, coverage_score: 70, rating: 4.7 },
];

const courierNames = ['张伟', '李强', '王磊', '刘洋', '陈超', '杨帆', '赵鹏', '孙浩', '周涛', '吴斌', '郑宇', '冯刚', '何俊', '蒋明', '韩晓'];
const branchCities = [
  { city: '北京', province: '北京', lng: 116.4074, lat: 39.9042 },
  { city: '上海', province: '上海', lng: 121.4737, lat: 31.2304 },
  { city: '广州', province: '广东', lng: 113.2644, lat: 23.1291 },
  { city: '深圳', province: '广东', lng: 114.0579, lat: 22.5431 },
  { city: '杭州', province: '浙江', lng: 120.1551, lat: 30.2741 },
  { city: '成都', province: '四川', lng: 104.0668, lat: 30.5728 },
  { city: '武汉', province: '湖北', lng: 114.3055, lat: 30.5928 },
  { city: '西安', province: '陕西', lng: 108.9398, lat: 34.3416 },
  { city: '南京', province: '江苏', lng: 118.7969, lat: 32.0603 },
  { city: '重庆', province: '重庆', lng: 106.5516, lat: 29.5630 },
  { city: '天津', province: '天津', lng: 117.2009, lat: 39.0842 },
  { city: '苏州', province: '江苏', lng: 120.5853, lat: 31.2990 },
  { city: '青岛', province: '山东', lng: 120.3826, lat: 36.0671 },
  { city: '长沙', province: '湖南', lng: 112.9388, lat: 28.2282 },
  { city: '郑州', province: '河南', lng: 113.6254, lat: 34.7466 },
];

const abnormalAddresses = [
  '北京市朝阳区虚构路888号',
  '上海市浦东新区假小区999栋',
  '广州市天河区不存在街666号',
];

const goodsNames = ['手机', '笔记本电脑', '衣服', '鞋子', '化妆品', '食品', '书籍', '玩具', '家电', '文件', '药品', '婴儿用品', '运动器材', '家居用品'];

function rand(n: number) { return Math.floor(Math.random() * n); }
function pick<T>(arr: T[]): T { return arr[rand(arr.length)]; }
function formatDate(d: Date) { return d.toISOString().slice(0, 19).replace('T', ' '); }

export function seed() {
  initDB();

  const hashedPwd = bcrypt.hashSync('123456', 10);
  const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, role, name, phone, face_data) VALUES (?, ?, ?, ?, ?, ?)`);
  
  insertUser.run('admin', hashedPwd, 'admin', '系统管理员', '13800000000', null);
  insertUser.run('user1', hashedPwd, 'user', '王小明', '13800000001', 'face_template_user1');
  insertUser.run('user2', hashedPwd, 'user', '李小红', '13800000002', 'face_template_user2');
  insertUser.run('user3', hashedPwd, 'user', '张小强', '13800000003', 'face_template_user3');
  insertUser.run('courier1', hashedPwd, 'courier', '张伟', '13900000001', null);
  insertUser.run('courier2', hashedPwd, 'courier', '李强', '13900000002', null);
  insertUser.run('courier3', hashedPwd, 'courier', '王磊', '13900000003', null);
  insertUser.run('erp_demo', hashedPwd, 'erp', '电商对接账号', '13700000001', null);

  const brandCount = db.prepare('SELECT COUNT(*) as c FROM courier_brands').get() as any;
  if (brandCount.c === 0) {
    const insBrand = db.prepare(`INSERT INTO courier_brands (code, name, base_price, per_kg_price, avg_delivery_hours, coverage_score, rating) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    brands.forEach(b => insBrand.run(b.code, b.name, b.base_price, b.per_kg_price, b.avg_delivery_hours, b.coverage_score, b.rating));
  }

  const brandIds = db.prepare('SELECT id FROM courier_brands').all() as { id: number }[];

  const courierCount = db.prepare('SELECT COUNT(*) as c FROM couriers').get() as any;
  if (courierCount.c === 0) {
    const insCourier = db.prepare(`INSERT INTO couriers (user_id, brand_id, employee_no, name, phone, service_area, longitude, latitude, rating, work_status, voice_greeting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const userIds = [5, 6, 7];
    courierNames.forEach((name, i) => {
      const city = branchCities[i % branchCities.length];
      insCourier.run(
        userIds[i % 3],
        brandIds[i % brandIds.length].id,
        `EMP${String(10000 + i).padStart(6, '0')}`,
        name,
        `139${String(rand(90000000) + 10000000)}`,
        `${city.province}${city.city}`,
        city.lng + (Math.random() - 0.5) * 0.2,
        city.lat + (Math.random() - 0.5) * 0.2,
        4.2 + Math.random() * 0.8,
        i % 4 === 0 ? 'busy' : i % 5 === 0 ? 'offline' : 'online',
        i === 0 ? '您好，我是顺丰速运快递员张伟，您的包裹正在配送途中，预计15分钟内到达，请注意查收！' : null
      );
    });
  }

  const branchCount = db.prepare('SELECT COUNT(*) as c FROM branches').get() as any;
  if (branchCount.c === 0) {
    const insBranch = db.prepare(`INSERT INTO branches (brand_id, code, name, address, city, province, longitude, latitude, daily_throughput, max_capacity, manager, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    let idx = 0;
    brandIds.slice(0, 10).forEach(b => {
      branchCities.forEach(city => {
        idx++;
        insBranch.run(
          b.id,
          `BR${String(idx).padStart(6, '0')}`,
          `${brands[b.id - 1]?.name || '快递'}${city.city}转运中心`,
          `${city.province}${city.city}XX区XX路${rand(200) + 1}号`,
          city.city,
          city.province,
          city.lng + (Math.random() - 0.5) * 0.3,
          city.lat + (Math.random() - 0.5) * 0.3,
          rand(8000) + 1000,
          10000,
          pick(courierNames),
          `138${String(rand(90000000) + 10000000)}`
        );
      });
    });
  }

  const apiAppCount = db.prepare('SELECT COUNT(*) as c FROM api_applications').get() as any;
  if (apiAppCount.c === 0) {
    const insApp = db.prepare(`INSERT INTO api_applications (app_key, app_secret, app_name, app_type, company_name, contact_name, contact_phone, daily_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insApp.run('ERP_DEMO_001', 'SECRET_' + Math.random().toString(36).slice(2, 14).toUpperCase(), '淘宝电商ERP对接', 'erp', '杭州某某电商有限公司', '李经理', '13600000001', 50000);
    insApp.run('ERP_DEMO_002', 'SECRET_' + Math.random().toString(36).slice(2, 14).toUpperCase(), '有赞商城系统', 'erp', '深圳某科技公司', '王工', '13600000002', 20000);
    insApp.run('ERP_DEMO_003', 'SECRET_' + Math.random().toString(36).slice(2, 14).toUpperCase(), '微信小程序商城', 'mini_program', '北京某零售企业', '赵总', '13600000003', 10000);
  }

  const orderCount = db.prepare('SELECT COUNT(*) as c FROM shipment_orders').get() as any;
  if (orderCount.c === 0) {
    const courierIds = db.prepare('SELECT id, brand_id FROM couriers').all() as { id: number; brand_id: number }[];
    const insOrder = db.prepare(`INSERT INTO shipment_orders (order_no, tracking_no, brand_id, courier_id, sender_id, receiver_id, sender_name, sender_phone, sender_address, sender_longitude, sender_latitude, receiver_name, receiver_phone, receiver_address, receiver_longitude, receiver_latitude, weight, goods_name, price, insurance_fee, total_amount, status, estimated_delivery_time, is_address_abnormal, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insEvent = db.prepare(`INSERT INTO tracking_events (order_id, tracking_no, event_type, event_desc, location, longitude, latitude, operator_id, operator_name, is_exception, exception_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insComplaint = db.prepare(`INSERT INTO complaints (order_id, user_id, courier_id, type, description, status, sla_deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const insNotif = db.prepare(`INSERT INTO notifications (user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`);

    const statuses = ['created', 'picked', 'in_transit', 'arrived_branch', 'out_for_delivery', 'delivered', 'signed', 'exception', 'returned'];
    const eventTypes = ['ORDER_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_BRANCH', 'SORTED', 'OUT_FOR_DELIVERY', 'DELIVERING', 'SIGNED', 'EXCEPTION', 'RETURN_REQUEST'];
    const exceptionTypes = [null, null, null, null, '地址不详', '联系不上收件人', '客户拒收', '包裹破损', '天气延误', '网点爆仓'];

    for (let i = 0; i < 120; i++) {
      const fromCity = pick(branchCities);
      let toCity = pick(branchCities);
      while (toCity.city === fromCity.city) toCity = pick(branchCities);

      const courier = courierIds[i % courierIds.length];
      const brand = brands[courier.brand_id - 1];
      const weight = +(Math.random() * 15 + 0.5).toFixed(1);
      const price = +(brand.base_price + brand.per_kg_price * Math.max(0, weight - 1)).toFixed(2);
      const insurance = price > 100 ? +(price * 0.01).toFixed(2) : 0;
      const status = i < 8 ? 'out_for_delivery' : i < 20 ? 'in_transit' : i < 95 ? pick(statuses) : 'exception';
      const now = Date.now();
      const createdAt = new Date(now - rand(7) * 86400000 - rand(86400) * 1000);
      const estDelivery = new Date(createdAt.getTime() + (brand.avg_delivery_hours + rand(12)) * 3600000);
      const orderNo = `EXP${formatDate(createdAt).replace(/[-: ]/g, '').slice(0, 14)}${String(i + 1).padStart(5, '0')}`;
      const trackNo = `${brand.code}${orderNo.slice(3)}`;
      const isAbnormal = i >= 95 && i < 100 ? 1 : 0;
      const receiverAddress = isAbnormal ? pick(abnormalAddresses) : `${toCity.province}${toCity.city}${pick(['XX区','YY区','ZZ区'])}${pick(['人民路','建设路','解放路','中山大道','科技大道'])}${rand(500) + 1}号${pick(['花园','小区','大厦','广场','公寓'])}${rand(20) + 1}栋${rand(30) + 1}0${rand(9) + 1}室`;

      const orderId = insOrder.run(
        orderNo, trackNo, courier.brand_id, courier.id,
        (i % 3) + 2, ((i + 1) % 3) + 2,
        `寄件人${i + 1}`, `138${String(rand(90000000) + 10000000)}`,
        `${fromCity.province}${fromCity.city}XX区XX路${rand(300) + 1}号XX小区${rand(15) + 1}栋${rand(20) + 1}01室`,
        fromCity.lng + (Math.random() - 0.5) * 0.15,
        fromCity.lat + (Math.random() - 0.5) * 0.15,
        `收件人${i + 1}`, `139${String(rand(90000000) + 10000000)}`,
        receiverAddress,
        isAbnormal ? 0 : toCity.lng + (Math.random() - 0.5) * 0.15,
        isAbnormal ? 0 : toCity.lat + (Math.random() - 0.5) * 0.15,
        weight, pick(goodsNames),
        price, insurance, +(price + insurance).toFixed(2),
        status, formatDate(estDelivery), isAbnormal,
        formatDate(createdAt), formatDate(createdAt)
      ).lastInsertRowid as number;

      let eventCount = rand(5) + 2;
      if (status === 'signed') eventCount = rand(3) + 6;
      const excType = pick(exceptionTypes);
      for (let j = 0; j < eventCount; j++) {
        const eventTime = new Date(createdAt.getTime() + j * (estDelivery.getTime() - createdAt.getTime()) / 8 + rand(3600) * 1000);
        const evtType = status === 'exception' && j === eventCount - 1 ? 'EXCEPTION' : eventTypes[Math.min(j, eventTypes.length - 2)];
        const isExc = (evtType === 'EXCEPTION') ? 1 : (excType && j === eventCount - 1 ? 1 : 0);
        insEvent.run(
          orderId, trackNo, evtType,
          evtType === 'ORDER_CREATED' ? '订单已创建，等待快递员揽收' :
          evtType === 'PICKED_UP' ? `快递员已揽收，发往${toCity.city}` :
          evtType === 'IN_TRANSIT' ? `包裹正在运输中，已到达${pick(branchCities).city}转运中心` :
          evtType === 'ARRIVED_BRANCH' ? `包裹已到达${toCity.city}网点` :
          evtType === 'SORTED' ? `包裹已完成分拣，即将派送` :
          evtType === 'OUT_FOR_DELIVERY' ? `快递员正在派送中，请保持电话畅通` :
          evtType === 'DELIVERING' ? `快递员预计30分钟内送达` :
          evtType === 'SIGNED' ? '本人已签收' :
          isExc ? (excType || '异常事件') : '物流更新',
          `${pick(branchCities).city}转运中心`,
          fromCity.lng + (toCity.lng - fromCity.lng) * (j / eventCount),
          fromCity.lat + (toCity.lat - fromCity.lat) * (j / eventCount),
          courier.id, courierNames[i % courierNames.length],
          isExc, excType,
          formatDate(eventTime)
        );
      }

      if (i >= 110) {
        const compType = pick(['delivery_delay', 'package_damage', 'lost', 'rude_service', 'wrong_address']);
        insComplaint.run(
          orderId, (i % 3) + 2, courier.id, compType,
          compType === 'delivery_delay' ? '快递延误超过3天，未收到包裹' :
          compType === 'package_damage' ? '包裹外包装严重破损，内部物品疑似损坏' :
          compType === 'lost' ? '包裹丢失，物流信息多日未更新' :
          compType === 'rude_service' ? '快递员态度恶劣，未经同意放门卫' :
          '派件地址错误，需要重新配送',
          i < 115 ? 'pending' : 'processing',
          formatDate(new Date(Date.now() + 8 * 3600 * 1000)),
          formatDate(new Date(now - rand(86400) * 1000))
        );
      }

      insNotif.run(
        (i % 3) + 2,
        status === 'exception' ? 'exception' : status === 'out_for_delivery' ? 'delivery' : status === 'signed' ? 'signed' : 'tracking',
        status === 'exception' ? '包裹异常通知' :
        status === 'out_for_delivery' ? '包裹正在派送' :
        status === 'signed' ? '包裹已签收' : '物流状态更新',
        `您的运单 ${trackNo} ${status === 'exception' ? '出现异常，请联系客服' : status === 'out_for_delivery' ? '快递员正在派送，请保持手机畅通' : status === 'signed' ? '已成功签收，感谢使用' : '物流信息已更新'}`,
        orderId,
        formatDate(new Date(now - rand(3600) * 1000))
      );

      if (i % 8 === 0) {
        insNotif.run(
          1,
          i >= 110 ? 'complaint' : (status === 'exception' ? 'exception' : 'system'),
          status === 'exception' ? '异常地址预警' : (i >= 110 ? '投诉预警' : '系统通知'),
          '运单 ' + trackNo + ' 需要管理员关注',
          orderId,
          formatDate(new Date(now - rand(3600) * 1000))
        );
      }
    }
  }

  const updateApiAppCalls = db.prepare(`UPDATE api_applications SET total_calls = ?, today_calls = ? WHERE app_key = ?`);
  updateApiAppCalls.run(12850, 342, 'ERP_DEMO_001');
  updateApiAppCalls.run(8920, 218, 'ERP_DEMO_002');
  updateApiAppCalls.run(5160, 127, 'ERP_DEMO_003');

  const apiLogCount = db.prepare('SELECT COUNT(*) as c FROM api_call_logs').get() as any;
  if (apiLogCount.c === 0) {
    const appIds = db.prepare('SELECT id, app_key FROM api_applications WHERE app_key IN (?, ?, ?)').all('ERP_DEMO_001', 'ERP_DEMO_002', 'ERP_DEMO_003') as { id: number; app_key: string }[];
    const apiPaths = [
      '/open/brands',
      '/open/brand-quality',
      '/open/orders/create',
      '/open/orders/query',
      '/open/orders/track',
      '/open/orders/cancel',
      '/open/address/validate',
      '/open/price/calculate',
    ];
    const methods = ['GET', 'POST'];
    const ipPool = [
      '192.168.1.100',
      '10.0.0.55',
      '172.16.0.23',
      '203.0.113.42',
      '198.51.100.88',
    ];

    const insLog = db.prepare(`INSERT INTO api_call_logs (app_id, api_path, method, response_status, response_time, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalLogs = 105;
    const days = 14;
    const logsPerDay = Math.ceil(totalLogs / days);

    const insertMany = db.transaction(() => {
      for (let d = 0; d < days; d++) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - (days - 1 - d));
        const logsThisDay = d === days - 1 ? totalLogs - (days - 1) * logsPerDay : logsPerDay;

        for (let i = 0; i < logsThisDay; i++) {
          const app = appIds[(d * logsPerDay + i) % appIds.length];
          const apiPath = pick(apiPaths);
          const method = apiPath.includes('create') || apiPath.includes('cancel') ? 'POST' : pick(methods);
          const isError = Math.random() < 0.08;
          const responseStatus = isError ? (Math.random() < 0.5 ? 500 : 503) : 200;
          const responseTime = 30 + Math.floor(Math.random() * 771);
          const ip = pick(ipPool);
          const hour = 8 + Math.floor(Math.random() * 12);
          const minute = Math.floor(Math.random() * 60);
          const second = Math.floor(Math.random() * 60);
          const createdAt = new Date(dayDate);
          createdAt.setHours(hour, minute, second, 0);

          insLog.run(
            app.id,
            apiPath,
            method,
            responseStatus,
            responseTime,
            ip,
            formatDate(createdAt)
          );
        }
      }
    });

    insertMany();
  }

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seed();
}
