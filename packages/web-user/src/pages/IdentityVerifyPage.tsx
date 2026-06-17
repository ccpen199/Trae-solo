import React, { useState, useRef } from 'react';
import { Card, Form, Input, Button, Steps, message, Upload, Progress, Result } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CameraOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';

const IdentityVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [faceProgress, setFaceProgress] = useState(0);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { verifyIdentity, fetchMe } = useAuthStore();

  const startCamera = () => {
    setStep(1);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setFacePhoto('/mock-face.jpg');
        setStep(2);
      });
  };

  const captureFace = () => {
    setStep(2);
    setFacePhoto('/mock-face.jpg');
  };

  const doVerify = async (values: any) => {
    setVerifying(true);
    setStep(3);
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(progress + Math.random() * 18, 95);
      setFaceProgress(Math.floor(progress));
    }, 200);

    try {
      const ok = await verifyIdentity(values.realName, values.idCard, facePhoto || '/mock-face.jpg');
      clearInterval(timer);
      setFaceProgress(100);
      setVerifyResult(ok);
      setStep(4);
      if (ok) {
        message.success('实名核验通过！');
        await fetchMe();
      }
    } catch (e: any) {
      clearInterval(timer);
      setFaceProgress(100);
      setVerifyResult(false);
      setStep(4);
    } finally {
      setVerifying(false);
    }
  };

  const steps = [
    { title: '填写信息', icon: <UserOutlined /> },
    { title: '人脸采集', icon: <CameraOutlined /> },
    { title: '确认提交', icon: <SafetyOutlined /> },
    { title: '公安核验', icon: <SafetyOutlined /> },
    { title: '核验完成' },
  ];

  return (
    <div>
      <div className="page-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>实名认证 + 人脸核验</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>对接公安库 · 信息加密存储 · 脱敏展示</div>
      </div>

      <Steps current={step} size="small" items={steps} style={{ padding: '12px 8px', background: '#fff' }} />

      <div className="form-section">
        {step === 0 && (
          <Card style={{ borderRadius: 12 }} size="small" title="📝 填写真实信息">
            <Form form={form} layout="vertical" onFinish={(v) => { startCamera(); setStep(1); }} initialValues={{ realName: '张三', idCard: '440101199001011234' }}>
              <Form.Item label="真实姓名" name="realName" rules={[{ required: true, min: 2 }]}>
                <Input size="large" placeholder="请输入身份证上的真实姓名" />
              </Form.Item>
              <Form.Item label="身份证号" name="idCard" rules={[{ required: true, pattern: /^\d{17}[0-9Xx]$/ }]}>
                <Input size="large" placeholder="18位身份证号码" maxLength={18} style={{ letterSpacing: 1 }} />
              </Form.Item>
              <div style={{ padding: 10, background: '#f5f7fa', borderRadius: 8, fontSize: 12, color: '#666', marginBottom: 16 }}>
                🔒 信息使用AES-256加密存储，仅用于与公安库比对核验，系统自动脱敏展示。
              </div>
              <Button type="primary" block size="large" htmlType="submit">下一步：人脸核验</Button>
            </Form>
          </Card>
        )}

        {step === 1 && (
          <Card style={{ borderRadius: 12 }} size="small" title="📸 请正对摄像头，保持光线充足">
            <div style={{ aspectRatio: '4/3', background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
              <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(0,180,42,0.8)', borderRadius: '40%', margin: '15%', pointerEvents: 'none', animation: 'pulse 2s infinite' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: '#fff' }}>
                请将面部对准框内，保持表情自然
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button block onClick={() => setStep(0)}>上一步</Button>
              <Button type="primary" block onClick={captureFace} icon={<CameraOutlined />}>拍摄照片</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card style={{ borderRadius: 12 }} size="small" title="✅ 确认提交核验">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">{form.getFieldValue('realName')?.replace(/^(.).*(.)$/, '$1*$2')}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{form.getFieldValue('idCard')?.replace(/^(\d{4})\d{10}(\d{4})$/, '$1**********$2')}</Descriptions.Item>
              <Descriptions.Item label="核验时间">{dayjs().format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              {facePhoto && <img src={facePhoto} alt="人脸照" style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 16, border: '3px solid #00B42A' }} />}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: '#666', lineHeight: 1.8 }}>
              提交后将：<br/>
              1. 人脸特征与实名信息比对（相似度≥0.90通过）<br/>
              2. 身份信息提交公安人口库核验一致性<br/>
              3. 通过后实名状态即时生效
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button block onClick={() => setStep(1)}>重新拍摄</Button>
              <Button type="primary" block onClick={() => form.validateFields().then(doVerify)} loading={verifying}>
                提交核验
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card style={{ borderRadius: 12, textAlign: 'center', padding: 24 }} size="small" title="🛡️ 公安核验进行中...">
            <div style={{ padding: '20px 0' }}>
              <Progress type="circle" percent={faceProgress} status={faceProgress === 100 ? (verifyResult ? 'success' : 'exception') : 'active'} width={140} />
            </div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 16 }}>
              {faceProgress < 50 && '📊 提取人脸特征点中...'}
              {faceProgress >= 50 && faceProgress < 85 && '🔍 正在比对公安人口库...'}
              {faceProgress >= 85 && faceProgress < 100 && '📝 生成核验报告...'}
              {faceProgress === 100 && '核验完成！'}
            </div>
          </Card>
        )}

        {step === 4 && (
          verifyResult ? (
            <Result
              status="success"
              title="实名核验通过 🎉"
              subTitle="您的身份信息已与公安库比对一致，人脸核验通过。现在可以办理所有政务事项。"
              extra={<Button type="primary" size="large" onClick={() => navigate('/')}>返回首页办理业务</Button>}
            />
          ) : (
            <Result
              status="warning"
              title="核验未通过"
              subTitle="人脸相似度不足或信息不匹配，请检查信息后重试，或前往线下政务大厅办理。"
              extra={[
                <Button key="retry" type="primary" onClick={() => { setStep(0); setVerifyResult(null); }}>重新核验</Button>,
                <Button key="help" onClick={() => navigate('/')}>联系客服</Button>,
              ]}
            />
          )
        )}
      </div>
    </div>
  );
};

import { Descriptions } from 'antd';
export default IdentityVerifyPage;
