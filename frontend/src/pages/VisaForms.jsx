import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { visaFormsAPI, contractsAPI, changeRequestsAPI } from '../api';

function VisaForms() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [visas, setVisas] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [changes, setChanges] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    contract_id: '',
    change_request_id: '',
    item_name: '',
    quantity: '',
    unit_price: '',
    calculation_formula: '',
    responsible_unit: '',
    description: ''
  });
  const [activeTab, setActiveTab] = useState('all');

  const canCreate = user.role === 'admin' || user.role === 'construction';
  const isConstruction = user.role === 'construction';

  useEffect(() => {
    loadData();
    loadContracts();
    loadChanges();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const res = await visaFormsAPI.getAll();
      setVisas(res.data);
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

  const loadChanges = async () => {
    try {
      const res = await changeRequestsAPI.getAll();
      setChanges(res.data.filter(c => c.status === 'approved'));
    } catch (err) {
      console.error('加载变更申请失败', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { text: '草稿', class: 'badge-draft' },
      pending_cost_review: { text: '待造价复核', class: 'badge-pending' },
      returned: { text: '已退回', class: 'badge-rejected' },
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
      await visaFormsAPI.create({
        ...formData,
        created_by: user.id,
        creator_name: user.name
      });
      setShowModal(false);
      setFormData({
        contract_id: '',
        change_request_id: '',
        item_name: '',
        quantity: '',
        unit_price: '',
        calculation_formula: '',
        responsible_unit: '',
        description: ''
      });
      loadData();
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || err.message));
    }
  };

  const filteredVisas = visas.filter(item => {
    if (activeTab === 'my') {
      return item.created_by === user.id || user.role === 'admin';
    } else if (activeTab === 'draft') {
      return item.status === 'draft';
    } else if (activeTab === 'pending') {
      return item.status === 'pending_cost_review' || item.status === 'pending_approval';
    } else if (activeTab === 'approved') {
      return item.status === 'approved';
    } else if (activeTab === 'rejected') {
      return item.status === 'rejected' || item.status === 'returned';
    }
    return true;
  });

  const getPageTitle = () => {
    if (isConstruction) return '我的签证单';
    return '签证单查询';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{getPageTitle()}</h2>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建签证单
          </button>
        )}
      </div>

      <div className="tabs">
        {canCreate && (
          <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            我提交的
          </button>
        )}
        {canCreate && (
          <button className={`tab ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>
            草稿
          </button>
        )}
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          进行中
        </button>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部
        </button>
        <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
          已通过
        </button>
        <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
          已退回/驳回
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>签证编号</th>
              <th>项目名称</th>
              <th>工程量</th>
              <th>总金额</th>
              <th>状态</th>
              <th>提交人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisas.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">暂无数据</div>
                </td>
              </tr>
            ) : (
              filteredVisas.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace' }}>{item.visa_no}</td>
                  <td>{item.project_name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td className="amount-display">{formatAmount(item.total_amount)}</td>
                  <td>
                    {getStatusBadge(item.status)}
                    {item.total_amount > 100000 && <span className="badge badge-warning" style={{ marginLeft: '4px' }}>超10万</span>}
                  </td>
                  <td>{item.creator_name || '-'}</td>
                  <td>{item.created_at?.slice(0, 19)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/visa-forms/${item.id}`)}
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
              <h3>新建签证单</h3>
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
                  <label>关联变更申请</label>
                  <select
                    className="form-input"
                    value={formData.change_request_id}
                    onChange={(e) => setFormData({ ...formData, change_request_id: e.target.value })}
                  >
                    <option value="">无</option>
                    {changes.map(c => (
                      <option key={c.id} value={c.id}>{c.change_no} - {c.change_reason}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>项目名称 *</label>
                  <input
                    className="form-input"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="例如：土方开挖、混凝土浇筑等"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>工程量 *</label>
                    <input
                      className="form-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="例如：100 m³"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>单价（元）*</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>计算式</label>
                  <input
                    className="form-input"
                    value={formData.calculation_formula}
                    onChange={(e) => setFormData({ ...formData, calculation_formula: e.target.value })}
                    placeholder="例如：长×宽×高 = 10×5×2 = 100"
                  />
                </div>
                <div className="form-group">
                  <label>责任单位</label>
                  <input
                    className="form-input"
                    value={formData.responsible_unit}
                    onChange={(e) => setFormData({ ...formData, responsible_unit: e.target.value })}
                    placeholder="责任单位名称"
                  />
                </div>
                <div className="form-group">
                  <label>详细说明</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="详细说明签证内容"
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

export default VisaForms;
