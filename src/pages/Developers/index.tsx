import React, { useState, useMemo } from 'react';
import {
  Key,
  Plus,
  Copy,
  RefreshCw,
  Ban,
  Check,
  Shield,
  Search,
  Building2,
  User,
  Gavel,
  FileText,
  Play,
  ChevronRight,
  Clock,
  BarChart3,
  Zap,
  Activity,
  Code2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  Checkbox,
  message,
  Space,
  Tooltip,
  Tabs,
  Progress,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import DataCard from '@/components/common/DataCard';

const { Option } = Select;

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'revoked';
  createdAt: string;
  usage: number;
  limit: number;
}

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  name: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  responseExample?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: '生产环境密钥',
    key: 'sk_lc_8f3a9b2c7d4e6f1a0b5c9d2e8f4a6b3c',
    status: 'active',
    createdAt: '2026-05-15',
    usage: 8520,
    limit: 10000,
  },
  {
    id: '2',
    name: '开发环境密钥',
    key: 'sk_lc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    status: 'active',
    createdAt: '2026-05-20',
    usage: 1234,
    limit: 5000,
  },
  {
    id: '3',
    name: '测试环境密钥',
    key: 'sk_lc_p0o9i8u7y6t5r4e3w2q1a0s9d8f7g6h5',
    status: 'revoked',
    createdAt: '2026-04-10',
    usage: 456,
    limit: 1000,
  },
];

const permissionOptions = [
  { key: 'company_search', label: '企业信息查询', icon: <Building2 className="w-4 h-4" /> },
  { key: 'person_search', label: '人员信息查询', icon: <User className="w-4 h-4" /> },
  { key: 'case_search', label: '案件信息查询', icon: <Gavel className="w-4 h-4" /> },
  { key: 'report_generation', label: '报告生成', icon: <FileText className="w-4 h-4" /> },
];

const rateLimitOptions = [
  { value: 100, label: '100 次/天（免费版）' },
  { value: 1000, label: '1,000 次/天（基础版）' },
  { value: 5000, label: '5,000 次/天（专业版）' },
  { value: 10000, label: '10,000 次/天（企业版）' },
  { value: -1, label: '无限制（定制版）' },
];

const endpoints: Endpoint[] = [
  {
    id: '1',
    method: 'GET',
    path: '/api/v1/companies',
    name: '获取企业列表',
    description: '分页获取企业信息列表，支持关键词搜索和筛选',
    params: [
      { name: 'keyword', type: 'string', required: false, description: '搜索关键词' },
      { name: 'page', type: 'number', required: false, description: '页码，默认 1' },
      { name: 'pageSize', type: 'number', required: false, description: '每页数量，默认 20' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 1256,
        list: [
          {
            id: 'c_001',
            name: '深圳腾讯科技有限公司',
            creditCode: '91440300MA5D...',
            status: '存续',
            industry: '互联网',
          },
        ],
      },
    }, null, 2),
  },
  {
    id: '2',
    method: 'POST',
    path: '/api/v1/search',
    name: '综合搜索',
    description: '综合搜索企业、人员、案件等多维度信息',
    params: [
      { name: 'query', type: 'string', required: true, description: '搜索关键词' },
      { name: 'type', type: 'string', required: false, description: '搜索类型：company/person/case' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        companies: [],
        persons: [],
        cases: [],
      },
    }, null, 2),
  },
  {
    id: '3',
    method: 'GET',
    path: '/api/v1/companies/:id',
    name: '获取企业详情',
    description: '根据企业ID获取企业详细信息，包括工商、股东、高管等',
    params: [
      { name: 'id', type: 'string', required: true, description: '企业唯一标识ID' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 'c_001',
        name: '深圳腾讯科技有限公司',
        creditCode: '91440300MA5D...',
        legalPerson: '马化腾',
        registeredCapital: '2000000万人民币',
        establishmentDate: '1998-11-11',
        shareholders: [],
        executives: [],
      },
    }, null, 2),
  },
  {
    id: '4',
    method: 'GET',
    path: '/api/v1/companies/:id/cases',
    name: '获取企业涉诉记录',
    description: '获取企业相关的涉诉案件列表',
    params: [
      { name: 'id', type: 'string', required: true, description: '企业唯一标识ID' },
      { name: 'status', type: 'string', required: false, description: '案件状态筛选' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        total: 42,
        list: [
          {
            id: 'case_001',
            title: '某某合同纠纷案',
            caseNumber: '(2026)粤0305民初1234号',
            status: '审理中',
            court: '深圳市南山区人民法院',
          },
        ],
      },
    }, null, 2),
  },
  {
    id: '5',
    method: 'POST',
    path: '/api/v1/reports/generate',
    name: '生成法律报告',
    description: '根据企业ID生成法律尽职调查或信用报告',
    params: [
      { name: 'companyId', type: 'string', required: true, description: '企业ID' },
      { name: 'type', type: 'string', required: true, description: '报告类型：due_diligence/credit/litigation' },
      { name: 'format', type: 'string', required: false, description: '输出格式：pdf/word' },
    ],
    responseExample: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        reportId: 'r_20260621_001',
        status: 'generating',
        estimatedTime: '30秒',
      },
    }, null, 2),
  },
];

const dailyCallsOption = {
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['6/15', '6/16', '6/17', '6/18', '6/19', '6/20', '6/21'],
    axisLine: { lineStyle: { color: '#DEE2E6' } },
    axisLabel: { color: '#6B7280' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#F8F9FA' } },
    axisLabel: { color: '#6B7280' },
  },
  series: [
    {
      name: 'API 调用次数',
      type: 'line',
      smooth: true,
      data: [1200, 1450, 1320, 1680, 1520, 1890, 2150],
      lineStyle: { color: '#0A1628', width: 3 },
      itemStyle: { color: '#0A1628' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(10, 22, 40, 0.15)' },
            { offset: 1, color: 'rgba(10, 22, 40, 0)' },
          ],
        },
      },
    },
  ],
};

const responseTimeOption = {
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['6/15', '6/16', '6/17', '6/18', '6/19', '6/20', '6/21'],
    axisLine: { lineStyle: { color: '#DEE2E6' } },
    axisLabel: { color: '#6B7280' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#F8F9FA' } },
    axisLabel: { color: '#6B7280' },
  },
  series: [
    {
      name: '平均响应时间',
      type: 'line',
      smooth: true,
      data: [85, 92, 78, 88, 102, 95, 82],
      lineStyle: { color: '#C9A962', width: 3 },
      itemStyle: { color: '#C9A962' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(201, 169, 98, 0.2)' },
            { offset: 1, color: 'rgba(201, 169, 98, 0)' },
          ],
        },
      },
    },
  ],
};

const endpointTypeStats = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', right: 10, top: 'center' },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 4520, name: '企业查询', itemStyle: { color: '#0A1628' } },
        { value: 2180, name: '案件查询', itemStyle: { color: '#C9A962' } },
        { value: 1850, name: '人员查询', itemStyle: { color: '#194BA0' } },
        { value: 680, name: '报告生成', itemStyle: { color: '#B23A48' } },
      ],
    },
  ],
};

const Developers: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [checkedPermissions, setCheckedPermissions] = useState<string[]>(['company_search']);
  const [rateLimit, setRateLimit] = useState<number>(1000);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [tryOutResponse, setTryOutResponse] = useState<string>('');

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      message.success('API Key 已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const handleRevokeKey = (id: string) => {
    Modal.confirm({
      title: '确认吊销 API Key',
      content: '吊销后该 Key 将立即失效，此操作不可撤销。',
      okText: '确认吊销',
      okType: 'danger',
      onOk: () => message.success('API Key 已吊销'),
    });
  };

  const handleRegenerateKey = (id: string) => {
    Modal.confirm({
      title: '确认重新生成',
      content: '重新生成后原 Key 将立即失效，请妥善保存新密钥。',
      okText: '确认生成',
      onOk: () => message.success('新 API Key 已生成'),
    });
  };

  const handleToggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      message.error('请输入 API Key 名称');
      return;
    }
    if (checkedPermissions.length === 0) {
      message.error('请至少选择一项权限');
      return;
    }
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsCreating(false);
    setIsCreateModalOpen(false);
    setNewKeyName('');
    setCheckedPermissions(['company_search']);
    setRateLimit(1000);
    message.success('API Key 创建成功');
  };

  const handleTryItOut = async () => {
    setTryOutResponse('');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setTryOutResponse(selectedEndpoint.responseExample || '{}');
  };

  const apiKeyColumns = useMemo(() => [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span className="font-medium text-neutral-ink-900">{text}</span>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'key',
      key: 'key',
      render: (text: string, record: ApiKey) => (
        <div className="flex items-center gap-2">
          <code className="px-3 py-1.5 bg-neutral-ink-50 rounded font-mono text-sm text-neutral-ink-700 flex-1">
            {visibleKeys[record.id] ? text : text.slice(0, 8) + '•'.repeat(24) + text.slice(-4)}
          </code>
          <Button
            type="text"
            icon={visibleKeys[record.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            onClick={() => handleToggleKeyVisibility(record.id)}
            className="!h-8 !w-8 !p-0"
          />
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`lc-status-tag ${
          status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-ink-100 text-neutral-ink-500'
        }`}>
          {status === 'active' ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
          {status === 'active' ? '有效' : '已吊销'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <div className="flex items-center gap-1.5 text-neutral-ink-500">
          <Clock className="w-3.5 h-3.5" />
          {text}
        </div>
      ),
    },
    {
      title: '本月使用',
      key: 'usage',
      render: (_: unknown, record: ApiKey) => (
        <div className="w-40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-ink-500">{record.usage.toLocaleString()}</span>
            <span className="text-neutral-ink-400">
              {record.limit === -1 ? '无限制' : `/ ${record.limit.toLocaleString()}`}
            </span>
          </div>
          {record.limit !== -1 && (
            <Progress
              percent={Math.min(Math.round((record.usage / record.limit) * 100), 100)}
              size="small"
              showInfo={false}
              strokeColor="#0A1628"
            />
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: ApiKey) => (
        <Space size={4}>
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<Copy className="w-4 h-4" />}
              onClick={() => handleCopyKey(record.key)}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
          <Tooltip title="重新生成">
            <Button
              type="text"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => handleRegenerateKey(record.id)}
              disabled={record.status === 'revoked'}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
          <Tooltip title={record.status === 'revoked' ? '已吊销' : '吊销'}>
            <Button
              type="text"
              icon={<Ban className="w-4 h-4" />}
              onClick={() => handleRevokeKey(record.id)}
              disabled={record.status === 'revoked'}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [visibleKeys]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">开发者中心</h1>
          <p className="text-neutral-ink-500 mt-1">管理 API Key、查看接口文档与使用统计</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="!h-10"
        >
          创建 API Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DataCard
          title="今日 API 调用"
          value="2,150"
          icon={<Zap className="w-5 h-5" />}
          color="primary"
          trend={{ value: 13.8, isUp: true }}
        />
        <DataCard
          title="平均响应时间"
          value="82ms"
          icon={<Activity className="w-5 h-5" />}
          color="gold"
          trend={{ value: 5.2, isUp: false }}
        />
        <DataCard
          title="本月配额使用"
          value="68%"
          icon={<BarChart3 className="w-5 h-5" />}
          color="success"
          description="剩余 9,246 次调用"
        />
      </div>

      <Card
        className="lc-card border-0"
        title={<span className="font-serif text-base font-semibold">API Key 管理</span>}
        extra={
          <Button
            type="text"
            icon={<Shield className="w-4 h-4" />}
            className="!text-primary-500"
          >
            安全设置
          </Button>
        }
      >
        <Table
          columns={apiKeyColumns}
          dataSource={mockApiKeys}
          rowKey="id"
          pagination={false}
          className="lc-table"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lc-card border-0 lg:col-span-2"
          title={<span className="font-serif text-base font-semibold">近 7 天 API 调用趋势</span>}
        >
          <ReactECharts option={dailyCallsOption} style={{ height: 280 }} />
        </Card>
        <Card
          className="lc-card border-0"
          title={<span className="font-serif text-base font-semibold">接口类型分布</span>}
        >
          <ReactECharts option={endpointTypeStats} style={{ height: 280 }} />
        </Card>
      </div>

      <Card
        className="lc-card border-0"
        title={<span className="font-serif text-base font-semibold">响应时间监控（近 7 天）</span>}
      >
        <ReactECharts option={responseTimeOption} style={{ height: 260 }} />
      </Card>

      <Card
        className="lc-card border-0"
        title={
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary-500" />
            <span className="font-serif text-base font-semibold">API 文档</span>
          </div>
        }
      >
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 border-r border-neutral-ink-100 pr-6 -mr-6">
            <div className="text-xs font-medium text-neutral-ink-500 uppercase mb-3">接口列表</div>
            <div className="space-y-1">
              {endpoints.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    selectedEndpoint.id === ep.id
                      ? 'bg-primary-900 text-white'
                      : 'hover:bg-neutral-ink-50 text-neutral-ink-700'
                  }`}
                >
                  <span className={`lc-badge !text-xs ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{ep.name}</span>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                    selectedEndpoint.id === ep.id ? 'text-white' : 'text-neutral-ink-300'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-6">
            <div className="flex items-center gap-4">
              <span className={`lc-badge !text-sm !px-3 !py-1 ${methodColors[selectedEndpoint.method]}`}>
                {selectedEndpoint.method}
              </span>
              <code className="px-4 py-2 bg-neutral-ink-50 rounded font-mono text-sm text-neutral-ink-900">
                {selectedEndpoint.path}
              </code>
            </div>

            <div>
              <h3 className="font-medium text-neutral-ink-900 mb-2">{selectedEndpoint.name}</h3>
              <p className="text-sm text-neutral-ink-500">{selectedEndpoint.description}</p>
            </div>

            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-ink-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-accent-gold rounded" />
                  请求参数
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-ink-50">
                        <th className="px-4 py-2.5 text-left font-medium text-neutral-ink-600 rounded-l-lg">参数名</th>
                        <th className="px-4 py-2.5 text-left font-medium text-neutral-ink-600">类型</th>
                        <th className="px-4 py-2.5 text-left font-medium text-neutral-ink-600">必填</th>
                        <th className="px-4 py-2.5 text-left font-medium text-neutral-ink-600 rounded-r-lg">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEndpoint.params.map((param, idx) => (
                        <tr key={idx} className="border-b border-neutral-ink-100 last:border-0">
                          <td className="px-4 py-3 font-mono text-primary-600">{param.name}</td>
                          <td className="px-4 py-3 text-neutral-ink-500">{param.type}</td>
                          <td className="px-4 py-3">
                            {param.required ? (
                              <span className="lc-badge bg-red-100 text-accent-red">必填</span>
                            ) : (
                              <span className="lc-badge bg-neutral-ink-100 text-neutral-ink-500">可选</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-ink-700">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-neutral-ink-700 flex items-center gap-2">
                  <span className="w-1 h-4 bg-accent-gold rounded" />
                  响应示例
                </h4>
                <Button
                  type="primary"
                  icon={<Play className="w-4 h-4" />}
                  onClick={handleTryItOut}
                  size="small"
                >
                  Try it out
                </Button>
              </div>
              <pre className="p-4 bg-neutral-ink-900 rounded-lg text-sm text-green-400 font-mono overflow-x-auto max-h-80">
                {tryOutResponse || selectedEndpoint.responseExample}
              </pre>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-primary-900">创建 API Key</div>
              <div className="text-xs text-neutral-ink-500">创建后请妥善保管密钥，仅显示一次</div>
            </div>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => setIsCreateModalOpen(false)}>取消</Button>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreateKey}
              loading={isCreating}
            >
              创建 Key
            </Button>
          </div>
        }
        width={560}
      >
        <div className="space-y-5 pt-2">
          <div>
            <label className="lc-input-label">Key 名称</label>
            <Input
              size="large"
              placeholder="如：生产环境密钥"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="lc-input"
            />
          </div>

          <div>
            <label className="lc-input-label">访问权限</label>
            <Checkbox.Group
              value={checkedPermissions}
              onChange={(v) => setCheckedPermissions(v as string[])}
              className="w-full"
            >
              <div className="space-y-2">
                {permissionOptions.map((perm) => (
                  <Checkbox
                    key={perm.key}
                    value={perm.key}
                    className="!flex !items-center !h-11 !w-full !px-3 !border !border-neutral-ink-200 !rounded-lg !m-0 hover:!border-primary-500 !transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary-500">{perm.icon}</span>
                      <span className="text-neutral-ink-700">{perm.label}</span>
                    </div>
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>

          <div>
            <label className="lc-input-label">调用频率限制</label>
            <Select
              size="large"
              value={rateLimit}
              onChange={(v) => setRateLimit(v)}
              className="w-full"
            >
              {rateLimitOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Developers;
