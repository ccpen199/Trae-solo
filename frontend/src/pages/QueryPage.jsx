import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Space, Upload, Checkbox } from 'antd'
import { SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { generateReport } from '../api'

function QueryPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [hasAuth, setHasAuth] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values) => {
    if (!hasAuth) {
      message.error('请先上传企业授权文件')
      return
    }

    setLoading(true)
    try {
      const res = await generateReport({
        ...values,
        authFile: 'uploaded_auth_file'
      })
      
      if (res.data.success) {
        message.success('报告生成成功')
        navigate(`/reports/${res.data.data.reportNo}`)
      } else {
        message.error(res.data.error || '报告生成失败')
      }
    } catch (error) {
      message.error(error.response?.data?.error || '报告生成失败')
    } finally {
      setLoading(false)
    }
  }

  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => {
      onSuccess('ok')
      setHasAuth(true)
      message.success('授权文件上传成功')
    }, 500)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="企业征信查询" extra={<span>请输入企业信息进行查询</span>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            accountManager: 'Manager_A'
          }}
        >
          <Form.Item
            label="统一社会信用代码"
            name="creditCode"
            rules={[
              { required: true, message: '请输入统一社会信用代码' },
              { pattern: /^[0-9A-Z]{18}$/, message: '请输入有效的18位统一社会信用代码' }
            ]}
          >
            <Input placeholder="请输入18位统一社会信用代码" size="large" />
          </Form.Item>

          <Form.Item
            label="客户经理"
            name="accountManager"
            rules={[{ required: true, message: '请输入客户经理姓名' }]}
          >
            <Input placeholder="请输入客户经理姓名" size="large" />
          </Form.Item>

          <Form.Item
            label="查询用途"
            name="queryPurpose"
            rules={[{ required: true, message: '请输入查询用途' }]}
          >
            <Input placeholder="如：贷前审查、风险排查等" size="large" />
          </Form.Item>

          <Form.Item label="企业授权文件">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                customRequest={dummyRequest}
                showUploadList={false}
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>点击上传授权文件</Button>
              </Upload>
              <Checkbox checked={hasAuth} onChange={(e) => setHasAuth(e.target.checked)}>
                我确认已获得企业授权
              </Checkbox>
              {!hasAuth && (
                <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                  * 缺少授权文件将无法生成报告
                </span>
              )}
            </Space>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<SearchOutlined />}
              style={{ width: '100%' }}
            >
              生成征信报告
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <h4>测试数据：</h4>
          <p>统一社会信用代码示例：91310101MA1B2C3D4</p>
          <p>系统会自动生成模拟数据用于演示</p>
        </div>
      </Card>
    </div>
  )
}

export default QueryPage
