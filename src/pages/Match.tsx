import { useState } from 'react'
import MatchFilter from '@/components/match/MatchFilter'
import MatchResults from '@/components/match/MatchResults'
import BomCompare from '@/components/match/BomCompare'
import { useStore, type MatchWeights } from '@/store'

export default function Match() {
  const matchResults = useStore((s) => s.matchResults)
  const matchWeights = useStore((s) => s.matchWeights)
  const setMatchWeights = useStore((s) => s.setMatchWeights)
  const runMatch = useStore((s) => s.runMatch)

  const [type, setType] = useState('procurement')
  const [location, setLocation] = useState('')
  const [crafts, setCrafts] = useState<string[]>([])
  const [quantity, setQuantity] = useState(5000)
  const [deadline, setDeadline] = useState('')
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 0])
  const [activeTab, setActiveTab] = useState<'results' | 'bom'>('results')

  const handleMatch = () => {
    runMatch(type, { location, crafts, quantity, deadline, budgetRange })
  }

  return (
    <div className="animate-fade-in">
      <div className="flex gap-6">
        <div className="w-72 shrink-0">
          <MatchFilter
            type={type} location={location} crafts={crafts} quantity={quantity}
            deadline={deadline} budgetRange={budgetRange} weights={matchWeights}
            onTypeChange={setType} onLocationChange={setLocation}
            onCraftsChange={setCrafts} onQuantityChange={setQuantity}
            onDeadlineChange={setDeadline} onBudgetChange={setBudgetRange}
            onWeightsChange={(w: MatchWeights) => setMatchWeights(w)}
            onMatch={handleMatch}
          />
        </div>
        <div className="flex-1">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'results' ? 'bg-navy-700 text-white' : 'bg-white text-navy-500 hover:bg-navy-50'
              }`}
            >
              匹配结果
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'bom' ? 'bg-navy-700 text-white' : 'bg-white text-navy-500 hover:bg-navy-50'
              }`}
            >
              BOM比价
            </button>
          </div>
          {activeTab === 'results' ? (
            <MatchResults results={matchResults} />
          ) : (
            <BomCompare />
          )}
        </div>
      </div>
    </div>
  )
}
