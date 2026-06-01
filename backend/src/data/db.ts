import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const DB_PATH = path.resolve(dataDir, 'app.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS photographers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    style TEXT,
    city TEXT,
    phone TEXT,
    bio TEXT,
    avatar TEXT,
    rating REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photographer_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photographer_id INTEGER REFERENCES photographers(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    includes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photographer_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photographer_id INTEGER REFERENCES photographers(id),
    date TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    booking_id INTEGER REFERENCES bookings(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photographer_id, date)
  );

  CREATE TABLE IF NOT EXISTS photographer_portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photographer_id INTEGER REFERENCES photographers(id),
    title TEXT,
    category TEXT,
    image_url TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    photographer_id INTEGER REFERENCES photographers(id),
    shoot_type TEXT,
    shoot_date TEXT NOT NULL,
    shoot_time TEXT,
    location TEXT,
    people_count INTEGER DEFAULT 1,
    requirements TEXT,
    budget REAL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    booking_id INTEGER REFERENCES bookings(id),
    package_name TEXT,
    amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    deposit REAL DEFAULT 0,
    deposit_paid INTEGER DEFAULT 0,
    contract_signed INTEGER DEFAULT 0,
    checklist TEXT DEFAULT '[]',
    reminder_sent INTEGER DEFAULT 0,
    reschedule_count INTEGER DEFAULT 0,
    reschedule_reason TEXT,
    cancel_reason TEXT,
    cancel_time TEXT,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    album_name TEXT,
    delivery_date TEXT,
    channel TEXT DEFAULT '网盘',
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    selection_done INTEGER DEFAULT 0,
    selection_count INTEGER DEFAULT 0,
    retouching_stage TEXT DEFAULT '未开始',
    retouching_count INTEGER DEFAULT 0,
    download_url TEXT,
    extra_retouch_count INTEGER DEFAULT 0,
    extra_retouch_fee REAL DEFAULT 0,
    delivery_confirmed INTEGER DEFAULT 0,
    confirmed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    client_name TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    resolution TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS refund_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    amount REAL NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.pragma('user_version = 0');
const dbVersion = db.pragma('user_version', { simple: true }) as number;
if (dbVersion < 1) {
  const tableInfo = db.prepare("PRAGMA table_info(refund_records)").all() as { name: string }[];
  const hasUpdatedAt = tableInfo.some((col) => col.name === 'updated_at');
  if (!hasUpdatedAt) {
    db.exec('ALTER TABLE refund_records ADD COLUMN updated_at TEXT');
    db.prepare('UPDATE refund_records SET updated_at = created_at').run();
  }
  db.pragma('user_version = 1');
}

function seedData() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM photographers').get() as { c: number }).c;
  if (count > 0) return;

  const seed = db.transaction(() => {
    const insertPhotographer = db.prepare(`
      INSERT INTO photographers (name, style, city, phone, bio, avatar, rating)
      VALUES (@name, @style, @city, @phone, @bio, @avatar, @rating)
    `);

    const photographers = [
      {
        name: '林小雅',
        style: '日系清新',
        city: '杭州',
        phone: '13800001111',
        bio: '专注日系清新风格摄影8年，擅长自然光拍摄，记录生活中最温柔的瞬间。作品曾被《摄影之友》收录。',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20a%20young%20female%20photographer%2C%20soft%20natural%20lighting%2C%20japanese%20aesthetic%2C%20minimalist%20style&image_size=square',
        rating: 4.9,
      },
      {
        name: '张明远',
        style: '商业时尚',
        city: '上海',
        phone: '13800002222',
        bio: '资深商业摄影师，曾为多个国际品牌拍摄广告大片。擅长时尚人像与产品摄影，追求极致光影效果。',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20a%20male%20fashion%20photographer%2C%20studio%20lighting%2C%20professional%20look%2C%20modern%20style&image_size=square',
        rating: 4.8,
      },
      {
        name: '陈思雨',
        style: '复古胶片',
        city: '成都',
        phone: '13800003333',
        bio: '胶片摄影爱好者，沉迷于复古色调与颗粒质感。每张照片都带着时光的温度，让记忆有了质感和颜色。',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20an%20artistic%20female%20photographer%2C%20vintage%20film%20aesthetic%2C%20warm%20tones%2C%20artistic%20style&image_size=square',
        rating: 4.7,
      },
    ];

    const photographerIds: number[] = [];
    for (const p of photographers) {
      const result = insertPhotographer.run(p);
      photographerIds.push(Number(result.lastInsertRowid));
    }

    const insertPackage = db.prepare(`
      INSERT INTO photographer_packages (photographer_id, name, price, description, includes)
      VALUES (@photographer_id, @name, @price, @description, @includes)
    `);

    const packages = [
      { photographer_id: photographerIds[0], name: '清新日常套餐', price: 2999, description: '日常清新风格拍摄，自然光影', includes: '2套服装+精修30张+1分钟花絮' },
      { photographer_id: photographerIds[0], name: '旅拍轻奢套餐', price: 5999, description: '户外旅拍，记录旅途美好', includes: '3套服装+精修60张+3分钟短片+相册一本' },
      { photographer_id: photographerIds[0], name: '日系写真特辑', price: 8999, description: '深度日系写真创作', includes: '4套服装+精修100张+5分钟微电影+精美相册+放大照片2张' },

      { photographer_id: photographerIds[1], name: '商务形象套餐', price: 3999, description: '专业商务形象照拍摄', includes: '2套造型+精修20张+个人品牌图' },
      { photographer_id: photographerIds[1], name: '时尚大片套餐', price: 7999, description: '杂志级时尚人像拍摄', includes: '3套造型+精修50张+2分钟时尚短片+相册一本' },
      { photographer_id: photographerIds[1], name: '品牌视觉全案', price: 15999, description: '品牌视觉全套解决方案', includes: '5套场景+精修100张+品牌视频3分钟+全套视觉资产' },

      { photographer_id: photographerIds[2], name: '胶片写真套餐', price: 3499, description: '复古胶片风格人像', includes: '2卷胶片+数码双修40张+胶片原片扫描' },
      { photographer_id: photographerIds[2], name: '复古婚纱套餐', price: 8999, description: '复古风格婚纱摄影', includes: '3套造型+精修80张+4分钟复古风短片+手工相册' },
      { photographer_id: photographerIds[2], name: '时光记忆特辑', price: 12999, description: '深度复古风格创作', includes: '5套造型+胶片数码双修120张+微电影+精装相册+放大照片3张' },
    ];

    for (const pkg of packages) {
      insertPackage.run(pkg);
    }

    const insertPortfolio = db.prepare(`
      INSERT INTO photographer_portfolio (photographer_id, title, category, image_url, description, sort_order)
      VALUES (@photographer_id, @title, @category, @image_url, @description, @sort_order)
    `);

    const portfolioItems = [
      {
        photographer_id: photographerIds[0], title: '午后阳光', category: '人像',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20aesthetic%20portrait%20of%20a%20girl%20in%20soft%20afternoon%20sunlight%2C%20natural%20lifestyle%20photography%2C%20light%20and%20airy&image_size=landscape_16_9',
        description: '午后窗边的温柔瞬间', sort_order: 1,
      },
      {
        photographer_id: photographerIds[0], title: '花间漫步', category: '户外',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=girl%20walking%20through%20flower%20garden%2C%20japanese%20fresh%20style%20photography%2C%20pastel%20colors%2C%20natural%20light&image_size=landscape_16_9',
        description: '花海中的自由漫步', sort_order: 2,
      },
      {
        photographer_id: photographerIds[0], title: '雨后街巷', category: '街拍',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rainy%20street%20scene%20with%20person%20with%20umbrella%2C%20japanese%20cinematic%20photography%2C%20moody%20atmosphere&image_size=landscape_16_9',
        description: '雨后杭州小巷的光影', sort_order: 3,
      },
      {
        photographer_id: photographerIds[0], title: '温柔日常', category: '生活',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20lifestyle%20photography%2C%20girl%20reading%20book%20at%20cafe%2C%20warm%20natural%20lighting%2C%20japanese%20aesthetic&image_size=landscape_16_9',
        description: '咖啡厅里的安静时光', sort_order: 4,
      },
      {
        photographer_id: photographerIds[0], title: '晨雾中的西湖', category: '风光',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=west%20lake%20hangzhou%20morning%20mist%2C%20landscape%20photography%2C%20ethereal%20atmosphere%2C%20soft%20pastel%20tones&image_size=landscape_16_9',
        description: '西湖晨曦中的朦胧美', sort_order: 5,
      },

      {
        photographer_id: photographerIds[1], title: '都市锋芒', category: '时尚',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20photography%20portrait%2C%20dramatic%20studio%20lighting%2C%20high%20contrast%20black%20and%20white%20with%20color%20accent%2C%20vogue%20style&image_size=landscape_16_9',
        description: '都市摩登时尚大片', sort_order: 1,
      },
      {
        photographer_id: photographerIds[1], title: '光影质感', category: '商业',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20product%20photography%2C%20luxury%20watch%20on%20dark%20background%2C%20dramatic%20lighting%2C%20commercial%20style&image_size=landscape_16_9',
        description: '高端产品光影拍摄', sort_order: 2,
      },
      {
        photographer_id: photographerIds[1], title: '品牌故事', category: '品牌',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=brand%20story%20photography%2C%20fashion%20designer%20at%20work%2C%20editorial%20style%2C%20natural%20and%20studio%20lighting%20mix&image_size=landscape_16_9',
        description: '品牌形象视觉创作', sort_order: 3,
      },
      {
        photographer_id: photographerIds[1], title: '夜间霓虹', category: '时尚',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=neon%20night%20portrait%20photography%2C%20fashion%20model%20in%20city%20lights%2C%20cyberpunk%20aesthetic%2C%20vibrant%20colors&image_size=landscape_16_9',
        description: '霓虹灯下的时尚人像', sort_order: 4,
      },
      {
        photographer_id: photographerIds[1], title: '极简之美', category: '商业',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20commercial%20photography%2C%20clean%20white%20background%2C%20luxury%20product%2C%20elegant%20composition&image_size=landscape_16_9',
        description: '极简风格商业摄影', sort_order: 5,
      },
      {
        photographer_id: photographerIds[1], title: '秀场瞬间', category: '时尚',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20show%20runway%20photography%2C%20model%20on%20catwalk%2C%20dramatic%20spotlight%2C%20high%20fashion&image_size=landscape_16_9',
        description: '时装秀场精彩瞬间', sort_order: 6,
      },

      {
        photographer_id: photographerIds[2], title: '旧时光', category: '人像',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20film%20photography%20portrait%2C%20retro%20color%20palette%2C%20film%20grain%20texture%2C%20nostalgic%20mood%2C%2090s%20aesthetic&image_size=landscape_16_9',
        description: '胶片质感的怀旧人像', sort_order: 1,
      },
      {
        photographer_id: photographerIds[2], title: '巷子深处', category: '街拍',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=old%20alley%20street%20photography%2C%20vintage%20film%20grain%20look%2C%20warm%20analog%20tones%2C%20chinese%20old%20town&image_size=landscape_16_9',
        description: '成都老巷子的胶片记录', sort_order: 2,
      },
      {
        photographer_id: photographerIds[2], title: '时光情书', category: '婚纱',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20wedding%20photography%2C%20retro%20film%20aesthetic%2C%20couple%20in%20antique%20setting%2C%20warm%20golden%20tones&image_size=landscape_16_9',
        description: '复古风格婚纱摄影', sort_order: 3,
      },
      {
        photographer_id: photographerIds[2], title: '烟火人间', category: '生活',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=street%20food%20market%20photography%2C%20vintage%20film%20look%2C%20warm%20analog%20colors%2C%20chinese%20night%20market&image_size=landscape_16_9',
        description: '市井烟火的胶片记忆', sort_order: 4,
      },
    ];

    for (const item of portfolioItems) {
      insertPortfolio.run(item);
    }

    const insertSchedule = db.prepare(`
      INSERT OR IGNORE INTO photographer_schedule (photographer_id, date, status)
      VALUES (@photographer_id, @date, @status)
    `);

    const today = new Date();
    const formatDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const addDays = (d: Date, n: number): Date => {
      const r = new Date(d);
      r.setDate(r.getDate() + n);
      return r;
    };

    const gapPatterns = [
      [0, 1, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26, 28, 29],
      [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 25, 26, 28],
      [1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22, 23, 26, 27, 28, 29],
    ];

    for (let pIdx = 0; pIdx < photographerIds.length; pIdx++) {
      for (const dayOffset of gapPatterns[pIdx]) {
        const dateStr = formatDate(addDays(today, dayOffset + 1));
        insertSchedule.run({ photographer_id: photographerIds[pIdx], date: dateStr, status: 'available' });
      }
    }

    const insertBooking = db.prepare(`
      INSERT INTO bookings (client_name, client_phone, client_email, photographer_id, shoot_type, shoot_date, shoot_time, location, people_count, requirements, budget, status, notes)
      VALUES (@client_name, @client_phone, @client_email, @photographer_id, @shoot_type, @shoot_date, @shoot_time, @location, @people_count, @requirements, @budget, @status, @notes)
    `);

    const bookings = [
      {
        client_name: '王小美', client_phone: '13900001111', client_email: 'xiaomei@example.com',
        photographer_id: photographerIds[0], shoot_type: '个人写真', shoot_date: formatDate(addDays(today, 3)),
        shoot_time: '14:00', location: '杭州西湖', people_count: 1, requirements: '希望风格偏自然清新',
        budget: 3000, status: 'confirmed', notes: '客户喜欢自然光',
      },
      {
        client_name: '李建国', client_phone: '13900002222', client_email: 'jianguo@example.com',
        photographer_id: photographerIds[1], shoot_type: '商务形象', shoot_date: formatDate(addDays(today, 5)),
        shoot_time: '10:00', location: '上海陆家嘴', people_count: 1, requirements: '需要商务正装和休闲两套',
        budget: 5000, status: 'pending', notes: '',
      },
      {
        client_name: '赵薇薇', client_phone: '13900003333', client_email: 'weiwei@example.com',
        photographer_id: photographerIds[2], shoot_type: '婚纱摄影', shoot_date: formatDate(addDays(today, 8)),
        shoot_time: '09:00', location: '成都宽窄巷子', people_count: 2, requirements: '复古胶片风格婚纱',
        budget: 10000, status: 'confirmed', notes: '需要提前沟通服装搭配',
      },
      {
        client_name: '孙明辉', client_phone: '13900004444', client_email: 'minghui@example.com',
        photographer_id: photographerIds[0], shoot_type: '情侣写真', shoot_date: formatDate(addDays(today, 12)),
        shoot_time: '16:00', location: '杭州西溪湿地', people_count: 2, requirements: '日系情侣风格',
        budget: 4000, status: 'pending', notes: '希望夕阳时分拍摄',
      },
      {
        client_name: '周雅琴', client_phone: '13900005555', client_email: 'yaqin@example.com',
        photographer_id: photographerIds[1], shoot_type: '时尚大片', shoot_date: formatDate(addDays(today, 15)),
        shoot_time: '13:00', location: '上海外滩', people_count: 1, requirements: '时尚杂志风格',
        budget: 8000, status: 'completed', notes: '',
      },
    ];

    const bookingIds: number[] = [];
    for (const b of bookings) {
      const result = insertBooking.run(b);
      bookingIds.push(Number(result.lastInsertRowid));

      if (b.status === 'confirmed' || b.status === 'completed') {
        db.prepare(`
          UPDATE photographer_schedule
          SET status = 'booked', booking_id = ?
          WHERE photographer_id = ? AND date = ?
        `).run(Number(result.lastInsertRowid), b.photographer_id, b.shoot_date);
      }
    }

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, booking_id, package_name, amount, paid_amount, deposit, deposit_paid, contract_signed, checklist, status, due_date)
      VALUES (@order_no, @booking_id, @package_name, @amount, @paid_amount, @deposit, @deposit_paid, @contract_signed, @checklist, @status, @due_date)
    `);

    const orders = [
      {
        order_no: 'PB' + Date.now() + '001',
        booking_id: bookingIds[0],
        package_name: '清新日常套餐',
        amount: 2999,
        paid_amount: 999,
        deposit: 999,
        deposit_paid: 1,
        contract_signed: 1,
        checklist: JSON.stringify(['确认拍摄时间', '选服装', '沟通拍摄风格']),
        status: 'in_progress',
        due_date: formatDate(addDays(today, 20)),
      },
      {
        order_no: 'PB' + Date.now() + '002',
        booking_id: bookingIds[2],
        package_name: '复古婚纱套餐',
        amount: 8999,
        paid_amount: 3000,
        deposit: 3000,
        deposit_paid: 1,
        contract_signed: 0,
        checklist: JSON.stringify(['确认拍摄时间', '选服装']),
        status: 'pending',
        due_date: formatDate(addDays(today, 30)),
      },
      {
        order_no: 'PB' + Date.now() + '003',
        booking_id: bookingIds[4],
        package_name: '时尚大片套餐',
        amount: 7999,
        paid_amount: 7999,
        deposit: 3000,
        deposit_paid: 1,
        contract_signed: 1,
        checklist: JSON.stringify(['确认拍摄时间', '选服装', '沟通拍摄风格', '后期修图']),
        status: 'completed',
        due_date: formatDate(addDays(today, -5)),
      },
    ];

    const orderIds: number[] = [];
    for (const o of orders) {
      const result = insertOrder.run(o);
      orderIds.push(Number(result.lastInsertRowid));
    }

    const insertDelivery = db.prepare(`
      INSERT INTO deliveries (order_id, album_name, delivery_date, channel, status, progress, selection_done, selection_count, retouching_stage, retouching_count, download_url, extra_retouch_count, extra_retouch_fee, delivery_confirmed)
      VALUES (@order_id, @album_name, @delivery_date, @channel, @status, @progress, @selection_done, @selection_count, @retouching_stage, @retouching_count, @download_url, @extra_retouch_count, @extra_retouch_fee, @delivery_confirmed)
    `);

    const deliveries = [
      {
        order_id: orderIds[0],
        album_name: '小美清新写真',
        delivery_date: formatDate(addDays(today, 25)),
        channel: '网盘',
        status: '选片中',
        progress: 30,
        selection_done: 0,
        selection_count: 0,
        retouching_stage: '未开始',
        retouching_count: 0,
        download_url: '',
        extra_retouch_count: 0,
        extra_retouch_fee: 0,
        delivery_confirmed: 0,
      },
      {
        order_id: orderIds[2],
        album_name: '明辉时尚大片',
        delivery_date: formatDate(addDays(today, -3)),
        channel: '网盘',
        status: '待确认',
        progress: 85,
        selection_done: 1,
        selection_count: 60,
        retouching_stage: '已完成',
        retouching_count: 50,
        download_url: 'https://pan.example.com/download/abc123',
        extra_retouch_count: 3,
        extra_retouch_fee: 450,
        delivery_confirmed: 0,
      },
    ];

    for (const d of deliveries) {
      insertDelivery.run(d);
    }

    db.prepare(`
      INSERT INTO complaints (order_id, client_name, content, status, resolution)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      orderIds[0],
      '王小美',
      '选片时间太长，希望加快进度',
      'open',
      null
    );

    db.prepare(`
      INSERT INTO refund_records (order_id, amount, reason, status)
      VALUES (?, ?, ?, ?)
    `).run(
      orderIds[1],
      3000,
      '拍摄日期冲突需要退款',
      'pending'
    );
  });

  seed();
}

seedData();

export { db };
