import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  AlertTriangle,
  RefreshCw,
  ArrowDownToLine,
} from "lucide-react";
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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

type ActionType = "approve" | "reject" | "offline" | "republish";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = adminOrders.find((o) => o.id === id);

  const [showModal, setShowModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [remark, setRemark] = useState("");

  if (!order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="min-h-[60vh] flex flex-col items-center justify-center"
      >
        <div className="bg-white rounded-2xl p-12 border border-rock-100 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rock-100 flex items-center justify-center">
            <AlertTriangle size={40} className="text-rock-400" />
          </div>
          <h2 className="font-serif text-xl font-bold text-rock-900 mb-2">订单不存在</h2>
          <p className="text-rock-500 mb-6 text-sm">
            您访问的订单可能已被删除，或订单编号有误。
          </p>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-jade-500 text-white rounded-lg hover:bg-jade-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> 返回订单列表
          </Link>
        </div>
      </motion.div>
    );
  }

  const openModal = (action: ActionType) => {
    setCurrentAction(action);
    setRemark("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentAction(null);
    setRemark("");
  };

  const handleConfirm = () => {
    closeModal();
  };

  const actionLabels: Record<ActionType, { label: string; desc: string }> = {
    approve: { label: "审核通过", desc: "确认通过该订单并发布内容" },
    reject: { label: "审核驳回", desc: "驳回该订单，内容不会被发布" },
    offline: { label: "下架内容", desc: "将已发布的内容从平台下架" },
    republish: { label: "重新发布", desc: "将已下架或已拒绝的内容重新发布" },
  };

  const canApprove = order.status === "待审核" || order.status === "处理中";
  const canReject = order.status === "待审核" || order.status === "处理中";
  const canOffline = order.status === "已发布";
  const canRepublish = order.status === "已下架" || order.status === "已拒绝";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-rock-500 hover:text-rock-700 mb-6"
      >
        <ArrowLeft size={16} /> 返回订单列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-rock-500 text-sm">{order.orderNo}</span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${sourceColors[order.source]}`}
                  >
                    {order.source}
                  </span>
                </div>
                <h1 className="font-serif text-2xl font-bold text-rock-900">{order.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-rock-400">订单金额</p>
                <p className="text-2xl font-bold font-number text-jade-600">
                  ¥{order.amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-rock-50 text-sm">
              <div>
                <p className="text-rock-400 text-xs mb-1">信息类型</p>
                <p className="text-rock-700 font-medium">{order.type}</p>
              </div>
              <div>
                <p className="text-rock-400 text-xs mb-1">创建时间</p>
                <p className="text-rock-700 font-number">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-rock-400 text-xs mb-1">发布时间</p>
                <p className="text-rock-700 font-number">
                  {order.publishedAt ? formatDateTime(order.publishedAt) : "—"}
                </p>
              </div>
              <div>
                <p className="text-rock-400 text-xs mb-1">所在乡镇</p>
                <p className="text-rock-700">{order.location.township}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <h2 className="font-serif text-lg font-semibold text-rock-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-jade-500" /> 发布内容
            </h2>

            {order.images && order.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {order.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden aspect-video bg-rock-100"
                  >
                    <img
                      src={img}
                      alt={`${order.title}-${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-rock-50 rounded-lg">
              <p className="text-rock-700 leading-relaxed whitespace-pre-wrap">
                {order.content}
              </p>
            </div>

            {order.type === "招聘" && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-600 text-xs mb-1">招聘类型</p>
                  <p className="text-rock-700 font-medium">{order.type}</p>
                </div>
                <div className="p-3 bg-jade-50 rounded-lg">
                  <p className="text-jade-600 text-xs mb-1">所在乡镇</p>
                  <p className="text-rock-700 font-medium">{order.location.township}</p>
                </div>
              </div>
            )}
            {(order.type === "租房" || order.type === "售房") && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-amber-600 text-xs mb-1">房产类型</p>
                  <p className="text-rock-700 font-medium">{order.type}</p>
                </div>
                <div className="p-3 bg-jade-50 rounded-lg">
                  <p className="text-jade-600 text-xs mb-1">所在乡镇</p>
                  <p className="text-rock-700 font-medium">{order.location.township}</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <h2 className="font-serif text-lg font-semibold text-rock-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-jade-500" /> 地理位置
            </h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-jade-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-rock-900">{order.location.township}</p>
                  <p className="text-rock-500 text-sm">{order.location.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-rock-400">
                <span className="font-number">
                  经度: {order.location.lng.toFixed(4)}
                </span>
                <span className="font-number">
                  纬度: {order.location.lat.toFixed(4)}
                </span>
              </div>
              <div className="mt-4 h-40 rounded-lg bg-gradient-to-br from-jade-100 via-jade-50 to-amber-50 border border-jade-200/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 pattern-bg" />
                <div className="relative text-center">
                  <MapPin size={28} className="mx-auto text-jade-500 mb-1" />
                  <p className="text-jade-700 text-sm font-medium">位置地图</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <h2 className="font-serif text-lg font-semibold text-rock-900 mb-5 flex items-center gap-2">
              <Clock size={18} className="text-jade-500" /> 状态流转
            </h2>

            <div className="relative">
              {order.auditRecords.map((record, idx) => {
                const isLast = idx === order.auditRecords.length - 1;
                const dotColor = isLast
                  ? "bg-purple-500 ring-4 ring-purple-100"
                  : "bg-jade-500";
                const lineColor = isLast ? "bg-rock-200" : "bg-jade-200";
                const textColor = isLast
                  ? "text-purple-600"
                  : "text-rock-900";

                return (
                  <div key={record.id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${dotColor} mt-1.5`} />
                      {!isLast && (
                        <div className={`w-0.5 flex-1 mt-1 ${lineColor}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className={`font-medium ${textColor}`}>
                          {record.status}
                        </p>
                        <p className="text-xs text-rock-400 font-number">
                          {formatDateTime(record.time)}
                        </p>
                      </div>
                      <p className="text-sm text-rock-500 mt-1">
                        操作人：{record.operator}
                      </p>
                      {record.remark && (
                        <p className="text-sm text-rock-600 mt-2 p-3 bg-rock-50 rounded-lg">
                          {record.remark}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <h2 className="font-serif text-lg font-semibold text-rock-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-jade-500" /> 联系人
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-jade-50 flex items-center justify-center">
                  <User size={18} className="text-jade-500" />
                </div>
                <div>
                  <p className="text-xs text-rock-400">联系人姓名</p>
                  <p className="font-medium text-rock-900">{order.contactName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Phone size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-rock-400">联系电话</p>
                  <a
                    href={`tel:${order.contactPhone}`}
                    className="font-medium text-jade-600 hover:text-jade-700 font-number"
                  >
                    {order.contactPhone}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <h2 className="font-serif text-lg font-semibold text-rock-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-jade-500" /> 发布者信息
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                {order.publisher.avatar ? (
                  <img
                    src={order.publisher.avatar}
                    alt={order.publisher.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  order.publisher.name.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-rock-900">{order.publisher.name}</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.publisher.type === "merchant"
                        ? "bg-jade-50 text-jade-700 border border-jade-200"
                        : "bg-rock-100 text-rock-600 border border-rock-200"
                    }`}
                  >
                    {order.publisher.type === "merchant" ? "认证商户" : "普通用户"}
                  </span>
                </div>
                <p className="text-sm text-rock-400 mt-1">ID: {order.publisher.id}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-rock-100"
          >
            <h2 className="font-serif text-lg font-semibold text-rock-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-jade-500" /> 操作面板
            </h2>
            <div className="space-y-2">
              {canApprove && (
                <button
                  onClick={() => openModal("approve")}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-jade-500 text-white rounded-lg hover:bg-jade-600 transition-colors text-sm font-medium"
                >
                  <CheckCircle size={16} /> 通过审核
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => openModal("reject")}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ember-500 text-white rounded-lg hover:bg-ember-600 transition-colors text-sm font-medium"
                >
                  <XCircle size={16} /> 驳回申请
                </button>
              )}
              {canOffline && (
                <button
                  onClick={() => openModal("offline")}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rock-700 text-white rounded-lg hover:bg-rock-800 transition-colors text-sm font-medium"
                >
                  <ArrowDownToLine size={16} /> 下架内容
                </button>
              )}
              {canRepublish && (
                <button
                  onClick={() => openModal("republish")}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <RefreshCw size={16} /> 重新发布
                </button>
              )}
              {!canApprove && !canReject && !canOffline && !canRepublish && (
                <div className="text-center py-6 text-rock-400 text-sm">
                  当前状态暂无可执行操作
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && currentAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rock-900/50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-rock-900">
                    {actionLabels[currentAction].label}
                  </h3>
                  <p className="text-sm text-rock-500 mt-1">
                    {actionLabels[currentAction].desc}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-rock-400 hover:text-rock-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm text-rock-600 mb-1.5">操作备注</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={4}
                  placeholder="请输入操作备注（选填）..."
                  className="w-full px-3 py-2.5 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-rock-200 text-rock-700 rounded-lg hover:bg-rock-50 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors text-sm font-medium ${
                    currentAction === "approve"
                      ? "bg-jade-500 hover:bg-jade-600"
                      : currentAction === "reject"
                      ? "bg-ember-500 hover:bg-ember-600"
                      : currentAction === "offline"
                      ? "bg-rock-700 hover:bg-rock-800"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  确认操作
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
