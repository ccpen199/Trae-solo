import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Hospital, Clock, User, ChevronRight, Calendar, Phone } from 'lucide-react';
import { useGetPaginated, usePost } from '../../hooks/useApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import type { Hospital as HospitalType, Doctor } from '../../../shared/types';

export default function Hospitals() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedHospital, setSelectedHospital] = useState<HospitalType | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data, isLoading } = useGetPaginated<HospitalType>(
    ['hospitals', String(page)],
    `/city/hospitals?page=${page}&pageSize=10`
  );

  const appointmentMutation = usePost();

  const handleAppointment = async () => {
    if (!selectedHospital || !selectedDept || !selectedDoctor || !selectedSlot) return;
    
    try {
      await appointmentMutation.mutateAsync({
        url: '/city/hospitals/appointment',
        data: {
          hospitalId: selectedHospital.id,
          departmentId: selectedDept,
          doctorId: selectedDoctor.id,
          timeSlot: selectedSlot,
        },
      });
      setSelectedHospital(null);
      setSelectedDept(null);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      alert('预约成功！请按时就诊');
    } catch (error) {
      alert('预约失败，请稍后重试');
    }
  };

  const filteredHospitals = data?.items?.filter((h) =>
    h.name.includes(search) || h.address.includes(search)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索医院名称、地址..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : filteredHospitals?.length ? (
        <div className="space-y-4">
          {filteredHospitals.map((hospital, idx) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card hover onClick={() => setSelectedHospital(hospital)}>
                <Card.Body>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Hospital className="w-7 h-7 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {hospital.level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{hospital.address}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {hospital.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            今日号源 {hospital.departments.reduce((sum, d) => sum + d.todayAvailable, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="py-12 text-center">
            <Hospital className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无医院信息</p>
          </Card.Body>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {selectedHospital && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedHospital(null); setSelectedDept(null); setSelectedDoctor(null); setSelectedSlot(null); }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedHospital.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {selectedHospital.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedHospital.address}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">选择科室</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {selectedHospital.departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => { setSelectedDept(dept.id); setSelectedDoctor(null); setSelectedSlot(null); }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedDept === dept.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 mb-1">{dept.name}</p>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>今日 {dept.todayAvailable} 号</span>
                      <span>明日 {dept.tomorrowAvailable} 号</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedDept && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-4">选择医生</h4>
                  <div className="space-y-3 mb-6">
                    {selectedHospital.departments
                      .find((d) => d.id === selectedDept)
                      ?.doctors.map((doctor) => (
                        <button
                          key={doctor.id}
                          onClick={() => { setSelectedDoctor(doctor); setSelectedSlot(null); }}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            selectedDoctor?.id === doctor.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{doctor.name}</p>
                                <p className="text-xs text-gray-500">{doctor.title} · {doctor.specialty}</p>
                              </div>
                            </div>
                            <StatusBadge
                              status={doctor.availableSlots.some((s) => s.available) ? 'success' : 'error'}
                              text={doctor.availableSlots.some((s) => s.available) ? '有号源' : '已约满'}
                            />
                          </div>
                        </button>
                      ))}
                  </div>
                </>
              )}

              {selectedDoctor && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-4">选择时段</h4>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                    {selectedDoctor.availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedSlot === slot.time
                            ? 'bg-primary text-white'
                            : slot.available
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                        }`}
                      >
                        {slot.time}
                        <span className="block text-xs mt-0.5">¥{slot.fee}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  className="flex-1"
                  disabled={!selectedDept || !selectedDoctor || !selectedSlot || appointmentMutation.isPending}
                  loading={appointmentMutation.isPending}
                  onClick={handleAppointment}
                >
                  确认预约
                </Button>
                <button
                  onClick={() => { setSelectedHospital(null); setSelectedDept(null); setSelectedDoctor(null); setSelectedSlot(null); }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
