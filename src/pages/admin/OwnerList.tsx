import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import { Search, Upload, Eye, CheckCircle, XCircle, UserCheck, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, DataTable, type Column } from "@/components/ui";
import { useAppStore } from "@/stores";
import { cn, formatDate } from "@/utils";
import type { Owner } from "@/types";

const statusMap = {
  all: { label: "全部", variant: "default" as const },
  verified: { label: "已认证", variant: "success" as const },
  pending: { label: "待审核", variant: "warning" as const },
  rejected: { label: "已拒绝", variant: "danger" as const },
};

export default function OwnerList() {
  const owners = useAppStore((s) => s.owners);
  const [statusFilter, setStatusFilter] = useState<keyof typeof statusMap>("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<Owner | null>(null);
  const [modalType, setModalType] = useState<"detail" | "verify" | null>(null);
  const [page, setPage] = useState(1);

  const buildings = useMemo(
    () => ["all", ...Array.from(new Set(owners.map((o) => o.building)))],
    [owners]
  );

  const filteredData = useMemo(
    () =>
      owners.filter(
        (o) =>
          (statusFilter === "all" || o.verifyStatus === statusFilter) &&
          (buildingFilter === "all" || o.building === buildingFilter) &&
          (!searchText || o.name.includes(searchText))
      ),
    [owners, statusFilter, buildingFilter, searchText]
  );

  const columns: Column<Owner>[] = [
    { key: "avatar", title: "头像", dataIndex: "avatar", width: 60, align: "center",
      render: (_, r) => <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full" /> },
    { key: "name", title: "姓名", dataIndex: "name", width: 100 },
    { key: "address", title: "楼栋单元房号", dataIndex: "building",
      render: (_, r) => `${r.building}${r.unit}${r.room}` },
    { key: "phone", title: "手机号", dataIndex: "phone", width: 120 },
    { key: "verifyStatus", title: "认证状态", dataIndex: "verifyStatus", width: 100,
      render: (v) => { const s = statusMap[v as keyof typeof statusMap]; return <Badge variant={s.variant}>{s.label}</Badge>; } },
    { key: "propertyCertVerified", title: "房产证", dataIndex: "propertyCertVerified", width: 80, align: "center",
      render: (v) => v ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-rose-500 mx-auto" /> },
    { key: "faceVerified", title: "人脸", dataIndex: "faceVerified", width: 80, align: "center",
      render: (v) => v ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-rose-500 mx-auto" /> },
    { key: "joinDate", title: "绑定时间", dataIndex: "joinDate", width: 120, render: (v) => formatDate(v as string) },
    { key: "actions", title: "操作", dataIndex: "id", width: 160, align: "center",
      render: (_, r) => (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => { setSelected(r); setModalType("detail"); }}>详情</Button>
          {r.verifyStatus === "pending" && (
            <Button variant="primary" size="sm" leftIcon={<UserCheck className="w-4 h-4" />}
              onClick={() => { setSelected(r); setModalType("verify"); }}>审核</Button>
          )}
        </div>
      ) },
  ];

  const handleVerify = (status: "verified" | "rejected") => {
    if (selected) {
      console.log(`审核业主 ${selected.name}: ${status}`);
      setModalType(null);
      setSelected(null);
    }
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>业主管理</CardTitle>
            <Button leftIcon={<Upload className="w-4 h-4" />}>批量导入</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">认证状态：</span>
              <div className="flex gap-1">
                {(Object.keys(statusMap) as Array<keyof typeof statusMap>).map((key) => (
                  <Button key={key} variant={statusFilter === key ? "primary" : "ghost"} size="sm"
                    onClick={() => setStatusFilter(key)}>{statusMap[key].label}</Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}
                className={cn("px-3 py-1.5 border border-slate-200 rounded-lg", "text-sm focus:outline-none focus:ring-2 focus:ring-primary-500")}>
                {buildings.map((b) => <option key={b} value={b}>{b === "all" ? "全部楼栋" : b}</option>)}
              </select>
            </div>
            <div className="relative flex-1 min-w-64 max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="搜索姓名..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
                className={cn("w-full pl-10 pr-4 py-2 bg-white border border-slate-200", "rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500")} />
            </div>
          </div>
          <DataTable<Owner> columns={columns} data={filteredData} rowKey="id"
            pagination={{ current: page, pageSize: 10, total: filteredData.length, onChange: (p) => setPage(p) }} />
        </CardContent>
      </Card>

      <Modal isOpen={modalType !== null} onClose={() => setModalType(null)}
        title={modalType === "detail" ? "业主详情" : "认证审核"}
        size={modalType === "detail" ? "md" : "lg"}
        footer={modalType === "verify" ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>取消</Button>
            <Button variant="danger" onClick={() => handleVerify("rejected")}>拒绝</Button>
            <Button variant="primary" onClick={() => handleVerify("verified")}>通过</Button>
          </div>
        ) : undefined}>
        {selected && (modalType === "detail" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={selected.avatar} alt={selected.name} className="w-14 h-14 rounded-full" />
              <div>
                <h3 className="font-semibold">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.phone}</p>
                <Badge variant={statusMap[selected.verifyStatus].variant} size="sm" className="mt-1">
                  {statusMap[selected.verifyStatus].label}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-sm">
              <div><p className="text-slate-500">身份证</p><p className="font-medium">{selected.idCardEncrypted}</p></div>
              <div><p className="text-slate-500">住址</p><p className="font-medium">{selected.building}{selected.unit}{selected.room}</p></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-slate-500 mb-2">房产证照片</p>
                <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop" alt="房产证"
                  className="w-full aspect-video object-cover rounded-lg" />
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">人脸照片对比</p>
                <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg justify-center">
                  <img src={selected.avatar} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <UserCheck className="w-5 h-5 text-primary-600" />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=idcard" alt=""
                    className="w-14 h-14 rounded-lg object-cover" />
                </div>
              </div>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg text-sm">
              <p className="font-medium text-primary-800">{selected.name} · {selected.building}{selected.unit}{selected.room}</p>
            </div>
          </div>
        ))}
      </Modal>
    </m.div>
  );
}
