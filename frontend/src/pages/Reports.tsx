import { useEffect, useState } from 'react';
import { refundsApi } from '../api';

const Reports = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [reportsRes, detailsRes] = await Promise.all([
        refundsApi.getReports(),
        refundsApi.getReportDetails()
      ]);
      
      setReportData(reportsRes.data);
      setDetails(detailsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load report data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><h1>加载中...</h1></div>;
  }

  const totalRequests = reportData?.status_counts?.length || 0;
  const totalRefundAmount = reportData?.total_refunds_completed || 0;

  const statusCounts = reportData?.status_counts || [];
  const reasonDistribution = reportData?.reason_distribution || [];
  const responsibilityCosts = reportData?.responsibility_costs || [];

  return (
    <div>
      <h1 className="page-title">售后报表</h1>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue">
          <div className="stat-value">{totalRequests}</div>
          <div className="stat-label">退货申请总数</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' }}>
          <div className="stat-value">¥{totalRefundAmount.toFixed(2)}</div>
          <div className="stat-label">已完成退款总额</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">状态分布</h2>
        <table className="table">
          <thead>
            <tr>
              <th>状态</th>
              <th>数量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {statusCounts.map((item: any) => (
              <tr key={item.status}>
                <td>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.count}</td>
                <td>
                  {totalRequests > 0 ? ((item.count / totalRequests) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
            {statusCounts.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
            {reasonDistribution.map((item: any) => (
              <tr key={item.return_reason}>
                <td>{item.return_reason}</td>
                <td>{item.count}</td>
                <td>
                  {totalRequests > 0 ? ((item.count / totalRequests) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
            {reasonDistribution.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card-title">责任方成本统计</h2>
        <table className="table">
          <thead>
            <tr>
              <th>责任方</th>
              <th>处理单数</th>
              <th>总成本</th>
              <th>平均成本</th>
            </tr>
          </thead>
          <tbody>
            {responsibilityCosts.map((item: any) => (
              <tr key={item.responsible_party}>
                <td>{item.responsible_party}</td>
                <td>{item.count}</td>
                <td>¥{item.total_cost.toFixed(2)}</td>
                <td>¥{(item.count > 0 ? item.total_cost / item.count : 0).toFixed(2)}</td>
              </tr>
            ))}
            {responsibilityCosts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card-title">退款明细（可下钻）</h2>
        <table className="table">
          <thead>
            <tr>
              <th>退款ID</th>
              <th>订单号</th>
              <th>SKU</th>
              <th>退货原因</th>
              <th>外观等级</th>
              <th>处理类型</th>
              <th>责任方</th>
              <th>退款金额</th>
              <th>平台状态</th>
            </tr>
          </thead>
          <tbody>
            {details.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.platform_order_id}</td>
                <td>{item.sku}</td>
                <td>{item.return_reason || '-'}</td>
                <td>{item.condition_level || '-'}</td>
                <td>{item.decision_type || '-'}</td>
                <td>{item.responsible_party || '-'}</td>
                <td style={{ color: '#f5222d', fontWeight: 600 }}>
                  ¥{item.refund_amount.toFixed(2)}
                </td>
                <td>
                  <span className={`status-badge ${item.platform_refund_status === 'completed' ? 'status-restocked' : 'status-pending_review'}`}>
                    {item.platform_refund_status}
                  </span>
                </td>
              </tr>
            ))}
            {details.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
