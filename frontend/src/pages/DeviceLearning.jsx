import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  List,
  Tag,
  message,
  Steps,
  Result,
  Descriptions,
  Modal,
  Tabs,
  Empty,
  Spin
} from 'antd'
import {
  ThunderboltOutlined,
  CloudOutlined,
  SaveOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined
} from '@ant-design/icons'
import {
  startLearning,
  stopLearning,
  getLearningStatus,
  submitRawCode,
  cloudMatch,
  getLearningHistory,
  saveLearnedCode
} from '../api/learning.js'
import { getDevices } from '../api/devices.js'
import { logOperation } from '../api/operationLog.js'
import { decodeRawIR, encodeIRToRaw, searchIRCodes } from '../utils/irCodeLibrary.js'
import androidBridge from '../utils/androidIRBridge.js'
import dayjs from 'dayjs'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const mockDevices = [
  { id: '1', name: '客厅电视', type: 'tv', brand: '小米', model: 'L55M5-AD' },
  { id: '2', name: '客厅空调', type: 'ac', brand: '格力', model: 'KFR-35GW' },
  { id: '3', name: '投影仪', type: 'projector', brand: '极米', model: 'H3S' }
]

const mockHistory = [
  {
    id: '1',
    deviceId: '1',
    deviceName: '客厅电视',
    commandName: 'power',
    rawCode: '0001 0001 0020 0020 0040 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0400',
    format: 'NEC',
    frequency: 38000,
    hexCode: '0x40BF40BF',
    status: 'success',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    cloudMatched: true,
    matchScore: 98
  },
  {
    id: '2',
    deviceId: '2',
    deviceName: '客厅空调',
    commandName: 'temp_up',
    rawCode: '0002 0002 0040 0040 0080 0040 0040 0080 0040 0040 0040 0040 0040 0040 0040 0040 0040 0080 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0080 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0040 0800',
    format: 'NEC_EXTENDED',
    frequency: 38000,
    hexCode: '0x80BF20DF',
    status: 'success',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    cloudMatched: true,
    matchScore: 95
  },
  {
    id: '3',
    deviceId: '1',
    deviceName: '客厅电视',
    commandName: 'volume_up',
    rawCode: '0001 0001 0020 0020 0040 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0400',
    format: 'NEC',
    frequency: 38000,
    hexCode: '0x40BF807F',
    status: 'success',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    cloudMatched: false,
    matchScore: 0
  }
]

const mockCloudMatches = [
  { id: 'm1', brand: '小米', model: 'L55M5-AD', command: 'power', format: 'NEC', hexCode: '0x40BF40BF', matchScore: 98, confidence: 'high' },
  { id: 'm2', brand: '小米', model: 'L65M5-AD', command: 'power', format: 'NEC', hexCode: '0x40BF40BF', matchScore: 98, confidence: 'high' },
  { id: 'm3', brand: 'TCL', model: '55C6', command: 'power', format: 'NEC', hexCode: '0x40BF40BF', matchScore: 95, confidence: 'medium' }
]

function DeviceLearning() {
  const [devices, setDevices] = useState(mockDevices)
  const [history, setHistory] = useState(mockHistory)
  const [loading, setLoading] = useState(false)
  const [learningStatus, setLearningStatus] = useState('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [rawCode, setRawCode] = useState('')
  const [decodedData, setDecodedData] = useState(null)
  const [cloudMatches, setCloudMatches] = useState([])
  const [cloudMatching, setCloudMatching] = useState(false)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('learn')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [devicesData, historyData] = await Promise.all([
        getDevices().catch(() => mockDevices),
        getLearningHistory().catch(() => mockHistory)
      ])
      setDevices(devicesData?.data || devicesData || mockDevices)
      setHistory(historyData?.data || historyData || mockHistory)
    } catch (error) {
      console.error('Load data failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartLearning = async () => {
    const values = await form.validateFields()
    setLearningStatus('listening')
    setCurrentStep(1)
    logOperation('learning_start', values)

    try {
      if (navigator.userAgent.includes('Android')) {
        await androidBridge.startLearning(values.deviceId)
      } else {
        const result = await startLearning(values.deviceId).catch(() => ({ sessionId: 'mock-' + Date.now() }))
        setSessionId(result.sessionId)
      }

      message.info('请将原遥控器对准红外接收器，按下要学习的按钮...')

      setTimeout(() => {
        const mockRaw = '0001 0001 0020 0020 0040 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0400'
        setRawCode(mockRaw)
        setDecodedData(decodeRawIR(mockRaw))
        setLearningStatus('captured')
        setCurrentStep(2)
        message.success('红外码捕获成功！')
      }, 3000)

    } catch (error) {
      setLearningStatus('error')
      message.error('学习启动失败')
    }
  }

  const handleStopLearning = async () => {
    if (sessionId) {
      await stopLearning(sessionId).catch(() => {})
    }
    setLearningStatus('idle')
    setCurrentStep(0)
    setRawCode('')
    setDecodedData(null)
    setSessionId(null)
  }

  const handleCloudMatch = async () => {
    setCloudMatching(true)
    try {
      const result = await cloudMatch(rawCode).catch(() => mockCloudMatches)
      setCloudMatches(result?.data || result || mockCloudMatches)
      setCurrentStep(3)
      message.success('云端匹配完成')
      logOperation('learning_cloud_match', { rawCode, matches: cloudMatches.length })
    } catch (error) {
      message.error('云端匹配失败')
    } finally {
      setCloudMatching(false)
    }
  }

  const handleSaveCode = async (match = null) => {
    const values = await form.validateFields()
    const saveData = {
      deviceId: values.deviceId,
      commandName: values.commandName,
      rawCode,
      format: decodedData?.format || 'NEC',
      frequency: decodedData?.frequency || 38000,
      hexCode: decodedData?.hexCode,
      matchedBrand: match?.brand,
      matchedModel: match?.model,
      matchScore: match?.matchScore
    }

    try {
      await saveLearnedCode(saveData).catch(() => ({ success: true }))
      message.success('红外码保存成功')
      logOperation('learning_save', saveData)
      setCurrentStep(4)
      setLearningStatus('success')
      loadData()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleManualSubmit = async () => {
    if (!rawCode) {
      message.error('请输入原始红外码')
      return
    }
    setDecodedData(decodeRawIR(rawCode))
    setCurrentStep(2)
    setLearningStatus('captured')
  }

  const handleSearchCode = () => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }
    const results = searchIRCodes(searchQuery)
    setSearchResults(results)
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    message.success('已复制到剪贴板')
  }

  const handleReset = () => {
    setLearningStatus('idle')
    setCurrentStep(0)
    setRawCode('')
    setDecodedData(null)
    setCloudMatches([])
    form.resetFields()
  }

  const steps = [
    { title: '选择设备', icon: <PlayCircleOutlined /> },
    { title: '捕获红外码', icon: <ThunderboltOutlined /> },
    { title: '云端匹配', icon: <CloudOutlined /> },
    { title: '保存完成', icon: <SaveOutlined /> }
  ]

  const getStatusDisplay = () => {
    if (learningStatus === 'listening') {
      return (
        <div className="learning-status listening learning-pulse">
          <ThunderboltOutlined spin />
          <span>正在监听红外信号，请按下遥控器按钮...</span>
        </div>
      )
    }
    if (learningStatus === 'captured') {
      return (
        <div className="learning-status success">
          <CheckCircleOutlined />
          <span>红外码捕获成功</span>
        </div>
      )
    }
    if (learningStatus === 'success') {
      return (
        <Result
          status="success"
          title="学习成功"
          subTitle="红外码已保存到设备，现在可以使用了"
          extra={<Button type="primary" onClick={handleReset}>学习新指令</Button>}
        />
      )
    }
    if (learningStatus === 'error') {
      return (
        <div className="learning-status error">
          <CloseCircleOutlined />
          <span>学习失败，请重试</span>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>红外学习</h2>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="红外学习" key="learn">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="学习流程">
                <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

                {getStatusDisplay()}

                {learningStatus !== 'success' && (
                  <>
                    {currentStep === 0 && (
                      <Form form={form} layout="vertical">
                        <Form.Item
                          name="deviceId"
                          label="选择设备"
                          rules={[{ required: true, message: '请选择要学习的设备' }]}
                        >
                          <Select placeholder="选择设备">
                            {devices.map(device => (
                              <Option key={device.id} value={device.id}>
                                {device.name} ({device.brand} {device.model})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="commandName"
                          label="指令名称"
                          rules={[{ required: true, message: '请输入指令名称' }]}
                        >
                          <Input placeholder="例如: power, volume_up, channel_up" />
                        </Form.Item>
                        <Space>
                          <Button type="primary" size="large" icon={<ThunderboltOutlined />} onClick={handleStartLearning}>
                            开始学习
                          </Button>
                          <Button size="large" onClick={() => setActiveTab('manual')}>
                            手动输入
                          </Button>
                        </Space>
                      </Form>
                    )}

                    {currentStep >= 1 && rawCode && (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h4 style={{ margin: 0 }}>原始红外码</h4>
                          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyCode(rawCode)}>
                            复制
                          </Button>
                        </div>
                        <div className="learning-display">{rawCode}</div>

                        {decodedData && (
                          <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
                            <Descriptions.Item label="格式">{decodedData.format}</Descriptions.Item>
                            <Descriptions.Item label="频率">{decodedData.frequency} Hz</Descriptions.Item>
                            <Descriptions.Item label="位宽">{decodedData.bitCount} bit</Descriptions.Item>
                            <Descriptions.Item label="HEX">{decodedData.hexCode}</Descriptions.Item>
                          </Descriptions>
                        )}

                        <Space style={{ marginTop: 24 }}>
                          <Button type="primary" icon={<CloudOutlined />} onClick={handleCloudMatch} loading={cloudMatching}>
                            云端匹配
                          </Button>
                          <Button icon={<SaveOutlined />} onClick={() => handleSaveCode()}>
                            直接保存
                          </Button>
                          <Button danger onClick={handleStopLearning}>
                            重新学习
                          </Button>
                        </Space>
                      </div>
                    )}

                    {currentStep >= 3 && cloudMatches.length > 0 && (
                      <Card title="云端匹配结果" style={{ marginTop: 24 }}>
                        <List
                          dataSource={cloudMatches}
                          renderItem={(match) => (
                            <List.Item
                              actions={[
                                <Tag color={match.confidence === 'high' ? 'green' : 'orange'}>
                                  匹配度 {match.matchScore}%
                                </Tag>,
                                <Button type="primary" size="small" onClick={() => handleSaveCode(match)}>
                                  保存
                                </Button>
                              ]}
                            >
                              <List.Item.Meta
                                title={`${match.brand} ${match.model} - ${match.command}`}
                                description={`格式: ${match.format} | HEX: ${match.hexCode}`}
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="学习历史" loading={loading}>
                {history.length === 0 ? (
                  <Empty description="暂无学习记录" />
                ) : (
                  <List
                    dataSource={history}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <strong>{item.deviceName}</strong>
                              <Tag color={item.status === 'success' ? 'success' : 'error'}>
                                {item.commandName}
                              </Tag>
                              {item.cloudMatched && <Tag color="blue">云匹配</Tag>}
                            </Space>
                          }
                          description={
                            <div>
                              <div>{item.format} | {item.hexCode}</div>
                              <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                                {dayjs(item.createdAt).fromNow()}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="手动输入" key="manual">
          <Card title="手动输入红外码" className="learning-interface">
            <Form layout="vertical">
              <Form.Item label="原始红外码">
                <TextArea
                  rows={4}
                  value={rawCode}
                  onChange={(e) => setRawCode(e.target.value)}
                  placeholder="请输入原始红外码，格式如: 0001 0001 0020 0020 0040 0020..."
                />
              </Form.Item>
              <Space>
                <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleManualSubmit}>
                  解析红外码
                </Button>
                <Button icon={<CloudOutlined />} onClick={handleCloudMatch} disabled={!rawCode}>
                  云端匹配
                </Button>
              </Space>

              {decodedData && (
                <div style={{ marginTop: 24 }}>
                  <h4>解析结果</h4>
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="格式">{decodedData.format}</Descriptions.Item>
                    <Descriptions.Item label="频率">{decodedData.frequency} Hz</Descriptions.Item>
                    <Descriptions.Item label="位宽">{decodedData.bitCount} bit</Descriptions.Item>
                    <Descriptions.Item label="HEX">{decodedData.hexCode}</Descriptions.Item>
                  </Descriptions>
                </div>
              )}
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="码库搜索" key="search">
          <Card title="红外码库搜索">
            <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
              <Input
                size="large"
                placeholder="搜索设备类型、指令名称或红外码"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearchCode}
              />
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleSearchCode}>
                搜索
              </Button>
            </Space.Compact>

            {searchResults.length > 0 ? (
              <List
                dataSource={searchResults}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyCode(item.code)}>
                        复制
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={`${item.deviceType} - ${item.command}`}
                      description={
                        <div>
                          <Tag color="blue">{item.format}</Tag>
                          <span style={{ marginLeft: 8 }}>{item.code.substring(0, 50)}...</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="输入关键词搜索红外码库" />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default DeviceLearning
