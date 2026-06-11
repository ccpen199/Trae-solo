import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Avatar,
  Tag,
  Button,
  Progress,
  Spin,
  message,
  Space,
  Descriptions,
  Typography,
  Divider,
  Steps,
  Timeline,
  List,
  Form,
  Input,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  VideoCameraOutlined,
  SendOutlined,
  UserOutlined,
  UserSwitchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applications } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;
const { confirm } = Modal;

const statusMap = {
  applied: { color: 'default', text: '已投递', index: 0 },
  screening: { color: 'blue', text: '筛选中', index: 1 },
  interview: { color: 'cyan', text: '面试中', index: 2 },
  offer: { color: 'gold', text: '已发Offer', index: 3 },
  hired: { color: 'green', text: '已入职', index: 4 },
  rejected: { color: 'red', text: '已淘汰', index: 5 },
};

function ApplicationDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [remarkForm] = Form.useForm();
  const [remarkList, setRemarkList] = useState([]);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await applications.getDetail(id);
      if (res.code === 0) {
        setDetail(res.data);
        setRemarkList(res.data.remarks || []);
      }
    } catch (err) {
      console.error('获取投递详情失败:', err);
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status, description) => {
    try {
      const res = await applications.updateStatus(id, status);
      if (res.code === 0) {
        message.success(description + '成功');
        fetchDetail();
      }
    } catch (err) {
      console.error('状态更新失败:', err);
      message.error(description + '失败');
    }
  };

  const handleNextRound = () => {
    const currentIndex = statusMap[detail.status]?.index || 0;
    const nextStatuses = ['applied', 'screening', 'interview', 'offer', 'hired'];
    if (currentIndex < nextStatuses.length - 1) {
      const nextStatus = nextStatuses[currentIndex + 1];
      confirm({
        title: '确认进入下一轮',
        content: `确定要将当前状态从"${statusMap[detail.status]?.text}"更新为"${statusMap[nextStatus]?.text}"吗？`,
        onOk: () => handleStatusChange(nextStatus, '进入下一轮'),
      });
    } else {
      message.info('已处于最终状态');
    }
  };

  const handleInterview = () => {
    confirm({
      title: '确认发起面试',
      content: '确定要为该候选人发起面试吗？',
      onOk: () => handleStatusChange('interview', '发起面试'),
    });
  };

  const handleOffer = () => {
    confirm({
      title: '确认发送Offer',
      content: '确定要向该候选人发送Offer吗？',
      onOk: () => handleStatusChange('offer', '发送Offer'),
    });
  };

  const handleReject = () => {
    confirm({
      title: '确认淘汰',
      content: '确定要淘汰该候选人吗？此操作不可逆。',
      okText: '确认淘汰',
      okType: 'danger',
      onOk: () => handleStatusChange('rejected', '淘汰'),
    });
  };

  const handleSaveRemark = async (values) => {
    try {
      const res = await applications.updateRemark(id, values.remark);
      if (res.code === 0) {
        message.success('备注添加成功');
        setRemarkModalVisible(false);
        remarkForm.resetFields();
        const newRemark = {
          id: Date.now(),
          content: values.remark,
          operator: user?.name || '当前用户',
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setRemarkList([newRemark, ...remarkList]);
      }
    } catch (err) {
      console.error('添加备注失败:', err);
      message.error('添加备注失败');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return <div style={{ padding: 24, textAlign: 'center' }}>未找到投递记录</div>;
  }

  const currentStep = statusMap[detail.status]?.index || 0;
  const isRejected = detail.status === 'rejected';

  return (
    <div style={{ padding: '16px' }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/applications')}>
              返回列表
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              投递详情
            </Title>
            <Tag color={statusMap[detail.status]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
              {statusMap[detail.status]?.text}
            </Tag>
          </Space>
          <Space wrap>
            <Button
              icon={<UserSwitchOutlined />}
              onClick={handleNextRound}
              disabled={isRejected || currentStep >= 4}
            >
              进入下一轮
            </Button>
            <Button
              icon={<VideoCameraOutlined />}
              onClick={handleInterview}
              disabled={isRejected || currentStep >= 2}
            >
              发起面试
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleOffer}
              disabled={isRejected || currentStep >= 3}
            >
              发Offer
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleReject}
              disabled={isRejected}
            >
              淘汰
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="求职者信息" size="small" bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
              <Space align="start" style={{ marginBottom: 16 }}>
                <Avatar size={64} src={detail.candidateAvatar}>
                  {detail.candidateName?.charAt(0)}
                </Avatar>
                <div>
                  <Title level={5} style={{ margin: '0 0 8px 0' }}>
                    {detail.candidateName}
                  </Title>
                  <Space wrap>
                    {detail.candidateEducation && <Tag color="blue">{detail.candidateEducation}</Tag>}
                    {detail.candidateExperience && <Tag color="green">{detail.candidateExperience}</Tag>}
                    {detail.candidatePhone && <Tag color="default">{detail.candidatePhone}</Tag>}
                  </Space>
                </div>
              </Space>
              <Descriptions column={2} size="small" bordered={false}>
                <Descriptions.Item label="邮箱">
                  {detail.candidateEmail || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="期望薪资">
                  {detail.candidateExpectedSalary || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="意向城市">
                  {detail.candidateCity || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="工作年限">
                  {detail.candidateExperience || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="岗位信息" size="small" bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: '0 0 8px 0' }}>
                  {detail.jobTitle}
                </Title>
                <Space wrap>
                  {detail.jobSalary && <Tag color="gold">{detail.jobSalary}</Tag>}
                  {detail.jobLocation && <Tag color="blue">{detail.jobLocation}</Tag>}
                  {detail.jobType && <Tag color="green">{detail.jobType}</Tag>}
                </Space>
              </div>
              <Descriptions column={2} size="small" bordered={false}>
                <Descriptions.Item label="部门">
                  {detail.jobDepartment || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="学历要求">
                  {detail.jobEducation || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="经验要求">
                  {detail.jobExperience || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="招聘人数">
                  {detail.jobHeadcount || '-'}人
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>状态流转</Title>
          <Steps
            current={isRejected ? -1 : currentStep}
            status={isRejected ? 'error' : 'process'}
            size="small"
            items={[
              { title: '已投递', icon: <UserOutlined /> },
              { title: '筛选中', icon: <ClockCircleOutlined /> },
              { title: '面试中', icon: <VideoCameraOutlined /> },
              { title: '已发Offer', icon: <SendOutlined /> },
              { title: '已入职', icon: <CheckCircleOutlined /> },
            ]}
            responsive
          />
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="状态时间轴" size="small">
              <Timeline
                items={[
                  {
                    color: 'blue',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>已投递</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(detail.applyTime).format('YYYY-MM-DD HH:mm')}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          操作人：{detail.applyOperator || '系统'}
                        </div>
                      </div>
                    ),
                  },
                  ...(detail.statusHistory || []).map((item, index) => ({
                    color: statusMap[item.status]?.color || 'blue',
                    children: (
                      <div key={index}>
                        <div style={{ fontWeight: 500 }}>
                          {statusMap[item.status]?.text || item.status}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          操作人：{item.operator || '系统'}
                        </div>
                      </div>
                    ),
                  })),
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <span>匹配度分析</span>
                  <Tag color={detail.matchScore >= 80 ? 'success' : detail.matchScore >= 60 ? 'processing' : 'warning'}>
                    总分 {detail.matchScore || 0}%
                  </Tag>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>技能匹配</span>
                    <Text strong>{detail.skillMatch || 0}%</Text>
                  </div>
                  <Progress
                    percent={detail.skillMatch || 0}
                    size="small"
                    status={getScoreColor(detail.skillMatch)}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>经验匹配</span>
                    <Text strong>{detail.experienceMatch || 0}%</Text>
                  </div>
                  <Progress
                    percent={detail.experienceMatch || 0}
                    size="small"
                    status={getScoreColor(detail.experienceMatch)}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>薪资匹配</span>
                    <Text strong>{detail.salaryMatch || 0}%</Text>
                  </div>
                  <Progress
                    percent={detail.salaryMatch || 0}
                    size="small"
                    status={getScoreColor(detail.salaryMatch)}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>意向度</span>
                    <Text strong>{detail.intentionScore || 0}%</Text>
                  </div>
                  <Progress
                    percent={detail.intentionScore || 0}
                    size="small"
                    status={getScoreColor(detail.intentionScore)}
                    showInfo={false}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <CommentOutlined />
                    <span>备注</span>
                  </Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setRemarkModalVisible(true)}
                  >
                    添加备注
                  </Button>
                </div>
              }
              size="small"
            >
              {remarkList.length > 0 ? (
                <List
                  dataSource={remarkList}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} size="small" />}
                        title={
                          <Space>
                            <span>{item.operator}</span>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </Space>
                        }
                        description={item.content}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                  暂无备注
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="操作记录" size="small">
              <Timeline
                size="small"
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>创建投递记录</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(detail.applyTime).format('YYYY-MM-DD HH:mm')}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          操作人：{detail.applyOperator || '系统'}
                        </div>
                      </div>
                    ),
                  },
                  ...(detail.operationLogs || []).map((item, index) => ({
                    color: 'blue',
                    children: (
                      <div key={index}>
                        <div style={{ fontWeight: 500 }}>{item.action}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          操作人：{item.operator || '系统'}
                        </div>
                        {item.remark && (
                          <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
                            备注：{item.remark}
                          </div>
                        )}
                      </div>
                    ),
                  })),
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="添加备注"
        open={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={remarkForm}
          layout="vertical"
          onFinish={handleSaveRemark}
        >
          <Form.Item
            name="remark"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <TextArea rows={4} placeholder="请输入备注内容" maxLength={500} showCount />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRemarkModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ApplicationDetail;
