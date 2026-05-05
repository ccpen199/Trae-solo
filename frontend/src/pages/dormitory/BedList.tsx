import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, message } from 'antd';
import { bedApi } from '../../services/api';

interface Bed {
  id: number;
  bed_code: string;
  bed_number: string;
  room_id: number;
  room_number: string;
  building_code: string;
  building_name: string;
  status: string;
  student_id: number;
  student_name: string;
  student_no: string;
}

const BedList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Bed[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await bedApi.getAll();
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
      title: '床位编号',
      dataIndex: 'bed_code',
      key: 'bed_code',
      width: 120,
    },
    {
      title: '房间号',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 100,
    },
    {
      title: '所属楼栋',
      dataIndex: 'building_code',
      key: 'building_code',
      width: 100,
      render: (code: string, record: Bed) => (
        <span>{code} - {record.building_name}</span>
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
      title: '入住学生',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 120,
      render: (name: string, record: Bed) => (
        name ? <span>{name} ({record.student_no})</span> : <span style={{ color: '#999' }}>-</span>
      ),
    },
  ];

  return (
    <div>
      <Card title="床位列表">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default BedList;