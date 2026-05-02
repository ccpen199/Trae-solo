import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Rate,
  Radio,
  message,
  Spin,
  Empty,
  Space,
} from 'antd';
import { StarOutlined, EyeOutlined } from '@ant-design/icons';
import { evaluationApi } from '../../api';

export const EvaluationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [pendingCases, setPendingCases] = useState<any[]>([]);
  const [evaluateVisible, setEvaluateVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const response = await evaluationApi.getMy();
      setEvaluations(response.data || []);
    } catch (error) {
      console.error('加载评价列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = (record: any) => {
    setSelectedCase(record);
    setEvaluateVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await evaluationApi.submit({
        case_id: selectedCase.case_id,
        score: values.score,
        service_attitude_score: values.service_attitude_score || values.score,
        efficiency_score: values.efficiency_score || values.score,
        environment_score: values.environment_score || values.score,
        content: values.content,
        is_satisfied: values.score >= 4,
      });
      message.success('评价提交成功');
      setEvaluateVisible(false);
      form.resetFields();
      loadEvaluations();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '评价提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '办件事项',
      dataIndex: ['case', 'service_item_name'],
      key: 'service_item_name',
    },
    {
      title: '办件编号',
      dataIndex: ['case', 'case_number'],
      key: 'case_number',
      width: 180,
    },
    {
      title: '总体评分',
      dataIndex: 'score',
      key: 'score',
      width: 150,
      render: (score: number) => (
        <Rate disabled value={score} />
      ),
    },
    {
      title: '是否满意',
      dataIndex: 'is_satisfied',
      key: 'is_satisfied',
      width: 100,
      render: (satisfied: boolean) => (
        <Tag color={satisfied ? 'green' : 'red'}>
          {satisfied ? '满意' : '不满意'}
        </Tag>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/citizen/cases/${record.case_id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card title="我的评价">
        {evaluations.length === 0 && !loading ? (
          <Empty
            description="暂无评价记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={evaluations}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>

      <Modal
        title="服务评价"
        open={evaluateVisible}
        onCancel={() => setEvaluateVisible(false)}
        footer={null}
        width={500}
      >
        {selectedCase && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p><strong>办件事项：</strong>{selectedCase.case?.service_item_name}</p>
              <p><strong>办件编号：</strong>{selectedCase.case?.case_number}</p>
            </Card>

            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item
                name="score"
                label="总体满意度评分"
                rules={[{ required: true, message: '请给出评分' }]}
              >
                <Rate />
              </Form.Item>

              <Form.Item name="service_attitude_score" label="服务态度评分">
                <Rate />
              </Form.Item>

              <Form.Item name="efficiency_score" label="办事效率评分">
                <Rate />
              </Form.Item>

              <Form.Item name="environment_score" label="服务环境评分">
                <Rate />
              </Form.Item>

              <Form.Item name="content" label="评价内容">
                <Input.TextArea
                  rows={4}
                  placeholder="请输入您的评价内容（选填）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setEvaluateVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    提交评价
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Spin>
  );
};
