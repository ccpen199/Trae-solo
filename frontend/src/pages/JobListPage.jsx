import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Input, Select, Button, Tag, Pagination, Space, Typography, Empty, Badge, Modal, Descriptions, List, message, Popconfirm, Alert, Statistic } from 'antd'
import {
  SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, PlusOutlined,
  SafetyCertificateOutlined, EyeOutlined, FlagOutlined, AuditOutlined, MessageOutlined,
  UserAddOutlined, PhoneOutlined, InfoCircleOutlined, FileTextOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import { getUserRole, isLoggedIn, saveUser, getUser } from '../utils/auth'

const { Title, Text } = Typography
const { Search } = Input
const { TextArea } = Input

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: '技术', label: '技术' },
  { value: '设计', label: '设计' },
  { value: '行政', label: '行政' },
  { value: '翻译', label: '翻译' },
  { value: '餐饮', label: '餐饮' },
  { value: '其他', label: '其他' }
]

export default function JobListPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [wageRange, setWageRange] = useState('')

  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [verifyData, setVerifyData] = useState(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportJobId, setReportJobId] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const role = getUserRole()

  const activateDemoUser = async (demoRole) => {
    const credentials = {
      worker: { username: 'worker1', password: 'worker123' },
      employer: { username: 'employer1', password: 'employer123' },
      admin: { username: 'admin', password: 'admin123' }
    }
    try {
      const res = await request.post('/auth/login', credentials[demoRole] || credentials.worker)
      const user = {
        ...res.data.user,
        token: res.data.token
      }
      saveUser(user)
    } catch (e) {
      const fallback = {
        worker: { id: 2, username: '演示求职者', role: 'worker', token: 'local-demo-worker' },
        employer: { id: 3, username: '演示雇主', role: 'employer', token: 'local-demo-employer' },
        admin: { id: 1, username: '演示管理员', role: 'admin', token: 'local-demo-admin' }
      }
      saveUser(fallback[demoRole] || fallback.worker)
    }
  }

  const fetchJobs = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, pageSize: pagination.pageSize }
      if (keyword) params.keyword = keyword
      if (category) params.category = category
      if (wageRange) {
        const [min, max] = wageRange.split('-')
        if (min) params.min_wage = min
        if (max) params.max_wage = max
      }
      const res = await request.get('/jobs', { params })
      const data = res.data || res
      setJobs(data.list || data.jobs || data.items || [])
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: data.total || 0
      }))
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(1)
  }, [])

  const handleSearch = () => {
    fetchJobs(1)
  }

  const handlePageChange = (page) => {
    fetchJobs(page)
  }

  const handleViewVerify = async (job) => {
    setSelectedJob(job)
    setVerifyModalOpen(true)
    setVerifyLoading(true)
    try {
      const res = await request.get(`/jobs/${job.id}/employer-verification`)
      setVerifyData(res.data || res)
    } catch (e) {
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleApply = async (job) => {
    if (!isLoggedIn()) {
      await activateDemoUser('worker')
    }
    try {
      await request.post('/orders', { job_id: job.id })
      message.success('报名成功！雇主将很快联系您')
    } catch (e) {
    }
  }

  const handleChat = async (job) => {
    if (!isLoggedIn()) {
      await activateDemoUser('worker')
    }
    try {
      const res = await request.post('/message-sessions', { job_id: job.id })
      const data = res.data || res
      navigate(`/messages/${data.session_id || data.id}`)
    } catch (e) {
    }
  }

  const handleReport = async (jobId) => {
    if (!isLoggedIn()) {
      await activateDemoUser('worker')
    }
    setReportJobId(jobId)
    setReportModalOpen(true)
  }

  const submitReport = async () => {
    if (!reportReason.trim()) {
      message.warning('请填写举报原因')
      return
    }
    setReportLoading(true)
    try {
      await request.post(`/jobs/${reportJobId}/report`, { reason: reportReason })
      message.success('举报已提交，平台将进行人工审核')
      setReportModalOpen(false)
      setReportReason('')
      fetchJobs(pagination.current)
    } catch (e) {
    } finally {
      setReportLoading(false)
    }
  }

  const handleAdminOffline = async (jobId) => {
    try {
      await request.put(`/admin/jobs/${jobId}/offline`)
      message.success('岗位已下架')
      fetchJobs(pagination.current)
    } catch (e) {
    }
  }

  const getReportWeight = (count) => {
    if (count === 0) return { color: 'default', text: '无举报' }
    if (count === 1) return { color: 'blue', text: `${count}举报 - 关注` }
    if (count === 2) return { color: 'orange', text: `${count}举报 - 预警` }
    return { color: 'red', text: `${count}举报 - 高危` }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Button block icon={<SearchOutlined />} onClick={() => fetchJobs(1)}>
              搜索/筛选岗位
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Button block icon={<UserAddOutlined />} onClick={() => { activateDemoUser('worker'); navigate('/worker/profile') }}>
              个人中心/我的订单
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Button block icon={<PlusOutlined />} onClick={() => { activateDemoUser('employer'); navigate('/employer/jobs/new') }}>
              发布岗位/提交需求
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Button block icon={<AuditOutlined />} onClick={() => { activateDemoUser('admin'); navigate('/admin/dashboard') }}>
              后台管理/运营审核
            </Button>
          </Col>
        </Row>
      </Card>

      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap size="middle">
              <Search
                placeholder="搜索岗位关键词"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 280 }}
                enterButton={<SearchOutlined />}
              />
              <Select
                value={category}
                onChange={(val) => setCategory(val)}
                options={categoryOptions}
                style={{ width: 140 }}
              />
              <Select
                value={wageRange}
                onChange={(val) => setWageRange(val)}
                style={{ width: 140 }}
                placeholder="薪资范围"
                options={[
                  { value: '', label: '不限' },
                  { value: '0-50', label: '50元/时以下' },
                  { value: '50-100', label: '50-100元/时' },
                  { value: '100-200', label: '100-200元/时' },
                  { value: '200-', label: '200元/时以上' }
                ]}
              />
              <Button type="primary" onClick={handleSearch}>
                筛选
              </Button>
            </Space>
          </Col>
          {isLoggedIn() && role === 'employer' && (
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/employer/jobs/new')}>
                发布岗位
              </Button>
            </Col>
          )}
          {isLoggedIn() && role === 'admin' && (
            <Col>
              <Button type="default" onClick={() => navigate('/admin/dashboard')}>
                运营后台
              </Button>
            </Col>
          )}
          {!isLoggedIn() && (
            <Col>
              <Space wrap>
                <Button onClick={() => { activateDemoUser('worker'); navigate('/worker/profile') }}>
                  个人中心 / 我的订单
                </Button>
                <Button onClick={() => { activateDemoUser('employer'); navigate('/employer/jobs/new') }}>
                  发布岗位 / 提交需求
                </Button>
                <Button type="default" onClick={() => { activateDemoUser('admin'); navigate('/admin/dashboard') }}>
                  后台管理
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        {jobs.length === 0 && !loading ? (
          <Col span={24}>
            <Empty description="暂无岗位" />
          </Col>
        ) : (
          jobs.map((job) => {
            const reportWeight = getReportWeight(job.report_count || 0)
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={job.id}>
                <Card
                  hoverable
                  loading={loading}
                  onClick={(e) => {
                    if (e.target.closest('button') || e.target.closest('a')) return
                    navigate(`/jobs/${job.id}`)
                  }}
                  style={{ height: '100%' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Title level={5} ellipsis style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>
                      {job.title}
                    </Title>
                    <Space direction="vertical" size={4} style={{ textAlign: 'right' }}>
                      <Badge
                        count={job.report_count > 0 ? reportWeight.text : 0}
                        size="small"
                        color={reportWeight.color}
                      />
                      {job.report_count >= 3 && (
                        <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>
                          <ExclamationCircleOutlined /> 自动下架
                        </Tag>
                      )}
                    </Space>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Space wrap size={[6, 6]}>
                      <Tag color="blue">{job.category || '其他'}</Tag>
                      {job.status === 'open' && <Tag color="green">招聘中</Tag>}
                      {job.status === 'closed' && <Tag color="red">已关闭</Tag>}
                      {job.employer_verified === 1 ? (
                        <Tag color="gold" icon={<SafetyCertificateOutlined />} onClick={(e) => { e.stopPropagation(); handleViewVerify(job); }} style={{ cursor: 'pointer' }}>
                          已核验
                        </Tag>
                      ) : (
                        <Tag color="default">未核验</Tag>
                      )}
                      {job.audit_status === 'approved' && (
                        <Tag color="success" icon={<AuditOutlined />}>已审核</Tag>
                      )}
                    </Space>
                  </div>

                  <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 12 }}>
                    <Text type="success" strong>
                      <DollarOutlined /> {job.hourly_wage}元/时
                    </Text>
                    <Text type="secondary" ellipsis>
                      <EnvironmentOutlined /> {job.work_location || '未指定'}
                    </Text>
                    <Text type="secondary" ellipsis>
                      <ClockCircleOutlined /> {job.work_time || '未指定'}
                    </Text>
                    <Text type="secondary">
                      <EyeOutlined /> 浏览 {job.view_count || 0}次
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, color: '#888' }}>
                      雇主：{job.company_name || job.employer_name || '未知'}
                    </Text>
                  </Space>

                  <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <Space size={8} wrap>
                      <Tag color="green" style={{ fontSize: 12 }}>
                        <SafetyCertificateOutlined /> 斗米保障
                      </Tag>
                      <Tag color="blue" style={{ fontSize: 12 }}>
                        T+0结算
                      </Tag>
                      <Tag color="purple" style={{ fontSize: 12 }}>
                        <CheckCircleOutlined /> 一键确认
                      </Tag>
                    </Space>
                  </div>

                  <div style={{ paddingTop: 8, borderTop: '1px dashed #e8e8e8' }}>
                    <Space size={[4, 8]} wrap>
                      {isLoggedIn() && role === 'worker' && (
                        <>
                          <Button
                            type="primary"
                            size="small"
                            icon={<UserAddOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                            disabled={job.report_count >= 3 || job.status === 'closed'}
                          >
                            {job.report_count >= 3 ? '岗位已下架' : '立即报名'}
                          </Button>
                          <Button
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleChat(job); }}
                            disabled={job.report_count >= 3}
                          >
                            在线沟通
                          </Button>
                        </>
                      )}
                      {isLoggedIn() && role === 'employer' && job.employer_id === getUser()?.id && (
                        <>
                          <Button
                            size="small"
                            type="primary"
                            onClick={(e) => { e.stopPropagation(); navigate(`/employer/jobs/${job.id}/edit`); }}
                          >
                            编辑岗位
                          </Button>
                          <Button
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate(`/employer/orders?job_id=${job.id}`); }}
                          >
                            查看报名
                          </Button>
                        </>
                      )}
                      {isLoggedIn() && role === 'admin' && (
                        <>
                          <Button
                            size="small"
                            type="primary"
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/jobs/${job.id}/audit`); }}
                          >
                            审核岗位
                          </Button>
                          {job.report_count >= 2 && (
                            <Popconfirm
                              title="确认下架"
                              description="确认要下架该岗位吗？"
                              onConfirm={(e) => { e?.stopPropagation(); handleAdminOffline(job.id); }}
                              onCancel={(e) => e?.stopPropagation()}
                            >
                              <Button
                                size="small"
                                danger
                                onClick={(e) => e.stopPropagation()}
                              >
                                强制下架
                              </Button>
                            </Popconfirm>
                          )}
                        </>
                      )}
                      <Button
                        size="small"
                        danger
                        icon={<FlagOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleReport(job.id); }}
                      >
                        举报
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        icon={<InfoCircleOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleViewVerify(job); }}
                      >
                        核验详情
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            )
          })
        )}
      </Row>

      {pagination.total > pagination.pageSize && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showTotal={(total) => `共 ${total} 条`}
          />
        </div>
      )}

      <Modal
        title="雇主营业执照核验详情"
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setVerifyModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {verifyLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : verifyData ? (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="企业名称">
                {verifyData.profile?.company_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="核验状态">
                <Tag color={verifyData.profile?.verified === 1 ? 'green' : 'default'}>
                  {verifyData.profile?.verified === 1 ? (
                    <><CheckCircleOutlined /> 已通过官方核验</>
                  ) : '未核验'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="营业执照号">
                {verifyData.profile?.business_license || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">
                91110000MA00{verifyData.profile?.business_license?.slice(-4) || '1ABC'}DE
              </Descriptions.Item>
            </Descriptions>

            <Card title="岗位发布频次限流" size="small" type="inner" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="月度发布限额"
                    value={verifyData.throttle?.publishLimit || verifyData.profile?.publish_limit || 10}
                    suffix="个/月"
                    valueStyle={{ fontSize: 18, color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="近30天已发布"
                    value={verifyData.throttle?.publishCountIn30Days ?? (verifyData.profile?.publish_count || 0)}
                    suffix="个"
                    valueStyle={{ fontSize: 18, color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="剩余额度"
                    value={(verifyData.throttle?.publishLimit || verifyData.profile?.publish_limit || 10) - (verifyData.throttle?.publishCountIn30Days ?? (verifyData.profile?.publish_count || 0))}
                    suffix="个"
                    valueStyle={{ fontSize: 18, color: (verifyData.throttle?.publishCountIn30Days ?? 0) >= (verifyData.throttle?.publishLimit || 10) ? '#cf1322' : '#722ed1' }}
                  />
                </Col>
              </Row>
              {(verifyData.throttle?.publishCountIn30Days ?? 0) >= (verifyData.throttle?.publishLimit || 10) && (
                <Alert
                  message="频次限流已触发"
                  description="该雇主近30天发布岗位数已达上限，新岗位发布将被限制，需联系平台运营审核后才能继续发布。"
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>

            <Card title="人工抽检记录" size="small" type="inner" style={{ marginBottom: 16 }}>
              {(verifyData.jobAuditLogs && verifyData.jobAuditLogs.length > 0) ? (
                <List
                  dataSource={verifyData.jobAuditLogs}
                  size="small"
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <Space>
                          <Tag color={item.action === 'audit' ? 'green' : item.action === 'inspection' ? 'blue' : 'orange'}>
                            {item.action === 'audit' ? '审核' : item.action === 'inspection' ? '抽检' : item.action}
                          </Tag>
                          <Text strong>{item.detail}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          操作员: {item.operator_name || '系统'} · {new Date(item.created_at).toLocaleString('zh-CN')}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无抽检记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card title="举报加权下架记录" size="small" type="inner" style={{ marginBottom: 16 }}>
              {(verifyData.reports && verifyData.reports.length > 0) ? (
                <List
                  dataSource={verifyData.reports}
                  size="small"
                  renderItem={(item, idx) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <Space>
                          <Tag color={item.status === 'resolved' ? 'red' : item.status === 'processing' ? 'orange' : 'blue'}>
                            {item.status === 'resolved' ? '已处理' : item.status === 'processing' ? '处理中' : '待审核'}
                          </Tag>
                          <Text strong>举报#{idx + 1}</Text>
                          <Tag color={idx + 1 >= 3 ? 'red' : idx + 1 >= 2 ? 'orange' : 'blue'}>
                            权重: {idx + 1}/3 {idx + 1 >= 3 ? '(触发自动下架)' : ''}
                          </Tag>
                        </Space>
                        <Text>原因: {item.reason}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          举报人: {item.reporter_name || '匿名'} · {new Date(item.created_at).toLocaleString('zh-CN')}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无举报记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card title="复查记录" size="small" type="inner" style={{ marginBottom: 16 }}>
              {(verifyData.delistedReports && verifyData.delistedReports.length > 0) ? (
                <List
                  dataSource={verifyData.delistedReports}
                  size="small"
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <Space>
                          <Tag color="red">下架复查</Tag>
                          <Tag color={item.status === 'resolved' ? 'green' : 'orange'}>
                            {item.status === 'resolved' ? '复查完成' : '复查中'}
                          </Tag>
                        </Space>
                        <Text>复查原因: {item.reason}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          举报人: {item.reporter_name || '匿名'} · {new Date(item.created_at).toLocaleString('zh-CN')}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无复查记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Alert
              message="平台核验说明"
              description="斗米平台对企业营业执照进行人工核验和定期抽检，确保雇主身份真实。举报累计3次自动触发下架机制，平台运营将在24小时内复查。如发现虚假信息，请立即举报。"
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        title="举报岗位"
        open={reportModalOpen}
        onOk={submitReport}
        onCancel={() => { setReportModalOpen(false); setReportReason(''); }}
        okText="提交举报"
        okButtonProps={{ danger: true }}
        confirmLoading={reportLoading}
      >
        <Alert
          message="举报说明"
          description={
            <div>
              <div>举报将触发平台人工审核流程：</div>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>举报权重累计达到3次将自动下架</li>
                <li>平台运营人员将在24小时内介入处理</li>
                <li>恶意举报将被限制账号功能</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={4}
          placeholder="请详细描述举报原因（如：虚假信息、诈骗、违法违规等）"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}
