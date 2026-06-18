import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Float, TorusKnot } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Signal, Battery, Play, Pause, MessageCircle, Share2, Route, X } from 'lucide-react';
import { useScenicStore } from '@/store/useScenicStore';
import { getScenicArea } from '@/services/api';
import { getARContentByPOI } from '@/services/api';
import { formatDuration } from '@/utils/waveform';
import type { ScenicArea, POIPoint, InteractionNode } from '@/types';

type ARSupportStatus = 'checking' | 'supported' | 'unsupported';

function useARSupport() {
  const [status, setStatus] = useState<ARSupportStatus>('checking');
  useEffect(() => {
    const check = async () => {
      try {
        if (navigator.xr && navigator.xr.isSessionSupported) {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          setStatus(supported ? 'supported' : 'unsupported');
        } else {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          setStatus(gl ? 'supported' : 'unsupported');
        }
      } catch {
        setStatus('unsupported');
      }
    };
    check();
  }, []);
  return status;
}

function ARModel() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <TorusKnot args={[0.6, 0.2, 128, 32]}>
        <meshStandardMaterial color="#FF8F00" metalness={0.8} roughness={0.2} emissive="#FF8F00" emissiveIntensity={0.15} />
      </TorusKnot>
    </Float>
  );
}

function ARMarker({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.15, 0.22, 32]} />
      <meshBasicMaterial color="#FF8F00" transparent opacity={0.7} side={2} />
    </mesh>
  );
}

function ARScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
      <pointLight position={[-2, 2, -1]} intensity={0.5} color="#FF8F00" />
      <ARModel />
      <ARMarker position={[-0.8, -0.5, -1]} />
      <ARMarker position={[0.8, -0.5, -1.2]} />
      <ARMarker position={[0, -0.5, -0.8]} />
    </>
  );
}

function PulsingRing({ x, y }: { x: string; y: string }) {
  return (
    <span className="absolute" style={{ left: x, top: y }}>
      <span className="absolute w-8 h-8 rounded-full border-2 border-amber-500/60 animate-ping" />
      <span className="absolute w-3 h-3 rounded-full bg-amber-500 left-2.5 top-2.5" />
    </span>
  );
}

function InteractionModal({ interaction, onClose }: { interaction: InteractionNode; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl p-6 glass">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <h3 className="font-serif text-lg font-semibold mb-4">{interaction.question}</h3>
        <div className="space-y-2">
          {interaction.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                selected === null
                  ? 'bg-white/5 hover:bg-white/10'
                  : i === selected
                  ? opt.correct
                    ? 'bg-emerald-500/20 border border-emerald-500/50'
                    : 'bg-red-500/20 border border-red-500/50'
                  : opt.correct && selected !== null
                  ? 'bg-emerald-500/20 border border-emerald-500/50'
                  : 'bg-white/5'
              }`}
            >
              {opt.text}
              {selected !== null && i === selected && (
                <span className="ml-2">{opt.correct ? '✓' : '✗'}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ARView() {
  const { scenicId } = useParams<{ scenicId: string }>();
  const navigate = useNavigate();
  const arStatus = useARSupport();
  const { pois, tourRoutes, loadPOIs, loadTourRoutes } = useScenicStore();
  const [scenic, setScenic] = useState<ScenicArea | undefined>();
  const [currentPoi, setCurrentPoi] = useState<POIPoint | undefined>();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showInteraction, setShowInteraction] = useState<InteractionNode | null>(null);
  const [routeIdx, setRouteIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!scenicId) return;
    const area = getScenicArea(scenicId);
    setScenic(area);
    loadPOIs(scenicId);
    loadTourRoutes(scenicId);
  }, [scenicId, loadPOIs, loadTourRoutes]);

  useEffect(() => {
    if (pois.length > 0) setCurrentPoi(pois[0]);
  }, [pois]);

  useEffect(() => {
    if (!currentPoi) return;
    const ar = getARContentByPOI(currentPoi.id);
    if (ar?.audioTracks?.[0]) {
      setDuration(ar.audioTracks[0].duration);
    }
  }, [currentPoi]);

  useEffect(() => {
    if (playing && duration > 0) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= duration) {
            setPlaying(false);
            return duration;
          }
          return p + 0.5;
        });
      }, 500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, duration]);

  const interaction = useMemo(() => {
    if (!currentPoi) return undefined;
    const ar = getARContentByPOI(currentPoi.id);
    return ar?.interactions?.find((n) => n.type === 'quiz');
  }, [currentPoi]);

  if (arStatus === 'unsupported') {
    return (
      <div className="min-h-screen bg-[#0F1120] flex flex-col items-center justify-center text-white p-8">
        <p className="text-lg mb-4">您的设备暂不支持AR体验</p>
        <button
          onClick={() => navigate(`/visitor/poi/${scenicId}`)}
          className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-semibold"
        >
          进入图文导览
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-[#0D1342] to-gray-900" />

      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
          <ARScene />
        </Canvas>
      </div>

      <PulsingRing x="25%" y="60%" />
      <PulsingRing x="65%" y="55%" />
      <PulsingRing x="45%" y="70%" />

      <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between glass">
        <span className="text-sm font-medium text-white truncate">{scenic?.name || '加载中'}</span>
        <div className="flex items-center gap-3">
          <Signal className="w-4 h-4 text-emerald-400" />
          <Battery className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <button
        onClick={() => {
          if (tourRoutes.length === 0) return;
          const next = (routeIdx + 1) % tourRoutes.length;
          setRouteIdx(next);
          const route = tourRoutes[next];
          const poi = pois.find((p) => route.poiIds.includes(p.id));
          if (poi) setCurrentPoi(poi);
          setProgress(0);
          setPlaying(false);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full glass z-10"
      >
        <Route className="w-5 h-5 text-amber-500" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 glass rounded-t-3xl p-5">
        <div className="mb-3">
          <h3 className="font-serif text-lg font-semibold text-white">{currentPoi?.name || '景点'}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{currentPoi?.description}</p>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setPlaying(!playing)}
            className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0"
          >
            {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{formatDuration(progress)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {interaction && (
            <button
              onClick={() => setShowInteraction(interaction)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-900/60 text-sm text-white flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              互动
            </button>
          )}
          <button className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm text-white flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showInteraction && (
          <InteractionModal interaction={showInteraction} onClose={() => setShowInteraction(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
