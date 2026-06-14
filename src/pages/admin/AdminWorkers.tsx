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
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useAdminStore } from '@/store/useAdminStore';
import { cn } from '@/lib/utils';

export default function AdminWorkers() {
  const auditQueue = useAdminStore((state) => state.auditQueue);
  const approveWorker = useAdminStore((state) => state.approveWorker);
  const rejectWorker = useAdminStore((state) => state.rejectWorker);
  const [selectedId, setSelectedId] = useState<number | null>(
    auditQueue.length > 0 ? auditQueue[0].id : null
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const selectedWorker = auditQueue.find((w) => w.id === selectedId);

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

  const certItems = [
    { key: 'id_card', label: '身份证', icon: FileText, urlKey: 'id_card_url' },
    { key: 'health', label: '健康证', icon: Heart, urlKey: 'health_cert_url' },
    { key: 'crime', label: '无犯罪记录', icon: Shield, urlKey: 'crime_record_url' },
  ];

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="阿姨资质审核" subtitle="审核阿姨三证信息，确保服务人员资质合规" />
        <main className="flex-1 flex overflow-hidden">
          <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="badge badge-orange">待审核 {auditQueue.length}</span>
              </div>
              <button className="text-xs text-secondary-500 hover:text-secondary-700">刷新</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {auditQueue.map((worker) => (
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
                  <img
                    src={worker.avatar}
                    alt={worker.real_name}
                    className="w-11 h-11 rounded-full bg-secondary-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-secondary-800 text-sm truncate">
                        {worker.real_name}
                      </p>
                      {worker.cert.verify_status === 'ocr_done' && (
                        <BadgeCheck className="w-4 h-4 text-green-500" />
                      )}
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
              ))}
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
              <div className="max-w-3xl mx-auto space-y-5">
                <div className="card p-6">
                  <div className="flex items-start gap-5">
                    <img
                      src={selectedWorker.avatar}
                      alt={selectedWorker.real_name}
                      className="w-20 h-20 rounded-2xl bg-secondary-100 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
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
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-secondary-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {selectedWorker.age}岁 · {selectedWorker.experience_years}年经验
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          提交于{' '}
                          {new Date(selectedWorker.cert.submitted_at).toLocaleDateString(
                            'zh-CN'
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
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
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-5 h-5 text-secondary-600" />
                    <h3 className="text-lg font-bold text-secondary-800">三证信息</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {certItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className="border border-gray-100 rounded-xl p-4 hover:border-secondary-200 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-secondary-600" />
                            </div>
                            <span className="text-sm font-medium text-secondary-700">
                              {item.label}
                            </span>
                          </div>
                          <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
                            <FileText className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-xs text-secondary-400 mt-2 text-center">
                            点击查看大图
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-secondary-600" />
                    <h3 className="text-lg font-bold text-secondary-800">OCR识别结果</h3>
                  </div>
                  <div className="bg-secondary-50/60 rounded-xl p-4">
                    <p className="text-sm text-secondary-700 leading-relaxed whitespace-pre-line">
                      {selectedWorker.cert.ocr_result}
                    </p>
                  </div>
                </div>

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
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="例如：身份证信息与本人不符、健康证已过期等..."
              rows={4}
              className="input-field resize-none"
            />
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
                className="flex-1 py-2.5 bg-secondary-600 text-white rounded-xl font-medium hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
