import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, PawPrint, Dog, Cat, Bird, Rabbit, Loader2 } from 'lucide-react'
import { usePetStore } from '@/stores/petStore'
import PetCard from '@/components/PetCard'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'

const filters = [
  { key: 'all', label: '全部', icon: PawPrint },
  { key: 'dog', label: '狗狗', icon: Dog },
  { key: 'cat', label: '猫咪', icon: Cat },
  { key: 'bird', label: '鸟类', icon: Bird },
  { key: 'rabbit', label: '兔子', icon: Rabbit },
  { key: 'other', label: '其他', icon: PawPrint },
]

export default function PetList() {
  const { pets, loading, error, fetchPets } = usePetStore()
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  const filteredPets = activeFilter === 'all'
    ? pets
    : pets.filter((pet) => pet.species === activeFilter)

  if (error) {
    return (
      <div className="container mx-auto py-8 animate-fadeIn">
        <div className="text-center py-16">
          <p className="text-danger">{error}</p>
          <button
            onClick={fetchPets}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-font text-2xl md:text-3xl font-bold text-text-primary">
            我的宠物档案
          </h1>
          <p className="text-text-secondary mt-2">
            管理您爱宠的健康数据和成长记录
          </p>
        </div>
        <Link
          to="/pets/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          添加宠物
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.key
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-text-secondary hover:bg-stone-100 border border-stone-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-white rounded-2xl overflow-hidden animate-pulse',
                `stagger-${Math.min(i, 6)}`
              )}
            >
              <div className="aspect-square bg-stone-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-stone-200 rounded-full w-16" />
                  <div className="h-6 bg-stone-200 rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPets.length === 0 ? (
        <EmptyState
          icon={<PawPrint className="w-8 h-8 text-stone-400" />}
          title="暂无宠物档案"
          description={activeFilter === 'all' ? '还没有添加宠物，点击下方按钮添加您的第一个宠物吧' : '该分类下暂无宠物'}
          action={
            activeFilter === 'all'
              ? {
                  label: '添加宠物',
                  onClick: () => (window.location.href = '/pets/new'),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPets.map((pet, index) => (
            <div
              key={pet.id}
              className={cn('opacity-0 animate-slideUp', `stagger-${Math.min((index % 6) + 1, 6)}`)}
              style={{ animationDelay: `${(index % 6) * 0.1}s` }}
            >
              <PetCard pet={pet} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
