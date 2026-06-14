import React, { useState } from 'react';
import api from '../../api';

export default function TrademarkSearch() {
  const [formData, setFormData] = useState({ keyword: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    trademark_name: '',
    category: '',
    applicant_name: '',
    applicant_type: 'enterprise',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    applicant_address: '',
    id_card_no: '',
    business_license: '',
    trademark_design: '',
    priority_date: '',
    designated_goods: '',
    power_of_attorney: false,
    materials: []
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  const categories = [
    '第1类-化学原料', '第5类-医药', '第9类-科学仪器', '第35类-广告销售',
    '第42类-技术服务', '第43类-餐饮住宿', '第25类-服装鞋帽', '第16类-办公用品'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.keyword.trim()) {
      alert('请输入检索关键词');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/trademarks/search', formData);
      setResult(response.data);
      setSearchHistory(prev => [
        { keyword: formData.keyword, category: formData.category, time: new Date().toLocaleString() },
        ...prev.slice(0, 4)
      ]);
    } catch (err) {
      alert('检索失败: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (keyword) => {
    setFormData(prev => ({ ...prev, keyword }));
  };

  const openApplyModal = () => {
    if (result) {
      setApplyForm(prev => ({
        ...prev,
        trademark_name: result.keyword,
        category: result.category || applyForm.category
      }));
    }
    setShowApplyModal(true);
  };

  const handleMaterialUpload = (e) => {
    const files = Array.from(e.target.files);
    const newMaterials = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
      uploadTime: new Date().toLocaleString()
    }));
    setApplyForm(prev => ({
      ...prev,
      materials: [...prev.materials, ...newMaterials]
    }));
  };

  const removeMaterial = (index) => {
    setApplyForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.trademark_name || !applyForm.category || !applyForm.applicant_name) {
      alert('请填写商标名称、类别和申请人信息');
      return;
    }
    setApplyLoading(true);
    try {
      const response = await api.post('/trademarks/apply', {
        ...applyForm,
        materials: applyForm.materials
      });
      setApplyResult(response.data);
    } catch (err) {
      alert('提交失败: ' + (err.response?.data?.error || err.message));
    } finally {
      setApplyLoading(false);
    }
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setApplyResult(null);
    setApplyForm({
      trademark_name: '',
      category: '',
      applicant_name: '',
      applicant_type: 'enterprise',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      applicant_address: '',
      id_card_no: '',
      business_license: '',
      trademark_design: '',
      priority_date: '',
      designated_goods: '',
      power_of_attorney: false,
      materials: []
    });
  };

  const getRiskColor = (level) => {
    return level === 'high' ? '#f5222d' : level === 'medium' ? '#faad14' : '#52c41a';
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchCard}>
        <h2 style={styles.searchTitle}>🔍 商标检索 & AI近似风险评估</h2>
        <p style={styles.searchDesc}>通过AI算法分析商标近似度，评估注册风险，提高注册成功率</p>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            placeholder="请输入要检索的商标名称..."
            value={formData.keyword}
            onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
          />
          <select
            style={styles.categorySelect}
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">选择类别（可选）</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button type="submit" style={styles.searchButton} disabled={loading}>
            {loading ? '检索中...' : '开始检索'}
          </button>
        </form>

        <div style={styles.quickKeywords}>
          <span style={{ color: '#8c8c8c', fontSize: '13px', marginRight: '8px' }}>热门检索：</span>
          {['创新达', '绿源宝', '智城通', '云联享'].map(kw => (
            <button
              key={kw}
              style={styles.quickTag}
              onClick={() => handleQuickSearch(kw)}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.riskAssessment}>
            <h3 style={{ margin: '0 0 16px 0' }}>AI风险评估报告</h3>
            <div style={styles.riskScoreContainer}>
              <div style={{ ...styles.riskScore, background: `conic-gradient(${getRiskColor(result.riskAssessment.level)} ${result.riskAssessment.score}%, #f0f0f0 0)` }}>
                <div style={styles.riskScoreInner}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: getRiskColor(result.riskAssessment.level) }}>
                    {result.riskAssessment.score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>风险评分</div>
                </div>
              </div>
              <div style={{ flex: 1, marginLeft: '24px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600' }}>风险等级：</span>
                  <span style={{ ...styles.riskLevelBadge, background: getRiskColor(result.riskAssessment.level) + '20', color: getRiskColor(result.riskAssessment.level) }}>
                    {result.riskAssessment.level === 'high' ? '🔴 高风险' : result.riskAssessment.level === 'medium' ? '🟡 中风险' : '🟢 低风险'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <p style={{ margin: '4px 0' }}><strong>检索关键词：</strong>{result.keyword}</p>
                  <p style={{ margin: '4px 0' }}><strong>检索类别：</strong>{result.category || '全部类别'}</p>
                  <p style={{ margin: '4px 0' }}><strong>近似结果：</strong>发现 {result.results.length} 个近似商标</p>
                  <p style={{ margin: '12px 0', padding: '12px', background: '#fffbe6', borderRadius: '8px', color: '#d48806' }}>
                    💡 <strong>建议：</strong>{result.riskAssessment.suggestion}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>近似商标列表</h4>
            <div style={styles.resultsGrid}>
              {result.results.map((item, index) => (
                <div key={index} style={styles.resultItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{item.name}</div>
                    <div style={{
                      padding: '2px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      background: item.similarity > 70 ? '#fff1f0' : '#fff7e6',
                      color: item.similarity > 70 ? '#f5222d' : '#fa8c16'
                    }}>
                      相似度 {item.similarity}%
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '4px' }}>{item.category}</div>
                  <div style={{ fontSize: '12px', color: '#52c41a' }}>{item.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button style={styles.applyButton} onClick={openApplyModal}>
              📝 立即提交注册申请
            </button>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div style={styles.modalOverlay} onClick={closeApplyModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {!applyResult ? (
              <>
                <h3 style={{ margin: '0 0 8px 0' }}>📝 商标注册申请</h3>
                <p style={{ margin: '0 0 20px 0', color: '#8c8c8c', fontSize: '13px' }}>
                  请完善申请信息，我们将为您提交至国家知识产权局
                </p>
                <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
                  <div style={styles.formSection}>
                    <div style={styles.sectionTitle}>商标信息</div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label>商标名称 *</label>
                        <input style={styles.input} placeholder="请输入商标名称" value={applyForm.trademark_name} onChange={(e) => setApplyForm(p => ({ ...p, trademark_name: e.target.value }))} />
                      </div>
                      <div style={styles.formGroup}>
                        <label>申请类别 *</label>
                        <select style={styles.input} value={applyForm.category} onChange={(e) => setApplyForm(p => ({ ...p, category: e.target.value }))}>
                          <option value="">请选择类别</option>
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label>商标图样说明</label>
                      <textarea style={styles.textarea} placeholder="请描述商标设计要素、颜色组合等" value={applyForm.trademark_design} onChange={(e) => setApplyForm(p => ({ ...p, trademark_design: e.target.value }))} />
                    </div>
                    <div style={styles.formGroup}>
                      <label>指定商品/服务项目</label>
                      <textarea style={styles.textarea} placeholder="如：第42类：技术研究、计算机软件设计等" value={applyForm.designated_goods} onChange={(e) => setApplyForm(p => ({ ...p, designated_goods: e.target.value }))} />
                    </div>
                    <div style={styles.formGroup}>
                      <label>优先权日期（如有）</label>
                      <input type="date" style={styles.input} value={applyForm.priority_date} onChange={(e) => setApplyForm(p => ({ ...p, priority_date: e.target.value }))} />
                    </div>
                  </div>

                  <div style={styles.formSection}>
                    <div style={styles.sectionTitle}>申请人信息</div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label>申请人类型</label>
                        <select style={styles.input} value={applyForm.applicant_type} onChange={(e) => setApplyForm(p => ({ ...p, applicant_type: e.target.value }))}>
                          <option value="enterprise">企业</option>
                          <option value="individual">个人</option>
                          <option value="institution">事业单位</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label>申请人名称 *</label>
                        <input style={styles.input} placeholder="请输入申请人全称" value={applyForm.applicant_name} onChange={(e) => setApplyForm(p => ({ ...p, applicant_name: e.target.value }))} />
                      </div>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label>联系人</label>
                        <input style={styles.input} placeholder="请输入联系人姓名" value={applyForm.contact_person} onChange={(e) => setApplyForm(p => ({ ...p, contact_person: e.target.value }))} />
                      </div>
                      <div style={styles.formGroup}>
                        <label>联系电话</label>
                        <input style={styles.input} placeholder="请输入联系电话" value={applyForm.contact_phone} onChange={(e) => setApplyForm(p => ({ ...p, contact_phone: e.target.value }))} />
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label>电子邮箱</label>
                      <input type="email" style={styles.input} placeholder="请输入电子邮箱" value={applyForm.contact_email} onChange={(e) => setApplyForm(p => ({ ...p, contact_email: e.target.value }))} />
                    </div>
                    <div style={styles.formGroup}>
                      <label>申请人地址</label>
                      <input style={styles.input} placeholder="请输入详细地址" value={applyForm.applicant_address} onChange={(e) => setApplyForm(p => ({ ...p, applicant_address: e.target.value }))} />
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label>{applyForm.applicant_type === 'individual' ? '身份证号' : '统一社会信用代码'}</label>
                        <input style={styles.input} placeholder={applyForm.applicant_type === 'individual' ? '请输入身份证号' : '请输入统一社会信用代码'} value={applyForm.applicant_type === 'individual' ? applyForm.id_card_no : applyForm.business_license} onChange={(e) => setApplyForm(p => ({ ...p, [applyForm.applicant_type === 'individual' ? 'id_card_no' : 'business_license']: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div style={styles.formSection}>
                    <div style={styles.sectionTitle}>材料上传</div>
                    <div style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#fafafa' }}>
                      <input type="file" id="material-upload" multiple style={{ display: 'none' }} onChange={handleMaterialUpload} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                      <label htmlFor="material-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                        <div style={{ color: '#1890ff', marginBottom: '4px' }}>点击上传材料</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>支持 JPG、PNG、PDF、Word 格式，单文件不超过10MB</div>
                      </label>
                    </div>
                    {applyForm.materials.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {applyForm.materials.map((m, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                            <div>
                              <span style={{ fontSize: '14px' }}>📄 {m.name}</span>
                              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>{m.size}</span>
                            </div>
                            <button type="button" style={{ border: 'none', background: 'none', color: '#f5222d', cursor: 'pointer' }} onClick={() => removeMaterial(i)}>删除</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" id="poa" checked={applyForm.power_of_attorney} onChange={(e) => setApplyForm(p => ({ ...p, power_of_attorney: e.target.checked }))} />
                      <label htmlFor="poa" style={{ fontSize: '13px', color: '#595959' }}>我已阅读并同意《商标代理委托书》</label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" style={styles.cancelButton} onClick={closeApplyModal}>取消</button>
                    <button type="submit" style={styles.submitButton} disabled={applyLoading}>
                      {applyLoading ? '提交中...' : '提交申请'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ margin: '0 0 8px 0' }}>申请提交成功！</h3>
                <p style={{ margin: '0 0 20px 0', color: '#8c8c8c' }}>您的商标注册申请已成功提交至知识产权局</p>
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
                  <div style={{ marginBottom: '8px' }}><strong>申请号：</strong>{applyResult.applicationNumber}</div>
                  <div style={{ marginBottom: '8px' }}><strong>商标名称：</strong>{applyResult.trademarkName}</div>
                  <div style={{ marginBottom: '8px' }}><strong>申请类别：</strong>{applyResult.category}</div>
                  <div style={{ marginBottom: '8px' }}><strong>申请人：</strong>{applyResult.applicant}</div>
                  <div style={{ marginBottom: '8px' }}><strong>提交时间：</strong>{applyResult.submitTime}</div>
                  <div><strong>当前状态：</strong><span style={{ color: '#1890ff' }}>待受理</span></div>
                </div>
                <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', padding: '12px 16px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
                  <strong>📌 申请流程：</strong>
                  <ol style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: '1.8' }}>
                    <li>形式审查（约1个月）→ 下发受理通知书</li>
                    <li>实质审查（约6-9个月）→ 初审公告或驳回</li>
                    <li>初审公告期（3个月）→ 无人异议则核准注册</li>
                    <li>下发商标注册证（约1个月）</li>
                  </ol>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button style={styles.cancelButton} onClick={closeApplyModal}>关闭</button>
                  <button style={styles.submitButton} onClick={() => { closeApplyModal(); window.location.href = '/trademarks'; }}>
                    查看我的商标
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {searchHistory.length > 0 && (
        <div style={styles.historyCard}>
          <h4 style={{ margin: '0 0 12px 0' }}>检索历史</h4>
          {searchHistory.map((item, index) => (
            <div key={index} style={styles.historyItem}>
              <span style={{ fontWeight: '500' }}>{item.keyword}</span>
              <span style={{ color: '#8c8c8c', fontSize: '12px', margin: '0 8px' }}>{item.category || '全部类别'}</span>
              <span style={{ color: '#bfbfbf', fontSize: '12px' }}>{item.time}</span>
            </div>
          ))}
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
  searchCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '32px',
    color: '#fff'
  },
  searchTitle: {
    margin: '0 0 8px 0',
    fontSize: '22px'
  },
  searchDesc: {
    margin: '0 0 24px 0',
    opacity: 0.85
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '250px',
    padding: '14px 18px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none'
  },
  categorySelect: {
    padding: '14px 18px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    background: '#fff',
    outline: 'none',
    minWidth: '180px'
  },
  searchButton: {
    padding: '14px 32px',
    background: '#fff',
    color: '#667eea',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  quickKeywords: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  },
  quickTag: {
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer'
  },
  resultCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  riskAssessment: {
    paddingBottom: '24px',
    borderBottom: '1px solid #f0f0f0'
  },
  riskScoreContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  riskScore: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  riskScoreInner: {
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  riskLevelBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500'
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px'
  },
  resultItem: {
    padding: '16px',
    background: '#fafafa',
    borderRadius: '10px'
  },
  applyButton: {
    padding: '14px 40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  historyCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  historyItem: {
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px'
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
  modal: {
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
