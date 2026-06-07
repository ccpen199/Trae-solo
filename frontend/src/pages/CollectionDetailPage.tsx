import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '../utils/api'
import ContentCard from '../components/ContentCard'

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [collection, setCollection] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/collections/${id}`),
      api.get(`/api/collections/${id}/contents`),
    ]).then(([colRes, contRes]) => {
      if (colRes.data.code === 0) {
        setCollection(colRes.data.data)
      }
      if (contRes.data.code === 0) {
        setContents(contRes.data.data.list || contRes.data.data || [])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!collection) {
    return <div className="text-center py-16 text-gray-400">收藏夹不存在</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/collections" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" />返回收藏夹列表
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{collection.name}</h1>
        {collection.description && <p className="text-gray-600 text-sm">{collection.description}</p>}
        <div className="text-xs text-gray-400 mt-1">{contents.length} 篇内容</div>
      </div>

      {contents.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">收藏夹暂无内容</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contents.map(content => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  )
}
