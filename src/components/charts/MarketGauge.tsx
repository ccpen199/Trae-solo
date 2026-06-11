import { useEffect, useState, useMemo, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface MarketGaugeProps {
  score: number;
  height?: number | string;
}

const ZONES = [
  { min: 0, max: 40, color: '#2A9D8F', label: 'Caution' },
  { min: 40, max: 70, color: '#F4A261', label: 'Healthy' },
  { min: 70, max: 100, color: '#E63946', label: 'Warning' },
];

const ARC_RADIUS = 120;
const ARC_CENTER = 150;
const ARC_START_ANGLE = Math.PI * 0.75;
const ARC_END_ANGLE = Math.PI * 2.25;
const ARC_TOTAL_ANGLE = ARC_END_ANGLE - ARC_START_ANGLE;

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  return {
    x: ARC_CENTER + radius * Math.cos(angle),
    y: ARC_CENTER + radius * Math.sin(angle),
  };
}

function describeArc(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number
): string {
  const start1 = polarToCartesian(startAngle, outerRadius);
  const end1 = polarToCartesian(endAngle, outerRadius);
  const start2 = polarToCartesian(endAngle, innerRadius);
  const end2 = polarToCartesian(startAngle, innerRadius);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${start1.x} ${start1.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
    `L ${start2.x} ${start2.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${end2.x} ${end2.y}`,
    'Z',
  ].join(' ');
}

function getZoneForScore(score: number) {
  return ZONES.find((z) => score >= z.min && score < z.max) || ZONES[ZONES.length - 1];
}

export default function MarketGauge({ score, height = 320 }: MarketGaugeProps) {
  const { isDark } = useTheme();
  const [displayScore, setDisplayScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  const clampedScore = Math.max(0, Math.min(100, score));
  const currentZone = getZoneForScore(clampedScore);

  const needleAngle = useMemo(() => {
    const progress = clampedScore / 100;
    return ARC_START_ANGLE + progress * ARC_TOTAL_ANGLE;
  }, [clampedScore]);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    startValueRef.current = displayScore;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValueRef.current + (clampedScore - startValueRef.current) * easeProgress;
      setDisplayScore(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedScore]);

  const needleEnd = polarToCartesian(needleAngle, ARC_RADIUS - 15);

  const textColor = isDark ? '#e5e7eb' : '#374151';
  const subTextColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div
      style={{
        height,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 300 300"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ZONES.map((zone, index) => {
          const startProgress = zone.min / 100;
          const endProgress = zone.max / 100;
          const startAngle = ARC_START_ANGLE + startProgress * ARC_TOTAL_ANGLE;
          const endAngle = ARC_START_ANGLE + endProgress * ARC_TOTAL_ANGLE;

          return (
            <path
              key={index}
              d={describeArc(startAngle, endAngle, ARC_RADIUS - 25, ARC_RADIUS)}
              fill={zone.color}
              opacity={0.8}
              style={{
                transformOrigin: '150px 150px',
                animation: `fadeIn 0.5s ease-out ${index * 0.2}s both`,
              }}
            />
          );
        })}

        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => {
          const progress = tick / 100;
          const angle = ARC_START_ANGLE + progress * ARC_TOTAL_ANGLE;
          const innerPos = polarToCartesian(angle, ARC_RADIUS - 30);
          const outerPos = polarToCartesian(angle, ARC_RADIUS + 5);

          return (
            <g key={tick}>
              <line
                x1={innerPos.x}
                y1={innerPos.y}
                x2={outerPos.x}
                y2={outerPos.y}
                stroke={isDark ? '#4b5563' : '#d1d5db'}
                strokeWidth={tick % 20 === 0 ? 2 : 1}
              />
              {tick % 20 === 0 && (
                <text
                  x={outerPos.x}
                  y={outerPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={subTextColor}
                  fontSize={10}
                  style={{
                    transform: `translate(${
                      outerPos.x < ARC_CENTER ? -15 : outerPos.x > ARC_CENTER ? 15 : 0
                    }px, ${outerPos.y < ARC_CENTER ? -8 : outerPos.y > ARC_CENTER ? 12 : 0}px)`,
                  }}
                >
                  {tick}
                </text>
              )}
            </g>
          );
        })}

        <g filter="url(#glow)">
          <line
            x1={ARC_CENTER}
            y1={ARC_CENTER}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={currentZone.color}
            strokeWidth={4}
            strokeLinecap="round"
            style={{
              transformOrigin: '150px 150px',
              transition: 'none',
            }}
          />
          <circle
            cx={ARC_CENTER}
            cy={ARC_CENTER}
            r={12}
            fill={currentZone.color}
          />
          <circle
            cx={ARC_CENTER}
            cy={ARC_CENTER}
            r={6}
            fill="#ffffff"
          />
        </g>

        <text
          x={ARC_CENTER}
          y={ARC_CENTER + 50}
          textAnchor="middle"
          fill={textColor}
          fontSize={36}
          fontWeight="bold"
        >
          {Math.round(displayScore)}
        </text>

        <text
          x={ARC_CENTER}
          y={ARC_CENTER + 75}
          textAnchor="middle"
          fill={currentZone.color}
          fontSize={14}
          fontWeight={600}
        >
          {currentZone.label}
        </text>

        <text
          x={ARC_CENTER}
          y={ARC_CENTER + 95}
          textAnchor="middle"
          fill={subTextColor}
          fontSize={12}
        >
          Market Health Score
        </text>

        <g transform="translate(60, 260)">
          {ZONES.map((zone, index) => (
            <g key={index} transform={`translate(${index * 70}, 0)`}>
              <rect
                width={12}
                height={12}
                rx={2}
                fill={zone.color}
              />
              <text
                x={18}
                y={10}
                fill={subTextColor}
                fontSize={11}
              >
                {zone.min}-{zone.max} {zone.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
