import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Typography, Tag, Card, Row, Col, Steps, Space, DatePicker, Radio } from 'antd';
import { PlusOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { candidateApi, positionApi } from '../services/api';
import ReactECharts from 'echarts-for-react';

const { Title } = Typography;
const { Option } = Select;
const { Step } = Steps;

const STAGES = [
  { key: 'screening', name: '简历筛选' },
  { key: 'phone_interview', name: '电话沟通' },
  { key: 'client_recommend', name: '推荐客户' },
  { key: 'interview', name: '面试' },
  { key: 'offer', name: 'Offer' },
  { key: 'onboard', name: '入职' },
  { key: 'eliminated', name: '淘汰' }
];

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [funnelData, setFunnelData] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [form] = Form.useForm();
  const [stageForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [candidatesRes, positionsRes, funnelRes] = await Promise.all([
        candidateApi.list(),
        positionApi.list(),
        candidateApi.getFunnel()
      ]);
      setCandidates(candidatesRes.data);
      setPositions(positionsRes.data);
      setFunnelData(funnelRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCandidate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCandidate(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCandidate) {
        await candidateApi.update(editingCandidate.id, values);
        message.success('候选人更新成功');
      } else {
        await candidateApi.create(values);
        message.success('候选人创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddToPool = (record) => {
    setSelectedApplication({ candidate_id: record.id, candidate_name: record.name });
    stageForm.resetFields();
    setStageModalVisible(true);
  };

  const handleStageSubmit = async () => {
    try {
      const values = await stageForm.validateFields();
      if (selectedApplication?.id) {
        await candidateApi.updateStage(selectedApplication.id, values);
      } else {
          await candidateApi.createApplication({
            candidate_id: selectedApplication.candidate_id,
            position_id: values.position_id
          });
      }
      message.success(selectedApplication?.id ? '阶段更新成功' : '加入人才库成功');
      setStageModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getFunnelChartOption = () => {
    const data = STAGES.filter(s => s.key !== 'eliminated').map(stage => ({
      value: funnelData[stage.key]?.count || 0,
      name: stage.name
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}'
      },
      series: [
        {
          name: '漏斗图',
          type: 'funnel',
          left: '10%',
          width: '80%',
          label: {
            show: true,
            position: 'inside'
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 16
            }
          },
          data
        }
      ]
    };
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender'
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education'
    },
    {
      title: '工作年限',
      dataIndex: 'work_experience',
      key: 'work_experience'
    },
    {
      title: '当前公司',
      dataIndex: 'current_company',
      key: 'current_company'
    },
    {
      title: '期望薪资',
      dataIndex: 'expected_salary',
      key: 'expected_salary'
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source'
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => tags ? tags.split(',').map(tag => <Tag key={tag}>{tag}</Tag>) : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="primary" size="small" onClick={() => handleAddToPool(record)}>
            加入人才池
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>候选人管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增候选人
        </Button>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card title="招聘漏斗" className="card-shadow">
              <ReactECharts
                option={getFunnelChartOption()}
                style={{ height: '400px' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card title="各阶段转化率" className="card-shadow">
              <Steps direction="vertical" current={-1}>
                {STAGES.filter(s => s.key !== 'eliminated').map((stage, index) => {
                  const data = funnelData[stage.key];
                  return (
                    <Step
                      key={stage.key}
                      title={
                        <Space>
                          <span>{stage.name}</span>
                          <Tag color="blue">{data?.count || 0}人</Tag>
                          {index > 0 && data?.rate > 0 && (
                            <Tag color="green">{data.rate}%</Tag>
                          )}
                        </Space>
                      }
                      description={`转化率: ${data?.rate || 0}%`}
                    />
                  );
                })}
              </Steps>
            </Card>
          </Col>
        </Row>

        <Card title="候选人列表" className="card-shadow" style={{ marginTop: 24 }}>
          <Table
            dataSource={candidates}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      <Modal
        title={editingCandidate ? '编辑候选人' : '新增候选人'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="age" label="年龄">
                <Input type="number" placeholder="请输入年龄" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="education" label="学历">
                <Select placeholder="请选择学历">
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="work_experience" label="工作经验">
            <Input placeholder="例如：3-5年" />
          </Form.Item>
          <Form.Item name="current_company" label="当前公司">
            <Input placeholder="请输入当前公司" />
          </Form.Item>
          <Form.Item name="current_position" label="当前职位">
            <Input placeholder="请输入当前职位" />
          </Form.Item>
          <Form.Item name="expected_salary" label="期望薪资">
            <Input placeholder="例如：15k-20k" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select placeholder="请选择来源">
              <Option value="猎头推荐">猎头推荐</Option>
              <Option value="招聘网站">招聘网站</Option>
              <Option value="内部推荐">内部推荐</Option>
              <Option value="客户推荐">客户推荐</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedApplication?.id ? '更新阶段' : '加入人才池'}
        open={stageModalVisible}
        onOk={handleStageSubmit}
        onCancel={() => setStageModalVisible(false)}
        width={600}
      >
        <Form form={stageForm} layout="vertical">
          {!selectedApplication?.id && (
            <Form.Item name="position_id" label="应聘岗位" rules={[{ required: true }]}>
            <Select placeholder="请选择岗位">
              {positions.filter(p => p.status === 'open').map(position => (
                <Option key={position.id} value={position.id}>
                  {position.title} - {position.project_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          )}
          {selectedApplication?.id && (
            <>
              <Form.Item name="stage" label="阶段" rules={[{ required: true }]}>
                <Select placeholder="请选择阶段">
                  {STAGES.map(stage => (
                    <Option key={stage.key} value={stage.key}>{stage.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="pending">进行中</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </Form.Item>
              <Form.Item name="result" label="结果">
                <Select placeholder="请选择结果">
                  <Option value="pass">通过</Option>
                  <Option value="fail">不通过</Option>
                  <Option value="eliminated">淘汰</Option>
                </Select>
              </Form.Item>
              <Form.Item name="reason" label="原因/原因">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Candidates;
