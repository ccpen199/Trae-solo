import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CreditCard, BookOpen, Car, Shield, Heart, Home,
  Building2, Landmark, GraduationCap, Receipt, Accessibility,
  Pill, Baby, X, ScanLine, CheckCircle2, XCircle, Clock,
  Filter, ChevronLeft, ChevronRight, Eye, Share2, Download,
  FileCheck, ArrowLeftRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { certificates, certificateTypes, certificateAccessLogs } from '@/mock/data';
import type { Certificate, CertificateAccessLog } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  CreditCard, BookOpen, Car, Shield, Heart, Home, Building2,
  Landmark, GraduationCap, Receipt, Accessibility, Pill, Baby,
};

const categories = [
  '全部', '身份认证', '民生保障', '医疗健康', '出行交通',
  '企业经营', '职业资格', '房产不动产', '税务财务',
];

const statusConfig = {
  valid: { label: '有效', color: 'bg-emerald-100 text-emerald-700' },
  expiring: { label: '即将过期', color: 'bg-amber-100 text-amber-700' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-700' },
};

const accessTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  verify: { label: '核验', icon: FileCheck, color: 'text-blue-600 bg-blue-50' },
  display: { label: '展示', icon: Eye, color: 'text-emerald-600 bg-emerald-50' },
  share: { label: '共享', icon: Share2, color: 'text-violet-600 bg-violet-50' },
  download: { label: '下载', icon: Download, color: 'text-amber-600 bg-amber-50' },
};

function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

const mockVerificationHistory = [
  { time: '2026-06-10 09:15', verified: true },
  { time: '2026-06-08 14:30', verified: true },
  { time: '2026-06-05 11:20', verified: false },
  { time: '2026-05-28 16:45', verified: true },
];

function QRModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const [countdown, setCountdown] = useState(60);
  const [verified, setVerified] = useState(true);
  const [lastVerifyTime] = useState('2026-06-10 09:15:22');
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - countdown / 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const verifyTimer = setInterval(() => {
      setVerified((v) => !v);
    }, 5000);
    return () => clearInterval(verifyTimer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gov-text-secondary hover:text-gov-text"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gov-text">{cert.typeName}</h3>
          <p className="text-sm text-gov-text-secondary">{cert.issuingAuthority}</p>
        </div>

        <div className="relative bg-white p-4 rounded-xl border-2 border-dashed border-gov-border mb-4 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] text-6xl font-bold text-gov-blue pointer-events-none select-none -rotate-30">
            昆山政务
          </div>
          <div className="flex justify-center mb-3">
            <QRCodeSVG
              value={`https://gov.ks.cn/cert/${cert.id}`}
              size={160}
              level="M"
              bgColor="#ffffff"
              fgColor="#1E293B"
            />
          </div>
          <div className="flex justify-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" width="56" height="56">
                <circle cx="28" cy="28" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle
                  cx="28" cy="28" r={radius} fill="none" stroke="#1A56DB" strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="text-xs font-semibold text-gov-blue">{countdown}s</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-gov-bg">
          <span className="text-sm text-gov-text-secondary">核验状态:</span>
          {verified ? (
            <motion.span key="verified" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> 已核验
            </motion.span>
          ) : (
            <motion.span key="unverified" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Clock className="w-4 h-4" /> 未核验
            </motion.span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">持证人</span>
            <span className="text-gov-text font-medium">{maskName(cert.holderName)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">证件号</span>
            <span className="text-gov-text font-medium">{cert.holderIdCard}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">签发日期</span>
            <span className="text-gov-text font-medium">{cert.issueDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">有效期至</span>
            <span className="text-gov-text font-medium">{cert.expiryDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">最近核验</span>
            <span className="text-gov-text font-medium">{lastVerifyTime}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gov-border">
          <h4 className="text-sm font-semibold text-gov-text mb-2">核验记录</h4>
          <div className="space-y-2">
            {mockVerificationHistory.map((record, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gov-text-secondary">{record.time}</span>
                {record.verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> 核验通过
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <XCircle className="w-3 h-3" /> 核验失败
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MyCertificatesTab() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = certificates;
    if (activeCategory !== '全部') {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.typeName.toLowerCase().includes(q) ||
          c.holderName.toLowerCase().includes(q) ||
          c.issuingAuthority.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  return (
    <div>
      <div className="flex items-center bg-white rounded-lg border border-gov-border px-3 py-2 mb-4 max-w-md">
        <Search className="w-4 h-4 text-gov-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索证照名称、持证人..."
          className="flex-1 ml-2 border-none outline-none text-sm text-gov-text placeholder-gov-text-secondary"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-gov-blue text-white font-medium'
                : 'bg-white text-gov-text-secondary border border-gov-border hover:border-gov-blue/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cert) => {
          const Icon = iconMap[cert.icon] || CreditCard;
          const status = statusConfig[cert.status];
          const isExpanded = expandedCard === cert.id;
          const certLogs = certificateAccessLogs.filter(
            (l) => l.certificateName === cert.typeName
          ).slice(0, 3);

          return (
            <motion.div
              key={cert.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="gov-card gov-card-hover p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gov-blue to-gov-blue-light flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gov-text truncate">{cert.typeName}</h3>
                    <span className={`gov-badge ${status.color} shrink-0`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-gov-text-secondary">{maskName(cert.holderName)}</p>
                  <p className="text-xs text-gov-text-secondary mt-0.5">{cert.issuingAuthority}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gov-text-secondary pt-3 border-t border-gov-border mb-3">
                <span>签发: {cert.issueDate}</span>
                <span>有效期: {cert.expiryDate}</span>
              </div>

              <button
                onClick={() => setSelectedCert(cert)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gov-blue text-white text-sm font-medium hover:bg-gov-blue/90 transition-colors"
              >
                <ScanLine className="w-4 h-4" /> 扫码亮证
              </button>

              <button
                onClick={() => setExpandedCard(isExpanded ? null : cert.id)}
                className="w-full flex items-center justify-center gap-1 mt-2 text-xs text-gov-text-secondary hover:text-gov-blue transition-colors"
              >
                <ArrowLeftRight className="w-3 h-3" />
                {isExpanded ? '收起核验记录' : '查看核验记录'}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 pt-2 border-t border-gov-border space-y-2">
                      {certLogs.length > 0 ? certLogs.map((log) => {
                        const typeConf = accessTypeConfig[log.accessType];
                        const TypeIcon = typeConf.icon;
                        return (
                          <div key={log.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className={`w-3 h-3 ${typeConf.color.split(' ')[0]}`} />
                              <span className="text-gov-text-secondary">{log.time.slice(5, 16)}</span>
                            </div>
                            <span className={log.result === 'success' ? 'text-emerald-600' : 'text-red-500'}>
                              {log.result === 'success' ? '成功' : '已拒绝'}
                            </span>
                          </div>
                        );
                      }) : (
                        <p className="text-xs text-gov-text-secondary text-center py-1">暂无核验记录</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gov-text-secondary">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">未找到相关证照</p>
        </div>
      )}

      <AnimatePresence>
        {selectedCert && <QRModal cert={selectedCert} onClose={() => setSelectedCert(null)} />}
      </AnimatePresence>
    </div>
  );
}

const PAGE_SIZE = 30;

function CertificateCatalogTab() {
  const [selectedCategory, setSelectedCategory] = useState(categories[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      if (cat === '全部') {
        counts[cat] = certificateTypes.length;
      } else {
        counts[cat] = certificateTypes.filter((ct) => ct.category === cat).length;
      }
    });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let result = certificateTypes;
    if (selectedCategory !== '全部') {
      result = result.filter((ct) => ct.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ct) =>
          ct.name.toLowerCase().includes(q) ||
          ct.issuingAuthority.toLowerCase().includes(q) ||
          ct.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex gap-4">
      <div className="w-48 shrink-0 hidden md:block">
        <div className="gov-card p-3 sticky top-4">
          <h3 className="text-sm font-semibold text-gov-text mb-3">证照分类</h3>
          <div className="space-y-1">
            {categories.slice(1).map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                  selectedCategory === cat
                    ? 'bg-gov-blue text-white font-medium'
                    : 'text-gov-text-secondary hover:bg-gov-bg'
                }`}
              >
                <span className="truncate">{cat}</span>
                <span className={`text-xs ml-1 ${selectedCategory === cat ? 'text-white/80' : 'text-gov-text-secondary'}`}>
                  {categoryCounts[cat]}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gov-border text-center">
            <span className="text-xs text-gov-text-secondary">共 {certificateTypes.length} 类</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center bg-white rounded-lg border border-gov-border px-3 py-2 mb-4">
          <Search className="w-4 h-4 text-gov-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="搜索证照类型..."
            className="flex-1 ml-2 border-none outline-none text-sm text-gov-text placeholder-gov-text-secondary"
          />
        </div>

        <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-thin">
          {categories.slice(1).map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gov-blue text-white font-medium'
                  : 'bg-white text-gov-text-secondary border border-gov-border'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gov-text-secondary">
            {selectedCategory} · 共 {filtered.length} 类证照
          </span>
          <span className="text-xs text-gov-text-secondary">第 {page}/{totalPages} 页</span>
        </div>

        <div className="space-y-2">
          {paged.map((ct) => (
            <motion.div
              key={ct.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="gov-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gov-text">{ct.name}</h4>
                  <p className="text-xs text-gov-text-secondary mt-1">{ct.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block gov-badge bg-blue-50 text-blue-700 text-xs">{ct.category}</span>
                  <p className="text-xs text-gov-text-secondary mt-1">{ct.issuingAuthority}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {paged.length === 0 && (
          <div className="text-center py-16 text-gov-text-secondary">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">未找到相关证照类型</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gov-border disabled:opacity-40 hover:bg-gov-bg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    page === pageNum
                      ? 'bg-gov-blue text-white'
                      : 'border border-gov-border text-gov-text-secondary hover:bg-gov-bg'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gov-border disabled:opacity-40 hover:bg-gov-bg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccessLogsSection() {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    let result = certificateAccessLogs;
    if (filterType !== 'all') {
      result = result.filter((l) => l.accessType === filterType);
    }
    return showAll ? result : result.slice(0, 8);
  }, [filterType, showAll]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gov-text">权限调用记录</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gov-text-secondary" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gov-border rounded-lg px-2 py-1 text-gov-text bg-white outline-none"
          >
            <option value="all">全部类型</option>
            <option value="verify">核验</option>
            <option value="display">展示</option>
            <option value="share">共享</option>
            <option value="download">下载</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gov-border" />
        <div className="space-y-3">
          {filtered.map((log: CertificateAccessLog) => {
            const typeConf = accessTypeConfig[log.accessType];
            const TypeIcon = typeConf.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-10"
              >
                <div className={`absolute left-2 top-3 w-5 h-5 rounded-full flex items-center justify-center ${typeConf.color}`}>
                  <TypeIcon className="w-3 h-3" />
                </div>
                <div className="gov-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gov-text">{log.certificateName}</h4>
                        <span className={`gov-badge text-xs ${typeConf.color}`}>{typeConf.label}</span>
                      </div>
                      <p className="text-xs text-gov-text-secondary">
                        调用方: {log.accessedBy} · 用途: {log.purpose}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {log.result === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 成功
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                          <XCircle className="w-3.5 h-3.5" /> 已拒绝
                        </span>
                      )}
                      <p className="text-xs text-gov-text-secondary mt-0.5">{log.time}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!showAll && certificateAccessLogs.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-3 py-2 text-sm text-gov-blue font-medium hover:underline"
        >
          查看更多记录
        </button>
      )}
    </div>
  );
}

export default function Certificates() {
  const [activeTab, setActiveTab] = useState<'personal' | 'catalog'>('personal');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
    >
      <h1 className="text-2xl font-bold text-gov-text mb-6">电子证照</h1>

      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gov-border max-w-xs">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'personal'
              ? 'bg-gov-blue text-white'
              : 'text-gov-text-secondary hover:bg-gov-bg'
          }`}
        >
          我的证照
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'catalog'
              ? 'bg-gov-blue text-white'
              : 'text-gov-text-secondary hover:bg-gov-bg'
          }`}
        >
          证照目录
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'personal' ? (
          <motion.div key="personal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <MyCertificatesTab />
          </motion.div>
        ) : (
          <motion.div key="catalog" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <CertificateCatalogTab />
          </motion.div>
        )}
      </AnimatePresence>

      <AccessLogsSection />
    </motion.div>
  );
}
