import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  message,
  Timeline,
  Progress,
  Space,
  Divider,
  Row,
  Col,
  Statistic,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { getPermitDetail, renewPermit } from '@/api/modules/permit'
import type { PermitApplication, PermitStatus } from '@/types'
import Verify from './Verify'

const vehicleTypeMap: Record<string, string> = {
  small: '小型汽车',
  large: '大型汽车',
  truck: '货车',
  motorcycle: '摩托车',
  other: '其他',
}

const statusColorMap: Record<PermitStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  expired: 'default',
}

const statusTextMap: Record<PermitStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  expired: '已过期',
}

const progressMap: Record<PermitStatus, number> = {
  pending: 33,
  approved: 100,
  rejected: 100,
  expired: 100,
}

export default function Detail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PermitApplication | null>(null)
  const [verifyModalVisible, setVerifyModalVisible] = useState(false)

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const detail = await getPermitDetail(Number(id))
      setData(detail)
    } catch (error: any) {
      message.error(error.message || '获取详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handleRenew = async () => {
    if (!data) return
    try {
      await renewPermit(data.id)
      message.success('续期申请已提交')
      fetchDetail()
    } catch (error: any) {
      message.error(error.message || '续期失败')
    }
  }

  const handlePrint = () => {
    window.print()
    message.success('正在准备打印...')
  }

  const getTimelineItems = () => {
    if (!data) return []
    
    const items = [
      {
        color: 'green',
        children: (
          <div>
        <p className="font-medium">提交申请</p>
        <p className="text-sm text-gray-500">{data.createdAt.split('T')[0]}</p>
          </div>
        ),
        dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
      },
    ]

    if (data.status === 'pending') {
      items.push({
        color: 'blue',
        children: (
          <div>
            <p className="font-medium">审核中</p>
            <p className="text-sm text-gray-500">预计1-3个工作日内完成审核</p>
          </div>
        ),
        dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
      })
    } else if (data.status === 'approved') {
      items.push({
        color: 'green',
        children: (
          <div>
            <p className="font-medium">审核通过</p>
            <p className="text-sm text-gray-500">{data.updatedAt.split('T')[0]}</p>
          </div>
        ),
        dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
      })
      items.push({
        color: 'green',
        children: (
          <div>
            <p className="font-medium">证件已生效</p>
            <p className="text-sm text-gray-500">有效期至 {data.endDate}</p>
          </div>
        ),
        dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
      })
    } else if (data.status === 'rejected') {
      items.push({
        color: 'red',
        children: (
          <div>
            <p className="font-medium">已驳回</p>
            <p className="text-sm text-gray-500">{data.updatedAt.split('T')[0]}</p>
            {data.rejectReason && (
              <p className="text-sm text-red-500">原因：{data.rejectReason}</p>
            )}
          </div>
        ),
        dot: <CloseCircleOutlined style={{ fontSize: '16px' }} />,
      })
    } else if (data.status === 'expired') {
      items.push({
        color: 'gray',
        children: (
          <div>
            <p className="font-medium">已过期</p>
            <p className="text-sm text-gray-500">请重新申请</p>
          </div>
        ),
      })
    }

    return items
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <div className="text-center py-20 text-gray-500">暂无数据</div>
      </Card>
    )
  }

  return (
    <div className="pb-8">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/permit')}
          >
            返回列表
          </Button>
          <h1 className="text-xl font-bold text-gray-800">进京证详情</h1>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="基本信息" className="mb-6">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="车牌号">
                  <Tag color="blue" className="text-base">{data.plateNumber}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="车辆类型">
                  {vehicleTypeMap[data.vehicleType] || data.vehicleType}
                </Descriptions.Item>
                <Descriptions.Item label="车主姓名">
                  张三
                </Descriptions.Item>
                <Descriptions.Item label="进京时段">
                  {data.startDate} 至 {data.endDate}
                </Descriptions.Item>
                <Descriptions.Item label="进京路线">
                  {data.route}
                </Descriptions.Item>
                <Descriptions.Item label="申请状态">
                  <Tag color={statusColorMap[data.status]}>
                    {statusTextMap[data.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="申请时间">
                  {data.createdAt.split('T')[0]}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="审批进度" className="mb-6">
              <div className="mb-6">
                <Progress
                  percent={progressMap[data.status]}
                  status={data.status === 'rejected' ? 'exception' : 'active'}
                  strokeColor="#0052D9"
                />
              </div>
              <Timeline items={getTimelineItems()} />
            </Card>
          </Col>

          {data.status === 'approved' && (
            <Col xs={24} lg={8}>
              <Card title="电子证照" className="mb-6">
                <div
                  className="permit-card"
                  style="
                    bg-gradient-to-br from-[#0052D9] to-[#003380]
                    text-white rounded-xl p-6 rounded-lg
                    shadow-lg
                  "
                >
                  <div className="text-center mb-4">
                    <div className="text-lg font-bold mb-2">北京市进京通行证</div>
                    <div className="text-sm opacity-80">Beijing Entry Permit</div>
                  </div>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '12px 0' }} />
                  <div className="space-y-2">
                    <Statistic title="车牌号" value={data.plateNumber} valueStyle={{ color: '#fff', fontSize: '20px' }} />
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="text-sm opacity-80">有效期</div>
                        <div className="text-white">{data.startDate}</div>
                      </Col>
                      <Col span={12}>
                        <div className="text-sm opacity-80">至</div>
                        <div className="text-white">{data.endDate}</div>
                      </Col>
                    </Row>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/30 text-center">
                    <div
                      className="qrcode-placeholder"
                      style="
                        width: 120px; height: 120px;
                        background: white;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                      "
                    >
                      <QrcodeOutlined style={{ fontSize: '80px', color: '#000' }} />
                    </div>
                    <div className="text-xs mt-2 opacity-80">扫码核验</div>
                  </div>
                </div>
              </Card>
            </Col>
          )}

          <Col xs={24}>
            <div className="flex justify-center gap-4">
              {data.status === 'approved' && (
                <>
                  <Popconfirm
                    title="确定要续期吗？"
                    onConfirm={handleRenew}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      size="large"
                      style={{ backgroundColor: '#0052D9' }}
                    >
                      申请续期
                    </Button>
                  </Popconfirm>
                  <Button
                    icon={<QrcodeOutlined />}
                    size="large"
                    onClick={() => setVerifyModalVisible(true)}
                  >
                    出示核验
                  </Button>
                  <Button
                    icon={<PrinterOutlined />}
                    size="large"
                    onClick={handlePrint}
                  >
                    打印证件
                  </Button>
                </>
              )}
              {data.status === 'rejected' && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="large"
                  onClick={() => navigate('/permit/apply')}
                  style={{ backgroundColor: '#0052D9' }}
                >
                  重新申请
                </Button>
              )}
              {data.status === 'expired' && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="large"
                  onClick={() => navigate('/permit/apply')}
                  style={{ backgroundColor: '#0052D9' }}
                >
                  重新申请
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Verify
        visible={verifyModalVisible}
        permit={data}
        onClose={() => setVerifyModalVisible(false)}
      />
    </div>
  )
}
