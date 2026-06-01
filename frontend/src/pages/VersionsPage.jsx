import React, { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col, Descriptions, Drawer,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DiffOutlined, EyeOutlined } from '@ant-design/icons'
import { versionsApi } from '../api.js'
import dayjs from 'dayjs'

const ENV_OPTIONS = ['dev', 'staging', 'prod']
const STATUS_COLORS = { pending: 'default', active: 'green', archived: 'orange' }

export default function VersionsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareResult, setCompareResult] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await versionsApi.list()
      setData(res)
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await versionsApi.update(editing.id, values)
        message.success('更新成功')
      } else {
        await versionsApi.create(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await versionsApi.remove(id)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleCompare = async () => {
    if (compareIds.length !== 2) {
      message.warning('请选择两个版本进行对比')
      return
    }
    try {
      const res = await versionsApi.compare(compareIds[0], compareIds[1])
      setCompareResult(res)
      setCompareOpen(true)
    } catch (e) {
      message.error(e.message)
    }
  }

  const showDetail = (record) => {
    setDetail(record)
    setDetailOpen(true)
  }

  const columns = [
    { title: '构建号', dataIndex: 'build_number', key: 'build_number', width: 120 },
    { title: 'Git提交', dataIndex: 'git_commit', key: 'git_commit', width: 160, ellipsis: true },
    { title: '环境', dataIndex: 'environment', key: 'environment', width: 80, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '发布说明', dataIndex: 'release_notes', key: 'release_notes', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => showDetail(r)}
            style={{ fontWeight: 600 }}
          >
            <EyeOutlined /> 详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys: compareIds,
    onChange: (keys) => setCompareIds(keys),
    preserveSelectedRowKeys: true,
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建版本</Button>
        <Button icon={<DiffOutlined />} onClick={handleCompare} disabled={compareIds.length !== 2}>
          对比选中 ({compareIds.length})
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        rowSelection={rowSelection}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editing ? '编辑版本' : '新建版本'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="build_number" label="构建号" rules={[{ required: true }]}>
            <Input placeholder="例如: v2.3.1" />
          </Form.Item>
          <Form.Item name="git_commit" label="Git提交" rules={[{ required: true }]}>
            <Input placeholder="Git commit hash" />
          </Form.Item>
          <Form.Item name="environment" label="环境" rules={[{ required: true }]}>
            <Select options={ENV_OPTIONS.map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="release_notes" label="发布说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="static_resource_url" label="静态资源地址">
            <Input placeholder="CDN地址" />
          </Form.Item>
          <Form.Item name="backend_dependency_version" label="后端依赖版本">
            <Input placeholder="后端服务版本号" />
          </Form.Item>
          <Form.Item name="created_by" label="创建者" initialValue="system">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="pending">
            <Select options={[
              { value: 'pending', label: '待发布' },
              { value: 'active', label: '活跃中' },
              { value: 'archived', label: '已归档' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
      <Drawer title="版本详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={500}>
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="构建号">{detail.build_number}</Descriptions.Item>
            <Descriptions.Item label="Git提交">{detail.git_commit}</Descriptions.Item>
            <Descriptions.Item label="环境">{detail.environment}</Descriptions.Item>
            <Descriptions.Item label="发布说明">{detail.release_notes || '-'}</Descriptions.Item>
            <Descriptions.Item label="静态资源地址">{detail.static_resource_url || '-'}</Descriptions.Item>
            <Descriptions.Item label="后端依赖版本">{detail.backend_dependency_version || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{detail.status}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="创建者">{detail.created_by}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
      <Drawer title="版本对比" open={compareOpen} onClose={() => setCompareOpen(false)} width={700}>
        {compareResult && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <strong>版本 A: {compareResult.v1.build_number}</strong>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <strong>版本 B: {compareResult.v2.build_number}</strong>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <h4>差异字段</h4>
              {Object.keys(compareResult.diff).length === 0 ? (
                <p>两个版本完全一致</p>
              ) : (
                Object.entries(compareResult.diff).map(([key, val]) => (
                  <div key={key} className="version-diff" style={{ marginBottom: 8 }}>
                    <div><strong>{key}</strong></div>
                    <Row gutter={8}>
                      <Col span={12}><Tag color="red">A: {String(val.v1)}</Tag></Col>
                      <Col span={12}><Tag color="green">B: {String(val.v2)}</Tag></Col>
                    </Row>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}