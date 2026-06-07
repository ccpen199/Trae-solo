import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, message, Row, Col, Alert, Descriptions, Divider, Tabs } from 'antd'
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, HistoryOutlined, AlertOutlined } from '@ant-design/icons'
import { getTemplates, generateDocument, getDocuments, validateDocument } from '../api.js'
import dayjs from 'dayjs'

const DocumentLibrary = () => {
  const [templates, setTemplates] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [genModal, setGenModal] = useState(false)
  const [form] = Form.useForm()
  const [genResult, setGenResult] = useState(null)
  const [activeTab, setActiveTab] = useState('templates')
  const [docDetail, setDocDetail] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, dRes] = await Promise.all([getTemplates(), getDocuments()])
      setTemplates(tRes.data)
      setDocuments(dRes.data)
    } catch (e) {
      console.error('Document load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleGenerate = async (values) => {
    try {
      const res = await generateDocument({
        template_id: values.template_id,
        consultation_id: values.consultation_id || 1,
        data: {}
      })
      setGenResult(res.data)
      message.success('文书生成完成，格式规范校验与条款冲突检测已执行')
      load()
    } catch (e) {
      message.error('生成失败')
    }
  }

  const validateCurrent = async () => {
    if (!genResult) return
    try {
      const res = await validateDocument({ content: genResult.content, type: genResult.templateType })
      message.info(`格式得分：${res.data.formatValidation.score}分，冲突检测：${res.data.conflictDetection.hasConflict ? '存在风险' : '通过'}`)
    } catch (e) {
      message.error('校验失败')
    }
  }

  const typeLabels = { complaint: '起诉状', answer: '答辩状', contract: '委托合同', motion: '申请书' }
  const typeColors = { complaint: 'red', answer: 'blue', contract: 'green', motion: 'purple' }

  const tplCols = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '模板名称', dataIndex: 'name' },
    {
      title: '类型', dataIndex: 'type', width: 100,
      render: v => <Tag color={typeColors[v] || 'blue'}>{typeLabels[v] || v}</Tag>
    },
    {
      title: '版本', dataIndex: 'version', width: 80,
      render: v => <Tag color="geekblue">v{v}</Tag>
    },
    {
      title: '地域适配', dataIndex: 'region_tag', width: 100,
      render: v => v ? <Tag color="cyan">{v}</Tag> : <Tag>通用</Tag>
    },
    {
      title: '引用条款', dataIndex: 'clause_references', width: 200,
      render: v => v ? <Tag icon={<FileTextOutlined />}>{v}</Tag> : '-'
    },
    { title: '更新时间', dataIndex: 'created_at', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', width: 100,
      render: (_, r) => (
        <Button size="small" type="primary" icon={<PlusOutlined />}
          onClick={() => { form.setFieldsValue({ template_id: r.id }); setGenModal(true) }}>
          生成文书
        </Button>
      )
    }
  ]

  const docCols = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '模板', dataIndex: 'template_name' },
    {
      title: '格式校验', dataIndex: 'format_validation', width: 120,
      render: v => {
        const d = typeof v === 'string' ? JSON.parse(v || '{}') : v || {}
        return d.score !== undefined
          ? <Tag color={d.score >= 80 ? 'green' : d.score >= 60 ? 'orange' : 'red'}
              icon={d.score >= 80 ? <CheckCircleOutlined /> : <AlertOutlined />}>
              得分 {d.score}
            </Tag>
          : '-'
      }
    },
    {
      title: '冲突检测', dataIndex: 'conflict_detection', width: 120,
      render: v => {
        const d = typeof v === 'string' ? JSON.parse(v || '{}') : v || {}
        return d.hasConflict
          ? <Tag color="red" icon={<CloseCircleOutlined />}>存在风险</Tag>
          : <Tag color="green" icon={<CheckCircleOutlined />}>通过</Tag>
      }
    },
    { title: '创建时间', dataIndex: 'created_at', width: 140, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', width: 80,
      render: (_, r) => <Button size="small" icon={<FileTextOutlined />} onClick={() => setDocDetail(r)}>查看</Button>
    }
  ]

  return (
    <div>
      <Card
        title="📚 法律文书库"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenModal(true)}>生成文书</Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'templates',
            label: '📄 文书模板（版本控制+地域适配）',
            children: (
              <Table loading={loading} columns={tplCols} dataSource={templates} rowKey="id" pagination={{ pageSize: 10 }} />
            )
          },
          {
            key: 'documents',
            label: '📝 已生成文书（校验+溯源）',
            children: (
              <Table loading={loading} columns={docCols} dataSource={documents} rowKey="id" pagination={{ pageSize: 10 }} />
            )
          }
        ]} />
      </Card>

      <Modal
        title="📝 生成法律文书"
        open={genModal}
        onCancel={() => { setGenModal(false); setGenResult(null) }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {!genResult ? (
          <Form form={form} layout="vertical" onFinish={handleGenerate}>
            <Form.Item name="template_id" label="选择文书模板" rules={[{ required: true, message: '请选择模板' }]}>
              <Select placeholder="请选择文书模板">
                {templates.map(t => (
                  <Select.Option key={t.id} value={t.id}>
                    {t.name} (v{t.version}) - {t.region_tag || '通用'} - {t.clause_references || '无引用'}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="consultation_id" label="关联咨询ID" initialValue={1}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="输入关联的咨询ID" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">生成文书并执行校验</Button>
            </Form.Item>
          </Form>
        ) : (
          <div>
            <Row gutter={16}>
              <Col span={14}>
                <Card title={`${genResult.templateName} - 生成结果`} size="small">
                  <Alert
                    message={`格式规范校验得分: ${genResult.formatValidation.score}分`}
                    description={genResult.formatValidation.valid ? '所有必需章节已包含，符合法院文书格式规范' : `缺失章节: ${genResult.formatValidation.missingSections?.join(', ')}`}
                    type={genResult.formatValidation.valid ? 'success' : 'warning'}
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Alert
                    message={`条款冲突检测: ${genResult.conflictDetection.riskLevel === 'low' ? '通过' : '存在风险'}`}
                    description={genResult.conflictDetection.conflicts?.map((c, i) => <div key={i}>⚠️ {c.clauseA} ↔ {c.clauseB}</div>) || '未检测到冲突条款，文书内容合规'}
                    type={genResult.conflictDetection.hasConflict ? 'error' : 'success'}
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="引用法条">{genResult.clauseReferences}</Descriptions.Item>
                    <Descriptions.Item label="地域适配">{genResult.regionTag || '通用'}</Descriptions.Item>
                  </Descriptions>
                  <Divider />
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#fafafa', padding: 16, maxHeight: 300, overflow: 'auto' }}>
                    {genResult.content}
                  </pre>
                </Card>
              </Col>
              <Col span={10}>
                <Card title="智能校验操作" size="small">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button block onClick={validateCurrent} icon={<CheckCircleOutlined />}>重新校验格式</Button>
                    <Button block type="primary" onClick={() => { setGenModal(false); setGenResult(null); load() }}>完成</Button>
                    <Button block onClick={() => setGenResult(null)}>重新生成</Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      <Modal
        title="📄 文书详情"
        open={!!docDetail}
        onCancel={() => setDocDetail(null)}
        footer={<Button onClick={() => setDocDetail(null)}>关闭</Button>}
        width={700}
      >
        {docDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="文书ID">#{docDetail.id}</Descriptions.Item>
            <Descriptions.Item label="模板">{docDetail.template_name}</Descriptions.Item>
            <Descriptions.Item label="格式校验">
              {(() => {
                const d = typeof docDetail.format_validation === 'string' ? JSON.parse(docDetail.format_validation || '{}') : docDetail.format_validation || {}
                return d.score !== undefined
                  ? <Tag color={d.score >= 80 ? 'green' : 'orange'}>得分 {d.score}/100</Tag>
                  : '-'
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="冲突检测">
              {(() => {
                const d = typeof docDetail.conflict_detection === 'string' ? JSON.parse(docDetail.conflict_detection || '{}') : docDetail.conflict_detection || {}
                return d.hasConflict
                  ? <Tag color="red">存在风险</Tag>
                  : <Tag color="green">通过</Tag>
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(docDetail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="文书内容">
              <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 11, background: '#fafafa', padding: 8, margin: 0, whiteSpace: 'pre-wrap' }}>
                {docDetail.content}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default DocumentLibrary
