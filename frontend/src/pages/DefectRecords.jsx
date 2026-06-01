import React, { useState, useEffect } from 'react'
import { Table, Input, Select, Button, Space, Tag, Modal, Descriptions, message } from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { api } from '../utils/api'

const { Option } = Select

function DefectRecords() {
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [batchNo, setBatchNo] = useState('')
  const [defectType, setDefectType] = useState('')

  useEffect(() => {
    loadData()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (batchNo) params.batch_no = batchNo
      if (defectType) params.defect_type = defectType
      const data = await api.getDefectRecords(params)
      setRecords(data.records)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  const handleViewDetail = async (record) => {
    const detail = await api.getDefectRecord(record.id)
    setCurrentRecord(detail)
    setDetailVisible(true)
  }

  const handleAddDemo = async () => {
    try {
      await api.createDefectRecord({
        task_id: 1,
        defect_type: 'solder_joint',
        confidence: 0.92,
        position_x: 100,
        position_y: 150,
        position_w: 50,
        position_h: 30,
        batch_no: 'BATCH-' + Date.now().toString().slice(-6),
        work_order: 'WO-2024-001',
        model_version_id: 2,
      })
      message.success('已添加演示数据')
      loadData()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const getResultTag = (result) => {
    const config = {
      pending: { color: 'blue', text: '待复判' },
      defect: { color: 'red', text: '确认缺陷' },
      false_positive: { color: 'orange', text: '误检' },
      missed: { color: 'purple', text: '漏检' },
    }
    const { color, text } = config[result] || { color: 'default', text: result }
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '缺陷类型', dataIndex: 'defect_type', key: 'defect_type' },
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', render: v => (v * 100).toFixed(1) + '%' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '工单号', dataIndex: 'work_order', key: 'work_order' },
    { title: '检测任务', dataIndex: 'task_name', key: 'task_name' },
    { title: '模型版本', dataIndex: 'model_version', key: 'model_version' },
    { title: '判定结果', dataIndex: 'result', key: 'result', render: v => getResultTag(v) },
    { title: '检测时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>缺陷记录</h2>
        <Space>
          <Button icon={<PlusOutlined />} onClick={handleAddDemo}>添加演示数据</Button>
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="批次号"
          value={batchNo}
          onChange={e => setBatchNo(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="缺陷类型"
          value={defectType || undefined}
          onChange={setDefectType}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="solder_joint">焊点缺陷</Option>
          <Option value="scratch">划痕</Option>
          <Option value="foreign_material">异物</Option>
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />

      <Modal
        title="缺陷详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentRecord && (
          <div>
            <div className="image-placeholder">
              缺陷图片占位 (实际项目中显示检测图片)
            </div>
            <Descriptions column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="缺陷类型">{currentRecord.defect_type}</Descriptions.Item>
              <Descriptions.Item label="置信度">{(currentRecord.confidence * 100).toFixed(1)}%</Descriptions.Item>
              <Descriptions.Item label="批次号">{currentRecord.batch_no}</Descriptions.Item>
              <Descriptions.Item label="工单号">{currentRecord.work_order}</Descriptions.Item>
              <Descriptions.Item label="位置">{`(${currentRecord.position_x}, ${currentRecord.position_y})`}</Descriptions.Item>
              <Descriptions.Item label="尺寸">{`${currentRecord.position_w}x${currentRecord.position_h}`}</Descriptions.Item>
              <Descriptions.Item label="模型版本">{currentRecord.model_name} {currentRecord.model_version}</Descriptions.Item>
              <Descriptions.Item label="判定结果">{getResultTag(currentRecord.result)}</Descriptions.Item>
              <Descriptions.Item label="检测时间">{currentRecord.created_at}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DefectRecords
