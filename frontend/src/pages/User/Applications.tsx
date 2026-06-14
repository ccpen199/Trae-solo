import React, { useState, useEffect } from 'react'
import { 
  Card, List, Tag, Button, Modal, Form, Input, Select, message, 
  Space, Typography, Descriptions, Empty, Tabs, Rate, Table, Pagination
} from 'antd'
import { 
  FileTextOutlined, EyeOutlined, ClockCircleOutlined, 
  CheckCircleOutlined, ExclamationCircleOutlined, SearchOutlined,
  StarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import dayjs from 'dayjs'
import StatusTimeline from '@/components/StatusTimeline'
import type { ServiceApplication, ProgressStep } from '@/types'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoggedIn, user, applications, setApplications, addApplication, updateApplication } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentApp, setCurrentApp] = useState<ServiceApplication | null>(null)
  const [rateModal, setRateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filteredApps, setFilteredApps] = useState<ServiceApplication[]>([])
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  useEffect(() => {
    if (isLoggedIn && applications.length === 0) {
      loadApplications()
    }
  }, [isLoggedIn])

  useEffect(() => {
    filterApplications()
  }, [applications, activeTab, searchKeyword, pagination.current])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const mockApps: ServiceApplication[] = [
        {
          id: 'APP20240101001',
          userId: user?.id || '',
          serviceId: '1',
          serviceName: '居住证办理',
          status: 'processing',
          submitTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
          expectedTime: dayjs().add(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
          currentStep: 2,
          progress: [
            { step: 1, title: '提交申请', status: 'completed', time: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '申请材料已提交' },
            { step: 2, title: '材料审核', status: 'processing', time: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '正在审核提交的材料' },
            { step: 3, title: '现场核验', status: 'pending', time: '', description: '请携带原件到现场核验' },
            { step: 4, title: '制证', status: 'pending', time: '', description: '制作居住证' },
            { step: 5, title: '完成', status: 'pending', time: '', description: '领取或邮寄证件' }
          ],
          formData: {
            name: user?.name || '张三',
            idCard: '3204**********1234',
            address: '天宁区红梅街道翠竹新村'
          },
          materials: [
            { name: '身份证', status: 'approved', certificateId: '1' },
            { name: '租房合同', status: 'approved' },
            { name: '社保缴纳证明', status: 'pending' }
          ],
          department: '常州市公安局',
          handler: '王警官',
          handlerPhone: '12345'
        },
        {
          id: 'APP20240101002',
          userId: user?.id || '',
          serviceId: '2',
          serviceName: '社保缴纳查询',
          status: 'completed',
          submitTime: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
          completedTime: dayjs().subtract(14, 'day').format('YYYY-MM-DD HH:mm:ss'),
          currentStep: 4,
          progress: [
            { step: 1, title: '提交申请', status: 'completed', time: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '申请已提交' },
            { step: 2, title: '信息核验', status: 'completed', time: dayjs().subtract(15, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), description: '身份信息核验通过' },
            { step: 3, title: '数据查询', status: 'completed', time: dayjs().subtract(14, 'day').add(8, 'hour').format('YYYY-MM-DD HH:mm:ss'), description: '正在查询社保数据' },
            { step: 4, title: '完成', status: 'completed', time: dayjs().subtract(14, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '查询完成，结果已出具' }
          ],
          formData: {
            name: user?.name || '张三',
            idCard: '3204**********1234'
          },
          materials: [
            { name: '身份证', status: 'approved', certificateId: '1' }
          ],
          department: '常州市人力资源和社会保障局',
          handler: '张小姐',
          handlerPhone: '12333',
          result: '社保缴纳证明已生成，可在下载中心查看。',
          rating: 5,
          comment: '办理速度快，服务态度好，非常满意！'
        },
        {
          id: 'APP20240101003',
          userId: user?.id || '',
          serviceId: '3',
          serviceName: '公积金提取',
          status: 'rejected',
          submitTime: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'),
          rejectedTime: dayjs().subtract(18, 'day').format('YYYY-MM-DD HH:mm:ss'),
          rejectReason: '提供的购房合同不完整，请补充完整的购房合同原件扫描件。',
          currentStep: 2,
          progress: [
            { step: 1, title: '提交申请', status: 'completed', time: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '申请材料已提交' },
            { step: 2, title: '材料审核', status: 'rejected', time: dayjs().subtract(18, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '材料不完整，请补充' }
          ],
          formData: {
            name: user?.name || '张三',
            idCard: '3204**********1234',
            amount: '100000'
          },
          materials: [
            { name: '身份证', status: 'approved', certificateId: '1' },
            { name: '购房合同', status: 'rejected' }
          ],
          department: '常州市住房公积金管理中心',
          handler: '李先生',
          handlerPhone: '12329'
        },
        {
          id: 'APP20240101004',
          userId: user?.id || '',
          serviceId: '4',
          serviceName: '新生儿入户',
          status: 'pending',
          submitTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          expectedTime: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
          currentStep: 1,
          progress: [
            { step: 1, title: '提交申请', status: 'processing', time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), description: '申请已提交，等待受理' },
            { step: 2, title: '材料审核', status: 'pending', time: '', description: '审核材料完整性' },
            { step: 3, title: '审批', status: 'pending', time: '', description: '户籍部门审批' },
            { step: 4, title: '完成', status: 'pending', time: '', description: '户口登记完成' }
          ],
          formData: {
            childName: '张小宝',
            birthDate: '2024-01-01',
            fatherName: user?.name || '张三',
            motherName: '李四'
          },
          materials: [
            { name: '出生医学证明', status: 'pending', certificateId: '5' },
            { name: '父母结婚证', status: 'pending', certificateId: '6' },
            { name: '父母身份证', status: 'pending', certificateId: '1' }
          ],
          department: '常州市公安局',
          handler: '',
          handlerPhone: '12345'
        }
      ]
      setApplications(mockApps)
    } catch (error) {
      message.error('加载办件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.status === activeTab)
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(item => 
        item.serviceName.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword)
      )
    }
    
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredApps(filtered.slice(start, end))
    setPagination(p => ({ ...p, total: filtered.length }))
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待受理' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'success', text: '已完成' },
      rejected: { color: 'error', text: '已驳回' },
      cancelled: { color: 'default', text: '已取消' }
    }
    const info = statusMap[status] || statusMap.pending
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getMaterialStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#faad14',
      approved: '#52c41a',
      rejected: '#ff4d4f'
    }
    return colorMap[status] || '#999'
  }

  const viewDetail = (app: ServiceApplication) => {
    setCurrentApp(app)
    setDetailModal(true)
  }

  const handleRate = async (values: any) => {
    if (!currentApp) return
    
    try {
      const updatedApp: ServiceApplication = {
        ...currentApp,
        rating: values.rating,
        comment: values.comment,
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      updateApplication(updatedApp)
      setRateModal(false)
      form.resetFields()
      message.success('评价提交成功，感谢您的反馈！')
    } catch (error) {
      message.error('评价失败，请重试')
    }
  }

  const handleReapply = (app: ServiceApplication) => {
    navigate(`/services/${app.serviceId}`)
  }

  if (!isLoggedIn) {
    navigate('/login')
    return null
  }

  const columns = [
    {
      title: '办件编号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '服务事项',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text: string, record: ServiceApplication) => (
        <a onClick={() => navigate(`/services/${record.serviceId}`)}>{text}</a>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 170
    },
    {
      title: '办理部门',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ServiceApplication) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'completed' && !record.rating && (
            <Button type="link" icon={<StarOutlined />} onClick={() => { setCurrentApp(record); setRateModal(true); }}>
              评价
            </Button>
          )}
          {record.status === 'rejected' && (
            <Button type="link" onClick={() => handleReapply(record)}>
              重新申请
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        className="card-shadow"
        title={
          <Space>
            <FileTextOutlined />
            <span>我的办件</span>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              共 {applications.length} 条办件记录
            </Text>
          </Space>
        }
        extra={
          <Input.Search
            placeholder="搜索办件编号或服务名称"
            allowClear
            style={{ width: 280 }}
            onSearch={(value) => { setSearchKeyword(value); setPagination(p => ({ ...p, current: 1 })); }}
            onChange={(e) => !e.target.value && setSearchKeyword('')}
            prefix={<SearchOutlined />}
          />
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => { setActiveTab(key); setPagination(p => ({ ...p, current: 1 })); }}
          style={{ marginBottom: 16 }}
        >
          <TabPane tab={`全部 (${applications.length})`} key="all" />
          <TabPane tab={`待受理 (${applications.filter(a => a.status === 'pending').length})`} key="pending" />
          <TabPane tab={`处理中 (${applications.filter(a => a.status === 'processing').length})`} key="processing" />
          <TabPane tab={`已完成 (${applications.filter(a => a.status === 'completed').length})`} key="completed" />
          <TabPane tab={`已驳回 (${applications.filter(a => a.status === 'rejected').length})`} key="rejected" />
        </Tabs>

        {filteredApps.length === 0 && !loading ? (
          <Empty description="暂无办件记录" />
        ) : (
          <>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredApps}
              loading={loading}
              pagination={false}
              size="middle"
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        title="办件详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={900}
      >
        {currentApp && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentApp.serviceName}</Title>
              {getStatusTag(currentApp.status)}
            </Space>

            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="办件编号">{currentApp.id}</Descriptions.Item>
              <Descriptions.Item label="办理部门">{currentApp.department}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{currentApp.submitTime}</Descriptions.Item>
              <Descriptions.Item label="预计完成">{currentApp.expectedTime || '-'}</Descriptions.Item>
              {currentApp.completedTime && (
                <Descriptions.Item label="完成时间">{currentApp.completedTime}</Descriptions.Item>
              )}
              {currentApp.handler && (
                <Descriptions.Item label="经办人">{currentApp.handler} ({currentApp.handlerPhone})</Descriptions.Item>
              )}
            </Descriptions>

            {currentApp.rejectReason && (
              <Card 
                size="small" 
                style={{ marginBottom: 16, backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}
              >
                <div style={{ color: '#ff4d4f' }}>
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  <strong>驳回原因：</strong>{currentApp.rejectReason}
                </div>
              </Card>
            )}

            <Card size="small" title="办理进度" style={{ marginBottom: 16 }}>
              <StatusTimeline progress={currentApp.progress as ProgressStep[]} />
            </Card>

            <Card size="small" title="材料清单" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={currentApp.materials}
                renderItem={(material: any) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <span>{material.name}</span>
                      <Tag color={getMaterialStatusColor(material.status)}>
                        {material.status === 'approved' ? '已通过' : material.status === 'rejected' ? '已驳回' : '待审核'}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            {currentApp.result && (
              <Card size="small" title="办理结果" style={{ marginBottom: 16 }}>
                <p style={{ margin: 0 }}>{currentApp.result}</p>
              </Card>
            )}

            {currentApp.rating && (
              <Card size="small" title="我的评价">
                <div style={{ marginBottom: 8 }}>
                  <Text>评分：</Text>
                  <Rate disabled value={currentApp.rating} />
                </div>
                {currentApp.comment && (
                  <p style={{ margin: 0 }}>{currentApp.comment}</p>
                )}
              </Card>
            )}

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                {currentApp.status === 'completed' && !currentApp.rating && (
                  <Button type="primary" icon={<StarOutlined />} onClick={() => { setRateModal(true); }}>
                    评价服务
                  </Button>
                )}
                {currentApp.status === 'rejected' && (
                  <Button type="primary" onClick={() => handleReapply(currentApp)}>
                    重新申请
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="服务评价"
        open={rateModal}
        onCancel={() => setRateModal(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRate}
        >
          <Form.Item
            name="rating"
            label="请对本次服务进行评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item
            name="comment"
            label="评价内容（选填）"
          >
            <TextArea rows={4} placeholder="请输入您的评价和建议，帮助我们改进服务" maxLength={500} showCount />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交评价</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ApplicationsPage
