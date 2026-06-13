import { useState } from "react";
import {
  Settings,
  Shield,
  FileSearch,
  Lock,
  User,
  Calendar,
  Download,
  Filter,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  MapPin,
  Search,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { UserRole, PermissionConfig } from "@/types";

type SubTab = "permissions" | "audit" | "compliance";

const subNavItems = [
  { id: "permissions" as SubTab, label: "角色权限管理", icon: Shield },
  { id: "audit" as SubTab, label: "操作日志审计", icon: FileSearch },
  { id: "compliance" as SubTab, label: "数据合规设置", icon: Lock },
];

const roleGradients: Record<string, string> = {
  courier: "from-mint-400 to-mint-600",
  branch_admin: "from-ember-400 to-ember-600",
  regional_supervisor: "from-ink-500 to-ink-700",
};

const roleIcons: Record<string, any> = {
  courier: UserCheck,
  branch_admin: Building2,
  regional_supervisor: MapPin,
};

const permissionLabels: Record<string, string> = {
  "order.read": "查看订单",
  "order.create": "创建订单",
  "order.update": "修改订单",
  "order.pickup": "揽收操作",
  "order.delete": "删除订单",
  "print.read": "查看打印",
  "print.create": "执行打印",
  "print.template": "模板管理",
  "customer.read": "查看客户",
  "customer.bind": "绑定客户",
  "customer.update": "修改客户",
  "customer.protocol": "协议管理",
  "tracking.read": "轨迹查询",
  "analytics.read": "经营分析",
  "finance.read": "查看财务",
  "finance.update": "财务操作",
  "settings.read": "查看设置",
  "settings.update": "修改设置",
  "audit.read": "查看日志",
  "audit.export": "导出日志",
  "compliance.update": "合规配置",
};

const roleLabelMap: Record<UserRole, string> = {
  courier: "快递员",
  branch_admin: "网点管理员",
  regional_supervisor: "区域主管",
};

export default function SettingsPage() {
  const { permissions, auditLog, compliance, updateCompliance } = useAppStore();
  const [activeTab, setActiveTab] = useState<SubTab>("permissions");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-ember-500" />
          <h1 className="text-2xl font-bold text-ink-800">系统设置</h1>
        </div>
        <p className="muted mt-1">管理角色权限、审计日志与数据合规策略</p>
      </div>

      <div className="flex gap-6">
        <aside className="w-56 flex-shrink-0">
          <nav className="app-card p-2 space-y-1">
            {subNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                    activeTab === item.id
                      ? "bg-gradient-to-r from-ember-500/15 to-ember-500/5 text-ember-600 font-medium border-l-2 border-ember-500"
                      : "text-ink-500 hover:bg-ink-50 hover:text-ink-700"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === "permissions" && (
            <PermissionsPanel permissions={permissions} />
          )}
          {activeTab === "audit" && <AuditPanel auditLog={auditLog} />}
          {activeTab === "compliance" && (
            <CompliancePanel
              compliance={compliance}
              updateCompliance={updateCompliance}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionsPanel({ permissions }: { permissions: PermissionConfig[] }) {
  const [localPerms, setLocalPerms] = useState(permissions);

  const togglePermission = (role: string, permKey: string) => {
    setLocalPerms((prev) =>
      prev.map((p) =>
        p.role === role
          ? {
              ...p,
              permissions: {
                ...p.permissions,
                [permKey]: !p.permissions[permKey],
              },
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            <Shield size={18} className="text-ember-500" />
            角色权限管理
          </h2>
          <p className="muted mt-1">为不同角色配置功能访问权限</p>
        </div>
        <button className="btn-primary">保存配置</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {localPerms.map((roleConfig) => {
          const RoleIcon = roleIcons[roleConfig.role] || User;
          return (
            <div key={roleConfig.role} className="app-card overflow-hidden">
              <div
                className={cn(
                  "p-5 bg-gradient-to-br text-white",
                  roleGradients[roleConfig.role]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <RoleIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{roleConfig.roleName}</h3>
                    <p className="text-sm opacity-80 mt-0.5">{roleConfig.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="chip bg-white/20 text-white">
                    {Object.values(roleConfig.permissions).filter(Boolean).length} 项权限
                  </span>
                  <span className="chip bg-white/10 text-white/80">
                    {Object.keys(roleConfig.permissions).length} 项可配置
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-3">
                  权限配置
                </p>
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {Object.entries(roleConfig.permissions).map(([key, enabled]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-ink-50 transition-colors cursor-pointer group"
                    >
                      <span className="text-sm text-ink-600 group-hover:text-ink-800">
                        {permissionLabels[key] || key}
                      </span>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => togglePermission(roleConfig.role, key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-ink-200 rounded-full peer peer-checked:bg-ember-500 transition-colors relative cursor-pointer">
                          <div
                            className={cn(
                              "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                              enabled && "translate-x-4"
                            )}
                          />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditPanel({ auditLog }: { auditLog: any[] }) {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    role: "all",
    module: "all",
    operation: "",
  });

  const modules = Array.from(new Set(auditLog.map((l) => l.module)));
  const roles: UserRole[] = ["courier", "branch_admin", "regional_supervisor"];

  const filtered = auditLog.filter((log) => {
    if (filters.role !== "all" && log.role !== filters.role) return false;
    if (filters.module !== "all" && log.module !== filters.module) return false;
    if (filters.operation && !log.operation.includes(filters.operation)) return false;
    if (filters.dateFrom && new Date(log.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(log.createdAt) > new Date(filters.dateTo + "T23:59:59"))
      return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            <FileSearch size={18} className="text-ember-500" />
            操作日志审计
          </h2>
          <p className="muted mt-1">追踪系统操作记录，满足合规审计要求</p>
        </div>
        <button className="btn-outline">
          <Download size={16} />
          导出日志
        </button>
      </div>

      <div className="app-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-ink-400" />
          <span className="text-sm font-medium text-ink-700">高级筛选</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-ink-500 mb-1">开始日期</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className={cn("input pl-8 text-sm")}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">结束日期</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className={cn("input pl-8 text-sm")}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">角色</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input text-sm"
            >
              <option value="all">全部角色</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabelMap[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">模块</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="input text-sm"
            >
              <option value="all">全部模块</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">操作类型</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={filters.operation}
                onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
                placeholder="搜索操作..."
                className={cn("input pl-8 text-sm")}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() =>
              setFilters({ dateFrom: "", dateTo: "", role: "all", module: "all", operation: "" })
            }
            className="btn-ghost text-sm"
          >
            重置筛选
          </button>
          <span className="text-sm text-ink-400 self-center mr-auto">
            共 {filtered.length} 条记录
          </span>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50">
              <tr className="text-ink-500">
                <th className="text-left font-medium py-3 px-4">日期</th>
                <th className="text-left font-medium py-3 px-4">用户</th>
                <th className="text-left font-medium py-3 px-4">角色</th>
                <th className="text-left font-medium py-3 px-4">模块</th>
                <th className="text-left font-medium py-3 px-4">操作</th>
                <th className="text-left font-medium py-3 px-4">IP 地址</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-ink-700">
                      {format(new Date(log.createdAt), "yyyy-MM-dd")}
                    </div>
                    <div className="text-xs text-ink-400">
                      {format(new Date(log.createdAt), "HH:mm:ss")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white text-xs font-medium">
                        {log.realName?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-ink-700 font-medium">{log.realName}</div>
                        <div className="text-xs text-ink-400">@{log.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="chip bg-ink-50 text-ink-600">
                      {roleLabelMap[log.role]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="chip bg-ember-50 text-ember-600">{log.module}</span>
                  </td>
                  <td className="py-3 px-4 text-ink-700">{log.operation}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs font-mono bg-ink-50 px-2 py-1 rounded text-ink-500">
                      {log.ip}
                    </code>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-400">
                    暂无符合条件的日志记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompliancePanel({
  compliance,
  updateCompliance,
}: {
  compliance: any;
  updateCompliance: (c: any) => void;
}) {
  const retentionOptions = [
    { value: 6, label: "6 个月" },
    { value: 12, label: "12 个月" },
    { value: 24, label: "24 个月" },
    { value: 36, label: "36 个月" },
    { value: 60, label: "60 个月" },
    { value: 120, label: "120 个月" },
  ];

  const handleMaskingFieldChange = (field: "phone" | "address" | "name") => {
    updateCompliance({
      maskingFields: {
        ...compliance.maskingFields,
        [field]: !compliance.maskingFields[field],
      },
    });
  };

  const Switch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-ink-800">{label}</p>
        {description && <p className="text-xs text-ink-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
          checked ? "bg-ember-500" : "bg-ink-200"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );

  const fieldConfigs = [
    { key: "name" as const, label: "姓名", icon: User, example: "王**" },
    { key: "phone" as const, label: "手机号", icon: User, example: "138****6821" },
    { key: "address" as const, label: "地址", icon: MapPin, example: "上海市浦东******" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            <Lock size={18} className="text-ember-500" />
            数据合规设置
          </h2>
          <p className="muted mt-1">配置数据保留策略与敏感信息脱敏规则</p>
        </div>
        <button className="btn-primary">
          <Download size={16} />
          导出合规报告
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="app-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-ember-50 flex items-center justify-center">
              <Calendar size={16} className="text-ember-600" />
            </div>
            <h3 className="font-semibold text-ink-800">数据保留策略</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              数据保留期
            </label>
            <select
              value={compliance.dataRetentionMonths}
              onChange={(e) =>
                updateCompliance({ dataRetentionMonths: parseInt(e.target.value) })
              }
              className="input"
            >
              {retentionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-400 mt-2">
              超过保留期的数据将被自动归档或清理，以符合数据保护法规要求
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-ink-100">
            <Switch
              checked={compliance.enableAuditTrail}
              onChange={() =>
                updateCompliance({ enableAuditTrail: !compliance.enableAuditTrail })
              }
              label="启用审计追踪"
              description="记录所有数据访问与修改操作，用于合规审计"
            />
          </div>
        </div>

        <div className="app-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center">
              {compliance.enablePiiMasking ? (
                <EyeOff size={16} className="text-mint-600" />
              ) : (
                <Eye size={16} className="text-ink-500" />
              )}
            </div>
            <h3 className="font-semibold text-ink-800">敏感信息脱敏</h3>
          </div>

          <Switch
            checked={compliance.enablePiiMasking}
            onChange={() =>
              updateCompliance({ enablePiiMasking: !compliance.enablePiiMasking })
            }
            label="启用敏感信息脱敏"
            description="在界面展示和数据导出时对个人敏感信息进行脱敏处理"
          />

          {compliance.enablePiiMasking && (
            <div className="mt-4 pt-4 border-t border-ink-100 space-y-1">
              <p className="text-sm font-medium text-ink-700 mb-3">脱敏字段配置</p>
              {fieldConfigs.map((field) => {
                const Icon = field.icon;
                const isEnabled = compliance.maskingFields[field.key];
                return (
                  <div
                    key={field.key}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all",
                      isEnabled
                        ? "border-mint-200 bg-mint-50/50"
                        : "border-ink-100 hover:bg-ink-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center",
                          isEnabled ? "bg-mint-100 text-mint-600" : "bg-ink-100 text-ink-400"
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isEnabled ? "text-ink-800" : "text-ink-500"
                          )}
                        >
                          {field.label}
                        </p>
                        <p className="text-xs text-ink-400 font-mono">{field.example}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMaskingFieldChange(field.key)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                        isEnabled ? "bg-mint-500" : "bg-ink-200"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                          isEnabled && "translate-x-5"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="app-card p-5 border-ember-100 bg-gradient-to-br from-ember-50/30 to-transparent">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-ember-100 flex items-center justify-center flex-shrink-0">
            <Lock size={20} className="text-ember-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-ink-800">合规状态概览</h4>
            <p className="text-sm text-ink-500 mt-1">
              当前配置符合数据安全与个人信息保护的基本要求
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white rounded-xl p-3 border border-ink-100">
                <p className="text-xs text-ink-400">数据保留</p>
                <p className="text-lg font-semibold text-ink-800 mt-0.5">
                  {compliance.dataRetentionMonths}月
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-ink-100">
                <p className="text-xs text-ink-400">脱敏状态</p>
                <p className="text-lg font-semibold mt-0.5">
                  {compliance.enablePiiMasking ? (
                    <span className="text-mint-600">已启用</span>
                  ) : (
                    <span className="text-alert-600">未启用</span>
                  )}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-ink-100">
                <p className="text-xs text-ink-400">脱敏字段</p>
                <p className="text-lg font-semibold text-ink-800 mt-0.5">
                  {Object.values(compliance.maskingFields).filter(Boolean).length}/3
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-ink-100">
                <p className="text-xs text-ink-400">审计追踪</p>
                <p className="text-lg font-semibold mt-0.5">
                  {compliance.enableAuditTrail ? (
                    <span className="text-mint-600">已开启</span>
                  ) : (
                    <span className="text-alert-600">未开启</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
