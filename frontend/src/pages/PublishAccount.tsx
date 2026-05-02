import React from 'react';
import { Card, Form, Input, Select, InputNumber, Button, message, Row, Col } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { accountApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const PublishAccount: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await accountApi.create(values);
      return response.data;
    },
    onSuccess: () => {
      message.success('账号发布成功，等待审核');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      navigate('/accounts');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '发布失败');
    },
  });

  const handleSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  return (
    <Card title="发布游戏账号" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          gameName: '原神',
          accountLevel: 1,
        }}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="title"
              label="账号标题"
              rules={[
                { required: true, message: '请输入账号标题' },
                { max: 100, message: '标题不能超过100个字符' },
              ]}
            >
              <Input placeholder="例如：原神 50级成品号 五星多" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameName"
              label="游戏名称"
              rules={[{ required: true, message: '请选择游戏名称' }]}
            >
              <Select placeholder="请选择游戏">
                <Option value="原神">原神</Option>
                <Option value="王者荣耀">王者荣耀</Option>
                <Option value="和平精英">和平精英</Option>
                <Option value="英雄联盟">英雄联盟</Option>
                <Option value="崩坏：星穹铁道">崩坏：星穹铁道</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameServer"
              label="服务器/区服"
            >
              <Input placeholder="例如：官服、QQ区、艾欧尼亚等" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="accountLevel"
              label="账号等级"
            >
              <InputNumber
                min={1}
                placeholder="请输入账号等级"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="price"
              label="售价（元）"
              rules={[
                { required: true, message: '请输入售价' },
                { type: 'number', min: 0, message: '售价必须大于等于0' },
              ]}
            >
              <InputNumber
                min={0}
                precision={2}
                placeholder="请输入售价"
                style={{ width: '100%' }}
                addonBefore="¥"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="originalPrice"
              label="原价（元）"
            >
              <InputNumber
                min={0}
                precision={2}
                placeholder="选填，用于显示折扣"
                style={{ width: '100%' }}
                addonBefore="¥"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="账号描述"
          rules={[{ max: 2000, message: '描述不能超过2000个字符' }]}
        >
          <TextArea
            rows={6}
            placeholder="请详细描述账号信息，例如：角色列表、装备情况、充值记录等"
          />
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button
              style={{ marginRight: 12 }}
              onClick={() => navigate('/accounts')}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              size="large"
            >
              发布账号
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PublishAccount;
