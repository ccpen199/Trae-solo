import React, { useState } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Row, Col, message, Space, Divider } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'

const { TextArea } = Input
const { Option } = Select

function CourseEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isEdit = !!id

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      message.success(isEdit ? '课程更新成功' : '课程创建成功')
      setTimeout(() => navigate('/courses'), 1000)
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑课程' : '创建课程'}</h2>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            difficulty: 'beginner',
            price: 0
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={16}>
              <Form.Item
                name="title"
                label="课程标题"
                rules={[{ required: true, message: '请输入课程标题' }]}
              >
                <Input placeholder="请输入课程标题" size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="课程简介"
                rules={[{ required: true, message: '请输入课程简介' }]}
              >
                <TextArea rows={6} placeholder="请详细描述课程内容、适合人群、学习目标等" />
              </Form.Item>

              <Divider>章节设置</Divider>
              
              <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
                <p style={{ color: '#999', margin: 0 }}>章节设置功能开发中...</p>
                <Button type="dashed" style={{ marginTop: 8 }}>添加章节</Button>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                name="category"
                label="课程分类"
                rules={[{ required: true, message: '请选择课程分类' }]}
              >
                <Select placeholder="请选择课程分类" size="large">
                  <Option value="前端开发">前端开发</Option>
                  <Option value="后端开发">后端开发</Option>
                  <Option value="移动开发">移动开发</Option>
                  <Option value="数据科学">数据科学</Option>
                  <Option value="人工智能">人工智能</Option>
                  <Option value="云计算">云计算</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="difficulty"
                label="难度等级"
              >
                <Select size="large">
                  <Option value="beginner">初级</Option>
                  <Option value="intermediate">中级</Option>
                  <Option value="advanced">高级</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="price"
                label="课程价格（元）"
              >
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="0 表示免费"
                />
              </Form.Item>

              <Form.Item
                name="originalPrice"
                label="原价（元）"
              >
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="用于显示折扣"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="发布状态"
              >
                <Select size="large">
                  <Option value="draft">保存为草稿</Option>
                  <Option value="published">立即发布</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button onClick={() => navigate('/courses')}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                    {isEdit ? '保存修改' : '创建课程'}
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}

export default CourseEditor
