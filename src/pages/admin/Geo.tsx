import { useState, useEffect } from 'react'
import { Map as MapIcon, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { api } from '@/utils/api'
import type { GeoRegion } from '@/types'

interface TreeNode {
  code: string; name: string; level: 'province' | 'city' | 'district'; postCount: number; children: TreeNode[]; expanded?: boolean
}

const mockRegions: GeoRegion[] = [
  { code: '110000', name: '北京市', level: 'province', parentCode: null, postCount: 12580 },
  { code: '110100', name: '北京市', level: 'city', parentCode: '110000', postCount: 12580 },
  { code: '110105', name: '朝阳区', level: 'district', parentCode: '110100', postCount: 3420 },
  { code: '110106', name: '丰台区', level: 'district', parentCode: '110100', postCount: 2180 },
  { code: '110108', name: '海淀区', level: 'district', parentCode: '110100', postCount: 4560 },
  { code: '310000', name: '上海市', level: 'province', parentCode: null, postCount: 10890 },
  { code: '310100', name: '上海市', level: 'city', parentCode: '310000', postCount: 10890 },
  { code: '310101', name: '黄浦区', level: 'district', parentCode: '310100', postCount: 1890 },
  { code: '310104', name: '徐汇区', level: 'district', parentCode: '310100', postCount: 2340 },
  { code: '310115', name: '浦东新区', level: 'district', parentCode: '310100', postCount: 5120 },
  { code: '440000', name: '广东省', level: 'province', parentCode: null, postCount: 15230 },
  { code: '440100', name: '广州市', level: 'city', parentCode: '440000', postCount: 6780 },
  { code: '440103', name: '荔湾区', level: 'district', parentCode: '440100', postCount: 1230 },
  { code: '440304', name: '福田区', level: 'district', parentCode: '440300', postCount: 3450 },
  { code: '440300', name: '深圳市', level: 'city', parentCode: '440000', postCount: 8450 },
  { code: '440305', name: '南山区', level: 'district', parentCode: '440300', postCount: 4120 },
]

const mockHeatmap: GeoRegion[] = [
  { code: '110105', name: '朝阳', level: 'district', parentCode: '110100', postCount: 3420 },
  { code: '110106', name: '丰台', level: 'district', parentCode: '110100', postCount: 2180 },
  { code: '110108', name: '海淀', level: 'district', parentCode: '110100', postCount: 4560 },
  { code: '310101', name: '黄浦', level: 'district', parentCode: '310100', postCount: 1890 },
  { code: '310104', name: '徐汇', level: 'district', parentCode: '310100', postCount: 2340 },
  { code: '310115', name: '浦东', level: 'district', parentCode: '310100', postCount: 5120 },
  { code: '440103', name: '荔湾', level: 'district', parentCode: '440100', postCount: 1230 },
  { code: '440304', name: '福田', level: 'district', parentCode: '440300', postCount: 3450 },
  { code: '440305', name: '南山', level: 'district', parentCode: '440300', postCount: 4120 },
  { code: '330102', name: '上城', level: 'district', parentCode: '330100', postCount: 2780 },
  { code: '330106', name: '西湖', level: 'district', parentCode: '330100', postCount: 3150 },
  { code: '510104', name: '锦江', level: 'district', parentCode: '510100', postCount: 1980 },
]

function buildTree(regions: GeoRegion[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  regions.forEach(r => map.set(r.code, { code: r.code, name: r.name, level: r.level, postCount: r.postCount, children: [] }))
  const roots: TreeNode[] = []
  regions.forEach(r => {
    const node = map.get(r.code)!
    if (r.parentCode && map.has(r.parentCode)) {
      map.get(r.parentCode)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export default function Geo() {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [heatmapData, setHeatmapData] = useState<GeoRegion[]>([])
  const [hoverRegion, setHoverRegion] = useState<{ name: string; postCount: number } | null>(null)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [regionStats, setRegionStats] = useState<{ postCount: number; topCategories: { category: string; count: number }[] } | null>(null)
  const [selectedName, setSelectedName] = useState('')

  useEffect(() => {
    api.geo.regions().then(data => setTree(buildTree(data))).catch(() => setTree(buildTree(mockRegions)))
    api.geo.heatmap().then(setHeatmapData).catch(() => setHeatmapData(mockHeatmap))
  }, [])

  const toggleNode = (code: string) => {
    setExpanded(prev => { const next = new Set(prev); next.has(code) ? next.delete(code) : next.add(code); return next })
  }

  const selectRegion = (code: string, name: string) => {
    setSelectedCode(code)
    setSelectedName(name)
    api.geo.stats(code).then(setRegionStats).catch(() => {
      setRegionStats({ postCount: 3420, topCategories: [{ category: '房屋出租', count: 1200 }, { category: '求职招聘', count: 890 }, { category: '二手物品', count: 560 }] })
    })
  }

  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    if (!search) return nodes
    return nodes.reduce<TreeNode[]>((acc, n) => {
      const filteredChildren = filterTree(n.children)
      if (n.name.includes(search) || filteredChildren.length > 0) {
        acc.push({ ...n, children: filteredChildren })
      }
      return acc
    }, [])
  }

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded.has(node.code)
    const isSelected = selectedCode === node.code
    return (
      <div key={node.code}>
        <div className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-navy-50' : ''}`} style={{ paddingLeft: depth * 20 + 8 }} onClick={() => { if (hasChildren) toggleNode(node.code); selectRegion(node.code, node.name) }}>
          {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />) : <span className="w-4" />}
          <span className="text-sm flex-1">{node.name}</span>
          <span className="badge badge-info text-xs">{node.postCount}</span>
        </div>
        {isExpanded && node.children.map(c => renderNode(c, depth + 1))}
      </div>
    )
  }

  const heatMax = Math.max(...heatmapData.map(d => d.postCount), 1)
  const heatColor = (count: number) => {
    const ratio = count / heatMax
    if (ratio > 0.7) return 'bg-navy-800 text-white'
    if (ratio > 0.4) return 'bg-navy-500 text-white'
    return 'bg-navy-200 text-navy-800'
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapIcon className="w-8 h-8 text-navy-800" />
        <h1 className="text-2xl font-bold text-navy-800">地理围栏管理</h1>
      </div>

      <div className="flex gap-6">
        <div className="w-1/2 card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input className="input-field" placeholder="搜索地区..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <h2 className="font-semibold text-navy-800 mb-2">行政区划</h2>
          <div className="max-h-96 overflow-y-auto">
            {filterTree(tree).map(n => renderNode(n))}
          </div>
        </div>

        <div className="w-1/2 card p-4">
          <h2 className="font-semibold text-navy-800 mb-3">区域热力图</h2>
          <div className="grid grid-cols-4 gap-2">
            {heatmapData.map(r => (
              <div key={r.code} className={`${heatColor(r.postCount)} rounded-lg p-3 text-center cursor-pointer transition-transform hover:scale-105`} onMouseEnter={() => setHoverRegion({ name: r.name, postCount: r.postCount })} onMouseLeave={() => setHoverRegion(null)} onClick={() => selectRegion(r.code, r.name)}>
                <div className="text-xs font-medium">{r.name}</div>
                <div className="text-xs opacity-80 mt-1">{r.postCount}</div>
              </div>
            ))}
          </div>
          {hoverRegion && (
            <div className="mt-3 p-2 bg-slate-50 rounded-lg text-sm">
              <span className="font-medium">{hoverRegion.name}</span>：{hoverRegion.postCount} 条信息
            </div>
          )}
        </div>
      </div>

      {selectedCode && regionStats && (
        <div className="card p-4 mt-6">
          <h2 className="font-semibold text-navy-800 mb-3">{selectedName} - 区域统计</h2>
          <div className="mb-3">
            <span className="text-sm text-slate-500">信息总量：</span>
            <span className="text-xl font-bold text-navy-800 ml-2">{regionStats.postCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-sm text-slate-500">分类分布：</span>
            <div className="flex gap-3 mt-2">
              {regionStats.topCategories.map(c => (
                <div key={c.category} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">{c.category}</span>
                  <span className="text-sm text-accent-500 font-bold">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
