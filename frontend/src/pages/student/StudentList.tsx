import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { studentApi } from '../../services/api';

const { Option } = Select;

interface Student {
  id: number;
  student_id: string;
  name: string;
  gender: string;
  major: string;
  class: string;
  grade: number;
  phone: string;
  status: string;
  check_in_id: number;
  room_number: string;
  building_code: string;
  bed_code: string;
}

const StudentList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Student[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getAll();
      setData(response.data.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getGenderTag = (gender: string) => {
    const colorMap: Record<string, string> = {
      male: 'blue',
      female: 'pink',
    };
    const textMap: Record<string, string> = {
      male: '男',
      female: '女',
    };
    return <Tag color={colorMap[gender] || 'default'}>{textMap[gender] || gender}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'green',
      inactive: 'red',
    };
    const textMap: Record<string, string> = {
      active: '在读',
      inactive: '离校',
    };
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
  };

  const columns = [
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => getGenderTag(gender),
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      width: 100,
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '入住状态',
      dataIndex: 'check_in_id',
      key: 'check_in_id',
      width: 100,
      render: (id: number, record: Student) => (
        id ? (
          <Tag color="blue">
            {record.room_number} {record.bed_code}
          </Tag>
        ) : (
          <Tag color="default">未入住</Tag>
        )
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Student) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="学生列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            新增学生
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default StudentList;