import React, { useState } from 'react'
import { Form, Input, Select, InputNumber, Button, Card, Typography, message, Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ownerApi } from '../../utils/api'

const { Title } = Typography
const { TextArea } = Input

const serviceTypes = [
  { value: 'air_conditioner', label: '空调维修/加氟' },
  { value: 'plumbing', label: '水管维修' },
  { value: 'electrical', label: '电路维修' },
  { value: 'appliance', label: '家电维修' },
  { value: 'locksmith', label: '开锁换锁' },
  { value: 'cleaning', label: '家政清洁' },
  { value: 'moving', label: '搬家服务' },
  { value: 'other', label: '其他服务' }
]

const CreateOrder = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await ownerApi.createOrder({
        ...values,
        fault_images: fileList.map(f => f.url || f.name)
      })
      message.success('订单创建成功')
      navigate('/orders')
    } catch (error) {
      message.error(error.message || '创建订单失败')
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>发布服务需求</Title>
      
      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ budget_price: 200 }}
        >
          <Form.Item
            name="service_type"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select placeholder="请选择服务类型" options={serviceTypes} />
          </Form.Item>

          <Form.Item
            name="title"
            label="服务标题"
            rules={[{ required: true, message: '请输入服务标题' }]}
          >
            <Input placeholder="请简要描述您的需求，如：空调不制冷需要维修" />
          </Form.Item>

          <Form.Item
            name="description"
            label="故障描述"
            rules={[{ required: true, message: '请输入故障描述' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请详细描述故障情况，包括故障现象、发生时间等信息，帮助师傅更好地了解问题"
            />
          </Form.Item>

          <Form.Item label="上传故障图片">
            <Upload {...uploadProps} listType="picture-card" multiple>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="expected_time"
            label="期望服务时间"
          >
            <Input placeholder="如：本周六上午 9:00-12:00" />
          </Form.Item>

          <Form.Item
            name="address"
            label="服务地址"
            rules={[{ required: true, message: '请输入服务地址' }]}
          >
            <Input placeholder="请输入详细地址，包括小区名称、门牌号等" />
          </Form.Item>

          <Form.Item
            name="contact_name"
            label="联系人姓名"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="budget_price"
            label="预算金额（元）"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              placeholder="请输入您的预算金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\¥\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ marginRight: 16 }}>
              发布订单
            </Button>
            <Button size="large" onClick={() => navigate('/orders')}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CreateOrder
