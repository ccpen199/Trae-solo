import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  List,
  Tag,
  Space,
  message,
  Empty,
  Drawer,
  Tabs,
  Statistic,
  Avatar,
  Progress,
  Alert,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  SoundOutlined,
  BulbOutlined,
  CloudServerOutlined
} from '@ant-design/icons'
import SceneBuilder from '../components/SceneBuilder.jsx'
import { getScenes, createScene, updateScene, deleteScene, executeScene } from '../api/scenes.js'
import { logOperation } from '../api/operationLog.js'
import dayjs from 'dayjs'

const { TabPane } = Tabs

const actionIcons = {
  'power': '🔌',
  'power_on': '🔛',
  'power_off': '🔜',
  'volume_up': '🔊',
  'volume_down': '🔉',
  'mute': '🔇',
  'temp_up': '🌡️↑',
  'temp_down': '🌡️↓',
  'mode_cool': '❄️',
  'mode_heat': '🔥',
  'mode_auto': '🔄',
  'light_on': '💡',
  'light_off': '🌑',
  'light_dim': '🔅',
  'light_bright': '🔆',
  'channel_up': '📺↑',
  'channel_down': '📺↓',
  'swing': '🌀',
  'fan_speed': '💨'
}

const getActionIcon = (command) => {
  return actionIcons[command] || '⚙️'
}

const getDeviceCategoryIcon = (category) => {
  switch (category) {
    case 'cooling': return <ThunderboltOutlined style={{ color: '#1890ff' }} />
    case 'AV': return <SoundOutlined style={{ color: '#722ed1' }} />
    case 'lighting': return <BulbOutlined style={{ color: '#faad14' }} />
    default: return <CloudServerOutlined style={{ color: '#8c8c8c' }} />
  }
}

function SceneMode() {
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingScene, setEditingScene] = useState(null)
  const [executingId, setExecutingId] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedScene, setSelectedScene] = useState(null)
  const [executionResult, setExecutionResult] = useState(null)
  const [executionHistory, setExecutionHistory] = useState([])

  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = async () => {
    setLoading(true)
    try {
      const data = await getScenes().catch(err => {
        console.error('Failed to load scenes:', err)
        return []
      })
      
      const scenesList = Array.isArray(data) ? data : (data?.data || [])
      
      setScenes(scenesList.map(normalizeScene))
      
      if (scenesList.length > 0) {
        message.success(`加载了 ${scenesList.length} 个场景`)
      }
    } catch (error) {
      console.error('Load scenes failed:', error)
      message.error('部分数据加载失败，请检查网络')
    } finally {
      setLoading(false)
    }
  }

  const normalizeScene = (s) => {
    return {
      ...s,
      id: s.id,
      name: s.name || s.scene_name || '未命名场景',
      description: s.description || '',
      icon: s.icon || '🎬',
      isActive: s.is_active !== undefined ? s.is_active : (s.enabled !== undefined ? s.enabled : true),
      enabled: s.is_active !== undefined ? s.is_active : (s.enabled !== undefined ? s.enabled : true),
      actionCount: s.action_count || s.actionCount || (s.actions?.length || 0),
      usageCount: s.usage_count || s.usageCount || s.run_count || 0,
      lastUsed: s.last_used_at || s.lastUsed || s.last_used,
      createdAt: s.created_at || s.createdAt,
      actions: (s.actions || []).map(a => ({
        ...a,
        deviceId: a.device_id || a.deviceId,
        deviceName: a.device_name || a.deviceName,
        deviceTypeName: a.device_type_name || a.deviceTypeName,
        brandName: a.brand_name || a.brandName,
        delaySeconds: a.delay_seconds || a.delaySeconds || a.delay || 0,
        orderIndex: a.order_index || a.orderIndex,
        params: a.params ? (typeof a.params === 'string' ? JSON.parse(a.params) : a.params) : {}
      }))
    }
  }

  const handleCreate = () => {
    setEditingScene(null)
    setModalVisible(true)
  }

  const handleEdit = (scene) => {
    setEditingScene(scene)
    setModalVisible(true)
  }

  const handleDelete = async (scene) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除场景 "${scene.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteScene(scene.id)
          message.success('场景删除成功')
          logOperation('scene_delete', { sceneId: scene.id, sceneName: scene.name })
          loadScenes()
        } catch (error) {
          console.error('Delete failed:', error)
          message.error('删除失败')
        }
      }
    })
  }

  const handleExecute = async (scene) => {
    setExecutingId(scene.id)
    setSelectedScene(scene)
    
    try {
      message.loading({ content: `正在执行场景 "${scene.name}"...`, key: 'scene_exec', duration: 0 })
      
      const result = await executeScene(scene.id)
      message.destroy('scene_exec')
      
      setExecutionResult(result)
      
      const successCount = result?.success_count || 0
      const totalCount = result?.actions_executed || 0
      const allSuccess = successCount === totalCount && totalCount > 0
      
      if (allSuccess) {
        message.success(`场景 "${scene.name}" 执行成功：${successCount}/${totalCount} 个动作`)
      } else if (successCount > 0) {
        message.warning(`场景执行完成：${successCount}/${totalCount} 个动作成功`)
      } else {
        message.error(`场景执行失败：0/${totalCount} 个动作成功`)
      }

      const historyEntry = {
        id: Date.now(),
        sceneId: scene.id,
        sceneName: scene.name,
        executedAt: result?.executed_at || new Date().toISOString(),
        successCount,
        totalCount,
        results: result?.results || [],
        allSuccess
      }
      
      setExecutionHistory(prev => [historyEntry, ...prev].slice(0, 20))
      setDrawerVisible(true)
      
      logOperation('scene_execute', { 
        sceneId: scene.id, 
        sceneName: scene.name,
        successCount,
        totalCount,
        result 
      })
      
      loadScenes()
      
    } catch (error) {
      message.destroy('scene_exec')
      console.error('Scene execute failed:', error)
      message.error(error?.response?.data?.error || '场景执行失败')
      
      const historyEntry = {
        id: Date.now(),
        sceneId: scene.id,
        sceneName: scene.name,
        executedAt: new Date().toISOString(),
        successCount: 0,
        totalCount: 0,
        results: [],
        allSuccess: false,
        error: error?.message || '执行失败'
      }
      setExecutionHistory(prev => [historyEntry, ...prev].slice(0, 20))
      
      logOperation('scene_execute', { 
        sceneId: scene.id, 
        sceneName: scene.name, 
        success: false,
        error: error?.message 
      })
    } finally {
      setExecutingId(null)
    }
  }

  const handleViewHistory = (scene) => {
    setSelectedScene(scene)
    setExecutionResult(null)
    setDrawerVisible(true)
  }

  const handleSave = async (sceneData) => {
    try {
      if (editingScene) {
        await updateScene(editingScene.id, sceneData)
        message.success('场景更新成功')
        logOperation('scene_update', { sceneId: editingScene.id, ...sceneData })
      } else {
        await createScene(sceneData)
        message.success('场景创建成功')
        logOperation('scene_create', sceneData)
      }
      setModalVisible(false)
      loadScenes()
    } catch (error) {
      console.error('Save failed:', error)
      message.error(error?.response?.data?.error || '保存失败')
    }
  }

  const formatCommandName = (cmd) => {
    const nameMap = {
      'power': '电源',
      'power_on': '开机',
      'power_off': '关机',
      'volume_up': '音量+',
      'volume_down': '音量-',
      'channel_up': '频道+',
      'channel_down': '频道-',
      'mute': '静音',
      'temp_up': '温度+',
      'temp_down': '温度-',
      'mode_cool': '制冷模式',
      'mode_heat': '制热模式',
      'mode_auto': '自动模式',
      'light_on': '开灯',
      'light_off': '关灯',
      'light_dim': '调暗',
      'light_bright': '调亮',
      'swing': '摆风',
      'fan_speed': '风速'
    }
    return nameMap[cmd] || cmd
  }

  const getSceneStats = () => {
    const total = scenes.length
    const active = scenes.filter(s => s.isActive).length
    const totalActions = scenes.reduce((sum, s) => sum + s.actionCount, 0)
    const totalExecutions = scenes.reduce((sum, s) => sum + s.usageCount, 0)
    return { total, active, totalActions, totalExecutions }
  }

  const stats = getSceneStats()
  const sceneHistory = executionHistory.filter(h => h.sceneId === selectedScene?.id)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>场景模式</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
            共 {stats.total} 个场景，{stats.active} 个已启用，{stats.totalActions} 个联动动作
          </p>
        </div>
        <Space>
          <Button onClick={loadScenes}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建场景
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="场景总数"
              value={stats.total}
              prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已启用"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="联动动作"
              value={stats.totalActions}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="累计执行"
              value={stats.totalExecutions}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<PlayCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      {scenes.length === 0 ? (
        <Empty description={loading ? '加载中...' : '暂无场景，点击右上角创建'} />
      ) : (
        <Row gutter={[16, 16]}>
          {scenes.map(scene => (
            <Col xs={24} sm={12} lg={8} key={scene.id}>
              <Card
                hoverable
                actions={[
                  <Tooltip title="执行场景">
                    <Button
                      type="text"
                      icon={<PlayCircleOutlined />}
                      loading={executingId === scene.id}
                      onClick={() => handleExecute(scene)}
                    >
                      执行
                    </Button>
                  </Tooltip>,
                  <Tooltip title="执行记录">
                    <Button
                      type="text"
                      icon={<HistoryOutlined />}
                      onClick={() => handleViewHistory(scene)}
                    >
                      记录
                    </Button>
                  </Tooltip>,
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(scene)}
                    >
                      编辑
                    </Button>
                  </Tooltip>,
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(scene)}
                    >
                      删除
                    </Button>
                  </Tooltip>
                ]}
              >
                <Card.Meta
                  avatar={<span style={{ fontSize: '40px' }}>{scene.icon}</span>}
                  title={
                    <Space>
                      {scene.name}
                      <Tag color={scene.isActive ? 'success' : 'default'}>
                        {scene.isActive ? '已启用' : '已禁用'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ color: '#666', margin: '8px 0' }}>{scene.description}</p>
                      <Space split={<span>·</span>} style={{ fontSize: '12px', color: '#999' }}>
                        <span>{scene.actionCount} 个动作</span>
                        <span>执行 {scene.usageCount} 次</span>
                        <span>
                          <ClockCircleOutlined /> {scene.lastUsed ? dayjs(scene.lastUsed).fromNow() : '未执行'}
                        </span>
                      </Space>
                      {scene.actions && scene.actions.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>动作预览:</div>
                          <List
                            size="small"
                            dataSource={scene.actions.slice(0, 3)}
                            renderItem={action => (
                              <List.Item style={{ padding: '4px 0' }}>
                                <Space>
                                  <span>{getActionIcon(action.command)}</span>
                                  <span style={{ fontSize: '12px' }}>
                                    {action.deviceName}: {formatCommandName(action.command)}
                                  </span>
                                </Space>
                                {action.delaySeconds > 0 && (
                                  <Tag style={{ marginLeft: 'auto' }} size="small">
                                    +{action.delaySeconds}s
                                  </Tag>
                                )}
                              </List.Item>
                            )}
                          />
                          {scene.actions.length > 3 && (
                            <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '4px 0' }}>
                              还有 {scene.actions.length - 3} 个动作...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingScene ? '编辑场景' : '创建场景'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
        forceRender
      >
        <SceneBuilder
          scene={editingScene}
          onSave={handleSave}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      <Drawer
        title={
          <Space>
            {selectedScene?.icon}
            {selectedScene?.name || '场景执行记录'}
          </Space>
        }
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnHidden
      >
        {selectedScene && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="动作数量"
                    value={selectedScene.actionCount}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="累计执行"
                    value={selectedScene.usageCount}
                    valueStyle={{ fontSize: '14px', color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>

            <Tabs defaultActiveKey="result" size="small">
              <TabPane
                tab={
                  <Space>
                    <PlayCircleOutlined />
                    执行结果
                  </Space>
                }
                key="result"
              >
                {executionResult ? (
                  <div>
                    {executionResult.success_count === executionResult.actions_executed ? (
                      <Alert
                        message="执行成功"
                        description={`全部 ${executionResult.success_count} 个动作执行成功`}
                        type="success"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    ) : executionResult.success_count > 0 ? (
                      <Alert
                        message="部分成功"
                        description={`${executionResult.success_count}/${executionResult.actions_executed} 个动作成功`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    ) : (
                      <Alert
                        message="执行失败"
                        description="所有动作执行失败"
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}

                    <div style={{ marginBottom: 12 }}>
                      <Progress
                        percent={Math.round((executionResult.success_count / (executionResult.actions_executed || 1)) * 100)}
                        status={executionResult.success_count === executionResult.actions_executed ? 'success' : 'exception'}
                      />
                    </div>

                    <h4 style={{ margin: '16px 0 12px 0' }}>动作详情</h4>
                    <List
                      size="small"
                      dataSource={executionResult.results || []}
                      renderItem={result => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                icon={result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                style={{ backgroundColor: result.success ? '#52c41a' : '#ff4d4f' }}
                              />
                            }
                            title={
                              <Space>
                                {getActionIcon(result.command)}
                                {result.device_name}
                                <Tag>{formatCommandName(result.command)}</Tag>
                              </Space>
                            }
                            description={
                              <Space>
                                {result.delay_seconds > 0 && <Tag>延迟 {result.delay_seconds}s</Tag>}
                                {result.log_id && <span style={{ fontSize: '12px', color: '#8c8c8c' }}>日志ID: {result.log_id}</span>}
                              </Space>
                            }
                          />
                          <Tag color={result.success ? 'success' : 'error'}>
                            {result.success ? '成功' : '失败'}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  </div>
                ) : (
                  <Empty description="暂无执行结果，点击场景卡片的执行按钮开始" />
                )}
              </TabPane>

              <TabPane
                tab={
                  <Space>
                    <HistoryOutlined />
                    执行历史
                  </Space>
                }
                key="history"
              >
                {sceneHistory.length === 0 ? (
                  <Empty description="暂无执行历史" />
                ) : (
                  <List
                    size="small"
                    dataSource={sceneHistory}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          item.allSuccess ? 
                            <Tag color="success">全部成功</Tag> :
                            item.error ?
                            <Tag color="error">执行失败</Tag> :
                            <Tag color="warning">部分成功</Tag>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              icon={item.allSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                              style={{ backgroundColor: item.allSuccess ? '#52c41a' : item.error ? '#ff4d4f' : '#faad14' }}
                            />
                          }
                          title={`${item.successCount}/${item.totalCount} 个动作成功`}
                          description={
                            <Space>
                              <ClockCircleOutlined />
                              {dayjs(item.executedAt).format('YYYY-MM-DD HH:mm:ss')}
                              {item.error && <span style={{ color: '#ff4d4f' }}>{item.error}</span>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default SceneMode
