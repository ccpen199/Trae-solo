import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Users,
  TrendingUp,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  ArrowRight,
  FolderKanban,
  Gavel,
  Scale,
} from 'lucide-react';
import { Card, Tag, Progress, Avatar, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import DataCard from '@/components/common/DataCard';
import { useCaseStore } from '@/store/caseStore';
import { formatMoney, formatDate, isUpcoming, isOverdue } from '@/utils/format';
import { mockCaseSources, mockWorkCases, mockTasks } from '../../../api/mock/data';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { matchedCases, fetchMatchedCases } = useCaseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { title: '在办案件', value: mockWorkCases.length, icon: <FolderKanban className="w-5 h-5" />, color: 'primary' as const, trend: { value: 12, isUp: true } },
    { title: '待处理任务', value: mockTasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length, icon: <FileText className="w-5 h-5" />, color: 'gold' as const },
    { title: '匹配案源', value: 12, icon: <Briefcase className="w-5 h-5" />, color: 'success' as const, trend: { value: 8, isUp: true } },
    { title: '本月创收', value: '¥128,500', icon: <TrendingUp className="w-5 h-5" />, color: 'warning' as const, trend: { value: 15, isUp: true } },
  ];

  const upcomingNodes = mockWorkCases.flatMap(c =>
    c.nodes
      .filter(n => n.reminder && !n.completed && (isUpcoming(n.date, 7) || isOverdue(n.date)))
      .map(n => ({ ...n, caseTitle: c.title, caseId: c.id }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  const caseTrendOption = {
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#DEE2E6' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#F8F9FA' } },
      axisLabel: { color: '#6B7280' },
    },
    series: [
      {
        name: '新增案件',
        type: 'line',
        smooth: true,
        data: [8, 12, 9, 15, 11, 14],
        lineStyle: { color: '#0A1628', width: 3 },
        itemStyle: { color: '#0A1628' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(10, 22, 40, 0.15)' },
              { offset: 1, color: 'rgba(10, 22, 40, 0)' },
            ],
          },
        },
      },
      {
        name: '结案数量',
        type: 'line',
        smooth: true,
        data: [5, 9, 7, 12, 10, 11],
        lineStyle: { color: '#C9A962', width: 3 },
        itemStyle: { color: '#C9A962' },
      },
    ],
    legend: { data: ['新增案件', '结案数量'], right: 0, top: 0 },
  };

  const causeDistributionOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 35, name: '合同纠纷', itemStyle: { color: '#0A1628' } },
          { value: 20, name: '劳动争议', itemStyle: { color: '#C9A962' } },
          { value: 15, name: '知识产权', itemStyle: { color: '#194BA0' } },
          { value: 12, name: '房产纠纷', itemStyle: { color: '#B23A48' } },
          { value: 10, name: '刑事辩护', itemStyle: { color: '#7593C6' } },
          { value: 8, name: '其他', itemStyle: { color: '#ADB5BD' } },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">工作台</h1>
          <p className="text-neutral-ink-500 mt-1">
            今天是 {formatDate(new Date(), 'YYYY年MM月DD日 dddd')}，祝您工作顺利
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/cases/publish')}
            className="lc-btn-outline flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            发布案源
          </button>
          <button
            onClick={() => navigate('/workspace')}
            className="lc-btn-primary flex items-center gap-2"
          >
            <FolderKanban className="w-4 h-4" />
            新建案件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <DataCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            onClick={() => {
              if (stat.title === '在办案件') navigate('/workspace');
              if (stat.title === '匹配案源') navigate('/cases');
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-2 lc-card border-0"
          title={<span className="font-serif text-base font-semibold">案件办理趋势</span>}
          extra={<span className="text-sm text-primary-500 cursor-pointer hover:underline">查看详情 →</span>}
        >
          <ReactECharts option={caseTrendOption} style={{ height: 300 }} />
        </Card>

        <Card
          className="lc-card border-0"
          title={<span className="font-serif text-base font-semibold">案件类型分布</span>}
        >
          <ReactECharts option={causeDistributionOption} style={{ height: 300 }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lc-card border-0"
          title={<span className="font-serif text-base font-semibold">近期诉讼节点</span>}
          extra={<span className="text-sm text-primary-500 cursor-pointer hover:underline">全部 →</span>}
        >
          {upcomingNodes.length > 0 ? (
            <div className="space-y-4">
              {upcomingNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-ink-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/workspace/case/${node.caseId}`)}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    isOverdue(node.date) ? 'bg-red-50' : isUpcoming(node.date, 3) ? 'bg-yellow-50' : 'bg-primary-50'
                  )}>
                    <Calendar className={cn(
                      'w-5 h-5',
                      isOverdue(node.date) ? 'text-accent-red' : isUpcoming(node.date, 3) ? 'text-yellow-600' : 'text-primary-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-neutral-ink-900 truncate">{node.name}</span>
                      <span className={cn(
                        'text-xs font-medium flex-shrink-0 ml-2',
                        isOverdue(node.date) ? 'text-accent-red' : isUpcoming(node.date, 3) ? 'text-yellow-600' : 'text-neutral-ink-500'
                      )}>
                        {isOverdue(node.date) ? '已逾期' : formatDate(node.date, 'MM-DD')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-ink-500 mt-1 truncate">{node.caseTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无待办节点" />
          )}
        </Card>

        <Card
          className="lc-card border-0"
          title={<span className="font-serif text-base font-semibold">为您推荐案源</span>}
          extra={<span className="text-sm text-primary-500 cursor-pointer hover:underline" onClick={() => navigate('/cases')}>更多 →</span>}
        >
          <div className="space-y-4">
            {mockCaseSources.slice(0, 3).map((cs) => (
              <div
                key={cs.id}
                onClick={() => navigate(`/cases/${cs.id}`)}
                className="p-3 rounded-lg hover:bg-neutral-ink-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm text-neutral-ink-900 line-clamp-1">{cs.title}</span>
                  <Tag color="gold" className="flex-shrink-0 ml-2">{cs.status === 'bidding' ? '竞标中' : '招募中'}</Tag>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-ink-500">
                  <span className="flex items-center gap-1">
                    <Gavel className="w-3 h-3" />
                    {formatMoney(cs.amount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {cs.bids.length}人竞标
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(cs.deadline, 'MM-DD')}截止
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {cs.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag} className="!m-0 !text-xs">{tag}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="lc-card border-0"
          title={<span className="font-serif text-base font-semibold">最近任务</span>}
          extra={<span className="text-sm text-primary-500 cursor-pointer hover:underline" onClick={() => navigate('/workspace/board')}>任务看板 →</span>}
        >
          <div className="space-y-3">
            {mockTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-ink-50 cursor-pointer transition-colors"
                onClick={() => navigate('/workspace/board')}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  task.priority === 'high' ? 'bg-accent-red' : task.priority === 'medium' ? 'bg-accent-gold' : 'bg-green-500'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-ink-900 truncate">{task.title}</span>
                    <Tag className="!m-0 !text-xs" color={
                      task.status === 'done' ? 'success' :
                      task.status === 'in_progress' ? 'processing' :
                      task.status === 'review' ? 'warning' : 'default'
                    }>
                      {task.status === 'todo' ? '待办' : task.status === 'in_progress' ? '进行中' : task.status === 'review' ? '审核中' : '已完成'}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar size={20} src={task.assigneeAvatar} />
                    <span className="text-xs text-neutral-ink-500">{task.assigneeName}</span>
                    <span className="text-xs text-neutral-ink-300">·</span>
                    <span className="text-xs text-neutral-ink-500">{task.caseTitle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default Dashboard;
