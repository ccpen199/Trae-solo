import React, { useState } from 'react'
import { Card, Form, Input, Select, DatePicker, Button, Table, Space, Tag, message } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { trainApi } from '../services/api'

const TrainSearch = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [sortInfo, setSortInfo] = useState({ field: 'departure_time', order: 'ascend' })

  const stations = ['北京', '上海', '广州', '深圳', '武汉', '成都', '西安', '郑州', '南京', '杭州']

  const handleSearch = async (values) => {
    setLoading(true)
    try {
      const params = {}
      
      if (values.trainNumber) {
        params.trainNumber = values.trainNumber
      }
      if (values.fromStation) {
        params.fromStation = values.fromStation
      }
      if (values.toStation) {
        params.toStation = values.toStation
      }
      if (sortInfo.field) {
        params.sortBy = sortInfo.field === 'departure_time' ? 'departure_time' : 
                         sortInfo.field === 'arrival_time' ? 'arrival_time' : 'train_number'
        params.sortOrder = sortInfo.order === 'ascend' ? 'ASC' : 'DESC'
      }

      const result = await trainApi.list(params)
      
      if (result.success) {
        setData(result.data)
        message.success('查询到 ' + result.total + ' 个车次')
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchByRoute = async (values) => {
    if (!values.fromStation || !values.toStation) {
      message.warning('请选择出发站和到达站')
      return
    }

    setLoading(true)
    try {
      const params = {
        fromStation: values.fromStation,
        toStation: values.toStation,
      }
      if (values.travelDate) {
        params.travelDate = values.travelDate.format('YYYY-MM-DD')
      }

      const result = await trainApi.search(params)
      
      if (result.success) {
        setData(result.data)
        message.success('查询到 ' + result.total + ' 个车次')
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortInfo({ field: sorter.field, order: sorter.order })
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours + '小时' + mins + '分'
  }

  const columns = [
    {
      title: '车次',
      dataIndex: 'train_number',
      key: 'train_number',
      width: 100,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ color: '#1890ff' }}>{text}</strong>
          <Tag color={record.train_type === '高铁' ? 'blue' : record.train_type === '动车' ? 'green' : 'default'}>
            {record.train_name || record.train_type}
          </Tag>
        </Space>
      ),
    },
    {
      title: '出发站',
      dataIndex: 'from_station',
      key: 'from_station',
      width: 100,
    },
    {
      title: '到达站',
      dataIndex: 'to_station',
      key: 'to_station',
      width: 100,
    },
    {
      title: '发车时刻',
      dataIndex: 'departure_time',
      key: 'departure_time',
      width: 120,
      sorter: true,
      sortOrder: sortInfo.field === 'departure_time' ? sortInfo.order : null,
      render: (text) => <strong style={{ fontSize: 16 }}>{String(text).substring(0, 5)}</strong>,
    },
    {
      title: '到站时刻',
      dataIndex: 'arrival_time',
      key: 'arrival_time',
      width: 120,
      sorter: true,
      sortOrder: sortInfo.field === 'arrival_time' ? sortInfo.order : null,
      render: (text) => <strong style={{ fontSize: 16 }}>{String(text).substring(0, 5)}</strong>,
    },
    {
      title: '历时',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      width: 80,
      render: formatDuration,
    },
    {
      title: '席别',
      dataIndex: 'seat_types',
      key: 'seat_types',
      render: (seatTypes, record) => {
        if (!seatTypes || seatTypes.length === 0) {
          return <Tag color="default">查询库存</Tag>
        }
        return (
          <Space wrap>
            {seatTypes.map((st, idx) => (
              <Tag 
                key={idx} 
                color={st.available_count > 0 ? 'green' : 'red'}
              >
                {st.seat_type}: {st.available_count > 0 ? '余' + st.available_count + '张' : '无'}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: '总余票',
      dataIndex: 'total_available',
      key: 'total_available',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'red'}>
          {count > 0 ? '余 ' + count + ' 张' : '无'}
        </Tag>
      ),
    },
  ]

  return (
    <div>
      <Card title="车次查询" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="trainNumber" label="车次号">
            <Input placeholder="例如: G1" prefix={<SearchOutlined />} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              按车次查询
            </Button>
          </Form.Item>
        </Form>
        <div style={{ margin: '16px 0', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <span style={{ marginRight: 16 }}>或按区间查询:</span>
          <Form form={form} layout="inline" onFinish={handleSearchByRoute} style={{ display: 'inline-flex' }}>
            <Form.Item name="fromStation" label="出发站">
              <Select placeholder="选择出发站" style={{ width: 120 }}>
                {stations.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="toStation" label="到达站">
              <Select placeholder="选择到达站" style={{ width: 120 }}>
                {stations.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="travelDate" label="出发日期">
              <DatePicker 
                placeholder="选择日期" 
                style={{ width: 150 }}
                defaultValue={dayjs()}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                查询
              </Button>
            </Form.Item>
            <Form.Item>
              <Button 
                onClick={() => {
                  form.resetFields()
                  setData([])
                }}
                icon={<ReloadOutlined />}
              >
                重置
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>

      {data.length > 0 && (
        <Card title={'查询结果 (共 ' + data.length + ' 条)'}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => '共 ' + total + ' 条',
            }}
          />
        </Card>
      )}
    </div>
  )
}

export default TrainSearch
