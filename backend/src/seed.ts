import { db } from './database';
import { v4 as uuidv4 } from 'uuid';

const ports = [
  { name: '上海港', code: 'CNSHA', country: 'CN', lat: 31.2304, lng: 121.4737 },
  { name: '宁波港', code: 'CNNGB', country: 'CN', lat: 29.8683, lng: 121.5440 },
  { name: '深圳港', code: 'CNSZX', country: 'CN', lat: 22.5431, lng: 114.0579 },
  { name: '新加坡港', code: 'SGSIN', country: 'SG', lat: 1.3521, lng: 103.8198 },
  { name: '釜山港', code: 'KRPUS', country: 'KR', lat: 35.1796, lng: 129.0756 },
  { name: '鹿特丹港', code: 'NLRTM', country: 'NL', lat: 51.9244, lng: 4.4777 },
  { name: '汉堡港', code: 'DEHAM', country: 'DE', lat: 53.5511, lng: 9.9937 },
  { name: '洛杉矶港', code: 'USLAX', country: 'US', lat: 33.7405, lng: -118.2663 },
  { name: '纽约港', code: 'USNYC', country: 'US', lat: 40.7128, lng: -74.0060 },
  { name: '迪拜港', code: 'AEDXB', country: 'AE', lat: 25.2048, lng: 55.2708 },
  { name: '孟买港', code: 'INBOM', country: 'IN', lat: 19.0760, lng: 72.8777 },
  { name: '亚历山大港', code: 'EGALY', country: 'EG', lat: 31.2001, lng: 29.9187 },
];

const vesselTypes = ['集装箱船', '散货船', '油轮', '滚装船', '液化气船', '特种船'];
const containerTypes = ['20GP', '40GP', '40HQ', '45HQ', '20RF', '40RF', '20OT', '40OT'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function seedDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = OFF');
      
      const users: Array<{ id: string; name: string; company: string; role: string; email: string; phone: string; qualifications: string }> = [
        { id: uuidv4(), name: '张明', company: '华贸物流集团', role: 'cargo_owner', email: 'zhangming@huamao.com', phone: '13800138001', qualifications: 'ISO9001,AEO认证' },
        { id: uuidv4(), name: '李华', company: '远洋航运股份', role: 'ship_owner', email: 'lihua@yuanyang.com', phone: '13800138002', qualifications: 'ISM认证,MLC2006' },
        { id: uuidv4(), name: '王芳', company: '全球货代联盟', role: 'forwarder', email: 'wangfang@global-forwarder.com', phone: '13800138003', qualifications: 'FIATA,WCA会员' },
        { id: uuidv4(), name: '陈强', company: '中集集装箱运营', role: 'container_operator', email: 'chenqiang@cimc.com', phone: '13800138004', qualifications: 'CSC认证,ISO14001' },
        { id: uuidv4(), name: '刘伟', company: '特种运输服务公司', role: 'special_transport', email: 'liuw@special-trans.com', phone: '13800138005', qualifications: '大件运输资质,危险品运输许可' },
        { id: uuidv4(), name: '赵刚', company: '海纳百川贸易', role: 'cargo_owner', email: 'zhaog@hnbc.com', phone: '13800138006', qualifications: 'AEO高级认证' },
        { id: uuidv4(), name: '孙丽', company: '东方之星航运', role: 'ship_owner', email: 'sunl@orientstar.com', phone: '13800138007', qualifications: 'ISM,ISPS认证' },
      ];

      const userStmt = db.prepare('INSERT OR IGNORE INTO users (id, name, company, role, email, phone, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)');
      users.forEach(u => {
        userStmt.run(u.id, u.name, u.company, u.role, u.email, u.phone, u.qualifications);
      });
      userStmt.finalize();

      const shipOwners = users.filter(u => u.role === 'ship_owner');
      const vessels: any[] = [];
      const vesselNames = ['中远之星', '海洋巨人号', '东方明珠', '蓝鲸号', '太平洋使者', '大西洋先锋', '印度洋之梦', '北冰洋探索者'];
      
      for (let i = 0; i < 8; i++) {
        const port = randomFrom(ports);
        const vessel = {
          id: uuidv4(),
          name: vesselNames[i],
          imo: `IMO${randomInt(9000000, 9999999)}`,
          type: randomFrom(vesselTypes),
          dwt: randomFloat(50000, 200000),
          teu: randomInt(2000, 14000),
          built_year: randomInt(2010, 2023),
          flag: randomFrom(['巴拿马', '利比里亚', '中国', '新加坡', '马耳他']),
          speed: randomFloat(18, 28, 1),
          status: randomFrom(['available', 'in_transit', 'maintenance']),
          owner_id: randomFrom(shipOwners).id,
          current_port: port.name,
          latitude: port.lat + randomFloat(-0.5, 0.5, 4),
          longitude: port.lng + randomFloat(-0.5, 0.5, 4),
          specs: JSON.stringify({
            mainEngine: 'MAN B&W 6S60MC-C',
            cranes: randomInt(0, 4),
            reeferPlugs: randomInt(100, 800),
            hatchCovers: 'MacGregor'
          })
        };
        vessels.push(vessel);
      }

      const vesselStmt = db.prepare('INSERT OR IGNORE INTO vessels (id, name, imo, type, dwt, teu, built_year, flag, speed, status, owner_id, current_port, latitude, longitude, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      vessels.forEach(v => {
        vesselStmt.run(v.id, v.name, v.imo, v.type, v.dwt, v.teu, v.built_year, v.flag, v.speed, v.status, v.owner_id, v.current_port, v.latitude, v.longitude, v.specs);
      });
      vesselStmt.finalize();

      const voyages: any[] = [];
      const today = new Date();
      
      for (let i = 0; i < 15; i++) {
        const origin = randomFrom(ports);
        let dest = randomFrom(ports);
        while (dest.code === origin.code) dest = randomFrom(ports);
        
        const vessel = randomFrom(vessels);
        const transitDays = randomInt(5, 35);
        const etd = addDays(today, randomInt(1, 15));
        const eta = addDays(etd, transitDays);

        voyages.push({
          id: uuidv4(),
          vessel_id: vessel.id,
          voyage_number: `V${randomInt(1000, 9999)}`,
          origin_port: origin.name,
          destination_port: dest.name,
          etd: etd.toISOString(),
          eta: eta.toISOString(),
          status: randomFrom(['published', 'loading', 'in_transit', 'discharging']),
          available_teu: randomInt(50, vessel.teu || 5000),
          available_weight: randomFloat(5000, 50000),
          container_types: JSON.stringify(['20GP', '40GP', '40HQ']),
          base_rate: randomFloat(800, 3500),
          carbon_estimate: randomFloat(0.5, 2.5, 3),
          compliance_certificates: JSON.stringify(['SOLAS', 'MARPOL', 'ISPS'])
        });
      }

      const voyageStmt = db.prepare('INSERT OR IGNORE INTO voyages (id, vessel_id, voyage_number, origin_port, destination_port, etd, eta, status, available_teu, available_weight, container_types, base_rate, carbon_estimate, compliance_certificates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      voyages.forEach(v => {
        voyageStmt.run(v.id, v.vessel_id, v.voyage_number, v.origin_port, v.destination_port, v.etd, v.eta, v.status, v.available_teu, v.available_weight, v.container_types, v.base_rate, v.carbon_estimate, v.compliance_certificates);
      });
      voyageStmt.finalize();

      const cargoOwners = users.filter(u => u.role === 'cargo_owner');
      const cargoTypes = ['电子产品', '服装纺织', '机械设备', '化工原料', '食品饮料', '家具家居', '汽车配件', '建材钢材'];
      
      for (let i = 0; i < 12; i++) {
        const origin = randomFrom(ports);
        let dest = randomFrom(ports);
        while (dest.code === origin.code) dest = randomFrom(ports);
        
        const earliest = addDays(today, randomInt(3, 10));
        const latest = addDays(earliest, randomInt(20, 45));

        db.run('INSERT OR IGNORE INTO cargo_bookings (id, cargo_owner_id, cargo_type, weight, teu, origin_port, destination_port, earliest_departure, latest_arrival, budget_rate, status, special_requirements, compliance_docs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          uuidv4(),
          randomFrom(cargoOwners).id,
          randomFrom(cargoTypes),
          randomFloat(50, 500),
          randomInt(2, 50),
          origin.name,
          dest.name,
          earliest.toISOString(),
          latest.toISOString(),
          randomFloat(1000, 4000),
          randomFrom(['inquiry', 'quoted', 'confirmed']),
          JSON.stringify(['防潮', '轻放']),
          JSON.stringify(['商业发票', '装箱单', '产地证'])
        );
      }

      const listedVessels = vessels.slice(0, 4);
      listedVessels.forEach((v, idx) => {
        db.run('INSERT OR IGNORE INTO vessel_listings (id, vessel_id, seller_id, price, currency, description, status, due_diligence_docs, inspection_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          uuidv4(),
          v.id,
          v.owner_id,
          randomFloat(20000000, 80000000),
          'USD',
          `${v.name} - ${v.type}，${v.built_year}年建造，适航状态良好`,
          idx === 0 ? 'active' : randomFrom(['active', 'pending', 'under_offer']),
          JSON.stringify(['船舶登记证书', '入级证书', '检验报告', '轮机日志']),
          addDays(today, randomInt(7, 30)).toISOString()
        );
      });

      const containerOps = users.filter(u => u.role === 'container_operator');
      for (let i = 0; i < 20; i++) {
        const cType = randomFrom(containerTypes);
        const teu = cType.startsWith('20') ? 1 : 2;
        db.run('INSERT OR IGNORE INTO containers (id, container_number, type, size, teu, max_weight, status, current_location, operator_id, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          uuidv4(),
          `CNTR${randomInt(100000, 999999)}`,
          cType.includes('RF') ? '冷藏箱' : cType.includes('OT') ? '开顶箱' : '干货箱',
          cType,
          teu,
          teu === 1 ? 28000 : 30480,
          randomFrom(['available', 'in_use', 'maintenance', 'repositioning']),
          randomFrom(ports).name,
          randomFrom(containerOps).id,
          JSON.stringify(['木质地板', '通风系统', '绑扎点'])
        );
      }

      for (let i = 0; i < 8; i++) {
        const origin = randomFrom(ports);
        let dest = randomFrom(ports);
        while (dest.code === origin.code) dest = randomFrom(ports);
        
        db.run('INSERT OR IGNORE INTO liner_schedules (id, route_code, origin_port, destination_port, departure_day, transit_days, vessel_type, standard_rate, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          uuidv4(),
          `RTE${randomInt(100, 999)}`,
          origin.name,
          dest.name,
          randomFrom(['周一', '周二', '周三', '周四', '周五', '周六', '周日']),
          randomInt(7, 30),
          '集装箱船',
          randomFloat(600, 2800),
          randomFrom(containerOps).id
        );
      }

      const specialEquipOwners = users.filter(u => u.role === 'special_transport');
      const specialTypes = ['大件运输车', '冷藏车', '危险品运输车', '集装箱叉车', '正面吊', '堆高机'];
      
      for (let i = 0; i < 10; i++) {
        const type = randomFrom(specialTypes);
        db.run('INSERT OR IGNORE INTO special_equipment (id, name, type, model, parameters, owner_id, status, daily_rate, location, certificates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          uuidv4(),
          `${type}-${i + 1}号`,
          type,
          `Model-${randomInt(100, 999)}`,
          JSON.stringify({
           载重: randomFloat(10, 100) + '吨',
            尺寸: randomFloat(5, 20, 1) + 'm x ' + randomFloat(2, 5, 1) + 'm x ' + randomFloat(2, 5, 1) + 'm',
            动力: '柴油发动机',
            排放标准: '国六'
          }),
          randomFrom(specialEquipOwners).id,
          randomFrom(['available', 'rented', 'maintenance']),
          randomFloat(500, 5000),
          randomFrom(ports).name,
          JSON.stringify(['营运证', '保险单', '年检合格'])
        );
      }

      const freightRoutes = ['上海-洛杉矶', '上海-鹿特丹', '宁波-汉堡', '深圳-新加坡', '釜山-纽约'];
      freightRoutes.forEach(route => {
        for (let i = 0; i < 30; i++) {
          const date = addDays(today, -30 + i);
          db.run('INSERT OR IGNORE INTO freight_index (id, route, index_value, date, container_type) VALUES (?, ?, ?, ?, ?)',
            uuidv4(),
            route,
            randomFloat(800, 3200),
            date.toISOString().split('T')[0],
            'dry'
          );
        }
      });

      for (let i = 0; i < 5; i++) {
        const orderNumber = `ORD${Date.now()}${i}`;
        db.run('INSERT OR IGNORE INTO orders (id, order_number, buyer_id, seller_id, order_type, amount, currency, status, contract_signed, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          uuidv4(),
          orderNumber,
          users[0].id,
          users[1].id,
          'voyage_booking',
          randomFloat(5000, 50000),
          'USD',
          randomFrom(['inquiry', 'quoted', 'confirmed', 'in_transit', 'delivered']),
          randomInt(0, 1),
          randomFrom(['unpaid', 'partial', 'paid'])
        );
      }

      const alertTypes = ['滞港风险', '甩柜预警', '单证缺失', '船舶延误', '费用异常'];
      const severities = ['low', 'medium', 'high', 'critical'];
      
      for (let i = 0; i < 8; i++) {
        db.run('INSERT OR IGNORE INTO alerts (id, type, severity, message, status) VALUES (?, ?, ?, ?, ?)',
          uuidv4(),
          randomFrom(alertTypes),
          randomFrom(severities),
          `示例预警消息 - ${i + 1}`,
          randomFrom(['active', 'acknowledged', 'resolved'])
        );
      }

      db.run('PRAGMA foreign_keys = ON');
      resolve();
    });
  });
}
