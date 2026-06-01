import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Descriptions, Tag, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { documentAPI } from '../utils/api'
import dayjs from 'dayjs'

function DocumentDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocument()
  }, [id])

  const loadDocument = async () => {
    try {
      const response = await documentAPI.get(id)
      setDocument(response.data)
    } catch (error) {
      message.error('加载文档失败')
    } finally {
      setLoading(false)
    }
  }

  if (!document) return null

  const statusMap = {
    pending: { color: 'default', text: '待审核' },
    approved: { color: 'success', text: '已发布' },
    rejected: { color: 'error', text: '已拒绝' }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>
          返回列表
        </Button>
      </div>

      <Card title={document.title} loading={loading}>
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="分类">{document.category}</Descriptions.Item>
          <Descriptions.Item label="版本">{document.version}</Descriptions.Item>
          <Descriptions.Item label="权限范围">
            {document.permission_scope === 'public' ? <Tag color="green">公开</Tag> : <Tag color="orange">内部</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[document.status]?.color || 'default'}>
              {statusMap[document.status]?.text || document.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(document.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{document.updated_at ? dayjs(document.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        </Descriptions>

        <div>
          <h3 style={{ marginBottom: 16 }}>文档内容</h3>
          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
            {document.content}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DocumentDetail
