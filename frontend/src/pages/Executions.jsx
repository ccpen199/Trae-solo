import React, { useState, useEffect } from 'react';

function Executions() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    fetch('/api/audit/executions')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setExecutions(data);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, []);

  function viewDetail(ex) {
    var detail = '执行详情:\n\n';
    detail += '任务名称: ' + ex.task_name + '\n';
    detail += '所属应用: ' + ex.app_name + '\n';
    detail += '执行状态: ' + ex.status + '\n';
    detail += '开始时间: ' + ex.started_at + '\n';
    detail += '结束时间: ' + (ex.ended_at || '执行中') + '\n';
    detail += '执行人: ' + (ex.created_by || 'system') + '\n';
    if (ex.result) {
      detail += '\n执行结果:\n' + ex.result + '\n';
    }
    if (ex.error_log) {
      detail += '\n错误日志:\n' + ex.error_log + '\n';
    }
    alert(detail);
  }

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>执行记录</h1>
        <p>查看所有任务的执行历史和详细日志</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>执行历史</h3>
          <span className="tag">共 {executions.length} 条记录</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>任务名称</th>
              <th>应用</th>
              <th>状态</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {executions.map(function(ex) {
              return (
                <tr key={ex.id}>
                  <td><strong>{ex.task_name}</strong></td>
                  <td>{ex.app_name}</td>
                  <td><span className={'status-badge status-' + ex.status}>{ex.status}</span></td>
                  <td>{ex.started_at}</td>
                  <td>{ex.ended_at || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={function() { viewDetail(ex); }}>
                      查看详情
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {executions.length === 0 && (
          <div className="empty-state">暂无执行记录</div>
        )}
      </div>
    </div>
  );
}

export default Executions;
