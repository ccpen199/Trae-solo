import { useState, useEffect } from 'react'
import {
  Table,
  Tag,
  Progress,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Spin,
  Alert,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { api } from '@/api'
import type { Employer } from '@/types'

const { Option } = Select

interface EmployerListItem extends Omit<Employer, 'companyName' | 'legalPerson' | 'businessLicense' | 'qualificationLevel' | 'contactName' | 'contactPhone' | 'creditRating'> {
  company_name: string
  legal_person: string
  business_license: string
  qualification_level: string
  contact_name: string
  contact_phone: string
  credit_rating: number
}

export default function Employers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employers, setEmployers] = useState<EmployerListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [verified, setVerified] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchEmployers()
  }, [page, keyword, verified])

  const fetchEmployers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (verified !== null) params.verified = verified

      const res = await api.getEmployers(params)
      if (res.code === 0) {
        setEmployers(res.data.list)
        setTotal(res.data.total)
      } else {
        setError(res.message || '获取雇主列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleVerifiedChange = (value: string | null) => {
    setVerified(value)
    setPage(1)
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await api.createEmployer(values)
      if (res.code === 0) {
        message.success('新增雇主成功')
        setModalVisible(false)
        fetchEmployers()
      } else {
        message.error(res.message || '新增失败')
      }
    } catch (err: any) {
      if (err.errorFields) {
        return
      }
      message.error(err.message || '提交失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '公司名称',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '法人',
      dataIndex: 'legal_person',
      key: 'legal_person',
      width: 100,
    },
    {
      title: '资质等级',
      dataIndex: 'qualification_level',
      key: 'qualification_level',
      width: 100,
    },
    {
      title: '联系人',
      dataIndex: 'contact_name',
      key: 'contact_name',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 130,
    },
    {
      title: '信用评分',
      dataIndex: 'credit_rating',
      key: 'credit_rating',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '是否认证',
      dataIndex: 'verified',
      key: 'verified',
      width: 100,
      render: (verified: boolean) => (
        <Tag color={verified ? 'success' : 'default'}>
          {verified ? '已认证' : '未认证'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>雇主管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增雇主
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            placeholder="选择认证状态"
            allowClear
            style={{ width: '100%' }}
            value={verified}
            onChange={handleVerifiedChange}
          >
            <Option value="true">已认证</Option>
            <Option value="false">未认证</Option>
          </Select>
        </Col>
        <Col span={16}>
          <Input.Search
            placeholder="搜索公司名称、联系人、联系电话"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

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
          dataSource={employers}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Spin>

      <Modal
        title="新增雇主"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="companyName"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="legalPerson"
                label="法人"
              >
                <Input placeholder="请输入法人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="businessLicense"
                label="营业执照号"
              >
                <Input placeholder="请输入营业执照号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="qualificationLevel"
                label="资质等级"
              >
                <Select placeholder="请选择资质等级">
                  <Option value="特级">特级</Option>
                  <Option value="一级">一级</Option>
                  <Option value="二级">二级</Option>
                  <Option value="三级">三级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactName"
                label="联系人"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入联系电话" maxLength={11} />
          </Form.Item>
          <Form.Item
            name="address"
            label="公司地址"
          >
            <Input placeholder="请输入公司地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
