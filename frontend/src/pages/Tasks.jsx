import React, { useState, useEffect } from 'react';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    fetch('/api/tasks')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setTasks(data);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, []);

  function handleExecute(id, taskName) {
    fetch('/api/tasks/' + id + '/execute', { method: 'POST' })
      .then(function() {
        alert('任务 ' + taskName + ' 已触发执行！\n\n执行结果将在2秒后更新，请点击左侧「执行记录」菜单查看详细执行日志。');
      })
      .catch(function() {
        alert('任务执行触发失败，请稍后重试');
      });
  }

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>⚡ 任务调度</h1>
        <p>配置和管理定时任务、即时任务</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>任务列表</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>任务名称</th>
              <th>应用</th>
              <th>环境</th>
              <th>类型</th>
              <th>状态</th>
              <th>创建人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(function(task) {
              return (
                <tr key={task.id}>
                  <td><strong>{task.name}</strong></td>
                  <td>{task.app_name}</td>
                  <td>{task.env_name}</td>
                  <td><span className="tag">{task.type}</span></td>
                  <td><span className={'status-badge status-' + task.status}>{task.status}</span></td>
                  <td>{task.created_by}</td>
                  <td>
                    <button className="btn btn-sm btn-success" onClick={function() { handleExecute(task.id, task.name); }}>执行</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tasks;
