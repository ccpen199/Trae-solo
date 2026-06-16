import type Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

interface SeedContext {
  ownerIds: string[]
  doctorUserIds: string[]
  hospitalUserIds: string[]
  merchantUserIds: string[]
  petIds: string[]
  doctorIds: string[]
  hospitalIds: string[]
  merchantIds: string[]
  productIds: string[]
  consultationIds: string[]
  prescriptionIds: string[]
  postIds: string[]
  taskIds: string[]
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

function randomDate(daysAgo: number, daysLater: number = 0): string {
  const now = new Date()
  const offset = Math.floor(Math.random() * (daysAgo + daysLater)) - daysAgo
  now.setDate(now.getDate() + offset)
  return now.toISOString().slice(0, 19).replace('T', ' ')
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function createUsers(db: Database.Database, ctx: SeedContext): void {
  const insertUser = db.prepare(
    'INSERT INTO users (id, role, phone, password_hash, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const owners = [
    { phone: '13800000001', nickname: '张小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner1' },
    { phone: '13800000002', nickname: '李小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner2' },
    { phone: '13800000003', nickname: '王小刚', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner3' },
    { phone: '13800000004', nickname: '赵小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner4' },
    { phone: '13800000005', nickname: '陈小华', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner5' },
  ]

  for (const o of owners) {
    const id = uuidv4()
    insertUser.run(id, 'owner', o.phone, hashPassword('123456'), o.nickname, o.avatar, randomDate(180))
    ctx.ownerIds.push(id)
  }

  const doctors = [
    { phone: '13900000001', nickname: '王医生' },
    { phone: '13900000002', nickname: '李医生' },
    { phone: '13900000003', nickname: '张医生' },
    { phone: '13900000004', nickname: '刘医生' },
  ]

  for (const d of doctors) {
    const id = uuidv4()
    insertUser.run(id, 'doctor', d.phone, hashPassword('123456'), d.nickname, `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.nickname}`, randomDate(200))
    ctx.doctorUserIds.push(id)
  }

  const hospitals = [
    { phone: '13700000001', nickname: '爱宠宠物医院' },
    { phone: '13700000002', nickname: '康宠动物诊所' },
    { phone: '13700000003', nickname: '佳宠医疗中心' },
  ]

  for (const h of hospitals) {
    const id = uuidv4()
    insertUser.run(id, 'hospital', h.phone, hashPassword('123456'), h.nickname, `https://api.dicebear.com/7.x/shapes/svg?seed=${h.nickname}`, randomDate(250))
    ctx.hospitalUserIds.push(id)
  }

  const merchants = [
    { phone: '13600000001', nickname: '宠物优选商城' },
    { phone: '13600000002', nickname: '爱宠生活馆' },
  ]

  for (const m of merchants) {
    const id = uuidv4()
    insertUser.run(id, 'merchant', m.phone, hashPassword('123456'), m.nickname, `https://api.dicebear.com/7.x/shapes/svg?seed=${m.nickname}`, randomDate(220))
    ctx.merchantUserIds.push(id)
  }
}

function createDoctors(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO doctors (id, user_id, hospital_id, name, title, department, license_number, license_verified, rating, consultation_count, is_online) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const doctorInfos = [
    { name: '王建国', title: '主任医师', department: '内科', license: 'DOC20240101' },
    { name: '李美丽', title: '副主任医师', department: '外科', license: 'DOC20240102' },
    { name: '张晓明', title: '主治医师', department: '皮肤科', license: 'DOC20240103' },
    { name: '刘芳芳', title: '主治医师', department: '牙科', license: 'DOC20240104' },
  ]

  for (let i = 0; i < doctorInfos.length; i++) {
    const info = doctorInfos[i]
    const id = uuidv4()
    insert.run(
      id,
      ctx.doctorUserIds[i],
      ctx.hospitalUserIds[i % ctx.hospitalUserIds.length],
      info.name,
      info.title,
      info.department,
      info.license,
      1,
      4.5 + Math.random() * 0.5,
      Math.floor(Math.random() * 200) + 50,
      i % 2 === 0 ? 1 : 0
    )
    ctx.doctorIds.push(id)
  }
}

function createHospitals(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO hospitals (id, user_id, name, address, latitude, longitude, phone, business_hours, rating, review_count, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const hospitalInfos = [
    {
      name: '爱宠宠物医院（朝阳店）',
      address: '北京市朝阳区建国路88号',
      lat: 39.9087,
      lng: 116.4279,
      phone: '010-88888881',
      hours: '周一至周日 09:00-21:00',
    },
    {
      name: '康宠动物诊所（海淀店）',
      address: '北京市海淀区中关村大街1号',
      lat: 39.9847,
      lng: 116.3046,
      phone: '010-88888882',
      hours: '周一至周日 08:30-20:30',
    },
    {
      name: '佳宠医疗中心（西城店）',
      address: '北京市西城区西长安街100号',
      lat: 39.9163,
      lng: 116.3799,
      phone: '010-88888883',
      hours: '24小时急诊',
    },
  ]

  for (let i = 0; i < hospitalInfos.length; i++) {
    const h = hospitalInfos[i]
    const id = uuidv4()
    insert.run(
      id,
      ctx.hospitalUserIds[i],
      h.name,
      h.address,
      h.lat,
      h.lng,
      h.phone,
      h.hours,
      4.3 + Math.random() * 0.7,
      Math.floor(Math.random() * 300) + 50,
      1
    )
    ctx.hospitalIds.push(id)
  }
}

function createMerchants(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO merchants (id, user_id, company_name, business_license, verified) VALUES (?, ?, ?, ?, ?)'
  )

  const merchantInfos = [
    { name: '北京宠物优选电子商务有限公司', license: 'BL20240001' },
    { name: '爱宠生活（北京）科技有限公司', license: 'BL20240002' },
  ]

  for (let i = 0; i < merchantInfos.length; i++) {
    const m = merchantInfos[i]
    const id = uuidv4()
    insert.run(id, ctx.merchantUserIds[i], m.name, m.license, 1)
    ctx.merchantIds.push(id)
  }
}

function createPets(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO pets (id, owner_id, name, species, breed, gender, birthday, weight, avatar, health_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const petTemplates = [
    { name: '小白', species: 'dog', breed: '金毛寻回犬', gender: 'male' },
    { name: '花花', species: 'cat', breed: '英国短毛猫', gender: 'female' },
    { name: '旺财', species: 'dog', breed: '拉布拉多', gender: 'male' },
    { name: '咪咪', species: 'cat', breed: '布偶猫', gender: 'female' },
    { name: '豆豆', species: 'rabbit', breed: '荷兰垂耳兔', gender: 'male' },
    { name: '鹦鹉', species: 'bird', breed: '虎皮鹦鹉', gender: 'female' },
    { name: '小黑', species: 'dog', breed: '泰迪', gender: 'male' },
    { name: '雪球', species: 'cat', breed: '美国短毛猫', gender: 'female' },
  ]

  for (let i = 0; i < petTemplates.length; i++) {
    const p = petTemplates[i]
    const id = uuidv4()
    const birthday = new Date()
    birthday.setFullYear(birthday.getFullYear() - (1 + Math.floor(Math.random() * 8)))
    birthday.setMonth(Math.floor(Math.random() * 12))
    birthday.setDate(Math.floor(Math.random() * 28) + 1)
    insert.run(
      id,
      ctx.ownerIds[i % ctx.ownerIds.length],
      p.name,
      p.species,
      p.breed,
      p.gender,
      birthday.toISOString().slice(0, 10),
      p.species === 'dog' ? 5 + Math.random() * 25 : p.species === 'cat' ? 2 + Math.random() * 6 : 0.5 + Math.random() * 2,
      `https://api.dicebear.com/7.x/${p.species === 'dog' ? 'fun-emoji' : p.species === 'cat' ? 'bottts' : 'thumbs'}/svg?seed=${p.name}`,
      randomFromArray(['healthy', 'healthy', 'healthy', 'sick', 'chronic']),
      randomDate(150)
    )
    ctx.petIds.push(id)
  }
}

function createVaccineRecords(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO vaccine_records (id, pet_id, vaccine_name, date, next_date, hospital_id) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const vaccines = [
    '犬四联疫苗',
    '犬六联疫苗',
    '狂犬疫苗',
    '猫三联疫苗',
    '猫狂犬疫苗',
    '犬瘟热疫苗',
  ]

  for (const petId of ctx.petIds) {
    const count = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - (1 + Math.floor(Math.random() * 12)))
      const nextDate = new Date(date)
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      insert.run(
        uuidv4(),
        petId,
        randomFromArray(vaccines),
        date.toISOString().slice(0, 10),
        nextDate.toISOString().slice(0, 10),
        randomFromArray(ctx.hospitalUserIds)
      )
    }
  }
}

function createDewormingRecords(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO deworming_records (id, pet_id, type, product_name, date, next_date) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const internalProducts = ['拜宠清', '内虫逃', '犬心保', '妙巴']
  const externalProducts = ['福来恩', '大宠爱', '拜宠爽', '爱沃克']

  for (const petId of ctx.petIds) {
    const count = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const type = randomFromArray(['internal', 'external']) as 'internal' | 'external'
      const products = type === 'internal' ? internalProducts : externalProducts
      const date = new Date()
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 6))
      const nextDate = new Date(date)
      nextDate.setMonth(nextDate.getMonth() + 3)
      insert.run(
        uuidv4(),
        petId,
        type,
        randomFromArray(products),
        date.toISOString().slice(0, 10),
        nextDate.toISOString().slice(0, 10)
      )
    }
  }
}

function createHospitalServices(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO hospital_services (id, hospital_id, name, description, price, duration) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const services = [
    { name: '常规体检', desc: '基础健康检查，包括体温、心率、听诊等', price: 80, duration: 30 },
    { name: '疫苗接种', desc: '各类常规疫苗接种服务', price: 120, duration: 20 },
    { name: '驱虫服务', desc: '体内外驱虫，含专业医生指导', price: 150, duration: 15 },
    { name: '血液检查', desc: '血常规及生化全套检查', price: 380, duration: 45 },
    { name: 'X光检查', desc: '数字化X光影像检查', price: 280, duration: 30 },
    { name: 'B超检查', desc: '腹部B超影像检查', price: 350, duration: 40 },
    { name: '外科手术', desc: '常规外科手术（绝育、肿瘤切除等）', price: 800, duration: 120 },
    { name: '牙科洁牙', desc: '超声波洁牙及抛光', price: 450, duration: 60 },
    { name: '皮肤诊疗', desc: '皮肤病诊断及治疗', price: 200, duration: 40 },
    { name: '急诊服务', desc: '24小时急诊医疗服务', price: 300, duration: 60 },
  ]

  for (const hospitalUserId of ctx.hospitalUserIds) {
    const selected = services.slice(0, 6 + Math.floor(Math.random() * 4))
    for (const s of selected) {
      insert.run(
        uuidv4(),
        hospitalUserId,
        s.name,
        s.desc,
        s.price * (0.9 + Math.random() * 0.2),
        s.duration
      )
    }
  }
}

function createHospitalReviews(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO hospital_reviews (id, hospital_id, owner_id, rating, content, is_verified, anti_fraud_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const reviews = [
    '服务态度很好，医生很专业，环境也干净整洁。',
    '宠物在这里治疗效果很好，收费也合理。',
    '预约方便，等待时间不长，整体体验不错。',
    '医生很有耐心，详细解答了所有问题。',
    '急诊响应很快，救了我家狗狗一命，非常感谢！',
    '价格有点贵，但服务质量确实好。',
    '环境一般，但医疗水平不错。',
  ]

  for (const hospitalUserId of ctx.hospitalUserIds) {
    const count = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < count; i++) {
      insert.run(
        uuidv4(),
        hospitalUserId,
        randomFromArray(ctx.ownerIds),
        3 + Math.floor(Math.random() * 3),
        randomFromArray(reviews),
        Math.random() > 0.3 ? 1 : 0,
        0.8 + Math.random() * 0.2,
        randomDate(90)
      )
    }
  }
}

function createProducts(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO products (id, merchant_id, name, category, species, age_range, health_condition, price, stock, is_prescription, images, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const productTemplates = [
    { name: '皇家成犬粮2kg', category: 'food', species: '["dog"]', age: '成年', health: '[]', price: 168, stock: 200, rx: false },
    { name: '渴望六种鱼猫粮1.8kg', category: 'food', species: '["cat"]', age: '全年龄', health: '[]', price: 258, stock: 150, rx: false },
    { name: '拜宠清体内驱虫片（6粒装）', category: 'deworming', species: '["dog","cat"]', age: '全年龄', health: '[]', price: 98, stock: 300, rx: false },
    { name: '福来恩体外驱虫滴剂（3支装）', category: 'deworming', species: '["dog","cat"]', age: '成年', health: '[]', price: 158, stock: 250, rx: false },
    { name: '卫仕复合维生素片', category: 'nutrition', species: '["dog","cat"]', age: '全年龄', health: '[]', price: 68, stock: 400, rx: false },
    { name: '麦德氏卵磷脂500g', category: 'nutrition', species: '["dog"]', age: '全年龄', health: '["皮肤护理"]', price: 128, stock: 180, rx: false },
    { name: '速诺阿莫西林克拉维酸钾片', category: 'medicine', species: '["dog","cat"]', age: '全年龄', health: '["细菌感染"]', price: 88, stock: 100, rx: true },
    { name: '拜有利恩诺沙星片', category: 'medicine', species: '["dog","cat"]', age: '成年', health: '["泌尿系统","细菌感染"]', price: 76, stock: 80, rx: true },
    { name: '红狗营养膏120g', category: 'nutrition', species: '["dog","cat"]', age: '全年龄', health: '["术后恢复","孕期"]', price: 98, stock: 220, rx: false },
    { name: '宠物益生菌粉', category: 'nutrition', species: '["dog","cat"]', age: '全年龄', health: '["肠胃调理"]', price: 58, stock: 350, rx: false },
    { name: '猫咪化毛膏120g', category: 'nutrition', species: '["cat"]', age: '成年', health: '["毛球症"]', price: 78, stock: 180, rx: false },
    { name: '宠物洁齿骨（大包装）', category: 'care', species: '["dog"]', age: '全年龄', health: '["口腔护理"]', price: 45, stock: 500, rx: false },
    { name: '滴眼液（抗菌消炎）', category: 'medicine', species: '["dog","cat"]', age: '全年龄', health: '["眼部感染"]', price: 52, stock: 120, rx: true },
    { name: '宠物滴耳油', category: 'care', species: '["dog","cat"]', age: '全年龄', health: '["耳部护理"]', price: 38, stock: 200, rx: false },
    { name: '处方粮-肾脏护理', category: 'food', species: '["dog","cat"]', age: '全年龄', health: '["肾脏疾病"]', price: 288, stock: 60, rx: true },
    { name: '处方粮-肠胃敏感', category: 'food', species: '["dog","cat"]', age: '全年龄', health: '["肠胃敏感"]', price: 268, stock: 80, rx: true },
  ]

  for (let i = 0; i < productTemplates.length; i++) {
    const p = productTemplates[i]
    const id = uuidv4()
    insert.run(
      id,
      ctx.merchantUserIds[i % ctx.merchantUserIds.length],
      p.name,
      p.category,
      p.species,
      p.age,
      p.health,
      p.price,
      p.stock,
      p.rx ? 1 : 0,
      JSON.stringify([`https://picsum.photos/seed/product${i}/400/400`]),
      `${p.name}，正品保障，厂家直供。`
    )
    ctx.productIds.push(id)
  }
}

function createConsultations(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO consultations (id, owner_id, doctor_id, pet_id, type, status, symptoms, diagnosis, prescription_id, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const symptomsList = [
    '最近食欲不振，精神萎靡，偶尔呕吐。',
    '皮肤瘙痒，频繁抓挠，有红疹出现。',
    '咳嗽，流鼻涕，体温偏高。',
    '腹泻，大便不成形，持续两天。',
    '眼睛红肿，有分泌物，经常流泪。',
    '耳朵有异味，宠物经常摇头抓耳朵。',
  ]

  const diagnosisList = [
    '经诊断为急性肠胃炎，建议清淡饮食配合药物治疗。',
    '皮肤真菌感染，需外用药浴配合口服抗真菌药。',
    '上呼吸道感染，病毒性感冒，注意保暖多喝水。',
    '饮食不当引起的消化不良，调整饮食结构即可。',
    '结膜炎，需要使用抗菌滴眼液，每日3次。',
    '外耳炎，需清洁耳道并使用滴耳液治疗。',
  ]

  for (let i = 0; i < 10; i++) {
    const id = uuidv4()
    const status = randomFromArray(['pending', 'ongoing', 'completed', 'completed', 'completed', 'cancelled'])
    const createdAt = randomDate(60)
    const completedAt = status === 'completed' ? randomDate(50, 1) : null

    insert.run(
      id,
      randomFromArray(ctx.ownerIds),
      randomFromArray(ctx.doctorUserIds),
      randomFromArray(ctx.petIds),
      randomFromArray(['text', 'video', 'audio']),
      status,
      randomFromArray(symptomsList),
      (status === 'completed' || status === 'ongoing') ? randomFromArray(diagnosisList) : null,
      null,
      createdAt,
      completedAt
    )
    ctx.consultationIds.push(id)
  }
}

function createPrescriptions(db: Database.Database, ctx: SeedContext): void {
  const insertPrescription = db.prepare(
    'INSERT INTO prescriptions (id, consultation_id, doctor_id, owner_id, pet_id, doctor_signature, owner_acknowledged, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertItem = db.prepare(
    'INSERT INTO prescription_items (id, prescription_id, product_id, product_name, dosage, frequency, duration, is_prescription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const updateConsultation = db.prepare(
    'UPDATE consultations SET prescription_id = ? WHERE id = ?'
  )

  const completedConsultations = db
    .prepare("SELECT * FROM consultations WHERE status = 'completed' AND prescription_id IS NULL")
    .all()

  const prescriptionItems = [
    { productName: '速诺阿莫西林克拉维酸钾片', dosage: '1片/次', frequency: '每日2次', duration: '7天', rx: true },
    { productName: '拜有利恩诺沙星片', dosage: '半片/次', frequency: '每日1次', duration: '5天', rx: true },
    { productName: '滴眼液（抗菌消炎）', dosage: '2滴/次', frequency: '每日3次', duration: '10天', rx: true },
    { productName: '宠物益生菌粉', dosage: '1袋/次', frequency: '每日2次', duration: '14天', rx: false },
    { productName: '红狗营养膏', dosage: '5cm/次', frequency: '每日1次', duration: '30天', rx: false },
  ]

  for (let i = 0; i < Math.min(5, completedConsultations.length); i++) {
    const c = completedConsultations[i] as any
    const prescriptionId = uuidv4()
    insertPrescription.run(
      prescriptionId,
      c.id,
      c.doctor_id,
      c.owner_id,
      c.pet_id,
      `DR_SIG_${uuidv4().slice(0, 8).toUpperCase()}`,
      Math.random() > 0.4 ? 1 : 0,
      c.completed_at || randomDate(30)
    )
    updateConsultation.run(prescriptionId, c.id)
    ctx.prescriptionIds.push(prescriptionId)

    const itemCount = 1 + Math.floor(Math.random() * 3)
    for (let j = 0; j < itemCount; j++) {
      const item = prescriptionItems[(i + j) % prescriptionItems.length]
      const productId = ctx.productIds.find((_, idx) => idx % 3 === (i + j) % 3) || null
      insertItem.run(
        uuidv4(),
        prescriptionId,
        productId,
        item.productName,
        item.dosage,
        item.frequency,
        item.duration,
        item.rx ? 1 : 0
      )
    }
  }
}

function createOrders(db: Database.Database, ctx: SeedContext): void {
  const insertOrder = db.prepare(
    'INSERT INTO orders (id, owner_id, prescription_id, total_amount, status, owner_signature, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertItem = db.prepare(
    'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)'
  )

  for (let i = 0; i < 6; i++) {
    const ownerId = randomFromArray(ctx.ownerIds)
    const orderId = uuidv4()
    const itemCount = 1 + Math.floor(Math.random() * 3)
    let total = 0
    const items: { productId: string; qty: number; price: number }[] = []

    for (let j = 0; j < itemCount; j++) {
      const productId = randomFromArray(ctx.productIds)
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(productId) as { price: number }
      const qty = 1 + Math.floor(Math.random() * 3)
      const price = product.price
      total += price * qty
      items.push({ productId, qty, price })
    }

    const status = randomFromArray(['pending', 'paid', 'shipped', 'delivered', 'delivered'])
    const prescriptionId = Math.random() > 0.7 ? randomFromArray(ctx.prescriptionIds) : null

    insertOrder.run(
      orderId,
      ownerId,
      prescriptionId,
      total,
      status,
      (status === 'delivered' || status === 'shipped') ? `OWNER_SIG_${uuidv4().slice(0, 8).toUpperCase()}` : null,
      randomDate(45)
    )

    for (const item of items) {
      insertItem.run(uuidv4(), orderId, item.productId, item.qty, item.price)
    }
  }
}

function createCommunityPosts(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO community_posts (id, owner_id, pet_id, content, images, tags, vaccine_tag, deworming_tag, likes, comments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const postContents = [
    { content: '今天带小白去打疫苗啦，小家伙表现得超勇敢！一点都没哭～', tags: '["日常","疫苗"]', vTag: '已接种', dTag: null, withPet: true },
    { content: '我家花花最近食欲不太好，有没有铲屎官遇到过类似情况？求支招！', tags: '["求助","饮食"]', vTag: null, dTag: null, withPet: true },
    { content: '分享一下我家旺财的日常，每天都要遛弯两小时，精力太旺盛了😂', tags: '["日常","遛狗"]', vTag: null, dTag: null, withPet: true },
    { content: '咪咪今天做了驱虫，终于可以安心睡觉啦～给大家推荐这个驱虫药效果真的不错！', tags: '["驱虫","好物推荐"]', vTag: null, dTag: '已驱虫', withPet: true },
    { content: '新手养猫必看！分享我这半年来的养猫心得和踩过的坑～', tags: '["经验分享","新手"]', vTag: null, dTag: null, withPet: false },
    { content: '周末带狗狗去宠物公园，玩得好开心！认识了好多新朋友。', tags: '["日常","社交"]', vTag: null, dTag: null, withPet: true },
    { content: '求助！我家猫咪最近总是抓耳朵，会不会是耳螨？有什么好的治疗方法吗？', tags: '["求助","健康"]', vTag: null, dTag: null, withPet: true },
    { content: '分享一个自制狗粮的配方，我家狗狗超爱吃，营养又健康！', tags: '["美食","自制"]', vTag: null, dTag: null, withPet: false },
  ]

  for (let i = 0; i < postContents.length; i++) {
    const p = postContents[i]
    const id = uuidv4()
    insert.run(
      id,
      randomFromArray(ctx.ownerIds),
      p.withPet ? randomFromArray(ctx.petIds) : null,
      p.content,
      JSON.stringify([`https://picsum.photos/seed/post${i}/600/400`]),
      p.tags,
      p.vTag,
      p.dTag,
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 30),
      randomDate(30)
    )
    ctx.postIds.push(id)
  }
}

function createLostPetTasks(db: Database.Database, ctx: SeedContext): void {
  const insertTask = db.prepare(
    'INSERT INTO lost_pet_tasks (id, owner_id, pet_name, species, description, last_seen_lat, last_seen_lng, last_seen_address, last_seen_time, reward, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertClue = db.prepare(
    'INSERT INTO lost_pet_clues (id, task_id, reporter_id, content, location_lat, location_lng, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertIntent = db.prepare(
    'INSERT INTO adoption_intents (id, task_id, applicant_id, message, level, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const tasks = [
    { petName: '豆豆', species: 'dog', desc: '金毛，3岁，棕色，脖子上有红色项圈，性格温顺。', lat: 39.9123, lng: 116.4056, addr: '朝阳区建国路附近', reward: 2000 },
    { petName: '咪咪', species: 'cat', desc: '白色英短，2岁，左耳有个小缺口，比较怕人。', lat: 39.9876, lng: 116.3123, addr: '海淀区中关村附近', reward: 1500 },
    { petName: '小黑', species: 'dog', desc: '黑色泰迪，5岁，断尾，很亲人。', lat: 39.9345, lng: 116.3678, addr: '西城区西单附近', reward: 3000 },
  ]

  const clueContents = [
    '昨天下午3点左右好像在附近公园看到过类似的狗狗。',
    '我家小区门口经常有流浪动物聚集，可以去看看。',
    '建议到附近的宠物医院问问，有时候好心人会送去。',
  ]

  const intentMessages = [
    '我家有养宠经验，很想给流浪的毛孩子一个温暖的家。',
    '我已经有一只猫了，想再领养一只作伴，家里条件不错。',
    '真心想领养，请联系我详细了解情况。',
  ]

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    const taskId = uuidv4()
    const status = i === 0 ? 'searching' : i === 1 ? 'found' : 'searching'
    insertTask.run(
      taskId,
      ctx.ownerIds[i],
      t.petName,
      t.species,
      t.desc,
      t.lat,
      t.lng,
      t.addr,
      randomDate(14),
      t.reward,
      status,
      randomDate(14)
    )
    ctx.taskIds.push(taskId)

    const clueCount = 1 + Math.floor(Math.random() * 3)
    for (let j = 0; j < clueCount; j++) {
      insertClue.run(
        uuidv4(),
        taskId,
        randomFromArray(ctx.ownerIds),
        randomFromArray(clueContents),
        t.lat + (Math.random() - 0.5) * 0.02,
        t.lng + (Math.random() - 0.5) * 0.02,
        Math.random() > 0.5 ? 1 : 0,
        randomDate(10)
      )
    }

    if (status === 'searching') {
      const intentCount = Math.floor(Math.random() * 3)
      for (let j = 0; j < intentCount; j++) {
        insertIntent.run(
          uuidv4(),
          taskId,
          randomFromArray(ctx.ownerIds.filter((_, idx) => idx !== i)),
          randomFromArray(intentMessages),
          randomFromArray(['pending', 'interested', 'verified']),
          randomDate(7)
        )
      }
    }
  }
}

function createCalendarEvents(db: Database.Database, ctx: SeedContext): void {
  const insert = db.prepare(
    'INSERT INTO health_calendar_events (id, owner_id, pet_id, type, title, date, reminder_days, completed, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const eventTemplates = [
    { type: 'vaccine', title: '狂犬疫苗接种' },
    { type: 'deworming', title: '体内驱虫' },
    { type: 'deworming', title: '体外驱虫' },
    { type: 'checkup', title: '年度健康体检' },
    { type: 'consultation', title: '复诊预约' },
    { type: 'custom', title: '洗澡美容' },
    { type: 'vaccine', title: '联苗加强针' },
    { type: 'checkup', title: '牙齿检查' },
  ]

  for (let i = 0; i < 12; i++) {
    const ownerId = randomFromArray(ctx.ownerIds)
    const petId = randomFromArray(ctx.petIds)
    const template = randomFromArray(eventTemplates)

    const date = new Date()
    date.setDate(date.getDate() + Math.floor(Math.random() * 60) - 20)

    const completed = date < new Date() && Math.random() > 0.3

    insert.run(
      uuidv4(),
      ownerId,
      petId,
      template.type,
      template.title,
      date.toISOString().slice(0, 10),
      randomFromArray([1, 3, 7, 14]),
      completed ? 1 : 0,
      null,
      randomDate(90)
    )
  }
}

export function seedDatabase(db: Database.Database): void {
  const ctx: SeedContext = {
    ownerIds: [],
    doctorUserIds: [],
    hospitalUserIds: [],
    merchantUserIds: [],
    petIds: [],
    doctorIds: [],
    hospitalIds: [],
    merchantIds: [],
    productIds: [],
    consultationIds: [],
    prescriptionIds: [],
    postIds: [],
    taskIds: [],
  }

  const transaction = db.transaction(() => {
    createUsers(db, ctx)
    createDoctors(db, ctx)
    createHospitals(db, ctx)
    createMerchants(db, ctx)
    createPets(db, ctx)
    createVaccineRecords(db, ctx)
    createDewormingRecords(db, ctx)
    createHospitalServices(db, ctx)
    createHospitalReviews(db, ctx)
    createProducts(db, ctx)
    createConsultations(db, ctx)
    createPrescriptions(db, ctx)
    createOrders(db, ctx)
    createCommunityPosts(db, ctx)
    createLostPetTasks(db, ctx)
    createCalendarEvents(db, ctx)
  })

  transaction()
}
