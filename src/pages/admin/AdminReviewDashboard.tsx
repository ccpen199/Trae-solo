import { useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  FileSearch,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { useStore } from '@/store';
import { mockAdminDashboard, mockReviewItems } from '@/mock/data';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTime, getRiskLevelColor } from '@/utils/helpers';
import type { ReviewItem } from '@/../shared/types';
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const aiReviewData = [
  { name: 'AI自动通过', value: 45, color: '#10B981' },
  { name: '待人工复核', value: 35, color: '#3B82F6' },
  { name: 'AI预警风险', value: 12, color: '#FF6B35' },
  { name: '自动驳回', value: 8, color: '#EF4444' },
];

const riskRadarData = [
  { dimension: '司法风险', value: 65 },
  { dimension: '经营异常', value: 40 },
  { dimension: '行政处罚', value: 55 },
  { dimension: '薪资异常', value: 30 },
  { dimension: '敏感词', value: 20 },
];

const riskLevelLabelMap: Record<string, string> = {
  none: '无风险',
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const typeLabelMap: Record<string, string> = {
  company: '企业',
  job: '岗位',
};

export default function AdminReviewDashboard() {
  const { setAdminDashboard, setReviewItems, adminDashboard } = useStore();

  useEffect(() => {
    setAdminDashboard(mockAdminDashboard);
    setReviewItems(mockReviewItems);
  }, [setAdminDashboard, setReviewItems]);

  const handleApprove = (id: string) => {
    console.log('通过审核:', id);
  };

  const handleReject = (id: string) => {
    console.log('驳回审核:', id);
  };

  const handleViewDetail = (id: string, type: string) => {
    console.log('查看详情:', id, type);
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">风控审核仪表盘</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="待审企业"
          value={adminDashboard?.pendingCompanyReviews ?? 0}
          icon={<Building2 className="h-6 w-6" />}
        />
        <StatCard
          title="待审岗位"
          value={adminDashboard?.pendingJobReviews ?? 0}
          icon={<FileSearch className="h-6 w-6" />}
        />
        <StatCard
          title="今日通过"
          value={adminDashboard?.approvedToday ?? 0}
          icon={<CheckCircle2 className="h-6 w-6" />}
          trend="+15%"
          trendUp={true}
        />
        <StatCard
          title="今日驳回"
          value={adminDashboard?.rejectedToday ?? 0}
          icon={<XCircle className="h-6 w-6" />}
          trend="-5%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI审核统计</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiReviewData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {aiReviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '占比']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">风险分布雷达图</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                />
                <Radar
                  name="风险指数"
                  dataKey="value"
                  stroke="#FF6B35"
                  fill="#FF6B35"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}`, '指数']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近期审核列表</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">提交时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">风险等级</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {(adminDashboard?.recentReviews || []).map((item: ReviewItem) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.type === 'company'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {typeLabelMap[item.type]}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {formatDateTime(item.submittedAt)}
                  </td>
                  <td className="py-4 px-4">
                    {item.riskLevel ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskLevelColor(
                          item.riskLevel
                        )}`}
                        style={{
                          backgroundColor:
                            item.riskLevel === 'none'
                              ? 'rgba(16, 185, 129, 0.1)'
                              : item.riskLevel === 'low'
                              ? 'rgba(59, 130, 246, 0.1)'
                              : item.riskLevel === 'medium'
                              ? 'rgba(255, 107, 53, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                        }}
                      >
                        {riskLevelLabelMap[item.riskLevel]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={item.status} type="review" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(item.id, item.type)}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        查看详情
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="flex items-center gap-1 text-sm text-success hover:text-success/80 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="flex items-center gap-1 text-sm text-danger hover:text-danger/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            驳回
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
