import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Modal, Form, Input, Table, message } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [handleModal, setHandleModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch(`/api/alerts/${id}`)
      .then(res => res.json())
      .then(data => setAlert(data));
  }, [id]);

  const handleSubmit = (values) => {
    fetch(`/api/alerts/${id}/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, status: 'handled' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('预警已处理');
          setHandleModal(false);
          fetch(`/api/alerts/${id}`)
            .then(res => res.json())
            .then(data => setAlert(data));
        }
      });
  };

  const statusColors = {
    pending: 'orange',
    handled: 'green',
  };

  const statusText = {
    pending: '待处理',
    handled: '已处理',
  };

  const caseColumns = [
    { title: '患者姓名', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '病历号', dataIndex: 'mrn', key: 'mrn' },
    { title: '科室', dataIndex: 'department_name', key: 'department_name' },
    { title: '感染部位', dataIndex: 'infection_site', key: 'infection_site' },
    { title: '病原体', dataIndex: 'pathogen', key: 'pathogen' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => statusText[s] },
  ];

  if (!alert) return <div>加载中...</div>;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alerts')}>
          返回列表
        </Button>
        <Tag color={statusColors[alert.status]}>{statusText[alert.status]}</Tag>
      </Space>

      <Card title="预警详情" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="预警编号">{alert.alert_code}</Descriptions.Item>
          <Descriptions.Item label="科室">{alert.department_name}</Descriptions.Item>
          <Descriptions.Item label="病原体">{alert.pathogen || '多病原体聚类'}</Descriptions.Item>
          <Descriptions.Item label="关联病例数">{alert.case_count} 例</Descriptions.Item>
          <Descriptions.Item label="时间窗口">{alert.time_window_start} ~ {alert.time_window_end}</Descriptions.Item>
          <Descriptions.Item label="处理人">{alert.handled_by_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="处理时间">{alert.handled_at || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{alert.created_at}</Descriptions.Item>
        </Descriptions>

        {alert.investigation_notes && (
          <Descriptions column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="调查记录">{alert.investigation_notes}</Descriptions.Item>
            <Descriptions.Item label="控制措施">{alert.control_measures}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      {alert.status === 'pending' && (
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => setHandleModal(true)}>
            处理预警
          </Button>
        </Space>
      )}

      <Card title="关联病例">
        <Table
          columns={caseColumns}
          dataSource={alert.cases}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/cases/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        title="处理暴发预警"
        open={handleModal}
        onCancel={() => setHandleModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="investigation_notes" label="调查记录" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请记录流行病学调查情况" />
          </Form.Item>
          <Form.Item name="control_measures" label="控制措施" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请记录采取的感染控制措施" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交处理</Button>
              <Button onClick={() => setHandleModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
