import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, MapPin, User, FileText } from 'lucide-react';
import type { VaccineRecord, DewormingRecord, MedicalRecord } from '@/types/medical';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'vaccine' | 'deworming' | 'medical' | 'service';
  status?: 'completed' | 'upcoming' | 'pending';
  metadata?: Record<string, string>;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const typeStyles: Record<string, { dot: string; line: string; badge: string }> = {
  vaccine: {
    dot: 'bg-blue-500',
    line: 'bg-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  deworming: {
    dot: 'bg-orange-500',
    line: 'bg-orange-200',
    badge: 'bg-orange-100 text-orange-700',
  },
  medical: {
    dot: 'bg-primary-500',
    line: 'bg-primary-200',
    badge: 'bg-primary-100 text-primary-700',
  },
  service: {
    dot: 'bg-accent-500',
    line: 'bg-accent-200',
    badge: 'bg-accent-100 text-accent-700',
  },
};

const typeLabels: Record<string, string> = {
  vaccine: '疫苗接种',
  deworming: '驱虫服务',
  medical: '诊疗记录',
  service: '服务记录',
};

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无记录</p>
      </div>
    );
  }

  return (
    <div className={cn('relative pl-8', className)}>
      {items.map((item, index) => {
        const style = typeStyles[item.type];
        const isLast = index === items.length - 1;
        const formattedDate = format(new Date(item.date), 'yyyy年MM月dd日', { locale: zhCN });

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pb-8"
          >
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[-1.25rem] top-4 w-0.5 h-full',
                  style.line
                )}
              />
            )}

            <div
              className={cn(
                'absolute left-[-1.75rem] top-0 w-6 h-6 rounded-full border-4 border-white',
                style.dot,
                item.status === 'upcoming' && 'opacity-50'
              )}
            />

            <div className="bg-white rounded-xl p-4 shadow-soft border border-neutral-100 hover:shadow-card transition-shadow duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', style.badge)}>
                      {typeLabels[item.type]}
                    </span>
                    {item.status === 'upcoming' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                        待执行
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                  <p className="text-sm text-neutral-500 mt-1">{item.description}</p>

                  {item.metadata && (
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-neutral-500">
                      {item.metadata.veterinarian && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{item.metadata.veterinarian}</span>
                        </div>
                      )}
                      {item.metadata.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.metadata.location}</span>
                        </div>
                      )}
                      {item.metadata.batchNo && (
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-400">批次：</span>
                          <span>{item.metadata.batchNo}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-neutral-400 flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function transformVaccineToTimeline(records: VaccineRecord[]): TimelineItem[] {
  return records.map((r) => ({
    id: r.id,
    date: r.administeredAt,
    title: r.vaccineName,
    description: `${r.vaccineType === 'core' ? '核心疫苗' : '狂犬疫苗'}，${r.administeredBy}操作`,
    type: 'vaccine' as const,
    status: 'completed' as const,
    metadata: {
      veterinarian: r.signedBy,
      batchNo: r.batchNo,
      nextDueDate: r.nextDueDate,
    },
  }));
}

export function transformDewormingToTimeline(records: DewormingRecord[]): TimelineItem[] {
  return records.map((r) => ({
    id: r.id,
    date: r.administeredAt,
    title: `${r.dewormingType === 'both' ? '体内外同驱' : r.dewormingType === 'internal' ? '体内驱虫' : '体外驱虫'}`,
    description: `${r.productName}，剂量${r.dosage}，体重${r.weightAtTime}kg`,
    type: 'deworming' as const,
    status: 'completed' as const,
    metadata: {
      administeredBy: r.administeredBy,
      nextDueDate: r.nextDueDate,
    },
  }));
}

export function transformMedicalToTimeline(records: MedicalRecord[]): TimelineItem[] {
  return records.map((r) => ({
    id: r.id,
    date: r.visitDate,
    title: r.diagnosis,
    description: `主诉：${r.chiefComplaint}`,
    type: 'medical' as const,
    status: r.archived ? 'completed' : 'pending',
    metadata: {
      veterinarian: r.signature,
      visitType: r.visitType === 'outpatient' ? '门诊' : r.visitType === 'emergency' ? '急诊' : '复诊',
    },
  }));
}
