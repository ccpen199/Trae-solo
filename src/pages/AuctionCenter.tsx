import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  FileCheck,
  Gavel,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Upload,
  Camera,
  Shield,
  TrendingUp,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockDepositRecords, mockBidder, mockProperties } from '@/mock/data';
import { formatPrice, formatDate, cn } from '@/utils';

const menuItems = [
  { key: 'bids', label: '我的竞拍', icon: Gavel },
  { key: 'deposit', label: '保证金管理', icon: CreditCard },
  { key: 'qualification', label: '资质审核', icon: FileCheck },
  { key: 'favorites', label: '我的关注', icon: Bell },
  { key: 'settings', label: '账号设置', icon: Settings },
];

function QualificationContent() {
  const [fundUploadStatus, setFundUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('success');
  const [creditStatus, setCreditStatus] = useState<'idle' | 'checking' | 'passed' | 'failed'>('passed');
  const [uploadProgress, setUploadProgress] = useState(65);

  const fundAmount = 5800000;
  const fundProofDate = '2026-06-15';
  const creditCheckDate = '2026-06-18';
  const creditReportNo = 'CR-2026-0618-8857';

  const steps = [
    { key: 'realname', label: '实名认证', status: 'completed' as const },
    { key: 'fund', label: '资金证明', status: mockBidder.fundProofStatus === 'verified' ? 'completed' as const : mockBidder.fundProofStatus === 'pending' ? 'current' as const : 'upcoming' as const },
    { key: 'credit', label: '征信核验', status: mockBidder.fundProofStatus === 'verified' ? 'completed' as const : 'upcoming' as const },
    { key: 'risk', label: '风险测评', status: mockBidder.fundProofStatus === 'verified' ? 'completed' as const : 'upcoming' as const },
  ];

  const canSubmit = fundUploadStatus === 'success' && creditStatus === 'passed';

  const auditHistory = [
    { time: '2026-06-18 14:30', type: 'submit', desc: '您提交了资质审核申请' },
    { time: '2026-06-18 15:12', type: 'review', desc: '审核专员已受理，正在审核资料' },
    { time: '2026-06-19 09:45', type: 'info', desc: '实名认证核验通过' },
    { time: '2026-06-19 10:30', type: 'info', desc: '资金证明核验通过' },
    { time: '2026-06-19 11:20', type: 'info', desc: '征信报告核验通过' },
    { time: '2026-06-19 14:00', type: 'pass', desc: '资质审核已通过，可参与竞拍' },
  ];

  const rejectedMaterials = [
    '银行存款证明金额不足，需提供至少500万存款证明',
    '征信报告查询时间超过7天，请重新查询',
    '身份证照片不清晰，请重新上传',
  ];

  return (
    <div className="space-y-6">
      {/* 审核状态总览 */}
      <div className="bg-white rounded-xl border border-ink-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-serif font-bold text-xl text-ink-900 mb-1">
              竞买人资质审核
            </h2>
            <p className="text-sm text-ink-500">
              完成资质审核后方可参与司法拍卖，审核通过后长期有效
            </p>
          </div>
          <div className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            mockBidder.fundProofStatus === 'verified' && 'bg-success-50 text-success-700 border border-success-200',
            mockBidder.fundProofStatus === 'pending' && 'bg-gold-50 text-gold-700 border border-gold-200',
            mockBidder.fundProofStatus === 'rejected' && 'bg-danger-50 text-danger-700 border border-danger-200'
          )}>
            {mockBidder.fundProofStatus === 'verified' && '已通过'}
            {mockBidder.fundProofStatus === 'pending' && '审核中'}
            {mockBidder.fundProofStatus === 'rejected' && '已驳回'}
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2 z-10',
                  step.status === 'completed' && 'bg-success-500 text-white',
                  step.status === 'current' && 'bg-gold-500 text-white',
                  step.status === 'upcoming' && 'bg-ink-100 text-ink-400'
                )}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  step.status === 'completed' && 'text-success-600',
                  step.status === 'current' && 'text-gold-600',
                  step.status === 'upcoming' && 'text-ink-400'
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-1 bg-ink-100 rounded-full mx-8">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all duration-500"
              style={{ width: `${steps.filter(s => s.status === 'completed').length / (steps.length - 1) * 100}%` }}
            />
          </div>
        </div>

        {mockBidder.fundProofStatus !== 'verified' && mockBidder.fundProofStatus !== 'pending' && (
          <button
            disabled={!canSubmit}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition-colors',
              canSubmit
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            )}
          >
            提交审核
          </button>
        )}
      </div>

      {/* 驳回反馈 */}
      {mockBidder.fundProofStatus === 'rejected' && (
        <div className="bg-white rounded-xl border border-danger-200 overflow-hidden">
          <div className="bg-danger-50 px-6 py-4 border-b border-danger-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <h3 className="font-medium text-ink-900">审核未通过</h3>
                <p className="text-xs text-ink-500">驳回时间：2026年6月17日 16:30</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-ink-900 mb-2">驳回原因</h4>
              <p className="text-sm text-ink-600 bg-ink-50 p-3 rounded-lg">
                您提交的资金证明材料金额不足，且征信报告有效期已过。请补充相关材料后重新提交审核。
              </p>
            </div>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-ink-900 mb-2">需补充材料</h4>
              <ul className="space-y-2">
                {rejectedMaterials.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-ink-600">
                    <AlertCircle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button className="w-full py-2.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors">
              重新提交审核
            </button>
          </div>
        </div>
      )}

      {/* 实名认证卡片 */}
      <div className="bg-white rounded-xl border border-ink-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-ink-900">实名认证</h3>
            <p className="text-xs text-ink-500">身份信息核验</p>
          </div>
          <span className="text-success-600 text-sm font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            已完成
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink-100">
          <div>
            <span className="text-xs text-ink-400">姓名</span>
            <p className="text-sm text-ink-900 mt-1">{mockBidder.name}</p>
          </div>
          <div>
            <span className="text-xs text-ink-400">身份证号</span>
            <p className="text-sm text-ink-900 mt-1">{mockBidder.idCard}</p>
          </div>
        </div>
      </div>

      {/* 资金证明 OCR 上传 */}
      <div className="bg-white rounded-xl border border-ink-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gold-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-ink-900">资金证明</h3>
            <p className="text-xs text-ink-500">银行存款证明 / 流水 / 资产证明</p>
          </div>
          {fundUploadStatus === 'success' && (
            <span className="text-success-600 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              已识别
            </span>
          )}
          {fundUploadStatus === 'error' && (
            <span className="text-danger-600 text-sm font-medium flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              识别失败
            </span>
          )}
        </div>

        {fundUploadStatus === 'idle' && (
          <div className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-7 h-7 text-primary-600" />
            </div>
            <h4 className="font-medium text-ink-900 mb-1">上传资金证明</h4>
            <p className="text-sm text-ink-500 mb-4">
              上传银行存款证明 / 银行流水 / 资产证明，OCR自动识别
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setFundUploadStatus('uploading'); setUploadProgress(0); }}
                className="btn-primary justify-center text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </button>
              <button className="px-4 py-2 border border-ink-200 text-ink-700 rounded-lg text-sm font-medium hover:bg-ink-50 transition-colors">
                <Camera className="w-4 h-4 inline mr-1" />
                拍照
              </button>
            </div>
            <p className="text-xs text-ink-400 mt-4">
              支持 JPG、PNG、PDF 格式，单个文件不超过10MB
            </p>
          </div>
        )}

        {fundUploadStatus === 'uploading' && (
          <div className="border border-primary-200 bg-primary-50/50 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-900">存款证明_20260615.pdf</div>
                <div className="text-xs text-ink-500 mt-0.5">OCR识别中...</div>
              </div>
              <div className="text-sm font-medium text-primary-600">{uploadProgress}%</div>
            </div>
            <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-ink-400 mt-3">
              正在识别文字信息，请稍候...
            </p>
          </div>
        )}

        {fundUploadStatus === 'success' && (
          <div>
            <div className="bg-success-50 border border-success-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
                <span className="text-sm font-medium text-success-700">OCR识别成功</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-ink-400">姓名</span>
                  <p className="text-sm font-medium text-ink-900 mt-1">{mockBidder.name}</p>
                </div>
                <div>
                  <span className="text-xs text-ink-400">证件号</span>
                  <p className="text-sm font-medium text-ink-900 mt-1">{mockBidder.idCard}</p>
                </div>
                <div>
                  <span className="text-xs text-ink-400">存款金额</span>
                  <p className="text-sm font-bold text-success-600 mt-1 font-serif">¥{formatPrice(fundAmount)}</p>
                </div>
                <div>
                  <span className="text-xs text-ink-400">开户行</span>
                  <p className="text-sm font-medium text-ink-900 mt-1">中国工商银行上海分行</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-100">
              <span className="text-xs text-ink-400">
                证明日期：{fundProofDate}
              </span>
              <button
                onClick={() => setFundUploadStatus('idle')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                重新上传
              </button>
            </div>
          </div>
        )}

        {fundUploadStatus === 'error' && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-danger-600" />
              <span className="text-sm font-medium text-danger-700">识别失败</span>
            </div>
            <p className="text-sm text-ink-600 mb-4">
              图片模糊或文件格式不正确，请重新上传清晰的资金证明文件。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFundUploadStatus('idle')}
                className="flex-1 py-2 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
              >
                重新上传
              </button>
              <button className="px-4 py-2 border border-ink-200 text-ink-700 rounded-lg text-sm font-medium hover:bg-ink-50 transition-colors">
                手动填写
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 征信核验模块 */}
      <div className="bg-white rounded-xl border border-ink-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-ink-900">征信核验</h3>
            <p className="text-xs text-ink-500">个人信用报告查询与核验</p>
          </div>
          {creditStatus === 'passed' && (
            <span className="text-success-600 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              已通过
            </span>
          )}
          {creditStatus === 'failed' && (
            <span className="text-danger-600 text-sm font-medium flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              未通过
            </span>
          )}
          {creditStatus === 'checking' && (
            <span className="text-gold-600 text-sm font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              核验中
            </span>
          )}
        </div>

        {creditStatus === 'idle' && (
          <div className="text-center py-8 border border-dashed border-ink-200 rounded-xl">
            <div className="w-14 h-14 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-7 h-7 text-ink-400" />
            </div>
            <h4 className="font-medium text-ink-900 mb-1">尚未核验征信</h4>
            <p className="text-sm text-ink-500 mb-4">
              点击下方按钮授权查询个人征信报告
            </p>
            <button
              onClick={() => setCreditStatus('checking')}
              className="btn-primary justify-center text-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              立即核验
            </button>
          </div>
        )}

        {creditStatus === 'checking' && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-gold-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-900">征信核验中</div>
                <div className="text-xs text-ink-500 mt-1">正在连接征信中心查询数据...</div>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-gold-100 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gold-500 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {creditStatus === 'passed' && (
          <div>
            <div className="bg-gradient-to-r from-success-50 to-primary-50 border border-success-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success-600" />
                  <span className="text-sm font-medium text-success-700">征信核验通过</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success-600 font-serif">{mockBidder.creditScore}</div>
                  <div className="text-xs text-ink-500">信用分</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-success-100">
                <div>
                  <span className="text-xs text-ink-400">查询时间</span>
                  <p className="text-sm text-ink-900 mt-1">{creditCheckDate}</p>
                </div>
                <div>
                  <span className="text-xs text-ink-400">报告编号</span>
                  <p className="text-sm text-ink-900 mt-1">{creditReportNo}</p>
                </div>
                <div>
                  <span className="text-xs text-ink-400">信用等级</span>
                  <p className="text-sm text-success-600 font-medium mt-1">良好</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setCreditStatus('idle')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                重新核验
              </button>
            </div>
          </div>
        )}

        {creditStatus === 'failed' && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <XCircle className="w-5 h-5 text-danger-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-danger-700">征信核验未通过</div>
                <p className="text-sm text-ink-600 mt-2">
                  经核查，您存在以下不良信用记录：
                </p>
                <ul className="text-sm text-ink-600 mt-2 space-y-1">
                  <li>• 信用卡逾期记录 2 次</li>
                  <li>• 贷款当前存在逾期</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCreditStatus('idle')}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                重新核验
              </button>
              <button className="px-4 py-2 border border-ink-200 text-ink-700 rounded-lg text-sm font-medium hover:bg-ink-50 transition-colors">
                申诉
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 风险测评 */}
      <div className="bg-white rounded-xl border border-ink-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-gold-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-ink-900">风险测评</h3>
            <p className="text-xs text-ink-500">投资风险承受能力评估</p>
          </div>
          {mockBidder.fundProofStatus === 'verified' ? (
            <span className="text-success-600 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              已完成
            </span>
          ) : (
            <span className="text-ink-400 text-sm font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              待测评
            </span>
          )}
        </div>
        {mockBidder.fundProofStatus === 'verified' && (
          <div className="pt-4 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-ink-400">风险等级</span>
                <p className="text-base font-bold text-gold-600 mt-1">稳健型 (C3)</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-400">测评日期</span>
                <p className="text-sm text-ink-900 mt-1">2026-06-10</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 审核历史记录 */}
      <div className="bg-white rounded-xl border border-ink-200 p-6">
        <h3 className="font-medium text-ink-900 mb-5 flex items-center gap-2">
          <Clock className="w-5 h-5 text-ink-400" />
          审核历史记录
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-ink-200" />
          <div className="space-y-5">
            {auditHistory.map((record, index) => (
              <div key={index} className="relative flex gap-4 pl-10">
                <div className={cn(
                  'absolute left-2 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white',
                  record.type === 'pass' && 'bg-success-500',
                  record.type === 'reject' && 'bg-danger-500',
                  record.type === 'submit' && 'bg-primary-500',
                  record.type === 'review' && 'bg-gold-500',
                  record.type === 'info' && 'bg-ink-300'
                )}>
                  {record.type === 'pass' && <CheckCircle2 className="w-3 h-3 text-white" />}
                  {record.type === 'reject' && <XCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink-900">{record.desc}</p>
                  <p className="text-xs text-ink-400 mt-1">{record.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuctionCenter() {
  const [activeMenu, setActiveMenu] = useState('bids');

  const myBids = mockProperties.slice(0, 3);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Page Header */}
      <div className="hero-gradient py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-bold text-white mb-1">
                {mockBidder.name}
              </h1>
              <p className="text-primary-200 text-sm mb-3">
                {mockBidder.phone} · 注册于{formatDate(mockBidder.registerDate)}
              </p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                  <Shield className="w-4 h-4" />
                  已实名认证
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500/30 text-gold-200 text-sm rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  信用分 {mockBidder.creditScore}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-ink-200 p-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveMenu(item.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                      activeMenu === item.key
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Help Card */}
            <div className="mt-6 bg-gradient-to-br from-primary-50 to-gold-50 rounded-xl p-5 border border-gold-100">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-gold-600" />
                <span className="font-medium text-ink-900">需要帮助？</span>
              </div>
              <p className="text-sm text-ink-600 mb-4">
                遇到问题？专属顾问随时为您解答
              </p>
              <button className="w-full py-2 bg-white border border-gold-200 text-gold-700 rounded-lg text-sm font-medium hover:bg-gold-50 transition-colors">
                联系客服
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* My Bids */}
            {activeMenu === 'bids' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-ink-200 p-6">
                  <h2 className="font-serif font-bold text-xl text-ink-900 mb-6">
                    我的竞拍
                  </h2>

                  {/* Status Tabs */}
                  <div className="flex gap-1 mb-6 border-b border-ink-200">
                    {[
                      { key: 'all', label: '全部' },
                      { key: 'bidding', label: '进行中' },
                      { key: 'won', label: '已得标' },
                      { key: 'lost', label: '未得标' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        className={cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                          tab.key === 'all'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-ink-500 border-transparent hover:text-ink-700'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Bid List */}
                  <div className="space-y-4">
                    {myBids.map((property, index) => (
                      <Link
                        key={property.id}
                        to={`/detail/${property.id}`}
                        className="flex gap-4 p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors group"
                      >
                        <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-ink-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                {property.title}
                              </h3>
                              <p className="text-sm text-ink-500 line-clamp-1 mt-1">
                                {property.address}
                              </p>
                            </div>
                            <span className={cn(
                              'tag flex-shrink-0',
                              property.status === 'bidding' ? 'tag-danger' :
                              property.status === 'deposit' ? 'tag-warning' :
                              property.status === 'sold' ? 'tag-success' : 'tag-info'
                            )}>
                              {property.status === 'bidding' ? '竞价中' :
                               property.status === 'deposit' ? '待支付' :
                               property.status === 'sold' ? '已成交' : '报名中'}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 mt-3">
                            <div>
                              <span className="text-xs text-ink-400">起拍价</span>
                              <div className="text-lg font-bold text-primary-600 font-serif">
                                ¥{formatPrice(property.startingPrice)}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-ink-400">当前价</span>
                              <div className="text-lg font-bold text-danger-600 font-serif">
                                ¥{formatPrice(property.startingPrice * 1.1)}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-ink-400">我的出价</span>
                              <div className="text-lg font-medium text-ink-700 font-serif">
                                -
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-200">
                            <span className="text-xs text-ink-500">
                              <Clock className="w-3.5 h-3.5 inline mr-1" />
                              {property.status === 'bidding' ? '距结束 2天12时' : '开拍时间：6月25日'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: '缴纳保证金', desc: '参与竞拍必备', icon: CreditCard, color: 'primary' },
                    { title: '资质审核', desc: '提前审核更快参拍', icon: FileCheck, color: 'success' },
                    { title: '委托出价', desc: '设置价格自动出价', icon: Gavel, color: 'gold' },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl border border-ink-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                          item.color === 'primary' && 'bg-primary-100',
                          item.color === 'success' && 'bg-success-100',
                          item.color === 'gold' && 'bg-gold-100'
                        )}>
                          <Icon className={cn(
                            'w-6 h-6',
                            item.color === 'primary' && 'text-primary-600',
                            item.color === 'success' && 'text-success-600',
                            item.color === 'gold' && 'text-gold-600'
                          )} />
                        </div>
                        <h3 className="font-medium text-ink-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-ink-500">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Deposit Management */}
            {activeMenu === 'deposit' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-ink-200 p-6">
                  <h2 className="font-serif font-bold text-xl text-ink-900 mb-6">
                    保证金管理
                  </h2>

                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-primary-50 rounded-xl p-5">
                      <div className="text-sm text-primary-600 mb-2">冻结保证金</div>
                      <div className="text-2xl font-bold text-primary-700 font-serif">
                        ¥{formatPrice(mockDepositRecords.filter(r => r.status === 'frozen' || r.status === 'paid').reduce((sum, r) => sum + r.amount, 0))}
                      </div>
                      <div className="text-xs text-primary-400 mt-1">
                        {mockDepositRecords.filter(r => r.status === 'frozen' || r.status === 'paid').length} 笔
                      </div>
                    </div>
                    <div className="bg-success-50 rounded-xl p-5">
                      <div className="text-sm text-success-600 mb-2">可退还</div>
                      <div className="text-2xl font-bold text-success-700 font-serif">
                        ¥0
                      </div>
                      <div className="text-xs text-success-400 mt-1">
                        0 笔待退款
                      </div>
                    </div>
                    <div className="bg-ink-50 rounded-xl p-5">
                      <div className="text-sm text-ink-500 mb-2">累计退还</div>
                      <div className="text-2xl font-bold text-ink-700 font-serif">
                        ¥{formatPrice(mockDepositRecords.filter(r => r.status === 'refunded').reduce((sum, r) => sum + r.amount, 0))}
                      </div>
                      <div className="text-xs text-ink-400 mt-1">
                        {mockDepositRecords.filter(r => r.status === 'refunded').length} 笔
                      </div>
                    </div>
                  </div>

                  {/* Records */}
                  <h3 className="font-medium text-ink-900 mb-4">保证金记录</h3>
                  <div className="space-y-3">
                    {mockDepositRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 bg-ink-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-ink-900">{record.propertyTitle}</div>
                          <div className="text-xs text-ink-500 mt-1">
                            订单号：{record.orderNo} · 缴纳时间：{record.payDate}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-ink-900">
                            ¥{formatPrice(record.amount)}
                          </div>
                          <span className={cn(
                            'text-xs mt-1 inline-block',
                            record.status === 'paid' && 'text-primary-600',
                            record.status === 'frozen' && 'text-gold-600',
                            record.status === 'refunded' && 'text-success-600',
                            record.status === 'refunding' && 'text-gold-600'
                          )}>
                            {record.status === 'paid' && '已缴纳'}
                            {record.status === 'frozen' && '已冻结'}
                            {record.status === 'refunding' && '退款中'}
                            {record.status === 'refunded' && '已退还'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Qualification */}
            {activeMenu === 'qualification' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <QualificationContent />
              </motion.div>
            )}

            {/* Settings */}
            {activeMenu === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-ink-200 p-6"
              >
                <h2 className="font-serif font-bold text-xl text-ink-900 mb-6">
                  账号设置
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-ink-100">
                    <div>
                      <div className="font-medium text-ink-900">手机号码</div>
                      <div className="text-sm text-ink-500 mt-1">用于接收拍卖通知和验证码</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-ink-600">{mockBidder.phone}</span>
                      <button className="text-primary-600 text-sm hover:text-primary-700">
                        更换
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-ink-100">
                    <div>
                      <div className="font-medium text-ink-900">实名认证</div>
                      <div className="text-sm text-ink-500 mt-1">{mockBidder.idCard}</div>
                    </div>
                    <span className="text-success-600 text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      已认证
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-ink-100">
                    <div>
                      <div className="font-medium text-ink-900">支付密码</div>
                      <div className="text-sm text-ink-500 mt-1">用于保证金缴纳和出价确认</div>
                    </div>
                    <button className="text-primary-600 text-sm hover:text-primary-700">
                      设置
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-ink-900">消息通知</div>
                      <div className="text-sm text-ink-500 mt-1">拍卖提醒、出价通知、结果通知等</div>
                    </div>
                    <button className="text-primary-600 text-sm hover:text-primary-700">
                      管理
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
