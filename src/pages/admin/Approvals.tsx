import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, ChevronDown, ChevronUp, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { mockApplications, serviceItems } from '@/mock/data';
import type { Application } from '@/types';

type TabKey = 'pending' | 'approved' | 'all';
type ActionKey = 'approve' | 'reject' | 'transfer' | null;

const statusConfig: Record<string, { label: string; cls: string }> = {
  submitted: { label: '待审批', cls: 'bg-amber-100 text-amber-700' },
  under_review: { label: '审核中', cls: 'bg-blue-100 text-blue-700' },
  approved: { label: '已通过', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已退回', cls: 'bg-red-100 text-red-700' },
  completed: { label: '已完成', cls: 'bg-gray-100 text-gray-600' },
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-500' },
};

function getServiceDocs(serviceId: string) {
  const svc = serviceItems.find((s) => s.id === serviceId);
  return svc?.requiredDocuments ?? [];
}

function getServiceDept(serviceId: string) {
  const svc = serviceItems.find((s) => s.id === serviceId);
  return svc?.department ?? '';
}

const applicantNames: Record<string, string> = {
  u001: '张三',
  u002: '李四',
  u003: '王五',
};

export default function Approvals() {
  const [tab, setTab] = useState<TabKey>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<ActionKey>(null);
  const [modalAppId, setModalAppId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'pending', label: '待审批' },
    { key: 'approved', label: '已审批' },
    { key: 'all', label: '全部' },
  ];

  const filtered = mockApplications.filter((a) => {
    if (tab === 'pending') return a.status === 'submitted' || a.status === 'under_review';
    if (tab === 'approved') return a.status === 'approved' || a.status === 'rejected' || a.status === 'completed';
    return true;
  });

  const openModal = (action: ActionKey, appId: string) => {
    setModalAction(action);
    setModalAppId(appId);
    setComment('');
  };

  const closeModal = () => {
    setModalAction(null);
    setModalAppId(null);
    setComment('');
  };

  const actionLabels: Record<string, { label: string; icon: typeof CheckCircle; cls: string }> = {
    approve: { label: '通过', icon: CheckCircle, cls: 'gov-btn-primary' },
    reject: { label: '退回', icon: XCircle, cls: 'bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200' },
    transfer: { label: '转办', icon: ArrowRightLeft, cls: 'gov-btn-secondary' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="gov-section-title">
        <ClipboardCheck className="w-5 h-5 text-gov-blue" />
        审批中心
      </h2>

      <div className="flex gap-1 bg-white rounded-lg p-1 border border-gov-border w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setExpandedId(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? 'bg-gov-blue text-white shadow-sm'
                : 'text-gov-text-secondary hover:text-gov-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((app: Application) => {
          const expanded = expandedId === app.id;
          const cfg = statusConfig[app.status] ?? { label: app.status, cls: 'bg-gray-100 text-gray-500' };
          const docs = getServiceDocs(app.serviceId);
          const dept = getServiceDept(app.serviceId);
          const isPending = app.status === 'submitted' || app.status === 'under_review';

          return (
            <div key={app.id} className="gov-card overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/30 transition-colors"
                onClick={() => setExpandedId(expanded ? null : app.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center text-gov-blue font-bold text-sm">
                    {(applicantNames[app.userId] ?? app.userId)[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gov-text">{applicantNames[app.userId] ?? app.userId}</span>
                      <span className="text-gov-text-secondary">·</span>
                      <span className="text-sm text-gov-text">{app.serviceName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gov-text-secondary">
                      <span>{dept}</span>
                      <span>提交于 {app.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`gov-badge ${cfg.cls}`}>{cfg.label}</span>
                  {expanded ? <ChevronUp className="w-4 h-4 text-gov-text-secondary" /> : <ChevronDown className="w-4 h-4 text-gov-text-secondary" />}
                </div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-gov-border pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gov-text-secondary mb-1">申请步骤</p>
                          <div className="flex items-center gap-2">
                            {app.steps.map((step, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    step.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : step.status === 'active'
                                      ? 'bg-blue-100 text-gov-blue'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {i + 1}
                                </div>
                                <span className="text-xs text-gov-text-secondary">{step.name}</span>
                                {i < app.steps.length - 1 && <div className="w-4 h-px bg-gov-border" />}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gov-text-secondary mb-1">所需材料</p>
                          <div className="flex flex-wrap gap-1.5">
                            {docs.map((doc) => (
                              <span key={doc} className="gov-badge bg-gray-100 text-gray-600">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-3 pt-2 border-t border-gov-border">
                          {Object.entries(actionLabels).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <button
                                key={key}
                                onClick={() => openModal(key as ActionKey, app.id)}
                                className={`${cfg.cls} flex items-center gap-1.5 text-sm`}
                              >
                                <Icon className="w-4 h-4" />
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="gov-card p-8 text-center text-gov-text-secondary">
            暂无审批记录
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalAction && modalAppId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gov-text mb-4">
                {actionLabels[modalAction].label}审批
              </h3>
              <textarea
                className="gov-input min-h-[100px] resize-none"
                placeholder="请输入审批意见..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={closeModal} className="gov-btn-secondary text-sm">
                  取消
                </button>
                <button
                  onClick={closeModal}
                  className={`${actionLabels[modalAction].cls} text-sm`}
                >
                  确认{actionLabels[modalAction].label}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
