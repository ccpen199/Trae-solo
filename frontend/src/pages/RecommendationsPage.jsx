import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

function RecommendationsPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recommendations?page=${page}&pageSize=${pageSize}`);
      setData(res.data);
    } catch (err) {
      console.error('加载推荐失败:', err);
    }
    setLoading(false);
  };

  const handleFollow = async (userId) => {
    try {
      await api.post(`/recommendations/${userId}/accept`);
      await api.post(`/relations/follow/${userId}`);
      alert('关注成功');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/recommendations/${userId}/reject`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="card">
        <h3>推荐关注</h3>
        {loading ? (
          <div className="empty">加载中...</div>
        ) : data.list.length === 0 ? (
          <div className="empty">暂无推荐</div>
        ) : (
          <div className="user-list">
            {data.list.map(item => (
              <div key={item.id} className="user-item">
                <div className="user-info">
                  <div className="avatar">{item.nickname?.charAt(0) || 'U'}</div>
                  <div className="user-details">
                    <h4>{item.nickname}</h4>
                    <p>{item.bio}</p>
                    {item.reason && (
                      <div className="reason-tag">
                        推荐理由: {item.reason}
                      </div>
                    )}
                    <small>推荐分数: {item.score}</small>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn primary" onClick={() => handleFollow(item.recommended_user_id || item.id)}>
                    关注
                  </button>
                  <button className="btn" onClick={() => handleReject(item.recommended_user_id || item.id)}>
                    不感兴趣
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.total > pageSize && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            <button className="active">{page}</button>
            <button disabled={page * pageSize >= data.total} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsPage;
