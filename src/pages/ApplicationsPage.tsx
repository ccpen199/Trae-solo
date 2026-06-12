import { useState } from 'react';
import {
  Send,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  FileText,
  MessageCircle,
  AlertCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

type StatusKey = 'all' | 'pending' | 'screening' | 'interview' | 'offer' | 'rejected';

interface Application {
  id: number;
  job: string;
  company: string;
  logo: string;
  salary: string;
  city: string;
  appliedAt: string;
  status: StatusKey;
  progress: number;
  nodes: { title: string; time?: string; done: boolean; current?: boolean }[];
  tags: string[];
}

const statusTabs: { key: StatusKey; label: string; icon: any; count: number; variant: any }[] = [
  { key: 'all', label: '全部', icon: Briefcase, count: 22, variant: 'default' },
  { key: 'pending', label: '待处理', icon: Clock, count: 4, variant: 'info' },
  { key: 'screening', label: '初筛中', icon: FileText, count: 8, variant: 'brand' },
  { key: 'interview', label: '面试中', icon: MessageCircle, count: 5, variant: 'warn' },
  { key: 'offer', label: '已发Offer', icon: CheckCircle2, count: 2, variant: 'verified' },
  { key: 'rejected', label: '已拒绝', icon: XCircle, count: 3, variant: 'danger' },
];

const mockApplications: Application[] = [
  {
    id: 1, job: '前端开发实习生', company: '字节跳动', salary: '300-500/天', city: '北京',
    appliedAt: '2025-06-12 14:32', status: 'interview', progress: 3,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bytedance%20logo%20icon&image_size=square',
    tags: ['React', '内推', '急招'],
    nodes: [
      { title: '投递申请', time: '06-08 14:32', done: true },
      { title: 'HR初筛通过', time: '06-09 10:15', done: true },
      { title: '技术一面', time: '今天 15:00', done: false, current: true },
      { title: '技术二面', done: false },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 2, job: '全栈开发实习生', company: '阿里巴巴', salary: '350-550/天', city: '杭州',
    appliedAt: '2025-06-10 09:20', status: 'offer', progress: 5,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=alibaba%20logo%20icon&image_size=square',
    tags: ['全栈', '已拿Offer', '淘天'],
    nodes: [
      { title: '投递申请', time: '05-28 09:20', done: true },
      { title: 'HR初筛通过', time: '05-29 11:00', done: true },
      { title: '技术一面', time: '06-02 14:00', done: true },
      { title: '技术二面+HR面', time: '06-06 10:30', done: true },
      { title: '发放Offer', time: '06-10 09:20', done: true },
    ],
  },
  {
    id: 3, job: '产品经理实习生', company: '腾讯', salary: '300-450/天', city: '深圳',
    appliedAt: '2025-06-11 16:45', status: 'screening', progress: 2,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tencent%20logo%20icon&image_size=square',
    tags: ['B端产品', '数据分析'],
    nodes: [
      { title: '投递申请', time: '06-05 16:45', done: true },
      { title: 'HR初筛中', time: '06-06 14:00', done: true },
      { title: '业务面', done: false, current: true },
      { title: 'GM面', done: false },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 4, job: 'Java后端开发实习', company: '美团', salary: '300-450/天', city: '北京',
    appliedAt: '2025-06-09 11:30', status: 'interview', progress: 3,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=meituan%20logo%20icon&image_size=square',
    tags: ['Java', 'Spring'],
    nodes: [
      { title: '投递申请', time: '06-03 11:30', done: true },
      { title: '在线笔试', time: '06-05 19:00', done: true },
      { title: '技术一面', time: '明天 10:00', done: false, current: true },
      { title: '技术二面', done: false },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 5, job: '数据分析实习生', company: '蚂蚁集团', salary: '350-550/天', city: '杭州',
    appliedAt: '2025-06-08 10:00', status: 'screening', progress: 2,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ant%20group%20logo%20icon&image_size=square',
    tags: ['SQL', 'Python', '金融'],
    nodes: [
      { title: '投递申请', time: '06-02 10:00', done: true },
      { title: '简历评估中', done: false, current: true },
      { title: '技术面试', done: false },
      { title: '交叉面', done: false },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 6, job: 'UI/UX设计实习生', company: '网易', salary: '250-400/天', city: '杭州',
    appliedAt: '2025-06-07 15:22', status: 'rejected', progress: 2,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=netease%20logo%20icon&image_size=square',
    tags: ['Figma', '用户研究'],
    nodes: [
      { title: '投递申请', time: '06-01 15:22', done: true },
      { title: '作品集初筛', time: '06-05 11:00', done: true },
      { title: '未通过', done: true },
    ],
  },
  {
    id: 7, job: '商业分析实习生', company: '小红书', salary: '300-450/天', city: '上海',
    appliedAt: '2025-06-06 09:45', status: 'pending', progress: 1,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=xiaohongshu%20logo%20icon&image_size=square',
    tags: ['商业分析', 'Excel'],
    nodes: [
      { title: '投递申请', time: '06-06 09:45', done: true, current: true },
      { title: '等待HR处理', done: false },
      { title: '面试', done: false },
      { title: '终面', done: false },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 8, job: 'iOS客户端开发实习', company: '拼多多', salary: '400-600/天', city: '上海',
    appliedAt: '2025-06-05 14:30', status: 'interview', progress: 4,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pinduoduo%20logo%20icon&image_size=square',
    tags: ['Swift', '性能优化', '高薪'],
    nodes: [
      { title: '投递申请', time: '05-30 14:30', done: true },
      { title: '笔试', time: '06-01 19:00', done: true },
      { title: '技术一面', time: '06-04 11:00', done: true },
      { title: '技术二面', time: '周六 14:00', done: false, current: true },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 9, job: '量化研究实习生', company: '中金公司', salary: '500-800/天', city: '上海',
    appliedAt: '2025-06-04 10:15', status: 'screening', progress: 2,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cicc%20finance%20logo%20icon&image_size=square',
    tags: ['Python', 'C++', '高薪'],
    nodes: [
      { title: '投递申请', time: '05-29 10:15', done: true },
      { title: '简历筛选中', done: false, current: true },
      { title: '笔试', done: false },
      { title: '多轮面试', done: false },
      { title: '发放Offer', done: false },
    ],
  },
  {
    id: 10, job: 'DevOps运维实习生', company: '百度', salary: '300-450/天', city: '北京',
    appliedAt: '2025-06-03 16:00', status: 'offer', progress: 5,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baidu%20logo%20icon&image_size=square',
    tags: ['K8s', 'Docker', '已拿Offer'],
    nodes: [
      { title: '投递申请', time: '05-20 16:00', done: true },
      { title: '初筛', time: '05-22 09:00', done: true },
      { title: '技术一面', time: '05-27 14:00', done: true },
      { title: '技术二面', time: '05-31 10:30', done: true },
      { title: '发放Offer', time: '06-03 16:00', done: true },
    ],
  },
  {
    id: 11, job: '算法工程师实习生', company: '旷视科技', salary: '400-600/天', city: '北京',
    appliedAt: '2025-06-02 11:00', status: 'rejected', progress: 3,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=megvii%20ai%20company%20logo%20icon&image_size=square',
    tags: ['深度学习', 'CV'],
    nodes: [
      { title: '投递申请', time: '05-26 11:00', done: true },
      { title: '笔试', time: '05-28 19:00', done: true },
      { title: '面试未通过', time: '06-01 15:00', done: true },
    ],
  },
  {
    id: 12, job: '增长产品实习生', company: '快手', salary: '280-420/天', city: '北京',
    appliedAt: '2025-06-01 09:00', status: 'pending', progress: 1,
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kuaishou%20company%20logo%20icon&image_size=square',
    tags: ['增长', 'A/B测试'],
    nodes: [
      { title: '投递申请', time: '06-01 09:00', done: true, current: true },
      { title: '待处理', done: false },
      { title: '面试', done: false },
      { title: '终面', done: false },
      { title: '发放Offer', done: false },
    ],
  },
];

const statusBadge: Record<StatusKey, { label: string; variant: any; icon: any }> = {
  all: { label: '全部', variant: 'default', icon: Briefcase },
  pending: { label: '待处理', variant: 'info', icon: Clock },
  screening: { label: '初筛中', variant: 'brand', icon: FileText },
  interview: { label: '面试中', variant: 'warn', icon: MessageCircle },
  offer: { label: '已发Offer', variant: 'verified', icon: CheckCircle2 },
  rejected: { label: '已拒绝', variant: 'danger', icon: XCircle },
};

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<StatusKey>('all');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [searchText, setSearchText] = useState('');

  const filtered = mockApplications.filter((app) => {
    if (activeTab !== 'all' && app.status !== activeTab) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      if (!app.job.toLowerCase().includes(s) && !app.company.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-amber-400 text-white flex items-center justify-center shadow-float">
              <Send size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">投递记录</h1>
              <p className="text-sm text-ink-500">共投递 <b className="text-brand-600 font-num">22</b> 个岗位 · 面试中 <b className="text-amber-600 font-num">5</b> · 已拿Offer <b className="text-teal-600 font-num">2</b></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="搜索岗位/企业..."
              leftIcon={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              wrapperClassName="w-full sm:w-64"
            />
            <Button variant="outline" size="md">
              <Filter size={15} />
              筛选
            </Button>
          </div>
        </div>

        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.05s' }}>
          <div className="border-b border-ink-100 px-2">
            <div className="flex gap-1 overflow-x-auto py-1">
              {statusTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all rounded-xl ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-brand-500 to-brand-400 shadow-float'
                        : 'text-ink-500 hover:text-ink-700 hover:bg-cream-100'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-num ${
                      isActive ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-4 pb-8">
          {filtered.map((app, idx) => {
            const StatusIcon = statusBadge[app.status].icon;
            const isExpanded = expandedId === app.id;
            const isRejected = app.status === 'rejected';
            const isOffer = app.status === 'offer';

            return (
              <Card
                key={app.id}
                hoverable
                className={`animate-fade-in-up overflow-hidden ${isOffer ? 'border-teal-200 bg-gradient-to-br from-teal-50/50 to-white' : isRejected ? 'opacity-90' : ''}`}
                style={{ animationDelay: `${0.08 + idx * 0.03}s` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full text-left"
                >
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-soft bg-white">
                        <img src={app.logo} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-lg font-bold text-ink-900 truncate">{app.job}</h3>
                          <Badge variant={statusBadge[app.status].variant} dot size="sm">
                            <StatusIcon size={12} />
                            {statusBadge[app.status].label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
                          <span className="font-medium text-ink-700">{app.company}</span>
                          <span className="flex items-center gap-1 text-brand-600 font-bold font-num">
                            <DollarSign size={14} />
                            {app.salary}
                          </span>
                          <span className="flex items-center gap-1 text-ink-500">
                            <MapPin size={14} className="text-sky-500" />
                            {app.city}
                          </span>
                          <span className="flex items-center gap-1 text-ink-500">
                            <Calendar size={14} className="text-ink-400" />
                            {app.appliedAt}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {app.tags.map((t) => (
                            <span key={t} className="text-[11px] px-2 py-0.5 rounded-lg bg-cream-100 text-ink-600 border border-ink-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0">
                        <div className="md:max-w-[180px] w-full md:w-auto">
                          <div className="flex justify-between text-[10px] mb-1 font-medium">
                            <span>进度</span>
                            <span className="font-num">{app.progress}/{app.nodes.length}</span>
                          </div>
                          <div className="h-2 bg-ink-100 rounded-full overflow-hidden w-full md:w-[180px]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOffer
                                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                                  : isRejected
                                  ? 'bg-gradient-to-r from-rose-300 to-pink-300'
                                  : 'bg-gradient-to-r from-brand-400 to-amber-400'
                              }`}
                              style={{ width: `${(app.progress / app.nodes.length) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-ink-400 md:mt-1">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isExpanded ? '收起' : '详情'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 animate-fade-in border-t border-ink-100 pt-4 mx-5">
                    {isRejected && (
                      <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm flex items-start gap-3">
                        <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-rose-700">
                          <b>反馈信息：</b>感谢您的投递！本次岗位更偏向有2年以上工作经验的候选人，
                          您的简历已存入人才库，后续有合适的实习岗位会优先联系您~
                        </div>
                      </div>
                    )}
                    {isOffer && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-sm flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                        <div className="text-teal-800">
                          <b>🎉 恭喜获得Offer！</b>请在3个工作日内确认是否接受，
                          如有疑问可联系您的专属服务官或直接回复HR邮件。
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-brand-200 via-teal-200 to-sky-200" />
                      <div className="space-y-1">
                        {app.nodes.map((node, nIdx) => (
                          <div key={nIdx} className="relative flex items-start gap-4 py-2.5">
                            <div className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2 border-white shadow-soft ${
                              node.done
                                ? isRejected && nIdx === app.nodes.length - 1
                                  ? 'bg-gradient-to-br from-rose-400 to-pink-400 text-white'
                                  : 'bg-gradient-to-br from-teal-400 to-emerald-400 text-white'
                                : node.current
                                ? 'bg-gradient-to-br from-brand-500 to-amber-400 text-white shadow-float'
                                : 'bg-ink-100 text-ink-400'
                            } ${node.current ? 'animate-pulse-dot' : ''}`}>
                              {node.done ? (
                                <CheckCircle2 size={18} />
                              ) : node.current ? (
                                <Clock size={18} />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-ink-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className={`font-semibold text-sm ${
                                  node.done || node.current ? 'text-ink-800' : 'text-ink-400'
                                }`}>
                                  {node.title}
                                  {node.current && (
                                    <Badge variant="warn" size="xs" className="ml-2" dot>
                                      当前节点
                                    </Badge>
                                  )}
                                </h5>
                                {node.time && (
                                  <span className="text-xs text-ink-400 shrink-0">{node.time}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-3 pt-4 border-t border-ink-100">
                      <Button variant="ghost" size="sm">
                        <Eye size={14} />
                        查看岗位
                      </Button>
                      {isOffer && (
                        <Button variant="secondary" size="sm">
                          <CheckCircle2 size={14} />
                          接受Offer
                        </Button>
                      )}
                      {app.status === 'interview' && (
                        <Button variant="secondary" size="sm">
                          <MessageCircle size={14} />
                          联系服务官辅导
                        </Button>
                      )}
                      <Button variant="primary" size="sm">
                        <FileText size={14} />
                        查看详情
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card className="animate-fade-in-up">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-ink-100 flex items-center justify-center text-ink-400 mb-4">
                  <Briefcase size={32} />
                </div>
                <h3 className="text-lg font-semibold text-ink-700 mb-1">暂无投递记录</h3>
                <p className="text-sm text-ink-500 mb-5">换个条件试试，或者去发现更多好岗位~</p>
                <Button variant="primary" size="md">
                  浏览岗位
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
