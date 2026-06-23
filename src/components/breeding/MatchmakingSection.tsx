import { useState } from 'react'
import { X, Award, Shield, Heart, MapPin, MessageSquare, CheckCircle, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Match {
  id: number
  pet_name: string
  breed: string
  species: string
  match_score: number
  match_factors: { bloodline: number; health: number; region: number }
  owner_name: string
  pet_avatar?: string
}

interface Props {
  matches: Match[]
  loading: boolean
  onFetch: () => void
  species: string
}

export default function MatchmakingSection({ matches, loading, onFetch, species }: Props) {
  const [showContact, setShowContact] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-2">
      <div className="flex items-center justify-between mb-6">
        <h3 className="heading-font text-lg font-semibold text-text-primary flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          智能撮合匹配
        </h3>
        <button
          onClick={onFetch}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Heart className="w-4 h-4" />
          )}
          {matches.length > 0 ? '重新匹配' : '开始匹配'}
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-64 p-4 bg-stone-100 rounded-xl animate-pulse">
              <div className="w-full aspect-square bg-stone-200 rounded-lg mb-3" />
              <div className="h-4 bg-stone-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-stone-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <Heart className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <p>点击上方按钮开始智能匹配</p>
          <p className="text-sm mt-1">系统将根据血统、健康、地域综合匹配</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {matches.map((match, index) => {
            const imgSrc = match.pet_avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${species || match.species || 'dog'}%20pet%20portrait&image_size=square`
            return (
              <div
                key={match.id}
                className="shrink-0 w-64 border border-stone-200 rounded-xl overflow-hidden card-hover animate-slideUp opacity-0"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative aspect-square">
                  <img src={imgSrc} alt={match.pet_name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{match.match_score}%</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-text-primary">{match.pet_name}</h4>
                  <p className="text-sm text-text-secondary mb-3">{match.breed}</p>
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">血统匹配</span>
                        <span className="font-medium text-primary">{match.match_factors.bloodline}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${match.match_factors.bloodline}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">健康匹配</span>
                        <span className="font-medium text-success">{match.match_factors.health}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${match.match_factors.health}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">地域匹配</span>
                        <span className="font-medium text-blue-600">{match.match_factors.region}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${match.match_factors.region}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-4">
                    <UserCheck className="w-3 h-3 text-primary" />
                    <span>{match.owner_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContact(showContact === match.id ? null : match.id)}
                      className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-text-primary text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      联系对方
                    </button>
                    <button className="flex-1 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      同意撮合
                    </button>
                  </div>
                  {showContact === match.id && (
                    <div className="mt-3 p-3 bg-stone-50 rounded-lg text-sm animate-fadeIn">
                      <p className="text-text-secondary">联系方式</p>
                      <p className="font-medium text-text-primary mt-1">138****8888</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
