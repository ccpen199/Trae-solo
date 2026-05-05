import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { addressApi } from '../api'

function AddressPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectMode = searchParams.get('select') === '1'
  
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '',
    is_default: false
  })
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    try {
      const result = await addressApi.getList()
      if (result.success) {
        setAddresses(result.data || [])
      } else {
        showToast(result.message || '获取地址列表失败')
      }
    } catch (error) {
      showToast(error.message || '获取地址列表失败')
    } finally {
      setLoading(false)
    }
  }, [showToast])
  
  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])
  
  const openAddModal = () => {
    setEditingAddress(null)
    setFormData({
      name: '',
      phone: '',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '',
      is_default: false
    })
    setShowAddModal(true)
  }
  
  const openEditModal = (address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      phone: address.phone,
      province: address.province || '北京市',
      city: address.city || '北京市',
      district: address.district || '朝阳区',
      detail: address.detail,
      is_default: address.is_default === 1
    })
    setShowAddModal(true)
  }
  
  const handleSelect = (address) => {
    if (selectMode) {
      const params = new URLSearchParams(window.location.search)
      params.set('selected', JSON.stringify(address))
      navigate(-1)
    }
  }
  
  const handleSetDefault = async (id) => {
    try {
      const result = await addressApi.setDefault(id)
      if (result.success) {
        showToast('已设为默认地址')
        fetchAddresses()
      } else {
        showToast(result.message || '设置失败')
      }
    } catch (error) {
      showToast(error.message || '设置失败')
    }
  }
  
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个地址吗？')) return
    
    try {
      const result = await addressApi.delete(id)
      if (result.success) {
        showToast('地址已删除')
        fetchAddresses()
      } else {
        showToast(result.message || '删除失败')
      }
    } catch (error) {
      showToast(error.message || '删除失败')
    }
  }
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('请输入收货人姓名')
      return
    }
    if (!formData.phone.trim()) {
      showToast('请输入手机号码')
      return
    }
    if (!formData.detail.trim()) {
      showToast('请输入详细地址')
      return
    }
    
    try {
      let result
      if (editingAddress) {
        result = await addressApi.update(editingAddress.id, formData)
      } else {
        result = await addressApi.create(formData)
      }
      
      if (result.success) {
        showToast(editingAddress ? '地址更新成功' : '地址添加成功')
        setShowAddModal(false)
        fetchAddresses()
      } else {
        showToast(result.message || '操作失败')
      }
    } catch (error) {
      showToast(error.message || '操作失败')
    }
  }
  
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between">
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
            ←
          </button>
          <span style={{ color: 'white', fontWeight: 500 }}>
            {selectMode ? '选择收货地址' : '收货地址'}
          </span>
          <div style={{ width: '20px' }}></div>
        </div>
      </div>
      
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        {loading ? (
          <div className="loading" style={{ marginTop: '100px' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '100px' }}>
            <div className="empty-state-icon">📍</div>
            <div className="empty-state-text">暂无收货地址</div>
            <button
              className="btn btn-primary mt-md"
              onClick={openAddModal}
            >
              添加地址
            </button>
          </div>
        ) : (
          addresses.map(address => (
            <div
              key={address.id}
              className="address-card"
              onClick={() => selectMode && handleSelect(address)}
            >
              <div className="address-header">
                <div>
                  <span className="address-name">{address.name}</span>
                  <span className="text-muted" style={{ marginLeft: '12px' }}>{address.phone}</span>
                  {address.is_default === 1 && <span className="address-default-tag">默认</span>}
                </div>
                {selectMode && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: address.is_default === 1 ? '6px solid var(--primary-color)' : '2px solid var(--border-color)'
                  }}></div>
                )}
              </div>
              <div className="address-detail">
                {address.province} {address.city} {address.district} {address.detail}
              </div>
              <div className="address-actions">
                <button
                  className="address-action-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (address.is_default !== 1) {
                      handleSetDefault(address.id)
                    }
                  }}
                  style={{ color: address.is_default === 1 ? 'var(--primary-color)' : 'var(--text-muted)' }}
                >
                  {address.is_default === 1 ? '默认地址' : '设为默认'}
                </button>
                <button
                  className="address-action-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(address)
                  }}
                >
                  编辑
                </button>
                <button
                  className="address-action-btn text-danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(address.id)
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="settlement-footer">
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={openAddModal}
        >
          + 新增收货地址
        </button>
      </div>
      
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {editingAddress ? '编辑地址' : '新增地址'}
              </span>
              <button onClick={() => setShowAddModal(false)} style={{ fontSize: '24px', color: 'var(--text-muted)' }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">收货人姓名</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入收货人姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">手机号码</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="请输入手机号码"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">所在地区</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="input-field"
                    style={{ flex: 1 }}
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  >
                    <option value="北京市">北京市</option>
                    <option value="上海市">上海市</option>
                    <option value="广东省">广东省</option>
                    <option value="浙江省">浙江省</option>
                    <option value="江苏省">江苏省</option>
                    <option value="四川省">四川省</option>
                    <option value="湖北省">湖北省</option>
                    <option value="湖南省">湖南省</option>
                  </select>
                  <select
                    className="input-field"
                    style={{ flex: 1 }}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    <option value="北京市">北京市</option>
                    <option value="上海市">上海市</option>
                    <option value="广州市">广州市</option>
                    <option value="深圳市">深圳市</option>
                    <option value="杭州市">杭州市</option>
                    <option value="南京市">南京市</option>
                    <option value="成都市">成都市</option>
                    <option value="武汉市">武汉市</option>
                    <option value="长沙市">长沙市</option>
                  </select>
                  <select
                    className="input-field"
                    style={{ flex: 1 }}
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  >
                    <option value="朝阳区">朝阳区</option>
                    <option value="海淀区">海淀区</option>
                    <option value="浦东新区">浦东新区</option>
                    <option value="天河区">天河区</option>
                    <option value="南山区">南山区</option>
                    <option value="西湖区">西湖区</option>
                    <option value="鼓楼区">鼓楼区</option>
                    <option value="锦江区">锦江区</option>
                  </select>
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">详细地址</label>
                <textarea
                  className="input-field"
                  placeholder="请输入详细地址，如街道、门牌号等"
                  rows={3}
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  className={`checkbox ${formData.is_default ? 'checked' : ''}`}
                  onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                >
                  {formData.is_default && '✓'}
                </div>
                <span>设为默认地址</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleSubmit}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default AddressPage
