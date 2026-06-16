import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, Button, Space, Tag, App, Table, Progress, Statistic, Alert, Tabs, Modal, Typography, List, Tooltip, DatePicker, Segmented } from 'antd';
import { ApiOutlined, SafetyOutlined, CopyOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, KeyOutlined, ThunderboltOutlined, BookOutlined, CodeOutlined, ShopOutlined, MessageOutlined, BulbOutlined, EyeOutlined, SettingOutlined, HistoryOutlined, TrophyOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../api';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Text, Paragraph, Title } = Typography;
const { RangePicker } = DatePicker;

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
  const [permModal, setPermModal] = useState<{ open: boolean; app: any }>({ open: false, app: null });
  const [keyModal, setKeyModal] = useState<{ open: boolean; app: any }>({ open: false, app: null });
  const [permForm] = Form.useForm();

  const [auditData, setAuditData] = useState<any>({ list: [], stats: {} });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditParams, setAuditParams] = useState<any>({ page: 1, pageSize: 20 });
  const [brandQuality, setBrandQuality] = useState<any[]>([]);
  const [brandQualityLoading, setBrandQualityLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const usage: any = await api.dashboard.apiUsage();
      setApiUsage(usage);
      setApps(usage.applications || [
        { id: 1, app_name: '某电商ERP系统', app_key: 'ecom_erp_8f3a2d1b', app_secret: 'sk_erp_abc123xyz789', status: 'active', daily_limit: 50000, today_calls: 32456, created_at: '2024-08-15', contact: '张经理 138****5678', app_type: 'erp', permissions: ['orders:create', 'orders:tracking', 'brands:list', 'price:compare', 'couriers:list'] },
        { id: 2, app_name: 'WMS仓储系统', app_key: 'wms_sys_c9e4f7a2', app_secret: 'sk_wms_def456uvw012', status: 'active', daily_limit: 20000, today_calls: 15892, created_at: '2024-09-01', contact: '李主管 139****1234', app_type: 'wms', permissions: ['orders:create', 'orders:tracking', 'brands:list'] },
        { id: 3, app_name: '门店POS', app_key: 'pos_retail_b1d8e5c3', app_secret: 'sk_pos_ghi789rst345', status: 'active', daily_limit: 10000, today_calls: 6234, created_at: '2024-09-20', contact: '王店长 137****9876', app_type: 'pos', permissions: ['orders:create', 'orders:tracking'] },
        { id: 4, app_name: '测试应用', app_key: 'test_app_a7f2d9e4', app_secret: 'sk_test_jkl012yza678', status: 'suspended', daily_limit: 5000, today_calls: 0, created_at: '2024-10-01', contact: '测试员', app_type: 'other', permissions: ['brands:list', 'price:compare'] }
      ]);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const loadAudit = async (params: any = {}) => {
    setAuditLoading(true);
    try {
      const data = await api.dashboard.auditLogs({ ...auditParams, ...params });
      setAuditData(data);
    } catch (e: any) { message.error(e.message); }
    finally { setAuditLoading(false); }
  };

  const loadBrandQuality = async () => {
    setBrandQualityLoading(true);
    try {
      const data = await api.open.brandQuality();
      setBrandQuality(data.data || []);
    } catch (e: any) {
      const mock = [
        { id: 1, code: 'SF', name: '顺丰速运', rating: 4.9, coverage_score: 98.5, base_price: 18, per_kg_price: 6, avg_delivery_hours: 24, total_orders: 125680, success_rate: 99.2, on_time_rate: 98.6, complaint_rate: 0.35 },
        { id: 2, code: 'ZTO', name: '中通快递', rating: 4.6, coverage_score: 96.2, base_price: 12, per_kg_price: 4, avg_delivery_hours: 48, total_orders: 256890, success_rate: 97.8, on_time_rate: 95.4, complaint_rate: 0.82 },
        { id: 3, code: 'STO', name: '申通快递', rating: 4.5, coverage_score: 94.8, base_price: 11, per_kg_price: 3.8, avg_delivery_hours: 52, total_orders: 189450, success_rate: 96.5, on_time_rate: 93.2, complaint_rate: 1.25 },
        { id: 4, code: 'YTO', name: '圆通速递', rating: 4.4, coverage_score: 93.5, base_price: 11.5, per_kg_price: 3.9, avg_delivery_hours: 50, total_orders: 168720, success_rate: 96.8, on_time_rate: 94.1, complaint_rate: 1.08 },
        { id: 5, code: 'YD', name: '韵达速递', rating: 4.3, coverage_score: 92.8, base_price: 10, per_kg_price: 3.5, avg_delivery_hours: 54, total_orders: 145680, success_rate: 95.2, on_time_rate: 92.8, complaint_rate: 1.55 },
        { id: 6, code: 'JD', name: '京东物流', rating: 4.8, coverage_score: 88.5, base_price: 16, per_kg_price: 5, avg_delivery_hours: 28, total_orders: 89560, success_rate: 98.9, on_time_rate: 97.8, complaint_rate: 0.42 },
        { id: 7, code: 'EMS', name: 'EMS', rating: 4.2, coverage_score: 99.8, base_price: 15, per_kg_price: 5.5, avg_delivery_hours: 72, total_orders: 68450, success_rate: 94.8, on_time_rate: 89.6, complaint_rate: 1.85 }
      ];
      setBrandQuality(mock);
    } finally { setBrandQualityLoading(false); }
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
        created_at: new Date().toISOString().split('T')[0],
        permissions: vals.permissions || ['orders:create', 'orders:tracking', 'brands:list']
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
        case 'brandQuality':
          result = await api.open.brandQuality(vals.app_key);
          break;
        default:
          result = { message: 'Unknown API' };
      }
      setTryResult(result);
    } catch (e: any) {
      setTryResult({ error: true, message: e.message, data: e });
    } finally { setTryLoading(false); }
  };

  const onSavePermissions = async () => {
    try {
      const vals = await permForm.validateFields();
      setApps(apps.map((a: any) => a.id === permModal.app.id ? { ...a, permissions: vals.permissions, daily_limit: vals.daily_limit, status: vals.status } : a));
      message.success('权限配置已保存');
      setPermModal({ open: false, app: null });
    } catch (e: any) { message.error(e.message); }
  };

  const onResetKey = (app: any) => {
    modal.confirm({
      title: '确认重置密钥',
      content: `重置后原 AppSecret 将立即失效，${app.app_name} 的所有调用需要更新密钥。`,
      okText: '确认重置',
      okType: 'danger',
      onOk: () => {
        const newSecret = 'sk_' + Math.random().toString(36).substring(2, 24);
        setApps(apps.map((a: any) => a.id === app.id ? { ...a, app_secret: newSecret } : a));
        message.success('密钥已重置，请在弹窗中查看新密钥');
        setKeyModal({ open: true, app: { ...app, app_secret: newSecret } });
      }
    });
  };

  const onToggleStatus = (app: any) => {
    const newStatus = app.status === 'active' ? 'suspended' : 'active';
    modal.confirm({
      title: newStatus === 'suspended' ? '确认停用应用' : '确认启用应用',
      content: newStatus === 'suspended' ? `停用后 ${app.app_name} 的所有API调用将被拒绝。` : `启用后 ${app.app_name} 将恢复API调用权限。`,
      onOk: () => {
        setApps(apps.map((a: any) => a.id === app.id ? { ...a, status: newStatus } : a));
        message.success(`应用已${newStatus === 'active' ? '启用' : '停用'}`);
      }
    });
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

  const allPermissions = [
    { label: '创建运单', value: 'orders:create' },
    { label: '轨迹查询', value: 'orders:tracking' },
    { label: '批量运单', value: 'orders:batch' },
    { label: '品牌列表', value: 'brands:list' },
    { label: '品牌质量', value: 'brands:quality' },
    { label: '比价决策', value: 'price:compare' },
    { label: '快递员查询', value: 'couriers:list' }
  ];

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
      responseExample: `{\n  "code": 0,\n  "data": [\n    {\n      "id": 1,\n      "name": "顺丰速运",\n      "code": "SF",\n      "rating": 4.8,\n      "coverage": 98.5\n    }\n  ]\n}`
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
      responseExample: `{\n  "code": 0,\n  "data": {\n    "order_no": "SF202410150001",\n    "status": "delivering",\n    "tracking": [\n      {\n        "time": "2024-10-15 14:30:00",\n        "location": "北京市朝阳区",\n        "description": "快递员正在派送中"\n      }\n    ]\n  }\n}`
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
      responseExample: `{\n  "code": 0,\n  "data": {\n    "order_no": "SF202410150001",\n    "brand": "顺丰速运",\n    "price": 18.50,\n    "estimated_delivery": "2024-10-16 18:00:00"\n  }\n}`
    },
    {
      key: 'brandQuality',
      name: '品牌服务质量',
      icon: <TrophyOutlined />,
      method: 'GET',
      path: '/open/brand-quality',
      desc: '获取所有快递品牌的服务质量指标，包括妥投率、时效达标率、投诉率等，用于电商系统智能选品。',
      params: [
        { name: 'X-App-Key', location: 'Header', required: '是', desc: '应用凭证 AppKey' }
      ],
      demo: { app_key: 'ecom_erp_8f3a2d1b' },
      fields: [
        { key: 'app_key', label: 'AppKey', initialValue: 'ecom_erp_8f3a2d1b' }
      ],
      responseExample: `{\n  "code": 0,\n  "data": [\n    {\n      "id": 1,\n      "code": "SF",\n      "name": "顺丰速运",\n      "rating": 4.9,\n      "success_rate": 99.2,\n      "on_time_rate": 98.6,\n      "complaint_rate": 0.35\n    }\n  ]\n}`
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
      responseExample: `{\n  "code": 0,\n  "data": {\n    "recommendation": { "brand": "顺丰速运", "price": 18.5 },\n    "alternatives": [\n      { "brand": "中通快递", "price": 12.0 },\n      { "brand": "圆通速递", "price": 11.5 }\n    ]\n  }\n}`
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
      responseExample: `{\n  "code": 0,\n  "data": [\n    {\n      "id": 1,\n      "name": "李师傅",\n      "phone": "138****5678",\n      "rating": 4.9,\n      "status": "available"\n    }\n  ]\n}`
    }
  ];

  const currentApi = apis.find(a => a.key === activeApi);

  const auditCols = [
    { title: 'ID', dataIndex: 'id', width: 70, render: (v: any) => `#${v}` },
    { title: '应用', dataIndex: 'app_name', width: 140, render: (v: string, r: any) => <Space><Text code style={{ fontSize: 11 }}>{r.app_key?.slice(0, 12)}...</Text><span>{v}</span></Space> },
    { title: '方法', dataIndex: 'method', width: 80, render: (v: string) => <Tag color={v === 'GET' ? 'green' : v === 'POST' ? 'blue' : 'default'}>{v}</Tag> },
    { title: 'API路径', dataIndex: 'api_path', render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: '状态', dataIndex: 'response_status', width: 100, render: (v: number) => v >= 200 && v < 300 ? <Tag color="green">{v} OK</Tag> : <Tag color="red">{v} Error</Tag> },
    { title: '响应时间', dataIndex: 'response_time', width: 110, render: (v: number) => `${v} ms` },
    { title: 'IP', dataIndex: 'ip', width: 120 },
    { title: '时间', dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') }
  ];

  const brandQualityCols = [
    { title: '排名', width: 70, render: (_: any, __: any, i: number) => <b style={{ color: i < 3 ? '#fa8c16' : '#8c8c8c' }}>#{i + 1}</b> },
    { title: '品牌', dataIndex: 'name', width: 120, render: (t: string, r: any) => <><b>{t}</b> <Tag>{r.code}</Tag></> },
    { title: '服务评分', dataIndex: 'rating', width: 100, render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {v}</b> },
    { title: '覆盖度', dataIndex: 'coverage_score', width: 110, render: (v: number) => <Progress percent={v} size="small" strokeColor="#1677ff" /> },
    { title: '妥投率', dataIndex: 'success_rate', width: 120, render: (v: number) => <Progress percent={v} size="small" strokeColor="#52c41a" /> },
    { title: '时效达标', dataIndex: 'on_time_rate', width: 120, render: (v: number) => <Progress percent={v} size="small" strokeColor="#722ed1" /> },
    { title: '投诉率‰', dataIndex: 'complaint_rate', width: 100, render: (v: number) => <span style={{ color: v > 1 ? '#ff4d4f' : '#52c41a' }}>{v}‰</span> },
    { title: '均价(首重)', dataIndex: 'base_price', width: 100, render: (v: number) => <b>¥{v}</b> },
    { title: '平均时效', dataIndex: 'avg_delivery_hours', width: 110, render: (v: number) => `${v}h` },
    { title: '累计单量', dataIndex: 'total_orders', width: 120, render: (v: number) => v?.toLocaleString?.() || v }
  ];

  const mockAuditLogs = () => {
    const methods = ['GET', 'POST', 'GET', 'GET', 'POST', 'GET', 'GET'];
    const paths = ['/open/orders', '/open/brands', '/open/orders/SF202410150001/tracking', '/open/brand-quality', '/open/price/compare', '/open/couriers/beijing', '/open/orders/batch'];
    const apps = apps.length ? apps : [{ id: 1, app_name: '某电商ERP系统', app_key: 'ecom_erp_8f3a2d1b' }, { id: 2, app_name: 'WMS仓储系统', app_key: 'wms_sys_c9e4f7a2' }];
    const logs: any[] = [];
    for (let i = 0; i < 50; i++) {
      const m = methods[Math.floor(Math.random() * methods.length)];
      const p = paths[Math.floor(Math.random() * paths.length)];
      const a = apps[Math.floor(Math.random() * apps.length)];
      const status = Math.random() > 0.08 ? (Math.random() > 0.5 ? 200 : 201) : (Math.random() > 0.5 ? 400 : 429);
      logs.push({
        id: 10000 - i,
        app_id: a.id, app_name: a.app_name, app_key: a.app_key,
        method: m, api_path: p, response_status: status,
        response_time: Math.floor(Math.random() * 200) + 20,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        created_at: dayjs().subtract(i * 15, 'minute').format('YYYY-MM-DD HH:mm:ss')
      });
    }
    return logs;
  };

  if (!auditData.list?.length && !auditLoading) {
    setAuditData({ list: mockAuditLogs(), stats: { total_calls: 54582, success_calls: 54147, error_calls: 435, success_rate: 99.2, avg_response_time: 128 } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={<><ApiOutlined /> API 开放中心</>}
        extra={
          <Space>
            <Tag color="blue">已接入 30+ 快递品牌</Tag>
            <Tag color="green">6 类开放接口</Tag>
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

      <Tabs
        items={[
          {
            key: 'apps',
            label: <><KeyOutlined /> 我的应用</>,
            children: (
              <>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={6}>
                    <Card styles={{ body: { padding: 16 } }}>
                      <Statistic
                        title={<><ApiOutlined /> 今日调用量</>}
                        value={apiUsage?.summary?.total_calls || 54582}
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
                        value={apiUsage?.summary?.success_rate || 99.2}
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
                        value={128}
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
                        title: '类型', dataIndex: 'app_type', width: 100,
                        render: (v: string) => ({
                          erp: <Tag color="blue">电商ERP</Tag>,
                          wms: <Tag color="cyan">WMS仓储</Tag>,
                          pos: <Tag color="orange">门店POS</Tag>,
                          oms: <Tag color="purple">订单管理</Tag>,
                          other: <Tag>其他</Tag>
                        } as any)[v] || v
                      },
                      {
                        title: 'AppKey',
                        dataIndex: 'app_key',
                        width: 220,
                        render: (v: string) => <Space><Text code style={{ fontSize: 12 }}>{v}</Text><CopyOutlined style={{ cursor: 'pointer', color: '#1677ff' }} onClick={() => { navigator.clipboard?.writeText(v); message.success('已复制'); }} /></Space>
                      },
                      {
                        title: '权限',
                        dataIndex: 'permissions',
                        width: 180,
                        render: (ps: string[]) => <Space wrap>{ps?.slice(0, 3).map(p => <Tag key={p} color="default">{p.split(':')[0]}</Tag>)}{ps?.length > 3 && <Tag color="default">+{ps.length - 3}</Tag>}</Space>
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
                        width: 240,
                        render: (_: any, r: any) => (
                          <Space size="small">
                            <Button size="small" icon={<EyeOutlined />} onClick={() => setKeyModal({ open: true, app: r })}>查看密钥</Button>
                            <Button size="small" icon={<SettingOutlined />} onClick={() => { setPermModal({ open: true, app: r }); permForm.setFieldsValue({ permissions: r.permissions, daily_limit: r.daily_limit, status: r.status }); }}>权限配置</Button>
                            <Button size="small" danger={r.status === 'active'} icon={r.status === 'active' ? <StopOutlined /> : <ReloadOutlined />} onClick={() => onToggleStatus(r)}>
                              {r.status === 'active' ? '停用' : '启用'}
                            </Button>
                          </Space>
                        )
                      }
                    ]}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'audit',
            label: <><HistoryOutlined /> 调用审计</>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={6}>
                    <Card styles={{ body: { padding: 16 } }}>
                      <Statistic title="总调用量" value={auditData.stats?.total_calls || 0} valueStyle={{ color: '#1677ff' }} />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card styles={{ body: { padding: 16 } }}>
                      <Statistic title="成功调用" value={auditData.stats?.success_calls || 0} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card styles={{ body: { padding: 16 } }}>
                      <Statistic title="失败调用" value={auditData.stats?.error_calls || 0} valueStyle={{ color: '#ff4d4f' }} />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card styles={{ body: { padding: 16 } }}>
                      <Statistic title="成功率" value={auditData.stats?.success_rate || 0} valueStyle={{ color: '#722ed1' }} suffix="%" />
                    </Card>
                  </Col>
                </Row>

                <Card>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Select placeholder="选择应用" style={{ width: 200 }} allowClear onChange={(v) => setAuditParams({ ...auditParams, app_id: v, page: 1 })}>
                      {apps.map((a: any) => <Select.Option key={a.id} value={a.id}>{a.app_name}</Select.Option>)}
                    </Select>
                    <Select placeholder="HTTP方法" style={{ width: 120 }} allowClear onChange={(v) => setAuditParams({ ...auditParams, method: v, page: 1 })}>
                      <Select.Option value="GET">GET</Select.Option>
                      <Select.Option value="POST">POST</Select.Option>
                    </Select>
                    <Select placeholder="响应状态" style={{ width: 140 }} allowClear onChange={(v) => setAuditParams({ ...auditParams, status: v, page: 1 })}>
                      <Select.Option value="success">成功 2xx</Select.Option>
                      <Select.Option value="error">错误 4xx/5xx</Select.Option>
                    </Select>
                    <RangePicker onChange={(d: any) => setAuditParams({ ...auditParams, date_from: d?.[0]?.format('YYYY-MM-DD'), date_to: d?.[1]?.format('YYYY-MM-DD'), page: 1 })} />
                    <Input.Search placeholder="搜索API路径" style={{ width: 220 }} allowClear onSearch={(v) => setAuditParams({ ...auditParams, api_path: v, page: 1 })} />
                    <Button type="primary" onClick={() => loadAudit()}>查询</Button>
                  </Space>

                  <Table
                    size="small"
                    rowKey="id"
                    loading={auditLoading}
                    dataSource={auditData.list || []}
                    columns={auditCols}
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: auditParams.page,
                      pageSize: auditParams.pageSize,
                      total: auditData.total || 50,
                      showSizeChanger: true,
                      showTotal: (t: number) => `共 ${t} 条记录`,
                      onChange: (p, ps) => loadAudit({ page: p, pageSize: ps })
                    }}
                  />
                </Card>
              </div>
            )
          },
          {
            key: 'quality',
            label: <><TrophyOutlined /> 品牌服务质量指标</>,
            children: (
              <Card
                title="各快递品牌服务质量对比（电商/ERP智能选品参考）"
                extra={<Button icon={<ReloadOutlined />} onClick={loadBrandQuality}>刷新数据</Button>}
              >
                <Alert
                  type="info"
                  showIcon
                  message="数据说明：综合评分基于价格(35%)+时效(30%)+覆盖度(20%)+服务评分(15%)算法计算，投诉率为千分比。"
                  style={{ marginBottom: 16 }}
                />
                <Table
                  size="small"
                  rowKey="id"
                  loading={brandQualityLoading}
                  dataSource={brandQuality}
                  columns={brandQualityCols}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              </Card>
            )
          },
          {
            key: 'docs',
            label: <><BookOutlined /> 接口文档</>,
            children: (
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
            )
          }
        ]}
      />

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
          <Form.Item name="permissions" label="接口权限" initialValue={['orders:create', 'orders:tracking', 'brands:list']} rules={[{ required: true, message: '请选择权限' }]}>
            <CheckboxGroup options={allPermissions} />
          </Form.Item>
          <Form.Item name="contact" label="联系人信息" rules={[{ required: true }]}>
            <Input placeholder="联系人姓名 + 手机号" />
          </Form.Item>
          <Form.Item name="description" label="应用描述">
            <Input.TextArea rows={3} placeholder="简要描述应用场景和用途" />
          </Form.Item>
          <Alert type="warning" showIcon message="创建后将自动生成 AppKey 和 AppSecret，请妥善保管，AppSecret 仅在创建时展示一次。" />
        </Form>
      </Modal>

      <Modal
        title={<><KeyOutlined /> 查看应用密钥</>}
        open={keyModal.open}
        onCancel={() => setKeyModal({ open: false, app: null })}
        footer={<Button onClick={() => setKeyModal({ open: false, app: null })}>关闭</Button>}
        width={560}
      >
        {keyModal.app && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Alert type="warning" showIcon message="请妥善保管密钥，AppSecret 泄露可能导致API调用被盗用。" />
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <b>应用名称：</b><span>{keyModal.app.app_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <b>AppKey：</b>
                <Space><Text code>{keyModal.app.app_key}</Text><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard?.writeText(keyModal.app.app_key); message.success('已复制'); }}>复制</Button></Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b>AppSecret：</b>
                <Space><Text code style={{ color: '#cf1322' }}>{keyModal.app.app_secret}</Text><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard?.writeText(keyModal.app.app_secret); message.success('已复制'); }}>复制</Button></Space>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Button danger icon={<ReloadOutlined />} onClick={() => { setKeyModal({ open: false, app: null }); onResetKey(keyModal.app); }}>重置密钥</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={<><SettingOutlined /> 应用权限配置</>}
        open={permModal.open}
        onOk={onSavePermissions}
        onCancel={() => setPermModal({ open: false, app: null })}
        width={560}
      >
        {permModal.app && (
          <Form form={permForm} layout="vertical">
            <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 8, marginBottom: 16 }}>
              <b>应用：</b>{permModal.app.app_name} <Tag>{permModal.app.app_key}</Tag>
            </div>
            <Form.Item name="status" label="应用状态" rules={[{ required: true }]}>
              <Select options={[
                { value: 'active', label: '已启用' },
                { value: 'suspended', label: '已暂停' }
              ]} />
            </Form.Item>
            <Form.Item name="daily_limit" label="日调用限额" rules={[{ required: true }]}>
              <Select options={[
                { value: 5000, label: '5,000 次/天' },
                { value: 10000, label: '10,000 次/天' },
                { value: 50000, label: '50,000 次/天' },
                { value: 200000, label: '200,000 次/天' },
                { value: 1000000, label: '1,000,000 次/天' }
              ]} />
            </Form.Item>
            <Form.Item name="permissions" label="授权接口" rules={[{ required: true, message: '请至少选择一个接口权限' }]}>
              <CheckboxGroup options={allPermissions} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}

function CheckboxGroup({ options, ...props }: any) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px' }}>
      {options.map((o: any) => (
        <label key={o.value} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" value={o.value} checked={props.value?.includes(o.value)}
            onChange={(e) => {
              const cur = props.value || [];
              if (e.target.checked) props.onChange?.([...cur, o.value]);
              else props.onChange?.(cur.filter((v: any) => v !== o.value));
            }} />
          {o.label}
        </label>
      ))}
    </div>
  );
}
