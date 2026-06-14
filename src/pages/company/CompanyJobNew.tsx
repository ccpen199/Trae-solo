import { useState } from 'react';
import {
  Briefcase, MapPin, DollarSign, Clock, ChevronRight, ChevronLeft,
  Send, Shield, User, Phone, FileCheck,
} from 'lucide-react';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const workDaysOptions = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function CompanyJobNew() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', salaryPerHour: '',
    workStartTime: '09:00', workEndTime: '18:00', majorRequired: '',
    workDays: [] as string[], maxHoursPerDay: 8, maxHoursPerWeek: 40,
    minWage: '', insuranceProvided: false, insuranceType: '',
    safetyMeasures: '', emergencyContact: '', emergencyPhone: '',
  });

  const handleWorkDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  };

  const handleSubmit = async () => {
    try {
      await api.post('/companies/jobs', {
        ...formData,
        majorRequired: formData.majorRequired.split(',').map((s) => s.trim()).filter(Boolean),
      });
      alert('发布成功！');
    } catch (error) {
      console.error('发布失败', error);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
  const iconInputCls = 'w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">发布岗位</h1>
        <p className="text-gray-500 mt-1">发布新的兼职岗位，招聘优秀学生</p>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500')}>1</div>
          <span className={cn('ml-2 text-sm font-medium', step >= 1 ? 'text-gray-900' : 'text-gray-400')}>基本信息</span>
        </div>
        <div className={cn('w-16 h-0.5 mx-4', step >= 2 ? 'bg-primary-600' : 'bg-gray-200')} />
        <div className="flex items-center">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500')}>2</div>
          <span className={cn('ml-2 text-sm font-medium', step >= 2 ? 'text-gray-900' : 'text-gray-400')}>用工备案</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-600" />岗位基本信息
              </h2>
              <div>
                <label className={labelCls}>岗位标题</label>
                <input type="text" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputCls} placeholder="例如：前端开发实习生" />
              </div>
              <div>
                <label className={labelCls}>岗位描述</label>
                <textarea value={formData.description} rows={4}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
                  placeholder="描述岗位的工作内容、职责等..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>工作地点</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className={iconInputCls} placeholder="城市/地址" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>时薪（元）</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="number" value={formData.salaryPerHour}
                      onChange={(e) => setFormData({ ...formData, salaryPerHour: e.target.value })}
                      className={iconInputCls} placeholder="25" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>上班时间</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="time" value={formData.workStartTime}
                      onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                      className={iconInputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>下班时间</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="time" value={formData.workEndTime}
                      onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                      className={iconInputCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">工作日</label>
                <div className="flex flex-wrap gap-2">
                  {workDaysOptions.map((day) => (
                    <button key={day} onClick={() => handleWorkDayToggle(day)}
                      className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        formData.workDays.includes(day) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>专业要求</label>
                <input type="text" value={formData.majorRequired}
                  onChange={(e) => setFormData({ ...formData, majorRequired: e.target.value })}
                  className={inputCls} placeholder="多个专业用逗号分隔" />
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                  下一步<ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary-600" />大学生兼职用工备案表
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>每日工时上限（小时）</label>
                  <input type="number" value={formData.maxHoursPerDay}
                    onChange={(e) => setFormData({ ...formData, maxHoursPerDay: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>每周工时上限（小时）</label>
                  <input type="number" value={formData.maxHoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: Number(e.target.value) })}
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>最低薪资标准（元/小时）</label>
                <input type="number" value={formData.minWage}
                  onChange={(e) => setFormData({ ...formData, minWage: e.target.value })}
                  className={inputCls} placeholder="不低于当地最低工资标准" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">是否购买保险</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.insuranceProvided}
                      onChange={() => setFormData({ ...formData, insuranceProvided: true })}
                      className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-gray-700">是</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!formData.insuranceProvided}
                      onChange={() => setFormData({ ...formData, insuranceProvided: false })}
                      className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-gray-700">否</span>
                  </label>
                </div>
              </div>
              {formData.insuranceProvided && (
                <div>
                  <label className={labelCls}>保险类型</label>
                  <input type="text" value={formData.insuranceType}
                    onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value })}
                    className={inputCls} placeholder="例如：意外险、雇主责任险" />
                </div>
              )}
              <div>
                <label className={labelCls}>安全措施</label>
                <textarea value={formData.safetyMeasures} rows={3}
                  onChange={(e) => setFormData({ ...formData, safetyMeasures: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
                  placeholder="描述为保障学生安全采取的措施..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>紧急联系人</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className={iconInputCls} placeholder="姓名" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>紧急联系电话</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className={iconInputCls} placeholder="电话" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  <ChevronLeft className="w-5 h-5" />上一步
                </button>
                <button onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-colors shadow-md shadow-accent-500/20">
                  <Send className="w-5 h-5" />提交发布
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-card p-5 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />实时预览
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900">{formData.title || '岗位标题预览'}</h4>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{formData.location || '工作地点'}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{formData.salaryPerHour ? `${formData.salaryPerHour}元/时` : '薪资'}</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 line-clamp-3">{formData.description || '岗位描述将显示在这里...'}</p>
              {formData.workDays.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {formData.workDays.map((day) => (
                    <span key={day} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">{day}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
