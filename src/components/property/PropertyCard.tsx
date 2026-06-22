import { Link } from 'react-router-dom';
import type { Property } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/utils/calculator';
import { MapPin, Maximize2, Users, Gauge, Droplets, Zap, Flame } from 'lucide-react';

const gradientMap = [
  'from-teal-400 via-cyan-500 to-blue-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-violet-400 via-purple-500 to-fuchsia-500',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-rose-400 via-pink-500 to-fuchsia-500',
  'from-sky-400 via-blue-500 to-indigo-500',
];

export default function PropertyCard({ property, index }: { property: Property; index: number }) {
  const tenants = useAppStore((s) => s.tenants);
  const bills = useAppStore((s) => s.bills);

  const livingTenants = tenants.filter(
    (t) => t.propertyId === property.id && t.status === 'living'
  );
  const totalRevenue = bills
    .filter((b) => b.propertyId === property.id)
    .reduce((s, b) => s + b.paidAmount, 0);

  const meterIcons = property.meters.map((m) => {
    if (m.type === 'water') return <Droplets key={m.id} className="w-3 h-3 text-sky-500" />;
    if (m.type === 'electricity') return <Zap key={m.id} className="w-3 h-3 text-amber-500" />;
    return <Flame key={m.id} className="w-3 h-3 text-orange-500" />;
  });

  const grad = gradientMap[index % gradientMap.length];

  return (
    <Link
      to={`/properties/${property.id}`}
      className="card card-hover rounded-2xl overflow-hidden group block animate-staggerIn"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`relative h-36 bg-gradient-to-br ${grad} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%)]" />
        <div className="absolute inset-0 bg-noise" />
        <div className="absolute top-3 left-3">
          <StatusBadge variant="property" status={property.status} />
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
          <Maximize2 className="w-3 h-3 text-white" />
          <span className="text-[11px] text-white font-semibold">{property.area}㎡</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <h3 className="font-serif text-lg font-bold text-white mb-0.5 group-hover:translate-x-0.5 transition-transform">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-white/80 text-[11px]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <InfoCell label="户型" value={property.layout} />
          <InfoCell label="楼层" value={property.floor} />
          <InfoCell label="装修" value={property.decoration} />
        </div>
        <div className="divider" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">
                {livingTenants.length > 0
                  ? livingTenants.map((t) => t.name).join(',')
                  : '空置中'}
              </span>
            </div>
            <div className="flex items-center gap-0.5">{meterIcons}</div>
          </div>
        </div>
        <div className="pt-2 border-t border-dashed border-slate-100 flex items-end justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">月租金</div>
            <div className="text-xl font-serif font-bold text-brand-700">
              {formatCurrency(property.monthlyRent)}
            </div>
          </div>
          {totalRevenue > 0 && (
            <div className="text-right">
              <div className="text-[10px] text-slate-400">累计收入</div>
              <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <Gauge className="w-3 h-3" />
                {formatCurrency(totalRevenue)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2 px-1 border border-slate-100">
      <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
      <div className="text-xs font-semibold text-slate-700 truncate">{value}</div>
    </div>
  );
}
