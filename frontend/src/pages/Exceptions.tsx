import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  List,
  Tabs
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getExceptions,
  createException,
  processException,
  resolveException,
  getAppeals,
  createAppeal,
  reviewAppeal,
  type ExceptionItem,
  type ExceptionType,
  type ExceptionLevel,
  type ExceptionStatus,
  type AppealItem
} from '@/api'

interface TableException extends ExceptionItem {
  key: string
}

const typeMap: Record<string, { text: string; color: string }> = {
  traffic: { text: '堵车', color: 'orange' },
  damage: { text: '货物损毁', color: 'red' },
  contact: { text: '客户失联', color: 'blue' },
  delay: { text: '延误', color: 'orange' },
  no_driver: { text: '无司机接单', color: 'purple' },
  other: { text: '其他', color: 'default' }
}

const levelMap: Record<ExceptionLevel, { text: string; color: string }> = {
  low: { text: '低', color: 'green' },
  medium: { text: '中', color: 'orange' },
  high: { text: '高', color: 'red' }
}

const statusMap: Record<ExceptionStatus, { text: string; color: string; status: any }> = {
  pending: { text: '待处理', color: 'warning', status: 'warning' },
  processing: { text: '处理中', color: 'processing', status: 'processing' },
  resolved: { text: '已解决', color: 'success', status: 'success' }
}

const appealStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' }
}

const Exceptions: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TableException[]>([])
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [appealModalOpen, setAppealModalOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [selectedException, setSelectedException] = useState<TableException | null>(null)
  const [appeals, setAppeals] = useState<AppealItem[]>([])
  const [reportForm] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [resolveForm] = Form.useForm()
  const [appealForm] = Form.useForm()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [stats, setStats] = useState({ pending: 0, processing: 0, resolved: 0 })

  const fetchExceptions = async (params?: any) => {
    setLoading(true)
    try {
      const response = await getExceptions(params)
      if (response.code === 0) {
        const list = response.data.list.map(item => ({ ...item, key: item.id }))
        setData(list)
        setTotal(response.data.total)
        const pending = list.filter(item => item.status === 'pending').length
        const processing = list.filter(item => item.status === 'processing').length
        const resolved = list.filter(item => item.status === 'resolved').length
        setStats({ pending, processing, resolved })
      } else {
        message.error(response.message || '获取异常列表失败')
      }
    } catch (error) {
      message.error('获取异常列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchAppeals = async (exceptionId: string) => {
    try {
      const response = await getAppeals({ exceptionId })
      if (response.code === 0) {
        setAppeals(response.data.list)
      }
    } catch (error) {
      console.error('获取申诉列表失败')
    }
  }

  useEffect(() => {
    fetchExceptions({ page: 1, pageSize: 10 })
  }, [])

  const handleSearch = (values: any) => {
    const params = {
      page: 1,
      pageSize: pagination.pageSize,
      ...values
    }
    setPagination({ ...pagination, page: 1 })
    fetchExceptions(params)
  }

  const handleReport = async (values: any) => {
    try {
      const response = await createException(values)
      if (response.code === 0) {
        message.success('异常申报成功')
        setIsModalOpen(false)
        reportForm.resetFields()
        fetchExceptions({ page: pagination.page, pageSize: pagination.pageSize })
      } else {
        message.error(response.message || '异常申报失败')
      }
    } catch (error) {
      message.error('异常申报失败')
    }
  }

  const handleProcess = async (record: TableException) => {
    try {
      const response = await processException(record.id)
      if (response.code === 0) {
        message.success('已开始处理')
        fetchExceptions({ page: pagination.page, pageSize: pagination.pageSize })
      } else {
        message.error(response.message || '处理失败')
      }
    } catch (error) {
      message.error('处理失败')
    }
  }

  const handleResolve = async (values: any) => {
    if (!selectedException) return
    try {
      const response = await resolveException(selectedException.id, values.remark)
      if (response.code === 0) {
        message.success('异常已解决')
        setResolveModalOpen(false)
        resolveForm.resetFields()
        fetchExceptions({ page: pagination.page, pageSize: pagination.pageSize })
      } else {
        message.error(response.message || '解决失败')
      }
    } catch (error) {
      message.error('解决失败')
    }
  }

  const handleAppeal = async (values: any) => {
    if (!selectedException) return
    try {
      const response = await createAppeal({
        exception_id: selectedException.id,
        driver_id: selectedException.driver_id,
        content: values.content
      })
      if (response.code === 0) {
        message.success('申诉提交成功')
        setAppealModalOpen(false)
        appealForm.resetFields()
        fetchAppeals(selectedException.id)
      } else {
        message.error(response.message || '申诉提交失败')
      }
    } catch (error) {
      message.error('申诉提交失败')
    }
  }

  const handleReviewAppeal = async (appeal: AppealItem, status: 'approved' | 'rejected', remark?: string) => {
    try {
      const response = await reviewAppeal(appeal.id, status, remark)
      if (response.code === 0) {
        message.success(status === 'approved' ? '申诉已通过' : '申诉已驳回')
        if (selectedException) {
          fetchAppeals(selectedException.id)
        }
      } else {
        message.error(response.message || '审核失败')
      }
    } catch (error) {
      message.error('审核失败')
    }
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
    const values = searchForm.getFieldsValue()
    fetchExceptions({ page, pageSize, ...values })
  }

  const openDetailModal = (record: TableException) => {
    setSelectedException(record)
    fetchAppeals(record.id)
    setDetailModalOpen(true)
  }

  const openResolveModal = (record: TableException) => {
    setSelectedException(record)
    setResolveModalOpen(true)
  }

  const openAppealModal = (record: TableException) => {
    setSelectedException(record)
    setAppealModalOpen(true)
  }

  const columns: ColumnsType<TableException> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140,
      render: (text: string) => text || '-'
    },
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ExceptionType) => {
        const info = typeMap[type] || { text: type, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '紧急程度',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level: ExceptionLevel) => {
        const info = levelMap[level] || { text: level, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '异常描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '涉事司机',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 90,
      render: (name?: string) => name || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExceptionStatus) => {
        const info = statusMap[status] || { text: status, color: 'default', status: 'default' }
        return <Badge status={info.status} text={info.text} />
      }
    },
    {
      title: '上报时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleProcess(record)}>
              开始处理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" onClick={() => openResolveModal(record)}>
              标记解决
            </Button>
          )}
          <Button type="link" size="small" onClick={() => openAppealModal(record)}>
            申诉
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理异常"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="处理中异常"
              value={stats.processing}
              valueStyle={{ color: '#1890ff' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="已解决异常"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="异常总数"
              value={total}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="异常事件列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            申报异常
          </Button>
        }
      >
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索订单号/描述" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="type">
            <Select placeholder="异常类型" allowClear style={{ width: 120 }}>
              <Select.Option value="traffic">堵车</Select.Option>
              <Select.Option value="damage">货物损毁</Select.Option>
              <Select.Option value="contact">客户失联</Select.Option>
              <Select.Option value="delay">延误</Select.Option>
              <Select.Option value="no_driver">无司机接单</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="处理状态" allowClear style={{ width: 120 }}>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="level">
            <Select placeholder="紧急程度" allowClear style={{ width: 120 }}>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { searchForm.resetFields(); fetchExceptions({ page: 1, pageSize: 10 }) }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Modal
        title="申报异常"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={reportForm} layout="vertical" onFinish={handleReport}>
          <Form.Item name="order_id" label="关联订单ID" rules={[{ required: true, message: '请输入订单ID' }]}>
            <Input placeholder="请输入订单ID" />
          </Form.Item>
          <Form.Item name="type" label="异常类型" rules={[{ required: true, message: '请选择异常类型' }]}>
            <Select placeholder="请选择异常类型">
              <Select.Option value="traffic">堵车</Select.Option>
              <Select.Option value="damage">货物损毁</Select.Option>
              <Select.Option value="contact">客户失联</Select.Option>
              <Select.Option value="delay">延误</Select.Option>
              <Select.Option value="no_driver">无司机接单</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="level" label="紧急程度">
            <Select placeholder="请选择紧急程度">
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="异常描述" rules={[{ required: true, message: '请输入异常描述' }]}>
            <Input.TextArea placeholder="请详细描述异常情况" rows={4} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认申报</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedException && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: '基本信息',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="订单号">{selectedException.order_no || '-'}</Descriptions.Item>
                    <Descriptions.Item label="异常类型">
                      <Tag color={typeMap[selectedException.type]?.color}>
                        {typeMap[selectedException.type]?.text}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="紧急程度">
                      <Tag color={levelMap[selectedException.level]?.color}>
                        {levelMap[selectedException.level]?.text}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Badge status={statusMap[selectedException.status]?.status} text={statusMap[selectedException.status]?.text} />
                    </Descriptions.Item>
                    <Descriptions.Item label="涉事司机" span={2}>{selectedException.driver_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="异常描述" span={2}>{selectedException.description}</Descriptions.Item>
                    <Descriptions.Item label="上报时间" span={2}>{selectedException.created_at}</Descriptions.Item>
                    {selectedException.resolved_at && (
                      <Descriptions.Item label="解决时间" span={2}>{selectedException.resolved_at}</Descriptions.Item>
                    )}
                    {selectedException.handle_remark && (
                      <Descriptions.Item label="处理备注" span={2}>{selectedException.handle_remark}</Descriptions.Item>
                    )}
                  </Descriptions>
                )
              },
              {
                key: '2',
                label: `申诉记录 (${appeals.length})`,
                children: (
                  <List
                    dataSource={appeals}
                    locale={{ emptyText: '暂无申诉记录' }}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        actions={
                          item.status === 'pending'
                            ? [
                                <Button type="link" size="small" onClick={() => handleReviewAppeal(item, 'approved')}>通过</Button>,
                                <Button type="link" size="small" danger onClick={() => handleReviewAppeal(item, 'rejected')}>驳回</Button>
                              ]
                            : []
                        }
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <span>{item.driver_name || '未知司机'}</span>
                              <Tag color={appealStatusMap[item.status]?.color}>
                                {appealStatusMap[item.status]?.text}
                              </Tag>
                            </Space>
                          }
                          description={item.reason || item.content}
                        />
                        <div style={{ fontSize: 12, color: '#999' }}>{item.created_at}</div>
                      </List.Item>
                    )}
                  />
                )
              }
            ]}
          />
        )}
      </Modal>

      <Modal
        title="标记异常已解决"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item name="remark" label="处理备注">
            <Input.TextArea placeholder="请输入处理结果备注" rows={4} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setResolveModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认解决</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交申诉"
        open={appealModalOpen}
        onCancel={() => setAppealModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={appealForm} layout="vertical" onFinish={handleAppeal}>
          <Form.Item name="content" label="申诉内容" rules={[{ required: true, message: '请输入申诉内容' }]}>
            <Input.TextArea placeholder="请详细描述申诉理由" rows={4} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAppealModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交申诉</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default Exceptions
