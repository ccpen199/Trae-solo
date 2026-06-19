import { getDb } from './db.js'
import crypto from 'crypto'

export function seedData(): void {
  const db = getDb()

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
  if (userCount > 0) return

  const insertUser = db.prepare(
    'INSERT INTO users (phone, name, role, region_code, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  const insertPost = db.prepare(
    'INSERT INTO posts (category, title, description, price, province, city, district, author_id, status, risk_score, is_top, views, leads, conversions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertImage = db.prepare(
    'INSERT INTO post_images (post_id, url, ocr_text, is_primary) VALUES (?, ?, ?, ?)'
  )
  const insertAttr = db.prepare(
    'INSERT INTO post_attributes (post_id, key, value) VALUES (?, ?, ?)'
  )
  const insertMerchant = db.prepare(
    'INSERT INTO merchants (user_id, name, license_no, license_verified, deposit_amount, deposit_status, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertReview = db.prepare(
    'INSERT INTO reviews (merchant_id, user_id, rating, content, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  const insertSensitiveWord = db.prepare(
    'INSERT INTO sensitive_words (word, category, hit_count) VALUES (?, ?, ?)'
  )
  const insertAuditRecord = db.prepare(
    'INSERT INTO audit_records (post_id, auditor_id, stage, result, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertApiKey = db.prepare(
    'INSERT INTO api_keys (name, key, org, permissions, call_count, status) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertGeoRegion = db.prepare(
    'INSERT INTO geo_regions (code, name, level, parent_code, post_count) VALUES (?, ?, ?, ?, ?)'
  )

  const users = [
    { phone: '13800001001', name: '张伟', role: 'admin', region_code: '110000' },
    { phone: '13800001002', name: '李娜', role: 'admin', region_code: '310000' },
    { phone: '13800001003', name: '王强', role: 'auditor', region_code: '110000' },
    { phone: '13800001004', name: '刘芳', role: 'auditor', region_code: '310000' },
    { phone: '13800001005', name: '陈明', role: 'auditor', region_code: '440000' },
    { phone: '13800001006', name: '杨洋', role: 'merchant', region_code: '110000' },
    { phone: '13800001007', name: '赵敏', role: 'merchant', region_code: '310000' },
    { phone: '13800001008', name: '黄磊', role: 'merchant', region_code: '440000' },
    { phone: '13800001009', name: '周涛', role: 'merchant', region_code: '330000' },
    { phone: '13800001010', name: '吴昊', role: 'merchant', region_code: '510000' },
    { phone: '13800001011', name: '徐静', role: 'user', region_code: '110000' },
    { phone: '13800001012', name: '孙丽', role: 'user', region_code: '310000' },
    { phone: '13800001013', name: '马超', role: 'user', region_code: '440000' },
    { phone: '13800001014', name: '朱婷', role: 'user', region_code: '330000' },
    { phone: '13800001015', name: '胡歌', role: 'user', region_code: '510000' },
    { phone: '13800001016', name: '郭靖', role: 'user', region_code: '110000' },
    { phone: '13800001017', name: '林黛', role: 'user', region_code: '310000' },
    { phone: '13800001018', name: '何伟', role: 'user', region_code: '440000' },
    { phone: '13800001019', name: '高远', role: 'user', region_code: '330000' },
    { phone: '13800001020', name: '梁欣', role: 'user', region_code: '510000' },
    { phone: '13800001021', name: '谢鹏', role: 'user', region_code: '110000' },
    { phone: '13800001022', name: '韩冰', role: 'user', region_code: '310000' },
    { phone: '13800001023', name: '唐杰', role: 'user', region_code: '440000' },
    { phone: '13800001024', name: '冯蕾', role: 'user', region_code: '330000' },
    { phone: '13800001025', name: '董洁', role: 'user', region_code: '510000' },
  ]

  const userIds: number[] = []
  const seedTransaction = db.transaction(() => {
    for (const u of users) {
      const r = insertUser.run(u.phone, u.name, u.role, u.region_code, '2025-01-01 00:00:00')
      userIds.push(r.lastInsertRowid as number)
    }

    const posts = [
      { category: 'job', title: '高薪招聘前端开发工程师', description: '某互联网大厂急招前端开发，薪资20-40K，五险一金，弹性工作制', price: 0, province: '北京市', city: '北京市', district: '海淀区', author_id: 11, status: 'approved', risk_score: 10, is_top: 1, views: 1520, leads: 85, conversions: 12 },
      { category: 'job', title: '招聘会计专员', description: '贸易公司招聘会计，要求有会计证，3年以上经验，双休', price: 0, province: '上海市', city: '上海市', district: '浦东新区', author_id: 12, status: 'approved', risk_score: 5, is_top: 0, views: 890, leads: 45, conversions: 8 },
      { category: 'job', title: '急招外卖骑手日结300', description: '外卖平台招募骑手，日入300+，时间自由，多劳多得', price: 0, province: '广州市', city: '广州市', district: '天河区', author_id: 13, status: 'approved', risk_score: 15, is_top: 0, views: 2300, leads: 120, conversions: 35 },
      { category: 'job', title: '招聘销售经理', description: '医疗器械公司招聘销售经理，底薪8K+提成，有培训', price: 0, province: '杭州市', city: '杭州市', district: '西湖区', author_id: 14, status: 'approved', risk_score: 8, is_top: 0, views: 670, leads: 32, conversions: 5 },
      { category: 'rent', title: '朝阳区精装一居室出租', description: '临近地铁，家电齐全，拎包入住，月租3500，押一付三', price: 3500, province: '北京市', city: '北京市', district: '朝阳区', author_id: 15, status: 'approved', risk_score: 5, is_top: 1, views: 3100, leads: 200, conversions: 15 },
      { category: 'rent', title: '浦东两居室合租主卧', description: '近陆家嘴，精装修，限女生，月租2800', price: 2800, province: '上海市', city: '上海市', district: '浦东新区', author_id: 16, status: 'approved', risk_score: 10, is_top: 0, views: 1800, leads: 95, conversions: 8 },
      { category: 'rent', title: '天河区写字楼办公室出租', description: 'CBD核心地段，100平精装办公室，月租8000', price: 8000, province: '广州市', city: '广州市', district: '天河区', author_id: 17, status: 'approved', risk_score: 3, is_top: 0, views: 560, leads: 30, conversions: 3 },
      { category: 'share', title: '拼车上下班北京到望京', description: '每周一到五早8晚6，望京附近上班的来，费用分摊', price: 500, province: '北京市', city: '北京市', district: '朝阳区', author_id: 18, status: 'approved', risk_score: 12, is_top: 0, views: 420, leads: 25, conversions: 4 },
      { category: 'share', title: '合租杭州西湖区三居室', description: '现有一间次卧空出，限女生，月租1500，包物业费', price: 1500, province: '杭州市', city: '杭州市', district: '西湖区', author_id: 19, status: 'approved', risk_score: 8, is_top: 0, views: 950, leads: 50, conversions: 6 },
      { category: 'secondhand_house', title: '成都锦江区二手房出售', description: '三室两厅，95平，精装修，近地铁，售价168万', price: 1680000, province: '成都市', city: '成都市', district: '锦江区', author_id: 20, status: 'approved', risk_score: 20, is_top: 1, views: 4500, leads: 180, conversions: 2 },
      { category: 'secondhand_house', title: '上海闵行二手房急售', description: '两室一厅，78平，南北通透，学区房，售价320万', price: 3200000, province: '上海市', city: '上海市', district: '闵行区', author_id: 21, status: 'approved', risk_score: 15, is_top: 0, views: 2800, leads: 140, conversions: 1 },
      { category: 'secondhand_house', title: '北京大兴新房出售', description: '四室两厅，130平，新楼盘，首付30%，售价450万', price: 4500000, province: '北京市', city: '北京市', district: '大兴区', author_id: 22, status: 'pending', risk_score: 25, is_top: 0, views: 1200, leads: 60, conversions: 0 },
      { category: 'secondhand', title: '95新iPhone15 ProMax出售', description: '256G原色钛金属，无磕碰，电池健康98%，带原装配件', price: 6800, province: '北京市', city: '北京市', district: '海淀区', author_id: 11, status: 'approved', risk_score: 8, is_top: 0, views: 2100, leads: 110, conversions: 18 },
      { category: 'secondhand', title: '二手戴森吸尘器V12', description: '用了一年，功能完好，配件齐全，原价4990，现卖2200', price: 2200, province: '上海市', city: '上海市', district: '徐汇区', author_id: 12, status: 'approved', risk_score: 5, is_top: 0, views: 780, leads: 42, conversions: 7 },
      { category: 'secondhand', title: '二手笔记本电脑ThinkPad', description: 'X1 Carbon第10代，i7-1260P，16G/512G，外观9成新', price: 4500, province: '广州市', city: '广州市', district: '越秀区', author_id: 13, status: 'approved', risk_score: 10, is_top: 0, views: 650, leads: 35, conversions: 5 },
      { category: 'vehicle', title: '2022款特斯拉Model 3转让', description: '标准续航版，白色，2万公里，无事故，全款可过户', price: 185000, province: '上海市', city: '上海市', district: '浦东新区', author_id: 14, status: 'approved', risk_score: 15, is_top: 1, views: 5200, leads: 220, conversions: 3 },
      { category: 'vehicle', title: '二手丰田卡罗拉出售', description: '2020款1.2T自动，5万公里，保养记录全，无事故', price: 98000, province: '成都市', city: '成都市', district: '武侯区', author_id: 15, status: 'approved', risk_score: 12, is_top: 0, views: 1800, leads: 85, conversions: 2 },
      { category: 'vehicle', title: '电动车雅迪转让', description: '骑了半年，续航60公里，带后备箱，原价3500', price: 1800, province: '杭州市', city: '杭州市', district: '拱墅区', author_id: 16, status: 'approved', risk_score: 5, is_top: 0, views: 430, leads: 28, conversions: 4 },
      { category: 'service', title: '专业家政保洁服务', description: '深度清洁、开荒保洁、日常保洁，持证上岗，不满意重做', price: 200, province: '北京市', city: '北京市', district: '朝阳区', author_id: 6, status: 'approved', risk_score: 5, is_top: 0, views: 1200, leads: 65, conversions: 22 },
      { category: 'service', title: '钢琴搬运专业团队', description: '10年搬运经验，全程保险，北京全城可到', price: 800, province: '北京市', city: '北京市', district: '海淀区', author_id: 7, status: 'approved', risk_score: 8, is_top: 0, views: 560, leads: 30, conversions: 10 },
      { category: 'service', title: '空调维修清洗上门服务', description: '品牌维修工程师，30分钟上门，修不好不收费', price: 150, province: '广州市', city: '广州市', district: '天河区', author_id: 8, status: 'approved', risk_score: 5, is_top: 0, views: 980, leads: 55, conversions: 18 },
      { category: 'education', title: '雅思一对一辅导', description: '8年教龄雅思老师，提分有保障，试听免费', price: 300, province: '上海市', city: '上海市', district: '杨浦区', author_id: 9, status: 'approved', risk_score: 10, is_top: 0, views: 870, leads: 48, conversions: 15 },
      { category: 'education', title: '少儿编程培训招生', description: 'Scratch/Python课程，小班教学，培养逻辑思维', price: 5000, province: '杭州市', city: '杭州市', district: '西湖区', author_id: 10, status: 'approved', risk_score: 8, is_top: 0, views: 1200, leads: 60, conversions: 12 },
      { category: 'education', title: '高考数学冲刺班', description: '重点中学名师授课，押题精准，仅剩5个名额', price: 8000, province: '成都市', city: '成都市', district: '锦江区', author_id: 17, status: 'pending', risk_score: 35, is_top: 0, views: 2100, leads: 95, conversions: 8 },
      { category: 'pet', title: '金毛寻回犬幼犬转让', description: '3个月大，已打疫苗，纯种金毛，家庭繁育', price: 2000, province: '北京市', city: '北京市', district: '通州区', author_id: 18, status: 'approved', risk_score: 8, is_top: 0, views: 1500, leads: 75, conversions: 5 },
      { category: 'pet', title: '英短蓝猫找新家', description: '1岁半，已绝育，性格温顺，附送猫用品', price: 800, province: '上海市', city: '上海市', district: '静安区', author_id: 19, status: 'approved', risk_score: 5, is_top: 0, views: 980, leads: 52, conversions: 4 },
      { category: 'pet', title: '柯基犬配种服务', description: '纯种三色柯基，种公3岁，健康活泼', price: 1500, province: '广州市', city: '广州市', district: '番禺区', author_id: 20, status: 'approved', risk_score: 10, is_top: 0, views: 670, leads: 35, conversions: 3 },
      { category: 'dating', title: '92年女生真诚征婚', description: '身高165，本科，外企工作，希望找三观合的男生', price: 0, province: '北京市', city: '北京市', district: '朝阳区', author_id: 12, status: 'approved', risk_score: 15, is_top: 0, views: 3500, leads: 180, conversions: 0 },
      { category: 'dating', title: '85年IT男生寻另一半', description: '身高178，硕士，有房有车，真诚交友', price: 0, province: '上海市', city: '上海市', district: '浦东新区', author_id: 23, status: 'approved', risk_score: 12, is_top: 0, views: 2800, leads: 150, conversions: 0 },
      { category: 'dating', title: '90年杭州女生交友', description: '教师编制，爱好旅游阅读，希望遇到志同道合的人', price: 0, province: '杭州市', city: '杭州市', district: '西湖区', author_id: 24, status: 'approved', risk_score: 10, is_top: 0, views: 1900, leads: 100, conversions: 0 },
      { category: 'franchise', title: '奶茶品牌加盟火热招商', description: '投资5万起步，总部全程扶持，3个月回本', price: 50000, province: '广州市', city: '广州市', district: '天河区', author_id: 8, status: 'approved', risk_score: 45, is_top: 1, views: 6800, leads: 350, conversions: 8 },
      { category: 'franchise', title: '社区生鲜超市加盟', description: '低投入高回报，供应链直供，毛利30%+', price: 80000, province: '成都市', city: '成都市', district: '武侯区', author_id: 9, status: 'pending', risk_score: 55, is_top: 0, views: 3200, leads: 160, conversions: 3 },
      { category: 'franchise', title: '快递驿站加盟', description: '代收代寄，社区流量入口，日入500+', price: 30000, province: '杭州市', city: '杭州市', district: '余杭区', author_id: 10, status: 'approved', risk_score: 40, is_top: 0, views: 4500, leads: 220, conversions: 10 },
      { category: 'other', title: '寻人启事：走失老人', description: '张某某，男，72岁，穿灰色夹克，于6月15日在朝阳公园走失', price: 0, province: '北京市', city: '北京市', district: '朝阳区', author_id: 25, status: 'approved', risk_score: 0, is_top: 1, views: 12000, leads: 500, conversions: 0 },
      { category: 'other', title: '失物招领：钱包', description: '在地铁2号线捡到棕色钱包，内有身份证和银行卡', price: 0, province: '上海市', city: '上海市', district: '静安区', author_id: 11, status: 'approved', risk_score: 0, is_top: 0, views: 890, leads: 40, conversions: 1 },
      { category: 'other', title: '二手家具低价处理', description: '搬家处理，书桌+椅子+书柜一套，自提', price: 500, province: '成都市', city: '成都市', district: '锦江区', author_id: 21, status: 'approved', risk_score: 3, is_top: 0, views: 340, leads: 18, conversions: 2 },
      { category: 'job', title: '招聘健身教练', description: '大型连锁健身房招私教，底薪5K+提成，需要证书', price: 0, province: '北京市', city: '北京市', district: '西城区', author_id: 22, status: 'approved', risk_score: 8, is_top: 0, views: 560, leads: 30, conversions: 5 },
      { category: 'job', title: '招聘司机', description: '物流公司招聘C1证司机，月薪8K-12K，包食宿', price: 0, province: '成都市', city: '成都市', district: '金牛区', author_id: 23, status: 'approved', risk_score: 10, is_top: 0, views: 1200, leads: 65, conversions: 9 },
      { category: 'rent', title: '杭州余杭区整租两居', description: '近阿里巴巴西溪园区，精装修，月租3200', price: 3200, province: '杭州市', city: '杭州市', district: '余杭区', author_id: 24, status: 'approved', risk_score: 5, is_top: 0, views: 1500, leads: 78, conversions: 6 },
      { category: 'rent', title: '成都武侯区公寓出租', description: 'loft户型，近地铁站，月租1800，押一付三', price: 1800, province: '成都市', city: '成都市', district: '武侯区', author_id: 25, status: 'approved', risk_score: 5, is_top: 0, views: 980, leads: 52, conversions: 4 },
      { category: 'secondhand', title: '全新空气净化器转让', description: '飞利浦AC3836，未拆封，搬家用不上低价转', price: 1200, province: '杭州市', city: '杭州市', district: '滨江区', author_id: 16, status: 'approved', risk_score: 3, is_top: 0, views: 340, leads: 20, conversions: 3 },
      { category: 'secondhand', title: '婴儿推车转让', description: '好孩子品牌，用了一年，九成新，自提', price: 500, province: '成都市', city: '成都市', district: '青羊区', author_id: 22, status: 'approved', risk_score: 3, is_top: 0, views: 450, leads: 28, conversions: 5 },
      { category: 'vehicle', title: '二手大众帕萨特出售', description: '2019款330TSI，8万公里，无大修，车况良好', price: 125000, province: '北京市', city: '北京市', district: '丰台区', author_id: 23, status: 'approved', risk_score: 12, is_top: 0, views: 1600, leads: 72, conversions: 1 },
      { category: 'service', title: '搬家服务全城最低价', description: '小型搬家起步价200，大件搬运，拆装家具', price: 200, province: '广州市', city: '广州市', district: '白云区', author_id: 6, status: 'approved', risk_score: 8, is_top: 0, views: 870, leads: 48, conversions: 15 },
      { category: 'education', title: '考研政治辅导班', description: '名师授课，押题命中率高，报名从速', price: 3500, province: '北京市', city: '北京市', district: '海淀区', author_id: 7, status: 'approved', risk_score: 15, is_top: 0, views: 2300, leads: 110, conversions: 20 },
      { category: 'pet', title: '仓鼠及笼子一起送', description: '金丝熊仓鼠两只，附带大笼子和食盆', price: 50, province: '上海市', city: '上海市', district: '长宁区', author_id: 18, status: 'approved', risk_score: 3, is_top: 0, views: 320, leads: 15, conversions: 2 },
      { category: 'franchise', title: '早餐店加盟项目', description: '投资3万起步，统一配送，早市刚需', price: 30000, province: '北京市', city: '北京市', district: '通州区', author_id: 9, status: 'approved', risk_score: 38, is_top: 0, views: 3800, leads: 190, conversions: 7 },
      { category: 'dating', title: '88年成都女生征友', description: '医生，性格开朗，喜欢运动，希望找靠谱的另一半', price: 0, province: '成都市', city: '成都市', district: '锦江区', author_id: 25, status: 'approved', risk_score: 8, is_top: 0, views: 1600, leads: 85, conversions: 0 },
      { category: 'share', title: '拼团买水果', description: '成都本地水果拼团，产地直发，5人成团', price: 99, province: '成都市', city: '成都市', district: '武侯区', author_id: 20, status: 'approved', risk_score: 5, is_top: 0, views: 670, leads: 40, conversions: 12 },
      { category: 'job', title: '招聘UI设计师', description: '创业团队招UI，需要会Figma，远程也可以', price: 0, province: '杭州市', city: '杭州市', district: '滨江区', author_id: 24, status: 'pending', risk_score: 8, is_top: 0, views: 780, leads: 42, conversions: 3 },
      { category: 'secondhand_house', title: '杭州余杭区新房出售', description: '三室两厅，120平，精装交付，近地铁', price: 2800000, province: '杭州市', city: '杭州市', district: '余杭区', author_id: 19, status: 'approved', risk_score: 18, is_top: 0, views: 2100, leads: 95, conversions: 1 },
      { category: 'other', title: '社区志愿者招募', description: '朝阳区社区招募防疫志愿者，有补贴，周末可参与', price: 0, province: '北京市', city: '北京市', district: '朝阳区', author_id: 11, status: 'approved', risk_score: 0, is_top: 0, views: 450, leads: 22, conversions: 8 },
      { category: 'rent', title: '广州番禺区商铺出租', description: '临街商铺50平，适合餐饮零售，月租6000', price: 6000, province: '广州市', city: '广州市', district: '番禺区', author_id: 17, status: 'rejected', risk_score: 60, is_top: 0, views: 340, leads: 15, conversions: 0 },
      { category: 'service', title: '法律咨询在线服务', description: '合同纠纷、劳动争议，首次咨询免费', price: 0, province: '上海市', city: '上海市', district: '黄浦区', author_id: 7, status: 'approved', risk_score: 10, is_top: 0, views: 1500, leads: 80, conversions: 12 },
      { category: 'vehicle', title: '二手比亚迪汉EV出售', description: '2023款长续航版，1万公里，准新车', price: 168000, province: '杭州市', city: '杭州市', district: '滨江区', author_id: 14, status: 'pending', risk_score: 18, is_top: 0, views: 2800, leads: 130, conversions: 2 },
    ]

    const postIds: number[] = []
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i]
      const createdAt = new Date(2025, 4, 1 + (i % 30), 8 + (i % 12), i % 60, 0)
        .toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
      const r = insertPost.run(
        p.category, p.title, p.description, p.price,
        p.province, p.city, p.district,
        userIds[p.author_id - 1], p.status, p.risk_score, p.is_top,
        p.views, p.leads, p.conversions, createdAt
      )
      postIds.push(r.lastInsertRowid as number)
    }

    const imageUrls = [
      'https://img.example.com/posts/img_001.jpg',
      'https://img.example.com/posts/img_002.jpg',
      'https://img.example.com/posts/img_003.jpg',
      'https://img.example.com/posts/img_004.jpg',
    ]
    for (let i = 0; i < postIds.length; i++) {
      const imgCount = 1 + (i % 3)
      for (let j = 0; j < imgCount; j++) {
        insertImage.run(
          postIds[i],
          imageUrls[(i + j) % imageUrls.length],
          j === 0 ? posts[i].title.slice(0, 20) : null,
          j === 0 ? 1 : 0
        )
      }
    }

    const attrDefs: Record<string, Array<{ key: string; value: string }>> = {
      job: [{ key: '薪资范围', value: '8K-15K' }, { key: '工作经验', value: '3-5年' }, { key: '学历要求', value: '本科' }],
      rent: [{ key: '面积', value: '60平' }, { key: '朝向', value: '南' }, { key: '装修', value: '精装' }],
      share: [{ key: '人数', value: '3人' }, { key: '性别限制', value: '不限' }],
      secondhand_house: [{ key: '面积', value: '95平' }, { key: '楼层', value: '12/18层' }, { key: '产权', value: '70年' }],
      secondhand: [{ key: '成色', value: '95新' }, { key: '购买时间', value: '2024年' }],
      vehicle: [{ key: '排量', value: '1.4T' }, { key: '颜色', value: '白色' }, { key: '里程', value: '2万公里' }],
      service: [{ key: '服务时长', value: '2小时' }, { key: '服务范围', value: '全城' }],
      education: [{ key: '课时', value: '30课时' }, { key: '班型', value: '小班' }],
      pet: [{ key: '品种', value: '金毛' }, { key: '年龄', value: '3个月' }],
      dating: [{ key: '身高', value: '165cm' }, { key: '学历', value: '本科' }],
      franchise: [{ key: '投资额', value: '5万起' }, { key: '回本周期', value: '3个月' }],
      other: [{ key: '类型', value: '其他' }],
    }
    for (let i = 0; i < postIds.length; i++) {
      const cat = posts[i].category
      const attrs = attrDefs[cat] || attrDefs.other
      for (const attr of attrs) {
        insertAttr.run(postIds[i], attr.key, attr.value)
      }
    }

    const merchants = [
      { user_idx: 5, name: '北京安居房产经纪有限公司', license_no: '91110105MA01A1B2C', license_verified: 1, deposit_amount: 50000, deposit_status: 'paid', rating: 4.5, review_count: 28 },
      { user_idx: 6, name: '上海诚信家政服务有限公司', license_no: '91310115MA1H3K4L5', license_verified: 1, deposit_amount: 30000, deposit_status: 'paid', rating: 4.2, review_count: 15 },
      { user_idx: 7, name: '广州优车汇汽车服务有限公司', license_no: '91440106MA5C2X8Y7', license_verified: 0, deposit_amount: 0, deposit_status: 'none', rating: 3.8, review_count: 8 },
      { user_idx: 8, name: '杭州学而思教育咨询有限公司', license_no: '91330108MA2B5D6E3', license_verified: 1, deposit_amount: 20000, deposit_status: 'paid', rating: 4.7, review_count: 42 },
      { user_idx: 9, name: '成都旺铺加盟管理有限公司', license_no: '91510104MA6C7F8G1', license_verified: 0, deposit_amount: 10000, deposit_status: 'pending', rating: 3.5, review_count: 5 },
    ]
    const merchantIds: number[] = []
    for (const m of merchants) {
      const r = insertMerchant.run(userIds[m.user_idx], m.name, m.license_no, m.license_verified, m.deposit_amount, m.deposit_status, m.rating, m.review_count)
      merchantIds.push(r.lastInsertRowid as number)
    }

    const reviewContents = [
      '服务很专业，推荐！',
      '价格合理，态度好',
      '一般般，中规中矩',
      '非常满意，下次还来',
      '效率很高，值得信赖',
      '有些小问题，总体还行',
      '性价比很高',
      '客服响应很快',
      '体验不错，会推荐给朋友',
      '还需要改进',
      '超出预期，好评',
      '还行吧，没什么特别的',
    ]
    for (let mi = 0; mi < merchantIds.length; mi++) {
      const count = merchants[mi].review_count
      for (let ri = 0; ri < Math.min(count, 12); ri++) {
        const userIdx = 10 + ((mi * 3 + ri) % 15)
        const rating = 3 + (ri % 3)
        const createdAt = new Date(2025, 4, 1 + ri, 10 + ri, 0, 0)
          .toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
        insertReview.run(merchantIds[mi], userIds[userIdx], rating, reviewContents[ri % reviewContents.length], createdAt)
      }
    }

    const sensitiveWords = [
      { word: '法轮功', category: 'politics', hit_count: 56 },
      { word: '反华', category: 'politics', hit_count: 34 },
      { word: '颠覆政权', category: 'politics', hit_count: 12 },
      { word: '政治谣言', category: 'politics', hit_count: 89 },
      { word: '境外势力', category: 'politics', hit_count: 23 },
      { word: '分裂国家', category: 'politics', hit_count: 45 },
      { word: '传销', category: 'fraud', hit_count: 234 },
      { word: '杀猪盘', category: 'fraud', hit_count: 178 },
      { word: '刷单返利', category: 'fraud', hit_count: 156 },
      { word: '高息理财', category: 'fraud', hit_count: 132 },
      { word: '内幕消息', category: 'fraud', hit_count: 98 },
      { word: '稳赚不赔', category: 'fraud', hit_count: 87 },
      { word: '日入过万', category: 'fraud', hit_count: 201 },
      { word: '零投资高回报', category: 'fraud', hit_count: 167 },
      { word: '包赚钱', category: 'fraud', hit_count: 145 },
      { word: '色情', category: 'adult', hit_count: 312 },
      { word: '裸聊', category: 'adult', hit_count: 189 },
      { word: '一夜情', category: 'adult', hit_count: 267 },
      { word: '约炮', category: 'adult', hit_count: 234 },
      { word: '性服务', category: 'adult', hit_count: 156 },
      { word: '成人视频', category: 'adult', hit_count: 198 },
      { word: '招嫖', category: 'adult', hit_count: 145 },
      { word: '暴力', category: 'violence', hit_count: 87 },
      { word: '凶器', category: 'violence', hit_count: 56 },
      { word: '恐吓', category: 'violence', hit_count: 123 },
      { word: '威胁', category: 'violence', hit_count: 98 },
      { word: '伤害他人', category: 'violence', hit_count: 67 },
      { word: '报复', category: 'violence', hit_count: 89 },
      { word: '私刑', category: 'violence', hit_count: 34 },
      { word: '人体器官', category: 'violence', hit_count: 78 },
      { word: '代孕', category: 'fraud', hit_count: 45 },
      { word: '赌博', category: 'fraud', hit_count: 112 },
    ]
    for (const sw of sensitiveWords) {
      insertSensitiveWord.run(sw.word, sw.category, sw.hit_count)
    }

    const auditorIdxs = [2, 3, 4]
    const stages = ['initial', 'review', 'top_recommend']
    const results = ['approved', 'rejected', 'flagged']
    for (let i = 0; i < postIds.length; i++) {
      if (posts[i].status === 'approved') {
        const auditorIdx = auditorIdxs[i % auditorIdxs.length]
        insertAuditRecord.run(
          postIds[i], userIds[auditorIdx], 'initial', 'approved',
          '初审通过', '2025-05-02 09:00:00'
        )
        if (i % 3 === 0) {
          insertAuditRecord.run(
            postIds[i], userIds[(auditorIdx + 1) % auditorIdxs.length + 2], 'review', 'approved',
            '复审通过', '2025-05-02 14:00:00'
          )
        }
        if (posts[i].is_top === 1) {
          insertAuditRecord.run(
            postIds[i], userIds[(auditorIdx + 2) % auditorIdxs.length + 2], 'top_recommend', 'approved',
            '推荐位审核通过', '2025-05-03 10:00:00'
          )
        }
      } else if (posts[i].status === 'rejected') {
        const auditorIdx = auditorIdxs[i % auditorIdxs.length]
        insertAuditRecord.run(
          postIds[i], userIds[auditorIdx], 'initial', 'rejected',
          '涉嫌违规，不予通过', '2025-05-02 10:30:00'
        )
      } else if (posts[i].status === 'pending') {
        const auditorIdx = auditorIdxs[i % auditorIdxs.length]
        insertAuditRecord.run(
          postIds[i], userIds[auditorIdx], 'initial', 'flagged',
          '需要进一步审核', '2025-05-03 11:00:00'
        )
      }
    }

    const apiKeysData = [
      { name: '新华社数据接口', key: 'sk_' + crypto.randomBytes(16).toString('hex'), org: '新华社', permissions: 'read', call_count: 12580, status: 'active' },
      { name: '人民日报数据接口', key: 'sk_' + crypto.randomBytes(16).toString('hex'), org: '人民日报', permissions: 'read', call_count: 8930, status: 'active' },
      { name: '央视新闻数据接口', key: 'sk_' + crypto.randomBytes(16).toString('hex'), org: '中央电视台', permissions: 'read,write', call_count: 6720, status: 'active' },
      { name: '国家发改委数据接口', key: 'sk_' + crypto.randomBytes(16).toString('hex'), org: '国家发改委', permissions: 'read', call_count: 3450, status: 'active' },
      { name: '测试接口', key: 'sk_' + crypto.randomBytes(16).toString('hex'), org: '测试机构', permissions: 'read', call_count: 120, status: 'disabled' },
    ]
    for (const ak of apiKeysData) {
      insertApiKey.run(ak.name, ak.key, ak.org, ak.permissions, ak.call_count, ak.status)
    }

    const geoRegions = [
      { code: '110000', name: '北京市', level: 1, parent_code: null, post_count: 0 },
      { code: '110100', name: '北京市', level: 2, parent_code: '110000', post_count: 0 },
      { code: '110105', name: '朝阳区', level: 3, parent_code: '110100', post_count: 0 },
      { code: '110108', name: '海淀区', level: 3, parent_code: '110100', post_count: 0 },
      { code: '110106', name: '丰台区', level: 3, parent_code: '110100', post_count: 0 },
      { code: '110102', name: '西城区', level: 3, parent_code: '110100', post_count: 0 },
      { code: '110112', name: '通州区', level: 3, parent_code: '110100', post_count: 0 },
      { code: '110115', name: '大兴区', level: 3, parent_code: '110100', post_count: 0 },

      { code: '310000', name: '上海市', level: 1, parent_code: null, post_count: 0 },
      { code: '310100', name: '上海市', level: 2, parent_code: '310000', post_count: 0 },
      { code: '310115', name: '浦东新区', level: 3, parent_code: '310100', post_count: 0 },
      { code: '310104', name: '徐汇区', level: 3, parent_code: '310100', post_count: 0 },
      { code: '310106', name: '静安区', level: 3, parent_code: '310100', post_count: 0 },
      { code: '310112', name: '闵行区', level: 3, parent_code: '310100', post_count: 0 },
      { code: '310110', name: '杨浦区', level: 3, parent_code: '310100', post_count: 0 },
      { code: '310101', name: '黄浦区', level: 3, parent_code: '310100', post_count: 0 },
      { code: '310105', name: '长宁区', level: 3, parent_code: '310100', post_count: 0 },

      { code: '440000', name: '广东省', level: 1, parent_code: null, post_count: 0 },
      { code: '440100', name: '广州市', level: 2, parent_code: '440000', post_count: 0 },
      { code: '440106', name: '天河区', level: 3, parent_code: '440100', post_count: 0 },
      { code: '440104', name: '越秀区', level: 3, parent_code: '440100', post_count: 0 },
      { code: '440113', name: '番禺区', level: 3, parent_code: '440100', post_count: 0 },
      { code: '440111', name: '白云区', level: 3, parent_code: '440100', post_count: 0 },
      { code: '440300', name: '深圳市', level: 2, parent_code: '440000', post_count: 0 },
      { code: '440305', name: '南山区', level: 3, parent_code: '440300', post_count: 0 },
      { code: '440304', name: '福田区', level: 3, parent_code: '440300', post_count: 0 },

      { code: '330000', name: '浙江省', level: 1, parent_code: null, post_count: 0 },
      { code: '330100', name: '杭州市', level: 2, parent_code: '330000', post_count: 0 },
      { code: '330106', name: '西湖区', level: 3, parent_code: '330100', post_count: 0 },
      { code: '330108', name: '滨江区', level: 3, parent_code: '330100', post_count: 0 },
      { code: '330110', name: '余杭区', level: 3, parent_code: '330100', post_count: 0 },
      { code: '330105', name: '拱墅区', level: 3, parent_code: '330100', post_count: 0 },
      { code: '330200', name: '宁波市', level: 2, parent_code: '330000', post_count: 0 },
      { code: '330203', name: '海曙区', level: 3, parent_code: '330200', post_count: 0 },
      { code: '330205', name: '江北区', level: 3, parent_code: '330200', post_count: 0 },

      { code: '510000', name: '四川省', level: 1, parent_code: null, post_count: 0 },
      { code: '510100', name: '成都市', level: 2, parent_code: '510000', post_count: 0 },
      { code: '510104', name: '锦江区', level: 3, parent_code: '510100', post_count: 0 },
      { code: '510107', name: '武侯区', level: 3, parent_code: '510100', post_count: 0 },
      { code: '510105', name: '青羊区', level: 3, parent_code: '510100', post_count: 0 },
      { code: '510106', name: '金牛区', level: 3, parent_code: '510100', post_count: 0 },
      { code: '510300', name: '自贡市', level: 2, parent_code: '510000', post_count: 0 },
      { code: '510302', name: '自流井区', level: 3, parent_code: '510300', post_count: 0 },
    ]
    for (const gr of geoRegions) {
      insertGeoRegion.run(gr.code, gr.name, gr.level, gr.parent_code, gr.post_count)
    }

    const updatePostCount = db.prepare(
      `UPDATE geo_regions SET post_count = (
        SELECT COUNT(*) FROM posts WHERE district = geo_regions.name
      ) WHERE level = 3`
    )
    updatePostCount.run()
  })

  seedTransaction()
  console.log('Seed data inserted successfully.')
}
