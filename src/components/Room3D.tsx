import { useRef, useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, DeviceOrientationControls } from '@react-three/drei'
import * as THREE from 'three'
import { Move3d, Smartphone, Maximize2, Minimize2, RotateCcw } from 'lucide-react'

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

function Plant() {
  return (
    <group position={[-2.8, 0, 2.2]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.6, 16]} />
        <meshStandardMaterial color="#A67B5B" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#5A7A4A" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 1.1, 0.1]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#6A8A5A" roughness={0.9} />
      </mesh>
    </group>
  )
}

function FloorLamp() {
  return (
    <group position={[3, 0, 2.2]}>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.04, 16]} />
        <meshStandardMaterial color="#3A3A3A" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#3A3A3A" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <coneGeometry args={[0.3, 0.4, 16, 1, true]} />
        <meshStandardMaterial color="#F5E6D0" side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <pointLight position={[0, 1.55, 0]} intensity={0.8} color="#FFE4C4" distance={5} />
    </group>
  )
}

function Bookshelf() {
  return (
    <group position={[-3.5, 0, -2]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 2.4, 0.35]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.7} />
      </mesh>
      {[0.4, 1.0, 1.6, 2.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0.01]}>
          <boxGeometry args={[0.72, 0.02, 0.32]} />
          <meshStandardMaterial color="#6B4F27" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function RoomScene({ isMobile }: { isMobile: boolean }) {
  const controlsRef = useRef<any>(null)

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <>
      <ambientLight intensity={0.5} color="#FFF5E6" />
      <directionalLight position={[5, 8, 3]} intensity={1} color="#FFF5E6" castShadow shadow-mapSize={[2048, 2048]} />
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
      <Plant />
      <FloorLamp />
      <Bookshelf />
      {isMobile ? (
        <DeviceOrientationControls ref={controlsRef} />
      ) : (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={2}
          maxDistance={12}
          target={[0, 1.2, 0]}
        />
      )}
    </>
  )
}

export default function Room3D({ vrMode, onToggleVr }: { vrMode: boolean; onToggleVr: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowTip(false), 5000)
    return () => clearTimeout(timer)
  }, [vrMode])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleVrToggle = async () => {
    if (!isFullscreen && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen()
      } catch (e) {
        console.warn('Fullscreen not available:', e)
      }
    } else if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (e) {
        console.warn('Exit fullscreen failed:', e)
      }
    }
    onToggleVr()
  }

  const containerCls = vrMode || isFullscreen
    ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none'
    : 'relative h-[500px] w-full overflow-hidden rounded-xl bg-sand-900 lg:h-[600px]'

  return (
    <div ref={containerRef} className={`${containerCls} bg-sand-900`}>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-white/60">加载3D场景…</div>}>
        <Canvas
          shadows
          camera={{ position: [5, 3.5, 5.5], fov: 55, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          <RoomScene isMobile={isMobile && (vrMode || isFullscreen)} />
        </Canvas>
      </Suspense>

      <button
        onClick={handleVrToggle}
        className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        {vrMode || isFullscreen ? <><Minimize2 size={16} /> 退出全屏</> : <><Maximize2 size={16} /> VR 全屏</>}
      </button>

      {(vrMode || isFullscreen) && (
        <button
          onClick={() => setShowTip(v => !v)}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          {isMobile ? <Smartphone size={14} /> : <Move3d size={14} />}
          {isMobile ? '陀螺仪控制' : '鼠标控制'}
        </button>
      )}

      {showTip && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black/50 px-5 py-3 text-sm text-white backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {isMobile ? (
              <>
                <Smartphone size={16} />
                <span>VR模式：移动手机即可环视四周，点击右上角退出</span>
              </>
            ) : (
              <>
                <Move3d size={16} />
                <span>鼠标左键旋转 · 滚轮缩放 · 右键平移</span>
              </>
            )}
          </div>
        </div>
      )}

      {showTip && !vrMode && !isFullscreen && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black/50 px-5 py-3 text-sm text-white backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {isMobile ? (
              <>
                <Smartphone size={16} />
                <span>手指滑动旋转 · 双指缩放 · 点击 VR 全屏开启陀螺仪</span>
              </>
            ) : (
              <>
                <Move3d size={16} />
                <span>鼠标左键旋转视角 · 滚轮缩放远近 · 右键平移视图</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
