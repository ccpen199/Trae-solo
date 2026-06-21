import { motion } from 'framer-motion';
import { CheckCircle, Clock, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusText, getStatusColor, formatDate } from '@/utils/formatters';

interface TimelineItem {
  id: string;
  name: string;
  status: string;
  plannedDate: Date;
  actualDate?: Date;
  photos?: string[];
  videos?: string[];
}

interface TimelineProps {
  items: TimelineItem[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case 'in-progress':
      return <Clock className="w-5 h-5 text-info-500 animate-pulse" />;
    case 'delayed':
      return <AlertTriangle className="w-5 h-5 text-danger-500" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative pl-14"
          >
            <div className="absolute left-4 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center z-10">
              {getStatusIcon(item.status)}
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    计划：{formatDate(item.plannedDate)}
                    {item.actualDate && (
                      <span className="ml-2">
                        实际：{formatDate(item.actualDate)}
                      </span>
                    )}
                  </p>
                </div>
                <span className={`badge ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
              {item.photos && item.photos.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {item.photos.slice(0, 4).map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={photo}
                        alt={`${item.name} 照片 ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                      />
                    </div>
                  ))}
                  {item.photos.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                      +{item.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
