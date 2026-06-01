import { useEffect, useState } from 'react';
import { refundsApi, returnRequestsApi } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, requestsRes] = await Promise.all([
        refundsApi.getReports(),
        returnRequestsApi.getAll({ limit: 5 })
      ]);
      
      setStats(reportsRes.data);
      setRecentRequests(requestsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
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
      destroyed: '已销毁'
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      <h1 className="page-title">仪表盘</h1>

      <div className="grid-2 mb-24">
        <div className="stat-card blue">
          <div className="stat-value">{stats?.status_counts?.length || 0}</div>
          <div className="stat-label">退货申请总数</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">¥{stats?.total_refunds_completed?.toFixed(2) || 0}</div>
          <div className="stat-label">已完成退款总额</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">最近退货申请</h2>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>SKU</th>
              <th>退货原因</th>
              <th>退款金额</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {recentRequests.map((request) => (
              <tr key={request.id}>
                <td>{request.platform_order_id}</td>
                <td>{request.sku}</td>
                <td>{request.return_reason}</td>
                <td>¥{request.refund_amount.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td>{new Date(request.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {recentRequests.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {stats?.reason_distribution && stats.reason_distribution.length > 0 && (
        <div className="card">
          <h2 className="card-title">退货原因分布</h2>
          <table className="table">
            <thead>
              <tr>
                <th>退货原因</th>
                <th>数量</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              {stats.reason_distribution.map((item: any) => (
                <tr key={item.return_reason}>
                  <td>{item.return_reason}</td>
                  <td>{item.count}</td>
                  <td>
                    {((item.count / stats.reason_distribution.reduce((a: number, b: any) => a + b.count, 0)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats?.responsibility_costs && stats.responsibility_costs.length > 0 && (
        <div className="card">
          <h2 className="card-title">责任方成本统计</h2>
          <table className="table">
            <thead>
              <tr>
                <th>责任方</th>
                <th>处理单数</th>
                <th>总成本</th>
              </tr>
            </thead>
            <tbody>
              {stats.responsibility_costs.map((item: any) => (
                <tr key={item.responsible_party}>
                  <td>{item.responsible_party}</td>
                  <td>{item.count}</td>
                  <td>¥{item.total_cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
