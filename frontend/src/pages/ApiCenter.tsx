import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, Button, Space, Tag, App, Table, Progress, Statistic, Alert, Tabs, Modal, Typography, CopyableText, List, Tooltip } from 'antd';
import { ApiOutlined, SafetyOutlined, CopyOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, KeyOutlined, ThunderboltOutlined, BookOutlined, CodeOutlined, ShopOutlined, MessageOutlined, BulbOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../api';
import ReactECharts from 'echarts-for-react';

const { Text, Paragraph, Title } = Typography;

export default function ApiCenter() {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [activeApi, setActiveApi] = useState('brands');
  const [tryResult, setTryResult] = useState<any>(null);
  const [tryLoading, setTryLoading] = useState(false);
  const [form] = Form.useForm();
  const [tryForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const usage: any = await api.dashboard.apiUsage();
      setApiUsage(usage);
      setApps(usage.applications || [
        { id: 1, app_name: '某电商ERP系统', app_key: 'ecom_erp_8f3a2d1b', status: 'active', daily_limit: 50000, today_calls: 32456, created_at: '2024-08-15', contact: '张经理 138****5678' },
        { id: 2, app_name: 'WMS仓储系统', app_key: 'wms_sys_c9e4f7a2', status: 'active', daily_limit: 20000, today_calls: 15892, created_at: '2024-09-01', contact: '李主管 139****1234' },
        { id: 3, app_name: '门店POS', app_key: 'pos_retail_b1d8e5c3', status: 'active', daily_limit: 10000, today_calls: 6234, created_at: '2024-09-20', contact: '王店长 137****9876' },
        { id: 4, app_name: '测试应用', app_key: 'test_app_a7f2d9e4', status: 'suspended', daily_limit: 5000, today_calls: 0, created_at: '2024-10-01', contact: '测试员' }
      ]);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const onCreate = async () => {
    try {
      const vals = await form.validateFields();
      const newApp = {
        id: Date.now(),
        ...vals,
        app_key: 'app_' + Math.random().toString(36).substring(2, 12),
        app_secret: 'sk_' + Math.random().toString(36).substring(2, 24),
        status: 'active',
        daily_limit: vals.daily_limit || 10000,
        today_calls: 0,
        created_at: new Date().toISOString().split('T')[0]
      };
      setApps([newApp, ...apps]);
      message.success('API应用创建成功，AppKey已生成');
      setCreateModal(false);
      form.resetFields();
    } catch (e: any) {
      if (e.message) message.error(e.message);
    }
  };

  const onTryApi = async () => {
    try {
      setTryLoading(true);
      setTryResult(null);
      const vals = await tryForm.validateFields();
      let result: any;
      switch (activeApi) {
        case 'brands':
          result = await api.open.brands(vals.app_key);
          break;
        case 'tracking':
          result = await api.open.tracking(vals.order_no, vals.app_key);
          break;
        default:
          result = { message: 'Unknown API' };
      }
      setTryResult(result);
    } catch (e: any) {
      setTryResult({ error: true, message: e.message, data: e });
    } finally { setTryLoading(false); }
  };

  const usageTrendOpt = apiUsage ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['调用次数', '失败次数'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
    yAxis: { type: 'value' },
    series: [
      { name: '调用次数', type: 'line', smooth: true, data: [450, 280, 3200, 8500, 12800, 9200, 4800], areaStyle: { opacity: 0.3 }, itemStyle: { color: '#1677ff' } },
      { name: '失败次数', type: 'line', smooth: true, data: [5, 3, 28, 65, 89, 52, 18], itemStyle: { color: '#ff4d4f' } }
    ]
  } : {};

  const apiMethodDistributionOpt = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: 32, name: '创建运单', itemStyle: { color: '#1677ff' } },
        { value: 28, name: '轨迹查询', itemStyle: { color: '#52c41a' } },
        { value: 18, name: '品牌查询', itemStyle: { color: '#fa8c16' } },
        { value: 12, name: '比价接口', itemStyle: { color: '#722ed1' } },
        { value: 10, name: '快递员查询', itemStyle: { color: '#13c2c2' } }
      ]
    }]
  };

  const apis = [
    {
      key: 'brands',
      name: '品牌列表查询',
      icon: <ShopOutlined />,
      method: 'GET',
      path: '/open/brands',
      desc: '获取已接入的所有快递品牌列表，包含品牌名称、代码、服务评分、覆盖区域等信息。',
      params: [
        { name: 'X-App-Key', location: 'Header', required: '是', desc: '应用凭证 AppKey' }
      ],
      demo: { app_key: 'ecom_erp_8f3a2d1b' },
      fields: [
        { key: 'app_key', label: 'AppKey', initialValue: 'ecom_erp_8f3a2d1b' }
      ],
      responseExample: `{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "顺丰速运",
      "code": "SF",
      "rating": 4.8,
      "coverage": 98.5
    }
  ]
}`
    },
    {
      key: 'tracking',
      name: '运单轨迹查询',
      icon: <MessageOutlined />,
      method: 'GET',
      path: '/open/orders/:order_no/tracking',
      desc: '根据运单号查询物流轨迹信息，支持所有接入品牌的运单统一查询格式。',
      params: [
        { name: 'X-App-Key', location: 'Header', required: '是', desc: '应用凭证 AppKey' },
        { name: 'order_no', location: 'Path', required: '是', desc: '运单号' }
      ],
      demo: { app_key: 'ecom_erp_8f3a2d1b', order_no: 'SF202410150001' },
      fields: [
        { key: 'app_key', label: 'AppKey', initialValue: 'ecom_erp_8f3a2d1b' },
        { key: 'order_no', label: '运单号', initialValue: 'SF202410150001' }
      ],
      responseExample: `{
  "code": 0,
  "data": {
    "order_no": "SF202410150001",
    "status": "delivering",
    "tracking": [
      {
        "time": "2024-10-15 14:30:00",
        "location": "北京市朝阳区",
        "description": "快递员正在派送中"
      }
    ]
  }
}`
    },
    {
      key: 'createOrder',
      name: '创建运单',
      icon: <ThunderboltOutlined />,
      method: 'POST',
      path: '/open/orders',
      desc: '创建快递运单，自动选择最优品牌，返回运单号、预估运费和预计时效。',
      params: [
        { name: 'X-App-Key', location: 'Header', required: '是', desc: '应用凭证 AppKey' },
        { name: 'X-App-Sign', location: 'Header', required: '是', desc: '请求签名（HMAC-SHA256）' },
        { name: 'body', location: 'Body', required: '是', desc: '运单信息 JSON' }
      ],
      demo: { app_key: 'ecom_erp_8f3a2d1b', order_no: '' },
      fields: [
        { key: 'app_key', label: 'AppKey', initialValue: 'ecom_erp_8f3a2d1b' },
        { key: 'order_no', label: '运单号(查询时填)', initialValue: '' }
      ],
      responseExample: `{
  "code": 0,
  "data": {
    "order_no": "SF202410150001",
    "brand": "顺丰速运",
    "price": 18.50,
    "estimated_delivery": "2024-10-16 18:00:00"
  }
}`
    },
    {
      key: 'compare',
      name: '比价决策',
      icon: <BulbOutlined />,
      method: 'POST',
      path: '/open/price/compare',
      desc: '多维度快递比价，基于价格35%+时效30%+覆盖度20%+服务评分15%的综合评分算法推荐最优方案。',
      params: [
        { name: 'X-App-Key', location: 'Header', required: '是', desc: '应用凭证 AppKey' },
        { name: 'body', location: 'Body', required: '是', desc: '比价参数（寄件地、收件地、重量等）' }
      ],
      demo: { app_key: 'ecom_erp_8f3a2d1b', order_no: '' },
      fields: [
        { key: 'app_key', label: 'AppKey', initialValue: 'ecom_erp_8f3a2d1b' }
      ],
      responseExample: `{
  "code": 0,
  "data": {
    "recommendation": { "brand": "顺丰速运", "price": 18.5 },
    "alternatives": [
      { "brand": "中通快递", "price": 12.0 },
      { "brand": "圆通速递", "price": 11.5 }
    ]
  }
}`
    },
    {
      key: 'couriers',
      name: '快递员查询',
      icon: <KeyOutlined />,
      method: 'GET',
      path: '/open/couriers/:region',
      desc: '查询指定区域的可用快递员列表，包含服务评分、派件范围、当前负载状态等信息。',
      params: [
        { name: 'X-App-Key', location: 'Header', required: '是', desc: '应用凭证 AppKey' },
        { name: 'region', location: 'Path', required: '是', desc: '区域编码' }
      ],
      demo: { app_key: 'ecom_erp_8f3a2d1b', order_no: '' },
      fields: [
        { key: 'app_key', label: 'AppKey', initialValue: 'ecom_erp_8f3a2d1b' }
      ],
      responseExample: `{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "李师傅",
      "phone": "138****5678",
      "rating": 4.9,
      "status": "available"
    }
  ]
}`
    }
  ];

  const currentApi = apis.find(a => a.key === activeApi);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={<><ApiOutlined /> API 开放中心</>}
        extra={
          <Space>
            <Tag color="blue">已接入 30+ 快递品牌</Tag>
            <Tag color="green">5 类开放接口</Tag>
            <Tag color="purple">日均 50万+ 次调用</Tag>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>创建API应用</Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          icon={<SafetyOutlined />}
          message={
            <Space direction="vertical" size={2}>
              <div><b>安全鉴权说明</b></div>
              <div>所有开放API调用需携带 <Text code>X-App-Key</Text> 请求头，写操作还需通过 HMAC-SHA256 签名（<Text code>X-App-Sign</Text>）防篡改。单应用日调用量限制根据套餐等级配置，超出将返回 429 Too Many Requests。</div>
            </Space>
          }
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><ApiOutlined /> 今日调用量</>}
              value={apiUsage?.total?.calls || 54582}
              valueStyle={{ color: '#1677ff', fontSize: 26 }}
              precision={0}
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><CheckCircleOutlined /> 成功率</>}
              value={apiUsage?.total?.success_rate || 99.2}
              valueStyle={{ color: '#52c41a', fontSize: 26 }}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><ClockCircleOutlined /> 平均响应</>}
              value={apiUsage?.total?.avg_response || 128}
              valueStyle={{ color: '#722ed1', fontSize: 26 }}
              suffix="ms"
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><KeyOutlined /> 接入应用</>}
              value={apps.length}
              valueStyle={{ color: '#fa8c16', fontSize: 26 }}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="📈 今日调用趋势（按小时）">
            <ReactECharts option={usageTrendOpt} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🥧 API接口调用分布">
            <ReactECharts option={apiMethodDistributionOpt} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card title={<><KeyOutlined /> 我的API应用</>}>
        <Table
          size="middle"
          rowKey="id"
          loading={loading}
          dataSource={apps}
          pagination={false}
          columns={[
            { title: '应用ID', dataIndex: 'id', width: 70, render: (v: any) => `#${v}` },
            { title: '应用名称', dataIndex: 'app_name', width: 160, render: (v: string) => <b>{v}</b> },
            {
              title: 'AppKey',
              dataIndex: 'app_key',
              width: 220,
              render: (v: string) => <Space><Text code style={{ fontSize: 12 }}>{v}</Text><CopyOutlined style={{ cursor: 'pointer', color: '#1677ff' }} onClick={() => { navigator.clipboard?.writeText(v); message.success('已复制'); }} /></Space>
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (s: string) => ({
                active: <Tag color="green">已启用</Tag>,
                suspended: <Tag color="orange">已暂停</Tag>,
                disabled: <Tag color="default">已禁用</Tag>
              } as any)[s] || s
            },
            {
              title: '今日调用',
              width: 180,
              render: (_: any, r: any) => {
                const pct = Math.min(100, Math.round((r.today_calls / r.daily_limit) * 100));
                return (
                  <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>{r.today_calls.toLocaleString()} / {r.daily_limit.toLocaleString()}</div>
                    <Progress percent={pct} size="small" strokeColor={pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#fa8c16' : '#52c41a'} showInfo={false} />
                  </div>
                );
              }
            },
            { title: '创建日期', dataIndex: 'created_at', width: 110 },
            { title: '联系人', dataIndex: 'contact', width: 160 },
            {
              title: '操作',
              width: 160,
              render: (_: any, r: any) => (
                <Space size="small">
                  <Button size="small" icon={<EyeOutlined />}>查看密钥</Button>
                  <Button size="small">重置</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Card title={<><BookOutlined /> API 接口文档与在线调试</>}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <List
              bordered
              dataSource={apis}
              renderItem={(a: any) => (
                <List.Item
                  key={a.key}
                  style={{
                    padding: '12px 14px',
                    background: activeApi === a.key ? '#e6f4ff' : '#fff',
                    borderLeft: activeApi === a.key ? '3px solid #1677ff' : '3px solid transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setActiveApi(a.key); setTryResult(null); tryForm.resetFields(); }}
                >
                  <List.Item.Meta
                    avatar={<div style={{ fontSize: 20, color: '#1677ff' }}>{a.icon}</div>}
                    title={
                      <Space>
                        <span style={{ fontWeight: 600 }}>{a.name}</span>
                        <Tag color={a.method === 'GET' ? 'green' : 'blue'}>{a.method}</Tag>
                      </Space>
                    }
                    description={<Text code style={{ fontSize: 11 }}>{a.path}</Text>}
                  />
                </List.Item>
              )}
            />
          </Col>

          <Col xs={24} md={18}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card size="small" title={
                <Space>
                  <span style={{ fontSize: 20, color: '#1677ff' }}>{currentApi?.icon}</span>
                  <b>{currentApi?.name}</b>
                  <Tag color={currentApi?.method === 'GET' ? 'green' : 'blue'}>{currentApi?.method}</Tag>
                  <Text code>{currentApi?.path}</Text>
                </Space>
              }>
                <Paragraph style={{ marginBottom: 8 }}>{currentApi?.desc}</Paragraph>
                <div style={{ marginBottom: 8 }}><b>请求参数：</b></div>
                <Table size="small" pagination={false} dataSource={currentApi?.params || []} columns={[
                  { title: '参数名', dataIndex: 'name', width: 140, render: (v: string) => <Text code>{v}</Text> },
                  { title: '位置', dataIndex: 'location', width: 80, render: (v: string) => <Tag>{v}</Tag> },
                  { title: '必填', dataIndex: 'required', width: 60, render: (v: string) => v === '是' ? <span style={{ color: '#ff4d4f' }}>是</span> : '否' },
                  { title: '说明', dataIndex: 'desc' }
                ]} />
              </Card>

              <Card size="small" title={<><CodeOutlined /> 在线调试</>}>
                <Form form={tryForm} layout="inline" style={{ rowGap: 12, marginBottom: 12 }}>
                  {currentApi?.fields.map((f: any) => (
                    <Form.Item key={f.key} name={f.key} label={f.label} initialValue={f.initialValue} style={{ marginBottom: 0 }}>
                      <Input style={{ width: 220 }} placeholder={`请输入${f.label}`} />
                    </Form.Item>
                  ))}
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" icon={<ThunderboltOutlined />} onClick={onTryApi} loading={tryLoading}>发送请求</Button>
                  </Form.Item>
                </Form>

                {tryResult && (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <b>响应结果：</b>
                      {tryResult.error ? <Tag color="red" style={{ marginLeft: 8 }}>请求失败</Tag> : <Tag color="green" style={{ marginLeft: 8 }}>成功 200</Tag>}
                    </div>
                    <pre style={{
                      background: tryResult.error ? '#fff1f0' : '#f6ffed',
                      border: `1px solid ${tryResult.error ? '#ffccc7' : '#b7eb8f'}`,
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 12,
                      maxHeight: 320,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      marginBottom: 0
                    }}>
                      {JSON.stringify(tryResult, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>

              <Card size="small" title={<><CopyOutlined /> 响应示例</>}>
                <pre style={{
                  background: '#fafafa',
                  border: '1px solid #e8e8e8',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 12,
                  maxHeight: 260,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  marginBottom: 0
                }}>
                  {currentApi?.responseExample}
                </pre>
              </Card>
            </div>
          </Col>
        </Row>
      </Card>

      <Modal
        title={<><PlusOutlined /> 创建新API应用</>}
        open={createModal}
        onOk={onCreate}
        onCancel={() => setCreateModal(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="app_name" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
            <Input placeholder="如：某电商ERP系统" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="app_type" label="应用类型" initialValue="erp" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'erp', label: '电商ERP' },
                  { value: 'wms', label: 'WMS仓储' },
                  { value: 'pos', label: '门店POS' },
                  { value: 'oms', label: '订单管理' },
                  { value: 'other', label: '其他' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="daily_limit" label="日调用限额" initialValue={10000} rules={[{ required: true }]}>
                <Select options={[
                  { value: 5000, label: '5,000 次/天（免费）' },
                  { value: 10000, label: '10,000 次/天（基础）' },
                  { value: 50000, label: '50,000 次/天（专业）' },
                  { value: 200000, label: '200,000 次/天（企业）' },
                  { value: 1000000, label: '1,000,000 次/天（旗舰）' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="contact" label="联系人信息" rules={[{ required: true }]}>
            <Input placeholder="联系人姓名 + 手机号" />
          </Form.Item>
          <Form.Item name="description" label="应用描述">
            <Input.TextArea rows={3} placeholder="简要描述应用场景和用途" />
          </Form.Item>
          <Alert type="warning" showIcon message="创建后将自动生成 AppKey 和 AppSecret，请妥善保管，AppSecret 仅在创建时展示一次。" />
        </Form>
      </Modal>
    </div>
  );
}
