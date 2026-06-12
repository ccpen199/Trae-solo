import { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Building2,
  Briefcase,
  Clock,
  Users,
  Send,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Share2,
  Star,
  BookOpen,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ProgressNode {
  id: number;
  title: string;
  status: 'done' | 'current' | 'pending';
  date?: string;
  time?: string;
  note?: string;
}

export default function ReferralDetailPage() {
  const [expandedNode, setExpandedNode] = useState<number | null>(2);
  const [showPolicy, setShowPolicy] = useState(false);

  const nodes: ProgressNode[] = [
    {
      id: 0,
      title: '投递申请',
      status: 'done',
      date: '2025-06-08',
      time: '14:32',
      note: '已通过服务官张学长内推投递，个人简历与实习档案已同步至企业HR邮箱。',
    },
    {
      id: 1,
      title: 'HR初筛',
      status: 'done',
      date: '2025-06-09',
      time: '10:15',
      note: 'HR已查阅简历并标记为"重点关注"，技能匹配度92%，通过初筛进入面试环节。',
    },
    {
      id: 2,
      title: '面试环节',
      status: 'current',
      date: '2025-06-12',
      time: '15:00',
      note: '今天下午3点进行技术一面，面试官为前端技术Leader。面试链接：meet.bytedance.com/xxx。请提前10分钟进入会议，准备项目介绍。',
    },
    {
      id: 3,
      title: '发放Offer',
      status: 'pending',
      note: '面试通过后3个工作日内发放，请注意邮件通知。',
    },
    {
      id: 4,
      title: '确认入职',
      status: 'pending',
      note: '入职前需完成背调与体检，预计入职时间7月中旬。',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <button
          className="flex items-center gap-2 text-sm text-ink-600 hover:text-brand-600 transition-colors animate-fade-in-up"
        >
          <ArrowLeft size={16} />
          返回内推列表
        </button>

        <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.05s' }}>
          <div className="relative h-24 bg-gradient-to-r from-brand-500 via-brand-400 to-teal-400" />
          <CardContent className="-mt-12 relative">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-card shrink-0 bg-white">
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bytedance%20company%20logo%20minimal%20blue%20gradient&image_size=square_hd"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl font-bold text-ink-900">前端开发实习生</h1>
                  <Badge variant="danger" dot>急招</Badge>
                  <Badge variant="verified">字节跳动</Badge>
                  <Badge variant="brand">内推专属</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-ink-600">
                  <span className="flex items-center gap-1.5 font-bold text-brand-600 font-num text-base">
                    <DollarSign size={16} />
                    300-500/天
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-sky-500" />
                    北京 · 海淀区
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 size={15} className="text-teal-500" />
                    抖音电商业务线
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} className="text-amber-500" />
                    3个月以上 · 每周5天
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={15} className="text-brand-500" />
                    3人/HC，已申请28人
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button variant="primary" size="md">
                  <Share2 size={15} />
                  分享给同学
                </Button>
                <Button variant="outline" size="md">
                  <Star size={15} />
                  收藏岗位
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-ink-100 grid md:grid-cols-3 gap-3 text-center">
              <Stat icon={<Briefcase size={18} className="text-brand-500" />} label="岗位匹配度" value="92%" sub="技能与JD高度契合" />
              <Stat icon={<CheckCircle2 size={18} className="text-teal-500" />} label="历史成功" value="47人" sub="通过此内推成功入职" />
              <Stat icon={<Award size={18} className="text-amber-500" />} label="平均周期" value="8天" sub="从投递到发Offer" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-brand-500" size={22} />
                内推进度追踪
              </CardTitle>
              <p className="text-sm text-ink-500">当前：第3/5阶段，预计7月初可完成全流程</p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-ink-100" />
                <div className="space-y-1">
                  {nodes.map((node) => {
                    const isExpanded = expandedNode === node.id;
                    const IconEl = node.status === 'done' ? CheckCircle2 : node.status === 'current' ? Circle : Circle;

                    return (
                      <div key={node.id} className="relative animate-fade-in-up">
                        <button
                          onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                          className="w-full flex items-start gap-4 py-3 text-left group"
                        >
                          <div className="relative z-10 shrink-0">
                            {node.status === 'done' ? (
                              <div className="w-11 h-11 rounded-full bg-teal-gradient flex items-center justify-center text-white shadow-[0_4px_12px_-2px_rgba(46,196,182,0.5)]">
                                <CheckCircle2 size={22} />
                              </div>
                            ) : node.status === 'current' ? (
                              <div className="relative w-11 h-11">
                                <div className="absolute inset-0 rounded-full bg-brand-500/30 animate-ping" />
                                <div className="relative w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-float">
                                  <Circle size={22} fill="currentColor" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-full border-2 border-ink-200 bg-white flex items-center justify-center text-ink-300">
                                <Circle size={22} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className={`font-semibold ${node.status === 'pending' ? 'text-ink-400' : 'text-ink-900'}`}>
                                  {node.title}
                                </h4>
                                {node.date && (
                                  <p className="text-xs text-ink-500 mt-0.5">
                                    {node.date} {node.time && `· ${node.time}`}
                                  </p>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp size={18} className="text-ink-400 shrink-0" />
                              ) : (
                                <ChevronDown size={18} className="text-ink-400 shrink-0" />
                              )}
                            </div>

                            {isExpanded && node.note && (
                              <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-cream-100 to-white border border-ink-100 animate-fade-in">
                                {node.status === 'current' && (
                                  <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
                                    <AlertCircle size={16} className="text-brand-500 shrink-0 mt-0.5" />
                                    <div className="text-xs text-brand-700">
                                      <b>当前节点提示：</b>请准时参加面试，可提前联系服务官进行模拟面试辅导。
                                    </div>
                                  </div>
                                )}
                                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                                  {node.note}
                                </p>
                                {node.id === 2 && (
                                  <div className="mt-3 flex gap-2 flex-wrap">
                                    <Badge variant="info" size="sm">
                                      <BookOpen size={12} />
                                      面试指南
                                    </Badge>
                                    <Badge variant="brand" size="sm">
                                      <Users size={12} />
                                      模拟面试
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="text-teal-500" size={20} />
                  我的专属服务官
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <img
                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20male%20professional%20portrait%20friendly%20smile%20business%20casual&image_size=square_hd"
                      alt=""
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-card"
                    />
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-white" />
                  </div>
                  <h4 className="font-bold text-ink-900 mt-3">张学长</h4>
                  <p className="text-xs text-ink-500">字节跳动 · 前端工程师 · 3年经验</p>
                  <div className="mt-2 flex items-center justify-center gap-4 text-xs">
                    <span>
                      <b className="text-brand-600 font-num text-base">92%</b>
                      <span className="text-ink-500 ml-1">成功率</span>
                    </span>
                    <span>
                      <b className="text-teal-600 font-num text-base">147</b>
                      <span className="text-ink-500 ml-1">累计帮助</span>
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-cream-100 mb-4 text-xs text-ink-600 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <Phone size={13} className="text-teal-500" />
                    138****8821
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MessageCircle size={13} className="text-brand-500" />
                    微信：zhang_mentor_2021
                  </p>
                </div>
                <div className="space-y-2">
                  <textarea
                    placeholder="给服务官发消息，如：想了解面试经验..."
                    className="w-full h-20 p-3 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all resize-none"
                  />
                  <Button variant="primary" size="md" className="w-full">
                    <Send size={15} />
                    发送消息
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <button
                  onClick={() => setShowPolicy(!showPolicy)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="text-amber-500" size={20} />
                    相关政策说明
                  </CardTitle>
                  {showPolicy ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </CardHeader>
              {showPolicy && (
                <CardContent className="pt-0 animate-fade-in space-y-3 text-sm text-ink-600">
                  <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                    <p className="font-semibold text-brand-700 mb-1">✓ 内推保障</p>
                    <p className="text-xs leading-relaxed">通过本平台内推可跳过简历海选环节，简历100%送达HR，平均反馈速度提升3倍。</p>
                  </div>
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                    <p className="font-semibold text-teal-700 mb-1">✓ 隐私保护</p>
                    <p className="text-xs leading-relaxed">所有个人信息仅用于本次内推投递，严格遵守信息安全规范，企业无法直接获取联系方式。</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="font-semibold text-amber-700 mb-1">⚠️ 注意事项</p>
                    <p className="text-xs leading-relaxed">请确保档案信息真实有效，如发现造假将永久取消内推资格并记入诚信档案。</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="p-3 rounded-xl bg-cream-50 border border-ink-100">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-ink-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-ink-900 font-num">{value}</p>
      <p className="text-[11px] text-ink-400 mt-0.5">{sub}</p>
    </div>
  );
}
