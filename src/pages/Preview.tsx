import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import { X, Rotate3d, ZoomIn, Shield, Copy, Check, Link2 } from "lucide-react";
import { mockAccounts } from "@/data/mockData";

const account = mockAccounts[0];
const rarityColor: Record<string, string> = {
  legendary: "bg-cyber-gold/20 text-cyber-gold border-cyber-gold/40",
  epic: "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40",
  rare: "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40",
};

const escrowBadge: Record<string, { label: string; cls: string }> = {
  selling: { label: "资金托管中", cls: "bg-blue-500/20 text-blue-400 border border-blue-400/30" },
  rented: { label: "租赁托管中", cls: "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30" },
  available: { label: "可交易", cls: "bg-cyber-green/20 text-cyber-green border border-cyber-green/30" },
};

function WeaponMesh() {
  const ref = useRef<any>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
      ref.current.rotation.x += delta * 0.15;
    }
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[1.4, 0]} />
      <meshStandardMaterial color="#00F0FF" metalness={0.9} roughness={0.15} emissive="#00F0FF" emissiveIntensity={0.3} />
    </mesh>
  );
}

function ArmorRing() {
  const ref = useRef<any>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.25;
      ref.current.rotation.z += delta * 0.1;
    }
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[2.2, 0.08, 16, 64]} />
      <meshStandardMaterial color="#A855F7" metalness={0.85} roughness={0.2} emissive="#A855F7" emissiveIntensity={0.25} />
    </mesh>
  );
}

function OrbitingItem({ offset }: { offset: number }) {
  const ref = useRef<any>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() + offset;
      ref.current.position.x = Math.cos(t * 0.6) * 3;
      ref.current.position.z = Math.sin(t * 0.6) * 3;
      ref.current.position.y = Math.sin(t * 1.2) * 0.6;
      ref.current.rotation.y += 0.02;
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial color="#00F0FF" metalness={0.8} roughness={0.2} emissive="#00F0FF" emissiveIntensity={0.5} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 3, 2]} intensity={2} color="#00F0FF" distance={15} />
      <pointLight position={[-4, -2, 3]} intensity={1.5} color="#A855F7" distance={12} />
      <Stars radius={80} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />
      <WeaponMesh />
      <ArmorRing />
      {[0, 2.1, 4.2].map((offset) => (
        <OrbitingItem key={offset} offset={offset} />
      ))}
      <OrbitControls enablePan={false} minDistance={3} maxDistance={10} autoRotate autoRotateSpeed={0.5} />
      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
      </EffectComposer>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#050510]">
      <div className="text-cyber-cyan font-orbitron text-xl animate-pulse">Loading 3D Scene...</div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer">
      {copied ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function Preview() {
  const [selected, setSelected] = useState<typeof account.equipmentSnapshot[0] | null>(null);
  const escrow = escrowBadge[account.status] ?? escrowBadge.available;
  const legendaryCount = account.equipmentSnapshot.filter((e) => e.rarity === "legendary").length;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050510]">
      <div className="w-full h-[70vh]">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas camera={{ position: [0, 1, 6], fov: 55 }} gl={{ antialias: true }}>
            <Scene />
          </Canvas>
        </Suspense>
      </div>

      <div className="absolute top-4 right-4 glass-panel p-3 z-10 min-w-[180px]">
        <div className="flex items-center gap-3 mb-2">
          <img src={account.imageUrl} alt="" className="w-10 h-10 rounded object-cover border border-cyber-border" />
          <div>
            <div className="text-xs text-cyber-cyan font-orbitron flex items-center gap-1">
              <Rotate3d className="w-3 h-3" /> 3D预览模式
            </div>
            <div className="text-[10px] text-cyber-muted">
              装备 {account.equipmentSnapshot.length} · 传说 {legendaryCount}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 glass-panel border-t border-cyber-border p-4 z-10 max-h-[45vh] overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron text-lg text-white neon-text">{account.gameName}</h2>
                <span className="text-xs text-cyber-muted font-mono">{account.gameUid}</span>
              </div>
              <p className="text-cyber-muted text-sm">{account.server} · {account.region} · Lv.{account.level} · {account.owner}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green/30 flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> ✓ 已上链
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${escrow.cls}`}>{escrow.label}</span>
                {account.insuranceActive ? (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green/30 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> 保险生效中
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-400/30">未投保</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-cyber-muted">
                  snapshot: <span className="font-mono text-cyber-cyan/80">{account.snapshotHash}</span>
                  <CopyBtn text={account.snapshotHash} />
                </span>
                <span className="flex items-center gap-1 text-cyber-muted">
                  txHash: <span className="font-mono text-cyber-cyan/80">{account.chainTxHash}</span>
                  <CopyBtn text={account.chainTxHash} />
                </span>
              </div>
            </div>
            <div className="font-orbitron text-3xl text-cyber-gold neon-text shrink-0">¥{account.valuation.toLocaleString()}</div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {account.equipmentSnapshot.map((eq) => (
              <button
                key={eq.id}
                onClick={() => setSelected(eq)}
                className={`shrink-0 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-all hover:scale-105 flex flex-col items-start gap-0.5 ${rarityColor[eq.rarity] || "border-cyber-border text-white/70"}`}
              >
                <span>{eq.name}</span>
                <span className="text-[10px] opacity-70">{eq.type} · Lv.{eq.level}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 text-cyber-muted text-xs z-10">
        <span className="flex items-center gap-1"><Rotate3d className="w-3.5 h-3.5" /> 拖拽旋转</span>
        <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> 滚轮缩放</span>
      </div>

      {selected && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelected(null)}
        >
          <motion.div
            className="glass-panel glow-border p-6 rounded-xl max-w-sm w-full mx-4 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-cyber-muted hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-orbitron text-lg text-white mb-1">{selected.name}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs border ${rarityColor[selected.rarity]}`}>{selected.rarity}</span>
              <span className="text-cyber-muted text-xs">{selected.type} · Lv.{selected.level}</span>
            </div>
            {Object.keys(selected.stats).length > 0 && (
              <div className="space-y-1.5 mb-3">
                {Object.entries(selected.stats).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-cyber-muted">{key}</span>
                    <span className="text-cyber-cyan font-orbitron">{val as number}</span>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(selected.stats).length === 0 && (
              <p className="text-cyber-muted text-sm">此装备无属性数据</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
