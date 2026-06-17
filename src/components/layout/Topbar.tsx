import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, User, LogOut, Settings, ChevronDown, CheckCircle,
  Shield, Users, Building2, Home, Wrench, MapPin, X, Check,
  AlertTriangle, Info, ClipboardList, ShieldCheck, ArrowRight,
  CheckSquare, FileSearch,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Breadcrumb } from "./Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn, getRoleLabel } from "@/utils";
import type { UserRole } from "@/types";

interface RoleOption {
  id: string;
  name: string;
  role: UserRole;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badgeVariant: "primary" | "info" | "success" | "warning" | "danger" | "secondary";
  permissions: string[];
  todoCount: number;
  todoPreview: string[];
}

const rolePermissions: Record<string, string[]> = {
  council_director: ["用章审批", "财务审批", "合同审批", "人事审批", "街道指令接收"],
  council_member: ["协助财务审核", "参与议事", "业主接待", "会议组织"],
  property_admin: ["报修派单", "人员调度", "费用收缴", "合同执行", "日常运维"],
  maintenance_staff: ["接收工单", "上传维修记录", "考勤打卡"],
  street_officer: ["监管指令下发", "督办工单", "数据抽查", "合规检查"],
};

const getRoleTodoCount = (role: string): number => ({
  council_director: 18, council_member: 12, property_admin: 25,
  maintenance_staff: 15, street_officer: 10,
}[role] || 0);

const roleOptions: RoleOption[] = [
  { id: "u001", name: "张明华", role: "council_director", description: "业委会主任", icon: <Shield className="w-5 h-5" />, gradient: "from-primary-500 to-primary-600", badgeVariant: "primary", permissions: ["审批权限", "财务审核", "用章审批", "监管指令"], todoCount: 18, todoPreview: ["用章审批待办3条", "票据审核待办5条", "投票决议待办4条"] },
  { id: "u002", name: "李建国", role: "council_member", description: "业委会副主任", icon: <Users className="w-5 h-5" />, gradient: "from-trust-500 to-trust-600", badgeVariant: "info", permissions: ["协助审核", "参与议事", "业主接待", "会议组织"], todoCount: 12, todoPreview: ["票据复核待办4条", "投票参与待办4条", "业主接待待办2条"] },
  { id: "u003", name: "王芳", role: "council_member", description: "业委会委员", icon: <Building2 className="w-5 h-5" />, gradient: "from-emerald-500 to-emerald-600", badgeVariant: "success", permissions: ["议事投票", "意见收集", "业主核验"], todoCount: 8, todoPreview: ["投票参与待办4条", "业主核验待办2条", "意见收集待办2条"] },
  { id: "u004", name: "陈强", role: "property_admin", description: "物业经理", icon: <Home className="w-5 h-5" />, gradient: "from-amber-500 to-amber-600", badgeVariant: "warning", permissions: ["报修派单", "人员调度", "费用收缴", "合同执行"], todoCount: 25, todoPreview: ["工单处理待办12条", "督办事项待办5条", "费用收缴待办5条"] },
  { id: "u005", name: "刘伟", role: "maintenance_staff", description: "维修人员", icon: <Wrench className="w-5 h-5" />, gradient: "from-orange-500 to-orange-600", badgeVariant: "danger", permissions: ["接收工单", "维修记录", "考勤打卡"], todoCount: 15, todoPreview: ["工单处理待办12条", "维修记录待办3条"] },
  { id: "u006", name: "赵丽", role: "street_officer", description: "街道办", icon: <MapPin className="w-5 h-5" />, gradient: "from-slate-500 to-slate-600", badgeVariant: "secondary", permissions: ["监管指令", "督办工单", "数据抽查", "合规检查"], todoCount: 10, todoPreview: ["督办事项待办6条", "合规检查待办2条", "数据抽查待办2条"] },
];

function Toast({ type, message, onClose }: { type: string | null; message: string; onClose: () => void }) {
  useEffect(() => { if (type) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [type, onClose]);
  if (!type) return null;
  const config = { success: { bg: "bg-emerald-500", icon: <Check className="w-5 h-5" /> }, error: { bg: "bg-rose-500", icon: <AlertTriangle className="w-5 h-5" /> }, info: { bg: "bg-primary-500", icon: <Info className="w-5 h-5" /> } }[type as keyof typeof config] || { bg: "bg-primary-500", icon: <Info className="w-5 h-5" /> };
  return (
    <motion.div initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }} className="fixed top-6 left-1/2 z-[100] shadow-lg rounded-xl overflow-hidden">
      <div className={cn("flex items-center gap-3 px-5 py-3 text-white", config.bg)}>
        {config.icon}<span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
}

export function Topbar() {
  const { currentUser, todos, logout, switchRole, toast, hideToast, showToast } = useAppStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const pendingTodos = todos.filter((t) => t.priority === "high" || t.priority === "medium");
  const currentRole = roleOptions.find((r) => r.id === currentUser.id) || roleOptions[0];

  const confirmLogout = () => { logout(); setShowLogoutModal(false); navigate("/login"); };

  const confirmSwitchRole = () => {
    if (selectedRole && selectedRole.id !== currentUser.id) {
      switchRole(selectedRole.role, selectedRole.name, selectedRole.id);
      setShowRoleModal(false);
      showToast("success", `身份已切换为「${selectedRole.name} · ${selectedRole.description}」，权限范围已更新`);
      navigate("/dashboard");
      window.location.reload();
    }
  };

  const RoleCard = ({ role, isSelected, isCurrent, onClick }: { role: RoleOption; isSelected: boolean; isCurrent: boolean; onClick: () => void }) => (
    <motion.button whileHover={!isCurrent ? { scale: 1.02, y: -2 } : undefined} whileTap={!isCurrent ? { scale: 0.98 } : undefined} onClick={onClick} disabled={isCurrent}
      className={cn("p-4 rounded-xl border-2 text-left transition-all relative",
        isSelected ? "border-primary-400 bg-primary-50 shadow-md" : isCurrent ? "border-emerald-200 bg-emerald-50/50 opacity-70 cursor-not-allowed" : "border-slate-200 hover:border-primary-300 hover:bg-slate-50")}>
      {isCurrent && <div className="absolute -top-2 -right-2"><Badge variant="success" size="sm">当前身份</Badge></div>}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md", role.gradient)}>{role.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5"><span className="font-semibold text-slate-800">{role.name}</span></div>
          <Badge variant={role.badgeVariant} size="sm">{role.description}</Badge>
        </div>
        {role.todoCount > 0 && !isCurrent && <Badge variant="danger" size="sm">{role.todoCount}条待办</Badge>}
      </div>
      <div className="flex flex-wrap gap-1">
        {role.permissions.map((p, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{p}</span>)}
      </div>
    </motion.button>
  );

  return (
    <>
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="确认退出登录" size="sm" footer={
        <><Button variant="default" onClick={() => setShowLogoutModal(false)}>取消</Button><Button variant="danger" onClick={confirmLogout}>确认退出</Button></>
      }>
        <div className="flex items-start gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-6 h-6 text-rose-500" /></div>
          <div><h4 className="font-semibold text-slate-800 mb-1">您确定要退出登录吗？</h4><p className="text-sm text-slate-500">当前用户：{currentUser.name}（{getRoleLabel(currentUser.role)}）</p></div>
        </div>
      </Modal>

      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="切换身份" description="选择要切换的用户身份，切换后将承接对应待办事项" size="xl" footer={
        <>
          <Button variant="default" onClick={() => setShowRoleModal(false)}>取消</Button>
          <Button variant="primary" onClick={confirmSwitchRole} disabled={!selectedRole || selectedRole.id === currentUser.id}>
            <CheckSquare className="w-4 h-4 mr-1" />确认切换
          </Button>
        </>
      }>
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedRole && selectedRole.id !== currentUser.id && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-gradient-to-r from-slate-50 to-primary-50 rounded-xl border border-slate-200">
                <div className="text-xs text-primary-600 font-medium mb-3 flex items-center gap-1"><Info className="w-4 h-4" />即将切换身份</div>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center opacity-50">
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white mx-auto mb-2 bg-gradient-to-br", currentRole.gradient)}>{currentRole.icon}</div>
                    <div className="text-sm font-medium text-slate-600">{currentRole.name}</div>
                    <div className="text-xs text-slate-400">{currentRole.description}</div>
                  </div>
                  <div className="flex items-center gap-1"><ArrowRight className="w-5 h-5 text-primary-400" /><ArrowRight className="w-5 h-5 text-primary-500 -ml-2" /></div>
                  <div className="text-center">
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white mx-auto mb-2 bg-gradient-to-br shadow-lg ring-4 ring-primary-200", selectedRole.gradient)}>{selectedRole.icon}</div>
                    <div className="text-sm font-semibold text-slate-800">{selectedRole.name}</div>
                    <div className="text-xs text-primary-600">{selectedRole.description}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            {roleOptions.map((role) => <RoleCard key={role.id} role={role} isSelected={selectedRole?.id === role.id} isCurrent={currentUser.id === role.id} onClick={() => setSelectedRole(role)} />)}
          </div>

          <AnimatePresence>
            {selectedRole && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium"><CheckCircle className="w-4 h-4" />身份状态：已切换为 [{selectedRole.name} · {selectedRole.description}]</div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-slate-700 mb-1">权限范围</div>
                      <div className="flex flex-wrap gap-1.5">{rolePermissions[selectedRole.role]?.map((p, i) => <Badge key={i} variant="primary" size="sm">{p}</Badge>)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ClipboardList className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700 mb-1">待办承接（共{getRoleTodoCount(selectedRole.role)}条）</div>
                      <div className="space-y-1">{selectedRole.todoPreview.map((t, i) => <div key={i} className="text-xs text-slate-600 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />{t}</div>)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg"><ArrowRight className="w-4 h-4 text-primary-500" />切换后将刷新并跳转至对应工作台</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-6"><Breadcrumb /></div>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="搜索议案、工单、业主..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              {pendingTodos.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">{pendingTodos.length}</span>}
            </button>
            <AnimatePresence>{showNotifications && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-modal border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800">待办事项</h3><p className="text-sm text-slate-500">您有 {pendingTodos.length} 条待处理事项</p></div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingTodos.length === 0 ? <div className="p-8 text-center text-slate-500"><CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" /><p>暂无待办事项</p></div> :
                    pendingTodos.slice(0, 5).map((todo) => (
                      <div key={todo.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-2 h-2 rounded-full mt-2", todo.priority === "high" ? "bg-rose-500" : todo.priority === "medium" ? "bg-amber-500" : "bg-slate-400")} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">{todo.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{todo.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={todo.type === "approval" ? "warning" : todo.type === "vote" ? "primary" : todo.type === "ticket" ? "info" : "default"} size="sm">{todo.type}</Badge>
                              <span className="text-xs text-slate-400">{todo.createdAt}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-3 border-t border-slate-100"><Button variant="ghost" size="sm" className="w-full">查看全部</Button></div>
              </motion.div>
            )}</AnimatePresence>
          </div>
          <div className="relative">
            <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-trust-500 rounded-full flex items-center justify-center">
                {currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" /> : <User className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left hidden md:block"><p className="text-sm font-medium text-slate-800">{currentUser.name}</p><p className="text-xs text-slate-500">{getRoleLabel(currentUser.role)}</p></div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>
            <AnimatePresence>{showUserMenu && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-modal border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-trust-500 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
                    <div><p className="font-semibold text-slate-800">{currentUser.name}</p><p className="text-sm text-slate-500">{getRoleLabel(currentUser.role)}</p></div>
                  </div>
                </div>
                <div className="py-2">
                  <Link to="/profile" onClick={() => setShowUserMenu(false)} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><User className="w-4 h-4" />个人中心</Link>
                  <Link to="/settings" onClick={() => setShowUserMenu(false)} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Settings className="w-4 h-4" />系统设置</Link>
                </div>
                <div className="border-t border-slate-100 py-2">
                  <button onClick={() => { setShowUserMenu(false); setSelectedRole(null); setShowRoleModal(true); }} className="w-full px-4 py-2.5 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-3 transition-colors"><Users className="w-4 h-4" />切换角色</button>
                  <button onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }} className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"><LogOut className="w-4 h-4" />退出登录</button>
                </div>
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
}
