import { Fragment, useState, useEffect, useCallback } from "react";
import {
  Landmark,
  Building2,
  Home,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  X,
  Shield,
  RefreshCw,
  Users,
  FileCheck,
  Clock,
  Database,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Merge,
  UserCheck,
  ArrowLeftRight,
  Tag,
  History,
  User,
} from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import type { OrgNode, Member, MemberAudit, VerifyResult } from "@/types";

interface SyncStatus {
  lastSyncTime: string;
  status: "syncing" | "success" | "error";
  syncedCount: number;
  pendingCount: number;
  nextSyncTime: string;
}

const mockSyncStatus: SyncStatus = {
  lastSyncTime: "2026-06-10 08:30:00",
  status: "success",
  syncedCount: 12853,
  pendingCount: 47,
  nextSyncTime: "2026-06-10 14:30:00",
};

const mockSyncConflicts = [
  {
    id: "c1",
    memberName: "李四",
    memberId: "mem-2",
    description: "工号不一致(本地EDU002 vs 全国库EDU002B)",
  },
  {
    id: "c2",
    memberName: "王五",
    memberId: "mem-5",
    description: "所属工会不匹配(教育工会 vs 卫生工会)",
  },
];

function OrgTreeNode({
  node,
  selectedId,
  onSelect,
  depth,
}: {
  node: OrgNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const iconMap = {
    province: Landmark,
    city: Building2,
    base: Home,
  };
  const Icon = iconMap[node.level];

  const iconColorMap = {
    province: "text-union-red",
    city: "text-union-gold",
    base: "text-blue-500",
  };

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-gray-100",
          isSelected && "bg-union-red/10 text-union-red hover:bg-union-red/15"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={14} className="shrink-0 text-gray-400" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-gray-400" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Icon size={16} className={cn("shrink-0", iconColorMap[node.level])} />
        <span className="truncate flex-1 text-left">{node.name}</span>
        <span
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full shrink-0",
            isSelected
              ? "bg-union-red/20 text-union-red"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {node.memberCount}
        </span>
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VerifyDialog({
  open,
  onClose,
  onVerify,
}: {
  open: boolean;
  onClose: () => void;
  onVerify: (idCard: string, employeeNo: string) => Promise<any>;
}) {
  const [idCard, setIdCard] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: VerifyResult;
  } | null>(null);

  const handleVerify = async () => {
    if (!idCard || !employeeNo) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await onVerify(idCard, employeeNo);
      if (res.success) {
        setResult({
          success: true,
          message: "身份核验通过，信息匹配",
          data: res.data as VerifyResult,
        });
      } else {
        setResult({
          success: false,
          message: res.message || "身份核验未通过，信息不匹配",
        });
      }
    } catch {
      setResult({ success: false, message: "核验请求失败，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setIdCard("");
      setEmployeeNo("");
      setResult(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-union-red/10 text-union-red rounded-xl flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">职工身份核验</h3>
            <p className="text-xs text-gray-500">
              通过全国工会数据库验证职工身份
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              身份证号
            </label>
            <input
              type="text"
              value={idCard}
              onChange={(e) => setIdCard(e.target.value)}
              placeholder="请输入18位身份证号"
              className="input-field"
              maxLength={18}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工号
            </label>
            <input
              type="text"
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              placeholder="请输入工号"
              className="input-field"
            />
          </div>

          {result && (
            <div
              className={cn(
                "rounded-lg text-sm border",
                result.success
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              <div className="flex items-center gap-2 p-3 pb-2">
                {result.success ? (
                  <Check size={16} className="shrink-0" />
                ) : (
                  <AlertCircle size={16} className="shrink-0" />
                )}
                <span className="font-medium">{result.message}</span>
              </div>
              {result.success && result.data && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-green-200/60">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-green-600/80 text-xs shrink-0">
                      匹配工会
                    </span>
                    <span className="text-green-800 font-medium text-right">
                      {result.data.matchedORG}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-green-600/80 text-xs shrink-0">
                      匹配置信度
                    </span>
                    <span className="text-green-800 font-medium font-serif">
                      {result.data.matchConfidence}%
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-green-600/80 text-xs shrink-0">
                      建议审核人
                    </span>
                    <span className="text-green-800 font-medium text-right">
                      {result.data.suggestedReviewer}
                      <span className="text-green-600 text-xs ml-1">
                        ({result.data.suggestedReviewerOrg})
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">
              取消
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || !idCard || !employeeNo}
              className={cn(
                "btn-primary flex-1",
                (loading || !idCard || !employeeNo) &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "核验中..." : "开始核验"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectDialog({
  open,
  onClose,
  onConfirm,
  memberName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  memberName: string;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <XCircle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">驳回会员申请</h3>
            <p className="text-xs text-gray-500">
              请填写驳回原因（{memberName}）
            </p>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            驳回原因
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入驳回原因..."
            className="input-field min-h-[100px] resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">
            取消
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              "bg-red-600 text-white hover:bg-red-700",
              !reason.trim() && "opacity-50 cursor-not-allowed"
            )}
          >
            <X size={16} />
            确认驳回
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditTimelineItem({ audit }: { audit: MemberAudit }) {
  const iconMap: Record<string, any> = {
    approve: CheckCircle2,
    reject: XCircle,
    verify: ShieldCheck,
    sync_add: Database,
    sync_update: ArrowLeftRight,
    sync_conflict: AlertTriangle,
  };
  const colorMap: Record<string, string> = {
    approve: "bg-green-500",
    reject: "bg-red-500",
    verify: "bg-blue-500",
    sync_add: "bg-gray-500",
    sync_update: "bg-blue-500",
    sync_conflict: "bg-orange-500",
  };
  const badgeBgMap: Record<string, string> = {
    approve: "bg-green-50 text-green-700 border-green-200",
    reject: "bg-red-50 text-red-700 border-red-200",
    verify: "bg-blue-50 text-blue-700 border-blue-200",
    sync_add: "bg-gray-50 text-gray-700 border-gray-200",
    sync_update: "bg-blue-50 text-blue-700 border-blue-200",
    sync_conflict: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const Icon = iconMap[audit.action] || FileCheck;
  const isReject = audit.action === "reject";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0",
            colorMap[audit.action] || "bg-gray-500"
          )}
        >
          <Icon size={14} />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
              badgeBgMap[audit.action] || "bg-gray-50"
            )}
          >
            {audit.actionLabel}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            <Tag size={10} />
            {audit.sourceLabel}
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-1 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User size={10} />
            {audit.operatorName || "系统自动"}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {audit.createdAt}
          </span>
        </div>
        {audit.reason && (
          <div
            className={cn(
              "text-xs p-2 rounded-md mt-1",
              isReject
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-gray-50 text-gray-600 border border-gray-100"
            )}
          >
            {audit.reason}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberDetailDrawer({
  member,
  auditList,
  auditLoading,
  onClose,
}: {
  member: Member | null;
  auditList: MemberAudit[];
  auditLoading: boolean;
  onClose: () => void;
}) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl h-full flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-union-red/10 text-union-red rounded-xl flex items-center justify-center">
            <UserCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {member.name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <History size={10} />
              操作审计轨迹
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">身份证号</p>
              <p className="font-mono text-gray-800">
                {maskIdCard(member.idCard)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">工号</p>
              <p className="text-gray-800">{member.employeeNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">所属工会</p>
              <p className="text-gray-800 truncate">{member.orgName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">入会日期</p>
              <p className="text-gray-800">{member.joinDate || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">积分</p>
              <p className="text-gray-800 font-serif">
                {member.points.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">状态</p>
              <StatusBadge status={member.status} />
            </div>
          </div>
          {member.tags && member.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {member.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-union-gold/10 text-union-gold border border-union-gold/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
            <History size={14} className="text-union-red" />
            审计轨迹
          </h4>
          {auditLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw size={20} className="text-union-red animate-spin" />
            </div>
          ) : auditList.length > 0 ? (
            <div>
              {auditList.map((audit) => (
                <AuditTimelineItem key={audit.id} audit={audit} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <FileCheck size={28} className="mb-2" />
              <p className="text-xs">暂无审计记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function maskIdCard(idCard: string): string {
  if (idCard.length < 10) return idCard;
  return idCard.slice(0, 6) + "********" + idCard.slice(-4);
}

const statusFilterOptions = [
  { value: "", label: "全部" },
  { value: "pending", label: "待审核" },
  { value: "active", label: "已激活" },
  { value: "rejected", label: "已驳回" },
] as const;

export default function Organization() {
  const {
    orgTree,
    members,
    membersLoading,
    memberAudit,
    memberAuditLoading,
    fetchOrgTree,
    fetchMembers,
    approveMember,
    rejectMember,
    verifyMember,
    fetchMemberAudit,
  } = useStore();

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingMember, setRejectingMember] = useState<Member | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrgTree();
    fetchMembers();
  }, [fetchOrgTree, fetchMembers]);

  const loadMembers = useCallback(() => {
    const params: Record<string, string> = {};
    if (selectedOrgId) params.orgId = selectedOrgId;
    if (searchQuery) params.search = searchQuery;
    if (statusFilter) params.status = statusFilter;
    fetchMembers(params);
  }, [selectedOrgId, searchQuery, statusFilter, fetchMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRowClick = async (member: Member) => {
    setSelectedMember(member);
    setExpandedRowId((prev) => (prev === member.id ? null : member.id));
    await fetchMemberAudit(member.id);
  };

  const handleApprove = async (id: string) => {
    await approveMember(id);
  };

  const handleRejectClick = (member: Member) => {
    setRejectingMember(member);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (rejectingMember) {
      await rejectMember(rejectingMember.id, reason);
    }
    setRejectDialogOpen(false);
    setRejectingMember(null);
  };

  const syncStatus = mockSyncStatus;
  const syncConflicts = mockSyncConflicts;

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      <div className="w-1/3 shrink-0 flex flex-col">
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building2 size={18} className="text-union-red" />
            <h2 className="font-semibold text-gray-900">组织架构</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {orgTree.length > 0 ? (
              orgTree.map((node) => (
                <OrgTreeNode
                  key={node.id}
                  node={node}
                  selectedId={selectedOrgId}
                  onSelect={setSelectedOrgId}
                  depth={0}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users size={32} className="mb-2" />
                <p className="text-sm">暂无组织数据</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-hidden">
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索姓名、工号..."
                  className="input-field pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-auto"
              >
                {statusFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setVerifyDialogOpen(true)}
                className="btn-gold flex items-center gap-2"
              >
                <Shield size={16} />
                身份核验
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {membersLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw size={24} className="text-union-red animate-spin" />
              </div>
            ) : members.length > 0 ? (
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 w-8"></th>
                    <th className="px-5 py-3">姓名</th>
                    <th className="px-5 py-3">身份证</th>
                    <th className="px-5 py-3">工号</th>
                    <th className="px-5 py-3">所属工会</th>
                    <th className="px-5 py-3">状态</th>
                    <th className="px-5 py-3">入会日期</th>
                    <th className="px-5 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map((member) => {
                    const isExpanded = expandedRowId === member.id;
                    return (
                      <Fragment key={member.id}>
                        <tr
                          onClick={() => handleRowClick(member)}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isExpanded
                              ? "bg-union-red/5"
                              : "hover:bg-gray-50/50"
                          )}
                        >
                          <td className="px-5 py-3">
                            <ChevronDown
                              size={14}
                              className={cn(
                                "text-gray-400 transition-transform",
                                isExpanded && "rotate-180"
                              )}
                            />
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 font-mono">
                            {maskIdCard(member.idCard)}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {member.employeeNo}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                            {member.orgName}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={member.status} />
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {member.joinDate}
                          </td>
                          <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                            {member.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(member.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
                                  <Check size={12} />
                                  审核通过
                                </button>
                                <button
                                  onClick={() => handleRejectClick(member)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                >
                                  <X size={12} />
                                  驳回
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50/30">
                            <td colSpan={8} className="px-5 py-0">
                              <div className="py-4 border-l-2 border-union-red/30 ml-4 pl-6">
                                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                  <History size={12} className="text-union-red" />
                                  最近操作记录
                                </h4>
                                {memberAuditLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <RefreshCw size={16} className="text-union-red animate-spin" />
                                  </div>
                                ) : memberAudit.length > 0 ? (
                                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {memberAudit.slice(0, 3).map((audit) => (
                                      <AuditTimelineItem key={audit.id} audit={audit} />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400">暂无审计记录</p>
                                )}
                                <div className="mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(member);
                                    }}
                                    className="text-xs text-union-red hover:text-union-red/80 font-medium flex items-center gap-1"
                                  >
                                    <Eye size={12} />
                                    查看完整审计轨迹
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Users size={40} className="mb-3" />
                <p className="text-sm">暂无成员数据</p>
              </div>
            )}
          </div>

          {members.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              共 {members.length} 条记录
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Database size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  全国工会数据库同步
                </h3>
                <p className="text-xs text-gray-500">实时同步全国工会会员信息</p>
              </div>
              <div className="ml-auto">
                {syncStatus.status === "success" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    同步成功
                  </span>
                )}
                {syncStatus.status === "syncing" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    <RefreshCw size={12} className="animate-spin" />
                    同步中
                  </span>
                )}
                {syncStatus.status === "error" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                    <AlertCircle size={12} />
                    同步异常
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <Clock size={16} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">上次同步</p>
                  <p className="text-sm font-medium text-gray-900">
                    {syncStatus.lastSyncTime.split(" ")[1]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <FileCheck size={16} className="text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">已同步</p>
                  <p className="text-sm font-medium text-gray-900 font-serif">
                    {syncStatus.syncedCount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <AlertCircle size={16} className="text-union-gold shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">待同步</p>
                  <p className="text-sm font-medium text-gray-900 font-serif">
                    {syncStatus.pendingCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <RefreshCw size={16} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">下次同步</p>
                  <p className="text-sm font-medium text-gray-900">
                    {syncStatus.nextSyncTime.split(" ")[1]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  同步差异待处理
                </h3>
                <p className="text-xs text-gray-500">
                  本地数据与全国库存在差异，请人工核对
                </p>
              </div>
              <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {syncConflicts.length}
              </span>
            </div>
            <div className="space-y-2">
              {syncConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="flex items-center gap-3 p-3 bg-orange-50/50 border border-orange-100 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      会员 {conflict.memberName}
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      {conflict.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <Eye size={12} />
                      查看详情
                    </button>
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-union-red text-white hover:bg-union-red/90 transition-colors">
                      <Merge size={12} />
                      手动合并
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <VerifyDialog
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        onVerify={verifyMember}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectingMember(null);
        }}
        onConfirm={handleRejectConfirm}
        memberName={rejectingMember?.name || ""}
      />

      <MemberDetailDrawer
        member={selectedMember}
        auditList={memberAudit}
        auditLoading={memberAuditLoading}
        onClose={() => {
          setSelectedMember(null);
          setExpandedRowId(null);
        }}
      />
    </div>
  );
}
