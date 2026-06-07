import { Modal, Card, Descriptions, Tag, Row, Col, Statistic, Divider, Space } from 'antd'
import { QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { PermitApplication } from '@/types'

interface VerifyProps {
  visible: boolean
  permit: PermitApplication | null
  onClose: () => void
}

const vehicleTypeMap: Record<string, string> = {
  small: '小型汽车',
  large: '大型汽车',
  truck: '货车',
  motorcycle: '摩托车',
  other: '其他',
}

export default function Verify({ visible, permit, onClose }: VerifyProps) {
  if (!permit) return null

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#00B42A' }} />
          <span>进京证核验</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
    >
      <div className="text-center">
        <div
          className="qrcode-container mx-auto mb-4"
          style="
            width: 200px;
            height: 200px;
            border: 2px dashed #0052D9;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f8ff;
          "
        >
          <QrcodeOutlined style={{ fontSize: '100px', color: '#0052D9' }} />
        </div>
        <p className="text-sm text-gray-500 mb-4">请向检查人员出示此二维码</p>
      </div>

      <Card size="small" className="bg-gray-50">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="车牌号">
            <Tag color="blue" className="text-base">{permit.plateNumber}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="车辆类型">
            {vehicleTypeMap[permit.vehicleType] || permit.vehicleType}
          </Descriptions.Item>
          <Descriptions.Item label="有效期">
            <span className="text-green-600 font-medium">
              {permit.startDate} 至 {permit.endDate}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="证件编号">
            BJZ{String(permit.id).padStart(8, '0')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="核验状态"
            value="有效"
            valueStyle={{ color: '#00B42A', fontSize: '16px' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="核验时间"
            value={new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
      </Row>

      <div className="mt-4 text-center text-xs text-gray-400">
        <p>此二维码5分钟内有效，请及时核验</p>
        <p>北京市公安局交通管理局</p>
      </div>
    </Modal>
  )
}
