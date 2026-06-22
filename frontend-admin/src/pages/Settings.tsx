import React from 'react';
import { Card, Form, Input, Button, message } from 'antd';

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    message.success('设置已保存');
  };

  return (
    <div>
      <Card title="系统设置">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            platformName: '配送运营管理后台',
            maxDispatchDistance: 5000,
            defaultCreditScore: 100,
            freezeCreditThreshold: 60,
          }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item name="platformName" label="平台名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="maxDispatchDistance" label="最大派单距离(米)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="defaultCreditScore" label="默认信用分">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="freezeCreditThreshold" label="冻结信用分阈值">
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存设置</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
