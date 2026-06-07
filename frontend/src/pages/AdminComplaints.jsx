import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [handling, setHandling] = useState(null);
  const [resultText, setResultText] = useState({});

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/admin/complaints', { params });
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    if (!resultText[id]) {
      alert('请填写处理结果');
      return;
    }
    setHandling(id);
    try {
      await api.post(`/admin/complaints/${id}/handle`, { result: resultText[id] });
      alert('处理完成');
      setResultText({ ...resultText, [id]: '' });
      fetchComplaints();
    } catch (err) {
      alert('操作失败');
    } finally {
      setHandling(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  const typeMap = {
    damage: '货物破损',
    delay: '配送延迟',
    attitude: '服务态度',
    price: '价格问题',
    other: '其他'
  };

  const statusMap = {
    pending: { text: '待处理', class: 'status-pending' },
    handled: { text: '已处理', class: 'status-completed' }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h2 style={{ marginBottom: '24px' }}>投诉管理中心</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['', 'pending', 'handled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filter === s ? '#ff4d4f' : '#f5f5f5',
              color: filter === s ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {s === '' ? '全部' : statusMap[s].text}
          </button>
        ))}
      </div>

      <div className="card">
        {complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无投诉数据
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {complaints.map(c => (
              <div key={c.id} className="card" style={{ background: '#fafafa', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      订单号：{c.order_no}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      投诉类型：{typeMap[c.type] || c.type}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      订单金额：¥{c.price}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge ${statusMap[c.status]?.class}`}>
                      {statusMap[c.status]?.text}
                    </span>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '12px', background: 'white', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>投诉内容：</div>
                  <div style={{ fontSize: '14px' }}>{c.content}</div>
                </div>

                {c.status === 'handled' && c.result && (
                  <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#52c41a', marginBottom: '4px' }}>处理结果：</div>
                    <div style={{ fontSize: '14px' }}>{c.result}</div>
                  </div>
                )}

                {c.status === 'pending' && (
                  <div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>处理结果</label>
                      <textarea
                        value={resultText[c.id] || ''}
                        onChange={e => setResultText({ ...resultText, [c.id]: e.target.value })}
                        placeholder="请输入处理结果"
                        rows={3}
                      />
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleResolve(c.id)}
                      disabled={handling === c.id}
                    >
                      {handling === c.id ? '处理中...' : '标记已处理'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
