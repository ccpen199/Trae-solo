import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function ReviewQueuePage({ currentUser }) {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [reviewItems, setReviewItems] = useState([]);
  const [violations, setViolations] = useState([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [itemTotal, setItemTotal] = useState(0);
  const [violationTotal, setViolationTotal] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const [violationPage, setViolationPage] = useState(1);
  const [reportStatus, setReportStatus] = useState('pending');
  const [itemStatus, setItemStatus] = useState('pending');
  const [reviewForm, setReviewForm] = useState({ conclusion: '', action: '' });
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewingType, setReviewingType] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const loadReports = () => {
    setLoadError(null);
    api.getReports({ status: reportStatus, page: reportPage, pageSize: 10 }).then(r => {
      setReports(r.reports);
      setReportTotal(r.total);
    }).catch(e => setLoadError(e.message || '加载失败'));
  };

  const loadItems = () => {
    setLoadError(null);
    api.getReviewItems({ status: itemStatus, page: itemPage, pageSize: 10 }).then(r => {
      setReviewItems(r.items);
      setItemTotal(r.total);
    }).catch(e => setLoadError(e.message || '加载失败'));
  };

  const loadViolations = () => {
    setLoadError(null);
    api.getViolations({ page: violationPage, pageSize: 10 }).then(r => {
      setViolations(r.violations);
      setViolationTotal(r.total);
    }).catch(e => setLoadError(e.message || '加载失败'));
  };

  useEffect(() => { loadReports(); }, [reportPage, reportStatus]);
  useEffect(() => { loadItems(); }, [itemPage, itemStatus]);
  useEffect(() => { loadViolations(); }, [violationPage]);

  const handleReviewReport = (id) => {
    if (!reviewForm.conclusion) return alert('请填写处理结论');
    api.reviewReport(id, reviewForm).then(() => {
      setReviewingId(null);
      setReviewForm({ conclusion: '', action: '' });
      loadReports();
    }).catch(e => alert(e.message));
  };

  const handleReviewItem = (id) => {
    if (!reviewForm.conclusion) return alert('请填写处理结论');
    api.reviewItem(id, reviewForm).then(() => {
      setReviewingId(null);
      setReviewForm({ conclusion: '', action: '' });
      loadItems();
    }).catch(e => alert(e.message));
  };

  const canReview = currentUser && (currentUser.role === 'reviewer' || currentUser.role === 'admin');

  return (
    <div>
      <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '20px' }}>审核队列</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setTab('reports')} style={tabStyle(tab === 'reports')}>
          举报处理 ({reportTotal})
        </button>
        <button onClick={() => setTab('items')} style={tabStyle(tab === 'items')}>
          审核项 ({itemTotal})
        </button>
        <button onClick={() => setTab('violations')} style={tabStyle(tab === 'violations')}>
          违规记录 ({violationTotal})
        </button>
      </div>

      {loadError && (
        <div style={{ background: '#3a2a2a', border: '1px solid #e74c3c', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#e74c3c', fontSize: '13px' }}>
          ⚠️ {loadError}
        </div>
      )}

      {tab === 'reports' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['pending', 'reviewing', 'reviewed'].map(s => (
              <button key={s} onClick={() => { setReportStatus(s); setReportPage(1); }}
                style={{ ...styles.filterBtn, background: reportStatus === s ? '#5b5fc7' : '#2a2a4e' }}>
                {s === 'pending' ? '待处理' : s === 'reviewing' ? '处理中' : '已处理'}
              </button>
            ))}
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>房间</th>
                  <th style={styles.th}>举报人</th>
                  <th style={styles.th}>被举报人</th>
                  <th style={styles.th}>原因</th>
                  <th style={styles.th}>录音片段</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>处理人</th>
                  <th style={styles.th}>时间</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{r.id}</td>
                    <td style={styles.td}>{r.room_topic || '-'}</td>
                    <td style={styles.td}>{r.reporter_name}</td>
                    <td style={styles.td}>{r.target_name || '-'}</td>
                    <td style={styles.td}>{r.reason}</td>
                    <td style={styles.td}>
                      {r.evidence ? (
                        <span style={{ color: '#3498db', fontFamily: 'monospace', fontSize: '11px' }}>
                          🎤 {r.evidence}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        background: r.status === 'pending' ? '#f39c12' : r.status === 'reviewed' ? '#27ae60' : '#3498db',
                        color: '#fff'
                      }}>{r.status === 'pending' ? '待处理' : r.status === 'reviewing' ? '处理中' : '已处理'}</span>
                    </td>
                    <td style={styles.td}>{r.reviewed_by_name || '-'}</td>
                    <td style={styles.td}>{r.created_at?.slice(0, 16)}</td>
                    <td style={styles.td}>
                      {r.status !== 'reviewed' && canReview && (
                        <button onClick={() => { setReviewingId(r.id); setReviewingType('report'); setReviewForm({ conclusion: '', action: '' }); }}
                          style={styles.miniBtn}>处理</button>
                      )}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan="10" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {reportTotal > 10 && (
            <div style={styles.pagination}>
              <button disabled={reportPage === 1} onClick={() => setReportPage(p => p - 1)} style={styles.pageBtn}>上一页</button>
              <span style={{ color: '#888' }}>第 {reportPage} 页</span>
              <button disabled={reportPage * 10 >= reportTotal} onClick={() => setReportPage(p => p + 1)} style={styles.pageBtn}>下一页</button>
            </div>
          )}
        </div>
      )}

      {tab === 'items' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['pending', 'reviewed'].map(s => (
              <button key={s} onClick={() => { setItemStatus(s); setItemPage(1); }}
                style={{ ...styles.filterBtn, background: itemStatus === s ? '#5b5fc7' : '#2a2a4e' }}>
                {s === 'pending' ? '待处理' : '已处理'}
              </button>
            ))}
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>类型</th>
                  <th style={styles.th}>房间</th>
                  <th style={styles.th}>用户</th>
                  <th style={styles.th}>音频索引</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>处理人</th>
                  <th style={styles.th}>时间</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {reviewItems.map(r => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{r.id}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        background: r.type === 'voice' ? '#e74c3c' : r.type === 'dominate_mic' ? '#f39c12' : '#9b59b6',
                        color: '#fff'
                      }}>{r.type === 'voice' ? '涉敏语音' : r.type === 'dominate_mic' ? '恶意霸麦' : r.type}</span>
                    </td>
                    <td style={styles.td}>{r.room_topic || '-'}</td>
                    <td style={styles.td}>{r.user_name || '-'}</td>
                    <td style={styles.td}>
                      {r.audio_index ? (
                        <span style={{ color: '#3498db', fontFamily: 'monospace', fontSize: '11px' }}>
                          🎤 {r.audio_index}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        background: r.status === 'pending' ? '#f39c12' : '#27ae60', color: '#fff'
                      }}>{r.status === 'pending' ? '待处理' : '已处理'}</span>
                    </td>
                    <td style={styles.td}>{r.reviewed_by_name || '-'}</td>
                    <td style={styles.td}>{r.created_at?.slice(0, 16)}</td>
                    <td style={styles.td}>
                      {r.status !== 'reviewed' && canReview && (
                        <button onClick={() => { setReviewingId(r.id); setReviewingType('item'); setReviewForm({ conclusion: '', action: '' }); }}
                          style={styles.miniBtn}>处理</button>
                      )}
                    </td>
                  </tr>
                ))}
                {reviewItems.length === 0 && (
                  <tr><td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {itemTotal > 10 && (
            <div style={styles.pagination}>
              <button disabled={itemPage === 1} onClick={() => setItemPage(p => p - 1)} style={styles.pageBtn}>上一页</button>
              <span style={{ color: '#888' }}>第 {itemPage} 页</span>
              <button disabled={itemPage * 10 >= itemTotal} onClick={() => setItemPage(p => p + 1)} style={styles.pageBtn}>下一页</button>
            </div>
          )}
        </div>
      )}

      {tab === 'violations' && (
        <div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>用户</th>
                  <th style={styles.th}>房间</th>
                  <th style={styles.th}>类型</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>严重程度</th>
                  <th style={styles.th}>处理措施</th>
                  <th style={styles.th}>时间</th>
                </tr>
              </thead>
              <tbody>
                {violations.map(v => (
                  <tr key={v.id} style={styles.tr}>
                    <td style={styles.td}>{v.id}</td>
                    <td style={styles.td}>{v.user_name}</td>
                    <td style={styles.td}>{v.room_topic || '-'}</td>
                    <td style={styles.td}>{v.type}</td>
                    <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description || '-'}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        background: v.severity === 'severe' ? '#e74c3c' : v.severity === 'major' ? '#f39c12' : '#3498db',
                        color: '#fff'
                      }}>{v.severity === 'severe' ? '严重' : v.severity === 'major' ? '较重' : '轻微'}</span>
                    </td>
                    <td style={styles.td}>{v.action}</td>
                    <td style={styles.td}>{v.created_at?.slice(0, 16)}</td>
                  </tr>
                ))}
                {violations.length === 0 && (
                  <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#666' }}>暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {violationTotal > 10 && (
            <div style={styles.pagination}>
              <button disabled={violationPage === 1} onClick={() => setViolationPage(p => p - 1)} style={styles.pageBtn}>上一页</button>
              <span style={{ color: '#888' }}>第 {violationPage} 页</span>
              <button disabled={violationPage * 10 >= violationTotal} onClick={() => setViolationPage(p => p + 1)} style={styles.pageBtn}>下一页</button>
            </div>
          )}
        </div>
      )}

      {reviewingId && (
        <div style={styles.modalOverlay} onClick={() => setReviewingId(null)}>
          <div style={{ ...styles.modal, width: '550px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>处理审核</h3>
            {reviewingType === 'report' && (
              <div style={styles.evidenceBox}>
                <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>📋 举报详情</div>
                {(() => {
                  const r = reports.find(x => x.id === reviewingId);
                  if (!r) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div><span style={{ color: '#888' }}>房间：</span><span style={{ color: '#fff' }}>{r.room_topic}</span></div>
                      <div><span style={{ color: '#888' }}>举报人：</span><span style={{ color: '#fff' }}>{r.reporter_name}</span></div>
                      <div><span style={{ color: '#888' }}>被举报人：</span><span style={{ color: '#fff' }}>{r.target_name || '-'}</span></div>
                      <div><span style={{ color: '#888' }}>原因：</span><span style={{ color: '#fff' }}>{r.reason}</span></div>
                      <div><span style={{ color: '#888' }}>描述：</span><span style={{ color: '#ccc' }}>{r.description || '-'}</span></div>
                      {r.evidence && (
                        <div><span style={{ color: '#888' }}>🎤 录音片段：</span>
                          <span style={{ color: '#3498db', fontFamily: 'monospace' }}>{r.evidence}</span>
                        </div>
                      )}
                      <div><span style={{ color: '#888' }}>举报时间：</span><span style={{ color: '#ccc' }}>{r.created_at}</span></div>
                    </div>
                  );
                })()}
              </div>
            )}
            {reviewingType === 'item' && (
              <div style={styles.evidenceBox}>
                <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>📋 审核项详情</div>
                {(() => {
                  const r = reviewItems.find(x => x.id === reviewingId);
                  if (!r) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div><span style={{ color: '#888' }}>类型：</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                          background: r.type === 'voice' ? '#e74c3c' : r.type === 'dominate_mic' ? '#f39c12' : '#9b59b6',
                          color: '#fff'
                        }}>{r.type === 'voice' ? '涉敏语音' : r.type === 'dominate_mic' ? '恶意霸麦' : r.type}</span>
                      </div>
                      <div><span style={{ color: '#888' }}>房间：</span><span style={{ color: '#fff' }}>{r.room_topic}</span></div>
                      <div><span style={{ color: '#888' }}>用户：</span><span style={{ color: '#fff' }}>{r.user_name}</span></div>
                      <div><span style={{ color: '#888' }}>描述：</span><span style={{ color: '#ccc' }}>{r.description || '-'}</span></div>
                      {r.audio_index && (
                        <div><span style={{ color: '#888' }}>🎤 音频索引：</span>
                          <span style={{ color: '#3498db', fontFamily: 'monospace' }}>{r.audio_index}</span>
                        </div>
                      )}
                      <div><span style={{ color: '#888' }}>检测时间：</span><span style={{ color: '#ccc' }}>{r.created_at}</span></div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <textarea placeholder="处理结论（必填）" value={reviewForm.conclusion}
                onChange={e => setReviewForm({ ...reviewForm, conclusion: e.target.value })}
                style={{ ...styles.input, minHeight: '80px' }} />
              <select value={reviewForm.action} onChange={e => setReviewForm({ ...reviewForm, action: e.target.value })} style={styles.input}>
                <option value="">选择处理措施（可选）</option>
                <option value="warning">⚠️ 警告</option>
                <option value="mute">🔇 禁言</option>
                <option value="kick">🚪 踢出房间</option>
                <option value="ban">🚫 封禁账号</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setReviewingId(null)} style={{ ...styles.btn, flex: 1 }}>取消</button>
              <button onClick={() => reviewingType === 'report' ? handleReviewReport(reviewingId) : handleReviewItem(reviewingId)}
                style={{ ...styles.primaryBtn, flex: 1 }}>提交处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: '10px 20px', borderRadius: '8px',
    background: active ? '#5b5fc7' : '#1a1a2e',
    color: active ? '#fff' : '#b0b0c0',
    border: '1px solid #2a2a4e',
    fontSize: '14px', fontWeight: active ? 600 : 400
  };
}

const styles = {
  tableWrap: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '12px', background: '#2a2a4e', color: '#fff', fontWeight: 600, borderBottom: '1px solid #3a3a5e' },
  td: { padding: '12px', color: '#ccc', borderBottom: '1px solid #2a2a4e' },
  tr: { transition: 'background 0.15s' },
  filterBtn: { padding: '6px 14px', borderRadius: '6px', color: '#fff', fontSize: '13px', border: 'none' },
  miniBtn: { background: '#5b5fc7', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', border: 'none' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' },
  pageBtn: { background: '#2a2a4e', color: '#e0e0e0', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: 'none' },
  btn: { background: '#2a2a4e', color: '#e0e0e0', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', border: 'none' },
  primaryBtn: { background: '#5b5fc7', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none' },
  input: { background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4e', borderRadius: '6px', padding: '10px 12px', fontSize: '14px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px', padding: '24px', width: '450px', maxWidth: '90%' },
  evidenceBox: { background: '#0f0f1a', border: '1px solid #2a2a4e', borderRadius: '8px', padding: '12px', marginBottom: '12px' }
};
