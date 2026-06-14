import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Form,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Descriptions,
  Space,
} from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { api } from '@/api'
import type { Contract, JobRequirement, Worker, Employer, ContractTemplate } from '@/types'

const { Option } = Select

interface ContractListItem extends Omit<Contract, 'workerId' | 'employerId' | 'jobId' | 'workerSignedAt' | 'employerSignedAt' | 'templateId' | 'contractNumber' | 'startDate' | 'endDate' | 'dailyWage' | 'totalAmount' | 'createdAt'> {
  worker_id: number
  employer_id: number
  job_id: number
  worker_name: string
  employer_name: string
  project_name: string
  trade_name: string
  worker_signed_at?: string
  employer_signed_at?: string
  template_id: number
  contract_number: string
  start_date: string
  end_date: string
  daily_wage: number
  total_amount: number
  created_at: string
  content: string
}

export default function Contracts() {
  const [searchParams] = useSearchParams()
  const isMyView = searchParams.get('filter') === 'my'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contracts, setContracts] = useState<ContractListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [jobId, setJobId] = useState<number | null>(null)
  const [workerId, setWorkerId] = useState<number | null>(null)
  const [employerId, setEmployerId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedContract, setSelectedContract] = useState<ContractListItem | null>(null)
  const [jobs, setJobs] = useState<JobRequirement[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    fetchJobs()
    fetchWorkers()
    fetchEmployers()
    fetchTemplates()
  }, [])

  useEffect(() => {
    fetchContracts()
  }, [page, jobId, workerId, employerId, status])

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs({ pageSize: 100 })
      if (res.code === 0) {
        setJobs(res.data.list || [])
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
  }

  const fetchWorkers = async () => {
    try {
      const res = await api.getWorkers({ pageSize: 100 })
      if (res.code === 0) {
        setWorkers(res.data.list || [])
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err)
    }
  }

  const fetchEmployers = async () => {
    try {
      const res = await api.getEmployers({ pageSize: 100 })
      if (res.code === 0) {
        setEmployers(res.data.list || [])
      }
    } catch (err) {
      console.error('Failed to fetch employers:', err)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await api.getContractTemplates()
      if (res.code === 0) {
        setTemplates(res.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  const fetchContracts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, pageSize }
      if (jobId) params.jobId = jobId
      if (workerId) params.workerId = workerId
      if (employerId) params.employerId = employerId
      if (status) params.status = status

      const res = await api.getContracts(params)
      if (res.code === 0) {
        setContracts(res.data.list || [])
        setTotal(res.data.total || 0)
      } else {
        setError(res.message || '获取合同列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleResetFilters = () => {
    setJobId(null)
    setWorkerId(null)
    setEmployerId(null)
    setStatus(null)
    setPage(1)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await api.createContract(values)
      if (res.code === 0) {
        message.success('创建合同成功')
        setModalVisible(false)
        fetchContracts()
      } else {
        message.error(res.message || '创建失败')
      }
    } catch (err: any) {
      if (err.errorFields) return
      message.error(err.message || '提交失败')
    }
  }

  const handleViewDetail = (record: ContractListItem) => {
    setSelectedContract(record)
    setDetailVisible(true)
  }

  const handleSign = async (id: number, signerType: 'worker' | 'employer') => {
    try {
      const res = await api.signContract(id, signerType)
      if (res.code === 0) {
        message.success(`${signerType === 'worker' ? '工人' : '雇主'}签署成功`)
        fetchContracts()
      } else {
        message.error(res.message || '签署失败')
      }
    } catch (err: any) {
      message.error(err.message || '签署失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    signed_by_worker: { color: 'blue', text: '工人已签' },
    signed_by_employer: { color: 'orange', text: '雇主已签' },
    fully_signed: { color: 'green', text: '已签署' },
    completed: { color: 'cyan', text: '已完成' },
    terminated: { color: 'red', text: '已终止' },
  }

  const getSignedTime = (record: ContractListItem) => {
    if (record.status === 'fully_signed' || record.status === 'completed') {
      return record.employer_signed_at || record.worker_signed_at || '-'
    }
    if (record.status === 'signed_by_worker') {
      return record.worker_signed_at || '-'
    }
    if (record.status === 'signed_by_employer') {
      return record.employer_signed_at || '-'
    }
    return '-'
  }

  const columns = [
    { title: '合同编号', dataIndex: 'contract_number', key: 'contract_number', width: 180 },
    { title: '甲方', dataIndex: 'employer_name', key: 'employer_name', width: 150, ellipsis: true },
    { title: '乙方', dataIndex: 'worker_name', key: 'worker_name', width: 100 },
    { title: '工种', dataIndex: 'trade_name', key: 'trade_name', width: 100 },
    { title: '日薪', dataIndex: 'daily_wage', key: 'daily_wage', width: 100, render: (val: number) => `¥${val}` },
    { title: '总额', dataIndex: 'total_amount', key: 'total_amount', width: 120, render: (val: number) => `¥${val.toLocaleString()}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => {
        const info = statusMap[s] || statusMap.draft
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    { title: '签署时间', dataIndex: 'signed_time', key: 'signed_time', width: 180, render: (_: unknown, record: ContractListItem) => getSignedTime(record) },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: ContractListItem) => (
        <>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看详情
          </Button>
          {record.status === 'draft' || record.status === 'signed_by_employer' ? (
            <Button type="link" icon={<EditOutlined />} onClick={() => handleSign(record.id, 'worker')}>
              工人签署
            </Button>
          ) : null}
          {record.status === 'draft' || record.status === 'signed_by_worker' ? (
            <Button type="link" icon={<EditOutlined />} onClick={() => handleSign(record.id, 'employer')}>
              雇主签署
            </Button>
          ) : null}
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{isMyView ? '我的合同' : '合同管理'}</h2>
          {isMyView && (
            <span style={{ color: '#8c8c8c' }}>集中查看当前账号相关合同、签署状态和合同详情。</span>
          )}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建合同
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="选择招工"
            allowClear
            style={{ width: '100%' }}
            value={jobId}
            onChange={(v) => { setJobId(v); setPage(1) }}
            showSearch
            optionFilterProp="children"
          >
            {jobs.map(job => (
              <Option key={job.id} value={job.id}>{job.projectName}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择工人"
            allowClear
            style={{ width: '100%' }}
            value={workerId}
            onChange={(v) => { setWorkerId(v); setPage(1) }}
            showSearch
            optionFilterProp="children"
          >
            {workers.map(w => (
              <Option key={w.id} value={w.id}>{w.name}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择雇主"
            allowClear
            style={{ width: '100%' }}
            value={employerId}
            onChange={(v) => { setEmployerId(v); setPage(1) }}
            showSearch
            optionFilterProp="children"
          >
            {employers.map(e => (
              <Option key={e.id} value={e.id}>{e.companyName}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: '100%' }}
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
          >
            <Option value="draft">草稿</Option>
            <Option value="signed_by_worker">工人已签</Option>
            <Option value="signed_by_employer">雇主已签</Option>
            <Option value="fully_signed">已签署</Option>
            <Option value="completed">已完成</Option>
            <Option value="terminated">已终止</Option>
          </Select>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={handleResetFilters}>重置筛选</Button>
        {isMyView && <Tag color="blue">我的合同</Tag>}
        {status && <Tag color="orange">状态：{statusMap[status]?.text || status}</Tag>}
      </Space>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          scroll={{ x: 1400 }}
          onRow={(record) => ({
            onClick: () => handleViewDetail(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Spin>

      <Modal
        title="创建合同"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="jobId"
                label="招工"
                rules={[{ required: true, message: '请选择招工' }]}
              >
                <Select placeholder="请选择招工" showSearch optionFilterProp="children">
                  {jobs.map(job => (
                    <Option key={job.id} value={job.id}>{job.projectName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="workerId"
                label="工人"
                rules={[{ required: true, message: '请选择工人' }]}
              >
                <Select placeholder="请选择工人" showSearch optionFilterProp="children">
                  {workers.map(w => (
                    <Option key={w.id} value={w.id}>{w.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employerId"
                label="雇主"
                rules={[{ required: true, message: '请选择雇主' }]}
              >
                <Select placeholder="请选择雇主" showSearch optionFilterProp="children">
                  {employers.map(e => (
                    <Option key={e.id} value={e.id}>{e.companyName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="templateId"
                label="模板"
                initialValue={1}
                rules={[{ required: true, message: '请选择模板' }]}
              >
                <Select placeholder="请选择模板">
                  {templates.map(t => (
                    <Option key={t.id} value={t.id}>{t.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="合同详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedContract && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="合同编号">{selectedContract.contract_number}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedContract.status]?.color}>
                {statusMap[selectedContract.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="甲方">{selectedContract.employer_name}</Descriptions.Item>
            <Descriptions.Item label="乙方">{selectedContract.worker_name}</Descriptions.Item>
            <Descriptions.Item label="项目名称">{selectedContract.project_name}</Descriptions.Item>
            <Descriptions.Item label="工种">{selectedContract.trade_name}</Descriptions.Item>
            <Descriptions.Item label="日薪">¥{selectedContract.daily_wage}</Descriptions.Item>
            <Descriptions.Item label="合同总额">¥{selectedContract.total_amount?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{selectedContract.start_date}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{selectedContract.end_date}</Descriptions.Item>
            <Descriptions.Item label="工人签署时间">{selectedContract.worker_signed_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="雇主签署时间">{selectedContract.employer_signed_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>{selectedContract.created_at}</Descriptions.Item>
            <Descriptions.Item label="合同内容" span={2}>
              <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {selectedContract.content}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
