import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Descriptions,
  Modal,
  message
} from 'antd';
import {
  EyeOutlined,
  SafetyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { registrationApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors = {
  pending: 'orange',
  locked: 'blue',
  activated: 'green',
  refunded: 'default',
  deducted: 'red'
};

const statusLabels = {
  pending: '待锁定',
  locked: '已锁定',
  activated: '已激活',
  refunded: '已退回',
  deducted: '已扣除'
};

const MyRegistrations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await registrationApi.getMyRegistrations();
      if (response.data.success) {
        setRegistrations(response.data.data || []);
      }
    } catch (error) {
      message.error('获取报名记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (reg) => {
    setSelectedReg(reg);
    setDetailModalVisible(true);
  };

  const handleLockDeposit = async (regId) => {
    try {
      const response = await registrationApi.lockDeposit(regId);
      if (response.data.success) {
        message.success('保证金已锁定，正在激活竞价权限...');
        setTimeout(async () => {
          await registrationApi.activateBiddingRight(regId);
          message.success('竞价权限已激活！');
          fetchRegistrations();
        }, 1000);
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '报名时间',
      dataIndex: 'createdAt',
      key: 'time',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '项目名称',
      dataIndex: ['Project', 'name'],
      key: 'projectName',
      render: (name, record) => (
        <Text strong>{name || record.projectName}</Text>
      )
    },
    {
      title: '项目编号',
      dataIndex: ['Project', 'projectNumber'],
      key: 'projectNumber',
      width: 150,
      render: (num) => <Tag>{num}</Tag>
    },
    {
      title: '保证金金额',
      dataIndex: 'depositAmount',
      key: 'amount',
      width: 130,
      render: (val) => `¥${Number(val).toLocaleString()}`
    },
    {
      title: '保证金状态',
      dataIndex: 'depositStatus',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '竞价权限',
      dataIndex: 'hasBiddingRight',
      key: 'right',
      width: 120,
      render: (hasRight) => hasRight ? (
        <Tag color="green" icon={<SafetyOutlined />}>已激活</Tag>
      ) : (
        <Tag color="orange">未激活</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          
          {record.depositStatus === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleLockDeposit(record.id)}
            >
              锁定保证金
            </Button>
          )}

          {record.hasBiddingRight && record.Project?.status === 'bidding' && (
            <Button
              type="primary"
              size="small"
              icon={<RiseOutlined />}
              onClick={() => navigate(`/bidding/${record.projectId}`)}
            >
              进入竞价
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <Space>
          <SafetyOutlined />
          我的报名记录
        </Space>
      </Title>

      <Card>
        <Table
          columns={columns}
          dataSource={registrations}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="报名详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedReg && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="报名时间">
                {dayjs(selectedReg.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">
                {selectedReg.Project?.name || selectedReg.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="项目编号">
                {selectedReg.Project?.projectNumber}
              </Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag>
                  {({
                    draft: '草稿',
                    announcing: '公告中',
                    registration: '报名中',
                    bidding: '竞价中',
                    completed: '已成交',
                    finished: '已完成'
                  })[selectedReg.Project?.status] || '未知'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="保证金金额">
                <Text strong style={{ color: '#1890ff' }}>
                  ¥{Number(selectedReg.depositAmount).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="保证金状态">
                <Tag color={statusColors[selectedReg.depositStatus]}>
                  {statusLabels[selectedReg.depositStatus]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="竞价权限">
                {selectedReg.hasBiddingRight ? (
                  <Tag color="green">已激活</Tag>
                ) : (
                  <Tag color="orange">未激活</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="锁定时间">
                {selectedReg.depositLockedAt
                  ? dayjs(selectedReg.depositLockedAt).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedReg.depositStatus === 'refunded' && (
              <Card type="inner" title="退款记录" style={{ marginTop: 16 }}>
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="退款时间">
                    {selectedReg.depositRefundedAt
                      ? dayjs(selectedReg.depositRefundedAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="退款原因">
                    {selectedReg.depositRefundReason || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyRegistrations;
