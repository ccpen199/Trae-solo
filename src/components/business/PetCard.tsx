import { motion } from 'framer-motion';
import { Card } from '@/components/common/Card';
import { Badge, Tag, Avatar } from '@/components/common/BadgeTagAvatar';
import { Calendar, Scale, Syringe, AlertCircle } from 'lucide-react';
import type { Pet } from '@/types/pet';
import { cn } from '@/utils/common';
import { format, differenceInMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PetCardProps {
  pet: Pet;
  selected?: boolean;
  onClick?: () => void;
  showHealthScore?: boolean;
}

export function PetCard({ pet, selected = false, onClick, showHealthScore = true }: PetCardProps) {
  const age = pet.birthday
    ? `${differenceInMonths(new Date(), new Date(pet.birthday))}个月`
    : '未知';

  const speciesIcon = {
    dog: '🐕',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    other: '🐾',
  }[pet.species];

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(
        'relative overflow-hidden',
        selected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
    >
      {selected && (
        <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-bl-xl">
          当前选择
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="relative">
          {pet.avatar ? (
            <img
              src={pet.avatar}
              alt={pet.name}
              className="w-20 h-20 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <Avatar name={pet.name} size="lg" />
          )}
          <span className="absolute -bottom-1 -right-1 text-xl">{speciesIcon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg font-semibold text-neutral-900">{pet.name}</h4>
            {showHealthScore && (
              <Badge
                variant={pet.healthScore >= 70 ? 'success' : pet.healthScore >= 50 ? 'warning' : 'danger'}
                size="sm"
              >
                健康分 {pet.healthScore}
              </Badge>
            )}
          </div>

          <p className="text-sm text-neutral-500 mt-0.5">
            {pet.breed} · {pet.gender === 'male' ? '♂' : '♀'} · {age}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center text-xs text-neutral-500">
              <Scale className="w-3.5 h-3.5 mr-1" />
              {pet.weight}kg
            </div>
            <div className="flex items-center text-xs text-neutral-500">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {pet.birthday ? format(new Date(pet.birthday), 'yyyy-MM-dd', { locale: zhCN }) : '未知'}
            </div>
            {pet.sterilization === 'yes' && (
              <Tag variant="mint">已绝育</Tag>
            )}
          </div>

          {pet.chronicConditions.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>慢病管理中：{pet.chronicConditions.map(c => c.name).join('、')}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {pet.tags.map((tag) => (
              <Tag key={tag} variant="neutral" size="sm">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface PetSelectorProps {
  pets: Pet[];
  selectedId: string | null;
  onSelect: (pet: Pet) => void;
}

export function PetSelector({ pets, selectedId, onSelect }: PetSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {pets.map((pet) => (
        <motion.button
          key={pet.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(pet)}
          className={cn(
            'flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200',
            selectedId === pet.id
              ? 'bg-primary-100 ring-2 ring-primary-500'
              : 'bg-white hover:bg-primary-50 border border-neutral-200'
          )}
        >
          <Avatar
            src={pet.avatar}
            name={pet.name}
            size="md"
            className={selectedId === pet.id ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-100' : ''}
          />
          <span className={cn(
            'text-sm font-medium',
            selectedId === pet.id ? 'text-primary-700' : 'text-neutral-700'
          )}>
            {pet.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

interface HealthReminderProps {
  type: 'vaccine' | 'deworming' | 'checkup';
  petName: string;
  dueDate: string;
  daysLeft: number;
}

export function HealthReminder({ type, petName, dueDate, daysLeft }: HealthReminderProps) {
  const typeConfig = {
    vaccine: { icon: Syringe, label: '疫苗接种', color: 'text-blue-600 bg-blue-50' },
    deworming: { icon: Syringe, label: '驱虫提醒', color: 'text-orange-600 bg-orange-50' },
    checkup: { icon: Calendar, label: '体检提醒', color: 'text-primary-600 bg-primary-50' },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-soft border border-neutral-100"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-xl', typeConfig.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900">
            {petName}的{typeConfig.label}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            到期时间：{dueDate}
          </p>
        </div>
        <Badge variant={daysLeft <= 7 ? 'danger' : daysLeft <= 30 ? 'warning' : 'info'}>
          {daysLeft > 0 ? `还有${daysLeft}天` : '已过期'}
        </Badge>
      </div>
    </motion.div>
  );
}
