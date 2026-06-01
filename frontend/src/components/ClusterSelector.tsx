import { useEffect, useRef } from 'react'
import { Select, Spin, message } from 'antd'
import { useAppStore } from '../store'
import * as clustersApi from '../api/clusters'

export default function ClusterSelector() {
  const { clusters, currentCluster, setClusters, setCurrentCluster } = useAppStore()
  const loadedRef = useRef(false)
  const loading = clusters.length === 0 && !loadedRef.current

  useEffect(() => {
    if (loadedRef.current) return
    clustersApi
      .listClusters()
      .then((data) => {
        loadedRef.current = true
        setClusters(data)
        if (data.length > 0) {
          setCurrentCluster(data[0])
        }
      })
      .catch((err) => {
        loadedRef.current = true
        message.error(err.message || '加载集群列表失败')
      })
  }, [setClusters, setCurrentCluster])

  return (
    <Spin spinning={loading} size="small">
      <Select
        style={{ width: 200 }}
        value={currentCluster?.id}
        onChange={(id) => {
          const c = clusters.find((x) => x.id === id)
          if (c) setCurrentCluster(c)
        }}
        placeholder="请选择集群"
        options={clusters.map((c) => ({ label: c.name, value: c.id }))}
      />
    </Spin>
  )
}
