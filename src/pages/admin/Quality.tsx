import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye } from "lucide-react";
import { mockQualityOrders } from "@/data/mockData";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-neutral-100 text-neutral-600" },
  "ai-screening": { label: "AI初检", className: "bg-blue-100 text-blue-700" },
  "manual-inspection": { label: "人工质检", className: "bg-amber-100 text-amber-700" },
  completed: { label: "已完成", className: "bg-eco-100 text-eco-700" },
};

export default function Quality() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索订单号..."
              className="input-base pl-10"
            />
          </div>
          <button className="btn-secondary !py-2.5 !px-4">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">质检单号</th>
              <th className="table-th">关联订单</th>
              <th className="table-th">状态</th>
              <th className="table-th">AI置信度</th>
              <th className="table-th">质检员</th>
              <th className="table-th">创建时间</th>
              <th className="table-th">操作</th>
            </tr>
          </thead>
          <tbody>
            {mockQualityOrders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <td className="table-td font-mono text-sm">{order.id}</td>
                <td className="table-td font-mono text-sm">{order.orderId}</td>
                <td className="table-td">
                  <span className={cn("badge", statusMap[order.status].className)}>
                    {statusMap[order.status].label}
                  </span>
                </td>
                <td className="table-td">
                  {order.aiResult ? `${(order.aiResult.confidence * 100).toFixed(1)}%` : "-"}
                </td>
                <td className="table-td">{order.assignee || "-"}</td>
                <td className="table-td text-neutral-500">{order.createdAt}</td>
                <td className="table-td">
                  <button
                    onClick={() => navigate(`/admin/quality/${order.id}`)}
                    className="text-eco-600 hover:text-eco-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
