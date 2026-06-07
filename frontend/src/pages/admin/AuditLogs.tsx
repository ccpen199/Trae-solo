import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Pagination } from 'antd';
import { adminAPI } from '../../api';

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLogs({ page, pageSize });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const actionColorMap: Record<string, string> = {
    approve: 'green',
    reject: 'red',
    pending_review: 'orange',
    identity_verify: 'blue',
    merchant_verify: 'cyan',
    comment_sensitive: 'red',
  };

  const actionLabelMap: Record<string, string> = {
    approve: '内容通过',
    reject: '内容驳回',
    pending_review: '待审核',
    identity_verify: '实名认证',
    merchant_verify: '商家审核',
    comment_sensitive: '评论敏感词',
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (v: string) => (
        <Tag color={actionColorMap[v] || 'default'}>
          {actionLabelMap[v] || v}
        </Tag>
      ),
    },
    { title: '帖子ID', dataIndex: 'post_id', key: 'post_id', width: 80 },
    { title: '帖子标题', dataIndex: 'post_title', key: 'post_title' },
    { title: '操作用户', dataIndex: 'user_name', key: 'user_name', width: 120 },
    { title: '管理员', dataIndex: 'admin_name', key: 'admin_name', width: 120 },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
  ];

  return (
    <div>
      <Card title="审计日志" style={{ marginBottom: 16 }}>
        <Table
          loading={loading}
          dataSource={logs}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
