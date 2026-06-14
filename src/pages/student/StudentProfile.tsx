import { useState } from 'react';
import {
  User,
  School,
  GraduationCap,
  BookOpen,
  BadgeCheck,
  AlertCircle,
  Save,
  Edit3,
  Plus,
  X,
} from 'lucide-react';
import type { Student } from '../../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockStudent: Student = {
  id: '1',
  studentId: '2021001001',
  name: '张三',
  school: '清华大学',
  major: '计算机科学与技术',
  grade: '大三',
  rating: 4.8,
  verified: false,
  resume: {
    skills: ['React', 'TypeScript', 'Python', 'Node.js'],
    experience: '曾在某互联网公司实习3个月，负责前端开发工作。',
    introduction: '热爱编程，学习能力强，善于沟通协作。',
  },
  createdAt: '2024-01-15',
};

export default function StudentProfile() {
  const [student, setStudent] = useState<Student>(mockStudent);
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>(student.resume?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [experience, setExperience] = useState(student.resume?.experience || '');
  const [introduction, setIntroduction] = useState(student.resume?.introduction || '');
  const [verifyForm, setVerifyForm] = useState({
    studentId: '',
    name: '',
    school: '',
  });

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    try {
      await api.put('/students/profile', {
        resume: { skills, experience, introduction },
      });
      setStudent({
        ...student,
        resume: { skills, experience, introduction },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleVerify = async () => {
    try {
      await api.post('/students/verify', verifyForm);
      setStudent({ ...student, verified: true });
    } catch (error) {
      console.error('认证失败', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学籍认证</h1>
          <p className="text-gray-500 mt-1">完善个人信息，解锁更多岗位</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">学籍认证状态</h2>
              <p className="text-sm text-gray-500">认证后可投递更多优质岗位</p>
            </div>
          </div>
          <span
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium',
              student.verified
                ? 'bg-success-100 text-success-600'
                : 'bg-amber-100 text-amber-600'
            )}
          >
            {student.verified ? '已认证' : '未认证'}
          </span>
        </div>

        {student.verified ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">学籍号</span>
              </div>
              <p className="font-semibold text-gray-900">{student.studentId}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm">姓名</span>
              </div>
              <p className="font-semibold text-gray-900">{student.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <School className="w-4 h-4" />
                <span className="text-sm">学校</span>
              </div>
              <p className="font-semibold text-gray-900">{student.school}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">专业/年级</span>
              </div>
              <p className="font-semibold text-gray-900">{student.major} {student.grade}</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">请完成学籍认证</p>
                <p className="text-sm text-amber-600 mt-1">认证通过后才能投递岗位</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">学号</label>
                <input
                  type="text"
                  value={verifyForm.studentId}
                  onChange={(e) => setVerifyForm({ ...verifyForm, studentId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入学号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={verifyForm.name}
                  onChange={(e) => setVerifyForm({ ...verifyForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入真实姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">学校</label>
                <input
                  type="text"
                  value={verifyForm.school}
                  onChange={(e) => setVerifyForm({ ...verifyForm, school: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入学校名称"
                />
              </div>
            </div>
            <button
              onClick={handleVerify}
              className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              提交认证
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">个人简历</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Edit3 className="w-4 h-4" />
              编辑
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">技能标签</label>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-primary-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="输入技能名称，按回车添加"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">暂无技能标签</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">实习经历</label>
            {isEditing ? (
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
                placeholder="描述你的实习经历..."
              />
            ) : (
              <p className="text-gray-600 text-sm leading-relaxed">
                {experience || '暂无实习经历'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">自我介绍</label>
            {isEditing ? (
              <textarea
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
                placeholder="简单介绍一下自己..."
              />
            ) : (
              <p className="text-gray-600 text-sm leading-relaxed">
                {introduction || '暂无自我介绍'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
