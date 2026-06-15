import { useState } from 'react';
import { IdCard, ShieldCheck, FileCheck, Upload, CheckCircle, Clock, AlertTriangle, Eye, Camera, User, Briefcase, Award, ChevronRight, ChevronDown, ScanLine, UserCheck, History, FileText, Zap, AlertCircle } from 'lucide-react';
import WorkerNavbar from '@/components/WorkerNavbar';
import WorkerSidebar from '@/components/WorkerSidebar';
import { useWorkerStore } from '@/store/useWorkerStore';
import { cn } from '@/lib/utils';
import type { CertOCRResult, ReviewRecord } from '@/types';

interface CertItem {
  key: 'id_card' | 'health_cert' | 'crime_record';
  icon: typeof IdCard;
  title: string;
  description: string;
  url: string;
  color: string;
  bgColor: string;
}

const statusMap = {
  pending: { label: '待审核', className: 'badge-gray', icon: Clock, color: 'text-gray-500' },
  ocr_done: { label: 'OCR识别完成', className: 'badge-blue', icon: FileCheck, color: 'text-blue-600' },
  approved: { label: '已通过', className: 'badge-green', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: '已拒绝', className: 'badge-red', icon: AlertTriangle, color: 'text-red-600' },
};

function OCRFieldList({ fields }: { fields: { label: string; value: string; confidence?: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {fields.map((field, i) => (
        <div key={i} className="flex items-start justify-between py-1.5 border-b border-dashed border-gray-100 last:border-b-0">
          <span className="text-xs text-secondary-500 flex-shrink-0">{field.label}</span>
          <div className="text-right min-w-0 flex-1 ml-2">
            <span className="text-xs font-medium text-secondary-800 block truncate">{field.value}</span>
            {field.confidence !== undefined && (
              <span className={cn(
                'text-[9px]',
                field.confidence >= 98 ? 'text-green-500' : field.confidence >= 95 ? 'text-yellow-600' : 'text-red-500'
              )}>
                置信度 {field.confidence}%
              </span>
            )}
          </div>
        </div>
      ))}
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
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                record.result === 'pass' ? 'bg-green-100 text-green-600'
                  : record.result === 'reject' ? 'bg-red-100 text-red-600'
                    : 'bg-yellow-100 text-yellow-600'
              )}>
                {record.result === 'pass' ? <CheckCircle className="w-4 h-4" />
                  : record.result === 'reject' ? <AlertTriangle className="w-4 h-4" />
                    : <Clock className="w-4 h-4" />}
              </div>
              {!isLast && <div className="w-0.5 h-10 mt-1 bg-gray-200" />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-secondary-800">{record.reviewer}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full', typeInfo.color)}>
                  <TypeIcon className="w-2.5 h-2.5 inline mr-0.5" />
                  {typeInfo.label}
                </span>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-full',
                  record.result === 'pass' ? 'bg-green-100 text-green-700'
                    : record.result === 'reject' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                )}>
                  {record.result === 'pass' ? '通过' : record.result === 'reject' ? '驳回' : '处理中'}
                </span>
              </div>
              <p className="text-[10px] text-secondary-400 mt-0.5">
                {new Date(record.review_time).toLocaleString('zh-CN')}
              </p>
              <p className="text-xs text-secondary-600 mt-1.5 leading-relaxed bg-secondary-50 rounded-lg p-2.5">
                {record.remark}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CertDetailCard({
  certKey,
  title,
  icon: Icon,
  url,
  ocrData,
  color,
  bgColor,
  onPreview,
}: {
  certKey: string;
  title: string;
  icon: typeof IdCard;
  url: string;
  ocrData?: CertOCRResult['id_card'];
  color: string;
  bgColor: string;
  onPreview: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="card overflow-hidden">
      <div
        className={cn('p-4 flex items-center justify-between cursor-pointer', bgColor)}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-secondary-800">{title}</h3>
            {ocrData ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="badge-green text-[10px]">OCR已识别</span>
                <span className="text-[10px] text-secondary-500">
                  置信度 {ocrData.confidence}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-secondary-400">待上传</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(url); }}
              className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-secondary-600 hover:bg-white transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={cn('w-5 h-5 text-secondary-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </div>

      {expanded && ocrData && (
        <div className="p-4 border-t border-gray-100 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-secondary-800">OCR 识别结果</span>
            <span className="text-[10px] text-secondary-400 ml-auto">
              识别时间：{new Date(ocrData.ocr_time).toLocaleString('zh-CN')}
            </span>
          </div>
          <OCRFieldList fields={ocrData.fields} />
        </div>
      )}

      {expanded && !ocrData && url && (
        <div className="p-4 border-t border-gray-100 text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-sm text-secondary-600">OCR识别中...</p>
          <p className="text-xs text-secondary-400 mt-1">通常需要1-3分钟</p>
        </div>
      )}
    </div>
  );
}

export default function WorkerProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'certs' | 'review'>('certs');
  const worker = useWorkerStore((state) => state.worker);
  const cert = useWorkerStore((state) => state.cert);

  const certItems: CertItem[] = [
    {
      key: 'id_card',
      icon: IdCard,
      title: '身份证',
      description: '需上传正反面清晰照片',
      url: cert?.id_card_url || '',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'health_cert',
      icon: ShieldCheck,
      title: '健康证',
      description: '有效期内的健康证明',
      url: cert?.health_cert_url || '',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      key: 'crime_record',
      icon: FileCheck,
      title: '无犯罪记录',
      description: '派出所开具的证明文件',
      url: cert?.crime_record_url || '',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const status = cert ? statusMap[cert.verify_status] : statusMap.pending;
  const StatusIcon = status.icon;

  const reviewSteps = [
    { key: 'submitted', label: '提交资料', done: true, time: cert?.submitted_at },
    { key: 'ocr', label: 'OCR识别', done: cert?.verify_status === 'ocr_done' || cert?.verify_status === 'approved' || cert?.verify_status === 'rejected', time: cert?.ocr_completed_at },
    { key: 'review', label: '人工复核', done: cert?.verify_status === 'approved' || cert?.verify_status === 'rejected', time: cert?.review_completed_at },
    { key: 'result', label: '审核结果', done: cert?.verify_status === 'approved' || cert?.verify_status === 'rejected', time: cert?.review_completed_at },
  ];

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <WorkerNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
          <div className="mb-6 animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-800">资质管理</h1>
            <p className="text-secondary-500 mt-1">管理您的个人信息和认证资料</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-6 animate-fade-up stagger-1">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <img
                      src={worker?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt={worker?.real_name || '阿姨'}
                      className="w-24 h-24 rounded-full border-4 border-primary-100 object-cover mx-auto"
                    />
                    <button className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-soft hover:bg-primary-600 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-secondary-800">{worker?.real_name || '阿姨'}</h2>
                  <p className="text-secondary-500 mt-1">工号 #{worker?.id || '000'}</p>
                  <div className="mt-3">
                    <span className={status.className}>
                      <StatusIcon className="w-3.5 h-3.5 inline mr-1" />
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  {[
                    { icon: User, label: '年龄', value: `${worker?.age || '--'}岁` },
                    { icon: Briefcase, label: '工龄', value: `${worker?.experience_years || '--'}年` },
                    { icon: Award, label: '状态', value: worker?.status === 'verified' ? '已认证' : '待认证' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-secondary-500">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-secondary-800 font-medium">{item.value}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-secondary-700">擅长技能</p>
                    <ChevronRight className="w-4 h-4 text-secondary-400" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {worker?.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card p-5 animate-fade-up stagger-2">
                <h3 className="font-bold text-secondary-800 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary-500" />
                  审核进度
                </h3>
                <div className="space-y-1">
                  {reviewSteps.map((step, index) => (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                            step.done
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {step.done ? <CheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                        {index < reviewSteps.length - 1 && (
                          <div
                            className={cn(
                              'w-0.5 h-10 mt-1',
                              step.done ? 'bg-primary-300' : 'bg-gray-200'
                            )}
                          />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p
                          className={cn(
                            'font-medium',
                            step.done ? 'text-secondary-800' : 'text-secondary-400'
                          )}
                        >
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-[10px] text-secondary-400 mt-0.5">
                            {new Date(step.time).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 animate-fade-up stagger-3">
                <h3 className="font-bold text-secondary-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  资质概览
                </h3>
                <div className="space-y-3">
                  {certItems.map((item) => {
                    const hasFile = !!item.url;
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary-50">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('w-8 h-8 rounded-lg bg-white flex items-center justify-center', item.color)}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-secondary-800">{item.title}</p>
                            <p className="text-[10px] text-secondary-400">{item.description}</p>
                          </div>
                        </div>
                        {hasFile ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            已上传
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            未上传
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-yellow-50 border border-yellow-100">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-[11px] text-yellow-700 leading-relaxed">
                    三证齐全方可接单，每月系统自动复查资质有效性
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card p-1 animate-fade-up stagger-2 inline-flex bg-secondary-50">
                <button
                  onClick={() => setActiveTab('certs')}
                  className={cn(
                    'px-6 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === 'certs'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-800'
                  )}
                >
                  <ScanLine className="w-4 h-4 inline mr-1.5" />
                  三证OCR详情
                </button>
                <button
                  onClick={() => setActiveTab('review')}
                  className={cn(
                    'px-6 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === 'review'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-800'
                  )}
                >
                  <History className="w-4 h-4 inline mr-1.5" />
                  复核记录
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600">
                    {cert?.review_history?.length || 0}
                  </span>
                </button>
              </div>

              {activeTab === 'certs' && (
                <div className="space-y-4">
                  {certItems.map((item, index) => (
                    <div key={item.key} className={`animate-fade-up stagger-${index + 1}`}>
                      <CertDetailCard
                        certKey={item.key}
                        title={item.title}
                        icon={item.icon}
                        url={item.url}
                        ocrData={cert?.ocr_detail?.[item.key]}
                        color={item.color}
                        bgColor={item.bgColor}
                        onPreview={setPreviewUrl}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'review' && cert?.review_history && (
                <div className="card p-5 animate-fade-up">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <History className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-800">人工复核记录</h3>
                        <p className="text-xs text-secondary-500">
                          共 {cert.review_history.length} 条记录 · 末次 {new Date(cert.review_history[cert.review_history.length - 1].review_time).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <span className="badge-green">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      资质有效
                    </span>
                  </div>
                  <ReviewTimeline records={cert.review_history} />
                </div>
              )}

              {activeTab === 'review' && (!cert?.review_history || cert.review_history.length === 0) && (
                <div className="card p-8 text-center">
                  <Clock className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                  <p className="text-secondary-500">暂无复核记录</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

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
