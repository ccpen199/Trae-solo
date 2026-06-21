import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Users, Clock, Check } from 'lucide-react'
import { mockHospitals } from '@/data/mockData'
import type { Hospital, Department, Doctor } from '@/types'

const steps = ['选择医院', '选择科室', '选择医生', '选择时段', '确认挂号']

export default function Hospital() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<{ date: string; period: string } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const handleConfirm = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/city-service')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="section-title mb-0">医院挂号</h1>
        </div>

        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i <= currentStep ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs mx-1 whitespace-nowrap ${i <= currentStep ? 'text-primary-500 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < steps.length - 1 && <div className="w-4 h-px bg-gray-200 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {mockHospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => { setSelectedHospital(hospital); goNext() }}
                  className={`w-full bg-white rounded-xl p-5 mb-3 text-left shadow-sm border-2 transition-all
                    ${selectedHospital?.id === hospital.id ? 'border-primary-500' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{hospital.name}</h3>
                    <span className="badge bg-primary-50 text-primary-500">{hospital.level}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {hospital.address}
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {currentStep === 1 && selectedHospital && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {selectedHospital.departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => { setSelectedDepartment(dept); goNext() }}
                  className={`w-full bg-white rounded-xl p-5 mb-3 text-left shadow-sm border-2 transition-all
                    ${selectedDepartment?.id === dept.id ? 'border-primary-500' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{dept.name}</h3>
                      <p className="text-xs text-gray-400">{dept.doctors.length}位医生</p>
                    </div>
                  </div>
                </button>
              ))}
              <button onClick={goBack} className="text-sm text-gray-400 hover:text-gray-600 mt-2">← 返回上一步</button>
            </motion.div>
          )}

          {currentStep === 2 && selectedDepartment && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {selectedDepartment.doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => { setSelectedDoctor(doctor); goNext() }}
                  className={`w-full bg-white rounded-xl p-5 mb-3 text-left shadow-sm border-2 transition-all
                    ${selectedDoctor?.id === doctor.id ? 'border-primary-500' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{doctor.name}</h3>
                    <span className="badge bg-gold-50 text-gold-600">{doctor.title}</span>
                  </div>
                  <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    {doctor.schedule.length}天出诊
                  </div>
                </button>
              ))}
              <button onClick={goBack} className="text-sm text-gray-400 hover:text-gray-600 mt-2">← 返回上一步</button>
            </motion.div>
          )}

          {currentStep === 3 && selectedDoctor && (
            <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {selectedDoctor.schedule.map((s) => (
                <div key={s.date} className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">{s.date}</p>
                  <div className="flex gap-2">
                    {s.periods.map((period) => (
                      <button
                        key={period}
                        onClick={() => { setSelectedSchedule({ date: s.date, period }); goNext() }}
                        className={`px-6 py-3 rounded-xl border-2 text-sm font-medium transition-all
                          ${selectedSchedule?.date === s.date && selectedSchedule?.period === period
                            ? 'border-primary-500 text-primary-500 bg-primary-50'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={goBack} className="text-sm text-gray-400 hover:text-gray-600 mt-2">← 返回上一步</button>
            </motion.div>
          )}

          {currentStep === 4 && selectedHospital && selectedDepartment && selectedDoctor && selectedSchedule && (
            <motion.div key="step4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 mb-5">挂号信息确认</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">医院</span><span className="text-gray-700 font-medium">{selectedHospital.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">科室</span><span className="text-gray-700 font-medium">{selectedDepartment.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">医生</span><span className="text-gray-700 font-medium">{selectedDoctor.name} · {selectedDoctor.title}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">专长</span><span className="text-gray-700 font-medium">{selectedDoctor.specialty}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">时间</span><span className="text-gray-700 font-medium">{selectedSchedule.date} {selectedSchedule.period}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">挂号费</span><span className="text-red-500 font-bold text-base">¥{selectedDoctor.title === '主任医师' ? 25 : 15}</span></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-500 font-medium hover:bg-gray-50">返回修改</button>
                  <button onClick={handleConfirm} className="flex-1 py-3 gradient-gold text-primary-900 rounded-xl font-semibold">确认挂号</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                         bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-3"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="w-14 h-14 rounded-full bg-success-light flex items-center justify-center">
                <Check className="w-7 h-7 text-success" />
              </div>
              <p className="text-lg font-bold text-gray-800">挂号成功</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
