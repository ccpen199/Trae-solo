import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Upload,
  message,
  Space,
  Row,
  Col,
  Progress,
  Tag,
  Alert
} from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import CryptoJS from 'crypto-js'
import { createViolation, getViolationTypes } from '@/api/modules/violation'
import { uploadEvidence } from '@/api/modules/upload'
import type { ViolationReportRequest } from '@/types'

const { TextArea } = Input
const { RangePicker } = DatePicker

interface EvidenceFile extends UploadFile {
  hash?: string
  progress?: number
}

export default function ViolationReport() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [types, setTypes] = useState<Array<{ code: string; name: string }>>([])
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    address: string
  } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [fileList, setFileList] = useState<EvidenceFile[]>([])
  const [evidenceHash, setEvidenceHash] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  const fetchTypes = async () => {
    try {
      const res = await getViolationTypes()
      setTypes(res)
    } catch (error: any) {
      message.error(error.message || '获取违法类型失败')
    }
  }

  useEffect(() => {
    fetchTypes()
    form.setFieldsValue({
      violationTime: dayjs()
    })
  }, [form])

  const getLocation = () => {
    setLocationLoading(true)
    if (!navigator.geolocation) {
      message.error('您的浏览器不支持定位功能')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({
          latitude,
          longitude,
          address: `北纬 ${latitude.toFixed(6)}, 东经 ${longitude.toFixed(6)}`
        })
        form.setFieldsValue({
          location: `北纬 ${latitude.toFixed(6)}, 东经 ${longitude.toFixed(6)}`
        })
        setLocationLoading(false)
        message.success('定位成功')
      },
      (error) => {
        let msg = '定位失败'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = '用户拒绝了定位请求'
            break
          case error.POSITION_UNAVAILABLE:
            msg = '位置信息不可用'
            break
          case error.TIMEOUT:
            msg = '定位超时'
            break
        }
        message.error(msg)
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const calculateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
        const hash = CryptoJS.SHA256(wordArray).toString()
        resolve(hash)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const calculateCombinedHash = async (files: EvidenceFile[]) => {
    const validFiles = files.filter((f) => f.status === 'done' && f.hash)
    if (validFiles.length === 0) {
      setEvidenceHash('')
      return
    }

    const sortedHashes = validFiles.map((f) => f.hash).sort()
    const combinedHash = CryptoJS.SHA256(sortedHashes.join('|')).toString()
    setEvidenceHash(combinedHash)
  }

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      message.error('只能上传图片或视频文件')
      return Upload.LIST_IGNORE
    }

    const isLt50M = file.size / 1024 / 1024 < 50
    if (!isLt50M) {
      message.error('文件大小不能超过 50MB')
      return Upload.LIST_IGNORE
    }

    return false
  }

  const handleFileChange = async ({ fileList: newFileList }: { fileList: EvidenceFile[] }) => {
    const updatedList = [...newFileList]

    for (let i = 0; i < updatedList.length; i++) {
      const file = updatedList[i]
      if (file.originFileObj && !file.hash) {
        file.hash = await calculateFileHash(file.originFileObj)
      }
    }

    setFileList(updatedList)
    calculateCombinedHash(updatedList)
  }

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []
    const pendingFiles = fileList.filter((f) => f.originFileObj && f.status !== 'done')

    if (pendingFiles.length === 0) {
      return fileList.filter((f) => f.status === 'done').map((f) => f.response?.url || '')
    }

    setUploading(true)

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i]
      if (!file.originFileObj) continue

      try {
        const res = await uploadEvidence(file.originFileObj, 'violation', (percent) => {
          const index = fileList.findIndex((f) => f.uid === file.uid)
          if (index !== -1) {
            const updated = [...fileList]
            updated[index] = { ...updated[index], percent }
            setFileList(updated)
          }
        })

        uploadedUrls.push(res.url)

        const index = fileList.findIndex((f) => f.uid === file.uid)
        if (index !== -1) {
          const updated = [...fileList]
          updated[index] = {
            ...updated[index],
            status: 'done',
            response: res,
            url: res.url
          }
          setFileList(updated)
        }
      } catch (error: any) {
        message.error(`${file.name} 上传失败: ${error.message}`)
        throw error
      }
    }

    setUploading(false)
    return uploadedUrls
  }

  const handleSubmit = async (values: any) => {
    if (fileList.length === 0) {
      message.error('请至少上传一张证据图片')
      return
    }

    setLoading(true)
    try {
      const urls = await uploadFiles()

      const data: ViolationReportRequest = {
        violationType: values.violationType,
        violationTime: values.violationTime.format('YYYY-MM-DD HH:mm:ss'),
        location: values.location,
        description: values.description,
        latitude: location?.latitude,
        longitude: location?.longitude
      }

      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      formData.append('evidenceHash', evidenceHash)
      urls.forEach((url) => formData.append('evidenceUrls', url))

      const response = await createViolation(data as any)
      message.success('举报提交成功')
      navigate(`/violation/detail/${response.id}`)
    } catch (error: any) {
      message.error(error.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  )

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/violation/list')}
          >
            返回列表
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">违法举报</h1>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="violationType"
                label="违法类型"
                rules={[{ required: true, message: '请选择违法类型' }]}
              >
                <Select
                  placeholder="请选择违法类型"
                  size="large"
                  prefix={<CameraOutlined />}
                >
                  {types.map((type) => (
                    <Select.Option key={type.code} value={type.code}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="violationTime"
                label="违法时间"
                rules={[{ required: true, message: '请选择违法时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="请选择违法时间"
                  prefix={<ClockCircleOutlined />}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="违法地点"
            rules={[{ required: true, message: '请输入违法地点' }]}
            extra="点击右侧按钮可自动获取当前位置"
          >
            <Input
              size="large"
              placeholder="请输入违法地点或点击右侧按钮定位"
              prefix={<EnvironmentOutlined />}
              addonAfter={
                <Button
                  type="text"
                  icon={<EnvironmentOutlined />}
                  loading={locationLoading}
                  onClick={getLocation}
                >
                  定位
                </Button>
              }
            />
          </Form.Item>

          {location && (
            <Alert
              message={`GPS坐标: ${location.address}`}
              type="success"
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item
            label="证据上传"
            required
            extra="支持图片和视频，单文件不超过50MB，最多上传9个文件"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={beforeUpload}
              multiple
              accept="image/*,video/*"
              maxCount={9}
            >
              {fileList.length >= 9 ? null : uploadButton}
            </Upload>
          </Form.Item>

          {fileList.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {fileList.map((file) => (
                  <Tag key={file.uid} color="blue">
                    {file.name}: {file.hash?.substring(0, 16)}...
                  </Tag>
                ))}
              </div>
              {uploading && (
                <Progress
                  percent={Math.round(
                    (fileList.filter((f) => f.status === 'done').length / fileList.length) * 100
                  )}
                  status="active"
                />
              )}
            </div>
          )}

          {evidenceHash && (
            <Alert
              message={
                <Space>
                  <SafetyCertificateOutlined />
                  <span>证据哈希值 (SHA-256): {evidenceHash}</span>
                </Space>
              }
              type="info"
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item
            name="description"
            label="违法描述"
            rules={[{ max: 500, message: '描述不能超过500字' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述违法情况（选填）"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading || uploading}
              >
                提交举报
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/violation/list')}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
