import { useState } from 'react';
import { Star, Clock, ThumbsUp, AlertCircle, TrendingUp, Calendar, MapPin, Sparkles, Baby, ChefHat, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WorkerNavbar from '@/components/WorkerNavbar';
import WorkerSidebar from '@/components/WorkerSidebar';
import ScoreRing from '@/components/ScoreRing';
import { useWorkerStore } from '@/store/useWorkerStore';
import type { ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap: Record<ServiceType, typeof Sparkles> = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

const serviceLabelMap: Record<ServiceType, string> = {
  cleaning: '日常保洁',
  babysitting: '育婴陪护',
  cooking: '上门烹饪',
};

interface ScoreRecord {
  id: number;
  order_id: number;
  service_type: ServiceType;
  address: string;
  date: string;
  score: number;
  comment?: string;
}

const mockScoreRecords: ScoreRecord[] = [
  { id: 1, order_id: 1001, service_type: 'cleaning', address: '北京市海淀区中关村大街1号', date: '2024-06-12', score: 5, comment: '阿姨非常专业，打扫得很干净！' },
  { id: 2, order_id: 1002, service_type: 'cooking', address: '北京市朝阳区望京SOHO', date: '2024-06-10', score: 4.8, comment: '饭菜可口，准时到达' },
  { id: 3, order_id: 1003, service_type: 'cleaning', address: '北京市西城区西单大悦城', date: '2024-06-08', score: 5 },
  { id: 4, order_id: 1004, service_type: 'babysitting', address: '北京市东城区王府井', date: '2024-06-05', score: 4.5, comment: '对小朋友很有耐心' },
  { id: 5, order_id: 1005, service_type: 'cleaning', address: '北京市丰台区方庄', date: '2024-06-03', score: 4.9 },
  { id: 6, order_id: 1006, service_type: 'cooking', address: '北京市石景山区万达广场', date: '2024-06-01', score: 5, comment: '厨艺很棒，全家人都喜欢' },
];

export default function WorkerScoring() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const worker = useWorkerStore((state) => state.worker);
  const score = useWorkerStore((state) => state.score);

  const trendData = score?.trend.map((s, i) => ({
    name: `第${i + 1}周`,
    score: s,
    avg: 4.5,
  })) || [];

  const metrics = [
    {
      icon: Clock,
      label: '准时率',
      value: `${score?.punctuality_rate || 0}%`,
      change: '+1.2%',
      isPositive: true,
      color: 'from-green-400 to-green-600',
      bg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: ThumbsUp,
      label: '好评率',
      value: `${score?.satisfaction_rate || 0}%`,
      change: '+0.8%',
      isPositive: true,
      color: 'from-primary-400 to-primary-600',
      bg: 'bg-primary-50',
      textColor: 'text-primary-600',
    },
    {
      icon: AlertCircle,
      label: '投诉率',
      value: `${score?.complaint_rate || 0}%`,
      change: '-0.3%',
      isPositive: true,
      color: 'from-rose-400 to-rose-600',
      bg: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <WorkerNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
          <div className="mb-6 animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-800">评分看板</h1>
            <p className="text-secondary-500 mt-1">查看您的服务评分和历史评价</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="card p-6 animate-fade-up stagger-1">
              <div className="text-center">
                <ScoreRing
                  score={score?.overall_score || 0}
                  label="综合评分"
                  sublabel={`${score?.total_orders || 0} 单评价`}
                  size={200}
                  strokeWidth={16}
                />
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-secondary-500">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">+0.2</span>
                  <span>较上周提升</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {metrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className={cn('card p-4 md:p-5 animate-fade-up', `stagger-${index + 2}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', metric.bg)}>
                          <Icon className={cn('w-5 h-5', metric.textColor)} />
                        </div>
                        <span className={cn(
                          'text-xs font-medium',
                          metric.isPositive ? 'text-green-600' : 'text-red-500'
                        )}>
                          {metric.change}
                        </span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-secondary-800">{metric.value}</p>
                      <p className="text-sm text-secondary-500 mt-1">{metric.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="card p-5 animate-fade-up stagger-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary-800">评分趋势</h3>
                      <p className="text-sm text-secondary-500">近7周评分变化</p>
                    </div>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FF6B35" />
                          <stop offset="100%" stopColor="#F4511E" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[4, 5]}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v.toFixed(1)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 8px 30px -8px rgba(26, 83, 92, 0.12)',
                        }}
                        labelStyle={{ color: '#1A535C', fontWeight: 600 }}
                        formatter={(value: number) => [value.toFixed(2), '评分']}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="url(#scoreGradient)"
                        strokeWidth={3}
                        dot={{ fill: '#FF6B35', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: '#FF6B35', stroke: 'white', strokeWidth: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="#ACD4D9"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2 text-xs text-secondary-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-primary-500 rounded-full" />
                    <span>我的评分</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-secondary-300 rounded-full border-dashed" style={{ borderStyle: 'dashed' }} />
                    <span>平台平均</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5 animate-fade-up stagger-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary-800">历史评分记录</h2>
                  <p className="text-sm text-secondary-500">共 {mockScoreRecords.length} 条评价</p>
                </div>
              </div>
              <button className="btn-ghost inline-flex items-center gap-1">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {mockScoreRecords.map((record, index) => {
                const Icon = serviceIconMap[record.service_type];
                return (
                  <div
                    key={record.id}
                    className={cn(
                      'p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:shadow-soft transition-all duration-300 animate-fade-up',
                      `stagger-${Math.min(index + 1, 6)}`
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-soft flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-secondary-800">{serviceLabelMap[record.service_type]}</h3>
                              <span className="text-xs text-secondary-400">订单 #{record.order_id}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-secondary-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{record.address}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{record.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-4 h-4',
                                  star <= Math.floor(record.score)
                                    ? 'text-amber-400 fill-amber-400'
                                    : star - 0.5 <= record.score
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200'
                                )}
                              />
                            ))}
                            <span className="ml-1 font-bold text-secondary-800">{record.score}</span>
                          </div>
                        </div>

                        {record.comment && (
                          <p className="mt-3 text-sm text-secondary-600 bg-cream-50 rounded-lg px-3 py-2">
                            "{record.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
