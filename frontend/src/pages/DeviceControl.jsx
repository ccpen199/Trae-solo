import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Drawer,
  Empty,
  Card,
  Tag,
  Divider,
  InputNumber,
  Radio,
  Tabs,
  List,
  Avatar,
  Tooltip,
  Alert,
  Progress,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  SoundOutlined,
  CloudServerOutlined,
  CloudOutlined,
  SyncOutlined,
  WifiOutlined,
  DisconnectOutlined,
  ExperimentOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import DeviceCard from '../components/DeviceCard.jsx'
import RemoteControl from '../components/RemoteControl.jsx'
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  sendIRCommand,
  learnCommand,
  matchIRCode
} from '../api/devices.js'
import { getDeviceTypes, getBrands, getIRCodeModels } from '../api/catalog.js'
import { logOperation } from '../api/operationLog.js'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input
const { TextArea } = Input
const { TabPane } = Tabs

const deviceCategoryIcons = {
  'cooling': <ThunderboltOutlined />,
  'AV': <SoundOutlined />,
  'lighting': <BulbOutlined />,
  'other': <CloudServerOutlined />
}

const deviceCategoryColors = {
  'cooling': '#1890ff',
  'AV': '#722ed1',
  'lighting': '#faad14',
  'other': '#8c8c8c'
}

function DeviceControl() {
  const [devices, setDevices] = useState([])
  const [deviceTypes, setDeviceTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [form] = Form.useForm()
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [selectedBrandId, setSelectedBrandId] = useState(null)

  const [learningMode, setLearningMode] = useState(false)
  const [learningCommandName, setLearningCommandName] = useState('')
  const [rawCodeInput, setRawCodeInput] = useState('')
  const [matchingCode, setMatchingCode] = useState('')
  const [matchResults, setMatchResults] = useState([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [learnLoading, setLearnLoading] = useState(false)
  const [commandHistory, setCommandHistory] = useState([])

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [devicesData, typesData, brandsData] = await Promise.all([
        getDevices().catch(err => {
          console.error('Failed to load devices:', err)
          return []
        }),
        getDeviceTypes().catch(err => {
          console.error('Failed to load device types:', err)
          return []
        }),
        getBrands().catch(err => {
          console.error('Failed to load brands:', err)
          return []
        })
      ])

      const devicesList = Array.isArray(devicesData)
        ? devicesData
        : (devicesData?.data || [])
      
      const typesList = Array.isArray(typesData)
        ? typesData
        : (typesData?.data || [])
      
      const brandsList = Array.isArray(brandsData)
        ? brandsData
        : (brandsData?.data || [])

      setDevices(devicesList.map(normalizeDevice))
      setDeviceTypes(typesList.map(t => ({ ...t, name: t.name || t.type_name })))
      setBrands(brandsList.map(b => ({ ...b, name: b.name || b.brand_name })))

      if (devicesList.length > 0) {
        message.success(`加载了 ${devicesList.length} 个设备`)
      }
    } catch (error) {
      console.error('Load data failed:', error)
      message.error('部分数据加载失败，请检查网络')
    } finally {
      setLoading(false)
    }
  }

  const normalizeDevice = (d) => {
    const category = d.category || d.device_category
    const typeText = `${d.device_type_name || d.type || ''} ${d.name || ''} ${d.model_number || d.model || ''}`.toLowerCase()
    const uiType =
      d.type === 'tv' || d.type === 'ac' || d.type === 'light' || d.type === 'projector'
        ? d.type
        : category === 'cooling'
          ? 'ac'
          : category === 'lighting'
            ? 'light'
            : category === 'AV' && /投影|projector|xgimi|vpl|lsp|z6x|z8x|\bh2\b|\bh3\b/.test(typeText)
              ? 'projector'
              : category === 'AV'
                ? 'tv'
                : 'default'

    const device = {
      ...d,
      id: d.id,
      name: d.name || d.device_name || '未命名设备',
      type: uiType,
      typeId: d.type_id || d.device_type_id || d.typeId,
      brandId: d.brand_id || d.brandId,
      modelId: d.model_id || d.modelId,
      brand: d.brand || d.brand_name || d.brandName,
      model: d.model || d.model_name || d.modelName,
      status: d.status || (d.is_online ? 'online' : 'offline'),
      isOnline: d.is_online !== undefined ? d.is_online : (d.status === 'online'),
      lastUsed: d.last_used_at || d.lastUsed || d.last_used,
      category,
      irCodes: d.ir_codes || d.irCodes || d.commands || [],
      createdAt: d.created_at || d.createdAt
    }

    if (!device.category && device.type) {
      const typeMatch = deviceTypes.find(t => 
        t.id === device.typeId || t.name === device.type || t.category === device.type
      )
      device.category = typeMatch?.category || 'other'
    }

    return device
  }

  const loadModels = async (typeId, brandId) => {
    if (!typeId || !brandId) {
      setModels([])
      return
    }
    try {
      const data = await getIRCodeModels({ typeId, brandId }).catch(() => [])
      const modelsList = Array.isArray(data) ? data : (data?.data || [])
      setModels(modelsList.map(m => ({
        ...m,
        name: m.name || m.model_number || m.modelName
      })))
    } catch (error) {
      console.error('Load models failed:', error)
    }
  }

  const handleTypeChange = (typeId) => {
    setSelectedTypeId(typeId)
    form.setFieldsValue({ brandId: null, modelId: null })
    setSelectedBrandId(null)
    setModels([])
  }

  const handleBrandChange = (brandId) => {
    setSelectedBrandId(brandId)
    form.setFieldsValue({ modelId: null })
    loadModels(selectedTypeId, brandId)
  }

  const handleCreate = () => {
    setEditingDevice(null)
    form.resetFields()
    setSelectedTypeId(null)
    setSelectedBrandId(null)
    setModels([])
    setModalVisible(true)
  }

  const handleEdit = (device) => {
    setEditingDevice(device)
    const formValues = {
      name: device.name,
      typeId: device.typeId,
      brandId: device.brandId,
      modelId: device.modelId,
      brand: device.brand,
      model: device.model
    }
    setSelectedTypeId(device.typeId)
    setSelectedBrandId(device.brandId)
    if (device.typeId && device.brandId) {
      loadModels(device.typeId, device.brandId)
    }
    form.setFieldsValue(formValues)
    setModalVisible(true)
  }

  const handleDelete = async (device) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除设备 "${device.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteDevice(device.id)
          message.success('设备删除成功')
          logOperation('device_delete', { deviceId: device.id, deviceName: device.name })
          loadAllData()
        } catch (error) {
          console.error('Delete failed:', error)
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async (values) => {
    const deviceData = {
      name: values.name,
      type_id: values.typeId,
      brand_id: values.brandId,
      model_id: values.modelId,
      brand: values.brand,
      model: values.model
    }

    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, deviceData)
        message.success('设备更新成功')
        logOperation('device_update', { deviceId: editingDevice.id, ...deviceData })
      } else {
        await createDevice(deviceData)
        message.success('设备创建成功')
        logOperation('device_create', deviceData)
      }
      setModalVisible(false)
      loadAllData()
    } catch (error) {
      console.error('Save failed:', error)
      message.error(error?.response?.data?.error || '保存失败')
    }
  }

  const handleControl = (device) => {
    setSelectedDevice(device)
    setLearningMode(false)
    setLearningCommandName('')
    setRawCodeInput('')
    setMatchResults([])
    loadRecentCommandHistory(device.id)
    setDrawerVisible(true)
    logOperation('device_control_open', { deviceId: device.id, deviceName: device.name })
  }

  const loadRecentCommandHistory = async (deviceId) => {
    try {
      const history = []
      setCommandHistory(history)
    } catch (error) {
      console.error('Load history failed:', error)
    }
  }

  const handleSendCommand = async (command) => {
    if (!selectedDevice) return
    
    try {
      message.loading({ content: `正在发送 ${command}...`, key: 'cmd' })
      const result = await sendIRCommand(selectedDevice.id, command)
      message.destroy('cmd')
      
      if (result?.success) {
        message.success(`指令 ${command} 发送成功`)
        setCommandHistory(prev => [{
          id: Date.now(),
          command,
          success: true,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10))
      } else {
        message.error(`指令 ${command} 发送失败`)
        setCommandHistory(prev => [{
          id: Date.now(),
          command,
          success: false,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10))
      }
      
      logOperation('ir_send_command', { deviceId: selectedDevice.id, command, result })
    } catch (error) {
      message.destroy('cmd')
      console.error('Send command failed:', error)
      message.error('指令发送失败')
    }
  }

  const handleLearnCommand = async () => {
    if (!selectedDevice || !learningCommandName || !rawCodeInput) {
      message.warning('请填写指令名称和原始红外码数据')
      return
    }

    setLearnLoading(true)
    try {
      const result = await learnCommand(selectedDevice.id, learningCommandName, rawCodeInput)
      message.success(`指令 "${learningCommandName}" 学习成功`)
      logOperation('ir_learn', { deviceId: selectedDevice.id, commandName: learningCommandName, result })
      
      setLearningMode(false)
      setLearningCommandName('')
      setRawCodeInput('')
      loadAllData()
    } catch (error) {
      console.error('Learn failed:', error)
      message.error(error?.response?.data?.error || '学习失败')
    } finally {
      setLearnLoading(false)
    }
  }

  const handleMatchCloud = async () => {
    if (!matchingCode) {
      message.warning('请输入要匹配的原始红外码')
      return
    }

    setMatchLoading(true)
    try {
      const result = await matchIRCode(matchingCode)
      const matches = result?.matches || result?.data?.matches || []
      setMatchResults(matches)
      
      if (matches.length > 0) {
        message.success(`云端匹配成功，找到 ${matches.length} 个可能的匹配`)
      } else {
        message.warning('未找到匹配的红外码，可尝试学习后保存')
      }
      
      logOperation('ir_cloud_match', { rawCode: matchingCode, matchCount: matches.length })
    } catch (error) {
      console.error('Match failed:', error)
      message.error('云端匹配失败')
      setMatchResults([])
    } finally {
      setMatchLoading(false)
    }
  }

  const handleSelectMatch = (match) => {
    if (!selectedDevice) return
    
    Modal.confirm({
      title: '确认使用此匹配',
      content: `将 "${match.commandName || match.command_name}" 指令添加到设备 "${selectedDevice.name}"？`,
      onOk: async () => {
        try {
          const result = await learnCommand(selectedDevice.id, match.commandName || match.command_name, match.rawCode || match.raw_code || matchingCode)
          message.success('指令已添加到设备')
          setMatchingCode('')
          setMatchResults([])
          loadAllData()
        } catch (error) {
          console.error('Add matched command failed:', error)
          message.error('添加失败')
        }
      }
    })
  }

  const getCategoryIcon = (category) => {
    return deviceCategoryIcons[category] || deviceCategoryIcons['other']
  }

  const getCategoryColor = (category) => {
    return deviceCategoryColors[category] || deviceCategoryColors['other']
  }

  const getStatusTag = (device) => {
    const isOnline = device.isOnline || device.status === 'online'
    return (
      <Tag
        icon={isOnline ? <WifiOutlined /> : <DisconnectOutlined />}
        color={isOnline ? 'success' : 'default'}
      >
        {isOnline ? '在线' : '离线'}
      </Tag>
    )
  }

  const getDeviceCommands = () => {
    if (!selectedDevice) return []
    const irCodes = selectedDevice.irCodes || []
    const commandNames = [...new Set(irCodes.map(c => c.command_name || c.commandName || c.command))]
    return commandNames
  }

  const filteredDevices = devices.filter(device => {
    const matchSearch = device.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                       device.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
                       device.model?.toLowerCase().includes(searchText.toLowerCase())
    const matchType = filterType === 'all' || 
                     device.category === filterType ||
                     device.type === filterType ||
                     device.typeId === filterType
    return matchSearch && matchType
  })

  const getOnlineCount = () => devices.filter(d => d.isOnline || d.status === 'online').length
  const getOfflineCount = () => devices.filter(d => !(d.isOnline || d.status === 'online')).length
  const getCategoryCount = (cat) => devices.filter(d => d.category === cat).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>设备控制</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
            共 {devices.length} 个设备，{getOnlineCount()} 个在线，{getOfflineCount()} 个离线
          </p>
        </div>
        <Space>
          <Button onClick={loadAllData} icon={<SyncOutlined />}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加设备
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="设备总数"
              value={devices.length}
              prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="在线设备"
              value={getOnlineCount()}
              prefix={<WifiOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="离线设备"
              value={getOfflineCount()}
              prefix={<DisconnectOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="红外指令库"
              value={devices.reduce((sum, d) => sum + (d.irCodes?.length || 0), 0)}
              prefix={<QrcodeOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 24 }} wrap>
        <Search
          placeholder="搜索设备名称、品牌或型号"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 300 }}
          onSearch={value => setSearchText(value)}
          onChange={e => setSearchText(e.target.value)}
        />
        <Select
          defaultValue="all"
          size="large"
          style={{ width: 150 }}
          onChange={value => setFilterType(value)}
        >
          <Option value="all">全部类型</Option>
          <Option value="cooling">制冷设备</Option>
          <Option value="AV">影音设备</Option>
          <Option value="lighting">照明设备</Option>
          <Option value="other">其他设备</Option>
        </Select>
      </Space>

      {filteredDevices.length === 0 ? (
        <Empty description={loading ? '加载中...' : '暂无设备，点击右上角添加'} />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredDevices.map(device => (
            <Col xs={24} sm={12} md={8} lg={6} key={device.id}>
              <DeviceCard
                device={device}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onControl={handleControl}
                onClick={handleControl}
                extra={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {device.brand} {device.model}
                      </span>
                      {getStatusTag(device)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {device.lastUsed ? `最后使用: ${dayjs(device.lastUsed).fromNow()}` : '未使用过'}
                    </div>
                  </Space>
                }
              />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnHidden
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="例如: 客厅电视" maxLength={50} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="typeId"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select placeholder="选择设备类型" onChange={handleTypeChange}>
                  {deviceTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      <Space>
                        {getCategoryIcon(type.category)}
                        {type.name}
                        <Tag color="blue" style={{ marginLeft: 8 }}>{type.category}</Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="brandId"
                label="品牌"
                rules={[{ required: true, message: '请选择品牌' }]}
              >
                <Select
                  placeholder="选择品牌"
                  disabled={!selectedTypeId}
                  onChange={handleBrandChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {brands
                    .filter(b => !selectedTypeId || b.device_type_id === selectedTypeId || b.deviceTypeId === selectedTypeId)
                    .map(brand => (
                    <Option key={brand.id} value={brand.id}>
                      {brand.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="modelId"
            label="型号（从云端码库选择）"
            rules={[{ required: true, message: '请选择型号' }]}
          >
            <Select
              placeholder="选择型号以获取预设红外码"
              disabled={!selectedBrandId}
              showSearch
              optionFilterProp="children"
            >
              {models.map(model => (
                <Option key={model.id} value={model.id}>
                  <Space>
                    {model.name || model.model_number}
                    <Tag color="purple">{model.code_format || model.codeFormat}</Tag>
                  </Space>
                </Option>
              ))}
              {!selectedBrandId && (
                <Option value="" disabled>请先选择品牌</Option>
              )}
            </Select>
          </Form.Item>

          <Divider>或手动输入（不使用云端码库）</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="品牌名称"
              >
                <Input placeholder="例如: 小米" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="型号"
              >
                <Input placeholder="例如: L55M5-AD" />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="提示：从云端码库选择型号可自动获得该型号的所有预设红外指令"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingDevice ? '更新设备' : '添加设备'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            {selectedDevice && getCategoryIcon(selectedDevice.category)}
            {selectedDevice?.name || '设备控制'}
            {selectedDevice && getStatusTag(selectedDevice)}
          </Space>
        }
        placement="right"
        width={420}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnHidden
      >
        {selectedDevice && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="品牌"
                    value={selectedDevice.brand || '-'}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="型号"
                    value={selectedDevice.model || '-'}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="设备类型"
                    value={selectedDevice.type || '-'}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="可用指令"
                    value={getDeviceCommands().length}
                    valueStyle={{ fontSize: '14px', color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>

            <Tabs defaultActiveKey="control" size="small">
              <TabPane 
                tab={
                  <Space>
                    <CloudOutlined />
                    遥控面板
                  </Space>
                } 
                key="control"
              >
                {getDeviceCommands().length === 0 ? (
                  <Empty description="暂无可用指令，请先学习或从云端匹配" />
                ) : (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>可用指令</h4>
                      <Row gutter={[8, 8]}>
                        {getDeviceCommands().map(cmd => (
                          <Col span={8} key={cmd}>
                            <Button
                              block
                              size="large"
                              style={{ height: 48 }}
                              onClick={() => handleSendCommand(cmd)}
                            >
                              {cmd === 'power' ? '电源' :
                               cmd === 'power_on' ? '开机' :
                               cmd === 'power_off' ? '关机' :
                               cmd === 'volume_up' ? '音量+' :
                               cmd === 'volume_down' ? '音量-' :
                               cmd === 'mute' ? '静音' :
                               cmd === 'temp_up' ? '温度+' :
                               cmd === 'temp_down' ? '温度-' :
                               cmd === 'mode_cool' ? '制冷' :
                               cmd === 'mode_heat' ? '制热' :
                               cmd}
                            </Button>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0 }}>
                      <Space>
                        <HistoryOutlined />
                        最近操作
                      </Space>
                    </h4>
                  </div>
                  {commandHistory.length === 0 ? (
                    <Empty description="暂无操作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      size="small"
                      dataSource={commandHistory}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                icon={item.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                style={{ backgroundColor: item.success ? '#52c41a' : '#ff4d4f' }}
                              />
                            }
                            title={item.command}
                            description={dayjs(item.timestamp).fromNow()}
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </TabPane>

              <TabPane 
                tab={
                  <Space>
                    <ExperimentOutlined />
                    红外学习
                  </Space>
                } 
                key="learn"
              >
                <div>
                  <Alert
                    message="红外学习流程"
                    description={
                      <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                        <li>在下方输入要学习的指令名称</li>
                        <li>使用手机红外硬件对准设备，捕获原始红外码</li>
                        <li>将捕获的RAW数据粘贴到下方输入框</li>
                        <li>点击"保存学习结果"完成学习</li>
                      </ol>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  <Form layout="vertical">
                    <Form.Item label="指令名称" required>
                      <Input
                        placeholder="例如: 电源开关、音量+、制冷模式"
                        value={learningCommandName}
                        onChange={e => setLearningCommandName(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="原始红外码数据 (RAW / Base64)" required>
                      <TextArea
                        rows={4}
                        placeholder="粘贴捕获的红外RAW数据，格式: [9042, 4484, 579, 1634, ...] 或 Base64 编码"
                        value={rawCodeInput}
                        onChange={e => setRawCodeInput(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button
                          type="primary"
                          icon={<ExperimentOutlined />}
                          onClick={handleLearnCommand}
                          loading={learnLoading}
                          disabled={!learningCommandName || !rawCodeInput}
                        >
                          保存学习结果
                        </Button>
                        <Button onClick={() => {
                          setLearningCommandName('')
                          setRawCodeInput('')
                        }}>
                          清空
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </div>
              </TabPane>

              <TabPane 
                tab={
                  <Space>
                    <CloudOutlined />
                    云端匹配
                  </Space>
                } 
                key="match"
              >
                <div>
                  <Alert
                    message="云端码库匹配"
                    description="输入原始红外码数据，系统将自动在云端码库中进行模糊匹配，找到最相似的已知型号指令。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  <Form layout="vertical">
                    <Form.Item label="原始红外码数据">
                      <TextArea
                        rows={4}
                        placeholder="粘贴要匹配的红外RAW数据"
                        value={matchingCode}
                        onChange={e => setMatchingCode(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<CloudOutlined />}
                        onClick={handleMatchCloud}
                        loading={matchLoading}
                        disabled={!matchingCode}
                      >
                        开始云端匹配
                      </Button>
                    </Form.Item>
                  </Form>

                  {matchResults.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>匹配结果（置信度从高到低）</h4>
                      <List
                        size="small"
                        dataSource={matchResults}
                        renderItem={(match, index) => (
                          <List.Item
                            actions={[
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleSelectMatch(match)}
                              >
                                添加到此设备
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{ backgroundColor: match.confidence > 0.8 ? '#52c41a' : match.confidence > 0.5 ? '#faad14' : '#8c8c8c' }}
                                >
                                  {index + 1}
                                </Avatar>
                              }
                              title={
                                <Space>
                                  {match.brandName || match.brand_name || match.brand}
                                  {match.modelName || match.model_name || match.model}
                                  <Tag>{match.commandName || match.command_name || match.command}</Tag>
                                </Space>
                              }
                              description={
                                <Space>
                                  <span>置信度:</span>
                                  <Progress
                                    percent={Math.round((match.confidence || 0) * 100)}
                                    size="small"
                                    style={{ width: 120 }}
                                  />
                                  <Tag color="purple">{match.codeFormat || match.code_format}</Tag>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default DeviceControl
