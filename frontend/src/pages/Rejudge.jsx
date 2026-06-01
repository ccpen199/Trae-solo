import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Radio, message, Descriptions } from 'antd'
import { CheckOutlined, CloseOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { api } from '../utils/api'

function Rejudge() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [rejudgeResult, setRejudgeResult] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getDefectRecords({ page: 1, pageSize: 100 })
      setRecords(data.records.filter(r => r.result === 'pending'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickRejudge = async (record, result) => {
    setRecords(prev => prev.filter(r => r.id !== record.id))
    try {
      await api.rejudgeDefect(record.id, { rejudge_result: result, rejudged_by: '当前用户' })
      message.success('复判完成')
    } catch (e) {
      message.error('复判失败')
      loadData()
    }
  }

  const handleViewDetail = (record) => {
    setCurrentRecord(record)
    setRejudgeResult('')
    setDetailVisible(true)
  }

  const handleSubmitRejudge = async () => {
    setRecords(prev => prev.filter(r => r.id !== currentRecord.id))
    try {
      await api.rejudgeDefect(currentRecord.id, { rejudge_result: rejudgeResult, rejudged_by: '当前用户' })
      message.success('复判完成')
      setDetailVisible(false)
    } catch (e) {
      message.error('复判失败')
      loadData()
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '缺陷类型', dataIndex: 'defect_type', key: 'defect_type' },
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', render: v => (v * 100).toFixed(1) + '%' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '检测任务', dataIndex: 'task_name', key: 'task_name' },
    { title: '模型版本', dataIndex: 'model_version', key: 'model_version' },
    { title: '检测时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleQuickRejudge(r, 'defect')}>
            确认缺陷
          </Button>
          <Button size="small" icon={<CloseOutlined />} onClick={() => handleQuickRejudge(r, 'false_positive')}>
            误检
          </Button>
          <Button size="small" danger icon={<ExclamationCircleOutlined />} onClick={() => handleQuickRejudge(r, 'missed')}>
            漏检
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>人工复判</h2>
      <p style={{ marginBottom: 16, color: '#666' }}>待复判记录: {records.length} 条</p>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="缺陷详情与复判"
        open={detailVisible}
        onOk={handleSubmitRejudge}
        onCancel={() => setDetailVisible(false)}
        okButtonProps={{ disabled: !rejudgeResult }}
        okText="确认复判"
        width={600}
      >
        {currentRecord && (
          <div>
            <div className="image-placeholder" style={{ marginBottom: 16 }}>
              缺陷图片预览
            </div>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="缺陷类型">{currentRecord.defect_type}</Descriptions.Item>
              <Descriptions.Item label="置信度">{(currentRecord.confidence * 100).toFixed(1)}%</Descriptions.Item>
              <Descriptions.Item label="批次号">{currentRecord.batch_no}</Descriptions.Item>
              <Descriptions.Item label="工单号">{currentRecord.work_order}</Descriptions.Item>
              <Descriptions.Item label="位置">{`(${currentRecord.position_x?.toFixed(0) || 0}, ${currentRecord.position_y?.toFixed(0) || 0})`}</Descriptions.Item>
              <Descriptions.Item label="检测时间">{currentRecord.created_at}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <h4 style={{ marginBottom: 12 }}>复判结果（如需要补充标记）：</h4>
              <Radio.Group value={rejudgeResult} onChange={e => setRejudgeResult(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="defect">确认缺陷 - 模型判断正确</Radio>
                  <Radio value="false_positive">误检 - 实际无缺陷</Radio>
                  <Radio value="missed">漏检 - 实际有缺陷但未检出</Radio>
                </Space>
              </Radio.Group>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Rejudge
