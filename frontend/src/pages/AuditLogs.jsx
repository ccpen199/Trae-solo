import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Select, Space, Descriptions, Modal, Button, Input, DatePicker } from 'antd'
import { AuditOutlined, SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { getAuditLogs } from '../api.js'
import dayjs from 'dayjs'

const AuditLogs = () => {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [detail, setDetail] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getAuditLogs({ page, pageSize })
      setList(res.data.list)
      setTotal(res.data.total)
    } catch (e) {
      console.error('Audit load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, pageSize])

  const actionColors = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN: 'purple',
    VIEW: 'geekblue',
    EXPORT: 'orange'
  }

  const actionLabels = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    LOGIN: '登录',
    VIEW: '查看',
    EXPORT: '导出'
  }

  const entityLabels = {
    lawyer: '律师',
    consultation: '咨询',
    contract: '合约',
    document: '文书',
    system: '系统'
  }

  const filtered = list.filter(l => {
    if (actionFilter && l.action !== actionFilter) return false
    if (entityFilter && l.entity_type !== entityFilter) return false
    return true
  })

  const uniqueActions = [...new Set(list.map(l => l.action))]
  const uniqueEntities = [...new Set(list.map(l => l.entity_type).filter(Boolean))]

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '操作类型', dataIndex: 'action', width: 100,
      render: v => <Tag color={actionColors[v] || 'gray'}>{actionLabels[v] || v}</Tag>
    },
    {
      title: '实体类型', dataIndex: 'entity_type', width: 100,
      render: v => v ? <Tag color="blue">{entityLabels[v] || v}</Tag> : '-'
    },
    { title: '实体ID', dataIndex: 'entity_id', width: 80, render: v => v || '-' },
    { title: '操作人', dataIndex: 'operator', width: 100, render: v => v || 'system' },
    {
      title: 'IP地址', dataIndex: 'ip_address', width: 130,
      render: v => <code style={{ fontSize: 11 }}>{v}</code>
    },
    {
      title: '操作时间', dataIndex: 'created_at', width: 170,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作', width: 80,
      render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
    }
  ]

  return (
    <div>
      <Card
        title={<Space><AuditOutlined /> 合规审计日志追溯</Space>}
        extra={
          <Space>
            <Select
              placeholder="操作类型"
              style={{ width: 130 }}
              allowClear
              value={actionFilter || undefined}
              onChange={setActionFilter}
            >
              {uniqueActions.map(a => <Select.Option key={a} value={a}>{actionLabels[a] || a}</Select.Option>)}
            </Select>
            <Select
              placeholder="实体类型"
              style={{ width: 130 }}
              allowClear
              value={entityFilter || undefined}
              onChange={setEntityFilter}
            >
              {uniqueEntities.map(e => <Select.Option key={e} value={e}>{entityLabels[e] || e}</Select.Option>)}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条审计记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
        <div style={{ marginTop: 12, padding: 12, background: '#e6fffb', borderRadius: 6, fontSize: 12 }}>
          <b>合规说明：</b>所有操作均按照《个人信息保护法》最小必要原则记录，数据仅用于审计追溯，不支持删除或修改。
        </div>
      </Card>

      <Modal
        title="审计详情追溯"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={650}
      >
        {detail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="日志ID">#{detail.id}</Descriptions.Item>
            <Descriptions.Item label="操作类型">
              <Tag color={actionColors[detail.action] || 'gray'}>{actionLabels[detail.action] || detail.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="实体类型">{detail.entity_type ? <Tag color="blue">{entityLabels[detail.entity_type] || detail.entity_type}</Tag> : '-'}</Descriptions.Item>
            <Descriptions.Item label="实体ID">{detail.entity_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作人">{detail.operator || 'system'}</Descriptions.Item>
            <Descriptions.Item label="IP地址"><code>{detail.ip_address}</code></Descriptions.Item>
            <Descriptions.Item label="操作时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="详情数据">
              <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 11, background: '#f5f5f5', padding: 8, margin: 0, whiteSpace: 'pre-wrap' }}>
                {detail.details}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogs
