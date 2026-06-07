import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft,
  Eye,
  Building2,
  MapPin,
  Home,
  Users,
  Camera,
  Info,
  Move,
  ZoomIn,
  MousePointer,
  ChevronRight,
  X,
  Navigation,
  Sparkles,
} from 'lucide-react';
import api, { ApiResponse, Property } from '@/utils/api';

const mockProperty: Property = {
  id: 1,
  projectName: '金域华府',
  city: '上海',
  district: '浦东新区',
  address: '张江高科技园区博云路2号',
  status: 'available',
  price: 6800000,
  area: 120,
  bedrooms: 3,
  bathrooms: 2,
  floor: '中',
  orientation: '南',
  decoration: '精装修',
  discount: 95,
  promotion: '限时优惠，认购立减10万',
  vrShowroomUrl: 'vr1',
  vrSalesOfficeUrl: 'vr2',
  vrPanoramaUrl: 'vr3',
  vrStreetViewUrl: 'vr4',
  erpSource: '万科ERP',
  erpSyncStatus: 'synced',
  erpLastSyncAt: '2026-06-07 10:30:00',
  erpSyncCount: 156,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-20',
};

interface RoomProps {
  type: string;
  onHotspotClick: (hotspot: Hotspot) => void;
}

interface Hotspot {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  type: 'info' | 'navigation';
  targetScene?: string;
}

interface SceneDescription {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
  hotspots: Hotspot[];
}

const sceneDescriptions: Record<string, SceneDescription> = {
  showroom: {
    id: 'showroom',
    label: '样板间',
    icon: Home,
    description: '120㎡三居精装修样板间，南北通透，采光极佳。采用现代简约风格，品牌家电齐全，拎包即可入住。',
    features: ['南北通透', '精装修交付', '品牌家电', '超大落地窗'],
    hotspots: [
      { id: 'h1', title: '客厅区域', description: '4.2米超大开间客厅，连接南向阳台，采光充足，视野开阔。配备高端皮质沙发和智能电视背景墙。', position: [3, -1, 0] as [number, number, number], type: 'info' },
      { id: 'h2', title: '主卧套房', description: '18㎡主卧套房，独立卫浴，步入式衣帽间。南向飘窗设计，尊享私密空间。', position: [-3, -1, -3] as [number, number, number], type: 'info' },
      { id: 'h3', title: '前往售楼处', description: '点击查看售楼处详情', position: [0, 0, 4] as [number, number, number], type: 'navigation', targetScene: 'sales' },
    ],
  },
  sales: {
    id: 'sales',
    label: '售楼处',
    icon: Building2,
    description: '现代化售楼中心，配备专业置业顾问团队，为您提供一对一购房咨询服务。设有沙盘展示区、洽谈区、VIP接待区。',
    features: ['专业顾问团队', '沙盘全景展示', 'VIP专属接待', '咖啡茶点服务'],
    hotspots: [
      { id: 'h4', title: '沙盘展示区', description: '1:100比例精工沙盘，完整展示小区规划、楼栋分布、景观设计和周边配套。', position: [0, -2, -4] as [number, number, number], type: 'info' },
      { id: 'h5', title: 'VIP洽谈区', description: '私密VIP接待室，配备专业投影仪和电子签约系统，为您提供尊贵的购房体验。', position: [-4, -2, -1] as [number, number, number], type: 'info' },
      { id: 'h6', title: '查看楼盘全景', description: '点击浏览楼盘整体规划', position: [0, 0, 4] as [number, number, number], type: 'navigation', targetScene: 'panorama' },
    ],
  },
  panorama: {
    id: 'panorama',
    label: '楼盘全景',
    icon: Camera,
    description: '无人机航拍楼盘全景，720度俯瞰小区整体规划、建筑布局、景观设计和周边环境。',
    features: ['720°航拍视角', '小区全景规划', '景观绿化展示', '楼间距展示'],
    hotspots: [
      { id: 'h7', title: '中央花园', description: '8000㎡中央景观花园，设有阳光草坪、儿童游乐区、老年活动区和慢跑道。', position: [0, -3, 3] as [number, number, number], type: 'info' },
      { id: 'h8', title: '1号楼', description: '小区楼王位置，前后无遮挡，视野最佳。两梯两户设计，私密性强。', position: [-4, -2, 0] as [number, number, number], type: 'info' },
      { id: 'h9', title: '查看周边街景', description: '点击浏览周边配套', position: [4, -2, 0] as [number, number, number], type: 'navigation', targetScene: 'street' },
    ],
  },
  street: {
    id: 'street',
    label: '周边街景',
    icon: MapPin,
    description: '项目位于张江核心区域，周边生活配套成熟。距离地铁2号线500米，坐拥多条公交线路，出行便利。',
    features: ['地铁2号线', '张江高科站', '商业配套齐全', '名校环伺'],
    hotspots: [
      { id: 'h10', title: '张江高科地铁站', description: '距离项目500米，步行5分钟可达。2号线直达陆家嘴、人民广场、虹桥枢纽。', position: [-4, -1, 0] as [number, number, number], type: 'info' },
      { id: 'h11', title: '张江商业广场', description: '距离项目800米，集购物、餐饮、娱乐于一体的综合性商业中心。', position: [4, -1.5, 0] as [number, number, number], type: 'info' },
      { id: 'h12', title: '返回样板间', description: '点击重新浏览样板间', position: [0, 0, -3] as [number, number, number], type: 'navigation', targetScene: 'showroom' },
    ],
  },
};

const browsePath = ['showroom', 'sales', 'panorama', 'street'];

function Room({ type, onHotspotClick }: RoomProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const roomColors: Record<string, { wall: string; floor: string; accent: string }> = {
    showroom: { wall: '#F5F5DC', floor: '#8B7355', accent: '#D4AF37' },
    sales: { wall: '#E8E4E1', floor: '#696969', accent: '#1E3A8A' },
    panorama: { wall: '#87CEEB', floor: '#228B22', accent: '#DAA520' },
    street: { wall: '#778899', floor: '#556B2F', accent: '#CD853F' },
  };

  const colors = roomColors[type] || roomColors.showroom;
  const hotspots = sceneDescriptions[type]?.hotspots || [];

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[12, 8, 0.2]} />
        <meshStandardMaterial color={colors.wall} />
      </mesh>
      <mesh position={[0, 0, 5]}>
        <boxGeometry args={[12, 8, 0.2]} />
        <meshStandardMaterial color={colors.wall} />
      </mesh>
      <mesh position={[-6, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 8, 0.2]} />
        <meshStandardMaterial color={colors.wall} />
      </mesh>
      <mesh position={[6, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 8, 0.2]} />
        <meshStandardMaterial color={colors.wall} />
      </mesh>
      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[12, 10, 0.2]} />
        <meshStandardMaterial color={colors.floor} />
      </mesh>
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[12, 10, 0.2]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {type === 'showroom' && (
        <>
          <mesh position={[-3, -2.5, -3]}>
            <boxGeometry args={[3, 0.1, 2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[-3, -1.8, -3]}>
            <boxGeometry args={[2.5, 1.2, 1.5]} />
            <meshStandardMaterial color="#F5DEB3" />
          </mesh>
          <mesh position={[3, -3, 0]}>
            <boxGeometry args={[2, 2, 0.8]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
          <mesh position={[0, -3, 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, -2.5, 2]}>
            <cylinderGeometry args={[0.3, 0.3, 1, 32]} />
            <meshStandardMaterial color="#D2B48C" />
          </mesh>
          <mesh position={[0, -1.8, 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
            <meshStandardMaterial color="#F5F5DC" />
          </mesh>
        </>
      )}

      {type === 'sales' && (
        <>
          <mesh position={[0, -3, -4]}>
            <boxGeometry args={[6, 1.2, 0.6]} />
            <meshStandardMaterial color={colors.accent} />
          </mesh>
          <mesh position={[0, -3.2, -3.8]}>
            <boxGeometry args={[5.5, 0.05, 0.5]} />
            <meshStandardMaterial color="#D4AF37" />
          </mesh>
          {[-4, 0, 4].map((x, i) => (
            <group key={i}>
              <mesh position={[x, -3, -1]}>
                <boxGeometry args={[1.5, 0.8, 1.5]} />
                <meshStandardMaterial color="#E8E4E1" />
              </mesh>
              <mesh position={[x, -2.2, -1]}>
                <cylinderGeometry args={[0.2, 0.2, 0.6, 32]} />
                <meshStandardMaterial color="#A0522D" />
              </mesh>
            </group>
          ))}
        </>
      )}

      {type === 'panorama' && (
        <>
          <mesh position={[-4, -3.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[-4, -2, 0]}>
            <coneGeometry args={[2, 3, 8]} />
            <meshStandardMaterial color="#228B22" />
          </mesh>
          <mesh position={[4, -3.5, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.8, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[4, -2.1, 0]}>
            <coneGeometry args={[1.5, 2.5, 8]} />
            <meshStandardMaterial color="#32CD32" />
          </mesh>
          <mesh position={[0, -3.8, 3]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#DAA520" />
          </mesh>
        </>
      )}

      {type === 'street' && (
        <>
          <mesh position={[-4, -2, 0]}>
            <boxGeometry args={[4, 5, 4]} />
            <meshStandardMaterial color="#778899" />
          </mesh>
          <mesh position={[4, -2.5, 0]}>
            <boxGeometry args={[4, 4, 4]} />
            <meshStandardMaterial color="#696969" />
          </mesh>
          {[-3, -1, 1, 3].map((x, i) => (
            <mesh key={i} position={[x, -1.5, 1.5]}>
              <boxGeometry args={[0.8, 1, 0.1]} />
              <meshStandardMaterial color="#87CEEB" />
            </mesh>
          ))}
          {[-4, 4].map((x, i) => (
            <mesh key={i} position={[x, -3.8, -3]}>
              <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
              <meshStandardMaterial color="#2F4F4F" />
            </mesh>
          ))}
        </>
      )}

      {hotspots.map((hotspot) => (
        <group key={hotspot.id} position={hotspot.position}>
          <mesh onClick={(e) => { e.stopPropagation(); onHotspotClick(hotspot); }}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial color={hotspot.type === 'navigation' ? '#D4AF37' : '#1E3A8A'} transparent opacity={0.9} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.3, 0.35, 32]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Scene({ type, onHotspotClick }: { type: string; onHotspotClick: (hotspot: Hotspot) => void }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#D4AF37" />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <Room type={type} onHotspotClick={onHotspotClick} />
      <ContactShadows position={[0, -3.9, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

const tabs = [
  { id: 'showroom', label: '样板间', icon: Home },
  { id: 'sales', label: '售楼处', icon: Building2 },
  { id: 'panorama', label: '楼盘全景', icon: Camera },
  { id: 'street', label: '周边街景', icon: MapPin },
];

export default function VRView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('showroom');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [autoBrowse, setAutoBrowse] = useState(false);
  const autoBrowseRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get<ApiResponse<Property>>(`/properties/${id}`) as unknown as ApiResponse<Property>;
        if (response.code === 200 && response.data) {
          setProperty(response.data);
        } else {
          setProperty(mockProperty);
        }
      } catch {
        setProperty(mockProperty);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (autoBrowse) {
      autoBrowseRef.current = setInterval(() => {
        setActiveTab((prev) => {
          const currentIndex = browsePath.indexOf(prev);
          const nextIndex = (currentIndex + 1) % browsePath.length;
          return browsePath[nextIndex];
        });
      }, 8000);
    } else {
      if (autoBrowseRef.current) {
        clearInterval(autoBrowseRef.current);
      }
    }
    return () => {
      if (autoBrowseRef.current) {
        clearInterval(autoBrowseRef.current);
      }
    };
  }, [autoBrowse]);

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return price.toLocaleString();
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.type === 'navigation' && hotspot.targetScene) {
      setActiveTab(hotspot.targetScene);
    } else {
      setSelectedHotspot(hotspot);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    setActiveTab(sceneId);
    setSelectedHotspot(null);
    if (autoBrowse) {
      setAutoBrowse(false);
    }
  };

  const currentScene = sceneDescriptions[activeTab];
  const currentPathIndex = browsePath.indexOf(activeTab);

  if (loading || !property) {
    return (
      <div className="card p-12 text-center">
        <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
        <h3 className="font-semibold text-gray-900 mb-2">加载中...</h3>
        <p className="text-gray-500">正在准备 VR 场景</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/properties/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回详情
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-gray-900">{property.projectName}</h1>
            <p className="text-sm text-gray-500">{property.city} {property.district}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gold-600">¥{formatPrice(property.price)}</div>
            <div className="text-sm text-gray-400">{property.bedrooms}室{property.bathrooms}卫 · {property.area}㎡</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const pathIndex = browsePath.indexOf(tab.id);
          const isCompleted = pathIndex < currentPathIndex;
          return (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => handleSceneChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-700 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : isCompleted
                    ? 'bg-gold-100 text-gold-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isCompleted ? <Navigation className="w-3 h-3" /> : pathIndex + 1}
                </div>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
              {pathIndex < tabs.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex gap-4">
        <div className="flex-1 card overflow-hidden relative">
          <Canvas
            shadows
            camera={{ position: [8, 2, 8], fov: 50 }}
            gl={{ antialias: true }}
          >
            <Scene type={activeTab} onHotspotClick={handleHotspotClick} />
          </Canvas>

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-xl max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="font-medium">{currentScene?.label}</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{currentScene?.description}</p>
              <div className="flex gap-2 mt-3">
                {currentScene?.features.map((feature, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white/20 rounded text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAutoBrowse(!autoBrowse)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  autoBrowse
                    ? 'bg-gold-500 text-white'
                    : 'bg-black/60 backdrop-blur-sm text-white hover:bg-black/70'
                }`}
              >
                <Navigation className="w-4 h-4" />
                {autoBrowse ? '自动浏览中' : '自动浏览'}
              </button>
              <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-400" />
                128人正在浏览
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gold-400" />
                <span className="font-medium text-sm">VR操作指南</span>
              </div>
              <div className="flex gap-4 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>鼠标拖动旋转视角</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>滚轮缩放</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>点击热点查看详情</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5">
              {browsePath.map((sceneId, idx) => (
                <div
                  key={sceneId}
                  onClick={() => handleSceneChange(sceneId)}
                  className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    activeTab === sceneId
                      ? 'bg-gold-500 scale-110'
                      : idx < currentPathIndex
                      ? 'bg-gold-500/60'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                >
                  <span className="text-white text-xs font-medium">{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedHotspot && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10" onClick={() => setSelectedHotspot(null)}>
              <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedHotspot.type === 'navigation' ? 'bg-gold-100' : 'bg-primary-100'
                    }`}>
                      {selectedHotspot.type === 'navigation' ? (
                        <Navigation className="w-6 h-6 text-gold-600" />
                      ) : (
                        <Info className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedHotspot.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedHotspot.type === 'navigation' ? 'bg-gold-100 text-gold-700' : 'bg-primary-100 text-primary-700'
                      }`}>
                        {selectedHotspot.type === 'navigation' ? '场景导航' : '详情介绍'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedHotspot(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">{selectedHotspot.description}</p>
                {selectedHotspot.type === 'navigation' && selectedHotspot.targetScene && (
                  <button
                    onClick={() => {
                      handleSceneChange(selectedHotspot.targetScene!);
                      setSelectedHotspot(null);
                    }}
                    className="w-full py-3 bg-primary-700 text-white rounded-xl font-medium hover:bg-primary-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    前往{sceneDescriptions[selectedHotspot.targetScene]?.label}
                  </button>
                )}
              </div>
            </div>
          )}

          {showGuide && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl text-center">
                <div className="w-20 h-20 gradient-gold rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">欢迎来到VR看房</h2>
                <p className="text-gray-500 mb-6">720°沉浸式看房体验，带您足不出户看好房</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Move className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">拖动旋转</p>
                    <p className="text-xs text-gray-500">360°查看场景</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <ZoomIn className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">滚轮缩放</p>
                    <p className="text-xs text-gray-500">查看细节</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <MousePointer className="w-8 h-8 text-gold-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">点击热点</p>
                    <p className="text-xs text-gray-500">获取更多信息</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <Navigation className="w-4 h-4 text-gold-500" />
                  <span>推荐浏览路径：样板间 → 售楼处 → 楼盘全景 → 周边街景</span>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="w-full py-3 gradient-gold text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  开始体验
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-72 flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-gold-500" />
              浏览路径
            </h3>
            <div className="space-y-2">
              {browsePath.map((sceneId, idx) => {
                const scene = sceneDescriptions[sceneId];
                const Icon = scene.icon;
                const isActive = activeTab === sceneId;
                const isCompleted = idx < currentPathIndex;
                return (
                  <button
                    key={sceneId}
                    onClick={() => handleSceneChange(sceneId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : isCompleted
                        ? 'bg-gold-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isCompleted ? <Navigation className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>
                        {scene.label}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">{scene.features[0]}</p>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-primary-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500" />
              场景亮点
            </h3>
            <div className="space-y-2">
              {currentScene?.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary-600" />
              互动热点
            </h3>
            <div className="space-y-2">
              {currentScene?.hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  onClick={() => handleHotspotClick(hotspot)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    hotspot.type === 'navigation' ? 'bg-gold-100' : 'bg-primary-100'
                  }`}>
                    {hotspot.type === 'navigation' ? (
                      <Navigation className="w-3 h-3 text-gold-600" />
                    ) : (
                      <Info className="w-3 h-3 text-primary-600" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{hotspot.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
