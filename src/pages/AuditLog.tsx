import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Descriptions,
  Modal,
  Tabs,
} from 'antd'
import {
  AuditOutlined,
  SearchOutlined,
  DownloadOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Title } = Typography
const { RangePicker } = DatePicker

interface ComplianceRule {
  key: string
  code: string
  name: string
  module: string
  logic: string
  severity: '高' | '中' | '低'
  status: '启用' | '停用'
}

const moduleColorMap: Record<string, string> = {
  '统一身份认证': 'blue',
  '事项标准化管理': 'green',
  '电子印章管理': 'orange',
  '电子证照库': 'purple',
  '数据共享交换': 'cyan',
  '门户聚合引擎': 'geekblue',
}

const complianceRules: ComplianceRule[] = [
  { key: '1', code: 'R001', name: '敏感数据访问审计', module: '数据共享交换', logic: '记录所有敏感字段访问', severity: '高', status: '启用' },
  { key: '2', code: 'R002', name: '印章操作双人复核', module: '电子印章管理', logic: '关键操作需第二人确认', severity: '高', status: '启用' },
  { key: '3', code: 'R003', name: '证照跨域共享授权', module: '电子证照库', logic: '跨域共享需明确授权记录', severity: '中', status: '启用' },
  { key: '4', code: 'R004', name: '身份认证异常锁定', module: '统一身份认证', logic: '连续3次失败自动锁定', severity: '高', status: '启用' },
  { key: '5', code: 'R005', name: '事项版本变更审批', module: '事项标准化管理', logic: '版本发布需审批流程', severity: '中', status: '启用' },
  { key: '6', code: 'R006', name: 'API调用量异常检测', module: '数据共享交换', logic: '日调用量超阈值告警', severity: '低', status: '启用' },
]

const moduleOptions = [
  { label: '全部', value: '' },
  { label: '统一身份认证', value: '统一身份认证' },
  { label: '事项标准化管理', value: '事项标准化管理' },
  { label: '电子印章管理', value: '电子印章管理' },
  { label: '电子证照库', value: '电子证照库' },
  { label: '数据共享交换', value: '数据共享交换' },
  { label: '门户聚合引擎', value: '门户聚合引擎' },
]

const resultOptions = [
  { label: '全部', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failure' },
]

const severityColorMap: Record<string, string> = {
  '高': 'red',
  '中': 'orange',
  '低': 'blue',
}

export default function AuditLog() {
  const auditLog = useAppStore((s) => s.auditLog)
  const [moduleFilter, setModuleFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<typeof auditLog[0] | null>(null)

  const filteredData = auditLog.filter((entry) => {
    if (moduleFilter && entry.module !== moduleFilter) return false
    if (resultFilter && entry.result !== resultFilter) return false
    if (operatorFilter && !entry.operator.includes(operatorFilter)) return false
    return true
  })

  const handleRowClick = (record: typeof auditLog[0]) => {
    setSelectedEntry(record)
    setDetailVisible(true)
  }

  const relatedOps = selectedEntry
    ? auditLog.filter(
        (e) => e.module === selectedEntry.module && e.id !== selectedEntry.id
      )
    : []

  const mainColumns = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '操作时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 90,
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      width: 140,
      render: (module: string) => (
        <Tag color={moduleColorMap[module] || 'default'}>{module}</Tag>
      ),
    },
    {
      title: '操作动作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: '操作详情',
      dataIndex: 'detail',
      key: 'detail',
      width: 240,
      ellipsis: { showTitle: false },
      render: (detail: string) => (
        <Tooltip placement="topLeft" title={detail}>
          {detail}
        </Tooltip>
      ),
    },
    {
      title: '操作结果',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (result: string) =>
        result === 'success' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>成功</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
        ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
    },
  ]

  const ruleColumns = [
    { title: '规则编号', dataIndex: 'code', key: 'code', width: 100 },
    { title: '规则名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '适用模块',
      dataIndex: 'module',
      key: 'module',
      width: 140,
      render: (module: string) => (
        <Tag color={moduleColorMap[module] || 'default'}>{module}</Tag>
      ),
    },
    { title: '校验逻辑', dataIndex: 'logic', key: 'logic', width: 200 },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={severityColorMap[severity]}>{severity}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge status={status === '启用' ? 'success' : 'default'} text={status} />
      ),
    },
  ]

  const renderAuditTab = () => (
    <>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col>
            <Select
              placeholder="操作模块"
              options={moduleOptions}
              value={moduleFilter || undefined}
              onChange={setModuleFilter}
              style={{ width: 160 }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="操作结果"
              options={resultOptions}
              value={resultFilter || undefined}
              onChange={setResultFilter}
              style={{ width: 120 }}
              allowClear
            />
          </Col>
          <Col>
            <Input
              placeholder="操作人"
              prefix={<SearchOutlined />}
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              style={{ width: 140 }}
              allowClear
            />
          </Col>
          <Col>
            <RangePicker style={{ width: 260 }} />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<FilterOutlined />}>
                搜索
              </Button>
              <Button icon={<DownloadOutlined />}>
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card size="small">
        <Table
          size="small"
          dataSource={filteredData}
          columns={mainColumns}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 8 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </>
  )

  const renderComplianceTab = () => (
    <Card size="small">
      <Table
        size="small"
        dataSource={complianceRules}
        columns={ruleColumns}
        rowKey="key"
        pagination={false}
      />
    </Card>
  )

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        <AuditOutlined style={{ marginRight: 8 }} />
        审计日志与合规追踪
        <Space style={{ marginLeft: 16 }}>
          <Tag color="green" icon={<CheckCircleOutlined />}>等保三级</Tag>
          <Tag color="blue" icon={<AuditOutlined />}>审计合规</Tag>
          <Tag color="orange" icon={<WarningOutlined />}>实时监控</Tag>
        </Space>
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="今日操作记录"
              value={1247}
              prefix={<AuditOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="合规校验通过率"
              value={99.2}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="异常操作"
              value={8}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待复核事项"
              value={3}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="audit"
        items={[
          {
            key: 'audit',
            label: '审计日志',
            children: renderAuditTab(),
          },
          {
            key: 'compliance',
            label: '合规性校验规则',
            children: renderComplianceTab(),
          },
        ]}
      />

      <Modal
        title="操作详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedEntry && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="序号">{selectedEntry.id}</Descriptions.Item>
              <Descriptions.Item label="操作时间">{selectedEntry.timestamp}</Descriptions.Item>
              <Descriptions.Item label="操作人">{selectedEntry.operator}</Descriptions.Item>
              <Descriptions.Item label="操作模块">
                <Tag color={moduleColorMap[selectedEntry.module] || 'default'}>
                  {selectedEntry.module}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作动作">{selectedEntry.action}</Descriptions.Item>
              <Descriptions.Item label="操作结果">
                {selectedEntry.result === 'success' ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>成功</Tag>
                ) : (
                  <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="操作详情" span={2}>
                {selectedEntry.detail}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedEntry.ip}</Descriptions.Item>
              <Descriptions.Item label="合规校验">
                <Tag color="green" icon={<CheckCircleOutlined />}>校验通过</Tag>
              </Descriptions.Item>
            </Descriptions>

            {relatedOps.length > 0 && (
              <>
                <Title level={5}>关联操作链</Title>
                <Table
                  size="small"
                  dataSource={relatedOps}
                  columns={[
                    { title: '操作时间', dataIndex: 'timestamp', key: 'timestamp', width: 170 },
                    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 90 },
                    { title: '操作动作', dataIndex: 'action', key: 'action', width: 120 },
                    {
                      title: '操作结果',
                      dataIndex: 'result',
                      key: 'result',
                      width: 90,
                      render: (result: string) =>
                        result === 'success' ? (
                          <Tag color="success">成功</Tag>
                        ) : (
                          <Tag color="error">失败</Tag>
                        ),
                    },
                  ]}
                  rowKey="id"
                  pagination={false}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
