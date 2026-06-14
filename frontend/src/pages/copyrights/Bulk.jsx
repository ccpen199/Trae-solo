import React, { useState, useEffect } from 'react';
import api from '../../api';

const workStatusSteps = [
  { key: 'pending', label: '待提交', color: '#8c8c8c' },
  { key: 'submitted', label: '已提交', color: '#1890ff' },
  { key: 'accepted', label: '受理', color: '#722ed1' },
  { key: 'reviewing', label: '审查', color: '#fa8c16' },
  { key: 'completed', label: '登记完成', color: '#52c41a' }
];

export default function CopyrightBulk() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [formData, setFormData] = useState({
    batch_name: '',
    works: [{
      name: '',
      type: '软件著作权',
      author: '',
      creation_date: '',
      publish_date: '',
      ownership: '个人',
      source_file: null
    }]
  });

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    api.get('/copyrights/bulk/list').then(res => { setBatches(res.data.data); }).catch(() => {}).finally(() => setLoading(false));
  };

  const addWork = () => setFormData(p => ({
    ...p,
    works: [...p.works, {
      name: '',
      type: '软件著作权',
      author: '',
      creation_date: '',
      publish_date: '',
      ownership: '个人',
      source_file: null
    }]
  }));

  const updateWork = (i, f, v) => setFormData(p => ({
    ...p,
    works: p.works.map((w, j) => (j === i ? { ...w, [f]: v } : w))
  }));

  const removeWork = (i) => setFormData(p => ({
    ...p,
    works: p.works.filter((_, j) => j !== i)
  }));

  const handleFileSelect = (i, e) => {
    const file = e.target.files[0];
    if (file) {
      updateWork(i, 'source_file', { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validWorks = formData.works.filter(w => w.name.trim());
    if (!formData.batch_name || validWorks.length === 0) { alert('请填写批次名称和至少一个作品'); return; }
    try {
      await api.post('/copyrights/bulk', { ...formData, works: validWorks });
      alert('批量登记已提交！'); setShowModal(false);
      setFormData({
        batch_name: '',
        works: [{
          name: '',
          type: '软件著作权',
          author: '',
          creation_date: '',
          publish_date: '',
          ownership: '个人',
          source_file: null
        }]
      });
      fetchBatches();
    } catch (err) { alert('提交失败'); }
  };

  const viewBatchDetail = (batch) => {
    const works = [
      {
        id: 1,
        name: '智能数据分析系统V1.0',
        type: '软件著作权',
        status: 'completed',
        currentStep: 4,
        materials: [
          { name: '源代码压缩包.zip', size: '2.3 MB', status: '已上传' },
          { name: '作品说明书.pdf', size: '345 KB', status: '已上传' },
          { name: '著作权登记申请表.pdf', size: '156 KB', status: '已上传' },
          { name: '版权登记证书.pdf', size: '289 KB', status: '已核发' }
        ]
      },
      {
        id: 2,
        name: '用户管理模块V2.0',
        type: '软件著作权',
        status: 'reviewing',
        currentStep: 3,
        materials: [
          { name: '源代码压缩包.zip', size: '1.8 MB', status: '已上传' },
          { name: '作品说明书.pdf', size: '267 KB', status: '已上传' },
          { name: '著作权登记申请表.pdf', size: '156 KB', status: '已上传' }
        ]
      },
      {
        id: 3,
        name: '数据可视化平台',
        type: '软件著作权',
        status: 'accepted',
        currentStep: 2,
        materials: [
          { name: '源代码压缩包.zip', size: '3.1 MB', status: '已上传' },
          { name: '作品说明书.pdf', size: '412 KB', status: '已上传' },
          { name: '著作权登记申请表.pdf', size: '156 KB', status: '已上传' }
        ]
      },
      {
        id: 4,
        name: 'API网关系统',
        type: '软件著作权',
        status: 'submitted',
        currentStep: 1,
        materials: [
          { name: '源代码压缩包.zip', size: '1.2 MB', status: '已上传' },
          { name: '作品说明书.pdf', size: '198 KB', status: '已上传' }
        ]
      }
    ];

    const completedSteps = works.reduce((s, w) => s + w.currentStep + 1, 0);
    const totalSteps = works.length * 5;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    setDetailData({
      batch,
      works,
      progressPercent,
      completedSteps,
      totalSteps
    });
    setShowDetail(true);
  };

  const statusMap = { processing: { label: '处理中', color: '#1890ff' }, completed: { label: '已完成', color: '#52c41a' }, failed: { label: '部分失败', color: '#faad14' } };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>📦 版权批量登记</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>批量提交版权登记申请，高效管理登记进度</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setShowModal(true)}>+ 新建批量登记</button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}><div style={styles.statValue}>{batches.length}</div><div style={styles.statLabel}>登记批次</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{batches.reduce((s, b) => s + b.total_count, 0)}</div><div style={styles.statLabel}>总登记数</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{batches.reduce((s, b) => s + b.success_count, 0)}</div><div style={styles.statLabel}>成功数</div></div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>登记批次列表</h3>
        <div style={styles.batchList}>
          {batches.map(b => (
            <div key={b.id} style={styles.batchItem}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{b.batch_name}</div>
                <div style={{ fontSize: '13px', color: '#595959' }}>
                  共 <strong>{b.total_count}</strong> 件 ·
                  成功 <strong style={{ color: '#52c41a' }}>{b.success_count}</strong> ·
                  失败 <strong style={{ color: '#f5222d' }}>{b.failed_count}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#bfbfbf', marginTop: '4px' }}>{b.created_at}</div>
              </div>
              <span style={{ ...styles.badge, background: (statusMap[b.status] || statusMap.processing).color + '20', color: (statusMap[b.status] || statusMap.processing).color, marginRight: '12px' }}>
                {(statusMap[b.status] || statusMap.processing).label}
              </span>
              <button style={styles.detailBtn} onClick={() => viewBatchDetail(b)}>详情</button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ ...styles.modal, maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>新建批量登记</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>批次名称 *</label>
                <input style={styles.input} placeholder="如：2024Q2软件著作权登记" value={formData.batch_name} onChange={e => setFormData(p => ({ ...p, batch_name: e.target.value }))} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px' }}>作品列表 *</label>
                  <button type="button" style={styles.addBtn} onClick={addWork}>+ 添加作品</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto' }}>
                  {formData.works.map((work, i) => (
                    <div key={i} style={styles.workItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1890ff' }}>作品 {i + 1}</span>
                        {formData.works.length > 1 && <button type="button" onClick={() => removeWork(i)} style={styles.removeBtn}>× 删除</button>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>作品名称 *</label>
                          <input style={styles.input} placeholder="作品名称" value={work.name} onChange={e => updateWork(i, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>作品类型</label>
                          <select style={styles.input} value={work.type} onChange={e => updateWork(i, 'type', e.target.value)}>
                            <option value="软件著作权">软件著作权</option>
                            <option value="文字作品">文字作品</option>
                            <option value="美术作品">美术作品</option>
                            <option value="视听作品">视听作品</option>
                            <option value="音乐作品">音乐作品</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>作者</label>
                          <input style={styles.input} placeholder="作者姓名" value={work.author} onChange={e => updateWork(i, 'author', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>权利归属方式</label>
                          <select style={styles.input} value={work.ownership} onChange={e => updateWork(i, 'ownership', e.target.value)}>
                            <option value="个人">个人</option>
                            <option value="公司">公司</option>
                            <option value="合作">合作</option>
                            <option value="委托">委托</option>
                            <option value="职务">职务作品</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>创作完成日期</label>
                          <input type="date" style={styles.input} value={work.creation_date} onChange={e => updateWork(i, 'creation_date', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>首次发表日期</label>
                          <input type="date" style={styles.input} value={work.publish_date} onChange={e => updateWork(i, 'publish_date', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#8c8c8c' }}>源文件上传</label>
                        {work.source_file ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                            <span style={{ fontSize: '13px' }}>📄 {work.source_file.name} <span style={{ color: '#8c8c8c', marginLeft: '8px' }}>{work.source_file.size}</span></span>
                            <button type="button" style={{ ...styles.removeBtn, padding: '2px 8px', fontSize: '12px' }} onClick={() => updateWork(i, 'source_file', null)}>移除</button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', border: '2px dashed #d9d9d9', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#8c8c8c' }}>
                            <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileSelect(i, e)} />
                            <span>📎 点击上传源文件（源代码、文档等）</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" style={styles.submitBtn}>提交登记</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailData && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={{ ...styles.modal, maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📦 批次详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><span style={{ color: '#8c8c8c' }}>批次名称：</span><strong>{detailData.batch.batch_name}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>批次状态：</span>
                  <span style={{ ...styles.badge, background: (statusMap[detailData.batch.status] || statusMap.processing).color + '20', color: (statusMap[detailData.batch.status] || statusMap.processing).color }}>
                    {(statusMap[detailData.batch.status] || statusMap.processing).label}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>总作品数：</span>{detailData.batch.total_count} 件</div>
                <div><span style={{ color: '#8c8c8c' }}>创建时间：</span>{detailData.batch.created_at}</div>
                <div><span style={{ color: '#8c8c8c' }}>成功数：</span><span style={{ color: '#52c41a' }}>{detailData.batch.success_count} 件</span></div>
                <div><span style={{ color: '#8c8c8c' }}>失败数：</span><span style={{ color: '#f5222d' }}>{detailData.batch.failed_count} 件</span></div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>📊 整体进度</h4>
              <div style={{ background: '#f0f0f0', borderRadius: '10px', height: '20px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #1890ff, #52c41a)', width: detailData.progressPercent + '%', borderRadius: '10px', transition: 'width 0.3s' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8c8c8c' }}>
                <span>已完成 {detailData.completedSteps} / {detailData.totalSteps} 个步骤</span>
                <span style={{ fontWeight: '600', color: '#52c41a' }}>{detailData.progressPercent}%</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>📋 进度图例</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                {workStatusSteps.map((step, idx) => (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.color + '20', color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>{idx + 1}</div>
                      <span style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px', whiteSpace: 'nowrap' }}>{step.label}</span>
                    </div>
                    {idx < workStatusSteps.length - 1 && (
                      <div style={{ position: 'absolute', left: '60%', right: '-40%', height: '2px', background: '#e8e8e8', top: '14px', zIndex: 0 }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <h4 style={{ margin: '0 0 12px 0' }}>📝 作品登记进度</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              {detailData.works.map((work, wIdx) => (
                <div key={work.id} style={styles.workDetailItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontWeight: '600' }}>{work.name}</span>
                      <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: '8px' }}>{work.type}</span>
                    </div>
                    <span style={{ ...styles.badge, background: workStatusSteps[work.currentStep].color + '20', color: workStatusSteps[work.currentStep].color }}>
                      {workStatusSteps[work.currentStep].label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', position: 'relative' }}>
                    {workStatusSteps.map((step, idx) => (
                      <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, minWidth: '60px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: idx <= work.currentStep ? step.color : '#f0f0f0',
                            color: idx <= work.currentStep ? '#fff' : '#bfbfbf',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {idx <= work.currentStep ? '✓' : idx + 1}
                          </div>
                        </div>
                        {idx < workStatusSteps.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            right: '0',
                            height: '2px',
                            background: idx < work.currentStep ? workStatusSteps[idx + 1].color : '#f0f0f0',
                            top: '12px',
                            zIndex: 0
                          }}></div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>材料记录 ({work.materials.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {work.materials.map((m, mIdx) => (
                        <div key={mIdx} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px'
                        }}>
                          <div>
                            <span>📄 {m.name}</span>
                            <span style={{ marginLeft: '8px', color: '#8c8c8c' }}>{m.size}</span>
                          </div>
                          <span style={{ color: '#52c41a' }}>{m.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button style={styles.pageBtn} onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  primaryBtn: { padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#1890ff' },
  statLabel: { fontSize: '13px', color: '#8c8c8c', marginTop: '4px' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' },
  batchList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  batchItem: { display: 'flex', alignItems: 'center', padding: '16px', background: '#fafafa', borderRadius: '10px' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  detailBtn: { padding: '6px 16px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' },
  input: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  addBtn: { padding: '6px 14px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  removeBtn: { padding: '6px 12px', background: '#fff1f0', border: 'none', borderRadius: '6px', color: '#f5222d', cursor: 'pointer', fontSize: '13px' },
  cancelBtn: { padding: '10px 24px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  pageBtn: { padding: '6px 14px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  workItem: { padding: '16px', background: '#fafafa', borderRadius: '10px', border: '1px solid #f0f0f0' },
  workDetailItem: { padding: '16px', background: '#fafafa', borderRadius: '10px', border: '1px solid #f0f0f0' }
};
