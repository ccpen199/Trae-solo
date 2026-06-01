import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Upload, Table, Tag, Space, message, Typography, Modal, Form, Input, Progress } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { assignmentAPI, submissionAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

function AssignmentDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [form] = Form.useForm();

  const isTeacher = user.role === 'teacher' || user.role === 'assistant';

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        assignmentAPI.getById(id),
        submissionAPI.getByAssignment(id)
      ]);
      setAssignment(assignRes.data.assignment);
      setSubmissions(subRes.data.submissions || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadFile) {
      message.error('请选择要上传的文件');
      return;
    }

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('assignmentId', id);

      await submissionAPI.submit(formData);
      message.success('提交成功');
      setSubmitModalVisible(false);
      setUploadFile(null);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRunCheck = async (submissionId) => {
    try {
      await submissionAPI.runCheck(submissionId);
      message.success('查重完成');
      loadData();
    } catch (error) {
      message.error('查重失败');
    }
  };

  const getSimilarityTag = (similarity) => {
    if (!similarity) return <Tag color="default">未检测</Tag>;
    if (similarity >= 80) return <Tag color="red">高风险 {similarity.toFixed(1)}%</Tag>;
    if (similarity >= 50) return <Tag color="orange">中风险 {similarity.toFixed(1)}%</Tag>;
    return <Tag color="green">低风险 {similarity.toFixed(1)}%</Tag>;
  };

  const columns = [
    {
      title: '学生',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 120,
      render: (text, record) => text || record.user_id
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/submissions/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v) => `v${v}`
    },
    {
      title: '提交时间',
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '相似度',
      dataIndex: 'max_similarity',
      key: 'max_similarity',
      width: 140,
      render: (similarity) => getSimilarityTag(similarity)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusMap = {
          submitted: { color: 'blue', text: '已提交' },
          appeal_approved: { color: 'green', text: '申诉通过' },
          appeal_rejected: { color: 'red', text: '申诉驳回' }
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/submissions/${record.id}`)}
          >
            查看
          </Button>
          {isTeacher && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handleRunCheck(record.id)}
            >
              重新查重
            </Button>
          )}
        </Space>
      )
    }
  ];

  const studentColumns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/submissions/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v) => `v${v}`
    },
    {
      title: '提交时间',
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '相似度',
      dataIndex: 'max_similarity',
      key: 'max_similarity',
      width: 140,
      render: (similarity) => getSimilarityTag(similarity)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusMap = {
          submitted: { color: 'blue', text: '已提交' },
          appeal_approved: { color: 'green', text: '申诉通过' },
          appeal_rejected: { color: 'red', text: '申诉驳回' }
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/submissions/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ];

  if (!assignment) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/assignments')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>{assignment.title}</Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="创建人">{assignment.creator_name}</Descriptions.Item>
          <Descriptions.Item label="提交格式">{assignment.submit_format}</Descriptions.Item>
          <Descriptions.Item label="截止时间">
            {dayjs(assignment.deadline).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="相似度阈值">
            <Progress
              percent={assignment.similarity_threshold}
              size="small"
              style={{ width: 120 }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="查重范围">{assignment.plagiarism_scope}</Descriptions.Item>
          <Descriptions.Item label="允许重交">
            {assignment.allow_resubmit ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>}
          </Descriptions.Item>
          {assignment.description && (
            <Descriptions.Item label="作业描述" span={3}>
              {assignment.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title="提交记录"
        extra={
          user.role === 'student' && (
            <Button type="primary" onClick={() => setSubmitModalVisible(true)}>
              提交作业
            </Button>
          )
        }
      >
        <Table
          columns={isTeacher ? columns : studentColumns}
          dataSource={submissions}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="提交作业"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="选择文件">
            <Upload
              beforeUpload={(file) => {
                setUploadFile(file);
                return false;
              }}
              onRemove={() => setUploadFile(null)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            {uploadFile && <Text type="success" style={{ marginLeft: 8 }}>{uploadFile.name}</Text>}
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                提交
              </Button>
              <Button onClick={() => setSubmitModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AssignmentDetail;
