import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

function DefaultModel() {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
      <mesh>
        <torusGeometry args={[1.2, 0.4, 32, 64]} />
        <meshStandardMaterial color="#FF8F00" metalness={0.7} roughness={0.2} />
      </mesh>
    </Float>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#FFE0B2" />
      <pointLight position={[-3, 2, -2]} intensity={0.8} color="#FF8F00" />
    </>
  );
}

function PostEffects() {
  return (
    <EffectComposer>
      <Bloom intensity={0.5} luminanceThreshold={0.8} />
      <Vignette darkness={0.5} />
    </EffectComposer>
  );
}

interface ModelPreviewProps {
  modelUrl?: string;
}

export default function ModelPreview({ modelUrl }: ModelPreviewProps) {
  return (
    <div className="w-full h-full bg-indigo-950 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <SceneLights />
        {modelUrl ? (
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#1A237E" metalness={0.5} roughness={0.3} />
          </mesh>
        ) : (
          <DefaultModel />
        )}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={15}
        />
        <PostEffects />
      </Canvas>
    </div>
  );
}
