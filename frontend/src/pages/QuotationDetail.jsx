import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Descriptions, Statistic, Table, Button, Tag, Progress, Typography, Space, Divider, message, Timeline, Steps, Modal, Input } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, CheckOutlined, HomeOutlined, RiseOutlined, FallOutlined, MinusOutlined, StopOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuotationDetail, confirmQuotation, rejectQuotation } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const QuotationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    const res = await getQuotationDetail(id);
    if (res.code === 200) {
      setQuotation(res.data);
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    Modal.confirm({
      title: '确认报价单',
      content: '确认后将无法修改，并自动启动资金监管流程，是否继续？',
      onOk: async () => {
        const res = await confirmQuotation(id, { remark: '业主确认报价' });
        if (res.code === 200) {
          message.success('报价已确认，资金监管已启动');
          loadDetail();
        } else {
          message.error(res.message);
        }
      }
    });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    const res = await rejectQuotation(id, { reject_reason: rejectReason });
    if (res.code === 200) {
      message.success('报价已驳回');
      setRejectModal(false);
      setRejectReason('');
      loadDetail();
    } else {
      message.error(res.message);
    }
  };

  const statusMap = {
    draft: { color: 'default', text: '草稿' },
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'green', text: '已确认' },
    rejected: { color: 'red', text: '已拒绝' }
  };

  const itemColumns = [
    { title: '项目名称', dataIndex: 'item_name', key: 'item_name', ellipsis: true },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: v => v?.toFixed(2) },
    { title: '小计(元)', dataIndex: 'total_price', key: 'total_price', width: 120, render: v => <span style={{ color: '#f5222d' }}>{v?.toFixed(2)}</span> },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 150, ellipsis: true }
  ];

  if (!quotation) return <div>加载中...</div>;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card loading={loading} bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0 }}>{quotation.title}</Title>
          <div style={{ marginTop: 8 }}>
            <Tag color="blue">报价单号: QO-{quotation.id.toString().padStart(6, '0')}</Tag>
            <Tag color={statusMap[quotation.status]?.color}>{statusMap[quotation.status]?.text}</Tag>
            <Tag>有效期: {quotation.valid_days}天</Tag>
          </div>
        </div>

        <div style={{ padding: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title={<span style={{ color: '#fff', fontSize: 12 }}>总计</span>}
                value={quotation.total_amount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fff', fontSize: 28 }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={<span style={{ color: '#fff', fontSize: 12 }}>硬装</span>}
                value={quotation.hard_decoration_amount}
                precision={0}
                valueStyle={{ color: '#fff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={<span style={{ color: '#fff', fontSize: 12 }}>软装</span>}
                value={quotation.soft_decoration_amount}
                precision={0}
                valueStyle={{ color: '#fff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={<span style={{ color: '#fff', fontSize: 12 }}>人工费</span>}
                value={quotation.labor_amount}
                precision={0}
                valueStyle={{ color: '#fff' }}
              />
            </Col>
          </Row>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">基本信息</div>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="项目名称">{quotation.project_title || '-'}</Descriptions.Item>
            <Descriptions.Item label="业主">{quotation.owner_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{quotation.owner_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="装修公司">{quotation.company_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{quotation.company_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(quotation.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">费用构成</div>
          <Row gutter={[16, 16]}>
            {quotation.categorySummary?.map((cat, idx) => (
              <Col xs={24} sm={12} key={idx}>
                <Card size="small" title={cat.category} extra={<span style={{ color: '#f5222d', fontWeight: 500 }}>¥{cat.total?.toLocaleString()}</span>}>
                  <Progress percent={Math.round((cat.total / quotation.total_amount) * 100)} size="small" />
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">报价明细</div>
          {quotation.categorySummary?.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
                <Tag color="blue">{cat.category}</Tag>
                <span style={{ marginLeft: 8 }}>小计: ¥{cat.total?.toLocaleString()}</span>
              </Divider>
              <Table
                columns={itemColumns}
                dataSource={cat.items}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          ))}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">阶段付款计划</div>
          <Steps size="small" current={quotation.fund_supervision?.filter(f => f.status === 'released').length || 0} style={{ marginBottom: 16 }}>
            {quotation.fund_supervision?.map((f, idx) => (
              <Steps.Step key={idx} title={f.stage_name} description={`${f.payment_ratio}%`} />
            ))}
          </Steps>
          <Table
            size="small"
            dataSource={quotation.fund_supervision}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '阶段', dataIndex: 'stage_name', key: 'stage_name', width: 120 },
              { title: '比例', dataIndex: 'payment_ratio', key: 'payment_ratio', width: 80, render: v => `${v}%` },
              { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: v => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{v?.toLocaleString()}</span> },
              { 
                title: '状态', 
                dataIndex: 'status', 
                key: 'status', 
                width: 120,
                render: v => {
                  const statusMap = {
                    frozen: { color: 'default', text: '已冻结', icon: <LockOutlined /> },
                    pending_release: { color: 'orange', text: '待释放', icon: <ClockCircleOutlined /> },
                    released: { color: 'green', text: '已释放', icon: <UnlockOutlined /> }
                  };
                  return <Tag icon={statusMap[v]?.icon} color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>;
                }
              },
              { title: '释放条件', dataIndex: 'release_condition', key: 'release_condition' },
              { 
                title: '释放时间', 
                dataIndex: 'released_at', 
                key: 'released_at', 
                width: 160,
                render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
              }
            ]}
          />
        </div>

        <div className="detail-section">
          <div className="detail-section-title">材料价格波动引用</div>
          <Row gutter={[12, 12]}>
            {quotation.material_price_refs?.map((m, idx) => (
              <Col xs={24} sm={12} md={6} key={idx}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ fontSize: 12, color: '#888' }}>{m.material_name} ({m.specification})</div>
                  <div style={{ margin: '8px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>¥{m.price}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>/{m.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#888' }}>报价: ¥{m.quote_unit_price}</span>
                    <span style={{ 
                      color: m.price_trend === 'up' ? '#f5222d' : m.price_trend === 'down' ? '#52c41a' : '#888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      {m.price_trend === 'up' ? <RiseOutlined /> : m.price_trend === 'down' ? <FallOutlined /> : <MinusOutlined />}
                      {m.price_trend === 'up' ? '+' : ''}{m.price_diff?.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                    品牌: {m.brand} | {dayjs(m.price_date).format('MM-DD')}
                  </div>
                </Card>
              </Col>
            ))}
            {(!quotation.material_price_refs || quotation.material_price_refs.length === 0) && (
              <Col span={24}>
                <Card size="small" style={{ textAlign: 'center', color: '#888' }}>
                  暂无材料价格波动数据
                </Card>
              </Col>
            )}
          </Row>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">确认/驳回记录</div>
          {quotation.audit_logs && quotation.audit_logs.length > 0 ? (
            <Timeline>
              {quotation.audit_logs.map((log, idx) => (
                <Timeline.Item 
                  key={idx}
                  color={log.action === 'confirm' ? 'green' : log.action === 'reject' ? 'red' : 'blue'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {log.action === 'confirm' ? <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} /> :
                       log.action === 'reject' ? <StopOutlined style={{ color: '#f5222d', marginRight: 4 }} /> : null}
                      <strong>{log.operator_name || '系统'}</strong>
                      <span style={{ color: '#888', margin: '0 8px' }}>
                        {log.action === 'confirm' ? '确认报价' : log.action === 'reject' ? '驳回报价' : log.action}
                      </span>
                    </span>
                    <span style={{ color: '#888', fontSize: 12 }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  {log.request_data && (
                    <div style={{ marginTop: 4, padding: 8, background: '#f5f5f5', borderRadius: 4, fontSize: 12 }}>
                      {JSON.parse(log.request_data).reject_reason || JSON.parse(log.request_data).remark || '-'}
                    </div>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Card size="small" style={{ textAlign: 'center', color: '#888' }}>
              暂无操作记录
            </Card>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">资金监管状态</div>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic 
                  title="总监管金额" 
                  value={quotation.fund_supervision?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0} 
                  precision={0}
                  prefix="¥"
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic 
                  title="已释放金额" 
                  value={quotation.fund_supervision?.filter(f => f.status === 'released').reduce((sum, f) => sum + (f.amount || 0), 0) || 0} 
                  precision={0}
                  prefix="¥"
                  valueStyle={{ fontSize: 18, color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic 
                  title="冻结中金额" 
                  value={quotation.fund_supervision?.filter(f => f.status === 'frozen').reduce((sum, f) => sum + (f.amount || 0), 0) || 0} 
                  precision={0}
                  prefix="¥"
                  valueStyle={{ fontSize: 18, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic 
                  title="监管进度" 
                  value={quotation.fund_supervision?.length ? 
                    Math.round((quotation.fund_supervision.filter(f => f.status === 'released').length / quotation.fund_supervision.length) * 100) : 0} 
                  suffix="%"
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {quotation.status === 'pending' && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button type="primary" size="large" icon={<CheckOutlined />} onClick={handleConfirm}>
                确认报价
              </Button>
              <Button size="large" danger icon={<StopOutlined />} onClick={() => setRejectModal(true)}>
                驳回报价
              </Button>
            </Space>
          </div>
        )}
      </Card>

      <Modal
        title="驳回报价"
        open={rejectModal}
        onCancel={() => { setRejectModal(false); setRejectReason(''); }}
        onOk={handleReject}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 8 }}>请填写驳回原因：</div>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="请详细说明驳回原因，以便装修公司修改..."
        />
      </Modal>
    </div>
  );
};

export default QuotationDetail;
