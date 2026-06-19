import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type {
  Metric, Product, TimelineItem, TraceBatch,
  UnionMember, UnionOrg, WelfareBudget, WelfareCoupon,
  PointsAccount, PointsRecord, UnionCard, SupplierAssessment,
  MemberBenefit, TravelBooking, LegalConsult, FunnelAnalysis
} from '../shared/types';

const rootDir = process.cwd();
const dbRelativePath = process.env.SQLITE_PATH || 'data/app.sqlite';
export const dbPath = path.resolve(rootDir, dbRelativePath);

type CountRow = { name: string; count: number };

function ensureDirectory() {
  mkdirSync(path.dirname(dbPath), { recursive: true });
}

function runSql(sql: string) {
  ensureDirectory();
  const result = spawnSync('sqlite3', [dbPath], {
    input: sql,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `sqlite3 exited with ${result.status}`);
  }
}

function queryJson<T>(sql: string): T[] {
  ensureDirectory();
  const result = spawnSync('sqlite3', ['-json', dbPath, sql], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `sqlite3 exited with ${result.status}`);
  }

  const output = result.stdout.trim();
  return output ? JSON.parse(output) as T[] : [];
}

const schemaSql = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  delta TEXT NOT NULL,
  tone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trace_batches (
  id TEXT PRIMARY KEY,
  traceCode TEXT UNIQUE NOT NULL,
  productName TEXT NOT NULL,
  category TEXT NOT NULL,
  specification TEXT NOT NULL,
  producer TEXT NOT NULL,
  origin TEXT NOT NULL,
  productionDate TEXT NOT NULL,
  shelfLife INTEGER NOT NULL,
  status TEXT NOT NULL,
  blockchainHash TEXT NOT NULL,
  blockHeight INTEGER NOT NULL,
  qualityResult TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline (
  id TEXT PRIMARY KEY,
  traceCode TEXT NOT NULL,
  stage TEXT NOT NULL,
  operator TEXT NOT NULL,
  eventTime TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  temperature REAL,
  humidity REAL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  wholesalePrice REAL NOT NULL,
  moq INTEGER NOT NULL,
  specification TEXT NOT NULL,
  traceCode TEXT NOT NULL,
  seller TEXT NOT NULL,
  origin TEXT NOT NULL,
  stock INTEGER NOT NULL,
  sales INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  channel TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  logistics TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  blockchainHash TEXT NOT NULL,
  signedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  expert TEXT NOT NULL,
  status TEXT NOT NULL,
  answers INTEGER NOT NULL,
  responseTime TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weather_alerts (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  level TEXT NOT NULL,
  alertType TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  startsAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quality_trends (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  passRate REAL NOT NULL,
  sampling INTEGER NOT NULL,
  risk INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS union_orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  parentId TEXT NOT NULL,
  memberCount INTEGER NOT NULL,
  adminName TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS union_members (
  id TEXT PRIMARY KEY,
  idCard TEXT UNIQUE NOT NULL,
  employeeNo TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  unionLevel TEXT NOT NULL,
  unionName TEXT NOT NULL,
  parentUnionId TEXT NOT NULL,
  membershipStatus TEXT NOT NULL,
  verifiedAt TEXT NOT NULL,
  memberPoints INTEGER NOT NULL,
  welfareBalance REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS welfare_budgets (
  id TEXT PRIMARY KEY,
  unionId TEXT NOT NULL,
  unionName TEXT NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  totalAmount REAL NOT NULL,
  usedAmount REAL NOT NULL,
  remainingAmount REAL NOT NULL,
  status TEXT NOT NULL,
  approver TEXT NOT NULL,
  approvedAt TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS welfare_coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  memberId TEXT NOT NULL,
  memberName TEXT NOT NULL,
  status TEXT NOT NULL,
  validFrom TEXT NOT NULL,
  validTo TEXT NOT NULL,
  usedAt TEXT NOT NULL,
  orderId TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS points_accounts (
  id TEXT PRIMARY KEY,
  memberId TEXT UNIQUE NOT NULL,
  memberName TEXT NOT NULL,
  totalPoints INTEGER NOT NULL,
  availablePoints INTEGER NOT NULL,
  frozenPoints INTEGER NOT NULL,
  lastUpdated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS points_records (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  orderId TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS union_cards (
  id TEXT PRIMARY KEY,
  cardNo TEXT UNIQUE NOT NULL,
  memberId TEXT NOT NULL,
  memberName TEXT NOT NULL,
  bankName TEXT NOT NULL,
  balance REAL NOT NULL,
  status TEXT NOT NULL,
  bindAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_assessments (
  id TEXT PRIMARY KEY,
  supplierId TEXT NOT NULL,
  supplierName TEXT NOT NULL,
  period TEXT NOT NULL,
  qualityScore REAL NOT NULL,
  priceScore REAL NOT NULL,
  deliveryScore REAL NOT NULL,
  serviceScore REAL NOT NULL,
  totalScore REAL NOT NULL,
  level TEXT NOT NULL,
  assessor TEXT NOT NULL,
  assessedAt TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_benefits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  value TEXT NOT NULL,
  pointsRequired INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS travel_bookings (
  id TEXT PRIMARY KEY,
  memberId TEXT NOT NULL,
  memberName TEXT NOT NULL,
  type TEXT NOT NULL,
  travelDate TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  price REAL NOT NULL,
  status TEXT NOT NULL,
  bookedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS legal_consults (
  id TEXT PRIMARY KEY,
  memberId TEXT NOT NULL,
  memberName TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lawyerName TEXT NOT NULL,
  reply TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  repliedAt TEXT NOT NULL
);
`;

const seedSql = `
INSERT OR IGNORE INTO metrics VALUES
('trace-total', '溯源批次', '128,640', '+12.8%', 'green'),
('trade-amount', '交易额', '¥8,742万', '+9.4%', 'blue'),
('verified-enterprises', '认证企业', '3,286', '+6.1%', 'slate'),
('quality-pass', '抽检合格率', '98.7%', '+1.2%', 'amber');

INSERT OR IGNORE INTO trace_batches VALUES
('tb-001', 'TRC-2026-RICE-89141', '五常有机稻花香', '粮油', '5kg/袋', '黑龙江禾源农业合作社', '黑龙江哈尔滨五常市民乐乡', '2026-05-18', 365, '已入市', '0xf6c2a51e3e5b918d8a47d92ad74b8f2ac29389141b7d63e9c1b0f5a77d6258f1', 8927318, '合格'),
('tb-002', 'TRC-2026-TEA-62201', '明前龙井鲜叶', '茶叶', '250g/盒', '杭州云栖茶业有限公司', '浙江杭州西湖龙坞茶镇', '2026-04-02', 540, '冷链配送', '0xa4f6e7aee8bc78212c32e31f64378aa4c7b2e55b7317b10ea36d4407b75d8a0c', 8927441, '合格'),
('tb-003', 'TRC-2026-TOMATO-19322', '设施番茄精品果', '蔬菜', '2.5kg/箱', '山东寿光智农园区', '山东潍坊寿光洛城街道', '2026-06-08', 12, '门店在售', '0x8d34e5f04ad09b22e11b7c62a9586a47a2e68be6d819ea891414da8934b2c671', 8927523, '合格');

INSERT OR IGNORE INTO timeline VALUES
('tl-001', 'TRC-2026-RICE-89141', '种植建档', '王立国', '2026-04-08 08:30', '五常市民乐乡 4 号田', '完成有机稻种浸种、育秧盘建档，地块绑定土壤检测报告。', NULL, NULL),
('tl-002', 'TRC-2026-RICE-89141', '农事操作', '李春梅', '2026-05-02 10:15', '五常市民乐乡 4 号田', '无人机精准施用有机叶面肥 12L，作业轨迹已上传。', NULL, NULL),
('tl-003', 'TRC-2026-RICE-89141', '质量检测', '黑龙江农检中心', '2026-05-22 15:20', '哈尔滨市质量检测实验室', '农残、重金属、黄曲霉毒素检测结果均符合绿色食品标准。', NULL, NULL),
('tl-004', 'TRC-2026-RICE-89141', '加工包装', '禾源加工一厂', '2026-06-03 09:40', '五常稻米加工园', '完成低温烘干、色选和真空包装，批次重量 18.6 吨。', 18.2, 48.0),
('tl-005', 'TRC-2026-RICE-89141', '冷链物流', '北方冷链 HL89141', '2026-06-09 13:05', '哈尔滨至北京干线', '运输全程温湿度稳定，电子铅封状态正常。', 16.8, 52.0),
('tl-006', 'TRC-2026-RICE-89141', '到货入库', '北京朝阳冷链仓', '2026-06-10 22:18', '北京朝阳冷链仓储中心', '到货温湿度检测合格，入库验收重量 18.58 吨，偏差 0.1%。', 14.5, 55.0),
('tl-007', 'TRC-2026-RICE-89141', '入市销售', '北京朝阳农批中心', '2026-06-11 07:55', '北京朝阳农产品批发市场', '完成入库复核，分销至 28 家零售门店，上架率 100%。', NULL, NULL),
('tl-008', 'TRC-2026-RICE-89141', '监管复查', '北京市市场监管局', '2026-06-16 14:30', '北京朝阳农产品批发市场', '专项抽检复查合格，重金属、农残均低于国家标准限值，批次标记为闭环。', NULL, NULL),
('tl-101', 'TRC-2026-TEA-62201', '种植建档', '陆志远', '2026-02-15 07:00', '西湖龙坞茶镇 3 号茶园', '明前龙井鲜叶采摘区划块建档，茶园土壤pH检测6.2。', NULL, NULL),
('tl-102', 'TRC-2026-TEA-62201', '农事操作', '陆志远', '2026-03-20 09:00', '西湖龙坞茶镇 3 号茶园', '完成手工采摘明前一芽一叶，鲜叶含水率 74%。', NULL, NULL),
('tl-103', 'TRC-2026-TEA-62201', '加工包装', '云栖茶业加工厂', '2026-03-22 16:00', '杭州云栖茶业加工中心', '杀青、揉捻、干燥全流程完成，真空充氮包装 250g/盒。', 20.0, 45.0),
('tl-104', 'TRC-2026-TEA-62201', '冷链物流', '顺丰冷运 99120348', '2026-04-05 08:30', '杭州至南京冷链专线', '全程 2-8°C 恒温运输，GPS定位实时上报。', 4.2, 62.0),
('tl-105', 'TRC-2026-TEA-62201', '到货入库', '南京雨花冷链仓', '2026-04-06 14:20', '南京雨花冷链仓储中心', '到货温度 3.8°C，验收合格，入库 980 盒。', 3.8, 58.0),
('tl-106', 'TRC-2026-TEA-62201', '入市销售', '南京雨花精品超市', '2026-04-08 09:00', '南京雨花区 6 家门店', '上架销售，首批 200 盒上架即售罄，补货 300 盒。', NULL, NULL),
('tl-107', 'TRC-2026-TEA-62201', '监管复查', '杭州市市场监管局', '2026-05-10 10:00', '杭州西湖区市场监管所', '茶叶农残专项抽检合格，符合 GB 2763 标准，批次闭环。', NULL, NULL),
('tl-201', 'TRC-2026-TOMATO-19322', '种植建档', '赵海涛', '2026-04-10 06:30', '寿光洛城街道智能温室 2 号', '设施番茄定植建档，品种为粉贝拉，智能环控系统已启用。', 22.0, 65.0),
('tl-202', 'TRC-2026-TOMATO-19322', '农事操作', '赵海涛', '2026-05-15 08:00', '寿光洛城街道智能温室 2 号', '整枝打杈、滴灌施肥，智能系统记录生长周期 68 天。', 24.0, 60.0),
('tl-203', 'TRC-2026-TOMATO-19322', '质量检测', '山东农检中心', '2026-06-05 11:00', '济南质量检测实验室', '农残检测合格，硝酸盐含量低于限值，品质等级 A。', NULL, NULL),
('tl-204', 'TRC-2026-TOMATO-19322', '加工包装', '寿光分拣中心', '2026-06-08 06:00', '寿光农产品分拣包装中心', '光电分选、分级包装 2.5kg/箱，精品果率 92%。', 12.0, 70.0),
('tl-205', 'TRC-2026-TOMATO-19322', '冷链物流', '沪农配 76219', '2026-06-10 04:30', '寿光至上海冷链干线', '全程 8-12°C 冷链运输，到货温湿度正常。', 10.5, 72.0),
('tl-206', 'TRC-2026-TOMATO-19322', '到货入库', '上海江桥冷链仓', '2026-06-11 18:40', '上海江桥农产品冷链中心', '到货验收合格，糖度检测 8.2 Brix，入库 1500 箱。', 9.8, 68.0),
('tl-207', 'TRC-2026-TOMATO-19322', '入市销售', '上海社区团购仓', '2026-06-12 07:00', '上海浦东 15 个社区团购点', '社区团购首发，当日售出 3060 箱。', NULL, NULL),
('tl-208', 'TRC-2026-TOMATO-19322', '监管复查', '上海市市场监管局', '2026-06-15 09:30', '上海浦东市场监管所', '随机抽检合格，农残、重金属均达标，批次标记闭环。', NULL, NULL);

INSERT OR IGNORE INTO products VALUES
('p-001', '五常有机稻花香', '粮油', 68.00, 52.00, 100, '5kg/袋', 'TRC-2026-RICE-89141', '黑龙江禾源农业合作社', '黑龙江五常', 4600, 1820, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80', 'b2b'),
('p-002', '明前龙井鲜叶', '茶叶', 198.00, 158.00, 20, '250g/盒', 'TRC-2026-TEA-62201', '杭州云栖茶业有限公司', '浙江杭州', 980, 421, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80', 'b2c'),
('p-003', '设施番茄精品果', '蔬菜', 29.90, 18.60, 80, '2.5kg/箱', 'TRC-2026-TOMATO-19322', '山东寿光智农园区', '山东寿光', 1500, 3060, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80', 'b2c'),
('p-004', '冷链蓝莓鲜果', '水果', 86.00, 63.00, 50, '1.5kg/箱', 'TRC-2026-BERRY-81562', '大兴安岭浆果基地', '黑龙江大兴安岭', 720, 586, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=900&q=80', 'b2b'),
('p-005', '赣南脐橙精选果', '水果', 45.00, 32.00, 200, '5kg/箱', 'TRC-2026-ORANGE-43710', '赣州金橙农业公司', '江西赣州', 2200, 1480, 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=900&q=80', 'b2b'),
('p-006', '阳澄湖大闸蟹', '水产', 298.00, 248.00, 10, '4只/盒', 'TRC-2026-CRAB-76005', '苏州阳澄湖蟹业有限公司', '江苏苏州', 500, 380, 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=900&q=80', 'b2c'),
('p-007', '有机西兰花', '蔬菜', 18.80, 12.00, 100, '2颗/袋', 'TRC-2026-BROCC-33201', '云南高原农业基地', '云南昆明', 3600, 2100, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2c?auto=format&fit=crop&w=900&q=80', 'b2c'),
('p-008', '东北黑豆有机豆', '粮油', 35.00, 26.00, 200, '1kg/袋', 'TRC-2026-BEAN-56890', '黑龙江农垦集团', '黑龙江佳木斯', 5800, 3200, 'https://images.unsplash.com/photo-1515543904323-e90e70c6efb3?auto=format&fit=crop&w=900&q=80', 'b2b'),
('p-009', '海南贵妃芒', '水果', 56.00, 38.00, 50, '2.5kg/箱', 'TRC-2026-MANGO-12987', '三亚热带果园', '海南三亚', 1800, 1200, 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80', 'b2c'),
('p-010', '内蒙古有机羊排', '肉禽', 128.00, 98.00, 20, '1kg/真空包装', 'TRC-2026-LAMB-94521', '锡林郭勒草原牧业', '内蒙古锡林郭勒', 600, 420, 'https://images.unsplash.com/photo-1603048568710-b5991b3b5d48?auto=format&fit=crop&w=900&q=80', 'b2b');

INSERT OR IGNORE INTO orders VALUES
('od-89141', '北京朝阳农批中心', '黑龙江禾源农业合作社', 286000.00, '担保支付中', 72, '京冷 A65918 已抵达北京中转仓', '2026-06-12 10:22'),
('od-89139', '南京雨花精品超市', '杭州云栖茶业有限公司', 48500.00, '待签收', 86, '顺丰冷运 99120348 派送中', '2026-06-15 16:40'),
('od-89140', '上海社区团购仓', '山东寿光智农园区', 73600.00, '已验收', 100, '沪农配 76219 完成入库', '2026-06-17 09:16'),
('od-89141', '广州江南市场', '赣州金橙农业公司', 128000.00, '保证金已冻结', 45, '待发货', '2026-06-18 08:30'),
('od-89142', '深圳百佳超市', '三亚热带果园', 67200.00, '合同签署中', 20, '待确认', '2026-06-18 11:15'),
('od-89143', '成都红旗连锁', '锡林郭勒草原牧业', 94500.00, '已结算', 100, '蓉冷配 55218 完成交接', '2026-06-16 14:00');

INSERT OR IGNORE INTO contracts VALUES
('ct-001', '五常稻花香 B2B 采购合同', '北京朝阳农批中心', 286000.00, '双方已签署', '0x9f5e9f49141a7c4ad07ce5de9b372a90c9c6e2f8147fa112a2c8e4701f5f6d33', '2026-06-12 11:05'),
('ct-002', '龙井茶叶年度供货框架', '南京雨花精品超市', 420000.00, '平台见证中', '0x62b8c0f4e7fdb9e1be5b1dd7a15ff1f02d6a7b12090ed62a4329ad8c51389141', '2026-06-14 14:20'),
('ct-003', '赣南脐橙批发采购协议', '广州江南市场', 128000.00, '待乙方签署', '0x3a1f7b5c9e2d8a4f6b0c1d3e5f7a9b2c4d6e8f0a1b3c5d7e9f0a2b4c6d8e0f1', '2026-06-18 09:00'),
('ct-004', '有机羊排冷链供货合同', '成都红旗连锁', 94500.00, '双方已签署', '0x7c2e4f6a8b0d1e3f5a7c9b1d3e5f7a9c1b3d5e7f9a1c3b5d7e9f1a3c5d7e9f0a2', '2026-06-16 15:30'),
('ct-005', '海南贵妃芒直供合同', '深圳百佳超市', 67200.00, '保证金待缴纳', '0xb4d6e8f0a2c4d6e8f0a2b4c6d8e0f1a3c5d7e9f1a3c5d7e9f0a2b4c6d8e0f1a3', '2026-06-18 12:00');

INSERT OR IGNORE INTO questions VALUES
('qa-001', '番茄叶片边缘发黄并卷曲，是否为病毒病？', '病虫害', '张敏 高级农艺师', '专家已答复', 3, '18 分钟'),
('qa-002', '水稻分蘖期遇持续降雨怎样控肥？', '种植管理', '刘建国 研究员', '工单处理中', 1, '42 分钟'),
('qa-003', '蓝莓冷链到店后货架期如何延长？', '采后保鲜', '陈晓 采后工程师', '已归档', 4, '25 分钟');

INSERT OR IGNORE INTO weather_alerts VALUES
('wa-001', '山东寿光', '橙色', '强对流', '设施棚区加固棚膜，提前排查排水沟，暂停午后喷药作业。', '2026-06-19 14:00'),
('wa-002', '浙江杭州', '黄色', '高温', '茶园覆盖遮阴网，采摘时段调整到清晨并补充滴灌。', '2026-06-20 10:00'),
('wa-003', '黑龙江五常', '蓝色', '短时强降雨', '稻田保持浅水层，巡检田埂和排涝口。', '2026-06-21 06:00');

INSERT OR IGNORE INTO quality_trends VALUES
('qt-01', '1月', 97.6, 1280, 9),
('qt-02', '2月', 97.9, 1360, 8),
('qt-03', '3月', 98.1, 1524, 7),
('qt-04', '4月', 98.4, 1648, 6),
('qt-05', '5月', 98.5, 1720, 5),
('qt-06', '6月', 98.7, 1846, 4);

INSERT OR IGNORE INTO union_orgs VALUES
('uo-001', '中华全国总工会', '全国', 'uo-000', 128600000, '李玉赋', '正常'),
('uo-002', '北京市总工会', '省级', 'uo-001', 3280000, '张延昆', '正常'),
('uo-003', '上海市总工会', '省级', 'uo-001', 2860000, '莫负春', '正常'),
('uo-004', '黑龙江省总工会', '省级', 'uo-001', 1980000, '宋希斌', '正常'),
('uo-005', '哈尔滨市总工会', '市级', 'uo-004', 685000, '黄玉生', '正常'),
('uo-006', '五常市总工会', '区县', 'uo-005', 128000, '张英波', '正常'),
('uo-007', '五常市民乐乡工会联合会', '基层', 'uo-006', 2860, '王立国', '正常');

INSERT OR IGNORE INTO union_members VALUES
('um-001', '230184198505120018', 'HLJ-2024-089141', '王建国', '男', '13800138001', '基层', '五常市民乐乡工会联合会', 'uo-006', '已入会', '2024-03-15 10:30:00', 12860, 8500.00),
('um-002', '310101199010080025', 'SH-2023-112015', '李淑华', '女', '13900139002', '市级', '上海市总工会', 'uo-003', '已入会', '2023-06-20 14:20:00', 25680, 15600.00),
('um-003', '110105198808150033', 'BJ-2022-056890', '张志强', '男', '13700137003', '省级', '北京市总工会', 'uo-002', '已入会', '2022-09-10 09:15:00', 38920, 28000.00),
('um-004', '230108199212200047', 'HLJ-2025-001286', '赵春梅', '女', '13600136004', '基层', '五常市民乐乡工会联合会', 'uo-006', '核验中', '2025-06-10 16:45:00', 0, 0.00);

INSERT OR IGNORE INTO welfare_budgets VALUES
('wb-001', 'uo-004', '黑龙江省总工会', 2026, 2, 5000000.00, 3280000.00, 1720000.00, '已执行', '李玉赋', '2026-03-15 10:00:00', '2026年第二季度职工福利采购预算'),
('wb-002', 'uo-002', '北京市总工会', 2026, 2, 8000000.00, 5200000.00, 2800000.00, '已批准', '李玉赋', '2026-03-20 14:30:00', '2026年第二季度节日福利预算'),
('wb-003', 'uo-003', '上海市总工会', 2026, 2, 6500000.00, 0.00, 6500000.00, '待审批', '', '', '2026年高温慰问品采购预算'),
('wb-004', 'uo-005', '哈尔滨市总工会', 2026, 2, 1200000.00, 860000.00, 340000.00, '已驳回', '', '', '预算超支，需重新编制');

INSERT OR IGNORE INTO welfare_coupons VALUES
('wc-001', 'WEL-AGRI-2026-0001', '端午节农产品提货券', '农产品券', 200.00, 'um-001', '王建国', '未使用', '2026-06-01', '2026-06-30', '', ''),
('wc-002', 'WEL-AGRI-2026-0002', '五常稻花香5kg兑换券', '农产品券', 168.00, 'um-001', '王建国', '已使用', '2026-05-01', '2026-05-31', '2026-05-12', 'od-89145'),
('wc-003', 'WEL-MOVIE-2026-0001', '全国通用电影票', '电影券', 80.00, 'um-002', '李淑华', '未使用', '2026-01-01', '2026-12-31', '', ''),
('wc-004', 'WEL-BOOK-2026-0001', '图书购买抵用券', '图书券', 100.00, 'um-003', '张志强', '已过期', '2026-01-01', '2026-03-31', '', ''),
('wc-005', 'WEL-FEST-2026-0001', '春节节日福利券', '节日福利', 500.00, 'um-002', '李淑华', '已使用', '2026-01-15', '2026-02-28', '2026-01-20', 'od-89146');

INSERT OR IGNORE INTO points_accounts VALUES
('pa-001', 'um-001', '王建国', 12860, 12860, 0, '2026-06-18 10:30:00'),
('pa-002', 'um-002', '李淑华', 25680, 24680, 1000, '2026-06-18 11:20:00'),
('pa-003', 'um-003', '张志强', 38920, 38920, 0, '2026-06-18 09:15:00');

INSERT OR IGNORE INTO points_records VALUES
('pr-001', 'pa-001', '获取', 500, '2026年5月工会活动参与奖励', '', '2026-05-20 14:30:00'),
('pr-002', 'pa-001', '获取', 12860, '会员年度积分累计', '', '2026-06-01 00:00:00'),
('pr-003', 'pa-002', '消费', 1000, '积分兑换电影票2张', 'od-89147', '2026-06-10 16:45:00'),
('pr-004', 'pa-003', '获取', 2000, '工会积极分子奖励', '', '2026-05-04 10:00:00');

INSERT OR IGNORE INTO union_cards VALUES
('uc-001', '6222020100008914101', 'um-001', '王建国', '中国工商银行', 12860.50, '正常', '2024-03-20 10:30:00'),
('uc-002', '6217000100001120102', 'um-002', '李淑华', '中国建设银行', 28650.80, '正常', '2023-06-25 14:20:00'),
('uc-003', '6216610100005689003', 'um-003', '张志强', '中国银行', 45280.20, '正常', '2022-09-15 09:15:00');

INSERT OR IGNORE INTO supplier_assessments VALUES
('sa-001', 's-001', '黑龙江禾源农业合作社', '2026-Q1', 96.5, 92.0, 94.5, 95.0, 94.5, 'A', '采购评审组', '2026-04-10 14:30:00', '优秀'),
('sa-002', 's-002', '杭州云栖茶业有限公司', '2026-Q1', 94.0, 88.5, 92.0, 93.0, 91.9, 'A', '采购评审组', '2026-04-10 15:00:00', '优秀'),
('sa-003', 's-003', '山东寿光智农园区', '2026-Q1', 90.5, 85.0, 88.0, 86.0, 87.4, 'B', '采购评审组', '2026-04-10 15:30:00', '合格'),
('sa-004', 's-004', '大兴安岭浆果基地', '2026-Q1', 82.0, 78.0, 80.0, 79.0, 79.8, 'C', '采购评审组', '2026-04-10 16:00:00', '整改'),
('sa-005', 's-005', '某不合格供应商', '2026-Q1', 58.0, 55.0, 52.0, 54.0, 54.8, 'D', '采购评审组', '2026-04-10 16:30:00', '淘汰');

INSERT OR IGNORE INTO member_benefits VALUES
('mb-001', '五常有机稻花香5kg', '农产品', '会员专享价，溯源保真', '¥168', 1680, 500, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80', '上架'),
('mb-002', '高铁票85折优惠', '出行', '全国高铁票会员专享折扣', '85折', 500, 1000, 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=900&q=80', '上架'),
('mb-003', '免费法律咨询服务', '法律', '专业律师一对一咨询', '免费', 0, 500, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80', '上架'),
('mb-004', '电影票兑换券', '文娱', '全国影院通用2D/3D通兑', '¥35', 350, 2000, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80', '上架'),
('mb-005', '体检套餐7折', '医疗', '三甲医院体检中心专属折扣', '7折', 1000, 300, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80', '上架'),
('mb-006', '职工技能培训课程', '教育', '线上线下技能提升培训', '免费', 0, 200, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80', '上架');

INSERT OR IGNORE INTO travel_bookings VALUES
('tb-001', 'um-001', '王建国', '高铁', '2026-06-25', '哈尔滨', '北京', 541.50, '已支付', '2026-06-18 10:30:00'),
('tb-002', 'um-002', '李淑华', '飞机', '2026-07-10', '上海', '广州', 1280.00, '待支付', '2026-06-18 11:20:00'),
('tb-003', 'um-003', '张志强', '酒店', '2026-06-30', '北京', '杭州', 680.00, '已完成', '2026-06-15 14:30:00');

INSERT OR IGNORE INTO legal_consults VALUES
('lc-001', 'um-001', '王建国', '劳动纠纷', '公司拖欠工资怎么办？', '我所在的公司已经连续3个月未足额发放工资，请问我应该如何维权？', '张明律师', '建议您先与公司协商，协商不成可以向劳动监察部门投诉或申请劳动仲裁。注意收集劳动合同、工资条、考勤记录等证据。', '已回复', '2026-06-15 09:30:00', '2026-06-16 14:20:00'),
('lc-002', 'um-002', '李淑华', '合同纠纷', '房屋租赁合同纠纷咨询', '我租的房子还没到期，房东要涨房租，否则让我搬走，这合法吗？', '李华律师', '', '处理中', '2026-06-17 10:15:00', ''),
('lc-003', 'um-003', '张志强', '婚姻家庭', '离婚财产分割问题', '我和丈夫准备离婚，婚后购买的房产应该如何分割？', '王芳律师', '', '待处理', '2026-06-18 08:45:00', '');
`;

export function initializeDatabase() {
  runSql(schemaSql);
  runSql(seedSql);
}

export function databaseExists() {
  return existsSync(dbPath);
}

export function getCounts() {
  return {
    metrics: queryJson<CountRow>('SELECT "metrics" AS name, COUNT(*) AS count FROM metrics;')[0]?.count ?? 0,
    traceBatches: queryJson<CountRow>('SELECT "trace_batches" AS name, COUNT(*) AS count FROM trace_batches;')[0]?.count ?? 0,
    products: queryJson<CountRow>('SELECT "products" AS name, COUNT(*) AS count FROM products;')[0]?.count ?? 0,
    orders: queryJson<CountRow>('SELECT "orders" AS name, COUNT(*) AS count FROM orders;')[0]?.count ?? 0,
  };
}

export function getDashboard() {
  return {
    metrics: queryJson<Metric>('SELECT id, label, value, delta, tone FROM metrics ORDER BY rowid;'),
    qualityTrend: queryJson('SELECT month, passRate, sampling, risk FROM quality_trends ORDER BY rowid;'),
    alerts: queryJson('SELECT id, region, level, alertType, suggestion, startsAt FROM weather_alerts ORDER BY startsAt LIMIT 3;'),
  };
}

export function findTraceBatch(traceCode: string) {
  const batches = queryJson<TraceBatch>(
    `SELECT id, traceCode, productName, category, specification, producer, origin, productionDate, shelfLife, status, blockchainHash, blockHeight, qualityResult FROM trace_batches WHERE traceCode = '${traceCode.replace(/'/g, "''")}' LIMIT 1;`,
  );
  const batch = batches[0];

  if (!batch) {
    return null;
  }

  return {
    batch,
    timeline: queryJson<TimelineItem>(
      `SELECT id, stage, operator, eventTime, location, description, temperature, humidity FROM timeline WHERE traceCode = '${traceCode.replace(/'/g, "''")}' ORDER BY eventTime;`,
    ),
  };
}

export function listTraceBatches() {
  return queryJson<TraceBatch>('SELECT id, traceCode, productName, category, specification, producer, origin, productionDate, shelfLife, status, blockchainHash, blockHeight, qualityResult FROM trace_batches ORDER BY productionDate DESC;');
}

export function listProducts(channel?: string) {
  const where = channel ? `WHERE channel = '${channel.replace(/'/g, "''")}'` : '';
  return queryJson<Product>(`SELECT id, name, category, price, wholesalePrice, moq, specification, traceCode, seller, origin, stock, sales, imageUrl, channel FROM products ${where} ORDER BY sales DESC;`);
}

export function listRows(table: 'orders' | 'contracts' | 'questions' | 'weather_alerts') {
  return queryJson(`SELECT * FROM ${table} ORDER BY rowid DESC;`);
}
