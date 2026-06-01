import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { warehouseApi, returnRequestsApi } from '../api';

const WarehouseInspection = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'pending') {
        const res = await returnRequestsApi.getAll({ status: 'pending_warehouse' });
        setPendingRequests(res.data.data || []);
      } else {
        const res = await warehouseApi.getExceptions();
        setExceptions(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  const handleResolveException = async (id: number) => {
    try {
      await warehouseApi.resolveException(id);
      loadData();
    } catch (error) {
      console.error('Failed to resolve exception', error);
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
      completed: '已完成'
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      <h1 className="page-title">入仓检验</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待检验 ({pendingRequests.length})
        </button>
        <button
          className={`tab ${activeTab === 'exceptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('exceptions')}
        >
          异常单 ({exceptions.length})
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
                      进行检验
                    </button>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    暂无待检验的退货申请
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'exceptions' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>异常ID</th>
                <th>订单号</th>
                <th>SKU</th>
                <th>物流单号</th>
                <th>异常类型</th>
                <th>描述</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((exception) => (
                <tr key={exception.id}>
                  <td>{exception.id}</td>
                  <td>{exception.platform_order_id}</td>
                  <td>{exception.sku}</td>
                  <td>{exception.tracking_number}</td>
                  <td>
                    <span className="status-badge status-exception">
                      {exception.exception_type}
                    </span>
                  </td>
                  <td>{exception.description}</td>
                  <td>
                    <span className={`status-badge ${exception.status === 'resolved' ? 'status-restocked' : 'status-exception'}`}>
                      {exception.status === 'resolved' ? '已处理' : '待处理'}
                    </span>
                  </td>
                  <td>{new Date(exception.created_at).toLocaleString()}</td>
                  <td>
                    {exception.status !== 'resolved' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleResolveException(exception.id)}
                      >
                        标记已处理
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {exceptions.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    暂无异常单
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

export default WarehouseInspection;
