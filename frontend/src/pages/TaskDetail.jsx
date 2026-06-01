import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Tag, Descriptions, Timeline, message, Spin, Tooltip } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { taskAPI } from '../utils/api';

function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [executing, setExecuting] = useState(false);
  const logRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    loadData();
    loadLogs();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (task?.status === 'running' && !pollingRef.current) {
      startPolling();
    } else if (task?.status !== 'running' && pollingRef.current) {
      stopPolling();
    }
  }, [task?.status]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      loadData();
      loadLogs();
    }, 1500);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const loadData = async () => {
    try {
      const response = await taskAPI.getDetail(id);
      setTask(response.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await taskAPI.getLogs(id);
      setLogs(response.data);
    } catch (error) {
      console.error('加载日志失败');
    }
  };

  const handleExecute = async () => {
    if (executing) return;
    setExecuting(true);
    try {
      await taskAPI.execute(id);
      message.success('任务已启动');
      setTask(prev => ({ ...prev, status: 'running' }));
      startPolling();
    } catch (error) {
      message.error(error.response?.data?.error || '启动失败');
    } finally {
      setExecuting(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', className: 'tag-status-pending', text: '待执行' },
      running: { color: 'blue', className: 'tag-status-running', text: '执行中' },
      completed: { color: 'green', className: 'tag-status-active', text: '已完成' },
      failed: { color: 'red', className: 'tag-status-failed', text: '失败' },
      cancelled: { color: 'default', className: 'tag-status-inactive', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const getLogStyle = (level) => {
    const styles = {
      info: { color: '#595959' },
      success: { color: '#52c41a', fontWeight: 500 },
      warning: { color: '#faad14' },
      error: { color: '#ff4d4f' },
    };
    return styles[level] || styles.info;
  };

  const getTimelineItems = () => {
    const items = [];
    if (task?.created_at) {
      items.push({
        color: 'blue',
        children: <div>任务创建 - {dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>,
      });
    }
    if (task?.started_at) {
      items.push({
        color: 'green',
        children: <div>开始执行 - {dayjs(task.started_at).format('YYYY-MM-DD HH:mm:ss')}</div>,
      });
    }
    if (task?.completed_at) {
      items.push({
        color: task.status === 'completed' ? 'green' : 'red',
        children: <div>执行{task.status === 'completed' ? '完成' : '结束'} - {dayjs(task.completed_at).format('YYYY-MM-DD HH:mm:ss')}</div>,
      });
    }
    return items;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  if (!task) return <div>任务不存在</div>;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ display: 'inline', marginLeft: 16 }}>
            {task.name}
          </h1>
          {getStatusTag(task.status)}
        </Space>
        <Space>
          {task.status === 'pending' && (
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />} 
              onClick={handleExecute}
              loading={executing}
            >
              开始执行
            </Button>
          )}
          <Tooltip title="刷新">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => { loadData(); loadLogs(); }}
            />
          </Tooltip>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="任务信息" bordered column={2}>
          <Descriptions.Item label="任务ID">{task.task_id}</Descriptions.Item>
          <Descriptions.Item label="任务类型">{task.type}</Descriptions.Item>
          <Descriptions.Item label="应用">{task.app_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="环境">{task.env_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="责任人">{task.assignee_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建者">{task.created_by || '-'}</Descriptions.Item>
          <Descriptions.Item label="参数" span={2}>
            {task.params ? <pre style={{ margin: 0 }}>{JSON.stringify(JSON.parse(task.params), null, 2)}</pre> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="执行结果" span={2}>
            {task.result ? <pre style={{ margin: 0 }}>{JSON.stringify(JSON.parse(task.result), null, 2)}</pre> : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        title={
          <Space>
            <span>执行日志</span>
            {task.status === 'running' && <Spin size="small" />}
            <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>
              共 {logs.length} 条记录
            </span>
          </Space>
        }
        extra={
          <Button size="small" onClick={loadLogs}>
            刷新日志
          </Button>
        }
      >
        <div 
          ref={logRef}
          style={{ 
            background: '#1e1e1e', 
            color: '#d4d4d4', 
            padding: 16, 
            borderRadius: 4,
            maxHeight: 400,
            overflowY: 'auto',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>
              暂无执行日志，点击「开始执行」启动任务
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={log.id || index} style={{ marginBottom: 2 }}>
                <span style={{ color: '#858585', marginRight: 12 }}>
                  {dayjs(log.created_at).format('HH:mm:ss')}
                </span>
                <span style={getLogStyle(log.level)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="执行时间线" style={{ marginTop: 16 }}>
        <Timeline items={getTimelineItems()} />
      </Card>
    </div>
  );
}

export default TaskDetail;
