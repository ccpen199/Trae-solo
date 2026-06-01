import { useState, useEffect } from 'react';
import api from '../utils/api';

function Contacts() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [studentForm, setStudentForm] = useState({
    name: '',
    student_no: '',
    gender: '',
    birth_date: '',
    class_id: ''
  });

  const [guardianForm, setGuardianForm] = useState({
    name: '',
    phone: '',
    email: '',
    relation: '',
    is_primary: false,
    username: '',
    password: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classRes, teacherRes] = await Promise.all([
        api.get('/contacts/classes'),
        api.get('/contacts/teachers')
      ]);
      setClasses(classRes.data);
      setTeachers(teacherRes.data);
      
      if (classRes.data.length > 0) {
        setSelectedClass(classRes.data[0]);
        loadStudents(classRes.data[0].id);
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    try {
      const res = await api.get(`/contacts/classes/${classId}/students`);
      setStudents(res.data);
    } catch (error) {
      console.error('加载学生失败:', error);
    }
  };

  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    loadStudents(cls.id);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contacts/students', { ...studentForm, class_id: selectedClass?.id });
      setShowStudentModal(false);
      setStudentForm({ name: '', student_no: '', gender: '', birth_date: '', class_id: '' });
      loadStudents(selectedClass.id);
      alert('添加成功');
    } catch (error) {
      alert('添加失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddGuardian = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contacts/guardians', { ...guardianForm, student_id: selectedStudent.id });
      setShowGuardianModal(false);
      setGuardianForm({ name: '', phone: '', email: '', relation: '', is_primary: false, username: '', password: '' });
      loadStudents(selectedClass.id);
      alert('添加成功');
    } catch (error) {
      alert('添加失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateStudentStatus = async (studentId, status) => {
    try {
      await api.put(`/contacts/students/${studentId}`, { status });
      loadStudents(selectedClass.id);
      alert('状态已更新');
    } catch (error) {
      alert('更新失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex flex-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>通讯录</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => setShowStudentModal(true)}>
              + 添加学生
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4">
          <strong style={{ lineHeight: '38px' }}>选择班级：</strong>
          {classes.map((cls) => (
            <button
              key={cls.id}
              className={`btn ${selectedClass?.id === cls.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => handleClassChange(cls)}
            >
              {cls.grade_name} {cls.name}
            </button>
          ))}
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            学生列表
          </div>
          <div className={`tab ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
            教师列表
          </div>
        </div>

        {activeTab === 'students' && (
          <table className="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>性别</th>
                <th>监护人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.student_no || '-'}</td>
                  <td>{student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}</td>
                  <td>
                    {student.guardians?.map((g, i) => (
                      <div key={i}>
                        {g.name} ({g.relation})
                        {g.is_primary && <span className="badge badge-info">主</span>}
                      </div>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                      {student.status === 'active' ? '在校' : student.status === 'transferred' ? '转班' : '离校'}
                    </span>
                  </td>
                  <td>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={() => {
                          setSelectedStudent(student);
                          setShowGuardianModal(true);
                        }}>
                          添加监护人
                        </button>
                        {student.status === 'active' && (
                          <button className="btn btn-sm btn-warning" onClick={() => handleUpdateStudentStatus(student.id, 'left')}>
                            离校
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'teachers' && (
          <table className="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>电话</th>
                <th>角色</th>
                <th>任教班级</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.phone || '-'}</td>
                  <td>
                    {teacher.is_head_teacher && <span className="badge badge-success">班主任</span>}
                    <span className="badge badge-info" style={{ marginLeft: '5px' }}>任课老师</span>
                  </td>
                  <td>{teacher.classes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showStudentModal && (
        <div className="modal" onClick={() => setShowStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加学生</h3>
              <button className="close-btn" onClick={() => setShowStudentModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label>姓名 *</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>学号</label>
                <input
                  type="text"
                  value={studentForm.student_no}
                  onChange={e => setStudentForm({ ...studentForm, student_no: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>性别</label>
                  <select
                    value={studentForm.gender}
                    onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>出生日期</label>
                  <input
                    type="date"
                    value={studentForm.birth_date}
                    onChange={e => setStudentForm({ ...studentForm, birth_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">添加</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStudentModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGuardianModal && selectedStudent && (
        <div className="modal" onClick={() => setShowGuardianModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加监护人 - {selectedStudent.name}</h3>
              <button className="close-btn" onClick={() => setShowGuardianModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddGuardian}>
              <div className="form-group">
                <label>姓名 *</label>
                <input
                  type="text"
                  value={guardianForm.name}
                  onChange={e => setGuardianForm({ ...guardianForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>电话 *</label>
                  <input
                    type="text"
                    value={guardianForm.phone}
                    onChange={e => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>关系 *</label>
                  <input
                    type="text"
                    value={guardianForm.relation}
                    onChange={e => setGuardianForm({ ...guardianForm, relation: e.target.value })}
                    placeholder="如：父亲、母亲"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  value={guardianForm.email}
                  onChange={e => setGuardianForm({ ...guardianForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={guardianForm.is_primary}
                    onChange={e => setGuardianForm({ ...guardianForm, is_primary: e.target.checked })}
                  />
                  设为主要监护人
                </label>
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>登录用户名</label>
                  <input
                    type="text"
                    value={guardianForm.username}
                    onChange={e => setGuardianForm({ ...guardianForm, username: e.target.value })}
                    placeholder="默认使用手机号"
                  />
                </div>
                <div className="form-group">
                  <label>登录密码</label>
                  <input
                    type="password"
                    value={guardianForm.password}
                    onChange={e => setGuardianForm({ ...guardianForm, password: e.target.value })}
                    placeholder="默认 123456"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">添加</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGuardianModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contacts;
