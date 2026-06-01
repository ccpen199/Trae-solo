import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { settlementAPI } from '../api';

function SettlementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settlement, setSettlement] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await settlementAPI.getById(id);
      setSettlement(res.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  if (!settlement) {
    return <div className="card">加载中...</div>;
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">结算依据详情</h2>
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{settlement.settlement_no}</span>
            {settlement.is_archived 
              ? <span className="badge badge-approved">已归档</span>
              : <span className="badge badge-draft">未归档</span>
            }
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/settlement')}>
          返回列表
        </button>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>基本信息</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">结算编号</span>
            <span className="detail-value" style={{ fontFamily: 'monospace' }}>{settlement.settlement_no}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">所属合同</span>
            <span className="detail-value">{settlement.contract_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">关联签证单</span>
            <span className="detail-value">{settlement.visa_no} - {settlement.project_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">关联变更申请</span>
            <span className="detail-value">{settlement.change_no ? `${settlement.change_no} - ${settlement.change_title}` : '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">签证单总金额</span>
            <span className="detail-value amount-display">{formatAmount(settlement.total_amount)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">调整金额</span>
            <span className="detail-value amount-display" style={{ color: settlement.adjustment_amount > 0 ? '#059669' : settlement.adjustment_amount < 0 ? '#dc2626' : '#6b7280' }}>
              {settlement.adjustment_amount > 0 ? '+' : ''}{formatAmount(settlement.adjustment_amount)}
            </span>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">调整原因</span>
            <span className="detail-value">{settlement.adjustment_reason || '-'}</span>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">最终结算金额</span>
            <span className="detail-value amount-display amount-large" style={{ color: '#1e40af' }}>{formatAmount(settlement.final_amount)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">创建时间</span>
            <span className="detail-value">{settlement.created_at?.slice(0, 19)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">归档时间</span>
            <span className="detail-value">{settlement.archived_at?.slice(0, 19) || '-'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>签证单费用明细</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">项目名称</span>
            <span className="detail-value">{settlement.project_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">责任单位</span>
            <span className="detail-value">{settlement.responsible_unit}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">工程量</span>
            <span className="detail-value">{settlement.quantity} {settlement.unit}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">单价</span>
            <span className="detail-value amount-display">{formatAmount(settlement.unit_price)}/{settlement.unit}</span>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">计算式</span>
            <span className="detail-value">{settlement.calculation_formula}</span>
          </div>
        </div>
      </div>

      {settlement.approval_records && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>审批记录</h3>
          <div className="timeline">
            {settlement.approval_records.map((record) => (
              <div key={record.id} className={`timeline-item ${
                record.status === 'approved' ? 'completed' :
                record.status === 'rejected' ? 'rejected' : ''
              }`}>
                <div className="timeline-role">
                  {record.approver_role}
                  {record.is_escalated && <span className="badge" style={{ marginLeft: '8px' }}>金额超限升级</span>}
                </div>
                <div className="timeline-status">
                  {record.status === 'approved' ? `已通过 - ${record.approver_name || '未填写'}` :
                   record.status === 'rejected' ? `已驳回 - ${record.approver_name || '未填写'}` :
                   '待审批'}
                </div>
                {record.opinion && (
                  <div className="timeline-opinion">{record.opinion}</div>
                )}
                {record.approved_at && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {record.approved_at.slice(0, 19)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementDetail;
