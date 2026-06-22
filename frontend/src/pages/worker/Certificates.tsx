import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  List,
  Avatar,
  Badge,
  message,
  Spin,
  Alert,
  Descriptions,
  Tooltip,
  Popconfirm,
  Empty,
} from 'antd'
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  UploadOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import workerApi, { type AddCertificateParams } from '../../api/worker'
import type { Certificate, UploadFile } from 'antd'

const { Title, Text } = Typography
const { Option } = Select

const CERT_TYPES = [
  { value: '电工证', label: '特种作业操作证（电工）' },
  { value: '焊工证', label: '特种作业操作证（焊工）' },
  { value: '架子工证', label: '特种作业操作证（架子工）' },
  { value: '高空作业证', label: '高处作业操作证' },
  { value: '职业资格证', label: '国家职业资格证书' },
  { value: '技能等级证', label: '职业技能等级证书' },
  { value: '健康证', label: '从业人员健康证明' },
  { value: '培训证', label: '安全培训合格证书' },
  { value: '其他', label: '其他证书' },
]

function Certificates() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [faceModalOpen, setFaceModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null)
  const [addLoading, setAddLoading] = useState(false)
  const [faceLoading, setFaceLoading] = useState(false)
  const [form] = Form.useForm<AddCertificateParams & { certificate_type: string }>()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const mockCertificates: Certificate[] = [
    {
      id: 1,
      worker_id: 1,
      certificate_name: '特种作业操作证（电工）',
      certificate_no: '京1101052020001234',
      issuing_authority: '北京市应急管理局',
      issue_date: dayjs('2021-06-15').format('YYYY-MM-DD'),
      expiry_date: dayjs('2027-06-14').format('YYYY-MM-DD'),
      certificate_image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E7%94%B5%E5%B7%A5%E8%AF%81%E4%B9%A6%E6%89%AB%E6%8F%8F%E4%BB%B6&image_size=square',
      verified: 1,
      verified_by: 100,
      verified_at: dayjs('2021-06-20').format('YYYY-MM-DD HH:mm:ss'),
      created_at: dayjs('2021-06-15').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs('2021-06-20').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 2,
      worker_id: 1,
      certificate_name: '国家职业资格（高级电工）',
      certificate_no: '202111010500008888',
      issuing_authority: '人力资源和社会保障部',
      issue_date: dayjs('2022-03-10').format('YYYY-MM-DD'),
      expiry_date: undefined,
      certificate_image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E8%81%8C%E4%B8%9A%E8%B5%84%E6%A0%BC%E8%AF%81%E4%B9%A6&image_size=square',
      verified: 1,
      verified_by: 100,
      verified_at: dayjs('2022-03-15').format('YYYY-MM-DD HH:mm:ss'),
      created_at: dayjs('2022-03-10').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs('2022-03-15').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 3,
      worker_id: 1,
      certificate_name: '高处作业操作证',
      certificate_no: '京1101052023005678',
      issuing_authority: '北京市应急管理局',
      issue_date: dayjs('2023-08-20').format('YYYY-MM-DD'),
      expiry_date: dayjs('2026-08-19').format('YYYY-MM-DD'),
      certificate_image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%AB%98%E7%A9%BA%E4%BD%9C%E4%B8%9A%E8%AF%81%E4%B9%A6&image_size=square',
      verified: 0,
      created_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 4,
      worker_id: 1,
      certificate_name: '从业人员健康证明',
      certificate_no: 'BJJK20260012345',
      issuing_authority: '朝阳区疾控中心',
      issue_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
      expiry_date: dayjs().add(350, 'day').format('YYYY-MM-DD'),
      certificate_image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%81%A5%E5%BA%B7%E8%AF%81%E6%98%8E%E4%B9%A6&image_size=square',
      verified: 1,
      verified_by: 101,
      verified_at: dayjs().subtract(12, 'day').format('YYYY-MM-DD HH:mm:ss'),
      created_at: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(12, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      setCertificates(mockCertificates)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = async () => {
    if (!user?.face_verified) {
      Modal.warning({
        title: '请先完成人脸识别验证',
        content: '上传技能证书前需先完成人脸识别验证，请先完成身份验证。',
        okText: '去验证',
        onOk: () => setFaceModalOpen(true),
      })
      return
    }
    try {
      const values = await form.validateFields()
      setAddLoading(true)
      const params: AddCertificateParams = {
        certificate_name: values.certificate_name,
        certificate_no: values.certificate_no,
        issuing_authority: values.issuing_authority,
        issue_date: values.issue_date ? dayjs(values.issue_date).format('YYYY-MM-DD') : '',
        expiry_date: values.expiry_date ? dayjs(values.expiry_date).format('YYYY-MM-DD') : undefined,
        certificate_image_url: fileList[0]?.url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%8A%80%E8%83%BD%E8%AF%81%E4%B9%A6&image_size=square',
      }
      const newCert: Certificate = {
        id: Date.now(),
        worker_id: 1,
        ...params,
        verified: 0,
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
      setCertificates((prev) => [newCert, ...prev])
      message.success('证书已提交，等待平台审核（通常1-3个工作日）')
      setAddModalOpen(false)
      form.resetFields()
      setFileList([])
    } catch {
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setCertificates((prev) => prev.filter((c) => c.id !== id))
      message.success('证书已删除')
    } catch {
      message.error('删除失败')
    }
  }

  const handleFaceVerify = () => {
    setFaceLoading(true)
    setTimeout(() => {
      setFaceLoading(false)
      message.success('人脸识别验证通过！')
      setFaceModalOpen(false)
    }, 2000)
  }

  const previewCertificate = (cert: Certificate) => {
    setPreviewCert(cert)
    setPreviewModalOpen(true)
  }

  const stats = {
    total: certificates.length,
    verified: certificates.filter((c) => c.verified).length,
    pending: certificates.filter((c) => !c.verified).length,
    expiring: certificates.filter(
      (c) => c.expiry_date && dayjs(c.expiry_date).diff(dayjs(), 'month') <= 3 && dayjs(c.expiry_date).isAfter(dayjs())
    ).length,
  }

  const getStatusBadge = (cert: Certificate) => {
    if (cert.expiry_date && dayjs(cert.expiry_date).isBefore(dayjs())) {
      return <Tag color="red" icon={<ExclamationCircleOutlined />}>已过期</Tag>
    }
    if (!cert.verified) {
      return <Tag color="gold" icon={<ClockCircleOutlined />}>审核中</Tag>
    }
    if (cert.expiry_date && dayjs(cert.expiry_date).diff(dayjs(), 'month') <= 3) {
      return <Tag color="orange" icon={<WarningOutlined />}>即将过期</Tag>
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag>
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {!user?.face_verified && (
        <Alert
          type="warning"
          showIcon
          icon={<ScanOutlined />}
          message="未完成人脸识别验证"
          description={
            <Space>
              <span>请先完成人脸识别验证，以确保您的身份与证书信息一致，提高可信度和接单成功率。</span>
              <Button type="primary" size="small" onClick={() => setFaceModalOpen(true)}>
                <ScanOutlined /> 立即验证
              </Button>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 12 }}
          action={
            <Tooltip title="人脸识别是验证您身份真实性的必要步骤，已验证工人的申请通过率高出30%">
              <Button type="text" icon={<InfoCircleOutlined />} style={{ color: '#1677ff' }}>
                为什么需要验证
              </Button>
            </Tooltip>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#e6f4ff' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>证书总数</Text>}
              value={stats.total}
              suffix="本"
              prefix={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#f6ffed' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>已认证</Text>}
              value={stats.verified}
              suffix="本"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#389e0d', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#fffbe6' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>审核中</Text>}
              value={stats.pending}
              suffix="本"
              prefix={<ClockCircleOutlined style={{ color: '#d48806' }} />}
              valueStyle={{ color: '#d48806', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#fff7e6' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 12 }}>3月内过期</Text>}
              value={stats.expiring}
              suffix="本"
              prefix={<WarningOutlined style={{ color: '#d46b08' }} />}
              valueStyle={{ color: '#d46b08', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            我的技能证书
          </Space>
        </Title>
        <Space size={12}>
          {!user?.face_verified && (
            <Button
              type="primary"
              danger
              icon={<ScanOutlined />}
              onClick={() => setFaceModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)', border: 'none' }}
            >
              立即人脸识别验证
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              if (!user?.face_verified) {
                setFaceModalOpen(true)
              } else {
                setAddModalOpen(true)
              }
            }}
          >
            上传新证书
          </Button>
        </Space>
      </div>

      {certificates.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty
            image={<SafetyCertificateOutlined style={{ fontSize: 72, color: '#d9d9d9' }} />}
            description={<Text type="secondary">还没有上传任何证书，上传证书可提高申请通过率和日薪水平</Text>}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              上传第一本证书
            </Button>
          </Empty>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={certificates}
          renderItem={(cert) => (
            <List.Item>
              <Card
                hoverable
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ padding: 16 }}
                cover={
                  <div
                    style={{
                      height: 160,
                      background: `linear-gradient(135deg, #1677ff22 0%, #69b1ff22 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => previewCertificate(cert)}
                  >
                    <Badge.Ribbon
                      text={cert.verified ? '已认证' : '审核中'}
                      color={cert.verified ? '#52c41a' : '#faad14'}
                      style={{ position: 'absolute', top: 12, right: -2 }}
                    >
                      <div />
                    </Badge.Ribbon>
                    {cert.certificate_image_url ? (
                      <img
                        src={cert.certificate_image_url}
                        alt={cert.certificate_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#1677ff' }}>
                        <FileImageOutlined style={{ fontSize: 48, opacity: 0.6 }} />
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>点击查看</div>
                      </div>
                    )}
                  </div>
                }
                actions={[
                  <Button type="text" icon={<EyeOutlined />} onClick={() => previewCertificate(cert)} key="view">
                    查看
                  </Button>,
                  <Popconfirm
                    title="确认删除该证书？"
                    description="删除后不可恢复，如证书仍在有效期内建议保留"
                    onConfirm={() => handleDelete(cert.id)}
                    okText="确认删除"
                    cancelText="取消"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} key="delete">
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text strong style={{ fontSize: 14, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cert.certificate_name}
                    </Text>
                    {getStatusBadge(cert)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <InfoCircleOutlined />
                    编号：{cert.certificate_no}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    签发：{cert.issuing_authority}
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Space size={4} style={{ color: '#8c8c8c' }}>
                      <CalendarOutlined />
                      <span>签发：{dayjs(cert.issue_date).format('YYYY/MM')}</span>
                    </Space>
                    {cert.expiry_date && (
                      <Space size={4} style={{ color: dayjs(cert.expiry_date).diff(dayjs(), 'month') <= 3 ? '#fa8c16' : '#8c8c8c' }}>
                        <ClockCircleOutlined />
                        <span>有效期至：{dayjs(cert.expiry_date).format('YYYY/MM')}</span>
                      </Space>
                    )}
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>上传技能证书</span>
          </Space>
        }
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false)
          form.resetFields()
          setFileList([])
        }}
        onOk={handleAdd}
        confirmLoading={addLoading}
        okText="提交审核"
        cancelText="取消"
        width={560}
      >
        <Alert
          type="info"
          showIcon
          message="审核说明"
          description="证书提交后，平台将在1-3个工作日内完成人工审核。审核通过后证书将标记为「已认证」，可提升您的申请通过率。"
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
        <Form
          form={form}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="certificate_type"
            label="证书类型"
            rules={[{ required: true, message: '请选择证书类型' }]}
          >
            <Select placeholder="请选择证书类型" onChange={(v) => {
              const found = CERT_TYPES.find((c) => c.value === v)
              if (found && !form.getFieldValue('certificate_name')) {
                form.setFieldsValue({ certificate_name: found.label })
              }
            }}>
              {CERT_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>{t.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="certificate_name"
            label="证书名称"
            rules={[{ required: true, message: '请输入证书名称' }]}
          >
            <Input placeholder="请输入证书上的完整名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="certificate_no"
                label="证书编号"
                rules={[{ required: true, message: '请输入证书编号' }]}
              >
                <Input placeholder="请输入证书编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="issuing_authority"
                label="签发机构"
                rules={[{ required: true, message: '请输入签发机构' }]}
              >
                <Input placeholder="如：北京市应急管理局" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issue_date"
                label="签发日期"
                rules={[{ required: true, message: '请选择签发日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择签发日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiry_date" label="有效期至（选填）">
                <DatePicker style={{ width: '100%' }} placeholder="无有效期可不填" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="证书图片（建议上传清晰的正反面扫描件或照片）"
            required
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/')
                if (!isImage) {
                  message.error('只能上传图片格式')
                }
                const isLt5M = file.size / 1024 / 1024 < 5
                if (!isLt5M) {
                  message.error('图片不能大于 5MB')
                }
                setFileList([{
                  uid: '-1',
                  name: file.name,
                  status: 'done',
                  url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%8A%80%E8%83%BD%E8%AF%81%E4%B9%A6%E5%9B%BE%E7%89%87&image_size=square',
                }])
                return false
              }}
              onRemove={() => setFileList([])}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8, fontSize: 12 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ScanOutlined style={{ color: '#1677ff' }} />
            <span>人脸识别验证</span>
          </Space>
        }
        open={faceModalOpen}
        onCancel={() => setFaceModalOpen(false)}
        onOk={handleFaceVerify}
        confirmLoading={faceLoading}
        okText="开始验证"
        cancelText="稍后再验证"
        width={480}
      >
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="验证说明"
            description="请将面部正对摄像头，保持光线充足，摘掉帽子、口罩、墨镜等遮挡物。整个过程约需10秒。"
            style={{ borderRadius: 8 }}
          />
          <div
            style={{
              width: '100%',
              aspectRatio: '4/3',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 180,
                height: 220,
                border: '3px dashed rgba(255,255,255,0.6)',
                borderRadius: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                position: 'relative',
              }}
            >
              <Avatar
                size={120}
                style={{ background: 'rgba(255,255,255,0.2)', fontSize: 56 }}
                icon={<ScanOutlined />}
              />
              {faceLoading && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'linear-gradient(90deg, transparent, #fff, transparent)',
                    animation: 'scanline 1.5s linear infinite',
                    top: 0,
                  }}
                />
              )}
            </div>
            <Text strong style={{ color: '#fff', fontSize: 16 }}>
              {faceLoading ? '正在识别中，请稍候...' : '请将面部置于虚线框内'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
              {faceLoading ? '正在比对身份信息...' : '点击"开始验证"启动摄像头'}
            </Text>
          </div>
          <Alert
            type="success"
            showIcon
            message="隐私安全保障"
            description="您的人脸数据仅用于身份验证，加密存储，绝不外泄，符合《个人信息保护法》要求。"
            style={{ borderRadius: 8 }}
          />
        </Space>
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1677ff' }} />
            <span>证书详情</span>
            {previewCert && getStatusBadge(previewCert)}
          </Space>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={640}
      >
        {previewCert && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div
              style={{
                height: 300,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #f0f0f0',
                background: '#fafafa',
              }}
            >
              {previewCert.certificate_image_url ? (
                <img
                  src={previewCert.certificate_image_url}
                  alt={previewCert.certificate_name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
                  <FileImageOutlined style={{ fontSize: 64 }} />
                </div>
              )}
            </div>

            <Card size="small" style={{ borderRadius: 8 }}>
              <Descriptions column={1} size="small" labelStyle={{ width: 120, color: '#8c8c8c' }}>
                <Descriptions.Item label="证书名称">
                  <Text strong>{previewCert.certificate_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="证书编号">{previewCert.certificate_no}</Descriptions.Item>
                <Descriptions.Item label="签发机构">{previewCert.issuing_authority}</Descriptions.Item>
                <Descriptions.Item label="签发日期">
                  {dayjs(previewCert.issue_date).format('YYYY年MM月DD日')}
                </Descriptions.Item>
                <Descriptions.Item label="有效期">
                  {previewCert.expiry_date
                    ? dayjs(previewCert.expiry_date).format('YYYY年MM月DD日')
                    : '长期有效'}
                  {previewCert.expiry_date && dayjs(previewCert.expiry_date).diff(dayjs(), 'month') <= 3 && (
                    <Tag color="warning" style={{ marginLeft: 8 }}>
                      {dayjs(previewCert.expiry_date).diff(dayjs(), 'day')}天后过期
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="审核状态">
                  {previewCert.verified ? (
                    <Space>
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        已通过
                      </Tag>
                      {previewCert.verified_at && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          审核时间：{dayjs(previewCert.verified_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      )}
                    </Space>
                  ) : (
                    <Tag color="gold" icon={<ClockCircleOutlined />}>
                      审核中，预计1-3个工作日
                    </Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {previewCert.verified && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="该证书已通过平台认证"
                description="认证证书可提升用工需求申请通过率，部分企业对特定证书有硬性要求。"
                style={{ borderRadius: 8 }}
              />
            )}
          </Space>
        )}
      </Modal>

      <style>{`
        @keyframes scanline {
          0% { top: 0; }
          100% { top: calc(100% - 3px); }
        }
      `}</style>
    </div>
  )
}

export default Certificates
