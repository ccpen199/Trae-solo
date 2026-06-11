import { useState } from 'react'
import { Table, Button, Space, Tag, Modal, Descriptions, Input, Select, Typography } from 'antd'
import { PlusOutlined, FolderOpenOutlined, SearchOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'
import { licenseData, statusColorMap } from './mockData'
import type { LicenseRecord } from './types'

const { Title, Text } = Typography

interface Props {
  onOpenIssuance: () => void
}

export default function LicenseManagement({ onOpenIssuance }: Props) {
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<LicenseRecord | null>(null)
  const [revokeVisible, setRevokeVisible] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<LicenseRecord | null>(null)

  const handleViewDetail = (record: LicenseRecord) => {
    setCurrentRecord(record)
    setDetailVisible(true)
    addAuditEntry({
      operator: '管理员',
      module: '电子证照库',
      action: '查看证照详情',
      detail: `查看证照：${record.type}（${record.id}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleIssue = (record: LicenseRecord) => {
    addAuditEntry({
      operator: '管理员',
      module: '电子证照库',
      action: '证照签发',
      detail: `签发证照：${record.type}（${record.id}），持证人：${record.holder}`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleShare = (record: LicenseRecord) => {
    addAuditEntry({
      operator: '管理员',
      module: '电子证照库',
      action: '跨域证照共享',
      detail: `共享证照：${record.type}（${record.id}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleRevoke = () => {
    if (revokeTarget) {
      addAuditEntry({
        operator: '管理员',
        module: '电子证照库',
        action: '证照吊销',
        detail: `吊销证照：${revokeTarget.type}（${revokeTarget.id}），持证人：${revokeTarget.holder}`,
        result: 'success',
        ip: '10.0.1.100',
      })
      setRevokeVisible(false)
      setRevokeTarget(null)
    }
  }

  const columns = [
    { title: '证照编号', dataIndex: 'id', key: 'id', width: 180 },
    { title: '持证人/单位', dataIndex: 'holder', key: 'holder', width: 160 },
    { title: '证照类型', dataIndex: 'type', key: 'type', width: 130 },
    { title: '签发机构', dataIndex: 'issuer', key: 'issuer', width: 200 },
    { title: '签发日期', dataIndex: 'issueDate', key: 'issueDate', width: 120 },
    { title: '有效期至', dataIndex: 'expiryDate', key: 'expiryDate', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: unknown, record: LicenseRecord) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>查看详情</Button>
          <Button type="link" size="small" onClick={() => handleIssue(record)}>签发</Button>
          <Button type="link" size="small" onClick={() => handleShare(record)}>共享</Button>
          <Button type="link" size="small" danger onClick={() => { setRevokeTarget(record); setRevokeVisible(true) }}>吊销</Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input placeholder="搜索证照编号/持证人" prefix={<SearchOutlined />} style={{ width: 280 }} />
          <Select placeholder="证照类型" style={{ width: 160 }} allowClear>
            <Select.Option value="居民身份证">居民身份证</Select.Option>
            <Select.Option value="电子营业执照">电子营业执照</Select.Option>
            <Select.Option value="不动产权证">不动产权证</Select.Option>
            <Select.Option value="机动车驾驶证">机动车驾驶证</Select.Option>
            <Select.Option value="结婚证">结婚证</Select.Option>
            <Select.Option value="出生医学证明">出生医学证明</Select.Option>
            <Select.Option value="社会保障卡">社会保障卡</Select.Option>
            <Select.Option value="护照">护照</Select.Option>
          </Select>
          <Select placeholder="状态筛选" style={{ width: 120 }} allowClear>
            <Select.Option value="有效">有效</Select.Option>
            <Select.Option value="即将到期">即将到期</Select.Option>
            <Select.Option value="已过期">已过期</Select.Option>
            <Select.Option value="已注销">已注销</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenIssuance}>新建签发</Button>
      </div>
      <Table columns={columns} dataSource={licenseData} rowKey="id" pagination={{ pageSize: 5 }} size="middle" />

      <Modal title="证照详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={640}>
        {currentRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="证照编号">{currentRecord.id}</Descriptions.Item>
              <Descriptions.Item label="持证人/单位">{currentRecord.holder}</Descriptions.Item>
              <Descriptions.Item label="证照类型">{currentRecord.type}</Descriptions.Item>
              <Descriptions.Item label="签发机构">{currentRecord.issuer}</Descriptions.Item>
              <Descriptions.Item label="签发日期">{currentRecord.issueDate}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{currentRecord.expiryDate}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColorMap[currentRecord.status]}>{currentRecord.status}</Tag></Descriptions.Item>
            </Descriptions>
            <Title level={5}>结构化元数据</Title>
            <Descriptions bordered column={1} size="small">
              {Object.entries(currentRecord.metadata).map(([key, val]) => (
                <Descriptions.Item key={key} label={key}>{val}</Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="确认吊销"
        open={revokeVisible}
        onCancel={() => { setRevokeVisible(false); setRevokeTarget(null) }}
        onOk={handleRevoke}
        okText="确认吊销"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        {revokeTarget && (
          <div>
            <Text>确定要吊销以下证照吗？此操作不可撤销。</Text>
            <Descriptions bordered column={1} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="证照编号">{revokeTarget.id}</Descriptions.Item>
              <Descriptions.Item label="持证人/单位">{revokeTarget.holder}</Descriptions.Item>
              <Descriptions.Item label="证照类型">{revokeTarget.type}</Descriptions.Item>
              <Descriptions.Item label="签发机构">{revokeTarget.issuer}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  )
}
