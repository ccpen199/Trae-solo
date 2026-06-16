import { useState, useMemo } from 'react';
import { Modal, message } from 'antd';
import { CreditCard, IdCard, Home, HeartHandshake, Baby, Building2, Grid3X3, Eye, Download, Share2, X, QrCode, Calendar, Building, FileCheck, Copy, CheckCircle2 } from 'lucide-react';
import { mockCertificates } from '../mock/data';
import type { Certificate } from '../shared/types';

const certificateCategories = [
  { key: 'all', label: '全部', icon: Grid3X3, types: [] as string[] },
  { key: 'id_card', label: '身份证', icon: IdCard, types: ['id_card'] },
  { key: 'household', label: '户口簿', icon: Home, types: ['household'] },
  { key: 'social_security', label: '社保卡', icon: CreditCard, types: ['social_security'] },
  { key: 'marriage', label: '结婚证', icon: HeartHandshake, types: ['marriage'] },
  { key: 'birth', label: '出生证', icon: Baby, types: ['birth'] },
  { key: 'business_license', label: '营业执照', icon: Building2, types: ['business_license'] },
];

const certGradientMap: Record<string, string> = {
  id_card: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
  household: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #cd853f 100%)',
  social_security: 'linear-gradient(135deg, #0066b2 0%, #0080ff 50%, #3399ff 100%)',
  marriage: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
  birth: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)',
  business_license: 'linear-gradient(135deg, #7c2d12 0%, #a16207 50%, #ca8a04 100%)',
  other: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
};

const certIconMap: Record<string, React.ElementType> = {
  id_card: IdCard,
  household: Home,
  social_security: CreditCard,
  marriage: HeartHandshake,
  birth: Baby,
  business_license: Building2,
  other: FileCheck,
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

const maskCertificateNumber = (number: string, type: string) => {
  if (type === 'id_card' || type === 'social_security') {
    return number.slice(0, 6) + '********' + number.slice(-4);
  }
  if (type === 'household') {
    return number.slice(0, 3) + '********' + number.slice(-3);
  }
  return number.slice(0, 4) + '****' + number.slice(-4);
};

interface CertificateCardProps {
  certificate: Certificate;
  onShowDetail: (cert: Certificate) => void;
  onShow: (cert: Certificate) => void;
}

const CertificateCard = ({ certificate, onShowDetail, onShow }: CertificateCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const gradient = certGradientMap[certificate.type] || certGradientMap.other;
  const Icon = certIconMap[certificate.type] || certIconMap.other;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(certificate.certificateNumber);
      setCopied(true);
      message.success('证照号已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    message.success('证照下载已开始');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    message.success('分享链接已生成');
  };

  const isExpired = new Date(certificate.expiryDate) < new Date() && certificate.expiryDate.getFullYear() !== 9999;
  const isPermanent = certificate.expiryDate.getFullYear() === 9999;

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onShowDetail(certificate)}
    >
      <div
        className={`relative rounded-2xl p-6 transition-all duration-500 transform ${
          isHovered ? 'scale-105 -translate-y-2' : 'scale-100 translate-y-0'
        }`}
        style={{
          background: gradient,
          boxShadow: isHovered
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 10px 30px -5px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        <div className="absolute inset-0 rounded-2xl opacity-10">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              backgroundImage: `
                linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)
              `,
            }}
          />
        </div>

        <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
              transform: 'translate(-20%, 20%)',
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-0.5">{certificate.name}</h3>
                <div className="flex items-center gap-1.5">
                  {isExpired ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/80 text-white">
                      已过期
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/80 text-white">
                      {certificate.isValid ? '有效' : '无效'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <QrCode className="w-10 h-10 text-white/80" />
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <div>
              <p className="text-xs text-white/60 mb-1">证照号码</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-sm tracking-wide">
                  {maskCertificateNumber(certificate.certificateNumber, certificate.type)}
                </p>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-white/20 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-1">签发机关</p>
              <p className="text-white/90 text-sm">{certificate.issuer}</p>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-1">有效期</p>
              <p className="text-white/90 text-sm">
                {formatDate(certificate.issueDate)} - {isPermanent ? '长期有效' : formatDate(certificate.expiryDate)}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center justify-between pt-4 border-t border-white/20 transition-all duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShow(certificate);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all hover:bg-white/20"
            >
              <Eye className="w-4 h-4" />
              亮证
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
            opacity: isHovered ? 0 : 1,
          }}
        />
      </div>

      <div
        className="absolute -bottom-1 left-4 right-4 h-8 rounded-b-2xl transition-all duration-500"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          filter: 'blur(10px)',
          opacity: isHovered ? 0 : 1,
          transform: isHovered ? 'scale(0.8)' : 'scale(1)',
        }}
      />
    </div>
  );
};

interface ShowCertificateModalProps {
  certificate: Certificate;
  open: boolean;
  onClose: () => void;
}

const ShowCertificateModal = ({ certificate, open, onClose }: ShowCertificateModalProps) => {
  const gradient = certGradientMap[certificate.type] || certGradientMap.other;
  const Icon = certIconMap[certificate.type] || certIconMap.other;
  const isPermanent = certificate.expiryDate.getFullYear() === 9999;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
      closeIcon={false}
      className="cert-show-modal"
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
        content: { background: 'transparent', boxShadow: 'none' },
        body: { padding: 0 },
      }}
    >
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <p className="text-white/60 text-sm mb-2">正在展示电子证照</p>
          <p className="text-white font-bold text-xl">{certificate.name}</p>
        </div>

        <div
          className="rounded-3xl p-8 animate-pulse-slow"
          style={{
            background: gradient,
            boxShadow: '0 0 60px rgba(255, 255, 255, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="absolute inset-0 rounded-3xl opacity-20 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.2) 50%, transparent 55%)
                `,
                backgroundSize: '200% 200%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{certificate.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/80 text-white">
                    有效证照
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <p className="text-xs text-white/60 mb-2 text-center">证照号码</p>
              <p className="text-white font-mono text-xl text-center tracking-widest">
                {certificate.certificateNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-white/60 mb-1">签发机关</p>
                <p className="text-white text-sm">{certificate.issuer}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">签发日期</p>
                <p className="text-white text-sm">{formatDate(certificate.issueDate)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-white/60 mb-1">有效期至</p>
                <p className="text-white text-sm">
                  {isPermanent ? '长期有效' : formatDate(certificate.expiryDate)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
              <div className="w-36 h-36 bg-white border-2 border-gov-gray-200 rounded-xl flex items-center justify-center mb-3">
                <QrCode className="w-28 h-28 text-gov-gray-700" />
              </div>
              <p className="text-xs text-gov-gray-400">扫码验证证照真伪</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-white/40 text-xs">本电子证照与实体证照具有同等法律效力</p>
          <p className="text-white/30 text-xs mt-1">请妥善保管，切勿转借他人</p>
        </div>
      </div>
    </Modal>
  );
};

interface CertificateDetailModalProps {
  certificate: Certificate | null;
  open: boolean;
  onClose: () => void;
  onShow: (cert: Certificate) => void;
}

const CertificateDetailModal = ({ certificate, open, onClose, onShow }: CertificateDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  if (!certificate) return null;

  const gradient = certGradientMap[certificate.type] || certGradientMap.other;
  const Icon = certIconMap[certificate.type] || certIconMap.other;
  const isPermanent = certificate.expiryDate.getFullYear() === 9999;

  const handleDownload = () => {
    message.success('证照下载已开始');
  };

  const handleShare = () => {
    message.success('分享链接已生成');
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      closeIcon={false}
      className="cert-detail-modal"
      styles={{
        content: { borderRadius: '20px' },
        body: { padding: 0 },
      }}
    >
      <div className="relative">
        <div
          className="relative h-32 rounded-t-2xl overflow-hidden"
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)
                `,
              }}
            />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-6 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{certificate.name}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/80 text-white mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {certificate.isValid ? '有效' : '无效'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gov-gray-100">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === 'info' ? 'text-primary-500' : 'text-gov-gray-500 hover:text-gov-gray-700'
            }`}
          >
            证照信息
            {activeTab === 'info' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === 'history' ? 'text-primary-500' : 'text-gov-gray-500 hover:text-gov-gray-700'
            }`}
          >
            使用记录
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'info' ? (
            <div className="space-y-5">
              <div className="bg-gov-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gov-gray-700">基本信息</h4>
                  <span className="gov-badge-info">电子证照</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gov-gray-500">证照名称</span>
                    <span className="text-sm text-gov-gray-700 font-medium">{certificate.name}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gov-gray-500">证照号码</span>
                    <span className="text-sm text-gov-gray-700 font-mono">{certificate.certificateNumber}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gov-gray-500">签发机关</span>
                    <div className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-gov-gray-400" />
                      <span className="text-sm text-gov-gray-700">{certificate.issuer}</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gov-gray-500">签发日期</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gov-gray-400" />
                      <span className="text-sm text-gov-gray-700">{formatDate(certificate.issueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gov-gray-500">有效期至</span>
                    <span className="text-sm text-gov-gray-700">
                      {isPermanent ? '长期有效' : formatDate(certificate.expiryDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-dashed border-gov-gray-200 rounded-xl p-5 flex flex-col items-center">
                <div className="w-32 h-32 bg-gov-gray-50 rounded-xl flex items-center justify-center mb-3">
                  <QrCode className="w-24 h-24 text-gov-gray-400" />
                </div>
                <p className="text-sm text-gov-gray-500">扫描二维码验证证照信息</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onShow(certificate);
                  }}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-primary-600">亮证</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-gov-gray-50 hover:bg-gov-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gov-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gov-gray-600">下载</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-gov-gray-50 hover:bg-gov-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gov-green flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gov-gray-600">分享</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { date: '2024-06-10 14:30', action: '社保缴费查询', dept: '人力资源和社会保障局' },
                { date: '2024-05-20 09:15', action: '公积金提取', dept: '住房和城乡建设厅' },
                { date: '2024-03-15 16:45', action: '不动产登记', dept: '自然资源厅' },
              ].map((record, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-500 flex-shrink-0" />
                    {idx < 2 && <div className="w-0.5 h-12 bg-gov-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gov-gray-700">{record.action}</h4>
                      <span className="text-xs text-gov-gray-400">{record.date}</span>
                    </div>
                    <p className="text-xs text-gov-gray-400">{record.dept}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default function Certificates() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const filteredCertificates = useMemo(() => {
    if (activeCategory === 'all') {
      return mockCertificates;
    }
    const category = certificateCategories.find((c) => c.key === activeCategory);
    if (!category) return mockCertificates;
    return mockCertificates.filter((cert) => category.types.includes(cert.type));
  }, [activeCategory]);

  const handleShowDetail = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setDetailModalOpen(true);
  };

  const handleShow = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setShowModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
  };

  const handleCloseShow = () => {
    setShowModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gov-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gov-gray-700 mb-2">电子证照中心</h1>
          <p className="text-gov-gray-400">管理和使用您的各类电子证照，安全便捷</p>
        </div>

        <div className="gov-card p-6 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {certificateCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat.key
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                      : 'bg-gov-gray-100 text-gov-gray-600 hover:bg-gov-gray-200 hover:scale-102'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                  {cat.key === 'all' && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      activeCategory === cat.key ? 'bg-white/20' : 'bg-gov-gray-200'
                    }`}>
                      {mockCertificates.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gov-gray-400">
            共 <span className="text-primary-500 font-semibold">{filteredCertificates.length}</span> 张证照
          </p>
        </div>

        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCertificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onShowDetail={handleShowDetail}
                onShow={handleShow}
              />
            ))}
          </div>
        ) : (
          <div className="gov-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gov-gray-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-gov-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gov-gray-600 mb-2">暂无此类证照</h3>
            <p className="text-sm text-gov-gray-400">您可以添加新的证照或切换其他分类查看</p>
          </div>
        )}
      </div>

      <CertificateDetailModal
        certificate={selectedCertificate}
        open={detailModalOpen}
        onClose={handleCloseDetail}
        onShow={handleShow}
      />

      {selectedCertificate && (
        <ShowCertificateModal
          certificate={selectedCertificate}
          open={showModalOpen}
          onClose={handleCloseShow}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% -200%; }
          100% { background-position: 200% 200%; }
        }
        .cert-show-modal .ant-modal-content {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
