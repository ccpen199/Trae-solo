import { useState } from 'react'
import {
  FileText,
  ShieldAlert,
  Scale,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  RefreshCw,
  FileCheck,
  Plus,
  Phone,
  MessageSquare,
  XCircle,
  HelpCircle,
  Gavel,
  Building2,
  User,
  Calendar,
  MapPin,
  Banknote,
  Briefcase,
  Hash,
  Lock,
  Link2,
  Blocks,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCheck,
  UserCheck,
  Building,
  Award,
  FileQuestion,
  ArrowRight,
  Copy,
  ExternalLink,
  History,
} from 'lucide-react'

type TabKey = 'contract' | 'supervision' | 'dispute'

const contractClauses = [
  '工作内容与工作地点',
  '工作时间与休息休假',
  '劳动报酬与支付方式',
  '社会保险与福利待遇',
  '劳动保护与劳动条件',
  '合同变更、解除与终止',
  '违约责任',
  '争议解决',
]

const historicalContracts = [
  { period: '2021-03-01 ~ 2024-02-28', company: '重庆华宇信息技术有限公司', status: '已到期', endReason: '合同期满' },
  { period: '2018-07-01 ~ 2021-06-30', company: '重庆长安汽车股份有限公司', status: '已解除', endReason: '协商解除' },
]

const supervisionSteps = [
  { key: 'submit', label: '投诉提交', done: true, date: '2026-05-28 16:42', desc: '张三（网上投诉）' },
  { key: 'review', label: '受理审查', done: true, date: '2026-05-29 09:30', desc: '符合受理条件' },
  { key: 'register', label: '立案审批', done: true, date: '2026-05-30 14:20', desc: '立案号：渝中劳监立[2026]128号' },
  {
    key: 'investigate',
    label: '调查取证',
    done: false,
    current: true,
    date: '进行中',
    desc: '双方质证与调解',
    details: [
      { date: '2026-06-02', content: '询问投诉人，制作笔录' },
      { date: '2026-06-05', content: '向被投诉单位送达《调查询问通知书》' },
      { date: '2026-06-08', content: '被投诉单位提交答辩材料' },
    ],
    nextStep: '双方质证与调解',
  },
  { key: 'decision', label: '行政处理/处罚', done: false, date: '待进行', desc: '' },
  { key: 'close', label: '结案', done: false, date: '待进行', desc: '' },
]

const complaintMaterials = [
  { name: '身份证', status: 'done', note: 'OCR识别' },
  { name: '劳动合同', status: 'done', note: '系统自动获取（人社备案库）' },
  { name: '工资条/银行流水', status: 'done', note: '已上传（3份）' },
  { name: '考勤记录', status: 'warning', note: '待补充（建议提供）' },
  { name: '证人证言', status: 'optional', note: '可选' },
]

const feedbackRecords = [
  { date: '2026-06-08', source: '系统', content: '被投诉单位已提交答辩材料，正进行质证' },
  { date: '2026-06-05', source: '系统', content: '已向被投诉单位送达调查通知书' },
  { date: '2026-06-02', source: '监察员', content: '案件已立案，正在开展调查取证工作' },
]

const arbitrationSteps = [
  { key: 'apply', label: '申请', desc: '提交仲裁申请材料' },
  { key: 'accept', label: '受理', desc: '5个工作日内审查' },
  { key: 'hearing', label: '开庭', desc: '组成仲裁庭审理' },
  { key: 'award', label: '裁决', desc: '作出仲裁裁决' },
  { key: 'execute', label: '执行', desc: '裁决履行/执行' },
]

const myArbitrations = [
  {
    id: 'CQZC-2023-0456',
    type: '劳动报酬争议',
    date: '2023-06-15',
    status: '已结案',
    result: '和解结案',
    company: '重庆某某科技有限公司',
  },
]

const FAQList = [
  { q: '申请劳动仲裁需要什么材料？', a: '需要提交仲裁申请书、身份证复印件、劳动关系证明材料、证据清单等。' },
  { q: '劳动仲裁的时效是多久？', a: '劳动争议申请仲裁的时效期间为一年，从当事人知道或者应当知道其权利被侵害之日起计算。' },
  { q: '仲裁费用是多少？', a: '劳动争议仲裁不收费，仲裁委员会的经费由财政予以保障。' },
  { q: '对仲裁结果不服怎么办？', a: '劳动者对仲裁裁决不服的，可以自收到仲裁裁决书之日起十五日内向人民法院提起诉讼。' },
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

function InfoRow({ icon: Icon, label, value, valueClassName = '' }: { icon: any; label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-slate-800 truncate ${valueClassName}`}>{value}</p>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function TabContract() {
  const [expandedClause, setExpandedClause] = useState(false)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">当前有效合同</h3>
              <p className="text-indigo-100 text-sm mt-1">劳动合同（2024版固定期限）</p>
            </div>
            <StatusBadge status="已生效" type="success" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <InfoRow icon={FileText} label="合同编号" value="LDHT-CQ-2024-056789" />
            <InfoRow icon={Hash} label="合同版本" value="2024版固定期限" />
            <InfoRow icon={Building2} label="用人单位" value="重庆智联数字科技有限公司" />
            <InfoRow icon={User} label="劳动者" value="张三" />
            <InfoRow icon={Calendar} label="合同期限" value="2024-03-01 至 2027-02-28（3年）" />
            <InfoRow icon={Briefcase} label="工作岗位" value="高级前端工程师" />
            <InfoRow icon={Banknote} label="月工资标准" value="¥18,500" />
            <InfoRow icon={MapPin} label="工作地点" value="重庆市渝北区" />
            <InfoRow icon={Clock} label="签署时间" value="2024-02-28" />
            <InfoRow icon={CheckCircle2} label="合同状态" value="已生效" valueClassName="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={CheckCheck} title="四方签署全链路" subtitle="劳动者 · 用人单位 · 人社备案 · 区块链存证" />
        <div className="relative">
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-300 to-slate-200" />
          <div className="space-y-5">
            <div className="relative flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 z-10 shadow-md shadow-emerald-200">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 text-sm">劳动者签署</span>
                  <span className="text-xs text-emerald-600 font-medium">2024-02-28 10:23</span>
                </div>
                <p className="text-sm text-slate-600">张三</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">电子签名</span>
                  <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">人脸识别认证</span>
                </div>
              </div>
            </div>
            <div className="relative flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 z-10 shadow-md shadow-emerald-200">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 text-sm">用人单位签署</span>
                  <span className="text-xs text-emerald-600 font-medium">2024-02-28 15:42</span>
                </div>
                <p className="text-sm text-slate-600">重庆智联数字科技有限公司</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">法人章</span>
                  <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">电子签章</span>
                </div>
              </div>
            </div>
            <div className="relative flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 z-10 shadow-md shadow-emerald-200">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 text-sm">人社部门备案</span>
                  <span className="text-xs text-emerald-600 font-medium">2024-02-29 09:15</span>
                </div>
                <p className="text-sm text-slate-600">渝北区人力资源和社会保障局</p>
                <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 mt-2 inline-block">备案通过</span>
              </div>
            </div>
            <div className="relative flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 z-10 shadow-md shadow-emerald-200">
                <Blocks className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-xl p-4 border border-cyan-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800 text-sm">区块链存证</span>
                  <span className="text-xs text-cyan-600 font-medium">2024-02-29 09:15:32</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">重庆人社区块链存证</p>
                <div className="bg-white/80 rounded-lg p-3 space-y-2 border border-cyan-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      存证哈希
                    </span>
                    <span className="text-xs font-mono text-slate-700">0x7f9c...e3a1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Blocks className="w-3.5 h-3.5" />
                      区块高度
                    </span>
                    <span className="text-xs font-mono text-slate-700">#2,847,293</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      存证时间
                    </span>
                    <span className="text-xs text-slate-700">2024-02-29 09:15:32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <button
          onClick={() => setExpandedClause(!expandedClause)}
          className="w-full flex items-center justify-between"
        >
          <SectionTitle icon={FileQuestion} title="合同条款摘要" subtitle="点击展开查看全部条款" />
          {expandedClause ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {expandedClause && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {contractClauses.map((clause, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                </div>
                <span className="text-sm text-slate-700">{clause}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">查看完整合同</span>
        </button>
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <Download className="w-5 h-5 text-cyan-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">下载电子合同</span>
        </button>
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">发起合同变更</span>
        </button>
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">续签合同</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={History} title="历史合同记录" subtitle="共 2 条历史记录" />
        <div className="space-y-3">
          {historicalContracts.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.company}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.period}</p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={item.status} type="default" />
                <p className="text-xs text-slate-400 mt-1">{item.endReason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={UserCheck} title="电子签名预览" subtitle="数字证书已认证" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-5 border border-slate-200">
            <p className="text-xs text-slate-500 mb-3">签名样式</p>
            <div className="h-20 flex items-end justify-center border-b-2 border-dashed border-slate-300 relative bg-white rounded-lg mb-3">
              <span
                className="text-3xl text-slate-800"
                style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
              >
                张三
              </span>
            </div>
            <p className="text-xs text-slate-400 text-right">签名时间：2024-02-28 10:23</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">证书颁发机构</p>
              <p className="text-sm font-medium text-slate-700">重庆市数字证书认证中心</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">证书编号</p>
              <p className="text-sm font-mono text-slate-700">CQCA-2024-8F3A2C</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-600 mb-1">认证方式</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">人脸识别</span>
                <span className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">手机号验证</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabSupervision() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">当前投诉案件</h3>
              <p className="text-amber-100 text-sm mt-1">拖欠工资 · 调查取证中</p>
            </div>
            <StatusBadge status="调查中" type="warning" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <InfoRow icon={Hash} label="投诉编号" value="LDJC-CQ-2026-03345" />
            <InfoRow icon={Calendar} label="投诉时间" value="2026-05-28 16:42" />
            <InfoRow icon={Building2} label="被投诉单位" value="重庆XX建筑工程有限公司" />
            <InfoRow icon={Banknote} label="涉及金额" value="¥35,600（3个月工资）" valueClassName="text-rose-600" />
            <InfoRow icon={User} label="涉及人数" value="1人" />
            <InfoRow icon={Building} label="受理单位" value="渝中区劳动保障监察大队" />
            <InfoRow icon={UserCheck} label="承办监察员" value="李建国 / 王芳" />
            <InfoRow icon={Phone} label="联系电话" value="023-638XXXX" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={Clock} title="办理进度" subtitle="共 6 个环节，当前第 4 步" />
        <div className="relative">
          {supervisionSteps.map((step, index) => (
            <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              {index < supervisionSteps.length - 1 && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-[calc(100%-24px)] ${step.done ? 'bg-emerald-300' : 'bg-slate-200'}`}
                />
              )}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  step.done
                    ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                    : step.current
                    ? 'bg-amber-500 shadow-md shadow-amber-200 animate-pulse'
                    : 'bg-slate-200'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : step.current ? (
                  <Clock className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-sm font-bold text-slate-400">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold text-sm ${
                      step.done || step.current ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      step.done ? 'text-emerald-600' : step.current ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {step.date}
                  </span>
                </div>
                {step.desc && (
                  <p
                    className={`text-xs ${
                      step.done || step.current ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {step.desc}
                  </p>
                )}
                {step.current && step.details && (
                  <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-2">调查取证明细</p>
                    <div className="space-y-1.5">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600">
                            <span className="text-slate-500">{detail.date}：</span>
                            {detail.content}
                          </span>
                        </div>
                      ))}
                    </div>
                    {step.nextStep && (
                      <div className="mt-2 pt-2 border-t border-amber-200 flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-amber-700">下一步：{step.nextStep}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={FileText} title="投诉材料清单" />
        <div className="space-y-2">
          {complaintMaterials.map((material, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    material.status === 'done'
                      ? 'bg-emerald-100'
                      : material.status === 'warning'
                      ? 'bg-amber-100'
                      : 'bg-slate-200'
                  }`}
                >
                  {material.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : material.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">{material.name}</span>
                  <p className="text-xs text-slate-500">{material.note}</p>
                </div>
              </div>
              {material.status === 'warning' && (
                <button className="text-xs text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  补充
                </button>
              )}
              {material.status === 'optional' && (
                <button className="text-xs text-slate-400 font-medium hover:text-slate-600 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  上传
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={MessageSquare} title="投诉反馈记录" />
        <div className="space-y-3">
          {feedbackRecords.map((record, index) => (
            <div key={index} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                {record.source === '系统' ? (
                  <Bot className="w-4 h-4 text-slate-500" />
                ) : (
                  <User className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{record.source}</span>
                  <span className="text-xs text-slate-400">{record.date}</span>
                </div>
                <p className="text-sm text-slate-600">{record.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm mb-1">预计办结时间</p>
            <p className="text-2xl font-bold">2026-07-15</p>
            <p className="text-indigo-100 text-xs mt-1">法定期限：60个工作日</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm mb-1">剩余时间</p>
            <p className="text-3xl font-bold">35<span className="text-lg font-normal">天</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">补充材料</span>
        </button>
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">联系监察员</span>
        </button>
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyan-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">查看通知书</span>
        </button>
        <button className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">撤销投诉</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={History} title="历史投诉记录" subtitle="共 2 条已办结记录" />
        <div className="space-y-3">
          {[
            { type: '未缴社保投诉', date: '2025-08-10', target: '重庆某贸易有限公司', result: '已补缴' },
            { type: '超时加班投诉', date: '2024-11-20', target: '重庆某餐饮管理公司', result: '责令整改' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.target}</p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status="已办结" type="success" />
                <p className="text-xs text-slate-400 mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Bot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  )
}

function TabDispute() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">劳动人事争议仲裁</h3>
              <p className="text-indigo-100 text-sm">公正 · 高效 · 便民</p>
            </div>
          </div>
          <p className="text-indigo-100 text-sm mb-5 max-w-md">
            依法维护劳动人事争议当事人的合法权益，促进劳动关系和谐稳定。
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            提交仲裁申请
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={ArrowRight} title="仲裁流程说明" subtitle="5个环节，一站式服务" />
        <div className="relative">
          <div className="absolute top-10 left-0 right-0 h-0.5 bg-slate-200" />
          <div className="grid grid-cols-5 gap-2 relative">
            {arbitrationSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md ${
                    index === 0
                      ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-indigo-200'
                      : 'bg-white border-2 border-slate-200'
                  }`}
                >
                  <span
                    className={`text-lg font-bold ${
                      index === 0 ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>
                <p className={`text-sm font-semibold text-center ${index === 0 ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-400 text-center mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={FileText} title="我的仲裁记录" subtitle={`共 ${myArbitrations.length} 条记录`} />
        <div className="space-y-3">
          {myArbitrations.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{item.type}</span>
                  <StatusBadge status={item.status} type="success" />
                </div>
                <span className="text-xs text-slate-400 font-mono">{item.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">被申请人：</span>
                  <span className="text-slate-700">{item.company}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">申请日期：</span>
                  <span className="text-slate-700">{item.date}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 text-xs">处理结果：</span>
                  <span className="text-emerald-600 font-medium">{item.result}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-700">
                  查看详情
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">法律援助</h4>
              <p className="text-xs text-slate-500">经济困难可申请</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            符合条件的劳动者可以申请免费法律援助，由专业律师为您提供法律帮助。
          </p>
          <button className="text-sm text-rose-600 font-medium flex items-center gap-1 hover:text-rose-700">
            申请法律援助
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">咨询热线</h4>
              <p className="text-xs text-slate-500">12333 人社服务热线</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            工作日 9:00-17:00 提供专业政策咨询和办事指引服务。
          </p>
          <button className="text-sm text-cyan-600 font-medium flex items-center gap-1 hover:text-cyan-700">
            立即拨打
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={HelpCircle} title="常见问题" subtitle="劳动争议仲裁常见问题解答" />
        <div className="space-y-2">
          {FAQList.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-100 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">Q</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{faq.q}</span>
                </div>
                {expandedFaq === index ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">A</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LaborRelation() {
  const [activeTab, setActiveTab] = useState<TabKey>('contract')

  const tabs = [
    { key: 'contract' as const, label: '劳动合同', icon: FileText, desc: '电子签署深度' },
    { key: 'supervision' as const, label: '劳动监察', icon: ShieldAlert, desc: '投诉深度' },
    { key: 'dispute' as const, label: '劳动争议', icon: Scale, desc: '仲裁申请' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur rounded-full border border-indigo-100 mb-4 shadow-sm">
            <span className="text-xs text-indigo-600 font-medium">重庆市人力资源和社会保障局</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <span className="text-4xl md:text-5xl">⚖️</span>
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              劳动关系
            </span>
          </h1>
          <p className="mt-3 text-slate-500 text-base md:text-lg">
            劳动合同 · 劳动监察 · 劳动争议
          </p>
        </header>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg shadow-indigo-100/50 border border-slate-200/60 p-2 mb-6 sticky top-4 z-20">
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
                      ? 'bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {tab.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <main className="pb-8">
          {activeTab === 'contract' && <TabContract />}
          {activeTab === 'supervision' && <TabSupervision />}
          {activeTab === 'dispute' && <TabDispute />}
        </main>

        <footer className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            重庆市人力资源和社会保障局 · 数字服务中台 · 劳动关系服务平台
          </p>
          <p className="text-xs text-slate-300 mt-1">
            技术支持：重庆人社区块链存证系统
          </p>
        </footer>
      </div>
    </div>
  )
}
