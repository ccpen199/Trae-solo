import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Syringe,
  Bug,
  Heart,
  MessageCircle,
  Calendar,
  PawPrint,
  ChevronRight,
  Scale,
  Cake,
  Check,
} from 'lucide-react';
import type { Pet } from '@shared/types';

const mockPet: Pet = {
  id: '1',
  ownerId: '1',
  name: '豆豆',
  species: 'dog',
  breed: '金毛寻回犬',
  gender: 'male',
  birthday: '2022-03-15',
  weight: 28.5,
  healthStatus: 'healthy',
  vaccineRecords: [
    { id: 'v1', petId: '1', vaccineName: '狂犬疫苗', date: '2025-01-15', nextDate: '2026-01-15', hospitalId: 'h1' },
    { id: 'v2', petId: '1', vaccineName: '六联疫苗', date: '2025-01-15', nextDate: '2026-01-15', hospitalId: 'h1' },
  ],
  dewormingRecords: [
    { id: 'd1', petId: '1', type: 'internal', productName: '拜宠清', date: '2025-03-01', nextDate: '2025-06-01' },
    { id: 'd2', petId: '1', type: 'external', productName: '福来恩', date: '2025-03-15', nextDate: '2025-06-15' },
  ],
};

const speciesMap: Record<Pet['species'], string> = {
  dog: '狗狗',
  cat: '猫咪',
  rabbit: '兔子',
  bird: '鸟类',
  other: '其他',
};

function calculateAge(birthday: string) {
  const ageMs = Date.now() - new Date(birthday).getTime();
  const years = Math.floor(ageMs / 31536000000);
  const months = Math.floor((ageMs % 31536000000) / 2628000000);
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}岁`;
  return `${years}岁${months}个月`;
}

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pet = mockPet;

  const stats = [
    { icon: Cake, label: '年龄', value: calculateAge(pet.birthday) },
    { icon: Scale, label: '体重', value: `${pet.weight} kg` },
    { icon: PawPrint, label: '品种', value: pet.breed },
    { icon: Heart, label: '性别', value: pet.gender === 'male' ? '公' : '母' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white hover:bg-forest-50 transition-colors shadow-card"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="section-title">宠物详情 · {pet.name}</h1>
          <p className="section-subtitle">{speciesMap[pet.species]} · 健康档案</p>
        </div>
        <button className="btn-secondary">
          <Edit className="w-4 h-4" />
          编辑
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
            <PawPrint className="w-16 h-16 text-forest-500" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 min-w-[140px]">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-forest-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => navigate('/consultations')}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                在线问诊
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="btn-secondary !px-4 !py-2 text-sm"
              >
                <Calendar className="w-4 h-4" />
                预约体检
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
                <Syringe className="w-5 h-5 text-forest-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-gray-900">疫苗记录</h3>
                <p className="text-xs text-gray-500">共 {pet.vaccineRecords.length} 条</p>
              </div>
            </div>
            <button className="text-sm text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1">
              添加 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pet.vaccineRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无疫苗记录</p>
          ) : (
            <div className="space-y-3">
              {pet.vaccineRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Check className="w-5 h-5 text-forest-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.vaccineName}</p>
                    <p className="text-xs text-gray-500">
                      接种: {new Date(record.date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">下次</p>
                    <p className="text-sm font-medium text-warm-500">
                      {new Date(record.nextDate).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                <Bug className="w-5 h-5 text-warm-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-gray-900">驱虫记录</h3>
                <p className="text-xs text-gray-500">共 {pet.dewormingRecords.length} 条</p>
              </div>
            </div>
            <button className="text-sm text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1">
              添加 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pet.dewormingRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无驱虫记录</p>
          ) : (
            <div className="space-y-3">
              {pet.dewormingRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Check className="w-5 h-5 text-warm-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.productName}</p>
                    <p className="text-xs text-gray-500">
                      {record.type === 'internal' ? '体内驱虫' : '体外驱虫'} · {new Date(record.date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">下次</p>
                    <p className="text-sm font-medium text-warm-500">
                      {new Date(record.nextDate).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
