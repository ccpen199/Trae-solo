import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  InputNumber,
  Typography,
  Empty,
  Tag,
  Space,
  Popconfirm,
  Row,
  Col,
  message,
  Spin,
} from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { CartItem, ProductStatus } from '@/types';

const { Title, Text } = Typography;

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { items, getTotalPrice, getValidItems, fetchCart, updateQuantity, removeItem, isLoading } =
    useCartStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleQuantityChange = (itemId: string, value: number | null) => {
    if (value && value > 0) {
      updateQuantity(itemId, value);
    }
  };

  const handleRemove = (itemId: string) => {
    removeItem(itemId);
    message.success('已移除商品');
  };

  const validItems = getValidItems();
  const totalPrice = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const columns = [
    {
      title: '商品信息',
      dataIndex: 'product',
      key: 'product',
      render: (_: unknown, record: CartItem) => (
        <Link to={`/products/${record.productId}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundImage: record.product.coverImage
                ? `url(${record.product.coverImage})`
                : `linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.product.name}
            </div>
            <div style={{ marginTop: '4px' }}>
              {record.product.status !== ProductStatus.ON_SALE && (
                <Tag color="red">已下架</Tag>
              )}
            </div>
          </div>
        </Link>
      ),
    },
    {
      title: '单价',
      dataIndex: 'product',
      key: 'price',
      align: 'center' as const,
      render: (_: unknown, record: CartItem) => (
        <Text strong style={{ color: '#c41e3a', fontSize: '16px' }}>
          ¥{record.product.price}
        </Text>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
      render: (value: number, record: CartItem) => (
        <InputNumber
          min={1}
          max={99}
          value={value}
          onChange={(newVal) => handleQuantityChange(record.id, newVal)}
          disabled={record.product.status !== ProductStatus.ON_SALE}
        />
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      align: 'center' as const,
      render: (_: unknown, record: CartItem) => (
        <Text strong style={{ color: '#c41e3a', fontSize: '18px' }}>
          ¥{(record.product.price * record.quantity).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      render: (_: unknown, record: CartItem) => (
        <Popconfirm
          title="确定要移除该商品吗？"
          onConfirm={() => handleRemove(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Empty
          description={
            <div>
              <p>请先登录后查看购物车</p>
              <Button type="primary" onClick={() => navigate('/login')}>
                立即登录
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <ShoppingCartOutlined style={{ marginRight: '8px' }} />
        购物车
      </Title>

      {items.length === 0 ? (
        <Card>
          <Empty
            description={
              <div>
                <p style={{ marginBottom: '16px' }}>购物车是空的，快去选购心仪的商品吧！</p>
                <Link to="/products">
                  <Button type="primary" icon={<ArrowRightOutlined />}>
                    去逛逛
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {items.length > validItems.length && (
            <Card style={{ marginBottom: '16px' }}>
              <Text type="warning">
                购物车中有 {items.length - validItems.length} 件商品已下架，将无法结算
              </Text>
            </Card>
          )}

          <Card>
            <Table
              columns={columns}
              dataSource={items}
              rowKey="id"
              pagination={false}
              footer={() => (
                <Row justify="end" align="middle" gutter={[16, 0]}>
                  <Col>
                    <Text type="secondary">
                      共 {validItems.length} 件商品
                    </Text>
                  </Col>
                  <Col>
                    <Space>
                      <Text>合计：</Text>
                      <Text strong style={{ fontSize: '24px', color: '#c41e3a' }}>
                        ¥{totalPrice.toFixed(2)}
                      </Text>
                    </Space>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      size="large"
                      disabled={validItems.length === 0}
                      onClick={() => message.info('结算功能开发中')}
                    >
                      去结算
                    </Button>
                  </Col>
                </Row>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default CartPage;
