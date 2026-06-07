import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Modal, Form, Input, Tag, Space, message, Descriptions } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import { adminAPI } from '../../utils/api';

const { Title } = Typography;
const { TextArea } = Input;

function AdminDocumentSandbox() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { loadAnalyses(); }, []);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDocumentAnalyses();
      if (res.data.success) setAnalyses(res.data.analyses);
    } catch (err) { message.error('加载失败'); }
    finally { setLoading(false); }
  };

  const handleAnalyze = async (values) => {
    try {
      const res = await adminAPI.analyzeDocument(values);
      if (res.data.success) {
        message.success('文书解析完成');
        setModalVisible(false);
        form.resetFields();
        loadAnalyses();
      }
    } catch (err) { message.error('解析失败'); }
  };

  const showDetail = (record) => {
    setSelectedAnalysis(record);
    setDetailModalVisible(true);
  };

  const columns = [
    { title: '文书名称', dataIndex: 'document_name', key: 'document_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'completed' ? 'green' : 'orange'}>{s === 'completed' ? '已完成' : '处理中'}</Tag> },
    { title: '操作人', dataIndex: 'admin_name', key: 'admin_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '操作', key: 'action', render: (_, r) => <Button type="link" onClick={() => showDetail(r)}>查看解析</Button> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>司法文书解析沙箱</Title>
        <Button type="primary" icon={<FileSearchOutlined />} onClick={() => setModalVisible(true)}>解析文书</Button>
      </div>
      <Card style={{ marginTop: 24 }}>
        <Table dataSource={analyses} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title="上传司法文书" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={700}>
        <Form form={form} onFinish={handleAnalyze} layout="vertical">
          <Form.Item name="document_name" label="文书名称" rules={[{ required: true }]}><Input placeholder="例如：购销合同纠纷判决书" size="large" /></Form.Item>
          <Form.Item name="document_content" label="文书内容" rules={[{ required: true }]}><TextArea rows={10} placeholder="粘贴司法文书全文..." /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block size="large">开始解析</Button></Form.Item>
        </Form>
      </Modal>
      <Modal title="文书解析结果" open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} footer={null} width={800}>
        {selectedAnalysis && (() => {
          let result = {};
          try { result = JSON.parse(selectedAnalysis.analysis_result); } catch (e) { result = {}; }
          return (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="文书类型">{result.document_type || '-'}</Descriptions.Item>
                <Descriptions.Item label="解析时间">{result.analyzed_at || '-'}</Descriptions.Item>
              </Descriptions>
              <Card title="关键条款分析" type="inner">
                <Table
                  dataSource={result.key_clauses || []}
                  columns={[
                    { title: '条款', dataIndex: 'clause', key: 'clause' },
                    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', render: l => <Tag color={l === 'high' ? 'red' : l === 'medium' ? 'orange' : 'green'}>{l}</Tag> },
                    { title: '分析', dataIndex: 'analysis', key: 'analysis' },
                  ]}
                  pagination={false} rowKey="clause"
                />
              </Card>
              <Card title="风险摘要" type="inner"><p>{result.risk_summary || '-'}</p></Card>
            </Space>
          );
        })()}
      </Modal>
    </div>
  );
}

export default AdminDocumentSandbox;
