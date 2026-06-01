import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseApi, commonApi } from '../services/api';

const CourseForm = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacher_id: '',
    classroom_id: '',
    grade_ids: [],
    day_of_week: 1,
    start_time: '16:30',
    end_time: '17:30',
    capacity: 20,
    fee: 0,
    enrollment_start: '',
    enrollment_end: '',
    refund_deadline: '',
    refund_rule: '',
    requirements: ''
  });
  
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSelectData();
    if (isEdit) {
      loadCourse();
    }
  }, [id]);

  const loadSelectData = async () => {
    try {
      const [teachersRes, classroomsRes, gradesRes] = await Promise.all([
        commonApi.getTeachers(),
        commonApi.getClassrooms(),
        commonApi.getGrades()
      ]);
      setTeachers(teachersRes.data);
      setClassrooms(classroomsRes.data);
      setGrades(gradesRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const loadCourse = async () => {
    try {
      const response = await courseApi.get(id);
      setFormData({
        ...response.data,
        grade_ids: response.data.grade_ids
      });
    } catch (err) {
      console.error('加载课程失败', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const gradeId = parseInt(value);
      setFormData(prev => ({
        ...prev,
        grade_ids: checked 
          ? [...prev.grade_ids, gradeId]
          : prev.grade_ids.filter(g => g !== gradeId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['capacity', 'fee', 'day_of_week'].includes(name) ? Number(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await courseApi.update(id, formData);
        alert('更新成功！');
      } else {
        await courseApi.create(formData);
        alert('创建成功！');
      }
      navigate('/courses');
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{isEdit ? '编辑课程' : '创建课程'}</h2>
        <Link to="/courses" className="btn">返回列表</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div className="form-group">
              <label>课程名称 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>授课教师 *</label>
              <select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
                required
              >
                <option value="">请选择</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>教室 *</label>
              <select
                name="classroom_id"
                value={formData.classroom_id}
                onChange={handleChange}
                required
              >
                <option value="">请选择</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (容量: {c.capacity})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>招生年级 *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {grades.map(g => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      value={g.id}
                      checked={formData.grade_ids.includes(g.id)}
                      onChange={handleChange}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>上课时间 *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                >
                  {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((d, i) => (
                    <option key={i} value={i + 1}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <span>至</span>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>招生人数 *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>课程费用 (元)</label>
              <input
                type="number"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>报名开始时间</label>
              <input
                type="datetime-local"
                name="enrollment_start"
                value={formData.enrollment_start?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>报名截止时间</label>
              <input
                type="datetime-local"
                name="enrollment_end"
                value={formData.enrollment_end?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>退费截止时间</label>
              <input
                type="datetime-local"
                name="refund_deadline"
                value={formData.refund_deadline?.slice(0, 16)}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>课程描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>报名条件</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>退费规则</label>
            <textarea
              name="refund_rule"
              value={formData.refund_rule}
              onChange={handleChange}
              rows="2"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '保存中...' : (isEdit ? '保存' : '创建')}
            </button>
            <Link to="/courses" className="btn">取消</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
