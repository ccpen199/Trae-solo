import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Row, Col, Statistic, Alert, Tabs, List, Progress, Badge, Modal, Rate, Input, message, Select, Descriptions, Divider, Timeline } from 'antd';
import {
  AlertOutlined, ClockCircleOutlined, WarningOutlined,
  CheckCircleOutlined, StarOutlined, DislikeOutlined,
  ExclamationCircleOutlined, BellOutlined, SafetyOutlined,
  SendOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { TextArea } = Input;
const { Option } = Select;

function AdminAudit() {
  const [dashboard, setDashboard] = useState(null);
  const [overdue, setOverdue] = useState({ overdue: [], count: 0 });
  const [badReviews, setBadReviews] = useState({ badReviews: [], count: 0 });
  const [replyVisible, setReplyVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [remindVisible, setRemindVisible] = useState(false);
  const [selectedOverdue, setSelectedOverdue] = useState(null);
  const [followUpVisible, setFollowUpVisible] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [followUpText, setFollowUpText] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try { setDashboard(await api.get('/admin/dashboard')); } catch (e) {}
    try { setOverdue(await api.get('/admin/overdue-warning')); } catch (e) {}
    try { setBadReviews(await api.get('/admin/bad-review')); } catch (e) {}
  };

  const handleRemind = (record) => {
    setSelectedOverdue(record);
    setRemindVisible(true);
  };

  const sendRemind = () => {
    message.success(`已向 ${selectedOverdue?.department || '承办部门'} 发送催办通知`);
    setRemindVisible(false);
  };

  const handleReply = (record) => {
    setSelectedReview(record);
    setReplyVisible(true);
  };

  const submitReply = () => {
    message.success('整改回复已提交，将通知申请人');
    setReplyVisible(false);
    loadAll();
  };

  const handleFollowUp = (record) => {
    setSelectedFollowUp(record);
    setFollowUpVisible(true);
  };

  const submitFollowUp = () => {
    message.success('满意度回访已发起');
    setFollowUpVisible(false);
  };

  const overdueColumns = [
    { title: '申请编号', dataIndex: 'application_no', key: 'application_no', width: 150 },
    { title: '服务名称', dataIndex: 'service_name', key: 'service_name' },
    { title: '申请人', dataIndex: 'user_name', key: 'user_name', width: 80 },
    {
      title: '超时天数', dataIndex: 'days_passed', key: 'days_passed', width: 100,
      render: (d) => <Tag color="red">超 {Math.round(d)} 天</Tag>
    },
    {
      title: '状态', key: 'status', width: 100,
      render: (_, record) => <Tag color={record.reminded ? 'warning' : 'error'}>{record.reminded ? '已催办' : '待催办'}</Tag>
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" danger onClick={() => handleRemind(record)}>催办</Button>
          <Button size="small" onClick={() => message.info('已标记为加急')}>加急</Button>
        </Space>
      )
    }
  ];

  const badReviewColumns = [
    { title: '申请编号', dataIndex: 'application_no', key: 'application_no', width: 150 },
    { title: '服务名称', dataIndex: 'service_name', key: 'service_name' },
    { title: '申请人', dataIndex: 'user_name', key: 'user_name', width: 80 },
    {
      title: '评分', dataIndex: 'rating', key: 'rating', width: 140,
      render: (r) => <Rate disabled value={r} style={{ fontSize: 14 }} />
    },
    {
      title: '评价内容', dataIndex: 'feedback', key: 'feedback',
      render: (f) => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f || '无'}</span>
    },
    {
      title: '整改', key: 'rectify', width: 80,
      render: (_, record) => <Tag color={record.rectified ? 'success' : 'error'}>{record.rectified ? '已整改' : '待整改'}</Tag>
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" danger onClick={() => handleReply(record)}>整改回复</Button>
          <Button size="small" onClick={() => handleFollowUp(record)}>回访</Button>
        </Space>
      )
    }
  ];

  const followUpList = [
    { id: 1, name: '张三', service: '身份证办理', rating: 5, status: '已回访', phone: '138****0001', followUpResult: '满意' },
    { id: 2, name: '李四', service: '社保查询', rating: 3, status: '待回访', phone: '138****0002', followUpResult: null },
    { id: 3, name: '王五', service: '医保报销', rating: 4, status: '已回访', phone: '138****0003', followUpResult: '基本满意' },
    { id: 4, name: '赵六', service: '公积金提取', rating: 2, status: '待回访', phone: '138****0004', followUpResult: null },
    { id: 5, name: '孙七', service: '婚姻登记预约', rating: 1, status: '待回访', phone: '138****0005', followUpResult: null },
    { id: 6, name: '周八', service: '低保申请', rating: 4, status: '已回访', phone: '138****0006', followUpResult: '满意' },
  ];

  return (
    <div>
      <Alert
        message="办件质量审计模块"
        description="实时监控办件质量：超时预警自动标记→差评整改闭环→满意度回访跟踪→质量指标看板"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={6}>
          <Card>
            <Statistic
              title="超时预警"
              value={overdue.count}
              prefix={<AlertOutlined />}
              valueStyle={{ color: overdue.count > 0 ? '#ff4d4f' : '#52c41a' }}
            />
            {overdue.count > 0 && <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 8 }}>需立即催办</div>}
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic
              title="差评待整改"
              value={badReviews.count}
              prefix={<DislikeOutlined />}
              valueStyle={{ color: badReviews.count > 0 ? '#faad14' : '#52c41a' }}
            />
            {badReviews.count > 0 && <div style={{ fontSize: 12, color: '#faad14', marginTop: 8 }}>需5日内完成整改</div>}
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic
              title="平均满意度"
              value={dashboard?.statistics?.avgRating || 4.2}
              suffix="/ 5.0"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic
              title="待回访件"
              value={followUpList.filter(f => f.status === '待回访').length}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12}>
          <Card title="满意度分布">
            <Space direction="vertical" style={{ width: '100%' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const percent = star === 5 ? 58 : star === 4 ? 22 : star === 3 ? 12 : star === 2 ? 5 : 3;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 40 }}>{star}星</span>
                    <Progress percent={percent} size="small" style={{ flex: 1 }} strokeColor={star >= 4 ? '#52c41a' : star === 3 ? '#faad14' : '#ff4d4f'} />
                    <span style={{ width: 40, textAlign: 'right' }}>{percent}%</span>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
        <Col xs={12}>
          <Card title="办件质量指标">
            <Space direction="vertical" style={{ width: '100%' }}>
              {[
                { name: '按时办结率', value: 94, threshold: 90 },
                { name: '一次性通过率', value: 87, threshold: 85 },
                { name: '群众满意度', value: 92, threshold: 90 },
                { name: '差评整改率', value: 85, threshold: 80 },
                { name: '回访覆盖率', value: 78, threshold: 80 },
                { name: '超时办结率', value: 6, threshold: 10, inverse: true },
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ width: 100 }}>{item.name}</span>
                  <Progress
                    percent={item.inverse ? 100 - item.value : item.value}
                    size="small"
                    style={{ width: 180 }}
                    strokeColor={item.inverse ? (item.value <= item.threshold ? '#52c41a' : '#ff4d4f') : (item.value >= item.threshold ? '#52c41a' : '#ff4d4f')}
                    format={() => `${item.value}%`}
                  />
                  <Tag color={item.inverse ? (item.value <= item.threshold ? 'success' : 'error') : (item.value >= item.threshold ? 'success' : 'error')}
                    style={{ width: 50, textAlign: 'center' }}>
                    {item.inverse ? (item.value <= item.threshold ? '达标' : '超标') : (item.value >= item.threshold ? '达标' : '未达标')}
                  </Tag>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Tabs defaultActiveKey="overdue">
          <Tabs.TabPane
            tab={<Badge count={overdue.count} size="small"><Space><AlertOutlined />超时预警</Space></Badge>}
            key="overdue"
          >
            <Alert
              message={overdue.count > 0 ? `当前有 ${overdue.count} 件超时办件需要处理` : '暂无超时办件'}
              type={overdue.count > 0 ? 'error' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={overdueColumns}
              dataSource={overdue.overdue}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={<Badge count={badReviews.count} size="small"><Space><DislikeOutlined />差评整改</Space></Badge>}
            key="badReview"
          >
            <Alert
              message={badReviews.count > 0 ? `当前有 ${badReviews.count} 条差评需要整改回复，整改时限5个工作日` : '暂无差评'}
              type={badReviews.count > 0 ? 'warning' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={badReviewColumns}
              dataSource={badReviews.badReviews}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={<Badge count={followUpList.filter(f => f.status === '待回访').length} size="small"><Space><BellOutlined />满意度回访</Space></Badge>}
            key="followup"
          >
            <Alert
              message="回访覆盖率需达到80%以上，请及时完成待回访件"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <List
              dataSource={followUpList}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={item.status === '已回访' ? 'success' : 'warning'}>{item.status}</Tag>,
                    item.status === '已回访' ? (
                      <Tag color="blue">{item.followUpResult}</Tag>
                    ) : (
                      <Button size="small" type="primary" onClick={() => handleFollowUp(item)}>发起回访</Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={<StarOutlined style={{ color: item.rating >= 4 ? '#52c41a' : item.rating >= 3 ? '#faad14' : '#ff4d4f', fontSize: 20 }} />}
                    title={<Space><span>{item.name}</span><span style={{ color: '#999' }}>·</span><span>{item.service}</span><Rate disabled value={item.rating} style={{ fontSize: 12 }} /></Space>}
                    description={<span style={{ fontSize: 12, color: '#999' }}>联系电话：{item.phone}</span>}
                  />
                </List.Item>
              )}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Card title="审计操作记录">
        <Timeline
          items={[
            { color: 'red', children: <div><Space><Tag color="red">催办</Tag><span>身份证办理 - 超时10天</span></Space><div style={{ fontSize: 12, color: '#999' }}>管理员 · 2分钟前</div></div> },
            { color: 'orange', children: <div><Space><Tag color="orange">整改</Tag><span>公积金提取 - 差评整改回复已提交</span></Space><div style={{ fontSize: 12, color: '#999' }}>质量审核员 · 30分钟前</div></div> },
            { color: 'green', children: <div><Space><Tag color="green">回访</Tag><span>身份证办理 - 满意度回访完成</span></Space><div style={{ fontSize: 12, color: '#999' }}>回访专员 · 1小时前</div></div> },
            { color: 'blue', children: <div><Space><Tag color="blue">发布</Tag><span>社保查询 - 事项配置更新</span></Space><div style={{ fontSize: 12, color: '#999' }}>管理员 · 2小时前</div></div> },
            { color: 'blue', children: <div><Space><Tag color="blue">审核</Tag><span>医保报销 - 流程步骤通过复查</span></Space><div style={{ fontSize: 12, color: '#999' }}>质量审核员 · 3小时前</div></div> },
          ]}
        />
      </Card>

      <Modal title="催办通知" open={remindVisible} onCancel={() => setRemindVisible(false)}
        onOk={sendRemind} okText="发送催办">
        {selectedOverdue && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="申请编号">{selectedOverdue.application_no}</Descriptions.Item>
              <Descriptions.Item label="服务事项">{selectedOverdue.service_name}</Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedOverdue.user_name}</Descriptions.Item>
              <Descriptions.Item label="超时天数"><Tag color="red">超 {Math.round(selectedOverdue.days_passed)} 天</Tag></Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Alert message="催办通知将同时发送至承办部门和申请人" type="info" showIcon />
            </div>
          </div>
        )}
      </Modal>

      <Modal title="差评整改回复" open={replyVisible} onCancel={() => setReplyVisible(false)}
        onOk={submitReply} okText="提交整改">
        {selectedReview && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="申请人">{selectedReview.user_name}</Descriptions.Item>
              <Descriptions.Item label="服务事项">{selectedReview.service_name}</Descriptions.Item>
              <Descriptions.Item label="评分"><Rate disabled value={selectedReview.rating} /></Descriptions.Item>
              <Descriptions.Item label="评价内容">{selectedReview.feedback || '无'}</Descriptions.Item>
            </Descriptions>
            <Divider>整改措施</Divider>
            <TextArea rows={4} placeholder="请输入整改措施和回复内容" value={replyText} onChange={e => setReplyText(e.target.value)} />
            <div style={{ marginTop: 12 }}>
              <Select placeholder="选择整改类型" style={{ width: '100%' }}>
                <Option value="process">流程优化</Option>
                <Option value="material">材料精简</Option>
                <Option value="time">时限压缩</Option>
                <Option value="attitude">服务态度</Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      <Modal title="满意度回访" open={followUpVisible} onCancel={() => setFollowUpVisible(false)}
        onOk={submitFollowUp} okText="确认回访">
        {selectedFollowUp && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="姓名">{selectedFollowUp.name}</Descriptions.Item>
              <Descriptions.Item label="服务事项">{selectedFollowUp.service}</Descriptions.Item>
              <Descriptions.Item label="原始评分"><Rate disabled value={selectedFollowUp.rating} /></Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedFollowUp.phone}</Descriptions.Item>
            </Descriptions>
            <Divider>回访记录</Divider>
            <div style={{ marginBottom: 12 }}>
              <span>回访满意度：</span>
              <Rate defaultValue={selectedFollowUp.rating} />
            </div>
            <TextArea rows={3} placeholder="记录回访内容和用户反馈" value={followUpText} onChange={e => setFollowUpText(e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminAudit;
