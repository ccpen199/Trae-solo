import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [dramaStats, setDramaStats] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrama, setSelectedDrama] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/analytics/summary`).then(r => {
      setSummary(r.data.summary);
      setDramaStats(r.data.dramaStats || []);
      setLoading(false);
    });
    axios.get(`${API_BASE}/analytics`).then(r => {
      setRawData(r.data.data || []);
    });
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">数据分析概览</div>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">📚 剧集总数</div>
              <div className="stat-value">{summary?.total_dramas || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">▶️ 总播放量</div>
              <div className="stat-value">{(summary?.total_plays || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">✅ 总完播量</div>
              <div className="stat-value">{(summary?.total_completions || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">💰 付费转化</div>
              <div className="stat-value">{(summary?.total_payments || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">↩️ 退订/投诉</div>
              <div className="stat-value">{(summary?.total_cancellations || 0) + (summary?.total_complaints || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">剧集数据对比</div>
        </div>
        <div className="card-body">
          {dramaStats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              暂无数据
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>剧集</th>
                    <th>题材</th>
                    <th>状态</th>
                    <th>总播放</th>
                    <th>完播量</th>
                    <th>付费转化</th>
                    <th>完播率</th>
                    <th>转化率</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {dramaStats.map(d => (
                    <tr key={d.id}>
                      <td>{d.title}</td>
                      <td>{d.genre}</td>
                      <td>
                        <span className={`badge ${d.shelf_status === 'published' ? 'badge-published' : d.shelf_status === 'review' ? 'badge-review' : 'badge-draft'}`}>
                          {d.shelf_status === 'published' ? '已上架' : d.shelf_status === 'review' ? '审核中' : '草稿'}
                        </span>
                      </td>
                      <td>{(d.total_plays || 0).toLocaleString()}</td>
                      <td>{(d.total_completions || 0).toLocaleString()}</td>
                      <td>{(d.total_payments || 0).toLocaleString()}</td>
                      <td>{(d.completion_rate * 100).toFixed(1)}%</td>
                      <td>{(d.conversion_rate * 100).toFixed(1)}%</td>
                      <td>
                        <span className="action-link" onClick={() => setSelectedDrama(d.id)}>详情</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedDrama && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              分集数据 - {dramaStats.find(d => d.id == selectedDrama)?.title}
            </div>
            <span className="action-link" onClick={() => setSelectedDrama('')}>关闭</span>
          </div>
          <div className="card-body">
            {(() => {
              const epData = rawData.filter(a => a.drama_id == selectedDrama);
              if (epData.length === 0) {
                return (
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    暂无分集数据
                  </div>
                );
              }
              return (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>分集</th>
                        <th>播放</th>
                        <th>完播</th>
                        <th>转化</th>
                        <th>退订</th>
                        <th>投诉</th>
                        <th>流失点(秒)</th>
                        <th>日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {epData.map(a => (
                        <tr key={a.id}>
                          <td>{a.episode_number ? `第${a.episode_number}集` : '整剧'}</td>
                          <td>{a.play_count.toLocaleString()}</td>
                          <td>{a.completion_count.toLocaleString()}</td>
                          <td>{a.payment_conversion.toLocaleString()}</td>
                          <td>{a.cancellation_count}</td>
                          <td>{a.complaint_count}</td>
                          <td>{a.dropoff_point}s</td>
                          <td>{a.stat_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">原始数据</div>
        </div>
        <div className="card-body">
          {rawData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              暂无数据
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>剧集</th>
                    <th>分集</th>
                    <th>播放</th>
                    <th>完播</th>
                    <th>转化</th>
                    <th>退订</th>
                    <th>投诉</th>
                    <th>流失点</th>
                    <th>日期</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 50).map(a => (
                    <tr key={a.id}>
                      <td>{a.drama_title}</td>
                      <td>{a.episode_number ? `第${a.episode_number}集` : '整剧'}</td>
                      <td>{a.play_count.toLocaleString()}</td>
                      <td>{a.completion_count.toLocaleString()}</td>
                      <td>{a.payment_conversion.toLocaleString()}</td>
                      <td>{a.cancellation_count}</td>
                      <td>{a.complaint_count}</td>
                      <td>{a.dropoff_point}s</td>
                      <td>{a.stat_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
