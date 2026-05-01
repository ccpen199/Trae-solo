import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Tag, 
  Badge, 
  Modal, 
  InputNumber, 
  message,
  Popover,
  Statistic,
  Avatar,
  Input as As
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  HeartOutlined,
  SendOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  VideoCameraOutlined,
  UserOutlined,
  FireOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import { useAuthStore, useLiveStore } from '../store';
import { liveApi, flashSaleApi, orderApi } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;

function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { 
    currentLive, 
    viewerCount, 
    likeCount, 
    messages, 
    products,
    activeFlashSales,
    addMessage,
    setProducts,
    setCurrentLive,
    setViewerCount,
    setLikeCount,
    setActiveFlashSales,
    addFlashSale,
    removeFlashSale,
    clearLive
  } = useLiveStore();

  const socketRef = useRef(null);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [flashSalePrice, setFlashSalePrice] = useState(0);
  const [flashSaleStock, setFlashSaleStock] = useState(10);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [pendingFlashSale, setPendingFlashSale] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadLiveData();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearLive();
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadLiveData = async () => {
    setLoading(true);
    try {
      const [liveResult, messagesResult] = await Promise.all([
        liveApi.getById(id),
        liveApi.getMessages(id, 100, 0)
      ]);

      if (liveResult.success) {
        setCurrentLive(liveResult.data);
        setProducts(liveResult.data.products || []);
      }

      if (messagesResult.success) {
        messagesResult.data.list?.forEach(msg => {
          addMessage({
            id: msg.id,
            userId: msg.user_id,
            nickname: msg.nickname || msg.username,
            content: msg.content,
            createdAt: msg.created_at
          });
        });
      }

      try {
        const flashSaleResult = await flashSaleApi.getByLive(id);
        if (flashSaleResult.success) {
          setActiveFlashSales(flashSaleResult.data || []);
        }
      } catch (e) {
        console.log('加载秒杀活动失败');
      }

      connectWebSocket();

    } catch (error) {
      message.error('加载直播间失败');
      navigate('/lives');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!token) return;

    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket 连接成功');
      
      socketRef.current.emit('join_live', { liveStreamId: id });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket 断开连接');
    });

    socketRef.current.on('chat_message', (msg) => {
      addMessage(msg);
    });

    socketRef.current.on('viewer_count', (data) => {
      setViewerCount(data.viewerCount);
    });

    socketRef.current.on('like_count', (data) => {
      setLikeCount(data.likeCount);
    });

    socketRef.current.on('flash_sale_start', (data) => {
      addFlashSale(data);
      showFlashSalePopup(data);
    });

    socketRef.current.on('flash_sale_end', (data) => {
      removeFlashSale(data.flashSaleId);
    });

    socketRef.current.on('order_update', (data) => {
      message.info(`订单 ${data.orderNo} 状态更新: ${data.status}`);
    });

    socketRef.current.on('joined_live', (data) => {
      setViewerCount(data.viewerCount);
      setLikeCount(data.likeCount);
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket 错误:', error);
    });
  };

  const showFlashSalePopup = (data) => {
    Modal.success({
      title: '🔥 秒杀活动开始！',
      content: (
        <div style={{ textAlign: 'center' }}>
          <h3>{data.productName}</h3>
          <div style={{ margin: '16px 0' }}>
            <span style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>
              ¥{data.flashPrice}
            </span>
            <span style={{ marginLeft: 8, color: '#999', textDecoration: 'line-through' }}>
              原价
            </span>
          </div>
          <p>库存: {data.flashStock} 件</p>
        </div>
      ),
      okText: '立即抢购'
    });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) {
      return;
    }

    if (!socketRef.current || !isConnected) {
      message.warning('WebSocket 未连接');
      return;
    }

    socketRef.current.emit('send_message', {
      liveStreamId: id,
      content: messageInput.trim()
    });

    setMessageInput('');
  };

  const handleSendLike = () => {
    if (!socketRef.current || !isConnected) {
      message.warning('WebSocket 未连接');
      return;
    }

    socketRef.current.emit('send_like', {
      liveStreamId: id,
      count: 1
    });

    message.success('已点赞！');
  };

  const handleCreateFlashSale = (product) => {
    setSelectedProduct(product);
    setFlashSalePrice(product.price * 0.8);
    setFlashSaleStock(Math.min(product.stock, 100));
    setShowFlashSaleModal(true);
  };

  const handleConfirmFlashSale = async () => {
    if (!selectedProduct) return;

    setFlashSaleLoading(true);
    try {
      const result = await flashSaleApi.create({
        liveStreamId: id,
        liveProductId: selectedProduct.id,
        flashPrice: flashSalePrice,
        flashStock: flashSaleStock
      });

      if (result.success) {
        message.success('秒杀活动已创建并广播');
        setShowFlashSaleModal(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      message.error('创建秒杀活动失败');
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const handleFlashSaleRequest = async (flashSale) => {
    Modal.confirm({
      title: '确认抢购',
      content: `确定要抢购 ${flashSale.product_name || flashSale.name} 吗？`,
      onOk: async () => {
        try {
          const result = await flashSaleApi.request(flashSale.id, 1);
          
          if (result.success) {
            message.info('抢购请求已提交，请等待结果...');

            const checkResult = async () => {
              try {
                const resultData = await flashSaleApi.getResult(flashSale.id);
                if (resultData.success) {
                  if (resultData.data?.data) {
                    if (resultData.data.success) {
                      Modal.success({
                        title: '🎉 秒杀成功！',
                        content: (
                          <div>
                            <p>订单号: {resultData.data.data.orderNo}</p>
                            <p>金额: ¥{resultData.data.data.totalAmount?.toFixed(2)}</p>
                            <p>请在30分钟内完成支付</p>
                          </div>
                        ),
                        onOk: () => {
                          navigate('/orders');
                        }
                      });
                    } else {
                      message.error(resultData.data.message || '秒杀失败');
                    }
                  } else {
                    setTimeout(checkResult, 1000);
                  }
                }
              } catch (e) {
                setTimeout(checkResult, 1000);
              }
            };

            setTimeout(checkResult, 500);
          }
        } catch (error) {
          message.error('抢购请求失败');
        }
      }
    });
  };

  const handleBuyProduct = async (product) => {
    Modal.confirm({
      title: '确认购买',
      content: (
        <div>
          <p>商品: {product.name}</p>
          <p>价格: ¥{product.flash_price || product.price}</p>
          <p>库存: {product.total_stock || product.stock}</p>
        </div>
      ),
      onOk: async () => {
        try {
          const result = await orderApi.create({
            productId: product.product_id || product.id,
            quantity: 1,
            liveStreamId: id
          });

          if (result.success) {
            message.success('订单创建成功，请支付');
            navigate('/orders');
          }
        } catch (error) {
          message.error('创建订单失败');
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="live-container">
      <div className="video-section">
        <div className="video-player">
          <div style={{ textAlign: 'center' }}>
            <VideoCameraOutlined style={{ fontSize: 64, color: '#fff', marginBottom: 16 }} />
            <h3 style={{ color: '#fff' }}>{currentLive?.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              主播: {currentLive?.streamer_name || '主播'}
            </p>
          </div>
        </div>

        {currentLive?.status === 'live' && (
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>直播中</span>
            {!isConnected && <Tag color="orange" style={{ marginLeft: 8 }}>连接中...</Tag>}
          </div>
        )}

        <div className="viewer-count">
          <UserOutlined />
          <span>{viewerCount}</span>
          <span style={{ marginLeft: 16 }}>
            <HeartOutlined /> {likeCount}
          </span>
        </div>

        {user?.role === 'streamer' && currentLive?.status === 'live' && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            padding: '12px 24px',
            borderRadius: 24,
            display: 'flex',
            gap: 16
          }}>
            <Button
              type="primary"
              icon={<HeartOutlined />}
              onClick={handleSendLike}
            >
              点赞
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => liveApi.end(id).then(() => {
                message.success('直播已结束');
                navigate('/lives');
              })}
            >
              结束直播
            </Button>
          </div>
        )}

        {user?.role === 'viewer' && currentLive?.status === 'live' && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            padding: '12px 24px',
            borderRadius: 24,
            display: 'flex',
            gap: 16
          }}>
            <Button
              type="primary"
              icon={<HeartOutlined />}
              onClick={handleSendLike}
            >
              点赞
            </Button>
            <Button
              icon={<GiftOutlined />}
              onClick={() => message.info('送礼物功能开发中')}
            >
              送礼物
            </Button>
          </div>
        )}
      </div>

      <div className="chat-section">
        <div className="chat-header">
          <span>互动聊天</span>
          <Badge count={messages.length} />
        </div>
        <div className="chat-messages" ref={messagesEndRef}>
          {messages.map((msg, index) => (
            <div key={msg.id || index} className="chat-message">
              <span className="nickname">{msg.nickname || msg.username || '匿名'}:</span>
              <span className="content">{msg.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <Input.Search
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onSearch={handleSendMessage}
            placeholder="说点什么..."
            enterButton={<SendOutlined />}
            size="large"
            onPressEnter={handleSendMessage}
          />
        </div>
      </div>

      <div className="product-section">
        <div className="product-header">
          <ShoppingOutlined style={{ marginRight: 8 }} />
          商品橱窗
        </div>
        <div className="product-list">
          {activeFlashSales.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#ff4d4f', marginBottom: 8 }}>
                <FireOutlined style={{ marginRight: 4 }} />
                限时秒杀
              </h4>
              {activeFlashSales.map((sale) => (
                <div key={sale.id} className="product-card flash-sale">
                  <span className="flash-tag">限时秒杀</span>
                  <div className="product-name">{sale.product_name || sale.name}</div>
                  <div className="product-price">
                    <span className="current-price">¥{sale.flash_price || sale.flashPrice}</span>
                  </div>
                  <div className="stock-info">
                    剩余库存: {sale.remainingStock !== undefined ? sale.remainingStock : sale.flash_stock || sale.flashStock}
                  </div>
                  <Button
                    type="primary"
                    danger
                    block
                    onClick={() => handleFlashSaleRequest(sale)}
                  >
                    立即抢购
                  </Button>
                </div>
              ))}
            </div>
          )}

          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-name">{product.name}</div>
              <div className="product-price">
                <span className="current-price">¥{product.flash_price || product.price}</span>
                {product.original_price && (
                  <span className="original-price">¥{product.original_price}</span>
                )}
              </div>
              <div className="stock-info">
                库存: {product.total_stock || product.stock}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  block
                  onClick={() => handleBuyProduct(product)}
                >
                  立即购买
                </Button>
                {user?.role === 'streamer' && currentLive?.status === 'live' && (
                  <Button
                    type="default"
                    onClick={() => handleCreateFlashSale(product)}
                  >
                    发起秒杀
                  </Button>
                )}
              </div>
            </div>
          ))}

          {products.length === 0 && activeFlashSales.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
              暂无商品
            </div>
          )}
        </div>
      </div>

      <Modal
        title="发起秒杀活动"
        open={showFlashSaleModal}
        onOk={handleConfirmFlashSale}
        onCancel={() => {
          setShowFlashSaleModal(false);
          setSelectedProduct(null);
        }}
        confirmLoading={flashSaleLoading}
        okText="确认发起"
        cancelText="取消"
      >
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>商品信息</h4>
              <p>{selectedProduct.name}</p>
              <p>原价: ¥{selectedProduct.price}</p>
              <p>库存: {selectedProduct.total_stock || selectedProduct.stock}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4>秒杀设置</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>秒杀价格</label>
                <InputNumber
                  min={0.01}
                  max={selectedProduct.price}
                  step={0.01}
                  precision={2}
                  value={flashSalePrice}
                  onChange={setFlashSalePrice}
                  style={{ width: '100%' }}
                  placeholder="请输入秒杀价格"
                  prefix="¥"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>秒杀库存</label>
                <InputNumber
                  min={1}
                  max={selectedProduct.total_stock || selectedProduct.stock}
                  value={flashSaleStock}
                  onChange={setFlashSaleStock}
                  style={{ width: '100%' }}
                  placeholder="请输入秒杀库存"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LiveRoom;
