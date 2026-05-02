import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Tag,
  Space,
  message,
  Descriptions,
  Statistic,
  Row,
  Col,
  Spin,
} from 'antd';
import { SyncOutlined, EyeOutlined, ExclamationCircleOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../store/auth';

const Reconciliation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRecon, setCurrentRecon] = useState<any>(null);
  const { user } = useAuth();

  const canExecute = ['CASHIER', 'FINANCIAL_MANAGER', 'ADMIN'].includes(user?.role || '');

  const loadReconciliations = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/reconciliation');
      if (response.success) {
        setReconciliations(response.data.reconciliations || []);
      }
    } catch (error) {
      console.error('Load reconciliations error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliations();
  }, []);

  const handleExecuteRecon = async () => {
    setExecuting(true);
    try {
      const response: any = await api.post('/reconciliation/execute', { date: new Date().toISOString().split('T')[0] });
      if (response.success) {
        message.success('对账执行成功');
        loadReconciliations();
      }
    } catch (error) {
      console.error('Execute reconciliation error:', error);
    } finally {
      setExecuting(false);
    }
  };

  const handleViewDetail = async (record: any) => {
    setCurrentRecon(record);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      HAS_EXCEPTIONS: 'warning',
      FAILED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      HAS_EXCEPTIONS: '有异常',
      FAILED: '失败',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: '对账编号',
      dataIndex: 'reconNumber',
      key: 'reconNumber',
    },
    {
      title: '对账日期',
      dataIndex: 'reconDate',
      key: 'reconDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '匹配数',
      dataIndex: 'matchedCount',
      key: 'matchedCount',
      render: (count: number) => (
        <Tag color="success">{count}</Tag>
      ),
    },
    {
      title: '未匹配',
      dataIndex: 'unmatchedCount',
      key: 'unmatchedCount',
      render: (count: number) => (
        <Tag color="warning">{count}</Tag>
      ),
    },
    {
      title: '异常数',
      dataIndex: 'exceptionCount',
      key: 'exceptionCount',
      render: (count: number) => (
        <Tag color={count > 0 ? 'error' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>对账管理</h2>
        <p>银行流水与ERP单据自动对账，异常项处理</p>
      </div>

      <Card
        extra={
          canExecute && (
            <Button
              type="primary"
              icon={<SyncOutlined spin={executing} />}
              onClick={handleExecuteRecon}
              loading={executing}
            >
              执行对账
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={reconciliations}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="对账详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={null}
      >
        {currentRecon && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="对账编号">{currentRecon.reconNumber}</Descriptions.Item>
              <Descriptions.Item label="对账日期">
                {new Date(currentRecon.reconDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentRecon.status)}>{getStatusText(currentRecon.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="交易总数">{currentRecon.totalTransactions || 0}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="匹配数"
                    value={currentRecon.matchedCount || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="未匹配"
                    value={currentRecon.unmatchedCount || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="异常数"
                    value={currentRecon.exceptionCount || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 16 }}>统计说明</h4>
              <ul style={{ color: '#666', lineHeight: 1.8 }}>
                <li><Tag color="success">匹配</Tag>: 银行流水与ERP单据完全匹配</li>
                <li><Tag color="warning">未匹配</Tag>: 暂未找到对应单据，可能存在时间差</li>
                <li><Tag color="error">异常</Tag>: 金额、日期等关键信息不匹配，需人工核查</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reconciliation;
