import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Button, message, Select, Upload, Divider, Row, Col } from 'antd'
import { ArrowLeftOutlined, UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import request from '../../utils/request'

const { TextArea } = Input
const { Option } = Select

const NursingRecord = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [inventory, setInventory] = useState([])
  const [task, setTask] = useState(null)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchTaskDetail()
    fetchInventory()
  }, [id])

  const fetchTaskDetail = async () => {
    setLoading(true)
    try {
      const data = await request.get(`/nurse/tasks/${id}`)
      setTask(data)
      form.setFieldsValue({
        checkin_time: data.checkin_time,
        checkin_location: data.checkin_location
      })
    } catch (error) {
      message.error('获取任务详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const data = await request.get('/inventory')
      setInventory(data.list || data || [])
    } catch (error) {
      console.error('获取库存失败')
    }
  }

  const onFinish = async (values) => {
    setSubmitLoading(true)
    try {
      await request.post(`/nurse/tasks/${id}/nursing-record`, values)
      message.success('护理记录提交成功')
      navigate(-1)
    } catch (error) {
      message.error('提交失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  const uploadProps = {
    beforeUpload: () => false,
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 文件上传成功`)
      }
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>护理记录</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ materials: [{}] }}
      >
        <Card className="detail-card" title="签到信息">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="checkin_time" label="签到时间">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="checkin_location" label="签到位置">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card className="detail-card" title="生命体征">
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="temperature" label="体温(°C)" rules={[{ required: true, message: '请输入体温' }]}>
                <InputNumber min={35} max={42} step={0.1} style={{ width: '100%' }} placeholder="请输入体温" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pulse" label="脉搏(次/分)" rules={[{ required: true, message: '请输入脉搏' }]}>
                <InputNumber min={40} max={200} style={{ width: '100%' }} placeholder="请输入脉搏" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="breathing" label="呼吸(次/分)" rules={[{ required: true, message: '请输入呼吸' }]}>
                <InputNumber min={10} max={60} style={{ width: '100%' }} placeholder="请输入呼吸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="blood_pressure" label="血压(mmHg)" rules={[{ required: true, message: '请输入血压' }]}>
                <Input placeholder="如: 120/80" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="blood_oxygen" label="血氧(%)" rules={[{ required: true, message: '请输入血氧' }]}>
                <InputNumber min={80} max={100} style={{ width: '100%' }} placeholder="请输入血氧" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="blood_sugar" label="血糖(mmol/L)">
                <InputNumber min={2} max={20} step={0.1} style={{ width: '100%' }} placeholder="请输入血糖" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card className="detail-card" title="操作过程描述">
          <Form.Item name="description" rules={[{ required: true, message: '请输入操作描述' }]}>
            <TextArea rows={6} placeholder="请详细描述护理操作过程" />
          </Form.Item>
        </Card>

        <Card className="detail-card" title="耗材使用">
          <Form.List name="materials">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, 'item_id']}
                        rules={[{ required: true, message: '请选择物品' }]}
                        noStyle
                      >
                        <Select placeholder="选择物品">
                          {inventory.map(item => (
                            <Option key={item.id} value={item.id}>{item.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: '请输入数量' }]}
                        noStyle
                      >
                        <InputNumber min={1} placeholder="数量" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'remark']}
                        noStyle
                      >
                        <Input placeholder="备注" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: 20, color: '#ff4d4f', cursor: 'pointer' }} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加耗材
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>

        <Card className="detail-card" title="异常情况记录">
          <Form.Item name="abnormal">
            <TextArea rows={4} placeholder="如有异常情况请在此记录，若无异常请留空" />
          </Form.Item>
        </Card>

        <Card className="detail-card" title="家属签字">
          <Form.Item name="family_signature" label="家属姓名" rules={[{ required: true, message: '请输入家属姓名' }]}>
            <Input placeholder="请输入家属姓名" />
          </Form.Item>
          <Upload {...uploadProps} accept="image/*">
            <Button icon={<UploadOutlined />}>上传签字照片</Button>
          </Upload>
        </Card>

        <Card className="detail-card" title="现场照片">
          <Form.Item name="photos" label="照片上传">
            <Upload {...uploadProps} listType="picture-card" accept="image/*" multiple>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" htmlType="submit" loading={submitLoading}>
            提交护理记录
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default NursingRecord
