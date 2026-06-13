import { useState } from "react";
import { Printer, Check, X, Clock, Search, Download } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function PrintCenter() {
  const { templates, printJobs } = useAppStore();
  const [search, setSearch] = useState("");

  const statusMap = {
    queued: { label: "排队中", color: "bg-ink-50 text-ink-600", icon: Clock },
    printing: { label: "打印中", color: "bg-ember-50 text-ember-600", icon: Printer },
    success: { label: "成功", color: "bg-mint-50 text-mint-600", icon: Check },
    failed: { label: "失败", color: "bg-alert-50 text-alert-600", icon: X },
  };

  const printerTypeMap = {
    pc_browser: "PC浏览器",
    mobile_bluetooth: "移动蓝牙",
    mobile_wifi: "移动WiFi",
  };

  const filtered = printJobs.filter((j) =>
    j.templateName.includes(search) || j.id.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">云打印中心</h1>
          <p className="muted mt-1">管理面单模板和打印任务</p>
        </div>
        <button className="btn-primary">
          <Printer size={16} />
          新建打印任务
        </button>
      </div>

      <div>
        <h2 className="section-title mb-3">面单模板</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="app-card p-4 app-card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ember-100 to-ember-200 flex items-center justify-center">
                  <Printer size={18} className="text-ember-600" />
                </div>
                {t.isDefault && (
                  <span className="chip bg-mint-50 text-mint-600">默认</span>
                )}
              </div>
              <h3 className="font-medium text-ink-800">{t.name}</h3>
              <p className="text-xs text-ink-400 mt-1">纸张：{t.paperSize}</p>
              <p className="text-xs text-ink-400">
                类型：{t.templateType === "standard" ? "标准" : "自定义"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="app-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">打印任务</h2>
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索任务..."
              className="input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-400 border-b border-ink-100">
                <th className="text-left font-medium py-3 px-3">任务ID</th>
                <th className="text-left font-medium py-3 px-3">模板</th>
                <th className="text-left font-medium py-3 px-3">打印机</th>
                <th className="text-left font-medium py-3 px-3">数量</th>
                <th className="text-left font-medium py-3 px-3">状态</th>
                <th className="text-left font-medium py-3 px-3">创建时间</th>
                <th className="text-left font-medium py-3 px-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => {
                const st = statusMap[j.status];
                const Icon = st.icon;
                return (
                  <tr key={j.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                    <td className="py-3 px-3 font-mono text-xs text-ink-500">{j.id}</td>
                    <td className="py-3 px-3 text-ink-700">{j.templateName}</td>
                    <td className="py-3 px-3 text-ink-500">{printerTypeMap[j.printerType]}</td>
                    <td className="py-3 px-3">
                      <span className="text-ink-700">{j.totalCount}</span>
                      <span className="text-ink-300 mx-1">/</span>
                      <span className="text-mint-600">成功{j.successCount}</span>
                      {j.failedCount > 0 && (
                        <>
                          <span className="text-ink-300 mx-1">/</span>
                          <span className="text-alert-600">失败{j.failedCount}</span>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn("chip", st.color)}>
                        <Icon size={12} />
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-ink-500">{format(new Date(j.createdAt), "MM-dd HH:mm")}</td>
                    <td className="py-3 px-3">
                      <button className="btn-ghost px-2 py-1 text-xs">
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
