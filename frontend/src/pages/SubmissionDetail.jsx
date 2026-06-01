import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, List, Tag, Space, message, Typography, Modal, Form, Progress, Row, Col, Switch } from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { submissionAPI, appealAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Form.Item;

function SubmissionDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [plagiarismResults, setPlagiarismResults] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [form] = Form.useForm();

  const isTeacher = user.role === 'teacher' || user.role === 'assistant';

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, contentRes] = await Promise.all([
        submissionAPI.getById(id),
        submissionAPI.getContent(id)
      ]);
      setSubmission(subRes.data.submission);
      setPlagiarismResults(subRes.data.plagiarismResults || []);
      setContent(contentRes.data.content || '');
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async (values) => {
    try {
      await appealAPI.create({
        submissionId: id,
        reason: values.reason
      });
      message.success('申诉已提交');
      setAppealModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || '申诉提交失败');
    }
  };

  const handleMarkCitation = async (resultId, isValidCitation) => {
    try {
      await appealAPI.markCitation(resultId, isValidCitation);
      message.success('标记成功');
      loadData();
    } catch (error) {
      message.error('标记失败');
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 80) return 'red';
    if (similarity >= 50) return 'orange';
    return 'green';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      submitted: { color: 'blue', text: '已提交' },
      appeal_approved: { color: 'green', text: '申诉通过' },
      appeal_rejected: { color: 'red', text: '申诉驳回' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const maxSimilarity = plagiarismResults.length > 0 
    ? Math.max(...plagiarismResults.map(r => r.similarity)) 
    : 0;

  if (!submission) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/assignments/${submission.assignment_id}`)}
          style={{ marginBottom: 16 }}
        >
          返回作业
        </Button>
        <Title level={3} style={{ margin: 0 }}>提交详情 - {submission.file_name}</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="基本信息">
            <Descriptions column={2}>
              <Descriptions.Item label="学生">{submission.student_name}</Descriptions.Item>
              <Descriptions.Item label="版本">v{submission.version}</Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {dayjs(submission.submit_time).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(submission.status)}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{submission.ip_address}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{(submission.file_size / 1024).toFixed(2)} KB</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="查重概览">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={maxSimilarity.toFixed(1)}
                strokeColor={getSimilarityColor(maxSimilarity)}
                size={120}
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: 16 }}>
                {maxSimilarity >= 80 ? (
                  <Tag color="red" icon={<ExclamationCircleOutlined />}>高相似度风险</Tag>
                ) : maxSimilarity > 0 ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>相似度正常</Tag>
                ) : (
                  <Tag color="default">未检测到相似内容</Tag>
                )}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">共检测到 {plagiarismResults.length} 份相似作业</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {plagiarismResults.length > 0 && (
        <Card title="查重结果详情" style={{ marginTop: 16 }}>
          <List
            dataSource={plagiarismResults}
            renderItem={(result) => (
              <List.Item
                actions={
                  isTeacher ? [
                    <Space>
                      <Text>标记为合理引用:</Text>
                      <Switch
                        checked={result.is_valid_citation === 1}
                        onChange={(checked) => handleMarkCitation(result.id, checked)}
                      />
                    </Space>
                  ] : []
                }
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>与 {result.compared_student_name} 的提交相似 (v{result.compared_version})</span>
                      <Tag color={getSimilarityColor(result.similarity)}>
                        {result.similarity.toFixed(1)}% 相似
                      </Tag>
                      {result.is_valid_citation === 1 && (
                        <Tag color="green">合理引用</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>匹配规则: </Text>
                        {result.matched_rules && JSON.parse(result.matched_rules).length > 0 
                          ? JSON.parse(result.matched_rules).join(', ')
                          : '无'
                        }
                      </div>
                      {result.similar_segments && JSON.parse(result.similar_segments).length > 0 && (
                        <div>
                          <Text strong>相似片段 ({JSON.parse(result.similar_segments).length}处):</Text>
                          <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
                            {JSON.parse(result.similar_segments).slice(0, 3).map((seg, idx) => (
                              <div key={idx} style={{ 
                                background: '#fff1f0', 
                                padding: 8, 
                                marginBottom: 8,
                                borderRadius: 4,
                                borderLeft: '3px solid #ff4d4f'
                              }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  相似度: {seg.similarity.toFixed(1)}%
                                </Text>
                                <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                                  {seg.text1}
                                </Paragraph>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="提交内容" style={{ marginTop: 16 }}>
        <pre style={{
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: 400,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 13
        }}>
          {content || '无内容'}
        </pre>
      </Card>

      {user.role === 'student' && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" onClick={() => setAppealModalVisible(true)}>
            发起申诉
          </Button>
        </div>
      )}

      <Modal
        title="发起申诉"
        open={appealModalVisible}
        onCancel={() => setAppealModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleAppeal}>
          <Form.Item
            name="reason"
            label="申诉原因"
            rules={[{ required: true, message: '请输入申诉原因' }]}
          >
            <TextArea rows={6} placeholder="请详细说明申诉原因..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交申诉</Button>
              <Button onClick={() => setAppealModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SubmissionDetail;
