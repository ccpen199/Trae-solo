import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { returnRequestsApi, warehouseApi, processingApi, refundsApi } from '../api';

const ReturnRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [inspectionForm, setInspectionForm] = useState({
    sku_verified: false,
    quantity: 1,
    condition_level: 'good',
    has_damage: false,
    has_wrong_item: false,
    has_missing_parts: false,
    inspector_notes: ''
  });
  const [decisionForm, setDecisionForm] = useState({
    decision_type: 'restock',
    processing_cost: 0,
    responsible_party: 'buyer',
    notes: '',
    decided_by: '管理员'
  });

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    try {
      const res = await returnRequestsApi.getById(parseInt(id!));
      setDetail(res.data);
    } catch (error) {
      console.error('Failed to load detail', error);
    }
  };

  const handleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await warehouseApi.inspect({
        return_request_id: parseInt(id!),
        ...inspectionForm,
        sku_verified: inspectionForm.sku_verified ? 1 : 0,
        has_damage: inspectionForm.has_damage ? 1 : 0,
        has_wrong_item: inspectionForm.has_wrong_item ? 1 : 0,
        has_missing_parts: inspectionForm.has_missing_parts ? 1 : 0
      });
      setActiveTab('basic');
      loadDetail();
    } catch (error) {
      console.error('Failed to submit inspection', error);
    }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await processingApi.createDecision({
        return_request_id: parseInt(id!),
        ...decisionForm
      });
      setActiveTab('basic');
      loadDetail();
    } catch (error) {
      console.error('Failed to submit decision', error);
    }
  };

  const handleApproveRefund = async () => {
    try {
      if (detail?.refund?.id) {
        await refundsApi.approveSeller(detail.refund.id);
        loadDetail();
      }
    } catch (error) {
      console.error('Failed to approve refund', error);
    }
  };

  const handleCompleteRefund = async () => {
    try {
      if (detail?.refund?.id) {
        await refundsApi.completePlatform(detail.refund.id);
        loadDetail();
      }
    } catch (error) {
      console.error('Failed to complete refund', error);
    }
  };

  if (!detail) {
    return <div>加载中...</div>;
  }

  const { request, inspection, decision, refund } = detail;

  return (
    <div>
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ margin: 0 }}>退货申请详情 #{id}</h1>
        <button 
          className="btn"
          style={{ backgroundColor: '#f0f0f0' }}
          onClick={() => navigate('/return-requests')}
        >
          返回列表
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          基本信息
        </button>
        {request.status === 'pending_warehouse' && (
          <button
            className={`tab ${activeTab === 'inspection' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspection')}
          >
            入仓检验
          </button>
        )}
        {request.status === 'pending_processing' && (
          <button
            className={`tab ${activeTab === 'decision' ? 'active' : ''}`}
            onClick={() => setActiveTab('decision')}
          >
            处理决策
          </button>
        )}
        {refund && typeof refund === 'object' && (
          <button
            className={`tab ${activeTab === 'refund' ? 'active' : ''}`}
            onClick={() => setActiveTab('refund')}
          >
            退款信息
          </button>
        )}
      </div>

      {activeTab === 'basic' && (
        <div className="grid-2">
          <div className="card">
            <h2 className="card-title">退货申请信息</h2>
            <div style={{ lineHeight: '2.5' }}>
              <div className="flex-between">
                <span style={{ color: '#666' }}>平台订单号：</span>
                <span>{request.platform_order_id}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>SKU：</span>
                <span>{request.sku}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>物流单号：</span>
                <span>{request.tracking_number || '-'}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>退货原因：</span>
                <span>{request.return_reason}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>退款金额：</span>
                <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{request.refund_amount.toFixed(2)}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>状态：</span>
                <span className={`status-badge status-${request.status}`}>
                  {(() => {
                    const statusMap: Record<string, string> = {
                      pending_review: '待审核',
                      pending_warehouse: '待入仓',
                      pending_processing: '待处理',
                      processing: '处理中',
                      exception: '异常',
                      restocked: '已重新上架',
                      refunding: '退款中',
                      completed: '已完成',
                      destroyed: '已销毁',
                      returning_to_supplier: '退回供应商中'
                    };
                    return statusMap[request.status] || request.status;
                  })()}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>需要人工审核：</span>
                <span>{request.needs_manual_review ? '是' : '否'}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>买家说明：</span>
                <span>{request.buyer_description || '-'}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#666' }}>创建时间：</span>
                <span>{new Date(request.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {inspection && (
            <div className="card">
              <h2 className="card-title">入仓检验信息</h2>
              <div style={{ lineHeight: '2.5' }}>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>物流单号：</span>
                  <span>{inspection.tracking_number}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>SKU 验证：</span>
                  <span>{inspection.sku_verified ? '✓ 一致' : '✗ 不一致'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>数量：</span>
                  <span>{inspection.quantity}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>外观等级：</span>
                  <span>{inspection.condition_level}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>是否损坏：</span>
                  <span>{inspection.has_damage ? '是' : '否'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>是否错发：</span>
                  <span>{inspection.has_wrong_item ? '是' : '否'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>是否缺件：</span>
                  <span>{inspection.has_missing_parts ? '是' : '否'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>检验备注：</span>
                  <span>{inspection.inspector_notes || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {decision && (
            <div className="card">
              <h2 className="card-title">处理决策信息</h2>
              <div style={{ lineHeight: '2.5' }}>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>处理类型：</span>
                  <span>{decision.decision_type}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>处理成本：</span>
                  <span>¥{decision.processing_cost.toFixed(2)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>责任方：</span>
                  <span>{decision.responsible_party}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>处理人：</span>
                  <span>{decision.decided_by || '-'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>处理备注：</span>
                  <span>{decision.notes || '-'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>处理时间：</span>
                  <span>{new Date(decision.decided_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {refund && typeof refund === 'object' && (
            <div className="card">
              <h2 className="card-title">退款信息</h2>
              <div style={{ lineHeight: '2.5' }}>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>退款金额：</span>
                  <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{refund.refund_amount.toFixed(2)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>平台退款状态：</span>
                  <span>{refund.platform_refund_status}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>卖家已审核：</span>
                  <span>{refund.seller_approved ? '是' : '否'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: '#666' }}>仓库已处理：</span>
                  <span>{refund.warehouse_processed ? '是' : '否'}</span>
                </div>
                {refund.refund_date && (
                  <div className="flex-between">
                    <span style={{ color: '#666' }}>退款完成时间：</span>
                    <span>{new Date(refund.refund_date).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inspection' && (
        <div className="card">
          <h2 className="card-title">入仓检验</h2>
          <form onSubmit={handleInspection}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">物流单号</label>
                <input
                  type="text"
                  className="form-input"
                  value={request.tracking_number || ''}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">数量 *</label>
                <input
                  type="number"
                  className="form-input"
                  value={inspectionForm.quantity}
                  onChange={(e) => setInspectionForm({...inspectionForm, quantity: parseInt(e.target.value)})}
                  required
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">外观等级</label>
              <select
                className="form-select"
                value={inspectionForm.condition_level}
                onChange={(e) => setInspectionForm({...inspectionForm, condition_level: e.target.value})}
              >
                <option value="good">完好</option>
                <option value="minor_flaw">轻微瑕疵</option>
                <option value="damaged">损坏</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">检验项目</label>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={inspectionForm.sku_verified}
                    onChange={(e) => setInspectionForm({...inspectionForm, sku_verified: e.target.checked})}
                  />
                  SKU 一致
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={inspectionForm.has_damage}
                    onChange={(e) => setInspectionForm({...inspectionForm, has_damage: e.target.checked})}
                  />
                  有损坏
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={inspectionForm.has_wrong_item}
                    onChange={(e) => setInspectionForm({...inspectionForm, has_wrong_item: e.target.checked})}
                  />
                  错发商品
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={inspectionForm.has_missing_parts}
                    onChange={(e) => setInspectionForm({...inspectionForm, has_missing_parts: e.target.checked})}
                  />
                  缺少配件
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">检验备注</label>
              <textarea
                className="form-textarea"
                value={inspectionForm.inspector_notes}
                onChange={(e) => setInspectionForm({...inspectionForm, inspector_notes: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              提交检验结果
            </button>
          </form>
        </div>
      )}

      {activeTab === 'decision' && (
        <div className="card">
          <h2 className="card-title">处理决策</h2>
          <form onSubmit={handleDecision}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">处理类型 *</label>
                <select
                  className="form-select"
                  value={decisionForm.decision_type}
                  onChange={(e) => setDecisionForm({...decisionForm, decision_type: e.target.value})}
                  required
                >
                  <option value="restock">重新上架</option>
                  <option value="repair">维修后上架</option>
                  <option value="relabel">换标处理</option>
                  <option value="destroy">销毁</option>
                  <option value="return_to_supplier">退回供应商</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">责任方 *</label>
                <select
                  className="form-select"
                  value={decisionForm.responsible_party}
                  onChange={(e) => setDecisionForm({...decisionForm, responsible_party: e.target.value})}
                  required
                >
                  <option value="buyer">买家责任</option>
                  <option value="seller">卖家责任</option>
                  <option value="logistics">物流责任</option>
                  <option value="supplier">供应商责任</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">处理成本</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={decisionForm.processing_cost}
                  onChange={(e) => setDecisionForm({...decisionForm, processing_cost: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">处理人</label>
                <input
                  type="text"
                  className="form-input"
                  value={decisionForm.decided_by}
                  onChange={(e) => setDecisionForm({...decisionForm, decided_by: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">处理备注</label>
              <textarea
                className="form-textarea"
                value={decisionForm.notes}
                onChange={(e) => setDecisionForm({...decisionForm, notes: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              提交处理决策
            </button>
          </form>
        </div>
      )}

      {activeTab === 'refund' && refund && typeof refund === 'object' && (
        <div className="card">
          <h2 className="card-title">退款操作</h2>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            {!refund.seller_approved && (
              <button className="btn btn-success" onClick={handleApproveRefund}>
                卖家审核通过
              </button>
            )}
            {refund.seller_approved && refund.warehouse_processed && refund.platform_refund_status !== 'completed' && (
              <button className="btn btn-primary" onClick={handleCompleteRefund}>
                确认平台退款完成
              </button>
            )}
            {refund.platform_refund_status === 'completed' && (
              <div style={{ color: '#52c41a', fontWeight: 600 }}>
                ✓ 退款已完成
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequestDetail;
