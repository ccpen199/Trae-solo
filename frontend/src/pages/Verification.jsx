import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  App,
  Descriptions,
  Tag,
  Divider,
  Row,
  Col,
} from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { verificationAPI } from '../services/api.js';

const { TextArea } = Input;

export default function Verification() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (values) => {
    try {
      setLoading(true);
      const response = await verificationAPI.verify({
        ...values,
        caller: 'web_admin',
      });
      
      if (response.success) {
        setResult(response.data);
        message.success('核验完成');
      }
    } catch (error) {
      if (error.code === 'HIGH_FREQUENCY') {
        message.warning('调用频率过高，请稍后重试');
      } else {
        message.error(error.message || '核验失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (verificationResult) => {
    switch (verificationResult) {
      case 'valid':
        return <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
      case 'revoked':
        return <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
      case 'expired':
        return <WarningOutlined style={{ fontSize: 48, color: '#faad14' }} />;
      default:
        return <CloseCircleOutlined style={{ fontSize: 48, color: '#999' }} />;
    }
  };

  const getResultText = (verificationResult) => {
    const texts = {
      valid: '证照有效',
      revoked: '证照已吊销',
      expired: '证照已过期',
      not_found: '证照不存在',
      invalid: '核验异常',
    };
    return texts[verificationResult] || verificationResult;
  };

  const getResultColor = (verificationResult) => {
    const colors = {
      valid: 'green',
      revoked: 'red',
      expired: 'orange',
      not_found: 'default',
      invalid: 'gray',
    };
    return colors[verificationResult] || 'default';
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>证照核验</h2>

      <Row gutter={24}>
        <Col xs={24} md={10}>
          <Card title="输入核验信息">
            <Form form={form} layout="vertical" onFinish={handleVerify}>
              <Form.Item
                name="certificate_number"
                label="证照编号"
                rules={[{ required: true, message: '请输入证照编号' }]}
              >
                <Input placeholder="请输入证照编号" />
              </Form.Item>
              <Form.Item
                name="purpose"
                label="核验用途"
                rules={[{ required: true, message: '请输入核验用途' }]}
              >
                <Input placeholder="例如：企业资质审核、入职背景调查等" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />} block>
                  开始核验
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title="核验结果">
            {result ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  {getResultIcon(result.verification_result)}
                  <div style={{ marginTop: 16 }}>
                    <Tag color={getResultColor(result.verification_result)} style={{ fontSize: 16, padding: '4px 16px' }}>
                      {getResultText(result.verification_result)}
                    </Tag>
                  </div>
                </div>

                <Divider />

                {result.details && (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="证照编号">{result.certificate_number}</Descriptions.Item>
                    {result.details.template_name && (
                      <Descriptions.Item label="模板名称">{result.details.template_name}</Descriptions.Item>
                    )}
                    {result.details.applicant_name && (
                      <Descriptions.Item label="持证人">{result.details.applicant_name}</Descriptions.Item>
                    )}
                    {result.details.issuing_authority && (
                      <Descriptions.Item label="签发机关">{result.details.issuing_authority}</Descriptions.Item>
                    )}
                    {result.details.expiry_date && (
                      <Descriptions.Item label="有效期至">
                        {dayjs(result.details.expiry_date).format('YYYY-MM-DD HH:mm')}
                      </Descriptions.Item>
                    )}
                    {result.details.message && (
                      <Descriptions.Item label="备注">{result.details.message}</Descriptions.Item>
                    )}
                    {result.details.certificate_data && (
                      <Descriptions.Item label="证照数据">
                        <pre style={{ margin: 0, fontSize: 12, maxHeight: 150, overflow: 'auto' }}>
                          {JSON.stringify(result.details.certificate_data, null, 2)}
                        </pre>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
                请输入证照编号进行核验
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
