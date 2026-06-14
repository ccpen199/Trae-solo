import { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  AlertCircle,
  Upload,
  Edit3,
  Save,
  FileText,
} from 'lucide-react';
import type { Company } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockCompany: Company = {
  id: '1',
  name: '示例科技有限公司',
  email: 'contact@example.com',
  licenseNo: '',
  contactName: '王经理',
  contactPhone: '13800138000',
  address: '北京市海淀区中关村大街1号',
  verified: false,
  description: '我们是一家专注于互联网产品研发的科技公司，致力于为用户提供优质的产品和服务。',
  industry: '互联网/信息技术',
  createdAt: '2024-01-01',
};

export default function CompanyProfile() {
  const [company, setCompany] = useState<Company>(mockCompany);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(company.description || '');
  const [verifyForm, setVerifyForm] = useState({
    name: company.name,
    industry: company.industry || '',
    licenseNo: '',
    contactName: company.contactName,
    contactPhone: company.contactPhone,
    address: company.address,
  });

  const handleSaveDescription = async () => {
    try {
      await api.put('/companies/profile', { description });
      setCompany({ ...company, description });
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleVerify = async () => {
    try {
      await api.post('/companies/verify', verifyForm);
      setCompany({ ...company, verified: true, ...verifyForm });
    } catch (error) {
      console.error('认证失败', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业认证</h1>
          <p className="text-gray-500 mt-1">完善企业信息，发布优质岗位</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">企业认证状态</h2>
              <p className="text-sm text-gray-500">认证通过后可发布岗位</p>
            </div>
          </div>
          <span
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium',
              company.verified
                ? 'bg-success-100 text-success-600'
                : 'bg-amber-100 text-amber-600'
            )}
          >
            {company.verified ? '已认证' : '未认证'}
          </span>
        </div>

        {company.verified ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">企业名称</span>
              </div>
              <p className="font-semibold text-gray-900">{company.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">行业</span>
              </div>
              <p className="font-semibold text-gray-900">{company.industry}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">联系电话</span>
              </div>
              <p className="font-semibold text-gray-900">{company.contactPhone}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">地址</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{company.address}</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">请完成企业认证</p>
                <p className="text-sm text-amber-600 mt-1">认证通过后才能发布岗位</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">企业名称</label>
                <input
                  type="text"
                  value={verifyForm.name}
                  onChange={(e) => setVerifyForm({ ...verifyForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入企业名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">所属行业</label>
                <input
                  type="text"
                  value={verifyForm.industry}
                  onChange={(e) => setVerifyForm({ ...verifyForm, industry: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入所属行业"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">统一社会信用代码</label>
                <input
                  type="text"
                  value={verifyForm.licenseNo}
                  onChange={(e) => setVerifyForm({ ...verifyForm, licenseNo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入统一社会信用代码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">联系人</label>
                <input
                  type="text"
                  value={verifyForm.contactName}
                  onChange={(e) => setVerifyForm({ ...verifyForm, contactName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">联系电话</label>
                <input
                  type="text"
                  value={verifyForm.contactPhone}
                  onChange={(e) => setVerifyForm({ ...verifyForm, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">企业地址</label>
                <input
                  type="text"
                  value={verifyForm.address}
                  onChange={(e) => setVerifyForm({ ...verifyForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="请输入企业地址"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">营业执照</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">点击上传营业执照照片</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
              </div>
            </div>
            <button
              onClick={handleVerify}
              className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              提交认证
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">企业介绍</h2>
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
              onClick={handleSaveDescription}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
            placeholder="介绍一下你的企业..."
          />
        ) : (
          <p className="text-gray-600 text-sm leading-relaxed">
            {description || '暂无企业介绍'}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">联系电话</p>
              <p className="font-medium text-gray-900">{company.contactPhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">企业邮箱</p>
              <p className="font-medium text-gray-900">{company.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">企业地址</p>
              <p className="font-medium text-gray-900 text-sm">{company.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
