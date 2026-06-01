import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Divider, List, Tag, Progress } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { loanAPI } from '../services/api';
import AppLayout from '../components/Layout';

const LoanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const loanRes = await loanAPI.getDetail(id);
      setLoan(loanRes.data);
      
      const repayRes = await loanAPI.getRepayments(id);
      setRepayments(repayRes.data || []);
    } catch (err) {
      console.error('Fetch detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !loan) {
    return (
      <AppLayout title="借款详情">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  const paidCount = repayments.filter(r => r.status === 'paid').length;
  const progress = (paidCount / repayments.length) * 100;

  return (
    <AppLayout title="借款详情">
      <div className="page-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/credit')}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>

        <Card title="借款信息">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="产品名称">{loan.product_name}</Descriptions.Item>
            <Descriptions.Item label="借款金额">
              <span style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>
                {loan.amount.toFixed(2)} 元
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="借款期限">{loan.term} 期</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color="green">还款中</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="借款时间">{new Date(loan.created_at).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Divider />

        <Card title="还款进度">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Progress
              type="circle"
              percent={Math.round(progress)}
              format={() => `${paidCount}/${repayments.length} 期`}
              size={120}
            />
          </div>
        </Card>

        <Divider />

        <Card title="还款计划">
          <List
            dataSource={repayments}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>第 {item.period} 期</span>
                      <Tag color={item.status === 'paid' ? 'green' : 'orange'}>
                        {item.status === 'paid' ? '已还款' : '待还款'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
                      <div>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        应还：{item.amount.toFixed(2)} 元
                        <span style={{ color: '#999', marginLeft: 16 }}>
                          （本金：{item.principal.toFixed(2)} + 利息：{item.interest.toFixed(2)}）
                        </span>
                      </div>
                      <span style={{ color: '#666' }}>
                        到期日：{new Date(item.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default LoanDetail;
