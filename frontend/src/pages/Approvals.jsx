import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { approvalsAPI } from '../api';

function Approvals() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [approvals, setApprovals] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const roleStageMap = {
    construction: 'construction',
    supervision: 'supervision',
    owner: 'owner',
    cost: 'cost',
    admin: null
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    try {
      const res = await approvalsAPI.getAll(filterType || undefined);
      const approvalDetails = await Promise.all(
        res.data.map(async (item) => {
          try {
            const detailRes = await approvalsAPI.getById(item.id);
            return { ...item, details: detailRes.data };
          } catch {
            return item;
          }
        })
      );
      setApprovals(approvalDetails);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '审批中', class: 'badge-pending' },
      approved: { text: '已通过', class: 'badge-approved' },
      rejected: { text: '已驳回', class: 'badge-rejected' }
    };
    const info = statusMap[status] || { text: status, class: 'badge-draft' };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  const getTypeLabel = (type) => {
    return type === 'change' ? '变更申请' : '签证单';
  };

  const isMyTurnToApprove = (item) => {
    if (user.role === 'admin') return true;
    const myStage = roleStageMap[user.role];
    if (!myStage) return false;
    return item.current_stage === myStage && item.overall_status === 'pending';
  };

  const handleApprove = async (item) => {
    if (!item.details) return;
    const myStage = user.role === 'admin' ? item.current_stage : roleStageMap[user.role];
    const record = item.details.records.find(r => r.stage === myStage);
    if (!record) return;

    try {
      await approvalsAPI.approve(item.id, {
        stage: myStage,
        opinion: '同意',
        approver_name: user.name,
        approval_amount: item.amount
      });
      loadData();
    } catch (err) {
      console.error('审批失败', err);
    }
  };

  const handleReject = async (item) => {
    if (!item.details) return;
    const myStage = user.role === 'admin' ? item.current_stage : roleStageMap[user.role];
    try {
      await approvalsAPI.reject(item.id, {
        stage: myStage,
        opinion: '不同意',
        approver_name: user.name
      });
      loadData();
    } catch (err) {
      console.error('驳回失败', err);
    }
  };

  const filteredApprovals = approvals.filter(item => {
    if (activeTab === 'pending') {
      return isMyTurnToApprove(item);
    } else if (activeTab === 'all') {
      return true;
    }
    return item.overall_status === activeTab;
  });

  const pendingCount = approvals.filter(item => isMyTurnToApprove(item)).length;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">待我审批</h2>
        {pendingCount > 0 && (
          <span className="badge badge-pending" style={{ padding: '6px 12px', fontSize: '14px' }}>
            待审批：{pendingCount} 项
          </span>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待我审批 ({pendingCount})
        </button>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部审批
        </button>
        <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
          已通过
        </button>
        <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
          已驳回
        </button>
      </div>

      <div className="filter-bar">
        <select
          className="form-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">全部类型</option>
          <option value="change">变更申请</option>
          <option value="visa">签证单</option>
        </select>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>业务类型</th>
              <th>业务标题</th>
              <th>金额</th>
              <th>当前阶段</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApprovals.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">暂无审批数据</div>
                </td>
              </tr>
            ) : (
              filteredApprovals.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="badge" style={{ background: item.business_type === 'change' ? '#dbeafe' : '#d1fae5', color: item.business_type === 'change' ? '#1e40af' : '#065f46' }}>
                      {getTypeLabel(item.business_type)}
                    </span>
                  </td>
                  <td>{item.business_title}</td>
                  <td className="amount-display">{formatAmount(item.amount)}</td>
                  <td>{item.current_stage === 'completed' ? '已完成' : item.current_stage}</td>
                  <td>{getStatusBadge(item.overall_status)}</td>
                  <td>{item.created_at?.slice(0, 19)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          if (item.business_type === 'change') {
                            navigate(`/change-requests/${item.business_id}`);
                          } else {
                            navigate(`/visa-forms/${item.business_id}`);
                          }
                        }}
                      >
                        查看
                      </button>
                      {isMyTurnToApprove(item) && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleApprove(item)}>
                            通过
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleReject(item)}>
                            驳回
                          </button>
                        </>
                      )}
                    </div>
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

export default Approvals;
