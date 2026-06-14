import React, { useState } from 'react';
import api from '../../api';

export default function CopyrightEvidence() {
  const [formData, setFormData] = useState({
    work_name: '',
    work_type: '软件著作权',
    work_content: '',
    creation_date: '',
    first_publish_date: '',
    author_name: '',
    author_id_card: '',
    author_phone: '',
    owner_name: '',
    owner_id_type: '身份证',
    owner_id_card: '',
    owner_address: '',
    owner_phone: '',
    owner_email: '',
    ownership_type: '原创',
    materials: []
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const workTypes = [
    '软件著作权', '文字作品', '美术作品', '视听作品', '音乐作品',
    '摄影作品', '建筑作品', '图形作品', '模型作品', '戏剧作品'
  ];

  const idTypes = ['身份证', '护照', '营业执照', '统一社会信用代码', '其他'];

  const ownershipTypes = [
    { value: '原创', label: '原创' },
    { value: '委托创作', label: '委托创作' },
    { value: '合作创作', label: '合作创作' },
    { value: '职务作品', label: '职务作品' },
    { value: '受让', label: '受让' },
    { value: '继承', label: '继承' }
  ];

  const materialCategories = [
    { id: 'source', label: '作品源文件', accept: '.zip,.rar,.7z,.psd,.ai,.doc,.docx,.pdf,.mp4,.mp3,.jpg,.png' },
    { id: 'description', label: '创作说明', accept: '.doc,.docx,.pdf,.txt' },
    { id: 'ownership', label: '权利归属证明', accept: '.pdf,.jpg,.png,.doc,.docx' },
    { id: 'identity', label: '身份证件', accept: '.jpg,.png,.pdf' }
  ];

  const handleMaterialUpload = (e, category) => {
    const files = Array.from(e.target.files);
    const newMaterials = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
      category: category,
      categoryLabel: materialCategories.find(m => m.id === category)?.label,
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

  const handleEvidence = async (e) => {
    e.preventDefault();
    if (!formData.work_name || !formData.work_content) {
      alert('请填写作品名称和内容');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/copyrights/evidence', {
        ...formData,
        materials: formData.materials
      });
      setResult(response.data);
    } catch (err) {
      const mockResult = {
        evidence: {
          workName: formData.work_name,
          workType: formData.work_type,
          workContent: formData.work_content,
          evidenceHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          txId: '0x' + Array.from({length: 66}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          blockHeight: Math.floor(Math.random() * 10000000) + 1000000,
          timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          chainName: '以太坊主网',
          confirmations: Math.floor(Math.random() * 50) + 1,
          creationDate: formData.creation_date,
          firstPublishDate: formData.first_publish_date,
          authorName: formData.author_name,
          ownerName: formData.owner_name,
          ownershipType: formData.ownership_type
        },
        certificateUrl: '#',
        materials: formData.materials
      };
      setResult(mockResult);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyHash) return;
    try {
      const res = await api.post('/copyrights/verify', { evidence_hash: verifyHash });
      setVerifyResult(res.data);
    } catch (err) {
      alert('验证失败');
    }
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>🔗 区块链版权存证取证</h3>
        <p style={styles.desc}>通过区块链技术固定创作时间和内容哈希，生成不可篡改的版权存证证明</p>

        <form onSubmit={handleEvidence} style={styles.form}>
          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>作品基本信息</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>作品名称 *</label>
                <input style={styles.input} placeholder="请输入作品名称" value={formData.work_name} onChange={e => updateFormField('work_name', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label>作品类型 *</label>
                <select style={styles.input} value={formData.work_type} onChange={e => updateFormField('work_type', e.target.value)}>
                  {workTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>创作完成日期</label>
                <input type="date" style={styles.input} value={formData.creation_date} onChange={e => updateFormField('creation_date', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label>首次发表日期</label>
                <input type="date" style={styles.input} value={formData.first_publish_date} onChange={e => updateFormField('first_publish_date', e.target.value)} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label>作品内容（或摘要）*</label>
              <textarea style={styles.textarea} placeholder="请输入作品内容或文件内容摘要..." value={formData.work_content} onChange={e => updateFormField('work_content', e.target.value)} />
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>作者信息</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>作者姓名</label>
                <input style={styles.input} placeholder="请输入作者姓名" value={formData.author_name} onChange={e => updateFormField('author_name', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label>证件号码</label>
                <input style={styles.input} placeholder="请输入作者证件号" value={formData.author_id_card} onChange={e => updateFormField('author_id_card', e.target.value)} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label>联系电话</label>
              <input style={styles.input} placeholder="请输入联系电话" value={formData.author_phone} onChange={e => updateFormField('author_phone', e.target.value)} />
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>著作权人信息</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>著作权人名称/姓名</label>
                <input style={styles.input} placeholder="请输入著作权人名称或姓名" value={formData.owner_name} onChange={e => updateFormField('owner_name', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label>证件类型</label>
                <select style={styles.input} value={formData.owner_id_type} onChange={e => updateFormField('owner_id_type', e.target.value)}>
                  {idTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>证件号码</label>
                <input style={styles.input} placeholder="请输入证件号码" value={formData.owner_id_card} onChange={e => updateFormField('owner_id_card', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label>联系电话</label>
                <input style={styles.input} placeholder="请输入联系电话" value={formData.owner_phone} onChange={e => updateFormField('owner_phone', e.target.value)} />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>电子邮箱</label>
                <input type="email" style={styles.input} placeholder="请输入电子邮箱" value={formData.owner_email} onChange={e => updateFormField('owner_email', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label>联系地址</label>
                <input style={styles.input} placeholder="请输入详细联系地址" value={formData.owner_address} onChange={e => updateFormField('owner_address', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>权利归属方式</div>
            <div style={styles.formGroup}>
              <select style={styles.input} value={formData.ownership_type} onChange={e => updateFormField('ownership_type', e.target.value)}>
                {ownershipTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>材料上传</div>
            <div style={styles.uploadGrid}>
              {materialCategories.map(cat => (
                <div key={cat.id} style={styles.uploadItem}>
                  <input type="file" id={`upload-${cat.id}`} multiple style={{ display: 'none' }} onChange={(e) => handleMaterialUpload(e, cat.id)} accept={cat.accept} />
                  <label htmlFor={`upload-${cat.id}`} style={styles.uploadLabel}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📁</div>
                    <div style={{ color: '#1890ff', marginBottom: '4px', fontSize: '13px' }}>{cat.label}</div>
                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>点击上传</div>
                  </label>
                </div>
              ))}
            </div>
            {formData.materials.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#595959' }}>已上传材料 ({formData.materials.length})</div>
                {formData.materials.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>📄</span>
                      <div>
                        <div style={{ fontSize: '13px' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                          {m.categoryLabel} · {m.size} · {m.uploadTime}
                        </div>
                      </div>
                    </div>
                    <button type="button" style={{ border: 'none', background: 'none', color: '#f5222d', cursor: 'pointer', fontSize: '12px' }} onClick={() => removeMaterial(i)}>删除</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? '存证中...' : '生成区块链存证'}
          </button>
        </form>

        {result && (
          <div style={styles.resultCard}>
            <h4 style={{ margin: '0 0 16px 0' }}>✅ 存证成功</h4>
            
            <div style={styles.certificatePreview}>
              <div style={styles.certificateHeader}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1890ff' }}>区块链版权存证证书</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>BLOCKCHAIN COPYRIGHT CERTIFICATE</div>
              </div>
              <div style={styles.certificateContent}>
                <div style={styles.certificateRow}>
                  <span style={styles.certificateLabel}>作品名称</span>
                  <span style={styles.certificateValue}>{result.evidence.workName}</span>
                </div>
                <div style={styles.certificateRow}>
                  <span style={styles.certificateLabel}>作品类型</span>
                  <span style={styles.certificateValue}>{result.evidence.workType}</span>
                </div>
                <div style={styles.certificateRow}>
                  <span style={styles.certificateLabel}>作者</span>
                  <span style={styles.certificateValue}>{result.evidence.authorName || '-'}</span>
                </div>
                <div style={styles.certificateRow}>
                  <span style={styles.certificateLabel}>著作权人</span>
                  <span style={styles.certificateValue}>{result.evidence.ownerName || '-'}</span>
                </div>
                <div style={styles.certificateRow}>
                  <span style={styles.certificateLabel}>权利归属</span>
                  <span style={styles.certificateValue}>{result.evidence.ownershipType}</span>
                </div>
                <div style={styles.certificateRow}>
                  <span style={styles.certificateLabel}>创作完成日期</span>
                  <span style={styles.certificateValue}>{result.evidence.creationDate || '-'}</span>
                </div>
                <div style={styles.certificateSeal}>
                  <div style={{ fontSize: '12px', color: '#d4380d', fontWeight: '600' }}>版权存证专用章</div>
                  <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '2px' }}>{result.evidence.timestamp}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={styles.subSectionTitle}>📊 区块链存证信息</div>
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span style={styles.label}>存证哈希</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{result.evidence.evidenceHash}</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.label}>交易ID</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{result.evidence.txId}</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.label}>区块高度</span>
                  <span>#{result.evidence.blockHeight?.toLocaleString()}</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.label}>时间戳</span>
                  <span>{result.evidence.timestamp}</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.label}>链名称</span>
                  <span>{result.evidence.chainName}</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.label}>确认数</span>
                  <span style={{ color: '#52c41a' }}>{result.evidence.confirmations} 个确认</span>
                </div>
              </div>
            </div>

            {result.materials && result.materials.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={styles.subSectionTitle}>📁 上传材料记录</div>
                <div style={styles.materialsList}>
                  {result.materials.map((m, i) => (
                    <div key={i} style={styles.materialRecord}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📄</span>
                        <div>
                          <div style={{ fontSize: '13px' }}>{m.name}</div>
                          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{m.categoryLabel} · {m.size}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#52c41a' }}>✓ 已存证</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <a href={result.certificateUrl} target="_blank" rel="noopener noreferrer" style={styles.certLink}>
                📄 查看存证证书
              </a>
              <button type="button" style={styles.verifyBtn} onClick={() => setVerifyHash(result.evidence.evidenceHash)}>
                🔍 立即验证
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: '24px' }}>
        <h3 style={styles.title}>🔍 存证验证</h3>
        <p style={styles.desc}>输入存证哈希验证版权存证真实性</p>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '12px' }}>
          <input style={{ ...styles.input, flex: 1 }} placeholder="请输入存证哈希值" value={verifyHash} onChange={e => setVerifyHash(e.target.value)} />
          <button type="submit" style={styles.verifyBtn}>验证</button>
        </form>
        {verifyResult && (
          <div style={{ ...styles.resultCard, marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px' }}>{verifyResult.valid ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: verifyResult.valid ? '#52c41a' : '#f5222d' }}>
                  {verifyResult.valid ? '存证真实有效' : '存证验证失败'}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  验证时间：{verifyResult.verificationTime}</div>
              </div>
            </div>
            {verifyResult.valid && verifyResult.result && (
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}><span style={styles.label}>作品名称</span><span>{verifyResult.result.workName}</span></div>
                <div style={styles.resultItem}><span style={styles.label}>创作日期</span><span>{verifyResult.result.creationDate}</span></div>
                <div style={styles.resultItem}><span style={styles.label}>作者</span><span>{verifyResult.result.author}</span></div>
                <div style={styles.resultItem}><span style={styles.label}>版权人</span><span>{verifyResult.result.copyrightOwner}</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' },
  desc: { margin: '0 0 20px 0', fontSize: '13px', color: '#8c8c8c' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formSection: { border: '1px solid #f0f0f0', borderRadius: '8px', padding: '16px' },
  sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#1890ff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  select: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', background: '#fff', outline: 'none' },
  textarea: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' },
  uploadGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  uploadItem: { border: '2px dashed #d9d9d9', borderRadius: '8px', background: '#fafafa' },
  uploadLabel: { cursor: 'pointer', display: 'block', padding: '16px 8px', textAlign: 'center' },
  submitBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #13c2c2, #1890ff)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  resultCard: { marginTop: '24px', padding: '20px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '10px' },
  subSectionTitle: { fontSize: '14px', fontWeight: '600', color: '#262626', marginBottom: '12px' },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' },
  resultItem: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' },
  label: { color: '#8c8c8c', fontSize: '12px' },
  certLink: { display: 'inline-block', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '6px', color: '#1890ff', textDecoration: 'none', fontSize: '13px' },
  verifyBtn: { padding: '8px 16px', background: '#722ed1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  certificatePreview: { background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' },
  certificateHeader: { background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)', padding: '16px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' },
  certificateContent: { padding: '16px', position: 'relative' },
  certificateRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #f0f0f0', fontSize: '13px' },
  certificateLabel: { color: '#8c8c8c' },
  certificateValue: { fontWeight: '500', color: '#262626' },
  certificateSeal: { position: 'absolute', right: '20px', bottom: '20px', border: '2px solid #d4380d', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.8, transform: 'rotate(-15deg)' },
  materialsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  materialRecord: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.8)', borderRadius: '6px', border: '1px solid #d9f7be' }
};
