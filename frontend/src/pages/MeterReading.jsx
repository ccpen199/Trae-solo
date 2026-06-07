import React, { useState, useEffect, useRef } from 'react'
import { Row, Col, Card, Button, Tabs, Form, InputNumber, DatePicker, message, List, Tag, Image, Modal, Progress } from 'antd'
import {
  CameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { meterReadingAPI } from '../api'
import useUserStore from '../store/userStore'
import dayjs from 'dayjs'

function MeterReading() {
  const { meter, profile } = useUserStore()
  const [activeTab, setActiveTab] = useState('ocr')
  const [currentMeter, setCurrentMeter] = useState(null)
  const [readings, setReadings] = useState([])
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrImage, setOcrImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)
  const [manualForm] = Form.useForm()
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      let current = null
      let history = { list: [] }
      
      try {
        current = await meterReadingAPI.getCurrent()
        console.log('表具API返回:', current)
      } catch (err) {
        console.error('加载当前表具失败:', err)
      }
      
      try {
        history = await meterReadingAPI.getMyReadings({ pageSize: 10 })
        console.log('历史读数API返回:', history)
      } catch (err) {
        console.error('加载历史读数失败:', err)
      }
      
      setCurrentMeter(current)
      setReadings(history.list || history.data || [])
      
      if (!current?.meter && !meter) {
        message.error('未找到表具信息')
      }
    } catch (err) {
      console.error('加载数据失败:', err)
      message.error('加载表具信息失败')
    }
  }

  const handleOCRUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const result = await meterReadingAPI.submitOCR(formData)
      setOcrResult(result)
      setOcrImage(result.image_path)
      setConfirmModal(true)
      message.success('OCR识别成功，请确认读数')
    } catch (err) {
      console.error('OCR失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReading = async () => {
    if (!ocrResult) return
    try {
      await meterReadingAPI.confirmReading(ocrResult.id, { reading_value: ocrResult.reading_value })
      message.success('读数确认成功')
      setConfirmModal(false)
      setOcrResult(null)
      setOcrImage(null)
      loadData()
    } catch (err) {
      console.error('确认失败:', err)
    }
  }

  const handleManualSubmit = async (values) => {
    try {
      await meterReadingAPI.submitManual({
        reading_value: values.reading_value,
        reading_date: values.reading_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
      })
      message.success('人工报数提交成功')
      manualForm.resetFields()
      loadData()
    } catch (err) {
      console.error('提交失败:', err)
    }
  }

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'orange', text: '待审核' },
      verified: { color: 'green', text: '已审核' },
      rejected: { color: 'red', text: '已驳回' }
    }
    return map[status] || { color: 'default', text: status }
  }

  const getReadingTypeTag = (type) => {
    const map = {
      ocr: { color: 'blue', text: 'OCR识别' },
      manual: { color: 'purple', text: '人工录入' },
      automatic: { color: 'default', text: '系统自动' }
    }
    return map[type] || { color: 'default', text: type }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <CameraOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          燃气报数
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          通过OCR拍照识别或人工录入，快速完成燃气表读数上报
        </p>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card className="card-shadow">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                { 
                  key: 'ocr', 
                  label: (
                    <span>
                      <CameraOutlined /> OCR拍照识别
                    </span>
                  ) 
                },
                { 
                  key: 'manual', 
                  label: (
                    <span>
                      <EditOutlined /> 人工补录
                    </span>
                  ) 
                },
                { 
                  key: 'history', 
                  label: (
                    <span>
                      <HistoryOutlined /> 历史记录
                    </span>
                  ) 
                }
              ]}
            />

            {activeTab === 'ocr' && (
              <div>
                <div 
                  className="upload-card"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginBottom: 24 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleOCRUpload}
                  />
                  <div className="upload-icon">
                    {loading ? <ReloadOutlined spin /> : <CameraOutlined />}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    点击上传燃气表照片
                  </div>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    支持 JPG、PNG 格式，文件大小不超过 5MB
                  </div>
                </div>

                <div className="section-card" style={{ background: '#f5f7fa' }}>
                  <div className="section-title">
                    <InfoCircleOutlined style={{ color: '#faad14' }} />
                    拍照指引
                  </div>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} md={6}>
                      <div className="guide-step">
                        <span className="guide-step-number">1</span>
                        保持表具清洁，无遮挡
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="guide-step">
                        <span className="guide-step-number">2</span>
                        光线充足，避免反光
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="guide-step">
                        <span className="guide-step-number">3</span>
                        正对表具，保持水平
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="guide-step">
                        <span className="guide-step-number">4</span>
                        数字区域占满画面
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}

            {activeTab === 'manual' && (
              <Form
                form={manualForm}
                onFinish={handleManualSubmit}
                layout="vertical"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="reading_value"
                      label="燃气表读数 (m³)"
                      rules={[
                        { required: true, message: '请输入读数' },
                        { type: 'number', min: currentMeter?.meter?.last_read_value || 0, 
                          message: `读数不能小于上次读数 ${currentMeter?.meter?.last_read_value || 0}` }
                      ]}
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        min={0} 
                        step={0.1}
                        placeholder={`上次读数：${currentMeter?.meter?.last_read_value || 0}`}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="reading_date"
                      label="读数日期"
                      initialValue={dayjs()}
                    >
                      <DatePicker style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="section-card" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <InfoCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>当前表具信息</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        表具编号：{meter?.meter_no || currentMeter?.meter?.meter_no || '暂无'} · 
                        安装位置：{currentMeter?.meter?.location || '暂无'} · 
                        上次读数：{currentMeter?.meter?.last_read_value || 0} m³
                      </div>
                    </div>
                  </div>
                </div>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button type="primary" htmlType="submit" size="large" loading={loading}>
                    提交报数
                  </Button>
                </Form.Item>
              </Form>
            )}

            {activeTab === 'history' && (
              <List
                dataSource={readings}
                renderItem={(item) => (
                  <div className="list-item-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Tag color={getReadingTypeTag(item.reading_type).color}>
                            {getReadingTypeTag(item.reading_type).text}
                          </Tag>
                          <Tag color={getStatusTag(item.status).color}>
                            {getStatusTag(item.status).text}
                          </Tag>
                          <span style={{ fontSize: 13, color: '#999' }}>
                            {item.billing_cycle} 账期
                          </span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff', marginBottom: 8 }}>
                          {item.reading_value} <span style={{ fontSize: 14, color: '#999' }}>m³</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          读数日期：{item.reading_date} · 表具：{item.meter_no}
                        </div>
                        {item.ocr_result && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                            OCR置信度：{(item.ocr_result.confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      {item.image_path && (
                        <Image
                          width={80}
                          height={80}
                          src={item.image_path}
                          style={{ borderRadius: 4 }}
                        />
                      )}
                    </div>
                  </div>
                )}
                locale={{ emptyText: '暂无报数记录' }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <div className="section-card">
            <div className="section-title">
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              当前表具信息
            </div>
            {currentMeter?.meter || meter ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>表具编号</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{(currentMeter?.meter?.meter_no) || (meter?.meter_no)}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>安装位置</div>
                  <div>{(currentMeter?.meter?.location) || (meter?.location)}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>安装日期</div>
                  <div>{(currentMeter?.meter?.install_date) || (meter?.install_date)}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>上次读数</div>
                  <div className="meter-display">
                    {((currentMeter?.meter?.last_read_value) || (meter?.last_read_value))?.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>表具状态</div>
                  <Tag color={(currentMeter?.meter?.status || meter?.status) === 'normal' ? 'green' : 'orange'}>
                    {(currentMeter?.meter?.status || meter?.status) === 'normal' ? '正常' : '故障'}
                  </Tag>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                暂未绑定表具信息
              </div>
            )}
          </div>

          <div className="section-card">
            <div className="section-title">
              <InfoCircleOutlined style={{ color: '#faad14' }} />
              用气须知
            </div>
            <div style={{ fontSize: 13, lineHeight: 2, color: '#666' }}>
              <p style={{ marginBottom: 8 }}>• 每月1-5日为抄表期，请在此期间完成报数</p>
              <p style={{ marginBottom: 8 }}>• 逾期未报数将按预估用量计费，次月多退少补</p>
              <p style={{ marginBottom: 8 }}>• OCR识别后请仔细核对读数，如有误可手动修改</p>
              <p>• 如有疑问请拨打客服热线：400-888-0001</p>
            </div>
          </div>
        </Col>
      </Row>

      <Modal
        title="OCR识别结果确认"
        open={confirmModal}
        onOk={handleConfirmReading}
        onCancel={() => setConfirmModal(false)}
        okText="确认无误"
        cancelText="重新拍照"
        width={600}
      >
        {ocrResult && (
          <div>
            {ocrImage && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Image 
                  width={300} 
                  src={ocrImage} 
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>识别读数</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {ocrResult.ocr_result?.digits?.map((d, idx) => (
                  <div key={idx} className="ocr-digit">
                    <div className="digit">{d.digit}</div>
                    <div className="confidence">{(d.confidence * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Progress 
                type="dashboard" 
                percent={(ocrResult.ocr_result?.confidence * 100).toFixed(0)} 
                width={100}
              />
              <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                识别置信度
              </div>
            </div>

            <div style={{ background: '#f5f7fa', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666' }}>表具编号</span>
                <span>{ocrResult.meter_no}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666' }}>读数日期</span>
                <span>{ocrResult.reading_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>最终读数</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                  {ocrResult.reading_value} m³
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MeterReading
