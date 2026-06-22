import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'app.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT,
    id_number TEXT,
    id_card_image_url TEXT,
    verify_status TEXT DEFAULT 'unverified',
    role TEXT DEFAULT 'owner',
    vet_license TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    species TEXT NOT NULL CHECK(species IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'other')),
    birth_date DATE,
    weight REAL,
    chip_number TEXT UNIQUE,
    gender TEXT CHECK(gender IN ('male', 'female', 'unknown')),
    avatar_url TEXT,
    is_sterilized BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vaccine_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL REFERENCES pets(id),
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT NOT NULL CHECK(vaccine_type IN ('vaccine', 'deworming', 'flea_tick')),
    vaccine_date DATE NOT NULL,
    next_date DATE,
    hospital TEXT,
    ocr_image_url TEXT,
    ocr_confidence REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL REFERENCES pets(id),
    reminder_type TEXT NOT NULL,
    title TEXT NOT NULL,
    reminder_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adoptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL REFERENCES pets(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'pending_review',
    reason TEXT,
    requirements TEXT,
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adoption_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adoption_id INTEGER NOT NULL REFERENCES adoptions(id),
    applicant_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'submitted',
    experience TEXT,
    living_condition TEXT,
    has_other_pets BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS breedings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL REFERENCES pets(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'pending_review',
    pedigree_cert_url TEXT,
    fee REAL DEFAULT 0,
    requirements TEXT,
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS breeding_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    breeding_id INTEGER NOT NULL REFERENCES breedings(id),
    matched_pet_id INTEGER NOT NULL REFERENCES pets(id),
    match_score REAL,
    status TEXT DEFAULT 'suggested'
);

CREATE TABLE IF NOT EXISTS escrow_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    breeding_id INTEGER NOT NULL REFERENCES breedings(id),
    amount REAL NOT NULL,
    payer_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qa_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    view_count INTEGER DEFAULT 0,
    heat_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qa_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES qa_questions(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_certified BOOLEAN DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vet_certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    answer_id INTEGER NOT NULL REFERENCES qa_answers(id),
    vet_id INTEGER NOT NULL REFERENCES users(id),
    certificate_number TEXT,
    certified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    image_urls TEXT,
    topic_tags TEXT,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    review_status TEXT DEFAULT 'pending',
    risk_level TEXT DEFAULT 'low',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES community_posts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES community_posts(id),
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    result TEXT,
    reason TEXT,
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    description TEXT,
    is_compliant BOOLEAN DEFAULT 1,
    compliance_info TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS filing_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filing_type TEXT NOT NULL,
    related_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    request_data TEXT,
    response_data TEXT,
    filed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_pet ON vaccine_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pet_date ON health_reminders(pet_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_adoptions_status ON adoptions(status);
CREATE INDEX IF NOT EXISTS idx_breedings_status ON breedings(status);
CREATE INDEX IF NOT EXISTS idx_qa_heat ON qa_questions(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_review ON community_posts(review_status);
CREATE INDEX IF NOT EXISTS idx_filing_status ON filing_records(status);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, password_hash, real_name, id_number, verify_status, role, vet_license, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertUser.run(1, '13800000001', '管理员', 'hash_admin', '管理員', '110101199001011234', 'verified', 'admin', null, null)
  insertUser.run(2, '13800000002', '张三', 'hash_zhangsan', '张三', '110101199202022345', 'verified', 'owner', null, null)
  insertUser.run(3, '13800000003', '李四', 'hash_lisi', '李四', '110101199303033456', 'verified', 'owner', null, null)
  insertUser.run(4, '13800000004', '王五', 'hash_wangwu', null, null, 'unverified', 'adopter', null, null)
  insertUser.run(5, '13800000005', '赵医生', 'hash_zhaoyisheng', '赵明', '110101198805055678', 'verified', 'vet', 'VET-2024-0001', null)

  const insertPet = db.prepare(`
    INSERT INTO pets (id, owner_id, name, breed, species, birth_date, weight, chip_number, gender, avatar_url, is_sterilized)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertPet.run(1, 2, '大黄', '金毛寻回犬', 'dog', '2021-03-15', 30.5, 'CN20210315001', 'male', null, 0)
  insertPet.run(2, 2, '小花', '英国短毛猫', 'cat', '2022-06-20', 4.2, 'CN20220620002', 'female', null, 1)
  insertPet.run(3, 3, '旺财', '柯基犬', 'dog', '2020-11-10', 12.0, 'CN20201110003', 'male', null, 0)
  insertPet.run(4, 3, '雪球', '安哥拉兔', 'rabbit', '2023-01-05', 2.5, null, 'female', null, 1)
  insertPet.run(5, 2, '皮皮', '虎皮鹦鹉', 'bird', '2022-09-18', 0.04, null, 'male', null, 0)
  insertPet.run(6, 3, '团子', '仓鼠', 'hamster', '2024-02-14', 0.04, null, 'female', null, 0)

  const insertVaccine = db.prepare(`
    INSERT INTO vaccine_records (id, pet_id, vaccine_name, vaccine_type, vaccine_date, next_date, hospital, ocr_image_url, ocr_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertVaccine.run(1, 1, '犬瘟热疫苗', 'vaccine', '2024-03-15', '2025-03-15', '宠安动物医院', null, null)
  insertVaccine.run(2, 1, '体内驱虫', 'deworming', '2024-06-01', '2024-09-01', '宠安动物医院', null, null)
  insertVaccine.run(3, 1, '体外驱虫(福来恩)', 'flea_tick', '2024-07-01', '2024-08-01', '宠安动物医院', null, null)
  insertVaccine.run(4, 2, '猫三联疫苗', 'vaccine', '2024-04-10', '2025-04-10', '爱心宠物诊所', null, null)
  insertVaccine.run(5, 2, '狂犬疫苗', 'vaccine', '2024-04-10', '2025-04-10', '爱心宠物诊所', null, null)
  insertVaccine.run(6, 3, '犬瘟热疫苗', 'vaccine', '2024-01-20', '2025-01-20', '宠安动物医院', null, null)
  insertVaccine.run(7, 3, '体内驱虫', 'deworming', '2024-05-15', '2024-08-15', '宠安动物医院', '/uploads/vaccine_ocr_3.jpg', 0.92)
  insertVaccine.run(8, 4, '兔瘟疫苗', 'vaccine', '2024-02-20', '2025-02-20', '爱心宠物诊所', null, null)

  const insertReminder = db.prepare(`
    INSERT INTO health_reminders (id, pet_id, reminder_type, title, reminder_date, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertReminder.run(1, 1, 'vaccine', '犬瘟热疫苗加强针', '2025-03-15', 0)
  insertReminder.run(2, 1, 'deworming', '体内驱虫', '2024-09-01', 0)
  insertReminder.run(3, 2, 'vaccine', '猫三联疫苗加强针', '2025-04-10', 0)
  insertReminder.run(4, 3, 'vaccine', '犬瘟热疫苗加强针', '2025-01-20', 1)
  insertReminder.run(5, 4, 'checkup', '年度体检', '2025-02-20', 0)

  const insertAdoption = db.prepare(`
    INSERT INTO adoptions (id, pet_id, owner_id, status, reason, requirements, images)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  insertAdoption.run(1, 2, 2, 'approved', '因工作调动无法继续照顾', '希望领养人有稳定住所，有养猫经验', '["img1.jpg","img2.jpg"]')
  insertAdoption.run(2, 4, 3, 'pending_review', '家庭原因无法继续饲养', '需要笼子和日常照料经验', '["img3.jpg"]')
  insertAdoption.run(3, 5, 2, 'completed', '孩子过敏无法继续养鸟', '需要有养鸟经验', '[]')
  insertAdoption.run(4, 6, 3, 'rejected', '仓鼠太多养不过来', '需要单独笼子', '["img4.jpg"]')

  const insertApp = db.prepare(`
    INSERT INTO adoption_applications (id, adoption_id, applicant_id, status, experience, living_condition, has_other_pets)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  insertApp.run(1, 1, 4, 'approved', '之前养过两只猫', '两居室，阳台封窗', 0)
  insertApp.run(2, 2, 4, 'submitted', '养过兔子', '独栋带院子', 1)
  insertApp.run(3, 3, 4, 'approved', '家里有鸟笼', '三居室', 0)

  const insertBreeding = db.prepare(`
    INSERT INTO breedings (id, pet_id, owner_id, status, pedigree_cert_url, fee, requirements, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertBreeding.run(1, 1, 2, 'approved', '/certs/golden_pedigree.pdf', 2000, '要求母犬有血统证明，健康无遗传病', '["dog1.jpg","dog2.jpg"]')
  insertBreeding.run(2, 3, 3, 'pending_review', '/certs/corgi_pedigree.pdf', 1500, '要求柯基犬，健康活泼', '["corgi1.jpg"]')
  insertBreeding.run(3, 2, 2, 'completed', null, 800, '要求英短蓝猫配种', '[]')

  const insertMatch = db.prepare(`
    INSERT INTO breeding_matches (id, breeding_id, matched_pet_id, match_score, status)
    VALUES (?, ?, ?, ?, ?)
  `)
  insertMatch.run(1, 1, 3, 0.85, 'suggested')
  insertMatch.run(2, 2, 1, 0.72, 'suggested')

  const insertEscrow = db.prepare(`
    INSERT INTO escrow_payments (id, breeding_id, amount, payer_id, status)
    VALUES (?, ?, ?, ?, ?)
  `)
  insertEscrow.run(1, 3, 800, 3, 'released')

  const insertQuestion = db.prepare(`
    INSERT INTO qa_questions (id, user_id, title, content, category, view_count, heat_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  insertQuestion.run(1, 2, '金毛犬掉毛严重怎么办？', '我家金毛最近掉毛非常严重，每天家里到处都是毛，请问有什么好的解决方法吗？', '护理', 256, 78.5)
  insertQuestion.run(2, 3, '柯基犬容易患哪些疾病？', '想了解一下柯基犬常见的健康问题，方便提前预防', '健康', 189, 65.2)
  insertQuestion.run(3, 4, '新手养猫需要注意什么？', '准备领养一只猫，想了解新手养猫的基本知识和注意事项', '新手指南', 342, 92.1)
  insertQuestion.run(4, 2, '兔子可以吃哪些蔬菜？', '刚养了兔子，不太清楚它的饮食禁忌', '饮食', 98, 45.3)
  insertQuestion.run(5, 3, '仓鼠笼子怎么布置？', '新手养仓鼠，想知道笼子里需要放哪些东西', '新手指南', 156, 58.7)

  const insertAnswer = db.prepare(`
    INSERT INTO qa_answers (id, question_id, user_id, content, is_certified, like_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertAnswer.run(1, 1, 5, '金毛掉毛是正常的生理现象，建议每天梳理毛发，使用去毛梳。同时注意饮食均衡，补充鱼油和卵磷脂有助于改善毛质。', 1, 42)
  insertAnswer.run(2, 1, 3, '可以用吸尘器定期清理，换季的时候掉毛会更严重，过了换毛期就好了。', 0, 18)
  insertAnswer.run(3, 2, 5, '柯基犬容易患腰椎间盘突出、髋关节发育不良和肥胖症。建议控制体重，避免频繁上下楼梯，定期做X光检查。', 1, 35)
  insertAnswer.run(4, 3, 5, '新手养猫需要准备猫粮、猫砂盆、饮水器、猫抓板等基本用品。另外建议尽快做体检和打疫苗，适龄绝育也很重要。', 1, 67)
  insertAnswer.run(5, 3, 2, '可以先从领养成年猫开始，性格稳定也更容易照顾。记得封窗防止猫咪坠楼。', 0, 28)
  insertAnswer.run(6, 4, 5, '兔子可以吃生菜、芹菜、胡萝卜叶等蔬菜，但要避免洋葱、大蒜、土豆等。每天以干草为主食，蔬菜适量即可。', 1, 15)
  insertAnswer.run(7, 5, 2, '仓鼠笼需要跑轮、食盆、饮水器、木屑垫料和小窝，空间越大越好。', 0, 22)

  const insertPost = db.prepare(`
    INSERT INTO community_posts (id, user_id, content, image_urls, topic_tags, like_count, comment_count, review_status, risk_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertPost.run(1, 2, '今天带大黄去打了疫苗，小家伙很勇敢！', '["dog_vaccine.jpg"]', '["疫苗","金毛"]', 24, 5, 'approved', 'low')
  insertPost.run(2, 3, '旺财今天学会了握手，太聪明了！', '["corgi_shake.jpg"]', '["训练","柯基"]', 56, 12, 'approved', 'low')
  insertPost.run(3, 4, '求推荐好用的猫砂，家里猫咪用的总是带出来', null, '["猫咪","用品"]', 18, 8, 'approved', 'low')
  insertPost.run(4, 2, '分享我家小花的美照～', '["cat_beauty.jpg"]', '["猫咪","日常"]', 42, 7, 'approved', 'low')
  insertPost.run(5, 5, '关于宠物疫苗的常见误区，很多人都不知道', null, '["疫苗","科普"]', 89, 15, 'approved', 'low')
  insertPost.run(6, 3, '兔子雪球的日常萌照，每天都能治愈我', '["rabbit_cute.jpg"]', '["兔子","日常"]', 33, 4, 'approved', 'low')
  insertPost.run(7, 4, '有没有人一起组织周末遛狗活动？', null, '["遛狗","活动"]', 27, 9, 'approved', 'low')
  insertPost.run(8, 2, '求推荐靠谱的宠物医院，最好在朝阳区附近', null, '["医院","求助"]', 15, 6, 'pending', 'low')

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, price, image_url, description, is_compliant, compliance_info, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertProduct.run(1, '皇家金毛专用粮 15kg', '狗粮', 389, '/products/royal_canin_golden.jpg', '专为金毛犬设计，含欧米伽3和6脂肪酸', 1, '京饲审(2024)第001号', 200)
  insertProduct.run(2, '渴望六种鱼猫粮 5.4kg', '猫粮', 459, '/products/orijen_fish.jpg', '高蛋白低碳水，含新鲜鱼肉', 1, '京饲审(2024)第002号', 150)
  insertProduct.run(3, '福来恩体外驱虫滴剂', '驱虫', 168, '/products/frontline.jpg', '杀灭跳蚤蜱虫，持效30天', 1, '兽药字(2024)第003号', 500)
  insertProduct.run(4, '兔用提摩西草 2kg', '牧草', 45, '/products/timothy_hay.jpg', '高纤维低蛋白，适合成年兔子', 1, '京饲审(2024)第004号', 300)
  insertProduct.run(5, '仓鼠豪华笼套装', '笼具', 199, '/products/hamster_cage.jpg', '含跑轮食盆饮水器，大空间设计', 1, null, 80)
  insertProduct.run(6, '宠物智能饮水机', '用品', 129, '/products/water_fountain.jpg', '流动活水，3L大容量，静音设计', 1, null, 120)

  const insertFiling = db.prepare(`
    INSERT INTO filing_records (id, filing_type, related_id, status, request_data, response_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertFiling.run(1, 'adoption', 1, 'completed', '{"adoption_id":1,"pet_id":2}', '{"code":"200","message":"备案成功"}')
  insertFiling.run(2, 'breeding', 1, 'completed', '{"breeding_id":1,"pet_id":1}', '{"code":"200","message":"备案成功"}')
  insertFiling.run(3, 'breeding', 3, 'pending', '{"breeding_id":3,"pet_id":2}', null)
}

export default db
