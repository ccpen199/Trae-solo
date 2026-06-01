import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersAPI } from '../api';

function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    id_card: '',
    phone: '',
    email: '',
    credit_problem_type: 'overdue',
    involved_institutions: '',
    overdue_reason: '',
    total_fee: 0,
    contact_person: '',
    contact_phone: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll({ page: 1, pageSize: 50 });
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error('加载客户失败:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await customersAPI.create(formData);
      setShowModal(false);
      alert('客户创建成功！');
      loadCustomers();
      setFormData({
        name: '',
        id_card: '',
        phone: '',
        email: '',
        credit_problem_type: 'overdue',
        involved_institutions: '',
        overdue_reason: '',
        total_fee: 0,
        contact_person: '',
        contact_phone: ''
      });
    } catch (error) {
      console.error('创建客户失败:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('创建客户失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getProblemTypeText = (type) => {
    const types = {
      overdue: '逾期记录',
      misinformation: '信息不实',
      unauthorized: '非本人操作',
      other: '其他'
    };
    return types[type] || type;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'active') return 'status-badge status-processing';
    if (status === 'closed') return 'status-badge status-closed';
    return 'status-badge status-pending';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>客户档案</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增客户</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px' }}>正在加载客户数据...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无客户数据</div>
            <div style={{ fontSize: '14px', color: '#999' }}>点击右上角「新增客户」按钮添加第一个客户</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>客户编号</th>
                <th>姓名</th>
                <th>联系电话</th>
                <th>问题类型</th>
                <th>涉及机构</th>
                <th>服务费</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.customer_no}</strong></td>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{getProblemTypeText(c.credit_problem_type)}</td>
                  <td>{c.involved_institutions || '-'}</td>
                  <td>¥{c.total_fee.toLocaleString()}</td>
                  <td><span className={getStatusBadgeClass(c.status)}>
                    {c.status === 'active' ? '进行中' : c.status === 'closed' ? '已结案' : c.status}
                  </span></td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/customers/${c.id}`)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增客户</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>姓名 *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>身份证号</label>
                  <input value={formData.id_card} onChange={e => setFormData({...formData, id_card: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>手机号</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>征信问题类型 *</label>
                  <select required value={formData.credit_problem_type} onChange={e => setFormData({...formData, credit_problem_type: e.target.value})}>
                    <option value="overdue">逾期记录</option>
                    <option value="misinformation">信息不实</option>
                    <option value="unauthorized">非本人操作</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>涉及机构</label>
                  <input value={formData.involved_institutions} onChange={e => setFormData({...formData, involved_institutions: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>逾期/问题原因说明</label>
                <textarea rows="3" value={formData.overdue_reason} onChange={e => setFormData({...formData, overdue_reason: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>服务费用</label>
                  <input type="number" value={formData.total_fee} onChange={e => setFormData({...formData, total_fee: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>联系人</label>
                  <input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>联系人电话</label>
                <input value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ marginRight: '10px' }} onClick={() => setShowModal(false)} disabled={submitting}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '创建中...' : '创建客户'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
