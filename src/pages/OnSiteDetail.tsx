import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { api } from "@/lib/api"

interface InstallStep {
  step: number
  description: string
  photo: string
}

interface AuxiliaryCharge {
  item: string
  quantity: number
  unit_price: number
}

interface OnSiteRecord {
  id: number
  order_id: number
  technician_id: number
  latitude: number | null
  longitude: number | null
  unboxing_photos: string[]
  install_steps: InstallStep[]
  auxiliary_charges: AuxiliaryCharge[]
  user_signature: string
  exception_notes: string
  status: "in_progress" | "completed"
  created_at: string
  order_no: string
  consumer_name: string
  technician_name: string
}

const statusMap: Record<string, { label: string; variant: "warning" | "success" }> = {
  in_progress: { label: "进行中", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
}

export default function OnSiteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<OnSiteRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState("")

  const [stepDialogOpen, setStepDialogOpen] = useState(false)
  const [newStep, setNewStep] = useState({ step: 1, description: "", photo: "" })

  const [chargeDialogOpen, setChargeDialogOpen] = useState(false)
  const [newCharge, setNewCharge] = useState({ item: "", quantity: 0, unit_price: 0 })

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  function loadDetail() {
    setLoading(true)
    api.get<OnSiteRecord>(`/on-site-records/${id}`)
      .then(setRecord)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  async function addPhoto() {
    if (!record || !newPhotoUrl.trim()) return
    setUpdating(true)
    try {
      await api.put(`/on-site-records/${id}`, {
        ...record,
        unboxing_photos: [...record.unboxing_photos, newPhotoUrl.trim()],
      })
      setPhotoDialogOpen(false)
      setNewPhotoUrl("")
      loadDetail()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  async function addStep() {
    if (!record) return
    setUpdating(true)
    try {
      await api.put(`/on-site-records/${id}`, {
        ...record,
        install_steps: [...record.install_steps, newStep],
      })
      setStepDialogOpen(false)
      setNewStep({ step: record.install_steps.length + 1, description: "", photo: "" })
      loadDetail()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  async function addCharge() {
    if (!record || !newCharge.item) return
    setUpdating(true)
    try {
      await api.put(`/on-site-records/${id}`, {
        ...record,
        auxiliary_charges: [...record.auxiliary_charges, newCharge],
      })
      setChargeDialogOpen(false)
      setNewCharge({ item: "", quantity: 0, unit_price: 0 })
      loadDetail()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  async function completeRecord() {
    if (!record) return
    setUpdating(true)
    try {
      await api.put(`/on-site-records/${id}`, {
        ...record,
        status: "completed",
      })
      setConfirmDialogOpen(false)
      loadDetail()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  function handleExportReport() {
    if (!record) return
    const auxTotal = (record.auxiliary_charges || []).reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
    const photoLinks = (record.unboxing_photos || []).map((url, i) => `<a href="${url}" target="_blank">照片${i + 1}</a>`).join(" &nbsp;|&nbsp; ")
    const stepLinks = (record.install_steps || []).map((s, i) => `<a href="${s.photo}" target="_blank">步骤${i + 1}</a>`).join(" &nbsp;|&nbsp; ")
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>验收报告 - ${record.order_no}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
  h1 { font-size: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
  h2 { font-size: 18px; margin-top: 24px; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; font-size: 14px; }
  th { background: #f3f4f6; font-weight: 600; }
  .label { color: #6b7280; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-gray { background: #f3f4f6; color: #374151; }
  a { color: #2563eb; }
</style>
</head>
<body>
  <h1>验收报告</h1>
  <table>
    <tr><td class="label">订单号</td><td>${record.order_no}</td><td class="label">客户</td><td>${record.consumer_name}</td></tr>
    <tr><td class="label">师傅</td><td>${record.technician_name}</td><td class="label">状态</td><td>${statusMap[record.status]?.label || record.status}</td></tr>
    <tr><td class="label">创建时间</td><td>${record.created_at}</td><td class="label">定位</td><td>${record.latitude != null && record.longitude != null ? `${record.latitude}, ${record.longitude}` : "未记录"}</td></tr>
  </table>

  <h2>验收证据</h2>
  <table>
    <tr><th>项目</th><th>详情</th></tr>
    <tr><td>开箱照片</td><td>${(record.unboxing_photos || []).length}张 ${photoLinks ? "&nbsp;&nbsp;" + photoLinks : ""}</td></tr>
    <tr><td>安装步骤</td><td>${(record.install_steps || []).length}步 ${stepLinks ? "&nbsp;&nbsp;" + stepLinks : ""}</td></tr>
    <tr><td>辅材收费</td><td>¥${auxTotal.toFixed(2)}</td></tr>
    <tr><td>用户签字</td><td>${record.user_signature ? `<span class="badge badge-green">有</span>` : `<span class="badge badge-gray">无</span>`}</td></tr>
    <tr><td>异常说明</td><td>${record.exception_notes ? `<span class="badge badge-red">有</span> ${record.exception_notes}` : `<span class="badge badge-gray">无</span>`}</td></tr>
  </table>

  ${(record.auxiliary_charges || []).length > 0 ? `
  <h2>辅材明细</h2>
  <table>
    <tr><th>项目</th><th>数量</th><th>单价</th><th>小计</th></tr>
    ${record.auxiliary_charges.map(c => `<tr><td>${c.item}</td><td>${c.quantity}</td><td>¥${c.unit_price.toFixed(2)}</td><td>¥${(c.quantity * c.unit_price).toFixed(2)}</td></tr>`).join("")}
    <tr><td colspan="3" style="text-align:right;font-weight:600">合计</td><td style="font-weight:600">¥${auxTotal.toFixed(2)}</td></tr>
  </table>` : ""}

  ${(record.install_steps || []).length > 0 ? `
  <h2>安装步骤</h2>
  <table>
    <tr><th>步骤</th><th>描述</th><th>照片</th></tr>
    ${record.install_steps.map(s => `<tr><td>${s.step}</td><td>${s.description}</td><td>${s.photo ? `<a href="${s.photo}" target="_blank">查看</a>` : "无"}</td></tr>`).join("")}
  </table>` : ""}
</body>
</html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><span className="text-gray-400">加载中...</span></div>
  }

  if (!record) {
    return <div className="flex h-full items-center justify-center"><span className="text-gray-400">记录不存在</span></div>
  }

  const auxTotal = (record.auxiliary_charges || []).reduce((sum, c) => sum + c.quantity * c.unit_price, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate("/on-site")}>← 返回上门记录</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">订单号：</span>{record.order_no}</div>
            <div><span className="text-gray-500">师傅：</span>{record.technician_name}</div>
            <div><span className="text-gray-500">状态：</span><Badge variant={statusMap[record.status]?.variant || "warning"}>{statusMap[record.status]?.label || record.status}</Badge></div>
            <div><span className="text-gray-500">创建时间：</span>{record.created_at}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>定位信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {record.latitude != null && record.longitude != null
              ? `纬度: ${record.latitude}, 经度: ${record.longitude}`
              : "未记录"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>开箱照片</CardTitle>
        </CardHeader>
        <CardContent>
          {(record.unboxing_photos || []).length === 0 ? (
            <div className="text-sm text-gray-400">暂无照片</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {record.unboxing_photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`开箱照片 ${i + 1}`} className="h-20 w-20 rounded border object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>安装步骤</CardTitle>
        </CardHeader>
        <CardContent>
          {(record.install_steps || []).length === 0 ? (
            <div className="text-sm text-gray-400">暂无步骤</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>步骤</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>照片</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.install_steps.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.step}</TableCell>
                    <TableCell>{s.description}</TableCell>
                    <TableCell>
                      {s.photo ? (
                        <a href={s.photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">查看照片</a>
                      ) : "无"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>辅材收费</CardTitle>
        </CardHeader>
        <CardContent>
          {(record.auxiliary_charges || []).length === 0 ? (
            <div className="text-sm text-gray-400">暂无辅材</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>单价</TableHead>
                    <TableHead>小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.auxiliary_charges.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.item}</TableCell>
                      <TableCell>{c.quantity}</TableCell>
                      <TableCell>¥{c.unit_price.toFixed(2)}</TableCell>
                      <TableCell>¥{(c.quantity * c.unit_price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right text-sm font-semibold mt-3">
                合计：¥{auxTotal.toFixed(2)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>用户签字</CardTitle>
        </CardHeader>
        <CardContent>
          {record.user_signature ? (
            <img src={record.user_signature} alt="用户签字" className="max-h-32 border rounded" />
          ) : (
            <div className="text-sm text-gray-400">暂无签字</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>异常说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">{record.exception_notes || "无"}</div>
        </CardContent>
      </Card>

      {record.status === "in_progress" && (
        <Card>
          <CardHeader>
            <CardTitle>操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setNewPhotoUrl(""); setPhotoDialogOpen(true) }}>
                添加开箱照片
              </Button>
              <Button variant="outline" onClick={() => { setNewStep({ step: (record.install_steps || []).length + 1, description: "", photo: "" }); setStepDialogOpen(true) }}>
                添加安装步骤
              </Button>
              <Button variant="outline" onClick={() => { setNewCharge({ item: "", quantity: 0, unit_price: 0 }); setChargeDialogOpen(true) }}>
                添加辅材
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDialogOpen(true)}>
                完成记录
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>验收证据导出</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">开箱照片：</span>
                {(record.unboxing_photos || []).length > 0 ? (
                  <span className="font-medium">
                    {(record.unboxing_photos || []).length}张
                    <span className="ml-2 space-x-1">
                      {(record.unboxing_photos || []).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">照片{i + 1}</a>
                      ))}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">0张</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">安装步骤：</span>
                {(record.install_steps || []).length > 0 ? (
                  <span className="font-medium">
                    {(record.install_steps || []).length}步
                    <span className="ml-2 space-x-1">
                      {(record.install_steps || []).filter(s => s.photo).map((s, i) => (
                        <a key={i} href={s.photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">步骤{s.step}</a>
                      ))}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">0步</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">辅材收费：</span>
                <span className="font-medium">¥{auxTotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">用户签字：</span>
                {record.user_signature ? (
                  <Badge variant="success">有</Badge>
                ) : (
                  <Badge variant="secondary">无</Badge>
                )}
              </div>
              <div>
                <span className="text-gray-500">异常说明：</span>
                {record.exception_notes ? (
                  <Badge variant="destructive">有</Badge>
                ) : (
                  <Badge variant="secondary">无</Badge>
                )}
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={handleExportReport}>导出验收报告</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} title="添加开箱照片">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">照片URL</label>
            <Input value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} placeholder="请输入照片URL" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>取消</Button>
            <Button onClick={addPhoto} disabled={updating || !newPhotoUrl.trim()}>{updating ? "提交中..." : "添加"}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={stepDialogOpen} onClose={() => setStepDialogOpen(false)} title="添加安装步骤">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">步骤号</label>
            <Input type="number" value={newStep.step} onChange={(e) => setNewStep((s) => ({ ...s, step: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">描述</label>
            <Textarea value={newStep.description} onChange={(e) => setNewStep((s) => ({ ...s, description: e.target.value }))} rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">照片URL</label>
            <Input value={newStep.photo} onChange={(e) => setNewStep((s) => ({ ...s, photo: e.target.value }))} placeholder="请输入照片URL" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStepDialogOpen(false)}>取消</Button>
            <Button onClick={addStep} disabled={updating}>{updating ? "提交中..." : "添加"}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={chargeDialogOpen} onClose={() => setChargeDialogOpen(false)} title="添加辅材">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">项目名称</label>
            <Input value={newCharge.item} onChange={(e) => setNewCharge((c) => ({ ...c, item: e.target.value }))} placeholder="请输入项目名称" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">数量</label>
              <Input type="number" value={newCharge.quantity || ""} onChange={(e) => setNewCharge((c) => ({ ...c, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">单价</label>
              <Input type="number" value={newCharge.unit_price || ""} onChange={(e) => setNewCharge((c) => ({ ...c, unit_price: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setChargeDialogOpen(false)}>取消</Button>
            <Button onClick={addCharge} disabled={updating || !newCharge.item}>{updating ? "提交中..." : "添加"}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} title="确认完成">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">确认将此上门记录标记为已完成？此操作不可撤销。</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={completeRecord} disabled={updating}>{updating ? "提交中..." : "确认完成"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
