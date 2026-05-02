import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const { TextArea } = Input;

interface TaskForm {
  batch_name: string;
  description: string;
  unit_reward: number;
  requirements: string;
  min_worker_level: number;
  task_content: string;
  task_count: number;
}

const CreateTask: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<TaskForm>();
  const navigate = useNavigate();

  const onFinish = async (values: TaskForm) => {
    setLoading(true);
    try {
      const taskDataList = [];
      for (let i = 0; i < values.task_count; i++) {
        taskDataList.push({
          index: i + 1,
          content: values.task_content,
          description: `这是第 ${i + 1} 个任务`,
        });
      }

      const response = await api.post('/tasks/batch', {
        batch_name: values.batch_name,
        description: values.description,
        unit_reward: values.unit_reward,
        requirements: values.requirements,
        min_worker_level: values.min_worker_level,
        task_data_list: taskDataList,
      });

      message.success(`任务批次创建成功！共 ${values.task_count} 个任务`);
      navigate('/publisher/batches');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>发布新任务</h1>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            unit_reward: 10,
            min_worker_level: 1,
            task_count: 5,
          }}
        >
          <Form.Item
            name="batch_name"
            label="任务批次名称"
            rules={[{ required: true, message: '请输入任务批次名称' }]}
          >
            <Input placeholder="例如：图片标注任务-第1批" />
          </Form.Item>

          <Form.Item name="description" label="批次描述">
            <TextArea rows={3} placeholder="描述这个任务批次的总体要求" />
          </Form.Item>

          <Form.Item
            name="unit_reward"
            label="单任务佣金（元）"
            rules={[{ required: true, message: '请输入单任务佣金' }]}
          >
            <InputNumber
              min={0.01}
              max={10000}
              precision={2}
              style={{ width: '100%' }}
              placeholder="例如：10.00"
            />
          </Form.Item>

          <Form.Item name="requirements" label="任务要求">
            <TextArea rows={4} placeholder="详细描述每个任务的具体要求" />
          </Form.Item>

          <Form.Item
            name="min_worker_level"
            label="最低接单员等级"
            rules={[{ required: true, message: '请选择最低等级' }]}
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              placeholder="1-10级"
            />
          </Form.Item>

          <Form.Item
            name="task_count"
            label="任务数量"
            rules={[{ required: true, message: '请输入任务数量' }]}
          >
            <InputNumber
              min={1}
              max={1000}
              style={{ width: '100%' }}
              placeholder="输入要创建的任务数量"
            />
          </Form.Item>

          <Form.Item
            name="task_content"
            label="任务内容模板"
            rules={[{ required: true, message: '请输入任务内容模板' }]}
          >
            <TextArea
              rows={6}
              placeholder="每个任务的具体内容模板，例如：请标注图片中的人物位置和动作..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                创建任务批次
              </Button>
              <Button size="large" onClick={() => navigate('/publisher/batches')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateTask;
