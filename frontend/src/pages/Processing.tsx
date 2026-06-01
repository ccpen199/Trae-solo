import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { processingApi, returnRequestsApi } from '../api';

const Processing = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'pending') {
        const res = await returnRequestsApi.getAll({ status: 'pending_processing' });
        setPendingRequests(res.data.data || []);
      } else if (activeTab === 'decisions') {
        const res = await processingApi.getDecisions();
        setDecisions(res.data || []);
      } else if (activeTab === 'restocks') {
        const res = await processingApi.getRestocks();
        setRestocks(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  const getDecisionTypeText = (type: string) => {
    const map: Record<string, string> = {
      restock: '重新上架',
      repair: '维修后上架',
      relabel: '换标处理',
      destroy: '销毁',
      return_to_supplier: '退回供应商'
    };
    return map[type] || type;
  };

  return (
    <div>
      <h1 className="page-title">处理决策</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待处理 ({pendingRequests.length})
        </button>
        <button
          className={`tab ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          决策记录 ({decisions.length})
        </button>
        <button
          className={`tab ${activeTab === 'restocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('restocks')}
        >
          重新上架记录 ({restocks.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>平台订单号</th>
                <th>SKU</th>
                <th>退货原因</th>
                <th>退款金额</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.platform_order_id}</td>
                  <td>{request.sku}</td>
                  <td>{request.return_reason}</td>
                  <td>¥{request.refund_amount.toFixed(2)}</td>
                  <td>{new Date(request.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/return-requests/${request.id}`)}
                    >
                      处理决策
                    </button>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    暂无待处理的退货申请
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>决策ID</th>
                <th>订单号</th>
                <th>SKU</th>
                <th>处理类型</th>
                <th>处理成本</th>
                <th>责任方</th>
                <th>处理人</th>
                <th>处理时间</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((decision) => (
                <tr key={decision.id}>
                  <td>{decision.id}</td>
                  <td>{decision.platform_order_id}</td>
                  <td>{decision.sku}</td>
                  <td>
                    <span className="status-badge status-pending_processing">
                      {getDecisionTypeText(decision.decision_type)}
                    </span>
                  </td>
                  <td>¥{decision.processing_cost.toFixed(2)}</td>
                  <td>{decision.responsible_party}</td>
                  <td>{decision.decided_by || '-'}</td>
                  <td>{new Date(decision.decided_at).toLocaleString()}</td>
                </tr>
              ))}
              {decisions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    暂无决策记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'restocks' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>记录ID</th>
                <th>订单号</th>
                <th>SKU</th>
                <th>数量</th>
                <th>状态</th>
                <th>库位</th>
                <th>上架时间</th>
              </tr>
            </thead>
            <tbody>
              {restocks.map((restock) => (
                <tr key={restock.id}>
                  <td>{restock.id}</td>
                  <td>{restock.platform_order_id}</td>
                  <td>{restock.sku}</td>
                  <td>{restock.quantity}</td>
                  <td>
                    <span className="status-badge status-restocked">
                      已重新上架
                    </span>
                  </td>
                  <td>{restock.location || '-'}</td>
                  <td>{new Date(restock.restock_date).toLocaleString()}</td>
                </tr>
              ))}
              {restocks.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    暂无重新上架记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Processing;
