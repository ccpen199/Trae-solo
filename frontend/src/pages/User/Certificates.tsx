import React, { useState, useEffect } from 'react'
import { 
  Card, List, Tag, Button, Modal, Form, Input, Select, message, 
  Space, Typography, Descriptions, Empty, QRCode
} from 'antd'
import { 
  IdcardOutlined, PlusOutlined, EyeOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ExclamationCircleOutlined, QrcodeOutlined 
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import dayjs from 'dayjs'
import type { Certificate } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

const CertificatesPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoggedIn, user, certificates, setCertificates, addCertificate } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentCert, setCurrentCert] = useState<Certificate | null>(null)
  const [qrModal, setQrModal] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (isLoggedIn && certificates.length === 0) {
      loadCertificates()
    }
  }, [isLoggedIn])

  const loadCertificates = async () => {
    setLoading(true)
    try {
      const mockCerts: Certificate[] = [
        {
          id: '1',
          userId: user?.id || '',
          type: 'id_card',
          typeName: '居民身份证',
          name: user?.name || '张三',
          number: '3204**********1234',
          issuer: '常州市公安局',
          issueDate: dayjs().subtract(5, 'year').format('YYYY-MM-DD'),
          expiryDate: dayjs().add(15, 'year').format('YYYY-MM-DD'),
          status: 'valid',
          isVerified: true,
          createdAt: dayjs().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss'),
          verifyRecords: [
            {
              id: '1',
              certificateId: '1',
              operator: '常州市公安局',
              action: 'verify',
              description: '证照信息核验通过',
              createdAt: dayjs().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: '2',
          userId: user?.id || '',
          type: 'driver_license',
          typeName: '机动车驾驶证',
          name: user?.name || '张三',
          number: '3204**********5678',
          issuer: '常州市公安局交通警察支队',
          issueDate: dayjs().subtract(8, 'year').format('YYYY-MM-DD'),
          expiryDate: dayjs().add(2, 'year').format('YYYY-MM-DD'),
          status: 'valid',
          isVerified: true,
          createdAt: dayjs().subtract(10, 'month').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(10, 'month').format('YYYY-MM-DD HH:mm:ss'),
          verifyRecords: [
            {
              id: '1',
              certificateId: '2',
              operator: '常州市公安局交通警察支队',
              action: 'verify',
              description: '证照信息核验通过',
              createdAt: dayjs().subtract(10, 'month').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: '3',
          userId: user?.id || '',
          type: 'social_security',
          typeName: '社会保障卡',
          name: user?.name || '张三',
          number: 'A12345678',
          issuer: '常州市人力资源和社会保障局',
          issueDate: dayjs().subtract(3, 'year').format('YYYY-MM-DD'),
          expiryDate: dayjs().add(17, 'year').format('YYYY-MM-DD'),
          status: 'valid',
          isVerified: true,
          createdAt: dayjs().subtract(8, 'month').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(8, 'month').format('YYYY-MM-DD HH:mm:ss'),
          verifyRecords: [
            {
              id: '1',
              certificateId: '3',
              operator: '常州市人力资源和社会保障局',
              action: 'verify',
              description: '证照信息核验通过',
              createdAt: dayjs().subtract(8, 'month').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: '4',
          userId: user?.id || '',
          type: 'real_estate',
          typeName: '不动产权证书',
          name: user?.name || '张三',
          number: '苏(2023)常州市不动产权第XXXX号',
          issuer: '常州市自然资源和规划局',
          issueDate: dayjs().subtract(2, 'year').format('YYYY-MM-DD'),
          status: 'valid',
          isVerified: true,
          createdAt: dayjs().subtract(6, 'month').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(6, 'month').format('YYYY-MM-DD HH:mm:ss'),
          verifyRecords: [
            {
              id: '1',
              certificateId: '4',
              operator: '常州市自然资源和规划局',
              action: 'verify',
              description: '证照信息核验通过',
              createdAt: dayjs().subtract(6, 'month').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: '5',
          userId: user?.id || '',
          type: 'birth_certificate',
          typeName: '出生医学证明',
          name: '张小宝',
          number: 'M3204XXXXXX',
          issuer: '常州市妇幼保健院',
          issueDate: dayjs().subtract(2, 'year').format('YYYY-MM-DD'),
          status: 'valid',
          isVerified: true,
          createdAt: dayjs().subtract(4, 'month').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(4, 'month').format('YYYY-MM-DD HH:mm:ss'),
          verifyRecords: [
            {
              id: '1',
              certificateId: '5',
              operator: '常州市卫生健康委员会',
              action: 'verify',
              description: '证照信息核验通过',
              createdAt: dayjs().subtract(4, 'month').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: '6',
          userId: user?.id || '',
          type: 'marriage',
          typeName: '结婚证',
          name: user?.name || '张三',
          number: 'J3204XXXXXXXX',
          issuer: '常州市天宁区民政局',
          issueDate: dayjs().subtract(6, 'year').format('YYYY-MM-DD'),
          status: 'valid',
          isVerified: true,
          createdAt: dayjs().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss'),
          verifyRecords: [
            {
              id: '1',
              certificateId: '6',
              operator: '常州市天宁区民政局',
              action: 'verify',
              description: '证照信息核验通过',
              createdAt: dayjs().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        }
      ]
      setCertificates(mockCerts)
    } catch (error) {
      message.error('加载证照列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCert = async (values: any) => {
    try {
      const newCert: Certificate = {
        id: Date.now().toString(),
        userId: user?.id || '',
        type: values.type,
        typeName: getTypeName(values.type),
        name: values.name,
        number: values.number,
        issuer: values.issuer,
        issueDate: values.issueDate,
        expiryDate: values.expiryDate,
        status: 'pending',
        isVerified: false,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        verifyRecords: [
          {
            id: '1',
            certificateId: Date.now().toString(),
            operator: '系统',
            action: 'submit',
            description: '证照信息已提交，等待核验',
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
          }
        ]
      }
      addCertificate(newCert)
      setAddModal(false)
      form.resetFields()
      message.success('证照添加成功，等待核验！')
    } catch (error) {
      message.error('添加失败，请重试')
    }
  }

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      id_card: '居民身份证',
      driver_license: '机动车驾驶证',
      social_security: '社会保障卡',
      real_estate: '不动产权证书',
      birth_certificate: '出生医学证明',
      marriage: '结婚证',
      education: '学历证书',
      other: '其他证照'
    }
    return typeMap[type] || '其他证照'
  }

  const getStatusTag = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>已核验</Tag>
    }
    const statusMap: Record<string, { color: string; text: string }> = {
      valid: { color: 'green', text: '有效' },
      pending: { color: 'warning', text: '核验中' },
      expired: { color: 'red', text: '已过期' },
      invalid: { color: 'error', text: '无效' }
    }
    const info = statusMap[status] || statusMap.valid
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getTypeIcon = (type: string) => {
    return <IdcardOutlined style={{ fontSize: 32, color: '#1890ff' }} />
  }

  const viewDetail = (cert: Certificate) => {
    setCurrentCert(cert)
    setDetailModal(true)
  }

  const showQRCode = (cert: Certificate) => {
    setCurrentCert(cert)
    setQrModal(true)
  }

  if (!isLoggedIn) {
    navigate('/login')
    return null
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        className="card-shadow"
        title={
          <Space>
            <IdcardOutlined />
            <span>我的证照</span>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              共 {certificates.length} 张证照
            </Text>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
            添加证照
          </Button>
        }
      >
        {certificates.length === 0 && !loading ? (
          <Empty description="暂无证照，点击上方按钮添加" />
        ) : (
          <List
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
            dataSource={certificates}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  hoverable 
                  className="hover-card"
                  onClick={() => viewDetail(item)}
                  style={{ height: '100%' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.typeName}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      {item.number.slice(0, 6)}****{item.number.slice(-4)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                      {getStatusTag(item.status, item.isVerified)}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Space size="small">
                        <Button 
                          size="small" 
                          icon={<EyeOutlined />} 
                          onClick={(e) => { e.stopPropagation(); viewDetail(item); }}
                        >
                          查看
                        </Button>
                        {item.isVerified && (
                          <Button 
                            size="small" 
                            icon={<QrcodeOutlined />} 
                            type="primary"
                            onClick={(e) => { e.stopPropagation(); showQRCode(item); }}
                          >
                            亮证
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="添加证照"
        open={addModal}
        onCancel={() => setAddModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCert}
        >
          <Form.Item
            name="type"
            label="证照类型"
            rules={[{ required: true, message: '请选择证照类型' }]}
          >
            <Select placeholder="请选择证照类型">
              <Option value="id_card">居民身份证</Option>
              <Option value="driver_license">机动车驾驶证</Option>
              <Option value="social_security">社会保障卡</Option>
              <Option value="real_estate">不动产权证书</Option>
              <Option value="birth_certificate">出生医学证明</Option>
              <Option value="marriage">结婚证</Option>
              <Option value="education">学历证书</Option>
              <Option value="other">其他证照</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="持证人姓名"
            rules={[{ required: true, message: '请输入持证人姓名' }]}
          >
            <Input placeholder="请输入持证人姓名" />
          </Form.Item>

          <Form.Item
            name="number"
            label="证照编号"
            rules={[{ required: true, message: '请输入证照编号' }]}
          >
            <Input placeholder="请输入完整的证照编号" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="issuer"
              label="签发机关"
              rules={[{ required: true, message: '请输入签发机关' }]}
            >
              <Input placeholder="请输入签发机关" />
            </Form.Item>
            <Form.Item
              name="issueDate"
              label="签发日期"
              rules={[{ required: true, message: '请输入签发日期' }]}
            >
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </div>

          <Form.Item
            name="expiryDate"
            label="有效期至（选填）"
          >
            <Input placeholder="YYYY-MM-DD，长期有效可留空" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAddModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="证照详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {currentCert && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentCert.typeName}</Title>
              {getStatusTag(currentCert.status, currentCert.isVerified)}
            </Space>

            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="持证人">{currentCert.name}</Descriptions.Item>
              <Descriptions.Item label="证照编号">{currentCert.number}</Descriptions.Item>
              <Descriptions.Item label="签发机关">{currentCert.issuer}</Descriptions.Item>
              <Descriptions.Item label="签发日期">{currentCert.issueDate}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{currentCert.expiryDate || '长期有效'}</Descriptions.Item>
              <Descriptions.Item label="添加时间">{currentCert.createdAt}</Descriptions.Item>
            </Descriptions>

            {currentCert.verifyRecords && currentCert.verifyRecords.length > 0 && (
              <Card size="small" title="核验记录">
                <List
                  size="small"
                  dataSource={currentCert.verifyRecords}
                  renderItem={(log) => (
                    <List.Item>
                      <List.Item.Meta
                        title={log.description}
                        description={`${log.operator} · ${log.createdAt}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {currentCert.isVerified && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  icon={<QrcodeOutlined />} 
                  size="large"
                  onClick={() => showQRCode(currentCert)}
                >
                  出示电子证照
                </Button>
              </div>
            )}

            {!currentCert.isVerified && (
              <div style={{ marginTop: 16, textAlign: 'center', color: '#faad14' }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                该证照正在核验中，请耐心等待...
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="电子证照"
        open={qrModal}
        onCancel={() => setQrModal(false)}
        footer={null}
        width={400}
        centered
      >
        {currentCert && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>{currentCert.typeName}</Text>
            </div>
            <div style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
              <QRCode
                value={`cert://${currentCert.id}?t=${Date.now()}`}
                size={200}
                level="H"
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">持证人：</Text>
              <Text strong>{currentCert.name}</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">证照编号：</Text>
              <Text>{currentCert.number.slice(0, 6)}****{currentCert.number.slice(-4)}</Text>
            </div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 16 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              该二维码5分钟内有效，请及时使用
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CertificatesPage
