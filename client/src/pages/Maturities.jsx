import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, message, Descriptions, Typography, Tooltip, Badge, Alert, Statistic, Row, Col } from 'antd';
import { EyeOutlined, LockOutlined, UnlockOutlined, CheckCircleOutlined, SyncOutlined, ReloadOutlined, BellOutlined } from '@ant-design/icons';
import { maturitiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Maturities = () => {
  const [loading, setLoading] = useState(false);
  const [maturities, setMaturities] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchMaturities();
    fetchUpcoming();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchMaturities = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      const response = await maturitiesAPI.getList(params);
      if (response.data.success) {
        setMaturities(response.data.data.reminders || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取到期提醒列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const response = await maturitiesAPI.getUpcoming(7);
      if (response.data.success) {
        setUpcoming(response.data.data.reminders || []);
      }
    } catch (error) {
      console.error('获取即将到期提醒失败:', error);
    }
  };

  const getReminderTypeLabel = (type) => {
    const map = {
      '7_days': '提前7天',
      '3_days': '提前3天',
      '1_day': '提前1天',
      'on_time': '到期当日',
      'overdue': '已逾期'
    };
    return map[type] || type;
  };

  const getReminderTypeColor = (type) => {
    const map = {
      '7_days': 'blue',
      '3_days': 'orange',
      '1_day': 'gold',
      'on_time': 'red',
      'overdue': 'magenta'
    };
    return map[type] || 'default';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      sent: { color: 'blue', text: '已发送' },
      processed: { color: 'green', text: '已处理' },
      ignored: { color: 'default', text: '已忽略' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleAction = async (action) => {
    if (!selectedItem) return;
    try {
      let response;
      switch (action) {
        case 'lock':
          response = await maturitiesAPI.lock(selectedItem.id);
          break;
        case 'unlock':
          response = await maturitiesAPI.unlock(selectedItem.id);
          break;
        case 'process':
          response = await maturitiesAPI.process(selectedItem.id, '处理完成');
          break;
        case 'send':
          response = await maturitiesAPI.send(selectedItem.id);
          break;
        default:
          return;
      }
      
      if (response.data.success) {
        message.success('操作执行成功');
        setDetailModalVisible(false);
        fetchMaturities();
        fetchUpcoming();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await maturitiesAPI.generate();
      if (response.data.success) {
        message.success(`成功生成 ${response.data.data.count} 条到期提醒`);
        fetchMaturities();
        fetchUpcoming();
      }
    } catch (error) {
      message.error('生成到期提醒失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '提醒编号',
      dataIndex: 'reminder_no',
      key: 'reminder_no',
      render: (text, record) => (
        <a onClick={() => {
          setSelectedItem(record);
          setDetailModalVisible(true);
        }}>{text}</a>
      )
    },
    {
      title: '票据编号',
      dataIndex: 'bill_number',
      key: 'bill_number'
    },
    {
      title: '提醒类型',
      dataIndex: 'reminder_type',
      key: 'reminder_type',
      render: (text) => (
        <Tag color={getReminderTypeColor(text)}>
          {getReminderTypeLabel(text)}
        </Tag>
      )
    },
    {
      title: '提醒日期',
      dataIndex: 'reminder_date',
      key: 'reminder_date',
      render: (text) => text && dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => getStatusTag(text)
    },
    {
      title: '锁定状态',
      dataIndex: 'is_locked',
      key: 'is_locked',
      render: (text, record) => (
        text === 1 ? (
          <Badge 
            status="processing" 
            text={`已被 ${record.locked_by_name || '其他用户'} 锁定`} 
          />
        ) : (
          <Badge status="success" text="未锁定" />
        )
      )
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedItem(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'pending' && hasRole(['finance', 'bank', 'admin']) && (
            <>
              {record.is_locked !== 1 ? (
                <Tooltip title="锁定">
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<LockOutlined />}
                    onClick={() => {
                      setSelectedItem(record);
                      handleAction('lock');
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="解锁">
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<UnlockOutlined />}
                    onClick={() => {
                      setSelectedItem(record);
                      handleAction('unlock');
                    }}
                  />
                </Tooltip>
              )}
              {record.is_locked !== 1 && (
                <Tooltip title="标记处理完成">
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    onClick={() => {
                      setSelectedItem(record);
                      handleAction('process');
                    }}
                  />
                </Tooltip>
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>到期提醒</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchMaturities}
          >
            刷新
          </Button>
          {hasRole(['finance', 'admin']) && (
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={handleGenerate}
              loading={loading}
            >
              生成到期提醒
            </Button>
          )}
        </Space>
      </div>

      {upcoming.length > 0 && (
        <Alert
          message="即将到期提醒"
          description={`未来7天内有 ${upcoming.length} 条票据即将到期，请及时处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={fetchMaturities}>
              查看详情
            </Button>
          }
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="待处理"
              value={maturities.filter(m => m.status === 'pending').length}
              prefix={<BellOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已锁定"
              value={maturities.filter(m => m.is_locked === 1).length}
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已发送"
              value={maturities.filter(m => m.status === 'sent').length}
              prefix={<BellOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已处理"
              value={maturities.filter(m => m.status === 'processed').length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={maturities}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={(page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          }}
        />
      </Card>

      <Modal
        title="到期提醒详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={600}
        footer={selectedItem?.status === 'pending' && hasRole(['finance', 'bank', 'admin']) ? [
          ...(selectedItem?.is_locked !== 1 ? [
            <Button key="lock" onClick={() => handleAction('lock')}>
              <LockOutlined /> 锁定
            </Button>
          ] : [
            <Button key="unlock" onClick={() => handleAction('unlock')}>
              <UnlockOutlined /> 解锁
            </Button>
          ]),
          <Button key="send" onClick={() => handleAction('send')}>
            <BellOutlined /> 发送提醒
          </Button>,
          <Button key="process" type="primary" onClick={() => handleAction('process')}>
            <CheckCircleOutlined /> 处理完成
          </Button>
        ] : [
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {selectedItem && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="提醒编号">{selectedItem.reminder_no}</Descriptions.Item>
            <Descriptions.Item label="票据编号">{selectedItem.bill_number}</Descriptions.Item>
            <Descriptions.Item label="提醒类型">
              <Tag color={getReminderTypeColor(selectedItem.reminder_type)}>
                {getReminderTypeLabel(selectedItem.reminder_type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提醒日期">{dayjs(selectedItem.reminder_date).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedItem.status)}</Descriptions.Item>
            <Descriptions.Item label="锁定状态">
              {selectedItem.is_locked === 1 ? (
                <Badge status="processing" text={`已锁定 (${selectedItem.locked_by_name || '未知用户'})`} />
              ) : (
                <Badge status="success" text="未锁定" />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">{selectedItem.operator_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理备注">{selectedItem.processed_comment || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Maturities;
