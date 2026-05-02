import React, { useState } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Row, Col, Space, Divider, List, message } from 'antd'
import { PlusOutlined, MinusCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'

const { TextArea } = Input
const { Option } = Select

function AssignmentEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isEdit = !!id

  const mockCourses = [
    { _id: '1', title: 'JavaScript 从入门到精通' },
    { _id: '2', title: 'React 实战开发' },
    { _id: '3', title: 'Python 数据分析实战' }
  ]

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      message.success(isEdit ? '作业更新成功' : '作业创建成功')
      setTimeout(() => navigate('/assignments'), 1000)
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const questionTypeOptions = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'true_false', label: '判断题' },
    { value: 'essay', label: '简答题' }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑作业' : '创建作业'}</h2>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'homework',
            status: 'draft',
            passingScore: 60,
            allowLateSubmission: false,
            attempts: 1,
            questions: []
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={16}>
              <Form.Item
                name="title"
                label="作业标题"
                rules={[{ required: true, message: '请输入作业标题' }]}
              >
                <Input placeholder="请输入作业标题" size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="作业描述"
              >
                <TextArea rows={4} placeholder="请输入作业描述" />
              </Form.Item>

              <Divider orientation="left">题目设置</Divider>

              <Form.List name="questions">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <Card
                        key={key}
                        size="small"
                        title={`题目 ${index + 1}`}
                        extra={
                          fields.length > 0 ? (
                            <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                          ) : null
                        }
                        style={{ marginBottom: 16 }}
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'type']}
                              label="题目类型"
                              rules={[{ required: true, message: '请选择题目类型' }]}
                            >
                              <Select placeholder="请选择题目类型">
                                {questionTypeOptions.map(opt => (
                                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'score']}
                              label="分值"
                              rules={[{ required: true, message: '请输入分值' }]}
                            >
                              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入分值" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          {...restField}
                          name={[name, 'content']}
                          label="题目内容"
                          rules={[{ required: true, message: '请输入题目内容' }]}
                        >
                          <TextArea rows={2} placeholder="请输入题目内容" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'options']}
                          label="选项（用逗号分隔）"
                        >
                          <Input placeholder="例如：选项A,选项B,选项C,选项D" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'correctAnswer']}
                          label="正确答案"
                        >
                          <Input placeholder="请输入正确答案" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'explanation']}
                          label="答案解析"
                        >
                          <TextArea rows={2} placeholder="请输入答案解析" />
                        </Form.Item>
                      </Card>
                    ))}

                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加题目
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                name="courseId"
                label="所属课程"
                rules={[{ required: true, message: '请选择课程' }]}
              >
                <Select placeholder="请选择课程" size="large">
                  {mockCourses.map(course => (
                    <Option key={course._id} value={course._id}>{course.title}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="type"
                label="作业类型"
              >
                <Select size="large">
                  <Option value="homework">作业</Option>
                  <Option value="quiz">测验</Option>
                  <Option value="exam">考试</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="passingScore"
                label="及格分数"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入及格分数" />
              </Form.Item>

              <Form.Item
                name="attempts"
                label="可尝试次数"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入可尝试次数" />
              </Form.Item>

              <Form.Item
                name="timeLimit"
                label="限时（分钟）"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="留空表示不限时" />
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
                  <Button onClick={() => navigate('/assignments')}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                    {isEdit ? '保存修改' : '创建作业'}
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

export default AssignmentEditor
