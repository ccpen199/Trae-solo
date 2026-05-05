import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Modal,
  Form,
  Select,
  Switch,
  Tag,
  Divider,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { createCrudService, ListParams } from '../../api/crud'

interface ColumnConfig {
  title: string
  dataIndex: string
  key?: string
  width?: number
  type?: 'text' | 'select' | 'switch' | 'date' | 'datetime' | 'status' | 'tag'
  required?: boolean
  hidden?: boolean
  render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode
  options?: { label: string; value: string | number }[]
  statusMap?: { [key: number]: { text: string; color: string } }
}

interface CrudListProps {
  title: string
  apiPath: string
  columns: ColumnConfig[]
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showToggle?: boolean
  formWidth?: number
  extraActions?: (record: Record<string, unknown>) => React.ReactNode
  onBeforeCreate?: (values: Record<string, unknown>) => Record<string, unknown>
  onBeforeUpdate?: (values: Record<string, unknown>, record: Record<string, unknown>) => Record<string, unknown>
}

const CrudList: React.FC<CrudListProps> = ({
  title,
  apiPath,
  columns,
  showView = true,
  showEdit = true,
  showDelete = true,
  showToggle = false,
  formWidth = 640,
  extraActions,
  onBeforeCreate,
  onBeforeUpdate,
}) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const [form] = Form.useForm()
  const [viewForm] = Form.useForm()
  const service = createCrudService(apiPath)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: ListParams = {
        page,
        pageSize,
      }
      if (keyword) {
        params.keyword = keyword
      }
      const result = await service.list<Record<string, unknown>>(params)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch data failed:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, apiPath])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setKeyword('')
    setPage(1)
  }

  const handleCreate = () => {
    form.resetFields()
    setCurrentRecord(null)
    setCreateModalOpen(true)
  }

  const handleEdit = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    form.setFieldsValue(record)
    setEditModalOpen(true)
  }

  const handleView = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    viewForm.setFieldsValue(record)
    setViewModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await service.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleToggleStatus = async (record: Record<string, unknown>, newStatus: number) => {
    try {
      await service.toggleStatus({
        id: record.id as string,
        status: newStatus,
      })
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      console.error('Toggle status failed:', error)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据')
      return
    }
    try {
      await service.batchDelete({ ids: selectedRowKeys as string[] })
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`)
      setSelectedRowKeys([])
      fetchData()
    } catch (error) {
      console.error('Batch delete failed:', error)
    }
  }

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields()
      const finalValues = onBeforeCreate ? onBeforeCreate(values) : values
      await service.create(finalValues)
      message.success('创建成功')
      setCreateModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Create failed:', error)
    }
  }

  const handleEditSubmit = async () => {
    if (!currentRecord) return
    try {
      const values = await form.validateFields()
      const finalValues = onBeforeUpdate ? onBeforeUpdate(values, currentRecord) : values
      await service.update(currentRecord.id as string, finalValues)
      message.success('更新成功')
      setEditModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  const renderFormItem = (column: ColumnConfig, isView = false) => {
    if (column.hidden && !isView) return null

    const rules = column.required ? [{ required: true, message: `请输入${column.title}` }] : []

    let component: React.ReactNode

    switch (column.type) {
      case 'select':
        component = isView ? (
          <span>
            {column.options?.find((o) => o.value === viewForm.getFieldValue(column.dataIndex))?.label || '-'}
          </span>
        ) : (
          <Select placeholder={`请选择${column.title}`} options={column.options} allowClear />
        )
        break
      case 'switch':
        component = isView ? (
          <span>{form.getFieldValue(column.dataIndex) ? '启用' : '禁用'}</span>
        ) : (
          <Switch />
        )
        break
      case 'status':
        component = isView ? (
          <span>{column.statusMap?.[form.getFieldValue(column.dataIndex)]?.text || '-'}</span>
        ) : (
          <Select
            placeholder={`请选择${column.title}`}
            options={
              column.statusMap
                ? Object.entries(column.statusMap).map(([key, val]) => ({
                    label: val.text,
                    value: Number(key),
                  }))
                : []
            }
            allowClear
          />
        )
        break
      default:
        component = isView ? (
          <span>{viewForm.getFieldValue(column.dataIndex) || '-'}</span>
        ) : (
          <Input placeholder={`请输入${column.title}`} />
        )
    }

    return (
      <Form.Item
        key={column.dataIndex}
        name={column.dataIndex}
        label={column.title}
        rules={rules}
        valuePropName={column.type === 'switch' ? 'checked' : 'value'}
      >
        {component}
      </Form.Item>
    )
  }

  const tableColumns = [
    ...columns.filter((c) => !c.hidden).map((column) => {
      const baseColumn = {
        title: column.title,
        dataIndex: column.dataIndex,
        key: column.key || column.dataIndex,
        width: column.width,
      }

      if (column.type === 'switch' || column.type === 'status') {
        return {
          ...baseColumn,
          render: (value: number, record: Record<string, unknown>) => {
            if (column.type === 'switch') {
              return showToggle ? (
                <Switch
                  checked={value === 1}
                  onChange={(checked) => handleToggleStatus(record, checked ? 1 : 0)}
                />
              ) : (
                <Tag color={value === 1 ? 'green' : 'red'}>{value === 1 ? '启用' : '禁用'}</Tag>
              )
            }
            if (column.statusMap) {
              const statusInfo = column.statusMap[value]
              return statusInfo ? (
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              ) : (
                <span>{value}</span>
              )
            }
            return <span>{value}</span>
          },
        }
      }

      if (column.render) {
        return {
          ...baseColumn,
          render: column.render,
        }
      }

      return baseColumn
    }),
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size="small">
          {showView && (
            <Tooltip title="查看">
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
            </Tooltip>
          )}
          {showEdit && (
            <Tooltip title="编辑">
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {extraActions && extraActions(record)}
          {showDelete && (
            <Popconfirm title="确定要删除这条记录吗？" onConfirm={() => handleDelete(record.id as string)}>
              <Tooltip title="删除">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <Card
      title={title}
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增
          </Button>
          {showDelete && selectedRowKeys.length > 0 && (
            <Popconfirm title="确定要批量删除选中的记录吗？" onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>
                批量删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <div className="search-form">
        <Space>
          <Input
            placeholder="请输入关键词搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </div>

      <Divider />

      <Table
        rowKey="id"
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        rowSelection={showDelete ? rowSelection : undefined}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="新增"
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalOpen(false)}
        width={formWidth}
      >
        <Form form={form} layout="vertical">
          {columns.map((column) => renderFormItem(column))}
        </Form>
      </Modal>

      <Modal
        title="编辑"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        width={formWidth}
      >
        <Form form={form} layout="vertical">
          {columns.map((column) => renderFormItem(column))}
        </Form>
      </Modal>

      <Modal
        title="查看详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={formWidth}
      >
        <Form form={viewForm} layout="vertical">
          {columns.map((column) => (
            <Form.Item key={column.dataIndex} label={column.title}>
              {renderFormItem({ ...column, hidden: false }, true)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Card>
  )
}

export default CrudList
