import { useState } from 'react'
import {
  Form,
  InputNumber,
  Switch,
  Slider,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Alert,
  SliderSingleProps,
  theme
} from 'antd'
import {
  ThunderboltOutlined,
  SettingOutlined,
  BulbOutlined,
  SendOutlined,
  CloseOutlined,
  RiseOutlined,
  DollarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { useToken } = theme

interface DeviceParams {
  targetTemperature?: number
  power?: number
  waterPrice?: number
  uvEnabled?: boolean
}

interface ParamsFormProps {
  initialValues?: Partial<DeviceParams>
  onSubmit: (values: DeviceParams) => void
  onCancel?: () => void
  loading?: boolean
  showReset?: boolean
  compact?: boolean
}

function ParamsForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  showReset = true,
  compact = false
}: ParamsFormProps) {
  const { token } = theme.useToken()
  const [form] = Form.useForm<DeviceParams>()
  const [watchTemp, setWatchTemp] = useState<number>(initialValues?.targetTemperature ?? 35)
  const [watchPower, setWatchPower] = useState<number>(initialValues?.power ?? 200)
  const [watchPrice, setWatchPrice] = useState<number>(initialValues?.waterPrice ?? 3)
  const [watchUv, setWatchUv] = useState<boolean>(initialValues?.uvEnabled ?? true)

  const defaults = {
    targetTemperature: initialValues?.targetTemperature ?? 35,
    power: initialValues?.power ?? 200,
    waterPrice: initialValues?.waterPrice ?? 3,
    uvEnabled: initialValues?.uvEnabled ?? true
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      onSubmit(values)
    } catch (_) {}
  }

  const handleReset = () => {
    form.setFieldsValue(defaults)
    setWatchTemp(defaults.targetTemperature)
    setWatchPower(defaults.power)
    setWatchPrice(defaults.waterPrice)
    setWatchUv(defaults.uvEnabled)
  }

  const tempMarks: SliderSingleProps['marks'] = {
    20: <Text style={{ fontSize: 11 }}>20°</Text>,
    30: <Text style={{ fontSize: 11 }}>30°</Text>,
    40: <Text style={{ fontSize: 11 }}>40°</Text>,
    50: <Text style={{ fontSize: 11 }}>50°</Text>,
    60: <Text style={{ fontSize: 11 }}>60°</Text>
  }

  const powerMarks: SliderSingleProps['marks'] = {
    50: <Text style={{ fontSize: 11 }}>50</Text>,
    200: <Text style={{ fontSize: 11 }}>200</Text>,
    400: <Text style={{ fontSize: 11 }}>400</Text>,
    600: <Text style={{ fontSize: 11 }}>600</Text>
  }

  const priceMarks: SliderSingleProps['marks'] = {
    0: <Text style={{ fontSize: 11 }}>0</Text>,
    2: <Text style={{ fontSize: 11 }}>2</Text>,
    5: <Text style={{ fontSize: 11 }}>5</Text>,
    10: <Text style={{ fontSize: 11 }}>10</Text>
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={defaults}
      onValuesChange={(changed) => {
        if (changed.targetTemperature !== undefined) setWatchTemp(changed.targetTemperature)
        if (changed.power !== undefined) setWatchPower(changed.power)
        if (changed.waterPrice !== undefined) setWatchPrice(changed.waterPrice)
        if (changed.uvEnabled !== undefined) setWatchUv(changed.uvEnabled)
      }}
    >
      {!compact && (
        <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="参数下发说明"
        description="参数将立即下发到设备，设备收到后立即生效。建议确认参数无误后提交。"
        style={{ marginBottom: 16 }}
      />
      )}

      <Row gutter={compact ? 8 : 16}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            bordered={false}
            style={{ borderRadius: 10, background: '#1890ff08, border: `1px solid #1890ff15` }}
            bodyStyle={{ padding: compact ? 12 : 16 }}
          >
            <Space align="center" style={{ marginBottom: compact ? 6 : 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1890ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiseOutlined />
              </div>
              <div>
                <Text strong>目标温度</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>设备出水目标温度</Text>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#1890ff' }}>
                  <Form.Item name="targetTemperature" noStyle>
                  <InputNumber
                    min={5}
                    max={80}
                    style={{ width: 80, textAlign: 'right' }}
                    controls={false}
                    style={{ width: 80, border: 'none', background: 'transparent', boxShadow: 'none', fontSize: 22, fontWeight: 600, color: '#1890ff', padding: 0, textAlign: 'right' }}
                  />
                </Form.Item>
                <span style={{ fontSize: 14 }}>°C</span>
              </div>
            </Space>
            <Form.Item name="targetTemperature" noStyle rules={[{ required: true, message: '请设置温度' }]}>
              <Slider
                min={5}
                max={80}
                marks={tempMarks}
                tooltip={{ formatter: (v) => `${v}°C` }}
                style={{ margin: '8px 8px 0' }}
              />
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            size="small"
            bordered={false}
            style={{ borderRadius: 10, background: '#722ed108', border: `1px solid #722ed115` }}
            bodyStyle={{ padding: compact ? 12 : 16 }}
          >
            <Space align="center" style={{ marginBottom: compact ? 6 : 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#722ed1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ThunderboltOutlined />
              </div>
              <div>
                <Text strong>功率限制</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>设备最大功率限制</Text>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#722ed1' }}>
                  <Form.Item name="power" noStyle>
                    <InputNumber
                      min={0}
                      max={1000}
                      step={10}
                      controls={false}
                      style={{ width: 80, border: 'none', background: 'transparent', boxShadow: 'none', fontSize: 22, fontWeight: 600, color: '#722ed1', padding: 0, textAlign: 'right' }}
                    />
                  </Form.Item>
                  <span style={{ fontSize: 14 }}>W</span>
                </div>
              </div>
            </Space>
            <Form.Item name="power" noStyle rules={[{ required: true, message: '请设置功率' }]}>
              <Slider
                min={0}
                max={1000}
                step={10}
                marks={powerMarks}
                tooltip={{ formatter: (v) => `${v}W` }}
                style={{ margin: '8px 8px 0' }}
              />
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            size="small"
            bordered={false}
            style={{ borderRadius: 10, background: '#fa8c1608', border: `1px solid #fa8c1615` }}
            bodyStyle={{ padding: compact ? 12 : 16 }}
          >
            <Space align="center" style={{ marginBottom: compact ? 6 : 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fa8c16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarOutlined />
              </div>
              <div>
                <Text strong>水价设置</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>用于水费计价参数</Text>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#fa8c16' }}>
                  <span style={{ fontSize: 14 }}>¥</span>
                  <Form.Item name="waterPrice" noStyle>
                    <InputNumber
                      min={0}
                      max={20}
                      step={0.1}
                      controls={false}
                      style={{ width: 70, border: 'none', background: 'transparent', boxShadow: 'none', fontSize: 22, fontWeight: 600, color: '#fa8c16', padding: 0, textAlign: 'right' }}
                    />
                  </Form.Item>
                  <span style={{ fontSize: 14 }}>/吨</span>
                </div>
              </div>
            </Space>
            <Form.Item name="waterPrice" noStyle rules={[{ required: true, message: '请设置水价' }]}>
              <Slider
                min={0}
                max={20}
                step={0.1}
                marks={priceMarks}
                tooltip={{ formatter: (v) => `¥${v}/吨` }}
                style={{ margin: '8px 8px 0' }}
              />
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            size="small"
            bordered={false}
            style={{
              borderRadius: 10,
              background: watchUv ? '#52c41a08' : '#d9d9d920',
              border: `1px solid ${watchUv ? '#52c41a15' : '#d9d9d930'}`
            }}
            bodyStyle={{ padding: compact ? 12 : 16 }}
          >
            <Space align="center" style={{ marginBottom: compact ? 6 : 10 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: watchUv ? '#52c41a' : '#d9d9d9',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <BulbOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong>UV杀菌灯</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {watchUv ? '已开启，持续杀菌' : '已关闭，可节省电力'}
                </Text>
              </div>
              <Form.Item name="uvEnabled" valuePropName="checked" noStyle>
                <Switch
                  checkedChildren={<BulbOutlined />}
                  unCheckedChildren={<BulbOutlined />}
                  size="large"
                  style={{ transform: 'scale(1.1)' }}
                />
              </Form.Item>
            </Space>

            <div
              style={{
                marginTop: 8,
                padding: '8px 10px',
                borderRadius: 6,
                background: watchUv ? '#52c41a10' : '#bfbfbf15',
                fontSize: 12,
                color: watchUv ? '#389e0d' : '#8c8c8c'
              }}
            >
              {watchUv
                ? <Space size={4}><InfoCircleOutlined />UV灯运行中，建议每运行8小时关闭30分钟</Space>
                : <Space size={4}><InfoCircleOutlined />建议每天至少开启4小时以上以保证水质安全</Space>
              }
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: compact ? 12 : 20, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Space>
          {showReset && (
            <Button icon={<CloseOutlined />} onClick={handleReset}>
              重置
            </Button>
          )}
          {onCancel && (
            <Button onClick={onCancel}>取消</Button>
          )}
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            {compact ? '提交' : '下发参数'}
          </Button>
        </Space>
      </div>
    </Form>
  )
}

export default ParamsForm
