import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handleModal, setHandleModal] = useState(null);
  const [handleResult, setHandleResult] = useState('auto_block');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiService.getAlarmRecords();
      setAlarms(res.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAlarm = async () => {
    try {
      await apiService.handleAlarm(handleModal, { handle_result: handleResult });
      setHandleModal(null);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const getResultLabel = (result) => {
    const labels = {
      auto_block: '自动拦截',
      manual_review: '人工复核',
      watch: '继续观察',
      closed: '已关闭'
    };
    return labels[result] || result;
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">告警记录</h1>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>告警类型</th>
                <th>严重级别</th>
                <th>来源</th>
                <th>消息</th>
                <th>处理结果</th>
                <th>处理人</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {alarms.map(alarm => (
                <tr key={alarm.id}>
                  <td>{alarm.alarm_type}</td>
                  <td><span className={`badge badge-${alarm.severity}`}>{alarm.severity === 'high' ? '高' : alarm.severity === 'medium' ? '中' : '低'}</span></td>
                  <td>{alarm.source}</td>
                  <td style={{ maxWidth: '300px' }}>{alarm.message}</td>
                  <td>
                    {alarm.handle_result ? (
                      <span className={`badge badge-${alarm.handle_result === 'auto_block' ? 'auto' : alarm.handle_result === 'manual_review' ? 'manual' : alarm.handle_result === 'watch' ? 'watch' : 'closed'}`}>
                        {getResultLabel(alarm.handle_result)}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{alarm.handler_name || '-'}</td>
                  <td>{new Date(alarm.created_at).toLocaleString()}</td>
                  <td>
                    {!alarm.handle_result && (
                      <button className="btn btn-primary btn-sm" onClick={() => setHandleModal(alarm.id)}>处理</button>
                    )}
                  </td>
                </tr>
              ))}
              {alarms.length === 0 && (
                <tr><td colSpan="8" className="empty-state">暂无告警记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {handleModal && (
        <div className="modal-overlay" onClick={() => setHandleModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>处理告警</h2>
              <button className="modal-close" onClick={() => setHandleModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>处理结果</label>
                <select value={handleResult} onChange={e => setHandleResult(e.target.value)}>
                  <option value="auto_block">自动拦截</option>
                  <option value="manual_review">人工复核</option>
                  <option value="watch">继续观察</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setHandleModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleAlarm}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alarms;
