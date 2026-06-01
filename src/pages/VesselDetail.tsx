import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { format } from "date-fns"
import { ArrowLeft, Pencil, Shield, MapPin, FileCheck, RefreshCw } from "lucide-react"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import DataTable, { type Column } from "@/components/DataTable"
import { getVessel, getVesselCertificates } from "@/api"
import type { Vessel, Certificate } from "@/types"
import { useAppStore } from "@/store/app"

export default function VesselDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRoleConfig } = useAppStore()
  const roleConfig = getRoleConfig()
  const [vessel, setVessel] = useState<Vessel | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [vesselRes, certsRes] = await Promise.all([
        getVessel(Number(id)),
        getVesselCertificates(Number(id)),
      ])
      if (vesselRes.success && vesselRes.data) setVessel(vesselRes.data)
      if (certsRes.success && certsRes.data) setCertificates(certsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
  if (!vessel) return <div className="text-center py-20 text-slate-500">未找到渔船信息</div>

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "info" | "warning"; label: string }> = {
      在港: { variant: "info", label: "在港" },
      在航: { variant: "success", label: "在航" },
      维修: { variant: "warning", label: "维修" },
    }
    const s = map[status] || { variant: "info" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const deviceStatusBadge = (status: string) => (
    <Badge variant={status === "正常" ? "success" : status === "离线" ? "danger" : "warning"}>{status || "-"}</Badge>
  )

  const certColumns: Column[] = [
    { key: "cert_type", title: "证书类型", dataIndex: "cert_type" },
    { key: "cert_number", title: "证书编号", dataIndex: "cert_number" },
    { key: "issue_date", title: "签发日期", render: (v) => v ? format(new Date(String(v)), "yyyy-MM-dd") : "-" },
    { key: "expiry_date", title: "到期日期", render: (v) => v ? format(new Date(String(v)), "yyyy-MM-dd") : "-" },
    { key: "status", title: "状态", render: (v) => {
      const status = String(v)
      const isExpiring = status === "即将过期" || status === "已过期"
      return <Badge variant={isExpiring ? "warning" : "success"}>{status}</Badge>
    }},
  ]

  const basicInfo = [
    { label: "船名", value: vessel.name },
    { label: "船号", value: vessel.code },
    { label: "船东", value: vessel.owner_name },
    { label: "联系电话", value: vessel.owner_phone || "-" },
    { label: "船舶类型", value: vessel.vessel_type },
    { label: "作业类型", value: vessel.fishing_type },
    { label: "当前状态", value: statusBadge(vessel.status) },
  ]

  const permitInfo = [
    { label: "作业许可编号", value: vessel.work_permit || "-" },
    { label: "许可状态", value: <Badge variant={vessel.work_permit_status === "有效" ? "success" : "danger"}>{vessel.work_permit_status || "-"}</Badge> },
    { label: "许可到期日期", value: vessel.work_permit_expiry ? format(new Date(vessel.work_permit_expiry), "yyyy-MM-dd") : "-" },
  ]

  const deviceInfo = [
    { label: "定位设备", value: vessel.gps_device || "-" },
    { label: "定位状态", value: deviceStatusBadge(vessel.gps_status) },
    { label: "安全设备", value: vessel.safety_device || "-" },
    { label: "安全状态", value: deviceStatusBadge(vessel.safety_status) },
  ]

  const getVerificationStatus = () => {
    const hasCerts = certificates.length > 0
    const permitValid = vessel.work_permit_status === "有效"
    const devicesOnline = vessel.gps_status === "正常" && vessel.safety_status === "正常"
    return { hasCerts, permitValid, devicesOnline }
  }

  const { hasCerts, permitValid, devicesOnline } = getVerificationStatus()
  const verified = hasCerts && permitValid && devicesOnline

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/vessels")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </button>
        {roleConfig.canManageVessels && (
          <button onClick={() => navigate(`/vessels/${id}?edit=1`)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">
            <Pencil className="w-4 h-4" /> 编辑档案
          </button>
        )}
      </div>

      <Card title="档案核验状态" action={
        <Badge variant={verified ? "success" : "warning"}>{verified ? "已通过核验" : "待核验"}</Badge>
      }>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className={`w-5 h-5 ${hasCerts ? "text-green-500" : "text-amber-500"}`} />
              <span className="font-medium text-slate-700">证书管理</span>
              {hasCerts ? <Badge variant="success">已配置</Badge> : <Badge variant="warning">未配置</Badge>}
            </div>
            <p className="text-sm text-slate-500">共 {certificates.length} 本证书</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-5 h-5 ${permitValid ? "text-green-500" : "text-amber-500"}`} />
              <span className="font-medium text-slate-700">作业许可</span>
              {permitValid ? <Badge variant="success">有效</Badge> : <Badge variant="danger">无效</Badge>}
            </div>
            <p className="text-sm text-slate-500">
              {vessel.work_permit_expiry ? `到期: ${format(new Date(vessel.work_permit_expiry), "yyyy-MM-dd")}` : "未配置"}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className={`w-5 h-5 ${devicesOnline ? "text-green-500" : "text-amber-500"}`} />
              <span className="font-medium text-slate-700">设备核验</span>
              {devicesOnline ? <Badge variant="success">正常</Badge> : <Badge variant="warning">异常</Badge>}
            </div>
            <p className="text-sm text-slate-500">
              定位: {vessel.gps_status} / 安全: {vessel.safety_status}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-500">
          <RefreshCw className="w-4 h-4" />
          档案更新时间: {format(new Date(vessel.updated_at), "yyyy-MM-dd HH:mm")}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        <Card title="基本信息">
          <div className="space-y-3">
            {basicInfo.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="作业许可">
          <div className="space-y-3">
            {permitInfo.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="设备状态">
          <div className="space-y-3">
            {deviceInfo.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="船舶证书"
        action={roleConfig.canManageVessels ? (
          <button className="text-sm text-sky-600 hover:underline">添加证书</button>
        ) : undefined}
      >
        {certificates.length === 0 ? (
          <p className="text-center text-slate-500 py-8">暂无证书记录</p>
        ) : (
          <DataTable columns={certColumns} data={certificates} />
        )}
      </Card>

      <Card title="相关记录">
        <div className="grid grid-cols-4 gap-4">
          <Link to={`/declarations?vessel_id=${vessel.id}`} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <p className="text-sm text-slate-500">出海申报记录</p>
            <p className="text-xl font-bold text-slate-700 mt-1">查看申报 →</p>
          </Link>
          <Link to={`/monitor?vessel_id=${vessel.id}`} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <p className="text-sm text-slate-500">轨迹监控记录</p>
            <p className="text-xl font-bold text-slate-700 mt-1">查看轨迹 →</p>
          </Link>
          <Link to={`/events?vessel_id=${vessel.id}`} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <p className="text-sm text-slate-500">事件处置记录</p>
            <p className="text-xl font-bold text-slate-700 mt-1">查看事件 →</p>
          </Link>
          <Link to={`/reports?vessel_id=${vessel.id}`} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <p className="text-sm text-slate-500">监管台账记录</p>
            <p className="text-xl font-bold text-slate-700 mt-1">查看台账 →</p>
          </Link>
        </div>
      </Card>
    </div>
  )
}
