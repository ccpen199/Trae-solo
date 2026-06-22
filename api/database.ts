import { DatabaseSync } from 'node:sqlite'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'data.db')

const sqlite = new DatabaseSync(dbPath)

// Keep the rest of the code on the small better-sqlite3-style surface it already uses.
const db = {
  exec(sql: string) {
    sqlite.exec(sql)
  },
  prepare(sql: string) {
    const statement = sqlite.prepare(sql)

    return {
      all: (...args: any[]) => statement.all(...args),
      get: (...args: any[]) => statement.get(...args),
      iterate: (...args: any[]) => statement.iterate(...args),
      run: (...args: any[]) => statement.run(...args),
    }
  },
  transaction<TArgs extends unknown[], TResult>(callback: (...args: TArgs) => TResult) {
    return (...args: TArgs) => {
      sqlite.exec('BEGIN')

      try {
        const result = callback(...args)
        sqlite.exec('COMMIT')
        return result
      } catch (error) {
        try {
          sqlite.exec('ROLLBACK')
        } catch {
          // Ignore rollback failures so the original startup error is preserved.
        }

        throw error
      }
    }
  }
}

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    developer TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    totalUnits INTEGER NOT NULL DEFAULT 0,
    availableUnits INTEGER NOT NULL DEFAULT 0,
    avgPrice REAL NOT NULL DEFAULT 0,
    minPrice REAL NOT NULL DEFAULT 0,
    maxPrice REAL NOT NULL DEFAULT 0,
    areaMin REAL NOT NULL DEFAULT 0,
    areaMax REAL NOT NULL DEFAULT 0,
    deliveryDate TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    type TEXT NOT NULL,
    number TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    issueDate TEXT NOT NULL DEFAULT '',
    expireDate TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    month TEXT NOT NULL,
    avgPrice REAL NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    unitNumber TEXT NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    totalFloors INTEGER NOT NULL DEFAULT 1,
    area REAL NOT NULL DEFAULT 0,
    layout TEXT NOT NULL DEFAULT '',
    orientation TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    unitPrice REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS buyers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    idNumber TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL DEFAULT 0,
    deals INTEGER NOT NULL DEFAULT 0,
    avatar TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS viewings (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    buyerName TEXT NOT NULL DEFAULT '',
    buyerPhone TEXT NOT NULL DEFAULT '',
    scheduledAt TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id),
    FOREIGN KEY (agentId) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    submitterName TEXT NOT NULL DEFAULT '',
    submitterPhone TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    timeline TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS creator_contents (
    id TEXT PRIMARY KEY,
    authorId TEXT NOT NULL DEFAULT '',
    authorName TEXT NOT NULL DEFAULT '',
    buildingId TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'article',
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    likes INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feed_items (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL DEFAULT '',
    buildingId TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'price',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS lottery_participants (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    idNumber TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    sequenceNumber INTEGER,
    registeredAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS lottery_results (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    participantId TEXT NOT NULL,
    rank INTEGER NOT NULL DEFAULT 0,
    seed TEXT NOT NULL DEFAULT '',
    runAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id),
    FOREIGN KEY (participantId) REFERENCES lottery_participants(id)
  );
`)

const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get() as { count: number }

if (buildingCount.count === 0) {
  const buildings = [
    {
      id: uuidv4(), name: '翡翠滨江', developer: '上海翡翠置业有限公司', district: '浦东新区',
      address: '浦东新区陆家嘴环路1288号', lat: 31.2397, lng: 121.4998, status: 'selling',
      totalUnits: 320, availableUnits: 45, avgPrice: 128000, minPrice: 115000, maxPrice: 145000,
      areaMin: 89, areaMax: 168, deliveryDate: '2027-06-30',
      description: '翡翠滨江位于陆家嘴核心区域，坐拥黄浦江一线江景，由国际知名设计团队打造，配备高端会所、恒温泳池及私家花园，是陆家嘴稀缺的滨江豪宅项目。',
      tags: JSON.stringify(['江景房', '豪宅', '地铁房', '学区房']), images: JSON.stringify([])
    },
    {
      id: uuidv4(), name: '紫藤花园', developer: '上海紫藤地产集团', district: '徐汇区',
      address: '徐汇区漕溪北路388号', lat: 31.1886, lng: 121.4372, status: 'selling',
      totalUnits: 256, availableUnits: 78, avgPrice: 105000, minPrice: 95000, maxPrice: 118000,
      areaMin: 75, areaMax: 142, deliveryDate: '2027-03-31',
      description: '紫藤花园坐落于徐汇核心商圈，毗邻徐家汇公园，周边教育医疗配套齐全，户型方正通透，社区绿化率高达40%，是徐汇区品质改善首选。',
      tags: JSON.stringify(['学区房', '公园旁', '改善型']), images: JSON.stringify([])
    },
    {
      id: uuidv4(), name: '云顶天境', developer: '上海云顶房地产开发有限公司', district: '静安区',
      address: '静安区南京西路1266号', lat: 31.2294, lng: 121.4488, status: 'soon',
      totalUnits: 180, availableUnits: 180, avgPrice: 156000, minPrice: 142000, maxPrice: 178000,
      areaMin: 105, areaMax: 220, deliveryDate: '2028-01-31',
      description: '云顶天境位于南京西路核心地段，由顶级建筑大师操刀设计，配备私人电梯入户、智能家居系统，打造上海内环内极致居住体验。',
      tags: JSON.stringify(['豪宅', '内环内', '地铁房', '精装修']), images: JSON.stringify([])
    },
    {
      id: uuidv4(), name: '湖畔雅居', developer: '上海湖畔置业有限公司', district: '松江区',
      address: '松江区广富林路688号', lat: 31.0346, lng: 121.2245, status: 'selling',
      totalUnits: 480, availableUnits: 156, avgPrice: 48000, minPrice: 42000, maxPrice: 55000,
      areaMin: 88, areaMax: 135, deliveryDate: '2026-12-31',
      description: '湖畔雅居紧邻广富林文化遗址与松江大学城，临湖而建，环境优美，交通便捷直达市区，是松江新城高性价比品质楼盘。',
      tags: JSON.stringify(['湖景房', '大学城', '低密度']), images: JSON.stringify([])
    },
    {
      id: uuidv4(), name: '星河湾', developer: '上海星河湾地产开发有限公司', district: '闵行区',
      address: '闵行区顾戴路2688号', lat: 31.1289, lng: 121.3817, status: 'sold',
      totalUnits: 360, availableUnits: 0, avgPrice: 72000, minPrice: 65000, maxPrice: 82000,
      areaMin: 95, areaMax: 185, deliveryDate: '2026-06-30',
      description: '星河湾以园林式社区闻名，社区内拥有3万平米中央湖景园林、星级会所、国际学校，是闵行区标杆级品质社区，现已售罄。',
      tags: JSON.stringify(['园林社区', '品质楼盘', '配套完善']), images: JSON.stringify([])
    },
    {
      id: uuidv4(), name: '万科天空之城', developer: '上海万科企业有限公司', district: '浦东新区',
      address: '浦东新区秀沿路288号', lat: 31.1563, lng: 121.5742, status: 'selling',
      totalUnits: 520, availableUnits: 210, avgPrice: 65000, minPrice: 58000, maxPrice: 72000,
      areaMin: 78, areaMax: 125, deliveryDate: '2027-09-30',
      description: '万科天空之城是万科TOD综合体项目，集住宅、商业、办公于一体，地铁上盖直达11号线，周边配套成熟，是浦东新区热门刚需改善盘。',
      tags: JSON.stringify(['TOD综合体', '地铁上盖', '刚需改善']), images: JSON.stringify([])
    }
  ]

  const insertBuilding = db.prepare(`
    INSERT INTO buildings (id, name, developer, district, address, lat, lng, status, totalUnits, availableUnits, avgPrice, minPrice, maxPrice, areaMin, areaMax, deliveryDate, description, tags, images)
    VALUES (@id, @name, @developer, @district, @address, @lat, @lng, @status, @totalUnits, @availableUnits, @avgPrice, @minPrice, @maxPrice, @areaMin, @areaMax, @deliveryDate, @description, @tags, @images)
  `)

  const insertCertificate = db.prepare(`
    INSERT INTO certificates (id, buildingId, type, number, status, issueDate, expireDate)
    VALUES (@id, @buildingId, @type, @number, @status, @issueDate, @expireDate)
  `)

  const insertPriceHistory = db.prepare(`
    INSERT INTO price_history (id, buildingId, month, avgPrice, volume)
    VALUES (@id, @buildingId, @month, @avgPrice, @volume)
  `)

  const insertProperty = db.prepare(`
    INSERT INTO properties (id, buildingId, unitNumber, floor, totalFloors, area, layout, orientation, price, unitPrice, status)
    VALUES (@id, @buildingId, @unitNumber, @floor, @totalFloors, @area, @layout, @orientation, @price, @unitPrice, @status)
  `)

  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, phone, company, rating, deals, avatar)
    VALUES (@id, @name, @phone, @company, @rating, @deals, @avatar)
  `)

  const insertFeedItem = db.prepare(`
    INSERT INTO feed_items (id, buildingId, type, title, summary, source, createdAt)
    VALUES (@id, @buildingId, @type, @title, @summary, @source, @createdAt)
  `)

  const certTypes = ['建设用地规划许可证', '建设工程规划许可证', '建筑工程施工许可证', '商品房预售许可证', '不动产权证书']

  const months = ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']

  const layouts = ['一室一厅一卫', '两室一厅一卫', '两室两厅一卫', '三室一厅一卫', '三室两厅两卫', '四室两厅两卫']
  const orientations = ['南', '南北通透', '东南', '西南', '东', '西']

  const transaction = db.transaction(() => {
    for (const b of buildings) {
      insertBuilding.run(b)

      for (let ci = 0; ci < certTypes.length; ci++) {
        insertCertificate.run({
          id: uuidv4(),
          buildingId: b.id,
          type: certTypes[ci],
          number: `沪${['建', '规', '施', '预', '不'][ci]}${String(2025 + Math.floor(ci / 3))}第${String(1000 + ci * 137 + buildings.indexOf(b) * 99).padStart(6, '0')}号`,
          status: ci < 4 ? 'issued' : (b.status === 'sold' ? 'issued' : 'pending'),
          issueDate: ci < 4 ? `2025-0${ci + 1}-15` : '',
          expireDate: ci < 4 ? `2028-0${ci + 1}-15` : ''
        })
      }

      for (let mi = 0; mi < months.length; mi++) {
        const fluctuation = 1 + (Math.random() - 0.4) * 0.03
        const monthPrice = Math.round(b.avgPrice * fluctuation)
        insertPriceHistory.run({
          id: uuidv4(),
          buildingId: b.id,
          month: months[mi],
          avgPrice: monthPrice,
          volume: Math.floor(Math.random() * 30) + 5
        })
      }

      const floors = b.totalUnits > 400 ? 32 : (b.totalUnits > 300 ? 28 : 25)
      const unitsPerFloor = Math.ceil(b.totalUnits / floors)
      const layoutsForBuilding = layouts.slice(b.areaMin > 100 ? 2 : 0, b.areaMax > 150 ? 6 : 4)
      let unitIndex = 0
      for (let floor = 1; floor <= floors && unitIndex < b.totalUnits; floor++) {
        for (let unit = 1; unit <= unitsPerFloor && unitIndex < b.totalUnits; unit++) {
          const layoutIdx = Math.floor(Math.random() * layoutsForBuilding.length)
          const layout = layoutsForBuilding[layoutIdx]
          const areaRange = b.areaMax - b.areaMin
          const area = Math.round((b.areaMin + Math.random() * areaRange) * 100) / 100
          const orientation = orientations[Math.floor(Math.random() * orientations.length)]
          const priceFluctuation = b.avgPrice * (1 + (Math.random() - 0.5) * 0.1)
          const unitPrice = Math.round(priceFluctuation)
          const price = Math.round(unitPrice * area)
          const unitNumber = `${floor}${String(unit).padStart(2, '0')}`
          const isAvailable = unitIndex < b.availableUnits

          insertProperty.run({
            id: uuidv4(),
            buildingId: b.id,
            unitNumber,
            floor,
            totalFloors: floors,
            area,
            layout,
            orientation,
            price,
            unitPrice,
            status: isAvailable ? 'available' : 'sold'
          })
          unitIndex++
        }
      }
    }

    const agents = [
      { id: uuidv4(), name: '张明辉', phone: '13812345678', company: '链家地产', rating: 4.8, deals: 156, avatar: '' },
      { id: uuidv4(), name: '李晓燕', phone: '13923456789', company: '中原地产', rating: 4.6, deals: 98, avatar: '' },
      { id: uuidv4(), name: '王建国', phone: '13634567890', company: '太平洋房屋', rating: 4.9, deals: 203, avatar: '' },
      { id: uuidv4(), name: '陈思雨', phone: '13745678901', company: '我爱我家', rating: 4.7, deals: 132, avatar: '' },
      { id: uuidv4(), name: '刘佳慧', phone: '13556789012', company: '贝壳找房', rating: 4.5, deals: 87, avatar: '' }
    ]

    for (const a of agents) {
      insertAgent.run(a)
    }

    const feedData = [
      { type: 'policy', title: '上海楼市新政：非沪籍购房社保年限缩短', summary: '上海市发布最新楼市调控政策，非沪籍家庭购房社保年限从5年缩短至3年，利好刚需购房者。', source: '上海市住建局' },
      { type: 'market', title: '5月上海新房成交量环比上涨15%', summary: '据上海链家研究院数据，5月全市新建商品住宅成交面积环比上涨15%，浦东、闵行成交量领先。', source: '链家研究院' },
      { type: 'notice', title: '翡翠滨江三期即将开盘', summary: '翡翠滨江三期8号楼预计6月底开盘，共计64套房源，主力户型89-142平两至三房。', source: '翡翠置业官方' },
      { type: 'policy', title: '央行下调LPR利率10个基点', summary: '央行最新公布5年期以上LPR下调至3.45%，房贷利率进一步走低，购房成本持续降低。', source: '中国人民银行' },
      { type: 'market', title: '上海二手房挂牌量突破20万套', summary: '截至6月初，上海二手房挂牌量已突破20万套，市场供给充裕，买方议价空间增大。', source: '中原地产研究' },
      { type: 'notice', title: '万科天空之城加推9号楼', summary: '万科天空之城9号楼本周末加推，共计48套78-105平房源，均价6.5万/平起。', source: '万科官方' },
      { type: 'policy', title: '上海公积金贷款额度上调', summary: '上海住房公积金管理中心宣布，个人公积金贷款最高额度从50万元提高至60万元，家庭最高100万元。', source: '上海公积金中心' },
      { type: 'market', title: '松江新城房价走势分析', summary: '松江新城6月新房均价4.8万/平，环比持平，成交量稳中有升，广富林板块关注度最高。', source: '安居客' }
    ]

    for (const feed of feedData) {
      const buildingId = buildings[Math.floor(Math.random() * buildings.length)].id
      insertFeedItem.run({
        id: uuidv4(),
        buildingId,
        type: feed.type,
        title: feed.title,
        summary: feed.summary,
        source: feed.source,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString()
      })
    }
  })

  transaction()
}

const creatorContentCount = db.prepare('SELECT COUNT(*) as count FROM creator_contents').get() as { count: number }
const complaintCount = db.prepare('SELECT COUNT(*) as count FROM complaints').get() as { count: number }

if (creatorContentCount.count === 0 || complaintCount.count === 0) {
  const buildings = db.prepare(`
    SELECT id, name, district
    FROM buildings
    ORDER BY avgPrice DESC, createdAt ASC
    LIMIT 6
  `).all() as { id: string; name: string; district: string }[]

  const insertCreatorContent = db.prepare(`
    INSERT INTO creator_contents (id, authorId, authorName, buildingId, type, title, content, images, likes, views, createdAt)
    VALUES (@id, @authorId, @authorName, @buildingId, @type, @title, @content, @images, @likes, @views, @createdAt)
  `)

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, buildingId, submitterName, submitterPhone, category, title, content, status, timeline, createdAt, updatedAt)
    VALUES (@id, @buildingId, @submitterName, @submitterPhone, @category, @title, @content, @status, @timeline, @createdAt, @updatedAt)
  `)

  const demoCreatorId = 'creator-demo'
  const demoCreatorName = '居易内容组'

  const seedTransaction = db.transaction(() => {
    if (creatorContentCount.count === 0 && buildings.length > 0) {
      const contentSeeds = [
        {
          buildingId: buildings[0]?.id || '',
          title: `${buildings[0]?.name || '核心楼盘'}踩盘手记`,
          content: '样板间动线、得房率与周边配套表现稳定，适合改善型家庭重点关注。',
          likes: 168,
          views: 2480,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          buildingId: buildings[1]?.id || buildings[0]?.id || '',
          title: `${buildings[1]?.name || '热门板块'}价格对比`,
          content: '从近三个月备案价、总价门槛和首付压力做了横向梳理，核心差异集中在地段和交付标准。',
          likes: 126,
          views: 1960,
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          buildingId: buildings[2]?.id || buildings[0]?.id || '',
          title: '本周购房政策速览',
          content: '利率、公积金额度和认房标准出现边际优化，对首套置业更友好。',
          likes: 212,
          views: 3120,
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ]

      for (const item of contentSeeds) {
        insertCreatorContent.run({
          id: uuidv4(),
          authorId: demoCreatorId,
          authorName: demoCreatorName,
          buildingId: item.buildingId,
          type: 'article',
          title: item.title,
          content: item.content,
          images: JSON.stringify([]),
          likes: item.likes,
          views: item.views,
          createdAt: item.createdAt,
        })
      }
    }

    if (complaintCount.count === 0 && buildings.length > 0) {
      const complaintSeeds = [
        {
          buildingId: buildings[0]?.id || '',
          submitterName: '陈女士',
          submitterPhone: '13800001111',
          category: '虚假宣传',
          title: `${buildings[0]?.name || '项目'}宣传口径与现场信息不一致`,
          content: '销售口径中的车位配比与现场公示存在差异，希望尽快给出正式说明。',
          status: 'accepted',
          timeline: [
            { status: 'pending', time: new Date(Date.now() - 3 * 86400000).toISOString(), action: '提交投诉', operator: '陈女士' },
            { status: 'accepted', time: new Date(Date.now() - 2 * 86400000).toISOString(), action: '投诉受理', operator: '客服专员' },
          ],
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          buildingId: buildings[1]?.id || buildings[0]?.id || '',
          submitterName: '王先生',
          submitterPhone: '13900002222',
          category: '延期交付',
          title: `${buildings[1]?.name || '项目'}交付节点咨询`,
          content: '项目最新交付节点是否发生变化，业主群需要统一说明并同步书面通知。',
          status: 'processing',
          timeline: [
            { status: 'pending', time: new Date(Date.now() - 6 * 86400000).toISOString(), action: '提交投诉', operator: '王先生' },
            { status: 'accepted', time: new Date(Date.now() - 5 * 86400000).toISOString(), action: '投诉受理', operator: '客服专员' },
            { status: 'processing', time: new Date(Date.now() - 4 * 86400000).toISOString(), action: '受理处理', operator: '项目运营' },
          ],
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          buildingId: buildings[2]?.id || buildings[0]?.id || '',
          submitterName: '李先生',
          submitterPhone: '13700003333',
          category: '质量问题',
          title: `${buildings[2]?.name || '项目'}样板间用材咨询已结案`,
          content: '针对样板间与合同附表的材料品牌差异，开发商已完成复核并给出书面说明。',
          status: 'resolved',
          timeline: [
            { status: 'pending', time: new Date(Date.now() - 10 * 86400000).toISOString(), action: '提交投诉', operator: '李先生' },
            { status: 'accepted', time: new Date(Date.now() - 9 * 86400000).toISOString(), action: '投诉受理', operator: '客服专员' },
            { status: 'processing', time: new Date(Date.now() - 8 * 86400000).toISOString(), action: '受理处理', operator: '法务联络人' },
            { status: 'resolved', time: new Date(Date.now() - 7 * 86400000).toISOString(), action: '处理完成', operator: '开发商客服' },
          ],
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ]

      for (const item of complaintSeeds) {
        insertComplaint.run({
          id: uuidv4(),
          buildingId: item.buildingId,
          submitterName: item.submitterName,
          submitterPhone: item.submitterPhone,
          category: item.category,
          title: item.title,
          content: item.content,
          status: item.status,
          timeline: JSON.stringify(item.timeline),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })
      }
    }
  })

  seedTransaction()
}

export default db
