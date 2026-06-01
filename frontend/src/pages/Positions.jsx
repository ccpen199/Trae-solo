import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Typography, Tag, InputNumber, Space, DatePicker, Radio } from 'antd';
import { PlusOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined, ArrowRightOutlined, StopOutlined, RetweetOutlined } from '@ant-design/icons';
import { positionApi, projectApi, candidateApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsVisible, setApplicationsVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [eliminateModalVisible, setEliminateModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [processType, setProcessType] = useState('next'); // next, eliminate, repeat
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const [eliminateForm] = Form.useForm();
  const navigate = useNavigate();

  const STAGES = [
    { key: 'screening', name: '简历筛选', next: 'phone_interview' },
    { key: 'phone_interview', name: '电话沟通', next: 'client_recommend' },
    { key: 'client_recommend', name: '推荐客户', next: 'interview' },
    { key: 'interview', name: '面试', next: 'offer' },
    { key: 'offer', name: 'Offer', next: 'onboard' },
    { key: 'onboard', name: '入职', next: null },
    { key: 'eliminated', name: '淘汰', next: null }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [positionsRes, projectsRes] = await Promise.all([
        positionApi.list(),
        projectApi.list()
      ]);
      setPositions(positionsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPosition(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPosition(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPosition) {
        await positionApi.update(editingPosition.id, values);
        message.success('岗位更新成功');
      } else {
        await positionApi.create(values);
        message.success('岗位创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleStatus = async (record, newStatus) => {
    try {
      await positionApi.updateStatus(record.id, newStatus);
      message.success('状态更新成功');
      loadData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleViewApplications = async (record) => {
    setSelectedPosition(record);
    try {
      const response = await candidateApi.getApplications(record.id);
      setApplications(response.data);
      setApplicationsVisible(true);
    } catch (error) {
      message.error('加载应聘记录失败');
    }
  };

  const getNextStage = (currentStage) => {
    const stage = STAGES.find(s => s.key === currentStage);
    return stage?.next || null;
  };

  const getAvailableStages = (currentStage) => {
    const currentIndex = STAGES.findIndex(s => s.key === currentStage);
    if (currentIndex === -1) return STAGES.filter(s => s.key !== 'eliminated');
    return STAGES.filter((s, idx) => idx >= currentIndex && s.key !== 'eliminated');
  };

  const handleNextStage = (application) => {
    setSelectedApplication(application);
    setProcessType('next');
    const nextStage = getNextStage(application.current_stage);
    processForm.setFieldsValue({
      stage: nextStage || application.current_stage,
      status: 'pending',
      result: 'pass'
    });
    setProcessModalVisible(true);
  };

  const handleEliminate = (application) => {
    setSelectedApplication(application);
    setProcessType('eliminate');
    eliminateForm.resetFields();
    setEliminateModalVisible(true);
  };

  const handleRepeatPool = (application) => {
    setSelectedApplication(application);
    setProcessType('repeat');
    processForm.setFieldsValue({
      stage: 'screening',
      status: 'pending',
      result: 'pass'
    });
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = async () => {
    try {
      const values = await processForm.validateFields();
      if (processType === 'repeat') {
        await candidateApi.createApplication({
          candidate_id: selectedApplication.candidate_id,
          position_id: selectedPosition.id,
          is_repeat: 1
        });
        message.success('重复入池成功');
      } else {
        await candidateApi.updateStage(selectedApplication.id, {
          ...values,
          interview_time: values.interview_time ? values.interview_time.toISOString() : null
        });
        message.success('阶段更新成功');
      }
      setProcessModalVisible(false);
      handleViewApplications(selectedPosition);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEliminateSubmit = async () => {
    try {
      const values = await eliminateForm.validateFields();
      await candidateApi.eliminate(selectedApplication.id, {
        ...values,
        stage: selectedApplication.current_stage
      });
      message.success('淘汰成功');
      setEliminateModalVisible(false);
      handleViewApplications(selectedPosition);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStageName = (stage) => {
    const stageMap = {
      screening: '简历筛选',
      phone_interview: '电话沟通',
      client_recommend: '推荐客户',
      interview: '面试',
      offer: 'Offer',
      onboard: '入职',
      eliminated: '淘汰'
    };
    return stageMap[stage] || stage;
  };

  const columns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '所属项目',
      dataIndex: 'project_name',
      key: 'project_name'
    },
    {
      title: '招聘人数',
      dataIndex: 'headcount',
      key: 'headcount'
    },
    {
      title: '薪资范围',
      dataIndex: 'salary_range',
      key: 'salary_range'
    },
    {
      title: '工作地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const priorityMap = {
          high: { color: 'red', text: '高' },
          normal: { color: 'blue', text: '中' },
          low: { color: 'default', text: '低' }
        };
        const config = priorityMap[priority] || priorityMap.normal;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          open: { color: 'green', text: '招聘中' },
          paused: { color: 'orange', text: '暂停' },
          closed: { color: 'default', text: '已关闭' }
        };
        const config = statusMap[status] || statusMap.open;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 'open' ? (
            <Button type="text" icon={<PauseCircleOutlined />} onClick={() => handleToggleStatus(record, 'paused')}>
              暂停
            </Button>
          ) : record.status === 'paused' ? (
            <Button type="text" icon={<PlayCircleOutlined />} onClick={() => handleToggleStatus(record, 'open')}>
              恢复
            </Button>
          ) : null}
          <Button type="text" onClick={() => handleViewApplications(record)}>
            候选人
          </Button>
        </Space>
      )
    }
  ];

  const applicationColumns = [
    {
      title: '候选人姓名',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '当前阶段',
      dataIndex: 'current_stage',
      key: 'current_stage',
      render: (stage) => <Tag color={stage === 'eliminated' ? 'red' : 'blue'}>{getStageName(stage)}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'stage_status',
      key: 'stage_status',
      render: (status) => (
        <Tag color={status === 'pending' ? 'orange' : 'green'}>
          {status === 'pending' ? '进行中' : '已完成'}
        </Tag>
      )
    },
    {
      title: '重复入池',
      dataIndex: 'is_repeat',
      key: 'is_repeat',
      render: (isRepeat) => isRepeat ? <Tag color="red">是</Tag> : '-'
    },
    {
      title: '入池次数',
      dataIndex: 'pool_count',
      key: 'pool_count'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.current_stage !== 'eliminated' && record.current_stage !== 'onboard' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<ArrowRightOutlined />}
              onClick={() => handleNextStage(record)}
            >
              推进
            </Button>
          )}
          {record.current_stage !== 'eliminated' && (
            <Button 
              danger 
              size="small" 
              icon={<StopOutlined />}
              onClick={() => handleEliminate(record)}
            >
              淘汰
            </Button>
          )}
          {record.current_stage === 'eliminated' && (
            <Button 
              type="primary" 
              size="small" 
              ghost
              icon={<RetweetOutlined />}
              onClick={() => handleRepeatPool(record)}
            >
              重复入池
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>岗位管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增岗位
        </Button>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Table
          dataSource={positions}
          columns={columns}
          rowKey="id"
          loading={loading}
          className="card-shadow"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingPosition ? '编辑岗位' : '新增岗位'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
            <Select placeholder="请选择项目">
              {projects.map(project => (
                <Option key={project.id} value={project.id}>{project.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
            <Input placeholder="请输入岗位名称" />
          </Form.Item>
          <Form.Item name="department" label="所属部门">
            <Input placeholder="请输入所属部门" />
          </Form.Item>
          <Form.Item name="job_description" label="岗位描述">
            <Input.TextArea rows={3} placeholder="请输入岗位描述" />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <Input.TextArea rows={3} placeholder="请输入任职要求" />
          </Form.Item>
          <Form.Item name="headcount" label="招聘人数">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入招聘人数" />
          </Form.Item>
          <Form.Item name="salary_range" label="薪资范围">
            <Input placeholder="例如：15k-25k" />
          </Form.Item>
          <Form.Item name="location" label="工作地点">
            <Input placeholder="请输入工作地点" />
          </Form.Item>
          <Form.Item name="batch" label="招聘批次">
            <Input placeholder="请输入招聘批次" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择优先级">
              <Option value="high">高</Option>
              <Option value="normal">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedPosition?.title} - 候选人列表`}
        open={applicationsVisible}
        onCancel={() => setApplicationsVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={applications}
          columns={applicationColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Modal>

      <Modal
        title={processType === 'repeat' ? '重复入池' : '推进阶段'}
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => setProcessModalVisible(false)}
        width={600}
      >
        <Form form={processForm} layout="vertical">
          {processType !== 'repeat' && (
            <>
              <Form.Item name="stage" label="阶段" rules={[{ required: true }]}>
                <Select placeholder="请选择阶段">
                  {selectedApplication && getAvailableStages(selectedApplication.current_stage).map(stage => (
                    <Option key={stage.key} value={stage.key}>{stage.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="pending">进行中</Radio>
                  <Radio value="completed">已完成</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="result" label="结果">
                <Select placeholder="请选择结果">
                  <Option value="pass">通过</Option>
                  <Option value="fail">不通过</Option>
                </Select>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.stage !== curr.stage}>
                {({ getFieldValue }) => 
                  getFieldValue('stage') === 'interview' && (
                    <Form.Item name="interview_time" label="面试时间">
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  )
                }
              </Form.Item>
              <Form.Item name="notes" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </>
          )}
          {processType === 'repeat' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p>确认将 <strong>{selectedApplication?.candidate_name}</strong> 重复入池？</p>
              <p style={{ color: '#666' }}>候选人将从简历筛选阶段重新开始流程</p>
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="淘汰候选人"
        open={eliminateModalVisible}
        onOk={handleEliminateSubmit}
        onCancel={() => setEliminateModalVisible(false)}
        width={600}
      >
        <Form form={eliminateForm} layout="vertical">
          <Form.Item name="reason_category" label="淘汰原因分类" rules={[{ required: true }]}>
            <Select placeholder="请选择原因分类">
              <Option value="experience">经验不符</Option>
              <Option value="skill">技能不匹配</Option>
              <Option value="salary">薪资不匹配</Option>
              <Option value="attitude">面试表现</Option>
              <Option value="other">其他原因</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason_detail" label="详细原因">
            <Input placeholder="请输入详细原因" />
          </Form.Item>
          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={3} placeholder="请输入备注说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Positions;
