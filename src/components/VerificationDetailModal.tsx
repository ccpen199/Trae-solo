import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  ShieldCheck,
  Eye,
  Link2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Hash,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  Printer,
  Video,
  MapPin,
  Building2,
  FileCheck2,
  Image as ImageIcon,
  ScanLine,
  Phone,
  Home,
  Search,
  History,
  Users,
  ThumbsUp,
  Star,
  AlertCircle,
} from 'lucide-react';
import type { Property, VerificationNode } from '@/mock/data';
import { cn } from '@/lib/utils';

interface VerificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const truncateHash = (hash: string) => {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
};

interface ViewingRecord {
  id: string;
  clientCode: string;
  viewingTime: string;
  intentionLevel: 'high' | 'medium' | 'low';
  feedback: string;
}

interface CleaningLayer {
  id: number;
  name: string;
  status: 'pass' | 'fail' | 'pending';
  detail: string;
}

interface ReviewRecord {
  id: string;
  reviewTime: string;
  operator: string;
  operation: string;
  result: 'pass' | 'fail' | 'pending';
  remark: string;
}

export default function VerificationDetailModal({
  isOpen,
  onClose,
  property,
}: VerificationDetailModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>('broker');
  const [showCleaning, setShowCleaning] = useState(false);
  const [showReviewLog, setShowReviewLog] = useState(true);
  const [chainVerificationStatus, setChainVerificationStatus] = useState<'idle' | 'loading' | 'verified'>('idle');

  if (!property) return null;

  const chain = property.verificationChain || [];

  const viewingRecords: ViewingRecord[] = [
    { id: '1', clientCode: '客户A****82', viewingTime: '2024-06-10 14:30', intentionLevel: 'high', feedback: '户型方正，采光好，意向强烈' },
    { id: '2', clientCode: '客户B****45', viewingTime: '2024-06-08 10:00', intentionLevel: 'medium', feedback: '价格可谈，需考虑' },
    { id: '3', clientCode: '客户C****19', viewingTime: '2024-06-05 16:45', intentionLevel: 'low', feedback: '楼层偏低，再看看' },
    { id: '4', clientCode: '客户D****67', viewingTime: '2024-06-02 11:20', intentionLevel: 'medium', feedback: '小区环境满意' },
  ];

  const cleaningLayers: CleaningLayer[] = [
    { id: 1, name: '图片OCR比对', status: 'pass', detail: '12张图片OCR文字与描述匹配度98.6%' },
    { id: 2, name: '电话号码一致性校验', status: 'pass', detail: '经纪人电话与备案电话一致' },
    { id: 3, name: '挂牌时效衰减加权', status: 'pass', detail: '已挂牌45天，时效衰减系数0.92' },
    { id: 4, name: '行政区划标准映射', status: 'pass', detail: '地址已映射至国家标准行政区划代码' },
    { id: 5, name: '房源去重指纹比对', status: 'pass', detail: '未检测到重复房源（相似度<60%）' },
    { id: 6, name: '价格异常值剔除', status: 'pass', detail: '价格在片区合理区间内（偏离度8.2%）' },
    { id: 7, name: '户型字段标准化', status: 'pass', detail: '已统一为标准户型格式：3室2厅2卫' },
    { id: 8, name: '面积单位统一校验', status: 'pass', detail: '建筑面积120.5㎡，套内面积95.3㎡' },
    { id: 9, name: '地址地理编码校正', status: 'pass', detail: '坐标偏差<50米，地址精确匹配' },
    { id: 10, name: '图片分辨率过滤', status: 'pass', detail: '所有图片分辨率≥1024×768' },
    { id: 11, name: '敏感词内容审核', status: 'pass', detail: '未检测到违规或敏感内容' },
    { id: 12, name: '房源完整性检查', status: 'pass', detail: '必填字段完整度100%，共28项' },
  ];

  const reviewRecords: ReviewRecord[] = [
    { id: '1', reviewTime: '2024-06-12 09:00:00', operator: '系统自动', operation: '定时复查', result: 'pass', remark: '房源状态活跃，价格无异常' },
    { id: '2', reviewTime: '2024-06-10 15:32:00', operator: '张审核', operation: '人工抽检', result: 'pass', remark: '图片与描述一致，价格合理' },
    { id: '3', reviewTime: '2024-06-08 11:20:00', operator: '系统自动', operation: '带看记录回传核验', result: 'pass', remark: '新增2条带看记录已验证' },
    { id: '4', reviewTime: '2024-06-05 08:45:00', operator: '李审核', operation: '举报核查', result: 'pass', remark: '收到用户举报，核查后不成立' },
    { id: '5', reviewTime: '2024-06-01 14:00:00', operator: '系统自动', operation: '首次发布核验', result: 'pass', remark: '12层清洗全部通过，准予上架' },
    { id: '6', reviewTime: '2024-06-01 13:20:00', operator: '王审核', operation: '人工审核', result: 'pass', remark: '资料齐全，真房源认证通过' },
  ];

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const verifyOnChain = () => {
    setChainVerificationStatus('loading');
    setTimeout(() => {
      setChainVerificationStatus('verified');
      setTimeout(() => setChainVerificationStatus('idle'), 3000);
    }, 1500);
  };

  const toggleStep = (step: string) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  const stepConfig = [
    {
      type: 'broker' as const,
      title: '经纪人实名认证',
      description: '验证经纪人执业资格与身份信息',
      Icon: UserCheck,
      color: 'from-primary-500 to-primary-700',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      borderColor: 'border-primary-200',
      subSteps: [
        { label: '身份证正反面核验', detail: '已通过OCR识别与公安接口校验', status: 'pass' as const },
        { label: '经纪人资格证编号核验', detail: `证书编号：京房经字第${Math.floor(Math.random() * 90000 + 10000)}号`, status: 'pass' as const },
        { label: '人脸比对通过', detail: '活体检测相似度96.8%', status: 'pass' as const },
        { label: '所属门店验证', detail: property.brokerCompany || '北京安居房地产经纪有限公司', status: 'pass' as const },
      ],
    },
    {
      type: 'viewing' as const,
      title: '带看记录回传',
      description: '真实带看行为记录与客户反馈',
      Icon: Users,
      color: 'from-sky-500 to-blue-600',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-200',
      subSteps: [],
    },
    {
      type: 'owner' as const,
      title: '业主产权核验与授权',
      description: '核验房源产权归属与业主授权委托书',
      Icon: ShieldCheck,
      color: 'from-emerald-500 to-emerald-700',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      subSteps: [
        { label: '房屋产权编号核验', detail: '不动产权证编号核验通过', status: 'pass' as const },
        { label: '业主身份证匹配', detail: '产权人姓名与身份证号一致', status: 'pass' as const },
        { label: '授权委托协议签署', detail: '电子签名已存证，委托期限1年', status: 'pass' as const },
        { label: '房屋状态核查', detail: '无抵押、无查封、可正常交易', status: 'pass' as const },
      ],
    },
    {
      type: 'vr' as const,
      title: 'VR实景采集与水印',
      description: '现场VR拍摄与房源实景水印验证',
      Icon: Video,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      subSteps: [
        { label: 'VR视频录制', detail: '共36个场景，时长2分45秒', status: 'pass' as const },
        { label: '帧间差分水印', detail: '不可擦除数字水印已嵌入', status: 'pass' as const },
        { label: 'GPS拍摄坐标', detail: `经度116.4${Math.floor(Math.random() * 9000 + 1000)}，纬度39.9${Math.floor(Math.random() * 9000 + 1000)}`, status: 'pass' as const },
        { label: '设备MAC地址', detail: 'VR采集设备：****:8A:3D:7E', status: 'pass' as const },
      ],
    },
    {
      type: 'chain' as const,
      title: '区块链存证',
      description: '核验数据上链存证，生成不可篡改哈希',
      Icon: Link2,
      color: 'from-violet-500 to-purple-700',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      borderColor: 'border-violet-200',
      subSteps: [
        { label: '存证区块号', detail: `#18,${Math.floor(Math.random() * 9000000 + 1000000)}`, status: 'pass' as const },
        { label: '交易哈希', detail: chain.find(n => n.type === 'chain')?.hash || '0x' + Array.from({length:64},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join(''), status: 'pass' as const },
        { label: '上链时间戳', detail: chain.find(n => n.type === 'chain')?.timestamp ? formatDate(chain.find(n => n.type === 'chain')!.timestamp) : '2024-06-01 13:45:22', status: 'pass' as const },
        { label: '存证内容摘要', detail: '房源基础信息+核验数据共2.3KB', status: 'pass' as const },
      ],
    },
  ];

  const overallQuality = 98.6;
  const chainHash = chain.find(n => n.type === 'chain')?.hash || '0x7a3f9d2e8c1b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="relative bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-7 w-7 text-accent-verified" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-verified/20 text-accent-verified text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      已通过全链核验
                    </span>
                    <span className="text-xs text-white/60">
                      房源编号：{property.id.slice(0, 12)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/80">
                      <FileCheck2 className="h-3 w-3" />
                      12层清洗 · {overallQuality}分
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-1 truncate">{property.title}</h2>
                  <p className="text-sm text-white/70 truncate">
                    {property.district} · {property.city} · {property.area}㎡ · {property.bedrooms}室{property.bathrooms}卫
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(92vh-180px)] p-6 scrollbar-thin">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    核验流程全链路
                  </h3>
                  <span className="text-xs text-neutral-400">5大环节 · {chain.filter(n => n.status === 'verified').length}项已通过</span>
                </div>

                <div className="relative">
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary-200 via-emerald-200 to-violet-200" />

                  <div className="space-y-4">
                    {stepConfig.map((step, idx) => {
                      const node = chain.find((n) => n.type === step.type);
                      const isVerified = node?.status === 'verified' || step.type === 'viewing';
                      const isPending = node?.status === 'pending';
                      const isRejected = node?.status === 'rejected';
                      const isExpanded = expandedStep === step.type;

                      const StatusIcon = isVerified
                        ? CheckCircle2
                        : isRejected
                        ? XCircle
                        : Clock;

                      const statusText = isVerified
                        ? '核验通过'
                        : isRejected
                        ? '核验未通过'
                        : isPending
                        ? '核验中'
                        : '未开始';

                      const statusColor = isVerified
                        ? 'text-emerald-600 bg-emerald-50'
                        : isRejected
                        ? 'text-red-600 bg-red-50'
                        : isPending
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-neutral-400 bg-neutral-50';

                      return (
                        <motion.div
                          key={step.type}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="relative pl-16"
                        >
                          <div
                            className={cn(
                              'absolute left-0 top-0 h-12 w-12 rounded-full flex items-center justify-center border-2 shadow-sm z-10',
                              isVerified
                                ? `bg-gradient-to-br ${step.color} border-transparent text-white`
                                : isRejected
                                ? 'bg-red-50 border-red-200 text-red-500'
                                : isPending
                                ? 'bg-amber-50 border-amber-200 text-amber-500 animate-pulse'
                                : 'bg-white border-neutral-200 text-neutral-300'
                            )}
                          >
                            <step.Icon className="h-5 w-5" />
                          </div>

                          <div
                            className={cn(
                              'rounded-xl border transition-all overflow-hidden',
                              step.borderColor,
                              step.bgColor,
                              isExpanded && 'ring-2 ring-primary-300/50'
                            )}
                          >
                            <button
                              onClick={() => toggleStep(step.type)}
                              className="w-full p-4 flex items-start justify-between gap-4 text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={cn('font-semibold', step.textColor)}>
                                    {step.title}
                                  </h4>
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                                      statusColor
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {statusText}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-500">{step.description}</p>

                                {node && (
                                  <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1">
                                      <UserCheck className="h-3.5 w-3.5" />
                                      操作人：{node.operator}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatDate(node.timestamp)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-neutral-400 shrink-0 mt-1" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-neutral-400 shrink-0 mt-1" />
                              )}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-2 border-t border-current/10">
                                    {step.type === 'viewing' ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-neutral-500">累计带看 <span className="font-semibold text-sky-700">{viewingRecords.length}</span> 次</span>
                                          <span className="text-neutral-500">高意向 <span className="font-semibold text-emerald-600">{viewingRecords.filter(r => r.intentionLevel === 'high').length}</span> 组</span>
                                        </div>
                                        <div className="space-y-2">
                                          {viewingRecords.map((record) => (
                                            <div key={record.id} className="bg-white rounded-lg border border-sky-100 p-3">
                                              <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                  <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center">
                                                    <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                                                  </div>
                                                  <span className="text-sm font-medium text-neutral-800">{record.clientCode}</span>
                                                </div>
                                                <span className={cn(
                                                  'px-2 py-0.5 rounded-full text-xs font-medium',
                                                  record.intentionLevel === 'high' ? 'bg-red-100 text-red-700' :
                                                  record.intentionLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                  'bg-neutral-100 text-neutral-600'
                                                )}>
                                                  {record.intentionLevel === 'high' ? '高意向' : record.intentionLevel === 'medium' ? '中意向' : '低意向'}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 text-xs text-neutral-500 mb-2">
                                                <span className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  {record.viewingTime}
                                                </span>
                                              </div>
                                              <p className="text-xs text-neutral-600 italic">
                                                "{record.feedback}"
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2.5">
                                        {step.subSteps.map((sub, subIdx) => (
                                          <div key={subIdx} className="flex items-start gap-3 bg-white/70 rounded-lg p-2.5 border border-white">
                                            <div className={cn(
                                              'h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                              sub.status === 'pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                            )}>
                                              {sub.status === 'pass' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-neutral-800">{sub.label}</p>
                                              <p className="text-xs text-neutral-500 mt-0.5">{sub.detail}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {step.type === 'chain' && (
                                      <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-neutral-600">存证交易哈希</span>
                                          <button
                                            onClick={() => copyHash(chainHash)}
                                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                          >
                                            {copiedHash ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            {copiedHash ? '已复制' : '复制'}
                                          </button>
                                        </div>
                                        <code className="block font-mono text-xs bg-white/80 border border-violet-200 rounded-lg p-3 text-neutral-700 break-all">
                                          {chainHash}
                                        </code>
                                        <button
                                          onClick={verifyOnChain}
                                          disabled={chainVerificationStatus === 'loading'}
                                          className={cn(
                                            'w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                                            chainVerificationStatus === 'verified'
                                              ? 'bg-emerald-500 text-white'
                                              : chainVerificationStatus === 'loading'
                                              ? 'bg-violet-200 text-violet-700'
                                              : 'bg-violet-600 text-white hover:bg-violet-700'
                                          )}
                                        >
                                          {chainVerificationStatus === 'loading' ? (
                                            <>
                                              <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                                              />
                                              链上验证中...
                                            </>
                                          ) : chainVerificationStatus === 'verified' ? (
                                            <>
                                              <CheckCircle2 className="h-4 w-4" />
                                              ✓ 链上数据与本地一致
                                            </>
                                          ) : (
                                            <>
                                              <ExternalLink className="h-4 w-4" />
                                              点击验证链上存证
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {idx < stepConfig.length - 1 && (
                            <div className="absolute left-6 top-[60px] -translate-x-1/2 z-20">
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4',
                                  isVerified ? step.textColor : 'text-neutral-300'
                                )}
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <button
                  onClick={() => setShowCleaning(!showCleaning)}
                  className="w-full flex items-center justify-between mb-4 p-4 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <ScanLine className="h-5 w-5 text-primary-700" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-neutral-900">12层数据清洗报告</h3>
                      <p className="text-sm text-neutral-500">跨渠道房源数据质量评估 · 综合得分 {overallQuality}分</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-700">{overallQuality}<span className="text-sm font-normal text-neutral-500">分</span></p>
                      <p className="text-xs text-emerald-600">12/12 项通过</p>
                    </div>
                    {showCleaning ? <ChevronUp className="h-5 w-5 text-neutral-400" /> : <ChevronDown className="h-5 w-5 text-neutral-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {showCleaning && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
                        {cleaningLayers.map((layer) => (
                          <div
                            key={layer.id}
                            className={cn(
                              'rounded-lg border p-3 transition-all',
                              layer.status === 'pass'
                                ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                                : layer.status === 'fail'
                                ? 'border-red-200 bg-red-50/40'
                                : 'border-amber-200 bg-amber-50/40'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {layer.status === 'pass' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : layer.status === 'fail' ? (
                                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                              )}
                              <span className="text-xs font-medium text-neutral-800">{layer.id}. {layer.name}</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 line-clamp-2">{layer.detail}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => setShowReviewLog(!showReviewLog)}
                  className="w-full flex items-center justify-between mb-4 p-4 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <History className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-neutral-900">核验复查记录</h3>
                      <p className="text-sm text-neutral-500">全流程操作留痕 · 可追溯可审计</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-700">{reviewRecords.length}<span className="text-sm font-normal text-neutral-500">条</span></p>
                      <p className="text-xs text-emerald-600">全部通过</p>
                    </div>
                    {showReviewLog ? <ChevronUp className="h-5 w-5 text-neutral-400" /> : <ChevronDown className="h-5 w-5 text-neutral-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {showReviewLog && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="relative">
                        <div className="absolute left-4 top-3 bottom-3 w-px bg-gradient-to-b from-primary-300 via-emerald-300 to-neutral-200" />
                        <div className="space-y-4">
                          {reviewRecords.map((record, idx) => (
                            <div key={record.id} className="relative pl-10">
                              <div className={cn(
                                'absolute left-3 top-0.5 h-3 w-3 rounded-full border-2 border-white',
                                record.result === 'pass' ? 'bg-emerald-500' : record.result === 'fail' ? 'bg-red-500' : 'bg-amber-500'
                              )} />
                              <div className="bg-white rounded-lg border border-neutral-200 p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-neutral-800">{record.operation}</span>
                                    <span className={cn(
                                      'px-1.5 py-0.5 rounded text-xs font-medium',
                                      record.result === 'pass' ? 'bg-emerald-100 text-emerald-700' : record.result === 'fail' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    )}>
                                      {record.result === 'pass' ? '通过' : record.result === 'fail' ? '未通过' : '待处理'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-neutral-400">{record.reviewTime}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-neutral-500">
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" />
                                    {record.operator}
                                  </span>
                                  {record.remark && (
                                    <span className="text-neutral-400">| {record.remark}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
                  <p className="text-xs text-neutral-500 mb-1">核验完成度</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {Math.round((stepConfig.filter((_, i) => i <= 4).length / 5) * 100)}%
                  </p>
                  <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-accent-verified to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
                  <p className="text-xs text-neutral-500 mb-1">链上存证日期</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {chain.find((n) => n.type === 'chain')
                      ? formatDateShort(chain.find((n) => n.type === 'chain')!.timestamp)
                      : '-'}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    数据已永久存证
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
                  <p className="text-xs text-neutral-500 mb-1">挂牌时效</p>
                  <p className="text-lg font-semibold text-neutral-900">45<span className="text-sm font-normal text-neutral-500 ml-1">天</span></p>
                  <p className="text-xs text-neutral-400 mt-1">衰减系数 0.92</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
                  <p className="text-xs text-neutral-500 mb-1">专属经纪人</p>
                  <p className="text-lg font-semibold text-neutral-900 truncate">
                    {property.brokerName || '王经理'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1 truncate">
                    {property.brokerCompany || '安居地产'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border-t border-neutral-200 bg-neutral-50">
              <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-verified" />
                所有核验数据已通过区块链技术加密存证，不可篡改
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" />
                  关闭
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-primary-800 hover:bg-primary-900 rounded-lg transition-colors flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  下载核验报告
                </button>
                <button className="px-4 py-2 text-sm font-medium text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1.5">
                  <Printer className="h-4 w-4" />
                  打印
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
