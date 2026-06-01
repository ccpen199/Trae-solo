import React, { useEffect, useState } from 'react';
import { apiGet } from '../api.js';

export default function SelfTest() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRunTime, setLastRunTime] = useState(null);

  async function runSelfTest() {
    setLoading(true);
    try {
      const data = await apiGet('/self-test/run');
      setResults(data);
      setLastRunTime(new Date().toLocaleString());
    } catch (e) {
      console.error('自测失败:', e);
    }
    setLoading(false);
  }

  useEffect(() => {
    runSelfTest();
  }, []);

  function getStatusClass(status) {
    if (status === 'passed') return 'badge-success';
    if (status === 'warning') return 'badge-warning';
    return 'badge-danger';
  }

  function getStatusText(status) {
    if (status === 'passed') return '通过';
    if (status === 'warning') return '警告';
    return '失败';
  }

  return (
    <div>
      <div className="header">
        <h1>系统自测</h1>
        <button 
          className="btn btn-primary" 
          onClick={runSelfTest} 
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '⏳ 运行中...' : '🔄 重新运行'}
        </button>
      </div>

      {lastRunTime && (
        <div style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
          上次运行时间: {lastRunTime}
        </div>
      )}

      <div className="card">
        <h2>自测结果</h2>
        {loading ? (
          <div className="alert-box alert-warning">
            <strong>正在运行自测...</strong> 请稍候
          </div>
        ) : results.length === 0 ? (
          <p>正在加载自测数据...</p>
        ) : (
          <div>
            {results.map((r, i) => (
              <div key={i} className="self-test-item" style={loading ? { opacity: 0.5 } : {}}>
                <div>
                  <strong>{r.name}</strong>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    {r.details} (数量: {r.count})
                  </div>
                </div>
                <span className={`badge ${getStatusClass(r.status)}`}>
                  {getStatusText(r.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>自测说明</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <p><strong>关键点超限检查：</strong>检查所有监测记录中超限的数据，确保已生成预警</p>
          <p><strong>批次隔离检查：</strong>验证隔离批次是否正确标记，防止不合格产品流出</p>
          <p><strong>记录完整性检查：</strong>检查监测记录的字段完整性，确保数据可追溯</p>
          <p><strong>设备校准过期检查：</strong>预警即将过期或已过期的设备校准记录</p>
          <p><strong>追溯报表验证：</strong>验证批次追溯链路的完整性</p>
        </div>
      </div>
    </div>
  );
}
