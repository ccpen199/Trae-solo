import { useState } from 'react'
import { Table, Button, Space, Tag, Input, Select, Modal, Form } from 'antd'
import { ShareAltOutlined, SearchOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'
import { shareData, authStatusColorMap } from './mockData'

export default function CrossDomainSharing() {
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [policyVisible, setPolicyVisible] = useState(false)

  const handleSharePolicy = () => {
    addAuditEntry({
      operator: '管理员',
      module: '电子证照库',
      action: '配置共享策略',
      detail: '打开跨域共享策略配置',
      result: 'success',
      ip: '10.0.1.100',
    })
    setPolicyVisible(true)
  }

  const columns = [
    { title: '请求方', dataIndex: 'requester', key: 'requester', width: 180 },
    { title: '证照类型', dataIndex: 'licenseType', key: 'licenseType', width: 130 },
    {
      title: '共享字段',
      dataIndex: 'sharedFields',
      key: 'sharedFields',
      width: 240,
      render: (fields: string[]) => fields.map((f) => <Tag key={f}>{f}</Tag>),
    },
    { title: '脱敏策略', dataIndex: 'desensitization', key: 'desensitization', width: 180 },
    {
      title: '授权状态',
      dataIndex: 'authStatus',
      key: 'authStatus',
      width: 100,
      render: (status: string) => <Tag color={authStatusColorMap[status]}>{status}</Tag>,
    },
    { title: '请求时间', dataIndex: 'requestTime', key: 'requestTime', width: 180 },
  ]

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input placeholder="搜索请求方" prefix={<SearchOutlined />} style={{ width: 240 }} />
          <Select placeholder="授权状态" style={{ width: 120 }} allowClear>
            <Select.Option value="已授权">已授权</Select.Option>
            <Select.Option value="待审批">待审批</Select.Option>
            <Select.Option value="已拒绝">已拒绝</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<ShareAltOutlined />} onClick={handleSharePolicy}>
          配置共享策略
        </Button>
      </div>
      <Table columns={columns} dataSource={shareData} rowKey="id" pagination={{ pageSize: 5 }} size="middle" />

      <Modal
        title="跨域共享策略配置"
        open={policyVisible}
        onCancel={() => setPolicyVisible(false)}
        onOk={() => { setPolicyVisible(false) }}
        okText="保存"
        cancelText="取消"
        width={640}
      >
        <Form layout="vertical">
          <Form.Item label="默认脱敏等级" name="desensitizationLevel">
            <Select placeholder="请选择脱敏等级">
              <Select.Option value="L1">L1 - 完全公开</Select.Option>
              <Select.Option value="L2">L2 - 部分脱敏</Select.Option>
              <Select.Option value="L3">L3 - 高度脱敏</Select.Option>
              <Select.Option value="L4">L4 - 禁止共享</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="跨域授权有效期" name="authExpiry">
            <Select placeholder="请选择有效期">
              <Select.Option value="7d">7天</Select.Option>
              <Select.Option value="30d">30天</Select.Option>
              <Select.Option value="90d">90天</Select.Option>
              <Select.Option value="1y">1年</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="审批方式" name="approvalMethod">
            <Select placeholder="请选择审批方式">
              <Select.Option value="auto">自动审批</Select.Option>
              <Select.Option value="manual">人工审批</Select.Option>
              <Select.Option value="hybrid">混合审批</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
