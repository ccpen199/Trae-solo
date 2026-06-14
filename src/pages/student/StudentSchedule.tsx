import { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  MapPin,
  BarChart3,
} from 'lucide-react';
import type { ScheduleCourse } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const periods = [
  { label: '第1节', time: '08:00-08:45' },
  { label: '第2节', time: '08:55-09:40' },
  { label: '第3节', time: '10:00-10:45' },
  { label: '第4节', time: '10:55-11:40' },
  { label: '第5节', time: '14:00-14:45' },
  { label: '第6节', time: '14:55-15:40' },
  { label: '第7节', time: '16:00-16:45' },
  { label: '第8节', time: '16:55-17:40' },
  { label: '第9节', time: '19:00-19:45' },
  { label: '第10节', time: '19:55-20:40' },
];

const courseColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-rose-500',
];

const initialCourses: ScheduleCourse[] = [
  { day: 0, startPeriod: 0, endPeriod: 1, courseName: '高等数学', location: '教学楼A101' },
  { day: 1, startPeriod: 2, endPeriod: 3, courseName: '数据结构', location: '教学楼B203' },
  { day: 2, startPeriod: 0, endPeriod: 1, courseName: '大学英语', location: '外语楼302' },
  { day: 3, startPeriod: 4, endPeriod: 5, courseName: '操作系统', location: '教学楼A305' },
  { day: 4, startPeriod: 2, endPeriod: 3, courseName: '计算机网络', location: '教学楼B102' },
];

interface CourseFormData {
  courseName: string;
  location: string;
  day: number;
  startPeriod: number;
  endPeriod: number;
}

export default function StudentSchedule() {
  const [courses, setCourses] = useState<ScheduleCourse[]>(initialCourses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ScheduleCourse | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    courseName: '',
    location: '',
    day: 0,
    startPeriod: 0,
    endPeriod: 1,
  });

  const getCourseColor = (index: number) => courseColors[index % courseColors.length];

  const getCoursesForCell = (day: number, period: number) => {
    return courses.filter(
      (c) => c.day === day && period >= c.startPeriod && period <= c.endPeriod
    );
  };

  const isCourseStart = (course: ScheduleCourse, period: number) => {
    return course.startPeriod === period;
  };

  const handleAddCourse = (day: number, period: number) => {
    setEditingCourse(null);
    setFormData({
      courseName: '',
      location: '',
      day,
      startPeriod: period,
      endPeriod: period,
    });
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: ScheduleCourse) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName,
      location: course.location || '',
      day: course.day,
      startPeriod: course.startPeriod,
      endPeriod: course.endPeriod,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (course: ScheduleCourse) => {
    try {
      await api.delete(`/schedule/courses/${course.day}-${course.startPeriod}`);
      setCourses(courses.filter((c) => c !== course));
    } catch (error) {
      setCourses(courses.filter((c) => c !== course));
    }
  };

  const handleSubmit = async () => {
    if (!formData.courseName.trim()) return;

    const newCourse: ScheduleCourse = {
      day: formData.day,
      startPeriod: formData.startPeriod,
      endPeriod: formData.endPeriod,
      courseName: formData.courseName,
      location: formData.location,
    };

    try {
      if (editingCourse) {
        await api.put('/schedule/courses', newCourse);
        setCourses(courses.map((c) => (c === editingCourse ? newCourse : c)));
      } else {
        await api.post('/schedule/courses', newCourse);
        setCourses([...courses, newCourse]);
      }
    } catch (error) {
      if (editingCourse) {
        setCourses(courses.map((c) => (c === editingCourse ? newCourse : c)));
      } else {
        setCourses([...courses, newCourse]);
      }
    }

    setIsModalOpen(false);
  };

  const calculateFreeTime = () => {
    const totalSlots = 7 * 10;
    const occupiedSlots = courses.reduce(
      (sum, c) => sum + (c.endPeriod - c.startPeriod + 1),
      0
    );
    const freeSlots = totalSlots - occupiedSlots;
    return {
      total: totalSlots,
      occupied: occupiedSlots,
      free: freeSlots,
      percentage: Math.round((freeSlots / totalSlots) * 100),
    };
  };

  const freeTimeStats = calculateFreeTime();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程表</h1>
          <p className="text-gray-500 mt-1">管理你的课程，系统将自动匹配空闲时间</p>
        </div>
        <button
          onClick={() => handleAddCourse(0, 0)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-5 h-5" />
          添加课程
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{freeTimeStats.percentage}%</p>
              <p className="text-sm text-gray-500">空闲时段占比</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{freeTimeStats.free}</p>
              <p className="text-sm text-gray-500">空闲节数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500">已安排课程</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-20 p-2 text-left text-sm font-medium text-gray-500">时间</th>
              {weekDays.map((day, index) => (
                <th
                  key={day}
                  className={cn(
                    'p-3 text-center text-sm font-medium',
                    index < 5 ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, periodIndex) => (
              <tr key={period.label} className="border-t border-gray-100">
                <td className="p-2 text-xs text-gray-400">
                  <div className="font-medium text-gray-600">{period.label}</div>
                  <div className="text-gray-400">{period.time}</div>
                </td>
                {weekDays.map((_, dayIndex) => {
                  const cellCourses = getCoursesForCell(dayIndex, periodIndex);
                  return (
                    <td
                      key={dayIndex}
                      className="p-1 h-16 align-top"
                      onClick={() => cellCourses.length === 0 && handleAddCourse(dayIndex, periodIndex)}
                    >
                      {cellCourses.length === 0 ? (
                        <div className="h-full rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center group">
                          <Plus className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      ) : (
                        cellCourses.map((course) => {
                          if (!isCourseStart(course, periodIndex)) return null;
                          const courseIndex = courses.indexOf(course);
                          const height = (course.endPeriod - course.startPeriod + 1) * 72 - 8;
                          return (
                            <div
                              key={`${course.day}-${course.startPeriod}`}
                              className={cn(
                                'rounded-lg p-2 text-white cursor-pointer hover:opacity-90 transition-opacity relative',
                                getCourseColor(courseIndex)
                              )}
                              style={{ height: `${height}px` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCourse(course);
                              }}
                            >
                              <p className="text-sm font-medium truncate">{course.courseName}</p>
                              {course.location && (
                                <p className="text-xs opacity-80 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 inline mr-0.5" />
                                  {course.location}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourse ? '编辑课程' : '添加课程'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">课程名称</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="请输入课程名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">上课地点</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="请输入上课地点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">星期</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {weekDays.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">开始节数</label>
                  <select
                    value={formData.startPeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startPeriod: Number(e.target.value),
                        endPeriod: Math.max(Number(e.target.value), formData.endPeriod),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    {periods.map((p, index) => (
                      <option key={p.label} value={index}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">结束节数</label>
                  <select
                    value={formData.endPeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endPeriod: Math.max(Number(e.target.value), formData.startPeriod),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    {periods.slice(formData.startPeriod).map((p, index) => (
                      <option key={p.label} value={formData.startPeriod + index}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {editingCourse && (
                <button
                  onClick={() => {
                    handleDeleteCourse(editingCourse);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {editingCourse ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
