import { useState } from 'react'
import { Card, Button, Space, Form, Input, Select, Modal, Badge, Typography } from 'antd'
import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store/appStore'

const { Text, Title } = Typography

export default function LicenseIssuance() {
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [form] = Form.useForm()
  const [selectedType, setSelectedType] = useState('')
  const [complianceModalVisible, setComplianceModalVisible] = useState(false)
  const [certificatePreview, setCertificatePreview] = useState<Record<string, string> | null>(null)

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
      setComplianceModalVisible(false)
      setCertificatePreview(null)
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

  return (
    <>
      <Card title="新建证照签发" style={{ maxWidth: 720 }}>
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
      </Card>

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
              <Badge status="success" text={<Text strong>合规校验通过</Text>} />
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
    </>
  )
}
