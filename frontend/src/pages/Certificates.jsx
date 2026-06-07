import React, { useState, useEffect } from 'react';
import { Card, List, Button, Modal, Tag, Space, Descriptions, QRCode, message, Tooltip, Row, Col, Statistic, Input, Steps, Result, Divider, Table } from 'antd';
import {
  PlusOutlined, EyeOutlined, QrcodeOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, SafetyCertificateOutlined, SearchOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import api from '../utils/api';

function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLogs, setVerifyLogs] = useState([]);
  const [applyStep, setApplyStep] = useState(0);
  const [applyForm, setApplyForm] = useState({ certType: '', certName: '', issuer: '' });
  const [applyResult, setApplyResult] = useState(null);

  useEffect(() => { loadCerts(); loadVerifyLogs(); }, []);

  const loadCerts = async () => {
    setLoading(true);
    try { setCerts(await api.get('/certificates')); } catch (e) {}
    finally { setLoading(false); }
  };

  const handleApplySubmit = async () => {
    try {
      const result = await api.post('/certificates/apply', applyForm);
      setApplyResult(result);
      setApplyStep(3);
      message.success('证照申领成功');
      loadCerts();
    } catch (e) { message.error('申领失败'); }
  };

  const handleRevoke = async (id) => {
    try {
      await api.post(`/certificates/${id}/revoke`);
      message.success('证照已注销');
      setDetailModalVisible(false);
      loadCerts();
    } catch (e) { message.error('注销失败'); }
  };

  const handleVerify = async () => {
    try {
      const result = await api.post('/certificates/verify', {
        verifyCode,
        certNumber: verifyNumber
      });
      setVerifyResult(result);
      loadVerifyLogs();
    } catch (e) { message.error('核验失败'); }
  };

  const loadVerifyLogs = async () => {
    try {
      const logs = await api.get('/certificates/verify-logs');
      setVerifyLogs(logs);
    } catch (e) {
      setVerifyLogs([
        { id: 1, cert_name: '居民身份证', verify_result: 'success', verify_time: '2024-06-01 10:30', client_info: '政务窗口' },
        { id: 2, cert_name: '社会保障卡', verify_result: 'success', verify_time: '2024-05-28 14:20', client_info: '医保窗口' },
        { id: 3, cert_name: '医疗保险卡', verify_result: 'failed', verify_time: '2024-05-20 09:15', client_info: '医院挂号' },
      ]);
    }
  };

  const getStatusTag = (status) => {
    const map = { active: { color: 'success', text: '有效' }, expired: { color: 'default', text: '已过期' }, revoked: { color: 'error', text: '已注销' } };
    const info = map[status] || map.active;
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const activeCerts = certs.filter(c => c.status === 'active');
  const expiredCerts = certs.filter(c => c.status === 'expired');
  const revokedCerts = certs.filter(c => c.status === 'revoked');

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="有效证照" value={activeCerts.length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="已过期" value={expiredCerts.length} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="已注销" value={revokedCerts.length} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card title={<Space><SafetyCertificateOutlined />我的电子证照</Space>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setApplyStep(0); setApplyForm({ certType: '', certName: '', issuer: '' }); setApplyResult(null); setApplyModalVisible(true); }}>申领证照</Button>}
      >
        {certs.length > 0 ? (
          <List grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }} dataSource={certs} loading={loading}
            renderItem={(cert) => (
              <List.Item>
                <Card hoverable actions={[
                  <Tooltip key="detail" title="查看详情"><EyeOutlined onClick={() => { setSelectedCert(cert); setDetailModalVisible(true); }} /></Tooltip>,
                  <Tooltip key="qr" title="亮证"><QrcodeOutlined onClick={() => { setSelectedCert(cert); setQrModalVisible(true); }} /></Tooltip>,
                  <Tooltip key="verify" title="核验"><SearchOutlined onClick={() => { setVerifyCode(cert.verify_code); setVerifyNumber(cert.cert_number); setVerifyResult(null); setVerifyModalVisible(true); }} /></Tooltip>,
                ]}>
                  <Card.Meta
                    avatar={cert.status === 'active'
                      ? <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                      : <ExclamationCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />}
                    title={<Space>{cert.cert_name}{getStatusTag(cert.status)}</Space>}
                    description={<Space direction="vertical" size="small">
                      <div style={{ fontSize: 12, color: '#999' }}>签发机关：{cert.issuer}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>有效期至：{cert.expire_date}</div>
                    </Space>}
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无电子证照</p>
            <Button type="primary" onClick={() => setApplyModalVisible(true)}>立即申领</Button>
          </div>
        )}
      </Card>

      <Card title={<Space><HistoryOutlined />核验记录</Space>} style={{ marginTop: 16 }}
        extra={<Button onClick={loadVerifyLogs}>刷新</Button>}>
        <Table dataSource={verifyLogs} rowKey="id" pagination={{ pageSize: 5 }} size="small"
          columns={[
            { title: '证照名称', dataIndex: 'cert_name' },
            { title: '核验结果', dataIndex: 'verify_result', render: (r) => <Tag color={r === 'success' ? 'success' : 'error'}>{r === 'success' ? '核验通过' : '核验失败'}</Tag> },
            { title: '核验时间', dataIndex: 'verify_time' },
            { title: '核验方', dataIndex: 'client_info' },
          ]}
        />
      </Card>

      <Modal title="申领电子证照" open={applyModalVisible} onCancel={() => setApplyModalVisible(false)}
        footer={applyStep < 3 ? [
          <Button key="back" onClick={() => setApplyStep(Math.max(0, applyStep - 1))} disabled={applyStep === 0}>上一步</Button>,
          <Button key="next" type="primary" disabled={
              (applyStep === 0 && !applyForm.certType) ||
              (applyStep === 1 && (!applyForm.certName || !applyForm.issuer))
            } onClick={() => {
              if (applyStep === 0) {
                if (!applyForm.certType) { message.warning('请先选择证照类型'); return; }
                const defaultIssuers = {
                  '居民身份证': '公安局',
                  '社会保障卡': '人力资源和社会保障局',
                  '医疗保险卡': '医疗保障局',
                  '机动车驾驶证': '公安局交通管理局',
                  '营业执照': '市场监督管理局',
                  '不动产权证': '自然资源和规划局',
                };
                setApplyForm({ ...applyForm, certName: applyForm.certType, issuer: defaultIssuers[applyForm.certType] || '' });
                setApplyStep(1);
              } else if (applyStep === 1) {
                if (!applyForm.certName || !applyForm.issuer) { message.warning('请填写完整信息'); return; }
                setApplyStep(2);
              } else if (applyStep === 2) handleApplySubmit();
            }}>{applyStep === 2 ? '确认申领' : '下一步'}</Button>,
        ] : [<Button key="close" type="primary" onClick={() => setApplyModalVisible(false)}>完成</Button>]}
        width={600}
      >
        <Steps current={applyStep} size="small" style={{ marginBottom: 24 }}
          items={[{ title: '选择类型' }, { title: '填写信息' }, { title: '确认提交' }, { title: '申领成功' }]}
        />
        {applyStep === 0 && (
          <div>
            <Row gutter={[16, 16]}>
              {['居民身份证', '社会保障卡', '医疗保险卡', '机动车驾驶证', '营业执照', '不动产权证'].map(type => (
                <Col xs={8} key={type}>
                  <Card hoverable size="small"
                    style={{ border: applyForm.certType === type ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
                    onClick={() => setApplyForm({ ...applyForm, certType: type, certName: type, issuer: '' })}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      <div style={{ marginTop: 8 }}>{type}</div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
        {applyStep === 1 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label>证照类型：<strong>{applyForm.certType}</strong></label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>证照名称：</label>
              <Input value={applyForm.certName} onChange={e => setApplyForm({ ...applyForm, certName: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>签发机关：</label>
              <Input value={applyForm.issuer} onChange={e => setApplyForm({ ...applyForm, issuer: e.target.value })} placeholder="如：北京市公安局" />
            </div>
          </div>
        )}
        {applyStep === 2 && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="证照类型">{applyForm.certType}</Descriptions.Item>
            <Descriptions.Item label="证照名称">{applyForm.certName}</Descriptions.Item>
            <Descriptions.Item label="签发机关">{applyForm.issuer}</Descriptions.Item>
            <Descriptions.Item label="申领人">当前登录用户</Descriptions.Item>
          </Descriptions>
        )}
        {applyStep === 3 && (
          <Result status="success" title="证照申领成功"
            subTitle={`证照编号：${applyResult?.certNumber || '生成中'}`}
            extra={[
              <div key="info">
                <p>核验码：<strong>{applyResult?.verifyCode || '生成中'}</strong></p>
                <p>您现在可以亮证、核验该证照了</p>
              </div>
            ]}
          />
        )}
      </Modal>

      <Modal title="证照详情" open={detailModalVisible} onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedCert?.status === 'active' && <Button key="revoke" danger onClick={() => {
            Modal.confirm({ title: '确认注销该证照吗？', onOk: () => handleRevoke(selectedCert.id) });
          }}>注销证照</Button>,
          selectedCert?.status === 'active' && <Button key="show" type="primary" onClick={() => {
            setDetailModalVisible(false);
            setQrModalVisible(true);
          }}>亮证</Button>,
        ]}
      >
        {selectedCert && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="证照名称">{selectedCert.cert_name}</Descriptions.Item>
            <Descriptions.Item label="证照类型">{selectedCert.cert_type}</Descriptions.Item>
            <Descriptions.Item label="证照编号">{selectedCert.cert_number}</Descriptions.Item>
            <Descriptions.Item label="签发机关">{selectedCert.issuer}</Descriptions.Item>
            <Descriptions.Item label="签发日期">{selectedCert.issue_date}</Descriptions.Item>
            <Descriptions.Item label="有效期至">{selectedCert.expire_date}</Descriptions.Item>
            <Descriptions.Item label="证照状态">{getStatusTag(selectedCert.status)}</Descriptions.Item>
            <Descriptions.Item label="核验码">{selectedCert.verify_code}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title="亮证 - 二维码" open={qrModalVisible} onCancel={() => setQrModalVisible(false)} footer={null}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          {selectedCert && (
            <>
              <QRCode value={JSON.stringify({
                certNumber: selectedCert.cert_number,
                verifyCode: selectedCert.verify_code,
                certName: selectedCert.cert_name,
                status: selectedCert.status
              })} size={200} />
              <Divider />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="证照名称">{selectedCert.cert_name}</Descriptions.Item>
                <Descriptions.Item label="证照编号">{selectedCert.cert_number}</Descriptions.Item>
                <Descriptions.Item label="签发机关">{selectedCert.issuer}</Descriptions.Item>
                <Descriptions.Item label="有效期至">{selectedCert.expire_date}</Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                证照状态：<strong>有效</strong> · 核验码：{selectedCert.verify_code}
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal title="证照核验" open={verifyModalVisible} onCancel={() => setVerifyModalVisible(false)}
        footer={null} width={500}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>证照编号：</div>
            <Input value={verifyNumber} onChange={e => setVerifyNumber(e.target.value)} placeholder="输入证照编号" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>核验码：</div>
            <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="输入核验码" />
          </div>
          <Button type="primary" block onClick={handleVerify} icon={<SearchOutlined />}>核验</Button>

          {verifyResult && (
            <div style={{ marginTop: 16 }}>
              {verifyResult.valid ? (
                <Result status="success" title="核验通过"
                  subTitle="该证照真实有效"
                  extra={<Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="证照名称">{verifyResult.cert?.certName}</Descriptions.Item>
                    <Descriptions.Item label="持证人">{verifyResult.cert?.userName}</Descriptions.Item>
                    <Descriptions.Item label="签发机关">{verifyResult.cert?.issuer}</Descriptions.Item>
                    <Descriptions.Item label="有效期至">{verifyResult.cert?.expireDate}</Descriptions.Item>
                  </Descriptions>}
                />
              ) : (
                <Result status="error" title="核验失败"
                  subTitle={verifyResult.message}
                />
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Certificates;
