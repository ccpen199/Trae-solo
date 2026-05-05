import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Image, Button, Tag, Descriptions, Space, Input,
  List, Avatar, message, Modal, Form, InputNumber, Empty
} from 'antd';
import {
  HeartOutlined, HeartFilled, ShoppingCartOutlined, MessageOutlined,
  EyeOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined,
  EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { productApi, favoriteApi, messageApi, orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { confirm } = Modal;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProduct();
    fetchMessages();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await productApi.getById(id);
      setProduct(data);
    } catch (error) {
      console.error('获取商品详情失败:', error);
      message.error('商品不存在');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await messageApi.getProductMessages(id, { page: 1, limit: 50 });
      setMessages(data.messages || []);
    } catch (error) {
      console.error('获取留言失败:', error);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      const data = await favoriteApi.toggle(id);
      setProduct(prev => ({ ...prev, is_favorite: data.is_favorite }));
      message.success(data.is_favorite ? '收藏成功' : '已取消收藏');
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (!newMessage.trim()) {
      message.warning('请输入留言内容');
      return;
    }

    setMessageLoading(true);
    try {
      await messageApi.create({
        product_id: id,
        content: newMessage
      });
      message.success('留言成功');
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('留言失败:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleCreateOrder = async (values) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (product.user_id === user?.id) {
      message.warning('不能购买自己发布的商品');
      return;
    }

    setOrderLoading(true);
    try {
      const data = await orderApi.create({
        product_id: id,
        quantity: values.quantity || 1,
        buyer_message: values.buyer_message
      });
      message.success('订单创建成功');
      setOrderModalVisible(false);
      form.resetFields();
      navigate(`/orders`);
    } catch (error) {
      console.error('创建订单失败:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await productApi.delete(id);
          message.success('商品已删除');
          navigate('/my-products');
        } catch (error) {
          console.error('删除商品失败:', error);
        }
      }
    });
  };

  const getProductImage = () => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    return ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20product%20image&image_size=square'];
  };

  const getConditionLabel = (condition) => {
    const map = {
      'new': '全新',
      'like_new': '几乎全新',
      'good': '良好',
      'fair': '一般',
      'poor': '较旧'
    };
    return map[condition] || condition;
  };

  const isOwner = user && product && user.id === product.user_id;

  if (!product) {
    return (
      <AppLayout>
        <Card>
          <Empty description="商品不存在" />
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Card loading={loading}>
        <Row gutter={24}>
          <Col span={12}>
            <Image.PreviewGroup>
              <Image
                width="100%"
                height={400}
                src={getProductImage()[0]}
                alt={product.title}
                style={{ objectFit: 'contain', background: '#f5f5f5' }}
              />
              {getProductImage().length > 1 && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {getProductImage().map((img, idx) => (
                    <Image
                      key={idx}
                      width={80}
                      height={80}
                      src={img}
                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                      preview={false}
                    />
                  ))}
                </div>
              )}
            </Image.PreviewGroup>
          </Col>

          <Col span={12}>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>{product.title}</h1>
            
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 32, color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{product.price}
              </span>
              {product.original_price && (
                <span style={{ fontSize: 16, color: '#999', textDecoration: 'line-through', marginLeft: 16 }}>
                  原价 ¥{product.original_price}
                </span>
              )}
            </div>

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="商品分类">{product.category_name}</Descriptions.Item>
              <Descriptions.Item label="新旧程度">
                {product.condition && <Tag color="blue">{getConditionLabel(product.condition)}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="浏览次数"><EyeOutlined /> {product.view_count}</Descriptions.Item>
              <Descriptions.Item label="收藏次数"><HeartOutlined /> {product.favorite_count}</Descriptions.Item>
              {product.location && (
                <Descriptions.Item label="交易地点" span={2}>
                  <EnvironmentOutlined /> {product.location}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="商品描述" size="small" style={{ marginBottom: 16 }}>
              <p>{product.description || '暂无描述'}</p>
            </Card>

            <Card title="卖家信息" size="small" style={{ marginBottom: 16 }}>
              <Space size="large">
                <div>
                  <Avatar size={48} icon={<span style={{ fontSize: 24 }}>{(product.seller_nickname || product.seller_name)?.[0]}</span>} />
                  <span style={{ marginLeft: 8 }}>{product.seller_nickname || product.seller_name}</span>
                </div>
                {product.contact_info && (
                  <Tag color="green"><PhoneOutlined /> {product.contact_info}</Tag>
                )}
              </Space>
            </Card>

            <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
              {isOwner ? (
                <>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/publish/${id}`)}
                  >
                    编辑商品
                  </Button>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                  >
                    删除商品
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    icon={product.is_favorite ? <HeartFilled /> : <HeartOutlined />}
                    onClick={handleFavorite}
                    style={{ color: product.is_favorite ? '#ff4d4f' : undefined }}
                  >
                    {product.is_favorite ? '已收藏' : '收藏'}
                  </Button>
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => setOrderModalVisible(true)}
                  >
                    我想要
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="留言区" style={{ marginTop: 24 }}>
        {isAuthenticated && (
          <div style={{ marginBottom: 24, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            <TextArea
              rows={3}
              placeholder="输入您的留言..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={handleSendMessage}
                loading={messageLoading}
              >
                发表留言
              </Button>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <Empty description="暂无留言" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(msg) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{(msg.sender_nickname || msg.sender_username)?.[0]}</Avatar>}
                  title={
                    <span>
                      {msg.sender_nickname || msg.sender_username}
                      <span style={{ marginLeft: 12, fontSize: 12, color: '#999' }}>
                        {dayjs(msg.created_at).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </span>
                  }
                  description={msg.content}
                />
                {msg.replies && msg.replies.length > 0 && (
                  <div style={{ marginLeft: 48, marginTop: 12, background: '#f9f9f9', padding: 12, borderRadius: 4 }}>
                    {msg.replies.map(reply => (
                      <div key={reply.id} style={{ marginBottom: 8 }}>
                        <span style={{ color: '#1890ff' }}>
                          {reply.sender_nickname || reply.sender_username}
                        </span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                          {dayjs(reply.created_at).format('MM-DD HH:mm')}
                        </span>
                        <div style={{ marginTop: 4 }}>{reply.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="确认购买"
        open={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleCreateOrder}
          initialValues={{ quantity: 1 }}
        >
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row>
              <Col span={6}>
                <Image
                  width={80}
                  height={80}
                  src={getProductImage()[0]}
                  style={{ objectFit: 'cover' }}
                  preview={false}
                />
              </Col>
              <Col span={18}>
                <h4>{product.title}</h4>
                <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
                  ¥{product.price}
                </div>
              </Col>
            </Row>
          </Card>

          <Form.Item
            name="quantity"
            label="购买数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} max={99} style={{ width: 120 }} />
          </Form.Item>

          <Form.Item
            name="buyer_message"
            label="留言给卖家"
          >
            <TextArea rows={3} placeholder="请输入您的需求或联系方式（可选）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setOrderModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={orderLoading}>
                确认下单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default ProductDetail;
