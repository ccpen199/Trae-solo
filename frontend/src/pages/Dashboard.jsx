import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function DashboardPage({ currentUser }) {
  const [overview, setOverview] = useState(null);
  const [durationData, setDurationData] = useState([]);
  const [retentionData, setRetentionData] = useState([]);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hostContributions, setHostContributions] = useState([]);
  const [violationSummary, setViolationSummary] = useState(null);
  const [topRooms, setTopRooms] = useState([]);
  const [days, setDays] = useState(7);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [loadError, setLoadError] = useState(null);

  const loadAll = () => {
    setLoadError(null);
    api.dashboardOverview().then(r => setOverview(r)).catch(e => {
      setLoadError(e.message || '加载失败');
      setOverview({});
    });
    api.dashboardDuration(days).then(r => setDurationData(r.data || [])).catch(() => {});
    api.dashboardRetention(days).then(r => setRetentionData(r.data || [])).catch(() => {});
    api.dashboardPayments({ days, page: paymentPage, pageSize: 10 }).then(r => {
      setPayments(r.payments || []);
      setPaymentTotal(r.total || 0);
    }).catch(() => {});
    api.dashboardCategories().then(r => setCategories(r.data || [])).catch(() => {});
    api.dashboardHostContributions(days, 10).then(r => setHostContributions(r.data || [])).catch(() => {});
    api.dashboardViolations(days).then(r => setViolationSummary(r)).catch(() => {});
    api.dashboardTopRooms(10).then(r => setTopRooms(r.data || [])).catch(() => {});
  };

  useEffect(() => { loadAll(); }, [days, paymentPage]);

  if (!overview || Object.keys(overview).length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        {loadError ? (
          <div style={{ color: '#e74c3c' }}>⚠️ {loadError}</div>
        ) : (
          <div style={{ color: '#888' }}>加载中...</div>
        )}
      </div>
    );
  }

  return (
    <div>
      {loadError && (
        <div style={{ background: '#3a2a2a', border: '1px solid #e74c3c', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#e74c3c', fontSize: '13px' }}>
          ⚠️ {loadError}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', fontSize: '22px' }}>运营看板</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => { setDays(d); setPaymentPage(1); }}
              style={{ ...styles.filterBtn, background: days === d ? '#5b5fc7' : '#2a2a4e' }}>
              近 {d} 天
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: '开放房间数', value: overview.totalRooms, color: '#3498db' },
          { label: '总用户数', value: overview.totalUsers, color: '#2ecc71' },
          { label: '房主数', value: overview.totalHosts, color: '#9b59b6' },
          { label: '在线人数', value: overview.totalOnline, color: '#f39c12' },
          { label: '今日付费', value: '¥' + overview.todayPayment, color: '#e74c3c' },
          { label: '今日时长(分)', value: overview.todayDuration, color: '#1abc9c' },
          { label: '待处理举报', value: overview.pendingReports, color: '#e67e22' },
          { label: '待处理审核', value: overview.pendingReviews, color: '#34495e' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={styles.panel}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>房间时长趋势</h3>
          {durationData.length === 0 ? (
            <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {durationData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#888', fontSize: '12px', width: '80px' }}>{d.date}</span>
                  <div style={{ flex: 1, height: '8px', background: '#2a2a4e', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (d.total_minutes / Math.max(...durationData.map(x => x.total_minutes))) * 100)}%`, height: '100%', background: '#5b5fc7', borderRadius: '4px' }} />
                  </div>
                  <span style={{ color: '#aaa', fontSize: '12px', width: '80px', textAlign: 'right' }}>{d.total_minutes}分 ({d.room_count}房)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.panel}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>热门品类</h3>
          {categories.length === 0 ? (
            <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#1a1a2e', borderRadius: '6px' }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>{c.category}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888' }}>
                    <span>房间: {c.room_count}</span>
                    <span>开放: {c.open_count}</span>
                    <span style={{ color: '#f39c12' }}>🔥 {c.total_popularity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={styles.panel}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>房主贡献排行</h3>
          {hostContributions.length === 0 ? (
            <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {hostContributions.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#1a1a2e', borderRadius: '6px' }}>
                  <span style={{ color: '#f39c12', fontWeight: 700, width: '20px' }}>#{i + 1}</span>
                  <span style={{ color: '#fff', fontSize: '13px', flex: 1 }}>{h.nickname}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{h.room_count}房</span>
                  <span style={{ color: '#f39c12', fontSize: '12px' }}>🔥{h.total_popularity}</span>
                  <span style={{ color: '#2ecc71', fontSize: '12px' }}>¥{h.total_payment}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.panel}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>热门房间 TOP 10</h3>
          {topRooms.length === 0 ? (
            <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topRooms.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#1a1a2e', borderRadius: '6px' }}>
                  <span style={{ color: '#f39c12', fontWeight: 700, width: '20px' }}>#{i + 1}</span>
                  <span style={{ color: '#fff', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.topic}</span>
                  <span style={{ color: '#888', fontSize: '11px' }}>{r.category}</span>
                  <span style={{ color: '#f39c12', fontSize: '12px' }}>🔥{r.popularity}</span>
                  <span style={{ color: '#3498db', fontSize: '12px' }}>👥{r.online_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={styles.panel}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>违规统计</h3>
          {violationSummary ? (
            <div>
              <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
                总违规数: <span style={{ color: '#e74c3c', fontWeight: 600 }}>{violationSummary.total}</span>
              </div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                <div style={{ color: '#888', marginBottom: '6px' }}>按严重程度:</div>
                {violationSummary.bySeverity.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#aaa' }}>{s.severity === 'severe' ? '严重' : s.severity === 'major' ? '较重' : '轻微'}</span>
                    <span style={{ color: s.severity === 'severe' ? '#e74c3c' : s.severity === 'major' ? '#f39c12' : '#3498db' }}>{s.cnt} 条</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '13px' }}>
                <div style={{ color: '#888', marginBottom: '6px' }}>按类型:</div>
                {violationSummary.byType.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#aaa' }}>{t.type}</span>
                    <span style={{ color: '#9b59b6' }}>{t.cnt} 条</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
          )}
        </div>

        <div style={styles.panel}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>付费记录</h3>
          {payments.length === 0 ? (
            <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflow: 'auto' }}>
              {payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#1a1a2e', borderRadius: '6px' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px' }}>{p.user_name}</div>
                    <div style={{ color: '#888', fontSize: '11px' }}>{p.description || p.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#2ecc71', fontSize: '14px', fontWeight: 600 }}>¥{p.amount}</div>
                    <div style={{ color: '#666', fontSize: '10px' }}>{p.created_at?.slice(5, 16)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {paymentTotal > 10 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              <button disabled={paymentPage === 1} onClick={() => setPaymentPage(p => p - 1)} style={styles.pageBtn}>上一页</button>
              <span style={{ color: '#888', alignSelf: 'center' }}>第 {paymentPage} 页</span>
              <button disabled={paymentPage * 10 >= paymentTotal} onClick={() => setPaymentPage(p => p + 1)} style={styles.pageBtn}>下一页</button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.panel}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>用户留存趋势</h3>
        {retentionData.length === 0 ? (
          <div style={{ color: '#666', fontSize: '13px' }}>暂无数据</div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', overflow: 'auto', paddingBottom: '8px' }}>
            {retentionData.map((d, i) => (
              <div key={i} style={{ flex: '0 0 120px', background: '#1a1a2e', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>{d.date}</div>
                <div style={{ color: '#3498db', fontSize: '18px', fontWeight: 600 }}>{d.users}</div>
                <div style={{ color: '#666', fontSize: '11px' }}>用户 / {d.rooms} 房</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px', padding: '16px' },
  statCard: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '10px', padding: '16px' },
  filterBtn: { padding: '8px 16px', borderRadius: '6px', color: '#fff', fontSize: '13px', border: 'none' },
  pageBtn: { background: '#2a2a4e', color: '#e0e0e0', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', border: 'none' }
};
