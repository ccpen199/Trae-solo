import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Descriptions, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { changeAPI } from '../utils/api';

function AlertDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await changeAPI.getAlertDetail(id);
      setAlert(response.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getLevelTag = (level) => {
    const levelMap = {
      critical: { color: 'red', className: 'tag-level-critical', text: '严重' },
      high: { color: 'orange', className: 'tag-level-high', text: '高' },
      warning: { color: 'gold', className: 'tag-level-warning', text: '警告' },
    };
    const config = levelMap[level] || { color: 'default', className: '', text: level };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      open: { color: 'red', className: 'tag-status-failed', text: '待处理' },
      processing: { color: 'blue', className: 'tag-status-running', text: '处理中' },
      resolved: { color: 'green', className: 'tag-status-active', text: '已解决' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  if (!alert) return <div>告警不存在</div>;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alerts')}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ display: 'inline', marginLeft: 16 }}>
            {alert.title}
          </h1>
          {getLevelTag(alert.level)}
          {getStatusTag(alert.status)}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="告警信息" bordered column={2}>
          <Descriptions.Item label="告警ID">{alert.alert_id}</Descriptions.Item>
          <Descriptions.Item label="告警类型">{alert.type}</Descriptions.Item>
          <Descriptions.Item label="应用">{alert.app_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="环境">{alert.env_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="责任人">{alert.assignee_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(alert.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="详细描述" span={2}>
            {alert.message || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="解决方案" span={2}>
            {alert.resolution || '-'}
          </Descriptions.Item>
          {alert.resolved_at && (
            <Descriptions.Item label="解决时间" span={2}>
              {dayjs(alert.resolved_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
}

export default AlertDetail;
