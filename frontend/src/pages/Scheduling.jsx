import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Table,
  Tag,
  Space,
  message,
  Alert,
  Row,
  Col,
  Divider,
} from 'antd';
import { PlusOutlined, CalendarOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { casesApi, courtsApi, judgesApi, clerksApi, schedulesApi, notificationsApi } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Scheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [cases, setCases] = useState([]);
  const [courts, setCourts] = useState([]);
  const [judges, setJudges] = useState([]);
  const [clerks, setClerks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [postponeSchedule, setPostponeSchedule] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [postponeConflicts, setPostponeConflicts] = useState([]);
  const [selectedDate, setSelectedDate] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [form] = Form.useForm();
  const [postponeForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [schedulesRes, casesRes, courtsRes, judgesRes, clerksRes] = await Promise.all([
        schedulesApi.getAll({
          start_date: selectedDate[0].format('YYYY-MM-DD'),
          end_date: selectedDate[1].format('YYYY-MM-DD'),
        }),
        casesApi.getAll({ status: 'pending_scheduling' }),
        courtsApi.getAll(),
        judgesApi.getAll(),
        clerksApi.getAll(),
      ]);
      setSchedules(schedulesRes.data);
      setCases(casesRes.data);
      setCourts(courtsRes.data);
      setJudges(judgesRes.data);
      setClerks(clerksRes.data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleCheckConflicts = async (values) => {
    if (values.court_id && values.judge_id && values.start_time && values.end_time) {
      try {
        const startTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.start_time.format('HH:mm')).toISOString();
        const endTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.end_time.format('HH:mm')).toISOString();
        
        const res = await schedulesApi.checkConflicts({
          court_id: values.court_id,
          judge_id: values.judge_id,
          start_time: startTime,
          end_time: endTime,
        });
        setConflicts(res.data.conflicts || []);
      } catch (error) {
        if (error.response?.data?.conflicts) {
          setConflicts(error.response.data.conflicts);
        }
      }
    }
  };

  const handleCreateSchedule = async (values) => {
    try {
      const startTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.start_time.format('HH:mm')).toISOString();
      const endTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.end_time.format('HH:mm')).toISOString();
      
      const conflictRes = await schedulesApi.checkConflicts({
        court_id: values.court_id,
        judge_id: values.judge_id,
        start_time: startTime,
        end_time: endTime,
      });
      
      if (conflictRes.data.conflicts && conflictRes.data.conflicts.length > 0) {
        message.error('存在排期冲突，请调整时间');
        setConflicts(conflictRes.data.conflicts);
        return;
      }

      const res = await schedulesApi.create({
        case_id: values.case_id,
        court_id: values.court_id,
        judge_id: values.judge_id,
        clerk_id: values.clerk_id,
        start_time: startTime,
        end_time: endTime,
        hearing_type: values.hearing_type,
      });

      await notificationsApi.generate({ schedule_id: res.data.id });
      
      message.success('排期创建成功，已自动生成开庭通知');
      setIsModalOpen(false);
      form.resetFields();
      setConflicts([]);
      loadData();
    } catch (error) {
      if (error.response?.data?.conflicts) {
        setConflicts(error.response.data.conflicts);
        message.error('存在排期冲突');
      } else {
        message.error(error.response?.data?.error || '排期创建失败');
      }
    }
  };

  const handlePostpone = (schedule) => {
    setPostponeSchedule(schedule);
    postponeForm.setFieldsValue({
      court_id: schedule.court_id,
      judge_id: schedule.judge_id,
      clerk_id: schedule.clerk_id,
      hearing_type: schedule.hearing_type,
      application_reason: '当事人申请改期',
    });
    setPostponeConflicts([]);
    setIsPostponeModalOpen(true);
  };

  const handleCheckPostponeConflicts = async (values) => {
    if (values.court_id && values.judge_id && values.start_time && values.end_time) {
      try {
        const startTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.start_time.format('HH:mm')).toISOString();
        const endTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.end_time.format('HH:mm')).toISOString();
        
        const res = await schedulesApi.checkConflicts({
          court_id: values.court_id,
          judge_id: values.judge_id,
          start_time: startTime,
          end_time: endTime,
          exclude_schedule_id: postponeSchedule.id,
        });
        setPostponeConflicts(res.data.conflicts || []);
      } catch (error) {
        if (error.response?.data?.conflicts) {
          setPostponeConflicts(error.response.data.conflicts);
        }
      }
    }
  };

  const handleSubmitPostpone = async (values) => {
    try {
      const startTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.start_time.format('HH:mm')).toISOString();
      const endTime = dayjs(values.date.format('YYYY-MM-DD') + ' ' + values.end_time.format('HH:mm')).toISOString();
      
      const conflictRes = await schedulesApi.checkConflicts({
        court_id: values.court_id,
        judge_id: values.judge_id,
        start_time: startTime,
        end_time: endTime,
        exclude_schedule_id: postponeSchedule.id,
      });
      
      if (conflictRes.data.conflicts && conflictRes.data.conflicts.length > 0) {
        message.error('存在排期冲突，请调整时间');
        setPostponeConflicts(conflictRes.data.conflicts);
        return;
      }

      await schedulesApi.postpone(postponeSchedule.id, {
        application_reason: values.application_reason,
        applicant: '系统管理员',
        new_schedule_data: {
          case_id: postponeSchedule.case_id,
          court_id: values.court_id,
          judge_id: values.judge_id,
          clerk_id: values.clerk_id,
          start_time: startTime,
          end_time: endTime,
          hearing_type: values.hearing_type,
        },
      });

      message.success('改期成功');
      setIsPostponeModalOpen(false);
      postponeForm.resetFields();
      setPostponeSchedule(null);
      setPostponeConflicts([]);
      loadData();
    } catch (error) {
      if (error.response?.data?.conflicts) {
        setPostponeConflicts(error.response.data.conflicts);
        message.error('存在排期冲突');
      } else {
        message.error(error.response?.data?.error || '改期失败');
      }
    }
  };

  const groupedByCourt = courts.reduce((acc, court) => {
    acc[court.id] = schedules.filter(s => s.court_id === court.id);
    return acc;
  }, {});

  const columns = [
    { title: '案号', dataIndex: 'case_number', key: 'case_number' },
    { title: '案由', dataIndex: 'case_reason', key: 'case_reason' },
    { title: '法官', dataIndex: 'judge_name', key: 'judge_name' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time' },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time' },
    {
      title: '庭审方式',
      dataIndex: 'hearing_type',
      key: 'hearing_type',
      render: (type) => {
        const typeMap = { in_person: '线下', online: '线上', hybrid: '线上线下结合' };
        return typeMap[type] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          scheduled: { color: 'green', text: '已排期' },
          ongoing: { color: 'blue', text: '审理中' },
          completed: { color: 'gray', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
          postponed: { color: 'orange', text: '已改期' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'scheduled' && (
            <Button type="link" onClick={() => handlePostpone(record)}>
              申请改期
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>排期日历</h2>
        <Space>
          <RangePicker
            value={selectedDate}
            onChange={setSelectedDate}
            format="YYYY-MM-DD"
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建排期
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {courts.map((court) => (
          <Col span={12} key={court.id}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  {court.name}
                  <Tag color="blue">{court.type}</Tag>
                </Space>
              }
              size="small"
            >
              {groupedByCourt[court.id]?.length > 0 ? (
                <Table
                  columns={columns.filter(c => !['法庭'].includes(c.title))}
                  dataSource={groupedByCourt[court.id].map(s => ({ ...s, key: s.id }))}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  该时间段无排期
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <Card title="全部排期列表">
        <Table
          columns={columns}
          dataSource={schedules.map(s => ({ ...s, key: s.id }))}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建排期"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setConflicts([]);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        {conflicts.length > 0 && (
          <Alert
            message="排期冲突"
            description={
              <ul>
                {conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleCreateSchedule} onValuesChange={handleCheckConflicts}>
          <Form.Item name="case_id" label="选择案件" rules={[{ required: true }]}>
            <Select placeholder="请选择待排期案件" showSearch>
              {cases.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.case_number} - {c.case_reason}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="court_id" label="选择法庭" rules={[{ required: true }]}>
            <Select placeholder="请选择法庭" showSearch>
              {courts.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="judge_id" label="选择法官" rules={[{ required: true }]}>
            <Select placeholder="请选择法官" showSearch>
              {judges.map((j) => (
                <Option key={j.id} value={j.id}>
                  {j.name} - {j.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="clerk_id" label="选择书记员">
            <Select placeholder="请选择书记员" showSearch>
              {clerks.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="开庭日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="开始时间" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="结束时间" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="hearing_type" label="庭审方式" initialValue="in_person">
            <Select>
              <Option value="in_person">线下</Option>
              <Option value="online">线上</Option>
              <Option value="hybrid">线上线下结合</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请改期"
        open={isPostponeModalOpen}
        onCancel={() => {
          setIsPostponeModalOpen(false);
          setPostponeConflicts([]);
          postponeForm.resetFields();
          setPostponeSchedule(null);
        }}
        onOk={() => postponeForm.submit()}
        width={600}
      >
        {postponeSchedule && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <div><strong>原排期信息：</strong></div>
            <div>案号：{postponeSchedule.case_number}</div>
            <div>案由：{postponeSchedule.case_reason}</div>
            <div>原时间：{postponeSchedule.start_time} - {postponeSchedule.end_time}</div>
            <div>原法庭：{postponeSchedule.court_name}</div>
            <div>原法官：{postponeSchedule.judge_name}</div>
          </div>
        )}

        {postponeConflicts.length > 0 && (
          <Alert
            message="排期冲突"
            description={
              <ul>
                {postponeConflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={postponeForm} layout="vertical" onFinish={handleSubmitPostpone} onValuesChange={handleCheckPostponeConflicts}>
          <Form.Item name="court_id" label="选择法庭" rules={[{ required: true }]}>
            <Select placeholder="请选择法庭" showSearch>
              {courts.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="judge_id" label="选择法官" rules={[{ required: true }]}>
            <Select placeholder="请选择法官" showSearch>
              {judges.map((j) => (
                <Option key={j.id} value={j.id}>
                  {j.name} - {j.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="clerk_id" label="选择书记员">
            <Select placeholder="请选择书记员" showSearch>
              {clerks.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="新开庭日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="开始时间" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="结束时间" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="hearing_type" label="庭审方式" initialValue="in_person">
            <Select>
              <Option value="in_person">线下</Option>
              <Option value="online">线上</Option>
              <Option value="hybrid">线上线下结合</Option>
            </Select>
          </Form.Item>
          <Form.Item name="application_reason" label="改期原因" rules={[{ required: true }]}>
            <Select>
              <Option value="当事人申请改期">当事人申请改期</Option>
              <Option value="法官时间冲突">法官时间冲突</Option>
              <Option value="法庭设备故障">法庭设备故障</Option>
              <Option value="其他原因">其他原因</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Scheduling;
