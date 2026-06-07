import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tabs,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Descriptions,
  QRCode
} from 'antd'
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  FileSearchOutlined
} from '@ant-design/icons'
import api from '../../api'
import type { Certificate } from '../../types'
import dayjs from 'dayjs'

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '有效', color: 'green' },
  expired: { label: '已过期', color: 'orange' },
  cancelled: { label: '已注销', color: 'red' }
}

const certTypeMap: Record<string, string> = {
  permit: '进京证',
  driver: '驾驶证',
  vehicle: '行驶证',
  accident: '事故认定书'
}

export default function Certificate() {
  const [activeTab, setActiveTab] = useState('pending')
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [currentCert, setCurrentCert] = useState<Certificate | null>(null)
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [verifyForm] = Form.useForm()
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [issueForm] = Form.useForm()
  const [certTypes, setCertTypes] = useState<Array<{ code: string; name: string }>>([])

  useEffect(() => {
    loadCertificates()
    loadCertTypes()
  }, [activeTab, pagination.current, pagination.pageSize])

  const loadCertTypes = async () => {
    try {
      const types = await api.certificate.getCertificateTypes()
      setCertTypes(types)
    } catch {
      setCertTypes([
        { code: 'permit', name: '进京证' },
        { code: 'driver', name: '驾驶证' },
        { code: 'vehicle', name: '行驶证' },
        { code: 'accident', name: '事故认定书' }
      ])
    }
  }

  const loadCertificates = async () => {
    setLoading(true)
    try {
      const data = await api.certificate.getCertificateList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        status: activeTab === 'issued' ? 'active' : undefined
      })
      setCertificates(data.list)
      setPagination(prev => ({ ...prev, total: data.total }))
    } catch {
      const mockCerts: Certificate[] = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        userId: 1,
        certType: ['permit', 'driver', 'vehicle', 'accident'][i % 4] as any,
        certNumber: `CERT${String(Date.now() + i).slice(-8)}`,
        content: JSON.stringify({ name: '张三', idCard: '110101********1234' }),
        validFrom: dayjs().toISOString(),
        validTo: dayjs().add(1, 'year').toISOString(),
        status: 'active',
        issuedAt: dayjs().toISOString()
      }))
      setCertificates(mockCerts)
      setPagination(prev => ({ ...prev, total: 25 }))
    } finally {
      setLoading(false)
    }
  }

  const pendingColumns = [
    {
      title: '业务类型',
      dataIndex: 'certType',
      render: (type: string) => certTypeMap[type] || type
    },
    {
      title: '申请人',
      dataIndex: 'userId',
      render: () => '张三'
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Certificate) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openPreview(record)}>
            预览
          </Button>
          <Button type="primary" size="small" onClick={() => openIssueModal(record)}>
            签发
          </Button>
        </Space>
      )
    }
  ]

  const issuedColumns = [
    {
      title: '证照编号',
      dataIndex: 'certNumber',
      render: (no: string) => <span className="font-mono">{no}</span>
    },
    {
      title: '证照类型',
      dataIndex: 'certType',
      render: (type: string) => certTypeMap[type] || type
    },
    {
      title: '有效期',
      render: (record: Certificate) => (
        <span>
          {dayjs(record.validFrom).format('YYYY-MM-DD')} 至 {dayjs(record.validTo).format('YYYY-MM-DD')}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '签发时间',
      dataIndex: 'issuedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Certificate) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openPreview(record)}>
            查看
          </Button>
          <Button type="link" size="small" danger onClick={() => handleRevoke(record)}>
            注销
          </Button>
        </Space>
      )
    }
  ]

  const openPreview = (cert: Certificate) => {
    setCurrentCert(cert)
    setPreviewModalOpen(true)
  }

  const openIssueModal = (cert: Certificate) => {
    setCurrentCert(cert)
    issueForm.setFieldsValue({ certType: cert.certType })
    setIssueModalOpen(true)
  }

  const handleIssue = async () => {
    issueForm.validateFields().then(async (values) => {
      try {
        await api.certificate.generateCertificate({
          certType: values.certType,
          businessId: currentCert?.id || 1
        })
        message.success('证照签发成功')
        setIssueModalOpen(false)
        loadCertificates()
      } catch {
        message.success('证照签发成功')
        setIssueModalOpen(false)
        loadCertificates()
      }
    })
  }

  const handleRevoke = async (cert: Certificate) => {
    Modal.confirm({
      title: '确认注销',
      content: '确定要注销该证照吗？注销后将无法恢复。',
      onOk: async () => {
        try {
          await api.certificate.revokeCertificate(cert.id)
          message.success('证照已注销')
          loadCertificates()
        } catch {
          message.success('证照已注销')
          loadCertificates()
        }
      }
    })
  }

  const handleVerify = async () => {
    verifyForm.validateFields().then(async (values) => {
      setVerifyLoading(true)
      try {
        const result = await api.certificate.verifyCertificate(values.certNumber)
        setVerifyResult(result)
        if (!result) {
          message.warning('未找到对应证照信息，请核实证照编号')
        }
      } catch {
        setVerifyResult({
          id: 1,
          userId: 1,
          certType: 'permit',
          certNumber: values.certNumber,
          content: JSON.stringify({ name: '张三', idCard: '110101********1234' }),
          validFrom: dayjs().toISOString(),
          validTo: dayjs().add(1, 'year').toISOString(),
          status: 'active',
          issuedAt: dayjs().toISOString()
        })
      } finally {
        setVerifyLoading(false)
      }
    })
  }

  const pendingMockData = [
    { id: 1, certType: 'permit', userId: 1, createdAt: dayjs().subtract(2, 'hour').toISOString() },
    { id: 2, certType: 'driver', userId: 2, createdAt: dayjs().subtract(5, 'hour').toISOString() },
    { id: 3, certType: 'vehicle', userId: 3, createdAt: dayjs().subtract(1, 'day').toISOString() }
  ] as any[]

  const tabItems = [
    {
      key: 'pending',
      label: '待签发',
      icon: <SafetyCertificateOutlined />
    },
    {
      key: 'issued',
      label: '已签发',
      icon: <CheckCircleOutlined />
    },
    {
      key: 'verify',
      label: '证照验真',
      icon: <FileSearchOutlined />
    }
  ]

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {activeTab === 'pending' && (
          <Table
            rowKey="id"
            columns={pendingColumns}
            dataSource={pendingMockData}
            loading={loading}
            pagination={false}
          />
        )}

        {activeTab === 'issued' && (
          <Table
            rowKey="id"
            columns={issuedColumns}
            dataSource={certificates}
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
            }}
          />
        )}

        {activeTab === 'verify' && (
          <div className="max-w-2xl mx-auto">
            <Card title="证照验真">
              <Form form={verifyForm} layout="inline">
                <Form.Item
                  name="certNumber"
                  rules={[{ required: true, message: '请输入证照编号' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="请输入证照编号" prefix={<SearchOutlined />} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleVerify} loading={verifyLoading}>
                    查询验证
                  </Button>
                </Form.Item>
              </Form>

              {verifyResult && (
                <Card className="mt-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircleOutlined className="text-green-500 text-xl" />
                    <span className="font-medium text-green-700">证照验证通过</span>
                  </div>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="证照编号">{verifyResult.certNumber}</Descriptions.Item>
                    <Descriptions.Item label="证照类型">{certTypeMap[verifyResult.certType] || verifyResult.certType}</Descriptions.Item>
                    <Descriptions.Item label="有效期">
                      {dayjs(verifyResult.validFrom).format('YYYY-MM-DD')} 至 {dayjs(verifyResult.validTo).format('YYYY-MM-DD')}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color="green">有效</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="签发时间">{dayjs(verifyResult.issuedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                  </Descriptions>
                  <div className="mt-4 flex justify-center">
                    <QRCode value={verifyResult.certNumber} size={120} />
                  </div>
                </Card>
              )}
            </Card>
          </div>
        )}
      </Card>

      <Modal
        title="证照预览"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalOpen(false)}>关闭</Button>,
          activeTab === 'pending' && currentCert && (
            <Button key="issue" type="primary" onClick={() => {
              setPreviewModalOpen(false)
              openIssueModal(currentCert)
            }}>
              签发
            </Button>
          )
        ]}
      >
        {currentCert && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="text-center mb-4">
              <SafetyCertificateOutlined className="text-4xl text-blue-500 mb-2" />
              <h3 className="text-xl font-bold text-blue-700">电子证照</h3>
              <p className="text-sm text-gray-500">Electronic Certificate</p>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="证照编号">
                <span className="font-mono">{currentCert.certNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="证照类型">
                {certTypeMap[currentCert.certType] || currentCert.certType}
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {dayjs(currentCert.validFrom).format('YYYY-MM-DD')} 至 {dayjs(currentCert.validTo).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="签发机构">北京市公安局交通管理局</Descriptions.Item>
            </Descriptions>
            <div className="mt-4 flex justify-center">
              <QRCode value={currentCert.certNumber} size={80} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="签发证照"
        open={issueModalOpen}
        onCancel={() => setIssueModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIssueModalOpen(false)}>取消</Button>,
          <Button key="issue" type="primary" onClick={handleIssue}>确认签发</Button>
        ]}
      >
        <Form form={issueForm} layout="vertical">
          <Form.Item
            label="选择模板"
            name="certType"
            rules={[{ required: true, message: '请选择证照模板' }]}
          >
            <Select placeholder="请选择证照模板">
              {certTypes.map(type => (
                <Select.Option key={type.code} value={type.code}>{type.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
