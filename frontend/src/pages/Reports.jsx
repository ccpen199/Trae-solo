import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const res = await api.get('/audit/reports/overview');
      setData(res.data);
    } catch (err) {
      console.error('加载报表失败', err);
    }
  };

  if (!data) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📈 报表统计</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3 style={{ marginBottom: 16 }}>审批统计（按人员）</h3>
            <table>
              <thead>
                <tr>
                  <th>审批人</th>
                  <th>操作</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                {data.approvals_by_user?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td><span className={`status-badge status-${item.action === 'approve' ? 'success' : 'failed'}`}>{item.action === 'approve' ? '通过' : '驳回'}</span></td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ marginBottom: 16 }}>任务状态分布</h3>
            <table>
              <thead>
                <tr>
                  <th>状态</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks_by_status?.map(item => (
                  <tr key={item.status}>
                    <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ marginBottom: 16 }}>变更类型统计</h3>
            <table>
              <thead>
                <tr>
                  <th>变更类型</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                {data.changes_by_type?.map(item => (
                  <tr key={item.change_type}>
                    <td>{item.change_type}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ marginBottom: 16 }}>每日活动（近30天）</h3>
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>变更单</th>
                  <th>任务</th>
                  <th>总计</th>
                </tr>
              </thead>
              <tbody>
                {data.daily_activity?.map(item => (
                  <tr key={item.date}>
                    <td>{item.date}</td>
                    <td>{item.change_orders}</td>
                    <td>{item.tasks}</td>
                    <td><strong>{item.total}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
