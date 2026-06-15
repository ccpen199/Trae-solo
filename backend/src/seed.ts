import { initDatabase, db } from './database';
import { generateId, now, hashPassword } from './utils';

initDatabase();

const seedData = () => {
  const t = now();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM card_pool').run();
    db.prepare('DELETE FROM commission_records').run();
    db.prepare('DELETE FROM user_relations').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM suppliers').run();
    db.prepare('DELETE FROM promotions').run();
    db.prepare('DELETE FROM settlements').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM ip_blacklist').run();
    db.prepare('DELETE FROM risk_logs').run();
    db.prepare('DELETE FROM recharge_channels').run();
    db.prepare('DELETE FROM region_limits').run();

    const supplierData = [
      { id: generateId(), name: '腾讯充值中心', code: 'tencent', endpoint: 'https://api.tencent.example.com', key: 'tencent_demo_key' },
      { id: generateId(), name: '爱奇艺会员中心', code: 'iqiyi', endpoint: 'https://api.iqiyi.example.com', key: 'iqiyi_demo_key' },
      { id: generateId(), name: '美团外卖券', code: 'meituan', endpoint: 'https://api.meituan.example.com', key: 'meituan_demo_key' },
      { id: generateId(), name: '京东E卡', code: 'jd', endpoint: 'https://api.jd.example.com', key: 'jd_demo_key' }
    ];

    const supplierStmt = db.prepare(`
      INSERT INTO suppliers (id, name, code, api_endpoint, api_key, api_secret, status, settlement_ratio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    supplierData.forEach(s => supplierStmt.run(s.id, s.name, s.code, s.endpoint, s.key, null, 0.88 + Math.random() * 0.08, t));
    const [tencentId, iqiyiId, meituanId, jdId] = supplierData.map(s => s.id);

    const categories = [
      { id: 'c_phone', name: '话费充值', code: 'phone', icon: '📱', sort: 1 },
      { id: 'c_data', name: '流量充值', code: 'data', icon: '🌐', sort: 2 },
      { id: 'c_video', name: '视频会员', code: 'video', icon: '🎬', sort: 3 },
      { id: 'c_food', name: '外卖券', code: 'food', icon: '🍔', sort: 4 },
      { id: 'c_card', name: '电商购物卡', code: 'card', icon: '🛒', sort: 5 },
      { id: 'c_music', name: '音乐会员', code: 'music', icon: '🎵', sort: 6 },
      { id: 'c_game', name: '游戏点卡', code: 'game', icon: '🎮', sort: 7 },
      { id: 'c_life', name: '生活服务', code: 'life', icon: '🏠', sort: 8 }
    ];
    const catStmt = db.prepare(`INSERT INTO categories (id, name, code, icon, sort, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    categories.forEach(c => catStmt.run(c.id, c.name, c.code, c.icon, c.sort, t));

    const products = [
      { name: '中国移动话费50元', catId: 'c_phone', supplier: tencentId, skuType: 'recharge', face: 50, price: 49.5, cost: 48, rate: 0.03, stock: 9999, hot: true, image: '话费50元' },
      { name: '中国移动话费100元', catId: 'c_phone', supplier: tencentId, skuType: 'recharge', face: 100, price: 99, cost: 96.5, rate: 0.03, stock: 9999, hot: true, image: '话费100元' },
      { name: '中国联通话费50元', catId: 'c_phone', supplier: tencentId, skuType: 'recharge', face: 50, price: 49.8, cost: 48.3, rate: 0.03, stock: 9999, image: '联通话费50' },
      { name: '中国联通话费100元', catId: 'c_phone', supplier: tencentId, skuType: 'recharge', face: 100, price: 99.5, cost: 96.8, rate: 0.03, stock: 9999, image: '联通话费100' },
      { name: '中国电信话费50元', catId: 'c_phone', supplier: tencentId, skuType: 'recharge', face: 50, price: 49.9, cost: 48.5, rate: 0.03, stock: 9999, image: '电信话费50' },
      { name: '中国电信话费100元', catId: 'c_phone', supplier: tencentId, skuType: 'recharge', face: 100, price: 99.8, cost: 97, rate: 0.03, stock: 9999, hot: true, image: '电信话费100' },
      { name: '全国通用流量1GB', catId: 'c_data', supplier: tencentId, skuType: 'recharge', face: 10, price: 8.5, cost: 7.5, rate: 0.05, stock: 9999, image: '流量1G' },
      { name: '全国通用流量5GB', catId: 'c_data', supplier: tencentId, skuType: 'recharge', face: 30, price: 25.5, cost: 22, rate: 0.05, stock: 9999, hot: true, image: '流量5G' },
      { name: '全国通用流量10GB', catId: 'c_data', supplier: tencentId, skuType: 'recharge', face: 50, price: 42, cost: 37, rate: 0.05, stock: 9999, image: '流量10G' },
      { name: '定向流量30GB（抖音/快手）', catId: 'c_data', supplier: tencentId, skuType: 'recharge', face: 30, price: 19.9, cost: 16, rate: 0.05, stock: 9999, image: '定向30G' },
      { name: '爱奇艺黄金会员月卡', catId: 'c_video', supplier: iqiyiId, skuType: 'recharge', face: 30, price: 25, cost: 20, rate: 0.08, stock: 9999, hot: true, image: '爱奇艺月卡' },
      { name: '爱奇艺黄金会员季卡', catId: 'c_video', supplier: iqiyiId, skuType: 'recharge', face: 88, price: 68, cost: 55, rate: 0.08, stock: 9999, image: '爱奇艺季卡' },
      { name: '爱奇艺黄金会员年卡', catId: 'c_video', supplier: iqiyiId, skuType: 'recharge', face: 248, price: 198, cost: 160, rate: 0.08, stock: 9999, hot: true, image: '爱奇艺年卡' },
      { name: '爱奇艺星钻会员月卡', catId: 'c_video', supplier: iqiyiId, skuType: 'recharge', face: 60, price: 45, cost: 36, rate: 0.1, stock: 9999, image: '星钻月卡' },
      { name: '美团外卖券20元', catId: 'c_food', supplier: meituanId, skuType: 'card', face: 20, price: 18.5, cost: 17, rate: 0.04, stock: 0, image: '美团20券' },
      { name: '美团外卖券50元', catId: 'c_food', supplier: meituanId, skuType: 'card', face: 50, price: 46, cost: 42.5, rate: 0.04, stock: 0, hot: true, image: '美团50券' },
      { name: '美团外卖券100元', catId: 'c_food', supplier: meituanId, skuType: 'card', face: 100, price: 92, cost: 85, rate: 0.04, stock: 0, image: '美团100券' },
      { name: '京东E卡100元', catId: 'c_card', supplier: jdId, skuType: 'card', face: 100, price: 97.5, cost: 94, rate: 0.02, stock: 0, hot: true, image: '京东100' },
      { name: '京东E卡500元', catId: 'c_card', supplier: jdId, skuType: 'card', face: 500, price: 488, cost: 470, rate: 0.02, stock: 0, image: '京东500' },
      { name: '京东E卡1000元', catId: 'c_card', supplier: jdId, skuType: 'card', face: 1000, price: 975, cost: 940, rate: 0.02, stock: 0, image: '京东1000' },
      { name: '天猫超市卡100元', catId: 'c_card', supplier: jdId, skuType: 'card', face: 100, price: 97, cost: 93.5, rate: 0.02, stock: 0, image: '天猫100' },
      { name: '天猫超市卡500元', catId: 'c_card', supplier: jdId, skuType: 'card', face: 500, price: 485, cost: 468, rate: 0.02, stock: 0, image: '天猫500' },
      { name: 'QQ音乐绿钻月卡', catId: 'c_music', supplier: tencentId, skuType: 'recharge', face: 15, price: 12.5, cost: 10, rate: 0.06, stock: 9999, image: '绿钻月卡' },
      { name: 'QQ音乐绿钻年卡', catId: 'c_music', supplier: tencentId, skuType: 'recharge', face: 180, price: 148, cost: 120, rate: 0.06, stock: 9999, hot: true, image: '绿钻年卡' },
      { name: '网易云音乐黑胶月卡', catId: 'c_music', supplier: iqiyiId, skuType: 'recharge', face: 18, price: 15, cost: 12, rate: 0.06, stock: 9999, image: '黑胶月卡' },
      { name: '网易云音乐黑胶年卡', catId: 'c_music', supplier: iqiyiId, skuType: 'recharge', face: 216, price: 168, cost: 138, rate: 0.06, stock: 9999, image: '黑胶年卡' },
      { name: '腾讯视频VIP月卡', catId: 'c_video', supplier: tencentId, skuType: 'recharge', face: 30, price: 25, cost: 20, rate: 0.08, stock: 9999, hot: true, image: '腾讯视频月卡' },
      { name: '腾讯视频VIP年卡', catId: 'c_video', supplier: tencentId, skuType: 'recharge', face: 288, price: 198, cost: 160, rate: 0.08, stock: 9999, hot: true, image: '腾讯视频年卡' },
      { name: '优酷会员月卡', catId: 'c_video', supplier: iqiyiId, skuType: 'recharge', face: 25, price: 20, cost: 16, rate: 0.08, stock: 9999, image: '优酷月卡' },
      { name: '优酷会员年卡', catId: 'c_video', supplier: iqiyiId, skuType: 'recharge', face: 238, price: 168, cost: 135, rate: 0.08, stock: 9999, image: '优酷年卡' }
    ];

    const productStmt = db.prepare(`
      INSERT INTO products (id, name, category_id, supplier_id, supplier_product_id, sku_type,
        face_value, price, cost_price, commission_rate, stock, stock_warning, image, description,
        status, sort, is_hot, recharge_type, region_limit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, 1, 0, ?, 'auto', ?, ?, ?)
    `);

    const productIds: string[] = [];
    products.forEach((p, i) => {
      const id = generateId();
      productIds.push(id);
      productStmt.run(id, p.name, p.catId, p.supplier, `SKU${String(i + 1).padStart(6, '0')}`,
        p.skuType, p.face, p.price, p.cost, p.rate, p.stock, p.image,
        `${p.name}，官方直充/正品卡密，极速到账`, p.hot ? 1 : 0, null, t, t);
    });

    const meituanProducts = products.filter(p => p.supplier === meituanId || p.supplier === jdId);
    const meituanIdx = products.findIndex(p => p.name === '美团外卖券20元');
    const cardStmt = db.prepare(`
      INSERT INTO card_pool (id, product_id, supplier_id, card_number, card_password,
        encrypted_card, encrypted_password, batch_no, status, expire_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)
    `);

    const crypto = require('crypto');
    const encKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const encrypt = (text: string) => {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(encKey, 'hex');
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let enc = cipher.update(text, 'utf8', 'hex');
      enc += cipher.final('hex');
      return iv.toString('hex') + ':' + enc;
    };

    const cardProducts = [
      { idx: products.findIndex(p => p.name.includes('美团外卖券20')), count: 50, prefix: 'MT' },
      { idx: products.findIndex(p => p.name.includes('美团外卖券50')), count: 50, prefix: 'MT' },
      { idx: products.findIndex(p => p.name.includes('美团外卖券100')), count: 30, prefix: 'MT' },
      { idx: products.findIndex(p => p.name === '京东E卡100元'), count: 50, prefix: 'JDE' },
      { idx: products.findIndex(p => p.name === '京东E卡500元'), count: 30, prefix: 'JDE' },
      { idx: products.findIndex(p => p.name === '京东E卡1000元'), count: 20, prefix: 'JDE' },
      { idx: products.findIndex(p => p.name.includes('天猫超市卡100')), count: 40, prefix: 'TMC' },
      { idx: products.findIndex(p => p.name.includes('天猫超市卡500')), count: 20, prefix: 'TMC' }
    ];

    cardProducts.forEach(cp => {
      const pid = productIds[cp.idx];
      const supplier = products[cp.idx].supplier;
      for (let i = 0; i < cp.count; i++) {
        const cardNo = cp.prefix + Math.random().toString(36).slice(2, 12).toUpperCase() + String(i).padStart(4, '0');
        const cardPwd = Math.random().toString(36).slice(2, 10).toUpperCase();
        const expire = t + 86400 * 365;
        cardStmt.run(generateId(), pid, supplier, '***', '***',
          encrypt(cardNo), encrypt(cardPwd), `BATCH${cp.prefix}${t}`, expire, t);
      }

      db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(cp.count, pid);
    });

    const promoStmt = db.prepare(`
      INSERT INTO promotions (id, name, type, rules, priority, start_time, end_time, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    promoStmt.run(generateId(), '满100减10全场通用', 'full_reduction',
      JSON.stringify({ threshold: 100, value: 10, stackable: true }), 100, null, null, t);
    promoStmt.run(generateId(), '满50减5话费专享', 'full_reduction',
      JSON.stringify({ threshold: 50, value: 5, stackable: true, scope: { categoryIds: ['c_phone'] } }), 90, null, null, t);
    promoStmt.run(generateId(), '会员全场95折', 'percentage',
      JSON.stringify({ value: 95, stackable: true }), 80, null, null, t);
    promoStmt.run(generateId(), '满200返20元佣金', 'cashback',
      JSON.stringify({ threshold: 200, value: 20, stackable: false }), 70, null, null, t);

    const users = [
      { phone: '13800138001', pwd: '123456', nick: '张三', balance: 1000, ref: null },
      { phone: '13800138002', pwd: '123456', nick: '李四', balance: 500, ref: 0 },
      { phone: '13800138003', pwd: '123456', nick: '王五', balance: 300, ref: 1 },
      { phone: '13800138004', pwd: '123456', nick: '赵六', balance: 200, ref: 2 },
      { phone: '13800138005', pwd: '123456', nick: '钱七', balance: 800, ref: 0 },
      { phone: '13800138006', pwd: '123456', nick: '孙八', balance: 1500, ref: 4 },
      { phone: '13800138007', pwd: '123456', nick: '周九', balance: 600, ref: 1 },
      { phone: '13800138008', pwd: '123456', nick: '吴十', balance: 400, ref: 5 }
    ];

    const userStmt = db.prepare(`
      INSERT INTO users (id, phone, nickname, password_hash, avatar, balance, referrer_id,
        level, total_commission, available_commission, is_virtual, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const userIds: string[] = [];
    users.forEach(u => {
      const id = generateId();
      userIds.push(id);
      userStmt.run(id, u.phone, u.nick, hashPassword(u.pwd), null, u.balance,
        u.ref !== null ? userIds[u.ref] : null, u.ref === null ? 1 : 0,
        u.ref === null ? Math.random() * 500 : Math.random() * 100,
        u.ref === null ? Math.random() * 200 : Math.random() * 50, t, t);
    });

    const relStmt = db.prepare(`INSERT INTO user_relations (user_id, parent_id, depth, created_at) VALUES (?, ?, ?, ?)`);
    for (let i = 1; i < users.length; i++) {
      if (users[i].ref !== null) {
        let parent = users[i].ref as number;
        let depth = 1;
        while (parent !== null && depth <= 3 && parent < i) {
          relStmt.run(userIds[i], userIds[parent], depth, t);
          parent = users[parent].ref as number;
          depth++;
        }
      }
    }

    const chStmt = db.prepare(`
      INSERT INTO recharge_channels (id, product_id, supplier_id, priority, success_rate, last_fail_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    productIds.forEach(pid => {
      const prod: any = db.prepare('SELECT supplier_id FROM products WHERE id = ?').get(pid);
      chStmt.run(generateId(), pid, prod.supplier_id, 10, 0.98, null);
    });

    const regionStmt = db.prepare(`INSERT INTO region_limits (id, product_id, region_code, allow, created_at) VALUES (?, ?, ?, ?, ?)`);
    [productIds[3], productIds[5]].forEach(pid => {
      regionStmt.run(generateId(), pid, '新疆', 0, t);
      regionStmt.run(generateId(), pid, '西藏', 0, t);
    });

    const orderStmts = {
      insert: db.prepare(`
        INSERT INTO orders (id, user_id, product_id, product_name, supplier_id, order_no, recharge_account,
          quantity, face_value, unit_price, original_amount, discount_amount, final_amount, commission_amount,
          status, pay_time, recharge_time, finish_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      comm: db.prepare(`
        INSERT INTO commission_records (id, order_id, user_id, from_user_id, level, amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'settled', ?)
      `)
    };

    const phoneNumPool = ['13900001111', '13800002222', '13700003333', '13600004444', '13500005555', '15900006666'];
    const statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'paid', 'pending', 'failed'];
    const productPool = [0, 1, 5, 11, 12, 17, 22, 23, 26, 27];

    for (let i = 0; i < 80; i++) {
      const uid = userIds[i % userIds.length];
      const pIdx = productPool[i % productPool.length];
      const pid = productIds[pIdx];
      const prod = products[pIdx];
      const status = statuses[i % statuses.length];
      const qty = i % 3 === 0 ? 2 : 1;
      const orig = prod.price * qty;
      const disc = orig > 100 ? 10 : orig > 50 ? 5 : 0;
      const finalAmt = orig - disc;
      const comm = Math.round(finalAmt * prod.rate * 100) / 100;

      const orderId = generateId();
      const orderNo = 'V' + (t - i * 3600 * 2) + String(i).padStart(4, '0');
      const createdAt = t - Math.floor(Math.random() * 86400 * 30);
      let payTime = null, rechTime = null, finTime = null;
      if (status !== 'pending') {
        payTime = createdAt + 60;
        if (status === 'completed') {
          rechTime = payTime + 30;
          finTime = rechTime + 60;
        }
      }

      const accType = prod.skuType === 'recharge' ? phoneNumPool[i % phoneNumPool.length] : `ACC${i}${phoneNumPool[i % 6].slice(-4)}`;

      orderStmts.insert.run(orderId, uid, pid, prod.name, prod.supplier, orderNo, accType,
        qty, prod.face * qty, prod.price, orig, disc, finalAmt, comm, status,
        payTime, rechTime, finTime, createdAt, createdAt);

      if (status === 'completed') {
        const { commissionService } = require('./services/commission');
        const rels = commissionService.getAncestors(uid);
        rels.forEach(r => {
          const rateMap = [0.08, 0.04, 0.02];
          const amt = Math.round(finalAmt * (rateMap[r.depth - 1] || 0) * 100) / 100;
          if (amt > 0) {
            orderStmts.comm.run(generateId(), orderId, r.userId, uid, r.depth, amt, createdAt + 86400);
          }
        });
      }

      if (status === 'completed' && (prod.supplier === meituanId || prod.supplier === jdId)) {
        const cp = cardProducts.find(cc => products[cc.idx].name === prod.name);
        if (cp) {
          const card: any = db.prepare(`
            SELECT id FROM card_pool
            WHERE product_id = ? AND status = 'available'
            ORDER BY RANDOM() LIMIT 1
          `).get(pid);
          if (card) {
            db.prepare("UPDATE card_pool SET status = 'used', order_id = ?, used_at = ? WHERE id = ?")
              .run(orderId, finTime || createdAt, card.id);
          }
        }
      }
    }
  });

  tx();
  console.log('✅ 种子数据导入完成！');
  console.log('📝 默认用户账号: 13800138001 ~ 13800138008, 密码: 123456');
  console.log('🔐 管理后台: 用户名 admin, 密码 admin123');
};

seedData();
