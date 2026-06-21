import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, User, Building2, Clock, FileCheck, ChevronDown } from 'lucide-react';
import Timeline from '@/components/ui/Timeline';
import Progress from '@/components/ui/Progress';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusText } from '@/utils/formatters';
import type { CheckInRecord, Milestone } from '@/types';

const mockCheckIns: CheckInRecord[] = [
  {
    id: 'ci001',
    milestoneId: 'm004',
    contractorId: 'c001',
    timestamp: new Date('2026-06-18 08:30'),
    location: { lat: 39.9042, lng: 116.4074 },
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20site%20tiling%20work%20worker%20laying%20ceramic%20tiles&image_size=square',
    ],
    notes: '开始客厅地砖铺设，材料到位，天气晴好',
  },
  {
    id: 'ci002',
    milestoneId: 'm004',
    contractorId: 'c001',
    timestamp: new Date('2026-06-17 08:15'),
    location: { lat: 39.9042, lng: 116.4074 },
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wall%20leveling%20plastering%20construction%20worker&image_size=square',
    ],
    notes: '墙面找平完成，验收合格',
  },
  {
    id: 'ci003',
    milestoneId: 'm003',
    contractorId: 'c001',
    timestamp: new Date('2026-05-20 09:00'),
    location: { lat: 39.9042, lng: 116.4074 },
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20wiring%20construction%20renovation&image_size=square',
    ],
    notes: '水电改造验收通过，打压测试合格',
  },
];

const mockQualityInspections = [
  { id: 'qi001', name: '墙面垂直度检测', status: 'completed', result: '合格', date: new Date('2026-06-16') },
  { id: 'qi002', name: '地面平整度检测', status: 'completed', result: '合格', date: new Date('2026-06-15') },
  { id: 'qi003', name: '水电管线走向检查', status: 'completed', result: '合格', date: new Date('2026-05-18') },
  { id: 'qi004', name: '防水工程闭水试验', status: 'in-progress', result: '待确认', date: new Date('2026-06-19') },
];

const mockMilestonePhotos: Record<string, string[]> = {
  m001: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20kickoff%20meeting%20blueprint%20discussion&image_size=square',
  ],
  m002: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=demolition%20work%20construction%20site%20wall%20removal&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=debris%20removal%20construction%20site%20cleanup&image_size=square',
  ],
  m003: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20wiring%20installation%20conduit&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=plumbing%20pipes%20installation%20bathroom&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wiring%20junction%20box%20electrical%20work&image_size=square',
  ],
  m004: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ceramic%20tile%20laying%20floor%20installation&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wall%20plastering%20cement%20work&image_size=square',
  ],
};

export default function Construction() {
  const { projects, users, designers } = useAppStore();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const contractor = users.find((u) => u.id === 'u004');
  const designer = designers.find((d) => d.id === project?.designerId);

  const milestonesWithPhotos: Milestone[] = project?.milestones.map((m) => ({
    ...m,
    photos: mockMilestonePhotos[m.id] || m.photos,
  })) || [];

  if (!project) return null;

  return (
    <div className="space-y-6 min-h-screen pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">施工数字监理</h1>
        <p className="text-gray-500 mt-1">关键节点可视化管控</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative w-80"
      >
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-gray-900">{project.name}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                  p.id === selectedProjectId ? 'bg-primary-50' : ''
                }`}
              >
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.address}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              项目概览
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 text-lg">{project.name}</h4>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{project.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    总预算
                  </div>
                  <div className="font-semibold text-gray-900">{formatCurrency(project.totalBudget)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    施工周期
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatDate(project.startDate)} ~ {formatDate(project.estimatedEndDate)}
                  </div>
                </div>
              </div>

              <div>
                <Progress value={project.progress} label="整体进度" size="lg" />
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img src={contractor?.avatar} alt={contractor?.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">施工方</div>
                    <div className="font-medium text-gray-900">{contractor?.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img src={designer?.avatar} alt={designer?.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">设计师</div>
                    <div className="font-medium text-gray-900">{designer?.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="card p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              施工时间轴
            </h3>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              <Timeline items={milestonesWithPhotos} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              最新打卡
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {mockCheckIns.map((checkIn, index) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {checkIn.photos[0] && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={checkIn.photos[0]} alt="打卡照片" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(checkIn.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">施工现场</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{checkIn.notes}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-500" />
              质量巡检
            </h3>
            <div className="space-y-3">
              {mockQualityInspections.map((inspection, index) => (
                <motion.div
                  key={inspection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{inspection.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatDate(inspection.date)}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                    {inspection.result}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
