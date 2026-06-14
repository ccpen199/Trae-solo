import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Input, Modal, Descriptions, List, Statistic, Row, Col, message, Steps, Progress, Card, Timeline, Divider } from 'antd';
import { FileTextOutlined, PlusOutlined, EyeOutlined, CheckOutlined, SearchOutlined, RiseOutlined, FallOutlined, MinusOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getQuotations, confirmQuotation, calculateQuote, rejectQuotation } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Quotations = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [quoteModal, setQuoteModal] = useState(false);
  const [quoteParams, setQuoteParams] = useState({ area: 100, style: '现代简约', quality_level: 'standard' });
  const [quoteResult, setQuoteResult] = useState(null);

  const statusMap = {
    draft: { color: 'default', text: '草稿' },
    pending: { color: 'orange', text: '待确认' },
    confirmed: { color: 'green', text: '已确认' },
    rejected: { color: 'red', text: '已拒绝' },
    expired: { color: 'default', text: '已过期' }
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, status, keyword]);

  const loadData = async () => {
    setLoading(true);
    const res = await getQuotations({
      page: pagination.current,
      pageSize: pagination.pageSize,
      status,
      keyword
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleConfirm = async (id) => {
    Modal.confirm({
      title: '确认报价单',
      content: '确认后将无法修改，是否继续？',
      onOk: async () => {
        const res = await confirmQuotation(id);
        if (res.code === 200) {
          message.success('报价单已确认');
          loadData();
        } else {
          message.error(res.message);
        }
      }
    });
  };

  const handleQuickQuote = async () => {
    const res = await calculateQuote(quoteParams);
    if (res.code === 200) {
      setQuoteResult(res.data);
    }
  };

  const columns = [
    { title: '报价单号', dataIndex: 'id', key: 'id', width: 100, render: v => `QO-${v.toString().padStart(6, '0')}` },
    { title: '报价标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '所属项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true },
    { title: '业主', dataIndex: 'owner_name', key: 'owner_name', width: 100 },
    { 
      title: '总价(元)', 
      dataIndex: 'total_amount', 
      key: 'total_amount', 
      width: 130,
      render: v => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{v?.toLocaleString()}</span>
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/quotations/${record.id}`)}>查看</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>确认</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          报价管理
        </Title>
        <Space>
          <Button type="primary" onClick={() => setQuoteModal(true)}>
            <PlusOutlined /> 快速报价
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索报价标题"
          style={{ width: 240 }}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          allowClear
        />
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 160 }}
          value={status || undefined}
          onChange={v => setStatus(v || '')}
        >
          <Select.Option value="draft">草稿</Select.Option>
          <Select.Option value="pending">待确认</Select.Option>
          <Select.Option value="confirmed">已确认</Select.Option>
          <Select.Option value="rejected">已拒绝</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="快速报价估算"
        open={quoteModal}
        onCancel={() => setQuoteModal(false)}
        width={quoteResult ? 1000 : 600}
        footer={null}
      >
        <div style={{ padding: 16 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <div style={{ marginBottom: 4 }}>面积(㎡)</div>
              <Input type="number" value={quoteParams.area} onChange={e => setQuoteParams(p => ({ ...p, area: e.target.value }))} />
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 4 }}>风格</div>
              <Select style={{ width: '100%' }} value={quoteParams.style} onChange={v => setQuoteParams(p => ({ ...p, style: v }))}>
                <Select.Option value="现代简约">现代简约</Select.Option>
                <Select.Option value="新中式">新中式</Select.Option>
                <Select.Option value="北欧风格">北欧风格</Select.Option>
                <Select.Option value="轻奢美式">轻奢美式</Select.Option>
                <Select.Option value="日式极简">日式极简</Select.Option>
              </Select>
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 4 }}>档次</div>
              <Select style={{ width: '100%' }} value={quoteParams.quality_level} onChange={v => setQuoteParams(p => ({ ...p, quality_level: v }))}>
                <Select.Option value="经济简约">经济简约</Select.Option>
                <Select.Option value="standard">品质标准</Select.Option>
                <Select.Option value="品质优选">品质优选</Select.Option>
                <Select.Option value="豪华定制">豪华定制</Select.Option>
              </Select>
            </Col>
          </Row>
          <Button type="primary" block onClick={handleQuickQuote}>计算报价</Button>
          
          {quoteResult && (
            <div style={{ marginTop: 24 }}>
              <Steps current={3} size="small" style={{ marginBottom: 24 }}>
                <Steps.Step title="参数设置" />
                <Steps.Step title="价格计算" />
                <Steps.Step title="复核阶段" />
                <Steps.Step title="确认生效" />
              </Steps>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>预估总价</div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: '#f5222d' }}>¥{quoteResult.total_estimate?.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>约 ¥{quoteResult.per_sqm_price}/㎡</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic title="硬装" value={quoteResult.breakdown?.hard_decoration} precision={0} />
                    <Progress percent={55} size="small" />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic title="软装" value={quoteResult.breakdown?.soft_decoration} precision={0} />
                    <Progress percent={25} size="small" />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic title="家电+设计" value={quoteResult.breakdown?.appliances + quoteResult.breakdown?.design_fee} precision={0} />
                    <Progress percent={20} size="small" />
                  </Col>
                </Row>
              </Card>

              <Divider orientation="left"><Tag color="blue">阶段付款计划</Tag></Divider>
              <Table
                size="small"
                dataSource={quoteResult.payment_stages}
                rowKey="stage"
                pagination={false}
                columns={[
                  { title: '阶段', dataIndex: 'stage_name', key: 'stage_name', width: 100 },
                  { title: '付款比例', dataIndex: 'payment_ratio', key: 'payment_ratio', width: 100, render: v => `${v}%` },
                  { title: '应付金额', dataIndex: 'amount', key: 'amount', width: 120, render: v => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{v?.toLocaleString()}</span> },
                  { title: '释放条件', dataIndex: 'release_condition', key: 'release_condition' }
                ]}
              />

              <Divider orientation="left"><Tag color="orange">材料价格波动引用</Tag></Divider>
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {quoteResult.material_price_refs?.map((m, idx) => (
                  <Col xs={12} sm={6} key={idx}>
                    <Card size="small" style={{ height: '100%' }}>
                      <div style={{ fontSize: 12, color: '#888' }}>{m.material_name}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, margin: '4px 0' }}>¥{m.price}/{m.unit}</div>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {m.trend === 'up' ? <RiseOutlined style={{ color: '#f5222d' }} /> :
                         m.trend === 'down' ? <FallOutlined style={{ color: '#52c41a' }} /> :
                         <MinusOutlined style={{ color: '#888' }} />}
                        <span style={{ color: m.trend === 'up' ? '#f5222d' : m.trend === 'down' ? '#52c41a' : '#888' }}>
                          {m.change_rate > 0 ? '+' : ''}{m.change_rate}%
                        </span>
                        <span style={{ color: '#888', marginLeft: 'auto' }}>{m.brand}</span>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Divider orientation="left"><Tag color="green">分项明细预览</Tag></Divider>
              {quoteResult.item_breakdown?.map((cat, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>{cat.category}</div>
                  <Table
                    size="small"
                    dataSource={cat.items}
                    rowKey="item_name"
                    pagination={false}
                    columns={[
                      { title: '项目', dataIndex: 'item_name', key: 'item_name' },
                      { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
                      { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                      { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: v => `¥${v}` },
                      { title: '小计', dataIndex: 'total_price', key: 'total_price', width: 120, render: v => <span style={{ color: '#f5222d' }}>¥{v?.toLocaleString()}</span> }
                    ]}
                  />
                </div>
              ))}

              <Divider orientation="left"><Tag color="purple">操作记录</Tag></Divider>
              <Timeline size="small">
                <Timeline.Item color="green">报价计算完成 - {dayjs().format('YYYY-MM-DD HH:mm')}</Timeline.Item>
                <Timeline.Item color="gray">待业主确认</Timeline.Item>
                <Timeline.Item color="gray">资金监管生效</Timeline.Item>
              </Timeline>

              <Row gutter={[12, 12]} style={{ marginTop: 24 }}>
                <Col span={12}>
                  <Button block onClick={() => message.info('报价已保存为草稿')}>保存草稿</Button>
                </Col>
                <Col span={12}>
                  <Button type="primary" block onClick={() => message.success('正式报价单已生成')}>生成正式报价单</Button>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Quotations;
