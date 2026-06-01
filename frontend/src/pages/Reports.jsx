import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api.js';

function Reports() {
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.exportAudits();
      if (res.data.success) {
        setExportData(res.data.data);
      }
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h2>📈 报表导出</h2>
      </div>

      <div className="card">
        <h3>审计台账导出</h3>
        <p style={{ marginBottom: '16px', color: '#7f8c8d' }}>
          导出完整的审计数据，包含所有审计任务、风险记录和整改任务的详细信息，支持下钻查看具体记录。
        </p>
        <button 
          className="btn btn-primary" 
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? '导出中...' : '导出审计报表 (JSON)'}
        </button>

        {exportData && (
          <div style={{ marginTop: '20px' }}>
            <div className="alert alert-success">
              导出成功！共 {exportData.length} 条审计记录
            </div>
            <div style={{ marginBottom: '12px' }}>
              <button className="btn btn-success" onClick={handleDownloadJson}>
                ⬇️ 下载 JSON 文件
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflow: 'auto', background: '#f8f9fa', padding: '12px', borderRadius: '4px' }}>
              <pre style={{ fontSize: '12px' }}>{JSON.stringify(exportData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>导出数据说明</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '8px' }}>📋 包含内容</h4>
            <ul style={{ color: '#7f8c8d', lineHeight: '1.8' }}>
              <li>审计任务基本信息</li>
              <li>关联材料列表</li>
              <li>检测到的风险记录</li>
              <li>整改任务及状态</li>
              <li>复核记录和证据</li>
              <li>操作日志</li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '8px' }}>🔍 数据下钻</h4>
            <ul style={{ color: '#7f8c8d', lineHeight: '1.8' }}>
              <li>每个审计包含风险数组</li>
              <li>每个风险包含整改数组</li>
              <li>每个整改包含复核记录</li>
              <li>可追溯完整业务链路</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
