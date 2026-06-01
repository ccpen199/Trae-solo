import { useEffect, useState } from 'react'
import { contractsAPI, customersAPI, warehousesAPI } from '../api'

interface Contract {
  id: number
  code: string
  customer_id: number
  customer_name: string
  customer_company: string
  warehouse_id: number
  warehouse_name: string
  warehouse_code: string
  start_date: string
  end_date: string
  monthly_rent: number
  property_fee: number
  deposit: number
  rent_free_days: number
  increase_clause: string
  delivery_list: string
  status: string
  approved_by: string
  approved_at: string
  created_at: string
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState({
    customer_id: 0,
    warehouse_id: 0,
    start_date: '',
    end_date: '',
    monthly_rent: 0,
    property_fee: 0,
    deposit: 0,
    rent_free_days: 0,
    increase_clause: '',
    delivery_list: '',
  })

  useEffect(() => {
    loadContracts()
    loadCustomers()
    loadWarehouses()
  }, [])

  const loadContracts = async () => {
    try {
      const res = await contractsAPI.getAll()
      setContracts(res.data)
    } catch (error) {
      console.error('加载合同列表失败:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      const res = await customersAPI.getAll()
      setCustomers(res.data)
    } catch (error) {
      console.error('加载客户列表失败:', error)
    }
  }

  const loadWarehouses = async () => {
    try {
      const res = await warehousesAPI.getAll('available')
      setWarehouses(res.data)
    } catch (error) {
      console.error('加载仓库列表失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingContract) {
        await contractsAPI.update(editingContract.id, formData)
      } else {
        await contractsAPI.create(formData)
      }
      setShowModal(false)
      setEditingContract(null)
      resetForm()
      loadContracts()
      loadWarehouses()
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败')
    }
  }

  const handleApprove = async (id: number) => {
    if (confirm('确定审批通过此合同吗？审批后将锁定仓库资源并生成账单。')) {
      try {
        await contractsAPI.approve(id, { approved_by: 'admin' })
        loadContracts()
        loadWarehouses()
      } catch (error: any) {
        alert(error.response?.data?.error || '审批失败')
      }
    }
  }

  const handleTerminate = async (id: number) => {
    if (confirm('确定终止此合同吗？终止后将释放仓库资源。')) {
      try {
        await contractsAPI.terminate(id, { reason: '提前终止', operator: 'admin' })
        loadContracts()
        loadWarehouses()
      } catch (error: any) {
        alert(error.response?.data?.error || '终止失败')
      }
    }
  }

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      customer_id: contract.customer_id,
      warehouse_id: contract.warehouse_id,
      start_date: contract.start_date,
      end_date: contract.end_date,
      monthly_rent: contract.monthly_rent,
      property_fee: contract.property_fee,
      deposit: contract.deposit,
      rent_free_days: contract.rent_free_days,
      increase_clause: contract.increase_clause,
      delivery_list: contract.delivery_list,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      warehouse_id: 0,
      start_date: '',
      end_date: '',
      monthly_rent: 0,
      property_fee: 0,
      deposit: 0,
      rent_free_days: 0,
      increase_clause: '',
      delivery_list: '',
    })
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      approved: '已生效',
      terminated: '已终止',
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="page-header">
        <h1>合同管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setEditingContract(null)
            setShowModal(true)
          }}
        >
          + 新建合同
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>合同编号</th>
                <th>客户</th>
                <th>仓库</th>
                <th>租期</th>
                <th>月租金</th>
                <th>押金</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.customer_name}</td>
                  <td>{c.warehouse_name}</td>
                  <td>
                    {c.start_date} ~ {c.end_date}
                  </td>
                  <td>¥{c.monthly_rent?.toLocaleString()}</td>
                  <td>¥{c.deposit?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>
                      {getStatusText(c.status)}
                    </span>
                  </td>
                  <td>{c.created_at?.split('T')[0]}</td>
                  <td>
                    <div className="actions">
                      {c.status === 'draft' && (
                        <>
                          <button className="btn btn-default btn-sm" onClick={() => handleEdit(c)}>
                            编辑
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(c.id)}>
                            审批
                          </button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <button className="btn btn-warning btn-sm" onClick={() => handleTerminate(c.id)}>
                          终止
                        </button>
                      )}
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
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingContract ? '编辑合同' : '新建合同'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>客户</label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                      required
                      disabled={editingContract?.status === 'approved'}
                    >
                      <option value={0}>请选择客户</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>仓库</label>
                    <select
                      value={formData.warehouse_id}
                      onChange={(e) => setFormData({ ...formData, warehouse_id: Number(e.target.value) })}
                      required
                      disabled={editingContract?.status === 'approved'}
                    >
                      <option value={0}>请选择仓库</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} - {w.area}㎡ - {w.monthly_rent}元/㎡
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>起租日期</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>到期日期</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>月租金(元)</label>
                    <input
                      type="number"
                      value={formData.monthly_rent}
                      onChange={(e) => setFormData({ ...formData, monthly_rent: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>物业费(元)</label>
                    <input
                      type="number"
                      value={formData.property_fee}
                      onChange={(e) => setFormData({ ...formData, property_fee: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>押金(元)</label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>免租期(天)</label>
                    <input
                      type="number"
                      value={formData.rent_free_days}
                      onChange={(e) => setFormData({ ...formData, rent_free_days: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>递增条款</label>
                  <input
                    type="text"
                    value={formData.increase_clause}
                    onChange={(e) => setFormData({ ...formData, increase_clause: e.target.value })}
                    placeholder="例如：每年递增5%"
                  />
                </div>
                <div className="form-group">
                  <label>交付清单</label>
                  <textarea
                    rows={3}
                    value={formData.delivery_list}
                    onChange={(e) => setFormData({ ...formData, delivery_list: e.target.value })}
                    placeholder="请输入交付设施和物品清单"
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
    </div>
  )
}
