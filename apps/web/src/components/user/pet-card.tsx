import Link from 'next/link';
import { Cake, Scale, Syringe, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PetProfile } from '@pet/shared/types';
import { PET_TYPE_LABELS } from '@pet/shared/constants';

interface PetCardProps {
  pet: PetProfile;
  compact?: boolean;
  showActions?: boolean;
}

export function PetCard({ pet, compact = false, showActions = false }: PetCardProps) {
  return (
    <Link href={showActions ? '/user/pets' : '#'}>
      <div className={cn(
        'rounded-lg border bg-card transition-shadow hover:shadow-md',
        compact ? 'p-3' : 'p-4'
      )}>
        <div className="flex gap-3">
          <div className={cn(
            'shrink-0 rounded-full bg-pet-cream flex items-center justify-center font-medium text-pet-orange',
            compact ? 'h-12 w-12 text-lg' : 'h-16 w-16 text-xl'
          )}>
            {pet.avatar ? (
              <img src={pet.avatar} alt={pet.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              pet.name.charAt(0)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'font-semibold text-foreground',
                compact ? 'text-sm' : 'text-base'
              )}>
                {pet.name}
              </span>
              <span className="rounded bg-pet-cream px-1.5 py-0.5 text-xs text-pet-orange">
                {PET_TYPE_LABELS[pet.type] || pet.type}
              </span>
              {pet.breed && (
                <span className="text-xs text-muted-foreground">{pet.breed}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
              {pet.birthday && (
                <span className="flex items-center gap-1">
                  <Cake className="h-3 w-3" />
                  {new Date(pet.birthday).toLocaleDateString()}
                </span>
              )}
              {pet.weight && (
                <span className="flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {pet.weight}kg
                </span>
              )}
              <span className="flex items-center gap-1">
                <Syringe className="h-3 w-3" />
                {pet.isNeutered ? '已绝育' : '未绝育'}
              </span>
            </div>

            {!compact && pet.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{pet.bio}</p>
            )}

            {pet.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pet.tags.slice(0, compact ? 2 : 4).map((tag) => (
                  <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                    {tag}
                  </span>
                ))}
                {pet.tags.length > (compact ? 2 : 4) && (
                  <span className="text-xs text-muted-foreground">+{pet.tags.length - (compact ? 2 : 4)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="mt-3 flex gap-2 border-t pt-3">
            <button className="flex-1 rounded-md bg-pet-cream py-1.5 text-xs font-medium text-pet-orange hover:bg-pet-orange hover:text-white transition-colors">
              编辑
            </button>
            <button className="flex-1 rounded-md border py-1.5 text-xs font-medium text-muted-foreground hover:border-pet-orange hover:text-pet-orange transition-colors">
              健康档案
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
