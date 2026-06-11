import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Steps,
  Tabs,
  Row,
  Col,
  Statistic,
  Badge,
  Popconfirm,
  Timeline,
  message,
  Result,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  EditOutlined,
  AuditOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Title, Text } = Typography

interface SealRecord {
  id: string
  name: string
  type: '单位章' | '个人章' | '审批章'
  org: string
  createdAt: string
  validUntil: string
  status: '正常' | '已吊销' | '已过期'
}

const mockData: SealRecord[] = [
  { id: '1', name: '北京市政务服务专用章', type: '单位章', org: '北京市政务服务中心', createdAt: '2025-03-15', validUntil: '2028-03-14', status: '正常' },
  { id: '2', name: '上海市浦东新区审批章', type: '审批章', org: '上海市浦东新区行政审批局', createdAt: '2024-08-20', validUntil: '2026-06-01', status: '已吊销' },
  { id: '3', name: '广东省政务服务个人签章', type: '个人章', org: '广东省数字政府建设管理局', createdAt: '2025-01-10', validUntil: '2027-01-09', status: '正常' },
  { id: '4', name: '浙江省杭州市电子公章', type: '单位章', org: '杭州市行政审批服务管理办公室', createdAt: '2024-11-05', validUntil: '2025-11-04', status: '已过期' },
  { id: '5', name: '江苏省南京市审批专用章', type: '审批章', org: '南京市政务服务中心', createdAt: '2025-05-22', validUntil: '2028-05-21', status: '正常' },
  { id: '6', name: '四川省成都市证照签发章', type: '单位章', org: '成都市政务服务管理和网络理政办公室', createdAt: '2025-02-18', validUntil: '2027-02-17', status: '正常' },
]

const statusColorMap: Record<SealRecord['status'], string> = {
  正常: 'green',
  已吊销: 'red',
  已过期: 'orange',
}

export default function ElectronicSeal() {
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [stampModalOpen, setStampModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<SealRecord | null>(null)
  const [verifyResult, setVerifyResult] = useState<'valid' | 'invalid' | null>(null)
  const [stampStep, setStampStep] = useState(0)

  const [createForm] = Form.useForm()
  const [authForm] = Form.useForm()
  const [stampForm] = Form.useForm()
  const [verifyForm] = Form.useForm()
  const [revokeForm] = Form.useForm()

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      addAuditEntry({
        operator: '管理员',
        module: '电子印章管理',
        action: '制章申请',
        detail: `申请制作"${values.name}"（${values.type}）`,
        result: 'success',
        ip: '10.0.1.105',
      })
      message.success('制章申请已提交')
      setCreateModalOpen(false)
      createForm.resetFields()
    })
  }

  const handleAuth = () => {
    authForm.validateFields().then((values) => {
      addAuditEntry({
        operator: '管理员',
        module: '电子印章管理',
        action: '印章授权',
        detail: `授权"${currentRecord?.name}"予${values.department}，有效期至${values.expiry}`,
        result: 'success',
        ip: '10.0.1.105',
      })
      message.success('授权成功')
      setAuthModalOpen(false)
      authForm.resetFields()
    })
  }

  const handleStamp = () => {
    if (stampStep === 0) {
      setStampStep(1)
      return
    }
    addAuditEntry({
      operator: '管理员',
      module: '电子印章管理',
      action: '盖章操作',
      detail: `使用"${currentRecord?.name}"对文档${stampForm.getFieldValue('document')}盖章`,
      result: 'success',
      ip: '10.0.1.105',
    })
    message.success('盖章成功')
    setStampModalOpen(false)
    stampForm.resetFields()
    setStampStep(0)
  }

  const handleVerify = () => {
    verifyForm.validateFields().then(() => {
      const valid = Math.random() > 0.3
      setVerifyResult(valid ? 'valid' : 'invalid')
      addAuditEntry({
        operator: '管理员',
        module: '电子印章管理',
        action: '验章操作',
        detail: `验证印章编码${verifyForm.getFieldValue('sealCode')}，结果：${valid ? '有效' : '无效'}`,
        result: 'success',
        ip: '10.0.1.105',
      })
    })
  }

  const handleRevoke = () => {
    revokeForm.validateFields().then((values) => {
      addAuditEntry({
        operator: '管理员',
        module: '电子印章管理',
        action: '印章吊销',
        detail: `吊销"${currentRecord?.name}"（${values.reason}）`,
        result: 'success',
        ip: '10.0.1.105',
      })
      message.success('印章已吊销')
      setRevokeModalOpen(false)
      revokeForm.resetFields()
    })
  }

  const openModal = (type: string, record: SealRecord) => {
    setCurrentRecord(record)
    switch (type) {
      case 'auth': setAuthModalOpen(true); break
      case 'stamp': setStampModalOpen(true); setStampStep(0); break
      case 'verify': setVerifyModalOpen(true); setVerifyResult(null); break
      case 'revoke': setRevokeModalOpen(true); break
      case 'detail': setDetailModalOpen(true); break
    }
  }

  const columns = [
    { title: '印章名称', dataIndex: 'name', key: 'name', width: 220 },
    {
      title: '印章类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: SealRecord['type']) => {
        const colorMap: Record<string, string> = { 单位章: 'blue', 个人章: 'green', 审批章: 'purple' }
        return <Tag color={colorMap[type]}>{type}</Tag>
      },
    },
    { title: '所属机构', dataIndex: 'org', key: 'org', width: 240 },
    { title: '制作时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    { title: '有效期至', dataIndex: 'validUntil', key: 'validUntil', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: SealRecord['status']) => <Badge status={status === '正常' ? 'success' : status === '已吊销' ? 'error' : 'warning'} text={status} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: SealRecord) => (
        <Space size={4} wrap>
          {record.status === '正常' && (
            <>
              <Tooltip title="授权"><Button type="link" size="small" icon={<AuditOutlined />} onClick={() => openModal('auth', record)}>授权</Button></Tooltip>
              <Tooltip title="盖章"><Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => openModal('stamp', record)}>盖章</Button></Tooltip>
              <Tooltip title="验章"><Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openModal('verify', record)}>验章</Button></Tooltip>
              <Popconfirm title="确定要吊销该印章吗？" onConfirm={() => openModal('revoke', record)}>
                <Tooltip title="吊销"><Button type="link" size="small" danger icon={<StopOutlined />}>吊销</Button></Tooltip>
              </Popconfirm>
            </>
          )}
          {record.status === '已吊销' && (
            <Tooltip title="查看详情"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openModal('detail', record)}>查看详情</Button></Tooltip>
          )}
          {record.status === '已过期' && (
            <>
              <Tooltip title="验章"><Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openModal('verify', record)}>验章</Button></Tooltip>
              <Tooltip title="查看详情"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openModal('detail', record)}>查看详情</Button></Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]

  const lifecycleSteps = [
    { title: '制章', icon: <PlusOutlined /> },
    { title: '授权', icon: <AuditOutlined /> },
    { title: '盖章', icon: <SafetyOutlined /> },
    { title: '验章', icon: <CheckCircleOutlined /> },
    { title: '吊销', icon: <StopOutlined /> },
  ]

  return (
    <div className="page-container">
      <div className="module-header">
        <Space>
          <Title level={3} style={{ margin: 0 }}>电子印章全生命周期管理</Title>
          <Tag color="green" className="security-badge level3">等保三级</Tag>
          <Tag color="purple" className="security-badge">商密保护</Tag>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>制章申请</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="印章总数" value={3256} prefix={<SafetyOutlined />} valueStyle={{ color: '#c41d7f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="活跃印章" value={2891} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="待授权" value={43} prefix={<AuditOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="已吊销" value={322} prefix={<StopOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Steps current={1} items={lifecycleSteps.map((step) => ({ title: step.title, icon: step.icon }))} />
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="all"
          items={[
            { key: 'all', label: '全部印章' },
            { key: 'active', label: '正常' },
            { key: 'revoked', label: '已吊销' },
            { key: 'expired', label: '已过期' },
          ]}
        />
        <Table
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="制章申请"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields() }}
        width={560}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="印章名称" rules={[{ required: true, message: '请输入印章名称' }]}>
            <Input placeholder="请输入印章名称" />
          </Form.Item>
          <Form.Item name="type" label="印章类型" rules={[{ required: true, message: '请选择印章类型' }]}>
            <Select placeholder="请选择印章类型" options={[{ value: '单位章', label: '单位章' }, { value: '个人章', label: '个人章' }, { value: '审批章', label: '审批章' }]} />
          </Form.Item>
          <Form.Item name="org" label="所属机构" rules={[{ required: true, message: '请输入所属机构' }]}>
            <Input placeholder="请输入所属机构" />
          </Form.Item>
          <Form.Item name="purpose" label="印章用途" rules={[{ required: true, message: '请输入印章用途' }]}>
            <Input.TextArea rows={3} placeholder="请输入印章用途" />
          </Form.Item>
          <Form.Item name="validUntil" label="有效期" rules={[{ required: true, message: '请输入有效期' }]}>
            <Input placeholder="如：2028-12-31" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="印章授权"
        open={authModalOpen}
        onOk={handleAuth}
        onCancel={() => { setAuthModalOpen(false); authForm.resetFields() }}
        width={560}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="印章名称">{currentRecord.name}</Descriptions.Item>
            <Descriptions.Item label="印章类型"><Tag color="blue">{currentRecord.type}</Tag></Descriptions.Item>
          </Descriptions>
        )}
        <Form form={authForm} layout="vertical">
          <Form.Item name="department" label="授权部门/人员" rules={[{ required: true, message: '请选择授权对象' }]}>
            <Select
              mode="multiple"
              placeholder="请选择授权部门或人员"
              options={[
                { value: '行政审批科', label: '行政审批科' },
                { value: '综合服务窗口', label: '综合服务窗口' },
                { value: '证照管理科', label: '证照管理科' },
                { value: '数据共享科', label: '数据共享科' },
              ]}
            />
          </Form.Item>
          <Form.Item name="permission" label="授权权限" rules={[{ required: true, message: '请选择授权权限' }]}>
            <Select placeholder="请选择授权权限" options={[{ value: '盖章', label: '盖章' }, { value: '验章', label: '验章' }, { value: '盖章+验章', label: '盖章+验章' }]} />
          </Form.Item>
          <Form.Item name="expiry" label="授权有效期" rules={[{ required: true, message: '请输入授权有效期' }]}>
            <Input placeholder="如：2027-06-30" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="盖章操作"
        open={stampModalOpen}
        onOk={handleStamp}
        onCancel={() => { setStampModalOpen(false); stampForm.resetFields(); setStampStep(0) }}
        width={600}
        okText={stampStep === 0 ? '下一步' : '确认盖章'}
      >
        <Steps
          current={stampStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[{ title: '选择文档' }, { title: '确认盖章' }]}
        />
        {stampStep === 0 && (
          <Form form={stampForm} layout="vertical">
            <Form.Item name="document" label="选择文档" rules={[{ required: true, message: '请选择文档' }]}>
              <Select
                placeholder="请选择需要盖章的文档"
                options={[
                  { value: '行政许可证-2026-001', label: '行政许可证-2026-001' },
                  { value: '营业执照-91110000MA01XXXX', label: '营业执照-91110000MA01XXXX' },
                  { value: '不动产权证-沪(2026)浦东新区001号', label: '不动产权证-沪(2026)浦东新区001号' },
                ]}
              />
            </Form.Item>
          </Form>
        )}
        {stampStep === 1 && (
          <div style={{ textAlign: 'center' }}>
            <Text>文档：{stampForm.getFieldValue('document')}</Text>
            <div style={{ margin: '24px 0' }}>
              <div className="seal-visual" style={{ position: 'relative' }}>
                <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 11 }}>{currentRecord?.org?.slice(0, 6)}</div>
                  <div style={{ fontSize: 14 }}>{currentRecord?.name?.replace(/专用章|审批章|签章|公章/g, '')}</div>
                  <div style={{ fontSize: 10 }}>之印</div>
                </div>
              </div>
            </div>
            <Text type="warning">确认盖章后不可撤销，请确认文档内容无误</Text>
          </div>
        )}
      </Modal>

      <Modal
        title="验章操作"
        open={verifyModalOpen}
        onCancel={() => { setVerifyModalOpen(false); verifyForm.resetFields(); setVerifyResult(null) }}
        footer={verifyResult ? [<Button key="back" onClick={() => { setVerifyModalOpen(false); verifyForm.resetFields(); setVerifyResult(null) }}>关闭</Button>] : [
          <Button key="cancel" onClick={() => { setVerifyModalOpen(false); verifyForm.resetFields(); setVerifyResult(null) }}>取消</Button>,
          <Button key="verify" type="primary" onClick={handleVerify}>验章</Button>,
        ]}
        width={520}
      >
        {!verifyResult && (
          <Form form={verifyForm} layout="vertical">
            <Form.Item name="sealCode" label="印章编码" rules={[{ required: true, message: '请输入印章编码' }]}>
              <Input placeholder="请输入印章编码或上传文件验证" />
            </Form.Item>
          </Form>
        )}
        {verifyResult === 'valid' && (
          <Result
            status="success"
            title="验章通过"
            subTitle="该电子印章验证有效，签名完整，未被篡改"
            extra={[
              <Descriptions key="info" column={1} bordered size="small" style={{ marginTop: 16, textAlign: 'left' }}>
                <Descriptions.Item label="印章名称">{currentRecord?.name}</Descriptions.Item>
                <Descriptions.Item label="签章时间">2026-06-09 10:30:00</Descriptions.Item>
                <Descriptions.Item label="证书序列号">CN=GovCA-2026-0001</Descriptions.Item>
                <Descriptions.Item label="哈希算法">SHA-256</Descriptions.Item>
              </Descriptions>,
            ]}
          />
        )}
        {verifyResult === 'invalid' && (
          <Result
            status="error"
            title="验章失败"
            subTitle="该电子印章验证未通过，签名可能已被篡改或已过期"
          />
        )}
      </Modal>

      <Modal
        title="印章吊销"
        open={revokeModalOpen}
        onOk={handleRevoke}
        onCancel={() => { setRevokeModalOpen(false); revokeForm.resetFields() }}
        width={520}
      >
        {currentRecord && (
          <>
            <Result
              status="warning"
              title="吊销操作不可逆"
              subTitle={`即将吊销印章"${currentRecord.name}"，吊销后该印章将无法使用`}
            />
            <Form form={revokeForm} layout="vertical">
              <Form.Item name="reason" label="吊销原因" rules={[{ required: true, message: '请输入吊销原因' }]}>
                <Select
                  placeholder="请选择吊销原因"
                  options={[
                    { value: '有效期届满', label: '有效期届满' },
                    { value: '印章遗失', label: '印章遗失' },
                    { value: '机构变更', label: '机构变更' },
                    { value: '安全事件', label: '安全事件' },
                    { value: '其他原因', label: '其他原因' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="detail" label="详细说明">
                <Input.TextArea rows={3} placeholder="请输入详细说明" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title="印章详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={<Button onClick={() => setDetailModalOpen(false)}>关闭</Button>}
        width={640}
      >
        {currentRecord && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="印章名称">{currentRecord.name}</Descriptions.Item>
              <Descriptions.Item label="印章类型"><Tag color="blue">{currentRecord.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="所属机构">{currentRecord.org}</Descriptions.Item>
              <Descriptions.Item label="当前状态"><Badge status={statusColorMap[currentRecord.status] === 'green' ? 'success' : statusColorMap[currentRecord.status] === 'red' ? 'error' : 'warning'} text={currentRecord.status} /></Descriptions.Item>
              <Descriptions.Item label="制作时间">{currentRecord.createdAt}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{currentRecord.validUntil}</Descriptions.Item>
            </Descriptions>
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <div className="seal-visual">
                <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 11 }}>{currentRecord.org.slice(0, 6)}</div>
                  <div style={{ fontSize: 14 }}>{currentRecord.name.replace(/专用章|审批章|签章|公章/g, '')}</div>
                  <div style={{ fontSize: 10 }}>之印</div>
                </div>
              </div>
            </div>
            <Title level={5}>生命周期记录</Title>
            <Timeline
              items={[
                { color: 'green', children: '制章完成 — 系统自动生成密钥对，签发数字证书' },
                { color: 'green', children: '授权分配 — 授权至行政审批科，权限：盖章+验章' },
                { color: 'blue', children: '盖章操作 — 行政许可证-2026-001（共使用12次）' },
                { color: currentRecord.status === '已吊销' ? 'red' : 'gray', children: currentRecord.status === '已吊销' ? '印章吊销 — 有效期届满' : '正常使用中' },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
