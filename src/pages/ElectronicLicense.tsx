import { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
} from 'antd'
import {
  PlusOutlined,
  FolderOpenOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'
import { LicenseManagement, LicenseIssuance, CrossDomainSharing } from './license'

const { Title, Text } = Typography

export default function ElectronicLicense() {
  const [messageApi, contextHolder] = message.useMessage()
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [issueModalVisible, setIssueModalVisible] = useState(false)
  const [complianceModalVisible, setComplianceModalVisible] = useState(false)
  const [certificatePreview, setCertificatePreview] = useState<Record<string, string> | null>(null)
  const [form] = Form.useForm()
  const [selectedType, setSelectedType] = useState('')

  const handleComplianceCheck = () => {
    form.validateFields().then((values: Record<string, string>) => {
      addAuditEntry({
        operator: '管理员',
        module: '电子证照库',
        action: '合规校验',
        detail: `证照签发合规校验：类型=${values.certificateType}，持证人=${values.holderName || values.enterpriseName || values.rightHolder}`,
        result: 'success',
        ip: '10.0.1.100',
      })
      setCertificatePreview(values)
      setComplianceModalVisible(true)
    })
  }

  const handleConfirmIssue = () => {
    if (certificatePreview) {
      addAuditEntry({
        operator: '管理员',
        module: '电子证照库',
        action: '证照签发确认',
        detail: `确认签发证照：类型=${certificatePreview.certificateType}`,
        result: 'success',
        ip: '10.0.1.100',
      })
      messageApi.success('证照签发成功')
      setComplianceModalVisible(false)
      setCertificatePreview(null)
      setIssueModalVisible(false)
      form.resetFields()
      setSelectedType('')
    }
  }

  const renderDynamicFields = () => {
    if (selectedType === '身份证') {
      return (
        <>
          <Form.Item name="holderName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select options={[{ value: '男' }, { value: '女' }]} />
          </Form.Item>
          <Form.Item name="ethnicity" label="民族" rules={[{ required: true, message: '请输入民族' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="birthDate" label="出生日期" rules={[{ required: true, message: '请输入出生日期' }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="address" label="住址" rules={[{ required: true, message: '请输入住址' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="idNumber" label="公民身份号码" rules={[{ required: true, message: '请输入公民身份号码' }]}>
            <Input maxLength={18} />
          </Form.Item>
        </>
      )
    }
    if (selectedType === '营业执照') {
      return (
        <>
          <Form.Item name="creditCode" label="统一社会信用代码" rules={[{ required: true, message: '请输入统一社会信用代码' }]}>
            <Input maxLength={18} />
          </Form.Item>
          <Form.Item name="enterpriseName" label="企业名称" rules={[{ required: true, message: '请输入企业名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="enterpriseType" label="类型" rules={[{ required: true, message: '请输入类型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="registeredCapital" label="注册资本" rules={[{ required: true, message: '请输入注册资本' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="legalRep" label="法定代表人" rules={[{ required: true, message: '请输入法定代表人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="establishDate" label="成立日期" rules={[{ required: true, message: '请输入成立日期' }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="businessTerm" label="营业期限" rules={[{ required: true, message: '请输入营业期限' }]}>
            <Input />
          </Form.Item>
        </>
      )
    }
    if (selectedType === '不动产权证') {
      return (
        <>
          <Form.Item name="rightHolder" label="权利人" rules={[{ required: true, message: '请输入权利人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="propertyUnitNo" label="不动产单元号" rules={[{ required: true, message: '请输入不动产单元号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rightType" label="权利类型" rules={[{ required: true, message: '请输入权利类型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="坐落" rules={[{ required: true, message: '请输入坐落' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="area" label="面积" rules={[{ required: true, message: '请输入面积' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="useTerm" label="使用期限" rules={[{ required: true, message: '请输入使用期限' }]}>
            <Input />
          </Form.Item>
        </>
      )
    }
    return null
  }

  const tabItems = [
    {
      key: 'management',
      label: '证照管理',
      icon: <FolderOpenOutlined />,
      children: <LicenseManagement onOpenIssuance={() => setIssueModalVisible(true)} />,
    },
    {
      key: 'issuance',
      label: '证照签发',
      icon: <PlusOutlined />,
      children: <LicenseIssuance />,
    },
    {
      key: 'sharing',
      label: '跨域共享',
      icon: <ShareAltOutlined />,
      children: <CrossDomainSharing />,
    },
  ]

  return (
    <div className="page-container">
      {contextHolder}
      <div className="module-header">
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            <FolderOpenOutlined style={{ marginRight: 8 }} />
            电子证照库
          </Title>
          <Tag color="green" className="compliance-tag">等保三级</Tag>
          <Tag color="purple" className="compliance-tag">商密评估</Tag>
          <Tag color="blue" className="compliance-tag">国密算法</Tag>
        </Space>
        <Space>
          <Tooltip title="合规校验">
            <Button icon={<SafetyCertificateOutlined />}>合规校验</Button>
          </Tooltip>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="证照总量"
              value={8562341}
              valueStyle={{ color: '#c41d7f' }}
              prefix={<FolderOpenOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本日签发"
              value={2347}
              valueStyle={{ color: '#52c41a' }}
              prefix={<PlusOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="跨域共享"
              value={1205}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ShareAltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="验证次数"
              value={15892}
              valueStyle={{ color: '#faad14' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="证照签发"
        open={issueModalVisible}
        onCancel={() => { setIssueModalVisible(false); form.resetFields(); setSelectedType('') }}
        footer={null}
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed: Record<string, string>) => {
            if ('certificateType' in changed) {
              setSelectedType(changed.certificateType)
            }
          }}
        >
          <Form.Item name="certificateType" label="证照类型" rules={[{ required: true, message: '请选择证照类型' }]}>
            <Select placeholder="请选择证照类型" style={{ width: '100%' }}>
              <Select.Option value="身份证">身份证</Select.Option>
              <Select.Option value="营业执照">营业执照</Select.Option>
              <Select.Option value="不动产权证">不动产权证</Select.Option>
            </Select>
          </Form.Item>
          {renderDynamicFields()}
          {selectedType && (
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleComplianceCheck}>
                  合规校验并预览
                </Button>
                <Button onClick={() => { form.resetFields(); setSelectedType('') }}>重置</Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="合规校验结果"
        open={complianceModalVisible}
        onCancel={() => { setComplianceModalVisible(false); setCertificatePreview(null) }}
        onOk={handleConfirmIssue}
        okText="确认签发"
        cancelText="取消"
        width={640}
      >
        {certificatePreview && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag color="success">合规校验通过</Tag>
              <br />
              <Text type="secondary">所有字段均符合国家标准及行业规范要求</Text>
            </div>
            <Title level={5}>证照数据预览（JSON）</Title>
            <pre style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 6,
              fontSize: 13,
              maxHeight: 320,
              overflow: 'auto',
            }}>
              {JSON.stringify(certificatePreview, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  )
}
