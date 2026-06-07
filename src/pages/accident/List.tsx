import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Select,
  DatePicker,
  Space,
  Table,
  Tag,
  message,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Upload,
  Row,
  Col
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import { getMyAccidents, createAccident } from '@/api/modules/accident'
import { uploadImage } from '@/api/modules/upload'
import type { AccidentRecord, AccidentReportRequest } from '@/types'

const { RangePicker } = DatePicker
const { TextArea } = Input

const statusMap: Record<string, { text: string; color: string }> = {
  negotiating: { text: '协商中', color: 'blue' },
  determined: { text: '责任认定', color: 'orange' },
  completed: { text: '已完成', color: 'green' }
}

export default function AccidentList() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AccidentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (filters.status) params.status = filters.status
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const res = await getMyAccidents(params)
      setData(res.list)
      setTotal(res.total)
    } catch (error: any) {
      message.error(error.message || '获取列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, filters])

  const columns: ColumnsType<AccidentRecord> = [
    {
      title: '案件编号',
      dataIndex: 'caseNo',
      key: 'caseNo',
      render: (caseNo: string) => (
        <Tag color="blue">{caseNo}</Tag>
      )
    },
    {
      title: '事故时间',
      dataIndex: 'accidentTime',
      key: 'accidentTime',
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined className="text-gray-400" />
          <span>{dayjs(time).format('YYYY-MM-DD HH:mm')}</span>
        </Space>
      )
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (location: string) => (
        <Space>
          <EnvironmentOutlined className="text-gray-400" />
          <span>{location || '未知位置'}</span>
        </Space>
      )
    },
    {
      title: '参与方',
      key: 'parties',
      render: () => (
        <Space>
          <UserOutlined className="text-blue-500" />
          <span>甲方(我)</span>
          <CarOutlined className="text-gray-400" />
          <UserOutlined className="text-orange-500" />
          <span>乙方</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/accident/detail/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ]

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchData()
  }

  const handleReset = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    })
    setPagination({ ...pagination, current: 1 })
  }

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      })
    } else {
      setFilters({
        ...filters,
        startDate: '',
        endDate: ''
      })
    }
  }

  const handleSubmitReport = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const photoUrls: string[] = []
      for (const file of fileList) {
        if (file.originFileObj) {
          const res = await uploadImage(file.originFileObj)
          photoUrls.push(res.url)
        }
      }

      const data: AccidentReportRequest = {
        accidentTime: values.accidentTime.format('YYYY-MM-DD HH:mm:ss'),
        location: values.location,
        partyBPlateNumber: values.partyBPlateNumber,
        partyBPhone: values.partyBPhone,
        description: values.description
      }

      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      photoUrls.forEach((url) => formData.append('photos', url))

      const response = await createAccident(data as any)
      message.success('报案成功')
      setModalVisible(false)
      setFileList([])
      form.resetFields()
      fetchData()
      navigate(`/accident/detail/${response.id}`)
    } catch (error: any) {
      message.error(error.message || '提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  )

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">事故处理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新增报案
          </Button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <Space wrap size="middle">
            <Select
              placeholder="选择状态"
              style={{ width: 150 }}
              allowClear
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Select.Option value="negotiating">协商中</Select.Option>
              <Select.Option value="determined">责任认定</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>

            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateChange}
            />

            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>

            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {data.length > 0 ? (
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) =>
                  setPagination({ current: page, pageSize })
              }}
            />
          ) : (
            <Empty
              description={loading ? '' : '暂无事故记录'}
              className="py-12"
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="事故报案"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmitReport}
        confirmLoading={submitting}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          initialValues={{
            accidentTime: dayjs()
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="accidentTime"
                label="事故时间"
                rules={[{ required: true, message: '请选择事故时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="请选择事故时间"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="location"
                label="事故地点"
                rules={[{ required: true, message: '请输入事故地点' }]}
              >
                <Input placeholder="请输入事故地点" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="partyBPlateNumber"
                label="对方车牌号"
              >
                <Input placeholder="请输入对方车牌号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="partyBPhone"
                label="对方联系电话"
              >
                <Input placeholder="请输入对方联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="事故描述"
            rules={[{ required: true, message: '请描述事故情况' }]}
          >
            <TextArea
              rows={3}
              placeholder="请详细描述事故情况"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="现场照片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newList }) => setFileList(newList)}
              beforeUpload={() => false}
              multiple
              accept="image/*"
              maxCount={9}
            >
              {fileList.length >= 9 ? null : uploadButton}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
