import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/client';
import dayjs from 'dayjs';

interface InspectionRule {
  id: number;
  name: string;
  description: string;
  trigger: string;
  totalScore: number;
  passingScore: number;
  samplingRate: number;
  isActive: boolean;
  createdAt: string;
  checkItems: Array<{ id: string; name: string; description: string; required: boolean; scoreWeight: number }>;
}

const triggerMap: Record<string, string> = {
  random: '随机抽检',
  first_order: '首单必检',
  complaint: '投诉必检',
  scheduled: '定时巡检',
};

const InspectionRules: React.FC = () => {
  const [rules, setRules] = useState<InspectionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/inspection-rules');
      setRules(response.data.rules);
    } catch (error) {
      console.error('Load rules error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const checkItems = [
        { id: '1', name: '服务态度', description: '师傅服务态度是否良好', required: true, scoreWeight: 30 },
        { id: '2', name: '服务质量', description: '服务质量是否达标', required: true, scoreWeight: 40 },
        { id: '3', name: '仪容仪表', description: '是否穿着工装、佩戴工牌', required: false, scoreWeight: 15 },
        { id: '4', name: '工具齐全', description: '是否携带必要工具', required: false, scoreWeight: 15 },
      ];

      await api.post('/admin/inspection-rules', {
        ...values,
        checkItems,
      });
      message.success('规则创建成功');
      setModalVisible(false);
      loadRules();
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => triggerMap[trigger] || trigger,
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
    },
    {
      title: '及格分',
      dataIndex: 'passingScore',
      key: 'passingScore',
    },
    {
      title: '抽检率',
      dataIndex: 'samplingRate',
      key: 'samplingRate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div>
      <Card
        title="质检规则"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新建规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建质检规则"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="description" label="规则描述">
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          <Form.Item name="trigger" label="触发方式" initialValue="random" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="random">随机抽检</Select.Option>
              <Select.Option value="first_order">首单必检</Select.Option>
              <Select.Option value="complaint">投诉必检</Select.Option>
              <Select.Option value="scheduled">定时巡检</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="totalScore" label="总分" initialValue={100}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="passingScore" label="及格分" initialValue={60}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="samplingRate" label="抽检率(%)" initialValue={10}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InspectionRules;
