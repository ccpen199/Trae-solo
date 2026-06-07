import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, message, Modal, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';

const { Title, Text } = Typography;

const AdminReview: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectPostId, setRejectPostId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReviewPosts();
      setPosts(res.data.posts);
    } catch (error) {
      message.error('加载待审核内容失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: number) => {
    try {
      await adminAPI.approvePost(postId);
      message.success('审核通过');
      loadPosts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReject = async () => {
    if (!rejectPostId) return;
    try {
      await adminAPI.rejectPost(rejectPostId, { reason: rejectReason });
      message.success('已驳回');
      setRejectModal(false);
      setRejectPostId(null);
      setRejectReason('');
      loadPosts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string) => {
        const map: Record<string, string> = {
          news: '本地资讯', job: '招聘求职', rental: '房屋租售',
          secondhand: '二手交易', dating: '相亲交友', show: '秀场动态',
        };
        return <Tag color="blue">{map[v] || v}</Tag>;
      },
    },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '作者', dataIndex: 'author_name', key: 'author_name', width: 100 },
    { title: '城市', dataIndex: 'city_name', key: 'city_name', width: 100 },
    {
      title: '可信度',
      dataIndex: 'credibility_score',
      key: 'credibility_score',
      width: 100,
      render: (v: number) => (
        <Tag color={v >= 70 ? 'green' : v >= 50 ? 'orange' : 'red'}>
          {v?.toFixed(0)}%
        </Tag>
      ),
    },
    { title: '发布时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/posts/${record.id}`)}>查看</Button>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>通过</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => {
            setRejectPostId(record.id);
            setRejectModal(true);
          }}>驳回</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>内容安全审核工作台</Title>

      <Card>
        <Table
          loading={loading}
          dataSource={posts}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="驳回内容"
        open={rejectModal}
        onOk={handleReject}
        onCancel={() => {
          setRejectModal(false);
          setRejectPostId(null);
        }}
      >
        <p style={{ marginBottom: 16 }}>请输入驳回原因：</p>
        <textarea
          style={{ width: '100%', height: 100, padding: 8 }}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请说明驳回原因"
        />
      </Modal>
    </div>
  );
};

export default AdminReview;
