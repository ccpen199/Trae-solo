import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Descriptions, Row, Col, Progress, Card } from 'antd'
import { EyeOutlined, PlusOutlined, FileTextOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select

function Archives() {
  const [archives, setArchives] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentArchive, setCurrentArchive] = useState(null)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [modifications, setModifications] = useState([])
  const [modifyModalVisible, setModifyModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [modifyForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [archivesRes, studentsRes] = await Promise.all([
        api.get('/archives'),
        api.get('/students'),
      ])
      setArchives(archivesRes.data)
      setStudents(studentsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadModifications = async (archiveId) => {
    try {
      const response = await api.get(`/archives/${archiveId}/modifications`)
      setModifications(response.data)
    } catch (error) {
      message.error('加载修改记录失败')
    }
  }

  const handleViewDetail = async (archive) => {
    setCurrentArchive(archive)
    await loadModifications(archive.id)
    setDetailModalVisible(true)
  }

  const handleCreateArchive = () => {
    form.resetFields()
    setAddModalVisible(true)
  }

  const handleSubmitArchive = async () => {
    try {
      const values = await form.validateFields()
      await api.post('/archives', {
        ...values,
        archived_by: 1,
      })
      message.success('归档成功')
      setAddModalVisible(false)
      loadData()
    } catch (error) {
      message.error('归档失败')
    }
  }

  const handleRequestModify = () => {
    modifyForm.resetFields()
    setModifyModalVisible(true)
  }

  const handleSubmitModify = async () => {
    try {
      const values = await modifyForm.validateFields()
      await api.post(`/archives/${currentArchive.id}/modifications`, {
        ...values,
        modified_by: 1,
      })
      message.success('修改申请已提交，等待审批')
      setModifyModalVisible(false)
      await loadModifications(currentArchive.id)
    } catch (error) {
      message.error('申请失败')
    }
  }

  const handleApproveModify = async (modificationId) => {
    try {
      await api.put(`/archives/modifications/${modificationId}/approve`, {
        status: 'approved',
        approved_by: 1,
      })
      message.success('审批通过')
      await loadModifications(currentArchive.id)
    } catch (error) {
      message.error('审批失败')
    }
  }

  const handleRejectModify = async (modificationId) => {
    try {
      await api.put(`/archives/modifications/${modificationId}/approve`, {
        status: 'rejected',
        approved_by: 1,
      })
      message.success('已驳回')
      await loadModifications(currentArchive.id)
    } catch (error) {
      message.error('操作失败')
    }
  }

  const modificationColumns = [
    { title: '修改原因', dataIndex: 'change_reason', key: 'change_reason', ellipsis: true },
    { title: '修改内容', dataIndex: 'change_content', key: 'change_content', ellipsis: true },
    { title: '申请人', dataIndex: 'modifier_name', key: 'modifier_name' },
    {
      title: '状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status) => {
        const colors = { pending: 'orange', approved: 'green', rejected: 'red' }
        const texts = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
        return <Tag color={colors[status]}>{texts[status]}</Tag>
      },
    },
    { title: '审批人', dataIndex: 'approver_name', key: 'approver_name' },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => record.approval_status === 'pending' && (
        <Space>
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApproveModify(record.id)}>
            通过
          </Button>
          <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleRejectModify(record.id)}>
            驳回
          </Button>
        </Space>
      ),
    },
  ]

  const columns = [
    { title: '学生', dataIndex: 'student_name', key: 'student_name' },
    { title: '学号', dataIndex: 'student_no', key: 'student_no' },
    { title: '年级', dataIndex: 'grade', key: 'grade', render: (g) => `初${g}` },
    { title: '班级', dataIndex: 'class_name', key: 'class_name' },
    { title: '学期', dataIndex: 'semester', key: 'semester' },
    {
      title: '总分',
      dataIndex: 'overall_score',
      key: 'overall_score',
      render: (score) => (
        <strong style={{ color: score >= 0 ? '#52c41a' : '#ff4d4f' }}>{score}</strong>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_archived',
      key: 'is_archived',
      render: (v) => <Tag color={v ? 'green' : 'orange'}>{v ? '已归档' : '未归档'}</Tag>,
    },
    { title: '归档人', dataIndex: 'archiver_name', key: 'archiver_name' },
    { title: '归档时间', dataIndex: 'archived_at', key: 'archived_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看档案
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>档案归档管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateArchive}>
          创建归档
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={archives}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="综合素质档案详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="modify" type="primary" onClick={handleRequestModify}>申请修改</Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={900}
      >
        {currentArchive && (
          <div>
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="学生">{currentArchive.student_name}</Descriptions.Item>
                <Descriptions.Item label="学号">{currentArchive.student_no}</Descriptions.Item>
                <Descriptions.Item label="年级">{`初${currentArchive.grade}`}</Descriptions.Item>
                <Descriptions.Item label="班级">{currentArchive.class_name}</Descriptions.Item>
                <Descriptions.Item label="学期">{currentArchive.semester}</Descriptions.Item>
                <Descriptions.Item label="综合得分">
                  <strong style={{ 
                    color: currentArchive.overall_score >= 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: 18
                  }}>
                    {currentArchive.overall_score}
                  </strong>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="各维度得分" style={{ marginBottom: 16 }}>
              {(() => {
                try {
                  const dimensions = JSON.parse(currentArchive.dimension_scores || '[]')
                  return dimensions.map((dim, index) => (
                    <div key={index} style={{ marginBottom: 12 }}>
                      <Row justify="space-between" align="middle">
                        <Col span={6}>{dim.dimension_name}</Col>
                        <Col span={18}>
                          <Progress
                            percent={Math.min(Math.max((dim.bonus - dim.penalty) * 10, 0), 100)}
                            format={() => `+${dim.bonus} / -${dim.penalty} = ${dim.bonus - dim.penalty}`}
                            strokeColor={(dim.bonus - dim.penalty) >= 0 ? '#52c41a' : '#ff4d4f'}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))
                } catch (e) {
                  return <div>暂无数据</div>
                }
              })()}
            </Card>

            <Card title="修改审批记录" extra={<Tag color="blue">{modifications.length} 条记录</Tag>}>
              <Table
                columns={modificationColumns}
                dataSource={modifications}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="创建学期归档"
        open={addModalVisible}
        onOk={handleSubmitArchive}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="student_id" label="选择学生" rules={[{ required: true }]}>
            <Select placeholder="选择要归档的学生" showSearch>
              {students.map((s) => (
                <Option key={s.id} value={s.id}>{s.name} - {s.student_no} (初{s.grade}{s.class_name})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="semester" label="学期" rules={[{ required: true }]} initialValue="2024-2025-1">
            <Select>
              <Option value="2024-2025-1">2024-2025学年上学期</Option>
              <Option value="2024-2025-2">2024-2025学年下学期</Option>
              <Option value="2023-2024-1">2023-2024学年上学期</Option>
              <Option value="2023-2024-2">2023-2024学年下学期</Option>
            </Select>
          </Form.Item>
          <div style={{ color: '#666', padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            系统将自动计算该学生本学期的所有评价记录得分
          </div>
        </Form>
      </Modal>

      <Modal
        title="申请修改档案"
        open={modifyModalVisible}
        onOk={handleSubmitModify}
        onCancel={() => setModifyModalVisible(false)}
      >
        <Form form={modifyForm} layout="vertical">
          <Form.Item name="change_reason" label="修改原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请说明需要修改档案的原因" />
          </Form.Item>
          <Form.Item name="change_content" label="修改内容" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细说明需要修改的具体内容" />
          </Form.Item>
        </Form>
        <div style={{ color: '#faad14', padding: '12px', background: '#fffbe6', borderRadius: 4 }}>
          注意：档案修改需要经过审批后方可生效
        </div>
      </Modal>
    </div>
  )
}

export default Archives
