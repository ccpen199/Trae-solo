import { useState, useRef, useMemo, Suspense, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  Home,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Eye,
  Box,
  Layers,
  Sun,
  Moon,
  ChevronLeft,
} from 'lucide-react';
import { mockCases } from '@/mock/data';

type SchemeKey = 'current' | 'A' | 'B';
type ViewKey = 'perspective' | 'top' | 'front' | 'side';

interface SchemeColors {
  name: string;
  wall: string;
  floor: string;
  sofa: string;
  coffeeTable: string;
  tvCabinet: string;
  accent: string;
  plantPot: string;
}

const schemePalettes: Record<SchemeKey, SchemeColors> = {
  current: {
    name: '当前方案',
    wall: '#f5f0e8',
    floor: '#c4a882',
    sofa: '#8b7355',
    coffeeTable: '#3d3529',
    tvCabinet: '#4a4035',
    accent: '#d4a574',
    plantPot: '#c9a87c',
  },
  A: {
    name: '方案A · 北欧清新',
    wall: '#e8e4df',
    floor: '#d4b896',
    sofa: '#a3b5a0',
    coffeeTable: '#f5f0e8',
    tvCabinet: '#c9bfb0',
    accent: '#7d9076',
    plantPot: '#b8a68c',
  },
  B: {
    name: '方案B · 现代轻奢',
    wall: '#2d2d2d',
    floor: '#1a1a1a',
    sofa: '#4a4a4a',
    coffeeTable: '#c9a961',
    tvCabinet: '#1a1a1a',
    accent: '#d4af37',
    plantPot: '#2d2d2d',
  },
};

const viewConfigs: Record<ViewKey, { position: [number, number, number]; target: [number, number, number]; label: string }> = {
  perspective: { position: [6, 5, 8], target: [0, 1, 0], label: '透视图' },
  top: { position: [0, 15, 0.01], target: [0, 0, 0], label: '俯视图' },
  front: { position: [0, 2.5, 12], target: [0, 1.5, 0], label: '正视图' },
  side: { position: [12, 2.5, 0], target: [0, 1.5, 0], label: '侧视图' },
};

function Floor({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[16, 12]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

function Walls({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, -6]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[8, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Sofa({ color }: { color: string }) {
  return (
    <group position={[0, 0, -4]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.5, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.8, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[-1.6, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.6, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[1.6, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.6, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[-0.9, 0.8, 0.05]} castShadow>
        <boxGeometry args={[0.7, 0.25, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.9, 0.8, 0.05]} castShadow>
        <boxGeometry args={[0.7, 0.25, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function CoffeeTable({ color }: { color: string }) {
  return (
    <group position={[0, 0, -1.8]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      {[[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function TVCabinet({ color, accent }: { color: string; accent: string }) {
  return (
    <group position={[0, 0, 4]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.5, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.4, 0.08]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0.05]}>
        <planeGeometry args={[2.2, 1.25]} />
        <meshStandardMaterial color="#1a1a2e" emissive={accent} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function Plant({ potColor }: { potColor: string }) {
  return (
    <group position={[5.5, 0, -4.5]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.2, 0.6, 16]} />
        <meshStandardMaterial color={potColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.05, 16]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        const radius = 0.15;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, 1 + i * 0.05, Math.sin(angle) * radius]}
            rotation={[0.3, angle, 0.2]}
            castShadow
          >
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#4a7c59" roughness={0.8} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#5a8f6a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function CeilingLamp({ accent }: { accent: string }) {
  return (
    <group position={[0, 4.8, -1]}>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.3, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={accent}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function SideLamp({ accent, position }: { accent: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.1, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <coneGeometry args={[0.25, 0.35, 16, 1, true]} />
        <meshStandardMaterial
          color="#faf0e6"
          emissive={accent}
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function Rug({ accent }: { accent: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]} receiveShadow>
      <planeGeometry args={[4, 3]} />
      <meshStandardMaterial color={accent} roughness={1} opacity={0.6} transparent />
    </mesh>
  );
}

function Scene({ scheme }: { scheme: SchemeKey }) {
  const colors = schemePalettes[scheme];
  return (
    <>
      <Floor color={colors.floor} />
      <Walls color={colors.wall} />
      <Sofa color={colors.sofa} />
      <CoffeeTable color={colors.coffeeTable} />
      <TVCabinet color={colors.tvCabinet} accent={colors.accent} />
      <Plant potColor={colors.plantPot} />
      <CeilingLamp accent={colors.accent} />
      <SideLamp accent={colors.accent} position={[-5.5, 0, -4.5]} />
      <SideLamp accent={colors.accent} position={[5.5, 0, 3.5]} />
      <Rug accent={colors.accent} />
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.5}
        scale={20}
        blur={2.5}
        far={5}
      />
    </>
  );
}

function Lights({ accent }: { accent: string }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#ffffff" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.8}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[0, 4.5, -1]} intensity={1.5} color={accent} distance={10} decay={2} />
      <pointLight position={[-5.5, 1.2, -4.5]} intensity={0.8} color={accent} distance={5} decay={2} />
      <pointLight position={[5.5, 1.2, 3.5]} intensity={0.8} color={accent} distance={5} decay={2} />
    </>
  );
}

function CameraController({ view, controlsRef }: { view: ViewKey; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const config = viewConfigs[view];

  useEffect(() => {
    camera.position.set(...config.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...config.target);
      controlsRef.current.update();
    }
  }, [view, camera, controlsRef, config]);

  return null;
}

export default function Case3DView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState<SchemeKey>('current');
  const [view, setView] = useState<ViewKey>('perspective');
  const [isDark, setIsDark] = useState(true);
  const controlsRef = useRef<any>(null);
  const caseData = mockCases.find((c) => c.id === id) || mockCases[0];

  const handleResetView = () => {
    setView('perspective');
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const accentColor = useMemo(() => schemePalettes[scheme].accent, [scheme]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-100'} text-white transition-colors duration-500`}>
      <div className={`${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border-b`}>
        <div className="container py-3">
          <nav className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Link to="/" className={`flex items-center ${isDark ? 'hover:text-primary-400' : 'hover:text-primary-600'} transition-colors`}>
              <Home className="w-4 h-4 mr-1" />
              首页
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/cases" className={`${isDark ? 'hover:text-primary-400' : 'hover:text-primary-600'} transition-colors`}>
              案例库
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to={`/cases/${id}`} className={`${isDark ? 'hover:text-primary-400' : 'hover:text-primary-600'} transition-colors truncate max-w-xs`}>
              {caseData?.title}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>3D 预览</span>
          </nav>
        </div>
      </div>

      <div className="relative" style={{ height: '85vh' }}>
        <Canvas
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={viewConfigs[view].position} fov={50} />
            <OrbitControls
              ref={controlsRef}
              target={viewConfigs[view].target}
              enableDamping
              dampingFactor={0.08}
              minDistance={3}
              maxDistance={25}
              maxPolarAngle={Math.PI / 2.05}
              minPolarAngle={0.1}
            />
            <CameraController view={view} controlsRef={controlsRef} />
            <Lights accent={accentColor} />
            <Scene scheme={scheme} />
            <Environment preset="city" />
            <EffectComposer multisampling={8}>
              <SSAO
                radius={0.15}
                intensity={1.2}
                luminanceInfluence={0.5}
                color={new THREE.Color(0x000000)}
                worldDistanceThreshold={10}
                worldDistanceFalloff={5}
                worldProximityThreshold={1}
                worldProximityFalloff={0.5}
              />
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.4} mipmapBlur />
            </EffectComposer>
          </Suspense>
        </Canvas>

        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => navigate(`/cases/${id}`)}
            className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700' : 'bg-white/90 border-gray-300 hover:bg-gray-50 text-gray-800'} backdrop-blur-sm rounded-lg border transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            返回详情
          </button>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <div className={`flex ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-300'} backdrop-blur-sm rounded-xl border p-1 gap-1`}>
            {(['top', 'front', 'side', 'perspective'] as ViewKey[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === v
                    ? 'bg-primary-500 text-white'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={viewConfigs[v].label}
              >
                {v === 'top' && '俯视'}
                {v === 'front' && '正视'}
                {v === 'side' && '侧视'}
                {v === 'perspective' && <Eye className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className={`flex ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-300'} backdrop-blur-sm rounded-xl border p-1 gap-1`}>
            <button
              onClick={handleResetView}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="重置视角"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleFullscreen}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="全屏"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title={isDark ? '浅色模式' : '深色模式'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`absolute left-4 top-20 ${isDark ? 'bg-gray-800/85 border-gray-700' : 'bg-white/95 border-gray-300'} backdrop-blur-md rounded-xl border w-64 overflow-hidden shadow-xl`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2`}>
            <Layers className="w-5 h-5 text-primary-400" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>方案对比</span>
          </div>
          <div className="p-3 space-y-2">
            {(['current', 'A', 'B'] as SchemeKey[]).map((key) => {
              const palette = schemePalettes[key];
              const isActive = scheme === key;
              return (
                <button
                  key={key}
                  onClick={() => setScheme(key)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-500/20 border-2 border-primary-500'
                      : isDark
                      ? 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'
                      : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <div className={`font-medium mb-2 ${isActive ? 'text-primary-400' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {palette.name}
                  </div>
                  <div className="flex gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full border border-black/20"
                      style={{ backgroundColor: palette.wall }}
                      title="墙面"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/20"
                      style={{ backgroundColor: palette.floor }}
                      title="地板"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/20"
                      style={{ backgroundColor: palette.sofa }}
                      title="沙发"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/20"
                      style={{ backgroundColor: palette.coffeeTable }}
                      title="茶几"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/20"
                      style={{ backgroundColor: palette.accent }}
                      title="点缀色"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`absolute top-20 left-80 ${isDark ? 'bg-gray-800/85 border-gray-700' : 'bg-white/95 border-gray-300'} backdrop-blur-md rounded-xl border w-72 overflow-hidden shadow-xl`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2`}>
            <Box className="w-5 h-5 text-primary-400" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>案例信息</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>案例名称</div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{caseData.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>户型</div>
                <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{caseData.houseType}</div>
              </div>
              <div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>面积</div>
                <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{caseData.area}㎡</div>
              </div>
              <div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>风格</div>
                <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{caseData.style}</div>
              </div>
              <div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>预算</div>
                <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>¥{(caseData.budget / 10000).toFixed(1)}万</div>
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>设计师</div>
              <div className="flex items-center gap-2">
                <img
                  src={caseData.designerAvatar}
                  alt={caseData.designerName}
                  className="w-6 h-6 rounded-full"
                />
                <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{caseData.designerName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`absolute right-4 bottom-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-300'} backdrop-blur-sm rounded-xl border px-4 py-3 text-sm shadow-lg`}>
          <div className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>操作提示</div>
          <div className={`space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400" />
              左键拖动：旋转视角
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400" />
              右键拖动：平移场景
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400" />
              滚轮：缩放视图
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
