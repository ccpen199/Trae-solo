import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Descriptions,
  Divider,
  List,
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { reviewApi, variableApi } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

function ReviewPool() {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [variables, setVariables] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [variableAdjustments, setVariableAdjustments] = useState({});
  const [form] = Form.useForm();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getPending();
      setReviews(res.data.data || []);
    } catch (error) {
      message.error('加载待审核列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariables = async () => {
    try {
      const res = await variableApi.getAll();
      setVariables(res.data.data || []);
    } catch (error) {
      console.error('加载变量失败', error);
    }
  };

  useEffect(() => {
    loadReviews();
    loadVariables();
  }, []);

  const handleViewDetail = (review) => {
    setCurrentReview(review);
    setVariableAdjustments({});
    setDetailModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    try {
      await reviewApi.submit(currentReview.id, {
        reviewer: '风控专员',
        result: values.reviewResult,
        comment: values.comment,
        variableAdjustments: variableAdjustments,
      });
      message.success('审核完成');
      setDetailModalVisible(false);
      loadReviews();
    } catch (error) {
      message.error('提交审核失败');
      console.error(error);
    }
  };

  const handleVariableAdjustment = (code, delta) => {
    setVariableAdjustments((prev) => ({
      ...prev,
      [code]: (prev[code] || 0) + delta,
    }));
  };

  const resultColor = (result) => {
    switch (result) {
      case 'reject':
        return 'red';
      case 'manual':
        return 'orange';
      default:
        return 'green';
    }
  };

  const resultText = (result) => {
    switch (result) {
      case 'reject':
        return '拒绝';
      case 'manual':
        return '人工审核';
      default:
        return '通过';
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name',
    },
    {
      title: '决策结果',
      dataIndex: 'decision_result',
      key: 'decision_result',
      render: (text, record) => (
        <Tag color={resultColor(record.decision_score > 50 ? 'reject' : 'pass')}>
          {resultText(text)}
        </Tag>
      ),
    },
    {
      title: '风险分数',
      dataIndex: 'decision_score',
      key: 'decision_score',
      render: (score) => (
        <span style={{ fontWeight: 600, color: score > 50 ? '#ff4d4f' : '#52c41a' }}>
          {score}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>
            审核
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>人工审核池</h2>
        <Button icon={<ReloadOutlined />} onClick={loadReviews} loading={loading}>
          刷新
        </Button>
      </div>

      <Card>
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无待审核的人工件
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="审核详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentReview && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="规则名称">
                {currentReview.rule_name}
              </Descriptions.Item>
              <Descriptions.Item label="风险分数">
                <span
                  style={{
                    fontWeight: 600,
                    color: currentReview.decision_score > 50 ? '#ff4d4f' : '#52c41a',
                  }}
                >
                  {currentReview.decision_score}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {currentReview.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="审核ID">
                {currentReview.id}
              </Descriptions.Item>
            </Descriptions>

            {currentReview.request_data && (
              <>
                <Divider>请求数据</Divider>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(currentReview.request_data, null, 2)}
                  </pre>
                </Card>
              </>
            )}

            <Divider>变量权重调整</Divider>
            <List
              size="small"
              dataSource={variables}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      onClick={() => handleVariableAdjustment(item.code, -0.1)}
                    >
                      -0.1
                    </Button>,
                    <Button size="small" onClick={() => handleVariableAdjustment(item.code, 0.1)}>
                      +0.1
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space>
                        <Tag color="blue">{item.code}</Tag>
                        <span>当前权重: {item.weight}</span>
                        {variableAdjustments[item.code] && (
                          <Tag color={variableAdjustments[item.code] > 0 ? 'green' : 'orange'}>
                            调整: {variableAdjustments[item.code] > 0 ? '+' : ''}
                            {variableAdjustments[item.code].toFixed(1)}
                          </Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider>审核结论</Divider>
            <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
              <Form.Item
                name="reviewResult"
                label="审核结果"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Select placeholder="请选择审核结果">
                  <Option value="approve">
                    <Tag color="green">通过</Tag>
                  </Option>
                  <Option value="reject">
                    <Tag color="red">拒绝</Tag>
                  </Option>
                  <Option value="escalate">
                    <Tag color="orange">升级</Tag>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item name="comment" label="审核备注">
                <TextArea rows={3} placeholder="请输入审核备注" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                    提交审核
                  </Button>
                  <Button onClick={() => setDetailModalVisible(false)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ReviewPool;
