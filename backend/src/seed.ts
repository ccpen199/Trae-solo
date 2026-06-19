import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database.js';

async function seed() {
  const db = getDb();
  console.log('🌱 开始初始化种子数据...');

  const adminId = uuidv4();
  const adminPass = await bcrypt.hash('admin123', 12);
  
  const adminAccounts = [
    { username: 'admin', password: 'admin123', email: 'admin@greencycle.com', phone: '400-888-8888' },
    { username: 'platform', password: 'platform123', email: 'platform@greencycle.com', phone: '400-888-8889' },
    { username: 'ops', password: 'ops123', email: 'ops@greencycle.com', phone: '400-888-8890' },
    { username: 'supervisor', password: 'supervisor123', email: 'supervisor@greencycle.com', phone: '400-888-8891' },
  ];
  
  for (const acc of adminAccounts) {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(acc.username);
    if (!existingAdmin) {
      const aid = uuidv4();
      const pass = await bcrypt.hash(acc.password, 12);
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, email, phone)
        VALUES (?, ?, ?, 'admin', ?, ?)
      `).run(aid, acc.username, pass, acc.email, acc.phone);
      console.log(`  ✅ 管理员账户创建: ${acc.username} / ${acc.password}`);
    }
  }

  const users: any[] = [
    { role: 'recycler', username: 'recycler01', company: '上海绿色再生资源回收有限公司', region: '上海市', credit: 92, grade: 'AA' },
    { role: 'recycler', username: 'recycler02', company: '江苏环科金属回收集团', region: '江苏省苏州市', credit: 88, grade: 'A' },
    { role: 'recycler', username: 'recycler03', company: '广东绿城废旧物资处理有限公司', region: '广东省深圳市', credit: 95, grade: 'AAA' },
    { role: 'producer', username: 'producer01', company: '宝钢集团上海梅山钢铁有限公司', region: '江苏省南京市', industry: '钢铁冶炼' },
    { role: 'producer', username: 'producer02', company: '富士康科技集团深圳园区', region: '广东省深圳市', industry: '电子制造' },
    { role: 'producer', username: 'producer03', company: '中国第一汽车集团', region: '吉林省长春市', industry: '汽车制造' },
    { role: 'producer', username: 'producer04', company: '中石化扬子石化有限公司', region: '江苏省南京市', industry: '石油化工' },
    { role: 'inspector', username: 'inspector01', company: '国家有色金属质量检验检测中心', region: '北京市', cma: 'CMA-BJ-20240001' },
    { role: 'inspector', username: 'inspector02', company: '中国检验认证集团上海公司', region: '上海市', cma: 'CMA-SH-20240088' },
    { role: 'carrier', username: 'carrier01', company: '中储发展股份有限公司南京分公司', region: '江苏省南京市', license: '中储运-001', api: '中储运', vehicles: 120 },
    { role: 'carrier', username: 'carrier02', company: '德邦快递华东区大件物流部', region: '上海市', license: '德邦-2024-EC', api: '德邦', vehicles: 85 },
    { role: 'carrier', username: 'carrier03', company: '顺达危化品运输有限公司', region: '广东省广州市', license: '粤运危2024-0033', api: '自有', vehicles: 35 },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of users) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username) as any;
    if (existing) {
      const existingEnt = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(existing.id) as any;
      createdUsers[u.username] = { 
        user_id: existing.id, 
        enterprise_id: existingEnt ? existingEnt.id : uuidv4()
      };
      continue;
    }

    const userId = uuidv4();
    const enterpriseId = uuidv4();
    const passHash = await bcrypt.hash(u.username + '123', 12);

    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId, u.username, passHash, u.role,
      `${u.username}@example.com`,
      '138' + String(Math.floor(Math.random() * 90000000 + 10000000))
    );

    db.prepare(`
      INSERT INTO enterprises (
        id, user_id, company_name, unified_social_credit_code, legal_person,
        legal_person_id, registered_address, business_license_url, region,
        verification_status, verified_at, credit_score, credit_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', datetime('now'), ?, ?)
    `).run(
      enterpriseId, userId, u.company,
      '91310' + String(Math.floor(Math.random() * 1e13)).padStart(13, '0'),
      '张' + ['伟', '芳', '强', '敏', '军', '丽', '勇', '华'][Math.floor(Math.random() * 8)],
      '310101' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'),
      u.region + '高新技术园区A栋1088号',
      `https://license.example.com/${enterpriseId}.jpg`,
      u.region.split('省')[0].split('市')[0],
      u.credit || Math.floor(75 + Math.random() * 20),
      u.grade || (Math.random() > 0.5 ? 'A' : 'BBB')
    );

    if (u.role === 'recycler') {
      db.prepare(`
        INSERT INTO recycler_profiles (id, enterprise_id, recycling_categories, annual_capacity, main_business_regions, compliance_rate, dispute_rate, tax_compliance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), enterpriseId,
        JSON.stringify(['废金属', '废塑料', '二手设备']),
        50000 + Math.floor(Math.random() * 200000),
        JSON.stringify([u.region, '华东', '全国']),
        (90 + Math.random() * 9).toFixed(2),
        (Math.random() * 5).toFixed(2),
        85 + Math.floor(Math.random() * 15)
      );
    } else if (u.role === 'producer') {
      db.prepare(`
        INSERT INTO producer_profiles (id, enterprise_id, industry_type, annual_waste_volume, factory_locations, waste_types)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), enterpriseId,
        u.industry,
        10000 + Math.floor(Math.random() * 100000),
        JSON.stringify([u.region]),
        JSON.stringify(['废金属', '废塑料'])
      );
    } else if (u.role === 'inspector') {
      db.prepare(`
        INSERT INTO inspector_profiles (id, enterprise_id, cma_cert_no, cma_valid_until, inspection_scope)
        VALUES (?, ?, ?, '2028-12-31', ?)
      `).run(
        uuidv4(), enterpriseId, u.cma,
        '废金属全品类检测、废塑料成分鉴定、二手设备评估、CMA认证报告出具'
      );
    } else if (u.role === 'carrier') {
      db.prepare(`
        INSERT INTO carrier_profiles (id, enterprise_id, carrier_license_no, vehicle_count, service_regions, api_provider)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), enterpriseId, u.license, u.vehicles,
        JSON.stringify(['全国', u.region]),
        u.api
      );
    }

    createdUsers[u.username] = { user_id: userId, enterprise_id: enterpriseId };
    console.log(`  ✅ 账户: ${u.username} / ${u.username}123 (${u.company})`);
  }

  const pro1 = createdUsers['producer01'];
  const pro2 = createdUsers['producer02'];
  const pro3 = createdUsers['producer03'];
  const pro4 = createdUsers['producer04'];
  const rec1 = createdUsers['recycler01'];
  const rec2 = createdUsers['recycler02'];
  const rec3 = createdUsers['recycler03'];

  const oppTemplates = [
    { type: 'supply', cat: '废金属', sub: '废钢', title: '宝钢集团供应优质重型废钢5000吨', desc: '本厂产重型废钢，厚度≥6mm，无锈蚀无杂质，可随时看货。', qty: 5000, minP: 2750, maxP: 2900, region: '江苏南京', lat: 32.06, lng: 118.80, pub: pro1, grade: 'H1' },
    { type: 'supply', cat: '废金属', sub: '废铜', title: '富士康供应紫铜边角料200吨', desc: '精密加工产生的紫铜边角料，纯度99.95%，光亮铜线。', qty: 200, minP: 51000, maxP: 53500, region: '广东深圳', lat: 22.54, lng: 114.06, pub: pro2, grade: 'A' },
    { type: 'supply', cat: '废塑料', sub: 'PET', title: '扬子石化PET瓶片300吨', desc: '食品级PET瓶片，清洗干净，水分<0.5%，粘度合格。', qty: 300, minP: 4100, maxP: 4350, region: '江苏南京', lat: 32.06, lng: 118.80, pub: pro4, grade: '食品级' },
    { type: 'supply', cat: '废塑料', sub: 'PP', title: '一汽集团汽车保险杠PP废料150吨', desc: '汽车装配线保险杠边角料，改性PP，含玻纤15%。', qty: 150, minP: 5800, maxP: 6200, region: '吉林长春', lat: 43.88, lng: 125.32, pub: pro3, grade: '工业级' },
    { type: 'supply', cat: '废金属', sub: '废铝', title: '富士康6061铝型材边角料300吨', desc: '6061-T6铝型材锯切料，无涂层无氧化，干净无杂质。', qty: 300, minP: 14200, maxP: 14800, region: '广东深圳', lat: 22.54, lng: 114.06, pub: pro2, grade: '6061' },
    { type: 'supply', cat: '二手设备', sub: '工程机械', title: '宝钢转让二手装载机8台', desc: '5台柳工CLG856H，3台徐工LW500FV，使用3-5年，车况良好。', qty: 8, minP: 220000, maxP: 280000, region: '江苏南京', lat: 32.06, lng: 118.80, pub: pro1, grade: '8成新' },
    { type: 'supply', cat: '废塑料', sub: 'PE', title: '扬子石化HDPE颗粒再生料200吨', desc: 'HDPE再生颗粒，熔体指数合格，适合吹塑、拉丝。', qty: 200, minP: 5600, maxP: 5900, region: '江苏南京', lat: 32.06, lng: 118.80, pub: pro4, grade: '一级' },
    { type: 'demand', cat: '废金属', sub: '废不锈钢', title: '环科金属求购304不锈钢废料500吨', desc: '长期收购304、316不锈钢边角料、炉料，可月结。', qty: 500, minP: 9200, maxP: 9800, region: '江苏苏州', lat: 31.30, lng: 120.62, pub: rec2, grade: '304' },
    { type: 'demand', cat: '废金属', sub: '废钢', title: '绿城求购重废、中废2000吨/月', desc: '长期采购重废、中废、剪切料，月需2000吨，送货上门。', qty: 2000, minP: 2600, maxP: 2850, region: '广东深圳', lat: 22.54, lng: 114.06, pub: rec3, grade: 'H2以上' },
    { type: 'demand', cat: '废塑料', sub: 'ABS', title: '绿色再生求购ABS废旧家电外壳50吨', desc: '废旧家电拆解ABS外壳，白色优先，阻燃级高价。', qty: 50, minP: 8200, maxP: 8800, region: '上海市', lat: 31.23, lng: 121.47, pub: rec1, grade: '阻燃V0' },
    { type: 'demand', cat: '废金属', sub: '废铜', title: '上海绿循环求购光亮铜线100吨', desc: '现金采购光亮铜线、紫铜排、铜管，上门验货。', qty: 100, minP: 50000, maxP: 52500, region: '上海市', lat: 31.23, lng: 121.47, pub: rec1, grade: '光亮' },
    { type: 'demand', cat: '二手设备', sub: '生产设备', title: '环科求购二手金属打包机、剪切机', desc: '求购华宏科技200T以上打包机，500T虎头剪切机。', qty: 6, minP: 150000, maxP: 350000, region: '江苏苏州', lat: 31.30, lng: 120.62, pub: rec2, grade: '7成新以上' },
  ];

  const today = new Date();
  for (let i = 0; i < oppTemplates.length; i++) {
    const t = oppTemplates[i];
    const existing = db.prepare('SELECT id FROM business_opportunities WHERE title = ?').get(t.title);
    if (existing) continue;

    const id = uuidv4();
    const expiry = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
    const available = new Date(today.getTime() - Math.random() * 5 * 24 * 3600 * 1000);

    db.prepare(`
      INSERT INTO business_opportunities (
        id, publisher_id, publisher_enterprise_id, type, category, sub_category,
        title, description, quantity, unit, min_price, max_price, price_unit,
        region, latitude, longitude, quality_grade, available_date, expiry_date,
        status, views_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      id, t.pub.user_id, t.pub.enterprise_id, t.type, t.cat, t.sub,
      t.title, t.desc, t.qty, t.cat === '二手设备' ? '台' : '吨',
      t.minP, t.maxP, t.cat === '二手设备' ? '元/台' : '元/吨',
      t.region, t.lat, t.lng, t.grade,
      available.toISOString().split('T')[0],
      expiry.toISOString().split('T')[0],
      Math.floor(Math.random() * 500)
    );

    const subCategories: Record<string, string[]> = {
      '废金属': ['废钢', '废铜', '废铝', '废锌', '废不锈钢'],
      '废塑料': ['PET', 'PE', 'PP', 'PVC', 'ABS'],
      '二手设备': ['工程机械', '生产设备', '运输车辆']
    };
    const regions = ['华东', '华北', '华南', '华中', '西南', '西北'];
    const provinces = ['江苏', '浙江', '山东', '广东', '河北', '四川', '湖北', '河南', '辽宁', '吉林'];
    const cities = ['南京', '苏州', '杭州', '宁波', '青岛', '广州', '深圳', '东莞', '唐山', '成都', '武汉', '郑州', '沈阳', '长春'];
    const lats = [32.06, 31.30, 30.27, 29.87, 36.07, 23.13, 22.54, 23.02, 39.63, 30.67, 30.59, 34.75, 41.80, 43.88];
    const lngs = [118.80, 120.62, 120.16, 121.55, 120.38, 113.26, 114.06, 113.75, 118.18, 104.07, 114.30, 113.65, 123.43, 125.32];

    for (const [cat, subs] of Object.entries(subCategories)) {
      for (const sub of subs) {
        for (let k = 0; k < provinces.length; k++) {
          const existingHm = db.prepare(`
            SELECT id FROM heatmap_data 
            WHERE category = ? AND sub_category = ? AND province = ? AND record_date = date('now')
          `).get(cat, sub, provinces[k]);
          if (existingHm) continue;

          const isSupply = Math.random() > 0.45;
          const supply = isSupply ? 100 + Math.floor(Math.random() * 5000) : Math.floor(Math.random() * 500);
          const demand = isSupply ? Math.floor(Math.random() * 500) : 100 + Math.floor(Math.random() * 5000);
          const basePrice = cat === '废金属' ? (sub === '废铜' ? 52000 : sub === '废铝' ? 14500 : sub === '废不锈钢' ? 9500 : 2800)
            : cat === '废塑料' ? (sub === 'ABS' ? 8500 : 5500) : 200000;
          const price = Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.15));

          db.prepare(`
            INSERT INTO heatmap_data (
              id, region, province, city, latitude, longitude, category, sub_category,
              supply_volume, demand_volume, avg_price, price_change_pct, steel_mill_capacity, steel_mill_utilization, record_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
          `).run(
            uuidv4(), regions[k % regions.length], provinces[k], cities[k],
            lats[k], lngs[k], cat, sub,
            supply, demand, price,
            (Math.random() * 16 - 8).toFixed(2),
            cat === '废金属' && sub === '废钢' ? (500 + Math.floor(Math.random() * 3000)) : null,
            cat === '废金属' && sub === '废钢' ? (65 + Math.random() * 30).toFixed(1) : null
          );
        }
      }
    }
  }

  const ratingCount = db.prepare('SELECT COUNT(*) as c FROM credit_ratings').get() as any;
  if (ratingCount.c === 0) {
    for (const username of ['recycler01', 'recycler02', 'recycler03']) {
      const u = createdUsers[username];
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
      const ent = db.prepare('SELECT id, credit_score, credit_rating FROM enterprises WHERE user_id = ?').get(user.id) as any;
      
      const rid = uuidv4();
      const score = ent.credit_score || 90;
      const grade = ent.credit_rating || 'AA';
      
      db.prepare(`
        INSERT INTO credit_ratings (
          id, enterprise_id, total_orders, completed_orders, performance_rate,
          dispute_rate, dispute_count, tax_compliance_score, quality_objection_rate,
          quality_objection_count, payment_timeliness_score, data_completeness_score,
          final_score, final_grade, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'))
      `).run(
        rid, ent.id,
        28 + Math.floor(Math.random() * 50),
        25 + Math.floor(Math.random() * 48),
        (92 + Math.random() * 7).toFixed(2),
        (Math.random() * 4).toFixed(2),
        Math.floor(Math.random() * 3),
        88 + Math.floor(Math.random() * 12),
        (Math.random() * 6).toFixed(2),
        Math.floor(Math.random() * 4),
        85 + Math.floor(Math.random() * 15),
        90 + Math.floor(Math.random() * 10),
        score, grade
      );
    }
  }

  const subCount = db.prepare('SELECT COUNT(*) as c FROM subscriptions').get() as any;
  if (subCount.c === 0) {
    for (const username of ['recycler01', 'recycler02', 'recycler03']) {
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
      db.prepare(`
        INSERT INTO subscriptions (id, user_id, categories, regions, min_quantity, min_price, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(
        uuidv4(), user.id,
        JSON.stringify(['废金属', '废塑料']),
        JSON.stringify(['华东', '华南']),
        50, 1000
      );
    }
  }

  const oppId = db.prepare('SELECT id FROM business_opportunities WHERE title = ?').get('宝钢集团供应优质重型废钢5000吨') as any;
  const buyer = createdUsers['recycler01'];
  const seller = createdUsers['producer01'];
  const inspector = createdUsers['inspector01'];
  const carrier = createdUsers['carrier01'];

  if (oppId && buyer && seller && inspector && carrier) {
    const demoTxCount = db.prepare('SELECT COUNT(*) as c FROM orders').get() as any;
    if (demoTxCount.c === 0) {
      console.log('\n📦 正在创建完整交易闭环演示数据...');

      const negId = uuidv4();
      db.prepare(`
        INSERT INTO negotiations (
          id, opportunity_id, initiator_id, responder_id,
          current_price, current_quantity, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'accepted', datetime('now', '-3 days'))
      `).run(negId, oppId.id, buyer.user_id, seller.user_id, 2820, 500);

      db.prepare(`
        INSERT INTO negotiation_messages (
          id, negotiation_id, sender_id, price, quantity, message, created_at
        ) VALUES 
          (?, ?, ?, 2800, 500, '我方报价2800元/吨，采购500吨', datetime('now', '-3 days', '-2 hours')),
          (?, ?, ?, 2850, 500, '最低2850元/吨，不含运费', datetime('now', '-3 days', '-1 hours')),
          (?, ?, ?, 2820, 500, '同意2820元/吨，500吨成交', datetime('now', '-3 days'))
      `).run(
        uuidv4(), negId, buyer.user_id,
        uuidv4(), negId, seller.user_id,
        uuidv4(), negId, buyer.user_id
      );
      console.log('  ✅ 议价记录已创建');

      const contractId = uuidv4();
      const totalAmount = 2820 * 500;
      const depositAmount = totalAmount * 0.2;
      db.prepare(`
        INSERT INTO contracts (
          id, negotiation_id, opportunity_id, buyer_id, seller_id,
          category, sub_category, quantity, unit, unit_price, total_amount,
          deposit_ratio, deposit_amount,
          quality_standard, delivery_method, delivery_address, delivery_date,
          inspection_method, payment_terms, breach_clause,
          status,
          buyer_signed_at, seller_signed_at,
          buyer_signature_url, seller_signature_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'fully_signed', datetime('now', '-3 days'), datetime('now', '-3 days'), ?, ?, datetime('now', '-3 days'))
      `).run(
        contractId, negId, oppId.id, buyer.user_id, seller.user_id,
        '废金属', '废钢', 500, '吨', 2820, totalAmount,
        0.2, depositAmount,
        'H1重型废钢，杂质≤1.5%，含水率≤0.5%',
        '物流承运商配送',
        '上海市嘉定区绿循环仓库',
        '2024-05-20',
        'CMA第三方质检机构现场取样检测',
        '定金20%冻结，验收合格后释放定金并支付尾款80%',
        '违约方按合同总金额的5%支付违约金',
        '/uploads/signatures/buyer_' + buyer.user_id.slice(0, 8) + '.png',
        '/uploads/signatures/seller_' + seller.user_id.slice(0, 8) + '.png'
      );
      console.log('  ✅ 电子合同已签署');

      const orderId = uuidv4();
      const orderNo = 'ORD' + Date.now().toString().slice(-10);
      db.prepare(`
        INSERT INTO orders (
          id, contract_id, buyer_id, seller_id,
          total_amount, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'completed', datetime('now', '-2 days'))
      `).run(orderId, contractId, buyer.user_id, seller.user_id, totalAmount);
      console.log('  ✅ 订单已生成: ' + orderNo);

      const pay1Id = uuidv4();
      const pay2Id = uuidv4();
      db.prepare(`
        INSERT INTO payment_records (
          id, order_id, type, amount, status,
          frozen_at, released_at, transaction_no, created_at
        ) VALUES 
          (?, ?, 'deposit', ?, 'deposit_released', datetime('now', '-2 days', '-12 hours'), datetime('now', '-1 day'), ?, datetime('now', '-2 days', '-12 hours')),
          (?, ?, 'full_payment', ?, 'full_paid', datetime('now', '-1 day'), datetime('now', '-1 day'), ?, datetime('now', '-1 day'))
      `).run(
        pay1Id, orderId, depositAmount, 'TXN-DEP-' + Date.now().toString().slice(-8),
        pay2Id, orderId, totalAmount, 'TXN-FIN-' + Date.now().toString().slice(-8)
      );
      console.log('  ✅ 资金监管已完成：定金冻结→验收释放→尾款支付');

      const quoteId = uuidv4();
      db.prepare(`
        INSERT INTO logistics_quotations (
          id, order_id, carrier_id, carrier_enterprise_id,
          pickup_address, delivery_address, distance_km, weight_ton,
          vehicle_type, quoted_price, estimated_days, insurance_fee,
          status, created_at, expired_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', datetime('now', '-2 days', '-11 hours'), datetime('now', '+3 days'))
      `).run(
        quoteId, orderId, carrier.user_id, carrier.enterprise_id,
        '江苏省南京市宝钢梅山仓库',
        '上海市嘉定区绿循环仓库',
        320, 500,
        '13米高栏货车', 12500, 2, 500
      );

      const logisticsId = uuidv4();
      const trackingNo = 'ZCY' + Date.now().toString().slice(-8);
      db.prepare(`
        INSERT INTO logistics_orders (
          id, order_id, quotation_id, carrier_id,
          tracking_no, vehicle_no, driver_name, driver_phone,
          status, current_location, estimated_arrival,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'delivered', ?, datetime('now', '-1 day', '-4 hours'), datetime('now', '-2 days', '-10 hours'))
      `).run(
        logisticsId, orderId, quoteId, carrier.user_id,
        trackingNo, '苏A-88296', '张师傅', '138****8899',
        '上海市嘉定区绿循环仓库'
      );

      db.prepare(`
        INSERT INTO logistics_events (
          id, logistics_order_id, status, location, description, event_time
        ) VALUES 
          (?, ?, 'picked_up', '江苏省南京市', '已揽收，承运车辆：苏A-88296', datetime('now', '-2 days', '-8 hours')),
          (?, ?, 'in_transit', '江苏省无锡市', '途经无锡高速服务区，车况正常', datetime('now', '-2 days', '-4 hours')),
          (?, ?, 'in_transit', '上海市嘉定区', '已进入上海境内', datetime('now', '-1 day', '-8 hours')),
          (?, ?, 'delivered', '上海市嘉定区绿循环仓库', '已送达，买家验收合格', datetime('now', '-1 day', '-4 hours'))
      `).run(
        uuidv4(), logisticsId,
        uuidv4(), logisticsId,
        uuidv4(), logisticsId,
        uuidv4(), logisticsId
      );
      console.log('  ✅ 物流承运调度已完成（对接中储运API）');

      const reportId = uuidv4();
      const cmaNo = 'CMA-SH-' + Date.now().toString().slice(-8);
      db.prepare(`
        INSERT INTO inspection_reports (
          id, order_id, inspector_id, inspector_enterprise_id,
          report_no, cma_report_no, inspection_date,
          category, sub_category, sample_weight, quality_grade,
          composition, impurity_rate, moisture_rate,
          conclusion, is_passed, api_sync_status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced', datetime('now', '-1 day', '-8 hours'))
      `).run(
        reportId, orderId, inspector.user_id, inspector.enterprise_id,
        'INS-' + Date.now().toString().slice(-8), cmaNo,
        '2024-05-19',
        '废金属', '废钢', 50, 'H1重型废钢',
        '铁96.5%, 碳2.0%, 其他1.5%', 1.2, 0.3,
        '样品质量符合H1重型废钢标准，杂质率1.2%≤1.5%，验收合格'
      );
      console.log('  ✅ CMA质检报告已出具（对接CMA检测API）: ' + cmaNo);

      const traceId = uuidv4();
      const traceCode = 'TRACE' + Date.now().toString().slice(-8);
      db.prepare(`
        INSERT INTO trace_codes (
          id, code, order_id, producer_id, recycler_id,
          category, sub_category, quantity, unit,
          status, min_env_sync_status, min_env_tracking_no,
          origin_address, destination_address,
          inspection_report_id, qr_code_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'archived', 'synced', ?, ?, ?, ?, ?, datetime('now', '-2 days', '-6 hours'))
      `).run(
        traceId, traceCode, orderId, seller.user_id, buyer.user_id,
        '废金属', '废钢', 500, '吨',
        'MEP-' + Date.now().toString().slice(-10),
        '江苏省南京市宝钢梅山仓库',
        '上海市嘉定区绿循环仓库',
        reportId,
        '/uploads/qrcodes/' + traceCode + '.png'
      );
      console.log('  ✅ 溯源码已生成并同步生态环境部固废系统: ' + traceCode);

      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\', \'-1 day\') WHERE id = ?')
        .run('completed', orderId);
      console.log('  ✅ 交易订单全流程闭环完成！');

      const notifTypes = [
        { type: 'opportunity', title: '新供应商机匹配', content: '宝钢集团发布的5000吨废钢商机符合您的订阅条件' },
        { type: 'negotiation', title: '议价已接受', content: '宝钢集团已接受您2820元/吨的废钢采购报价' },
        { type: 'contract', title: '合同待签署', content: '编号' + contractId.slice(0, 8) + '的电子合同需要您签署' },
        { type: 'order', title: '定金已冻结', content: '订单' + orderNo + '的20%定金' + (depositAmount / 10000).toFixed(1) + '万元已监管冻结' },
        { type: 'order', title: '物流已送达', content: '承运车辆已到达上海仓库，等待质检' },
        { type: 'payment', title: '资金已释放', content: '验收合格，' + (totalAmount / 10000).toFixed(1) + '万元货款已释放至卖家' },
      ];
      for (const n of notifTypes) {
        const validType = ['opportunity','negotiation','contract','order','payment','logistics','system'].includes(n.type) ? n.type : 'system';
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(uuidv4(), buyer.user_id, validType, n.title, n.content, orderId);
      }
      console.log('  ✅ 全链路通知已推送');
    }
  }

  console.log('\n✅ 种子数据初始化完成！');
  console.log('\n📋 测试账户汇总：');
  console.log('  管理员:   admin / admin123  (platform / platform123, ops / ops123, supervisor / supervisor123)');
  console.log('  回收商:   recycler01~03 / 密码=用户名+123');
  console.log('  产废单位: producer01~04 / 密码=用户名+123');
  console.log('  质检机构: inspector01~02 / 密码=用户名+123');
  console.log('  承运商:   carrier01~03  / 密码=用户名+123');
  console.log('\n💡 推荐体验: recycler01登录，可查看完整交易数据: 议价1笔/合同1份/订单1笔/溯源1条/资金流水2笔');
  console.log('\n');
}

seed().catch(err => {
  console.error('❌ 种子数据初始化失败:', err);
  process.exit(1);
});
