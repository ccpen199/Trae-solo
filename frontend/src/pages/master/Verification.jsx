import React, { useState, useEffect } from 'react'
import { 
  Form, Input, Button, Card, Typography, message, Upload, Tag, Space, 
  Descriptions, Progress, Statistic, Row, Col, Divider, Alert, Modal
} from 'antd'
import { 
  UploadOutlined, ScanOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined, ClockCircleOutlined, CheckCircleOutlined, 
  AlertOutlined, UserOutlined, FileTextOutlined
} from '@ant-design/icons'
import { masterApi } from '../../utils/api'

const { Title, Paragraph, Text } = Typography

const statusMap = {
  unsubmitted: { text: '未提交', color: 'default' },
  pending: { text: '审核中', color: 'processing' },
  approved: { text: '已通过', color: 'success' },
  rejected: { text: '已拒绝', color: 'error' }
}

const certTypes = [
  { label: '电工证', value: 'electrician' },
  { label: '焊工证', value: 'welder' },
  { label: '高空作业证', value: 'high_altitude' },
  { label: '空调制冷证', value: 'refrigeration' },
  { label: '水暖工证', value: 'plumbing' },
  { label: '家政服务证', value: 'housekeeping' }
]

const Verification = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [verification, setVerification] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrModal, setOcrModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [verifData, profileData] = await Promise.all([
        masterApi.getVerification(),
        masterApi.getProfile()
      ])
      setVerification(verifData)
      setProfile(profileData)
      if (verifData.status !== 'unsubmitted') {
        form.setFieldsValue(verifData)
      }
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const simulateOCR = async (type) => {
    setScanning(true)
    setOcrModal(true)
    setOcrResult(null)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockResults = {
      id_card: {
        name: '张师傅',
        idCard: '310101198501011234',
        gender: '男',
        birth: '1985-01-01',
        address: '上海市浦东新区张江高科技园区'
      },
      certificate: {
        certName: '特种作业操作证（电工）',
        certNumber: 'T310101198501011234',
        issueDate: '2020-06-15',
        validDate: '2026-06-14',
        issueAuthority: '上海市应急管理局'
      }
    }
    
    setOcrResult(mockResults[type])
    setScanning(false)
    
    if (type === 'id_card' && mockResults[type]) {
      form.setFieldsValue({
        real_name: mockResults[type].name,
        id_card: mockResults[type].idCard
      })
    }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await masterApi.submitVerification(values)
      message.success('认证信息已提交，正在等待审核')
      loadData()
    } catch (error) {
      message.error(error.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  const isEditable = !verification || verification.status === 'unsubmitted' || verification.status === 'rejected'

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>实名认证与能力画像</Title>

      {profile && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="综合评分" 
                  value={profile.avg_rating || 0} 
                  precision={1}
                  prefix={<SafetyCertificateOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress percent={(profile.avg_rating || 0) * 20} status="success" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="响应速度" 
                  value={profile.response_speed || '95%'} 
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress percent={parseInt(profile.response_speed || 95)} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="准时完工率" 
                  value={profile.on_time_rate || '92%'} 
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
                <Progress percent={parseInt(profile.on_time_rate || 92)} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="投诉率" 
                  value={profile.complaint_rate || '1.2%'} 
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: profile.complaint_rate > 5 ? '#f5222d' : '#fa8c16' }}
                />
                <Progress percent={100 - parseFloat(profile.complaint_rate || 1.2) * 10} status="active" />
              </Card>
            </Col>
          </Row>

          <Card title="服务历史沉淀" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Space direction="vertical">
                  <Text strong><FileTextOutlined /> 累计服务订单</Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {profile.total_orders || 0} 单
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical">
                  <Text strong><CheckCircleOutlined /> 客户好评</Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {profile.good_reviews || 0} 条
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical">
                  <Text strong><AlertOutlined /> 返工记录</Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                    {profile.rework_count || 0} 次
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </>
      )}
      
      {verification && verification.status !== 'unsubmitted' && (
        <Card style={{ marginBottom: 24 }}>
          <Space>
            <span>当前认证状态：</span>
            <Tag color={statusMap[verification.status]?.color}>
              {statusMap[verification.status]?.text}
            </Tag>
          </Space>
          {verification.status === 'pending' && (
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              您的认证信息正在审核中，请耐心等待，通常1-2个工作日完成审核
            </Paragraph>
          )}
          {verification.status === 'rejected' && (
            <Alert 
              type="error" 
              message="认证未通过" 
              description={verification.reject_reason || '请检查您的信息后重新提交'}
              style={{ marginTop: 8 }}
            />
          )}
        </Card>
      )}

      <Card title="实名认证 - 基本信息" style={{ marginBottom: 24, maxWidth: 900 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!isEditable}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="real_name"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入您的真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="id_card"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确' }
                ]}
              >
                <Input placeholder="请输入18位身份证号码" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">人脸核验</Divider>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="人脸照片">
                <Upload 
                  listType="picture-card" 
                  beforeUpload={() => false} 
                  maxCount={1}
                  accept="image/*"
                >
                  <div>
                    <UserOutlined style={{ fontSize: 24 }} />
                    <div style={{ marginTop: 8 }}>上传人脸照片</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Card 
                size="small" 
                title="人脸识别说明"
                type="inner"
              >
                <Paragraph style={{ fontSize: 13 }}>
                  请上传清晰的正面免冠照片，光线充足，五官清晰可见。
                  系统将进行人脸活体检测，确保为本人持证上岗。
                </Paragraph>
                <Alert 
                  type="info" 
                  showIcon
                  message="人脸数据仅用于实名认证核验，严格保护隐私"
                  style={{ fontSize: 12 }}
                />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">身份证OCR识别</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="身份证正面">
                <Upload 
                  listType="picture" 
                  beforeUpload={(file) => {
                    const reader = new FileReader()
                    reader.onload = () => simulateOCR('id_card')
                    reader.readAsDataURL(file)
                    return false
                  }} 
                  maxCount={1}
                  accept="image/*"
                >
                  <Button icon={<ScanOutlined />}>点击上传并OCR识别</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="身份证反面">
                <Upload listType="picture" beforeUpload={() => false} maxCount={1} accept="image/*">
                  <Button icon={<UploadOutlined />}>上传身份证反面</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">技能证书认证</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="certificate_type" label="证书类型">
                <Input.Select placeholder="请选择证书类型" options={certTypes} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certificate_number" label="证书编号">
                <Input placeholder="OCR识别后自动填充" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="技能证书照片">
                <Upload 
                  listType="picture" 
                  beforeUpload={(file) => {
                    const reader = new FileReader()
                    reader.onload = () => simulateOCR('certificate')
                    reader.readAsDataURL(file)
                    return false
                  }} 
                  multiple
                  accept="image/*"
                >
                  <Button icon={<ScanOutlined />}>上传证书并OCR识别</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="skills" label="技能特长描述">
                <Input.TextArea 
                  rows={4} 
                  placeholder="请详细描述您的技能特长、从业年限、服务区域等，例如：5年空调维修经验，可服务浦东新区全区域，精通格力、美的、海尔等品牌空调的加氟、清洗、故障排查和维修"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="service_area" label="服务区域">
            <Input placeholder="例如：上海市浦东新区、黄浦区、静安区" />
          </Form.Item>

          {isEditable && (
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  提交认证申请
                </Button>
                <Button onClick={loadData} size="large">
                  重置
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Card>

      {verification && verification.status === 'approved' && (
        <Card title="认证详情" style={{ maxWidth: 900 }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="真实姓名">{verification.real_name}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{verification.id_card}</Descriptions.Item>
            <Descriptions.Item label="证书类型">
              {certTypes.find(c => c.value === verification.certificate_type)?.label || verification.certificate_type}
            </Descriptions.Item>
            <Descriptions.Item label="证书编号">{verification.certificate_number}</Descriptions.Item>
            <Descriptions.Item label="技能特长">{verification.skills}</Descriptions.Item>
            <Descriptions.Item label="服务区域">{verification.service_area}</Descriptions.Item>
            <Descriptions.Item label="认证时间">{verification.verified_at}</Descriptions.Item>
            <Descriptions.Item label="认证状态">
              <Tag color="success">已通过</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Modal
        title={<><ScanOutlined /> OCR识别中</>}
        open={ocrModal}
        onCancel={() => setOcrModal(false)}
        footer={[
          <Button key="close" onClick={() => setOcrModal(false)}>
            {ocrResult ? '确认' : '取消'}
          </Button>
        ]}
        width={500}
      >
        {scanning ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ScanOutlined style={{ fontSize: 48, color: '#1890ff', animation: 'spin 1s linear infinite' }} />
            <Paragraph style={{ marginTop: 16 }}>正在进行OCR识别，请稍候...</Paragraph>
          </div>
        ) : ocrResult ? (
          <>
            <Alert 
              type="success" 
              message="识别成功" 
              description="以下是识别到的信息，已自动填充到表单"
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={1}>
              {Object.entries(ocrResult).map(([key, value]) => (
                <Descriptions.Item key={key} label={{
                  name: '姓名',
                  idCard: '身份证号',
                  gender: '性别',
                  birth: '出生日期',
                  address: '地址',
                  certName: '证书名称',
                  certNumber: '证书编号',
                  issueDate: '发证日期',
                  validDate: '有效期至',
                  issueAuthority: '发证机关'
                }[key] || key}>
                  {value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </>
        ) : null}
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Verification
