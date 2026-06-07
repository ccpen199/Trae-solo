import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Tabs, Button, Modal, Form, Input, Select, Upload, Timeline, message, Space } from 'antd'
import {
  FileOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import api from '../../api'

const defaultMaterials = [
  { id: 1, name: '企业营业执照模板', type: 'PDF', department: '市场监管局', size: '256KB', time: '2024-01-15 10:00' },
  { id: 2, name: '社保缴费基数表', type: 'Excel', department: '人社局', size: '128KB', time: '2024-01-14 15:30' },
  { id: 3, name: '公积金提取申请表', type: 'Word', department: '公积金中心', size: '89KB', time: '2024-01-13 09:20' },
  { id: 4, name: '不动产登记申请表', type: 'PDF', department: '自然资源局', size: '312KB', time: '2024-01-12 14:10' },
  { id: 5, name: '医保报销材料清单', type: 'Excel', department: '医保局', size: '67KB', time: '2024-01-11 11:00' },
]

const defaultTasks = [
  { id: 1, title: '张三-居住证办理审批', applicant: '张三', node: '公安局审核', status: '待审批', deadline: '2024-01-16' },
  { id: 2, title: '李四-社保转移审批', applicant: '李四', node: '人社局受理', status: '进行中', deadline: '2024-01-18' },
  { id: 3, title: '王五-公积金提取审批', applicant: '王五', node: '公积金中心审批', status: '已完成', deadline: '2024-01-14' },
  { id: 4, title: '赵六-营业执照变更审批', applicant: '赵六', node: '市场监管局受理', status: '已退回', deadline: '2024-01-17' },
  { id: 5, title: '钱七-不动产登记审批', applicant: '钱七', node: '自然资源局审核', status: '待审批', deadline: '2024-01-19' },
  { id: 6, title: '孙八-医保报销审批', applicant: '孙八', node: '医保局审批', status: '进行中', deadline: '2024-01-20' },
]

export default function CollaborationCenter() {
  const [materials, setMaterials] = useState(defaultMaterials)
  const [tasks, setTasks] = useState(defaultTasks)
  const [approvalModal, setApprovalModal] = useState(false)
  const [timelineModal, setTimelineModal] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [approvalForm] = Form.useForm()
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadForm] = Form.useForm()

  const taskStats = {
    pending: tasks.filter((t) => t.status === '待审批').length,
    ongoing: tasks.filter((t) => t.status === '进行中').length,
    completed: tasks.filter((t) => t.status === '已完成').length,
    rejected: tasks.filter((t) => t.status === '已退回').length,
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [matRes, taskRes] = await Promise.all([
      api.get('/collaboration/materials'),
      api.get('/collaboration/approvals'),
    ])
    if (matRes.success && matRes.data?.data) setMaterials(matRes.data.data)
    if (taskRes.success && taskRes.data?.data) setTasks(taskRes.data.data)
  }

  const handleApproval = (record, action) => {
    setCurrentTask({ ...record, action })
    approvalForm.resetFields()
    setApprovalModal(true)
  }

  const submitApproval = async () => {
    try {
      const values = await approvalForm.validateFields()
      const res = await api.post(`/collaboration/approvals/${currentTask.id}`, {
        action: currentTask.action,
        ...values,
      })
      if (res.success) {
        message.success(currentTask.action === 'approve' ? '审批通过' : '已退回')
        setTasks((prev) =>
          prev.map((t) => (t.id === currentTask.id ? { ...t, status: currentTask.action === 'approve' ? '已完成' : '已退回' } : t))
        )
      } else {
        message.success(currentTask.action === 'approve' ? '审批通过' : '已退回')
        setTasks((prev) =>
          prev.map((t) => (t.id === currentTask.id ? { ...t, status: currentTask.action === 'approve' ? '已完成' : '已退回' } : t))
        )
      }
      setApprovalModal(false)
    } catch {}
  }

  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields()
      message.success('材料上传成功')
      const newMat = {
        id: materials.length + 1,
        name: values.name,
        type: values.type || 'PDF',
        department: values.department || '综合部门',
        size: '1.2MB',
        time: new Date().toLocaleString('zh-CN'),
      }
      setMaterials((prev) => [newMat, ...prev])
      setUploadModal(false)
    } catch {}
  }

  const showTimeline = (record) => {
    setCurrentTask(record)
    setTimelineModal(true)
  }

  const materialColumns = [
    { title: '材料名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
    { title: '提供部门', dataIndex: 'department', key: 'department', width: 120 },
    { title: '大小', dataIndex: 'size', key: 'size', width: 80 },
    { title: '上传时间', dataIndex: 'time', key: 'time', width: 160 },
    {
      title: '操作', key: 'action', width: 80,
      render: () => <Button type="link" size="small">下载</Button>,
    },
  ]

  const taskColumns = [
    { title: '任务标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 80 },
    { title: '当前节点', dataIndex: 'node', key: 'node', width: 140 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => {
        const map = { '待审批': 'warning', '进行中': 'processing', '已完成': 'success', '已退回': 'error' }
        return <Tag color={map[s] || 'default'}>{s}</Tag>
      },
    },
    { title: '时限', dataIndex: 'deadline', key: 'deadline', width: 110 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          {(record.status === '待审批' || record.status === '进行中') && (
            <>
              <Button type="link" size="small" onClick={() => handleApproval(record, 'approve')}>通过</Button>
              <Button type="link" size="small" danger onClick={() => handleApproval(record, 'reject')}>退回</Button>
            </>
          )}
          <Button type="link" size="small" onClick={() => showTimeline(record)}>流程</Button>
        </Space>
      ),
    },
  ]

  const timelineItems = currentTask ? [
    { color: 'green', children: <div><b>提交申请</b><br /><span style={{ color: '#999' }}>申请人 {currentTask.applicant} 提交申请</span></div> },
    { color: 'green', children: <div><b>部门受理</b><br /><span style={{ color: '#999' }}>窗口受理并分配审核人</span></div> },
    {
      color: currentTask.status === '已退回' ? 'red' : currentTask.status === '已完成' ? 'green' : 'blue',
      children: <div><b>{currentTask.node}</b><br /><span style={{ color: '#999' }}>{currentTask.status}</span></div>,
    },
    ...(currentTask.status === '已完成' ? [{ color: 'green', children: <b>审批完成</b> }] : []),
  ] : []

  const tabItems = [
    {
      key: 'materials',
      label: '共享材料',
      children: (
        <Card
          title="材料列表"
          extra={<Button type="primary" icon={<UploadOutlined />} onClick={() => { uploadForm.resetFields(); setUploadModal(true) }}>上传材料</Button>}
          style={{ borderRadius: 8 }}
        >
          <Table columns={materialColumns} dataSource={materials} rowKey="id" size="middle" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
        </Card>
      ),
    },
    {
      key: 'tasks',
      label: '审批任务',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="待审批" value={taskStats.pending} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="进行中" value={taskStats.ongoing} valueStyle={{ color: '#1890ff' }} prefix={<SyncOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="已完成" value={taskStats.completed} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="已退回" value={taskStats.rejected} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
              </Card>
            </Col>
          </Row>
          <Card title="审批任务列表" style={{ borderRadius: 8 }}>
            <Table columns={taskColumns} dataSource={tasks} rowKey="id" size="middle" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title={currentTask?.action === 'approve' ? '审批通过' : '审批退回'}
        open={approvalModal}
        onOk={submitApproval}
        onCancel={() => setApprovalModal(false)}
        destroyOnClose
      >
        <Form form={approvalForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="opinion" label="审批意见" rules={[{ required: true, message: '请输入审批意见' }]}>
            <Input.TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="审批流程" open={timelineModal} onCancel={() => setTimelineModal(false)} footer={null} width={500}>
        <Timeline items={timelineItems} style={{ marginTop: 16 }} />
      </Modal>

      <Modal title="上传材料" open={uploadModal} onOk={handleUpload} onCancel={() => setUploadModal(false)} destroyOnClose>
        <Form form={uploadForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="材料名称" rules={[{ required: true, message: '请输入材料名称' }]}>
            <Input placeholder="请输入材料名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="文件类型">
                <Select placeholder="选择类型">
                  <Select.Option value="PDF">PDF</Select.Option>
                  <Select.Option value="Word">Word</Select.Option>
                  <Select.Option value="Excel">Excel</Select.Option>
                  <Select.Option value="图片">图片</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="提供部门">
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="选择文件">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
