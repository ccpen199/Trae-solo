import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Input,
  Select,
  Space,
  Row,
  Col,
  Form,
  Steps,
  Statistic,
  Alert,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { recertificationRecords, trainingCourses } from '@/mock/data'
import type { RecertificationRecord, RecertificationStatus } from '@/types'

const levelColorMap: Record<string, string> = {
  L1: 'green',
  L2: 'blue',
  L3: 'orange',
  L4: 'red',
}

const statusColorMap: Record<RecertificationStatus, string> = {
  pending: 'orange',
  in_progress: 'blue',
  passed: 'green',
  failed: 'red',
}

const statusLabelMap: Record<RecertificationStatus, string> = {
  pending: '待审核',
  in_progress: '复培中',
  passed: '已通过',
  failed: '未通过',
}

const courseStatusLabel: Record<string, string> = {
  upcoming: '即将开课',
  in_progress: '进行中',
  completed: '已结课',
}

const statusIconMap: Record<RecertificationStatus, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  in_progress: <SyncOutlined spin />,
  passed: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
}

const Recertification: React.FC = () => {
  const [data, setData] = useState<RecertificationRecord[]>(recertificationRecords)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<RecertificationRecord | null>(null)
  const [auditForm] = Form.useForm()

  const pendingCount = data.filter((r) => r.status === 'pending').length
  const inProgressCount = data.filter((r) => r.status === 'in_progress').length
  const failedCount = data.filter((r) => r.status === 'failed').length

  const getStepIndex = (status: RecertificationStatus) => {
    const map: Record<RecertificationStatus, number> = {
      pending: 1,
      in_progress: 3,
      passed: 4,
      failed: 2,
    }
    return map[status]
  }

  const openAuditModal = (record: RecertificationRecord) => {
    setCurrentRecord(record)
    auditForm.resetFields()
    setAuditModalOpen(true)
  }

  const openDetailModal = (record: RecertificationRecord) => {
    setCurrentRecord(record)
    setDetailModalOpen(true)
  }

  const handleApprove = () => {
    auditForm.validateFields().then((values) => {
      if (!currentRecord) return
      setData((prev) =>
        prev.map((item) =>
          item.id === currentRecord.id
            ? {
                ...item,
                status: 'in_progress' as RecertificationStatus,
                courseId: values.courseId,
                courseName: trainingCourses.find((c) => c.id === values.courseId)?.name,
                scheduledDate: values.scheduledDate,
                notes: values.notes,
              }
            : item
        )
      )
      message.success('审核通过，已分配培训课程')
      setAuditModalOpen(false)
      auditForm.resetFields()
    })
  }

  const handleReject = () => {
    if (!currentRecord) return
    const notes = auditForm.getFieldValue('notes')
    setData((prev) =>
      prev.map((item) =>
        item.id === currentRecord.id
          ? { ...item, status: 'failed' as RecertificationStatus, notes: notes || '审核未通过' }
          : item
      )
    )
    message.info('已驳回申请')
    setAuditModalOpen(false)
    auditForm.resetFields()
  }

  const columns = [
    { title: '记录ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '劳动者', dataIndex: 'workerName', key: 'workerName', width: 100 },
    {
      title: '当前等级',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      width: 90,
      render: (level: string) => <Tag color={levelColorMap[level]}>{level}</Tag>,
    },
    {
      title: '目标等级',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      width: 90,
      render: (level: string) => <Tag color={levelColorMap[level]}>{level}</Tag>,
    },
    {
      title: '关联课程',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 180,
      render: (name?: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RecertificationStatus) => (
        <Tag color={statusColorMap[status]} icon={statusIconMap[status]}>
          {statusLabelMap[status]}
        </Tag>
      ),
    },
    { title: '申请日期', dataIndex: 'appliedAt', key: 'appliedAt', width: 120, render: (v: string) => v?.split('T')[0] },
    {
      title: '计划考核日',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 110,
      render: (v?: string) => v || '-',
    },
    {
      title: '完成日期',
      dataIndex: 'completedDate',
      key: 'completedDate',
      width: 110,
      render: (v?: string) => v || '-',
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      width: 70,
      render: (v?: number) => (v != null ? v : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: RecertificationRecord) =>
        record.status === 'pending' ? (
          <Button type="link" onClick={() => openAuditModal(record)}>
            审核
          </Button>
        ) : (
          <Button type="link" onClick={() => openDetailModal(record)}>
            查看
          </Button>
        ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="待审核"
              value={pendingCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="复培中"
              value={inProgressCount}
              valueStyle={{ color: '#1677ff' }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="未通过"
              value={failedCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="复认证记录">
        <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="审核复认证申请"
        open={auditModalOpen}
        onCancel={() => setAuditModalOpen(false)}
        width={640}
        footer={null}
        destroyOnClose
      >
        {currentRecord && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="劳动者">{currentRecord.workerName}</Descriptions.Item>
              <Descriptions.Item label="当前等级">
                <Tag color={levelColorMap[currentRecord.currentLevel]}>
                  {currentRecord.currentLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标等级">
                <Tag color={levelColorMap[currentRecord.targetLevel]}>
                  {currentRecord.targetLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请日期">
                {currentRecord.appliedAt.split('T')[0]}
              </Descriptions.Item>
            </Descriptions>

            <Steps
              current={getStepIndex(currentRecord.status)}
              style={{ marginBottom: 24 }}
              items={[
                { title: '申请' },
                { title: '审核' },
                { title: '培训' },
                { title: '考核' },
                { title: '结果' },
              ]}
            />

            <Form form={auditForm} layout="vertical" preserve={false}>
              <Form.Item
                name="courseId"
                label="分配课程"
                rules={[{ required: true, message: '请选择课程' }]}
              >
                <Select
                  placeholder="请选择课程"
                  options={trainingCourses
                    .filter((c) => c.status !== 'completed')
                    .map((c) => ({ label: `${c.name} (${courseStatusLabel[c.status]})`, value: c.id }))}
                />
              </Form.Item>
              <Form.Item
                name="scheduledDate"
                label="考核日期"
                rules={[{ required: true, message: '请输入考核日期' }]}
              >
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="notes" label="备注">
                <Input.TextArea rows={3} placeholder="请输入审核备注" />
              </Form.Item>
            </Form>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button danger onClick={handleReject}>
                驳回
              </Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}>
                通过审核
              </Button>
            </Space>
          </>
        )}
      </Modal>

      <Modal
        title="复认证详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={640}
      >
        {currentRecord && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="记录ID">{currentRecord.id}</Descriptions.Item>
              <Descriptions.Item label="劳动者">{currentRecord.workerName}</Descriptions.Item>
              <Descriptions.Item label="当前等级">
                <Tag color={levelColorMap[currentRecord.currentLevel]}>
                  {currentRecord.currentLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标等级">
                <Tag color={levelColorMap[currentRecord.targetLevel]}>
                  {currentRecord.targetLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联课程" span={2}>
                {currentRecord.courseName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColorMap[currentRecord.status]} icon={statusIconMap[currentRecord.status]}>
                  {statusLabelMap[currentRecord.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="成绩">
                {currentRecord.score != null ? currentRecord.score : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申请日期">
                {currentRecord.appliedAt.split('T')[0]}
              </Descriptions.Item>
              <Descriptions.Item label="计划考核日">
                {currentRecord.scheduledDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成日期">
                {currentRecord.completedDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {currentRecord.notes || '-'}
              </Descriptions.Item>
            </Descriptions>

            {currentRecord.status === 'failed' && (
              <Alert
                type="error"
                showIcon
                icon={<CloseCircleOutlined />}
                style={{ marginTop: 16 }}
                message="未通过审核"
                description={
                  currentRecord.notes || '该复认证申请未通过审核，建议根据考核反馈加强相关技能后重新申请。'
                }
              />
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default Recertification
