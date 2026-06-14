import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-');
};

const getStatusBadge = (status) => {
  const statusMap = {
    pending: { label: '待受理', className: 'badge-warning' },
    accepted: { label: '已受理', className: 'badge-info' },
    mediating: { label: '调解中', className: 'badge-primary' },
    adjudicated: { label: '已裁决', className: 'badge-success' },
    closed: { label: '已结案', className: 'badge-default' },
    rejected: { label: '已驳回', className: 'badge-danger' }
  };
  return statusMap[status] || { label: status || '未知', className: '' };
};

const disputeTypes = [
  { value: 'rent_payment', label: '租金支付纠纷' },
  { value: 'deposit_refund', label: '押金退还纠纷' },
  { value: 'property_damage', label: '房屋损坏纠纷' },
  { value: 'maintenance', label: '维修责任纠纷' },
  { value: 'contract_breach', label: '合同违约纠纷' },
  { value: 'other', label: '其他纠纷' }
];

const disputeSteps = [
  { icon: '📝', title: '提交纠纷', desc: '用户提交纠纷申请和相关证据' },
  { icon: '👨‍💼', title: '平台受理', desc: '平台调解员受理并了解情况' },
  { icon: '🤝', title: '调解协商', desc: '调解员组织双方调解协商' },
  { icon: '⚖️', title: '出具裁决', desc: '调解不成，平台出具裁决意见' },
  { icon: '🏁', title: '结案归档', desc: '纠纷解决，记录永久存档' }
];

const Disputes = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newDispute, setNewDispute] = useState({
    contractId: '',
    disputeType: '',
    title: '',
    description: '',
    contactPhone: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/disputes');
      setDisputes(response.data.data || response.data.disputes || []);
    } catch (error) {
      console.error('获取纠纷列表失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看纠纷');
      } else {
        setError(error.response?.data?.message || '获取纠纷列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (dispute) => {
    setSelectedDispute(dispute);
    setShowDetailModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!newDispute.contractId || !newDispute.disputeType || !newDispute.title || !newDispute.description) {
      alert('请填写完整纠纷信息');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/disputes', newDispute);
      alert('纠纷提交成功！我们会尽快处理');
      setNewDispute({
        contractId: '',
        disputeType: '',
        title: '',
        description: '',
        contactPhone: ''
      });
      setActiveTab('list');
      fetchDisputes();
    } catch (error) {
      console.error('提交纠纷失败:', error);
      alert(error.response?.data?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const mockDisputes = [
    {
      id: 1,
      dispute_no: 'JF202605001',
      title: '押金退还纠纷',
      type: 'deposit_refund',
      property_title: '朝阳区国贸CBD精装一居室',
      contract_no: 'HT202605001',
      status: 'mediating',
      created_at: '2026-05-20 14:30:00',
      complainant: '张三',
      respondent: '王建国',
      description: '合同到期后，房东拒绝退还押金，声称房屋有损坏，但实际是正常老化问题。',
      block_hash: '0x7a3b2c1d4e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      mediator_records: [
        { time: '2026-05-20 15:00:00', mediator: '李调解员', content: '已受理纠纷，正在联系双方了解情况' },
        { time: '2026-05-21 10:30:00', mediator: '李调解员', content: '已与租客沟通，租客提供了入住时照片证明' },
        { time: '2026-05-22 09:15:00', mediator: '李调解员', content: '已与房东沟通，房东坚持要求扣除部分押金' },
        { time: '2026-05-23 14:00:00', mediator: '李调解员', content: '安排双方线上调解会议，时间：5月24日15:00' }
      ],
      adjudication: null
    },
    {
      id: 2,
      dispute_no: 'JF202604002',
      title: '租金支付延迟问题',
      type: 'rent_payment',
      property_title: '海淀区中关村两居室',
      contract_no: 'HT202604002',
      status: 'adjudicated',
      created_at: '2026-04-15 11:20:00',
      complainant: '李房东',
      respondent: '李四',
      description: '租客连续两个月延迟支付租金，违反合同约定。',
      block_hash: '0x8b4c3d2e5f6a7b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
      mediator_records: [
        { time: '2026-04-15 12:00:00', mediator: '王调解员', content: '已受理纠纷' },
        { time: '2026-04-16 09:00:00', mediator: '王调解员', content: '租客因薪资延迟发放导致租金延迟，已承诺5日内支付' },
        { time: '2026-04-18 16:30:00', mediator: '王调解员', content: '租客已支付租金，但产生违约金争议' }
      ],
      adjudication: {
        time: '2026-04-20 10:00:00',
        mediator: '王调解员',
        result: '租客应支付逾期违约金共计300元，双方无异议。',
        satisfied: true
      }
    },
    {
      id: 3,
      dispute_no: 'JF202603005',
      title: '维修费用承担争议',
      type: 'maintenance',
      property_title: '丰台区丽泽商务区两居室',
      contract_no: 'HT202601005',
      status: 'closed',
      created_at: '2026-03-10 09:45:00',
      complainant: '王五',
      respondent: '赵阿姨',
      description: '空调自然损坏，房东要求租客承担维修费用。',
      block_hash: '0x9c5d4e3f6a7b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      mediator_records: [
        { time: '2026-03-10 10:00:00', mediator: '张调解员', content: '已受理纠纷' },
        { time: '2026-03-11 14:00:00', mediator: '张调解员', content: '查看合同，自然老化应由房东承担' },
        { time: '2026-03-12 09:30:00', mediator: '张调解员', content: '房东同意承担维修费用，纠纷圆满解决' }
      ],
      adjudication: {
        time: '2026-03-12 10:00:00',
        mediator: '张调解员',
        result: '根据合同约定，空调自然老化损坏由房东承担维修费用1200元。',
        satisfied: true
      }
    }
  ];

  if (loading && activeTab === 'list') {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">纠纷调解中心</h1>
        <p className="text-gray">专业调解团队，公正高效解决租赁纠纷</p>
      </div>

      <div className="tabs mb-6">
        <div 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 我的纠纷
        </div>
        <div 
          className={`tab ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          ➕ 提交新纠纷
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="font-bold">🔄 纠纷处理流程</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {disputeSteps.map((step, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      margin: '0 auto 1rem',
                      color: 'white'
                    }}>
                      {step.icon}
                    </div>
                    <h4 className="font-bold mb-1">{step.title}</h4>
                    <p className="text-gray text-sm">{step.desc}</p>
                    {i < disputeSteps.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '30px',
                        right: '-30px',
                        fontSize: '24px',
                        color: '#d1d5db'
                      }}>
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <p className="text-danger">{error}</p>
              {error.includes('登录') && (
                <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                  去登录
                </button>
              )}
            </div>
          ) : !isAuthenticated ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <p className="text-gray">请先登录后查看纠纷</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                去登录
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="card-header flex-between">
                <h3 className="font-bold">我的纠纷</h3>
                <button className="btn btn-primary" onClick={() => setActiveTab('submit')}>
                  ➕ 提交新纠纷
                </button>
              </div>
              <div className="card-body">
                {disputes.length === 0 ? (
                  <div className="text-center text-gray" style={{ padding: '3rem' }}>
                    暂无纠纷记录
                    <div className="mt-2">
                      <button className="btn btn-primary" onClick={() => setActiveTab('submit')}>
                        提交新纠纷
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>纠纷编号</th>
                        <th>标题</th>
                        <th>关联房源</th>
                        <th>关联合约</th>
                        <th>创建时间</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(disputes.length > 0 ? disputes : mockDisputes).map(dispute => {
                        const status = getStatusBadge(dispute.status);
                        return (
                          <tr key={dispute.id || dispute.dispute_id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              {dispute.dispute_no || dispute.id}
                            </td>
                            <td className="font-bold">{dispute.title}</td>
                            <td className="text-sm">{dispute.property_title || '-'}</td>
                            <td className="text-sm">{dispute.contract_no || '-'}</td>
                            <td className="text-sm">{formatDate(dispute.created_at)}</td>
                            <td>
                              <span className={`badge ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn"
                                style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                onClick={() => handleViewDetail(dispute)}
                              >
                                查看详情
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'submit' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">📝 提交新纠纷</h3>
          </div>
          <div className="card-body" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="alert alert-warning mb-4">
              <strong>提交前请注意：</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '13px' }}>
                <li>请准备好相关证据材料（合同、照片、聊天记录等）</li>
                <li>确保描述事实清楚，理由充分</li>
                <li>调解员会在24小时内联系您</li>
              </ul>
            </div>
            <div className="form-group">
              <label className="form-label">关联合约 *</label>
              <select 
                className="form-input"
                value={newDispute.contractId}
                onChange={e => setNewDispute({ ...newDispute, contractId: e.target.value })}
              >
                <option value="">请选择关联合约</option>
                <option value="1">HT202605001 - 朝阳区国贸CBD精装一居室</option>
                <option value="2">HT202604002 - 海淀区中关村两居室</option>
                <option value="3">HT202601005 - 丰台区丽泽商务区两居室</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">纠纷类型 *</label>
              <select 
                className="form-input"
                value={newDispute.disputeType}
                onChange={e => setNewDispute({ ...newDispute, disputeType: e.target.value })}
              >
                <option value="">请选择纠纷类型</option>
                {disputeTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">纠纷标题 *</label>
              <input 
                type="text" 
                className="form-input"
                value={newDispute.title}
                onChange={e => setNewDispute({ ...newDispute, title: e.target.value })}
                placeholder="请简要描述纠纷问题"
              />
            </div>
            <div className="form-group">
              <label className="form-label">详细描述 *</label>
              <textarea 
                className="form-input"
                rows={6}
                value={newDispute.description}
                onChange={e => setNewDispute({ ...newDispute, description: e.target.value })}
                placeholder="请详细描述纠纷情况，包括时间、地点、人物、事件经过、您的诉求等..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">联系电话</label>
              <input 
                type="tel" 
                className="form-input"
                value={newDispute.contactPhone}
                onChange={e => setNewDispute({ ...newDispute, contactPhone: e.target.value })}
                placeholder="请输入联系电话，方便调解员联系您"
              />
            </div>
            <div className="form-group">
              <label className="form-label">上传证据材料（可选）</label>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: '6px', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>📎</div>
                <p className="text-gray text-sm">点击或拖拽上传证据文件</p>
                <p className="text-xs text-gray">支持 JPG、PNG、PDF 格式，最多上传 10 个文件</p>
              </div>
            </div>
            <div className="text-center mt-4">
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleSubmitDispute}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '📤 提交纠纷申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedDispute && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">纠纷详情 - {selectedDispute.dispute_no || selectedDispute.id}</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2 mb-4" style={{ gap: '1rem' }}>
                <div>
                  <div className="text-gray text-sm">纠纷标题</div>
                  <div className="font-bold">{selectedDispute.title}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">状态</div>
                  <span className={`badge ${getStatusBadge(selectedDispute.status).className}`}>
                    {getStatusBadge(selectedDispute.status).label}
                  </span>
                </div>
                <div>
                  <div className="text-gray text-sm">纠纷类型</div>
                  <div>{disputeTypes.find(t => t.value === selectedDispute.type)?.label || selectedDispute.type || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">创建时间</div>
                  <div>{formatDate(selectedDispute.created_at)}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">申诉人</div>
                  <div>{selectedDispute.complainant || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">被申诉人</div>
                  <div>{selectedDispute.respondent || '-'}</div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="font-bold">📝 纠纷描述</h5>
                </div>
                <div className="card-body">
                  <p className="text-sm">{selectedDispute.description || '暂无描述'}</p>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="font-bold">📋 调解记录时间线</h5>
                </div>
                <div className="card-body">
                  {(selectedDispute.mediator_records && selectedDispute.mediator_records.length > 0 ? selectedDispute.mediator_records : [
                    { time: selectedDispute.created_at, mediator: '系统', content: '纠纷已提交，等待调解员受理' }
                  ]).map((record, i) => (
                    <div key={i} style={{ display: 'flex', marginBottom: '1rem', position: 'relative' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#667eea',
                        marginTop: '4px',
                        marginRight: '1rem',
                        flexShrink: 0
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div className="flex-between">
                          <span className="font-bold text-sm">{record.mediator}</span>
                          <span className="text-xs text-gray">{formatDate(record.time)}</span>
                        </div>
                        <p className="text-sm" style={{ margin: '0.25rem 0 0 0' }}>{record.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDispute.adjudication && (
                <div className="card mb-4" style={{ border: '2px solid #52c41a' }}>
                  <div className="card-header" style={{ background: '#52c41a10' }}>
                    <h5 className="font-bold">⚖️ 裁决结果</h5>
                  </div>
                  <div className="card-body">
                    <div className="text-sm mb-2">
                      <span className="text-gray">裁决时间：</span>
                      <span>{formatDate(selectedDispute.adjudication.time)}</span>
                    </div>
                    <div className="text-sm mb-2">
                      <span className="text-gray">调解员：</span>
                      <span>{selectedDispute.adjudication.mediator}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray">裁决内容：</span>
                      <p style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px' }}>
                        {selectedDispute.adjudication.result}
                      </p>
                    </div>
                    {selectedDispute.adjudication.satisfied && (
                      <div className="mt-2">
                        <span className="badge badge-success">双方无异议 ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDispute.block_hash && (
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)' }}>
                  <div className="card-body">
                    <div className="flex-between mb-2">
                      <span className="font-bold">🔗 区块链存证</span>
                      <span className="badge badge-success">已上链</span>
                    </div>
                    <div className="text-sm mb-1">
                      <span className="text-gray">存证时间：</span>
                      <span>{formatDate(selectedDispute.created_at)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray">交易哈希：</span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '10px' }}>
                        {selectedDispute.block_hash}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetailModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disputes;
