import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { changeRequestsAPI, contractsAPI } from '../api';

function ChangeRequests() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [changes, setChanges] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    contract_id: '',
    section_id: '',
    change_reason: '',
    impact_scope: '',
    drawing_reference: '',
    estimated_amount: ''
  });
  const [activeTab, setActiveTab] = useState('all');

  const isSubmitter = user.role === 'admin' || user.role === 'construction';
  const isReviewer = ['supervision', 'owner', 'cost', 'admin'].includes(user.role);

  useEffect(() => {
    loadData();
    loadContracts();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const res = await changeRequestsAPI.getAll();
      let data = res.data;

      if (isSubmitter && !isReviewer) {
        setActiveTab('my');
      } else if (isReviewer && !isSubmitter) {
        setActiveTab('pending');
      }

      setChanges(data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const loadContracts = async () => {
    try {
      const res = await contractsAPI.getAll();
      setContracts(res.data);
    } catch (err) {
      console.error('加载合同失败', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { text: '草稿', class: 'badge-draft' },
      pending_approval: { text: '审批中', class: 'badge-pending' },
      approved: { text: '已通过', class: 'badge-approved' },
      rejected: { text: '已驳回', class: 'badge-rejected' }
    };
    const info = statusMap[status] || { text: status, class: 'badge-draft' };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await changeRequestsAPI.create({
        ...formData,
        created_by: user.id,
        creator_name: user.name
      });
      setShowModal(false);
      setFormData({
        contract_id: '',
        section_id: '',
        change_reason: '',
        impact_scope: '',
        drawing_reference: '',
        estimated_amount: ''
      });
      loadData();
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || err.message));
    }
  };

  const filteredChanges = changes.filter(item => {
    if (activeTab === 'my') {
      return item.created_by === user.id || user.role === 'admin';
    } else if (activeTab === 'pending') {
      return item.status === 'pending_approval';
    } else if (activeTab === 'approved') {
      return item.status === 'approved';
    } else if (activeTab === 'rejected') {
      return item.status === 'rejected';
    }
    return true;
  });

  const getPageTitle = () => {
    if (isSubmitter && !isReviewer) return '我的变更申请';
    if (isReviewer && !isSubmitter) return '待审核变更申请';
    return '变更申请管理';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{getPageTitle()}</h2>
        {isSubmitter && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建变更申请
          </button>
        )}
      </div>

      <div className="tabs">
        {isSubmitter && (
          <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            我提交的
          </button>
        )}
        {isReviewer && (
          <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            待审核
          </button>
        )}
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部
        </button>
        <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
          已通过
        </button>
        <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
          已驳回
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>变更编号</th>
              <th>变更原因</th>
              <th>合同</th>
              <th>预计费用</th>
              <th>状态</th>
              <th>提交人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredChanges.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">暂无数据</div>
                </td>
              </tr>
            ) : (
              filteredChanges.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace' }}>{item.change_no}</td>
                  <td>{item.change_reason}</td>
                  <td>{item.contract_name || '-'}</td>
                  <td className="amount-display">{formatAmount(item.estimated_amount)}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>{item.creator_name || '-'}</td>
                  <td>{item.created_at?.slice(0, 19)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/change-requests/${item.id}`)}
                      >
                        查看详情
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>新建变更申请</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>关联合同 *</label>
                  <select
                    className="form-input"
                    value={formData.contract_id}
                    onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                    required
                  >
                    <option value="">请选择合同</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>{c.contract_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>变更原因 *</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.change_reason}
                    onChange={(e) => setFormData({ ...formData, change_reason: e.target.value })}
                    placeholder="请详细描述变更原因"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>影响范围</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.impact_scope}
                    onChange={(e) => setFormData({ ...formData, impact_scope: e.target.value })}
                    placeholder="描述变更影响的范围"
                  />
                </div>
                <div className="form-group">
                  <label>图纸依据</label>
                  <input
                    className="form-input"
                    value={formData.drawing_reference}
                    onChange={(e) => setFormData({ ...formData, drawing_reference: e.target.value })}
                    placeholder="相关图纸编号或说明"
                  />
                </div>
                <div className="form-group">
                  <label>预计费用（元）</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.estimated_amount}
                    onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChangeRequests;
