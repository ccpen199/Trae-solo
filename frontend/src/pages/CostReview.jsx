import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { visaFormsAPI } from '../api';

function CostReview() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [visas, setVisas] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [reviewResult, setReviewResult] = useState('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const res = await visaFormsAPI.getAll();
      setVisas(res.data);
    } catch (err) {
      console.error('加载数据失败', err);
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

  const handleOpenReview = (visa) => {
    setSelectedVisa(visa);
    setAdjustedAmount(visa.total_amount || '');
    setReviewComment('');
    setReviewResult('approve');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedVisa) return;
    try {
      if (reviewResult === 'approve') {
        await visaFormsAPI.costReview(selectedVisa.id, {
          action: 'approve',
          comment: reviewComment,
          reviewer_name: user.name,
          adjusted_amount: parseFloat(adjustedAmount) || selectedVisa.total_amount
        });
      } else {
        await visaFormsAPI.costReview(selectedVisa.id, {
          action: 'return',
          comment: reviewComment,
          reviewer_name: user.name
        });
      }
      setShowReviewModal(false);
      setSelectedVisa(null);
      loadData();
    } catch (err) {
      alert('操作失败：' + (err.response?.data?.error || err.message));
    }
  };

  const filteredVisas = visas.filter(item => {
    if (activeTab === 'pending') {
      return item.status === 'pending_cost_review';
    } else if (activeTab === 'returned') {
      return item.status === 'returned';
    } else if (activeTab === 'completed') {
      return item.status === 'pending_approval' || item.status === 'approved' || item.status === 'rejected';
    }
    return true;
  });

  const pendingCount = visas.filter(v => v.status === 'pending_cost_review').length;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">造价复核工作台</h2>
        {pendingCount > 0 && (
          <span className="badge badge-pending" style={{ padding: '6px 12px', fontSize: '14px' }}>
            待复核：{pendingCount} 项
          </span>
        )}
      </div>

      <div className="card">
        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '500', marginBottom: '8px' }}>💰 费用测算说明</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: 1.8 }}>
            <li>核对签证单的工程量、单价与计算式是否匹配</li>
            <li>根据市场行情和合同约定测算合理费用</li>
            <li>可直接调整最终金额，需备注调整说明</li>
            <li>退回的签证单需明确标注修改意见</li>
          </ul>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待复核 ({pendingCount})
        </button>
        <button className={`tab ${activeTab === 'returned' ? 'active' : ''}`} onClick={() => setActiveTab('returned')}>
          已退回
        </button>
        <button className={`tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          已完成
        </button>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>签证编号</th>
              <th>项目名称</th>
              <th>工程量</th>
              <th>申报金额</th>
              <th>提交人</th>
              <th>状态</th>
              <th>提交时间</th>
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
                  <td>{item.creator_name || '-'}</td>
                  <td>
                    {getStatusBadge(item.status)}
                    {item.total_amount > 100000 && <span className="badge badge-warning" style={{ marginLeft: '4px' }}>超10万</span>}
                  </td>
                  <td>{item.created_at?.slice(0, 19)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/visa-forms/${item.id}`)}
                      >
                        查看详情
                      </button>
                      {item.status === 'pending_cost_review' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleOpenReview(item)}
                        >
                          造价复核
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

      {showReviewModal && selectedVisa && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>造价复核 - {selectedVisa.visa_no}</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="card" style={{ background: '#f8fafc', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>项目名称</div>
                    <div style={{ fontWeight: '500' }}>{selectedVisa.project_name}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>工程量</div>
                    <div>{selectedVisa.quantity} {selectedVisa.unit}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>申报单价</div>
                    <div>{formatAmount(selectedVisa.unit_price)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>申报总金额</div>
                    <div style={{ color: '#dc2626', fontWeight: '600' }}>{formatAmount(selectedVisa.total_amount)}</div>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>计算式</div>
                  <div style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '8px 12px', borderRadius: '4px' }}>
                    {selectedVisa.calculation_formula || '无'}
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>
                    附件资料 ({selectedVisa.attachments?.length || 0} 个)
                  </div>
                  {!selectedVisa.attachments || selectedVisa.attachments.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>无附件</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedVisa.attachments.map((att) => (
                        <div key={att.id} style={{ 
                          background: 'white', 
                          padding: '8px 12px', 
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>{att.file_type?.startsWith('image/') ? '🖼️' : '📄'}</span>
                          <span>{att.file_name}</span>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                            {(att.file_size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>复核结果</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reviewResult"
                      value="approve"
                      checked={reviewResult === 'approve'}
                      onChange={(e) => setReviewResult(e.target.value)}
                    />
                    <span style={{ color: '#059669' }}>✅ 通过（进入审批流程）</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reviewResult"
                      value="return"
                      checked={reviewResult === 'return'}
                      onChange={(e) => setReviewResult(e.target.value)}
                    />
                    <span style={{ color: '#dc2626' }}>❌ 退回修改</span>
                  </label>
                </div>
              </div>

              {reviewResult === 'approve' && (
                <div className="form-group">
                  <label>核定金额（元）*</label>
                  <input
                    type="number"
                    className="form-input"
                    value={adjustedAmount}
                    onChange={(e) => setAdjustedAmount(e.target.value)}
                    placeholder="可调整最终金额"
                    required
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    与申报金额差异过大时请在复核意见中说明原因
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>复核意见 {reviewResult === 'return' && '*'}</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={reviewResult === 'return' ? '请详细说明退回原因和修改要求...' : '请填写复核意见（选填）...'}
                  required={reviewResult === 'return'}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowReviewModal(false)}>取消</button>
              <button
                type="button"
                className={reviewResult === 'approve' ? 'btn btn-success' : 'btn btn-danger'}
                onClick={handleSubmitReview}
              >
                {reviewResult === 'approve' ? '确认通过' : '确认退回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CostReview;
