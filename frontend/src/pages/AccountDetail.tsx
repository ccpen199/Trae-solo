import React from 'react';
import { Card, Descriptions, Tag, Button, Space, Divider, message, Modal, Form, Input } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { accountApi, orderApi } from '../services/api';
import { GameAccount, AccountStatus } from '../types';
import dayjs from 'dayjs';

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [buyModalVisible, setBuyModalVisible] = React.useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await accountApi.getById(id!);
      return response.data.data as GameAccount;
    },
    enabled: !!id,
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      const response = await orderApi.create(id!);
      return response.data;
    },
    onSuccess: () => {
      message.success('下单成功，请前往订单管理查看');
      setBuyModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '下单失败');
    },
  });

  const getStatusInfo = (status: AccountStatus) => {
    const map: Record<AccountStatus, { color: string; text: string }> = {
      PENDING_REVIEW: { color: 'orange', text: '待审核' },
      REVIEWING: { color: 'processing', text: '审核中' },
      APPROVED: { color: 'success', text: '已上架' },
      REJECTED: { color: 'error', text: '已拒绝' },
      SOLD: { color: 'default', text: '已售出' },
      REMOVED: { color: 'default', text: '已下架' },
    };
    return map[status];
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>账号不存在</div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(data.status);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/accounts')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 400, height: 300, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 72 }}>🎮</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                {data.isTop && <Tag color="orange">置顶</Tag>}
                {data.isHot && <Tag color="red">热门</Tag>}
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              </Space>
              <h2 style={{ fontSize: 24, margin: '12px 0' }}>{data.title}</h2>
              <p style={{ color: '#666', fontSize: 14 }}>{data.description || '暂无描述'}</p>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 14, color: '#666' }}>售价</span>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 32, color: '#ff4d4f', fontWeight: 'bold' }}>
                  ¥{data.price}
                </span>
                {data.originalPrice && (
                  <span style={{ marginLeft: 12, color: '#999', textDecoration: 'line-through' }}>
                    ¥{data.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <Descriptions column={2} size="small">
              <Descriptions.Item label="游戏名称">{data.gameName}</Descriptions.Item>
              <Descriptions.Item label="服务器">{data.gameServer || '未指定'}</Descriptions.Item>
              <Descriptions.Item label="账号等级">{data.accountLevel || '未指定'}</Descriptions.Item>
              <Descriptions.Item label="卖家">{data.seller?.username}</Descriptions.Item>
              <Descriptions.Item label="浏览量">{data.viewCount}</Descriptions.Item>
              <Descriptions.Item label="收藏量">{data.favoriteCount}</Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space size="large">
              {data.status === 'APPROVED' && (
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setBuyModalVisible(true)}
                >
                  立即购买
                </Button>
              )}
              <Button size="large">收藏</Button>
              <Button size="large">联系卖家</Button>
            </Space>
          </div>
        </div>
      </Card>

      <Modal
        title="确认购买"
        open={buyModalVisible}
        onOk={() => buyMutation.mutate()}
        onCancel={() => setBuyModalVisible(false)}
        confirmLoading={buyMutation.isPending}
      >
        <div>
          <p><strong>账号：</strong>{data.title}</p>
          <p><strong>价格：</strong><span style={{ color: '#ff4d4f', fontSize: 18 }}>¥{data.price}</span></p>
          <p style={{ color: '#999', fontSize: 12, marginTop: 16 }}>
            提示：下单后请在30分钟内完成支付，否则订单将自动取消
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AccountDetail;
