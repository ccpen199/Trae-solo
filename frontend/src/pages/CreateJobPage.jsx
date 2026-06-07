import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, Button, InputNumber, message } from 'antd'
import request from '../utils/request'

const { TextArea } = Input

const categoryOptions = [
  { value: '餐饮', label: '餐饮' },
  { value: '零售', label: '零售' },
  { value: '家教', label: '家教' },
  { value: '配送', label: '配送' },
  { value: '活动', label: '活动' },
  { value: '技术', label: '技术' },
  { value: '其他', label: '其他' }
]

export default function CreateJobPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await request.post('/jobs', values)
      message.success('岗位发布成功，等待审核')
      navigate('/employer/jobs')
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="发布岗位">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 600 }}
      >
        <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
          <Input placeholder="请输入岗位名称" />
        </Form.Item>
        <Form.Item name="category" label="岗位分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="请选择分类" options={categoryOptions} />
        </Form.Item>
        <Form.Item name="description" label="岗位描述" rules={[{ required: true, message: '请输入岗位描述' }]}>
          <TextArea rows={4} placeholder="请详细描述工作内容和要求" />
        </Form.Item>
        <Form.Item name="work_time" label="工作时间" rules={[{ required: true, message: '请输入工作时间' }]}>
          <Input placeholder="例如：每周六9:00-17:00" />
        </Form.Item>
        <Form.Item name="work_location" label="工作地点" rules={[{ required: true, message: '请输入工作地点' }]}>
          <Input placeholder="例如：北京市海淀区XX路XX号" />
        </Form.Item>
        <Form.Item name="hourly_wage" label="时薪（元）" rules={[{ required: true, message: '请输入时薪' }]}>
          <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="请输入时薪" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            发布岗位
          </Button>
          <Button style={{ marginLeft: 12 }} onClick={() => navigate('/employer/jobs')}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
