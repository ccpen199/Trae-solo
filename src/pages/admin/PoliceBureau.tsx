import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  ArrowRightLeft,
  Key,
  Eye,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const identityQueue = [
  { id: 'v001', applicant: '赵六', idCard: '320583****3456', applyTime: '2026-06-10 09:15', status: 'pending' as const },
  { id: 'v002', applicant: '钱七', idCard: '320583****7890', applyTime: '2026-06-10 08:42', status: 'pending' as const },
  { id: 'v003', applicant: '孙八', idCard: '320583****2345', applyTime: '2026-06-09 16:30', status: 'pending' as const },
  { id: 'v004', applicant: '周九', idCard: '320583****6789', applyTime: '2026-06-09 14:20', status: 'approved' as const },
  { id: 'v005', applicant: '吴十', idCard: '320583****0123', applyTime: '2026-06-09 11:05', status: 'rejected' as const },
];

const certificateRecords = [
  { id: 'cr001', type: '居民身份证', holder: '赵六', issueDate: '2026-06-09', status: '已发放' },
  { id: 'cr002', type: '居住证', holder: '刘十一', issueDate: '2026-06-09', status: '已发放' },
  { id: 'cr003', type: '驾驶证', holder: '陈十二', issueDate: '2026-06-08', status: '制作中' },
  { id: 'cr004', type: '户口簿', holder: '王五', issueDate: '2026-06-08', status: '已发放' },
  { id: 'cr005', type: '行驶证', holder: '张三', issueDate: '2026-06-07', status: '已发放' },
];

const collaborationRequests = [
  { id: 'col001', from: '市人社局', type: '社保身份核验', applicant: '赵六', requestTime: '2026-06-10 10:30', status: 'waiting' as const },
  { id: 'col002', from: '市市场监管局', type: '营业执照法人核验', applicant: '钱七', requestTime: '2026-06-10 09:15', status: 'processing' as const },
  { id: 'col003', from: '市教育局', type: '入学资格核验', applicant: '孙八', requestTime: '2026-06-09 15:45', status: 'completed' as const },
  { id: 'col004', from: '市住建局', type: '购房资格核验', applicant: '周九', requestTime: '2026-06-09 11:20', status: 'waiting' as const },
];

const ssoSessions = [
  { id: 'sso001', user: '管理员A', system: '统一认证中心', loginTime: '2026-06-10 08:30', lastActivity: '2026-06-10 11:45', ip: '10.0.10.1' },
  { id: 'sso002', user: '审核员B', system: '审批系统', loginTime: '2026-06-10 09:00', lastActivity: '2026-06-10 11:30', ip: '10.0.10.2' },
  { id: 'sso003', user: '窗口C', system: '窗口办理系统', loginTime: '2026-06-10 08:45', lastActivity: '2026-06-10 11:20', ip: '10.0.10.3' },
  { id: 'sso004', user: '核验员D', system: '实名认证系统', loginTime: '2026-06-10 09:30', lastActivity: '2026-06-10 10:50', ip: '10.0.10.4' },
];

const weeklyVerifications = [
  { day: '周一', count: 156 },
  { day: '周二', count: 189 },
  { day: '周三', count: 203 },
  { day: '周四', count: 178 },
  { day: '周五', count: 195 },
  { day: '周六', count: 82 },
  { day: '周日', count: 45 },
];

type IdentityStatus = 'pending' | 'approved' | 'rejected';
type CollabStatus = 'waiting' | 'processing' | 'completed';

const statusConfig: Record<IdentityStatus, { label: string; cls: string }> = {
  pending: { label: '待核验', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700' },
};

const collabStatusConfig: Record<CollabStatus, { label: string; cls: string }> = {
  waiting: { label: '待处理', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: '处理中', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function PoliceBureau() {
  const [verifications, setVerifications] = useState(identityQueue);

  const handleVerify = (id: string, action: 'approved' | 'rejected') => {
    setVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: action as IdentityStatus } : v))
    );
  };

  const pendingCount = verifications.filter((v) => v.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="gov-section-title">
          <Shield className="w-5 h-5 text-gov-blue" />
          市公安局管理
        </h2>
        <div className="flex items-center gap-2">
          <span className="gov-badge bg-amber-100 text-amber-700">{pendingCount} 待核验</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: '今日身份核验', value: '347', icon: Users, color: 'from-blue-600 to-blue-400' },
          { label: '今日证照发放', value: '128', icon: FileText, color: 'from-emerald-600 to-teal-400' },
          { label: '跨部门协同', value: '56', icon: ArrowRightLeft, color: 'from-violet-600 to-purple-400' },
          { label: '活跃SSO会话', value: '23', icon: Key, color: 'from-amber-500 to-orange-400' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="gov-stat-card relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-full`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gov-text-secondary">{card.label}</p>
                  <p className="text-2xl font-bold text-gov-text mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <Users className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">实名认证审核</h3>
            <span className="gov-badge bg-amber-100 text-amber-700 ml-auto">{pendingCount} 待审核</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gov-border text-gov-text-secondary bg-gov-bg">
                  <th className="text-left py-3 px-4 font-medium">申请人</th>
                  <th className="text-left py-3 px-4 font-medium">证件号</th>
                  <th className="text-left py-3 px-4 font-medium">申请时间</th>
                  <th className="text-center py-3 px-4 font-medium">核验状态</th>
                  <th className="text-center py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => {
                  const cfg = statusConfig[v.status];
                  return (
                    <tr key={v.id} className="border-b border-gov-border hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 text-gov-text font-medium">{v.applicant}</td>
                      <td className="py-3 px-4 text-gov-text-secondary font-mono text-xs">{v.idCard}</td>
                      <td className="py-3 px-4 text-gov-text-secondary whitespace-nowrap">{v.applyTime}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`gov-badge ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {v.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerify(v.id, 'approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="通过"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerify(v.id, 'rejected')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="驳回"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gov-text-secondary">已处理</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">
            <Clock className="w-5 h-5 text-gov-blue" />
            本周核验趋势
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyVerifications}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="count" fill="#1A56DB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">证照发放记录</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gov-border text-gov-text-secondary bg-gov-bg">
                  <th className="text-left py-3 px-4 font-medium">证照类型</th>
                  <th className="text-left py-3 px-4 font-medium">持有人</th>
                  <th className="text-left py-3 px-4 font-medium">发放日期</th>
                  <th className="text-center py-3 px-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {certificateRecords.map((cr) => (
                  <tr key={cr.id} className="border-b border-gov-border hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 text-gov-text font-medium">{cr.type}</td>
                    <td className="py-3 px-4 text-gov-text-secondary">{cr.holder}</td>
                    <td className="py-3 px-4 text-gov-text-secondary whitespace-nowrap">{cr.issueDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`gov-badge ${cr.status === '已发放' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {cr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">跨部门协同请求</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gov-border text-gov-text-secondary bg-gov-bg">
                  <th className="text-left py-3 px-4 font-medium">来源部门</th>
                  <th className="text-left py-3 px-4 font-medium">核验类型</th>
                  <th className="text-left py-3 px-4 font-medium">申请人</th>
                  <th className="text-center py-3 px-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {collaborationRequests.map((cr) => {
                  const cfg = collabStatusConfig[cr.status];
                  return (
                    <tr key={cr.id} className="border-b border-gov-border hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 text-gov-text font-medium">{cr.from}</td>
                      <td className="py-3 px-4 text-gov-text-secondary">{cr.type}</td>
                      <td className="py-3 px-4 text-gov-text-secondary">{cr.applicant}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`gov-badge ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
          <Key className="w-4 h-4 text-gov-blue" />
          <h3 className="font-medium text-gov-text">单点登录会话</h3>
          <span className="text-sm text-gov-text-secondary ml-2">{ssoSessions.length} 个活跃会话</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gov-border text-gov-text-secondary bg-gov-bg">
                <th className="text-left py-3 px-4 font-medium">用户</th>
                <th className="text-left py-3 px-4 font-medium">接入系统</th>
                <th className="text-left py-3 px-4 font-medium">登录时间</th>
                <th className="text-left py-3 px-4 font-medium">最后活动</th>
                <th className="text-left py-3 px-4 font-medium">IP地址</th>
                <th className="text-center py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {ssoSessions.map((s) => (
                <tr key={s.id} className="border-b border-gov-border hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 text-gov-text font-medium">{s.user}</td>
                  <td className="py-3 px-4 text-gov-text-secondary">{s.system}</td>
                  <td className="py-3 px-4 text-gov-text-secondary whitespace-nowrap">{s.loginTime}</td>
                  <td className="py-3 px-4 text-gov-text-secondary whitespace-nowrap">{s.lastActivity}</td>
                  <td className="py-3 px-4 text-gov-text-secondary font-mono text-xs">{s.ip}</td>
                  <td className="py-3 px-4 text-center">
                    <button className="p-1.5 text-gov-text-secondary hover:text-gov-blue transition-colors" title="查看详情">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
