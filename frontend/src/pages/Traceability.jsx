import React, { useState } from 'react';
import { apiGet } from '../api.js';

export default function Traceability() {
  const [batchNo, setBatchNo] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!batchNo.trim()) return;
    setLoading(true);
    try {
      const data = await apiGet(`/traceability/${batchNo.trim()}`);
      setTraceData(data);
    } catch (e) {
      setTraceData({ error: '未找到该批次' });
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="header">
        <h1>批次追溯</h1>
      </div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>输入批次号进行追溯查询</label>
            <input 
              value={batchNo} 
              onChange={e => setBatchNo(e.target.value)} 
              placeholder="例如: B20260523001"
              onKeyPress={e => e.key === 'Enter' && search()}
            />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <button className="btn btn-primary" onClick={search} disabled={loading}>
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        </div>
      </div>

      {traceData && (
        <>
          {traceData.error ? (
            <div className="card">
              <div className="alert-box alert-warning">{traceData.error}</div>
            </div>
          ) : (
            <>
              <div className="card">
                <h2>批次信息</h2>
                <div className="form-row">
                  <div><strong>批次号：</strong>{traceData.batch.batch_no}</div>
                  <div><strong>数量：</strong>{traceData.batch.quantity} {traceData.batch.unit}</div>
                  <div><strong>生产日期：</strong>{traceData.batch.production_date}</div>
                  <div><strong>状态：</strong>
                    <span className={`badge ${traceData.batch.status === 'released' ? 'badge-success' : 'badge-warning'}`}>
                      {traceData.batch.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>监测记录 ({traceData.records.length})</h2>
                <table>
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>控制点</th>
                      <th>工序</th>
                      <th>操作员</th>
                      <th>温度</th>
                      <th>时间</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traceData.records.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>暂无监测记录</td></tr>
                    ) : traceData.records.map(r => (
                      <tr key={r.id} style={r.is_violation ? { background: '#fff3cd' } : {}}>
                        <td>{r.record_time}</td>
                        <td>{r.ccp_name}</td>
                        <td>{r.process_name}</td>
                        <td>{r.operator_name}</td>
                        <td>{r.temperature ? `${r.temperature}℃` : '-'}</td>
                        <td>{r.time_value ? `${r.time_value}min` : '-'}</td>
                        <td>
                          {r.is_violation ? (
                            <span className="badge badge-danger">超限</span>
                          ) : (
                            <span className="badge badge-success">正常</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>纠偏行动 ({traceData.actions.length})</h2>
                <table>
                  <thead>
                    <tr>
                      <th>创建时间</th>
                      <th>原因分析</th>
                      <th>处理措施</th>
                      <th>责任人</th>
                      <th>复检结果</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traceData.actions.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center' }}>暂无纠偏行动</td></tr>
                    ) : traceData.actions.map(a => (
                      <tr key={a.id}>
                        <td>{a.created_at}</td>
                        <td style={{ maxWidth: '200px' }}>{a.violation_cause}</td>
                        <td style={{ maxWidth: '200px' }}>{a.treatment_measures}</td>
                        <td>{a.responsible_name}</td>
                        <td>{a.retest_result || '-'}</td>
                        <td>
                          <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                            {a.status === 'completed' ? '已完成' : '处理中'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
