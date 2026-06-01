import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { settlementAPI, visaFormsAPI } from '../api';

function SettlementBasis() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [settlements, setSettlements] = useState([]);
  const [visas, setVisas] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    visa_id: '',
    contract_id: '',
    final_amount: '',
    adjustment_reason: '',
    adjustment_amount: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settlementsRes, visasRes, contractsRes] = await Promise.all([
        settlementAPI.getAll(),
        visaFormsAPI.getAll(),
        contractsAPI.getAll()
      ]);
      setSettlements(settlementsRes.data);
      setVisas(visasRes.data.filter(v => v.status === 'approved'));
      setContracts(contractsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleVisaChange = (visaId) => {
    const visa = visas.find(v => v.id === parseInt(visaId));
    if (visa) {
      setFormData({
        ...formData,
        visa_id: visaId,
        contract_id: visa.contract_id,
        final_amount: visa.total_amount
      });
    } else {
      setFormData({ ...formData, visa_id: visaId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await settlementAPI.create(formData);
      setShowModal(false);
      setFormData({
        visa_id: '',
        contract_id: '',
        final_amount: '',
        adjustment_reason: '',
        adjustment_amount: ''
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败，请重试');
    }
  };

  const handleArchive = async (id) => {
    try {
      await settlementAPI.archive(id);
      loadData();
    } catch (err) {
      console.error('归档失败', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">结算依据</h2>
        {(user.role === 'admin' || user.role === 'cost' || user.role === 'owner') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 创建结算依据
          </button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>结算编号</th>
              <th>关联签证</th>
              <th>关联变更</th>
              <th>所属合同</th>
              <th>最终金额</th>
              <th>调整金额</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">暂无结算依据数据</div>
                </td>
              </tr>
            ) : (
              settlements.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace' }}>{item.settlement_no}</td>
                  <td>{item.visa_no || '-'}</td>
                  <td>{item.change_title || '-'}</td>
                  <td>{item.contract_name}</td>
                  <td className="amount-display">{formatAmount(item.final_amount)}</td>
                  <td className="amount-display" style={{ color: item.adjustment_amount > 0 ? '#059669' : item.adjustment_amount < 0 ? '#dc2626' : '#6b7280' }}>
                    {item.adjustment_amount > 0 ? '+' : ''}{formatAmount(item.adjustment_amount)}
                  </td>
                  <td>
                    {item.is_archived 
                      ? <span className="badge badge-approved">已归档</span>
                      : <span className="badge badge-draft">未归档</span>
                    }
                  </td>
                  <td>{item.created_at?.slice(0, 10)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/settlement/${item.id}`)}
                      >
                        查看
                      </button>
                      {!item.is_archived && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleArchive(item.id)}
                        >
                          归档
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">创建结算依据</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">
                    关联签证单<span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.visa_id}
                    onChange={(e) => handleVisaChange(e.target.value)}
                    required
                  >
                    <option value="">请选择已通过的签证单</option>
                    {visas.map((v) => (
                      <option key={v.id} value={v.id}>{v.visa_no} - {v.project_name} ({formatAmount(v.total_amount)})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      最终结算金额（元）<span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.final_amount}
                      onChange={(e) => setFormData({ ...formData, final_amount: e.target.value })}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">调整金额（元）</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.adjustment_amount}
                      onChange={(e) => setFormData({ ...formData, adjustment_amount: e.target.value })}
                      step="0.01"
                      placeholder="正数为增加，负数为减少"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">调整原因</label>
                  <textarea
                    className="form-textarea"
                    value={formData.adjustment_reason}
                    onChange={(e) => setFormData({ ...formData, adjustment_reason: e.target.value })}
                    placeholder="如有金额调整，请说明原因"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementBasis;
