import { Card, Progress, Rate } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import { formatAmount } from '@/utils/format';

const weeklyEarnings = [
  { day: '周一', value: 256 },
  { day: '周二', value: 312 },
  { day: '周三', value: 289 },
  { day: '周四', value: 345 },
  { day: '周五', value: 402 },
  { day: '周六', value: 378 },
  { day: '周日', value: 298 },
];

const weeklyOrders = [
  { day: '周一', value: 18 },
  { day: '周二', value: 22 },
  { day: '周三', value: 20 },
  { day: '周四', value: 25 },
  { day: '周五', value: 29 },
  { day: '周六', value: 26 },
  { day: '周日', value: 21 },
];

const orderTypeDistribution = [
  { name: '餐饮外卖', percent: 45, color: '#3B82F6' },
  { name: '生鲜果蔬', percent: 25, color: '#10B981' },
  { name: '药品配送', percent: 15, color: '#F59E0B' },
  { name: '鲜花蛋糕', percent: 10, color: '#EC4899' },
  { name: '其他', percent: 5, color: '#8B5CF6' },
];

const buildLinePath = (data: { value: number }[], width: number, height: number, padding: number) => {
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return `M ${points.join(' L ')}`;
};

const buildAreaPath = (data: { value: number }[], width: number, height: number, padding: number) => {
  const linePath = buildLinePath(data, width, height, padding);
  const stepX = (width - padding * 2) / (data.length - 1);
  const endX = padding + (data.length - 1) * stepX;
  return `${linePath} L ${endX},${height - padding} L ${padding},${height - padding} Z`;
};

const RiderStats: React.FC = () => {
  const chartWidth = 340;
  const chartHeight = 180;
  const padding = 30;

  const lineData = weeklyEarnings.map((d) => ({ value: d.value }));
  const linePath = buildLinePath(lineData, chartWidth, chartHeight, padding);
  const areaPath = buildAreaPath(lineData, chartWidth, chartHeight, padding);

  const maxOrders = Math.max(...weeklyOrders.map((d) => d.value));
  const maxEarnings = Math.max(...weeklyEarnings.map((d) => d.value));

  const pieRadius = 60;
  const pieCenter = 80;
  let cumulativePercent = 0;
  const pieSegments = orderTypeDistribution.map((item) => {
    const startPercent = cumulativePercent;
    cumulativePercent += item.percent;
    const endPercent = cumulativePercent;

    const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;

    const x1 = pieCenter + pieRadius * Math.cos(startAngle);
    const y1 = pieCenter + pieRadius * Math.sin(startAngle);
    const x2 = pieCenter + pieRadius * Math.cos(endAngle);
    const y2 = pieCenter + pieRadius * Math.sin(endAngle);

    const largeArc = item.percent > 50 ? 1 : 0;

    const innerRadius = pieRadius - 20;
    const ix1 = pieCenter + innerRadius * Math.cos(startAngle);
    const iy1 = pieCenter + innerRadius * Math.sin(startAngle);
    const ix2 = pieCenter + innerRadius * Math.cos(endAngle);
    const iy2 = pieCenter + innerRadius * Math.sin(endAngle);

    const d = [
      `M ${x1} ${y1}`,
      `A ${pieRadius} ${pieRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    return { ...item, d };
  });

  return (
    <div className="page-container pb-20">
      <PageHeader title="运营数据" />

      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <Card size="small" className="shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarOutlined className="text-green-500" />
              <span className="text-sm text-gray-500">今日收入</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatAmount(298)}</p>
            <p className="text-xs text-green-500 mt-1">↑ 12.5% 较昨日</p>
          </Card>

          <Card size="small" className="shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCartOutlined className="text-blue-500" />
              <span className="text-sm text-gray-500">今日接单</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">21 单</p>
            <p className="text-xs text-blue-500 mt-1">↑ 3 单 较昨日</p>
          </Card>

          <Card size="small" className="shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarOutlined className="text-purple-500" />
              <span className="text-sm text-gray-500">本周收入</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatAmount(2280)}</p>
            <p className="text-xs text-purple-500 mt-1">↑ 8.3% 较上周</p>
          </Card>

          <Card size="small" className="shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCartOutlined className="text-orange-500" />
              <span className="text-sm text-gray-500">本月接单</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">542 单</p>
            <p className="text-xs text-orange-500 mt-1">目标完成 85%</p>
          </Card>
        </div>

        <Card size="small" title="近7天收入趋势" className="shadow-sm mt-4">
          <div className="relative" style={{ height: chartHeight, width: '100%' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              <defs>
                <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3].map((i) => {
                const y = padding + ((chartHeight - padding * 2) / 3) * i;
                return (
                  <line
                    key={i}
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#F3F4F6"
                    strokeDasharray="4,4"
                  />
                );
              })}

              <path d={areaPath} fill="url(#earningsGradient)" />
              <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {weeklyEarnings.map((_, i) => {
                const stepX = (chartWidth - padding * 2) / (weeklyEarnings.length - 1);
                const data = weeklyEarnings.map((d) => ({ value: d.value }));
                const maxVal = Math.max(...data.map((d) => d.value));
                const minVal = Math.min(...data.map((d) => d.value));
                const range = maxVal - minVal || 1;
                const x = padding + i * stepX;
                const y = chartHeight - padding - ((weeklyEarnings[i].value - minVal) / range) * (chartHeight - padding * 2);
                return (
                  <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#3B82F6" strokeWidth="2" />
                );
              })}

              {weeklyEarnings.map((d, i) => {
                const stepX = (chartWidth - padding * 2) / (weeklyEarnings.length - 1);
                const x = padding + i * stepX;
                return (
                  <text
                    key={i}
                    x={x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9CA3AF"
                  >
                    {d.day}
                  </text>
                );
              })}

              {[0, 1, 2, 3].map((i) => {
                const y = padding + ((chartHeight - padding * 2) / 3) * (3 - i);
                const val = Math.round(maxEarnings * (i / 3));
                return (
                  <text
                    key={i}
                    x={padding - 5}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#9CA3AF"
                  >
                    {val}
                  </text>
                );
              })}
            </svg>
          </div>
        </Card>

        <Card size="small" title="近7天接单量" className="shadow-sm mt-4">
          <div className="flex items-end justify-between gap-2 px-2" style={{ height: chartHeight - 40 }}>
            {weeklyOrders.map((d) => {
              const heightPercent = (d.value / maxOrders) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs text-gray-500 mb-1">{d.value}</span>
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${heightPercent}%`,
                      background: 'linear-gradient(to top, #10B981, #34D399)',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 px-2 mt-2">
            {weeklyOrders.map((d) => (
              <span key={d.day} className="flex-1 text-center text-xs text-gray-400">
                {d.day}
              </span>
            ))}
          </div>
        </Card>

        <Card size="small" title="订单类型分布" className="shadow-sm mt-4">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 160 160" className="w-40 h-40 flex-shrink-0">
              {pieSegments.map((seg, i) => (
                <path key={i} d={seg.d} fill={seg.color} />
              ))}
              <circle cx={pieCenter} cy={pieCenter} r="35" fill="#fff" />
              <text x={pieCenter} y={pieCenter - 5} textAnchor="middle" fontSize="14" fill="#374151" fontWeight="bold">
                100%
              </text>
              <text x={pieCenter} y={pieCenter + 12} textAnchor="middle" fontSize="10" fill="#9CA3AF">
                总订单
              </text>
            </svg>

            <div className="flex-1 space-y-2">
              {orderTypeDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                  <span className="text-sm font-medium text-gray-800">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card size="small" title="评分与评价" className="shadow-sm mt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <StarOutlined className="text-yellow-400 text-3xl" />
                <span className="text-3xl font-bold text-gray-800">4.8</span>
              </div>
              <div className="flex justify-center mb-2">
                <Rate allowHalf disabled defaultValue={4.8} className="text-sm" />
              </div>
              <p className="text-sm text-gray-500">累计评价 328 条</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">5星</span>
                <Progress percent={86} showInfo={false} size="small" strokeColor="#FACC15" />
                <span className="text-xs text-gray-600 w-10">86%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">4星</span>
                <Progress percent={9} showInfo={false} size="small" strokeColor="#A3A3A3" />
                <span className="text-xs text-gray-600 w-10">9%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">3星</span>
                <Progress percent={3} showInfo={false} size="small" strokeColor="#A3A3A3" />
                <span className="text-xs text-gray-600 w-10">3%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">2星及以下</span>
                <Progress percent={2} showInfo={false} size="small" strokeColor="#EF4444" />
                <span className="text-xs text-gray-600 w-10">2%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-cyan-500" />
                <span className="text-sm text-gray-600">平均配送时长</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-cyan-600">28</span>
                <span className="text-sm text-gray-500">分钟</span>
              </div>
            </div>
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">好评率</p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    style={{ width: '95%' }}
                  />
                </div>
                <span className="text-sm font-semibold text-green-600">95%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RiderStats;
