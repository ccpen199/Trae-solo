import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Row,
  Col,
  Form,
  Progress,
  Statistic,
  Switch,
  message,
} from 'antd'
import { PlusOutlined, EditOutlined, BookOutlined, TeamOutlined } from '@ant-design/icons'
import { trainingCourses, serviceProviders } from '@/mock/data'
import type { TrainingCourse } from '@/types'

const categoryOptions = [
  { label: '月嫂', value: '月嫂' },
  { label: '育儿嫂', value: '育儿嫂' },
  { label: '保洁', value: '保洁' },
  { label: '养老护理', value: '养老护理' },
  { label: '钟点工', value: '钟点工' },
  { label: '家电清洗', value: '家电清洗' },
]

const levelOptions = [
  { label: 'L1', value: 'L1' },
  { label: 'L2', value: 'L2' },
  { label: 'L3', value: 'L3' },
  { label: 'L4', value: 'L4' },
  { label: '无要求', value: '' },
]

const statusColorMap: Record<TrainingCourse['status'], string> = {
  upcoming: 'blue',
  in_progress: 'orange',
  completed: 'green',
}

const statusLabelMap: Record<TrainingCourse['status'], string> = {
  upcoming: '即将开课',
  in_progress: '进行中',
  completed: '已结课',
}

const TrainingCourses: React.FC = () => {
  const [data, setData] = useState<TrainingCourse[]>(trainingCourses)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingCourse | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<TrainingCourse | null>(null)
  const [form] = Form.useForm()

  const upcomingCount = data.filter((c) => c.status === 'upcoming').length
  const inProgressCount = data.filter((c) => c.status === 'in_progress').length
  const completedCount = data.filter((c) => c.status === 'completed').length

  const openAddModal = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record: TrainingCourse) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      providerId: record.providerId,
      category: record.category,
      description: record.description,
      duration: record.duration,
      maxStudents: record.maxStudents,
      startDate: record.startDate,
      endDate: record.endDate,
      requiredLevel: record.requiredLevel ?? '',
      certificationUponCompletion: record.certificationUponCompletion,
    })
    setModalOpen(true)
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const provider = serviceProviders.find((p) => p.id === values.providerId)
      if (editingRecord) {
        setData((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  ...values,
                  providerName: provider?.name ?? item.providerName,
                  requiredLevel: values.requiredLevel || undefined,
                }
              : item
          )
        )
        message.success('课程已更新')
      } else {
        const newCourse: TrainingCourse = {
          id: `TC${String(data.length + 1).padStart(3, '0')}`,
          name: values.name,
          providerId: values.providerId,
          providerName: provider?.name ?? '',
          category: values.category,
          description: values.description,
          duration: values.duration,
          maxStudents: values.maxStudents,
          enrolledStudents: 0,
          startDate: values.startDate,
          endDate: values.endDate,
          status: 'upcoming',
          requiredLevel: values.requiredLevel || undefined,
          certificationUponCompletion: values.certificationUponCompletion ?? false,
        }
        setData((prev) => [...prev, newCourse])
        message.success('课程已创建')
      }
      setModalOpen(false)
      form.resetFields()
    })
  }

  const viewDetail = (record: TrainingCourse) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const columns = [
    { title: '课程ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '课程名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '服务商', dataIndex: 'providerName', key: 'providerName', width: 110 },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '招生人数',
      key: 'enrollment',
      width: 160,
      render: (_: unknown, record: TrainingCourse) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <span style={{ fontSize: 12 }}>{record.enrolledStudents}/{record.maxStudents}</span>
          <Progress
            percent={Math.round((record.enrolledStudents / record.maxStudents) * 100)}
            size="small"
            strokeColor={record.enrolledStudents >= record.maxStudents ? '#cf1322' : '#1677ff'}
          />
        </Space>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      render: (duration: number) => `${duration}小时`,
    },
    { title: '开课日期', dataIndex: 'startDate', key: 'startDate', width: 110 },
    { title: '结课日期', dataIndex: 'endDate', key: 'endDate', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TrainingCourse['status']) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
      ),
    },
    {
      title: '要求等级',
      dataIndex: 'requiredLevel',
      key: 'requiredLevel',
      width: 90,
      render: (level?: string) =>
        level ? <Tag color="purple">{level}</Tag> : <Tag>无要求</Tag>,
    },
    {
      title: '颁发证书',
      dataIndex: 'certificationUponCompletion',
      key: 'certificationUponCompletion',
      width: 90,
      render: (cert: boolean) =>
        cert ? <Tag color="green" icon={<BookOutlined />}>是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: TrainingCourse) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="即将开课"
              value={upcomingCount}
              valueStyle={{ color: '#1677ff' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="进行中"
              value={inProgressCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已结课"
              value={completedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="培训课程列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            新增课程
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({ onDoubleClick: () => viewDetail(record) })}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑课程' : '新增课程'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="providerId" label="服务商" rules={[{ required: true, message: '请选择服务商' }]}>
                <Select
                  placeholder="请选择服务商"
                  options={serviceProviders.map((p) => ({ label: p.name, value: p.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
                <Select placeholder="请选择类别" options={categoryOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入课程描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="duration" label="时长 (小时)" rules={[{ required: true, message: '请输入时长' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxStudents" label="最大招生" rules={[{ required: true, message: '请输入人数' }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="requiredLevel" label="要求等级">
                <Select placeholder="请选择" options={levelOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开课日期" rules={[{ required: true, message: '请选择开课日期' }]}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结课日期" rules={[{ required: true, message: '请选择结课日期' }]}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="certificationUponCompletion" label="完成颁发证书" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="课程详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
        {detailRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="课程ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="课程名称">{detailRecord.name}</Descriptions.Item>
            <Descriptions.Item label="服务商">{detailRecord.providerName}</Descriptions.Item>
            <Descriptions.Item label="类别">
              <Tag color="blue">{detailRecord.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="时长">{detailRecord.duration}小时</Descriptions.Item>
            <Descriptions.Item label="招生人数">
              {detailRecord.enrolledStudents}/{detailRecord.maxStudents}
            </Descriptions.Item>
            <Descriptions.Item label="开课日期">{detailRecord.startDate}</Descriptions.Item>
            <Descriptions.Item label="结课日期">{detailRecord.endDate}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColorMap[detailRecord.status]}>
                {statusLabelMap[detailRecord.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="要求等级">
              {detailRecord.requiredLevel ? (
                <Tag color="purple">{detailRecord.requiredLevel}</Tag>
              ) : (
                <Tag>无要求</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="颁发证书" span={2}>
              {detailRecord.certificationUponCompletion ? (
                <Tag color="green" icon={<BookOutlined />}>是</Tag>
              ) : (
                <Tag>否</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {detailRecord.description}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default TrainingCourses
