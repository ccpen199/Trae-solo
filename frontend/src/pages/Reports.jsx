import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Card, Space } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { reports } from '../api.js';

const Reports = ({ currentUser }) => {
  const [list, setList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await reports.getAll();
      setList(data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = (record) => {
    setCurrentReport(record);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await reports.create({
        ...values,
        generated_by: currentUser?.username || 'system'
      });
      message.success('创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '类型',
      dataIndex: 'report_type',
      key: 'report_type',
      width: 120
    },
    {
      title: '生成人',
      dataIndex: 'generated_by',
      key: 'generated_by',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
          查看
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>分析报告</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          生成报告
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="生成分析报告"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="报告标题" rules={[{ required: true }]}>
            <Input placeholder="请输入报告标题" />
          </Form.Item>
          <Form.Item name="report_type" label="报告类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="general">综合分析报告</Select.Option>
              <Select.Option value="price">价格分析报告</Select.Option>
              <Select.Option value="feature">功能对比报告</Select.Option>
              <Select.Option value="review">评论分析报告</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="分析内容">
            <Input.TextArea rows={6} placeholder="请输入分析内容" />
          </Form.Item>
          <Form.Item name="recommendations" label="建议">
            <Input.TextArea rows={4} placeholder="请输入建议" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="报告详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentReport && (
          <div>
            <Card title={currentReport.title} size="small">
              <p><strong>类型:</strong> {currentReport.report_type}</p>
              <p><strong>生成人:</strong> {currentReport.generated_by}</p>
              <p><strong>创建时间:</strong> {currentReport.created_at}</p>
              <hr style={{ margin: '12px 0' }} />
              <h4>分析内容</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{currentReport.content}</p>
              <h4 style={{ marginTop: 16 }}>建议</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{currentReport.recommendations}</p>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
