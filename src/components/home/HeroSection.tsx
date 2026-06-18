export default function HeroSection() {
  const stats = [
    { label: '参保人数', value: '1280万+' },
    { label: '累计服务', value: '5.6亿次' },
    { label: '群众满意度', value: '98.5%' },
  ]

  return (
    <div className="bg-gradient-to-r from-[#165DFF] to-[#0E42D2] rounded-xl px-10 py-12 mb-8">
      <h1 className="text-4xl font-bold text-white mb-3">省级社保公共服务门户</h1>
      <p className="text-lg text-white/80 mb-8">社保服务 温暖民心 一网通办 便民惠企</p>
      <div className="flex gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/15 backdrop-blur rounded-lg px-6 py-4 min-w-[160px]">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-white/70 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
