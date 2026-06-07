import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Select, Form, Modal, Typography, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../../api';
import { ConstructionProject } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Text } = Typography;

const ProjectList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ConstructionProject | null>(null);

  const fetchProjects = async (params?: any) => {
    setLoading(true);
    try {
      const res = await api.projects.getAll({
        page,
        pageSize,
        ...params
      });
      setProjects(res.data.projects || res.data || []);
      setTotal(res.data.total || (res.data || []).length);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, pageSize]);

  const handleSearch = (values: any) => {
    setPage(1);
    fetchProjects(values);
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchProjects();
  };

  const handleViewDetail = async (record: ConstructionProject) => {
    try {
      const res = await api.projects.getDetail(record.id);
      setSelectedProject(res.data);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取项目详情失败');
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      planning: '规划中',
      approved: '已批准',
      started: '已启动',
      under_construction: '施工中',
      completed: '已完成',
      closed: '已关闭'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      planning: 'default',
      approved: 'blue',
      started: 'processing',
      under_construction: 'cyan',
      completed: 'success',
      closed: 'red'
    };
    return map[status] || 'default';
  };

  const columns: ColumnsType<ConstructionProject> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180
    },
    {
      title: '项目编号',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 150
    },
    {
      title: '项目类型',
      dataIndex: 'projectType',
      key: 'projectType',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '项目地址',
      dataIndex: 'projectAddress',
      key: 'projectAddress',
      width: 200
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (value) => value ? `¥${value.toLocaleString()}` : '-'
    },
    {
      title: '工人数量',
      dataIndex: 'workerCount',
      key: 'workerCount',
      width: 100,
      render: (value) => value || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="项目管理">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '16px' }}
      >
        <Form.Item name="status" label="状态">
          <Select placeholder="全部" allowClear style={{ width: 120 }}>
            <Option value="planning">规划中</Option>
            <Option value="approved">已批准</Option>
            <Option value="started">已启动</Option>
            <Option value="under_construction">施工中</Option>
            <Option value="completed">已完成</Option>
            <Option value="closed">已关闭</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Spin>

      <Modal
        title="项目详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedProject && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><Text strong>项目名称：</Text>{selectedProject.projectName}</p>
                <p><Text strong>项目编号：</Text>{selectedProject.projectCode}</p>
                <p><Text strong>项目类型：</Text>{selectedProject.projectType || '-'}</p>
                <p><Text strong>企业名称：</Text>{selectedProject.companyName || '-'}</p>
                <p><Text strong>项目地址：</Text>{selectedProject.projectAddress}</p>
                <p><Text strong>预算：</Text>{selectedProject.budget ? `¥${selectedProject.budget.toLocaleString()}` : '-'}</p>
              </Col>
              <Col span={12}>
                <p><Text strong>状态：</Text>
                  <Tag color={getStatusColor(selectedProject.status)}>
                    {getStatusText(selectedProject.status)}
                  </Tag>
                </p>
                <p><Text strong>开始日期：</Text>{selectedProject.startDate || '-'}</p>
                <p><Text strong>结束日期：</Text>{selectedProject.endDate || '-'}</p>
                <p><Text strong>实际开始：</Text>{selectedProject.actualStartDate || '-'}</p>
                <p><Text strong>实际结束：</Text>{selectedProject.actualEndDate || '-'}</p>
                <p><Text strong>工人数量：</Text>{selectedProject.workerCount || 0} 人</p>
              </Col>
            </Row>
            {selectedProject.workers && selectedProject.workers.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>参与工人：</Text>
                <div style={{ marginTop: '8px' }}>
                  {selectedProject.workers.map((worker: any, index: number) => (
                    <Tag key={index} style={{ marginBottom: '4px' }}>
                      {worker.realName || worker.username}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <Text strong>创建时间：</Text>{new Date(selectedProject.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ProjectList;
