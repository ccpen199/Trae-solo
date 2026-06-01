import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Typography, List, InputNumber, Divider } from 'antd'
import { PlusOutlined, EditOutlined, CheckOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { treatmentPlanAPI, masterAPI, patientAPI } from '../api'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const TreatmentPlans: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [currentDetail, setCurrentDetail] = useState<any>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [planItems, setPlanItems] = useState<any[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [planRes, docRes, patientRes, treatRes] = await Promise.all([
        treatmentPlanAPI.list(),
        masterAPI.doctors(),
        patientAPI.list({ pageSize: 100 }),
        masterAPI.treatments(),
      ])
      setList(planRes.data || [])
      setDoctors(docRes.data)
      setPatients(patientRes.data.list || [])
      setTreatments(treatRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setCurrentItem(null)
    setPlanItems([])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    setPlanItems(record.items || [])
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleView = async (id: number) => {
    try {
      const res = await treatmentPlanAPI.get(id)
      setCurrentDetail(res.data)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  const handleConfirm = async (id: number) => {
    try {
      await treatmentPlanAPI.confirm(id)
      message.success('治疗计划已确认，收费单已生成')
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const addPlanItem = () => {
    setPlanItems([...planItems, { treatment_id: '', tooth_position: '', phase: 1, price: 0, quantity: 1 }])
  }

  const removePlanItem = (index: number) => {
    setPlanItems(planItems.filter((_, i) => i !== index))
  }

  const updatePlanItem = (index: number, field: string, value: any) => {
    const newItems = [...planItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'treatment_id') {
      const treatment = treatments.find((t) => t.id === value)
      if (treatment) {
        newItems[index].price = treatment.price
      }
    }
    setPlanItems(newItems)
  }

  const handleSubmit = async (values: any) => {
    if (planItems.length === 0) {
      message.error('请至少添加一个治疗项目')
      return
    }

    const data = {
      ...values,
      items: planItems.filter((item) => item.treatment_id),
    }

    try {
      if (currentItem) {
        await treatmentPlanAPI.update(currentItem.id, data)
        message.success('更新成功')
      } else {
        await treatmentPlanAPI.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const getStatusTag = (status: string, confirmed: boolean) => {
    if (confirmed) return <Tag color="green">患者已确认</Tag>
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      confirmed: { color: 'green', text: '已确认' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const totalPrice = planItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)

  const columns = [
    { title: '计划名称', dataIndex: 'name', key: 'name' },
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '医生', dataIndex: 'doctor_name', key: 'doctor_name' },
    { title: '总金额', dataIndex: 'total_price', key: 'total_price', render: (v: number) => `¥${v}` },
    { title: '状态', key: 'status', render: (_: any, r: any) => getStatusTag(r.status, r.patient_confirmed) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>详情</Button>
          {record.status === 'draft' && (
            <>
              <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
              <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>确认</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>治疗计划</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建计划
        </Button>
      </div>

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
      />

      <Modal
        title={currentItem ? '编辑治疗计划' : '新建治疗计划'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="计划名称" rules={[{ required: true }]}>
            <Input placeholder="例如：种植牙治疗方案" />
          </Form.Item>
          <Form.Item name="patient_id" label="患者" rules={[{ required: true }]}>
            <Select placeholder="选择患者">
              {patients.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="doctor_id" label="主治医生" rules={[{ required: true }]}>
            <Select placeholder="选择医生">
              {doctors.map((d) => <Option key={d.id} value={d.id}>{d.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="doctor_opinion" label="医生意见">
            <TextArea rows={2} />
          </Form.Item>

          <Divider>治疗项目</Divider>
          <List
            size="small"
            dataSource={planItems}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removePlanItem(index)} />,
                ]}
              >
                <Space style={{ width: '100%' }} wrap>
                  <Select
                    style={{ width: 150 }}
                    value={item.treatment_id || undefined}
                    placeholder="选择项目"
                    onChange={(v) => updatePlanItem(index, 'treatment_id', v)}
                  >
                    {treatments.map((t) => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                  </Select>
                  <Input
                    style={{ width: 80 }}
                    placeholder="牙位"
                    value={item.tooth_position}
                    onChange={(e) => updatePlanItem(index, 'tooth_position', e.target.value)}
                  />
                  <InputNumber
                    style={{ width: 80 }}
                    placeholder="阶段"
                    min={1}
                    value={item.phase}
                    onChange={(v) => updatePlanItem(index, 'phase', v)}
                  />
                  <InputNumber
                    style={{ width: 100 }}
                    placeholder="单价"
                    min={0}
                    value={item.price}
                    onChange={(v) => updatePlanItem(index, 'price', v)}
                    prefix="¥"
                  />
                  <InputNumber
                    style={{ width: 80 }}
                    placeholder="数量"
                    min={1}
                    value={item.quantity}
                    onChange={(v) => updatePlanItem(index, 'quantity', v)}
                  />
                </Space>
              </List.Item>
            )}
          />
          <Button type="dashed" block onClick={addPlanItem} style={{ marginTop: 8 }}>
            <PlusOutlined /> 添加项目
          </Button>
          <div style={{ textAlign: 'right', marginTop: 16, fontSize: 16, fontWeight: 'bold' }}>
            总计：¥{totalPrice}
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="治疗计划详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentDetail && (
          <div>
            <p><strong>计划名称：</strong>{currentDetail.name}</p>
            <p><strong>患者：</strong>{currentDetail.patient_name}</p>
            <p><strong>医生：</strong>{currentDetail.doctor_name}</p>
            <p><strong>医生意见：</strong>{currentDetail.doctor_opinion || '无'}</p>
            <p><strong>总金额：</strong>¥{currentDetail.total_price}</p>
            <Divider>治疗项目</Divider>
            <List
              dataSource={currentDetail.items || []}
              renderItem={(item: any) => (
                <List.Item>
                  <Space>
                    <span>{item.treatment_name}</span>
                    <Tag>牙位: {item.tooth_position || '-'}</Tag>
                    <Tag>阶段: {item.phase || '-'}</Tag>
                    <span>¥{item.price} × {item.quantity}</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TreatmentPlans
