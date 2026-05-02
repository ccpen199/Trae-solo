import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Space, message, Modal, Descriptions, Badge } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { TaskBatch, TaskStatus, TaskUnit } from '../../types';

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'blue',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.DELIVERED]: 'orange',
  [TaskStatus.QUALIFIED]: 'success',
  [TaskStatus.SETTLED]: 'green',
  [TaskStatus.DISQUALIFIED]: 'error',
  [TaskStatus.REVIEWING]: 'processing',
  [TaskStatus.PENDING_REVIEW]: 'warning',
  [TaskStatus.APPEALING]: 'warning',
  [TaskStatus.DRAFT]: 'default',
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待领取',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.DELIVERED]: '已交付',
  [TaskStatus.QUALIFIED]: '合格',
  [TaskStatus.SETTLED]: '已结算',
  [TaskStatus.DISQUALIFIED]: '不合格',
  [TaskStatus.REVIEWING]: '审核中',
  [TaskStatus.PENDING_REVIEW]: '待复核',
  [TaskStatus.APPEALING]: '申诉中',
  [TaskStatus.DRAFT]: '草稿',
};

const TaskBatches: React.FC = () => {
  const [batches, setBatches] = useState<TaskBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<TaskBatch | null>(null);
  const [taskUnits, setTaskUnits] = useState<TaskUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/batches');
      setBatches(response.data);
    } catch (error) {
      message.error('获取任务批次列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskUnits = async (batchId: number) => {
    setUnitsLoading(true);
    try {
      const response = await api.get(`/tasks/batches/${batchId}/units`);
      setTaskUnits(response.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleViewDetail = async (batch: TaskBatch) => {
    setSelectedBatch(batch);
    setDetailModalVisible(true);
    await fetchTaskUnits(batch.id);
  };

  const columns = [
    {
      title: '批次ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '批次名称',
      dataIndex: 'batch_name',
      key: 'batch_name',
      ellipsis: true,
    },
    {
      title: '单任务佣金',
      dataIndex: 'unit_reward',
      key: 'unit_reward',
      width: 120,
      render: (val: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{val}</span>,
    },
    {
      title: '任务数',
      dataIndex: 'total_units',
      key: 'total_units',
      width: 100,
      render: (_: any, record: TaskBatch) => `${record.completed_units}/${record.total_units}`,
    },
    {
      title: '完成率',
      key: 'progress',
      width: 150,
      render: (_: any, record: TaskBatch) => {
        const progress = record.total_units > 0 
          ? Math.round((record.completed_units / record.total_units) * 100) 
          : 0;
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>{progress}%</span>
            </div>
            <div style={{ 
              height: 8, 
              background: '#f0f0f0', 
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progress}%`,
                  background: progress === 100 ? '#52c41a' : '#1890ff',
                  borderRadius: 4,
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: '最低等级',
      dataIndex: 'min_worker_level',
      key: 'min_worker_level',
      width: 100,
      render: (val: number) => `Lv.${val}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: TaskBatch) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const unitColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '序号',
      dataIndex: 'unit_index',
      key: 'unit_index',
      width: 80,
      render: (val: number) => `#${val + 1}`,
    },
    {
      title: '任务内容',
      dataIndex: 'task_data',
      key: 'task_data',
      ellipsis: true,
      width: 300,
    },
    {
      title: '佣金',
      dataIndex: 'reward',
      key: 'reward',
      width: 100,
      render: (val: number) => <span style={{ color: '#52c41a' }}>¥{val}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>任务批次列表</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/publisher/create')}
        >
          发布新任务
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={batches}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`任务批次详情 - ${selectedBatch?.batch_name || ''}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedBatch && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批次ID">{selectedBatch.id}</Descriptions.Item>
              <Descriptions.Item label="批次名称">{selectedBatch.batch_name}</Descriptions.Item>
              <Descriptions.Item label="单任务佣金">
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{selectedBatch.unit_reward}</span>
              </Descriptions.Item>
              <Descriptions.Item label="总金额">
                <span style={{ color: '#faad14', fontWeight: 'bold' }}>¥{selectedBatch.total_reward}</span>
              </Descriptions.Item>
              <Descriptions.Item label="任务进度">
                {selectedBatch.completed_units} / {selectedBatch.total_units}
                <Badge 
                  count={`${Math.round((selectedBatch.completed_units / selectedBatch.total_units) * 100)}%`} 
                  style={{ marginLeft: 12 }}
                  status="processing"
                />
              </Descriptions.Item>
              <Descriptions.Item label="最低等级">Lv.{selectedBatch.min_worker_level}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedBatch.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedBatch.status]}>
                  {statusLabels[selectedBatch.status]}
                </Tag>
              </Descriptions.Item>
              {selectedBatch.description && (
                <Descriptions.Item label="描述" span={2}>
                  {selectedBatch.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            <h4 style={{ marginBottom: 16 }}>任务单元列表</h4>
            <Table
              columns={unitColumns}
              dataSource={taskUnits}
              rowKey="id"
              loading={unitsLoading}
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ y: 300 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default TaskBatches;
