import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/api/client';
import type { DigitalCertificate } from '../../shared/types';
import { CERTIFICATE_TYPE_MAP } from '../../shared/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export default function IdentityCenter() {
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<DigitalCertificate | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'expired'>('all');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const data = await api.identity.getCertificates();
      const certs = Array.isArray(data) ? data : [];
      setCertificates(certs);
      if (certs.length > 0 && !selectedCert) {
        setSelectedCert(certs[0]);
      }
    } catch (e) {
      console.error('Failed to load certificates:', e);
    }
  };

  const getCertIcon = (type: string) => {
    switch (type) {
      case 'id_card':
        return IdCard;
      case 'social_security':
        return CreditCard;
      case 'driving_license':
        return Car;
      case 'vehicle_license':
        return FileText;
      case 'ebike_plate':
        return Bike;
      default:
        return IdCard;
    }
  };

  const getCertGradient = (type: string) => {
    switch (type) {
      case 'id_card':
        return 'from-primary-500 to-primary-700';
      case 'social_security':
        return 'from-eco-500 to-eco-700';
      case 'driving_license':
        return 'from-warm-500 to-warm-700';
      case 'vehicle_license':
        return 'from-purple-500 to-purple-700';
      case 'ebike_plate':
        return 'from-pink-500 to-pink-700';
      default:
        return 'from-primary-500 to-primary-700';
    }
  };

  const handleVerify = async (certId: string) => {
    setVerifying(true);
    try {
      await api.identity.verifyCertificate(certId);
      loadCertificates();
    } catch (e) {
      console.error('Verification failed:', e);
    } finally {
      setVerifying(false);
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数字身份中心</h1>
          <p className="text-gray-500 mt-1">管理您的电子证照，一码通行全城</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">我的证照</h3>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'valid', label: '有效' },
                  { key: 'expired', label: '已过期' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      activeTab === tab.key
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCerts.map((cert, index) => {
                const typeInfo = CERTIFICATE_TYPE_MAP[cert.type];
                const Icon = getCertIcon(cert.type);
                return (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className={cn(
                      'p-4 rounded-xl cursor-pointer transition-all duration-200 border-2',
                      selectedCert?.id === cert.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
                          getCertGradient(cert.type)
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{typeInfo.name}</h4>
                          {cert.status === 'active' ? (
                            <span className="flex items-center gap-1 text-xs text-eco-600">
                              <CheckCircle className="w-3 h-3" /> 有效
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3" /> {cert.status === 'expired' ? '已过期' : '已吊销'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-mono mt-0.5">
                          {maskNumber(cert.number)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-gray-800 mb-4">身份认证状态</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    user?.realNameVerified ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">实名认证</p>
                    <p className="text-xs text-gray-500">
                      {user?.realNameVerified ? '已完成' : '待认证'}
                    </p>
                  </div>
                </div>
                {user?.realNameVerified ? (
                  <CheckCircle className="w-5 h-5 text-eco-500" />
                ) : (
                  <button className="text-xs text-primary-600 font-medium">去认证</button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    user?.faceVerified ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">人脸认证</p>
                    <p className="text-xs text-gray-500">
                      {user?.faceVerified ? '已录入' : '待录入'}
                    </p>
                  </div>
                </div>
                {user?.faceVerified ? (
                  <CheckCircle className="w-5 h-5 text-eco-500" />
                ) : (
                  <button className="text-xs text-primary-600 font-medium">去录入</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedCert ? (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className={cn('p-8 bg-gradient-to-br', getCertGradient(selectedCert.type))}>
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getCertIcon(selectedCert.type);
                      return <Icon className="w-10 h-10 text-white/90" />;
                    })()}
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {CERTIFICATE_TYPE_MAP[selectedCert.type].name}
                      </h2>
                      <p className="text-white/70 mt-1">南宁市人民政府签发</p>
                    </div>
                  </div>
                  <div className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium',
                    selectedCert.status === 'active'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-500/20 text-red-100'
                  )}>
                    {selectedCert.status === 'active' ? '有效证件' : selectedCert.status === 'expired' ? '已过期' : '已吊销'}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-6 text-white">
                    <div>
                      <p className="text-white/60 text-sm mb-1">持有人</p>
                      <p className="text-xl font-semibold">{selectedCert.name}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">证件号码</p>
                      <p className="text-xl font-semibold font-mono">
                        {showQR ? selectedCert.number : maskNumber(selectedCert.number)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">签发日期</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedCert.issueDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">有效期至</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedCert.expiryDate || '长期有效'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {showQR && (
                  <div className="mb-6 flex justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-primary-100">
                      <QRCodeSVG
                        value={selectedCert.number + '|' + selectedCert.id + '|' + Date.now()}
                        size={180}
                        level="H"
                        includeMargin
                      />
                      <p className="text-center text-xs text-gray-500 mt-3">
                        动态二维码，{Math.floor(Math.random() * 30 + 30)}秒后自动刷新
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{showQR ? '隐藏二维码' : '出示二维码'}</span>
                  </button>

                  <button
                    onClick={() => handleVerify(selectedCert.id)}
                    disabled={verifying || selectedCert.status !== 'active'}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-eco-50 hover:bg-eco-100 text-eco-600 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      {verifying ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <Shield className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{verifying ? '验证中...' : '在线验证'}</span>
                  </button>

                  <button
                    onClick={() => setShowQR(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warm-50 hover:bg-warm-100 text-warm-600 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <Eye className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">查看详情</span>
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
                          <p className="text-xs text-gray-500 mb-1">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="font-medium text-gray-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-card text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <IdCard className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无电子证照</h3>
              <p className="text-gray-500 mb-6">您还没有添加任何电子证照，点击下方按钮添加</p>
              <button className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                添加电子证照
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
