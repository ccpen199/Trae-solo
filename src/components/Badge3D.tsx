import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, RoundedBox, Text, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { CertLevel, TierRank } from '@/types';
import { getTierColor } from '@/data/games';

const CERT_COLORS: Record<CertLevel, string> = {
  Diamond: '#06B6D4',
  Gold: '#F59E0B',
  Silver: '#94A3B8',
  None: '#64748B',
};

function BadgeMesh({ color, label, icon }: { color: string; label: string; icon?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (outerRef.current) {
      outerRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={outerRef}>
        <torusGeometry args={[1.08, 0.04, 16, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} metalness={0.8} roughness={0.1} />
      </mesh>

      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.4}>
        <mesh ref={meshRef} castShadow>
          <cylinderGeometry args={[1, 1, 0.25, 6]} />
          <MeshDistortMaterial
            color={color}
            envMapIntensity={1.5}
            metalness={0.95}
            roughness={0.08}
            distort={0.15}
            speed={1.8}
            emissive={color}
            emissiveIntensity={0.15}
          />
        </mesh>
      </Float>

      <mesh position={[0, 0, 0.14]}>
        <cylinderGeometry args={[0.82, 0.82, 0.02, 6]} />
        <meshStandardMaterial color="#0F0F1A" metalness={0.5} roughness={0.4} />
      </mesh>

      <Text
        position={[0, 0.15, 0.17]}
        fontSize={0.22}
        font="https://fonts.gstatic.com/s/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dys.woff2"
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {icon && (
        <Text
          position={[0, -0.15, 0.17]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {icon}
        </Text>
      )}
    </group>
  );
}

function Scene({ color, label, icon }: { color: string; label: string; icon?: string }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, -3, 4]} intensity={0.8} color={color} />
      <pointLight position={[0, 5, -5]} intensity={0.6} color="#A855F7" />

      <BadgeMesh color={color} label={label} icon={icon} />

      <Environment preset="sunset" />

      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.6} />
      </EffectComposer>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} />
    </>
  );
}

export function TierBadge3D({ tier, size = 120 }: { tier: TierRank; size?: number }) {
  const color = getTierColor(tier);
  return (
    <div style={{ width: size, height: size }} className="select-none">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene color={color} label={tier.slice(0, 4)} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function CertBadge3D({ level, size = 100 }: { level: CertLevel; size?: number }) {
  const color = CERT_COLORS[level];
  const iconMap: Record<CertLevel, string> = { Diamond: '💎', Gold: '🏆', Silver: '🥈', None: '✦' };
  const labelMap: Record<CertLevel, string> = { Diamond: 'DIAMOND', Gold: 'GOLD', Silver: 'SILVER', None: 'NONE' };
  return (
    <div style={{ width: size, height: size }} className="select-none">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene color={color} label={labelMap[level]} icon={iconMap[level]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
