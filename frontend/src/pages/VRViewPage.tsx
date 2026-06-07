import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Tag,
  Card,
  Image,
  Drawer,
  Tooltip,
  Spin,
  Empty,
  Space,
  Row,
  Col,
  Typography,
  Slider,
  Modal,
  Carousel,
  Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  QuestionCircleOutlined,
  SoundOutlined,
  MutedOutlined,
  SyncOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined as ArrowLeftIcon,
  ArrowRightOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  PlaySquareOutlined,
  InfoCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { propertyApi } from '../api';
import type { Property } from '../types';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

interface Hotspot {
  id: number;
  name: string;
  x: number;
  y: number;
  area: number;
  orientation: string;
  description: string;
  image: string;
  facilities: string[];
}

const sceneIcons: Record<string, React.ReactNode> = {
  '客厅': <HomeOutlined />,
  '主卧': <BulbOutlined />,
  '次卧': <BulbOutlined />,
  '厨房': <HomeOutlined />,
  '卫生间': <EnvironmentOutlined />,
  '阳台': <EnvironmentOutlined />,
};

const VRViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentScene, setCurrentScene] = useState<string>('客厅');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });
  const [helpVisible, setHelpVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { data: propertyData, loading: propertyLoading } = useRequest(
    () => propertyApi.getById(propertyId),
    { ready: !!propertyId }
  );

  const property = propertyData?.data;

  const images = useMemo(() => {
    if (!property?.images) return [];
    if (typeof property.images === 'string') {
      try {
        return JSON.parse(property.images);
      } catch {
        return [];
      }
    }
    return property.images;
  }, [property?.images]);

  const hotspots = useMemo(() => {
    if (!property?.hotspots) return [];
    if (typeof property.hotspots === 'string') {
      try {
        return JSON.parse(property.hotspots);
      } catch {
        return [];
      }
    }
    return property.hotspots;
  }, [property?.hotspots]);

  const sceneList = useMemo(() => {
    const scenes = hotspots.map((h: Hotspot) => h.name);
    return scenes.length > 0 ? scenes : ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台'];
  }, [hotspots]);

  const currentSceneIndex = useMemo(() => {
    return Math.max(0, sceneList.findIndex((s: string) => s === currentScene));
  }, [currentScene, sceneList]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setViewAngle((prev) => ({
        ...prev,
        y: (prev.y + 0.5) % 360,
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') return `¥${price.toLocaleString()}/月`;
    return `¥${(price / 10000).toFixed(0)}万`;
  };

  const handleSceneChange = (scene: string) => {
    setCurrentScene(scene);
    const hotspot = hotspots.find((h: Hotspot) => h.name === scene);
    if (hotspot) {
      setSelectedHotspot(hotspot);
      setDrawerVisible(true);
    }
    setViewAngle({ x: 0, y: 0 });
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setDrawerVisible(true);
    setCurrentScene(hotspot.name);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleViewChange = (direction: 'up' | 'down' | 'left' | 'right') => {
    setViewAngle((prev) => {
      switch (direction) {
        case 'up':
          return { ...prev, x: Math.min(prev.x + 10, 45) };
        case 'down':
          return { ...prev, x: Math.max(prev.x - 10, -45) };
        case 'left':
          return { ...prev, y: prev.y - 10 };
        case 'right':
          return { ...prev, y: prev.y + 10 };
        default:
          return prev;
      }
    });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setViewAngle((prev) => ({
      x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.3)),
      y: prev.y + deltaX * 0.5,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (propertyLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="加载VR数据中..." />
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Empty description="房源不存在或已下架" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#000' }}>
      <Header
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ color: '#fff' }} />}
            onClick={() => navigate(-1)}
            style={{ color: '#fff' }}
          >
            返回
          </Button>
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18 }}>
              {property.title}
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <Text style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 600 }}>
                {formatPrice(property.price, property.type)}
              </Text>
              <Text style={{ color: '#999', fontSize: 13 }}>
                {property.bedrooms}室{property.livingrooms}厅{property.bathrooms}卫 · {property.area}㎡
              </Text>
              <Tag color="purple" icon={<PlaySquareOutlined />}>
                VR全景
              </Tag>
            </div>
          </div>
        </div>

        <Space size="middle">
          <Tooltip title="帮助">
            <Button
              type="text"
              icon={<QuestionCircleOutlined style={{ color: '#fff' }} />}
              onClick={() => setHelpVisible(true)}
            />
          </Tooltip>
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏模式'}>
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined style={{ color: '#fff' }} /> : <FullscreenOutlined style={{ color: '#fff' }} />}
              onClick={handleFullscreen}
            />
          </Tooltip>
          <Button
            type="primary"
            onClick={() => navigate(`/properties/${propertyId}`)}
          >
            查看详情
          </Button>
        </Space>
      </Header>

      <Layout>
        <Sider
          width={200}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            borderRight: '1px solid #333',
            padding: '16px 0',
          }}
        >
          <div style={{ padding: '0 16px 12px', color: '#fff', fontSize: 14, fontWeight: 500 }}>
            场景列表
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sceneList.map((scene: string, index: number) => (
              <Button
                key={scene}
                type={currentScene === scene ? 'primary' : 'text'}
                icon={sceneIcons[scene] || <HomeOutlined />}
                onClick={() => handleSceneChange(scene)}
                style={{
                  justifyContent: 'flex-start',
                  color: currentScene === scene ? '#fff' : '#ccc',
                  background: currentScene === scene ? '#1677ff' : 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  padding: '0 16px',
                  height: 44,
                }}
              >
                {scene}
              </Button>
            ))}
          </div>
        </Sider>

        <Content
          ref={containerRef}
          style={{
            position: 'relative',
            background: '#000',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 600,
            }}
          >
            <Carousel
              autoplay={autoRotate}
              autoplaySpeed={3000}
              dots={false}
              effect="fade"
              style={{ width: '100%', height: '100%' }}
            >
              {images.length > 0 ? (
                images.map((img: string, index: number) => (
                  <div key={index} style={{ width: '100%', height: '100%' }}>
                    <div
                      style={{
                        width: '100%',
                        height: 600,
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: `scale(${zoom}) rotateY(${viewAngle.y}deg) rotateX(${viewAngle.x}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                      }}
                    />
                  </div>
                ))
              ) : (
                <div>
                  <div
                    style={{
                      width: '100%',
                      height: 600,
                      backgroundImage: 'url(https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transform: `scale(${zoom}) rotateY(${viewAngle.y}deg) rotateX(${viewAngle.x}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.3s ease',
                    }}
                  />
                </div>
              )}
            </Carousel>

            {hotspots.map((hotspot: Hotspot) => (
              <div
                key={hotspot.id}
                className="hotspot-marker"
                style={{
                  position: 'absolute',
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHotspotClick(hotspot);
                }}
              >
                <Tooltip title={hotspot.name}>
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
            ))}

            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
              }}
            >
              {currentScene}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'rgba(0, 0, 0, 0.75)',
                padding: '12px 24px',
                borderRadius: 32,
              }}
            >
              <Tooltip title="缩小">
                <Button
                  type="text"
                  icon={<ZoomOutOutlined style={{ color: '#fff' }} />}
                  onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                  style={{ color: '#fff' }}
                />
              </Tooltip>
              <Text style={{ color: '#fff', minWidth: 50, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </Text>
              <Tooltip title="放大">
                <Button
                  type="text"
                  icon={<ZoomInOutlined style={{ color: '#fff' }} />}
                  onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                  style={{ color: '#fff' }}
                />
              </Tooltip>

              <div style={{ width: 1, height: 24, background: '#444' }} />

              <Tooltip title="自动旋转">
                <Button
                  type={autoRotate ? 'primary' : 'text'}
                  icon={autoRotate ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={(e) => { e.stopPropagation(); setAutoRotate(!autoRotate); }}
                  style={{ color: autoRotate ? '#fff' : '#fff' }}
                />
              </Tooltip>

              <div style={{ width: 1, height: 24, background: '#444' }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUpOutlined style={{ color: '#fff' }} />}
                  onClick={(e) => { e.stopPropagation(); handleViewChange('up'); }}
                  style={{ color: '#fff', padding: 0, width: 32, height: 24 }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowLeftIcon style={{ color: '#fff' }} />}
                    onClick={(e) => { e.stopPropagation(); handleViewChange('left'); }}
                    style={{ color: '#fff', padding: 0, width: 32, height: 24 }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<SyncOutlined style={{ color: '#fff' }} />}
                    onClick={(e) => { e.stopPropagation(); setViewAngle({ x: 0, y: 0 }); setZoom(1); }}
                    style={{ color: '#fff', padding: 0, width: 32, height: 24 }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowRightOutlined style={{ color: '#fff' }} />}
                    onClick={(e) => { e.stopPropagation(); handleViewChange('right'); }}
                    style={{ color: '#fff', padding: 0, width: 32, height: 24 }}
                  />
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined style={{ color: '#fff' }} />}
                  onClick={(e) => { e.stopPropagation(); handleViewChange('down'); }}
                  style={{ color: '#fff', padding: 0, width: 32, height: 24 }}
                />
              </div>

              <div style={{ width: 1, height: 24, background: '#444' }} />

              <Tooltip title={isMuted ? '取消静音' : '静音'}>
                <Button
                  type="text"
                  icon={isMuted ? <MutedOutlined style={{ color: '#fff' }} /> : <SoundOutlined style={{ color: '#fff' }} />}
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                  style={{ color: '#fff' }}
                />
              </Tooltip>
              {!isMuted && (
                <Slider
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(value) => setVolume(value)}
                  style={{ width: 80 }}
                />
              )}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 100,
                left: 24,
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#ccc',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              提示：拖拽画面可切换视角
            </div>
          </div>
        </Content>

        <Sider
          width={320}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            borderLeft: '1px solid #333',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 500, marginBottom: 16 }}>
            热点信息
          </div>

          {selectedHotspot ? (
            <Card
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #333',
              }}
              bodyStyle={{ padding: 16 }}
              cover={
                <Image
                  src={selectedHotspot.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'}
                  alt={selectedHotspot.name}
                  height={180}
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';
                  }}
                />
              }
            >
              <Title level={4} style={{ color: '#fff', margin: '0 0 12px 0' }}>
                {selectedHotspot.name}
              </Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ color: '#999', fontSize: 12 }}>面积</div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
                      {selectedHotspot.area}㎡
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#999', fontSize: 12 }}>朝向</div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
                      {selectedHotspot.orientation}
                    </div>
                  </Col>
                </Row>

                <div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>装修描述</div>
                  <Paragraph style={{ color: '#ccc', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    {selectedHotspot.description}
                  </Paragraph>
                </div>

                {selectedHotspot.facilities && selectedHotspot.facilities.length > 0 && (
                  <div>
                    <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>相关设施</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedHotspot.facilities.map((facility: string, index: number) => (
                        <Tag key={index} color="blue" style={{ margin: 0 }}>
                          {facility}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          ) : (
            <Empty
              description={
                <span style={{ color: '#666' }}>
                  点击VR视图中的热点标记<br />查看房间详情
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 60 }}
            />
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
              所有热点
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hotspots.map((hotspot: Hotspot) => (
                <Card
                  key={hotspot.id}
                  size="small"
                  hoverable
                  style={{
                    background: selectedHotspot?.id === hotspot.id ? 'rgba(22, 119, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedHotspot?.id === hotspot.id ? '1px solid #1677ff' : '1px solid #333',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleHotspotClick(hotspot)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      className="hotspot-marker"
                      style={{ width: 20, height: 20, fontSize: 10, animation: 'none' }}
                    >
                      <InfoCircleOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                        {hotspot.name}
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        {hotspot.area}㎡ · {hotspot.orientation}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Sider>
      </Layout>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
            <span>{selectedHotspot?.name} 详情</span>
          </div>
        }
        placement="right"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={360}
        className="detail-drawer"
      >
        {selectedHotspot && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Image
              src={selectedHotspot.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'}
              alt={selectedHotspot.name}
              height={200}
              style={{ width: '100%', objectFit: 'cover', borderRadius: 8 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
              }}
            />

            <Card size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="房间名称">{selectedHotspot.name}</Descriptions.Item>
                <Descriptions.Item label="面积">{selectedHotspot.area}㎡</Descriptions.Item>
                <Descriptions.Item label="朝向">{selectedHotspot.orientation}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="装修描述">
              <Paragraph style={{ margin: 0, lineHeight: 1.8 }}>
                {selectedHotspot.description}
              </Paragraph>
            </Card>

            {selectedHotspot.facilities && selectedHotspot.facilities.length > 0 && (
              <Card size="small" title="相关设施">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedHotspot.facilities.map((facility: string, index: number) => (
                    <Tag key={index} color="blue">
                      {facility}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title="VR看房帮助"
        open={helpVisible}
        onCancel={() => setHelpVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setHelpVisible(false)}>
            我知道了
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>视角控制</div>
            <ul style={{ color: '#666', margin: 0, paddingLeft: 20 }}>
              <li>拖拽画面可自由切换视角</li>
              <li>使用方向按钮可上下左右调整视角</li>
              <li>点击重置按钮可恢复初始视角</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>缩放控制</div>
            <ul style={{ color: '#666', margin: 0, paddingLeft: 20 }}>
              <li>点击 +/- 按钮可放大/缩小画面</li>
              <li>支持 50% - 200% 缩放范围</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>热点标记</div>
            <ul style={{ color: '#666', margin: 0, paddingLeft: 20 }}>
              <li>红色脉冲标记为热点</li>
              <li>点击热点可查看房间详细信息</li>
              <li>也可在左侧场景列表中快速切换</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>其他功能</div>
            <ul style={{ color: '#666', margin: 0, paddingLeft: 20 }}>
              <li>自动旋转：自动360°展示房源</li>
              <li>全屏模式：沉浸式看房体验</li>
              <li>音量控制：调节背景音乐音量</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default VRViewPage;
