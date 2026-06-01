import React, { useState, useEffect } from 'react';
import { resultsAPI } from '../api';

function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await resultsAPI.getAll();
      setResults(res.data || []);
    } catch (error) {
      console.error('加载结果失败:', error);
    }
  };

  return (
    <div>
      <h2>结果归档</h2>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>客户编号</th>
              <th>客户姓名</th>
              <th>服务结论</th>
              <th>退款状态</th>
              <th>结算金额</th>
              <th>结案时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">暂无归档数据</td></tr>
            ) : (
              results.map(r => (
                <tr key={r.id}>
                  <td>{r.customer_no || '-'}</td>
                  <td>{r.customer_name || '-'}</td>
                  <td style={{ maxWidth: '300px' }}>{r.service_conclusion}</td>
                  <td>
                    <span className={`status-badge ${r.refund_status === 'no_refund' ? 'status-active' : 'status-pending'}`}>
                      {r.refund_status === 'full_refund' ? '全额退款' : r.refund_status === 'partial_refund' ? '部分退款' : '无需退款'}
                    </span>
                  </td>
                  <td>¥{r.final_balance}</td>
                  <td>{r.closed_at ? new Date(r.closed_at).toLocaleDateString() : '-'}</td>
                  <td>
                    {r.before_screenshot && <a href={`/uploads/${r.before_screenshot}`} target="_blank" rel="noreferrer">修复前</a>}
                    {r.after_screenshot && <span> | </span>}
                    {r.after_screenshot && <a href={`/uploads/${r.after_screenshot}`} target="_blank" rel="noreferrer">修复后</a>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Results;
