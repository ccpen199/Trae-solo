interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  color = '#0F4C81',
  width = 120,
  height = 40,
  strokeWidth = 2,
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  // 计算数据范围
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // 内边距
  const padding = strokeWidth;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // 生成坐标点
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
    const y = padding + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y };
  });

  // 生成折线路径
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  // 生成填充区域路径 (折线底部到底边)
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(2)} ${(padding + innerHeight).toFixed(2)}` +
    ` L ${points[0].x.toFixed(2)} ${(padding + innerHeight).toFixed(2)} Z`;

  // 生成渐变ID
  const gradientId = `sparkline-gradient-${color.replace('#', '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      <defs>
        {/* 线性渐变填充 */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 渐变填充区域 */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* 折线 */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 最后一个数据点高亮圆点 */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={strokeWidth + 1}
          fill={color}
          opacity="0.9"
        />
      )}
    </svg>
  );
}
