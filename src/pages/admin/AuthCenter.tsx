import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  ScanFace,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Camera,
  UserCheck,
  Database,
  Wifi,
  Zap,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
  ChevronDown,
  Activity,
  Fingerprint,
  IdCard,
  KeyRound,
  Smartphone,
  Monitor,
  LayoutGrid,
  Terminal,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  mockFaceAuthRecords,
  mockAuthReviewRecords,
  mockAuthStatistics,
  mockPoliceDbStatus,
  mockUser,
} from '@/mock/data';
import { formatDate, formatDateTime, getStatusText, getStatusColor, formatIdCard } from '@/utils/format';
import type { FaceAuthRecord, AuthReviewRecord, VerifyStatus, ReviewStatus } from '@/types';
import { cn } from '@/lib/utils';

const COLORS = ['#165DFF', '#722ED1', '#0FC6C2', '#FF7D00'];

const CHANNEL_COLORS: Record<string, string> = {
  'APP端': '#165DFF',
  'Web端': '#722ED1',
  '小程序': '#0FC6C2',
  '自助终端': '#FF7D00',
};

const AuthCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'face' | 'review' | 'statistics'>('face');
  const [reviewTab, setReviewTab] = useState<'pending' | 'reviewed'>('pending');
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('pending');
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const statCards = [
    {
      title: '今日认证量',
      value: mockAuthStatistics.todayCount,
      unit: '次',
      icon: Zap,
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      iconBg: 'bg-white/20',
    },
    {
      title: '认证通过率',
      value: mockAuthStatistics.passRate,
      unit: '%',
      icon: ShieldCheck,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      iconBg: 'bg-white/20',
    },
    {
      title: '平均认证时长',
      value: mockAuthStatistics.avgDuration,
      unit: '秒',
      icon: Clock,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconBg: 'bg-white/20',
    },
    {
      title: '待审核数',
      value: mockAuthStatistics.pendingCount,
      unit: '条',
      icon: AlertCircle,
      gradient: 'from-orange-500 via-amber-500 to-yellow-600',
      iconBg: 'bg-white/20',
    },
  ];

  const pendingReviews = useMemo(() => {
    let list = mockAuthReviewRecords.filter((r) => r.status === 'pending');
    if (searchKeyword) {
      list = list.filter(
        (r) =>
          r.applicantName.includes(searchKeyword) ||
          r.idCard.includes(searchKeyword) ||
          r.applicationNo.includes(searchKeyword)
      );
    }
    if (filterType) {
      list = list.filter((r) => r.authType === filterType);
    }
    return list;
  }, [searchKeyword, filterType]);

  const reviewedRecords = useMemo(() => {
    let list = mockAuthReviewRecords.filter((r) => r.status !== 'pending');
    if (searchKeyword) {
      list = list.filter(
        (r) =>
          r.applicantName.includes(searchKeyword) ||
          r.idCard.includes(searchKeyword) ||
          r.applicationNo.includes(searchKeyword)
      );
    }
    if (filterType) {
      list = list.filter((r) => r.authType === filterType);
    }
    return list;
  }, [searchKeyword, filterType]);

  const authTypes = useMemo(() => {
    const types = new Set(mockAuthReviewRecords.map((r) => r.authType));
    return Array.from(types);
  }, []);

  const startVerify = () => {
    setVerifyStatus('verifying');
    setVerifyProgress(0);
    setIsScanning(true);
  };

  useEffect(() => {
    if (verifyStatus === 'verifying' && verifyProgress < 100) {
      const timer = setTimeout(() => {
        setVerifyProgress((prev) => {
          const next = prev + Math.random() * 15 + 5;
          if (next >= 100) {
            setIsScanning(false);
            setVerifyStatus('success');
            return 100;
          }
          return next;
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [verifyStatus, verifyProgress]);

  const resetVerify = () => {
    setVerifyStatus('pending');
    setVerifyProgress(0);
    setIsScanning(false);
  };

  const getStatusBadgeClass = (status: string) => {
    const color = getStatusColor(status);
    const colorMap: Record<string, string> = {
      success: 'bg-success-500/10 text-success-500 border-success-500/20',
      warning: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
      danger: 'bg-danger-500/10 text-danger-500 border-danger-500/20',
      primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
      default: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    };
    return colorMap[color] || colorMap.default;
  };

  const renderFaceAuthTab = () => (
    <div className="grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3 animate-fade-in-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-neutral-600 flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-primary-500" />
            人脸识别认证
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${mockPoliceDbStatus.status === 'connected' ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`} />
            <span className="text-neutral-400">公安人口库{mockPoliceDbStatus.status === 'connected' ? '已连接' : '未连接'}</span>
          </div>
        </div>

        <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-xl overflow-hidden mb-5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-56">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
              
              {isScanning && (
                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
              )}

              <div className="absolute inset-0 flex items-center justify-center">
                {verifyStatus === 'pending' && (
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-cyan-400/50 mx-auto mb-3" />
                    <p className="text-cyan-300/70 text-sm">请将面部对准取景框</p>
                  </div>
                )}
                {verifyStatus === 'verifying' && (
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30" />
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                      <ScanFace className="absolute inset-0 m-auto w-10 h-10 text-cyan-400" />
                    </div>
                    <p className="text-cyan-300 text-sm">正在识别中...</p>
                  </div>
                )}
                {verifyStatus === 'success' && (
                  <div className="text-center animate-[pulse_0.5s_ease-out]">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-success-500/20 flex items-center justify-center">
                      <UserCheck className="w-12 h-12 text-success-400" />
                    </div>
                    <p className="text-success-400 text-sm font-medium">识别成功</p>
                  </div>
                )}
                {verifyStatus === 'failed' && (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-danger-500/20 flex items-center justify-center">
                      <XCircle className="w-12 h-12 text-danger-400" />
                    </div>
                    <p className="text-danger-400 text-sm">识别失败</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isScanning && (
            <>
              <div className="absolute top-4 left-4 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400">REC</span>
              </div>
              <div className="absolute top-4 right-4 text-xs text-cyan-400/70 font-mono">
                {formatDateTime(new Date(), 'HH:mm:ss')}
              </div>
            </>
          )}

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between text-xs text-cyan-400/60 font-mono">
              <span>FACE ID v2.0</span>
              <span>99.97% Accuracy</span>
            </div>
          </div>
        </div>

        {verifyStatus !== 'pending' && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-500">识别进度</span>
              <span className="text-sm font-medium text-primary-500">{Math.round(verifyProgress)}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  verifyStatus === 'success' ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' :
                  verifyStatus === 'failed' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  'bg-gradient-to-r from-cyan-500 to-blue-500'
                )}
                style={{ width: `${verifyProgress}%` }}
              />
            </div>
          </div>
        )}

        {verifyStatus === 'success' && (
          <Card padding="sm" className="mb-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">公安人口库比对结果</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-neutral-400">姓名：</span>
                    <span className="text-neutral-600">{mockUser.name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">身份证号：</span>
                    <span className="text-neutral-600">{formatIdCard(mockUser.idCard)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">比对相似度：</span>
                    <span className="text-cyan-600 font-medium">96.8%</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">比对状态：</span>
                    <span className="text-success-600 font-medium">比对一致</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-3">
          {verifyStatus === 'pending' && (
            <Button onClick={startVerify} icon={<ScanFace className="w-4 h-4" />}>
              开始识别
            </Button>
          )}
          {verifyStatus !== 'pending' && (
            <>
              <Button onClick={resetVerify} variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
                重新识别
              </Button>
              {verifyStatus === 'success' && (
                <>
                  <Button icon={<CheckCircle className="w-4 h-4" />}>
                    通过
                  </Button>
                  <Button variant="danger" icon={<XCircle className="w-4 h-4" />}>
                    驳回
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <h3 className="text-base font-semibold text-neutral-600 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          认证历史记录
        </h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {mockFaceAuthRecords.slice(0, 8).map((record, index) => (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100/70 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                record.status === 'success' ? 'bg-success-500/10 text-success-500' :
                record.status === 'failed' ? 'bg-danger-500/10 text-danger-500' :
                record.status === 'verifying' ? 'bg-primary-500/10 text-primary-500' :
                'bg-warning-500/10 text-warning-500'
              )}>
                {record.status === 'success' ? <CheckCircle className="w-5 h-5" /> :
                 record.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                 record.status === 'verifying' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
                 <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-neutral-600 truncate">{record.userName}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', getStatusBadgeClass(record.status))}>
                    {getStatusText(record.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{formatIdCard(record.idCard)}</span>
                  <span>·</span>
                  <span>{record.duration}s</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {formatDateTime(record.authTime)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderReviewTab = () => (
    <div className="space-y-4 animate-fade-in-up">
      <Card padding="sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {[
              { key: 'pending', label: '待审核', count: mockAuthReviewRecords.filter(r => r.status === 'pending').length },
              { key: 'reviewed', label: '已审核', count: mockAuthReviewRecords.filter(r => r.status !== 'pending').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReviewTab(tab.key as 'pending' | 'reviewed')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  reviewTab === tab.key
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'text-neutral-500 hover:text-primary-500 hover:bg-primary-50'
                )}
              >
                {tab.label}
                <span className={cn(
                  'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
                  reviewTab === tab.key ? 'bg-white/20' : 'bg-neutral-100'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索申请人/身份证/申请编号"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-4 pr-9 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">全部类型</option>
                {authTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>
              筛选
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">申请人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">身份证号</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">申请时间</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">认证类型</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">申请渠道</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">状态</th>
                {reviewTab === 'reviewed' && (
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">审核人</th>
                )}
                <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {(reviewTab === 'pending' ? pendingReviews : reviewedRecords).map((record, index) => (
                <tr
                  key={record.id}
                  className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-medium">
                        {record.applicantName.charAt(0)}
                      </div>
                      <span className="text-sm text-neutral-600">{record.applicantName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-500 font-mono">{formatIdCard(record.idCard)}</td>
                  <td className="py-3 px-4 text-sm text-neutral-500">{formatDateTime(record.applyTime)}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-500">
                      {record.authType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-500">
                    {record.channel === 'app' && <Smartphone className="w-4 h-4 inline mr-1 text-primary-500" />}
                    {record.channel === 'web' && <Monitor className="w-4 h-4 inline mr-1 text-violet-500" />}
                    {record.channel === 'mini_program' && <LayoutGrid className="w-4 h-4 inline mr-1 text-cyan-500" />}
                    {record.channel === 'terminal' && <Terminal className="w-4 h-4 inline mr-1 text-orange-500" />}
                    {record.channel === 'app' ? 'APP' : record.channel === 'web' ? 'Web' : record.channel === 'mini_program' ? '小程序' : '终端'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-1 rounded-full border', getStatusBadgeClass(record.status))}>
                      {getStatusText(record.status)}
                    </span>
                  </td>
                  {reviewTab === 'reviewed' && (
                    <td className="py-3 px-4 text-sm text-neutral-500">{record.reviewer || '-'}</td>
                  )}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                        详情
                      </Button>
                      {reviewTab === 'pending' && (
                        <>
                          <Button size="sm" icon={<CheckCircle className="w-4 h-4" />}>
                            通过
                          </Button>
                          <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />}>
                            驳回
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(reviewTab === 'pending' ? pendingReviews : reviewedRecords).length === 0 && (
          <div className="py-12 text-center text-neutral-400">
            暂无数据
          </div>
        )}
      </Card>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-neutral-600 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            认证趋势（近30天）
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAuthStatistics.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B42A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00B42A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E6EB' }}
                  tickFormatter={(value) => formatDate(value, 'MM/DD')}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  }}
                  labelFormatter={(label) => formatDate(label, 'YYYY年MM月DD日')}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-sm text-neutral-500">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="认证总数"
                  stroke="#165DFF"
                  strokeWidth={2.5}
                  dot={{ fill: '#165DFF', r: 3 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="successCount"
                  name="成功数"
                  stroke="#00B42A"
                  strokeWidth={2.5}
                  dot={{ fill: '#00B42A', r: 3 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-neutral-600 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-500" />
            认证方式分布
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockAuthStatistics.methodDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="method"
                >
                  {mockAuthStatistics.methodDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  }}
                  formatter={(value: number, name: string) => [`${value} 次`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={60}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-neutral-500">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-neutral-600 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success-500" />
            通过率趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAuthStatistics.passRateTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B42A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00B42A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E6EB' }}
                  tickFormatter={(value) => formatDate(value, 'MM/DD')}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[85, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  }}
                  labelFormatter={(label) => formatDate(label, 'YYYY年MM月DD日')}
                  formatter={(value: number) => [`${value}%`, '通过率']}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="通过率"
                  stroke="#00B42A"
                  strokeWidth={2.5}
                  dot={{ fill: '#00B42A', r: 3 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-neutral-600 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" />
            各渠道认证量统计
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAuthStatistics.channelDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" vertical={false} />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E6EB' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  }}
                  formatter={(value: number, name: string) => [`${value} 次`, '认证量']}
                />
                <Bar dataKey="count" name="认证量" radius={[6, 6, 0, 0]}>
                  {mockAuthStatistics.channelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(CHANNEL_COLORS)[index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={card.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className={`relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br ${card.gradient} shadow-lg`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-tr-full translate-y-6 -translate-x-6" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center backdrop-blur-sm`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                </div>
                <p className="text-sm text-white/80 mb-1">{card.title}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{card.value.toLocaleString()}</span>
                  <span className="text-sm text-white/70">{card.unit}</span>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white/60 animate-[shimmer_2s_ease-in-out_infinite]"
                  style={{ width: '30%', animation: 'shimmer 2s ease-in-out infinite' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card padding="sm" className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-6 px-2">
          {[
            { key: 'face', label: '人脸识别认证', icon: ScanFace },
            { key: 'review', label: '认证审核', icon: ShieldCheck },
            { key: 'statistics', label: '认证统计', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'face' | 'review' | 'statistics')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-500 to-violet-500 text-white shadow-md shadow-primary-500/30'
                  : 'text-neutral-500 hover:text-primary-500 hover:bg-primary-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}

          <div className="flex-1" />

          <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
            <div className={`w-2.5 h-2.5 rounded-full ${mockPoliceDbStatus.status === 'connected' ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`} />
            <div>
              <p className="text-xs text-neutral-500">{mockPoliceDbStatus.name}</p>
              <p className="text-xs font-medium text-cyan-600">
                {mockPoliceDbStatus.status === 'connected' ? '运行正常' : '连接断开'}
              </p>
            </div>
            <div className="h-8 w-px bg-cyan-200" />
            <div className="text-right">
              <p className="text-xs text-neutral-400">响应时间</p>
              <p className="text-sm font-semibold text-cyan-600">{mockPoliceDbStatus.responseTime}ms</p>
            </div>
          </div>
        </div>
      </Card>

      {activeTab === 'face' && renderFaceAuthTab()}
      {activeTab === 'review' && renderReviewTab()}
      {activeTab === 'statistics' && renderStatisticsTab()}
    </div>
  );
};

export default AuthCenter;
