import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';

const eventTypeMap = { filing: '立案', evidence: '证据交换', hearing: '开庭审理', judgment: '判决', mediation: '调解', appeal: '上诉', other: '其他' };

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ event_type: 'hearing', event_date: '', description: '' });

  useEffect(() => { fetchCase(); }, [id]);

  const fetchCase = async () => {
    try { const res = await api.get(`/manager/cases/${id}`); setCaseData(res.data); }
    catch (err) { alert('加载失败'); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.event_date || !formData.description) { alert('请填写完整信息'); return; }
    try {
      await api.post(`/manager/cases/${id}/timeline`, formData);
      alert('添加成功！'); setShowAdd(false);
      setFormData({ event_type: 'hearing', event_date: '', description: '' });
      fetchCase();
    } catch (err) { alert('添加失败'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;
  if (!caseData) return <div style={{ padding: '40px' }}>案件不存在</div>;

  return (
    <div style={styles.container}>
      <Link to="/manager/cases" style={styles.backLink}>← 返回案件列表</Link>

      <div style={styles.caseInfo}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px' }}>{caseData.case_name}</h1>
            <span style={styles.badge}>{caseData.status === 'active' ? '进行中' : '已结案'}</span>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#8c8c8c', marginBottom: '16px' }}>{caseData.case_number}</div>
          <div style={styles.infoGrid}>
            <div><span style={styles.label}>案件类型：</span>{caseData.case_type?.replace('_', ' ')}</div>
            <div><span style={styles.label}>客户：</span>{caseData.client_name || '-'}</div>
            <div><span style={styles.label}>法院：</span>{caseData.court || '-'}</div>
            <div><span style={styles.label}>涉案金额：</span><span style={{ color: '#fa8c16', fontWeight: '500' }}>¥{caseData.case_value?.toLocaleString() || '-'}</span></div>
            <div><span style={styles.label}>对方当事人：</span>{caseData.opposing_party || '-'}</div>
            <div><span style={styles.label}>立案日期：</span>{caseData.filing_date || '-'}</div>
            {caseData.outcome && <div style={{ gridColumn: '1/-1' }}><span style={styles.label}>处理结果：</span>{caseData.outcome}</div>}
          </div>
        </div>
      </div>

      <div style={styles.timelineCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>📋 案件时间轴</h3>
          <button style={styles.addBtn} onClick={() => setShowAdd(true)}>+ 添加事件</button>
        </div>
        <div style={styles.timeline}>
          {caseData.timeline?.map((event, index) => (
            <div key={event.id} style={styles.timelineItem}>
              <div style={styles.timelineLine}></div>
              <div style={styles.timelineDot}></div>
              <div style={styles.timelineContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600' }}>{eventTypeMap[event.event_type] || event.event_type}</span>
                  <span style={{ color: '#8c8c8c', fontSize: '13px' }}>{event.event_date}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#595959' }}>{event.description}</div>
                <div style={{ fontSize: '12px', color: '#bfbfbf', marginTop: '6px' }}>记录人：{event.created_by_name || '-'}</div>
              </div>
            </div>
          ))}
          {!caseData.timeline?.length && <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>暂无时间轴记录</div>}
        </div>
      </div>

      {showAdd && (
        <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0' }}>添加时间轴事件</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>事件类型</label>
                <select style={styles.input} value={formData.event_type} onChange={e => setFormData(p => ({ ...p, event_type: e.target.value }))}>
                  {Object.entries(eventTypeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>事件日期 *</label>
                <input type="date" style={styles.input} value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>事件描述 *</label>
                <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="请输入事件详细描述..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowAdd(false)}>取消</button>
                <button type="submit" style={styles.submitBtn}>添加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  backLink: { color: '#1890ff', textDecoration: 'none', fontSize: '14px' },
  caseInfo: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex' },
  badge: { padding: '4px 12px', background: '#e6f7ff', color: '#1890ff', borderRadius: '20px', fontSize: '12px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '14px' },
  label: { color: '#8c8c8c' },
  timelineCard: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  timeline: { position: 'relative' },
  timelineItem: { position: 'relative', padding: '0 0 24px 28px' },
  timelineLine: { position: 'absolute', left: '7px', top: '10px', bottom: '0', width: '2px', background: '#f0f0f0' },
  timelineDot: { position: 'absolute', left: '0', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#1890ff', border: '3px solid #e6f7ff' },
  timelineContent: { background: '#fafafa', padding: '14px 16px', borderRadius: '8px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '500px' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  cancelBtn: { padding: '10px 24px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
};
