import React, { useEffect, useState } from 'react';
import { Form, Select, Button, Card, Input, message, Space, Divider, Tag, Descriptions } from 'antd';
import { SendOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { templateApi, smsApi } from '../../services/api';

const { TextArea } = Input;

const SmsSend: React.FC = () => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const result = await templateApi.getList({ page: 1, pageSize: 100, status: 2 });
      setTemplates(result.data.list);
    } catch (error) {
      console.error('获取模板列表失败:', error);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);
    if (template) {
      form.setFieldsValue({
        templateContent: template.templateContent,
        variables: template.variables || [],
      });
    }
  };

  const handlePhonesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const phones = value
      .split(/[\n,\s，]/)
      .map((p) => p.trim())
      .filter((p) => /^1[3-9]\d{9}$/.test(p));
    const uniquePhones = [...new Set(phones)];
    setPhoneNumbers(uniquePhones);
  };

  const onFinish = async (values: any) => {
    if (phoneNumbers.length === 0) {
      message.error('请输入至少一个有效的手机号');
      return;
    }

    if (!values.templateId) {
      message.error('请选择短信模板');
      return;
    }

    setLoading(true);
    try {
      const variables: Record<string, string> = {};
      if (values.variables) {
        values.variables.forEach((v: { key: string; value: string }) => {
          if (v.key && v.value) {
            variables[v.key] = v.value;
          }
        });
      }

      const result = await smsApi.send({
        templateId: values.templateId,
        phoneNumbers,
        variables,
      });

      message.success(
        `短信已加入发送队列，共 ${result.data.totalCount} 条，${
          result.data.invalidCount > 0 ? `无效号码 ${result.data.invalidCount} 个` : ''
        }`
      );
    } catch (error) {
      console.error('发送短信失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const templateOptions = templates.map((t) => ({
    label: `${t.templateName} (${t.templateCode})`,
    value: t.id,
  }));

  const defaultVariables = selectedTemplate?.variables?.map((v: string) => ({
    key: v,
    value: '',
  })) || [];

  return (
    <div>
      <Card title="发送短信">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            variables: defaultVariables,
          }}
        >
          <Form.Item
            name="templateId"
            label="选择模板"
            rules={[{ required: true, message: '请选择短信模板' }]}
          >
            <Select
              placeholder="请选择已激活的短信模板"
              options={templateOptions}
              onChange={handleTemplateChange}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          {selectedTemplate && (
            <Card title="模板信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="模板类型">
                  <Tag color="blue">{selectedTemplate.templateType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="签名">{selectedTemplate.signName || '无'}</Descriptions.Item>
                <Descriptions.Item label="模板内容" span={2}>
                  <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    {selectedTemplate.templateContent}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {selectedTemplate?.variables?.length > 0 && (
            <Form.List name="variables">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        initialValue={defaultVariables[index]?.key}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="变量名" style={{ width: 150 }} disabled />
                      </Form.Item>
                      <span>=</span>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入变量值' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="变量值" style={{ width: 200 }} />
                      </Form.Item>
                    </Space>
                  ))}
                </>
              )}
            </Form.List>
          )}

          <Divider />

          <Form.Item
            name="phoneNumbers"
            label="目标手机号"
            help="支持多个手机号，用换行、逗号或空格分隔"
            required
          >
            <TextArea
              rows={6}
              placeholder="请输入手机号，多个号码用换行、逗号或空格分隔&#10;例如：&#10;13800138000&#10;13800138001, 13800138002"
              onChange={handlePhonesChange}
            />
          </Form.Item>

          {phoneNumbers.length > 0 && (
            <Card
              title={`已识别手机号 (${phoneNumbers.length} 个)`}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {phoneNumbers.slice(0, 50).map((phone, index) => (
                  <Tag key={index} color="blue">{phone}</Tag>
                ))}
                {phoneNumbers.length > 50 && (
                  <Tag color="default">+{phoneNumbers.length - 50} 个</Tag>
                )}
              </div>
            </Card>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              size="large"
            >
              发送短信
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SmsSend;
