import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, Clock, Users, CheckCircle, Send, Image } from 'lucide-react';
import { mockTeams } from '@/mock/teams';
import { formatRelativeTime } from '@/utils/date';
import type { CheckInRecord } from '@/types';

export default function CheckIn() {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [remark, setRemark] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>(
    mockTeams.flatMap((t) => t.checkIns)
  );
  const [simulatedLocation] = useState({
    name: '安徽省黄山市黟县宏村镇',
    coords: [30.0054, 117.9874] as [number, number],
  });
  const [photoCount, setPhotoCount] = useState(0);

  const ongoingTeams = mockTeams.filter((t) => t.status === 'ongoing' || t.status === 'approved');

  const handleCheckIn = () => {
    if (!selectedTeam) return;
    const team = mockTeams.find((t) => t.id === selectedTeam);
    const newRecord: CheckInRecord = {
      id: `ck-${Date.now()}`,
      teamId: selectedTeam,
      userId: 'u001',
      timestamp: new Date().toISOString(),
      location: simulatedLocation.name,
      coordinates: simulatedLocation.coords,
      photos: photoCount > 0 ? [`photo_${Date.now()}.jpg`] : [],
      remark: remark || undefined,
    };
    setCheckInRecords((prev) => [newRecord, ...prev]);
    setCheckedIn(true);
    setTimeout(() => {
      setCheckedIn(false);
      setRemark('');
      setPhotoCount(0);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">轨迹打卡</h1>
        <p className="text-surface-500 mt-1">LBS定位签到，记录实践轨迹</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="card overflow-hidden">
            <div className="relative bg-gradient-to-br from-primary-100 via-primary-50 to-surface-100 h-64 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-[20%] top-[30%] w-1 h-1 bg-primary-400 rounded-full" />
                <div className="absolute left-[60%] top-[25%] w-1.5 h-1.5 bg-primary-300 rounded-full" />
                <div className="absolute left-[40%] top-[55%] w-1 h-1 bg-primary-400 rounded-full" />
                <div className="absolute left-[75%] top-[60%] w-2 h-2 bg-primary-200 rounded-full" />
                <div className="absolute left-[15%] top-[70%] w-1.5 h-1.5 bg-success-300 rounded-full" />
                <div className="absolute right-[25%] top-[40%] w-1 h-1 bg-accent-300 rounded-full" />
              </div>

              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-primary-400/20 animate-ping" />
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-primary-800">当前位置</p>
                <p className="text-xs text-primary-600 mt-1">{simulatedLocation.name}</p>
                <p className="text-[10px] text-surface-400 font-mono mt-0.5">
                  {simulatedLocation.coords[0].toFixed(4)}°N, {simulatedLocation.coords[1].toFixed(4)}°E
                </p>
              </motion.div>

              {checkInRecords.slice(0, 3).map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="absolute z-10"
                  style={{
                    left: `${25 + i * 22}%`,
                    top: `${20 + (i % 2) * 35}%`,
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-success-500 ring-2 ring-white shadow-sm" />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-surface-700 mb-1.5 block">选择团队</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400"
              >
                <option value="">请选择实践团队</option>
                {ongoingTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.theme}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-surface-700 mb-1.5 block">现场照片（自动添加水印）</label>
              <div
                onClick={() => setPhotoCount((p) => Math.min(p + 1, 4))}
                className="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
              >
                <Camera className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                <p className="text-sm text-surface-500">点击拍照或上传照片</p>
                <p className="text-xs text-surface-400 mt-1">照片将自动添加时间、地点水印</p>
              </div>
              {photoCount > 0 && (
                <div className="flex gap-2 mt-2">
                  {Array.from({ length: photoCount }).map((_, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg bg-surface-100 flex items-center justify-center">
                      <Image className="w-6 h-6 text-surface-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-surface-700 mb-1.5 block">备注</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="记录本次打卡的实践内容..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <AnimatePresence mode="wait">
              {checkedIn ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success-50 text-success-600 font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  打卡成功！
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCheckIn}
                  disabled={!selectedTeam}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 text-white font-semibold shadow-lg shadow-primary-600/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  提交打卡
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary-500" />
              打卡记录
            </h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {checkInRecords.map((record) => (
                <div key={record.id} className="p-3 bg-surface-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {record.location}
                    </span>
                    <span className="text-[10px] text-surface-400 font-mono">
                      {formatRelativeTime(record.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <Users className="w-3 h-3" />
                    <span>
                      {mockTeams.find((t) => t.id === record.teamId)?.name || '团队'}
                    </span>
                  </div>
                  {record.photos.length > 0 && (
                    <div className="flex gap-1">
                      {record.photos.map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded bg-surface-200 flex items-center justify-center">
                          <Image className="w-4 h-4 text-surface-400" />
                        </div>
                      ))}
                    </div>
                  )}
                  {record.remark && (
                    <p className="text-xs text-surface-500">{record.remark}</p>
                  )}
                </div>
              ))}
              {checkInRecords.length === 0 && (
                <p className="text-sm text-surface-400 text-center py-8">暂无打卡记录</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
