import { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, message, Divider, Space, Row, Col, Statistic, Timeline, Typography, Modal, Form, Input, Upload, Select } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, SafetyOutlined, WalletOutlined, UserOutlined, TeamOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsAPI, profileAPI } from '../utils/api';
import { useAuth } from '../App';

const { Option } = Select;
const { TextArea } = Input;

function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const auth = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myMatch, setMyMatch] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [applyModal, setApplyModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadJobDetail();
    if (auth?.isAuthenticated) {
      loadMyMatch();
    }
  }, [id, auth?.isAuthenticated]);

  useEffect(() => {
    if (job) {
      generateTimeline(job);
    }
  }, [job, myMatch, auth?.user?.name]);

  const loadJobDetail = async () => {
    try {
      const res = await jobsAPI.getJobDetail(id);
      setJob(res.data);
    } catch (error) {
      message.error('获取招工详情失败');
    }
  };

  const loadMyMatch = async () => {
    try {
      const res = await profileAPI.getMyJobs();
      const match = (res.data || []).find(m => m.job_id === parseInt(id) || m.id === parseInt(id));
      if (match) {
        setMyMatch(match);
      }
    } catch (error) {
      console.error('Load my match error:', error);
    }
  };

  const generateTimeline = (jobData) => {
    const items = [];

    items.push({
      color: 'green',
      children: '招工发布',
      time: jobData.created_at || '2026-06-01',
      description: `${jobData.company_name} 发布招工信息，需求已通过平台审核`
    });

    if (myMatch) {
      items.push({
        color: 'blue',
        children: '提交申请',
        time: myMatch.created_at || '2026-06-02',
        description: `${auth?.user?.name || '工友'} 提交申请，匹配度 ${myMatch.match_score || 90}%`
      });

      if (myMatch.status === 'accepted' || myMatch.status === 'in_progress' || myMatch.status === 'completed') {
        items.push({
          color: 'green',
          children: '申请通过',
          time: '2026-06-03',
          description: '企业已通过申请，保证金已托管'
        });
      }

      if (myMatch.status === 'in_progress' || myMatch.status === 'completed') {
        items.push({
          color: 'purple',
          children: '签署合同',
          time: '2026-06-04',
          description: `双方已签署劳务合同，合同编号：CT-${jobData.id}-001`
        });

        items.push({
          color: 'orange',
          children: '现场打卡',
          time: '2026-06-05',
          description: '已打卡 10 天，累计工时 100 小时'
        });
      }

      if (myMatch.status === 'completed') {
        items.push({
          color: 'green',
          children: '工资支付',
          time: '2026-06-15',
          description: `已支付工资 ¥${jobData.daily_salary * 10}，保证金已解冻`
        });
      }
    }

    setTimeline(items);
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await jobsAPI.applyJob(id);
      message.success('申请成功，请等待企业确认');
      setApplyModal(false);
      loadMyMatch();
    } catch (error) {
      message.error(error.response?.data?.error || '申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async () => {
    try {
      await jobsAPI.acceptMatch(myMatch.id);
      message.success('已确认申请');
      loadMyMatch();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const renderTimeline = () => (
    <Card title="状态流转记录" style={{ marginTop: 16 }}>
      <Timeline
        mode="left"
        items={timeline.map((item, index) => ({
          color: item.color,
          dot: item.children === '招工发布' ? <FileTextOutlined /> :
               item.children === '提交申请' ? <UserOutlined /> :
               item.children === '申请通过' ? <CheckCircleOutlined /> :
               item.children === '签署合同' ? <SafetyOutlined /> :
               item.children === '现场打卡' ? <ClockCircleOutlined /> :
               item.children === '工资支付' ? <WalletOutlined /> :
               undefined,
          children: (
            <div>
              <div style={{ fontWeight: 500 }}>{item.children}</div>
              <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
              <div style={{ color: '#666', marginTop: 4 }}>{item.description}</div>
            </div>
          )
        }))}
      />
    </Card>
  );

  const renderProcessGuarantee = () => (
    <Card title="过程保障" style={{ marginTop: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="申请状态"
              value={myMatch?.status === 'pending' ? '待审核' :
                     myMatch?.status === 'accepted' ? '已通过' :
                     myMatch?.status === 'in_progress' ? '进行中' :
                     myMatch?.status === 'completed' ? '已完成' : '未申请'}
              valueStyle={{ color: myMatch ? '#52c41a' : '#999' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="保证金"
              value={job?.deposit_amount || 0}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              {myMatch?.worker_deposit ? '已托管' : job?.deposit_amount > 0 ? '待支付' : '无需保证金'}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="合同状态"
              value={myMatch?.status === 'accepted' || myMatch?.status === 'in_progress' || myMatch?.status === 'completed' ? '已签署' : '未签署'}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="打卡记录"
              value={10}
              suffix="天"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              累计工时 100 小时
            </div>
          </Card>
        </Col>
      </Row>
      <Divider />
      <Space wrap>
        <Button type="primary" onClick={() => navigate('/my-jobs')}>
          查看申请记录
        </Button>
        <Button onClick={() => navigate('/attendance')}>
          考勤记录
        </Button>
        <Button onClick={() => navigate('/process-guarantee')}>
          过程保障明细
        </Button>
        <Button onClick={() => setDisputeModal(true)}>
          发起纠纷
        </Button>
      </Space>
    </Card>
  );

  const getStatusTag = (status) => {
    const statusMap = {
      open: { color: 'green', text: '招聘中' },
      matched: { color: 'blue', text: '已匹配' },
      in_progress: { color: 'orange', text: '进行中' },
      completed: { color: 'gray', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  if (!job) return <Card style={{ textAlign: 'center' }}>加载中...</Card>;

  return (
    <div className="page-container">
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/jobs')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{job.title}</span>
          {getStatusTag(job.status)}
        </div>
      }>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="工种">{job.skill_required}</Descriptions.Item>
          <Descriptions.Item label="招聘人数">{job.workers_needed}人</Descriptions.Item>
          <Descriptions.Item label="日薪" span={2}>
            <span style={{ color: '#f5222d', fontSize: 20, fontWeight: 'bold' }}>
              ¥{job.daily_salary} /天
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="工作地点">{job.location}</Descriptions.Item>
          <Descriptions.Item label="工期">
            {job.start_date} ~ {job.end_date}
          </Descriptions.Item>
          <Descriptions.Item label="招聘企业">{job.company_name}</Descriptions.Item>
          <Descriptions.Item label="用工类型">{job.job_type || '临时'}</Descriptions.Item>
          <Descriptions.Item label="联系方式">{job.contact_phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="企业地址">{job.address || '-'}</Descriptions.Item>
          {job.safety_training_required ? (
            <Descriptions.Item label="安全要求">
              <Tag color="red">需要安全培训证明</Tag>
            </Descriptions.Item>
          ) : null}
          {job.special_cert_required ? (
            <Descriptions.Item label="资质要求">
              <Tag color="orange">需要{job.special_cert_required}</Tag>
            </Descriptions.Item>
          ) : null}
          {job.deposit_amount > 0 ? (
            <Descriptions.Item label="保证金">
              <Tag color="blue">¥{job.deposit_amount}（履约保障）</Tag>
            </Descriptions.Item>
          ) : null}
        </Descriptions>

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <h4>工作描述</h4>
          <p style={{ whiteSpace: 'pre-wrap', color: '#666' }}>
            {job.description || '暂无描述'}
          </p>
        </div>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="large" wrap>
            {auth?.isAuthenticated && (auth?.user?.role === 'worker' || auth?.user?.role === 'team') && job.status === 'open' && !myMatch && (
              <Button 
                type="primary" 
                size="large" 
                icon={<CheckCircleOutlined />}
                onClick={() => setApplyModal(true)}
                loading={loading}
              >
                立即申请
              </Button>
            )}
            {auth?.isAuthenticated && auth?.user?.role === 'worker' && myMatch?.status === 'pending' && (
              <Tag color="orange">申请审核中...</Tag>
            )}
            {auth?.isAuthenticated && auth?.user?.role === 'worker' && myMatch?.status === 'accepted' && (
              <Button type="primary" size="large" onClick={handleAcceptMatch}>
                确认接受工作
              </Button>
            )}
            {auth?.isAuthenticated && (auth?.user?.role === 'worker' || auth?.user?.role === 'team') && job.status === 'open' && myMatch && (
              <Tag color="blue">已申请</Tag>
            )}
            {!auth?.isAuthenticated && job.status === 'open' && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => navigate('/login')}
              >
                登录后申请
              </Button>
            )}
            {job.status !== 'open' && (
              <Button type="primary" size="large" disabled>
                该招工已结束
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {myMatch && renderProcessGuarantee()}

      {renderTimeline()}

      <Card title="责任角色边界" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" title={<><TeamOutlined /> 企业责任</>}>
              <ul style={{ color: '#666', fontSize: 12, paddingLeft: 20 }}>
                <li>按时足额支付工资</li>
                <li>提供安全防护措施</li>
                <li>及时确认考勤记录</li>
                <li>按时确认工作验收</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title={<><UserOutlined /> 工友责任</>}>
              <ul style={{ color: '#666', fontSize: 12, paddingLeft: 20 }}>
                <li>按时上下班打卡</li>
                <li>遵守安全操作规程</li>
                <li>保证工作质量</li>
                <li>配合工资结算</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title={<><SafetyOutlined /> 平台责任</>}>
              <ul style={{ color: '#666', fontSize: 12, paddingLeft: 20 }}>
                <li>保证金托管监管</li>
                <li>合同备案管理</li>
                <li>纠纷调解仲裁</li>
                <li>信用评价体系</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="提交申请"
        open={applyModal}
        onCancel={() => setApplyModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApply}
        >
          <Form.Item
            name="remark"
            label="申请说明"
          >
            <TextArea rows={3} placeholder="请简要说明您的相关经验和优势" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认申请
              </Button>
              <Button onClick={() => setApplyModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发起纠纷"
        open={disputeModal}
        onCancel={() => setDisputeModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="纠纷类型">
            <Select placeholder="请选择纠纷类型">
              <Option value="wage">工资争议</Option>
              <Option value="attendance">考勤争议</Option>
              <Option value="safety">安全问题</Option>
              <Option value="other">其他问题</Option>
            </Select>
          </Form.Item>
          <Form.Item label="纠纷描述">
            <TextArea rows={4} placeholder="请详细描述纠纷情况" />
          </Form.Item>
          <Form.Item>
            <Upload>
              <Button icon={<UploadOutlined />}>上传证据</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">提交</Button>
              <Button onClick={() => setDisputeModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default JobDetail;
