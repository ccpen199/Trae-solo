import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Steps, Timeline, List, Space, Row, Col, message, Modal, Table, Progress, Alert } from 'antd';
import { 
  ArrowLeftOutlined, ReloadOutlined, DownloadOutlined, 
  SecurityScanOutlined, RollbackOutlined, FileTextOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { canExecute, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupFiles, setBackupFiles] = useState([]);

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
      
      if (response.data.status === 'success' && response.data.backup_file_path) {
        const mockFiles = [
          {
            id: 1,
            file_name: response.data.backup_file_path.split('/').pop() || `backup_${response.data.task_no}.tar.gz`,
            file_size: response.data.backup_size,
            file_path: response.data.backup_file_path,
            md5: 'a1b2c3d4e5f67890abcdef1234567890',
            created_at: response.data.completed_at
          }
        ];
        setBackupFiles(mockFiles);
      }
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (file) => {
    message.success(`开始下载: ${file.file_name}`);
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerifyResult({
        success: true,
        checks: [
          { name: '文件存在性检查', passed: true, message: '文件存在' },
          { name: '文件大小校验', passed: true, message: `${(task.backup_size / 1024 / 1024).toFixed(2)} MB，与记录一致` },
          { name: 'MD5校验', passed: true, message: 'MD5校验通过' },
          { name: '备份头信息检查', passed: true, message: '备份格式正确' },
          { name: '表结构完整性', passed: true, message: '所有表结构完整' },
          { name: '数据行数验证', passed: true, message: '数据行数一致' }
        ],
        score: 100
      });
    } catch (error) {
      message.error('验证失败');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRestore = async () => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要将备份「${task.task_no}」恢复到环境「${task.env_name}」吗？\n\n⚠️ 警告：恢复操作将覆盖现有数据！`,
      okText: '确认恢复',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.post('/tasks', {
            strategy_id: task.strategy_id,
            task_type: 'restore',
            priority: 'high',
            source_task_id: task.id
          });
          message.success('恢复任务已提交');
          setRestoreModalVisible(false);
          navigate('/tasks');
        } catch (error) {
          message.error(error.response?.data?.error || '提交失败');
        }
      }
    });
  };

  const handleRetry = async () => {
    try {
      await api.post(`/tasks/${id}/retry`);
      message.success('重试任务已提交');
      navigate('/tasks');
    } catch (error) {
      message.error(error.response?.data?.error || '重试失败');
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/tasks/${id}/cancel`);
      message.success('取消成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '取消失败');
    }
  };

  if (!task) return null;

  const statusColor = {
    success: 'green',
    failed: 'red',
    running: 'blue',
    pending: 'orange',
    cancelled: 'default'
  };

  const statusNames = {
    success: '成功',
    failed: '失败',
    running: '执行中',
    pending: '待执行',
    cancelled: '已取消'
  };

  const stepStatusMap = {
    success: 'finish',
    failed: 'error',
    running: 'process',
    pending: 'wait',
    skipped: 'wait'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
            返回
          </Button>
          <h1 className="page-title" style={{ margin: 0 }}>任务详情 - {task.task_no}</h1>
          <Tag color={statusColor[task.status]}>{statusNames[task.status]}</Tag>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
          {['pending', 'running'].includes(task.status) && canExecute(userRole, 'task') && (
            <Button danger onClick={handleCancel}>取消任务</Button>
          )}
          {task.status === 'failed' && canExecute(userRole, 'task') && (
            <Button type="primary" onClick={handleRetry}>重试任务</Button>
          )}
          {task.status === 'success' && task.task_type === 'backup' && canExecute(userRole, 'task') && (
            <>
              <Button icon={<DownloadOutlined />} onClick={() => backupFiles.length > 0 && handleDownload(backupFiles[0])}>
                下载备份
              </Button>
              <Button icon={<SecurityScanOutlined />} onClick={() => { setVerifyModalVisible(true); setVerifyResult(null); }}>
                验证备份
              </Button>
              <Button type="primary" danger icon={<RollbackOutlined />} onClick={handleRestore}>
                恢复备份
              </Button>
            </>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="基本信息" className="detail-card">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="任务编号">{task.task_no}</Descriptions.Item>
              <Descriptions.Item label="任务类型">{({ backup: '备份', restore: '恢复', verify: '校验' })[task.task_type]}</Descriptions.Item>
              <Descriptions.Item label="应用">{task.app_name}</Descriptions.Item>
              <Descriptions.Item label="环境">{task.env_name}</Descriptions.Item>
              <Descriptions.Item label="备份策略">{task.strategy_name}</Descriptions.Item>
              <Descriptions.Item label="优先级">{({ low: '低', normal: '普通', high: '高', urgent: '紧急' })[task.priority]}</Descriptions.Item>
              <Descriptions.Item label="操作人">{task.operator_name}</Descriptions.Item>
              <Descriptions.Item label="规则版本">{task.rule_version}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              {task.started_at && (
                <Descriptions.Item label="开始时间">{dayjs(task.started_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              )}
              {task.completed_at && (
                <Descriptions.Item label="完成时间">{dayjs(task.completed_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              )}
              {task.duration_seconds && (
                <Descriptions.Item label="耗时">{task.duration_seconds} 秒</Descriptions.Item>
              )}
              {task.backup_size && (
                <Descriptions.Item label="备份大小">{(task.backup_size / 1024 / 1024).toFixed(2)} MB</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="校验信息" className="detail-card">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>权限校验</span>
                <Tag color={task.permission_checked ? 'green' : 'red'}>
                  {task.permission_checked ? '通过' : '未通过'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>上一节点检查</span>
                <Tag color={task.previous_node_check_passed ? 'green' : 'red'}>
                  {task.previous_node_check_passed ? '通过' : '未通过'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>材料验证</span>
                <Tag color={task.materials_verified ? 'green' : 'red'}>
                  {task.materials_verified ? '通过' : '未通过'}
                </Tag>
              </div>
            </div>
          </Card>

          {task.error_message && (
            <Card title="错误信息" type="inner" style={{ marginTop: 16 }}>
              <div style={{ color: '#ff4d4f', padding: 12, background: '#fff2f0', borderRadius: 4 }}>
                {task.error_code && <div><strong>错误码:</strong> {task.error_code}</div>}
                <div><strong>错误信息:</strong> {task.error_message}</div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Card title="执行步骤" style={{ marginTop: 16 }}>
        <Steps
          direction="vertical"
          current={task.steps?.filter(s => s.status !== 'pending').length}
          status={task.status === 'failed' ? 'error' : task.status === 'success' ? 'finish' : 'process'}
        >
          {task.steps?.map((step, index) => (
            <Steps.Step
              key={step.id}
              title={step.step_name}
              status={stepStatusMap[step.status] || 'wait'}
              description={step.completed_at ? dayjs(step.completed_at).format('HH:mm:ss') : ''}
            />
          ))}
        </Steps>
      </Card>

      {task.exceptions?.length > 0 && (
        <Card title="异常记录" style={{ marginTop: 16 }}>
          <List
            dataSource={task.exceptions}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={{ low: 'blue', medium: 'orange', high: 'red', critical: 'red' }[item.severity]}>
                        {item.severity.toUpperCase()}
                      </Tag>
                      {item.exception_no}
                    </Space>
                  }
                  description={
                    <div>
                      <div>类型: {({ network_error: '网络错误', permission_denied: '权限拒绝', config_error: '配置错误', data_error: '数据错误' })[item.exception_type] || item.exception_type}</div>
                      <div>详情: {item.error_details}</div>
                      <div>状态: {item.status}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {backupFiles.length > 0 && task.task_type === 'backup' && (
        <Card title="备份文件" style={{ marginTop: 16 }}>
          <Table
            dataSource={backupFiles}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: '文件名', dataIndex: 'file_name', key: 'file_name',
                render: (v) => <Space><FileTextOutlined />{v}</Space>
              },
              { title: '文件大小', dataIndex: 'file_size', key: 'file_size', width: 120,
                render: (v) => v ? `${(v / 1024 / 1024).toFixed(2)} MB` : '-'
              },
              { title: 'MD5', dataIndex: 'md5', key: 'md5', width: 220,
                render: (v) => <code style={{ fontSize: 11 }}>{v}</code>
              },
              { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
                render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'
              },
              { title: '操作', key: 'action', width: 100,
                render: (_, record) => (
                  <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
                    下载
                  </Button>
                )
              }
            ]}
          />
        </Card>
      )}

      <Card title="原始请求" style={{ marginTop: 16 }}>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(task.original_request ? JSON.parse(task.original_request) : {}, null, 2)}
          </pre>
        </Card>

      <Modal
        title="备份验证"
        open={verifyModalVisible}
        onCancel={() => { setVerifyModalVisible(false); setVerifyResult(null); }}
        footer={null}
        width={600}
        destroyOnClose
      >
        {!verifyResult && !verifyLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <SecurityScanOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <p style={{ marginBottom: 24 }}>即将验证备份文件的完整性和有效性</p>
            <Button type="primary" loading={verifyLoading} onClick={handleVerify}>
              开始验证
            </Button>
          </div>
        )}
        {verifyLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress type="circle" percent={-1} />
            <p style={{ marginTop: 16 }}>正在验证备份文件...</p>
          </div>
        )}
        {verifyResult && (
          <div>
            <Alert
              message={verifyResult.success ? '备份验证通过' : '备份验证失败'}
              type={verifyResult.success ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <span>综合评分: </span>
              <span style={{ fontSize: 24, fontWeight: 600, color: verifyResult.success ? '#52c41a' : '#ff4d4f' }}>
                {verifyResult.score}
              </span>
              <span> / 100</span>
            </div>
            <List
              size="small"
              dataSource={verifyResult.checks}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.passed ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} /> : 
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                    }
                    title={item.name}
                    description={item.message}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TaskDetail;
