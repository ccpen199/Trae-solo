import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { roomApi } from '../../services/api';

interface Room {
  id: number;
  room_number: string;
  dormitory_id: number;
  building_code: string;
  building_name: string;
  floor: number;
  total_beds: number;
  actual_rooms: number;
  actual_beds: number;
  occupied_beds: number;
  available_beds: number;
  gender_type: string;
  status: string;
}

const RoomList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Room[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await roomApi.getAll();
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

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      available: 'green',
      occupied: 'orange',
      maintenance: 'red',
    };
    const textMap: Record<string, string> = {
      available: '可用',
      occupied: '已占用',
      maintenance: '维修中',
    };
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
  };

  const columns = [
    {
      title: '房间号',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 120,
    },
    {
      title: '所属楼栋',
      dataIndex: 'building_code',
      key: 'building_code',
      width: 100,
      render: (code: string, record: Room) => (
        <span>{code} - {record.building_name}</span>
      ),
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
    },
    {
      title: '床位总数',
      dataIndex: 'total_beds',
      key: 'total_beds',
      width: 100,
    },
    {
      title: '已入住',
      dataIndex: 'occupied_beds',
      key: 'occupied_beds',
      width: 100,
      render: (val: number) => (
        <Tag color="orange">{val || 0}</Tag>
      ),
    },
    {
      title: '空床位',
      dataIndex: 'available_beds',
      key: 'available_beds',
      width: 100,
      render: (val: number) => (
        <Tag color="green">{val || 0}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Room) => (
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
        title="房间列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            新增房间
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default RoomList;