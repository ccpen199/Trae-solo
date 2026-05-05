import React from 'react';
import { Card, Table, Tag, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { departmentApi } from '../services/api';
import type { Department } from '../types';

const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getList();
      setDepartments(data);
    } catch (error) {
      message.error('获取部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await departmentApi.delete(id);
      message.success('删除成功');
      fetchDepartments();
    } catch (error) {
      message.error('删除失败，请先删除该部门下的员工和子部门');
    }
  };

  const columns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '部门编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '上级部门',
      dataIndex: ['parent', 'name'],
      key: 'parent',
      render: (name: string) => name || '-',
    },
    {
      title: '部门主管',
      dataIndex: ['manager', 'name'],
      key: 'manager',
      render: (name: string) => name || '-',
    },
    {
      title: '员工数量',
      key: 'employeeCount',
      render: (_: any, record: Department) => record._count?.employees || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Department) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>部门管理</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            新增部门
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DepartmentPage;
