import React, { useState, useEffect } from 'react'
import { Calendar, Card, Button, Tag, Modal, Form, Select, TimePicker, message, Badge, List } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../utils/request'

const { RangePicker } = TimePicker

const Schedule = () => {
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState([])
  const [tasks, setTasks] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchSchedule()
    fetchTasks()
  }, [])

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const data = await request.get('/nurse/schedule')
      setSchedule(data.list || data || [])
    } catch (error) {
      message.error('获取排班失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const data = await request.get('/nurse/tasks')
      setTasks(data.list || data || [])
    } catch (error) {
      console.error('获取任务失败')
    }
  }

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayTasks = tasks.filter(t => dayjs(t.scheduled_at).format('YYYY-MM-DD') === dateStr)
    const daySchedule = schedule.filter(s => s.date === dateStr)
    return { dayTasks, daySchedule }
  }

  const dateCellRender = (value) => {
    const { dayTasks, daySchedule } = getListData(value)
    return (
      <ul className="events">
        {dayTasks.map(item => (
          <li key={item.id}>
            <Badge status="processing" text={`${item.patient_name} - ${item.service_name}`} />
          </li>
        ))}
        {daySchedule.map((item, idx) => (
          <li key={`s-${idx}`}>
            <Badge status={item.is_available ? 'success' : 'default'} text={item.is_available ? '可用' : '不可用'} />
          </li>
        ))}
      </ul>
    )
  }

  const handleSelectDate = (date) => {
    setSelectedDate(date)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSaveSchedule = async () => {
    try {
      const values = await form.validateFields()
      await request.post('/nurse/schedule', {
        date: selectedDate.format('YYYY-MM-DD'),
        is_available: values.is_available,
        time_ranges: values.time_ranges?.map(tr => ({
          start: tr[0].format('HH:mm'),
          end: tr[1].format('HH:mm')
        }))
      })
      message.success('排班设置成功')
      setModalVisible(false)
      fetchSchedule()
    } catch (error) {
      message.error('设置失败')
    }
  }

  const handleDeleteSchedule = async (id) => {
    try {
      await request.delete(`/nurse/schedule/${id}`)
      message.success('删除成功')
      fetchSchedule()
    } catch (error) {
      message.error('删除失败')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>护理排班</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          设置排班
        </Button>
      </div>

      <Card className="detail-card">
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={handleSelectDate}
        />
      </Card>

      <Card className="detail-card" title="排班列表" style={{ marginTop: 24 }}>
        <List
          dataSource={schedule}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSchedule(item.id)}>
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div>
                    <span style={{ marginRight: 16 }}>{item.date}</span>
                    <Tag color={item.is_available ? 'green' : 'default'}>
                      {item.is_available ? '可用' : '不可用'}
                    </Tag>
                  </div>
                }
                description={
                  item.time_ranges?.map((tr, idx) => (
                    <span key={idx} style={{ marginRight: 16 }}>
                      {tr.start} - {tr.end}
                    </span>
                  )) || '全天'
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="设置排班"
        open={modalVisible}
        onOk={handleSaveSchedule}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="is_available" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Select.Option value={true}>可用</Select.Option>
              <Select.Option value={false}>不可用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="time_ranges" label="时间段">
            <Form.List name="time_ranges">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Form.Item
                        {...restField}
                        name={name}
                        noStyle
                      >
                        <RangePicker format="HH:mm" />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>删除</Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加时间段
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Schedule
