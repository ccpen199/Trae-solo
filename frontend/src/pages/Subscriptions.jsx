import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

function Subscriptions({ user }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    property_id: '',
    customer_name: '',
    customer_phone: '',
    id_card: '',
    agreed_price: '',
    discount_amount: 0,
    discount_reason: ''
  });
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    loadSubscriptions();
    loadAvailableProperties();
  }, [activeTab]);

  const loadSubscriptions = async () => {
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      
      const response = await api.get('/subscriptions', { params });
      setSubscriptions(response.data);
    } catch (error) {
      console.error('加载认购单失败:', error);
    }
  };

  const loadAvailableProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.filter(p => p.status === 'available' || p.status === 'locked'));
    } catch (error) {
      console.error('加载房源失败:', error);
    }
  };

  const handlePropertySelect = (propertyId) => {
    const prop = properties.find(p => p.id === Number(propertyId));
    setSelectedProperty(prop);
    setFormData({ ...formData, property_id: propertyId, agreed_price: prop?.list_price || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.property_id || !formData.customer_name) {
      alert('请填写必填项');
      return;
    }

    try {
      const response = await api.post('/subscriptions', {
        ...formData,
        property_id: Number(formData.property_id),
        agreed_price: Number(formData.agreed_price)
      });

      if (response.data.needs_approval) {
        alert('提交成功！由于价格低于底价或优惠超过权限，已进入审批流程。');
      } else {
        alert('认购成功！');
      }

      setShowSubscribeModal(false);
      setFormData({
        property_id: '',
        customer_name: '',
        customer_phone: '',
        id_card: '',
        agreed_price: '',
        discount_amount: 0,
        discount_reason: ''
      });
      setSelectedProperty(null);
      loadSubscriptions();
    } catch (error) {
      alert(error.response?.data?.error || '提交失败');
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending_approval: '待审批',
      approved: '已审批',
      rejected: '已拒绝',
      contract_pending: '待签约',
      contracted: '已签约',
      refunded: '已退款'
    };
    return map[status] || status;
  };

  const getStatusTagClass = (status) => {
    const map = {
      pending_approval: 'tag-warning',
      approved: 'tag-info',
      rejected: 'tag-error',
      contract_pending: 'tag-warning',
      contracted: 'tag-success',
      refunded: 'tag-error'
    };
    return map[status] || '';
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending_approval', label: '待审批' },
    { key: 'approved', label: '已审批' },
    { key: 'contracted', label: '已签约' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="tabs">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        {(user.role === 'consultant' || user.role === 'manager' || user.role === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowSubscribeModal(true)}>
            新建认购
          </button>
        )}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>认购编号</th>
            <th>房源</th>
            <th>客户姓名</th>
            <th>成交单价</th>
            <th>优惠金额</th>
            <th>置业顾问</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id}>
              <td>#{sub.id}</td>
              <td>{sub.building_name} {sub.unit_number}</td>
              <td>{sub.customer_name}</td>
              <td>¥{Number(sub.agreed_price).toLocaleString()}</td>
              <td>¥{Number(sub.discount_amount || 0).toLocaleString()}</td>
              <td>{sub.consultant_name}</td>
              <td>
                <span className={`tag ${getStatusTagClass(sub.status)}`}>
                  {getStatusText(sub.status)}
                </span>
              </td>
              <td>{sub.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showSubscribeModal && (
        <div className="modal-overlay" onClick={() => setShowSubscribeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新建认购</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择房源 *</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                  required
                >
                  <option value="">请选择房源</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.building_name} {prop.unit_number} - {prop.house_type} - {prop.area}㎡
                    </option>
                  ))}
                </select>
              </div>

              {selectedProperty && (
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div>表价: ¥{selectedProperty.list_price.toLocaleString()}/㎡</div>
                  <div>底价: ¥{selectedProperty.base_price.toLocaleString()}/㎡</div>
                  <div>总价: ¥{(selectedProperty.list_price * selectedProperty.area / 10000).toFixed(2)}万</div>
                </div>
              )}

              <div className="form-group">
                <label>客户姓名 *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="请输入客户姓名"
                  required
                />
              </div>

              <div className="form-group">
                <label>联系电话</label>
                <input
                  type="text"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="请输入联系电话"
                />
              </div>

              <div className="form-group">
                <label>身份证号</label>
                <input
                  type="text"
                  value={formData.id_card}
                  onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                  placeholder="请输入身份证号"
                />
              </div>

              <div className="form-group">
                <label>成交单价（元/㎡）*</label>
                <input
                  type="number"
                  value={formData.agreed_price}
                  onChange={(e) => setFormData({ ...formData, agreed_price: e.target.value })}
                  placeholder="请输入成交单价"
                  required
                />
                {selectedProperty && Number(formData.agreed_price) < selectedProperty.base_price && (
                  <p style={{ color: '#faad14', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ 低于底价，需经理审批
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>优惠金额（元）</label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                  placeholder="请输入优惠金额"
                />
                {formData.discount_amount > 50000 && (
                  <p style={{ color: '#faad14', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ 优惠超过5万元，需经理审批
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>优惠原因</label>
                <input
                  type="text"
                  value={formData.discount_reason}
                  onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })}
                  placeholder="请输入优惠原因"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">提交认购</button>
                <button type="button" className="btn btn-default" onClick={() => setShowSubscribeModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;
