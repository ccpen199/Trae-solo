import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, message, Button, Modal, Form, Input, Select, DatePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import api from '../../utils/api'
import dayjs from 'dayjs'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const data = await api.get('/admin/business-reports', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      })
      setReports(data)
    } catch (error) {
      message.error('获取报送记录失败')
    }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await api.post('/admin/business-report', {
        ...values,
        report_date: values.report_date.format('YYYY-MM-DD'),
        data_json: {
          indicator1: Math.floor(Math.random() * 1000),
          indicator2: Math.floor(Math.random() * 100),
          indicator3: Math.random().toFixed(2)
        }
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      })
      message.success('数据报送成功')
      setModalVisible(false)
      form.resetFields()
      fetchReports()
    } catch (error) {
      message.error('报送失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '报告类型',
      dataIndex: 'report_type',
      key: 'report_type',
      render: (v) => {
        const names = {
          business_env: '营商环境',
          service_quality: '服务质量',
          energy_efficiency: '能效数据',
          customer_satisfaction: '客户满意度'
        }
        return <Tag color="blue">{names[v] || v}</Tag>
      }
    },
    { title: '报告日期', dataIndex: 'report_date', key: 'report_date' },
    { title: '地区', dataIndex: 'province', key: 'province', render: (v, r) => `${v || '-'} ${r.city || ''}` },
    {
      title: '报送时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <Card
      title="营商环境数据报送"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建报送
        </Button>
      }
    >
      <Table columns={columns} dataSource={reports} rowKey="id" />

      <Modal
        title="新建数据报送"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="report_type" label="报告类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="business_env">营商环境报告</Select.Option>
              <Select.Option value="service_quality">服务质量报告</Select.Option>
              <Select.Option value="energy_efficiency">能效数据报告</Select.Option>
              <Select.Option value="customer_satisfaction">客户满意度报告</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="report_date" label="报告日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="province" label="省份">
            <Input placeholder="如：北京市" />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Input placeholder="如：北京市" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              提交报送
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Reports
