import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Select, Space, message, Modal, Form, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';

const { Option } = Select;
const { TextArea } = Input;

export default function HRApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      
      const { data } = await axios.get('/hr/applications', { params });
      setApplications(data || []);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    Modal.confirm({
      title: '确认修改状态',
      content: `确定要将状态修改为"${statusLabels[status]}"吗？`,
      onOk: async () => {
        try {
          await axios.put(`/hr/application/${id}/status`, { status });
          message.success('修改成功');
          loadApplications();
        } catch (error) {
          message.error('修改失败');
        }
      }
    });
  };

  const handleViewDetail = (record: any) => {
    setCurrentApplication(record);
    form.setFieldsValue({ status: record.status, remark: record.hr_remark });
    setDetailModalVisible(true);
  };

  const handleSaveRemark = async (values: any) => {
    try {
      await axios.put(`/hr/application/${currentApplication.id}/status`, values);
      message.success('保存成功');
      setDetailModalVisible(false);
      loadApplications();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    viewed: 'processing',
    interview: 'blue',
    offer: 'success',
    rejected: 'error',
    hired: 'success'
  };

  const statusLabels: Record<string, string> = {
    pending: '待查看',
    viewed: '已查看',
    interview: '面试中',
    offer: '已录用',
    rejected: '未通过',
    hired: '已入职'
  };

  const columns = [
    {
      title: '求职者',
      dataIndex: 'jobseeker_name',
      key: 'jobseeker_name'
    },
    {
      title: '应聘职位',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education'
    },
    {
      title: '工作年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      render: (years: number) => `${years || 0}年`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 100 }}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            <Option value="pending">待查看</Option>
            <Option value="viewed">已查看</Option>
            <Option value="interview">面试中</Option>
            <Option value="offer">已录用</Option>
            <Option value="rejected">未通过</Option>
            <Option value="hired">已入职</Option>
          </Select>
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="简历管理"
      extra={
        <Select
          placeholder="筛选状态"
          style={{ width: 150 }}
          value={filterStatus || undefined}
          onChange={setFilterStatus}
          allowClear
        >
          <Option value="pending">待查看</Option>
          <Option value="viewed">已查看</Option>
          <Option value="interview">面试中</Option>
          <Option value="offer">已录用</Option>
          <Option value="rejected">未通过</Option>
          <Option value="hired">已入职</Option>
        </Select>
      }
    >
      <Table
        columns={columns}
        dataSource={applications}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="简历详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {currentApplication && (
          <Form form={form} layout="vertical" onFinish={handleSaveRemark}>
            <p><strong>求职者：</strong>{currentApplication.jobseeker_name}</p>
            <p><strong>应聘职位：</strong>{currentApplication.title}</p>
            <p><strong>学历：</strong>{currentApplication.education}</p>
            <p><strong>工作年限：</strong>{currentApplication.experience_years || 0}年</p>
            <p><strong>技能：</strong>{currentApplication.skills || '-'}</p>
            <p><strong>申请时间：</strong>{currentApplication.created_at}</p>
            
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="pending">待查看</Option>
                <Option value="viewed">已查看</Option>
                <Option value="interview">面试中</Option>
                <Option value="offer">已录用</Option>
                <Option value="rejected">未通过</Option>
                <Option value="hired">已入职</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="remark" label="HR备注">
              <TextArea rows={4} />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit">保存</Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  );
}
