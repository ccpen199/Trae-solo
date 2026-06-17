const stats = [
  { label: '联盟商户', value: '12,530+' },
  { label: '会员总数', value: '38.7万+' },
  { label: '累计GMV', value: '¥1.63亿' },
  { label: '跨城消费', value: '15.6万笔' },
]

const separator = <span className="text-jinguan-400 mx-4 text-xs">◆</span>

function MarqueeContent() {
  return (
    <>
      {stats.map((stat, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="text-jinguan-400 text-sm font-semibold mr-1.5">{stat.value}</span>
          <span className="text-white/80 text-sm">{stat.label}</span>
          {i < stats.length - 1 && separator}
        </span>
      ))}
    </>
  )
}

export default function Marquee() {
  return (
    <div className="w-full bg-wudu-900 border-t border-b border-jinguan-400/10 overflow-hidden">
      <div className="animate-marquee flex items-center py-2.5 w-max">
        <MarqueeContent />
        {separator}
        <MarqueeContent />
        {separator}
      </div>
    </div>
  )
}
