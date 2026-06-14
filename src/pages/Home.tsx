import { useState, useEffect, useRef, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, useInView } from 'framer-motion'
import {
  ScanLine,
  TrendingUp,
  Store,
  Layers,
  Banknote,
  Sprout,
  Apple,
  Wheat,
  Beef,
  Fish,
  Truck,
} from 'lucide-react'
import { traceRecords, shops, supplyDemandItems, supervisionData } from '@/mocks'

function FarmGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#4a8c3f" />
    </mesh>
  )
}

function House({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.7]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <coneGeometry args={[0.7, 0.5, 4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  )
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#5c3d1e" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.35, 0.6, 6]} />
        <meshStandardMaterial color="#2d7a2d" />
      </mesh>
    </group>
  )
}

function FarmScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 10, 5]}
        intensity={1.2}
        color="#ffe4a0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <FarmGround />
      <House position={[-3, 0, -4]} />
      <House position={[4, 0, -5]} />
      <House position={[-5, 0, -2]} />
      <Tree position={[-1, 0, -2]} />
      <Tree position={[1, 0, -3]} />
      <Tree position={[3, 0, -1]} />
      <Tree position={[-4, 0, 1]} />
      <Tree position={[0, 0, 2]} />
      <Tree position={[6, 0, -3]} />
      <Tree position={[-6, 0, -4]} />
      <Tree position={[2, 0, 1]} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
        maxDistance={15}
        minDistance={8}
        enableZoom={false}
        enablePan={false}
      />
    </>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    let start: number | null = null
    let raf: number
    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [isInView, value])

  return (
    <p ref={ref} className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
      {display.toLocaleString()}
    </p>
  )
}

const stats = [
  { icon: ScanLine, label: '今日溯源查询', value: traceRecords.length * 3212, color: 'text-primary-600', bg: 'bg-primary-50' },
  { icon: Store, label: '在线商户', value: shops.length + supplyDemandItems.filter(s => s.type === 'supply').length + 3240, color: 'text-gold-600', bg: 'bg-gold-50' },
  { icon: Layers, label: '累计溯源批次', value: supervisionData.totalBatches, color: 'text-blue-600', bg: 'bg-blue-50', trend: `合格率 ${supervisionData.passRate}%` },
  { icon: Banknote, label: '交易总额', value: supervisionData.tracedBatches * 3100, color: 'text-earth-500', bg: 'bg-earth-50', display: `¥${((supervisionData.tracedBatches * 3100) / 100000000).toFixed(1)}亿` },
]

const categories = [
  { icon: Sprout, name: '蔬菜', emoji: '🥬' },
  { icon: Apple, name: '水果', emoji: '🍎' },
  { icon: Wheat, name: '粮食', emoji: '🌾' },
  { icon: Beef, name: '畜牧', emoji: '🐄' },
  { icon: Fish, name: '水产', emoji: '🐟' },
]

const tickerData = [
  'TR-2026-0001 有机西红柿 溯源查询完成',
  'TR-2026-0002 五常大米 批发交易 ¥12,500',
  'TR-2026-0003 新疆阿克苏苹果 冷链运输中',
  'TR-2026-0004 云南普洱茶 零售上架',
  '新商户「绿野农场」入驻 平台商户总数3,256',
  'TR-2026-0001 有机西红柿 农残检测通过',
  'TR-2026-0002 五常大米 产地认证通过',
  '区块链区块 #18923456 已确认',
]

const stageLabels: Record<string, string> = {
  production: '生产',
  processing: '加工',
  logistics: '物流',
  wholesale: '批发',
  retail: '零售',
}

const stageIcons: Record<string, typeof Sprout> = {
  production: Sprout,
  processing: Layers,
  logistics: Truck,
  wholesale: Store,
  retail: Banknote,
}

export default function Home() {
  const navigate = useNavigate()
  const [searchCode, setSearchCode] = useState('')

  const handleSearch = () => {
    if (searchCode.trim()) {
      navigate(`/trace/${searchCode.trim()}`)
    }
  }

  const latestActivities = traceRecords.flatMap((r) =>
    r.nodes.map((n) => ({
      ...n,
      productName: r.productName,
      stageLabel: stageLabels[n.stage],
      StageIcon: stageIcons[n.stage] || Sprout,
    }))
  )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6)

  return (
    <div>
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [6, 5, 8], fov: 50 }}
            shadows
            gl={{ antialias: true, alpha: false }}
          >
            <Suspense fallback={null}>
              <FarmScene />
            </Suspense>
          </Canvas>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/80 to-primary-700/60" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-white text-center font-bold leading-tight"
          >
            从田间到餐桌
            <br />
            全链条可信溯源
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-primary-100 text-lg md:text-xl text-center"
          >
            区块链存证 · 智能撮合 · 信用保障
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 w-full max-w-lg"
          >
            <div className="relative">
              <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入溯源码查询产品信息..."
                className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-lg"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                查询
              </button>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-primary-900/70 backdrop-blur-sm border-t border-primary-600/30">
          <div className="overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="flex whitespace-nowrap py-2.5"
            >
              {[...tickerData, ...tickerData].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-6 text-primary-100 text-sm">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full flex-shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-5 md:p-6 flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                  <div>
                    {stat.display ? (
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">{stat.display}</p>
                    ) : (
                      <AnimatedNumber value={stat.value} />
                    )}
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                  {i === 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp size={12} />
                      <span>+12.5%</span>
                    </div>
                  )}
                  {stat.trend && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp size={12} />
                      <span>{stat.trend}</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">产品分类</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {categories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 w-28 md:w-32 bg-white rounded-xl border-2 border-transparent hover:border-primary-500 shadow-sm p-5 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <Icon size={16} className="text-primary-400" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 pb-20">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8">最新动态</h2>
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-primary-100" />
            <div className="space-y-6">
              {latestActivities.map((activity, i) => {
                const StageIcon = activity.StageIcon
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative pl-10"
                  >
                    <div className="absolute left-0 top-1 w-[30px] h-[30px] bg-white border-2 border-primary-500 rounded-full flex items-center justify-center">
                      <StageIcon size={14} className="text-primary-600" />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium">
                          {activity.stageLabel}
                        </span>
                        <span className="text-xs text-gray-400">{activity.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">{activity.operator}</span>
                        {' · '}
                        {activity.productName} — {activity.location}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
