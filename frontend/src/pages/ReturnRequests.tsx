import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReturnRequest, returnRequestsApi } from '../api';

const ReturnRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    platform_order_id: '',
    sku: '',
    return_reason: '',
    buyer_description: '',
    tracking_number: '',
    refund_amount: ''
  });

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending_review', label: '待审核' },
    { key: 'pending_warehouse', label: '待入仓' },
    { key: 'pending_processing', label: '待处理' },
    { key: 'completed', label: '已完成' }
  ];

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      const res = await returnRequestsApi.getAll({
        status: activeTab === 'all' ? undefined : activeTab
      });
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Failed to load return requests', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await returnRequestsApi.create({
        ...newRequest,
        refund_amount: parseFloat(newRequest.refund_amount)
      });
      setShowCreateModal(false);
      setNewRequest({
        platform_order_id: '',
        sku: '',
        return_reason: '',
        buyer_description: '',
        refund_amount: ''
      });
      loadRequests();
    } catch (error) {
      console.error('Failed to create return request', error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await returnRequestsApi.approve(id);
      loadRequests();
    } catch (error) {
      console.error('Failed to approve request', error);
    }
  };

  const getStatusText = (status: string) => {
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
    return statusMap[status] || status;
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ margin: 0 }}>退货申请</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + 新建退货申请
        </button>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>平台订单号</th>
              <th>SKU</th>
              <th>退货原因</th>
              <th>退款金额</th>
              <th>状态</th>
              <th>是否需要人工审核</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{request.platform_order_id}</td>
                <td>{request.sku}</td>
                <td>{request.return_reason}</td>
                <td>¥{request.refund_amount.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td>{request.needs_manual_review ? '是' : '否'}</td>
                <td>{new Date(request.created_at).toLocaleString()}</td>
                <td>
                  <div className="flex-between gap-8">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/return-requests/${request.id}`)}
                    >
                      查看详情
                    </button>
                    {request.status === 'pending_review' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(request.id)}
                      >
                        审核通过
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: 600, margin: 0 }}>
            <h2 className="card-title">新建退货申请</h2>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">平台订单号 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRequest.platform_order_id}
                    onChange={(e) => setNewRequest({...newRequest, platform_order_id: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">物流单号 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRequest.tracking_number}
                    onChange={(e) => setNewRequest({...newRequest, tracking_number: e.target.value})}
                    required
                    placeholder="买家退货的快递单号"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRequest.sku}
                    onChange={(e) => setNewRequest({...newRequest, sku: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">退款金额 *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newRequest.refund_amount}
                    onChange={(e) => setNewRequest({...newRequest, refund_amount: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">退货原因 *</label>
                  <select
                    className="form-select"
                    value={newRequest.return_reason}
                    onChange={(e) => setNewRequest({...newRequest, return_reason: e.target.value})}
                    required
                  >
                    <option value="">请选择</option>
                    <option value="商品质量问题">商品质量问题</option>
                    <option value="错发/漏发">错发/漏发</option>
                    <option value="商品损坏">商品损坏</option>
                    <option value="与描述不符">与描述不符</option>
                    <option value="不想要了">不想要了</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">买家说明</label>
                  <textarea
                    className="form-textarea"
                    value={newRequest.buyer_description}
                    onChange={(e) => setNewRequest({...newRequest, buyer_description: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: '#f0f0f0' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequests;
