import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  Settings,
  Bell,
  User,
  TrendingUp,
  Eye,
  Star,
  Award,
  LogOut,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronDown,
  FileCheck,
  Sliders,
  Image,
  BadgeCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store';

const menuItems = [
  { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
  { id: 'designers', label: '设计师审核', icon: ShieldCheck },
  { id: 'caseReview', label: '案例审核', icon: FileCheck },
  { id: 'qualityRating', label: '质量评分', icon: Star },
  { id: 'settings', label: '系统设置', icon: Settings },
];

const cityDistribution = [
  { city: '北京', cases: 2850 },
  { city: '上海', cases: 3200 },
  { city: '广州', cases: 1680 },
  { city: '深圳', cases: 2100 },
  { city: '杭州', cases: 1420 },
  { city: '成都', cases: 980 },
  { city: '武汉', cases: 760 },
  { city: '南京', cases: 590 },
];

const dailyActivity = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}日`,
  users: Math.floor(2000 + Math.random() * 3000),
  cases: Math.floor(50 + Math.random() * 150),
}));

type DesignerStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

interface PendingDesigner {
  id: string;
  name: string;
  avatar: string;
  certificationNo: string;
  years: number;
  applyTime: string;
  company: string;
  status: DesignerStatus;
  approvedTime?: string;
  rejectReason?: string;
  certificates: string[];
  portfolio: string[];
  ratingPreview: number;
}

const pendingDesigners: PendingDesigner[] = [
  { id: 'd1', name: '李明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming', certificationNo: 'CERT20240101', years: 6, applyTime: '2024-06-12 10:30', company: '创艺装饰', status: 'pending', certificates: ['https://picsum.photos/seed/cert1a/200/140', 'https://picsum.photos/seed/cert1b/200/140'], portfolio: ['https://picsum.photos/seed/port1a/120/90', 'https://picsum.photos/seed/port1b/120/90', 'https://picsum.photos/seed/port1c/120/90'], ratingPreview: 4.5 },
  { id: 'd2', name: '王芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang', certificationNo: 'CERT20240102', years: 10, applyTime: '2024-06-11 14:20', company: '美学工坊', status: 'pending', certificates: ['https://picsum.photos/seed/cert2a/200/140', 'https://picsum.photos/seed/cert2b/200/140'], portfolio: ['https://picsum.photos/seed/port2a/120/90', 'https://picsum.photos/seed/port2b/120/90', 'https://picsum.photos/seed/port2c/120/90'], ratingPreview: 4.8 },
  { id: 'd3', name: '张伟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', certificationNo: 'CERT20240103', years: 4, applyTime: '2024-06-11 09:15', company: '极客设计', status: 'pending', certificates: ['https://picsum.photos/seed/cert3a/200/140'], portfolio: ['https://picsum.photos/seed/port3a/120/90', 'https://picsum.photos/seed/port3b/120/90'], ratingPreview: 3.9 },
  { id: 'd4', name: '刘洋', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang', certificationNo: 'CERT20240104', years: 8, applyTime: '2024-06-10 16:45', company: '筑梦空间', status: 'pending', certificates: ['https://picsum.photos/seed/cert4a/200/140', 'https://picsum.photos/seed/cert4b/200/140'], portfolio: ['https://picsum.photos/seed/port4a/120/90', 'https://picsum.photos/seed/port4b/120/90', 'https://picsum.photos/seed/port4c/120/90'], ratingPreview: 4.2 },
  { id: 'd5', name: '陈静', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing', certificationNo: 'CERT20240105', years: 3, applyTime: '2024-06-10 11:00', company: '青年设计', status: 'pending', certificates: ['https://picsum.photos/seed/cert5a/200/140'], portfolio: ['https://picsum.photos/seed/port5a/120/90', 'https://picsum.photos/seed/port5b/120/90'], ratingPreview: 3.7 },
];

type ScoreStatus = 'unscored' | 'scoring' | 'scored';

interface ScoreCase {
  id: string;
  title: string;
  designer: string;
  cover: string;
  completeness: number;
  photoQuality: number;
  dataAccuracy: number;
  designScore: number;
  scoreStatus: ScoreStatus;
}

const initialScoreCases: ScoreCase[] = [
  { id: 'c1', title: '杭州滨江·现代简约三居室', designer: '张设计师', cover: 'https://picsum.photos/seed/score1/80/60', completeness: 4.5, photoQuality: 4.3, dataAccuracy: 4.6, designScore: 4.4, scoreStatus: 'unscored' },
  { id: 'c2', title: '上海浦东·新中式复式', designer: '李设计师', cover: 'https://picsum.photos/seed/score2/80/60', completeness: 4.2, photoQuality: 4.8, dataAccuracy: 4.1, designScore: 4.7, scoreStatus: 'scoring' },
  { id: 'c3', title: '北京朝阳·北欧风格两居室', designer: '王设计师', cover: 'https://picsum.photos/seed/score3/80/60', completeness: 4.7, photoQuality: 4.5, dataAccuracy: 4.8, designScore: 4.6, scoreStatus: 'scored' },
];

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [designerList, setDesignerList] = useState<PendingDesigner[]>(pendingDesigners);
  const [scoreCases, setScoreCases] = useState<ScoreCase[]>(initialScoreCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialScoreCases[0].id);
  const [reviewingDesigner, setReviewingDesigner] = useState<PendingDesigner | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const { user, clearUser } = useAppStore();

  const stats = [
    { label: '总用户数', value: 89560, icon: Users, color: 'from-blue-500 to-indigo-600', change: '+1.2k' },
    { label: '设计师数', value: 3680, icon: Award, color: 'from-violet-500 to-purple-600', change: '+28' },
    { label: '案例数', value: 12580, icon: FileText, color: 'from-teal-500 to-cyan-600', change: '+156' },
    { label: '待审核设计师', value: 42, icon: ShieldCheck, color: 'from-amber-500 to-orange-600', change: '+5' },
    { label: '待审核案例', value: 78, icon: Clock, color: 'from-pink-500 to-rose-600', change: '+12' },
    { label: '今日访问量', value: 15680, icon: Eye, color: 'from-emerald-500 to-green-600', change: '+8.5%' },
  ];

  const handleOpenReview = (d: PendingDesigner) => {
    setDesignerList((prev) =>
      prev.map((item) => (item.id === d.id ? { ...item, status: 'reviewing' as DesignerStatus } : item))
    );
    setReviewingDesigner({ ...d, status: 'reviewing' });
    setRejectReasonInput('');
  };

  const handleApproveDesigner = (id: string) => {
    const now = new Date().toLocaleString('zh-CN');
    setDesignerList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' as DesignerStatus, approvedTime: now } : item))
    );
    setReviewingDesigner(null);
  };

  const handleRejectDesigner = (id: string) => {
    const reason = rejectReasonInput.trim() || '资质不符合平台要求';
    setDesignerList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' as DesignerStatus, rejectReason: reason } : item))
    );
    setReviewingDesigner(null);
  };

  const handleScoreChange = (caseId: string, field: keyof Omit<ScoreCase, 'id' | 'title' | 'designer' | 'cover' | 'scoreStatus'>, value: number) => {
    setScoreCases(scoreCases.map((c) => {
      if (c.id !== caseId) return c;
      const updated = { ...c, [field]: Math.min(5, Math.max(0, value)) };
      if (updated.scoreStatus === 'unscored') updated.scoreStatus = 'scoring';
      return updated;
    }));
  };

  const handleConfirmScore = (caseId: string) => {
    setScoreCases(scoreCases.map((c) => (c.id === caseId ? { ...c, scoreStatus: 'scored' as ScoreStatus } : c)));
  };

  const handleSaveScore = (caseId: string) => {
    setScoreCases(scoreCases.map((c) => (c.id === caseId ? { ...c, scoreStatus: 'scoring' as ScoreStatus } : c)));
  };

  const selectedCase = scoreCases.find((c) => c.id === selectedCaseId);
  const totalScore = selectedCase
    ? +(selectedCase.completeness * 0.3 + selectedCase.photoQuality * 0.25 + selectedCase.dataAccuracy * 0.25 + selectedCase.designScore * 0.2).toFixed(2)
    : 0;

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">各城市案例分布</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="city" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Bar dataKey="cases" fill="#0F766E" radius={[6, 6, 0, 0]} name="案例数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">近30日活跃度</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#6B7280" fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="users" stroke="#0F766E" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} name="活跃用户" />
                <Area type="monotone" dataKey="cases" stroke="#F97316" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2} name="新增案例" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesigners = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索设计师..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
        </div>
        <div className="text-sm text-gray-500">
          共 <span className="font-semibold text-gray-900">{designerList.length}</span> 位设计师
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">设计师</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">资质编号</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">从业年限</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">所在公司</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">申请时间</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">审核状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {designerList.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={d.avatar} alt={d.name} className="w-10 h-10 rounded-full bg-gray-100" />
                      <span className="font-medium text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-mono text-sm">{d.certificationNo}</td>
                  <td className="px-5 py-4 text-gray-600">{d.years} 年</td>
                  <td className="px-5 py-4 text-gray-600">{d.company}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm">{d.applyTime}</td>
                  <td className="px-5 py-4">
                    {d.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        待审核
                      </span>
                    )}
                    {d.status === 'reviewing' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        <Eye className="w-3.5 h-3.5" />
                        审核中
                      </span>
                    )}
                    {d.status === 'approved' && (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          已通过 ✓
                        </span>
                        {d.approvedTime && (
                          <div className="text-[10px] text-gray-400">{d.approvedTime}</div>
                        )}
                      </div>
                    )}
                    {d.status === 'rejected' && (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          已拒绝 ✗
                        </span>
                        {d.rejectReason && (
                          <div className="text-[10px] text-red-400 max-w-[160px] truncate" title={d.rejectReason}>
                            原因：{d.rejectReason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {d.status === 'pending' && (
                        <button
                          onClick={() => handleOpenReview(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          查看详情
                        </button>
                      )}
                      {d.status === 'reviewing' && (
                        <button
                          onClick={() => handleOpenReview(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          继续审核
                        </button>
                      )}
                      {(d.status === 'approved' || d.status === 'rejected') && (
                        <span className="text-xs text-gray-400">审核完成</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {designerList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    暂无设计师记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewingDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                设计师审核详情
              </h3>
              <button
                onClick={() => setReviewingDesigner(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img src={reviewingDesigner.avatar} alt={reviewingDesigner.name} className="w-16 h-16 rounded-full bg-gray-100" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{reviewingDesigner.name}</h4>
                  <p className="text-sm text-gray-500">{reviewingDesigner.company} · {reviewingDesigner.years}年经验</p>
                  <p className="text-xs text-gray-400 mt-1">资质编号：{reviewingDesigner.certificationNo}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BadgeCheck className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-gray-900 text-sm">资质证书</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {reviewingDesigner.certificates.map((cert, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={cert} alt={`证书${idx + 1}`} className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Image className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-gray-900 text-sm">作品集</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {reviewingDesigner.portfolio.map((img, idx) => (
                    <div key={idx} className="flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt={`作品${idx + 1}`} className="w-28 h-20 object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-gray-900 text-sm">评分预览</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <span className="text-3xl font-bold text-gray-900">{reviewingDesigner.ratingPreview}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${s <= Math.round(reviewingDesigner.ratingPreview) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">基于历史案例评分</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">拒绝原因（拒绝时填写）</label>
                <textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="如拒绝请填写原因..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setReviewingDesigner(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleRejectDesigner(reviewingDesigner.id)}
                  className="px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors inline-flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </button>
                <button
                  onClick={() => handleApproveDesigner(reviewingDesigner.id)}
                  className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  通过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCaseReview = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">案例审核</h3>
      <p className="text-gray-500">审核设计师提交的案例内容</p>
    </div>
  );

  const ScoreSlider = ({
    label,
    value,
    weight,
    onChange,
    color,
  }: {
    label: string;
    value: number;
    weight: string;
    onChange: (v: number) => void;
    color: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{label}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">权重 {weight}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-500">/ 5.0</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / 5) * 100}%, #E5E7EB ${(value / 5) * 100}%, #E5E7EB 100%)`,
        }}
      />
    </div>
  );

  const renderQualityRating = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">案例列表</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {scoreCases.map((c) => {
            const caseTotal = +(c.completeness * 0.3 + c.photoQuality * 0.25 + c.dataAccuracy * 0.25 + c.designScore * 0.2).toFixed(2);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                  selectedCaseId === c.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <img src={c.cover} alt={c.title} className="w-14 h-10 object-cover rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{c.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{c.designer}</p>
                  <div className="mt-1">
                    {c.scoreStatus === 'unscored' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        未评分
                      </span>
                    )}
                    {c.scoreStatus === 'scoring' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-medium rounded-full">
                        <Sliders className="w-3 h-3" />
                        评分中
                      </span>
                    )}
                    {c.scoreStatus === 'scored' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        已评分 ✓
                      </span>
                    )}
                  </div>
                </div>
                {c.scoreStatus === 'scored' && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{caseTotal}</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= Math.round(caseTotal) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {selectedCase && (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <img src={selectedCase.cover} alt={selectedCase.title} className="w-24 h-16 object-cover rounded-lg" />
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{selectedCase.title}</h2>
                  <p className="text-sm text-gray-500">设计师：{selectedCase.designer}</p>
                </div>
              </div>
              {selectedCase.scoreStatus === 'unscored' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-full">
                  <Clock className="w-4 h-4" />
                  未评分
                </span>
              )}
              {selectedCase.scoreStatus === 'scoring' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-full">
                  <Sliders className="w-4 h-4" />
                  评分中...
                </span>
              )}
              {selectedCase.scoreStatus === 'scored' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  已评分 ✓
                </span>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">质量评分模型</h3>
              </div>

              <ScoreSlider
                label="完整性"
                value={selectedCase.completeness}
                weight="30%"
                color="#0F766E"
                onChange={(v) => handleScoreChange(selectedCase.id, 'completeness', v)}
              />
              <ScoreSlider
                label="照片质量"
                value={selectedCase.photoQuality}
                weight="25%"
                color="#F97316"
                onChange={(v) => handleScoreChange(selectedCase.id, 'photoQuality', v)}
              />
              <ScoreSlider
                label="数据准确性"
                value={selectedCase.dataAccuracy}
                weight="25%"
                color="#8B5CF6"
                onChange={(v) => handleScoreChange(selectedCase.id, 'dataAccuracy', v)}
              />
              <ScoreSlider
                label="设计创意"
                value={selectedCase.designScore}
                weight="20%"
                color="#EC4899"
                onChange={(v) => handleScoreChange(selectedCase.id, 'designScore', v)}
              />
            </div>

            <div className="pt-5 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-5 mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">评分明细</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-600">完整性（×30%）</span>
                    <span className="font-semibold text-teal-700">{selectedCase.completeness}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-600">照片质量（×25%）</span>
                    <span className="font-semibold text-orange-600">{selectedCase.photoQuality}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-600">数据准确性（×25%）</span>
                    <span className="font-semibold text-violet-600">{selectedCase.dataAccuracy}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-gray-600">设计创意（×20%）</span>
                    <span className="font-semibold text-pink-600">{selectedCase.designScore}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">综合评分</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold text-gray-900">{totalScore}</span>
                    <span className="text-gray-500">/ 5.0</span>
                    <div className="flex ml-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${s <= Math.round(totalScore) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedCase.scoreStatus !== 'scored' && (
                    <button
                      onClick={() => handleSaveScore(selectedCase.id)}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      暂存
                    </button>
                  )}
                  {selectedCase.scoreStatus === 'scored' ? (
                    <span className="px-5 py-2.5 bg-green-50 text-green-700 font-medium rounded-lg inline-flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      评分已完成
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirmScore(selectedCase.id)}
                      className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      确认评分
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">系统设置</h3>
      <p className="text-gray-500">平台参数配置和系统管理</p>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'designers': return renderDesigners();
      case 'caseReview': return renderCaseReview();
      case 'qualityRating': return renderQualityRating();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${
          sidebarOpen ? '' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg font-heading">
            <Home className="w-5 h-5 text-primary-400" />
            筑家数据
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white truncate">
                {user?.nickname || '超级管理员'}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary-400" />
                系统管理员
              </div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === item.id
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.id === 'designers' && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                    {designerList.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <button
            onClick={() => clearUser()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 font-heading">
              {menuItems.find((m) => m.id === activeMenu)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-56"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                8
              </span>
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <User className="w-4 h-4" /> 管理员资料
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> 系统设置
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => clearUser()}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
