import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Timeline,
  Tag,
  Button,
  Spin,
  message,
  Row,
  Col,
  QRCode,
  Space,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getEbikeDetail } from '@/api/modules/ebike'
import type { EbikeRegistration } from '@/types'

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
}

export default function EbikeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<EbikeRegistration | null>(null)

  useEffect(() => {
    if (id) {
      fetchDetail(parseInt(id))
    }
  }, [id])

  const fetchDetail = async (ebikeId: number) => {
    setLoading(true)
    try {
      const data = await getEbikeDetail(ebikeId)
      setDetail(data)
    } catch (error) {
      message.error('获取详情失败')
    } finally {
      setLoading(false)
    }
  }

  const timelineItems = detail
    ? [
        {
          color: 'green',
          children: (
            <div>
              <p className="font-medium">提交申请</p>
              <p className="text-sm text-gray-500">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </p>
            </div>
          ),
        },
        ...(detail.status !== 'pending'
          ? [
              {
                color: 'blue',
                children: (
                  <div>
                    <p className="font-medium">审核中</p>
                    <p className="text-sm text-gray-500">
                      {dayjs(detail.createdAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                  </div>
                ),
              },
            ]
          : []),
        ...(detail.status === 'approved'
          ? [
              {
                color: 'green',
                children: (
                  <div>
                    <p className="font-medium">审核通过</p>
                    <p className="text-sm text-gray-500">
                      {dayjs(detail.createdAt).add(2, 'hour').format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                  </div>
                ),
              },
            ]
          : []),
        ...(detail.status === 'rejected'
          ? [
              {
                color: 'red',
                children: (
                  <div>
                    <p className="font-medium">审核驳回</p>
                    <p className="text-sm text-gray-500">
                      {dayjs(detail.createdAt).add(2, 'hour').format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                    <p className="text-sm text-red-500">原因：材料不全，请补充购车发票</p>
                  </div>
                ),
              },
            ]
          : []),
      ]
    : []

  return (
    <div>
      <div className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ebike/list')}>
          返回列表
        </Button>
      </div>

      <Spin spinning={loading}>
        {detail && (
          <Row gutter={24}>
            <Col span={16}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-[#722ED1]" />
                    <span>登记详情</span>
                  </div>
                }
                extra={
                  <Tag color={statusMap[detail.status]?.color}>
                    {statusMap[detail.status]?.text}
                  </Tag>
                }
                className="mb-4"
              >
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="车牌号" span={2}>
                    <span className="font-mono font-semibold text-[#0052D9] text-lg">
                      京{String(detail.id).padStart(6, '0')}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="车架号">
                    <span className="font-mono">{detail.frameNumber}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="电机号">
                    <span className="font-mono">{detail.motorNumber}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="品牌">{detail.brand}</Descriptions.Item>
                  <Descriptions.Item label="型号">{detail.model}</Descriptions.Item>
                  <Descriptions.Item label="颜色">{detail.color}</Descriptions.Item>
                  <Descriptions.Item label="购买日期">
                    {dayjs(detail.purchaseDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="申请时间">
                    {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                title={
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined className="text-[#0052D9]" />
                    <span>审核流程</span>
                  </div>
                }
              >
                <Timeline items={timelineItems} />
              </Card>
            </Col>

            <Col span={8}>
              {detail.status === 'approved' && (
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <IdcardOutlined className="text-[#00B42A]" />
                      <span>电子行驶证</span>
                    </div>
                  }
                  className="mb-4"
                >
                  <div
                    className="rounded-lg p-5 text-white"
                    style={{
                      background:
                        'linear-gradient(135deg, #0052D9 0%, #003366 100%)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ThunderboltOutlined className="text-2xl" />
                        <span className="font-bold text-lg">北京市电动车行驶证</span>
                      </div>
                      <CheckCircleOutlined className="text-green-400 text-xl" />
                    </div>
                    <Divider className="my-2 bg-white/20" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">车牌号</span>
                        <span className="font-mono font-semibold">
                          京{String(detail.id).padStart(6, '0')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">车架号</span>
                        <span className="font-mono">
                          {detail.frameNumber.slice(-6).padStart(detail.frameNumber.length, '*')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">车辆类型</span>
                        <span>电动自行车</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">所有人</span>
                        <span>张三</span>
                      </div>
                    </div>
                    <Divider className="my-3 bg-white/20" />
                    <div className="text-xs text-white/60 text-center">
                      签发日期：{dayjs(detail.createdAt).format('YYYY年MM月DD日')}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col items-center">
                    <QRCode
                      value={`https://traffic.beijing.gov.cn/ebike/verify?id=${detail.id}`}
                      size={120}
                      level="M"
                    />
                    <p className="text-xs text-gray-500 mt-2">扫码验证行驶证真伪</p>
                  </div>
                </Card>
              )}

              <Card
                title={
                  <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-[#722ED1]" />
                    <span>上传材料</span>
                  </div>
                }
              >
                <Space direction="vertical" className="w-full">
                  <div className="text-center">
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-2">
                      <FileTextOutlined className="text-3xl text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">购车发票</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-2">
                      <FileTextOutlined className="text-3xl text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">身份证照片</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-2">
                      <FileTextOutlined className="text-3xl text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">车辆照片</span>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  )
}
