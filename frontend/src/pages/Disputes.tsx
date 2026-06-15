import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Modal, Form, Input, message, Space, Avatar } from 'antd';
import { ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import api from '../api';
import type { Dispute } from '../types';
import { useAuth } from '../context/AuthContext';

function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/disputes', { params: { limit: 50 } });
      setDisputes(data.disputes);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      processing: { text: '处理中', color: 'blue' },
      resolved: { text: '已解决', color: 'green' },
      rejected: { text: '已驳回', color: 'red' },
      auto_review: { text: '自动审核', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleViewDetail = (dispute: Dispute) => {
    setCurrentDispute(dispute);
    setDetailVisible(true);
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card title="纠纷管理" style={{ marginBottom: 16 }} />
      
      <List
        loading={loading}
        dataSource={disputes}
        locale={{ emptyText: <Empty description="暂无纠纷记录" /> }}
        renderItem={(item) => {
          const statusInfo = getStatusText(item.status);
          return (
            <List.Item
              style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={<ExclamationCircleOutlined />} style={{ background: '#faad14' }} />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{item.reason}</span>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                      投诉人: {item.complainant_name} | 被投诉人: {item.respondent_name}
                    </div>
                    <div style={{ color: '#595959' }}>{item.description}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                      {item.created_at}
                    </div>
                  </div>
                }
              />
              <Button size="small" onClick={() => handleViewDetail(item)}>查看详情</Button>
            </List.Item>
          );
        }}
      />

      <Modal
        title="纠纷详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentDispute && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>纠纷原因</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{currentDispute.reason}</div>
              </div>
              
              <div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>详细描述</div>
                <div>{currentDispute.description || '暂无描述'}</div>
              </div>

              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ color: '#8c8c8c', marginBottom: 4 }}>投诉人</div>
                  <Space>
                    <Avatar size="small" src={currentDispute.complainant_avatar} icon={<UserOutlined />} />
                    <span>{currentDispute.complainant_name}</span>
                  </Space>
                </div>
                <div>
                  <div style={{ color: '#8c8c8c', marginBottom: 4 }}>被投诉人</div>
                  <Space>
                    <Avatar size="small" src={currentDispute.respondent_avatar} icon={<UserOutlined />} />
                    <span>{currentDispute.respondent_name}</span>
                  </Space>
                </div>
              </div>

              <div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>状态</div>
                <Tag color={getStatusText(currentDispute.status).color}>
                  {getStatusText(currentDispute.status).text}
                </Tag>
              </div>

              {currentDispute.resolution && (
                <div>
                  <div style={{ color: '#8c8c8c', marginBottom: 4 }}>处理结果</div>
                  <div>{currentDispute.resolution}</div>
                </div>
              )}

              {currentDispute.arbitrator_name && (
                <div>
                  <div style={{ color: '#8c8c8c', marginBottom: 4 }}>仲裁员</div>
                  <div>{currentDispute.arbitrator_name}</div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Disputes;
