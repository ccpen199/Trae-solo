import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Card, Modal } from 'antd';
import { reservationAPI } from '../../services/api';

function MyReservations() {
  const [data, setData] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await reservationAPI.getMyReservations();
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await reservationAPI.cancel(id);
      message.success('取消成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '取消失败');
    }
  };

  const handleCheckin = async (id) => {
    try {
      await reservationAPI.checkin(id);
      message.success('签到成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '签到失败');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await reservationAPI.getDetail(id);
      setCurrentReservation(res.data);
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      reserved: 'blue',
      checked_in: 'orange',
      processing: 'processing',
      completed: 'green',
      cancelled: 'default',
      missed: 'red'
    };
    return map[status] || 'default';
  };

  const getStatusText = (status) => {
    const map = {
      reserved: '已预约',
      checked_in: '已签到',
      processing: '办理中',
      completed: '已完成',
      cancelled: '已取消',
      missed: '已爽约'
    };
    return map[status] || status;
  };

  const columns = [
    { title: '预约编号', dataIndex: 'reservation_no', key: 'no' },
    { title: '办事网点', dataIndex: 'branch_name', key: 'branch' },
    { title: '办理事项', dataIndex: 'service_name', key: 'service' },
    { title: '预约日期', dataIndex: 'reservation_date', key: 'date' },
    { title: '时段', dataIndex: 'time_slot', key: 'slot' },
    { title: '窗口号', dataIndex: 'window_no', key: 'window', render: n => `${n}号窗口` },
    { title: '排队号', dataIndex: 'queue_number', key: 'queue' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button type="link" onClick={() => viewDetail(record.id)}>详情</Button>
          {record.status === 'reserved' && (
            <>
              <Button type="link" onClick={() => handleCheckin(record.id)}>签到</Button>
              <Button type="link" danger onClick={() => handleCancel(record.id)}>取消</Button>
            </>
          )}
        </span>
      )
    }
  ];

  return (
    <div>
      <Card title="我的预约">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
        />
      </Card>

      <Modal
        title="预约详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
      >
        {currentReservation && (
          <div>
            <p><strong>预约编号：</strong>{currentReservation.reservation_no}</p>
            <p><strong>办事网点：</strong>{currentReservation.branch_name}</p>
            <p><strong>网点地址：</strong>{currentReservation.branch_address}</p>
            <p><strong>联系电话：</strong>{currentReservation.branch_phone}</p>
            <p><strong>办理事项：</strong>{currentReservation.service_name || '综合业务'}</p>
            <p><strong>事项编码：</strong>{currentReservation.service_code || '-'}</p>
            <p><strong>预约日期：</strong>{currentReservation.reservation_date}</p>
            <p><strong>预约时段：</strong>{currentReservation.time_slot}</p>
            <p><strong>窗口号：</strong>{currentReservation.window_no}号窗口</p>
            <p><strong>排队号：</strong><Tag color="blue">{currentReservation.queue_number}</Tag></p>
            <p><strong>办理时长：</strong>{currentReservation.handling_time || '约30分钟'}</p>
            <p><strong>当前状态：</strong>
              <Tag color={getStatusColor(currentReservation.status)}>
                {getStatusText(currentReservation.status)}
              </Tag>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MyReservations;
