import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Eye, Inbox, RotateCcw } from "lucide-react";
import { adminOrders } from "@/data";
import type { AdminOrder } from "@/types";

const sourceColors: Record<AdminOrder["source"], string> = {
  "用户发布": "bg-jade-50 text-jade-700 border border-jade-200",
  "商户发布": "bg-blue-50 text-blue-700 border border-blue-200",
  "平台推送": "bg-purple-50 text-purple-700 border border-purple-200",
  "第三方合作": "bg-amber-50 text-amber-700 border border-amber-200",
};

const statusColors: Record<AdminOrder["status"], string> = {
  "待审核": "bg-amber-50 text-amber-700 border border-amber-200",
  "已发布": "bg-jade-50 text-jade-700 border border-jade-200",
  "已下架": "bg-rock-100 text-rock-600 border border-rock-200",
  "已拒绝": "bg-ember-50 text-ember-700 border border-ember-200",
  "处理中": "bg-purple-50 text-purple-700 border border-purple-200",
};

const statusOptions = ["全部", "待审核", "已发布", "已下架", "已拒绝", "处理中"] as const;
const typeOptions = ["全部类型", "招聘", "租房", "售房", "美食推荐", "交友", "资讯投稿"] as const;
const sourceOptions = ["全部来源", "用户发布", "商户发布", "平台推送", "第三方合作"] as const;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function isToday(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export default function AdminOrders() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("全部");
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>("全部类型");
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceOptions)[number]>("全部来源");

  const stats = useMemo(() => {
    return {
      today: adminOrders.filter((o) => isToday(o.createdAt)).length,
      pending: adminOrders.filter((o) => o.status === "待审核").length,
      published: adminOrders.filter((o) => o.status === "已发布").length,
      offline: adminOrders.filter((o) => o.status === "已下架").length,
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return adminOrders.filter((order) => {
      if (searchText) {
        const keyword = searchText.toLowerCase();
        const matchNo = order.orderNo.toLowerCase().includes(keyword);
        const matchTitle = order.title.toLowerCase().includes(keyword);
        const matchName = order.contactName.toLowerCase().includes(keyword);
        const matchPhone = order.contactPhone.toLowerCase().includes(keyword);
        if (!matchNo && !matchTitle && !matchName && !matchPhone) return false;
      }
      if (statusFilter !== "全部" && order.status !== statusFilter) return false;
      if (typeFilter !== "全部类型" && order.type !== typeFilter) return false;
      if (sourceFilter !== "全部来源" && order.source !== sourceFilter) return false;
      return true;
    });
  }, [searchText, statusFilter, typeFilter, sourceFilter]);

  const handleReset = () => {
    setSearchText("");
    setStatusFilter("全部");
    setTypeFilter("全部类型");
    setSourceFilter("全部来源");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="font-serif text-2xl font-bold text-rock-900 mb-6">订单管理</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "今日订单", value: stats.today, color: "text-jade-500" },
          { label: "待审核", value: stats.pending, color: "text-amber-500" },
          { label: "已发布", value: stats.published, color: "text-jade-600" },
          { label: "已下架", value: stats.offline, color: "text-rock-500" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-5 border border-rock-100 card-hover"
          >
            <p className="text-sm text-rock-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 font-number ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-rock-100">
        <div className="p-4 border-b border-rock-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索订单号、标题、联系人、电话..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            {sourceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 hover:bg-rock-50 hover:text-rock-900 transition-colors"
          >
            <RotateCcw size={14} />
            重置
          </button>
        </div>

        <div className="overflow-x-auto">
          {filteredOrders.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-rock-50 text-rock-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">订单号</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">订单来源</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">信息类型</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">内容标题</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">联系人</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">所在乡镇</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">金额</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">状态</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">创建时间</th>
                  <th className="text-right px-4 py-3 font-medium whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="border-t border-rock-50 hover:bg-rock-50/50"
                  >
                    <td className="px-4 py-3 font-mono text-rock-700 whitespace-nowrap">
                      {order.orderNo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs ${sourceColors[order.source]}`}
                      >
                        {order.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-rock-600 whitespace-nowrap">{order.type}</td>
                    <td className="px-4 py-3 text-rock-700 max-w-[200px] truncate">{order.title}</td>
                    <td className="px-4 py-3 text-rock-700 whitespace-nowrap">
                      <div>
                        <p className="font-medium">{order.contactName}</p>
                        <p className="text-rock-500 text-xs">{order.contactPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-rock-600 whitespace-nowrap">
                      {order.location.township}
                    </td>
                    <td className="px-4 py-3 font-number font-medium text-rock-900 whitespace-nowrap">
                      ¥{order.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs ${statusColors[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-rock-500 whitespace-nowrap font-number">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-jade-600 hover:text-jade-700 text-sm"
                      >
                        <Eye size={14} /> 查看
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-rock-400">
              <Inbox size={48} className="mb-3" />
              <p className="text-sm">暂无数据</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
