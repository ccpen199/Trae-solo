import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Progress, Modal, Form, Select, message, Space, Card, InputNumber, Input } from 'antd';
import { UserOutlined, CheckCircleOutlined, PlayCircleOutlined, BellOutlined } from '@ant-design/icons';
import { qualityAPI, catalogsAPI, departmentsAPI } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const QualityList: React.FC = () => {
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [currentQualityId, setCurrentQualityId] = useState<number | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<string>('all');
  const [form] = Form.useForm();
  const [handleForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [currentDepartment]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qualityRes, catRes, deptRes] = await Promise.all([
        qualityAPI.getAll(),
        catalogsAPI.getAll(),
        departmentsAPI.getAll()
      ]);
      let data = qualityRes.data;
      if (currentDepartment !== 'all') {
        data = data.filter((q: any) => q.assignee_department_id === parseInt(currentDepartment));
      }
      setQualityData(data);
      setCatalogs(catRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleAssign = async (values: any) => {
    if (!currentQualityId) return;
    try {
      await qualityAPI.assign(currentQualityId, { assignee_department_id: values.assignee_department_id });
      message.success('问题已派发');
      setAssignModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('派发失败');
    }
  };

  const handleResolve = async (values: any) => {
    if (!currentQualityId) return;
    try {
      const record = qualityData.find(q => q.id === currentQualityId);
      await qualityAPI.update(currentQualityId, {
        ...record,
        missing_rate: values.missing_rate || record.missing_rate,
        update_delay: values.update_delay || record.update_delay,
        failure_count: values.failure_count || record.failure_count,
        status: 'resolved',
        issue_description: values.resolution_note
      });
      message.success('问题已处理完成');
      setHandleModalVisible(false);
      handleForm.resetFields();
      loadData();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const handleStartProcess = async (id: number) => {
    try {
      const record = qualityData.find(q => q.id === id);
      await qualityAPI.update(id, {
        ...record,
        status: 'processing'
      });
      message.success('已开始处理');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      normal: 'green',
      warning: 'orange',
      processing: 'blue',
      issue: 'red',
      resolved: 'purple'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      normal: '正常',
      warning: '待处理',
      processing: '处理中',
      issue: '问题',
      resolved: '已解决'
    };
    return labels[status] || status;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '数据目录', dataIndex: 'catalog_title', key: 'catalog_title' },
    {
      title: '缺失率',
      dataIndex: 'missing_rate',
      key: 'missing_rate',
      render: (rate: number) => (
        <Progress percent={Math.round(rate * 100)} size="small" status={rate > 0.1 ? 'exception' : 'normal'} />
      )
    },
    { title: '更新延迟(天)', dataIndex: 'update_delay', key: 'update_delay' },
    { title: '失败次数', dataIndex: 'failure_count', key: 'failure_count' },
    {
      title: '责任部门',
      dataIndex: 'assignee_department_name',
      key: 'assignee_department_name',
      render: (name: string) => name || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
    },
    { title: '检查时间', dataIndex: 'checked_at', key: 'checked_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {currentDepartment === 'all' && (
            <Button
              type="link"
              size="small"
              icon={<UserOutlined />}
              onClick={() => {
                setCurrentQualityId(record.id);
                setAssignModalVisible(true);
              }}
            >
              派发
            </Button>
          )}
          {currentDepartment !== 'all' && record.assignee_department_id === parseInt(currentDepartment) && (
            <>
              {record.status === 'warning' && (
                <Button
                  type="link"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleStartProcess(record.id)}
                >
                  接收处理
                </Button>
              )}
              {record.status === 'processing' && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setCurrentQualityId(record.id);
                    handleForm.setFieldsValue({
                      missing_rate: record.missing_rate,
                      update_delay: record.update_delay,
                      failure_count: record.failure_count
                    });
                    setHandleModalVisible(true);
                  }}
                >
                  处理完成
                </Button>
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = qualityData.filter(q => 
    currentDepartment !== 'all' && 
    q.assignee_department_id === parseInt(currentDepartment) && 
    q.status === 'warning'
  ).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>数据质量监控</h2>
        <Space>
          {pendingCount > 0 && (
            <Button icon={<BellOutlined />} type="primary" danger>
              待处理问题: {pendingCount}
            </Button>
          )}
          <Select
            style={{ width: 180 }}
            value={currentDepartment}
            onChange={setCurrentDepartment}
          >
            <Option value="all">全部部门视角</Option>
            {departments.filter(d => d.type === 'provider').map(d => (
              <Option key={d.id} value={String(d.id)}>{d.name} 视角</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ color: '#666' }}>
            <strong>说明:</strong> 
            {currentDepartment === 'all' 
              ? '管理员视角：可查看所有数据质量问题并派发至责任部门'
              : `部门视角：仅显示指派给 ${departments.find(d => String(d.id) === currentDepartment)?.name} 的质量问题`
            }
          </div>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={qualityData}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="派发问题"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="assignee_department_id" label="派发至部门" rules={[{ required: true }]}>
            <Select placeholder="请选择责任部门">
              {departments.filter(d => d.type === 'provider').map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认派发</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理质量问题"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={handleForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item name="missing_rate" label="修复后缺失率">
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="update_delay" label="修复后更新延迟(天)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="failure_count" label="修复后失败次数">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="resolution_note" label="处理说明" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请描述修复措施和结果" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认完成处理</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QualityList;
