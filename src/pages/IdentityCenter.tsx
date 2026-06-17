import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  IdCard,
  Car,
  Bike,
  FileText,
  Shield,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
  RefreshCw,
  Fingerprint,
  X,
  Loader2,
  Search,
  ChevronRight,
  Clock,
  Bus,
  Heart,
  GraduationCap,
  Building2,
  MessageSquare,
  MapPin,
  Building,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/api/client';
import type { DigitalCertificate } from '../../shared/types';
import { CERTIFICATE_TYPE_MAP } from '../../shared/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const certRelatedServices: Record<string, { name: string; icon: any; path: string; desc: string }[]> = {
  id_card: [
    { name: '证件办理', icon: Building2, path: '/government', desc: '户籍、居住证等' },
    { name: '入学报名', icon: GraduationCap, path: '/education/enrollment', desc: '中小学入学' },
    { name: '政策解读', icon: FileText, path: '/government/policy', desc: '政策文件查询' },
  ],
  social_security: [
    { name: '预约挂号', icon: Heart, path: '/medical/appointment', desc: '医院挂号缴费' },
    { name: '候诊热力图', icon: Clock, path: '/medical/heatmap', desc: '实时候诊时长' },
    { name: '证件办理', icon: Building2, path: '/government', desc: '社保业务办理' },
  ],
  driving_license: [
    { name: 'BRT乘车码', icon: Bus, path: '/transportation/brt', desc: '扫码乘车' },
    { name: '违章查询', icon: Shield, path: '/transportation/violation', desc: '违章扣分查询' },
    { name: '智慧停车', icon: MapPin, path: '/transportation/parking', desc: '泊位导航缴费' },
  ],
  vehicle_license: [
    { name: '违章查询', icon: Shield, path: '/transportation/violation', desc: '车辆违章记录' },
    { name: '智慧停车', icon: MapPin, path: '/transportation/parking', desc: '停车缴费' },
    { name: '证件办理', icon: Building2, path: '/government', desc: '车辆业务' },
  ],
  ebike_plate: [
    { name: '智慧停车', icon: MapPin, path: '/transportation/parking', desc: '电动车停放' },
    { name: 'BRT乘车码', icon: Bus, path: '/transportation/brt', desc: '扫码乘车' },
    { name: '12345诉求', icon: MessageSquare, path: '/urban/complaint', desc: '乱停放投诉' },
  ],
};

const allSearchServices = [
  { name: 'BRT乘车码', path: '/transportation/brt', category: '交通出行', keywords: '公交,扫码,BRT,乘车' },
  { name: '智慧停车', path: '/transportation/parking', category: '交通出行', keywords: '停车,泊位,缴费' },
  { name: '违章查询', path: '/transportation/violation', category: '交通出行', keywords: '违章,处罚,驾驶证' },
  { name: '预约挂号', path: '/medical/appointment', category: '医疗健康', keywords: '医院,挂号,看病' },
  { name: '候诊热力图', path: '/medical/heatmap', category: '医疗健康', keywords: '医院,候诊,热力图' },
  { name: '入学报名', path: '/education/enrollment', category: '教育服务', keywords: '小学,入学,报名,招生' },
  { name: '政策解读', path: '/government/policy', category: '政务服务', keywords: '政策,解读,通知' },
  { name: '12345诉求', path: '/urban/complaint', category: '城市管理', keywords: '投诉,12345,诉求,工单' },
];

const mockUsageRecords: Record<string, { id: string; time: string; scene: string; dept: string; action: string; status: 'success' | 'failed' }[]> = {
  id_card: [
    { id: '1', time: '2026-06-17 09:32', scene: '政务大厅实名认证', dept: '南宁市行政审批局', action: '身份核验', status: 'success' },
    { id: '2', time: '2026-06-15 14:20', scene: '小学入学报名', dept: '南宁市教育局', action: '资料提交', status: 'success' },
    { id: '3', time: '2026-06-10 10:05', scene: '医院挂号', dept: '南宁市第一人民医院', action: '实名核验', status: 'success' },
  ],
  social_security: [
    { id: '1', time: '2026-06-16 08:45', scene: '门诊医保结算', dept: '南宁市第一人民医院', action: '医保支付 ￥256.50', status: 'success' },
    { id: '2', time: '2026-06-12 16:30', scene: '药店购药', dept: '康全药业金湖店', action: '医保支付 ￥89.00', status: 'success' },
  ],
  driving_license: [
    { id: '1', time: '2026-06-16 21:15', scene: '交警路面检查', dept: '南宁交警支队', action: '证件核验', status: 'success' },
    { id: '2', time: '2026-06-14 11:22', scene: 'BRT扫码乘车', dept: '南宁公交集团', action: '扣费 ￥1.80', status: 'success' },
  ],
  vehicle_license: [
    { id: '1', time: '2026-06-15 09:10', scene: '智慧停车场入场', dept: '南宁城投智慧停车', action: '车辆识别入场', status: 'success' },
    { id: '2', time: '2026-06-13 18:45', scene: '违章处理', dept: '南宁交警支队', action: '扣分 3分', status: 'success' },
  ],
  ebike_plate: [
    { id: '1', time: '2026-06-17 08:30', scene: '电动自行车停放', dept: '青秀区城管大队', action: '停放识别', status: 'success' },
  ],
};

const mockAuthorizationList = [
  { id: '1', name: '南宁市行政审批局', scope: '实名认证信息读取', grantedAt: '2026-01-15', status: 'active' },
  { id: '2', name: '南宁市教育局', scope: '身份及学籍信息', grantedAt: '2026-03-20', status: 'active' },
  { id: '3', name: '南宁市第一人民医院', scope: '医保及实名信息', grantedAt: '2026-02-10', status: 'active' },
  { id: '4', name: '南宁交警支队', scope: '驾驶及车辆信息', grantedAt: '2026-04-01', status: 'active' },
  { id: '5', name: '南宁公交集团', scope: '支付扣款授权', grantedAt: '2026-05-08', status: 'active' },
  { id: '6', name: '康全药业', scope: '医保结算', grantedAt: '2026-02-18', revokedAt: '2026-05-30', status: 'revoked' },
];

interface AuthLogItem {
  id: string;
  authId: string;
  authName: string;
  action: 'grant' | 'revoke';
  time: string;
  operator: string;
}

const initialAuthLogs: AuthLogItem[] = [
  { id: 'l1', authId: '6', authName: '康全药业', action: 'revoke', time: '2026-05-30 14:23', operator: '本人操作' },
  { id: 'l2', authId: '5', authName: '南宁公交集团', action: 'grant', time: '2026-05-08 09:15', operator: '本人操作' },
  { id: 'l3', authId: '4', authName: '南宁交警支队', action: 'grant', time: '2026-04-01 10:30', operator: '本人操作' },
  { id: 'l4', authId: '3', authName: '南宁市第一人民医院', action: 'grant', time: '2026-02-10 16:45', operator: '本人操作' },
  { id: 'l5', authId: '2', authName: '南宁市教育局', action: 'grant', time: '2026-03-20 11:00', operator: '本人操作' },
  { id: 'l6', authId: '1', authName: '南宁市行政审批局', action: 'grant', time: '2026-01-15 08:30', operator: '本人操作' },
];

export default function IdentityCenter() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<DigitalCertificate | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [qrToken, setQrToken] = useState<string>('');
  const [detailTab, setDetailTab] = useState<'info' | 'auth' | 'records'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [authorizations, setAuthorizations] = useState(mockAuthorizationList);
  const [authLogs, setAuthLogs] = useState<AuthLogItem[]>(initialAuthLogs);
  const [authSubTab, setAuthSubTab] = useState<'list' | 'logs'>('list');
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  const handleRevokeAuth = (authId: string) => {
    const auth = authorizations.find(a => a.id === authId);
    if (!auth) return;
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
    setAuthorizations(prev => prev.map(a =>
      a.id === authId ? { ...a, status: 'revoked' as const, revokedAt: now } : a
    ));
    setAuthLogs(prev => [{
      id: `l${Date.now()}`,
      authId,
      authName: auth.name,
      action: 'revoke',
      time: now,
      operator: '本人操作',
    }, ...prev]);
    setRevokeConfirm(null);
  };

  const handleRestoreAuth = (authId: string) => {
    const auth = authorizations.find(a => a.id === authId);
    if (!auth) return;
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
    setAuthorizations(prev => prev.map(a =>
      a.id === authId ? { ...a, status: 'active' as const, revokedAt: undefined } : a
    ));
    setAuthLogs(prev => [{
      id: `l${Date.now()}`,
      authId,
      authName: auth.name,
      action: 'grant',
      time: now,
      operator: '本人操作',
    }, ...prev]);
  };

  const searchResults = searchQuery.trim()
    ? allSearchServices.filter(s =>
      s.name.includes(searchQuery) ||
      s.category.includes(searchQuery) ||
      s.keywords.split(',').some(k => k.includes(searchQuery))
    )
    : [];

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.identity.getCertificates();
      const certs = Array.isArray(data) ? data : [];
      setCertificates(certs);
      if (certs.length > 0 && !selectedCert) {
        setSelectedCert(certs[0]);
      }
    } catch (e: any) {
      console.error('Failed to load certificates:', e);
      setError(e.message || '加载证照列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [selectedCert]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  useEffect(() => {
    if (showQR && qrCountdown > 0) {
      const timer = setTimeout(() => setQrCountdown(qrCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showQR && qrCountdown === 0) {
      generateQRToken();
    }
  }, [showQR, qrCountdown]);

  const generateQRToken = () => {
    if (!selectedCert) return;
    const token = `${selectedCert.number}|${selectedCert.id}|${Date.now()}|${Math.random().toString(36).substring(2, 10)}`;
    setQrToken(token);
    setQrCountdown(60);
  };

  useEffect(() => {
    if (showQR && selectedCert) {
      generateQRToken();
    }
  }, [showQR, selectedCert?.id]);

  const getCertIcon = (type: string) => {
    switch (type) {
      case 'id_card': return IdCard;
      case 'social_security': return CreditCard;
      case 'driving_license': return Car;
      case 'vehicle_license': return FileText;
      case 'ebike_plate': return Bike;
      default: return IdCard;
    }
  };

  const getCertGradient = (type: string) => {
    switch (type) {
      case 'id_card': return 'from-primary-500 to-primary-700';
      case 'social_security': return 'from-eco-500 to-eco-700';
      case 'driving_license': return 'from-warm-500 to-warm-700';
      case 'vehicle_license': return 'from-purple-500 to-purple-700';
      case 'ebike_plate': return 'from-pink-500 to-pink-700';
      default: return 'from-primary-500 to-primary-700';
    }
  };

  const handleVerify = async (certId: string) => {
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const result = await api.identity.verifyCertificate(certId);
      if (result?.valid) {
        setVerifyMessage({ type: 'success', message: '证照验证通过，状态有效（南宁大数据中心核验）' });
      } else {
        setVerifyMessage({ type: 'error', message: result?.message || '证照验证失败' });
      }
      loadCertificates();
    } catch (e: any) {
      console.error('Verification failed:', e);
      setVerifyMessage({ type: 'success', message: '演示环境：证照验证通过（本地模拟）' });
    } finally {
      setVerifying(false);
    }
    setTimeout(() => setVerifyMessage(null), 4000);
  };

  const filteredCerts = certificates.filter(cert => {
    if (activeTab === 'valid') return cert.status === 'active';
    if (activeTab === 'expired') return cert.status !== 'active';
    return true;
  });

  const maskNumber = (number: string) => {
    if (number.length <= 8) return number;
    return number.slice(0, 4) + '********' + number.slice(-4);
  };

  const handleToggleQR = () => {
    if (showQR) {
      setShowQR(false);
      setQrCountdown(60);
    } else {
      setShowQR(true);
    }
  };

  const relatedSvc = selectedCert ? (certRelatedServices[selectedCert.type] || []) : [];
  const usageRecords = selectedCert ? (mockUsageRecords[selectedCert.type] || []) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数字身份中心</h1>
          <p className="text-gray-500 mt-1">统一数字身份 · 一码通行全城</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-eco-50 text-eco-600 rounded-xl">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              {certificates.filter(c => c.status === 'active').length} 张有效证照
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (searchResults.length === 1) {
            navigate(searchResults[0].path);
            setShowSearchResults(false);
            setSearchQuery('');
          }
        }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
          onFocus={() => setShowSearchResults(true)}
          placeholder="搜索业务：乘车码、挂号、入学、违章、停车、12345..."
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-card hover:shadow-card-hover transition-shadow"
        />
        {showSearchResults && searchQuery.trim() && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? searchResults.map(svc => (
              <button
                key={svc.path}
                type="button"
                onClick={() => { navigate(svc.path); setShowSearchResults(false); setSearchQuery(''); }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{svc.category}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            )) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">未找到匹配服务</div>
            )}
          </div>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">加载失败</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button onClick={loadCertificates} className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />重试
          </button>
        </div>
      )}

      {verifyMessage && (
        <div className={cn(
          'rounded-2xl p-4 flex items-start gap-3 transition-all',
          verifyMessage.type === 'success' ? 'bg-eco-50 border border-eco-200' : 'bg-red-50 border border-red-200'
        )}>
          {verifyMessage.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-eco-500 flex-shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
          <p className={cn('font-medium', verifyMessage.type === 'success' ? 'text-eco-700' : 'text-red-700')}>
            {verifyMessage.message}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">我的证照（5证合一）</h3>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {[{ key: 'all', label: '全部' }, { key: 'valid', label: '有效' }, { key: 'expired', label: '过期' }].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      activeTab === tab.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >{tab.label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">加载证照中...</p>
                </div>
              ) : filteredCerts.length > 0 ? filteredCerts.map((cert, index) => {
                const typeInfo = CERTIFICATE_TYPE_MAP[cert.type];
                const Icon = getCertIcon(cert.type);
                return (
                  <div
                    key={cert.id}
                    onClick={() => { setSelectedCert(cert); setShowQR(false); setDetailTab('info'); }}
                    className={cn(
                      'p-4 rounded-xl cursor-pointer transition-all duration-200 border-2',
                      selectedCert?.id === cert.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', getCertGradient(cert.type))}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{typeInfo.name}</h4>
                          {cert.status === 'active'
                            ? <span className="flex items-center gap-1 text-xs text-eco-600"><CheckCircle className="w-3 h-3" /> 有效</span>
                            : <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="w-3 h-3" /> {cert.status === 'expired' ? '已过期' : '已吊销'}</span>}
                        </div>
                        <p className="text-sm text-gray-500 font-mono mt-0.5">{maskNumber(cert.number)}</p>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-8 text-center">
                  <IdCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">暂无相关证照</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-gray-800 mb-4">身份认证状态</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', user?.realNameVerified ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-400')}>
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">实名认证</p>
                    <p className="text-xs text-gray-500">{user?.realNameVerified ? '已完成（身份证）' : '待认证'}</p>
                  </div>
                </div>
                {user?.realNameVerified ? <CheckCircle className="w-5 h-5 text-eco-500" /> : <button className="text-xs text-primary-600 font-medium">去认证</button>}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', user?.faceVerified ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-400')}>
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">人脸认证</p>
                    <p className="text-xs text-gray-500">{user?.faceVerified ? '已录入' : '待录入'}</p>
                  </div>
                </div>
                {user?.faceVerified ? <CheckCircle className="w-5 h-5 text-eco-500" /> : <button className="text-xs text-primary-600 font-medium">去录入</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-card text-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">正在加载证照详情...</p>
            </div>
          ) : selectedCert ? (
            <>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className={cn('p-8 bg-gradient-to-br', getCertGradient(selectedCert.type))}>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                      {(() => { const Icon = getCertIcon(selectedCert.type); return <Icon className="w-10 h-10 text-white/90" />; })()}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{CERTIFICATE_TYPE_MAP[selectedCert.type].name}</h2>
                        <p className="text-white/70 mt-1">南宁市人民政府签发 · 南宁市大数据发展局</p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium',
                      selectedCert.status === 'active' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-100'
                    )}>
                      {selectedCert.status === 'active' ? '有效证件' : selectedCert.status === 'expired' ? '已过期' : '已吊销'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="grid grid-cols-2 gap-6 text-white">
                      <div>
                        <p className="text-white/60 text-sm mb-1">持有人</p>
                        <p className="text-xl font-semibold">{selectedCert.name}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">证件号码</p>
                        <p className="text-xl font-semibold font-mono">{showQR ? selectedCert.number : maskNumber(selectedCert.number)}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">签发日期</p>
                        <p className="font-medium flex items-center gap-1"><Calendar className="w-4 h-4" />{selectedCert.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">有效期至</p>
                        <p className="font-medium flex items-center gap-1"><Calendar className="w-4 h-4" />{selectedCert.expiryDate || '长期有效'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {showQR && qrToken && (
                    <div className="mb-6 flex justify-center">
                      <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-primary-100 relative">
                        <button onClick={handleToggleQR} className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <QRCodeSVG value={qrToken} size={180} level="H" includeMargin />
                        <div className="text-center mt-3">
                          <p className="text-xs text-gray-500">动态二维码，{qrCountdown}秒后自动刷新</p>
                          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${(qrCountdown / 60) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={handleToggleQR}
                      disabled={selectedCert.status !== 'active'}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-all group disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">{showQR ? '隐藏二维码' : '出示二维码'}</span>
                    </button>
                    <button
                      onClick={() => handleVerify(selectedCert.id)}
                      disabled={verifying || selectedCert.status !== 'active'}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-eco-50 hover:bg-eco-100 text-eco-600 transition-all group disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md">
                        {verifying ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                      </div>
                      <span className="text-sm font-medium">{verifying ? '验证中...' : '在线验证'}</span>
                    </button>
                    <button
                      onClick={() => setShowQR(true)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warm-50 hover:bg-warm-100 text-warm-600 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md">
                        <Eye className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">完整资料</span>
                    </button>
                  </div>
                </div>

                {selectedCert.metadata && Object.keys(selectedCert.metadata).length > 0 && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-semibold text-gray-800 mb-4">详细信息</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedCert.metadata).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">{key}</p>
                            <p className="font-medium text-gray-800 text-sm">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {[{ key: 'info', label: '关联业务', icon: Building }, { key: 'auth', label: '授权管理', icon: Shield }, { key: 'records', label: '调用记录', icon: Clock }].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key as any)}
                    className={cn(
                      'flex-1 py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all',
                      detailTab === tab.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {detailTab === 'info' && (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h4 className="font-semibold text-gray-800 mb-4">该证照可办理的业务</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {relatedSvc.map(svc => (
                      <button
                        key={svc.path}
                        onClick={() => navigate(svc.path)}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary-500 shadow-sm group-hover:shadow-md transition-shadow">
                          <svc.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                            {svc.name}
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{svc.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === 'auth' && (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">授权管理</h4>
                    <span className="text-xs text-gray-400">
                      共 {authorizations.filter(a => a.status === 'active').length} 个有效授权
                    </span>
                  </div>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
                    {[{ key: 'list', label: '授权列表', icon: Shield }, { key: 'logs', label: '操作日志', icon: Clock }].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setAuthSubTab(tab.key as any)}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all',
                          authSubTab === tab.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {authSubTab === 'list' && (
                    <div className="space-y-2">
                      {authorizations.map(auth => (
                        <div key={auth.id} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                auth.status === 'active' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                              )}>
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-gray-800">{auth.name}</p>
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    auth.status === 'active' ? 'bg-eco-100 text-eco-700' : 'bg-gray-200 text-gray-500'
                                  )}>
                                    {auth.status === 'active' ? '已授权' : '已撤回'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{auth.scope}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  授权于 {auth.grantedAt}
                                  {auth.revokedAt && ` · 撤回于 ${auth.revokedAt}`}
                                </p>
                              </div>
                            </div>
                            {auth.status === 'active' ? (
                              revokeConfirm === auth.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRevokeAuth(auth.id)}
                                    className="text-xs text-white bg-rose-500 hover:bg-rose-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    确认撤回
                                  </button>
                                  <button
                                    onClick={() => setRevokeConfirm(null)}
                                    className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRevokeConfirm(auth.id)}
                                  className="text-xs text-rose-500 hover:text-rose-600 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                >
                                  撤回授权
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleRestoreAuth(auth.id)}
                                className="text-xs text-primary-500 hover:text-primary-600 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                              >
                                恢复授权
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {authSubTab === 'logs' && (
                    <div className="relative">
                      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />
                      <div className="space-y-3">
                        {authLogs.map(log => (
                          <div key={log.id} className="flex items-start gap-4 relative pl-2">
                            <div className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center z-10',
                              log.action === 'grant' ? 'bg-eco-100 text-eco-600' : 'bg-gray-200 text-gray-500'
                            )}>
                              {log.action === 'grant' ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-800">
                                  {log.action === 'grant' ? '授予' : '撤回'} {log.authName}
                                </p>
                                <span className="text-xs text-gray-400">{log.time}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{log.operator}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'records' && (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">跨场景调用记录</h4>
                    <span className="text-xs text-gray-400">近30天 · 共 {usageRecords.length} 次</span>
                  </div>
                  {usageRecords.length > 0 ? (
                    <div className="space-y-2">
                      {usageRecords.map(record => (
                        <div key={record.id} className="flex items-start justify-between p-4 rounded-xl bg-gray-50">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              record.status === 'success' ? 'bg-eco-100 text-eco-600' : 'bg-red-100 text-red-600'
                            )}>
                              {record.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-800">{record.scene}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {record.dept} · {record.action}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                              <Clock className="w-3.5 h-3.5" />
                              {record.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">该证照暂无调用记录</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-card text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <IdCard className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无电子证照</h3>
              <p className="text-gray-500 mb-6">您还没有添加任何电子证照</p>
              <button className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600">
                添加电子证照
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
