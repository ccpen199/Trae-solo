import { useEffect, useState } from 'react';
import { Card, Table, message, Tag, Progress, Descriptions, Alert, List, Spin } from 'antd';
import api from '../utils/api';

export default function AccountLoan() {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [detailCache, setDetailCache] = useState({});

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/account/loan');
      setLoans(response.data);
    } catch (error) {
      message.error('加载贷款信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLoanDetail = async (id) => {
    if (detailCache[id]) return;
    try {
      const res = await api.get(`/account/loan-detail/${id}`);
      setDetailCache(prev => ({ ...prev, [id]: res.data }));
    } catch (error) {
      message.error('加载贷款详情失败');
    }
  };

  const getStatusTag = (status) => {
    const map = {
      repaying: { color: 'blue', text: '还款中' },
      paid: { color: 'green', text: '已结清' },
      overdue: { color: 'red', text: '逾期' }
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const reviewStatusTag = (status) => {
    const map = {
      approved: { color: 'green', text: '通过' },
      rejected: { color: 'red', text: '不通过' },
      pending: { color: 'orange', text: '待复查' }
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const riskLevelAlert = (risk) => {
    if (!risk) return null;
    const typeMap = { normal: 'success', warning: 'warning', danger: 'error' };
    const textMap = { normal: '正常', warning: '关注', danger: '危险' };
    return (
      <Alert
        message={`贷款风险状态：${textMap[risk.risk_level] || risk.risk_level}`}
        description={risk.risk_note}
        type={typeMap[risk.risk_level] || 'info'}
        showIcon
        style={{ marginTop: 16 }}
      />
    );
  };

  const expandedRowRender = (loan) => {
    const detail = detailCache[loan.id];
    const progress = (loan.paid_principal / loan.amount * 100).toFixed(1);

    return (
      <div>
        <Descriptions title="还款明细" column={3} bordered>
          <Descriptions.Item label="贷款期限">{loan.term_months}个月</Descriptions.Item>
          <Descriptions.Item label="贷款利率">{(loan.interest_rate * 100).toFixed(2)}%</Descriptions.Item>
          <Descriptions.Item label="月供金额">¥{loan.monthly_payment?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="已还本金">¥{loan.paid_principal?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="已还利息">¥{loan.paid_interest?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="剩余本金">¥{loan.remaining_principal?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="还款进度" span={3}>
            <Progress percent={parseFloat(progress)} />
          </Descriptions.Item>
        </Descriptions>

        {!detail && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin />
            <p style={{ marginTop: 8, color: '#999' }}>加载详情中...</p>
          </div>
        )}

        {detail?.developer && (
          <Card title="开发商信息" size="small" style={{ marginTop: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="开发商名称">{detail.developer.developer_name}</Descriptions.Item>
              <Descriptions.Item label="统一信用代码">{detail.developer.developer_credit_code}</Descriptions.Item>
              <Descriptions.Item label="项目名称">{detail.developer.project_name}</Descriptions.Item>
              <Descriptions.Item label="项目地址">{detail.developer.project_address}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {detail?.reviews && detail.reviews.length > 0 && (
          <Card title="监管复查记录" size="small" style={{ marginTop: 16 }}>
            <Table
              columns={[
                { title: '复查人', dataIndex: 'reviewer_name', key: 'reviewer_name' },
                { title: '复查状态', dataIndex: 'review_status', key: 'review_status', render: (v) => reviewStatusTag(v) },
                { title: '复查意见', dataIndex: 'review_note', key: 'review_note' },
                { title: '复查时间', dataIndex: 'reviewed_at', key: 'reviewed_at' }
              ]}
              dataSource={detail.reviews}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {detail?.risk && riskLevelAlert(detail.risk)}

        {detail?.risk_alerts && detail.risk_alerts.length > 0 && (
          <Card title="异常提醒" size="small" style={{ marginTop: 16 }}>
            <List
              dataSource={detail.risk_alerts}
              renderItem={(alert) => (
                <List.Item key={alert.id}>
                  <List.Item.Meta
                    title={alert.alert_type}
                    description={alert.description}
                  />
                  <Tag color={alert.level === 'high' ? 'red' : alert.level === 'medium' ? 'orange' : 'blue'}>
                    {alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>
    );
  };

  const columns = [
    { title: '贷款编号', dataIndex: 'loan_no', key: 'loan_no' },
    { title: '贷款金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v.toFixed(2)}` },
    { title: '贷款状态', dataIndex: 'status', key: 'status', render: (s) => getStatusTag(s) },
    { title: '起始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '到期日期', dataIndex: 'end_date', key: 'end_date' }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>贷款信息</h2>
      <Card>
        <Table
          columns={columns}
          dataSource={loans}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            onExpand: (expanded, record) => {
              if (expanded) loadLoanDetail(record.id);
            }
          }}
          locale={{ emptyText: '暂无贷款记录' }}
        />
      </Card>
    </div>
  );
}
