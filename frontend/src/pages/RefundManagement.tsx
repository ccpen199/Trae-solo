import { useEffect, useState } from 'react';
import { refundsApi } from '../api';

const RefundManagement = () => {
  const [refunds, setRefunds] = useState<any[]>([]);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      const res = await refundsApi.getAll();
      setRefunds(res.data || []);
    } catch (error) {
      console.error('Failed to load refunds', error);
    }
  };

  const handleApproveSeller = async (id: number) => {
    try {
      await refundsApi.approveSeller(id);
      loadRefunds();
    } catch (error) {
      console.error('Failed to approve', error);
    }
  };

  const handleCompletePlatform = async (id: number) => {
    try {
      await refundsApi.completePlatform(id);
      loadRefunds();
    } catch (error) {
      console.error('Failed to complete', error);
    }
  };

  return (
    <div>
      <h1 className="page-title">退款管理</h1>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>退款ID</th>
              <th>订单号</th>
              <th>SKU</th>
              <th>退款金额</th>
              <th>平台退款状态</th>
              <th>卖家审核</th>
              <th>仓库处理</th>
              <th>退款完成时间</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td>{refund.id}</td>
                <td>{refund.platform_order_id}</td>
                <td>{refund.sku}</td>
                <td style={{ color: '#f5222d', fontWeight: 600 }}>
                  ¥{refund.refund_amount.toFixed(2)}
                </td>
                <td>
                  <span className={`status-badge ${refund.platform_refund_status === 'completed' ? 'status-restocked' : 'status-pending_review'}`}>
                    {refund.platform_refund_status}
                  </span>
                </td>
                <td>
                  {refund.seller_approved ? (
                    <span style={{ color: '#52c41a' }}>✓ 已审核</span>
                  ) : (
                    <span style={{ color: '#faad14' }}>待审核</span>
                  )}
                </td>
                <td>
                  {refund.warehouse_processed ? (
                    <span style={{ color: '#52c41a' }}>✓ 已处理</span>
                  ) : (
                    <span style={{ color: '#faad14' }}>待处理</span>
                  )}
                </td>
                <td>{refund.refund_date ? new Date(refund.refund_date).toLocaleString() : '-'}</td>
                <td>{new Date(refund.created_at).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!refund.seller_approved && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveSeller(refund.id)}
                      >
                        卖家审核
                      </button>
                    )}
                    {refund.seller_approved && refund.warehouse_processed && refund.platform_refund_status !== 'completed' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCompletePlatform(refund.id)}
                      >
                        完成退款
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {refunds.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无退款记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RefundManagement;
