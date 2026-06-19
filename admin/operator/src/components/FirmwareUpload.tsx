import { useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Progress,
  Space,
  Typography,
  Alert,
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  theme,
  Divider,
  UploadFile,
  RcFile
} from 'antd'
import {
  UploadOutlined,
  InboxOutlined,
  CloudUploadOutlined,
  FileZipOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { UploadChangeParam, UploadProps } from 'antd/es/upload/interface'

const { Title, Text } = Typography
const { Dragger } = Upload
const { TextArea } = Input
const { useToken } = theme

interface FirmwareUploadProps {
  modelOptions: { label: string; value: string }[]
  onSuccess?: (info: {
    version: string
    model: string
    size: string
    md5: string
    description?: string
  }) => void
  onCancel?: () => void
}

interface UploadedFileInfo {
  name: string
  size: number
  md5: string
}

function FirmwareUpload({ modelOptions, onSuccess, onCancel }: FirmwareUploadProps) {
  const { token } = useToken()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const mockMD5 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const hash = (file.size + file.name + Date.now()).toString()
        let h1 = 0xdeadbeef ^ 0x41c6ce57
        for (let i = 0; i < hash.length; i++) {
          const ch = hash.charCodeAt(i)
          h1 = Math.imul(h1 ^ ch, 2654435761)
        }
        const hex = (h1 >>> 0).toString(16).padStart(8, '0')
        resolve(hex + hex.split('').reverse().join('') + hex + hex.split('').reverse().join(''))
      }, 200)
    })
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const beforeUpload: UploadProps['beforeUpload'] = async (file: RcFile) => {
    const isBinOrZip = /\.(bin|zip|hex|tar\.gz)$/i.test(file.name)
    if (!isBinOrZip) {
      return Upload.LIST_IGNORE
    }
    const isLt100M = file.size / 1024 / 1024 < 100
    if (!isLt100M) {
      return Upload.LIST_IGNORE
    }
    return false
  }

  const handleUploadChange = async (info: UploadChangeParam<UploadFile>) => {
    const { file } = info
    setFileList([file])
    if (file.originFileObj) {
      setUploading(true)
      setUploadProgress(0)

      const totalSteps = 20
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 80))
        setUploadProgress(Math.round((i / totalSteps) * 100)
      }

      const md5 = await mockMD5(file.originFileObj)
      setUploadedFile({
        name: file.name,
        size: file.size,
        md5
      })
      setUploading(false)

      const nameMatch = file.name.match(/v?(\d+\.\d+\.\d+)/) || file.name.match(/(\d+\.\d+)/)
      if (nameMatch) {
        form.setFieldsValue({ version: nameMatch[0].startsWith('v') ? nameMatch[0] : 'v' + nameMatch[0] })
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!uploadedFile) return
      setSubmitting(true)
      setTimeout(() => {
        setSubmitting(false)
        onSuccess?.({
          version: values.version,
          model: values.model,
          size: formatSize(uploadedFile.size),
          md5: uploadedFile.md5,
          description: values.description
        })
      }, 600)
    } catch (_) {}
  }

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="固件上传说明"
        description={
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            <Text>支持格式：.bin / .zip / .hex / .tar.gz，单文件不超过 100MB</Text>
            <Text>建议固件文件名包含版本号，例如：firmware-RO-PRO-500-v2.3.5.bin</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      {!uploadedFile ? (
        <Dragger
          name="file"
          multiple={false}
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          accept=".bin,.zip,.hex,.tar.gz"
          showUploadList={false}
          disabled={uploading}
          style={{ marginBottom: 16 }}
        >
          {uploading ? (
            <div style={{ padding: '20px 0' }}>
              <CloudUploadOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
              <p className="ant-upload-text" style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 16 }}>正在上传固件...</Text>
              </p>
              <div style={{ width: '100%', maxWidth: 360, margin: '12px auto 0' }}>
                <Progress percent={uploadProgress} status="active" />
              </div>
              <p style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {fileList[0]?.name} · {formatSize(fileList[0]?.size || 0)}
                </Text>
              </p>
            </div>
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#52c41a', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">
                <Text strong style={{ fontSize: 16 }}>点击或拖拽固件文件到此处上传</Text>
              </p>
              <p className="ant-upload-hint" style={{ marginTop: 8 }}>
                <Text type="secondary">
                  支持 .bin .zip .hex .tar.gz 格式，单文件 ≤ 100MB
                </Text>
              </p>
              <div style={{ marginTop: 12 }}>
                <Button type="primary" icon={<UploadOutlined />}>
                  选择文件
                </Button>
              </div>
            </>
          )}
        </Dragger>
      ) : (
        <Card
          bordered={false}
          style={{
            borderRadius: 10,
            background: '#f6ffed',
            border: `1px solid #52c41a30`,
            marginBottom: 16
          }}
        >
          <Row align="middle" gutter={[12, 12]}>
            <Col xs={24} sm={4} md={3} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#52c41a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: 28
                }}
              >
                <FileZipOutlined />
              </div>
            </Col>
            <Col xs={24} sm={16} md={17}>
              <Space direction="vertical" size={4}>
                <Space>
                  <Text strong>{uploadedFile.name}</Text>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    上传成功
                  </Tag>
                </Space>
                <Space size={16} wrap>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FileTextOutlined /> {formatSize(uploadedFile.size)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    MD5: <Text code style={{ fontSize: 11 }}>{uploadedFile.md5.slice(0, 8)}...{uploadedFile.md5.slice(-8)}</Text>
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col xs={24} sm={4} md={4} style={{ textAlign: 'right' }}>
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setFileList([])
                  setUploadedFile(null)
                  setUploadProgress(0)
                }}
              >
                移除
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      <Form form={form} layout="vertical" disabled={!uploadedFile}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="version"
              label="固件版本号"
              rules={[
                { required: true, message: '请输入版本号' },
                { pattern: /^v?\d+(\.\d+){1,2}$/, message: '格式如 v2.3.5 或 2.3' }
              ]}
            >
              <Input
                prefix={<FileZipOutlined style={{ color: token.colorTextSecondary }} />
                placeholder="例如：v2.3.5"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="model"
              label="适用设备型号"
              rules={[{ required: true, message: '请选择型号' }]}
            >
              <Select
                placeholder="请选择设备型号"
                options={modelOptions}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="版本说明 / 更新日志">
          <TextArea
            rows={4}
            placeholder="请描述此版本的更新内容、修复的问题、新增功能等信息..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '8px 0 16px' }} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {onCancel && (
          <Button onClick={onCancel}>
            取消
          </Button>
        )}
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleSubmit}
          loading={submitting || uploading}
          disabled={!uploadedFile}
        >
          确认发布固件
        </Button>
      </div>
    </div>
  )
}

export default FirmwareUpload
