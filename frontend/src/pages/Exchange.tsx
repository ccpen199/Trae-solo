import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Spin,
  Statistic,
  Empty,
} from 'antd'
import {
  GiftOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { exchangeApi, pointsApi } from '../services/api'
import { useEffect } from 'react'

const { Title, Text } = Typography

interface ExchangeItem {
  itemId: string
  itemName: string
  itemType: string
  pointsPerUnit: number
  quantity: number
}

const sampleProducts = [
  {
    id: 'p001',
    name: '精美礼品A',
    type: 'product',
    points: 100,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=精美礼品盒商品展示&image_size=square',
  },
  {
    id: 'p002',
    name: '50元代金券',
    type: 'coupon',
    points: 200,
    stock: 100,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=优惠券代金券设计&image_size=square',
  },
  {
    id: 'p003',
    name: '会员专属服务',
    type: 'service',
    points: 500,
    stock: 999,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=高端会员服务&image_size=square',
  },
]

const Exchange: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [pointsInfo, setPointsInfo] = useState<any>(null)
  const [form] = Form.useForm()
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  useEffect(() => {
    fetchPointsInfo()
  }, [user])

  const fetchPointsInfo = async () => {
    setLoading(true)
    try {
      const response = await pointsApi.getPointsInfo()
      setPointsInfo(response.data.data)
    } catch (error: any) {
      message.error(error.message || '获取积分信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExchange = async (values: any) => {
    if (!selectedProduct) {
      message.warning('请选择要兑换的商品')
      return
    }

    setLoading(true)
    try {
      const data = {
        itemId: selectedProduct.id,
        itemName: selectedProduct.name,
        itemType: selectedProduct.type,
        pointsPerUnit: selectedProduct.points,
        quantity: values.quantity || 1,
      }

      const response = await exchangeApi.createExchange(data)
      message.success('兑换订单创建成功，积分已冻结')
      form.resetFields()
      setSelectedProduct(null)
      fetchPointsInfo()
    } catch (error: any) {
      message.error(error.message || '兑换失败')
    } finally {
      setLoading(false)
    }
  }

  const getExchangeTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      product: '实物商品',
      coupon: '代金券',
      service: '服务',
      cash: '现金',
    }
    return typeMap[type] || type
  }

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        积分兑换
      </Title>

      {pointsInfo && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="可用积分"
                value={pointsInfo.availableBalance || 0}
                prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总积分"
                value={pointsInfo.totalBalance || 0}
                prefix={<CreditCardOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card title="可兑换商品">
            <Row gutter={[16, 16]}>
              {sampleProducts.map((product) => (
                <Col xs={24} sm={12} lg={8} key={product.id}>
                  <Card
                    hoverable
                    onClick={() => {
                      setSelectedProduct(product)
                      form.setFieldsValue({
                        itemId: product.id,
                        quantity: 1,
                      })
                    }}
                    style={{
                      border: selectedProduct?.id === product.id
                        ? '2px solid #1890ff'
                        : '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        height: 120,
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                        borderRadius: 8,
                      }}
                    >
                      <GiftOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    </div>
                    <Text strong>{product.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getExchangeTypeText(product.type)}
                    </Text>
                    <br />
                    <Text type="danger" strong>
                      {product.points} 积分
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      库存: {product.stock}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="兑换表单">
            {selectedProduct ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleExchange}
              >
                <Form.Item label="商品名称">
                  <Input value={selectedProduct.name} readOnly />
                </Form.Item>

                <Form.Item label="商品类型">
                  <Input
                    value={getExchangeTypeText(selectedProduct.type)}
                    readOnly
                  />
                </Form.Item>

                <Form.Item label="单积分数">
                  <Input
                    value={selectedProduct.points}
                    readOnly
                    prefix={<TrophyOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  name="quantity"
                  label="兑换数量"
                  initialValue={1}
                  rules={[{ required: true, message: '请输入数量' }]}
                >
                  <InputNumber
                    min={1}
                    max={selectedProduct.stock}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item label="所需总积分">
                  <Statistic
                    value={(form.getFieldValue('quantity') || 1) * selectedProduct.points}
                    valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
                    prefix={<TrophyOutlined />}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    icon={<ShoppingCartOutlined />}
                  >
                    确认兑换
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Empty description="请先选择要兑换的商品" />
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

export default Exchange
