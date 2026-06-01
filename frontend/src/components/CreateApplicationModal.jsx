import { useState } from 'react'

function CreateApplicationModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    applicant_name: '',
    id_card: '',
    phone: '',
    bank_card: '',
    contacts: [{ name: '', phone: '', relationship: '' }],
    device_info: {
      device_id: 'device_' + Math.random().toString(36).substr(2, 9),
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent
    }
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        alert('创建申请失败')
      }
    } catch (error) {
      console.error('Failed to create application:', error)
      alert('创建申请失败')
    } finally {
      setLoading(false)
    }
  }

  const handleContactChange = (index, field, value) => {
    const newContacts = [...formData.contacts]
    newContacts[index][field] = value
    setFormData({ ...formData, contacts: newContacts })
  }

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { name: '', phone: '', relationship: '' }]
    })
  }

  const removeContact = (index) => {
    const newContacts = formData.contacts.filter((_, i) => i !== index)
    setFormData({ ...formData, contacts: newContacts })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新建贷款申请</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>申请人姓名 *</label>
              <input
                type="text"
                required
                value={formData.applicant_name}
                onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>身份证号 *</label>
              <input
                type="text"
                required
                value={formData.id_card}
                onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                placeholder="(测试: 110101199001011234 会命中黑名单)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>手机号 *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(测试: 13800138000 会命中黑名单)"
              />
            </div>
            <div className="form-group">
              <label>银行卡号</label>
              <input
                type="text"
                value={formData.bank_card}
                onChange={(e) => setFormData({ ...formData, bank_card: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>联系人信息</label>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={addContact}
              >
                + 添加联系人
              </button>
            </div>
          </div>

          {formData.contacts.map((contact, index) => (
            <div key={index} className="form-row" style={{ marginBottom: '8px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="联系人姓名"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="联系电话"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="关系"
                  value={contact.relationship}
                  onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                />
              </div>
              {index > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeContact(index)}
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '提交中...' : '提交申请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateApplicationModal
