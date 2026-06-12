import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useDGeneratorStore, LightMode, ViewMode } from '@/store/dGeneratorStore';
import { styleConfigs, lightConfigs, nightConfig } from '@/config/styleConfigs';
import FurnitureSet from './FurnitureSet';

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { viewMode } = useDGeneratorStore();

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    let targetPos: [number, number, number] = [8, 8, 8];
    let targetLook: [number, number, number] = [0, 0, 0];

    switch (viewMode) {
      case 'top':
        targetPos = [0, 15, 0.01];
        targetLook = [0, 0, 0];
        break;
      case 'front':
        targetPos = [0, 2.5, 12];
        targetLook = [0, 1.5, 0];
        break;
      case 'roam':
      default:
        targetPos = [8, 8, 8];
        targetLook = [0, 1, 0];
    }

    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...targetPos);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(...targetLook);
    const duration = 800;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [viewMode, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      makeDefault
      minDistance={3}
      maxDistance={25}
      maxPolarAngle={Math.PI / 2 - 0.02}
    />
  );
}

function RoomGeometry() {
  const { selectedStyle, materials, selectedMaterials } = useDGeneratorStore();
  const styleColors = styleConfigs[selectedStyle];

  const floorMat = materials.floor.find(m => m.id === selectedMaterials.floor);
  const wallMat = materials.wall.find(m => m.id === selectedMaterials.wall);

  const floorColor = floorMat?.color || styleColors.floor;
  const floorRough = floorMat?.roughness ?? 0.8;
  const floorMetal = floorMat?.metalness ?? 0;
  const wallColor = wallMat?.color || styleColors.wall;
  const wallRough = wallMat?.roughness ?? 0.9;

  const W = 10;
  const D = 8;
  const H = 3;
  const T = 0.2;

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={floorColor} roughness={floorRough} metalness={floorMetal} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, H / 2, -D / 2 - T / 2]}>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial color={wallColor} roughness={wallRough} side={THREE.DoubleSide} />
      </mesh>

      <mesh castShadow receiveShadow position={[W / 2 + T / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D, H, T]} />
        <meshStandardMaterial color={wallColor} roughness={wallRough} side={THREE.DoubleSide} />
      </mesh>

      <mesh castShadow receiveShadow position={[-W / 2 - T / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D, H, T]} />
        <meshStandardMaterial color={wallColor} roughness={wallRough} side={THREE.DoubleSide} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, H / 2, D / 2 + T / 2]}>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial color={wallColor} roughness={wallRough} side={THREE.DoubleSide} />
      </mesh>

      <mesh receiveShadow position={[0, H + T / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#FAF8F5" roughness={0.95} />
      </mesh>

      <group position={[-W / 2 + T, 0, 0]}>
        <mesh position={[0, 1.4, -1.8]}>
          <boxGeometry args={[0.04, 1.2, 1.0]} />
          <meshStandardMaterial color="#B8D4E8" roughness={0.1} metalness={0.2} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 1.4, 1.8]}>
          <boxGeometry args={[0.04, 1.2, 1.0]} />
          <meshStandardMaterial color="#B8D4E8" roughness={0.1} metalness={0.2} transparent opacity={0.7} />
        </mesh>
      </group>

      <group position={[0, 0, -D / 2 + T]}>
        <mesh position={[-1.5, 1.4, 0]}>
          <boxGeometry args={[1.4, 1.2, 0.04]} />
          <meshStandardMaterial color="#B8D4E8" roughness={0.1} metalness={0.2} transparent opacity={0.7} />
        </mesh>
      </group>

      <mesh position={[W / 2 - 1.5, 1.05, D / 2 - 0.1]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.9, 2.1, 0.05]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Lighting() {
  const { lightMode, isDay, selectedStyle } = useDGeneratorStore();
  const styleColors = styleConfigs[selectedStyle];
  const base = isDay ? lightConfigs[lightMode as LightMode] : nightConfig;

  const effectiveBg = isDay ? base.background : nightConfig.background;
  void styleColors;

  return (
    <>
      <color attach="background" args={[effectiveBg]} />
      <fog attach="fog" args={[isDay ? base.fogColor : nightConfig.fogColor, 12, 30]} />
      <ambientLight intensity={base.ambientIntensity} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={base.directionalIntensity}
        color={base.directionalColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0005}
      />

      {!isDay && (
        <>
          <pointLight position={[-3, 2.2, 2]} intensity={8} color="#FFD4A3" distance={6} decay={2} />
          <pointLight position={[2.5, 2.2, 1]} intensity={5} color="#FFE8CC" distance={5} decay={2} />
          <pointLight position={[4.2, 2.6, -1.5]} intensity={4} color="#FFD4A3" distance={4} decay={2} />
        </>
      )}

      <hemisphereLight args={[base.directionalColor, '#E8E4DD', 0.3]} />
    </>
  );
}

function SceneContent() {
  return (
    <>
      <Lighting />
      <RoomGeometry />
      <FurnitureSet />
      <CameraController />
      <Environment preset="apartment" />
      <EffectComposer multisampling={8}>
        <SSAO radius={0.1} intensity={50} luminanceInfluence={0.6} color={new THREE.Color('black')} worldDistanceThreshold={0.1} worldDistanceFalloff={0.5} worldProximityThreshold={0.1} worldProximityFalloff={0.5} />
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.3} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 8, 8], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
