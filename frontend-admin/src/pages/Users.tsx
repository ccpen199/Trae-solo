import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';
import { Pagination, Modal } from './Products';

export default function Users() {
  const { showToast } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [page, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/users', { params: { keyword: keyword || undefined, page, pageSize: 20 } });
      if (res.success) { setUsers(res.data.list || []); setTotal(res.data.total || 0); }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const showDetail = (user: any) => setDetail(user);

  const statsCards = [
    { label: '总用户数', value: total, icon: '👥', color: '#6366f1' },
    { label: '有邀请关系', value: users.filter(u => u.referrer_id).length, icon: '🤝', color: '#10b981' },
    { label: '虚拟号段用户', value: users.filter(u => u.is_virtual).length, icon: '⚠️', color: '#f59e0b' },
    { label: '佣金总额', value: `¥${users.reduce((a, b) => a + (b.total_commission || 0), 0).toFixed(0)}`, icon: '💰', color: '#ef4444' }
  ];

  return (
    <div>
      <div className="search-bar">
        <input className="form-input" placeholder="搜索手机号/昵称..." value={keyword}
          onChange={e => { setPage(1); setKeyword(e.target.value); }} style={{ maxWidth: 320 }} />
        <div style={{ flex: 1 }} />
        <span className="text-muted">共 {total} 位用户</span>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {statsCards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="icon" style={{ color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>用户</th>
              <th>手机号</th>
              <th>等级</th>
              <th>余额</th>
              <th>累计佣金</th>
              <th>可提佣金</th>
              <th>邀请人</th>
              <th>号段类型</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            users.length === 0 ? <tr><td colSpan={10} className="empty"><div className="empty-icon">👥</div>暂无用户</td></tr> :
            users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="avatar-sm">{u.nickname?.charAt(0) || '?'}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.nickname}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{u.id?.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace' }}>{u.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</td>
                <td>
                  {u.level > 0 ? <span className="tag tag-purple">VIP {u.level}</span> : <span className="tag tag-gray">普通</span>}
                </td>
                <td style={{ fontWeight: 600 }}>¥{Number(u.balance || 0).toFixed(2)}</td>
                <td style={{ color: '#10b981', fontWeight: 500 }}>¥{Number(u.total_commission || 0).toFixed(2)}</td>
                <td style={{ color: '#6366f1', fontWeight: 600 }}>¥{Number(u.available_commission || 0).toFixed(2)}</td>
                <td>{u.referrer_id ? <span className="tag tag-blue">有</span> : <span className="text-muted">-</span>}</td>
                <td>{u.is_virtual ? <span className="tag tag-orange">虚拟号</span> : <span className="tag tag-green">正常</span>}</td>
                <td style={{ fontSize: 12, color: '#64748b' }}>
                  {u.created_at ? new Date((u.created_at || 0) * 1000).toLocaleDateString() : '-'}
                </td>
                <td>
                  <button className="btn btn-default btn-sm" onClick={() => showDetail(u)}>详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} pageSize={20} />

      {detail && (
        <Modal title={`用户详情 · ${detail.nickname}`} width="600px" onClose={() => setDetail(null)} onOk={() => setDetail(null)} okText="关闭">
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 36, fontWeight: 700
            }}>{detail.nickname?.charAt(0) || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{detail.nickname}</div>
              <div style={{ fontFamily: 'monospace', color: '#64748b' }}>{detail.phone}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {detail.level > 0 && <span className="tag tag-purple">VIP {detail.level}</span>}
                {detail.is_virtual ? <span className="tag tag-orange">虚拟号段</span> : <span className="tag tag-green">正常号码</span>}
                {detail.referrer_id && <span className="tag tag-blue">有邀请人</span>}
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="label">账户余额</div>
              <div className="value">¥{Number(detail.balance || 0).toFixed(2)}</div>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="label">累计佣金</div>
              <div className="value" style={{ color: '#10b981' }}>¥{Number(detail.total_commission || 0).toFixed(2)}</div>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="label">可提佣金</div>
              <div className="value" style={{ color: '#6366f1' }}>¥{Number(detail.available_commission || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="card" style={{ margin: 0, padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>📋 账户信息</div>
            <div className="grid-2">
              <div className="flex-between text-sm mb-8"><span className="text-muted">用户ID</span><span style={{ fontFamily: 'monospace' }}>{detail.id}</span></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">邀请人ID</span><span style={{ fontFamily: 'monospace' }}>{detail.referrer_id || '-'}</span></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">注册时间</span>{detail.created_at ? new Date(detail.created_at * 1000).toLocaleString('zh-CN') : '-'}</div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">最近更新</span>{detail.updated_at ? new Date(detail.updated_at * 1000).toLocaleString('zh-CN') : '-'}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
