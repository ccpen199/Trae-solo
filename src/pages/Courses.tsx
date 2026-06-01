import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react'
import { message } from 'antd'
import { api } from '@/lib/api'

interface Course {
  id: number
  name: string
  code: string
  credit: number
  hours: number
  course_type: string
  department_id: number | null
  department_name: string
  description: string
  experiment_requirements: string
  need_odd_even: number | boolean
}

interface Department {
  id: number
  name: string
  code: string
}

interface FormErrors {
  name?: string
  code?: string
  [key: string]: string | undefined
}

const courseTypeMap: Record<string, string> = {
  normal: '普通课',
  experiment: '实验课',
  practice: '实践课',
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [searchText, setSearchText] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credit: 0,
    hours: 0,
    course_type: 'normal',
    department_id: '',
    description: '',
    experiment_requirements: '',
    need_odd_even: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [coursesRes, deptsRes] = await Promise.all([
      api.courses.list(),
      api.courses.getDepartments(),
    ])
    if (coursesRes.success) setCourses(coursesRes.data)
    if (deptsRes.success) setDepartments(deptsRes.data)
    setLoading(false)
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) {
      errors.name = '请输入课程名称'
    }
    if (!formData.code.trim()) {
      errors.code = '请输入课程代码'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      message.error('请填写必填项')
      return
    }

    const data = {
      ...formData,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      need_odd_even: formData.need_odd_even ? 1 : 0,
    }

    try {
      if (editingCourse) {
        const res = await api.courses.update(editingCourse.id, data)
        if (res.success) {
          message.success('课程更新成功')
          setShowModal(false)
          loadData()
        } else {
          if (res.errors) {
            setFormErrors(res.errors)
            const firstError = Object.values(res.errors)[0]
            message.error(firstError || '操作失败')
          } else {
            message.error(res.error || '操作失败')
          }
        }
      } else {
        const res = await api.courses.create(data)
        if (res.success) {
          message.success('课程创建成功')
          setShowModal(false)
          loadData()
        } else {
          if (res.errors) {
            setFormErrors(res.errors)
            const firstError = Object.values(res.errors)[0]
            message.error(firstError || '操作失败')
          } else {
            message.error(res.error || '操作失败')
          }
        }
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      code: course.code,
      credit: course.credit,
      hours: course.hours,
      course_type: course.course_type,
      department_id: course.department_id?.toString() || '',
      description: course.description || '',
      experiment_requirements: course.experiment_requirements || '',
      need_odd_even: !!course.need_odd_even,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这门课程吗？')) {
      const res = await api.courses.delete(id)
      if (res.success) {
        message.success('删除成功')
        loadData()
      } else {
        message.error(res.error || '删除失败')
      }
    }
  }

  const handleAdd = () => {
    setEditingCourse(null)
    setFormData({
      name: '',
      code: '',
      credit: 0,
      hours: 0,
      course_type: 'normal',
      department_id: '',
      description: '',
      experiment_requirements: '',
      need_odd_even: false,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const filteredCourses = courses.filter(
    (c) =>
      c.name.includes(searchText) ||
      c.code.includes(searchText)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">课程管理</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索课程..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增课程
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  课程代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  课程名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学分
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  课时
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  所属院系
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实验课要求
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  单双周
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {course.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{course.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{course.credit}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{course.hours}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          course.course_type === 'experiment'
                            ? 'bg-purple-100 text-purple-700'
                            : course.course_type === 'practice'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {courseTypeMap[course.course_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {course.department_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={course.experiment_requirements}>
                      {course.experiment_requirements || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {course.need_odd_even ? '是' : '否'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingCourse ? '编辑课程' : '新增课程'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    课程代码 *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value })
                      if (formErrors.code) setFormErrors({ ...formErrors, code: undefined })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      formErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.code && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    课程名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学分
                  </label>
                  <input
                    type="number"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    课时
                  </label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    课程类型
                  </label>
                  <select
                    value={formData.course_type}
                    onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="normal">普通课</option>
                    <option value="experiment">实验课</option>
                    <option value="practice">实践课</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属院系
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">请选择院系</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {formData.course_type === 'experiment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    实验课要求
                  </label>
                  <textarea
                    value={formData.experiment_requirements}
                    onChange={(e) => setFormData({ ...formData, experiment_requirements: e.target.value })}
                    rows={3}
                    placeholder="请输入实验课的具体要求..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="need_odd_even"
                  checked={formData.need_odd_even}
                  onChange={(e) => setFormData({ ...formData, need_odd_even: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="need_odd_even" className="ml-2 text-sm font-medium text-gray-700">
                  需要单双周排课
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  {editingCourse ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
