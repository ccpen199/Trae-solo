import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Card, Row, Col, Progress, Descriptions, List, Checkbox, message, Input } from 'antd';
import { AuditOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons';
import { getAcceptanceRecords, createAcceptance, getProjects } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ManagerAcceptance = () => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();

  const stageOptions = [
    { value: 'waterproof', label: '防水验收' },
    { value: 'hydropower', label: '水电验收' },
    { value: 'masonry', label: '泥瓦验收' },
    { value: 'carpentry', label: '木工验收' },
    { value: 'painting', label: '油漆验收' },
    { value: 'installation', label: '安装验收' },
    { value: 'final', label: '竣工验收' }
  ];

  const statusMap = {
    pending: { color: 'orange', text: '待验收' },
    completed: { color: 'green', text: '已验收' }
  };

  const resultMap = {
    passed: { color: 'green', text: '合格', icon: <CheckCircleOutlined /> },
    failed: { color: 'red', text: '不合格', icon: <CloseCircleOutlined /> },
    partial: { color: 'orange', text: '部分合格', icon: <AuditOutlined /> }
  };

  const checkItemsTemplate = {
    waterproof: [
      { item_name: '卫生间地面防水', check_content: '闭水试验48小时', standard: '水位无明显下降，楼下无渗漏' },
      { item_name: '卫生间墙面防水', check_content: '淋浴区1.8米高', standard: '涂刷均匀，无漏刷' },
      { item_name: '厨房地面防水', check_content: '闭水试验24小时', standard: '无渗漏' },
      { item_name: '阳台防水', check_content: '闭水试验24小时', standard: '无渗漏' },
      { item_name: '管口处理', check_content: '地漏、管根防水处理', standard: '附加层处理到位' }
    ],
    hydropower: [
      { item_name: '强电线路', check_content: '所有插座、开关通电测试', standard: '通电正常，相位正确' },
      { item_name: '弱电线路', check_content: '网线、电视线、电话线测试', standard: '信号正常' },
      { item_name: '水路打压', check_content: '打压测试', standard: '10kg压力30分钟不降压' },
      { item_name: '等电位连接', check_content: '卫生间等电位测试', standard: '连接可靠' },
      { item_name: '线路绝缘', check_content: '绝缘电阻测试', standard: '大于0.5MΩ' }
    ],
    masonry: [
      { item_name: '地砖空鼓率', check_content: '敲击检测', standard: '空鼓率不超过5%' },
      { item_name: '墙砖空鼓率', check_content: '敲击检测', standard: '空鼓率不超过5%' },
      { item_name: '地面平整度', check_content: '2米靠尺检测', standard: '误差不超过3mm' },
      { item_name: '阴阳角方正', check_content: '直角尺检测', standard: '90度误差不超过2mm' },
      { item_name: '勾缝处理', check_content: '美缝/勾缝', standard: '饱满、均匀、无脱落' }
    ]
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [projectFilter]);

  const loadProjects = async () => {
    const res = await getProjects({ pageSize: 100 });
    if (res.code === 200) {
      setProjects(res.data.list);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getAcceptanceRecords({
      project_id: projectFilter
    });
    if (res.code === 200) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleStageChange = (value) => {
    const items = checkItemsTemplate[value] || [];
    form.setFieldsValue({
      items: items.map(item => ({ ...item, is_passed: 0 }))
    });
  };

  const handleSubmit = async (values) => {
    const passedCount = values.items.filter(i => i.is_passed).length;
    const totalCount = values.items.length;
    let overall_result = 'passed';
    if (passedCount === 0) overall_result = 'failed';
    else if (passedCount < totalCount) overall_result = 'partial';

    const payload = {
      project_id: values.project_id,
      stage: values.stage,
      gps_lat: 39.9042,
      gps_lng: 116.4074,
      gps_fence_radius: 200,
      is_in_fence: 1,
      overall_result,
      remark: values.remark,
      items: values.items
    };

    const res = await createAcceptance(payload);
    if (res.code === 200) {
      message.success('验收已提交');
      setModalVisible(false);
      form.resetFields();
      loadData();
    }
  };

  const columns = [
    { title: '验收日期', dataIndex: 'check_date', key: 'check_date', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true },
    { title: '验收阶段', dataIndex: 'stage', key: 'stage', width: 120, render: v => {
      const opt = stageOptions.find(o => o.value === v);
      return <Tag color="blue">{opt?.label || v}</Tag>;
    }},
    { title: 'GPS围栏', key: 'gps', width: 100, render: (_, r) => r.is_in_fence ? <Tag color="green">在范围内</Tag> : <Tag color="red">超出范围</Tag> },
    { title: '验收结果', dataIndex: 'overall_result', key: 'result', width: 100, render: v => resultMap[v] ? <Tag color={resultMap[v].color}>{resultMap[v].icon} {resultMap[v].text}</Tag> : '-' },
    { title: '验收人', dataIndex: 'checker_name', key: 'checker_name', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => { setCurrentRecord(record); setDetailVisible(true); }}>
          详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <AuditOutlined style={{ marginRight: 8 }} />
          验收打卡
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          新增验收
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择项目"
          allowClear
          style={{ width: 300 }}
          value={projectFilter || undefined}
          onChange={v => setProjectFilter(v || '')}
          options={projects.map(p => ({ label: p.title, value: p.id }))}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增验收打卡"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
                <Select options={projects.map(p => ({ label: p.title, value: p.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stage" label="验收阶段" rules={[{ required: true }]}>
                <Select options={stageOptions} onChange={handleStageChange} />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" style={{ marginBottom: 16 }} title="GPS定位">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <EnvironmentOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <div>已获取当前位置</div>
                <Text type="secondary">北京市朝阳区 (39.9042, 116.4074)</Text>
              </div>
              <Tag color="green">在项目围栏范围内 (半径200米)</Tag>
            </div>
          </Card>

          <div className="detail-section">
            <div className="detail-section-title">检查清单</div>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginBottom: 8 }}>
                      <Row gutter={[8, 8]} align="middle">
                        <Col flex={1}>
                          <Form.Item {...restField} name={[name, 'item_name']} rules={[{ required: true }]}>
                            <Input placeholder="检查项目" />
                          </Form.Item>
                        </Col>
                        <Col flex="120px">
                          <Form.Item {...restField} name={[name, 'is_passed']} valuePropName="checked">
                            <Checkbox>合格</Checkbox>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'check_content']}>
                            <Input placeholder="检查内容" size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'standard']}>
                            <Input placeholder="验收标准" size="small" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button type="dashed" block onClick={() => add({ item_name: '', check_content: '', standard: '', is_passed: false })}>
                    添加检查项
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <Form.Item name="remark" label="验收备注">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交验收</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="验收详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentRecord && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="验收时间">{dayjs(currentRecord.check_date).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="项目">{currentRecord.project_title}</Descriptions.Item>
              <Descriptions.Item label="验收阶段">
                {stageOptions.find(o => o.value === currentRecord.stage)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="验收结果">
                {resultMap[currentRecord.overall_result] && (
                  <Tag color={resultMap[currentRecord.overall_result].color}>
                    {resultMap[currentRecord.overall_result].icon} {resultMap[currentRecord.overall_result].text}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="验收人">{currentRecord.checker_name}</Descriptions.Item>
              <Descriptions.Item label="GPS定位">
                {currentRecord.is_in_fence ? <Tag color="green">在范围内</Tag> : <Tag color="red">超出范围</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <div className="detail-section">
              <div className="detail-section-title">检查明细</div>
              <List
                dataSource={currentRecord.items}
                renderItem={item => (
                  <List.Item style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={item.is_passed ? 
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} /> : 
                        <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 20 }} />
                      }
                      title={item.item_name}
                      description={
                        <div>
                          <Text type="secondary">检查内容: {item.check_content}</Text>
                          <br />
                          <Text type="secondary">验收标准: {item.standard}</Text>
                          {item.remark && <div>备注: {item.remark}</div>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            {currentRecord.remark && (
              <div className="detail-section">
                <div className="detail-section-title">验收备注</div>
                <Paragraph>{currentRecord.remark}</Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerAcceptance;
