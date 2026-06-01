import { useState, useEffect } from 'react'
import { assets, Asset } from '@/lib/api'
import { Plus, Search, Edit2, Trash2, X, Image, FileText, RefreshCw } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'house', label: '房屋' },
  { value: 'land', label: '土地' },
  { value: 'equipment', label: '设备' },
  { value: 'forest', label: '林地' },
  { value: 'water', label: '水面' },
] as const

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'transferred', label: '已转让' },
  { value: 'demolished', label: '已拆除' },
  { value: 'idle', label: '闲置' },
] as const

const TYPE_LABELS: Record<string, string> = {
  house: '房屋',
  land: '土地',
  equipment: '设备',
  forest: '林地',
  water: '水面',
}

const STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  transferred: '已转让',
  demolished: '已拆除',
  idle: '闲置',
}

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-green-100 text-green-800',
  transferred: 'bg-yellow-100 text-yellow-800',
  demolished: 'bg-red-100 text-red-800',
  idle: 'bg-gray-100 text-gray-800',
}

const FORM_TYPE_OPTIONS = TYPE_OPTIONS.filter((o) => o.value !== '')
const FORM_STATUS_OPTIONS = STATUS_OPTIONS.filter((o) => o.value !== '')

export default function Assets() {
  const [list, setList] = useState<Asset[]>([])
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('house')
  const [formLocation, setFormLocation] = useState('')
  const [formArea, setFormArea] = useState('')
  const [formAreaUnit, setFormAreaUnit] = useState('㎡')
  const [formOwnership, setFormOwnership] = useState('')
  const [formValuation, setFormValuation] = useState('')
  const [formCertificateNo, setFormCertificateNo] = useState('')
  const [formPhotoUrl, setFormPhotoUrl] = useState('')
  const [formStatus, setFormStatus] = useState('normal')
  const [formRemark, setFormRemark] = useState('')

  const fetchList = async () => {
    try {
      const data = await assets.list({
        keyword: keyword || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      })
      setList(data)
    } catch {
      setList([])
    }
  }

  useEffect(() => {
    fetchList()
  }, [keyword, typeFilter, statusFilter])

  const openCreate = () => {
    setEditingId(null)
    setFormName('')
    setFormType('house')
    setFormLocation('')
    setFormArea('')
    setFormAreaUnit('㎡')
    setFormOwnership('')
    setFormValuation('')
    setFormCertificateNo('')
    setFormPhotoUrl('')
    setFormStatus('normal')
    setFormRemark('')
    setModalOpen(true)
  }

  const openEdit = (asset: Asset) => {
    setEditingId(asset.id)
    setFormName(asset.name)
    setFormType(asset.type)
    setFormLocation(asset.location)
    setFormArea(String(asset.area))
    setFormAreaUnit(asset.area_unit)
    setFormOwnership(asset.ownership)
    setFormValuation(String(asset.valuation / 10000))
    setFormCertificateNo(asset.certificate_no)
    setFormPhotoUrl(asset.photo_url || '')
    setFormStatus(asset.status)
    setFormRemark(asset.remark)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formName) {
      alert('请填写资产名称')
      return
    }
    const payload = {
      name: formName,
      type: formType,
      location: formLocation,
      area: Number(formArea || 0),
      area_unit: formAreaUnit,
      ownership: formOwnership,
      valuation: Number(formValuation || 0) * 10000,
      certificate_no: formCertificateNo,
      photo_url: formPhotoUrl,
      status: formStatus,
      remark: formRemark,
    }
    try {
      if (editingId) {
        await assets.update(editingId, payload)
      } else {
        await assets.create(payload)
      }
      setModalOpen(false)
      setEditingId(null)
      await fetchList()
    } catch (err: any) {
      console.error('Save failed:', err)
      alert('保存失败: ' + (err.message || '未知错误'))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await assets.delete(id)
      setDeletingId(null)
      await fetchList()
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert('删除失败: ' + (err.message || '未知错误'))
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">资产台账</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchList}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增资产
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={fetchList}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          查询
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">资产名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">位置</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">面积</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">权属</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">估值(万元)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">证书</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">照片</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {list.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{TYPE_LABELS[item.type] ?? item.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{item.location}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {item.area}{item.area_unit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{item.ownership}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{(item.valuation / 10000).toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {item.certificate_no ? (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <FileText className="h-3.5 w-3.5" />
                        {item.certificate_no}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {item.photo_url ? (
                      <a
                        href={item.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Image className="h-3.5 w-3.5" />
                        查看
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        编辑
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModalOpen(false)}>
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? '编辑资产' : '新增资产'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">资产名称 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入资产名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">类型</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {FORM_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {FORM_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">位置</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入位置"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">面积</label>
                  <input
                    type="number"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">单位</label>
                  <input
                    type="text"
                    value={formAreaUnit}
                    onChange={(e) => setFormAreaUnit(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">权属</label>
                <input
                  type="text"
                  value={formOwnership}
                  onChange={(e) => setFormOwnership(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如: 村集体"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">估值(万元)</label>
                <input
                  type="number"
                  value={formValuation}
                  onChange={(e) => setFormValuation(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入估值，单位万元"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <FileText className="h-3.5 w-3.5 inline mr-1" />
                  证书编号
                </label>
                <input
                  type="text"
                  value={formCertificateNo}
                  onChange={(e) => setFormCertificateNo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入产权证书编号"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <Image className="h-3.5 w-3.5 inline mr-1" />
                  照片链接(权属材料)
                </label>
                <input
                  type="text"
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入图片URL链接，用于展示权属证明材料"
                />
                {formPhotoUrl && (
                  <div className="mt-2">
                    <img
                      src={formPhotoUrl}
                      alt="预览"
                      className="max-h-32 rounded border object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">备注</label>
                <textarea
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingId(null)}>
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
            <p className="mt-2 text-sm text-gray-600">确定要删除该资产吗？此操作不可撤销。</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
