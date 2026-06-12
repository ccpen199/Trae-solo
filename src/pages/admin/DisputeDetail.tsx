import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Printer, FileDown, Send, Users, Video, ArrowUpRight,
  Clock, CheckCircle2, AlertCircle, MessageSquare, User, Building2, Shield,
} from 'lucide-react';

const MOCK_CASE = {
  id: 'DSP-20260528',
  caseNumber: 'DSP-20260528',
  createdAt: '2026-05-28 09:15',
  category: '工期延误',
  status: 'mediating',
  owner: {
    name: '王先生',
    phone: '138****2345',
    avatar: '',
    statement: '合同约定3月1日开工，工期60个工作日，应5月1日完工。至今5月28日仍未完工，泥瓦工程才做了一半。工长频繁更换，每次更换都停工3-5天。多次催促无果，要求赔偿延期损失。',
    images: ['/api/ide/v1/text_to_image?prompt=unfinished%20renovation%20construction%20site%20messy%20wall%20tiles%20incomplete&image_size=square'],
    submittedAt: '2026-05-28 09:15',
  },
  company: {
    name: '东易日盛',
    contact: '李工长',
    phone: '139****8901',
    logo: '',
    statement: '承认工期延误，但原因是业主中途多次变更设计方案导致返工。2月20日变更厨房布局，3月15日变更卫生间防水方案，4月初又要求增加阳台封闭工程。每次变更都需要重新采购材料并调整施工计划。愿意协商延期责任分担。',
    images: ['/api/ide/v1/text_to_image?prompt=home%20renovation%20design%20change%20order%20document%20blueprint&image_size=square'],
    submittedAt: '2026-05-29 14:30',
    respondedAt: '2026-05-29 14:30',
  },
  timeline: [
    { time: '2026-05-28 09:15', event: '业主发起投诉', type: 'complaint' as const },
    { time: '2026-05-28 09:15', event: '平台生成工单 DSP-20260528', type: 'system' as const },
    { time: '2026-05-28 10:00', event: '通知服务商响应（限48小时）', type: 'system' as const },
    { time: '2026-05-29 14:30', event: '服务商提交陈述与证据', type: 'response' as const },
    { time: '2026-05-30 10:00', event: '调解员 张慧 介入处理', type: 'mediator' as const },
    { time: '2026-06-01 15:00', event: '调解记录：已与双方电话沟通，建议业主承担30%延期责任，公司承担70%。', type: 'note' as const },
  ],
  mediator: { name: '张慧', title: '高级调解员' },
  evidences: [
    { id: 'e1', submittedBy: 'owner' as const, type: 'image' as const, url: '', description: '施工现场现状照片', uploadedAt: '2026-05-28' },
    { id: 'e2', submittedBy: 'owner' as const, type: 'contract' as const, url: '', description: '装修合同扫描件', uploadedAt: '2026-05-28' },
    { id: 'e3', submittedBy: 'company' as const, type: 'document' as const, url: '', description: '设计变更确认单（3份）', uploadedAt: '2026-05-29' },
    { id: 'e4', submittedBy: 'company' as const, type: 'image' as const, url: '', description: '材料采购延迟证明', uploadedAt: '2026-05-29' },
  ],
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: '新建', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  responding: { label: '待响应', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  mediating: { label: '调解中', color: 'text-terracotta-700', bg: 'bg-terracotta-50 border-terracotta-200' },
  arbitrating: { label: '仲裁中', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  closed: { label: '已结案', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

const TYPE_ICONS = {
  complaint: <AlertCircle className="w-4 h-4 text-rose-500" />,
  system: <Clock className="w-4 h-4 text-ivory-400" />,
  response: <Building2 className="w-4 h-4 text-haze-500" />,
  mediator: <Shield className="w-4 h-4 text-terracotta-500" />,
  note: <MessageSquare className="w-4 h-4 text-wood-500" />,
};

export default function DisputeDetail() {
  const { id } = useParams();
  const c = MOCK_CASE;
  const sc = STATUS_STYLES[c.status];
  const [noteText, setNoteText] = useState('');

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/disputes" className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="section-title mb-0">工单 {c.caseNumber}</h1>
              <span className={`badge border ${sc.bg} ${sc.color}`}>{sc.label}</span>
            </div>
            <p className="text-sm text-ivory-500 mt-1">
              {c.category} · 创建于 {c.createdAt}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Printer className="w-4 h-4" /> 打印</button>
          <button className="btn-ghost"><FileDown className="w-4 h-4" /> 导出PDF</button>
          <button className="btn-secondary">结案处理</button>
        </div>
      </div>

      <div className="mb-6 card-base p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ivory-600">SLA处理时效</span>
          <span className="font-mono text-sm text-terracotta-600 font-semibold">剩余 36h</span>
        </div>
        <div className="mt-2 h-2 bg-ivory-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-terracotta-400 to-terracotta-600 rounded-full" style={{ width: '40%' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-1 card-base p-5 bg-haze-50/30">
          <h3 className="font-medium text-haze-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> 业主陈述
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-haze-200 flex items-center justify-center text-haze-700 text-sm font-medium">
              {c.owner.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-carbon-800">{c.owner.name}</p>
              <p className="text-xs text-ivory-500">{c.owner.phone}</p>
            </div>
          </div>
          <p className="text-sm text-carbon-700 leading-relaxed mb-4">{c.owner.statement}</p>
          <div className="space-y-2">
            {c.evidences.filter((e) => e.submittedBy === 'owner').map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs text-haze-600 bg-white/60 rounded-lg px-3 py-2">
                <FileDown className="w-3.5 h-3.5" />
                <span>{e.description}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ivory-400 mt-3">提交于 {c.owner.submittedAt}</p>
        </div>

        <div className="lg:col-span-3 card-base p-5">
          <h3 className="font-medium text-carbon-800 mb-6">处理时间线</h3>
          <div className="space-y-0">
            {c.timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-6 relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-ivory-100 flex items-center justify-center shrink-0 z-10">
                    {TYPE_ICONS[item.type]}
                  </div>
                  {idx < c.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-ivory-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-carbon-800">{item.event}</p>
                  <p className="text-xs text-ivory-400 mt-0.5 font-mono">{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-ivory-200 pt-4 mt-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="添加调解记录..."
              className="input-base min-h-[80px] resize-none mb-3"
            />
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary text-sm">
                <Send className="w-4 h-4" /> 提交记录
              </button>
              <button className="btn-secondary text-sm">
                发送调解提议
              </button>
              <button className="btn-ghost text-sm">
                <Video className="w-4 h-4" /> 安排线上会议
              </button>
              <button className="btn-ghost text-sm text-purple-600 hover:bg-purple-50">
                <ArrowUpRight className="w-4 h-4" /> 升级仲裁
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 card-base p-5 bg-terracotta-50/30">
          <h3 className="font-medium text-terracotta-700 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> 公司陈述
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-terracotta-200 flex items-center justify-center text-terracotta-700 text-sm font-medium">
              {c.company.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-carbon-800">{c.company.name}</p>
              <p className="text-xs text-ivory-500">{c.company.contact} · {c.company.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-emerald-600">已响应</span>
            <span className="text-xs text-ivory-400 ml-1">{c.company.respondedAt}</span>
          </div>
          <p className="text-sm text-carbon-700 leading-relaxed mb-4">{c.company.statement}</p>
          <div className="space-y-2">
            {c.evidences.filter((e) => e.submittedBy === 'company').map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs text-terracotta-600 bg-white/60 rounded-lg px-3 py-2">
                <FileDown className="w-3.5 h-3.5" />
                <span>{e.description}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ivory-400 mt-3">响应于 {c.company.submittedAt}</p>
        </div>
      </div>

      <div className="mt-6 card-base p-5 bg-purple-50/30 border-purple-200">
        <h3 className="font-medium text-purple-700 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> 仲裁结果（仅仲裁中/已结案显示）
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {['陈专家 - 建筑工程', '林专家 - 室内装饰', '黄专家 - 法律顾问'].map((name, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-medium">
                {name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-carbon-800">{name.split(' - ')[0]}</p>
                <p className="text-xs text-ivory-500">{name.split(' - ')[1]}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-carbon-600 italic">仲裁尚未开始，待调解失败后可升级至专家仲裁。</p>
      </div>
    </div>
  );
}
