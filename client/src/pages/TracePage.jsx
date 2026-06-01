import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Form, Input, Space, Table, Tag, Timeline, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCertificates, traceCertificate } from '../api';

const resultText = {
  qualified: '合格',
  disqualified: '不合格',
  valid: '有效',
  recalled: '已召回',
};

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
}

export default function TracePage() {
  const { certNo } = useParams();
  const [form] = Form.useForm();
  const [trace, setTrace] = useState(null);
  const [demoCerts, setDemoCerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTrace = useCallback(async (value) => {
    if (!value) return;
    setLoading(true);
    try {
      const data = await traceCertificate(value.trim());
      setTrace(data);
      form.setFieldsValue({ cert_no: value.trim() });
    } catch (err) {
      setTrace(null);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (certNo) {
      loadTrace(certNo);
      return;
    }

    getCertificates()
      .then((rows) => {
        setDemoCerts(rows);
        if (rows[0]?.cert_no) loadTrace(rows[0].cert_no);
      })
      .catch((err) => message.error(err.message));
  }, [certNo, loadTrace]);

  const submit = async () => {
    const values = await form.validateFields();
    loadTrace(values.cert_no);
  };

  const flowColumns = [
    { title: '采购方', dataIndex: 'buyer_name', ellipsis: true },
    { title: '联系方式', dataIndex: 'buyer_contact', width: 130 },
    { title: '目的地', dataIndex: 'destination', ellipsis: true },
    { title: '产品类型', dataIndex: 'product_type', width: 100 },
    { title: '重量(kg)', dataIndex: 'weight', width: 100 },
    { title: '流向时间', dataIndex: 'flow_time', width: 160, render: formatTime },
  ];

  const cert = trace?.certificate;
  const batch = trace?.batch;
  const entry = trace?.entry;
  const inspection = trace?.inspection;

  const timelineItems = [
    entry && { color: 'blue', children: `入场登记：${entry.farm_name}，${entry.animal_type}${entry.quantity || ''}头` },
    inspection && { color: inspection.result === 'qualified' ? 'green' : 'red', children: `宰前检疫：${resultText[inspection.result] || inspection.result}，检疫员 ${inspection.inspector || '-'}` },
    batch && { color: batch.status === 'qualified' ? 'green' : 'red', children: `屠宰批次：${batch.batch_no}，状态 ${resultText[batch.status] || batch.status}` },
    cert && { color: cert.status === 'valid' ? 'green' : 'red', children: `检疫出证：${cert.cert_no}，${resultText[cert.status] || cert.status}` },
  ].filter(Boolean);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Form form={form} layout="inline" onFinish={submit}>
        <Form.Item name="cert_no" rules={[{ required: true, message: '请输入证书编号' }]}>
          <Input.Search
            placeholder="输入检疫证书编号"
            enterButton={<Button type="primary" icon={<SearchOutlined />}>查询</Button>}
            onSearch={submit}
            loading={loading}
            style={{ width: 360 }}
          />
        </Form.Item>
        {!certNo && demoCerts.length > 0 && (
          <Form.Item>
            <Space wrap>
              {demoCerts.slice(0, 3).map((item) => (
                <Button key={item.cert_no} size="small" onClick={() => loadTrace(item.cert_no)}>
                  {item.cert_no}
                </Button>
              ))}
            </Space>
          </Form.Item>
        )}
      </Form>

      {!trace && !loading && <Empty description="暂无溯源信息" />}

      {trace && (
        <>
          {cert?.status === 'recalled' && (
            <Alert type="error" showIcon message="该证书已召回" />
          )}

          <Card title="证书信息">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="证书编号">{cert.cert_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={cert.status === 'valid' ? 'green' : 'red'}>{resultText[cert.status] || cert.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="动物种类">{cert.animal_type}</Descriptions.Item>
              <Descriptions.Item label="数量">{cert.quantity}</Descriptions.Item>
              <Descriptions.Item label="来源养殖场">{cert.origin_farm}</Descriptions.Item>
              <Descriptions.Item label="签发人">{cert.issuer}</Descriptions.Item>
              <Descriptions.Item label="屠宰日期">{formatTime(cert.slaughter_date)}</Descriptions.Item>
              <Descriptions.Item label="签发日期">{formatTime(cert.issue_date)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="全链路节点">
            <Timeline items={timelineItems} />
          </Card>

          <Card title="入场与检疫">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="养殖场">{entry?.farm_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="养殖场地址">{entry?.farm_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{entry?.vehicle_plate || '-'}</Descriptions.Item>
              <Descriptions.Item label="检疫证号">{entry?.quarantine_cert_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="到场时间">{formatTime(entry?.arrival_time)}</Descriptions.Item>
              <Descriptions.Item label="宰前检疫结果">{resultText[inspection?.result] || inspection?.result || '-'}</Descriptions.Item>
              <Descriptions.Item label="体温">{inspection?.body_temp || '-'}</Descriptions.Item>
              <Descriptions.Item label="检疫员">{inspection?.inspector || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="产品流向">
            <Table
              rowKey="id"
              columns={flowColumns}
              dataSource={trace.flows || []}
              scroll={{ x: 900 }}
              pagination={false}
            />
          </Card>
        </>
      )}
    </Space>
  );
}
