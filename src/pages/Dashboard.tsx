import { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  FileCheck,
  MessageSquareWarning,
  ShieldCheck,
  Hammer,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

interface DashboardStats {
  totalEnterprises: number;
  serviceApplications: number;
  activePolicies: number;
  pendingAppeals: number;
  creditReports: number;
  biddingProjects: number;
}

interface RecentApplication {
  id: string;
  enterpriseName: string;
  serviceName: string;
  submitDate: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
}

interface RecentAppeal {
  id: string;
  title: string;
  enterpriseName: string;
  submitDate: string;
  status: 'pending' | 'processing' | 'resolved';
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<RecentApplication[]>([]);
  const [appeals, setAppeals] = useState<RecentAppeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appsRes, appealsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent-applications'),
          fetch('/api/dashboard/recent-appeals'),
        ]);

        const statsData = await statsRes.json().catch(() => ({
          totalEnterprises: 128546,
          serviceApplications: 8642,
          activePolicies: 256,
          pendingAppeals: 342,
          creditReports: 5623,
          biddingProjects: 1823,
        }));
        const appsData = await appsRes.json().catch(() => [
          { id: '1', enterpriseName: '广东科技有限公司', serviceName: '高新技术企业认定', submitDate: '2024-01-15', status: 'processing' as const },
          { id: '2', enterpriseName: '深圳市创新科技集团', serviceName: '专精特新企业申报', submitDate: '2024-01-14', status: 'approved' as const },
          { id: '3', enterpriseName: '广州智能制造股份公司', serviceName: '技术改造补贴申请', submitDate: '2024-01-14', status: 'pending' as const },
          { id: '4', enterpriseName: '佛山新材料有限公司', serviceName: '研发费用加计扣除', submitDate: '2024-01-13', status: 'rejected' as const },
          { id: '5', enterpriseName: '东莞电子科技有限公司', serviceName: '进出口经营权备案', submitDate: '2024-01-12', status: 'approved' as const },
        ]);
        const appealsData = await appealsRes.json().catch(() => [
          { id: '1', title: '关于审批进度缓慢的投诉', enterpriseName: '广东科技有限公司', submitDate: '2024-01-15', status: 'processing' as const },
          { id: '2', title: '政策解读咨询', enterpriseName: '深圳市创新科技集团', submitDate: '2024-01-14', status: 'resolved' as const },
          { id: '3', title: '系统使用问题反馈', enterpriseName: '广州智能制造股份公司', submitDate: '2024-01-13', status: 'pending' as const },
          { id: '4', title: '申请材料补正说明', enterpriseName: '佛山新材料有限公司', submitDate: '2024-01-12', status: 'resolved' as const },
        ]);

        setStats(statsData);
        setApplications(appsData);
        setAppeals(appealsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applicationColumns = [
    { key: 'id', label: '申请编号' },
    { key: 'enterpriseName', label: '企业名称' },
    { key: 'serviceName', label: '服务事项' },
    { key: 'submitDate', label: '提交日期' },
    {
      key: 'status',
      label: '状态',
      render: (row: RecentApplication) => (
        <StatusBadge status={row.status}>
          {row.status === 'pending' && '待处理'}
          {row.status === 'processing' && '处理中'}
          {row.status === 'approved' && '已通过'}
          {row.status === 'rejected' && '已驳回'}
        </StatusBadge>
      ),
    },
    {
      key: 'action',
      label: '操作',
      render: () => (
        <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
          查看详情 <ArrowRight className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const appealColumns = [
    { key: 'id', label: '诉求编号' },
    { key: 'title', label: '诉求标题' },
    { key: 'enterpriseName', label: '企业名称' },
    { key: 'submitDate', label: '提交日期' },
    {
      key: 'status',
      label: '状态',
      render: (row: RecentAppeal) => (
        <StatusBadge status={row.status}>
          {row.status === 'pending' && '待处理'}
          {row.status === 'processing' && '处理中'}
          {row.status === 'resolved' && '已解决'}
        </StatusBadge>
      ),
    },
    {
      key: 'action',
      label: '操作',
      render: () => (
        <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
          查看详情 <ArrowRight className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="page-title">首页概览</h1>
        <p className="page-description">欢迎使用广东省涉企政务服务平台，查看最新数据统计和业务动态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="企业总数"
          value={stats?.totalEnterprises?.toLocaleString() || '0'}
          icon={Building2}
          trend={{ value: 12.5, isUp: true }}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="服务申请"
          value={stats?.serviceApplications?.toLocaleString() || '0'}
          icon={FileText}
          trend={{ value: 8.3, isUp: true }}
          iconColor="text-green-600"
        />
        <StatsCard
          title="有效政策"
          value={stats?.activePolicies || '0'}
          icon={FileCheck}
          trend={{ value: 5.2, isUp: true }}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="待办诉求"
          value={stats?.pendingAppeals || '0'}
          icon={MessageSquareWarning}
          trend={{ value: 3.1, isUp: false }}
          iconColor="text-orange-600"
        />
        <StatsCard
          title="信用报告"
          value={stats?.creditReports?.toLocaleString() || '0'}
          icon={ShieldCheck}
          trend={{ value: 15.7, isUp: true }}
          iconColor="text-cyan-600"
        />
        <StatsCard
          title="招标项目"
          value={stats?.biddingProjects?.toLocaleString() || '0'}
          icon={Hammer}
          trend={{ value: 6.8, isUp: true }}
          iconColor="text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">服务申请趋势</h3>
              <p className="text-sm text-gray-500">近7天申请数量统计</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>增长 23%</span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2 px-4">
            {[65, 45, 78, 52, 89, 67, 92].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#1a56db] to-[#3b82f6] rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-500">{['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">待办事项</h3>
              <p className="text-sm text-gray-500">需要您处理的紧急事项</p>
            </div>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {[
              { title: '高新技术企业认定待审核', count: 12, priority: 'high' as const },
              { title: '企业诉求待回复', count: 8, priority: 'medium' as const },
              { title: '政策文件待发布', count: 5, priority: 'low' as const },
              { title: '信用报告待生成', count: 15, priority: 'medium' as const },
              { title: '招标信息待审核', count: 3, priority: 'high' as const },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    item.priority === 'high' && 'bg-red-500',
                    item.priority === 'medium' && 'bg-yellow-500',
                    item.priority === 'low' && 'bg-green-500'
                  )} />
                  <span className="text-gray-700">{item.title}</span>
                </div>
                <span className="px-2 py-1 bg-[#1a56db]/10 text-[#1a56db] rounded-full text-sm font-medium">
                  {item.count} 项
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">最近服务申请</h3>
            <p className="text-sm text-gray-500">最新提交的服务申请记录</p>
          </div>
          <button className="btn-secondary text-sm">查看全部</button>
        </div>
        <DataTable columns={applicationColumns} data={applications} loading={loading} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">最新企业诉求</h3>
            <p className="text-sm text-gray-500">企业提交的最新诉求和投诉</p>
          </div>
          <button className="btn-secondary text-sm">查看全部</button>
        </div>
        <DataTable columns={appealColumns} data={appeals} loading={loading} />
      </div>
    </div>
  );
}
