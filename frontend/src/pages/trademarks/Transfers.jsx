import React, { useState, useEffect } from 'react';
import api from '../../api';

const userTrademarks = [
  { id: 1, name: '创新达', registration_number: '12345678', category: '第9类-科学仪器' },
  { id: 2, name: '绿源宝', registration_number: '23456789', category: '第5类-医药' },
  { id: 3, name: '智城通', registration_number: '34567890', category: '第35类-广告销售' },
  { id: 4, name: '云联享', registration_number: '45678901', category: '第42类-技术服务' }
];

const materialTypes = [
  { key: 'application', label: '转让申请书', required: true },
  { key: 'agreement', label: '转让协议', required: true },
  { key: 'power_of_attorney', label: '委托书', required: true },
  { key: 'registration_cert', label: '商标注册证复印件', required: true }
];

export default function TrademarkTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [formData, setFormData] = useState({
    trademark_id: '',
    trademark_name: '',
    assignor_name: '',
    assignor_contact: '',
    assignor_phone: '',
    assignor_address: '',
    assignee_name: '',
    assignee_contact: '',
    assignee_phone: '',
    assignee_email: '',
    assignee_address: '',
    assignee_credit_code: '',
    transfer_price: '',
    agreement_date: '',
    effective_date: '',
    notes: '',
    materials: []
  });

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/trademarks/transfers/list');
      setTransfers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrademarkChange = (e) => {
    const tmId = e.target.value;
    const tm = userTrademarks.find(t => t.id === parseInt(tmId));
    setFormData(prev => ({
      ...prev,
      trademark_id: tmId,
      trademark_name: tm?.name || ''
    }));
  };

  const handleMaterialUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const newMaterials = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: type,
      typeLabel: materialTypes.find(m => m.key === type)?.label,
      uploadTime: new Date().toLocaleString()
    }));
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, ...newMaterials]
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trademark_id || !formData.assignee_name) {
      alert('请填写必要信息');
      return;
    }

    try {
      await api.post('/trademarks/transfers', {
        ...formData,
        transfer_price: parseFloat(formData.transfer_price) || 0
      });
      alert('转让申请已提交！');
      setShowModal(false);
      setFormData({
        trademark_id: '',
        trademark_name: '',
        assignor_name: '',
        assignor_contact: '',
        assignor_phone: '',
        assignor_address: '',
        assignee_name: '',
        assignee_contact: '',
        assignee_phone: '',
        assignee_email: '',
        assignee_address: '',
        assignee_credit_code: '',
        transfer_price: '',
        agreement_date: '',
        effective_date: '',
        notes: '',
        materials: []
      });
      fetchTransfers();
    } catch (err) {
      alert('提交失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleViewDetail = (transfer) => {
    setSelectedTransfer(transfer);
    const mockTimeline = [
      { status: 'submitted', title: '提交申请', date: transfer.agreement_date || transfer.created_at?.split('T')[0], description: '转让申请已提交' }
    ];
    if (transfer.status === 'in_progress' || transfer.status === 'completed') {
      mockTimeline.push({ status: 'formal_review', title: '形式审查', date: transfer.agreement_date, description: '形式审查通过，申请材料齐全' });
    }
    if (transfer.status === 'completed') {
      mockTimeline.push({ status: 'substantive', title: '实质审查', date: transfer.agreement_date, description: '实质审查通过，符合转让条件' });
      mockTimeline.push({ status: 'announcement', title: '核准公告', date: transfer.agreement_date, description: '转让核准公告期' });
      mockTimeline.push({ status: 'completed', title: '转让完成', date: transfer.agreement_date, description: '转让完成，下发核准转让证明' });
    }
    setTimeline(mockTimeline);
    setShowDetail(true);
  };

  const statusMap = {
    pending: { label: '待处理', color: '#1890ff' },
    in_progress: { label: '办理中', color: '#faad14' },
    completed: { label: '已完成', color: '#52c41a' },
    cancelled: { label: '已取消', color: '#8c8c8c' }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>商标转让交易</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>管理商标权转让流程，安全高效完成交易</p>
        </div>
        <button style={styles.primaryButton} onClick={() => setShowModal(true)}>
          + 发起转让
        </button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{transfers.length}</div>
          <div style={styles.statLabel}>转让记录总数</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{transfers.filter(t => t.status === 'pending' || t.status === 'in_progress').length}</div>
          <div style={styles.statLabel}>进行中</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{transfers.filter(t => t.status === 'completed').length}</div>
          <div style={styles.statLabel}>已完成</div>
        </div>
      </div>

      <div style={styles.listCard}>
        <h3 style={styles.cardTitle}>转让记录</h3>
        <div style={styles.transferList}>
          {transfers.map((transfer) => (
            <div key={transfer.id} style={styles.transferItem}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px',
                fontWeight: '700',
                flexShrink: 0
              }}>
                ™️
              </div>
              <div style={{ flex: 1, marginLeft: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
                  {transfer.trademark_name}
                </div>
                <div style={{ fontSize: '13px', color: '#595959', marginBottom: '4px' }}>
                  <span style={{ color: '#8c8c8c' }}>注册号：</span>{transfer.registration_number || '-'}
                </div>
                <div style={{ fontSize: '13px', color: '#595959' }}>
                  <span style={{ color: '#8c8c8c' }}>受让方：</span>{transfer.assignee_name}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#52c41a', marginBottom: '6px' }}>
                  ¥{transfer.transfer_price?.toLocaleString() || '-'}
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  background: statusMap[transfer.status]?.color + '20',
                  color: statusMap[transfer.status]?.color
                }}>
                  {statusMap[transfer.status]?.label || transfer.status}
                </span>
                <div style={{ fontSize: '11px', color: '#bfbfbf', marginTop: '8px', marginBottom: '8px' }}>
                  {transfer.agreement_date || '-'}
                </div>
                <button style={styles.actionButton} onClick={() => handleViewDetail(transfer)}>
                  详情
                </button>
              </div>
            </div>
          ))}
          {transfers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
              暂无转让记录
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px 0' }}>发起商标转让</h3>
            <p style={{ margin: '0 0 20px 0', color: '#8c8c8c', fontSize: '13px' }}>
              请完善转让信息，我们将为您提交至国家知识产权局
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>商标选择</div>
                <div style={styles.formGroup}>
                  <label>选择商标 *</label>
                  <select
                    style={styles.input}
                    value={formData.trademark_id}
                    onChange={handleTrademarkChange}
                  >
                    <option value="">请选择要转让的商标</option>
                    {userTrademarks.map(tm => (
                      <option key={tm.id} value={tm.id}>
                        {tm.name} ({tm.registration_number}) - {tm.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>转让方信息</div>
                <div style={styles.formGroup}>
                  <label>转让方名称</label>
                  <input
                    style={styles.input}
                    placeholder="请输入转让方全称"
                    value={formData.assignor_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignor_name: e.target.value }))}
                  />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label>联系人</label>
                    <input
                      style={styles.input}
                      placeholder="请输入联系人姓名"
                      value={formData.assignor_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignor_contact: e.target.value }))}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>联系电话</label>
                    <input
                      style={styles.input}
                      placeholder="请输入联系电话"
                      value={formData.assignor_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignor_phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label>地址</label>
                  <input
                    style={styles.input}
                    placeholder="请输入详细地址"
                    value={formData.assignor_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignor_address: e.target.value }))}
                  />
                </div>
              </div>

              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>受让方信息</div>
                <div style={styles.formGroup}>
                  <label>受让方名称 *</label>
                  <input
                    style={styles.input}
                    placeholder="请输入受让方全称"
                    value={formData.assignee_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignee_name: e.target.value }))}
                  />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label>联系人</label>
                    <input
                      style={styles.input}
                      placeholder="请输入联系人姓名"
                      value={formData.assignee_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignee_contact: e.target.value }))}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>联系电话</label>
                    <input
                      style={styles.input}
                      placeholder="请输入联系电话"
                      value={formData.assignee_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignee_phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label>电子邮箱</label>
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="请输入电子邮箱"
                    value={formData.assignee_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignee_email: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>地址</label>
                  <input
                    style={styles.input}
                    placeholder="请输入详细地址"
                    value={formData.assignee_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignee_address: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>统一社会信用代码</label>
                  <input
                    style={styles.input}
                    placeholder="请输入统一社会信用代码"
                    value={formData.assignee_credit_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignee_credit_code: e.target.value }))}
                  />
                </div>
              </div>

              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>转让信息</div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label>转让价格（元）</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="请输入转让价格"
                      value={formData.transfer_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, transfer_price: e.target.value }))}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>转让协议日期</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={formData.agreement_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, agreement_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label>生效日期</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={formData.effective_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>备注说明</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="请输入备注信息"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>材料上传</div>
                {materialTypes.map((mt) => {
                  const uploaded = formData.materials.find(m => m.type === mt.key);
                  return (
                    <div key={mt.key} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px' }}>{mt.label}</span>
                        {mt.required && <span style={{ color: '#f5222d', marginLeft: '4px' }}>*</span>}
                      </div>
                      {uploaded ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                          <div>
                            <span>📄 {uploaded.name}</span>
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>{uploaded.size}</span>
                          </div>
                          <button type="button" style={{ border: 'none', background: 'none', color: '#f5222d', cursor: 'pointer', fontSize: '12px' }} onClick={() => removeMaterial(formData.materials.findIndex(m => m.type === mt.key))}>删除</button>
                        </div>
                      ) : (
                        <div style={{ border: '2px dashed #d9d9d9', borderRadius: '6px', padding: '12px', textAlign: 'center', background: '#fafafa' }}>
                          <input type="file" id={`upload-${mt.key}`} style={{ display: 'none' }} onChange={(e) => handleMaterialUpload(e, mt.key)} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                          <label htmlFor={`upload-${mt.key}`} style={{ cursor: 'pointer', display: 'block', fontSize: '13px', color: '#1890ff' }}>
                            📎 点击上传{mt.label}
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedTransfer && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📋 转让详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><span style={{ color: '#8c8c8c' }}>商标：</span><strong>{selectedTransfer.trademark_name}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>注册号：</span>{selectedTransfer.registration_number || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>转让方：</span>{selectedTransfer.assignor_name || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>受让方：</span>{selectedTransfer.assignee_name}</div>
                <div><span style={{ color: '#8c8c8c' }}>转让价格：</span><strong style={{ color: '#52c41a' }}>¥{selectedTransfer.transfer_price?.toLocaleString() || '-'}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>当前状态：</span>
                  <span style={{ ...styles.statusBadge, background: statusMap[selectedTransfer.status]?.color + '20', color: statusMap[selectedTransfer.status]?.color }}>
                    {statusMap[selectedTransfer.status]?.label || selectedTransfer.status}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>协议日期：</span>{selectedTransfer.agreement_date || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>生效日期：</span>{selectedTransfer.effective_date || '-'}</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 16px 0' }}>📅 状态流转时间轴</h4>
            <div style={{ position: 'relative', paddingLeft: '24px', marginBottom: '24px' }}>
              {timeline.map((item, index) => (
                <div key={index} style={{ position: 'relative', paddingBottom: index < timeline.length - 1 ? '20px' : 0 }}>
                  {index < timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: '-18px', top: '12px', bottom: '-8px', width: '2px', background: '#d9d9d9' }}></div>
                  )}
                  <div style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: index === timeline.length - 1 ? '#1890ff' : '#52c41a',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px ' + (index === timeline.length - 1 ? '#1890ff' : '#52c41a')
                  }}></div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{item.title}</span>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#595959' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: '0 0 16px 0' }}>📎 材料记录</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {materialTypes.map((mt, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                  <div>
                    <span>📄 {mt.label}</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>245 KB</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>已上传</span>
                </div>
              ))}
              {selectedTransfer.status === 'completed' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                  <div>
                    <span>🏆 核准转让证明.pdf</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>350 KB</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>已核发</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={styles.cancelButton} onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  primaryButton: {
    padding: '10px 24px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  statCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1890ff'
  },
  statLabel: {
    fontSize: '13px',
    color: '#8c8c8c',
    marginTop: '4px'
  },
  listCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '600'
  },
  transferList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  transferItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '10px'
  },
  actionButton: {
    padding: '6px 14px',
    background: '#722ed1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  formModal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px',
    width: '100%',
    maxWidth: '650px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  detailModal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px',
    width: '100%',
    maxWidth: '650px',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  formSection: {
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '8px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1890ff',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f0f0f0'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    minHeight: '60px',
    resize: 'vertical'
  },
  cancelButton: {
    padding: '10px 24px',
    border: '1px solid #d9d9d9',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 24px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
