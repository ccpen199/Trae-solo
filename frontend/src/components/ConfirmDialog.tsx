import { useState } from 'react'
import { Modal, Form, Input, Typography } from 'antd'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  onCancel: () => void
  onConfirm: () => void
  requirePassword?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  onCancel,
  onConfirm,
  requirePassword,
}: ConfirmDialogProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')

  const expected = confirmText || '确认'
  const canConfirm = !requirePassword ? confirmInput === expected : true

  const handleConfirm = async () => {
    try {
      setLoading(true)
      if (requirePassword) {
        await form.validateFields()
      }
      await onConfirm()
    } catch {
      // validation error
    } finally {
      setLoading(false)
      setConfirmInput('')
      form.resetFields()
    }
  }

  const handleCancel = () => {
    setConfirmInput('')
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={handleCancel}
      onOk={handleConfirm}
      confirmLoading={loading}
      okButtonProps={{ disabled: !canConfirm }}
      okText="确认"
      cancelText="取消"
      destroyOnClose
    >
      {description && (
        <Typography.Paragraph type="danger" style={{ marginBottom: 16 }}>
          {description}
        </Typography.Paragraph>
      )}
      {!requirePassword && (
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          请输入 <strong>{expected}</strong> 以继续操作：
        </Typography.Paragraph>
      )}
      {!requirePassword ? (
        <Input
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={expected}
        />
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item
            label="请输入密码确认"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
