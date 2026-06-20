import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Steps, Button, message, Tag, Space, Divider, Statistic } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../utils/request';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [tax, setTax] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    try {
      const res: any = await api.get(`/transactions/${id}`);
      setTransaction(res);
      setProgress(res.progress || []);
      setTax(res.tax || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSign = async () => {
    setLoading(true);
    try {
      await api.post(`/transactions/${id}/sign`);
      message.success('电子签约完成');
      loadDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
    setLoading(false);
  };

  const handleEscrow = async () => {
    setLoading(true);
    try {
      await api.post(`/transactions/${id}/escrow`);
      message.success('资金监管完成');
      loadDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
    setLoading(false);
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
      await api.post(`/transactions/${id}/transfer`);
      message.success('过户申请已提交');
      loadDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.post(`/transactions/${id}/complete`);
      message.success('交易已完成');
      loadDetail();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
    setLoading(false);
  };

  const stepLabels: Record<string, string> = {
    sign_contract: '电子签约',
    fund_escrow: '资金监管',
    tax_payment: '税费缴纳',
    property_transfer: '产权过户',
    delivery: '房屋交付',
  };

  const getCurrentStep = () => {
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i].status === 'completed' || progress[i].status === 'processing') {
        return i;
      }
    }
    return 0;
  };

  if (!transaction) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }

  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  return (
    <div className="page-container">
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>交易详情</h2>
            <div style={{ color: '#999', marginTop: 4 }}>订单号: {transaction.order_no}</div>
          </div>
          <Tag color={transaction.status === 'completed' ? 'green' : 'blue'} style={{ fontSize: 14, padding: '4px 12px' }}>
            {statusMap[transaction.status] || transaction.status}
          </Tag>
        </div>

        <Steps
          current={getCurrentStep()}
          status={transaction.status === 'completed' ? 'finish' : 'process'}
          items={progress.map((p: any) => ({
            title: stepLabels[p.step] || p.step,
            status: p.status === 'completed' ? 'finish' : p.status === 'processing' ? 'process' : 'wait',
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="交易信息" style={{ borderRadius: 8, marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="房源名称">{transaction.property_title}</Descriptions.Item>
              <Descriptions.Item label="房屋地址">{transaction.property_address}</Descriptions.Item>
              <Descriptions.Item label="房屋面积">{transaction.property_area}㎡</Descriptions.Item>
              <Descriptions.Item label="交易类型">
                {({ new: '新房', secondhand: '二手房', rental: '租赁' } as Record<string, string>)[transaction.type] || transaction.type}
              </Descriptions.Item>
              <Descriptions.Item label="成交价格">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 18 }}>
                  {transaction.price}万
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{transaction.created_at}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="交易双方" style={{ borderRadius: 8, marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ color: '#999', fontSize: 13, marginBottom: 8 }}>买方</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{transaction.buyer_name}</div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{transaction.buyer_phone}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ color: '#999', fontSize: 13, marginBottom: 8 }}>卖方</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{transaction.seller_name}</div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{transaction.seller_phone}</div>
                </div>
              </Col>
            </Row>
            {transaction.agent_name && (
              <div style={{ marginTop: 12, padding: 12, background: '#e6f7ff', borderRadius: 6 }}>
                <div style={{ color: '#1890ff', fontSize: 13, marginBottom: 4 }}>服务经纪人</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{transaction.agent_name} - {transaction.agent_agency}</div>
                <div style={{ color: '#666', fontSize: 13 }}>{transaction.agent_phone}</div>
              </div>
            )}
          </Card>

          <Card title="税费明细" style={{ borderRadius: 8 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="契税" value={tax?.deedTax || 0} precision={2} suffix="万" />
              </Col>
              <Col span={8}>
                <Statistic title="个人所得税" value={tax?.individualTax || 0} precision={2} suffix="万" />
              </Col>
              <Col span={8}>
                <Statistic title="增值税" value={tax?.vat || 0} precision={2} suffix="万" />
              </Col>
            </Row>
            <Divider />
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#999' }}>税费合计：</span>
              <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 'bold' }}>{tax?.total || 0}万</span>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="操作" style={{ borderRadius: 8, position: 'sticky', top: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {!transaction.contract_signed && (
                <Button type="primary" size="large" block loading={loading} onClick={handleSign}>
                  电子签约
                </Button>
              )}
              {transaction.contract_signed && !transaction.fund_escrow && (
                <Button type="primary" size="large" block loading={loading} onClick={handleEscrow}>
                  资金监管
                </Button>
              )}
              {transaction.fund_escrow && transaction.transfer_status === 'pending' && (
                <Button type="primary" size="large" block loading={loading} onClick={handleTransfer}>
                  申请过户
                </Button>
              )}
              {transaction.transfer_status === 'processing' && (
                <Button type="primary" size="large" block loading={loading} onClick={handleComplete}>
                  确认完成
                </Button>
              )}
              {transaction.status === 'completed' && (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <div style={{ marginTop: 12, fontSize: 16, color: '#52c41a' }}>交易已完成</div>
                </div>
              )}
            </Space>

            <Divider />

            <div style={{ fontSize: 13, color: '#999' }}>
              <ClockCircleOutlined /> 资金监管：{transaction.fund_amount || 0}万
            </div>
            <div style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
              网签备案：{transaction.transfer_status === 'completed' ? '已完成' : '待办理'}
            </div>
          </Card>

          <Card 
            title="监管备案" 
            style={{ borderRadius: 8, marginTop: 16 }}
            extra={<Tag color="green">已对接</Tag>}
          >
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
              <p>✅ 地方住建监管平台接入</p>
              <p>✅ 合同网签备案</p>
              <p>✅ 资金监管透明化</p>
              <p>✅ 产权过户进度追踪</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
