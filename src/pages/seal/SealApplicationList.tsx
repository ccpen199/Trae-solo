import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  User,
  Calendar,
  Clock,
  Paperclip,
  Check,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, formatDate, getSealStatusLabel, getSealTypeLabel } from "@/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { SealStatus, SealType, SealApplication } from "@/types";

const statusFilters: { value: SealStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待审批" },
  { value: "approved", label: "已批准" },
  { value: "rejected", label: "已拒绝" },
  { value: "in_use", label: "使用中" },
  { value: "returned", label: "已归还" },
];

const typeFilters: { value: SealType | "all"; label: string }[] = [
  { value: "all", label: "全部类型" },
  { value: "official", label: "公章" },
  { value: "finance", label: "财务章" },
  { value: "contract", label: "合同章" },
];

export default function SealApplicationList() {
  const navigate = useNavigate();
  const { sealApplications, updateSealApplication, currentUser } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<SealStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SealType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<SealApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return sealApplications.filter((item) => {
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchType = typeFilter === "all" || item.sealType === typeFilter;
      const matchSearch =
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchType && matchSearch;
    });
  }, [sealApplications, statusFilter, typeFilter, searchQuery]);

  const handleApprove = (app: SealApplication) => {
    setSelectedApp(app);
    setRejectReason("");
    setModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedApp) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    updateSealApplication(selectedApp.id, {
      status: "approved",
      approver: currentUser.id,
      approverName: currentUser.name,
      approveTime: new Date().toISOString(),
    });
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const confirmReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    updateSealApplication(selectedApp.id, {
      status: "rejected",
      approver: currentUser.id,
      approverName: currentUser.name,
      approveTime: new Date().toISOString(),
      rejectReason: rejectReason.trim(),
    });
    setIsSubmitting(false);
    setModalOpen(false);
    setRejectReason("");
  };

  const handleUnlock = (app: SealApplication) => {
    updateSealApplication(app.id, {
      status: "in_use",
      unlockTime: new Date().toISOString(),
    });
    navigate("/seal/cabinet");
  };

  const badgeVariant = (status: SealStatus) => {
    const map = { pending: "warning", approved: "primary", rejected: "danger", in_use: "info", returned: "success" } as const;
    return map[status];
  };

  const typeVariant = (type: SealType) =>
    type === "official" ? "primary" : type === "finance" ? "success" : "info";

  const renderFooter = (app: SealApplication) => {
    if (app.status === "pending")
      return <Button leftIcon={<Check className="w-4 h-4" />} className="flex-1" onClick={() => handleApprove(app)}>审批</Button>;
    if (app.status === "approved")
      return <Button leftIcon={<Unlock className="w-4 h-4" />} className="flex-1" onClick={() => handleUnlock(app)}>开锁</Button>;
    if (app.status === "in_use")
      return <Badge variant="info" className="flex-1 justify-center py-2"><Lock className="w-3 h-3 mr-1" /> 使用中</Badge>;
    if (app.status === "returned")
      return <Badge variant="success" className="flex-1 justify-center py-2"><Check className="w-3 h-3 mr-1" /> 已归还</Badge>;
    return <Badge variant="danger" className="flex-1 justify-center py-2"><X className="w-3 h-3 mr-1" /> 已拒绝</Badge>;
  };

  const FilterButton = ({ filter, active, onClick, color = "primary" }: {
    filter: { value: string; label: string };
    active: boolean;
    onClick: () => void;
    color?: "primary" | "trust";
  }) => (
    <m.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? color === "primary" ? "bg-primary-600 text-white shadow-md" : "bg-trust-600 text-white shadow-md"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      {filter.label}
    </m.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">用章申请</h1>
          <p className="text-slate-500">管理印章使用申请，确保规范用章</p>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((f) => (
                  <FilterButton key={f.value} filter={f} active={statusFilter === f.value} onClick={() => setStatusFilter(f.value)} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {typeFilters.map((f) => (
                  <FilterButton key={f.value} filter={f} active={typeFilter === f.value} onClick={() => setTypeFilter(f.value)} color="trust" />
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索申请人或事由..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate("/seal/new")}>申请用章</Button>
            </div>
          </div>
        </m.div>

        {filtered.length === 0 ? (
          <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-card p-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">暂无申请记录</h3>
            <p className="text-slate-400">{searchQuery ? "没有找到匹配的申请，请尝试其他关键词" : "还没有任何用章申请，点击右上角发起第一个申请"}</p>
          </m.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((app, i) => {
                const statusInfo = getSealStatusLabel(app.status);
                const typeInfo = getSealTypeLabel(app.sealType);
                return (
                  <m.div key={app.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                    <Card hoverable className="h-full flex flex-col">
                      <CardContent className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-2">
                            <Badge variant={badgeVariant(app.status)} dot>{statusInfo.label}</Badge>
                            <Badge variant={typeVariant(app.sealType)}>{typeInfo.label}</Badge>
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 mb-4 line-clamp-2 min-h-[3rem]">{app.reason}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-500"><User className="w-4 h-4" /><span>申请人：{app.applicantName}</span></div>
                          <div className="flex items-center gap-2 text-slate-500"><Calendar className="w-4 h-4" /><span>申请时间：{formatDate(app.createdAt || "", "YYYY-MM-DD HH:mm")}</span></div>
                          <div className="flex items-center gap-2 text-slate-500"><Clock className="w-4 h-4" /><span>预计使用：{formatDate(app.useTime, "YYYY-MM-DD HH:mm")}</span></div>
                          {app.attachments.length > 0 && <div className="flex items-center gap-2 text-slate-500"><Paperclip className="w-4 h-4" /><span>{app.attachments.length} 个附件</span></div>}
                          {app.approverName && <div className="flex items-center gap-2 text-slate-500"><Check className="w-4 h-4 text-emerald-500" /><span>审批人：{app.approverName}</span></div>}
                          {app.rejectReason && <div className="mt-2 p-2 bg-rose-50 rounded-lg text-sm text-rose-600"><span className="font-medium">拒绝原因：</span>{app.rejectReason}</div>}
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-3">{renderFooter(app)}</CardFooter>
                    </Card>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filtered.length > 0 && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-8 text-slate-400 text-sm">
            共 {filtered.length} 条申请记录
          </m.div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => !isSubmitting && setModalOpen(false)}
          title="审批用章申请"
          description={`申请人：${selectedApp?.applicantName}`}
          size="md"
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>取消</Button>
              <Button variant="danger" leftIcon={<X className="w-4 h-4" />} onClick={confirmReject} disabled={isSubmitting || !rejectReason.trim()} isLoading={isSubmitting}>拒绝</Button>
              <Button leftIcon={<Check className="w-4 h-4" />} onClick={confirmApprove} disabled={isSubmitting} isLoading={isSubmitting}>批准</Button>
            </div>
          }
        >
          {selectedApp && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500 mb-1">申请事由</div>
                <div className="text-slate-800 font-medium">{selectedApp.reason}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">印章类型</div>
                  <div className="text-slate-800 font-medium">{getSealTypeLabel(selectedApp.sealType).label}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">预计使用</div>
                  <div className="text-slate-800 font-medium">{formatDate(selectedApp.useTime, "YYYY-MM-DD HH:mm")}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-2">拒绝原因 <span className="text-rose-500">*（拒绝时必填）</span></div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="如拒绝，请填写拒绝原因..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
