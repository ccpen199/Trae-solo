import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Card,
  Space,
  Spin,
  Empty,
  message,
  Modal,
} from 'antd';
import { EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { reservationApi } from '../../api';

export const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await reservationApi.getMy();
      setReservations(response.data || []);
    } catch (error) {
      console.error('加载预约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (record: any) => {
    setSelectedReservation(record);
    setCancelVisible(true);
  };

  const confirmCancel = async () => {
    if (!selectedReservation) return;
    setCancelling(true);
    try {
      await reservationApi.cancel(selectedReservation.id);
      message.success('预约已取消');
      loadReservations();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '取消失败');
    } finally {
      setCancelling(false);
      setCancelVisible(false);
      setSelectedReservation(null);
    }
  };

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'reservation_number',
      key: 'reservation_number',
      width: 180,
    },
    {
      title: '办件事项',
      dataIndex: ['case', 'service_item_name'],
      key: 'service_item_name',
    },
    {
      title: '预约日期',
      dataIndex: 'reservation_date',
      key: 'reservation_date',
      width: 120,
    },
    {
      title: '预约时间',
      key: 'time',
      width: 150,
      render: (_: any, record: any) =>
        `${record.time_slot?.start_time || '-'} - ${record.time_slot?.end_time || '-'}`,
    },
    {
      title: '窗口',
      key: 'window',
      width: 80,
      render: (_: any, record: any) => (
        <Tag color="blue">{record.time_slot?.window_number}号</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'blue',
          CHECKED_IN: 'green',
          COMPLETED: 'success',
          CANCELLED: 'default',
          NO_SHOW: 'red',
        };
        const textMap: Record<string, string> = {
          PENDING: '待到场',
          CHECKED_IN: '已取号',
          COMPLETED: '已完成',
          CANCELLED: '已取消',
          NO_SHOW: '未到场',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {textMap[status] || status}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/citizen/cases/${record.case_id}`)}
          >
            查看办件
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" danger onClick={() => handleCancel(record)}>
              取消预约
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card title="我的预约">
        {reservations.length === 0 && !loading ? (
          <Empty
            description="暂无预约记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={reservations}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>

      <Modal
        title="确认取消预约"
        open={cancelVisible}
        onOk={confirmCancel}
        onCancel={() => setCancelVisible(false)}
        confirmLoading={cancelling}
        okText="确认取消"
        cancelText="返回"
      >
        <p>确定要取消该预约吗？取消后可以重新预约。</p>
        {selectedReservation && (
          <p style={{ color: '#666' }}>
            预约编号: {selectedReservation.reservation_number}
            <br />
            预约日期: {selectedReservation.reservation_date}
          </p>
        )}
      </Modal>
    </Spin>
  );
};
