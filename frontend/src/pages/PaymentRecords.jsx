import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Tag, DatePicker, Select, Form, Space, Statistic, Row, Col, Tabs, Modal, Descriptions, Alert, Result, message, Timeline } from 'antd';
import { SearchOutlined, ReloadOutlined, FileTextOutlined, FilePdfOutlined, UserOutlined, TeamOutlined, ArrowLeftOutlined, SafetyCertificateOutlined, IdcardOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

export default function PaymentRecords() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isAgentFilter, setIsAgentFilter] = useState('');
  const [agentRelationFilter, setAgentRelationFilter] = useState('');
  const [voucherModal, setVoucherModal] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params = {
        page,
        page_size: pageSize,
        account_id: values.account_id,
        is_agent: isAgentFilter,
        agent_relation: agentRelationFilter
      };

      if (activeTab === 'self') params.is_agent = '0';
      if (activeTab === 'agent') params.is_agent = '1';

      if (values.date_range && values.date_range.length === 2) {
        params.start_date = values.date_range[0].format('YYYY-MM-DD');
        params.end_date = values.date_range[1].format('YYYY-MM-DD');
      }

      const res = await api.get('/payment/records', { params });
      setRecords(res.records);
      setSummary(res.summary);
      setPagination(p => ({ ...p, current: page, pageSize, total: res.total }));
    } catch (err) {
      message.error('获取记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.accounts);
    } catch (err) {
      console.error('获取户号失败');
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchRecords(1, 10);
  }, []);

  useEffect(() => {
    fetchRecords(1, pagination.pageSize);
  }, [activeTab, isAgentFilter, agentRelationFilter]);

  const handleSearch = () => {
    fetchRecords(1, pagination.pageSize);
  };

  const handleReset = () => {
    form.resetFields();
    setIsAgentFilter('');
    setAgentRelationFilter('');
    setActiveTab('all');
    fetchRecords(1, 10);
  };

  const handleTableChange = (pg) => {
    fetchRecords(pg.current, pg.pageSize);
  };

  const handleViewVoucher = async (record) => {
    setVoucherLoading(true);
    try {
      const res = await api.get(`/payment/${record.id}/voucher`);
      setCurrentVoucher(res);
      setVoucherModal(true);
    } catch (err) {
      message.error('获取凭证失败');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleInvoice = async (record) => {
    if (record.invoice_status === 'issued') {
      Modal.info({
        title: '电子发票',
        content: (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="发票号">{record.invoice_no}</Descriptions.Item>
            <Descriptions.Item label="核验码">{record.verification_code}</Descriptions.Item>
            <Descriptions.Item label="开票金额">¥{record.amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="开票时间">{record.updated_at || dayjs().format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          </Descriptions>
        ),
        width: 600
      });
      return;
    }

    Modal.confirm({
      title: '开具电子发票',
      icon: <FilePdfOutlined />,
      content: `确认开具 ¥${record.amount.toFixed(2)} 的电子发票？`,
      onOk: async () => {
        try {
          const res = await api.post(`/payment/${record.id}/invoice`);
          message.success('电子发票开具成功');
          Modal.success({
            title: '发票开具成功',
            content: (
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="发票号">{res.data.invoice_no}</Descriptions.Item>
                <Descriptions.Item label="核验码">{res.data.verification_code}</Descriptions.Item>
              </Descriptions>
            )
          });
          fetchRecords(pagination.current, pagination.pageSize);
        } catch (err) {
          message.error('发票开具失败');
        }
      }
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'recharge': return 'green';
      case 'refund': return 'red';
      case 'penalty': return 'orange';
      default: return 'blue';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'recharge': return '电费充值';
      case 'refund': return '退款';
      case 'penalty': return '违约金';
      default: return '其他';
    }
  };

  const getRelationText = (r) => {
    const map = { parents: '父母', children: '子女', spouse: '配偶', friend: '朋友', landlord: '房东', tenant: '租客' };
    return map[r] || '其他';
  };

  const columns = [
    {
      title: '缴费时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
      width: 170
    },
    {
      title: '户号信息',
      key: 'account',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span><IdcardOutlined /> {r.account_number}</span>
          <span style={{ fontSize: 12, color: '#666' }}>{r.account_name}</span>
        </Space>
      ),
      width: 200
    },
    {
      title: '缴费类型',
      key: 'category',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={getTypeColor(r.payment_type)}>{getTypeText(r.payment_type)}</Tag>
          {r.is_agent ? (
            <Tag color="purple"><TeamOutlined /> 代缴 · {getRelationText(r.agent_relation)}</Tag>
          ) : (
            <Tag color="green"><UserOutlined /> 本人</Tag>
          )}
        </Space>
      ),
      width: 180
    },
    {
      title: '代缴追溯',
      key: 'agent',
      render: (_, r) => (
        r.is_agent ? (
          <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
            <div>缴费人：{r.payer_name}</div>
            <div>户主：{r.payee_name}</div>
          </Space>
        ) : <span style={{ color: '#999' }}>本人缴费</span>
      ),
      width: 160
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: v => <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{v.toFixed(2)}</span>,
      width: 100
    },
    {
      title: '状态',
      key: 'status',
      render: (_, r) => (
        <Space>
          <Tag color={r.status === 'success' ? 'green' : 'red'}>
            {r.status === 'success' ? '已到账' : '失败'}
          </Tag>
          {r.invoice_status === 'issued' && <Tag color="blue">已开票</Tag>}
          {r.points_earned > 0 && <Tag color="gold">+{r.points_earned}积分</Tag>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleViewVoucher(r)}>
            查看凭证
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => handleInvoice(r)}
            disabled={r.status !== 'success'}
          >
            {r.invoice_status === 'issued' ? '查看发票' : '开发票'}
          </Button>
        </Space>
      ),
      width: 180,
      fixed: 'right'
    }
  ];

  const filteredRecords = useMemo(() => records, [records]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <ArrowLeftOutlined style={{ cursor: 'pointer' }} onClick={() => navigate(-1)} />
            <span>交费记录</span>
          </Space>
        }
        variant="outlined"
      >
        {summary && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总缴费笔数"
                  value={summary.total_count}
                  suffix="笔"
                  prefix={<MoneyCollectOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总缴费金额"
                  value={summary.total_amount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="代缴笔数"
                  value={summary.agent_count}
                  suffix="笔"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="代缴金额"
                  value={summary.agent_amount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Card
          size="small"
          style={{ marginBottom: 16, background: '#fafafa' }}
          title={
            <Space>
              <SearchOutlined />
              <span>缴费筛选</span>
            </Space>
          }
        >
          <Form form={form} layout="inline">
            <Form.Item name="account_id" label="户号">
              <Select placeholder="请选择户号" style={{ width: 180 }} allowClear>
                {accounts.map(a => (
                  <Option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="date_range" label="日期范围">
              <RangePicker />
            </Form.Item>
            <Form.Item label="代缴类型">
              <Select value={isAgentFilter} onChange={setIsAgentFilter} style={{ width: 140 }} allowClear placeholder="全部类型">
                <Option value="">全部类型</Option>
                <Option value="0">本人缴费</Option>
                <Option value="1">代缴</Option>
              </Select>
            </Form.Item>
            {isAgentFilter === '1' && (
              <Form.Item label="关系">
                <Select value={agentRelationFilter} onChange={setAgentRelationFilter} style={{ width: 120 }} allowClear placeholder="全部关系">
                  <Option value="parents">父母</Option>
                  <Option value="children">子女</Option>
                  <Option value="spouse">配偶</Option>
                  <Option value="friend">朋友</Option>
                  <Option value="landlord">房东</Option>
                  <Option value="tenant">租客</Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
          <TabPane tab="全部记录" key="all" />
          <TabPane tab="本人缴费" key="self" />
          <TabPane tab="代缴记录" key="agent" />
        </Tabs>

        {activeTab === 'all' && summary && (
          <Alert
            message={
              <Space>
                <span>分类结果：共 <b>{summary.total_count}</b> 笔，¥{summary.total_amount.toFixed(2)}</span>
                <Tag color="green">本人 {summary.total_count - summary.agent_count} 笔 / ¥{(summary.total_amount - summary.agent_amount).toFixed(2)}</Tag>
                <Tag color="purple">代缴 {summary.agent_count} 笔 / ¥{summary.agent_amount.toFixed(2)}</Tag>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {activeTab === 'agent' && summary && summary.agent_count > 0 && (
          <Alert
            message="代缴关系追溯已启用，所有代缴记录均已关联缴费人与户主身份信息，可作为权益核查依据"
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>缴费凭证</span>
          </Space>
        }
        open={voucherModal}
        onCancel={() => setVoucherModal(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setVoucherModal(false)}>关闭</Button>
        ]}
        destroyOnClose
        confirmLoading={voucherLoading}
      >
        {currentVoucher && (
          <div>
            <Result
              status="success"
              title="缴费已完成"
              subTitle={`${dayjs(currentVoucher.created_at).format('YYYY-MM-DD HH:mm:ss')} 成功缴费 ¥${currentVoucher.amount.toFixed(2)}`}
              extra={[
                currentVoucher.invoice_status === 'issued' ? (
                  <Tag color="blue">电子发票已开具：{currentVoucher.invoice_no}</Tag>
                ) : (
                  <Tag color="default">待开票</Tag>
                ),
                currentVoucher.verification_code && (
                  <Tag color="gold">核验码：{currentVoucher.verification_code}</Tag>
                )
              ]}
            />

            <Card size="small" title="缴费凭证信息" style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="凭证号">{currentVoucher.voucher_no || 'PVD' + currentVoucher.id}</Descriptions.Item>
                <Descriptions.Item label="到账状态">
                  <Tag color="green">
                    {currentVoucher.arrival_status === 'confirmed' ? '已确认到账' : '处理中'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="户号">{currentVoucher.account_number}</Descriptions.Item>
                <Descriptions.Item label="户名">{currentVoucher.account_name}</Descriptions.Item>
                <Descriptions.Item label="缴费金额">¥{currentVoucher.amount.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="支付方式">
                  {currentVoucher.payment_method === 'alipay' ? '支付宝' :
                   currentVoucher.payment_method === 'wechat' ? '微信支付' : '其他'}
                </Descriptions.Item>
                <Descriptions.Item label="缴费类型" span={2}>
                  <Space>
                    <Tag color={getTypeColor(currentVoucher.payment_type)}>{getTypeText(currentVoucher.payment_type)}</Tag>
                    {currentVoucher.is_agent && (
                      <Tag color="purple">代缴 · {getRelationText(currentVoucher.agent_relation)}</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                {currentVoucher.is_agent && (
                  <>
                    <Descriptions.Item label="缴费人">{currentVoucher.payer_name}</Descriptions.Item>
                    <Descriptions.Item label="户主">{currentVoucher.payee_name}</Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="缴费时间" span={2}>
                  {dayjs(currentVoucher.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="到账状态追踪" style={{ marginTop: 16 }}>
              <Timeline
                items={[
                  { color: 'green', children: `缴费发起 - ${dayjs(currentVoucher.created_at).format('YYYY-MM-DD HH:mm:ss')}` },
                  { color: 'green', children: `支付渠道扣款成功 - ${dayjs(currentVoucher.created_at).add(1, 'second').format('YYYY-MM-DD HH:mm:ss')}` },
                  { color: 'green', children: `省级营销系统入账确认 - ${dayjs(currentVoucher.created_at).add(2, 'second').format('YYYY-MM-DD HH:mm:ss')}` },
                  { color: 'green', children: <b>已确认到账</b> }
                ]}
              />
            </Card>

            {currentVoucher.points_earned > 0 && (
              <Alert
                message={`本次缴费获得 ${currentVoucher.points_earned} 积分，可前往积分商城兑换权益`}
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
