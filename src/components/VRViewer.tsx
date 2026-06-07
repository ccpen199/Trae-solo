import { useState, useRef, useEffect, useCallback } from 'react'
import { Palette, Sofa, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FurnitureOption {
  id: string
  name: string
  color: string
  position: { x: number; y: number; z: number }
  scale: number
}

interface MaterialOption {
  id: string
  name: string
  texture: string
  color: string
}

interface VRViewerProps {
  panoramaImage?: string
}

const defaultPanorama = 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=1600&h=800'

const furnitureOptions: FurnitureOption[] = [
  { id: 'sofa-modern', name: '现代沙发', color: '#2563eb', position: { x: 0, y: 20, z: -80 }, scale: 1 },
  { id: 'sofa-leather', name: '皮质沙发', color: '#78350f', position: { x: 0, y: 20, z: -80 }, scale: 1.1 },
  { id: 'sofa-minimal', name: '简约沙发', color: '#64748b', position: { x: 0, y: 20, z: -80 }, scale: 0.9 },
]

const materialOptions: MaterialOption[] = [
  { id: 'floor-wood', name: '木地板', texture: 'linear-gradient(135deg, #8B4513 25%, #A0522D 25%, #A0522D 50%, #8B4513 50%, #8B4513 75%, #A0522D 75%)', color: '#8B4513' },
  { id: 'floor-marble', name: '大理石', texture: 'linear-gradient(135deg, #f5f5f5 25%, #e0e0e0 25%, #e0e0e0 50%, #f5f5f5 50%, #f5f5f5 75%, #e0e0e0 75%)', color: '#f5f5f5' },
  { id: 'floor-tile', name: '瓷砖', texture: 'linear-gradient(135deg, #d4d4d4 25%, #e5e5e5 25%, #e5e5e5 50%, #d4d4d4 50%, #d4d4d4 75%, #e5e5e5 75%)', color: '#d4d4d4' },
  { id: 'wall-white', name: '白色墙面', texture: 'none', color: '#f8fafc' },
  { id: 'wall-beige', name: '米色墙面', texture: 'none', color: '#fef3c7' },
  { id: 'wall-blue', name: '蓝色墙面', texture: 'none', color: '#dbeafe' },
]

export default function VRViewer({ panoramaImage = defaultPanorama }: VRViewerProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [selectedFurniture, setSelectedFurniture] = useState(furnitureOptions[0])
  const [selectedFloor, setSelectedFloor] = useState(materialOptions[0])
  const [selectedWall, setSelectedWall] = useState(materialOptions[3])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'furniture' | 'material'>('furniture')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.clientX - rotation.y * 2, y: e.clientY + rotation.x * 2 })
  }, [rotation])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const newY = (e.clientX - startPos.x) / 2
    const newX = (startPos.y - e.clientY) / 2
    setRotation({
      x: Math.max(-45, Math.min(45, newX)),
      y: newY % 360,
    })
  }, [isDragging, startPos])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const faceStyle = (index: number) => {
    const positions = [
      { rotateY: 0, translateZ: 400 },
      { rotateY: 90, translateZ: 400 },
      { rotateY: 180, translateZ: 400 },
      { rotateY: 270, translateZ: 400 },
      { rotateX: 90, translateZ: 400 },
      { rotateX: -90, translateZ: 400 },
    ]
    const pos = positions[index]
    const offsetX = index < 4 ? index * 25 : (index - 4) * 50
    
    return {
      width: '800px',
      height: '800px',
      transform: `rotateY(${pos.rotateY}deg) rotateX(${pos.rotateX || 0}deg) translateZ(${pos.translateZ}px)`,
      backgroundImage: `url(${panoramaImage})`,
      backgroundPosition: `${offsetX}% ${index < 4 ? '0%' : index === 4 ? '100%' : '50%'}`,
      backgroundSize: '400% 200%',
    }
  }

  return (
    <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden" style={{ height: '500px' }}>
      <div
        ref={containerRef}
        className="vr-viewer w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{ perspective: '1000px' }}
      >
        <div
          className="vr-scene w-full h-full relative"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            width: '800px',
            height: '800px',
            left: '50%',
            top: '50%',
            marginLeft: '-400px',
            marginTop: '-400px',
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="vr-face"
              style={{
                ...faceStyle(i),
                position: 'absolute',
                left: 0,
                top: 0,
                filter: i === 5 ? `hue-rotate(0deg) sepia(0.2) brightness(0.8)` : undefined,
              }}
            />
          ))}

          <div
            className="absolute rounded-lg shadow-2xl"
            style={{
              width: '200px',
              height: '100px',
              backgroundColor: selectedFurniture.color,
              transform: `translate3d(${selectedFurniture.position.x}px, ${selectedFurniture.position.y}px, ${selectedFurniture.position.z}px) scale(${selectedFurniture.scale})`,
              boxShadow: `0 10px 40px ${selectedFurniture.color}40`,
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute inset-2 bg-white/20 rounded" />
            <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium text-center">
              {selectedFurniture.name}
            </div>
          </div>

          <div
            className="absolute"
            style={{
              width: '800px',
              height: '800px',
              transform: 'rotateX(90deg) translateZ(-350px)',
              background: selectedFloor.texture !== 'none' ? selectedFloor.texture : selectedFloor.color,
              backgroundSize: '40px 40px',
              opacity: 0.8,
            }}
          />

          <div
            className="absolute"
            style={{
              width: '800px',
              height: '800px',
              transform: 'rotateX(-90deg) translateZ(-350px)',
              backgroundColor: selectedWall.color,
              opacity: 0.9,
            }}
          />
        </div>
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full">
          <Maximize2 size={16} strokeWidth={1.5} />
          360° 全景
        </div>
        <div className="px-3 py-1.5 bg-black/60 text-white text-sm rounded-full">
          拖动鼠标旋转视角
        </div>
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-lg hover:bg-slate-50 transition-colors"
      >
        {sidebarOpen ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
        <span className="text-sm font-medium text-slate-700">家具/材质</span>
      </button>

      {sidebarOpen && (
        <div className="absolute top-16 right-4 bottom-4 w-64 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 overflow-y-auto z-10">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('furniture')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'furniture'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Sofa size={16} strokeWidth={1.5} />
              家具
            </button>
            <button
              onClick={() => setActiveTab('material')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'material'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Palette size={16} strokeWidth={1.5} />
              材质
            </button>
          </div>

          {activeTab === 'furniture' && (
            <div className="space-y-3">
              {furnitureOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedFurniture(item)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                    selectedFurniture.id === item.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-200'
                  )}
                >
                  <div
                    className="w-12 h-8 rounded shadow-inner"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">点击更换</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'material' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">地板材质</p>
                <div className="grid grid-cols-3 gap-2">
                  {materialOptions.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFloor(item)}
                      className={cn(
                        'aspect-square rounded-lg border-2 transition-all overflow-hidden',
                        selectedFloor.id === item.id
                          ? 'border-teal-500 ring-2 ring-teal-200'
                          : 'border-slate-200 hover:border-teal-200'
                      )}
                      style={{
                        background: item.texture !== 'none' ? item.texture : item.color,
                        backgroundSize: item.texture !== 'none' ? '20px 20px' : undefined,
                      }}
                      title={item.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedFloor.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">墙面颜色</p>
                <div className="grid grid-cols-3 gap-2">
                  {materialOptions.slice(3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedWall(item)}
                      className={cn(
                        'aspect-square rounded-lg border-2 transition-all',
                        selectedWall.id === item.id
                          ? 'border-teal-500 ring-2 ring-teal-200'
                          : 'border-slate-200 hover:border-teal-200'
                      )}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedWall.name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full text-white text-xs">
          <span className="text-teal-300">提示:</span> 按住鼠标左键拖动可旋转视角，右侧面板可更换家具和材质
        </div>
      </div>
    </div>
  )
}
