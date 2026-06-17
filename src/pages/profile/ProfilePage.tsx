import { useState } from "react";
import { motion as m } from "framer-motion";
import {
  Phone, MapPin, Vote, Shield, Link2, Copy, Check, Save,
  Lock, LogOut, Clock, FileText, ThumbsUp, BarChart3, Pencil,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, ProgressBar } from "@/components/ui";
import { useAppStore } from "@/stores";
import { cn, formatDate, getRoleLabel, copyToClipboard } from "@/utils";

const positionMap = {
  director: { label: "主任", variant: "primary" as const },
  vice_director: { label: "副主任", variant: "info" as const },
  member: { label: "委员", variant: "info" as const },
  supervisor: { label: "监事", variant: "warning" as const },
};

const statusMap = {
  active: { label: "在任", variant: "success" as const },
  ended: { label: "已离任", variant: "secondary" as const },
  suspended: { label: "候任", variant: "warning" as const },
};

const approvalItems = [
  { label: "用章审批", enabled: true, desc: "" },
  { label: "财务审批", enabled: true, desc: "单笔5万元以下" },
  { label: "合同审批", enabled: false, desc: "" },
  { label: "人事审批", enabled: false, desc: "" },
];

const statCards = [
  { icon: Clock, color: "primary", label: "在任天数", value: "days" as const },
  { icon: FileText, color: "trust", label: "参与议案数", value: "18" },
  { icon: ThumbsUp, color: "emerald", label: "审批次数", value: "156" },
  { icon: BarChart3, color: "amber", label: "投票参与率", value: "94%" },
];

const inputStyle = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

export default function ProfilePage() {
  const { currentUser, councilMembers, owners } = useAppStore();
  const [hashModalOpen, setHashModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: currentUser.phone,
    email: "zhang.mh@example.com",
    emergencyContact: "李明 139****9999",
    bio: "致力于为小区业主提供更优质的居住环境和服务，推动社区治理数字化升级。",
  });

  const member = councilMembers.find((cm) => cm.ownerId === currentUser.ownerId);
  const ownerInfo = owners.find((o) => o.id === currentUser.ownerId);
  const pos = member ? positionMap[member.position] : { label: getRoleLabel(currentUser.role), variant: "primary" as const };
  const statusInfo = member ? statusMap[member.status] : { label: "在任", variant: "success" as const };

  const termStart = member?.termStart || "2023-01-01";
  const termEnd = member?.termEnd || "2026-01-01";
  const totalTermDays = 1095;
  const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(termStart).getTime()) / 86400000));
  const remainDays = Math.max(0, Math.floor((new Date(termEnd).getTime() - Date.now()) / 86400000));
  const blockchainHash = member?.blockchainHash || member?.electionTransactionHash || "";
  const initials = currentUser.name.slice(-2);

  const handleCopyHash = async (hash: string) => {
    await copyToClipboard(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6">
      <div className="flex gap-6">
        {/* 左侧栏 - 个人资料卡 */}
        <div className="w-1/4 space-y-4">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/30">
                {currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" /> : initials}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-800">{currentUser.name}</h2>
              <Badge variant={pos.variant} size="lg" className="mt-2">{pos.label}</Badge>
              {ownerInfo && (
                <p className="mt-3 text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{ownerInfo.building} {ownerInfo.unit} {ownerInfo.room}室
                </p>
              )}
              <p className="mt-2 text-sm text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />{currentUser.phone}
              </p>
              <Badge variant={statusInfo.variant} dot size="lg" className="mt-4">{statusInfo.label}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* 中间栏 - 主要信息区 */}
        <div className="w-1/2 space-y-4">
          {/* 任期信息 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>任期信息</CardTitle>
              <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500">任期开始</span><p className="font-medium text-slate-800">{formatDate(termStart)}</p></div>
                <div><span className="text-sm text-slate-500">任期结束</span><p className="font-medium text-slate-800">{formatDate(termEnd)}</p></div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-500">任期进度（剩余 {remainDays} 天）</span>
                  <span className="text-sm font-semibold text-primary-600">{Math.round((elapsedDays / totalTermDays) * 100)}%</span>
                </div>
                <ProgressBar value={elapsedDays} max={totalTermDays} variant="primary" size="md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500">第几届委员会</span><p className="font-medium text-slate-800">第3届</p></div>
                <div><span className="text-sm text-slate-500">当选日期</span><p className="font-medium text-slate-800">{formatDate(termStart)}</p></div>
              </div>
              <div>
                <span className="text-sm text-slate-500">得票数</span>
                <p className="font-medium text-slate-800 flex items-center gap-1"><Vote className="w-4 h-4 text-primary-500" />{member?.electionVoteCount || member?.votes || 0} 票</p>
              </div>
              {blockchainHash && (
                <Button variant="outline" size="sm" leftIcon={<Link2 className="w-4 h-4" />} onClick={() => setHashModalOpen(true)}>链上存证</Button>
              )}
            </CardContent>
          </Card>

          {/* 审批权限 */}
          <Card>
            <CardHeader><CardTitle>审批权限</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {approvalItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    {item.desc && <span className="ml-2 text-xs text-slate-400">{item.desc}</span>}
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", item.enabled ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500")}>
                    {item.enabled ? "是" : "否"}
                  </span>
                </div>
              ))}
              <div className="pt-2 flex gap-6 text-sm">
                <span className="text-slate-500">本月已审批：<span className="font-semibold text-slate-800">23</span> 项</span>
                <span className="text-slate-500">审批通过率：<span className="font-semibold text-emerald-600">91.3%</span></span>
              </div>
            </CardContent>
          </Card>

          {/* 个人资料维护 */}
          <Card>
            <CardHeader><CardTitle>个人资料维护</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "phone" as const, label: "联系电话", type: "input" },
                { key: "email" as const, label: "电子邮箱", type: "input" },
                { key: "emergencyContact" as const, label: "紧急联系人", type: "input" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-sm text-slate-500 mb-1 block">{field.label}</label>
                  <input className={inputStyle} value={profileForm[field.key]} onChange={(e) => setProfileForm((f) => ({ ...f, [field.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-sm text-slate-500 mb-1 block">个人简介</label>
                <textarea rows={3} className={cn(inputStyle, "resize-none")} value={profileForm.bio} onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))} />
              </div>
              <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>保存修改</Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧栏 - 统计与操作 */}
        <div className="w-1/4 space-y-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6 text-center">
                  <Icon className={cn("w-8 h-8 mx-auto mb-2", `text-${stat.color}-500`)} />
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className={cn("text-4xl font-bold mt-1", `text-${stat.color}-600`)}>
                    {stat.value === "days" ? elapsedDays : stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
          <div className="space-y-3">
            <Button variant="outline" className="w-full" leftIcon={<Lock className="w-4 h-4" />}>修改密码</Button>
            <Button variant="danger" className="w-full" leftIcon={<LogOut className="w-4 h-4" />}>退出登录</Button>
          </div>
        </div>
      </div>

      {/* 链上存证 Modal */}
      <Modal isOpen={hashModalOpen} onClose={() => setHashModalOpen(false)} title="链上存证信息" size="lg">
        <div className="space-y-4">
          <div>
            <span className="text-sm text-slate-500">选举投票哈希值</span>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg break-all text-primary-700">{blockchainHash}</code>
              <Button variant="ghost" size="icon" onClick={() => handleCopyHash(blockchainHash)}>
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-slate-500">区块高度</span><p className="font-mono text-sm font-medium text-slate-800 mt-1">#18,234,567</p></div>
            <div><span className="text-sm text-slate-500">时间戳</span><p className="text-sm font-medium text-slate-800 mt-1">{formatDate(termStart, "YYYY-MM-DD HH:mm")}</p></div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-emerald-600">区块链存证验证通过，数据未被篡改</span>
          </div>
        </div>
      </Modal>
    </m.div>
  );
}
