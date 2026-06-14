import { useState } from 'react';
import { IdCard, ShieldCheck, FileCheck, Upload, CheckCircle, Clock, AlertTriangle, Eye, Camera, User, Briefcase, Award, ChevronRight } from 'lucide-react';
import WorkerNavbar from '@/components/WorkerNavbar';
import WorkerSidebar from '@/components/WorkerSidebar';
import { useWorkerStore } from '@/store/useWorkerStore';
import { cn } from '@/lib/utils';

interface CertItem {
  key: 'id_card' | 'health_cert' | 'crime_record';
  icon: typeof IdCard;
  title: string;
  description: string;
  url: string;
}

const statusMap = {
  pending: { label: '待审核', className: 'badge-gray', icon: Clock, color: 'text-gray-500' },
  ocr_done: { label: 'OCR识别完成', className: 'badge-blue', icon: FileCheck, color: 'text-blue-600' },
  approved: { label: '已通过', className: 'badge-green', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: '已拒绝', className: 'badge-red', icon: AlertTriangle, color: 'text-red-600' },
};

export default function WorkerProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const worker = useWorkerStore((state) => state.worker);
  const cert = useWorkerStore((state) => state.cert);

  const certItems: CertItem[] = [
    {
      key: 'id_card',
      icon: IdCard,
      title: '身份证',
      description: '需上传正反面清晰照片',
      url: cert?.id_card_url || '',
    },
    {
      key: 'health_cert',
      icon: ShieldCheck,
      title: '健康证',
      description: '有效期内的健康证明',
      url: cert?.health_cert_url || '',
    },
    {
      key: 'crime_record',
      icon: FileCheck,
      title: '无犯罪记录',
      description: '派出所开具的证明文件',
      url: cert?.crime_record_url || '',
    },
  ];

  const status = cert ? statusMap[cert.verify_status] : statusMap.pending;
  const StatusIcon = status.icon;

  const reviewSteps = [
    { key: 'submitted', label: '提交资料', done: true },
    { key: 'ocr', label: 'OCR识别', done: cert?.verify_status === 'ocr_done' || cert?.verify_status === 'approved' || cert?.verify_status === 'rejected' },
    { key: 'review', label: '人工复核', done: cert?.verify_status === 'approved' || cert?.verify_status === 'rejected' },
    { key: 'result', label: '审核结果', done: cert?.verify_status === 'approved' || cert?.verify_status === 'rejected' },
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
                <h3 className="font-bold text-secondary-800 mb-4">审核进度</h3>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card p-5 animate-fade-up stagger-3">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-secondary-800">三证上传</h2>
                    <p className="text-sm text-secondary-500">上传清晰的证件照片以便审核</p>
                  </div>
                  {cert?.ocr_result && (
                    <div className="flex items-center gap-1 text-sm text-secondary-500">
                      <FileCheck className="w-4 h-4 text-secondary-400" />
                      OCR已识别
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {certItems.map((item) => {
                    const Icon = item.icon;
                    const hasFile = !!item.url;
                    return (
                      <div
                        key={item.key}
                        className="relative rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors overflow-hidden group"
                      >
                        {hasFile ? (
                          <div className="aspect-[4/5] bg-gradient-to-br from-secondary-50 to-primary-50 p-4 flex flex-col">
                            <div className="flex-1 flex items-center justify-center">
                              <div className="w-full h-full rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <Icon className="w-16 h-16 text-secondary-300" />
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="font-medium text-secondary-800">{item.title}</p>
                              <p className="text-xs text-secondary-500 mt-0.5">{item.description}</p>
                            </div>
                            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setPreviewUrl(item.url)}
                                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-secondary-600 hover:text-primary-600 shadow-sm"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-secondary-600 hover:text-primary-600 shadow-sm">
                                <Upload className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute top-3 left-3">
                              <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button className="aspect-[4/5] w-full p-4 flex flex-col items-center justify-center text-secondary-400 hover:text-primary-500 hover:bg-primary-50/50 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                              <Upload className="w-7 h-7" />
                            </div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs mt-1 text-center">{item.description}</p>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {cert?.ocr_result && (
                <div className="card p-5 animate-fade-up stagger-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-800">OCR识别结果</h3>
                        <p className="text-sm text-secondary-500">系统自动识别的证件信息</p>
                      </div>
                    </div>
                    <span className="badge-blue">识别完成</span>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-100">
                    <p className="text-secondary-700 text-sm leading-relaxed">{cert.ocr_result}</p>
                  </div>
                </div>
              )}

              <div className="card p-5 animate-fade-up stagger-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary-800">人工复核进度</h3>
                      <p className="text-sm text-secondary-500">
                        {cert?.verify_status === 'approved'
                          ? '恭喜您，资质审核已通过'
                          : cert?.verify_status === 'rejected'
                          ? '审核未通过，请重新提交'
                          : '审核专员正在核对您的资料'}
                      </p>
                    </div>
                  </div>
                  <span className={status.className}>
                    <StatusIcon className="w-3.5 h-3.5 inline mr-1" />
                    {status.label}
                  </span>
                </div>

                {cert?.submitted_at && (
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <Clock className="w-4 h-4" />
                    提交时间：{new Date(cert.submitted_at).toLocaleString('zh-CN')}
                  </div>
                )}
              </div>
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
