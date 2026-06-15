import React, { useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Input,
  DatePicker,
  Tag,
  Descriptions,
  Alert,
  Tooltip,
  Badge,
  List
} from 'antd'
import {
  SearchOutlined,
  ExportOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DashboardOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { RangePicker } = DatePicker

interface AuditLogRecord {
  key: string
  id: number
  time: string
  operator: string
  department: string
  module: string
  operateType: string
  description: string
  ip: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failed'
  requestParams: string
  responseResult: string
  userAgent: string
}

const mockData: AuditLogRecord[] = Array.from({ length: 50 }).map((_, i) => {
  const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']
  const modules = ['认证授权', '事项管理', '证照库', '工单系统', '系统管理', '数据看板']
  const operateTypes = ['登录', '查询', '新增', '修改', '删除', '导出', '授权']
  const operators = ['admin', 'zhangsan', 'lisi', 'wangwu', 'zhaoliu', 'qianqi', 'sunba']
  const departments = ['信息中心', '市场监督管理局', '公安局', '住建局', '人社局', '医疗保障局']
  const statuses: Array<'success' | 'failed'> = ['success', 'failed']

  const day = Math.floor(Math.random() * 90)
  const hour = Math.floor(Math.random() * 24)
  const minute = Math.floor(Math.random() * 60)
  const date = new Date()
  date.setDate(date.getDate() - day)
  date.setHours(hour, minute, 0, 0)

  return {
    key: String(i + 1),
    id: i + 1,
    time: date.toLocaleString('zh-CN', { hour12: false }),
    operator: operators[Math.floor(Math.random() * operators.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    module: modules[Math.floor(Math.random() * modules.length)],
    operateType: operateTypes[Math.floor(Math.random() * operateTypes.length)],
    description: `执行${operateTypes[Math.floor(Math.random() * operateTypes.length)]}操作 - ${modules[Math.floor(Math.random() * modules.length)]}模块`,
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    status: statuses[Math.floor(Math.random() * 4)],
    requestParams: JSON.stringify({ id: 1000 + i, page: 1, size: 10 }, null, 2),
    responseResult: JSON.stringify({ code: 0, message: 'success', data: { total: 100 } }, null, 2),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})

const riskLevelConfig = {
  low: { label: '低', color: '#52c41a', bgColor: 'rgba(82, 196, 26, 0.1)' },
  medium: { label: '中', color: '#0958d9', bgColor: 'rgba(9, 88, 217, 0.1)' },
  high: { label: '高', color: '#faad14', bgColor: 'rgba(250, 173, 20, 0.1)' },
  critical: { label: '严重', color: '#ff4d4f', bgColor: 'rgba(255, 77, 79, 0.1)' }
}

const moduleOptions = ['认证授权', '事项管理', '证照库', '工单系统', '系统管理', '数据看板']
const operateTypeOptions = ['登录', '查询', '新增', '修改', '删除', '导出', '授权']
const riskLevelOptions = ['low', 'medium', 'high', 'critical']

const AuditLogs: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string[]>([])
  const [selectedOperateType, setSelectedOperateType] = useState<string[]>([])
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [ipSearch, setIpSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')

  const pieOption = {
    title: {
      text: '风险等级分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0
    },
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 856, name: '低风险' },
          { value: 342, name: '中风险' },
          { value: 89, name: '高风险' },
          { value: 23, name: '严重风险' }
        ],
        color: ['#52c41a', '#0958d9', '#faad14', '#ff4d4f']
      }
    ]
  }

  const trendOption = {
    title: {
      text: '近30天操作趋势',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['总操作数', '风险操作'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 30 }).map((_, i) => `${i + 1}日`)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '总操作数',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 30 }).map(() => Math.floor(Math.random() * 200) + 100),
        itemStyle: { color: '#0958d9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(9, 88, 217, 0.35)' },
              { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }
            ]
          }
        }
      },
      {
        name: '风险操作',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 30 }).map(() => Math.floor(Math.random() * 20) + 2),
        itemStyle: { color: '#ff4d4f' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
              { offset: 1, color: 'rgba(255, 77, 79, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  const topRiskOperations = [
    { rank: 1, name: '删除用户', count: 45, module: '系统管理' },
    { rank: 2, name: '授权管理员角色', count: 38, module: '认证授权' },
    { rank: 3, name: '批量导出数据', count: 32, module: '事项管理' },
    { rank: 4, name: '删除服务事项', count: 28, module: '事项管理' },
    { rank: 5, name: '修改系统配置', count: 25, module: '系统管理' },
    { rank: 6, name: '重置用户密码', count: 22, module: '系统管理' },
    { rank: 7, name: '删除证照记录', count: 18, module: '证照库' },
    { rank: 8, name: '强制登出用户', count: 15, module: '认证授权' },
    { rank: 9, name: '批量导入数据', count: 12, module: '工单系统' },
    { rank: 10, name: '修改权限配置', count: 10, module: '认证授权' }
  ]

  const columns: ColumnsType<AuditLogRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 170,
      render: (text: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
          <span style={{ fontSize: 12 }}>{text}</span>
        </Space>
      )
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 130
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      width: 100
    },
    {
      title: '操作类型',
      dataIndex: 'operateType',
      key: 'operateType',
      width: 80,
      render: (text: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text}
        </Tag>
      )
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 80,
      render: (level: keyof typeof riskLevelConfig) => {
        const config = riskLevelConfig[level]
        return (
          <Tag
            color={config.color}
            style={{
              margin: 0,
              backgroundColor: config.bgColor,
              border: 'none',
              color: config.color,
              fontWeight: 500
            }}
          >
            {config.label}
          </Tag>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status: string) => (
        <Space size={4}>
          <Badge
            status={status === 'success' ? 'success' : 'error'}
            text={status === 'success' ? '成功' : '失败'}
          />
        </Space>
      )
    }
  ]

  const expandedRowRender = (record: AuditLogRecord) => (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="请求参数" span={2}>
        <pre
          style={{
            margin: 0,
            padding: 8,
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
            fontSize: 12,
            maxHeight: 120,
            overflow: 'auto'
          }}
        >
          {record.requestParams}
        </pre>
      </Descriptions.Item>
      <Descriptions.Item label="响应结果" span={2}>
        <pre
          style={{
            margin: 0,
            padding: 8,
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
            fontSize: 12,
            maxHeight: 120,
            overflow: 'auto'
          }}
        >
          {record.responseResult}
        </pre>
      </Descriptions.Item>
      <Descriptions.Item label="User-Agent" span={2}>
        <span style={{ fontSize: 12, color: '#666' }}>{record.userAgent}</span>
      </Descriptions.Item>
    </Descriptions>
  )

  const handleExport = () => {
    console.log('Export audit logs')
  }

  const filterPanelStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  }

  const filterTitleStyle: React.CSSProperties = {
    fontWeight: 500,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <SafetyOutlined style={{ color: '#0958d9', marginRight: 8 }} />
            90天关键操作审计与复查
          </Title>
          <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>
            全量操作日志留存，满足合规审计要求
          </div>
        </div>
        <Space>
          <Tooltip title="刷新数据">
            <Button icon={<ReloadOutlined />} />
          </Tooltip>
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
      </div>

      <Alert
        message="合规提示"
        description="根据《网络安全法》和《数据安全法》要求，系统审计日志留存期为90天，重要操作日志永久保存。所有操作均会被记录，请规范使用。"
        type="info"
        showIcon
        icon={<FileTextOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="今日操作数"
              value={328}
              prefix={<DashboardOutlined style={{ color: '#0958d9' }} />}
              valueStyle={{ color: '#0958d9', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="风险操作数"
              value={23}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="异常操作数"
              value={12}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="操作成功率"
              value={96.8}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="90天总操作数"
              value={12856}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="日志留存天数"
              value={90}
              suffix="天"
              prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={5}>
          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}>
              <DashboardOutlined style={{ color: '#0958d9' }} />
              操作模块
            </div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {moduleOptions.map((item) => (
                <Tag.CheckableTag
                  key={item}
                  checked={selectedModule.includes(item)}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedModule([...selectedModule, item])
                    } else {
                      setSelectedModule(selectedModule.filter((m) => m !== item))
                    }
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    marginRight: 0,
                    display: 'block',
                    width: '100%'
                  }}
                >
                  {item}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>

          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}>
              <SafetyOutlined style={{ color: '#0958d9' }} />
              操作类型
            </div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {operateTypeOptions.map((item) => (
                <Tag.CheckableTag
                  key={item}
                  checked={selectedOperateType.includes(item)}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedOperateType([...selectedOperateType, item])
                    } else {
                      setSelectedOperateType(selectedOperateType.filter((t) => t !== item))
                    }
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    marginRight: 0,
                    display: 'block',
                    width: '100%'
                  }}
                >
                  {item}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>

          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}>
              <WarningOutlined style={{ color: '#0958d9' }} />
              风险等级
            </div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {riskLevelOptions.map((item) => {
                const config = riskLevelConfig[item as keyof typeof riskLevelConfig]
                return (
                  <Tag.CheckableTag
                    key={item}
                    checked={selectedRiskLevel.includes(item)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedRiskLevel([...selectedRiskLevel, item])
                      } else {
                        setSelectedRiskLevel(selectedRiskLevel.filter((r) => r !== item))
                      }
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 4,
                      marginRight: 0,
                      display: 'block',
                      width: '100%',
                      color: selectedRiskLevel.includes(item) ? config.color : undefined
                    }}
                  >
                    <Badge color={config.color} /> {config.label}风险
                  </Tag.CheckableTag>
                )
              })}
            </Space>
          </div>

          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}>
              <ClockCircleOutlined style={{ color: '#0958d9' }} />
              时间范围
            </div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {['今天', '昨天', '近7天', '近30天', '近90天', '自定义'].map((item) => (
                <Tag.CheckableTag
                  key={item}
                  checked={item === '近90天'}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    marginRight: 0,
                    display: 'block',
                    width: '100%'
                  }}
                >
                  {item}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>
        </Col>

        <Col span={19}>
          <Card style={{ borderRadius: 8, marginBottom: 16 }}>
            <Space style={{ marginBottom: 16, width: '100%' }} wrap>
              <Input
                placeholder="操作人"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 160 }}
                allowClear
              />
              <Input
                placeholder="IP地址"
                prefix={<SearchOutlined />}
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                style={{ width: 160 }}
                allowClear
              />
              <Input
                placeholder="关键词搜索"
                prefix={<SearchOutlined />}
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <RangePicker style={{ width: 260 }} />
              <Button type="primary">查询</Button>
              <Button
                onClick={() => {
                  setSearchText('')
                  setIpSearch('')
                  setKeywordSearch('')
                  setSelectedModule([])
                  setSelectedOperateType([])
                  setSelectedRiskLevel([])
                }}
              >
                重置
              </Button>
            </Space>

            <Table
              columns={columns}
              dataSource={mockData}
              pagination={{
                pageSize: 10,
                total: 12856,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              expandable={{
                expandedRowRender,
                expandRowByClick: true
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </Card>

          <Row gutter={16}>
            <Col span={10}>
              <Card style={{ borderRadius: 8 }}>
                <ReactECharts option={pieOption} style={{ height: 280 }} />
              </Card>
            </Col>
            <Col span={14}>
              <Card style={{ borderRadius: 8 }}>
                <ReactECharts option={trendOption} style={{ height: 280 }} />
              </Card>
            </Col>
          </Row>

          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                高危操作 Top10 排行
              </Space>
            }
            style={{ borderRadius: 8, marginTop: 16 }}
            size="small"
          >
            <List
              dataSource={topRiskOperations}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color="orange" key="count">
                      {item.count}次
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: item.rank <= 3 ? '#ff4d4f' : '#faad14',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        {item.rank}
                      </div>
                    }
                    title={item.name}
                    description={item.module}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AuditLogs
