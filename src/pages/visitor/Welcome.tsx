import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Loader2, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useScenicStore } from '@/store/useScenicStore';
import { getScenicArea } from '@/services/api';
import type { ScenicArea } from '@/types';

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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Welcome() {
  const { scenicId } = useParams<{ scenicId: string }>();
  const navigate = useNavigate();
  const { tourRoutes, loadTourRoutes, loadPOIs } = useScenicStore();
  const [scenic, setScenic] = useState<ScenicArea | undefined>();
  const arStatus = useARSupport();

  useEffect(() => {
    if (!scenicId) return;
    const area = getScenicArea(scenicId);
    setScenic(area);
    loadPOIs(scenicId);
    loadTourRoutes(scenicId);
  }, [scenicId, loadPOIs, loadTourRoutes]);

  if (!scenic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1120]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <div className="relative h-72 overflow-hidden">
        <img
          src={scenic.coverImage || `https://picsum.photos/seed/${scenic.id}/800/400`}
          alt={scenic.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0F1120]" />
        <div className="absolute bottom-6 left-5 right-5">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl font-bold leading-tight"
          >
            {scenic.name}
          </motion.h1>
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="px-5 pb-32 space-y-5"
      >
        <motion.p variants={fadeUp} className="text-sm text-gray-400 leading-relaxed mt-2">
          {scenic.description}
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-4 glass"
        >
          <div className="flex items-center gap-3">
            {arStatus === 'checking' && (
              <>
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                <span className="text-sm text-gray-300">正在检测设备AR兼容性…</span>
              </>
            )}
            {arStatus === 'supported' && (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300">您的设备支持AR体验</span>
              </>
            )}
            {arStatus === 'unsupported' && (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-yellow-300">建议使用图文导览模式</span>
              </>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold mb-3">选择导览路线</h2>
          <div className="space-y-3">
            {tourRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => navigate(`/visitor/ar/${scenicId}`)}
                className="w-full text-left rounded-2xl p-4 glass hover:border-amber-600/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{route.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {route.estimatedDuration}分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {route.poiIds.length}个景点
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0F1120] via-[#0F1120] to-transparent">
        <button
          onClick={() => navigate(`/visitor/ar/${scenicId}`)}
          className="w-full py-4 rounded-2xl bg-amber-600 text-white font-semibold text-base active:scale-[0.98] transition-transform"
        >
          开始AR导览
        </button>
        <Link
          to={`/visitor/poi/${scenicId}`}
          className="block text-center mt-3 text-sm text-gray-400 underline underline-offset-4"
        >
          图文导览
        </Link>
      </div>
    </div>
  );
}
