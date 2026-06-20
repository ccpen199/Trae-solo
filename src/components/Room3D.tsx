import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 6]} />
      <meshStandardMaterial color="#D4B896" roughness={0.8} />
    </mesh>
  )
}

function Wall({ position, rotation, size }: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#F7F3EE" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function WindowOpening() {
  return (
    <mesh position={[-3.99, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[2.5, 1.5]} />
      <meshStandardMaterial color="#B8D4E8" roughness={0.2} transparent opacity={0.4} />
    </mesh>
  )
}

function Ceiling() {
  return (
    <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 6]} />
      <meshStandardMaterial color="#FAFAFA" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Sofa() {
  return (
    <group position={[1.5, 0, -2.3]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2.4, 0.7, 0.9]} />
        <meshStandardMaterial color="#8B9E7E" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, -0.3]} castShadow>
        <boxGeometry args={[2.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#7A8D6E" roughness={0.7} />
      </mesh>
      <mesh position={[-1.05, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.9]} />
        <meshStandardMaterial color="#8B9E7E" roughness={0.7} />
      </mesh>
      <mesh position={[1.05, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.9]} />
        <meshStandardMaterial color="#8B9E7E" roughness={0.7} />
      </mesh>
    </group>
  )
}

function CoffeeTable() {
  return (
    <group position={[1.5, 0, -0.8]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.6]} />
        <meshStandardMaterial color="#C4A882" roughness={0.5} />
      </mesh>
      {[[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.13, z]} castShadow>
          <boxGeometry args={[0.06, 0.26, 0.06]} />
          <meshStandardMaterial color="#9A7B52" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Rug() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.01, -1]}>
      <planeGeometry args={[3, 2]} />
      <meshStandardMaterial color="#EDE5D8" roughness={0.95} />
    </mesh>
  )
}

function RoomScene() {
  return (
    <>
      <ambientLight intensity={0.5} color="#FFF5E6" />
      <directionalLight position={[5, 8, 3]} intensity={1} color="#FFF5E6" castShadow />
      <directionalLight position={[-3, 5, 2]} intensity={0.3} color="#F7F3EE" />
      <Floor />
      <Ceiling />
      <Wall position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} size={[6, 3]} />
      <Wall position={[4, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} size={[6, 3]} />
      <Wall position={[0, 1.5, -3]} rotation={[0, 0, 0]} size={[8, 3]} />
      <Wall position={[0, 1.5, 3]} rotation={[0, Math.PI, 0]} size={[8, 3]} />
      <WindowOpening />
      <Sofa />
      <CoffeeTable />
      <Rug />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={2} maxDistance={12} />
    </>
  )
}

export default function Room3D({ vrMode, onToggleVr }: { vrMode: boolean; onToggleVr: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleVrToggle = () => {
    if (!vrMode && containerRef.current) {
      containerRef.current.requestFullscreen?.()
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()
    }
    onToggleVr()
  }

  return (
    <div ref={containerRef} className="relative h-[500px] w-full overflow-hidden rounded-xl bg-sand-900 lg:h-[600px]">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-white/60">加载3D场景…</div>}>
        <Canvas shadows camera={{ position: [6, 4, 6], fov: 50 }}>
          <RoomScene />
        </Canvas>
      </Suspense>
      <button
        onClick={handleVrToggle}
        className="absolute top-4 right-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        {vrMode ? '退出全屏' : 'VR 全屏'}
      </button>
    </div>
  )
}
