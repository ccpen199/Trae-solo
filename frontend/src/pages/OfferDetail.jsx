import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Spin,
  message,
  Row,
  Col,
  Steps,
  Timeline,
  Avatar,
  Space,
  Divider,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  RollbackOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  DesktopOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { offers } from '../api';
import { useAuth } from '../context/AuthContext';

const { Step } = Steps;

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  sent: { color: 'blue', text: '已发送' },
  signed: { color: 'green', text: '已签署' },
  rejected: { color: 'red', text: '已拒绝' },
  withdrawn: { color: 'orange', text: '已撤回' },
};

const onboardingTasks = [
  { id: 1, name: '背景调查', icon: <SafetyCertificateOutlined />, description: '核查候选人背景信息' },
  { id: 2, name: '资料提交', icon: <FileTextOutlined />, description: '提交身份证、学历证明等资料' },
  { id: 3, name: '体检', icon: <MedicineBoxOutlined />, description: '入职体检报告' },
  { id: 4, name: 'Offer签署', icon: <IdcardOutlined />, description: '电子签名确认Offer' },
  { id: 5, name: '工牌申请', icon: <IdcardOutlined />, description: '制作员工工牌' },
  { id: 6, name: 'IT设备准备', icon: <DesktopOutlined />, description: '配置电脑、账号等' },
  { id: 7, name: '入职培训', icon: <ReadOutlined />, description: '新员工入职培训' },
];

function OfferDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState(null);
  const [onboardingData, setOnboardingData] = useState([]);

  const mockOfferData = {
    id: 1,
    candidateName: '李明',
    candidateAvatar: '',
    jobTitle: '高级前端工程师',
    salaryMin: 25,
    salaryMax: 30,
    joinDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
    probationMonths: 3,
    validUntil: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    status: 'sent',
    workLocation: '北京市朝阳区望京SOHO',
    benefits: '五险一金、年终奖金（1-3个月）、带薪年假10天、节日福利、定期团建、年度体检、股票期权',
    otherTerms: '入职后需签订保密协议和竞业限制协议',
    createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    sentAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    signedAt: null,
    rejectedAt: null,
    remark: '候选人表现优秀，建议尽快入职',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offerRes, onboardingRes] = await Promise.all([
        offers.getDetail(id),
        offers.getOnboarding(id),
      ]);

      if (offerRes.code === 0) {
        setOfferData(offerRes.data);
      } else {
        message.error(offerRes.message || '获取Offer详情失败');
      }

      if (onboardingRes.code === 0) {
        setOnboardingData(onboardingRes.data);
      }
    } catch (err) {
      console.error('获取Offer详情失败:', err);
      setOfferData(mockOfferData);
      setOnboardingData([
        { id: 1, completed: true, completedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD') },
        { id: 2, completed: true, completedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
        { id: 3, completed: false },
        { id: 4, completed: false },
        { id: 5, completed: false },
        { id: 6, completed: false },
        { id: 7, completed: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchData();
    }
  }, [token, id]);

  const handleSend = async () => {
    try {
      const res = await offers.send(id);
      if (res.code === 0) {
        message.success('Offer已发送');
        fetchData();
      } else {
        message.error(res.message || '发送Offer失败');
      }
    } catch (err) {
      console.error('发送Offer失败:', err);
      message.error('发送Offer失败，请稍后重试');
    }
  };

  const handleWithdraw = async () => {
    try {
      const res = await offers.withdraw(id);
      if (res.code === 0) {
        message.success('Offer已撤回');
        fetchData();
      } else {
        message.error(res.message || '撤回Offer失败');
      }
    } catch (err) {
      console.error('撤回Offer失败:', err);
      message.error('撤回Offer失败，请稍后重试');
    }
  };

  const handleDownloadPDF = () => {
    message.success('PDF下载中...');
    setTimeout(() => {
      message.success('Offer PDF 已下载');
    }, 1000);
  };

  const getTimelineItems = () => {
    const items = [];
    const data = offerData || mockOfferData;

    items.push({
      color: 'green',
      children: (
        <div>
          <div style={{ fontWeight: '500' }}>Offer创建</div>
          <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: '12px' }}>{data.createdAt}</div>
        </div>
      ),
    });

    if (data.sentAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <div style={{ fontWeight: '500' }}>Offer已发送</div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: '12px' }}>{data.sentAt}</div>
          </div>
        ),
      });
    } else {
      items.push({
        color: 'gray',
        children: (
          <div>
            <div style={{ fontWeight: '500', color: 'rgba(0,0,0,0.45)' }}>等待发送</div>
          </div>
        ),
      });
    }

    if (data.signedAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <div style={{ fontWeight: '500' }}>Offer已签署</div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: '12px' }}>{data.signedAt}</div>
          </div>
        ),
      });
    } else if (data.rejectedAt) {
      items.push({
        color: 'red',
        children: (
          <div>
            <div style={{ fontWeight: '500' }}>Offer已拒绝</div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: '12px' }}>{data.rejectedAt}</div>
          </div>
        ),
      });
    } else if (data.status === 'sent') {
      items.push({
        color: 'blue',
        children: (
          <div>
            <div style={{ fontWeight: '500' }}>等待候选人签署</div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: '12px' }}>
              有效期至 {data.validUntil}</div>
          </div>
        ),
      });
    } else if (data.status === 'withdrawn') {
      items.push({
        color: 'orange',
        children: (
          <div>
            <div style={{ fontWeight: '500' }}>Offer已撤回</div>
          </div>
        ),
      });
    }

    return items;
  };

  const getOnboardingStatus = (taskId) => {
    const task = onboardingData.find((t) => t.id === taskId);
    return task ? task.completed : false;
  };

  const getOnboardingCompletedAt = (taskId) => {
    const task = onboardingData.find((t) => t.id === taskId);
    return task?.completedAt;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const data = offerData || mockOfferData;
  const statusConfig = statusMap[data.status] || { color: 'default', text: data.status };

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/offers')}
        style={{ marginBottom: '16px' }}
      >
        返回列表
      </Button>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            title="Offer信息"
            extra={<Tag color={statusConfig.color}>{statusConfig.text}</Tag>}
            style={{ marginBottom: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <Avatar size={64} src={data.candidateAvatar} icon={<UserOutlined />} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                  {data.candidateName}
                </div>
                <div style={{ color: 'rgba(0,0,0,0.65)' }}>{data.jobTitle}</div>
              </div>
            </div>

            <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="small">
              <Descriptions.Item label="薪资范围">
                <span style={{ color: '#1890ff', fontWeight: '500' }}>
                  {data.salaryMin}K - {data.salaryMax}K / 月薪
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="入职时间">
                {dayjs(data.joinDate).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="试用期">
                {data.probationMonths} 个月
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {dayjs(data.validUntil).format('YYYY年MM月DD日')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Offer内容" style={{ marginBottom: '16px' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="工作地点">
                {data.workLocation}
              </Descriptions.Item>
              <Descriptions.Item label="福利待遇">
                {data.benefits}
              </Descriptions.Item>
              <Descriptions.Item label="其他约定">
                {data.otherTerms}
              </Descriptions.Item>
              {data.remark && (
                <Descriptions.Item label="备注">
                  {data.remark}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="签署状态" style={{ marginBottom: '16px' }}>
            <Timeline
              mode="left"
              items={getTimelineItems()}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="操作"
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {data.status === 'draft' && (
                <Button
                  type="primary"
                  block
                  icon={<SendOutlined />}
                  onClick={handleSend}
                >
                  发送Offer
                </Button>
              )}
              {(data.status === 'sent' || data.status === 'draft') && (
                <Popconfirm
                  title="确认撤回此Offer？"
                  onConfirm={handleWithdraw}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button
                    block
                    danger
                    icon={<RollbackOutlined />}
                  >
                    撤回Offer
                  </Button>
                </Popconfirm>
              )}
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
              >
                下载PDF
              </Button>
            </Space>
          </Card>

          <Card title="入职流程自动化">
            <div style={{ marginBottom: '16px' }}>
              <Steps
                direction="vertical"
                size="small"
                current={onboardingData.filter((t) => t.completed).length}
                items={onboardingTasks.map((task, index) => ({
                  title: task.name,
                  description: (
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                        {task.description}
                      </div>
                      {getOnboardingCompletedAt(task.id) && (
                        <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
                          <ClockCircleOutlined /> {dayjs(getOnboardingCompletedAt(task.id)).format('YYYY-MM-DD')}
                        </div>
                      )}
                    </div>
                  ),
                  status: getOnboardingStatus(task.id) ? 'finish' : (
                    index < onboardingData.filter((t) => t.completed).length ? 'process' : 'wait'
                  ),
                  icon: (
                    <Avatar
                      size={32}
                      style={{
                        background: getOnboardingStatus(task.id) ? '#52c41a' : '#d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      icon={getOnboardingStatus(task.id) ? <CheckCircleOutlined /> : task.icon}
                    />
                  ),
                }))}
              />
            </div>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.65)' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#1890ff' }}>
              {onboardingData.filter((t) => t.completed).length}
              <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.65)', marginLeft: '4px' }}>
                / {onboardingTasks.length}
              </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                已完成任务数
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OfferDetail;
