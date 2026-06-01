import React, { useState, useEffect } from 'react';
import { materialsAPI } from '../api';

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditingId, setAuditingId] = useState(null);

  useEffect(() => {
    loadMaterials();
  }, [filter]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialsAPI.getAll({ status: filter });
      setMaterials(res.data || []);
    } catch (error) {
      console.error('加载材料失败:', error);
    }
    setLoading(false);
  };

  const handleAudit = async (id, status) => {
    setAuditingId(id);
    try {
      await materialsAPI.audit(id, { status, audit_remark: '' });
      alert(status === 'approved' ? '材料审核通过！' : '材料已驳回');
      loadMaterials();
    } catch (error) {
      console.error('审核失败:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('审核失败，请重试');
      }
    } finally {
      setAuditingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      approved: 'status-active',
      pending: 'status-pending',
      submitted: 'status-processing',
      rejected: 'status-rejected'
    };
    return `status-badge ${statusMap[status] || 'status-pending'}`;
  };

  const getStatusText = (status) => {
    const map = { approved: '已通过', pending: '待提交', submitted: '待审核', rejected: '已驳回' };
    return map[status] || status;
  };

  return (
    <div>
      <h2>材料审核</h2>

      <div className="filter-bar">
        <span>状态筛选：</span>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">全部</option>
          <option value="pending">待提交</option>
          <option value="submitted">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px' }}>正在加载材料数据...</div>
        ) : materials.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>暂无材料数据</div>
            <div style={{ fontSize: '14px', color: '#999' }}>添加客户后系统会自动生成所需材料清单</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>客户编号</th>
                <th>客户姓名</th>
                <th>材料类型</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>审核时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td>{m.customer_no || '-'}</td>
                  <td>{m.customer_name || '-'}</td>
                  <td>{m.material_name}</td>
                  <td><span className={getStatusBadgeClass(m.status)}>{getStatusText(m.status)}</span></td>
                  <td>{m.submitted_at ? new Date(m.submitted_at).toLocaleDateString() : '-'}</td>
                  <td>{m.audit_at ? new Date(m.audit_at).toLocaleDateString() : '-'}</td>
                  <td>
                {m.status === 'submitted' && (
                  <>
                    <button className="btn btn-sm btn-success" style={{ marginRight: '5px' }} onClick={() => handleAudit(m.id, 'approved')} disabled={auditingId === m.id}>
                      {auditingId === m.id ? '处理中...' : '通过'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleAudit(m.id, 'rejected')} disabled={auditingId === m.id}>
                      {auditingId === m.id ? '处理中...' : '驳回'}
                    </button>
                  </>
                )}
                {m.file_path && <a href={`/uploads/${m.file_path}`} target="_blank" rel="noreferrer">查看附件</a>}
              </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Materials;
