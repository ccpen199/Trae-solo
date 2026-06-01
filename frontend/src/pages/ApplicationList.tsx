import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, DatePicker, message, Descriptions, Input, Card } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { applicationsAPI, catalogsAPI, departmentsAPI } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ApplicationList: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [currentView, setCurrentView] = useState<string>('consumer');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [currentView, selectedDepartment]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, catRes, deptRes] = await Promise.all([
        applicationsAPI.getAll(),
        catalogsAPI.getAll(),
        departmentsAPI.getAll()
      ]);
      let data = appRes.data;
      
      if (currentView === 'consumer' && selectedDepartment) {
        data = data.filter((a: any) => a.applicant_department_id === parseInt(selectedDepartment));
      }
      
      setApplications(data);
      setCatalogs(catRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    try {
      await applicationsAPI.create({
        catalog_id: values.catalog_id,
        applicant_department_id: currentView === 'consumer' && selectedDepartment 
          ? parseInt(selectedDepartment) 
          : values.applicant_department_id,
        use_case: values.use_case,
        field_scope: ['all'],
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD')
      });
      message.success('申请提交成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('申请提交失败');
    }
  };

  const handleApprove = async (id: number) => {
    Modal.confirm({
      title: '审批通过',
      content: (
        <Form>
          <Form.Item name="approval_opinion" label="审批意见">
            <TextArea rows={3} id="approval_opinion" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const opinion = (document.getElementById('approval_opinion') as HTMLTextAreaElement)?.value;
        try {
          await applicationsAPI.approve(id, { approval_opinion: opinion, approver_id: 1 });
          message.success('审批通过');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const handleReject = async (id: number) => {
    Modal.confirm({
      title: '拒绝申请',
      content: (
        <Form>
          <Form.Item name="approval_opinion" label="拒绝原因" rules={[{ required: true }]}>
            <TextArea rows={3} id="reject_opinion" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const opinion = (document.getElementById('reject_opinion') as HTMLTextAreaElement)?.value;
        if (!opinion) {
          message.error('请填写拒绝原因');
          return;
        }
        try {
          await applicationsAPI.reject(id, { approval_opinion: opinion, approver_id: 1 });
          message.success('已拒绝');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red'
  };

  const statusLabels: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '数据目录', dataIndex: 'catalog_title', key: 'catalog_title' },
    { title: '申请部门', dataIndex: 'applicant_department_name', key: 'applicant_department_name' },
    { title: '使用场景', dataIndex: 'use_case', key: 'use_case', ellipsis: true },
    { title: '有效期', dataIndex: 'id', key: 'validity', render: (_: any, record: any) => `${record.start_date} 至 ${record.end_date}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => {
            setCurrentApplication(record);
            setDetailVisible(true);
          }}>详情</Button>
          {currentView === 'approver' && record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record.id)}>拒绝</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = currentView === 'approver' 
    ? applications.filter((a: any) => a.status === 'pending').length 
    : 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <h2 style={{ margin: 0 }}>申请授权管理</h2>
          {pendingCount > 0 && (
            <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
              待审批: {pendingCount}
            </Tag>
          )}
        </Space>
        <Space>
          <Select
            style={{ width: 160 }}
            value={currentView}
            onChange={(value) => {
              setCurrentView(value);
              setSelectedDepartment('');
            }}
          >
            <Option value="consumer">📥 申请部门视角</Option>
            <Option value="approver">✅ 审批部门视角</Option>
          </Select>
          {currentView === 'consumer' && (
            <Select
              style={{ width: 150 }}
              placeholder="选择申请部门"
              value={selectedDepartment || undefined}
              onChange={setSelectedDepartment}
              allowClear
            >
              {departments.filter(d => d.type === 'consumer').map(d => (
                <Option key={d.id} value={String(d.id)}>{d.name}</Option>
              ))}
            </Select>
          )}
          {currentView === 'consumer' && selectedDepartment && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新建申请
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }} size="small">
        <div style={{ color: '#666' }}>
          <strong>当前视角说明:</strong>
          {currentView === 'consumer' 
            ? selectedDepartment 
              ? ` ${departments.find(d => String(d.id) === selectedDepartment)?.name} - 可提交数据使用申请，查看本部门申请状态`
              : ' 请选择申请部门后可提交新申请'
            : ' 平台管理员/审批部门 - 可查看所有申请，对待审批申请进行通过/拒绝操作'
          }
        </div>
      </Card>

      <Modal
        title="新建申请"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="catalog_id" label="申请数据目录" rules={[{ required: true }]}>
            <Select placeholder="请选择数据目录">
              {catalogs.map(c => (
                <Option key={c.id} value={c.id}>{c.title}</Option>
              ))}
            </Select>
          </Form.Item>
          {currentView === 'consumer' && selectedDepartment ? (
            <Form.Item label="申请部门">
              <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                {departments.find(d => String(d.id) === selectedDepartment)?.name}
              </div>
            </Form.Item>
          ) : (
            <Form.Item name="applicant_department_id" label="申请部门" rules={[{ required: true }]}>
              <Select placeholder="请选择部门">
                {departments.filter(d => d.type === 'consumer' || d.type === 'admin').map(d => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="use_case" label="使用场景" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请详细描述使用场景" />
          </Form.Item>
          <Form.Item name="date_range" label="使用期限" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentApplication && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID" span={2}>{currentApplication.id}</Descriptions.Item>
            <Descriptions.Item label="数据目录" span={2}>{currentApplication.catalog_title}</Descriptions.Item>
            <Descriptions.Item label="申请部门">{currentApplication.applicant_department_name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[currentApplication.status]}>{statusLabels[currentApplication.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="使用场景" span={2}>{currentApplication.use_case}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{currentApplication.start_date}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{currentApplication.end_date}</Descriptions.Item>
            <Descriptions.Item label="审批意见" span={2}>{currentApplication.approval_opinion || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请时间" span={2}>{currentApplication.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ApplicationList;
