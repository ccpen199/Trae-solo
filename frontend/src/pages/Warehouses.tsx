import { useEffect, useState } from 'react'
import { warehousesAPI } from '../api'

interface Warehouse {
  id: number
  name: string
  code: string
  area: number
  height: number
  capacity: number
  fire_rating: string
  temperature_control: string
  monthly_rent: number
  available_date: string
  status: string
  location: string
  description: string
}

interface StatusHistory {
  id: number
  warehouse_id: number
  old_status: string
  new_status: string
  reason: string
  operator: string
  created_at: string
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    area: 0,
    height: 0,
    capacity: 0,
    fire_rating: '丙二类',
    temperature_control: '常温',
    monthly_rent: 0,
    available_date: '',
    status: 'available',
    location: '',
    description: '',
  })

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const res = await warehousesAPI.getAll()
      setWarehouses(res.data)
    } catch (error) {
      console.error('加载仓库列表失败:', error)
    }
  }

  const loadHistory = async (id: number) => {
    try {
      const res = await warehousesAPI.getHistory(id)
      setHistory(res.data)
      setShowHistoryModal(true)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingWarehouse) {
        await warehousesAPI.update(editingWarehouse.id, formData)
      } else {
        await warehousesAPI.create(formData)
      }
      setShowModal(false)
      setEditingWarehouse(null)
      resetForm()
      loadWarehouses()
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败')
    }
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      area: warehouse.area,
      height: warehouse.height,
      capacity: warehouse.capacity,
      fire_rating: warehouse.fire_rating,
      temperature_control: warehouse.temperature_control,
      monthly_rent: warehouse.monthly_rent,
      available_date: warehouse.available_date,
      status: warehouse.status,
      location: warehouse.location,
      description: warehouse.description,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个仓库吗？')) {
      try {
        await warehousesAPI.delete(id)
        loadWarehouses()
      } catch (error) {
        console.error('删除仓库失败:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      area: 0,
      height: 0,
      capacity: 0,
      fire_rating: '丙二类',
      temperature_control: '常温',
      monthly_rent: 0,
      available_date: '',
      status: 'available',
      location: '',
      description: '',
    })
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      available: '可租',
      rented: '已租',
      maintenance: '维护中',
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="page-header">
        <h1>仓库资源管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setEditingWarehouse(null)
            setShowModal(true)
          }}
        >
          + 新增仓库
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>仓库编码</th>
                <th>仓库名称</th>
                <th>面积(㎡)</th>
                <th>层高(m)</th>
                <th>承重(t)</th>
                <th>消防等级</th>
                <th>月租(元/㎡)</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td>{w.code}</td>
                  <td>{w.name}</td>
                  <td>{w.area}</td>
                  <td>{w.height}</td>
                  <td>{w.capacity}</td>
                  <td>{w.fire_rating}</td>
                  <td>{w.monthly_rent}</td>
                  <td>
                    <span className={`status-badge status-${w.status}`}>
                      {getStatusText(w.status)}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-default btn-sm" onClick={() => handleEdit(w)}>
                        编辑
                      </button>
                      <button className="btn btn-default btn-sm" onClick={() => loadHistory(w.id)}>
                        历史
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingWarehouse ? '编辑仓库' : '新增仓库'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>仓库编码</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>仓库名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>面积(㎡)</label>
                    <input
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>层高(m)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>承重(t)</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>月租(元/㎡)</label>
                    <input
                      type="number"
                      value={formData.monthly_rent}
                      onChange={(e) => setFormData({ ...formData, monthly_rent: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>消防等级</label>
                    <select
                      value={formData.fire_rating}
                      onChange={(e) => setFormData({ ...formData, fire_rating: e.target.value })}
                    >
                      <option value="甲类">甲类</option>
                      <option value="乙类">乙类</option>
                      <option value="丙一类">丙一类</option>
                      <option value="丙二类">丙二类</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>温控条件</label>
                    <select
                      value={formData.temperature_control}
                      onChange={(e) => setFormData({ ...formData, temperature_control: e.target.value })}
                    >
                      <option value="常温">常温</option>
                      <option value="冷藏(2-8℃)">冷藏(2-8℃)</option>
                      <option value="冷冻(-18℃)">冷冻(-18℃)</option>
                      <option value="恒温恒湿">恒温恒湿</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>可租日期</label>
                  <input
                    type="date"
                    value={formData.available_date}
                    onChange={(e) => setFormData({ ...formData, available_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>位置</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>状态历史记录</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>原状态</th>
                    <th>新状态</th>
                    <th>原因</th>
                    <th>操作人</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.created_at}</td>
                      <td>{getStatusText(h.old_status)}</td>
                      <td>{getStatusText(h.new_status)}</td>
                      <td>{h.reason}</td>
                      <td>{h.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
