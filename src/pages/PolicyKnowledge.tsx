import { useState } from 'react'
import {
  MessageCircle,
  Network,
  TrendingUp,
  Send,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  FileText,
  Bookmark,
  Flame,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Minus,
  Phone,
  User,
  Bot,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react'

type TabKey = 'qa' | 'graph' | 'hot'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  references?: string[]
  relatedItems?: string[]
  materials?: string[]
  entry?: string
}

interface PolicyNode {
  id: string
  label: string
  x: number
  y: number
  color: string
  r: number
  category: string
}

interface PolicyEdge {
  from: string
  to: string
}

interface PolicyDoc {
  id: string
  name: string
  docNumber: string
  publishDate: string
  level: string
  status: string
  category: string
}

interface HotQuestion {
  id: number
  rank: number
  question: string
  heat: number
  trend: 'up' | 'down' | 'flat'
  category: string
  answer: string
}

interface CategoryStat {
  name: string
  percentage: number
  color: string
}

const chatHistory: ChatMessage[] = [
  {
    id: 1,
    role: 'user',
    content: '失业金能领多久？',
  },
  {
    id: 2,
    role: 'assistant',
    content:
      '根据《重庆市失业保险条例》，失业保险金领取期限根据失业人员失业前所在单位和本人累计缴纳失业保险费的时间确定：累计缴费满1年不足5年的，领取期限最长为12个月；累计缴费满5年不足10年的，领取期限最长为18个月；累计缴费10年以上的，领取期限最长为24个月。重新就业后再次失业的，缴费时间重新计算，领取期限可以与前次失业应领取而尚未领取的期限合并计算，但最长不得超过24个月。',
    references: ['《重庆市失业保险条例》第二十四条'],
    relatedItems: ['失业金申领', '失业登记'],
  },
  {
    id: 3,
    role: 'user',
    content: '我之前在深圳交过社保，能转移到重庆吗？',
  },
  {
    id: 4,
    role: 'assistant',
    content:
      '可以办理社保转移接续。参保人员跨省流动就业的，由原参保所在地社会保险经办机构开具参保缴费凭证，基本养老保险关系应随同转移到新参保地。办理流程：1. 原参保地开具参保缴费凭证；2. 向新参保地社保经办机构提出转移申请；3. 两地社保经办机构对接办理转移手续；4. 转移完成后合并计算缴费年限。',
    references: ['《城镇企业职工基本养老保险关系转移接续暂行办法》'],
    entry: '社保转移',
    materials: ['身份证', '社保卡'],
  },
  {
    id: 5,
    role: 'user',
    content: '职称申报需要什么材料？',
  },
  {
    id: 6,
    role: 'assistant',
    content:
      '申报中级职称一般需要以下材料：\n1. 职称评审申报表（一式三份）\n2. 个人业绩综述报告\n3. 学历证书、学位证书复印件\n4. 现任职称资格证书复印件\n5. 近五年年度考核表\n6. 专业技术工作业绩成果材料（论文、专利、项目等）\n7. 继续教育证明材料',
    references: ['《重庆市职称评审管理办法》'],
    relatedItems: ['职称申报'],
  },
]

const quickQuestions = ['失业金标准', '社保转移流程', '职称条件', '退休年龄']

const hotQuestionsTop10 = [
  { id: 1, question: '失业金申领条件是什么？', heat: 1286 },
  { id: 2, question: '养老保险缴费基数怎么算？', heat: 1152 },
  { id: 3, question: '退休年龄是多少岁？', heat: 987 },
  { id: 4, question: '社保转移怎么办理？', heat: 876 },
  { id: 5, question: '工伤认定流程是什么？', heat: 765 },
  { id: 6, question: '职称评审条件有哪些？', heat: 654 },
  { id: 7, question: '医保报销比例是多少？', heat: 543 },
  { id: 8, question: '最低工资标准是多少？', heat: 432 },
  { id: 9, question: '生育津贴怎么计算？', heat: 321 },
  { id: 10, question: '劳动仲裁时效多久？', heat: 298 },
]

const policyCategories = [
  { id: 'employment', name: '就业创业', icon: '💼', count: 128 },
  { id: 'social', name: '社会保险', icon: '🛡️', count: 156 },
  { id: 'talent', name: '人才人事', icon: '🎓', count: 89 },
  { id: 'labor', name: '劳动关系', icon: '⚖️', count: 76 },
  { id: 'salary', name: '工资分配', icon: '💰', count: 45 },
]

const myFavorites = [
  { id: 1, title: '失业金申领指南', category: '就业创业' },
  { id: 2, title: '养老保险转移接续办法', category: '社会保险' },
  { id: 3, title: '中级职称评审条件', category: '人才人事' },
]

const graphNodes: PolicyNode[] = [
  { id: 'center', label: '重庆市人社政策', x: 300, y: 200, color: '#2563eb', r: 45, category: '中心' },
  { id: 'e1', label: '失业金', x: 100, y: 60, color: '#10b981', r: 28, category: '就业创业' },
  { id: 'e2', label: '就业补贴', x: 200, y: 40, color: '#10b981', r: 28, category: '就业创业' },
  { id: 'e3', label: '创业担保贷款', x: 80, y: 140, color: '#10b981', r: 28, category: '就业创业' },
  { id: 'e4', label: '职业培训', x: 160, y: 120, color: '#10b981', r: 28, category: '就业创业' },
  { id: 'e5', label: '岗位推荐', x: 120, y: 200, color: '#10b981', r: 28, category: '就业创业' },
  { id: 's1', label: '养老保险', x: 420, y: 50, color: '#3b82f6', r: 28, category: '社会保险' },
  { id: 's2', label: '医疗保险', x: 500, y: 100, color: '#3b82f6', r: 28, category: '社会保险' },
  { id: 's3', label: '失业保险', x: 480, y: 180, color: '#3b82f6', r: 28, category: '社会保险' },
  { id: 's4', label: '工伤保险', x: 520, y: 260, color: '#3b82f6', r: 28, category: '社会保险' },
  { id: 's5', label: '生育保险', x: 460, y: 320, color: '#3b82f6', r: 28, category: '社会保险' },
  { id: 't1', label: '职称评审', x: 380, y: 340, color: '#8b5cf6', r: 28, category: '人才人事' },
  { id: 't2', label: '人才认定', x: 300, y: 360, color: '#8b5cf6', r: 28, category: '人才人事' },
  { id: 't3', label: '公务员', x: 220, y: 340, color: '#8b5cf6', r: 28, category: '人才人事' },
  { id: 't4', label: '事业单位', x: 160, y: 300, color: '#8b5cf6', r: 28, category: '人才人事' },
  { id: 't5', label: '培训', x: 100, y: 260, color: '#8b5cf6', r: 28, category: '人才人事' },
  { id: 'l1', label: '劳动合同', x: 50, y: 340, color: '#f97316', r: 28, category: '劳动关系' },
  { id: 'l2', label: '劳动监察', x: 60, y: 400, color: '#f97316', r: 28, category: '劳动关系' },
  { id: 'l3', label: '劳动仲裁', x: 140, y: 400, color: '#f97316', r: 28, category: '劳动关系' },
  { id: 'l4', label: '集体协商', x: 200, y: 380, color: '#f97316', r: 28, category: '劳动关系' },
  { id: 'w1', label: '最低工资', x: 420, y: 380, color: '#ef4444', r: 28, category: '工资分配' },
  { id: 'w2', label: '工资指导线', x: 500, y: 380, color: '#ef4444', r: 28, category: '工资分配' },
  { id: 'w3', label: '年金', x: 540, y: 340, color: '#ef4444', r: 28, category: '工资分配' },
  { id: 'w4', label: '津贴补贴', x: 520, y: 420, color: '#ef4444', r: 28, category: '工资分配' },
]

const graphEdges: PolicyEdge[] = [
  { from: 'center', to: 'e1' },
  { from: 'center', to: 'e2' },
  { from: 'center', to: 'e3' },
  { from: 'center', to: 'e4' },
  { from: 'center', to: 'e5' },
  { from: 'center', to: 's1' },
  { from: 'center', to: 's2' },
  { from: 'center', to: 's3' },
  { from: 'center', to: 's4' },
  { from: 'center', to: 's5' },
  { from: 'center', to: 't1' },
  { from: 'center', to: 't2' },
  { from: 'center', to: 't3' },
  { from: 'center', to: 't4' },
  { from: 'center', to: 't5' },
  { from: 'center', to: 'l1' },
  { from: 'center', to: 'l2' },
  { from: 'center', to: 'l3' },
  { from: 'center', to: 'l4' },
  { from: 'center', to: 'w1' },
  { from: 'center', to: 'w2' },
  { from: 'center', to: 'w3' },
  { from: 'center', to: 'w4' },
]

const policyDocs: PolicyDoc[] = [
  {
    id: '1',
    name: '中华人民共和国社会保险法',
    docNumber: '主席令第35号',
    publishDate: '2018-12-29',
    level: '法律',
    status: '有效',
    category: '社会保险',
  },
  {
    id: '2',
    name: '失业保险条例',
    docNumber: '国务院令第258号',
    publishDate: '1999-01-22',
    level: '行政法规',
    status: '有效',
    category: '社会保险',
  },
  {
    id: '3',
    name: '重庆市失业保险条例',
    docNumber: '渝人发〔2003〕29号',
    publishDate: '2003-09-26',
    level: '地方规范性文件',
    status: '有效',
    category: '社会保险',
  },
  {
    id: '4',
    name: '职称评审管理暂行规定',
    docNumber: '人社部令第40号',
    publishDate: '2019-07-01',
    level: '部门规章',
    status: '有效',
    category: '人才人事',
  },
  {
    id: '5',
    name: '中华人民共和国劳动合同法',
    docNumber: '主席令第73号',
    publishDate: '2012-12-28',
    level: '法律',
    status: '有效',
    category: '劳动关系',
  },
  {
    id: '6',
    name: '重庆市就业促进条例',
    docNumber: '渝人发〔2009〕9号',
    publishDate: '2009-03-26',
    level: '地方规范性文件',
    status: '有效',
    category: '就业创业',
  },
  {
    id: '7',
    name: '最低工资规定',
    docNumber: '劳动保障部令第21号',
    publishDate: '2004-01-20',
    level: '部门规章',
    status: '有效',
    category: '工资分配',
  },
  {
    id: '8',
    name: '工伤保险条例',
    docNumber: '国务院令第586号',
    publishDate: '2010-12-20',
    level: '行政法规',
    status: '即将修订',
    category: '社会保险',
  },
]

const recentUpdates = [
  { id: 1, name: '重庆市失业保险金标准调整通知', date: '2026-06-08', type: '政策更新' },
  { id: 2, name: '关于优化职称申报流程的通知', date: '2026-06-06', type: '办事指南' },
  { id: 3, name: '2026年度社保缴费基数上下限公布', date: '2026-06-05', type: '重要通知' },
]

const hotQuestionsList: HotQuestion[] = [
  {
    id: 1,
    rank: 1,
    question: '失业金申领条件是什么？',
    heat: 1286,
    trend: 'up',
    category: '就业创业',
    answer:
      '申领失业保险金需同时满足以下条件：1. 按照规定参加失业保险，所在单位和本人已按照规定履行缴费义务满1年以上；2. 在法定劳动年龄内非因本人意愿中断就业；3. 已办理失业登记，并有求职要求。',
  },
  {
    id: 2,
    rank: 2,
    question: '养老保险缴费基数怎么确定？',
    heat: 1152,
    trend: 'up',
    category: '社会保险',
    answer:
      '养老保险缴费基数按上年度全市城镇非私营单位在岗职工平均工资的60%-300%确定。职工本人工资低于上年度全市平均工资60%的，按60%计算缴费基数；高于300%的，按300%计算缴费基数。',
  },
  {
    id: 3,
    rank: 3,
    question: '退休年龄是多少岁？',
    heat: 987,
    trend: 'flat',
    category: '社会保险',
    answer:
      '现行法定退休年龄：男性年满60周岁；女干部年满55周岁；女工人年满50周岁。从事井下、高空、高温、特别繁重体力劳动或其他有害身体健康工作的，退休年龄为男年满55周岁、女年满45周岁。',
  },
  {
    id: 4,
    rank: 4,
    question: '社保转移怎么办理？',
    heat: 876,
    trend: 'up',
    category: '社会保险',
    answer:
      '办理社保转移接续流程：1. 登录原参保地社保经办机构网站或APP，开具参保缴费凭证；2. 在新就业地参保后，向新参保地社保经办机构提出转移申请；3. 两地社保经办机构对接办理转移手续；4. 一般在45个工作日内完成转移。',
  },
  {
    id: 5,
    rank: 5,
    question: '工伤认定流程是什么？',
    heat: 765,
    trend: 'down',
    category: '社会保险',
    answer:
      '工伤认定流程：1. 提出申请：职工发生事故伤害后，所在单位应在30日内提出工伤认定申请；2. 受理审核：社保行政部门对申请材料进行审核；3. 调查核实：对事故伤害进行调查核实；4. 作出决定：自受理之日起60日内作出工伤认定决定。',
  },
  {
    id: 6,
    rank: 6,
    question: '职称评审条件有哪些？',
    heat: 654,
    trend: 'up',
    category: '人才人事',
    answer:
      '职称评审基本条件包括：1. 遵守宪法和法律，具有良好的职业道德和敬业精神；2. 具备相应的学历和任职年限要求；3. 具备相应的专业技术工作能力和业绩成果；4. 按规定参加继续教育并取得合格证明。',
  },
  {
    id: 7,
    rank: 7,
    question: '医保报销比例是多少？',
    heat: 543,
    trend: 'flat',
    category: '社会保险',
    answer:
      '职工医保报销比例：一级医院报销比例约90%，二级医院约85%，三级医院约80%。退休人员报销比例相应提高5个百分点。居民医保报销比例相对较低，一级医院约70-80%，二级医院约60-70%，三级医院约50-60%。',
  },
  {
    id: 8,
    rank: 8,
    question: '最低工资标准是多少？',
    heat: 432,
    trend: 'up',
    category: '工资分配',
    answer:
      '重庆市最低工资标准（2026年）：万州区、黔江区、涪陵区、渝中区、大渡口区、江北区、沙坪坝区、九龙坡区、南岸区、北碚区、渝北区、巴南区、长寿区、江津区、合川区、永川区、南川区、綦江区、大足区、璧山区、铜梁区、潼南区、荣昌区、开州区、梁平区、武隆区等26个区县及两江新区、重庆高新区、万盛经开区职工最低月工资标准为2300元/月，非全日制职工最低小时工资标准为22元/小时。',
  },
  {
    id: 9,
    rank: 9,
    question: '生育津贴怎么计算？',
    heat: 321,
    trend: 'down',
    category: '社会保险',
    answer:
      '生育津贴按照职工所在单位上年度职工月平均工资除以30再乘以产假天数计算。生育津贴由生育保险基金支付，低于本人工资标准的，差额部分由所在单位补足。',
  },
  {
    id: 10,
    rank: 10,
    question: '劳动仲裁时效多久？',
    heat: 298,
    trend: 'flat',
    category: '劳动关系',
    answer:
      '劳动争议申请仲裁的时效期间为一年。仲裁时效期间从当事人知道或者应当知道其权利被侵害之日起计算。劳动关系存续期间因拖欠劳动报酬发生争议的，劳动者申请仲裁不受一年仲裁时效期间的限制；但是，劳动关系终止的，应当自劳动关系终止之日起一年内提出。',
  },
]

const categoryStats: CategoryStat[] = [
  { name: '就业创业', percentage: 32, color: '#10b981' },
  { name: '社会保险', percentage: 28, color: '#3b82f6' },
  { name: '人才人事', percentage: 18, color: '#8b5cf6' },
  { name: '劳动关系', percentage: 12, color: '#f97316' },
  { name: '工资分配', percentage: 5, color: '#ef4444' },
  { name: '其他', percentage: 5, color: '#64748b' },
]

const weeklyTrend = [
  { day: '周一', value: 856 },
  { day: '周二', value: 1023 },
  { day: '周三', value: 1156 },
  { day: '周四', value: 987 },
  { day: '周五', value: 1245 },
  { day: '周六', value: 654 },
  { day: '周日', value: 523 },
]

function StatusBadge({ status, type = 'default' }: { status: string; type?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const typeMap: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-sky-100 text-sky-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${typeMap[type]}`}>
      {status}
    </span>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const [feedback, setFeedback] = useState<'useful' | 'useless' | null>(null)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
            isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-cyan-500 to-blue-500'
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
              isUser
                ? 'bg-blue-500 text-white rounded-tr-md'
                : 'bg-slate-50 text-slate-700 rounded-tl-md border border-slate-100'
            }`}
          >
            {message.content}
          </div>
          {!isUser && (
            <div className="mt-3 space-y-2">
              {message.references && message.references.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 flex-shrink-0">📚 引用政策：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {message.references.map((ref, i) => (
                      <span key={i} className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {message.relatedItems && message.relatedItems.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 flex-shrink-0">🔗 相关事项：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {message.relatedItems.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md border border-cyan-100 cursor-pointer hover:bg-cyan-100 transition-colors"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {message.entry && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">🚪 办理入口：</span>
                  <span className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium flex items-center gap-0.5">
                    {message.entry}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              )}
              {message.materials && message.materials.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 flex-shrink-0">📋 办理材料：</span>
                  <span className="text-slate-600">{message.materials.join('、')}</span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setFeedback(feedback === 'useful' ? null : 'useful')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    feedback === 'useful'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  有用
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'useless' ? null : 'useless')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    feedback === 'useless'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  没用
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabQA() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">智能问答</h2>
            <p className="text-xs text-slate-500">AI政策助手，7×24小时在线服务</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status="在线服务中" type="success" />
          </div>
        </div>

        <div className="flex-1 px-6 py-5 overflow-y-auto" style={{ maxHeight: 520 }}>
          {chatHistory.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              快捷提问：
            </span>
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setInputValue(q)}
                className="px-3 py-1.5 bg-white text-blue-600 rounded-full text-xs font-medium hover:bg-blue-50 border border-blue-100 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入您的问题，例如：重庆失业金申领条件是什么？"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && setInputValue('')}
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-md shadow-blue-200 cursor-pointer">
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">今日热问 Top 10</h3>
          </div>
          <div className="p-4 space-y-1">
            {hotQuestionsTop10.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i < 3
                      ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-slate-600 group-hover:text-blue-600 transition-colors flex-1 truncate">
                  {item.question}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0">{item.heat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">政策分类导航</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {policyCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 cursor-pointer transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                <span className="text-xs text-slate-400">{cat.count}条</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">我的收藏</h3>
          </div>
          <div className="p-4 space-y-2">
            {myFavorites.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-amber-50 cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate group-hover:text-amber-700">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KnowledgeGraph() {
  const nodeMap = Object.fromEntries(graphNodes.map((n) => [n.id, n]))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">政策知识图谱</h3>
            <p className="text-xs text-slate-500">共 24 个政策节点，关联展示</p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { name: '就业创业', color: '#10b981' },
            { name: '社会保险', color: '#3b82f6' },
            { name: '人才人事', color: '#8b5cf6' },
            { name: '劳动关系', color: '#f97316' },
            { name: '工资分配', color: '#ef4444' },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-slate-500">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-100">
        <svg viewBox="0 0 600 470" className="w-full" style={{ maxHeight: 420 }}>
          <defs>
            <filter id="graphGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {graphEdges.map((edge) => {
            const from = nodeMap[edge.from]
            const to = nodeMap[edge.to]
            if (!from || !to) return null
            const dx = to.x - from.x
            const dy = to.y - from.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const offsetX = (dx / dist) * from.r
            const offsetY = (dy / dist) * from.r
            const endOffsetX = -(dx / dist) * to.r
            const endOffsetY = -(dy / dist) * to.r

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x + offsetX}
                y1={from.y + offsetY}
                x2={to.x + endOffsetX}
                y2={to.y + endOffsetY}
                stroke="url(#lineGradient)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
            )
          })}

          {graphNodes.map((node) => (
            <g key={node.id} className="cursor-pointer">
              {node.id === 'center' && (
                <circle cx={node.x} cy={node.y} r={node.r + 12} fill={node.color} opacity={0.1} />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={node.color}
                filter={node.id === 'center' ? 'url(#graphGlow)' : undefined}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={node.id === 'center' ? 13 : 11}
                fill="white"
                fontWeight={600}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

function PolicyLibrary() {
  const getLevelColor = (level: string) => {
    const map: Record<string, string> = {
      法律: 'bg-rose-50 text-rose-700 border-rose-100',
      行政法规: 'bg-amber-50 text-amber-700 border-amber-100',
      部门规章: 'bg-blue-50 text-blue-700 border-blue-100',
      地方规范性文件: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    }
    return map[level] || 'bg-slate-50 text-slate-700 border-slate-100'
  }

  const getStatusColor = (status: string) => {
    if (status === '有效') return 'success'
    if (status === '即将修订' || status === '即将废止') return 'warning'
    return 'default'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">政策库</h3>
            <p className="text-xs text-slate-500">法律法规 · 政策文件 · 办事指南</p>
          </div>
        </div>
        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          查看全部
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policyDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors flex-1 pr-2">
                {doc.name}
              </h4>
              <StatusBadge status={doc.status} type={getStatusColor(doc.status) as any} />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded border ${getLevelColor(doc.level)}`}>
                {doc.level}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {doc.category}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {doc.docNumber}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {doc.publishDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PolicyCalendar() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">近7天政策更新</h3>
          <p className="text-xs text-slate-500">最新政策动态，及时掌握</p>
        </div>
      </div>
      <div className="space-y-3">
        {recentUpdates.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex flex-col items-center justify-center text-white flex-shrink-0">
              <span className="text-lg font-bold">{item.date.split('-')[2]}</span>
              <span className="text-xs opacity-80">{item.date.split('-')[1]}月</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-800 truncate">{item.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {item.type}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabGraph() {
  return (
    <div className="space-y-6">
      <KnowledgeGraph />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PolicyLibrary />
        </div>
        <div>
          <PolicyCalendar />
        </div>
      </div>
    </div>
  )
}

function HotRanking() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-rose-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-emerald-500" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getTrendText = (trend: string) => {
    if (trend === 'up') return '上升'
    if (trend === 'down') return '下降'
    return '持平'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">热点问题排行</h3>
            <p className="text-xs text-slate-500">今日热度 · 实时更新</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {hotQuestionsList.map((item) => (
          <div
            key={item.id}
            className="border border-slate-100 rounded-xl overflow-hidden hover:border-blue-200 transition-colors"
          >
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full flex items-center gap-4 p-4 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  item.rank <= 3
                    ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {item.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.question}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">{item.heat.toLocaleString()}次</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {item.category}
                  </span>
                  <span className="text-xs flex items-center gap-1">
                    {getTrendIcon(item.trend)}
                    <span
                      className={
                        item.trend === 'up'
                          ? 'text-rose-500'
                          : item.trend === 'down'
                          ? 'text-emerald-500'
                          : 'text-slate-400'
                      }
                    >
                      {getTrendText(item.trend)}
                    </span>
                  </span>
                </div>
              </div>
              {expandedId === item.id ? (
                <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {expandedId === item.id && (
              <div className="p-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                        查看详情
                      </button>
                      <button className="text-xs px-3 py-1.5 bg-white text-slate-600 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                        收藏
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryStats() {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const totalPercentage = 100

  let offset = 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">热点分类统计</h3>
          <p className="text-xs text-slate-500">按类别分布占比</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-44 h-44 flex-shrink-0">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="16"
            />
            {categoryStats.map((cat, index) => {
              const strokeLength = (cat.percentage / totalPercentage) * circumference
              const currentOffset = offset
              offset += strokeLength

              return (
                <circle
                  key={cat.name}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth="16"
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={-currentOffset}
                  style={{ transition: 'all 0.3s ease' }}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">100%</span>
            <span className="text-xs text-slate-400">总计</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {categoryStats.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs text-slate-600 flex-1">{cat.name}</span>
              <span className="text-sm font-bold text-slate-800">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrendChart() {
  const maxValue = Math.max(...weeklyTrend.map((d) => d.value))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">近7天提问量趋势</h3>
          <p className="text-xs text-slate-500">用户提问量变化</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 h-44 px-2">
        {weeklyTrend.map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-36">
                <span className="text-xs text-slate-500 mb-1 font-medium">{item.value}</span>
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 hover:from-blue-700 hover:to-cyan-500 transition-all cursor-pointer"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{item.day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeedbackSection() {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-1">没找到答案？</h3>
        <p className="text-blue-100 text-sm mb-5">多种渠道为您提供专业解答</p>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">提交问题</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">人工咨询</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">12333热线</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function TabHot() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <HotRanking />
      </div>
      <div className="flex flex-col gap-6">
        <CategoryStats />
        <TrendChart />
        <FeedbackSection />
      </div>
    </div>
  )
}

export default function PolicyKnowledge() {
  const [activeTab, setActiveTab] = useState<TabKey>('qa')

  const tabs = [
    { key: 'qa' as const, label: '智能问答', icon: MessageCircle, desc: 'AI政策助手' },
    { key: 'graph' as const, label: '政策图谱', icon: Network, desc: '知识可视化' },
    { key: 'hot' as const, label: '热点问题', icon: TrendingUp, desc: '热点聚类' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur rounded-full border border-blue-100 mb-4 shadow-sm">
            <span className="text-xs text-blue-600 font-medium">重庆市人力资源和社会保障局</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <span className="text-4xl md:text-5xl">💡</span>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              政策知识
            </span>
          </h1>
          <p className="mt-3 text-slate-500 text-base md:text-lg">
            智能问答 · 政策图谱 · 热点聚类
          </p>
        </header>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg shadow-blue-100/50 border border-slate-200/60 p-2 mb-6 sticky top-4 z-20">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {tab.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <main className="pb-8">
          {activeTab === 'qa' && <TabQA />}
          {activeTab === 'graph' && <TabGraph />}
          {activeTab === 'hot' && <TabHot />}
        </main>

        <footer className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            重庆市人力资源和社会保障局 · 数字服务中台 · 政策知识图谱平台
          </p>
          <p className="text-xs text-slate-300 mt-1">
            技术支持：重庆市人社大数据智能分析系统
          </p>
        </footer>
      </div>
    </div>
  )
}
