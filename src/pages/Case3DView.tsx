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
  Upload,
  ChevronDown,
  Save,
  FileDown,
  CheckCircle2,
  X,
  Clock,
  TrendingDown,
  TrendingUp,
  Package,
  Info,
  Star,
  Hammer,
  Paintbrush,
  CheckCheck,
  Calculator,
  ArrowLeftRight,
  Shield,
  FileText,
  CheckCircle,
  Move,
  Sliders,
  Download,
  QrCode,
} from 'lucide-react';
import { mockCases } from '@/mock/data';

type SchemeKey = 'current' | 'A' | 'B';
type ViewKey = 'perspective' | 'top' | 'front' | 'side';
type InfoTabKey = 'basic' | 'materials' | 'construction';
type MaterialKey = 'wall' | 'floor' | 'tile' | 'ceiling' | 'lamp';
type OverlayTabKey = 'compare' | 'schemes';
type ExportFormat = 'gltf' | 'fbx' | 'obj';

interface ImportStatus {
  fileName: string;
  format: string;
  faceCount: number;
  materialCount: number;
  aligned: boolean;
}

interface MatchItem {
  name: string;
  value: number;
  label: string;
}

interface MaterialFormula {
  formula: string;
  areaCalc: string;
  usageCalc: string;
  spec: string;
  bucketCalc: string;
  lossCalc: string;
  finalResult: string;
}

interface WatermarkConfig {
  text: string;
  position: string;
  opacity: number;
  hasQR: boolean;
}

interface MaterialItem {
  key: MaterialKey;
  name: string;
  brand: string;
  model: string;
  quantity: string;
  color: string;
  formula: MaterialFormula;
}

const materialFormulas: Record<MaterialKey, MaterialFormula> = {
  wall: {
    formula: '墙面面积 × 0.33kg/㎡（两遍涂刷）',
    areaCalc: '墙面面积：128㎡ × 2.5 = 320㎡（扣除门窗28㎡）= 292㎡',
    usageCalc: '用量计算：292㎡ × 0.33kg/㎡ = 96.36kg',
    spec: '规格：5L/桶（约6.5kg）',
    bucketCalc: '桶数：96.36 ÷ 6.5 = 14.82 → 向上取整 = 15桶',
    lossCalc: '损耗：+5% = 16桶',
    finalResult: '最终结果：立邦净味5合1 × 16桶',
  },
  floor: {
    formula: '地面面积 × 1.05（含5%损耗）',
    areaCalc: '地面面积：38㎡（实测使用面积）',
    usageCalc: '用量计算：38㎡ × 1.05 = 39.9㎡',
    spec: '规格：1.2m × 0.19m/片（2.28㎡/包，8片/包）',
    bucketCalc: '包数：39.9 ÷ 2.28 = 17.5 → 向上取整 = 18包',
    lossCalc: '损耗：已包含5% = 18包',
    finalResult: '最终结果：圣象AB1203 × 18包',
  },
  tile: {
    formula: '铺贴面积 × 1.03（含3%损耗）',
    areaCalc: '铺贴面积：45㎡（厨房+卫生间+阳台）',
    usageCalc: '用量计算：45㎡ × 1.03 = 46.35㎡',
    spec: '规格：800mm × 800mm/片（0.64㎡/片，3片/箱）',
    bucketCalc: '箱数：46.35 ÷ 0.64 ÷ 3 = 24.14 → 向上取整 = 25箱',
    lossCalc: '损耗：已包含3% = 25箱',
    finalResult: '最终结果：东鹏YG802001 × 25箱',
  },
  ceiling: {
    formula: '吊顶面积 ÷ 2.88㎡/张',
    areaCalc: '吊顶面积：35㎡（客厅+餐厅+过道）',
    usageCalc: '用量计算：35 ÷ 2.88 = 12.15张',
    spec: '规格：1200mm × 2400mm/张（2.88㎡/张）',
    bucketCalc: '张数：12.15 → 向上取整 = 13张',
    lossCalc: '损耗：+5% = 14张',
    finalResult: '最终结果：龙牌石膏板 × 14张',
  },
  lamp: {
    formula: '按空间照明需求配置',
    areaCalc: '照明区域：客厅1盏主灯 + 2盏落地灯 + 5盏筒灯',
    usageCalc: '配置计算：主灯1 × 1 + 落地灯2 × 1 + 筒灯5 × 1 = 8盏',
    spec: '规格：LED 18W（主灯）/ 12W（落地灯）/ 5W（筒灯）',
    bucketCalc: '盏数：1 + 2 + 5 = 8盏',
    lossCalc: '损耗：无（按实际数量配置）',
    finalResult: '最终结果：欧普LED × 8盏',
  },
};

const importStatus: ImportStatus = {
  fileName: 'living_room.skp',
  format: 'SketchUp 2023',
  faceCount: 12458,
  materialCount: 42,
  aligned: true,
};

const matchItems: MatchItem[] = [
  { name: '墙体轮廓匹配度', value: 96.4, label: '✓ 墙体轮廓匹配度：96.4%' },
  { name: '门窗位置匹配度', value: 93.2, label: '✓ 门窗位置匹配度：93.2%' },
  { name: '尺寸比例匹配度', value: 100, label: '✓ 尺寸比例匹配度：100%' },
  { name: '朝向角度匹配度', value: 98.7, label: '✓ 朝向角度匹配度：98.7%' },
];

const watermarkConfig: WatermarkConfig = {
  text: '业主姓名 · 案例ID · 交付日期',
  position: '每页对角叠加',
  opacity: 15,
  hasQR: true,
};

interface ConstructionStage {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: typeof Hammer;
}

interface SchemeOverlayInfo {
  description: string;
  materialCostChange: number;
  durationChange: number;
}

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

const schemeBasis: Record<SchemeKey, string> = {
  current: '基于户型图自动生成 · 数据来源：SVG户型标注',
  A: '推荐依据：户型一致 + 面积接近±5㎡ + 风格匹配(北欧系)',
  B: '推荐依据：预算匹配 + 本地建材供应充足 + 设计师评分4.8',
};

const schemeMaterials: Record<SchemeKey, MaterialItem[]> = {
  current: [
    { key: 'wall', name: '墙面漆', brand: '立邦', model: '净味5合1', quantity: '× 16桶', color: '#f5f0e8', formula: materialFormulas.wall },
    { key: 'floor', name: '地板', brand: '圣象', model: 'AB1203', quantity: '× 18包', color: '#c4a882', formula: materialFormulas.floor },
    { key: 'tile', name: '瓷砖', brand: '东鹏', model: 'YG802001', quantity: '× 25箱', color: '#d4a574', formula: materialFormulas.tile },
    { key: 'ceiling', name: '吊顶', brand: '龙牌', model: '石膏板', quantity: '× 14张', color: '#fafafa', formula: materialFormulas.ceiling },
    { key: 'lamp', name: '灯具', brand: '欧普', model: 'LED', quantity: '× 8盏', color: '#d4a574', formula: materialFormulas.lamp },
  ],
  A: [
    { key: 'wall', name: '墙面漆', brand: '多乐士', model: '竹炭净味', quantity: '× 16桶', color: '#e8e4df', formula: { ...materialFormulas.wall, finalResult: '最终结果：多乐士竹炭净味 × 16桶' } },
    { key: 'floor', name: '地板', brand: '大自然', model: 'DSJ001', quantity: '× 18包', color: '#d4b896', formula: { ...materialFormulas.floor, finalResult: '最终结果：大自然DSJ001 × 18包' } },
    { key: 'tile', name: '瓷砖', brand: '马可波罗', model: 'CZ8808', quantity: '× 25箱', color: '#7d9076', formula: { ...materialFormulas.tile, finalResult: '最终结果：马可波罗CZ8808 × 25箱' } },
    { key: 'ceiling', name: '吊顶', brand: '可耐福', model: '石膏板', quantity: '× 14张', color: '#f5f0e8', formula: { ...materialFormulas.ceiling, finalResult: '最终结果：可耐福石膏板 × 14张' } },
    { key: 'lamp', name: '灯具', brand: '雷士', model: '北欧LED', quantity: '× 8盏', color: '#7d9076', formula: { ...materialFormulas.lamp, finalResult: '最终结果：雷士北欧LED × 8盏' } },
  ],
  B: [
    { key: 'wall', name: '墙面漆', brand: '芬琳', model: 'HEMO进口', quantity: '× 16桶', color: '#2d2d2d', formula: { ...materialFormulas.wall, finalResult: '最终结果：芬琳HEMO进口 × 16桶' } },
    { key: 'floor', name: '地板', brand: '菲林格尔', model: 'F431黑胡桃', quantity: '× 18包', color: '#1a1a1a', formula: { ...materialFormulas.floor, finalResult: '最终结果：菲林格尔F431黑胡桃 × 18包' } },
    { key: 'tile', name: '瓷砖', brand: '诺贝尔', model: 'RS80710', quantity: '× 25箱', color: '#d4af37', formula: { ...materialFormulas.tile, finalResult: '最终结果：诺贝尔RS80710 × 25箱' } },
    { key: 'ceiling', name: '吊顶', brand: '龙牌', model: '防水石膏板', quantity: '× 14张', color: '#2d2d2d', formula: { ...materialFormulas.ceiling, finalResult: '最终结果：龙牌防水石膏板 × 14张' } },
    { key: 'lamp', name: '灯具', brand: '欧普', model: '轻奢水晶灯', quantity: '× 8盏', color: '#d4af37', formula: { ...materialFormulas.lamp, finalResult: '最终结果：欧普轻奢水晶灯 × 8盏' } },
  ],
};

const schemeMaterialCosts: Record<SchemeKey, number> = {
  current: 45800,
  A: 40300,
  B: 62500,
};

const constructionStages: ConstructionStage[] = [
  { name: '隐蔽工程', status: 'completed', icon: Hammer },
  { name: '泥木工程', status: 'completed', icon: Hammer },
  { name: '油漆工程', status: 'in-progress', icon: Paintbrush },
  { name: '安装工程', status: 'pending', icon: Hammer },
  { name: '竣工验收', status: 'pending', icon: CheckCheck },
];

const schemeOverlayInfos: Record<SchemeKey, SchemeOverlayInfo> = {
  current: {
    description: '当前方案为基准方案',
    materialCostChange: 0,
    durationChange: 0,
  },
  A: {
    description: '将北欧清新风格叠加到您的户型上',
    materialCostChange: -12,
    durationChange: 3,
  },
  B: {
    description: '将现代轻奢风格叠加到您的户型上',
    materialCostChange: 36,
    durationChange: 7,
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

function CameraController({ view, controlsRef }: { view: ViewKey; controlsRef: React.RefObject<unknown> }) {
  const { camera } = useThree();
  const config = viewConfigs[view];

  useEffect(() => {
    camera.position.set(...config.position);
    const controls = controlsRef.current as { target: { set: (...args: number[]) => void }; update: () => void } | null;
    if (controls) {
      controls.target.set(...config.target);
      controls.update();
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTabKey>('basic');
  const [highlightedMaterial, setHighlightedMaterial] = useState<MaterialKey | null>(null);
  const [expandedOverlay, setExpandedOverlay] = useState<SchemeKey | null>(null);
  const [imported, setImported] = useState(false);
  const [activeOverlayTab, setActiveOverlayTab] = useState<OverlayTabKey>('compare');
  const [expandedMaterial, setExpandedMaterial] = useState<MaterialKey | null>(null);
  const [compareSliderPosition, setCompareSliderPosition] = useState(50);
  const [showWatermarkPreview, setShowWatermarkPreview] = useState(false);
  const [watermarkPreviewPage, setWatermarkPreviewPage] = useState(1);
  const [showWatermarkConfig, setShowWatermarkConfig] = useState(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('gltf');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const controlsRef = useRef<unknown>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const caseData = mockCases.find((c) => c.id === id) || mockCases[0];

  useEffect(() => {
    if (view === 'front' || view === 'side') {
      setHighlightedMaterial('wall');
    } else if (view === 'top') {
      setHighlightedMaterial('floor');
    } else {
      setHighlightedMaterial(null);
    }
  }, [view]);

  const handleResetView = () => {
    setView('perspective');
    const controls = controlsRef.current as { reset: () => void } | null;
    if (controls) {
      controls.reset();
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

  const handleExportMaterials = () => {
    const materials = schemeMaterials[scheme];
    const content = materials.map((m) => `${m.name} - ${m.brand} ${m.model} ${m.quantity}`).join('\n');
    navigator.clipboard.writeText(content);
    alert('用料清单已复制到剪贴板');
  };

  const handleSliderMouseDown = () => {
    const handleMove = (e: Event) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      let clientX: number;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
      } else if (e instanceof MouseEvent) {
        clientX = e.clientX;
      } else {
        return;
      }
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setCompareSliderPosition(percentage);
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={controlsRef as React.RefObject<any>}
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
            <EffectComposer multisampling={8} enableNormalPass>
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

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <button
            onClick={() => navigate(`/cases/${id}`)}
            className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700' : 'bg-white/90 border-gray-300 hover:bg-gray-50 text-gray-800'} backdrop-blur-sm rounded-lg border transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            返回详情
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700' : 'bg-white/90 border-gray-300 hover:bg-gray-50 text-gray-800'} backdrop-blur-sm rounded-lg border transition-colors`}
          >
            <Upload className="w-4 h-4" />
            导入户型模型
          </button>
        </div>

        {imported && (
          <div className={`absolute top-24 left-4 ${isDark ? 'bg-gray-800/90 border-green-500/50' : 'bg-white/95 border-green-400/50'} backdrop-blur-md rounded-xl border w-72 overflow-hidden shadow-xl`}>
            <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2 bg-green-500/10`}>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>导入状态</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {importStatus.fileName} 已导入
                </span>
              </div>
              <div className={`pl-6 space-y-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-primary-400" />
                  <span>模型格式：{importStatus.format}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary-400" />
                  <span>面数：{importStatus.faceCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-3.5 h-3.5 text-primary-400" />
                  <span>材质数：{importStatus.materialCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">已自动对齐到当前户型</span>
                </div>
              </div>
            </div>
          </div>
        )}

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

        <div className={`absolute left-4 ${imported ? 'top-72' : 'top-20'} ${isDark ? 'bg-gray-800/85 border-gray-700' : 'bg-white/95 border-gray-300'} backdrop-blur-md rounded-xl border w-96 overflow-hidden shadow-xl max-h-[calc(85vh-8rem)] overflow-y-auto`}>
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveOverlayTab('compare')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeOverlayTab === 'compare'
                  ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-500/10'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              叠加对比
            </button>
            <button
              onClick={() => setActiveOverlayTab('schemes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeOverlayTab === 'schemes'
                  ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-500/10'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              方案对比
            </button>
          </div>

          {activeOverlayTab === 'compare' && imported && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>原始户型</span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>叠加导入模型</span>
                </div>
                <div
                  ref={sliderRef}
                  className="relative w-full aspect-video rounded-lg overflow-hidden border cursor-col-resize"
                  style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
                  onMouseDown={handleSliderMouseDown}
                  onTouchStart={handleSliderMouseDown}
                >
                  <div className="absolute inset-0">
                    <svg viewBox="0 0 100 70" className="w-full h-full" style={{ backgroundColor: isDark ? '#1f2937' : '#f9fafb' }}>
                      <rect x="10" y="15" width="35" height="40" fill="none" stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="1.5" />
                      <rect x="55" y="10" width="35" height="50" fill="none" stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="1.5" />
                      <rect x="18" y="35" width="8" height="15" fill="none" stroke={isDark ? '#4b5563' : '#6b7280'} strokeWidth="1" />
                      <rect x="70" y="25" width="12" height="8" fill="none" stroke={isDark ? '#4b5563' : '#6b7280'} strokeWidth="1" />
                      <circle cx="45" cy="50" r="1.5" fill={isDark ? '#6b7280' : '#9ca3af'} />
                      <circle cx="75" cy="45" r="1.5" fill={isDark ? '#6b7280' : '#9ca3af'} />
                    </svg>
                  </div>
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - compareSliderPosition}% 0 0)` }}
                  >
                    <svg viewBox="0 0 100 70" className="w-full h-full" style={{ backgroundColor: isDark ? '#1f2937' : '#f9fafb' }}>
                      <rect x="10" y="15" width="35" height="40" fill={isDark ? '#8b7355' : '#c4a882'} opacity="0.4" stroke={isDark ? '#d4a574' : '#d4af37'} strokeWidth="1.5" />
                      <rect x="55" y="10" width="35" height="50" fill={isDark ? '#8b7355' : '#c4a882'} opacity="0.4" stroke={isDark ? '#d4a574' : '#d4af37'} strokeWidth="1.5" />
                      <rect x="20" y="25" width="15" height="10" fill={isDark ? '#8b7355' : '#c4a882'} opacity="0.6" />
                      <rect x="60" y="20" width="20" height="15" fill={isDark ? '#8b7355' : '#c4a882'} opacity="0.6" />
                      <rect x="18" y="35" width="8" height="15" fill="none" stroke={isDark ? '#d4a574' : '#d4af37'} strokeWidth="1" />
                      <rect x="70" y="25" width="12" height="8" fill="none" stroke={isDark ? '#d4a574' : '#d4af37'} strokeWidth="1" />
                      <circle cx="45" cy="50" r="2" fill={isDark ? '#d4a574' : '#d4af37'} />
                      <circle cx="75" cy="45" r="2" fill={isDark ? '#d4a574' : '#d4af37'} />
                    </svg>
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                    style={{ left: `${compareSliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <Move className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  户型墙体已对齐 · 门窗位置已匹配 · 尺寸比例1:1
                </div>
              </div>

              <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2`}>
                  <Sliders className="w-4 h-4 text-primary-400" />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>叠加依据</span>
                </div>
                <div className="p-3 space-y-3">
                  {matchItems.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 inline mr-1" />
                          {item.name}
                        </span>
                        <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {item.value}%
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeOverlayTab === 'compare' && !imported && (
            <div className="p-8 text-center">
              <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                请先导入 SketchUp 或 GLTF 模型
              </div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                导入后可查看叠加对比效果
              </div>
            </div>
          )}

          {activeOverlayTab === 'schemes' && (
            <div className="p-3 space-y-2">
              {(['current', 'A', 'B'] as SchemeKey[]).map((key) => {
                const palette = schemePalettes[key];
                const isActive = scheme === key;
                const isExpanded = expandedOverlay === key;
                const overlayInfo = schemeOverlayInfos[key];
                return (
                  <div
                    key={key}
                    className={`rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-500/20 border-2 border-primary-500'
                        : isDark
                        ? 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'
                        : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => setScheme(key)}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`font-medium ${isActive ? 'text-primary-400' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {palette.name}
                        </div>
                        {imported && key !== 'current' && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                            叠加方案
                          </span>
                        )}
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
                      <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {schemeBasis[key]}
                      </div>
                    </button>

                    {key !== 'current' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedOverlay(isExpanded ? null : key);
                          }}
                          className={`w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium border-t ${
                            isDark
                              ? 'border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                              : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          叠加效果
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isExpanded && (
                          <div className={`px-3 pb-3 space-y-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className={`pt-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {overlayInfo.description}
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className={`w-3.5 h-3.5 ${
                                overlayInfo.materialCostChange < 0 ? 'text-green-400' : 'text-red-400'
                              }`} />
                              <span className={`text-xs ${
                                overlayInfo.materialCostChange < 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }`}>
                                材料费用{overlayInfo.materialCostChange < 0 ? '变化：' : '变化：+'}
                                {overlayInfo.materialCostChange}%
                              </span>
                              {overlayInfo.materialCostChange < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className={`w-3.5 h-3.5 ${
                                overlayInfo.durationChange < 0 ? 'text-green-400' : 'text-yellow-400'
                              }`} />
                              <span className={`text-xs ${
                                overlayInfo.durationChange < 0
                                  ? 'text-green-400'
                                  : 'text-yellow-400'
                              }`}>
                                施工周期{overlayInfo.durationChange >= 0 ? '变化：+' : '变化：'}
                                {overlayInfo.durationChange}天
                              </span>
                              {overlayInfo.durationChange < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`absolute top-20 left-[26rem] ${isDark ? 'bg-gray-800/85 border-gray-700' : 'bg-white/95 border-gray-300'} backdrop-blur-md rounded-xl border w-80 overflow-hidden shadow-xl max-h-[calc(85vh-8rem)] overflow-y-auto`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2`}>
            <Box className="w-5 h-5 text-primary-400" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>案例信息</span>
          </div>
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {([
              { key: 'basic', label: '基本信息', icon: Info },
              { key: 'materials', label: '材料用量', icon: Package },
              { key: 'construction', label: '施工进度', icon: Clock },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveInfoTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  activeInfoTab === key
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeInfoTab === 'basic' && (
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
          )}

          {activeInfoTab === 'materials' && (
            <div className="p-4 space-y-3">
              <button
                onClick={handleExportMaterials}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                导出用料清单
              </button>

              {schemeMaterials[scheme].map((mat) => {
                const isExpanded = expandedMaterial === mat.key;
                return (
                  <div
                    key={mat.key}
                    className={`rounded-lg border-2 transition-all overflow-hidden ${
                      highlightedMaterial === mat.key
                        ? 'border-primary-400 bg-primary-500/10'
                        : isDark
                        ? 'border-gray-700/50 bg-gray-700/30'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedMaterial(isExpanded ? null : mat.key)}
                      className="w-full p-2.5 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-md border border-black/20 flex-shrink-0"
                          style={{ backgroundColor: mat.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {mat.name}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {mat.brand} {mat.model}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {mat.quantity}
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`px-3 pb-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="pt-3 space-y-2">
                          <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Calculator className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.formula}</span>
                          </div>
                          <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Info className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.areaCalc}</span>
                          </div>
                          <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Calculator className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.usageCalc}</span>
                          </div>
                          <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Package className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.spec}</span>
                          </div>
                          <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Calculator className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.bucketCalc}</span>
                          </div>
                          <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <TrendingUp className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.lossCalc}</span>
                          </div>
                          <div className={`flex items-start gap-2 text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'} pt-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{mat.formula.finalResult}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className={`pt-2 mt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预估材料费用</span>
                  <span className={`text-lg font-bold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                    ¥{schemeMaterialCosts[scheme].toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeInfoTab === 'construction' && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                {constructionStages.map((stage, idx) => (
                  <div key={stage.name} className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        stage.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : stage.status === 'in-progress'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : isDark
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {stage.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : stage.status === 'in-progress' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        stage.status === 'completed' || stage.status === 'in-progress'
                          ? isDark ? 'text-white' : 'text-gray-900'
                          : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {stage.name}
                      </div>
                    </div>
                    <div className={`text-xs ${
                      stage.status === 'completed'
                        ? 'text-green-400'
                        : stage.status === 'in-progress'
                        ? 'text-yellow-400'
                        : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {stage.status === 'completed' && '已完成'}
                      {stage.status === 'in-progress' && '进行中'}
                      {stage.status === 'pending' && '待开始'}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  当前：油漆工程，预计还需25天
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  已完成 3/8 验收节点
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  当前评分 {caseData.qualityScore?.toFixed(1) || '4.7'}/5.0
                </span>
              </div>
            </div>
          )}
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
            {imported && (
              <div className="flex items-center gap-2 text-green-400 pt-1 border-t border-gray-700/50 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>SketchUp模型已叠加</span>
              </div>
            )}
          </div>
        </div>

        <div className={`absolute right-4 bottom-48 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-300'} backdrop-blur-sm rounded-xl border px-4 py-3 text-sm shadow-lg w-80`}>
          <div className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>可交付漫游内容</div>
          <div className={`space-y-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              3D漫游截图（4视角）
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              方案对比PDF
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              材料用量清单
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              施工注意事项
            </div>
            {imported && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                3D模型导出（GLTF/FBX/OBJ）
              </div>
            )}
          </div>

          <div className={`mt-3 rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
            <button
              onClick={() => setShowWatermarkConfig(!showWatermarkConfig)}
              className={`w-full flex items-center justify-between px-3 py-2 ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-400" />
                <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>水印配置</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showWatermarkConfig ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
            {showWatermarkConfig && (
              <div className={`px-3 py-3 space-y-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FileText className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  <span>水印文字：{watermarkConfig.text}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Move className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  <span>水印位置：{watermarkConfig.position}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Sliders className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  <span>水印透明度：{watermarkConfig.opacity}%</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <QrCode className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span>防伪标识：{watermarkConfig.hasQR ? '✓ 含隐形二维码' : '✗ 无隐形二维码'}</span>
                </div>
                <button
                  onClick={() => setShowWatermarkPreview(true)}
                  className={`w-full flex items-center justify-center gap-1.5 mt-2 px-3 py-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg text-xs font-medium transition-colors`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览水印
                </button>
              </div>
            )}
          </div>

          {imported && (
            <div className={`mt-3 rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className={`w-full flex items-center justify-between px-3 py-2 ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary-400" />
                  <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>导出3D模型</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportOptions ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
              {showExportOptions && (
                <div className={`px-3 py-3 space-y-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    包含：户型结构 · 家具模型 · 材质贴图 · 光照设置
                  </div>
                  <div className="flex gap-2">
                    {(['gltf', 'fbx', 'obj'] as ExportFormat[]).map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                          exportFormat === format
                            ? 'bg-primary-500 text-white'
                            : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => alert(`3D模型已导出为 ${exportFormat.toUpperCase()} 格式`)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出 {exportFormat.toUpperCase()}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigate(`/pdf-delivery/${id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              生成PDF交付包
              <span className="px-1 py-0.5 text-[9px] bg-white/20 rounded font-medium">
                ✓ 已包含水印
              </span>
            </button>
            <button
              onClick={() => alert('截图已保存')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg text-xs font-medium transition-colors`}
            >
              <Save className="w-3.5 h-3.5" />
              截图保存
            </button>
          </div>
        </div>

        {showWatermarkPreview && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} rounded-2xl border shadow-2xl w-full max-w-2xl mx-4`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-400" />
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>水印预览</span>
                </div>
                <button
                  onClick={() => setShowWatermarkPreview(false)}
                  className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4].map((page) => (
                    <button
                      key={page}
                      onClick={() => setWatermarkPreviewPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        watermarkPreviewPage === page
                          ? 'bg-primary-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      第{page}页
                    </button>
                  ))}
                </div>
                <div className="relative w-full aspect-[4/3] bg-white rounded-lg overflow-hidden shadow-inner">
                  <div className="absolute inset-0 p-6">
                    <div className="text-lg font-bold text-gray-800 mb-2">
                      {watermarkPreviewPage === 1 && '3D漫游方案概览'}
                      {watermarkPreviewPage === 2 && '材料用量清单'}
                      {watermarkPreviewPage === 3 && '施工进度安排'}
                      {watermarkPreviewPage === 4 && '方案对比分析'}
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      {watermarkPreviewPage === 1 && (
                        <>
                          <p>案例名称：{caseData.title}</p>
                          <p>户型：{caseData.houseType}</p>
                          <p>面积：{caseData.area}㎡</p>
                          <p>风格：{caseData.style}</p>
                        </>
                      )}
                      {watermarkPreviewPage === 2 && (
                        <>
                          <p>墙面漆：立邦净味5合1 × 16桶</p>
                          <p>地板：圣象AB1203 × 18包</p>
                          <p>瓷砖：东鹏YG802001 × 25箱</p>
                          <p>吊顶：龙牌石膏板 × 14张</p>
                        </>
                      )}
                      {watermarkPreviewPage === 3 && (
                        <>
                          <p>隐蔽工程：已完成</p>
                          <p>泥木工程：已完成</p>
                          <p>油漆工程：进行中（预计25天）</p>
                          <p>安装工程：待开始</p>
                        </>
                      )}
                      {watermarkPreviewPage === 4 && (
                        <>
                          <p>当前方案：¥45,800</p>
                          <p>方案A（北欧）：¥40,300（-12%）</p>
                          <p>方案B（轻奢）：¥62,500（+36%）</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div
                      className="absolute top-1/4 left-1/4 text-gray-400/30 font-bold text-xl whitespace-nowrap"
                      style={{ transform: 'rotate(-20deg)' }}
                    >
                      张三 · CASE-{id} · 2026-06-15
                    </div>
                    <div
                      className="absolute top-1/2 left-1/2 text-gray-400/30 font-bold text-xl whitespace-nowrap"
                      style={{ transform: 'rotate(-20deg)' }}
                    >
                      张三 · CASE-{id} · 2026-06-15
                    </div>
                    <div
                      className="absolute top-3/4 left-3/4 text-gray-400/30 font-bold text-xl whitespace-nowrap"
                      style={{ transform: 'rotate(-20deg)' }}
                    >
                      张三 · CASE-{id} · 2026-06-15
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-xs mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                  水印文字：{watermarkConfig.text} · 位置：{watermarkConfig.position} · 透明度：{watermarkConfig.opacity}%
                </div>
              </div>
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                <button
                  onClick={() => setShowWatermarkPreview(false)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  关闭预览
                </button>
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} rounded-2xl border shadow-2xl w-full max-w-md mx-4`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-400" />
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>导入3D户型模型</span>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  支持 SketchUp (.skp)、GLTF (.gltf/.glb) 格式
                </div>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDark
                      ? 'border-gray-600 hover:border-primary-500 text-gray-400'
                      : 'border-gray-300 hover:border-primary-500 text-gray-500'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm font-medium">点击选择文件</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>或拖拽文件到此区域</div>
                </div>
                <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    living_room.skp 已导入 ✓
                  </div>
                </div>

                <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Eye className="w-4 h-4 text-primary-400" />
                    导入后效果预览
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-full aspect-video rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}>
                        <Box className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前3D场景</div>
                    </div>
                    <div className="flex-shrink-0">
                      <Layers className={`w-5 h-5 ${isDark ? 'text-primary-400' : 'text-primary-500'}`} />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-full aspect-video rounded-lg flex items-center justify-center relative overflow-hidden ${isDark ? 'bg-gray-800 border border-primary-500/50' : 'bg-white border border-primary-400/50'}`}>
                        <svg viewBox="0 0 100 70" className="w-full h-full p-2">
                          <rect x="10" y="15" width="35" height="40" fill="none" stroke={isDark ? '#a3b5a0' : '#7d9076'} strokeWidth="1.5" strokeDasharray="3,2" />
                          <rect x="55" y="10" width="35" height="50" fill="none" stroke={isDark ? '#a3b5a0' : '#7d9076'} strokeWidth="1.5" strokeDasharray="3,2" />
                          <rect x="20" y="25" width="15" height="10" fill={isDark ? '#8b7355' : '#c4a882'} opacity="0.6" />
                          <rect x="60" y="20" width="20" height="15" fill={isDark ? '#8b7355' : '#c4a882'} opacity="0.6" />
                          <circle cx="45" cy="50" r="2" fill={isDark ? '#d4a574' : '#d4af37'} />
                          <circle cx="75" cy="45" r="2" fill={isDark ? '#d4a574' : '#d4af37'} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-400 opacity-80" />
                        </div>
                      </div>
                      <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>导入后效果</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowImportModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImported(true);
                    alert('模型导入成功');
                  }}
                  className="px-4 py-2 rounded-lg text-sm bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                >
                  确认导入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
