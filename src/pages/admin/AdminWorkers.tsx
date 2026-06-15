import { useState } from 'react';
import {
  Check,
  X,
  Ban,
  User,
  FileText,
  Heart,
  Shield,
  AlertCircle,
  Clock,
  BadgeCheck,
  ChevronRight,
  ScanLine,
  History,
  CheckCircle,
  AlertTriangle,
  Eye,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useAdminStore } from '@/store/useAdminStore';
import { cn } from '@/lib/utils';
import type { OCRField, ReviewRecord, CertOCRResult } from '@/types';

interface CertItem {
  key: 'id_card' | 'health_cert' | 'crime_record';
  label: string;
  icon: typeof FileText;
  urlKey: 'id_card_url' | 'health_cert_url' | 'crime_record_url';
  color: string;
  bgColor: string;
  description: string;
}

const certItems: CertItem[] = [
  {
    key: 'id_card',
    label: '身份证',
    icon: FileText,
    urlKey: 'id_card_url',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: '个人身份信息核验',
  },
  {
    key: 'health_cert',
    label: '健康证',
    icon: Heart,
    urlKey: 'health_cert_url',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: '从业健康资质核验',
  },
  {
    key: 'crime_record',
    label: '无犯罪记录',
    icon: Shield,
    urlKey: 'crime_record_url',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: '背景调查合规核验',
  },
];

function ConfidenceTag({ confidence }: { confidence: number }) {
  const colorClass =
    confidence >= 98
      ? 'bg-green-100 text-green-700'
      : confidence >= 95
        ? 'bg-yellow-100 text-yellow-700'
        : confidence >= 70
          ? 'bg-orange-100 text-orange-700'
          : 'bg-red-100 text-red-700';
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', colorClass)}>
      {confidence}%
    </span>
  );
}

function OCRFieldRow({ field }: { field: OCRField }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-dashed border-gray-100 last:border-b-0">
      <span className="text-xs text-secondary-500 flex-shrink-0">{field.label}</span>
      <div className="text-right min-w-0 flex-1 ml-2">
        <span className="text-xs font-medium text-secondary-800 block truncate">
          {field.value}
        </span>
        {field.confidence !== undefined && (
          <ConfidenceTag confidence={field.confidence} />
        )}
      </div>
    </div>
  );
}

function CertOCRCard({
  cert,
  ocrData,
  certItem,
  onPreview,
}: {
  cert: any;
  ocrData?: CertOCRResult['id_card'];
  certItem: CertItem;
  onPreview: (url: string) => void;
}) {
  const Icon = certItem.icon;
  const hasLowConfidence = ocrData?.fields.some(
    (f) => f.confidence !== undefined && f.confidence < 80
  );

  return (
    <div className="card overflow-hidden border border-gray-100">
      <div className={cn('p-3 flex items-center justify-between', certItem.bgColor)}>
        <div className="flex items-center gap-2">
          <div className={cn('w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center', certItem.color)}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-secondary-800">{certItem.label}</h4>
            <p className="text-[10px] text-secondary-500">{certItem.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {ocrData && <ConfidenceTag confidence={ocrData.confidence} />}
          {hasLowConfidence && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              低置信度
            </span>
          )}
          <button
            onClick={() => onPreview(cert[certItem.urlKey])}
            className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-secondary-600 hover:bg-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {ocrData && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-secondary-700">OCR 识别字段</span>
            </div>
            <span className="text-[9px] text-secondary-400">
              {new Date(ocrData.ocr_time).toLocaleString('zh-CN')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0">
            {ocrData.fields.map((field, i) => (
              <OCRFieldRow key={i} field={field} />
            ))}
          </div>
        </div>
      )}

      {!ocrData && (
        <div className="p-6 text-center">
          <Clock className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
          <p className="text-xs text-secondary-500">OCR识别中...</p>
        </div>
      )}
    </div>
  );
}

function ReviewTimeline({ records }: { records: ReviewRecord[] }) {
  const typeLabel: Record<string, { label: string; icon: typeof ScanLine; color: string }> = {
    ocr: { label: 'OCR识别', icon: ScanLine, color: 'text-blue-600 bg-blue-50' },
    manual: { label: '人工复核', icon: UserCheck, color: 'text-orange-600 bg-orange-50' },
    recheck: { label: '复查', icon: History, color: 'text-purple-600 bg-purple-50' },
  };

  return (
    <div className="space-y-0">
      {records.map((record, i) => {
        const typeInfo = typeLabel[record.type];
        const TypeIcon = typeInfo.icon;
        const isLast = i === records.length - 1;
        return (
          <div key={record.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  record.result === 'pass'
                    ? 'bg-green-100 text-green-600'
                    : record.result === 'reject'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-600'
                )}
              >
                {record.result === 'pass' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : record.result === 'reject' ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              {!isLast && <div className="w-0.5 h-8 mt-0.5 bg-gray-200" />}
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-secondary-800">{record.reviewer}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full', typeInfo.color)}>
                  <TypeIcon className="w-2.5 h-2.5 inline mr-0.5" />
                  {typeInfo.label}
                </span>
                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full',
                    record.result === 'pass'
                      ? 'bg-green-100 text-green-700'
                      : record.result === 'reject'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {record.result === 'pass'
                    ? '通过'
                    : record.result === 'reject'
                      ? '驳回'
                      : '处理中'}
                </span>
              </div>
              <p className="text-[10px] text-secondary-400 mt-0.5">
                {new Date(record.review_time).toLocaleString('zh-CN')}
              </p>
              <p
                className={cn(
                  'text-xs mt-1.5 leading-relaxed rounded-lg p-2.5',
                  record.result === 'reject'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-secondary-50 text-secondary-600'
                )}
              >
                {record.remark}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminWorkers() {
  const auditQueue = useAdminStore((state) => state.auditQueue);
  const approveWorker = useAdminStore((state) => state.approveWorker);
  const rejectWorker = useAdminStore((state) => state.rejectWorker);
  const [selectedId, setSelectedId] = useState<number | null>(
    auditQueue.length > 0 ? auditQueue[0].id : null
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ocr' | 'review'>('ocr');

  const selectedWorker = auditQueue.find((w) => w.id === selectedId);
  const hasRejectHistory = selectedWorker?.cert.review_history?.some((r) => r.result === 'reject');

  const handleApprove = (workerId: number) => {
    approveWorker(workerId);
    if (selectedId === workerId) {
      const next = auditQueue.find((w) => w.id !== workerId);
      setSelectedId(next ? next.id : null);
    }
  };

  const handleReject = () => {
    if (selectedId && rejectReason.trim()) {
      rejectWorker(selectedId, rejectReason);
      const next = auditQueue.find((w) => w.id !== selectedId);
      setSelectedId(next ? next.id : null);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handleBlacklist = (workerId: number) => {
    rejectWorker(workerId, '拉黑处理');
    if (selectedId === workerId) {
      const next = auditQueue.find((w) => w.id !== workerId);
      setSelectedId(next ? next.id : null);
    }
  };

  const avgConfidence = selectedWorker?.cert.ocr_detail
    ? Math.round(
        (selectedWorker.cert.ocr_detail.id_card.confidence +
          selectedWorker.cert.ocr_detail.health_cert.confidence +
          selectedWorker.cert.ocr_detail.crime_record.confidence) /
          3 * 10
      ) / 10
    : null;

  const hasLowConfidenceFields = selectedWorker?.cert.ocr_detail
    ? Object.values(selectedWorker.cert.ocr_detail).some((cert) =>
        cert.fields.some((f) => f.confidence !== undefined && f.confidence < 80)
      )
    : false;

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="阿姨资质审核"
          subtitle="审核阿姨三证信息，确保服务人员资质合规"
        />
        <main className="flex-1 flex overflow-hidden">
          <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="badge badge-orange">待审核 {auditQueue.length}</span>
              </div>
              <button className="text-xs text-secondary-500 hover:text-secondary-700">
                刷新
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {auditQueue.map((worker) => {
                const hasOCR = worker.cert.verify_status === 'ocr_done';
                const hasReject = worker.cert.review_history?.some((r) => r.result === 'reject');
                return (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedId(worker.id)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3',
                      selectedId === worker.id
                        ? 'bg-secondary-50 border border-secondary-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <div className="relative">
                      <img
                        src={worker.avatar}
                        alt={worker.real_name}
                        className="w-11 h-11 rounded-full bg-secondary-100 flex-shrink-0"
                      />
                      {hasReject && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                          <AlertTriangle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-secondary-800 text-sm truncate">
                          {worker.real_name}
                        </p>
                        {hasOCR && <BadgeCheck className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-secondary-500 mt-0.5">
                        <span>{worker.age}岁</span>
                        <span>·</span>
                        <span>{worker.experience_years}年经验</span>
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {worker.skills.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        selectedId === worker.id ? 'text-secondary-500' : 'text-gray-300'
                      )}
                    />
                  </button>
                );
              })}
              {auditQueue.length === 0 && (
                <div className="py-16 text-center text-secondary-400">
                  <Check className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-sm">暂无待审核阿姨</p>
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1 overflow-y-auto p-6">
            {selectedWorker ? (
              <div className="max-w-4xl mx-auto space-y-5">
                <div className="card p-5">
                  <div className="flex items-start gap-4">
                    <img
                      src={selectedWorker.avatar}
                      alt={selectedWorker.real_name}
                      className="w-16 h-16 rounded-2xl bg-secondary-100 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-secondary-800">
                          {selectedWorker.real_name}
                        </h2>
                        <span
                          className={cn(
                            'badge',
                            selectedWorker.cert.verify_status === 'ocr_done'
                              ? 'badge-blue'
                              : 'badge-gray'
                          )}
                        >
                          {selectedWorker.cert.verify_status === 'ocr_done'
                            ? 'OCR已完成'
                            : 'OCR待处理'}
                        </span>
                        {hasRejectHistory && (
                          <span className="badge badge-red flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            待复核
                          </span>
                        )}
                        {avgConfidence !== null && (
                          <span className="text-xs text-secondary-500">
                            平均置信度 {avgConfidence}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-secondary-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {selectedWorker.age}岁 · {selectedWorker.experience_years}年经验
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          提交于{' '}
                          {new Date(selectedWorker.cert.submitted_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedWorker.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full border border-secondary-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-secondary-500 mt-3">
                        手机号：{selectedWorker.phone}
                      </p>
                    </div>
                  </div>

                  {hasLowConfidenceFields && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">存在低置信度识别字段</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          部分字段置信度低于80%，请仔细核对原件
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 p-1 bg-secondary-50 rounded-xl inline-flex">
                  <button
                    onClick={() => setActiveTab('ocr')}
                    className={cn(
                      'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                      activeTab === 'ocr'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-secondary-600 hover:text-secondary-800'
                    )}
                  >
                    <ScanLine className="w-4 h-4 inline mr-1.5" />
                    OCR 识别详情
                  </button>
                  <button
                    onClick={() => setActiveTab('review')}
                    className={cn(
                      'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                      activeTab === 'review'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-secondary-600 hover:text-secondary-800'
                    )}
                  >
                    <History className="w-4 h-4 inline mr-1.5" />
                    复核记录
                    {selectedWorker.cert.review_history && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600">
                        {selectedWorker.cert.review_history.length}
                      </span>
                    )}
                  </button>
                </div>

                {activeTab === 'ocr' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {certItems.map((item) => (
                      <CertOCRCard
                        key={item.key}
                        cert={selectedWorker.cert}
                        ocrData={selectedWorker.cert.ocr_detail?.[item.key]}
                        certItem={item}
                        onPreview={setPreviewUrl}
                      />
                    ))}
                  </div>
                )}

                {activeTab === 'review' && (
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                          <FileCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-secondary-800">人工复核流程</h3>
                          <p className="text-xs text-secondary-500">
                            所有审核操作留痕，可追溯可审计
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary-500">末次审核</p>
                        <p className="text-sm font-medium text-secondary-700">
                          {selectedWorker.cert.review_history &&
                            new Date(
                              selectedWorker.cert.review_history[
                                selectedWorker.cert.review_history.length - 1
                              ].review_time
                            ).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    {selectedWorker.cert.review_history ? (
                      <ReviewTimeline records={selectedWorker.cert.review_history} />
                    ) : (
                      <div className="text-center py-8 text-secondary-400">
                        <Clock className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">暂无复核记录</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedWorker.id)}
                    className="flex-1 py-3 bg-secondary-600 text-white rounded-xl font-medium hover:bg-secondary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    审核通过
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 py-3 bg-white text-secondary-700 border border-gray-200 rounded-xl font-medium hover:border-secondary-300 hover:bg-secondary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    拒绝
                  </button>
                  <button
                    onClick={() => handleBlacklist(selectedWorker.id)}
                    className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-medium hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-5 h-5" />
                    拉黑
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary-400">
                <p>请从左侧选择一位待审核阿姨</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-up">
            <h3 className="text-lg font-bold text-secondary-800 mb-4">拒绝审核</h3>
            <p className="text-sm text-secondary-500 mb-4">请填写拒绝原因：</p>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {['证件照片模糊', '证件已过期', '信息不一致', '需补充材料', '其他'].map(
                  (reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectReason(reason)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        rejectReason === reason
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : 'bg-white border-gray-200 text-secondary-600 hover:border-secondary-300'
                      )}
                    >
                      {reason}
                    </button>
                  )
                )}
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请详细说明拒绝原因..."
                rows={4}
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 bg-white text-secondary-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-2xl w-full">
            <div className="card p-4">
              <img
                src={previewUrl}
                alt="证件预览"
                className="w-full h-auto rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
