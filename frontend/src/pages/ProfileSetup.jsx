import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Briefcase, MapPin, GraduationCap, ChevronRight } from 'lucide-react';
import useStore from '../store';
import { userApi } from '../services/api';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { setUser, showToast, setLoading } = useStore();
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [formData, setFormData] = useState({
    nickname: '',
    gender: '',
    age: '',
    graduationStatus: '在校',
    industry: '',
    profession: '',
    hometown: '',
    currentCity: ''
  });

  const genders = ['男', '女'];
  const graduationStatuses = ['在校', '已毕业'];
  const industries = ['互联网/科技', '金融', '教育', '医疗健康', '制造业', '文化传媒', '零售/电商', '其他'];
  const professions = ['产品', '技术', '设计', '运营', '市场', '销售', 'HR', '其他'];

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.nickname || !formData.gender || !formData.age) {
        showToast('请填写完整信息');
        return;
      }
    }
    if (step === 2) {
      if (!formData.industry || !formData.profession) {
        showToast('请填写完整信息');
        return;
      }
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.hometown || !formData.currentCity) {
      showToast('请填写完整信息');
      return;
    }

    try {
      setLoading(true);

      if (avatar) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatar);
        await userApi.uploadAvatar(formDataUpload);
      }

      const res = await userApi.updateProfile(formData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      showToast('资料完善成功');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 border-4 border-primary-100"
          onClick={() => document.getElementById('avatar-input').click()}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="text-gray-500 text-sm">点击上传头像</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            placeholder="请输入昵称"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
        <div className="grid grid-cols-2 gap-3">
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => handleInputChange('gender', g)}
              className={`py-3 rounded-xl font-medium transition-all ${
                formData.gender === g
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">年龄</label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => handleInputChange('age', e.target.value)}
          placeholder="请输入年龄"
          min="18"
          max="100"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <GraduationCap className="w-5 h-5 inline mr-2" />
          毕业状态
        </label>
        <div className="grid grid-cols-2 gap-3">
          {graduationStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleInputChange('graduationStatus', status)}
              className={`py-3 rounded-xl font-medium transition-all ${
                formData.graduationStatus === status
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="w-5 h-5 inline mr-2" />
          行业
        </label>
        <select
          value={formData.industry}
          onChange={(e) => handleInputChange('industry', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
        >
          <option value="">请选择行业</option>
          {industries.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">职业</label>
        <select
          value={formData.profession}
          onChange={(e) => handleInputChange('profession', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
        >
          <option value="">请选择职业</option>
          {professions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-5 h-5 inline mr-2" />
          家乡
        </label>
        <input
          type="text"
          value={formData.hometown}
          onChange={(e) => handleInputChange('hometown', e.target.value)}
          placeholder="如：北京"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-5 h-5 inline mr-2" />
          现居地
        </label>
        <input
          type="text"
          value={formData.currentCity}
          onChange={(e) => handleInputChange('currentCity', e.target.value)}
          placeholder="如：上海"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-primary-50 rounded-xl p-4">
        <h4 className="font-medium text-primary-700 mb-2">完成设置</h4>
        <p className="text-sm text-primary-600">
          完善资料后，你可以开始认识更多志同道合的朋友。设置一个有趣的破冰问题，让对方回答后才能加你好友。
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">完善资料</h1>
          <p className="text-gray-500">让大家更好地认识你</p>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              上一步
            </button>
          )}
          <button
            onClick={step === 3 ? handleSubmit : nextStep}
            className="flex-1 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {step === 3 ? '完成' : '下一步'}
            {step < 3 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
