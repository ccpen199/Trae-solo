import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Button, Space, Table, Modal, Form, Input, message, Typography, Card, Tag } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { pathwayAPI } from '../api'

const { Title } = Typography

function PathwayDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pathway, setPathway] = useState(null)
  const [drugs, setDrugs] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPathway()
  }, [id])

  const loadPathway = async () => {
    try {
      const data = await pathwayAPI.getById(id)
      setPathway(data)
      setDrugs(data.drugs || [])
    } catch (error) {
      message.error('加载路径详情失败')
    }
  }

  const handleAddDrug = async (values) => {
    try {
      await pathwayAPI.addDrug(id, values)
      message.success('添加药品成功')
      setModalVisible(false)
      form.resetFields()
      loadPathway()
    } catch (error) {
      message.error('添加药品失败')
    }
  }

  const drugColumns = [
    { title: '药品名称', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency' },
    { title: '疗程', dataIndex: 'duration', key: 'duration' },
    { title: '给药途径', dataIndex: 'route', key: 'route' },
    { title: '禁忌', dataIndex: 'contraindications', key: 'contraindications' },
    { title: '备注', dataIndex: 'notes', key: 'notes' },
  ]

  if (!pathway) return <div style={{ padding: 24 }}>加载中...</div>

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/pathways')} style={{ marginBottom: 16 }}>
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>{pathway.name}</Title>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="疾病">{pathway.disease}</Descriptions.Item>
          <Descriptions.Item label="分期">{pathway.stage || '-'}</Descriptions.Item>
          <Descriptions.Item label="版本">
            <Tag color="blue">{pathway.version}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={pathway.status === 'published' ? 'green' : 'default'}>
              {pathway.status === 'published' ? '已发布' : '草稿'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{pathway.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{pathway.created_at}</Descriptions.Item>
          <Descriptions.Item label="发布时间">{pathway.published_at || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        className="card-shadow"
        title="推荐药品"
        extra={
          pathway.status !== 'published' && (
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              添加药品
            </Button>
          )
        }
      >
        <Table
          columns={drugColumns}
          dataSource={drugs}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="添加推荐药品"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddDrug}>
          <Form.Item name="drug_name" label="药品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入药品名称" />
          </Form.Item>
          <Form.Item name="dosage" label="剂量" rules={[{ required: true }]}>
            <Input placeholder="例如: 0.625g" />
          </Form.Item>
          <Form.Item name="frequency" label="给药频次" rules={[{ required: true }]}>
            <Input placeholder="例如: q8h" />
          </Form.Item>
          <Form.Item name="duration" label="疗程" rules={[{ required: true }]}>
            <Input placeholder="例如: 7-14天" />
          </Form.Item>
          <Form.Item name="route" label="给药途径">
            <Input placeholder="例如: 口服、静脉滴注" />
          </Form.Item>
          <Form.Item name="contraindications" label="禁忌">
            <Input.TextArea rows={2} placeholder="请输入禁忌说明" />
          </Form.Item>
          <Form.Item name="adjustment_conditions" label="调整条件">
            <Input.TextArea rows={2} placeholder="请输入剂量调整条件" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PathwayDetail
