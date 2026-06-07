import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card,
  Button,
  Descriptions,
  Image,
  Tag,
  Timeline,
  Spin,
  Row,
  Col,
  Empty,
  message,
  Alert,
  Space
} from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  GiftOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getViolationDetail } from '@/api/modules/violation'
import type { ViolationReport } from '@/types'

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待审核', color: 'orange', icon: <ClockCircleOutlined /> },
  valid: { text: '已采纳', color: 'green', icon: <CheckCircleOutlined /> },
  invalid: { text: '未采纳', color: 'red', icon: <CloseCircleOutlined /> }
}

const violationTypeMap: Record<string, string> = {
  red_light: '闯红灯',
  parking: '违停',
  lane_change: '压线',
  reverse: '逆行',
  speeding: '超速',
  other: '其他'
}

export default function ViolationDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<ViolationReport | null>(null)

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getViolationDetail(parseInt(id))
      setDetail(res)
    } catch (error: any) {
      message.error(error.message || '获取详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const getTimelineItems = () => {
    const items = [
      {
        color: 'blue',
        dot: <CameraOutlined />,
        children: (
          <div>
            <p className="font-medium">举报提交</p>
            <p className="text-gray-500 text-sm">{dayjs(detail?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )
      }
    ]

    if (detail?.status !== 'pending') {
      items.push({
        color: detail?.status === 'valid' ? 'green' : 'red',
        dot: detail?.status === 'valid' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
        children: (
          <div>
            <p className="font-medium">
              {detail?.status === 'valid' ? '审核通过 - 举报已采纳' : '审核未通过 - 举报未采纳'}
            </p>
            <p className="text-gray-500 text-sm">
              {detail?.status === 'valid' 
                ? '感谢您的举报，违法车辆已被记录' 
                : '证据不足或不符合举报要求，请补充材料后重新举报'}
            </p>
          </div>
        )
      })
    }

    if (detail?.status === 'valid') {
      items.push({
        color: 'gold',
        dot: <GiftOutlined />,
        children: (
          <div>
            <p className="font-medium">奖励发放</p>
            <p className="text-gray-500 text-sm">奖励积分已发放至您的账户</p>
          </div>
        )
      })
    }

    return items
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="shadow-sm">
          <Spin spinning={true} className="flex justify-center py-20">
            <div />
          </Spin>
        </Card>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <Card className="shadow-sm">
          <Empty description="举报记录不存在" />
        </Card>
      </div>
    )
  }

  const statusInfo = statusMap[detail.status]

  return (
    <div className="p-6">
      <Card className="shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/violation/list')}
          >
            返回列表
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">举报详情</h1>
          <Tag color={statusInfo.color} icon={statusInfo.icon} className="ml-auto">
            {statusInfo.text}
          </Tag>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="举报编号" span={1}>
            #{String(detail.id).padStart(6, '0')}
          </Descriptions.Item>
          <Descriptions.Item label="违法类型" span={1}>
            <Space>
              <CameraOutlined className="text-blue-500" />
              <span>{violationTypeMap[detail.violationType] || detail.violationType}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="违法时间" span={1}>
            <Space>
              <ClockCircleOutlined className="text-gray-400" />
              <span>{dayjs(detail.violationTime).format('YYYY-MM-DD HH:mm:ss')}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="违法地点" span={1}>
            <Space>
              <EnvironmentOutlined className="text-gray-400" />
              <span>{detail.location || '未知位置'}</span>
            </Space>
          </Descriptions.Item>
          {detail.latitude && detail.longitude && (
            <Descriptions.Item label="GPS坐标" span={2}>
              北纬 {detail.latitude.toFixed(6)}, 东经 {detail.longitude.toFixed(6)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="举报时间" span={2}>
            {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          {detail.description && (
            <Descriptions.Item label="违法描述" span={2}>
              {detail.description}
            </Descriptions.Item>
          )}
          {detail.evidenceHash && (
            <Descriptions.Item label="证据哈希" span={2}>
              <div className="flex items-center gap-2">
                <SafetyCertificateOutlined className="text-blue-500" />
                <span className="font-mono text-sm">{detail.evidenceHash}</span>
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Card title="证据图片" className="shadow-sm">
            {detail.evidenceUrls && detail.evidenceUrls.length > 0 ? (
              <Image.PreviewGroup>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {detail.evidenceUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={url}
                        alt={`证据 ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        preview
                      />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <Empty description="暂无证据图片" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="审核流程" className="shadow-sm">
            <Timeline items={getTimelineItems()} />
          </Card>

          {detail.status === 'valid' && (
            <Card title="处理结果" className="shadow-sm mt-6">
              <Alert
                message="举报成功"
                description="您的举报已被采纳，感谢您对交通管理工作的支持！奖励积分已发放至您的账户。"
                type="success"
                showIcon
                icon={<GiftOutlined />}
              />
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <GiftOutlined />
                  <span className="font-semibold">获得奖励：+50 积分</span>
                </div>
              </div>
            </Card>
          )}

          {detail.status === 'invalid' && (
            <Card title="处理结果" className="shadow-sm mt-6">
              <Alert
                message="举报未采纳"
                description="您的举报因证据不足或不符合举报要求未被采纳，请补充清晰的证据图片或视频后重新举报。"
                type="warning"
                showIcon
              />
            </Card>
          )}

          {detail.status === 'pending' && (
            <Card title="处理结果" className="shadow-sm mt-6">
              <Alert
                message="审核中"
                description="您的举报正在审核中，请耐心等待。通常审核时间为1-3个工作日。"
                type="info"
                showIcon
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
