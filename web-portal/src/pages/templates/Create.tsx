import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, message, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { templateApi } from '../../services/api';

const { TextArea } = Input;

const TemplateCreate: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit && id) {
      fetchTemplate(parseInt(id));
    }
  }, [id]);

  const fetchTemplate = async (templateId: number) => {
    try {
      const result = await templateApi.getById(templateId);
      const data = result.data;
      form.setFieldsValue({
        templateName: data.templateName,
        templateContent: data.templateContent,
        templateType: data.templateType,
        signName: data.signName,
      });
      updatePreviewVariables(data.templateContent);
    } catch (error) {
      console.error('获取模板详情失败:', error);
    }
  };

  const updatePreviewVariables = (content: string) => {
    const regex = /\{(\w+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const vars: Record<string, string> = {};
    variables.forEach((v) => {
      vars[v] = `[${v}]`;
    });
    setPreviewVariables(vars);
    updatePreviewContent(content, vars);
  };

  const updatePreviewContent = (content: string, variables: Record<string, string>) => {
    let preview = content;
    for (const [key, value] of Object.entries(variables)) {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    setPreviewContent(preview);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updatePreviewVariables(e.target.value);
  };

  const handlePreviewVariableChange = (key: string, value: string) => {
    const newVars = { ...previewVariables, [key]: value };
    setPreviewVariables(newVars);
    const content = form.getFieldValue('templateContent') || '';
    updatePreviewContent(content, newVars);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        await templateApi.update(parseInt(id), values);
        message.success('模板更新成功');
      } else {
        await templateApi.create(values);
        message.success('模板创建成功');
      }
      navigate('/templates');
    } catch (error) {
      console.error('保存模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/templates')}
            />
            {isEdit ? '编辑模板' : '创建模板'}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            templateType: '通知',
          }}
        >
          <Form.Item
            name="templateName"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            name="templateType"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select placeholder="请选择模板类型">
              <Select.Option value="验证码">验证码</Select.Option>
              <Select.Option value="通知">通知</Select.Option>
              <Select.Option value="营销">营销</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="signName"
            label="短信签名"
          >
            <Input placeholder="请输入短信签名（选填）" />
          </Form.Item>

          <Form.Item
            name="templateContent"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
            help="使用 {变量名} 表示动态变量，例如：尊敬的 {name}，您的验证码是 {code}"
          >
            <TextArea
              rows={6}
              placeholder="请输入模板内容，使用 {变量名} 表示动态变量"
              onChange={handleContentChange}
            />
          </Form.Item>

          {Object.keys(previewVariables).length > 0 && (
            <Card title="预览变量设置" size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {Object.entries(previewVariables).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{`{${key}}`}:</span>
                    <Input
                      value={value}
                      onChange={(e) => handlePreviewVariableChange(key, e.target.value)}
                      placeholder={`输入 ${key}`}
                      style={{ width: 150 }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {previewContent && (
            <Card title="内容预览" size="small" style={{ marginBottom: 16 }}>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {previewContent}
              </div>
            </Card>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存
              </Button>
              <Button onClick={() => navigate('/templates')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TemplateCreate;
