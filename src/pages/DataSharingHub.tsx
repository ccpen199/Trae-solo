import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Tabs,
  Row,
  Col,
  Statistic,
  Badge,
  Switch,
  message,
  Tooltip,
  Alert,
  Divider,
  Tree,
} from 'antd'
import {
  ApiOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  SettingOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Title, Text } = Typography

interface ThemeField {
  name: string
  type: string
  sensitive: boolean
  desensitized: boolean
}

interface ThemeDetail {
  key: string
  title: string
  fields: ThemeField[]
  sharedDepts: string[]
  apiCount: number
  status: 'active' | 'inactive'
}

interface ApiRecord {
  key: string
  name: string
  theme: string
  method: 'GET' | 'POST'
  callers: string[]
  dailyCalls: number
  avgResponseTime: number
  status: '正常' | '维护' | '停用'
}

interface DesensitizationRecord {
  key: string
  fieldName: string
  theme: string
  level: 'L1' | 'L2' | 'L3' | 'L4'
  rule: string
  scope: string
  status: boolean
}

const themeData: ThemeDetail[] = [
  {
    key: 'population',
    title: '人口信息',
    fields: [
      { name: '姓名', type: '字符串', sensitive: false, desensitized: false },
      { name: '身份证号', type: '字符串', sensitive: true, desensitized: true },
      { name: '性别', type: '枚举', sensitive: false, desensitized: false },
      { name: '出生日期', type: '日期', sensitive: false, desensitized: false },
      { name: '民族', type: '枚举', sensitive: false, desensitized: false },
      { name: '户籍地址', type: '字符串', sensitive: true, desensitized: true },
      { name: '手机号码', type: '字符串', sensitive: true, desensitized: true },
      { name: '婚姻状况', type: '枚举', sensitive: false, desensitized: false },
    ],
    sharedDepts: ['公安局', '民政局', '人社局', '卫健委'],
    apiCount: 12,
    status: 'active',
  },
  {
    key: 'legal-entity',
    title: '法人信息',
    fields: [
      { name: '企业名称', type: '字符串', sensitive: false, desensitized: false },
      { name: '统一社会信用代码', type: '字符串', sensitive: true, desensitized: true },
      { name: '法定代表人', type: '字符串', sensitive: false, desensitized: false },
      { name: '注册资本', type: '数值', sensitive: true, desensitized: true },
      { name: '成立日期', type: '日期', sensitive: false, desensitized: false },
      { name: '经营范围', type: '字符串', sensitive: false, desensitized: false },
      { name: '登记机关', type: '字符串', sensitive: false, desensitized: false },
    ],
    sharedDepts: ['市场监管局', '税务局', '商务局', '发改委'],
    apiCount: 8,
    status: 'active',
  },
  {
    key: 'e-license',
    title: '电子证照',
    fields: [
      { name: '证照名称', type: '字符串', sensitive: false, desensitized: false },
      { name: '证照编号', type: '字符串', sensitive: true, desensitized: true },
      { name: '持证人姓名', type: '字符串', sensitive: false, desensitized: false },
      { name: '持证人身份证号', type: '字符串', sensitive: true, desensitized: true },
      { name: '有效期起', type: '日期', sensitive: false, desensitized: false },
      { name: '有效期止', type: '日期', sensitive: false, desensitized: false },
      { name: '发证机关', type: '字符串', sensitive: false, desensitized: false },
    ],
    sharedDepts: ['公安局', '市场监管局', '自然资源局', '住建局'],
    apiCount: 15,
    status: 'active',
  },
  {
    key: 'social-security',
    title: '社会保障',
    fields: [
      { name: '社保账号', type: '字符串', sensitive: true, desensitized: true },
      { name: '参保人姓名', type: '字符串', sensitive: false, desensitized: false },
      { name: '参保类型', type: '枚举', sensitive: false, desensitized: false },
      { name: '缴费基数', type: '数值', sensitive: true, desensitized: true },
      { name: '缴费月数', type: '数值', sensitive: false, desensitized: false },
      { name: '医保结算金额', type: '数值', sensitive: true, desensitized: true },
      { name: '养老金发放金额', type: '数值', sensitive: true, desensitized: true },
    ],
    sharedDepts: ['人社局', '医保局', '税务局', '民政局'],
    apiCount: 10,
    status: 'active',
  },
  {
    key: 'natural-resource',
    title: '自然资源',
    fields: [
      { name: '地块编号', type: '字符串', sensitive: true, desensitized: true },
      { name: '土地面积', type: '数值', sensitive: false, desensitized: false },
      { name: '土地用途', type: '枚举', sensitive: false, desensitized: false },
      { name: '不动产编号', type: '字符串', sensitive: true, desensitized: true },
      { name: '所有权人', type: '字符串', sensitive: false, desensitized: false },
      { name: '林权证号', type: '字符串', sensitive: true, desensitized: true },
      { name: '林地面积', type: '数值', sensitive: false, desensitized: false },
    ],
    sharedDepts: ['自然资源局', '住建局', '农业农村局', '林业和草原局'],
    apiCount: 6,
    status: 'active',
  },
]

const apiData: ApiRecord[] = [
  {
    key: '1',
    name: '人口基本信息查询',
    theme: '人口信息',
    method: 'GET',
    callers: ['民政局', '教育局', '卫健委'],
    dailyCalls: 45230,
    avgResponseTime: 32,
    status: '正常',
  },
  {
    key: '2',
    name: '企业工商登记查询',
    theme: '法人信息',
    method: 'GET',
    callers: ['税务局', '商务局', '统计局'],
    dailyCalls: 38910,
    avgResponseTime: 28,
    status: '正常',
  },
  {
    key: '3',
    name: '社保缴纳记录查询',
    theme: '社会保障',
    method: 'GET',
    callers: ['人社局', '医保局', '民政局'],
    dailyCalls: 67820,
    avgResponseTime: 45,
    status: '正常',
  },
  {
    key: '4',
    name: '电子证照验证接口',
    theme: '电子证照',
    method: 'POST',
    callers: ['公安局', '市场监管局', '住建局'],
    dailyCalls: 52100,
    avgResponseTime: 38,
    status: '正常',
  },
  {
    key: '5',
    name: '不动产权属查询',
    theme: '自然资源',
    method: 'GET',
    callers: ['住建局', '自然资源局', '税务局'],
    dailyCalls: 23450,
    avgResponseTime: 52,
    status: '正常',
  },
  {
    key: '6',
    name: '流动人口信息同步',
    theme: '人口信息',
    method: 'POST',
    callers: ['公安局', '住建局', '教育局'],
    dailyCalls: 18670,
    avgResponseTime: 67,
    status: '维护',
  },
  {
    key: '7',
    name: '企业信用报告接口',
    theme: '法人信息',
    method: 'GET',
    callers: ['市场监管局', '发改委', '税务局'],
    dailyCalls: 31400,
    avgResponseTime: 41,
    status: '正常',
  },
  {
    key: '8',
    name: '医保结算数据交换',
    theme: '社会保障',
    method: 'POST',
    callers: ['医保局', '卫健委', '人社局'],
    dailyCalls: 50987,
    avgResponseTime: 56,
    status: '正常',
  },
]

const desensitizationData: DesensitizationRecord[] = [
  { key: '1', fieldName: '身份证号', theme: '人口信息', level: 'L3', rule: '中间8位替换为*', scope: '所有跨部门调用', status: true },
  { key: '2', fieldName: '手机号码', theme: '人口信息', level: 'L2', rule: '中间4位替换为*', scope: '非公安部门调用', status: true },
  { key: '3', fieldName: '银行卡号', theme: '社会保障', level: 'L4', rule: '仅保留后4位', scope: '所有外部调用', status: true },
  { key: '4', fieldName: '家庭住址', theme: '人口信息', level: 'L2', rule: '模糊化至街道级别', scope: '非公安部门调用', status: true },
  { key: '5', fieldName: '收入金额', theme: '社会保障', level: 'L3', rule: '区间化显示', scope: '所有跨部门调用', status: true },
  { key: '6', fieldName: '社保账号', theme: '社会保障', level: 'L3', rule: '部分替换为*', scope: '非人社局调用', status: true },
  { key: '7', fieldName: '不动产编号', theme: '自然资源', level: 'L2', rule: '编码脱敏', scope: '非自然资源局调用', status: true },
  { key: '8', fieldName: '健康信息', theme: '社会保障', level: 'L4', rule: '完全脱敏', scope: '所有外部调用', status: true },
]

const levelColorMap: Record<string, string> = {
  L1: 'blue',
  L2: 'orange',
  L3: 'red',
  L4: 'purple',
}

const levelLabelMap: Record<string, string> = {
  L1: 'L1-低敏感',
  L2: 'L2-中敏感',
  L3: 'L3-高敏感',
  L4: 'L4-极敏感',
}

const treeData = [
  {
    title: '人口信息',
    key: 'population',
    children: [
      { title: '常住人口', key: 'population-resident' },
      { title: '流动人口', key: 'population-floating' },
      { title: '人口统计', key: 'population-stats' },
    ],
  },
  {
    title: '法人信息',
    key: 'legal-entity',
    children: [
      { title: '企业登记', key: 'legal-entity-enterprise' },
      { title: '组织机构', key: 'legal-entity-org' },
      { title: '行政事业单位', key: 'legal-entity-gov' },
    ],
  },
  {
    title: '电子证照',
    key: 'e-license',
    children: [
      { title: '身份证', key: 'e-license-id' },
      { title: '营业执照', key: 'e-license-business' },
      { title: '不动产权证', key: 'e-license-property' },
    ],
  },
  {
    title: '社会保障',
    key: 'social-security',
    children: [
      { title: '社保缴纳', key: 'social-security-payment' },
      { title: '医保结算', key: 'social-security-medical' },
      { title: '养老金', key: 'social-security-pension' },
    ],
  },
  {
    title: '自然资源',
    key: 'natural-resource',
    children: [
      { title: '土地登记', key: 'natural-resource-land' },
      { title: '不动产', key: 'natural-resource-property' },
      { title: '林权', key: 'natural-resource-forest' },
    ],
  },
]

export default function DataSharingHub() {
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [selectedTheme, setSelectedTheme] = useState<ThemeDetail | null>(themeData[0])
  const [apiDetailVisible, setApiDetailVisible] = useState(false)
  const [currentApi, setCurrentApi] = useState<ApiRecord | null>(null)
  const [desensFormVisible, setDesensFormVisible] = useState(false)
  const [desensForm] = Form.useForm()

  const handleViewApiDetail = (record: ApiRecord) => {
    setCurrentApi(record)
    setApiDetailVisible(true)
    addAuditEntry({
      operator: '管理员',
      module: '数据共享交换',
      action: '查看API详情',
      detail: `查看API：${record.name}`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleViewApiStats = (record: ApiRecord) => {
    message.info(`${record.name} 调用统计：今日${record.dailyCalls}次，平均响应${record.avgResponseTime}ms`)
    addAuditEntry({
      operator: '管理员',
      module: '数据共享交换',
      action: '调用统计查询',
      detail: `查询API调用统计：${record.name}`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleConfigRateLimit = (record: ApiRecord) => {
    message.success(`${record.name} 限流配置页面已打开`)
    addAuditEntry({
      operator: '管理员',
      module: '数据共享交换',
      action: '配置限流',
      detail: `配置API限流：${record.name}`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleDisableApi = (record: ApiRecord) => {
    addAuditEntry({
      operator: '管理员',
      module: '数据共享交换',
      action: '停用API',
      detail: `停用API：${record.name}`,
      result: 'success',
      ip: '10.0.1.100',
    })
    message.warning(`${record.name} 已停用`)
  }

  const handleDesensToggle = (record: DesensitizationRecord) => {
    addAuditEntry({
      operator: '管理员',
      module: '数据共享交换',
      action: record.status ? '停用脱敏规则' : '启用脱敏规则',
      detail: `${record.status ? '停用' : '启用'}脱敏规则：${record.fieldName}（${record.level}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
    message.success(`${record.fieldName} 脱敏规则已${record.status ? '停用' : '启用'}`)
  }

  const handleDesensSubmit = () => {
    desensForm.validateFields().then((values: Record<string, string>) => {
      addAuditEntry({
        operator: '管理员',
        module: '数据共享交换',
        action: '新增脱敏规则',
        detail: `新增脱敏规则：${values.fieldName}，级别：${values.level}`,
        result: 'success',
        ip: '10.0.1.100',
      })
      message.success('脱敏规则配置成功')
      setDesensFormVisible(false)
      desensForm.resetFields()
    })
  }

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) return
    const key = String(selectedKeys[0])
    const parentKey = key.split('-')[0]
    const theme = themeData.find((t) => t.key === parentKey || t.key === key)
    if (theme) {
      setSelectedTheme(theme)
      addAuditEntry({
        operator: '管理员',
        module: '数据共享交换',
        action: '浏览主题目录',
        detail: `浏览主题目录：${theme.title}`,
        result: 'success',
        ip: '10.0.1.100',
      })
    }
  }

  const apiColumns = [
    { title: 'API名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '所属主题', dataIndex: 'theme', key: 'theme', width: 120 },
    {
      title: '请求方式',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'green' : 'blue'}>{method}</Tag>
      ),
    },
    {
      title: '调用方',
      dataIndex: 'callers',
      key: 'callers',
      width: 200,
      render: (callers: string[]) => (
        <Space size={4} wrap>
          {callers.map((c) => (
            <Tag key={c}>{c}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '日调用量',
      dataIndex: 'dailyCalls',
      key: 'dailyCalls',
      width: 110,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '平均响应时间(ms)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      width: 140,
      render: (v: number) => (
        <Text type={v > 50 ? 'warning' : 'success'}>{v}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const colorMap: Record<string, string> = { '正常': 'green', '维护': 'orange', '停用': 'red' }
        return <Badge status={(colorMap[status] as 'success' | 'warning' | 'error') || 'default'} text={status} />
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: unknown, record: ApiRecord) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewApiDetail(record)}>
            查看详情
          </Button>
          <Button type="link" size="small" icon={<FilterOutlined />} onClick={() => handleViewApiStats(record)}>
            调用统计
          </Button>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleConfigRateLimit(record)}>
            配置限流
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDisableApi(record)}>
            停用
          </Button>
        </Space>
      ),
    },
  ]

  const desensColumns = [
    { title: '字段名称', dataIndex: 'fieldName', key: 'fieldName', width: 130 },
    { title: '所属主题', dataIndex: 'theme', key: 'theme', width: 120 },
    {
      title: '脱敏级别',
      dataIndex: 'level',
      key: 'level',
      width: 140,
      render: (level: string) => <Tag color={levelColorMap[level]}>{levelLabelMap[level]}</Tag>,
    },
    { title: '脱敏规则', dataIndex: 'rule', key: 'rule', width: 180 },
    { title: '应用范围', dataIndex: 'scope', key: 'scope', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: boolean, record: DesensitizationRecord) => (
        <Switch checked={status} size="small" onChange={() => handleDesensToggle(record)} />
      ),
    },
  ]

  const renderThemeTab = () => (
    <Row gutter={16}>
      <Col span={8}>
        <Card
          title="主题目录"
          size="small"
          style={{ height: '100%' }}
          extra={
            <Tooltip title="刷新目录">
              <Button type="text" size="small" icon={<SwapOutlined />} />
            </Tooltip>
          }
        >
          <Tree
            defaultExpandAll
            treeData={treeData.map((node) => ({
              ...node,
              title: (
                <Space size={4}>
                  <span>{node.title}</span>
                  <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>
                    {themeData.find((t) => t.key === node.key)?.fields.length || 0}字段
                  </Tag>
                  {themeData.find((t) => t.key === node.key)?.status === 'active' && (
                    <Tag color="green" style={{ fontSize: 11 }}>共享中</Tag>
                  )}
                </Space>
              ),
              children: node.children?.map((child) => ({
                ...child,
                title: (
                  <Space size={4}>
                    <span>{child.title}</span>
                    <Tag color="green" style={{ fontSize: 11 }}>可用</Tag>
                  </Space>
                ),
              })),
            }))}
            onSelect={handleTreeSelect}
          />
        </Card>
      </Col>
      <Col span={16}>
        {selectedTheme ? (
          <Card
            title={`${selectedTheme.title} - 主题详情`}
            size="small"
            extra={
              <Space>
                <Tag color={selectedTheme.status === 'active' ? 'green' : 'default'}>
                  {selectedTheme.status === 'active' ? '共享中' : '未共享'}
                </Tag>
                <Button type="primary" size="small" icon={<ApiOutlined />}>
                  申请接入
                </Button>
              </Space>
            }
          >
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="主题名称">{selectedTheme.title}</Descriptions.Item>
              <Descriptions.Item label="API数量">{selectedTheme.apiCount}</Descriptions.Item>
              <Descriptions.Item label="共享部门" span={2}>
                <Space size={4} wrap>
                  {selectedTheme.sharedDepts.map((d: string) => (
                    <Tag key={d}>{d}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="字段总数">{selectedTheme.fields.length}</Descriptions.Item>
              <Descriptions.Item label="敏感字段数">
                {selectedTheme.fields.filter((f: ThemeField) => f.sensitive).length}
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left" style={{ fontSize: 13 }}>
              字段列表
            </Divider>
            <Table
              size="small"
              pagination={false}
              dataSource={selectedTheme.fields.map((f: ThemeField, i: number) => ({ ...f, key: i }))}
              columns={[
                { title: '字段名称', dataIndex: 'name', key: 'name' },
                { title: '数据类型', dataIndex: 'type', key: 'type' },
                {
                  title: '是否敏感',
                  dataIndex: 'sensitive',
                  key: 'sensitive',
                  render: (v: boolean) =>
                    v ? <Tag color="red">敏感</Tag> : <Tag color="default">非敏感</Tag>,
                },
                {
                  title: '是否脱敏',
                  dataIndex: 'desensitized',
                  key: 'desensitized',
                  render: (v: boolean) =>
                    v ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>已脱敏</Tag>
                    ) : (
                      <Tag color="default">未脱敏</Tag>
                    ),
                },
              ]}
            />
          </Card>
        ) : (
          <Card>
            <Alert message="请在左侧选择一个主题目录查看详情" type="info" showIcon />
          </Card>
        )}
      </Col>
    </Row>
  )

  const renderApiTab = () => (
    <Card size="small">
      <Table
        size="small"
        dataSource={apiData}
        columns={apiColumns}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  )

  const renderDesensTab = () => (
    <Card
      size="small"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDesensFormVisible(true)}>
          新增脱敏规则
        </Button>
      }
    >
      <Table
        size="small"
        dataSource={desensitizationData}
        columns={desensColumns}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  )

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        <SwapOutlined style={{ marginRight: 8 }} />
        跨部门数据共享交换中枢
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="主题目录数"
              value={256}
              prefix={<SafetyCertificateOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已发布API"
              value={1893}
              prefix={<ApiOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="今日调用"
              value={328567}
              prefix={<SwapOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="脱敏规则"
              value={47}
              prefix={<SettingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="theme"
        items={[
          {
            key: 'theme',
            label: '主题目录管理',
            children: renderThemeTab(),
          },
          {
            key: 'api',
            label: 'API网关管理',
            children: renderApiTab(),
          },
          {
            key: 'desensitization',
            label: '敏感字段脱敏策略',
            children: renderDesensTab(),
          },
        ]}
      />

      <Modal
        title="API详情"
        open={apiDetailVisible}
        onCancel={() => setApiDetailVisible(false)}
        footer={null}
        width={640}
      >
        {currentApi && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="API名称">{currentApi.name}</Descriptions.Item>
            <Descriptions.Item label="所属主题">{currentApi.theme}</Descriptions.Item>
            <Descriptions.Item label="请求方式">
              <Tag color={currentApi.method === 'GET' ? 'green' : 'blue'}>{currentApi.method}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={
                  currentApi.status === '正常'
                    ? 'success'
                    : currentApi.status === '维护'
                    ? 'warning'
                    : 'error'
                }
                text={currentApi.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="日调用量">{currentApi.dailyCalls.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="平均响应时间">{currentApi.avgResponseTime}ms</Descriptions.Item>
            <Descriptions.Item label="调用方" span={2}>
              <Space size={4} wrap>
                {currentApi.callers.map((c: string) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="新增脱敏规则"
        open={desensFormVisible}
        onOk={handleDesensSubmit}
        onCancel={() => {
          setDesensFormVisible(false)
          desensForm.resetFields()
        }}
        width={560}
      >
        <Form form={desensForm} layout="vertical">
          <Form.Item name="fieldName" label="字段名称" rules={[{ required: true, message: '请输入字段名称' }]}>
            <Input placeholder="请输入字段名称" />
          </Form.Item>
          <Form.Item name="theme" label="所属主题" rules={[{ required: true, message: '请选择所属主题' }]}>
            <Select
              placeholder="请选择所属主题"
              options={themeData.map((t) => ({ label: t.title, value: t.key }))}
            />
          </Form.Item>
          <Form.Item name="level" label="脱敏级别" rules={[{ required: true, message: '请选择脱敏级别' }]}>
            <Select
              placeholder="请选择脱敏级别"
              options={[
                { label: 'L1-低敏感', value: 'L1' },
                { label: 'L2-中敏感', value: 'L2' },
                { label: 'L3-高敏感', value: 'L3' },
                { label: 'L4-极敏感', value: 'L4' },
              ]}
            />
          </Form.Item>
          <Form.Item name="rule" label="脱敏规则" rules={[{ required: true, message: '请输入脱敏规则' }]}>
            <Input placeholder="请输入脱敏规则" />
          </Form.Item>
          <Form.Item name="scope" label="应用范围" rules={[{ required: true, message: '请输入应用范围' }]}>
            <Input placeholder="请输入应用范围" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
