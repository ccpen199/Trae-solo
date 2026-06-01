import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

function Approvals({ user }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const response = await api.get('/approvals');
      setApprovals(response.data);
    } catch (error) {
      console.error('加载审批列表失败:', error);
    }
  };

  const handleApprove = async (approvalId) => {
    if (!confirm('确认通过该审批？')) return;
    
    setLoading(true);
    try {
      await api.post(`/approvals/${approvalId}/approve`, { comment: '同意' });
      alert('审批通过');
      loadApprovals();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (approvalId) => {
    const comment = prompt('请输入拒绝原因：');
    if (comment === null) return;
    
    setLoading(true);
    try {
      await api.post(`/approvals/${approvalId}/reject`, { comment: comment || '拒绝' });
      alert('已拒绝');
      loadApprovals();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>审批中心</h2>

      {approvals.length === 0 ? (
        <div className="empty">暂无待审批事项</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>审批编号</th>
              <th>房源</th>
              <th>客户</th>
              <th>成交单价</th>
              <th>优惠金额</th>
              <th>置业顾问</th>
              <th>审批级别</th>
              <th>申请时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr key={approval.id}>
                <td>#{approval.id}</td>
                <td>{approval.building_name} {approval.unit_number}</td>
                <td>{approval.customer_name}</td>
                <td style={{ color: approval.agreed_price ? '#ff4d4f' : 'inherit' }}>
                  ¥{Number(approval.agreed_price).toLocaleString()}
                </td>
                <td>¥{Number(approval.discount_amount || 0).toLocaleString()}</td>
                <td>{approval.consultant_name}</td>
                <td>
                  <span className="tag tag-warning">
                    {approval.approval_level === 1 ? '一级审批' : '二级审批'}
                  </span>
                </td>
                <td>{approval.created_at}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(approval.id)}
                    disabled={loading}
                    style={{ marginRight: '8px' }}
                  >
                    通过
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(approval.id)}
                    disabled={loading}
                  >
                    拒绝
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Approvals;
