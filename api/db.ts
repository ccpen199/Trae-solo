import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data.db')

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name_zh TEXT NOT NULL,
      name_it TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title_zh TEXT NOT NULL,
      title_it TEXT NOT NULL,
      category TEXT NOT NULL,
      stage TEXT NOT NULL,
      partners_json TEXT,
      contact_person TEXT,
      contact_email TEXT,
      description_zh TEXT,
      description_it TEXT,
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      name_it TEXT NOT NULL,
      url TEXT NOT NULL,
      file_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      title_zh TEXT NOT NULL,
      title_it TEXT NOT NULL,
      summary_zh TEXT,
      summary_it TEXT,
      source TEXT NOT NULL,
      source_logo TEXT,
      tags_json TEXT,
      published_at DATETIME,
      image_url TEXT,
      original_url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS translation_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      source_text TEXT NOT NULL,
      source_lang TEXT NOT NULL,
      translated_text TEXT,
      target_lang TEXT NOT NULL,
      domain TEXT DEFAULT 'general',
      terminology_json TEXT,
      confidence REAL,
      needs_human_review INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content_reviews (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      submitted_by TEXT,
      sensitive_words_json TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer TEXT,
      review_notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (submitted_by) REFERENCES users(id),
      FOREIGN KEY (reviewer) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, target_type, target_id)
    );
  `)
}

const seedMockData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name_zh, name_it, role) VALUES (?, ?, ?, ?, ?)
  `)
  insertUser.run('admin_001', 'admin@cnit-platform.org', '系统管理员', 'Amministratore', 'admin')
  insertUser.run('trans_001', 'translator@cnit-platform.org', '张译员', 'Traduttore Zhang', 'translator')
  insertUser.run('user_001', 'user@example.com', '普通用户', 'Utente', 'user')

  const insertProject = db.prepare(`
    INSERT INTO projects (id, title_zh, title_it, category, stage, partners_json, contact_person, contact_email, description_zh, description_it, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertProject.run(
    'proj_001',
    '中意智能制造联合实验室',
    'Laboratorio Congiunto di Manifattura Intelligente Cina-Italia',
    'technology',
    'implementation',
    JSON.stringify([
      { nameZh: '清华大学', nameIt: 'Università Tsinghua', type: '学术机构' },
      { nameZh: '米兰理工大学', nameIt: 'Politecnico di Milano', type: '学术机构' },
    ]),
    '王教授',
    'wang@tsinghua.edu.cn',
    '聚焦先进制造领域的联合研发，涵盖工业机器人、智能传感器、数字孪生等关键技术方向。',
    'Focus sulla ricerca congiunta nel settore della manifattura avanzata, che copre aree tecnologiche chiave come robot industriali, sensori intelligenti e gemelli digitali.',
    65,
  )
  insertProject.run(
    'proj_002',
    '丝绸之路文化旅游年',
    'Anno del Turismo Culturale della Via della Seta',
    'tourism',
    'negotiation',
    JSON.stringify([
      { nameZh: '中国文化和旅游部', nameIt: 'Ministero della Cultura e del Turismo Cinese', type: '政府机构' },
    ]),
    '李主任',
    'li@tourism.gov.cn',
    '推动两国文化旅游深度合作，策划联合展览、文艺巡演和主题旅游线路。',
    'Promuovere la cooperazione approfondita nel turismo culturale tra i due paesi, pianificando mostre congiunte, tour artistici e itinerari turistici tematici.',
    30,
  )
  insertProject.run(
    'proj_003',
    '中意绿色能源合作项目',
    'Progetto di Cooperazione sull\'Energia Verde Cina-Italia',
    'economic',
    'planning',
    JSON.stringify([
      { nameZh: '国家能源集团', nameIt: 'Gruppo Energetico Nazionale', type: '企业' },
      { nameZh: '埃尼集团', nameIt: 'Eni', type: '企业' },
    ]),
    '陈经理',
    'chen@energy.cn',
    '在可再生能源、碳捕集利用与封存等领域开展务实合作。',
    'Cooperazione pratica nei settori delle energie rinnovabili, della cattura, utilizzo e stoccaggio del carbonio.',
    15,
  )
  insertProject.run(
    'proj_004',
    '孔子学院意大利推广计划',
    'Programma di Promozione degli Istituti Confucius in Italia',
    'education',
    'completed',
    JSON.stringify([
      { nameZh: '国家汉办', nameIt: 'Hanban', type: '政府机构' },
      { nameZh: '罗马大学', nameIt: 'Sapienza Università di Roma', type: '学术机构' },
    ]),
    '赵老师',
    'zhao@hanban.edu.cn',
    '已在意大利设立 12 所孔子学院和 37 个孔子课堂。',
    'Sono stati istituiti 12 Istituti Confucius e 37 Classi Confucius in Italia.',
    100,
  )

  const insertAttachment = db.prepare(`
    INSERT INTO attachments (id, project_id, name_zh, name_it, url, file_type) VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertAttachment.run(
    'att_001',
    'proj_001',
    '项目合作协议.pdf',
    'Accordo di cooperazione.pdf',
    '/attachments/proj_001_agreement.pdf',
    'pdf',
  )
  insertAttachment.run(
    'att_002',
    'proj_001',
    '技术路线图.docx',
    'Roadmap tecnologica.docx',
    '/attachments/proj_001_roadmap.docx',
    'docx',
  )
  insertAttachment.run(
    'att_003',
    'proj_002',
    '活动策划方案.pdf',
    'Piano dell\'evento.pdf',
    '/attachments/proj_002_plan.pdf',
    'pdf',
  )

  const insertNews = db.prepare(`
    INSERT INTO news_items (id, title_zh, title_it, summary_zh, summary_it, source, source_logo, tags_json, published_at, image_url, original_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertNews.run(
    'news_001',
    '中意两国签署经贸合作新协议',
    'Cina e Italia firmano un nuovo accordo di cooperazione economica',
    '双方就贸易、投资、中小企业等领域达成多项共识，将进一步深化双边经贸关系。',
    'Le due parti hanno raggiunto molti consensi su commercio, investimenti, PMI e altri settori, per approfondire ulteriormente le relazioni economiche e commerciali bilaterali.',
    '新华视点',
    '/logos/xinhua.png',
    JSON.stringify(['经贸', '合作协议']),
    '2026-06-20T10:00:00Z',
    '/images/news_001.jpg',
    'https://example.com/news/1',
  )
  insertNews.run(
    'news_002',
    '意大利高校扩大对华招生计划',
    'Le università italiane ampliano i programmi di ammissione per studenti cinesi',
    '多所意大利顶尖高校宣布增加中国留学生名额，并推出专项奖学金。',
    'Molte università italiane top annunciano l\'aumento dei posti per studenti cinesi e l\'introduzione di borse di studio speciali.',
    '安莎社',
    '/logos/ansa.png',
    JSON.stringify(['教育', '留学']),
    '2026-06-19T15:30:00Z',
    '/images/news_002.jpg',
    'https://example.com/news/2',
  )
  insertNews.run(
    'news_003',
    '米兰设计周聚焦中国创意力量',
    'La Milano Design Week si concentra sulla forza creativa cinese',
    '中国设计师在米兰设计周上展示了融合传统与现代的创新作品。',
    'I designer cinesi hanno mostrato opere innovative che fondono tradizione e modernità alla Milano Design Week.',
    '意大利晚邮报',
    '/logos/corriere.png',
    JSON.stringify(['文化', '设计', '创意']),
    '2026-06-18T09:00:00Z',
    '/images/news_003.jpg',
    'https://example.com/news/3',
  )
  insertNews.run(
    'news_004',
    '中意航天合作取得新突破',
    'Nuova svolta nella cooperazione spaziale Cina-Italia',
    '两国联合研制的科学卫星成功发射，将开展空间物理研究。',
    'Il satellite scientifico sviluppato congiuntamente dai due paesi è stato lanciato con successo per condurre ricerche di fisica spaziale.',
    '人民日报',
    '/logos/people.png',
    JSON.stringify(['科技', '航天', '合作']),
    '2026-06-17T14:00:00Z',
    '/images/news_004.jpg',
    'https://example.com/news/4',
  )
  insertNews.run(
    'news_005',
    '意大利葡萄酒出口中国大幅增长',
    'Le esportazioni di vino italiano in Cina crescono notevolmente',
    '今年第一季度意大利葡萄酒对华出口额同比增长 35%。',
    'Nel primo trimestre di quest\'anno, le esportazioni di vino italiano in Cina sono aumentate del 35% rispetto allo stesso periodo dello scorso anno.',
    '意中商会',
    '/logos/camera.png',
    JSON.stringify(['经贸', '农业', '食品']),
    '2026-06-16T11:20:00Z',
    '/images/news_005.jpg',
    'https://example.com/news/5',
  )

  const insertReview = db.prepare(`
    INSERT INTO content_reviews (id, content_type, content_id, submitted_by, sensitive_words_json, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertReview.run(
    'review_001',
    'news',
    'news_006',
    'user_001',
    JSON.stringify([{ word: '敏感词示例', position: 42 }]),
    'pending',
  )
  insertReview.run(
    'review_002',
    'translation',
    'trans_001',
    'user_001',
    JSON.stringify([]),
    'pending',
  )
  insertReview.run(
    'review_003',
    'project',
    'proj_005',
    'user_001',
    JSON.stringify([]),
    'approved',
  )

  const insertTranslation = db.prepare(`
    INSERT INTO translation_history (id, user_id, source_text, source_lang, translated_text, target_lang, domain, terminology_json, confidence, needs_human_review)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertTranslation.run(
    'trans_001',
    'user_001',
    '中意友好合作关系源远流长。',
    'zh',
    'Le relazioni di amicizia e cooperazione tra Cina e Italia hanno una lunga storia.',
    'it',
    'diplomatic',
    JSON.stringify([
      { term: '中意', translation: 'Cina-Italia', confidence: 0.98 },
      { term: '源远流长', translation: 'avere una lunga storia', confidence: 0.92 },
    ]),
    0.94,
    0,
  )
}

createTables()
seedMockData()

export default db
