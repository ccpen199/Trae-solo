import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Exercise() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(480);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    {
      title: "第一式：两手托天理三焦",
      duration: "1分钟",
      description:
        "两脚开立，与肩同宽，两臂自然下垂于体侧。两臂从体侧缓缓上举，至头顶时十指交叉，掌心向上，用力托举，同时脚跟抬起，稍作停顿后，两臂从体前缓缓下落，脚跟落地。重复做8次。",
      tips: "托举时要吸气，下落时呼气，动作要缓慢均匀。",
    },
    {
      title: "第二式：左右开弓似射雕",
      duration: "1分钟",
      description:
        "两脚开立，略宽于肩，屈膝下蹲成马步。两拳握于腰间，左拳向左缓缓推出，拳眼朝上，同时右拳向右拉，如拉弓状，头向左转，目视左拳。稍停后收回，换右侧做同样动作。左右各做4次。",
      tips: "拉弓时要挺胸塌腰，目光注视推出的拳头。",
    },
    {
      title: "第三式：调理脾胃须单举",
      duration: "1分钟",
      description:
        "自然站立，右手从体侧上举至头顶上方，掌心向上，指尖向左，用力托举，同时左手下按，掌心向下，指尖向前。稍停后，右手从体侧下落，左手同时上举，交替进行。左右各做4次。",
      tips: "上举下按时要用力，保持身体正直，不要歪斜。",
    },
    {
      title: "第四式：五劳七伤往后瞧",
      duration: "1分钟",
      description:
        "自然站立，两脚开立与肩同宽。两手自然下垂，头部缓缓向左后方转动，目视左后方，稍停后还原。然后头部缓缓向右后方转动，目视右后方，稍停后还原。左右各做8次。",
      tips: "转头时身体保持不动，转动要缓慢，速度均匀。",
    },
    {
      title: "第五式：摇头摆尾去心火",
      duration: "1分钟",
      description:
        "两脚开立，屈膝下蹲成马步，两手按于膝盖上。上体缓缓向左前方俯，然后向右、向后、向左做圆周摇转，同时臀部相应摆动。左右各做4次。",
      tips: "摇转时要自然放松，不要过于用力，呼吸要均匀。",
    },
    {
      title: "第六式：两手攀足固肾腰",
      duration: "1分钟",
      description:
        "自然站立，两臂上举，掌心向前。上体缓缓前屈，两手向下攀握脚尖，稍停后缓缓起身，两手沿两腿后侧上移至腰部，掌心向后，上体向后仰，然后两臂还原。重复做6次。",
      tips: "前屈时两腿伸直，不要弯曲，动作要缓慢。",
    },
    {
      title: "第七式：攒拳怒目增气力",
      duration: "1分钟",
      description:
        "两脚开立，屈膝下蹲成马步，两手握拳抱于腰间。左拳向前缓缓冲出，拳眼朝上，同时两眼圆睁，目视左拳，然后收回。换右拳同样动作。左右各做4次。",
      tips: "冲拳时要用力，怒目圆睁，收回时要放松。",
    },
    {
      title: "第八式：背后七颠百病消",
      duration: "1分钟",
      description:
        "自然站立，两脚并拢，两手自然下垂。脚跟缓缓抬起，尽量抬高，用脚尖支撑身体，稍停后脚跟轻轻下落，但不要完全着地，再抬起，再下落。连续做7次后，脚跟落地放松。",
      tips: "抬起时要吸气，下落时要呼气，下落时要轻缓。",
    },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 1, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const playbackRateLabel =
    playbackRate === 0.5 ? "0.5x" : playbackRate === 1 ? "1.0x" : "1.5x";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            八段锦教学
          </h1>
          <div className="w-14" />
        </div>

        <div className="bg-black rounded-3xl overflow-hidden mb-8 relative">
          <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
            <img
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20people%20practicing%20baduanjin%20qigong%20in%20a%20park%20traditional%20chinese%20exercise%20soft%20morning%20light&image_size=landscape_16_9"
              alt="八段锦"
              className="w-full h-full object-cover opacity-60"
            />
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              poster="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20people%20practicing%20baduanjin%20qigong%20in%20a%20park%20traditional%20chinese%20exercise%20soft%20morning%20light&image_size=landscape_16_9"
              onTimeUpdate={(e) =>
                setCurrentTime(e.currentTarget.currentTime)
              }
              onLoadedMetadata={(e) =>
                setDuration(e.currentTarget.duration)
              }
            >
              <source src="" type="video/mp4" />
            </video>

            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                  <Play size={64} className="text-orange-500 ml-2" />
                </div>
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-4 bg-gray-600 rounded-full appearance-none cursor-pointer accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 ${
                    (currentTime / duration) * 100
                  }%, #4b5563 ${(currentTime / duration) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[20px] text-gray-300 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => skip(-10)}
                  className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Rewind size={32} />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  {isPlaying ? (
                    <Pause size={64} />
                  ) : (
                    <Play size={64} className="ml-2" />
                  )}
                </button>
                <button
                  onClick={() => skip(10)}
                  className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <FastForward size={32} />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={toggleMute}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-gray-300 active:scale-95 transition-transform"
                >
                  {isMuted ? (
                    <VolumeX size={36} />
                  ) : (
                    <Volume2 size={36} />
                  )}
                </button>
                <button
                  onClick={changePlaybackRate}
                  className="px-6 py-3 bg-gray-700 rounded-xl text-white text-[22px] font-bold active:scale-95 transition-transform"
                >
                  {playbackRateLabel}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[28px] font-bold text-gray-800">
              全程约8分钟 · 每天1-2次
            </h2>
            <span className="bg-green-500 text-white px-4 py-2 rounded-xl text-[20px] font-bold">
              适合初学者
            </span>
          </div>
          <p className="text-[22px] text-gray-600 leading-relaxed">
            八段锦是中国传统养生功法，动作柔和缓慢，适合中老年人练习。
            经常练习可以强身健体、疏通经络、调节气血。请在宽敞通风的地方练习，
            穿着舒适的衣服，练习前先做简单的热身活动。
          </p>
        </div>

        <h2 className="text-[28px] font-bold text-gray-800 mb-6">
          分步教学
        </h2>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedStep(expandedStep === index ? null : index)
                }
                className="w-full p-6 flex items-center justify-between text-left active:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="bg-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-[24px] font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[24px] font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-[20px] text-gray-500 mt-1">
                      {step.duration}
                    </p>
                  </div>
                </div>
                {expandedStep === index ? (
                  <ChevronUp size={36} className="text-gray-400" />
                ) : (
                  <ChevronDown size={36} className="text-gray-400" />
                )}
              </button>

              {expandedStep === index && (
                <div className="px-6 pb-6">
                  <div className="bg-orange-50 rounded-xl p-6 mb-4">
                    <p className="text-[22px] text-gray-700 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <p className="text-[20px] text-yellow-800">
                      💡 要点：{step.tips}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
