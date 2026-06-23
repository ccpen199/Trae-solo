import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole, StageHistoryRecord, PolishWorkflowRecord, TranslationHistoryItem } from '@/types'

type Lang = 'zh' | 'it'

interface MockUserAccount {
  email: string
  password: string
  user: Omit<User, 'id'>
}

const mockAccounts: MockUserAccount[] = [
  {
    email: 'gov@china-italy.cn',
    password: 'gov123456',
    user: {
      email: 'gov@china-italy.cn',
      nameZh: '中意经贸合作司',
      nameIt: 'Ufficio Cooperazione Economica',
      role: 'government',
      organizationZh: '中华人民共和国商务部',
      organizationIt: 'Ministero del Commercio PRC',
      verifiedAt: '2025-03-15T09:00:00Z',
    },
  },
  {
    email: 'ambasciata@italia.cn',
    password: 'emb123456',
    user: {
      email: 'ambasciata@italia.cn',
      nameZh: '意大利驻华大使馆文化处',
      nameIt: 'Ufficio Culturale Ambasciata d\'Italia',
      role: 'government',
      organizationZh: '意大利共和国驻华大使馆',
      organizationIt: 'Ambasciata d\'Italia in Cina',
      verifiedAt: '2025-02-20T10:30:00Z',
    },
  },
  {
    email: 'culture@musei.it',
    password: 'cul123456',
    user: {
      email: 'culture@musei.it',
      nameZh: '佛罗伦萨美术馆文化交流中心',
      nameIt: 'Centro Scambi Culturali Gallerie Firenze',
      role: 'culture',
      organizationZh: '意大利文化遗产与活动部',
      organizationIt: 'Ministero dei Beni Culturali',
      verifiedAt: '2025-04-10T14:00:00Z',
    },
  },
  {
    email: 'confucius@univ.it',
    password: 'cul654321',
    user: {
      email: 'confucius@univ.it',
      nameZh: '博洛尼亚大学孔子学院',
      nameIt: 'Istituto Confucio Università di Bologna',
      role: 'culture',
      organizationZh: '博洛尼亚大学',
      organizationIt: 'Università di Bologna',
      verifiedAt: '2025-05-01T11:20:00Z',
    },
  },
  {
    email: 'marco.rossi@email.it',
    password: 'pub123456',
    user: {
      email: 'marco.rossi@email.it',
      nameZh: '马可·罗西',
      nameIt: 'Marco Rossi',
      role: 'public',
      phone: '+39 333 1234567',
    },
  },
  {
    email: 'lihua@travel.cn',
    password: 'pub654321',
    user: {
      email: 'lihua@travel.cn',
      nameZh: '李华',
      nameIt: 'Li Hua',
      role: 'public',
      phone: '+86 138 0000 1234',
    },
  },
  {
    email: 'translator@cnit.org',
    password: 'tra123456',
    user: {
      email: 'translator@cnit.org',
      nameZh: '李雯（高级译员）',
      nameIt: 'Li Wen - Traduttrice Senior',
      role: 'translator',
      organizationZh: '中意翻译协会',
      organizationIt: 'Associazione Traduttori Cina-Italia',
      verifiedAt: '2025-01-10T08:45:00Z',
    },
  },
  {
    email: 'reviewer@cnit.org',
    password: 'rev123456',
    user: {
      email: 'reviewer@cnit.org',
      nameZh: '王建国（内容审核主管）',
      nameIt: 'Wang Jianguo - Responsabile Contenuti',
      role: 'reviewer',
      organizationZh: '中意桥内容审核中心',
      organizationIt: 'Centro Revisione Contenuti Ponte Cina-Italia',
      verifiedAt: '2025-01-05T09:00:00Z',
    },
  },
  {
    email: 'admin@china-italy.com',
    password: 'admin123',
    user: {
      email: 'admin@china-italy.com',
      nameZh: '系统管理员',
      nameIt: 'Amministratore di Sistema',
      role: 'admin',
      organizationZh: '中意桥运营团队',
      organizationIt: 'Team Operativo Ponte Cina-Italia',
      verifiedAt: '2025-01-01T00:00:00Z',
    },
  },
]

const defaultTranslateHistory: TranslationHistoryItem[] = [
  {
    id: 'th-real-001',
    sourceText: '根据《中意经贸合作协定》第三条，双方互予最惠国待遇，保障投资准入与公平竞争。本条款自签署之日起生效。',
    targetText: 'In base all\'Articolo 3 dell\'Accordo di Cooperazione Economica Cina-Italia, le parti si concedono reciprocamente il trattamento di nazione più favorita, garantendo l\'accesso agli investimenti e la concorrenza leale. La presente clausola entra in vigore dalla data della firma.',
    source: 'zh',
    target: 'it',
    scene: 'legal',
    timestamp: '2026-06-21 09:15',
    userId: 'user-gov-001',
  },
  {
    id: 'th-real-002',
    sourceText: 'Il Ministero degli Affari Esteri ha convocato l\'ambasciatore cinese per un colloquio urgente sulle questioni consolari relative ai visti per affari.',
    targetText: '外交部长已就商务签证相关领事事务紧急约见中国大使。双方就简化签证流程、扩大多次入境签证发放范围等议题深入交换意见。',
    source: 'it',
    target: 'zh',
    scene: 'visa',
    timestamp: '2026-06-20 16:42',
    userId: 'user-gov-001',
  },
  {
    id: 'th-real-003',
    sourceText: '本次画展将展出来自两国当代艺术家的68幅作品，涵盖油画、水彩、数字艺术等多种表现形式。开幕酒会将于周五18时在798艺术区举行。',
    targetText: 'Questa mostra presenterà 68 opere di artisti contemporanei dei due paesi, coprendo varie forme espressive tra cui pittura a olio, acquerello e arte digitale. Il cocktail di inaugurazione si terrà venerdì alle 18:00 nel distretto artistico 798.',
    source: 'zh',
    target: 'it',
    scene: 'general',
    timestamp: '2026-06-20 14:08',
    userId: 'user-cul-001',
  },
  {
    id: 'th-real-004',
    sourceText: 'Il paziente presenta sintomi di ipertensione arteriosa essenziale di grado II con comorbidità diabetica. Si raccomanda controllo pressorio quotidiano e terapia antipertensiva combinata.',
    targetText: '患者表现为原发性高血压2级合并糖尿病。建议每日监测血压并采用联合降压疗法，同时配合饮食控制与规律运动。',
    source: 'it',
    target: 'zh',
    scene: 'medical',
    timestamp: '2026-06-20 10:25',
    userId: 'user-pub-001',
  },
  {
    id: 'th-real-005',
    sourceText: '我们诚挚邀请贵机构参加将于2026年10月在上海举办的第五届中意高等教育合作论坛，主题为"面向未来的人才联合培养"。',
    targetText: 'Invitiamo cordialmente la vostra istituzione a partecipare al V Forum di Cooperazione dell\'Istruzione Superiore Cina-Italia che si terrà a Shanghai nell\'ottobre 2026, con il tema "Formazione congiunta di talenti per il futuro".',
    source: 'zh',
    target: 'it',
    scene: 'general',
    timestamp: '2026-06-19 15:30',
    userId: 'user-cul-001',
  },
]

const defaultPolishRecords: PolishWorkflowRecord[] = [
  {
    id: 'pw-001',
    ticketId: 'PL-20260621A-9X3K',
    sourceText: '中意两国政府一致同意深化战略伙伴关系，在经贸、文化等领域开展务实合作。双方将推动签署新的双边协议。',
    translatedText: 'I governi dei due paesi hanno concordato all\'unanimità di approfondire la partnership strategica e svolgere cooperazione pragmatica nei settori economici, culturali e altri. Le parti promuoveranno la firma di un nuovo accordo bilaterale.',
    polishedText: 'I governi di Cina e Italia hanno concordato all\'unanimità di approfondire la partnership strategica globale, avviando una cooperazione pragmatica nei settori economico-commerciale, culturale e in altri ambiti di reciproco interesse. Le parti si adopereranno per la sottoscrizione di un nuovo accordo bilaterale quadro.',
    docType: 'policy',
    urgency: 'urgent',
    requirement: '使用外交官方语体，确保术语准确，符合外交部发布标准。特别注意"战略伙伴关系"的官方译法。',
    submitter: '中意经贸合作司',
    submitTime: '2026-06-21 08:30',
    reviewer: '李雯（高级译员）',
    reviewTime: '2026-06-21 10:45',
    reviewComment: '术语一致性：全部通过。"战略伙伴关系"按官方标准译为 partnership strategica globale；"务实合作"改为 avviare una cooperazione pragmatica 更符合外交惯例；新增 ambiti di reciproco interesse 使语义更完整。总体调整11处，建议采用。',
    status: 'completed',
    termScore: 94,
    inconsistentTerms: [],
  },
  {
    id: 'pw-002',
    ticketId: 'PL-20260620B-7M2P',
    sourceText: '米兰国际家具展将于下月开幕，中国品牌参展数量创历史新高。本届展会将特别设立"中国设计日"主题活动。',
    translatedText: 'Il Salone del Mobile di Milano aprirà il mese prossimo, con un numero record di marchi cinesi partecipanti. Quest\'edizione istituirà in particolare l\'evento a tema "Giorno del Design Cinese".',
    polishedText: 'Il Salone Internazionale del Mobile di Milano vedrà la sua inaugurazione il prossimo mese, con una partecipazione storica di marchi cinesi che stabilisce un nuovo record. L\'edizione 2026 dedicherà una sezione speciale all\'evento a tema "Giornata del Design Cinese" con talks, mostre e incontri B2B.',
    docType: 'press',
    urgency: 'normal',
    requirement: '新闻稿风格，适合文化机构公众号发布。增强可读性，加入吸引读者的描述。',
    submitter: '佛罗伦萨美术馆文化交流中心',
    submitTime: '2026-06-20 13:15',
    reviewer: '李雯（高级译员）',
    reviewTime: '2026-06-20 16:20',
    reviewComment: '语体润色：米兰家具展官方名称为 Salone Internazionale del Mobile di Milano，已校正。增加 vedrà la sua inaugurazione 更具新闻性。"创历史新高"扩展为 stabilisce un nuovo record 搭配 partecipazione storica 更自然。补充媒体发布常用结尾信息。',
    status: 'completed',
    termScore: 88,
    inconsistentTerms: ['米兰国际家具展'],
  },
  {
    id: 'pw-003',
    ticketId: 'PL-20260619C-4J8N',
    sourceText: '2026年中意文化交流年开幕式暨文艺晚会邀请函。诚挚邀请阁下拨冗出席，共襄盛举。',
    translatedText: 'Invito alla cerimonia di apertura dell\'Anno degli Scambi Culturali Cina-Italia 2026 e allo spettacolo serale. Invitiamo sinceramente Vostra Signoria a partecipare.',
    docType: 'event',
    urgency: 'normal',
    requirement: '正式邀请函格式，使用意大利正式礼仪语体。',
    submitter: '博洛尼亚大学孔子学院',
    submitTime: '2026-06-19 11:00',
    status: 'reviewing',
    termScore: 91,
    inconsistentTerms: [],
  },
]

const defaultStageHistory: StageHistoryRecord[] = [
  {
    id: 'sh-p001-1',
    projectId: 'p001',
    fromStage: null,
    toStage: 'planning',
    operator: '意大利经济发展部',
    remark: '项目立项，完成可行性研究报告，提交合作意向书。附件：可行性研究报告V1.2.pdf',
    timestamp: '2025-12-15 09:30',
  },
  {
    id: 'sh-p001-2',
    projectId: 'p001',
    fromStage: 'planning',
    toStage: 'negotiation',
    operator: '中意经贸合作司',
    remark: '双方完成三轮磋商，就合资比例、技术转让条款达成初步共识。附件：会谈纪要三轮.pdf',
    timestamp: '2026-03-02 14:00',
  },
  {
    id: 'sh-p001-3',
    projectId: 'p001',
    fromStage: 'negotiation',
    toStage: 'implementation',
    operator: '系统管理员',
    remark: '框架协议正式签署，资金首期到位，启动联合研发中心建设。附件：签字版协议.pdf、资金到位证明.pdf',
    timestamp: '2026-05-20 10:30',
  },
  {
    id: 'sh-p002-1',
    projectId: 'p002',
    fromStage: null,
    toStage: 'planning',
    operator: '清华大学国际处',
    remark: '两校签署合作谅解备忘录，启动联合培养方案论证。',
    timestamp: '2025-09-10 11:20',
  },
  {
    id: 'sh-p002-2',
    projectId: 'p002',
    fromStage: 'planning',
    toStage: 'negotiation',
    operator: '米兰理工国际招生办',
    remark: '就学分互认、导师互聘、学位授予等细节进行第二轮谈判。',
    timestamp: '2025-12-05 16:45',
  },
  {
    id: 'sh-p002-3',
    projectId: 'p002',
    fromStage: 'negotiation',
    toStage: 'implementation',
    operator: '中意经贸合作司（见证）',
    remark: '联合博士培养协议正式签署，首批10名博士生2026年9月入学。附件：联合培养协议签署版.pdf、首批学生名单.pdf',
    timestamp: '2026-04-18 09:00',
  },
  {
    id: 'sh-p003-1',
    projectId: 'p003',
    fromStage: null,
    toStage: 'planning',
    operator: '威尼斯市政府旅游局',
    remark: '提交"丝绸之路"主题旅游线路策划案。',
    timestamp: '2025-11-20 15:00',
  },
  {
    id: 'sh-p003-2',
    projectId: 'p003',
    fromStage: 'planning',
    toStage: 'negotiation',
    operator: '携程集团目的地营销部',
    remark: '就中国市场定价策略、分销渠道、联合推广方案达成一致。',
    timestamp: '2026-02-10 10:00',
  },
  {
    id: 'sh-p003-3',
    projectId: 'p003',
    fromStage: 'negotiation',
    toStage: 'implementation',
    operator: '佛罗伦萨美术馆（见证）',
    remark: '独家线路产品上线，首批300个名额开售即售罄。',
    timestamp: '2026-05-01 00:00',
  },
]

interface AppState {
  lang: Lang
  toggleLang: () => void
  setLang: (lang: Lang) => void

  user: User | null
  loginError: string | null
  isLoginModalOpen: boolean
  setLoginModalOpen: (open: boolean) => void
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message: string }>
  logout: () => void
  setUser: (user: User | null) => void

  favorites: string[]
  toggleFavorite: (targetId: string) => void

  translateHistory: TranslationHistoryItem[]
  addTranslateHistory: (item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => void
  clearTranslateHistory: () => void

  polishRecords: PolishWorkflowRecord[]
  addPolishRecord: (record: Omit<PolishWorkflowRecord, 'id' | 'status' | 'submitTime'>) => void
  updatePolishRecord: (id: string, updates: Partial<PolishWorkflowRecord>) => void

  stageHistory: StageHistoryRecord[]
  addStageHistory: (record: Omit<StageHistoryRecord, 'id' | 'timestamp'>) => void

  subscription: {
    newsletterFreq: 'daily' | 'weekly' | 'off'
    topics: string[]
    notifyMethod: 'inapp' | 'email' | 'both'
    channels: { email: boolean; wechat: boolean; telegram: boolean; push: boolean }
    emailAddress?: string
  }
  updateSubscription: (updates: Partial<AppState['subscription']>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'zh',
      toggleLang: () => set({ lang: get().lang === 'zh' ? 'it' : 'zh' }),
      setLang: (lang) => set({ lang }),

      user: null,
      loginError: null,
      isLoginModalOpen: false,
      setLoginModalOpen: (open) => set({ isLoginModalOpen: open, loginError: null }),
      login: async (email, password, role) => {
        await new Promise((r) => setTimeout(r, 600))
        const account = mockAccounts.find((a) => a.email === email && a.password === password && a.user.role === role)
        if (!account) {
          const anyRoleMatch = mockAccounts.find((a) => a.email === email && a.password === password)
          if (anyRoleMatch) {
            set({ loginError: '所选角色与账号不匹配，请核对角色类型' })
            return { success: false, message: '所选角色与账号不匹配，请核对角色类型' }
          }
          set({ loginError: '邮箱或密码错误，请重试（可使用预设测试账号）' })
          return { success: false, message: '邮箱或密码错误' }
        }
        const user: User = { ...account.user, id: `user-${role}-${Date.now()}` }
        set({ user, isLoginModalOpen: false, loginError: null })
        return { success: true, message: '登录成功' }
      },
      logout: () => set({ user: null }),
      setUser: (user) => set({ user }),

      favorites: [],
      toggleFavorite: (targetId) => {
        const { favorites } = get()
        const exists = favorites.includes(targetId)
        set({
          favorites: exists ? favorites.filter((id) => id !== targetId) : [...favorites, targetId],
        })
      },

      translateHistory: defaultTranslateHistory,
      addTranslateHistory: (item) => {
        const newItem: TranslationHistoryItem = {
          ...item,
          id: `th-${Date.now()}`,
          timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
        }
        set({ translateHistory: [newItem, ...get().translateHistory].slice(0, 50) })
      },
      clearTranslateHistory: () => set({ translateHistory: [] }),

      polishRecords: defaultPolishRecords,
      addPolishRecord: (record) => {
        const newRecord: PolishWorkflowRecord = {
          ...record,
          id: `pw-${Date.now()}`,
          status: 'submitted',
          submitTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
        }
        set({ polishRecords: [newRecord, ...get().polishRecords] })
      },
      updatePolishRecord: (id, updates) => {
        set({ polishRecords: get().polishRecords.map((r) => (r.id === id ? { ...r, ...updates } : r)) })
      },

      stageHistory: defaultStageHistory,
      addStageHistory: (record) => {
        const newRecord: StageHistoryRecord = {
          ...record,
          id: `sh-${Date.now()}`,
          timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
        }
        set({ stageHistory: [newRecord, ...get().stageHistory] })
      },

      subscription: {
        newsletterFreq: 'weekly',
        topics: ['economic', 'technology'],
        notifyMethod: 'both',
        channels: { email: true, wechat: true, telegram: false, push: true },
        emailAddress: undefined,
      },
      updateSubscription: (updates) => {
        set({ subscription: { ...get().subscription, ...updates } })
      },
    }),
    {
      name: 'cnit-app-storage-v2',
      partialize: (state) => ({
        user: state.user,
        lang: state.lang,
        favorites: state.favorites,
        translateHistory: state.translateHistory,
        polishRecords: state.polishRecords,
        stageHistory: state.stageHistory,
        subscription: state.subscription,
      }),
    },
  ),
)

export const ROLE_LABELS: Record<UserRole, { zh: string; it: string; descZh: string; descIt: string; dashboardRoute: string; color: string }> = {
  government: {
    zh: '政府机构',
    it: 'Istituzioni Governative',
    descZh: '政府部门、使领馆、经贸促进机构等官方用户',
    descIt: 'Enti governativi, ambasciate, agenzie di promozione economica',
    dashboardRoute: '/profile?tab=dashboard-gov',
    color: 'from-red-500 to-orange-500',
  },
  culture: {
    zh: '文化组织',
    it: 'Organizzazioni Culturali',
    descZh: '博物馆、美术馆、大学、文化传媒等机构',
    descIt: 'Musei, gallerie, università, media culturali',
    dashboardRoute: '/profile?tab=dashboard-culture',
    color: 'from-purple-500 to-pink-500',
  },
  public: {
    zh: '普通民众',
    it: 'Cittadini',
    descZh: '个人用户、旅游者、学生、商务人士等',
    descIt: 'Utenti privati, turisti, studenti, professionisti',
    dashboardRoute: '/profile?tab=dashboard-public',
    color: 'from-blue-500 to-cyan-500',
  },
  translator: {
    zh: '专业译员',
    it: 'Traduttori Professionisti',
    descZh: '持证译员、翻译公司、本地化团队',
    descIt: 'Traduttori certificati, agenzie di traduzione',
    dashboardRoute: '/profile?tab=dashboard-translator',
    color: 'from-emerald-500 to-teal-500',
  },
  reviewer: {
    zh: '内容审核员',
    it: 'Revisori di Contenuti',
    descZh: '负责内容审核、敏感词处理、人工复核',
    descIt: 'Responsabili della revisione contenuti',
    dashboardRoute: '/admin',
    color: 'from-amber-500 to-yellow-500',
  },
  admin: {
    zh: '系统管理员',
    it: 'Amministratori',
    descZh: '平台管理、用户管理、系统配置',
    descIt: 'Gestione piattaforma, utenti, configurazioni',
    dashboardRoute: '/admin',
    color: 'from-slate-600 to-slate-800',
  },
}

export const DEMO_ACCOUNTS: { role: UserRole; email: string; password: string; labelZh: string; labelIt: string }[] = [
  { role: 'government', email: 'gov@china-italy.cn', password: 'gov123456', labelZh: '政府机构 - 中意经贸合作司', labelIt: 'Gov - Ufficio Cooperazione' },
  { role: 'government', email: 'ambasciata@italia.cn', password: 'emb123456', labelZh: '政府机构 - 意大利驻华使馆', labelIt: 'Gov - Ambasciata d\'Italia' },
  { role: 'culture', email: 'culture@musei.it', password: 'cul123456', labelZh: '文化组织 - 佛罗伦萨美术馆', labelIt: 'Cultura - Gallerie Firenze' },
  { role: 'culture', email: 'confucius@univ.it', password: 'cul654321', labelZh: '文化组织 - 博洛尼亚孔院', labelIt: 'Cultura - Istituto Confucio' },
  { role: 'public', email: 'marco.rossi@email.it', password: 'pub123456', labelZh: '普通民众 - Marco Rossi', labelIt: 'Pubblico - Marco Rossi' },
  { role: 'public', email: 'lihua@travel.cn', password: 'pub654321', labelZh: '普通民众 - 李华', labelIt: 'Pubblico - Li Hua' },
  { role: 'translator', email: 'translator@cnit.org', password: 'tra123456', labelZh: '专业译员 - 李雯', labelIt: 'Traduttore - Li Wen' },
  { role: 'reviewer', email: 'reviewer@cnit.org', password: 'rev123456', labelZh: '内容审核员 - 王建国', labelIt: 'Revisore - Wang Jianguo' },
  { role: 'admin', email: 'admin@china-italy.com', password: 'admin123', labelZh: '系统管理员', labelIt: 'Amministratore' },
]
