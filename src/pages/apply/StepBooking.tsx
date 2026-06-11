import { Calendar, Clock, MapPin } from 'lucide-react';

const timeSlots = [
  { label: '上午 9:00-11:00', value: 'morning' },
  { label: '下午 14:00-16:00', value: 'afternoon' },
];

const locations = [
  { name: '昆山市政务服务中心', address: '前进中路219号' },
  { name: '昆山开发区便民服务中心', address: '前进东路888号' },
  { name: '花桥经济开发区政务中心', address: '花桥镇绿地大道1号' },
];

interface StepBookingProps {
  date: string;
  timeSlot: string;
  location: string;
  errors?: Record<string, string>;
  onUpdate: (data: { date?: string; timeSlot?: string; location?: string }) => void;
}

export default function StepBooking({ date, timeSlot, location, errors = {}, onUpdate }: StepBookingProps) {
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      value: d.toISOString().split('T')[0],
      day: d.getDate(),
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
      month: `${d.getMonth() + 1}月`,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gov-text mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gov-blue" />
          选择日期
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {next7Days.map((d) => (
            <button
              key={d.value}
              onClick={() => onUpdate({ date: d.value })}
              className={`flex flex-col items-center py-3 rounded-lg border-2 transition-all ${
                date === d.value
                  ? 'border-gov-blue bg-blue-50 text-gov-blue'
                  : 'border-gov-border hover:border-gov-blue/50'
              }`}
            >
              <span className="text-xs text-gov-text-secondary">{d.month}</span>
              <span className="text-lg font-bold">{d.day}</span>
              <span className="text-xs">{d.weekday}</span>
            </button>
          ))}
        </div>
        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gov-text mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gov-blue" />
          选择时段
        </h3>
        <div className="flex gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.value}
              onClick={() => onUpdate({ timeSlot: slot.value })}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                timeSlot === slot.value
                  ? 'border-gov-blue bg-blue-50 text-gov-blue'
                  : 'border-gov-border hover:border-gov-blue/50 text-gov-text'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
        {errors.timeSlot && <p className="text-xs text-red-500 mt-1">{errors.timeSlot}</p>}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gov-text mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gov-blue" />
          选择办理地点
        </h3>
        <div className="space-y-2">
          {locations.map((loc) => (
            <button
              key={loc.name}
              onClick={() => onUpdate({ location: loc.name })}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                location === loc.name
                  ? 'border-gov-blue bg-blue-50'
                  : 'border-gov-border hover:border-gov-blue/50'
              }`}
            >
              <p className="font-medium text-gov-text">{loc.name}</p>
              <p className="text-sm text-gov-text-secondary">{loc.address}</p>
            </button>
          ))}
        </div>
        {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
      </div>
    </div>
  );
}
