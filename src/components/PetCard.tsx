import { useNavigate } from 'react-router-dom';
import { Heart, Syringe, Bug, ChevronRight, PawPrint } from 'lucide-react';
import type { Pet } from '@shared/types';
import { cn } from '@/lib/utils';

interface PetCardProps {
  pet: Pet;
  compact?: boolean;
}

const speciesMap: Record<Pet['species'], string> = {
  dog: '狗狗',
  cat: '猫咪',
  rabbit: '兔子',
  bird: '鸟类',
  other: '其他',
};

const healthStatusMap = {
  healthy: { label: '健康', className: 'tag-green' },
  sick: { label: '患病中', className: 'tag-orange' },
  chronic: { label: '慢性病', className: 'bg-gray-100 text-gray-600' },
};

export default function PetCard({ pet, compact }: PetCardProps) {
  const navigate = useNavigate();
  const status = healthStatusMap[pet.healthStatus];

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/pets/${pet.id}`)}
        className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-colors w-full text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {pet.avatar ? (
            <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <PawPrint className="w-6 h-6 text-forest-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{pet.name}</p>
          <p className="text-xs text-gray-500">{speciesMap[pet.species]} · {pet.breed}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div
      onClick={() => navigate(`/pets/${pet.id}`)}
      className="card cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-forest-100 flex items-center justify-center overflow-hidden">
            {pet.avatar ? (
              <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-8 h-8 text-forest-500" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900">{pet.name}</h3>
            <p className="text-sm text-gray-500">
              {speciesMap[pet.species]} · {pet.breed}
            </p>
          </div>
        </div>
        <span className={cn('tag', status.className)}>{status.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">年龄</p>
          <p className="font-semibold text-gray-900 text-sm">
            {Math.floor((Date.now() - new Date(pet.birthday).getTime()) / 31536000000)} 岁
          </p>
        </div>
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">体重</p>
          <p className="font-semibold text-gray-900 text-sm">{pet.weight} kg</p>
        </div>
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">性别</p>
          <p className="font-semibold text-gray-900 text-sm">
            {pet.gender === 'male' ? '公' : '母'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Syringe className="w-4 h-4 text-forest-500" />
          <span className="text-xs text-gray-600">疫苗 {pet.vaccineRecords.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Bug className="w-4 h-4 text-warm-400" />
          <span className="text-xs text-gray-600">驱虫 {pet.dewormingRecords.length}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-forest-600 group-hover:text-forest-500 transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-xs font-medium">查看详情</span>
        </div>
      </div>
    </div>
  );
}
