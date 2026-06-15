import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Typography,
  Space,
  message,
  Spin,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import apiClient from '../../api/client';

const { Title, Text } = Typography;

interface ShowroomDetail {
  id: string;
  name: string;
  style: string;
  model_url: string;
  thumbnail_url: string;
  description: string;
  store_id?: string;
  created_at: string;
  store_name?: string;
  store_city?: string;
  store_address?: string;
}

const styleColors: Record<string, string> = {
  现代简约: 'blue',
  北欧风格: 'cyan',
  中式风格: 'gold',
  欧式古典: 'purple',
  日式风格: 'geekblue',
  美式乡村: 'green',
  轻奢风格: 'magenta',
  工业风格: 'default',
};

const ShowroomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number>(0);
  const [showroom, setShowroom] = useState<ShowroomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/showroom/${id}`);
        setShowroom(res.data);
      } catch (error) {
        message.error('获取样板间详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(8, 6, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xffeedd, 0.4, 20);
    pointLight1.position.set(-5, 5, -5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffeedd, 0.4, 20);
    pointLight2.position.set(5, 5, 5);
    scene.add(pointLight2);

    const floorGeometry = new THREE.PlaneGeometry(12, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4c4a8,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.9,
      metalness: 0.0,
    });

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 6),
      wallMaterial
    );
    backWall.position.set(0, 3, -5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      wallMaterial
    );
    leftWall.position.set(-6, 3, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const accentWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.7,
      metalness: 0.1,
    });
    const accentWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      accentWallMaterial
    );
    accentWall.position.set(6, 3, 0);
    accentWall.rotation.y = -Math.PI / 2;
    accentWall.receiveShadow = true;
    scene.add(accentWall);

    const sofaGroup = new THREE.Group();

    const sofaBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a6fa5,
      roughness: 0.8,
      metalness: 0.1,
    });

    const sofaBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.6, 1.2),
      sofaBaseMaterial
    );
    sofaBase.position.y = 0.3;
    sofaBase.castShadow = true;
    sofaBase.receiveShadow = true;
    sofaGroup.add(sofaBase);

    const sofaBack = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.0, 0.2),
      sofaBaseMaterial
    );
    sofaBack.position.set(0, 1.1, -0.5);
    sofaBack.castShadow = true;
    sofaGroup.add(sofaBack);

    const armrestMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a5a85,
      roughness: 0.8,
      metalness: 0.1,
    });

    const leftArmrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 1.2),
      armrestMaterial
    );
    leftArmrest.position.set(-1.65, 0.7, 0);
    leftArmrest.castShadow = true;
    sofaGroup.add(leftArmrest);

    const rightArmrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 1.2),
      armrestMaterial
    );
    rightArmrest.position.set(1.65, 0.7, 0);
    rightArmrest.castShadow = true;
    sofaGroup.add(rightArmrest);

    const cushionMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a7fb5,
      roughness: 0.7,
      metalness: 0.1,
    });

    for (let i = 0; i < 3; i++) {
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.3, 1.0),
        cushionMaterial
      );
      cushion.position.set(-1.0 + i * 1.0, 0.75, 0);
      cushion.castShadow = true;
      sofaGroup.add(cushion);
    }

    sofaGroup.position.set(0, 0, -3);
    scene.add(sofaGroup);

    const coffeeTableGroup = new THREE.Group();

    const tableTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.6,
      metalness: 0.2,
    });

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 1.0),
      tableTopMaterial
    );
    tableTop.position.y = 0.5;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    coffeeTableGroup.add(tableTop);

    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.6,
      metalness: 0.3,
    });

    const legPositions = [
      [-0.8, 0.25, -0.4],
      [0.8, 0.25, -0.4],
      [-0.8, 0.25, 0.4],
      [0.8, 0.25, 0.4],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5),
        legMaterial
      );
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      coffeeTableGroup.add(leg);
    });

    coffeeTableGroup.position.set(0, 0, -0.5);
    scene.add(coffeeTableGroup);

    const tvStandGroup = new THREE.Group();

    const standMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.5,
      metalness: 0.3,
    });

    const standBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.5, 0.5),
      standMaterial
    );
    standBase.position.y = 0.25;
    standBase.castShadow = true;
    tvStandGroup.add(standBase);

    const standShelf = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.1, 0.45),
      standMaterial
    );
    standShelf.position.y = 0.55;
    standShelf.castShadow = true;
    tvStandGroup.add(standShelf);

    const tvScreenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.1,
      metalness: 0.8,
    });

    const tvFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.3, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.3,
        metalness: 0.5,
      })
    );
    tvFrame.position.set(0, 1.5, 0);
    tvFrame.castShadow = true;
    tvStandGroup.add(tvFrame);

    const tvScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.1),
      tvScreenMaterial
    );
    tvScreen.position.set(0, 1.5, 0.06);
    tvStandGroup.add(tvScreen);

    tvStandGroup.position.set(0, 0, -4.7);
    scene.add(tvStandGroup);

    const floorLampGroup = new THREE.Group();

    const lampPoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.3,
      metalness: 0.7,
    });

    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 2.5, 16),
      lampPoleMaterial
    );
    lampPole.position.y = 1.25;
    lampPole.castShadow = true;
    floorLampGroup.add(lampPole);

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.1, 16),
      lampPoleMaterial
    );
    lampBase.position.y = 0.05;
    lampBase.castShadow = true;
    floorLampGroup.add(lampBase);

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.6, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xf5deb3,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
      })
    );
    lampShade.position.y = 2.5;
    lampShade.castShadow = true;
    floorLampGroup.add(lampShade);

    const lampLight = new THREE.PointLight(0xffe4b5, 0.6, 5);
    lampLight.position.y = 2.3;
    floorLampGroup.add(lampLight);

    floorLampGroup.position.set(4.5, 0, -3);
    scene.add(floorLampGroup);

    const rugGeometry = new THREE.PlaneGeometry(5, 4);
    const rugMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4a35a,
      roughness: 0.9,
      metalness: 0.0,
    });
    const rug = new THREE.Mesh(rugGeometry, rugMaterial);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, -1.5);
    rug.receiveShadow = true;
    scene.add(rug);

    const plantGroup = new THREE.Group();

    const potMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1,
    });

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.4, 16),
      potMaterial
    );
    pot.position.y = 0.2;
    pot.castShadow = true;
    plantGroup.add(pot);

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.8,
      metalness: 0.0,
    });

    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        leafMaterial
      );
      const angle = (i / 5) * Math.PI * 2;
      leaf.position.set(
        Math.cos(angle) * 0.15,
        0.6 + Math.sin(i * 0.5) * 0.1,
        Math.sin(angle) * 0.15
      );
      leaf.scale.set(1, 1.2, 0.8);
      leaf.castShadow = true;
      plantGroup.add(leaf);
    }

    plantGroup.position.set(-4.5, 0, -3);
    scene.add(plantGroup);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
    setModelLoading(false);

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(8, 6, 8);
      controlsRef.current.target.set(0, 1, 0);
      controlsRef.current.update();
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/showroom')}>
            返回列表
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            <ShopOutlined style={{ marginRight: 8 }} />
            样板间详情
          </Title>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleResetView}>
            重置视角
          </Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFullscreen}>
            全屏
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {showroom && (
          <Row gutter={24}>
            <Col span={24}>
              <Card
                style={{ marginBottom: 24 }}
                title={
                  <Space>
                    <Text strong style={{ fontSize: 18 }}>{showroom.name}</Text>
                    <Tag color={styleColors[showroom.style] || 'default'}>
                      {showroom.style}
                    </Tag>
                  </Space>
                }
                extra={
                  <Text type="secondary">
                    鼠标拖拽旋转 · 滚轮缩放
                  </Text>
                }
              >
                <div
                  ref={containerRef}
                  style={{
                    width: '100%',
                    height: 600,
                    position: 'relative',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  {modelLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.9)',
                        zIndex: 10,
                      }}
                    >
                      <Space direction="vertical" align="center">
                        <Spin size="large" />
                        <Text type="secondary">3D场景加载中...</Text>
                      </Space>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="基本信息">
                <Descriptions column={3}>
                  <Descriptions.Item label="样板间名称">
                    {showroom.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="风格">
                    <Tag color={styleColors[showroom.style] || 'default'}>
                      {showroom.style}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="所属门店">
                    {showroom.store_name || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="所在城市">
                    {showroom.store_city || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="门店地址" span={2}>
                    {showroom.store_address || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="描述" span={3}>
                    {showroom.description}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default ShowroomDetail;
