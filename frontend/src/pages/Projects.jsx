import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Typography, Select, Input, Progress, Avatar, message,
  Modal, Form, Steps, DatePicker, InputNumber, List, Card, Descriptions, Row, Col, Divider
} from 'antd';
import {
  ProjectOutlined, PlusOutlined, EyeOutlined, SearchOutlined, UserOutlined,
  DeleteOutlined, PlusCircleOutlined, CheckCircleOutlined, HomeOutlined,
  TeamOutlined, CalendarOutlined, ScheduleOutlined, DollarOutlined,
  ProfileOutlined, AppstoreOutlined, UnorderedListOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Projects = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState([
    { task_name: '设计交底', start_date: dayjs().format('YYYY-MM-DD'), end_date: dayjs().add(3, 'day').format('YYYY-MM-DD') },
    { task_name: '水电改造', start_date: dayjs().add(4, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(14, 'day').format('YYYY-MM-DD') },
    { task_name: '泥瓦工程', start_date: dayjs().add(15, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(30, 'day').format('YYYY-MM-DD') },
    { task_name: '木工工程', start_date: dayjs().add(31, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(50, 'day').format('YYYY-MM-DD') },
    { task_name: '油漆工程', start_date: dayjs().add(51, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(65, 'day').format('YYYY-MM-DD') },
    { task_name: '竣工验收', start_date: dayjs().add(66, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(70, 'day').format('YYYY-MM-DD') }
  ]);
  const [materials, setMaterials] = useState([
    { material_name: 'PPR水管', specification: 'Dn25', quantity: 100, unit: '米', planned_arrival_date: dayjs().add(3, 'day').format('YYYY-MM-DD') },
    { material_name: '电线电缆', specification: 'BV2.5', quantity: 10, unit: '卷', planned_arrival_date: dayjs().add(3, 'day').format('YYYY-MM-DD') },
    { material_name: '瓷砖', specification: '800x800mm', quantity: 120, unit: '片', planned_arrival_date: dayjs().add(14, 'day').format('YYYY-MM-DD') },
    { material_name: '乳胶漆', specification: '五合一', quantity: 5, unit: '桶', planned_arrival_date: dayjs().add(50, 'day').format('YYYY-MM-DD') }
  ]);
  const [fundStages, setFundStages] = useState([
    { stage_name: '设计定金', percentage: 10 },
    { stage_name: '水电验收', percentage: 20 },
    { stage_name: '泥木验收', percentage: 25 },
    { stage_name: '油漆验收', percentage: 20 },
    { stage_name: '竣工验收', percentage: 20 },
    { stage_name: '质保金', percentage: 5 }
  ]);

  const statusMap = {
    pending: { color: 'orange', text: '待启动' },
    in_progress: { color: 'blue', text: '进行中' },
    paused: { color: 'red', text: '已暂停' },
    completed: { color: 'green', text: '已完成' },
    cancelled: { color: 'default', text: '已取消' }
  };

  const layoutTypes = ['一居室', '两居室', '三居室', '四居室', '五居室及以上', '复式', '别墅'];
  const styleOptions = ['现代简约', '新中式', '北欧风格', '轻奢美式', '日式极简', '欧式古典', '工业风格', '地中海'];

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, status, keyword]);

  const loadData = async () => {
    setLoading(true);
    const res = await getProjects({
      page: pagination.current,
      pageSize: pagination.pageSize,
      status,
      keyword
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } catch (e) {
      // Validation error
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const budget = Number(values.budget);
      
      const projectData = {
        ...values,
        budget,
        area: Number(values.area),
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        construction_tasks: tasks,
        material_plans: materials,
        fund_supervision: fundStages.map(fs => ({
          ...fs,
          amount: Math.round(budget * fs.percentage / 100)
        }))
      };

      const res = await createProject(projectData);
      if (res.code === 200) {
        message.success('项目创建成功！');
        setModalVisible(false);
        setCurrentStep(0);
        form.resetFields();
        loadData();
        navigate(`/projects/${res.data.id}`);
      } else {
        message.error(res.message || '创建失败');
      }
    } catch (e) {
      message.error('表单验证失败，请检查填写内容');
    }
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setMaterials(newMaterials);
  };

  const handleFundChange = (index, field, value) => {
    const newFunds = [...fundStages];
    newFunds[index] = { ...newFunds[index], [field]: value };
    
    const totalPercent = newFunds.reduce((sum, f) => sum + Number(f.percentage), 0);
    if (totalPercent !== 100) {
      message.warning(`当前合计为 ${totalPercent}%，请确保各阶段比例之和为 100%`);
    }
    
    setFundStages(newFunds);
  };

  const columns = [
    { title: '项目名称', dataIndex: 'title', key: 'title', ellipsis: true, width: 200 },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '户型/面积', key: 'info', width: 120, render: (_, r) => `${r.layout_type} · ${r.area}㎡` },
    { title: '风格', dataIndex: 'style', key: 'style', width: 100, render: v => <Tag color="blue">{v}</Tag> },
    { 
      title: '预算(元)', 
      dataIndex: 'budget', 
      key: 'budget', 
      width: 120,
      render: v => <span style={{ color: '#f5222d' }}>¥{v?.toLocaleString()}</span>
    },
    { 
      title: '项目进度', 
      key: 'progress', 
      width: 150,
      render: (_, record) => (
        <div>
          <Progress percent={record.progress} size="small" status={record.progress >= 100 ? 'success' : 'active'} />
          <span style={{ fontSize: 12, color: '#888' }}>{record.progress}%</span>
        </div>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>
    },
    { 
      title: '工期', 
      key: 'duration', 
      width: 180,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>计划: {r.start_date} ~ {r.end_date}</div>
          {r.actual_start_date && <div style={{ color: '#888' }}>实际: {r.actual_start_date}</div>}
        </div>
      )
    },
    {
      title: '负责人',
      key: 'owners',
      width: 180,
      render: (_, r) => (
        <Space size="small" wrap>
          {r.designer_name && <span><Avatar size="small" icon={<UserOutlined />} /> {r.designer_name}(设计)</span>}
          {r.manager_name && <span><Avatar size="small" icon={<UserOutlined />} /> {r.manager_name}(管家)</span>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/projects/${record.id}`)}>
          详情
        </Button>
      )
    }
  ];

  const steps = [
    { title: '业主资料', icon: <UserOutlined /> },
    { title: '户型预算', icon: <HomeOutlined /> },
    { title: '施工节点', icon: <ScheduleOutlined /> },
    { title: '资金规划', icon: <DollarOutlined /> }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Card type="inner" title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="title"
                    label="项目名称"
                    rules={[{ required: true, message: '请输入项目名称' }]}
                  >
                    <Input placeholder="如：张先生雅居装修工程" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="address"
                    label="装修地址"
                    rules={[{ required: true, message: '请输入装修地址' }]}
                  >
                    <Input placeholder="如：北京市朝阳区XX小区X号楼X单元X室" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            <Card type="inner" title="业主信息">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item
                    name="owner_name"
                    label="业主姓名"
                    rules={[{ required: true, message: '请输入业主姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="owner_phone"
                    label="联系电话"
                    rules={[{ required: true, message: '请输入联系电话' }]}
                  >
                    <Input placeholder="请输入手机号码" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="owner_email"
                    label="电子邮箱"
                  >
                    <Input placeholder="选填，用于接收通知" />
                  </Form.Item>
                </Col>
              </Row>
              <Descriptions size="small" column={2} style={{ marginTop: 16 }}>
                <Descriptions.Item label="系统说明">
                  1. 如业主手机号已存在，则关联已有账号
                </Descriptions.Item>
                <Descriptions.Item label="默认密码">
                  123456（业主可自行修改）
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        );
      case 1:
        return (
          <div>
            <Card type="inner" title="户型信息" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item
                    name="layout_type"
                    label="户型"
                    rules={[{ required: true, message: '请选择户型' }]}
                  >
                    <Select placeholder="请选择户型">
                      {layoutTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="area"
                    label="建筑面积(㎡)"
                    rules={[{ required: true, message: '请输入建筑面积' }]}
                  >
                    <InputNumber min={20} max={1000} style={{ width: '100%' }} placeholder="请输入面积" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="style"
                    label="装修风格"
                    rules={[{ required: true, message: '请选择风格' }]}
                  >
                    <Select placeholder="请选择风格">
                      {styleOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            <Card type="inner" title="预算与工期">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="budget"
                    label="总预算(元)"
                    rules={[{ required: true, message: '请输入总预算' }]}
                  >
                    <InputNumber min={10000} style={{ width: '100%' }} placeholder="请输入总预算" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="date_range"
                    label="计划工期"
                    rules={[{ required: true, message: '请选择工期范围' }]}
                  >
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="designer_id"
                    label="指定设计师"
                  >
                    <Select placeholder="选择设计师（选填）" allowClear>
                      <Option value={4}>李设计师</Option>
                      <Option value={5}>王设计师</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="manager_id"
                    label="指定管家"
                  >
                    <Select placeholder="选择管家（选填）" allowClear>
                      <Option value={6}>张管家</Option>
                      <Option value={7}>刘管家</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        );
      case 2:
        return (
          <div>
            <Card
              type="inner"
              title="施工节点安排"
              extra={
                <Button type="link" size="small" icon={<PlusCircleOutlined />} onClick={() => {
                  setTasks([...tasks, { task_name: '', start_date: dayjs().format('YYYY-MM-DD'), end_date: dayjs().add(1, 'day').format('YYYY-MM-DD') }]);
                }}>
                  添加节点
                </Button>
              }
            >
              <List
                size="small"
                dataSource={tasks}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled={tasks.length <= 1}
                        onClick={() => setTasks(tasks.filter((_, i) => i !== index))}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <div style={{ width: '100%' }}>
                      <Row gutter={[8, 8]} align="middle">
                        <Col span={1}>
                          <Text type="primary" strong>{index + 1}</Text>
                        </Col>
                        <Col span={7}>
                          <Input
                            value={item.task_name}
                            placeholder="节点名称"
                            onChange={e => handleTaskChange(index, 'task_name', e.target.value)}
                          />
                        </Col>
                        <Col span={6}>
                          <DatePicker
                            value={dayjs(item.start_date)}
                            style={{ width: '100%' }}
                            onChange={d => handleTaskChange(index, 'start_date', d.format('YYYY-MM-DD'))}
                          />
                        </Col>
                        <Col span={1}>
                          <Text type="secondary">至</Text>
                        </Col>
                        <Col span={6}>
                          <DatePicker
                            value={dayjs(item.end_date)}
                            style={{ width: '100%' }}
                            onChange={d => handleTaskChange(index, 'end_date', d.format('YYYY-MM-DD'))}
                          />
                        </Col>
                        <Col span={3}>
                          <Text type="secondary">
                            {dayjs(item.end_date).diff(dayjs(item.start_date), 'day') + 1}天
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            <Card
              type="inner"
              title="材料进场计划"
              style={{ marginTop: 16 }}
              extra={
                <Button type="link" size="small" icon={<PlusCircleOutlined />} onClick={() => {
                  setMaterials([...materials, { material_name: '', specification: '', quantity: 1, unit: '件', planned_arrival_date: dayjs().format('YYYY-MM-DD') }]);
                }}>
                  添加材料
                </Button>
              }
            >
              <List
                size="small"
                dataSource={materials}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled={materials.length <= 1}
                        onClick={() => setMaterials(materials.filter((_, i) => i !== index))}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <div style={{ width: '100%' }}>
                      <Row gutter={[8, 8]} align="middle">
                        <Col span={5}>
                          <Input
                            value={item.material_name}
                            placeholder="材料名称"
                            onChange={e => handleMaterialChange(index, 'material_name', e.target.value)}
                          />
                        </Col>
                        <Col span={5}>
                          <Input
                            value={item.specification}
                            placeholder="规格型号"
                            onChange={e => handleMaterialChange(index, 'specification', e.target.value)}
                          />
                        </Col>
                        <Col span={4}>
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            style={{ width: '100%' }}
                            onChange={v => handleMaterialChange(index, 'quantity', v)}
                          />
                        </Col>
                        <Col span={4}>
                          <Input
                            value={item.unit}
                            placeholder="单位"
                            onChange={e => handleMaterialChange(index, 'unit', e.target.value)}
                          />
                        </Col>
                        <Col span={6}>
                          <DatePicker
                            value={dayjs(item.planned_arrival_date)}
                            style={{ width: '100%' }}
                            onChange={d => handleMaterialChange(index, 'planned_arrival_date', d.format('YYYY-MM-DD'))}
                          />
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        );
      case 3:
        return (
          <div>
            <Card type="inner" title="资金监管阶段设置" style={{ marginBottom: 16 }}>
              <Paragraph type="secondary">
                设置各阶段付款比例，系统将自动计算各阶段应付款金额。各阶段比例之和应为 100%。
              </Paragraph>
              <List
                size="small"
                dataSource={fundStages}
                renderItem={(item, index) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Row gutter={[8, 8]} align="middle">
                        <Col span={1}>
                          <Text type="primary" strong>{index + 1}</Text>
                        </Col>
                        <Col span={7}>
                          <Input
                            value={item.stage_name}
                            placeholder="阶段名称"
                            onChange={e => handleFundChange(index, 'stage_name', e.target.value)}
                          />
                        </Col>
                        <Col span={6}>
                          <InputNumber
                            min={1}
                            max={100}
                            value={item.percentage}
                            style={{ width: '100%' }}
                            formatter={v => `${v}%`}
                            parser={v => v.replace('%', '')}
                            onChange={v => handleFundChange(index, 'percentage', v)}
                          />
                        </Col>
                        <Col span={8}>
                          <Text type="secondary">
                            应付款：¥{form.getFieldValue('budget') ? Math.round(form.getFieldValue('budget') * item.percentage / 100).toLocaleString() : '...'}
                          </Text>
                        </Col>
                        <Col span={2}>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            disabled={fundStages.length <= 1}
                            onClick={() => setFundStages(fundStages.filter((_, i) => i !== index))}
                          />
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space>
                  <Text type={fundStages.reduce((s, f) => s + Number(f.percentage), 0) === 100 ? 'success' : 'danger'}>
                    合计: {fundStages.reduce((s, f) => s + Number(f.percentage), 0)}%
                    {fundStages.reduce((s, f) => s + Number(f.percentage), 0) === 100 ? <CheckCircleOutlined /> : ' (应为 100%)'}
                  </Text>
                </Space>
              </div>
            </Card>

            <Card type="inner" title="信息预览">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="项目名称">{form.getFieldValue('title') || '-'}</Descriptions.Item>
                <Descriptions.Item label="装修地址">{form.getFieldValue('address') || '-'}</Descriptions.Item>
                <Descriptions.Item label="业主姓名">{form.getFieldValue('owner_name') || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{form.getFieldValue('owner_phone') || '-'}</Descriptions.Item>
                <Descriptions.Item label="户型">{form.getFieldValue('layout_type') || '-'}</Descriptions.Item>
                <Descriptions.Item label="面积">{form.getFieldValue('area') || '-'} ㎡</Descriptions.Item>
                <Descriptions.Item label="风格">{form.getFieldValue('style') || '-'}</Descriptions.Item>
                <Descriptions.Item label="总预算">¥{form.getFieldValue('budget')?.toLocaleString() || '-'}</Descriptions.Item>
                <Descriptions.Item label="施工节点">{tasks.length} 个</Descriptions.Item>
                <Descriptions.Item label="材料计划">{materials.length} 项</Descriptions.Item>
                <Descriptions.Item label="付款阶段">{fundStages.length} 期</Descriptions.Item>
                <Descriptions.Item label="工期">
                  {form.getFieldValue('date_range') ? `${form.getFieldValue('date_range')[0].format('YYYY-MM-DD')} 至 ${form.getFieldValue('date_range')[1].format('YYYY-MM-DD')}` : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <ProjectOutlined style={{ marginRight: 8 }} />
          项目管理
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setModalVisible(true);
            setCurrentStep(0);
            form.resetFields();
          }}>
            新建项目
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索项目名称、地址"
          style={{ width: 240 }}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          allowClear
        />
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 160 }}
          value={status || undefined}
          onChange={v => setStatus(v || '')}
        >
          <Option value="pending">待启动</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="paused">已暂停</Option>
          <Option value="completed">已完成</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title={
          <Space>
            <ProjectOutlined />
            <span>新建装修项目</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(s => (
            <Step key={s.title} title={s.title} icon={s.icon} />
          ))}
        </Steps>

        <Form form={form} layout="vertical">
          {renderStepContent()}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  上一步
                </Button>
              )}
            </Space>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleNext}>
                {currentStep < 3 ? '下一步' : '创建项目'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
