import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, Building2, Store, Stethoscope, TrendingUp,
  Clock, Eye, CheckCircle2, XCircle, Search, BarChart3, Activity,
  AlertTriangle, ClipboardList, FileText, Lock, PenTool, UserCheck,
  RotateCcw, Pill, ShoppingCart, MapPin, Calendar, Syringe, Bug, Heart,
  ChevronRight, ArrowRight, BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

type TabId = 'owner' | 'doctor' | 'hospital' | 'merchant' | 'review' | 'prescription' | 'audit';

const tabs: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'owner', label: '宠主台账', Icon: Users },
  { id: 'doctor', label: '医生台账', Icon: Stethoscope },
  { id: 'hospital', label: '医院台账', Icon: Building2 },
  { id: 'merchant', label: '商家台账', Icon: Store },
  { id: 'review', label: '资质审核', Icon: ShieldCheck },
  { id: 'prescription', label: '处方监管', Icon: Pill },
  { id: 'audit', label: '审计日志', Icon: ClipboardList },
];

const ownerLedger = [
  { id: 'U100001', nickname: '张小明', phone: '138****0001', pets: 2, consultations: 12, orders: 8, status: 'active' as const },
  { id: 'U100002', nickname: '李小红', phone: '138****0002', pets: 1, consultations: 5, orders: 3, status: 'active' as const },
  { id: 'U100003', nickname: '王大伟', phone: '135****0001', pets: 3, consultations: 0, orders: 0, status: 'disabled' as const },
  { id: 'U100004', nickname: '赵小芳', phone: '139****0099', pets: 1, consultations: 2, orders: 1, status: 'active' as const },
  { id: 'U100005', nickname: '孙丽丽', phone: '136****0001', pets: 2, consultations: 8, orders: 15, status: 'active' as const },
];

const doctorLedger = [
  { id: 'D001', name: '王建国', phone: '139****0001', dept: '内科', title: '主治医师', license: 'VET-BJ-2024-00891', licenseStatus: 'approved' as const, consults: 486, prescriptions: 128, rating: 4.9 },
  { id: 'D002', name: '李芳', phone: '139****0002', dept: '外科', title: '副主任医师', license: 'VET-BJ-2024-00892', licenseStatus: 'approved' as const, consults: 312, prescriptions: 89, rating: 4.7 },
  { id: 'D003', name: '孙医生', phone: '139****5678', dept: '内科', title: '住院医师', license: '2020110110000123', licenseStatus: 'pending' as const, consults: 0, prescriptions: 0, rating: 0 },
  { id: 'D004', name: '赵敏', phone: '139****0004', dept: '皮肤科', title: '主治医师', license: 'VET-BJ-2024-00894', licenseStatus: 'rejected' as const, consults: 23, prescriptions: 5, rating: 3.2 },
  { id: 'D005', name: '陈伟', phone: '139****0005', dept: '影像科', title: '主治医师', license: 'VET-BJ-2024-00895', licenseStatus: 're_review' as const, consults: 156, prescriptions: 42, rating: 4.5 },
];

const hospitalLedger = [
  { id: 'H001', name: '爱宠动物医院（总院）', phone: '010-12345678', license: '91110105MA01234567', licenseStatus: 'approved' as const, doctors: 5, services: 3, rating: 4.8, reviews: 2356 },
  { id: 'H002', name: '宠物之家诊疗中心', phone: '010-87654321', license: '91110105MA0ABCDE12', licenseStatus: 'approved' as const, doctors: 3, services: 2, rating: 4.6, reviews: 1089 },
  { id: 'H003', name: '瑞康宠物医院', phone: '010-66668888', license: 'BJ-CW-2024-0156', licenseStatus: 'pending' as const, doctors: 0, services: 0, rating: 0, reviews: 0 },
  { id: 'H004', name: '宠乐康动物诊所', phone: '010-55557777', license: '91110105MA0XYZ9876', licenseStatus: 'rejected' as const, doctors: 2, services: 1, rating: 3.5, reviews: 42 },
];

const merchantLedger = [
  { id: 'M001', name: '宠物优选商城', phone: '136****0001', license: '91110106MA0ABCDEF12', licenseStatus: 'approved' as const, skuCount: 256, orders: 1847, gmv: '¥486K' },
  { id: 'M002', name: '爱宠优选供应链', phone: '136****8888', license: 'BJ-YAOPIN-2024-00234', licenseStatus: 'pending' as const, skuCount: 0, orders: 0, gmv: '¥0' },
  { id: 'M003', name: '萌宠食品专营', phone: '136****0002', license: '91110106MA0PQR56789', licenseStatus: 'approved' as const, skuCount: 128, orders: 923, gmv: '¥215K' },
  { id: 'M004', name: '宠宝器械店', phone: '136****0003', license: '91110106MA0DEF12345', licenseStatus: 're_review' as const, skuCount: 45, orders: 67, gmv: '¥32K' },
];

const reviewItems = [
  { id: 'DOC2024NEW021', type: 'doctor' as const, name: '孙医生', submitted: '2026-06-14 14:28', status: 'pending' as const, materials: 5, auditTrail: 1 },
  { id: 'HOS-2026-06-128', type: 'hospital' as const, name: '瑞康宠物医院', submitted: '2026-06-14 11:05', status: 'pending' as const, materials: 5, auditTrail: 1 },
  { id: 'MER-2026-06-086', type: 'merchant' as const, name: '爱宠优选供应链', submitted: '2026-06-14 09:30', status: 'pending' as const, materials: 5, auditTrail: 1 },
  { id: 'APPEAL-0521', type: 'user' as const, name: '违规账号申诉', submitted: '2026-06-13 18:42', status: 'pending' as const, materials: 3, auditTrail: 2 },
  { id: 'DOC-REVIEW-D004', type: 'doctor' as const, name: '赵敏（皮肤科）', submitted: '2026-06-10 09:00', status: 'rejected' as const, materials: 4, auditTrail: 3 },
  { id: 'HOS-REVIEW-H004', type: 'hospital' as const, name: '宠乐康动物诊所', submitted: '2026-06-08 14:20', status: 'rejected' as const, materials: 3, auditTrail: 4 },
  { id: 'DOC-REVIEW-D005', type: 'doctor' as const, name: '陈伟（影像科）', submitted: '2026-06-12 16:00', status: 're_review' as const, materials: 6, auditTrail: 5 },
  { id: 'MER-REVIEW-M004', type: 'merchant' as const, name: '宠宝器械店', submitted: '2026-06-11 10:30', status: 're_review' as const, materials: 4, auditTrail: 3 },
  { id: 'DOC-APPROVED-D001', type: 'doctor' as const, name: '王建国（内科）', submitted: '2026-06-01 10:00', status: 'approved' as const, materials: 5, auditTrail: 3 },
];

const prescriptionMonitor = [
  { id: 'RX-20260616-001', drug: '拜宠爽体外驱虫滴剂', doctor: '王建国', doctorSigned: true, ownerAcknowledged: true, status: 'approved' as const, createdAt: '2026-06-16 10:30' },
  { id: 'RX-20260615-023', drug: '头孢克洛片（宠用）', doctor: '李芳', doctorSigned: true, ownerAcknowledged: false, status: 'pending_owner' as const, createdAt: '2026-06-15 15:20' },
  { id: 'RX-20260614-018', drug: '甲硝唑注射液', doctor: '王建国', doctorSigned: true, ownerAcknowledged: true, status: 'approved' as const, createdAt: '2026-06-14 09:45' },
  { id: 'RX-20260613-007', drug: '伊维菌素滴剂', doctor: '孙医生', doctorSigned: false, ownerAcknowledged: false, status: 'pending_doctor' as const, createdAt: '2026-06-13 18:00' },
  { id: 'RX-20260612-003', drug: '地塞米松磷酸钠', doctor: '陈伟', doctorSigned: true, ownerAcknowledged: true, status: 'merchant_review' as const, createdAt: '2026-06-12 11:30' },
];

const auditLogs = [
  { time: '2026-06-16 10:32', action: '资质审核通过', user: 'admin', target: '医生-李静怡 VET-BJ-00892', result: '通过', detail: '执业证/资格证/学历均核验通过' },
  { time: '2026-06-16 10:08', action: '资质审核通过', user: 'admin', target: '医院-宠乐康 HOS-REVIEW-H004', result: '驳回', detail: '环评报告缺失，诊疗许可证范围不匹配' },
  { time: '2026-06-16 09:45', action: '处方双签完成', user: 'doctor-王建国', target: 'RX-20260614-018', result: '通过', detail: '医生签名+宠主知情确认+复核通过' },
  { time: '2026-06-16 09:12', action: '评价反作弊', user: 'admin', target: '评论文ID892 (疑似刷单)', result: '已处理', detail: 'IP/设备指纹异常，评价已清除' },
  { time: '2026-06-16 08:30', action: '账号禁用', user: 'admin', target: '用户-水军账号008', result: '生效', detail: '批量评价作弊，anti_fraud_score 0.89' },
  { time: '2026-06-15 17:00', action: '资质复审提交', user: 'doctor-陈伟', target: 'DOC-REVIEW-D005', result: '待审', detail: '补充提交学历学位证书+在职证明' },
  { time: '2026-06-15 14:20', action: '处方流转', user: 'doctor-李芳', target: 'RX-20260615-023', result: '待确认', detail: '医生已签名，等待宠主知情确认' },
  { time: '2026-06-15 10:00', action: '商家资质驳回', user: 'platform', target: 'MER-2026-06-086', result: '驳回', detail: 'GSP认证证书不完整，药品经营许可需补充' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'bg-forest-100 text-forest-700' },
  disabled: { label: '已禁用', color: 'bg-red-100 text-red-700' },
  pending: { label: '待审核', color: 'bg-warm-100 text-warm-600' },
  approved: { label: '已通过', color: 'bg-forest-100 text-forest-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  re_review: { label: '复审中', color: 'bg-purple-100 text-purple-700' },
  pending_doctor: { label: '待医生签名', color: 'bg-warm-100 text-warm-600' },
  pending_owner: { label: '待宠主确认', color: 'bg-blue-100 text-blue-700' },
  merchant_review: { label: '商家复核中', color: 'bg-sky-100 text-sky-700' },
};

const reviewTypeConfig: Record<string, { color: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = {
  doctor: { color: 'from-blue-100 to-sky-200 text-blue-700', Icon: Stethoscope, label: '医生' },
  hospital: { color: 'from-orange-100 to-amber-200 text-orange-700', Icon: Building2, label: '医院' },
  merchant: { color: 'from-rose-100 to-pink-200 text-rose-700', Icon: Store, label: '商家' },
  user: { color: 'from-red-100 to-orange-200 text-red-700', Icon: AlertTriangle, label: '申诉' },
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('owner');
  const [processing, setProcessing] = useState<string | null>(null);

  const handleReject = (id: string) => {
    setProcessing(`reject-${id}`);
    setTimeout(() => setProcessing(null), 600);
  };

  const handleApprove = (id: string) => {
    setProcessing(`approve-${id}`);
    setTimeout(() => setProcessing(null), 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '超级管理员'} 控制台</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              四大业务台账 · 资质全状态审核 · 处方监管 · 审计留痕
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索编号/姓名/证号..." className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '注册宠主', value: '28,465', Icon: Users, color: 'from-forest-400 to-emerald-600' },
          { label: '认证医生', value: '386', Icon: Stethoscope, color: 'from-blue-400 to-sky-600' },
          { label: '入驻医院', value: '128', Icon: Building2, color: 'from-orange-400 to-amber-600' },
          { label: '合规商家', value: '96', Icon: Store, color: 'from-rose-400 to-pink-600' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="card !p-4 flex items-center gap-3 relative overflow-hidden">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-[10px] text-gray-500">{label}</div>
            </div>
            <TrendingUp className="w-3 h-3 text-forest-500 absolute top-2 right-2" />
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-white text-purple-700 border border-gray-200 border-b-white -mb-px shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'owner' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">宠主业务台账</h2>
              <span className="text-xs text-gray-500">共 {ownerLedger.length} 条</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">ID</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">昵称</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">手机号</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">宠物数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">问诊数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">订单数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {ownerLedger.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{u.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{u.nickname}</td>
                      <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{u.phone}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{u.pets}</td>
                      <td className="py-2.5 px-3 text-center">{u.consultations}</td>
                      <td className="py-2.5 px-3 text-center">{u.orders}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[u.status]?.color)}>
                          {statusMap[u.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'doctor' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">医生业务台账</h2>
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => (
                  <span key={s} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {doctorLedger.filter(d => d.licenseStatus === s).length}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">姓名</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">科室/职称</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">执业证号</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">问诊数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">处方数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评分</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorLedger.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{d.name}</td>
                      <td className="py-2.5 px-3 text-gray-600">{d.dept} · {d.title}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{d.license}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[d.licenseStatus]?.color)}>
                          {statusMap[d.licenseStatus]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">{d.consults}</td>
                      <td className="py-2.5 px-3 text-center">{d.prescriptions}</td>
                      <td className="py-2.5 px-3 text-center">{d.rating > 0 ? d.rating.toFixed(1) : '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (d.licenseStatus === 'pending' || d.licenseStatus === 're_review') {
                              navigate(`/admin/review/DOC${d.id === 'D003' ? '2024NEW021' : '-REVIEW-' + d.id}`);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'hospital' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">医院业务台账</h2>
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => (
                  <span key={s} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {hospitalLedger.filter(h => h.licenseStatus === s).length}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医院名称</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">证号/许可</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医生数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">服务数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评分</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评价数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalLedger.map((h) => (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{h.name}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{h.license}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[h.licenseStatus]?.color)}>
                          {statusMap[h.licenseStatus]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">{h.doctors}</td>
                      <td className="py-2.5 px-3 text-center">{h.services}</td>
                      <td className="py-2.5 px-3 text-center">{h.rating > 0 ? h.rating.toFixed(1) : '-'}</td>
                      <td className="py-2.5 px-3 text-center">{h.reviews}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'merchant' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">商家业务台账</h2>
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => (
                  <span key={s} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {merchantLedger.filter(m => m.licenseStatus === s).length}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">商家名称</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">证号/许可</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">SKU数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">订单数</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">GMV</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantLedger.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{m.name}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{m.license}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[m.licenseStatus]?.color)}>
                          {statusMap[m.licenseStatus]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">{m.skuCount}</td>
                      <td className="py-2.5 px-3 text-center">{m.orders}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{m.gmv}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => {
                const count = reviewItems.filter(r => r.status === s).length;
                return (
                  <span key={s} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {count}
                  </span>
                );
              })}
            </div>
            <div className="space-y-3">
              {reviewItems.map((item) => {
                const cfg = reviewTypeConfig[item.type];
                return (
                  <div key={item.id} onClick={() => navigate(`/admin/review/${item.id}`)} className="card cursor-pointer hover:border-purple-200 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shrink-0`}>
                        <cfg.Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-br ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-[10px] font-mono text-gray-400">{item.id}</span>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[item.status]?.color)}>
                            {statusMap[item.status]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-gray-400">
                          <span>🕒 提交于 {item.submitted}</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> 材料 {item.materials} 份</span>
                          <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> 审计记录 {item.auditTrail} 条</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/admin/review/${item.id}`)} className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReject(item.id)}
                              disabled={!!processing}
                              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {processing === `reject-${item.id}` ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              驳回
                            </button>
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={!!processing}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white hover:shadow-md transition-all text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {processing === `approve-${item.id}` ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              通过
                            </button>
                          </>
                        )}
                        {item.status === 'rejected' && (
                          <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" />已驳回 · 可查看驳回原因</span>
                        )}
                        {item.status === 're_review' && (
                          <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-1"><RotateCcw className="w-3 h-3" />复审中 · 已补充材料</span>
                        )}
                        {item.status === 'approved' && (
                          <span className="text-[10px] text-forest-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />已通过</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 space-y-3 border-purple-100">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">审核闭环说明</span>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-warm-600 font-bold mb-1">待审核</p>
                  <p className="text-gray-600">材料提交 → 人工审核 → 通过/驳回</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-red-600 font-bold mb-1">已驳回</p>
                  <p className="text-gray-600">可补充材料 → 重新提交 → 进入复审</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-purple-600 font-bold mb-1">复审中</p>
                  <p className="text-gray-600">补充材料审核 → 二次判定 → 闭环</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">已通过</p>
                  <p className="text-gray-600">资质激活 → 全程审计留痕 → 可追溯</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescription' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {(['pending_doctor', 'pending_owner', 'approved', 'merchant_review'] as const).map((s) => {
                const count = prescriptionMonitor.filter(p => p.status === s).length;
                return (
                  <span key={s} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {count}
                  </span>
                );
              })}
            </div>
            <div className="space-y-3">
              {prescriptionMonitor.map((rx) => (
                <div key={rx.id} className="card space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warm-100 to-orange-200 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5 text-warm-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{rx.drug}</span>
                        <span className="text-[10px] font-mono text-gray-400">{rx.id}</span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[rx.status]?.color)}>
                          {statusMap[rx.status]?.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">开具医生：{rx.doctor} · 创建时间：{rx.createdAt}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      rx.doctorSigned ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', rx.doctorSigned ? 'bg-forest-100' : 'bg-gray-100')}>
                        <PenTool className={cn('w-4 h-4', rx.doctorSigned ? 'text-forest-600' : 'text-gray-400')} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-800">① 医生签名</p>
                        <p className={cn('text-[10px]', rx.doctorSigned ? 'text-forest-600' : 'text-gray-400')}>
                          {rx.doctorSigned ? `✓ ${rx.doctor} 已签名` : '等待签名'}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      rx.ownerAcknowledged ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', rx.ownerAcknowledged ? 'bg-forest-100' : 'bg-gray-100')}>
                        <UserCheck className={cn('w-4 h-4', rx.ownerAcknowledged ? 'text-forest-600' : 'text-gray-400')} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-800">② 宠主确认</p>
                        <p className={cn('text-[10px]', rx.ownerAcknowledged ? 'text-forest-600' : 'text-gray-400')}>
                          {rx.ownerAcknowledged ? '✓ 已知情确认' : '等待确认'}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      rx.status === 'approved' ? 'bg-forest-50 border-forest-200' :
                      rx.status === 'merchant_review' ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        rx.status === 'approved' ? 'bg-forest-100' :
                        rx.status === 'merchant_review' ? 'bg-sky-100' : 'bg-gray-100'
                      )}>
                        {rx.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-forest-600" /> :
                         rx.status === 'merchant_review' ? <ShoppingCart className="w-4 h-4 text-sky-600" /> :
                         <Clock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-800">③ 复核/发货</p>
                        <p className={cn(
                          'text-[10px]',
                          rx.status === 'approved' ? 'text-forest-600' :
                          rx.status === 'merchant_review' ? 'text-sky-600' : 'text-gray-400'
                        )}>
                          {rx.status === 'approved' ? '✓ 双签通过' :
                           rx.status === 'merchant_review' ? '商家复核中' : '待前序步骤'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card bg-gradient-to-br from-warm-50 to-orange-50 space-y-3 border-warm-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-warm-600" />
                <span className="font-semibold text-warm-800 text-sm">处方流转监管说明</span>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-warm-600 font-bold mb-1">医生签名</p>
                  <p className="text-gray-600">执业兽医师电子签名 + 执业证号留痕</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-blue-600 font-bold mb-1">宠主确认</p>
                  <p className="text-gray-600">用药风险知情确认 + 确认记录留痕</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">复核通过</p>
                  <p className="text-gray-600">双签验证 + 处方解锁购买</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-sky-600 font-bold mb-1">商家发货</p>
                  <p className="text-gray-600">合规发货 + 处方药全程追溯</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900">操作审计日志</h2>
            <div className="space-y-2">
              {auditLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-gray-800 text-xs">{log.action}</span>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        log.result === '通过' ? 'bg-forest-100 text-forest-700' :
                        log.result === '驳回' ? 'bg-red-100 text-red-700' :
                        log.result === '待审' ? 'bg-warm-100 text-warm-600' :
                        log.result === '待确认' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {log.result}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      <span className="text-purple-600 font-semibold">{log.user}</span> → {log.target}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{log.detail}</div>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono shrink-0">{log.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
