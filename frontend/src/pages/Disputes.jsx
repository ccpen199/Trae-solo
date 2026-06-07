import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Descriptions,
  message,
} from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import request from '../utils/request'

const statusMap = {
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
}

const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

export default function Disputes() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [userIdFilter, setUserIdFilter] = useState(undefined)

  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [resultOpen, setResultOpen] = useState(false)
  const [resultRecord, setResultRecord] = useState(null)
  const [resultStatus, setResultStatus] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      if (userIdFilter) params.userId = userIdFilter
      const res = await request.get('/disputes', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取申诉列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, userIdFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleReset = () => {
    setStatusFilter(undefined)
    setUserIdFilter(undefined)
    setPage(1)
  }

  const handleAddOpen = () => {
    addForm.resetFields()
    setAddOpen(true)
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields()
      setAddLoading(true)
      const payload = {
        exception_event_id: values.exception_event_id,
        description: values.description,
        evidence_urls: (values.evidence_urls || [])
          .map((item) => item?.url)
          .filter(Boolean),
      }
      await request.post('/disputes', payload)
      message.success('发起申诉成功')
      setAddOpen(false)
      addForm.resetFields()
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '发起申诉失败')
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handleDetail = async (record) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailRecord(null)
    try {
      const res = await request.get(`/disputes/${record.id}`)
      setDetailRecord(res.data)
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleProcess = async (record) => {
    try {
      await request.put(`/disputes/${record.id}`, { status: 'processing' })
      message.success('已开始处理')
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败')
    }
  }

  const handleResultOpen = (record, newStatus) => {
    setResultRecord(record)
    setResultStatus(newStatus)
    resultForm.resetFields()
    setResultOpen(true)
  }

  const handleResultOk = async () => {
    try {
      const values = await resultForm.validateFields()
      setResultLoading(true)
      await request.put(`/disputes/${resultRecord.id}`, {
        status: resultStatus,
        result: values.result,
      })
      message.success(resultStatus === 'resolved' ? '已通过' : '已驳回')
      setResultOpen(false)
      resultForm.resetFields()
      setResultRecord(null)
      setResultStatus(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败')
      }
    } finally {
      setResultLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
    },
    {
      title: '关联异常类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      render: (type) => type || '-',
    },
    {
      title: '申诉描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '证据数量',
      key: 'evidence_count',
      width: 90,
      render: (_, record) => {
        const urls = record.evidence_urls_parsed || []
        return urls.length
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    {
      title: '处理结果',
      dataIndex: 'result',
      key: 'result',
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          {record.status === 'processing' && (
            <>
              <Button type="link" size="small" onClick={() => handleResultOpen(record, 'resolved')}>
                通过
              </Button>
              <Button type="link" size="small" danger onClick={() => handleResultOpen(record, 'rejected')}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>申诉管理</h2>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          options={statusOptions}
          style={{ width: 160 }}
        />
        <InputNumber
          placeholder="用户ID筛选"
          value={userIdFilter}
          onChange={(value) => {
            setUserIdFilter(value)
            setPage(1)
          }}
          style={{ width: 160 }}
          min={1}
        />
        <Button onClick={handleReset}>重置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOpen}>
          发起申诉
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="发起申诉"
        open={addOpen}
        onOk={handleAddOk}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        confirmLoading={addLoading}
        width={600}
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            name="exception_event_id"
            label="异常事件ID"
            rules={[{ required: true, message: '请输入异常事件ID' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item
            name="description"
            label="申诉描述"
            rules={[{ required: true, message: '请输入申诉描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.List name="evidence_urls">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Form.Item
                    key={field.key}
                    label={field.key === 0 ? '证据链接' : ' '}
                    colon={field.key !== 0}
                  >
                    <Space align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'url']}
                        noStyle
                      >
                        <Input placeholder="请输入证据URL" style={{ width: 460 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加证据链接
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="申诉详情"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setDetailRecord(null)
        }}
        footer={null}
        width={640}
        loading={detailLoading}
      >
        {detailRecord && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{detailRecord.username}</Descriptions.Item>
            <Descriptions.Item label="姓名">{detailRecord.real_name}</Descriptions.Item>
            <Descriptions.Item label="异常事件ID">{detailRecord.exception_event_id}</Descriptions.Item>
            <Descriptions.Item label="关联异常类型">{detailRecord.exception_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="申诉描述">{detailRecord.description}</Descriptions.Item>
            <Descriptions.Item label="证据链接">
              {(detailRecord.evidence_urls_parsed || []).length > 0 ? (
                <Space direction="vertical">
                  {detailRecord.evidence_urls_parsed.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  ))}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={(statusMap[detailRecord.status] || {}).color || 'default'}>
                {(statusMap[detailRecord.status] || {}).text || detailRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="处理结果">{detailRecord.result || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailRecord.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={resultStatus === 'resolved' ? '通过申诉' : '驳回申诉'}
        open={resultOpen}
        onOk={handleResultOk}
        onCancel={() => {
          setResultOpen(false)
          resultForm.resetFields()
          setResultRecord(null)
          setResultStatus(null)
        }}
        confirmLoading={resultLoading}
      >
        <Form form={resultForm} layout="vertical" preserve={false}>
          <Form.Item
            name="result"
            label="处理结果"
            rules={[{ required: true, message: '请输入处理结果' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入处理结果说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
