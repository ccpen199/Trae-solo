import React, { useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, SyncOutlined } from '@ant-design/icons';
import { message } from '../utils/message';

interface SettingRow {
  key: string;
  name: string;
  value: string;
  scope: string;
  status: 'enabled' | 'disabled';
}

const initialRows: SettingRow[] = [
  { key: 'freight-match', name: '智能撮合策略', value: '价格优先 + 时效优先', scope: '货源匹配', status: 'enabled' },
  { key: 'settlement-risk', name: '结算风控阈值', value: '单笔 50000 元', scope: '在线结算', status: 'enabled' },
  { key: 'carrier-audit', name: '承运商自动审核', value: '白名单企业直通', scope: '运力管理', status: 'enabled' },
  { key: 'tracking-alert', name: '轨迹异常告警', value: '偏航 5 公里', scope: '在途监控', status: 'disabled' },
];

const Settings: React.FC = () => {
  const [rows, setRows] = useState(initialRows);
  const [form] = Form.useForm();

  const columns: ColumnsType<SettingRow> = [
    { title: '配置项', dataIndex: 'name', key: 'name' },
    { title: '作用域', dataIndex: 'scope', key: 'scope', width: 140 },
    { title: '当前值', dataIndex: 'value', key: 'value', width: 220 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <Tag color={status === 'enabled' ? 'success' : 'default'}>
          {status === 'enabled' ? '已启用' : '已停用'}
        </Tag>
      ),
    },
  ];

  const handleSave = async () => {
    await form.validateFields();
    message.success('系统配置已保存');
  };

  const handleRefresh = () => {
    setRows([...initialRows]);
    message.success('配置缓存已刷新');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">系统设置</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          后台管理配置、业务规则和平台运行参数集中维护
        </p>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card variant="borderless" className="card-shadow" title="平台参数">
            <Form
              form={form}
              layout="vertical"
              validateMessages={{ required: '${label}不能为空' }}
              initialValues={{
                dispatchMode: 'auto',
                settlementMode: 'online',
                alertEnabled: true,
                supportPhone: '400-89105-000',
              }}
            >
              <Form.Item label="派单模式" name="dispatchMode" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: '智能自动派单', value: 'auto' },
                    { label: '运营人工派单', value: 'manual' },
                    { label: '承运商竞价', value: 'bid' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="结算模式" name="settlementMode" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: '平台在线结算', value: 'online' },
                    { label: '企业月结', value: 'monthly' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="异常告警" name="alertEnabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Form.Item label="客服热线" name="supportPhone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <div className="flex gap-3">
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                  保存配置
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleRefresh}>
                  刷新缓存
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card variant="borderless" className="card-shadow" title="业务规则">
            <Table
              rowKey="key"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 720 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
