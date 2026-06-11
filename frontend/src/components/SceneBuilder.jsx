import React, { useState } from 'react'
import { Form, Input, Button, Select, Space, Card, message, Modal } from 'antd'
import {
  MenuOutlined,
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

const availableActions = [
  { key: 'light_off', label: '关闭灯光', type: 'light', icon: '💡' },
  { key: 'light_dim', label: '调暗灯光', type: 'light', icon: '🔅' },
  { key: 'light_bright', label: '调亮灯光', type: 'light', icon: '🔆' },
  { key: 'projector_on', label: '打开投影仪', type: 'projector', icon: '📽' },
  { key: 'projector_off', label: '关闭投影仪', type: 'projector', icon: '📽' },
  { key: 'tv_on', label: '打开电视', type: 'tv', icon: '📺' },
  { key: 'tv_off', label: '关闭电视', type: 'tv', icon: '📺' },
  { key: 'ac_on', label: '打开空调', type: 'ac', icon: '❄️' },
  { key: 'ac_off', label: '关闭空调', type: 'ac', icon: '☀️' },
  { key: 'ac_cool', label: '空调制冷模式', type: 'ac', icon: '❄️' },
  { key: 'ac_heat', label: '空调制热模式', type: 'ac', icon: '☀️' },
  { key: 'volume_up', label: '音量+', type: 'device', icon: '🔊' },
  { key: 'volume_down', label: '音量-', type: 'device', icon: '🔉' },
  { key: 'volume_mute', label: '静音', type: 'device', icon: '🔇' },
  { key: 'volume_set', label: '设置音量', type: 'device', icon: '🎚️' },
  { key: 'delay', label: '延迟执行', type: 'system', icon: '⏱️' }
]

function SceneBuilder({ scene, onSave, onCancel }) {
  const [form] = Form.useForm()
  const [actions, setActions] = useState(scene?.actions || [])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showAddAction, setShowAddAction] = useState(false)

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newActions = [...actions]
    const [removed] = newActions.splice(draggedIndex, 1)
    newActions.splice(index, 0, removed)
    setActions(newActions)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDraggedIndex(null)
  }

  const addAction = (actionKey) => {
    const actionTemplate = availableActions.find(a => a.key === actionKey)
    if (!actionTemplate) return

    const newAction = {
      id: Date.now().toString(),
      ...actionTemplate,
      params: actionTemplate.key === 'volume_set' ? { volume: 50 } : {},
      delay: 0
    }
    setActions([...actions, newAction])
    setShowAddAction(false)
    message.success(`已添加动作: ${actionTemplate.label}`)
  }

  const removeAction = (index) => {
    const newActions = actions.filter((_, i) => i !== index)
    setActions(newActions)
  }

  const updateActionParam = (index, key, value) => {
    const newActions = [...actions]
    newActions[index] = {
      ...newActions[index],
      params: {
        ...newActions[index].params,
        [key]: value
      }
    }
    setActions(newActions)
  }

  const updateActionDelay = (index, delay) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], delay }
    setActions(newActions)
  }

  const handleSubmit = async (values) => {
    try {
      await onSave?.({
        ...values,
        actions,
        actionCount: actions.length
      })
      message.success('场景保存成功')
    } catch (error) {
      message.error('场景保存失败')
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        name: scene?.name || '',
        description: scene?.description || '',
        icon: scene?.icon || '🎬'
      }}
    >
      <Form.Item
        name="name"
        label="场景名称"
        rules={[{ required: true, message: '请输入场景名称' }]}
      >
        <Input placeholder="例如: 观影模式" />
      </Form.Item>

      <Form.Item name="description" label="场景描述">
        <TextArea rows={3} placeholder="描述这个场景的用途..." />
      </Form.Item>

      <Form.Item label="场景动作">
        <Card
          size="small"
          title={
            <Space>
              <span>动作列表 ({actions.length})</span>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setShowAddAction(true)}
              >
                添加动作
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {actions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
              暂无动作，点击上方按钮添加
            </div>
          ) : (
            <div>
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className={`scene-action-item ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                >
                  <MenuOutlined className="drag-handle" />
                  <span style={{ fontSize: '20px' }}>{action.icon}</span>
                  <span style={{ flex: 1 }}>
                    <strong>{index + 1}.</strong> {action.label}
                  </span>
                  {action.key === 'volume_set' && (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={action.params.volume}
                      onChange={(e) => updateActionParam(index, 'volume', parseInt(e.target.value))}
                      style={{ width: 80 }}
                      addonAfter="%"
                    />
                  )}
                  <Space>
                    <ClockCircleOutlined style={{ color: '#999' }} />
                    <Input
                      type="number"
                      min={0}
                      max={60000}
                      value={action.delay}
                      onChange={(e) => updateActionDelay(index, parseInt(e.target.value) || 0)}
                      style={{ width: 70 }}
                      addonAfter="ms"
                    />
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeAction(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />}>
            保存场景
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>

      <Modal
        title="选择动作"
        open={showAddAction}
        onCancel={() => setShowAddAction(false)}
        footer={null}
        width={600}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {availableActions.map(action => (
            <Button
              key={action.key}
              size="large"
              onClick={() => addAction(action.key)}
              style={{ height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <span style={{ fontSize: '20px' }}>{action.icon}</span>
              <span style={{ fontSize: '12px' }}>{action.label}</span>
            </Button>
          ))}
        </div>
      </Modal>
    </Form>
  )
}

export default SceneBuilder
