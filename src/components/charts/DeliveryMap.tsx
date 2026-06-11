import React, { useState, useEffect } from 'react';
import { Package, Home, Bike, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MapPoint {
  x: number;
  y: number;
  label?: string;
}

export interface RiderMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'idle' | 'delivering' | 'offline';
  eta?: number;
  orderCount?: number;
}

export interface DeliveryPath {
  id: string;
  pickup: MapPoint;
  dropoff: MapPoint;
  riderId?: string;
  status: 'pending' | 'in-progress' | 'completed';
  eta?: number;
}

export interface DeliveryMapProps {
  width?: number;
  height?: number;
  riders?: RiderMarker[];
  paths?: DeliveryPath[];
  className?: string;
  showGrid?: boolean;
  title?: string;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  width = 700,
  height = 500,
  riders = [],
  paths = [],
  className,
  showGrid = true,
  title,
}) => {
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const getStatusColor = (status: RiderMarker['status']) => {
    switch (status) {
      case 'delivering':
        return '#10B981';
      case 'idle':
        return '#F59E0B';
      case 'offline':
        return '#64748B';
    }
  };

  const getPathColor = (status: DeliveryPath['status']) => {
    switch (status) {
      case 'in-progress':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#64748B';
    }
  };

  const createPathD = (pickup: MapPoint, dropoff: MapPoint) => {
    const midX = (pickup.x + dropoff.x) / 2;
    const midY = (pickup.y + dropoff.y) / 2 - 40;
    return `M ${pickup.x} ${pickup.y} Q ${midX} ${midY} ${dropoff.x} ${dropoff.y}`;
  };

  return (
    <div
      className={cn(
        'bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card',
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-100 mb-4">{title}</h3>
      )}

      <div className="relative">
        <svg width={width} height={height} className="rounded-lg overflow-hidden">
          <defs>
            <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0B1220" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#070B14" />
            </linearGradient>

            {paths.map((path, index) => (
              <linearGradient
                key={`path-gradient-${index}`}
                id={`path-gradient-${path.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={getPathColor(path.status)} stopOpacity="0.8" />
                <stop offset="100%" stopColor={getPathColor(path.status)} stopOpacity="0.3" />
              </linearGradient>
            ))}

            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={width} height={height} fill="url(#map-bg)" />

          {showGrid && (
            <g>
              {Array.from({ length: Math.ceil(width / 50) + 1 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * 50}
                  y1={0}
                  x2={i * 50}
                  y2={height}
                  stroke="rgba(100, 116, 139, 0.06)"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: Math.ceil(height / 50) + 1 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={i * 50}
                  x2={width}
                  y2={i * 50}
                  stroke="rgba(100, 116, 139, 0.06)"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          <g stroke="rgba(245, 158, 11, 0.12)" strokeWidth="8" fill="none" strokeLinecap="round">
            <path d={`M 50 ${height * 0.3} Q ${width * 0.3} ${height * 0.1} ${width * 0.5} ${height * 0.25} T ${width - 50} ${height * 0.4}`} />
            <path d={`M 80 ${height * 0.7} Q ${width * 0.3} ${height * 0.85} ${width * 0.6} ${height * 0.7} T ${width - 80} ${height * 0.75}`} />
            <path d={`M ${width * 0.4} 50 Q ${width * 0.5} ${height * 0.4} ${width * 0.45} ${height - 50}`} />
          </g>

          <g stroke="rgba(59, 130, 246, 0.1)" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d={`M 100 ${height * 0.5} L ${width - 100} ${height * 0.55}`} />
            <path d={`M ${width * 0.25} 80 L ${width * 0.3} ${height - 80}`} />
          </g>

          {paths.map((path) => {
            const isHovered = hoveredPath === path.id;
            return (
              <g key={path.id}>
                <path
                  d={createPathD(path.pickup, path.dropoff)}
                  fill="none"
                  stroke={`url(#path-gradient-${path.id})`}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeLinecap="round"
                  strokeDasharray={path.status === 'in-progress' ? '8,4' : undefined}
                  className={cn(
                    'transition-all duration-300 cursor-pointer',
                    path.status === 'in-progress' && 'animate-pulse-slow'
                  )}
                  onMouseEnter={() => setHoveredPath(path.id)}
                  onMouseLeave={() => setHoveredPath(null)}
                />

                {path.status === 'in-progress' && (
                  <circle r="4" fill="#F59E0B">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path={createPathD(path.pickup, path.dropoff)}
                    />
                  </circle>
                )}

                <g transform={`translate(${path.pickup.x}, ${path.pickup.y})`}>
                  <circle r="14" fill="rgba(245, 158, 11, 0.15)" />
                  <circle r="9" fill="#0B1220" stroke="#F59E0B" strokeWidth="2" />
                  <foreignObject x="-8" y="-8" width="16" height="16">
                    <div className="flex items-center justify-center w-full h-full">
                      <Package className="w-3 h-3 text-amber-accent-400" />
                    </div>
                  </foreignObject>
                </g>

                <g transform={`translate(${path.dropoff.x}, ${path.dropoff.y})`}>
                  <circle r="14" fill="rgba(16, 185, 129, 0.15)" />
                  <circle r="9" fill="#0B1220" stroke="#10B981" strokeWidth="2" />
                  <foreignObject x="-8" y="-8" width="16" height="16">
                    <div className="flex items-center justify-center w-full h-full">
                      <Home className="w-3 h-3 text-success-400" />
                    </div>
                  </foreignObject>
                </g>
              </g>
            );
          })}

          {riders.map((rider) => {
            const color = getStatusColor(rider.status);
            const isSelected = selectedRider === rider.id;
            const isDelivering = rider.status === 'delivering';

            return (
              <g
                key={rider.id}
                transform={`translate(${rider.x}, ${rider.y})`}
                className="cursor-pointer"
                onClick={() => setSelectedRider(isSelected ? null : rider.id)}
              >
                {isDelivering && (
                  <>
                    <circle
                      r="20"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.3"
                      className="animate-ping"
                      style={{ transformOrigin: 'center' }}
                    />
                    <circle
                      r="26"
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.15"
                      className="animate-ping"
                      style={{ transformOrigin: 'center', animationDelay: '0.5s' }}
                    />
                  </>
                )}

                <circle
                  r={isSelected ? 18 : 16}
                  fill="rgba(11, 18, 32, 0.9)"
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  filter={isDelivering ? (rider.status === 'delivering' ? 'url(#glow-green)' : 'url(#glow-amber)') : undefined}
                  className="transition-all duration-200"
                />

                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div className="flex items-center justify-center w-full h-full">
                    <Bike className={cn('w-4 h-4', rider.status === 'delivering' ? 'text-success-400' : rider.status === 'idle' ? 'text-amber-accent-400' : 'text-gray-500')} />
                  </div>
                </foreignObject>

                {isSelected && rider.eta !== undefined && (
                  <g transform="translate(22, -22)">
                    <rect
                      x="0"
                      y="0"
                      width="60"
                      height="44"
                      rx="6"
                      fill="#0F172A"
                      stroke="#334155"
                    />
                    <foreignObject x="0" y="0" width="60" height="44">
                      <div className="flex flex-col items-center justify-center w-full h-full p-1">
                        <div className="flex items-center gap-1 text-amber-accent-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-mono-code font-bold">{rider.eta}分</span>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5">预计送达</span>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </g>
            );
          })}

          {riders.map((rider) => {
            const isSelected = selectedRider === rider.id;
            const progress = rider.eta ? Math.max(0, Math.min(1, 1 - rider.eta / 30)) : 0;
            const radius = 22;
            const circumference = 2 * Math.PI * radius;

            if (!isSelected || rider.eta === undefined) return null;

            return (
              <g
                key={`progress-${rider.id}`}
                transform={`translate(${rider.x}, ${rider.y})`}
                className="pointer-events-none"
              >
                <circle
                  r={radius}
                  fill="none"
                  stroke="rgba(100, 116, 139, 0.3)"
                  strokeWidth="3"
                />
                <circle
                  r={radius}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  transform="rotate(-90)"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }}
                />
              </g>
            );
          })}
        </svg>

        {riders.length > 0 && (
          <div className="absolute top-3 right-3 bg-space-blue-700/90 backdrop-blur-sm rounded-lg p-3 border border-space-blue-500">
            <div className="text-xs text-gray-400 mb-2">骑手状态</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-500 animate-status-pulse" />
                <span className="text-xs text-gray-300">配送中</span>
                <span className="text-xs text-success-400 font-mono-code ml-auto">
                  {riders.filter(r => r.status === 'delivering').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-accent-500" />
                <span className="text-xs text-gray-300">空闲</span>
                <span className="text-xs text-amber-accent-400 font-mono-code ml-auto">
                  {riders.filter(r => r.status === 'idle').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-xs text-gray-300">离线</span>
                <span className="text-xs text-gray-500 font-mono-code ml-auto">
                  {riders.filter(r => r.status === 'offline').length}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedRider && (
          <div className="absolute bottom-3 left-3 right-3 bg-space-blue-700/90 backdrop-blur-sm rounded-lg p-3 border border-space-blue-500">
            {(() => {
              const rider = riders.find(r => r.id === selectedRider);
              if (!rider) return null;
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      rider.status === 'delivering' ? 'bg-success-500/20' :
                      rider.status === 'idle' ? 'bg-amber-accent-500/20' : 'bg-gray-500/20'
                    )}>
                      <Bike className={cn(
                        'w-5 h-5',
                        rider.status === 'delivering' ? 'text-success-400' :
                        rider.status === 'idle' ? 'text-amber-accent-400' : 'text-gray-500'
                      )} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-100">{rider.name}</div>
                      <div className="text-xs text-gray-400">
                        {rider.status === 'delivering' ? '配送中' : rider.status === 'idle' ? '空闲' : '离线'}
                        {rider.orderCount !== undefined && ` · ${rider.orderCount}单待送`}
                      </div>
                    </div>
                  </div>
                  {rider.eta !== undefined && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-accent-400" />
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-accent-400 font-mono-code">{rider.eta}</div>
                        <div className="text-[10px] text-gray-400">分钟后送达</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="absolute bottom-3 left-3 bg-space-blue-700/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-space-blue-500">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-accent-500" />
              <span className="text-gray-400">取件点</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
              <span className="text-gray-400">送件点</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;
