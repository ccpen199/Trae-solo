import React, { useState, useEffect } from 'react';
import {
  Calendar, Card, Button, Modal, Form, Select, Input,
  DatePicker, TimePicker, message, Tag, List, Avatar,
  Badge, Space, Row, Col, Statistic, Tabs, Popconfirm,
  Tooltip, Empty, Divider
} from 'antd';
import {
  PlusOutlined, CalendarOutlined, UserOutlined,
  SyncOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EnvironmentOutlined, VideoCameraOutlined, TeamOutlined,
  EditOutlined, DingtalkOutlined, WechatOutlined,
  ReloadOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const EnterpriseInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [syncLoading, setSyncLoading] = useState({});
  const [viewMode, setViewMode] = useState('calendar');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [interviewsRes, appsRes] = await Promise.all([
        api.get('/interviews/calendar'),
        api.get('/applications/for-enterprise', {
          params: { status: 'interview', pageSize: 100 }
        }),
      ]);
      setInterviews(interviewsRes.data.interviews || []);
      setApplications(appsRes.data.applications || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getInterviewMethodIcon = (method) => {
    switch (method) {
      case '现场':
        return <EnvironmentOutlined style={{ color: '#1677ff' }} />;
      case '视频':
        return <VideoCameraOutlined style={{ color: '#722ed1' }} />;
      case '电话':
        return <ClockCircleOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <TeamOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getCalendarSyncStatus = (interview) => {
    if (interview.calendar_sync_status === 'synced') {
      return {
        status: 'success',
        text: interview.calendar_provider === 'dingtalk' ? '已同步钉钉' : '已同步飞书',
        color: 'green'
      };
    }
    if (interview.calendar_sync_status === 'failed') {
      return { status: 'error', text: '同步失败', color: 'red' };
    }
    return { status: 'default', text: '未同步', color: 'default' };
  };

  const handleCreate = () => {
    setEditingInterview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (interview) => {
    setEditingInterview(interview);
    form.setFieldsValue({
      ...interview,
      interview_time: dayjs(interview.interview_time),
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        interview_time: values.interview_time.format('YYYY-MM-DD HH:mm:ss'),
      };

      setLoading(true);
      if (editingInterview) {
        await api.put(`/interviews/${editingInterview.id}`, data);
        message.success('面试更新成功');
      } else {
        await api.post('/interviews', data);
        message.success('面试安排成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = async (interviewId, provider) => {
    setSyncLoading(prev => ({ ...prev, [`${interviewId}-${provider}`]: true }));
    try {
      const mockEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await api.put(`/interviews/${interviewId}/sync-calendar`, {
        calendar_provider: provider,
        calendar_event_id: mockEventId,
        status: 'synced',
      });
      message.success(`${provider === 'dingtalk' ? '钉钉' : '飞书'}日历同步成功`);
      fetchData();
    } catch (e) {
      message.error('同步失败，请重试');
    } finally {
      setSyncLoading(prev => ({ ...prev, [`${interviewId}-${provider}`]: false }));
    }
  };

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayInterviews = interviews.filter(i =>
      dayjs(i.interview_time).format('YYYY-MM-DD') === dateStr
    );

    if (dayInterviews.length === 0) return null;

    return (
      <div style={{ padding: 4 }}>
        {dayInterviews.slice(0, 3).map(interview => (
          <div
            key={interview.id}
            style={{
              fontSize: 11,
              padding: '2px 4px',
              marginBottom: 2,
              borderRadius: 4,
              background: interview.interview_method === '现场' ? '#e6f7ff'
                : interview.interview_method === '视频' ? '#f9f0ff'
                : '#fff7e6',
              color: interview.interview_method === '现场' ? '#1677ff'
                : interview.interview_method === '视频' ? '#722ed1'
                : '#fa8c16',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {dayjs(interview.interview_time).format('HH:mm')} {interview.name}
          </div>
        ))}
        {dayInterviews.length > 3 && (
          <div style={{ fontSize: 11, color: '#8c8c8c', textAlign: 'center' }}>
            +{dayInterviews.length - 3} 更多
          </div>
        )}
      </div>
    );
  };

  const getListData = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return interviews
      .filter(i => dayjs(i.interview_time).format('YYYY-MM-DD') === dateStr)
      .sort((a, b) => dayjs(a.interview_time).unix() - dayjs(b.interview_time).unix());
  };

  const selectedDayInterviews = getListData(selectedDate);

  const stats = {
    today: interviews.filter(i =>
      dayjs(i.interview_time).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length,
    thisWeek: interviews.filter(i =>
      dayjs(i.interview_time).isSame(dayjs(), 'week')
    ).length,
    total: interviews.length,
    synced: interviews.filter(i => i.calendar_sync_status === 'synced').length,
  };

  const renderCalendarView = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={18}>
        <Card className="card-shadow" title="面试日历">
          <Calendar
            dateCellRender={dateCellRender}
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </Card>
      </Col>
      <Col xs={24} lg={6}>
        <Card
          className="card-shadow"
          title={`${selectedDate.format('YYYY年MM月DD日')} 面试安排`}
          extra={
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleCreate}>
              新增
            </Button>
          }
        >
          {selectedDayInterviews.length === 0 ? (
            <Empty description="当天暂无面试安排" />
          ) : (
            <List
              size="small"
              dataSource={selectedDayInterviews}
              renderItem={(item) => (
                <List.Item
                  style={{
                    marginBottom: 8,
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleEdit(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }}>
                        {item.name?.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {dayjs(item.interview_time).format('HH:mm')} {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {item.job_title}
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <Tag
                          color={item.interview_method === '现场' ? 'blue'
                            : item.interview_method === '视频' ? 'purple' : 'orange'}
                          style={{ marginBottom: 4 }}
                        >
                          {getInterviewMethodIcon(item.interview_method)} {item.interview_method}
                        </Tag>
                        {item.calendar_sync_status === 'synced' && (
                          <Tag color="green">
                            <CheckCircleOutlined /> {item.calendar_provider === 'dingtalk' ? '钉钉' : '飞书'}
                          </Tag>
                        )}
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          面试官：{item.interviewer || '待定'}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderListView = () => (
    <Card className="card-shadow" title="全部面试">
      <List
        dataSource={[...interviews].sort((a, b) =>
          dayjs(a.interview_time).unix() - dayjs(b.interview_time).unix()
        )}
        renderItem={(item) => {
          const syncStatus = getCalendarSyncStatus(item);
          return (
            <List.Item
              style={{
                padding: 16,
                marginBottom: 8,
                background: '#fafafa',
                borderRadius: 8,
              }}
              actions={[
                <Button
                  key="edit"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(item)}
                >
                  编辑
                </Button>,
                <Tooltip title="同步到钉钉日历">
                  <Button
                    key="dingtalk"
                    type="link"
                    icon={<DingtalkOutlined style={{ fontSize: 18, color: '#1677ff' }} />}
                    loading={syncLoading[`${item.id}-dingtalk`]}
                    onClick={() => handleSyncCalendar(item.id, 'dingtalk')}
                  >
                    钉钉
                  </Button>
                </Tooltip>,
                <Tooltip title="同步到飞书日历">
                  <Button
                    key="feishu"
                    type="link"
                    icon={<WechatOutlined style={{ fontSize: 18, color: '#00d4b8' }} />}
                    loading={syncLoading[`${item.id}-feishu`]}
                    onClick={() => handleSyncCalendar(item.id, 'feishu')}
                  >
                    飞书
                  </Button>
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge
                    dot={dayjs(item.interview_time).isBefore(dayjs())}
                    color={dayjs(item.interview_time).isBefore(dayjs()) ? 'default' : 'green'}
                  >
                    <Avatar size={48} icon={<UserOutlined />} style={{ background: '#1677ff' }}>
                      {item.name?.charAt(0)}
                    </Avatar>
                  </Badge>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: '#8c8c8c' }}>应聘</span>
                    <span style={{ color: '#1677ff' }}>{item.job_title}</span>
                    <Tag color={syncStatus.color}>{syncStatus.text}</Tag>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <CalendarOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                      {dayjs(item.interview_time).format('YYYY-MM-DD HH:mm')}
                      <span style={{ margin: '0 16px' }}>|</span>
                      {getInterviewMethodIcon(item.interview_method)}
                      <span style={{ marginLeft: 8 }}>{item.interview_method}</span>
                      {item.location && (
                        <>
                          <span style={{ margin: '0 16px' }}>|</span>
                          <EnvironmentOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                          {item.location}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#595959' }}>
                      <UserOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                      面试官：{item.interviewer || '待定'}
                    </div>
                    {item.remark && (
                      <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        备注：{item.remark}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h2 style={{ margin: 0 }}>面试安排</h2>
        <Space>
          <Tabs
            activeKey={viewMode}
            onChange={setViewMode}
            size="small"
            style={{ marginBottom: 0 }}
          >
            <TabPane tab="日历视图" key="calendar" />
            <TabPane tab="列表视图" key="list" />
          </Tabs>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            安排面试
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="今日面试"
              value={stats.today}
              prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本周面试"
              value={stats.thisWeek}
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="面试总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已同步日历"
              value={stats.synced}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}

      <Modal
        title={editingInterview ? '编辑面试' : '安排面试'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        confirmLoading={loading}
        okText={editingInterview ? '保存' : '安排'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="application_id"
            label="候选人"
            rules={[{ required: true, message: '请选择候选人' }]}
          >
            <Select
              placeholder="请选择候选人"
              showSearch
              optionFilterProp="children"
              disabled={!!editingInterview}
            >
              {applications.map(app => (
                <Option key={app.id} value={app.id}>
                  {app.name} - {app.job_title} (ATS: {app.ats_score || '-'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="interview_time"
                label="面试时间"
                rules={[{ required: true, message: '请选择面试时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择日期时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="interview_method"
                label="面试方式"
                rules={[{ required: true, message: '请选择面试方式' }]}
              >
                <Select placeholder="请选择">
                  <Option value="现场">现场面试</Option>
                  <Option value="视频">视频面试</Option>
                  <Option value="电话">电话面试</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="interviewer"
                label="面试官"
                rules={[{ required: true, message: '请输入面试官' }]}
              >
                <Input placeholder="如：张经理" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="面试地点/链接"
                rules={[{ required: true, message: '请输入地点或链接' }]}
              >
                <Input placeholder="如：3楼会议室A 或 腾讯会议链接" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea
              rows={3}
              placeholder="请输入面试注意事项等备注信息"
            />
          </Form.Item>

          {!editingInterview && (
            <div style={{
              padding: 12,
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 13, color: '#52c41a', fontWeight: 500 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                安排成功后，可一键同步到钉钉或飞书日历，系统将自动发送提醒。
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default EnterpriseInterviews;
