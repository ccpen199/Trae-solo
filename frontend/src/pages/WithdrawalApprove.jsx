import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Input, message, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { TextArea } = Input;

const typeLabels = {
  rent: '租房提取',
  house_purchase: '购房提取',
  resignation: '离职提取',
  serious_illness: '大病提取',
  renovation: '装修提取',
  retirement: '退休提取'
};

export default function WithdrawalApprove() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState('approve');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const response = await api.get('/withdrawal/pending');
      setData(response.data);
    } catch (error) {
      message.error('加载待审批数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (item) => {
    setSelectedItem(item);
    setActionType('approve');
    setRejectReason('');
    setModalVisible(true);
  };

  const handleReject = (item) => {
    setSelectedItem(item);
    setActionType('reject');
    setRejectReason('');
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await api.post(`/withdrawal/${selectedItem.id}/approve`, {
        approved: actionType === 'approve',
        rejectReason: rejectReason
      });
      message.success(actionType === 'approve' ? '审批通过' : '已驳回');
      setModalVisible(false);
      loadPending();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: '申请编号', dataIndex: 'id', key: 'id' },
    { title: '申请人', dataIndex: 'user_name', key: 'user_name' },
    { title: '身份证号', dataIndex: 'id_card', key: 'id_card' },
    { title: '提取类型', dataIndex: 'type', key: 'type', render: (t) => typeLabels[t] || t },
    { title: '提取金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v.toFixed(2)}` },
    { title: '申请说明', dataIndex: 'reason', key: 'reason' },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
            通过
          </Button>
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleReject(record)}>
            驳回
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>提取审批</h2>
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无待审批申请' }}
        />
      </Card>

      <Modal
        title={actionType === 'approve' ? '审批通过' : '驳回申请'}
        open={modalVisible}
        onOk={handleConfirm}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText="确认"
        cancelText="取消"
      >
        {selectedItem && (
          <div>
            <p>申请人：{selectedItem.user_name}</p>
            <p>提取类型：{typeLabels[selectedItem.type]}</p>
            <p>提取金额：¥{selectedItem.amount.toFixed(2)}</p>
            <p>申请说明：{selectedItem.reason}</p>
            {actionType === 'reject' && (
              <div style={{ marginTop: 16 }}>
                <TextArea
                  rows={4}
                  placeholder="请输入驳回原因"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
