import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Input, Select, Checkbox, Upload, message, List, Tag, Modal, Steps, Divider } from 'antd';
import { ScanOutlined, CameraOutlined, EnvironmentOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function PatrolExecute({ user }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [checkpointDetail, setCheckpointDetail] = useState(null);
  const [checkResults, setCheckResults] = useState({});
  const [photos, setPhotos] = useState([]);
  const [abnormalDescription, setAbnormalDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [lastRecordId, setLastRecordId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMyPlans();
  }, []);

  const fetchMyPlans = async () => {
    try {
      const response = await api.get('/plans/my');
      setPlans(response.data);
    } catch (error) {
      message.error('获取巡更计划失败');
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setSelectedCheckpoint(null);
    setCheckResults({});
    setPhotos([]);
  };

  const handleSelectCheckpoint = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    fetchCheckpointDetail(checkpoint.id);
  };

  const fetchCheckpointDetail = async (checkpointId) => {
    try {
      const response = await api.get(`/checkpoints/${checkpointId}`);
      setCheckpointDetail(response.data);
      const results = {};
      (response.data.check_items || []).forEach(item => {
        results[item.id] = { result: 'pass', is_abnormal: 0 };
      });
      setCheckResults(results);
    } catch (error) {
      message.error('获取点位详情失败');
    }
  };

  const handleScanQR = async () => {
    if (!qrCodeInput) {
      message.warning('请输入二维码编号');
      return;
    }
    try {
      const response = await api.get(`/checkpoints/qrcode/${qrCodeInput}`);
      setCheckpointDetail(response.data);
      const results = {};
      (response.data.check_items || []).forEach(item => {
        results[item.id] = { result: 'pass', is_abnormal: 0 };
      });
      setCheckResults(results);
      setSelectedCheckpoint(response.data);
      message.success('扫码成功');
    } catch (error) {
      message.error('点位不存在');
    }
  };

  const handleCheckChange = (itemId, value) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        result: value ? 'pass' : 'fail',
        is_abnormal: value ? 0 : 1
      }
    }));
  };

  const handleSubmit = async () => {
    if (!checkpointDetail) {
      message.warning('请先选择点位');
      return;
    }

    setLoading(true);
    try {
      const hasAbnormal = Object.values(checkResults).some(r => r.is_abnormal);
      
      const checkResultsArray = Object.entries(checkResults).map(([check_item_id, data]) => ({
        check_item_id: parseInt(check_item_id),
        ...data
      }));

      const response = await api.post('/patrol/scan', {
        plan_id: selectedPlan?.id || null,
        checkpoint_id: checkpointDetail.id,
        scan_time: new Date().toISOString(),
        check_results: checkResultsArray,
        is_offline: 0
      });

      const recordId = response.data.id;
      setLastRecordId(recordId);

      if (photos.length > 0) {
        for (const photo of photos) {
          const formData = new FormData();
          formData.append('photo', photo.originFileObj);
          formData.append('patrol_record_id', recordId);
          await api.post('/patrol/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      message.success('巡更提交成功');
      
      if (hasAbnormal) {
        setShowWorkOrderModal(true);
      } else {
        resetForm();
      }
    } catch (error) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkOrder = async (values) => {
    try {
      await api.post('/workorders', {
        patrol_record_id: lastRecordId,
        ...values,
        created_by: user.id
      });
      message.success('工单创建成功');
      setShowWorkOrderModal(false);
      resetForm();
    } catch (error) {
      message.error('工单创建失败');
    }
  };

  const resetForm = () => {
    setCheckpointDetail(null);
    setSelectedCheckpoint(null);
    setQrCodeInput('');
    setCheckResults({});
    setPhotos([]);
    setAbnormalDescription('');
  };

  const uploadProps = {
    listType: 'picture-card',
    fileList: photos,
    onChange: ({ fileList }) => setPhotos(fileList),
    beforeUpload: () => false
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>巡更执行</h2>
      
      <div style={{ display: 'flex', gap: 16 }}>
        <Card 
          title="我的巡更计划" 
          style={{ width: 300, flexShrink: 0 }}
          size="small"
        >
          {plans.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center' }}>暂无分配的计划</p>
          ) : (
            <List
              size="small"
              dataSource={plans}
              renderItem={plan => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    background: selectedPlan?.id === plan.id ? '#e6f7ff' : 'transparent',
                    borderRadius: 4,
                    padding: '8px 12px',
                    marginBottom: 4
                  }}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <List.Item.Meta
                    title={plan.name}
                    description={`${plan.building_name} | ${plan.checkpoint_count}个点位`}
                  />
                  <Tag color={plan.status === 'active' ? 'green' : 'default'}>
                    {plan.status === 'active' ? '进行中' : '已停用'}
                  </Tag>
                </List.Item>
              )}
            />
          )}
        </Card>

        <div style={{ flex: 1 }}>
          <Card title="扫码/选择点位" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input
                placeholder="输入二维码编号，如：CP001"
                value={qrCodeInput}
                onChange={e => setQrCodeInput(e.target.value)}
                onPressEnter={handleScanQR}
                style={{ flex: 1 }}
                prefix={<ScanOutlined />}
              />
              <Button type="primary" icon={<ScanOutlined />} onClick={handleScanQR}>
                扫码
              </Button>
            </div>
            
            {selectedPlan && (
              <>
                <Divider orientation="left">或选择计划中的点位</Divider>
                <Steps
                  direction="vertical"
                  size="small"
                  items={selectedPlan.checkpoints?.map((cp, index) => ({
                    title: cp.name,
                    description: cp.qr_code,
                    status: selectedCheckpoint?.id === cp.id ? 'process' : 'wait',
                    onClick: () => handleSelectCheckpoint(cp)
                  }))}
                />
              </>
            )}
          </Card>

          {checkpointDetail && (
            <Card title="巡检查项" size="small">
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{checkpointDetail.name}</p>
                <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                  <EnvironmentOutlined /> {checkpointDetail.location || '未设置位置'}
                  {checkpointDetail.building_name && ` | ${checkpointDetail.building_name}`}
                </p>
              </div>

              {checkpointDetail.check_items && checkpointDetail.check_items.length > 0 ? (
                <Form layout="vertical">
                  {checkpointDetail.check_items.map(item => (
                    <Form.Item
                      key={item.id}
                      label={
                        <span>
                          {item.name}
                          {item.description && <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>({item.description})</span>}
                        </span>
                      }
                    >
                      <Checkbox
                        checked={checkResults[item.id]?.result === 'pass'}
                        onChange={e => handleCheckChange(item.id, e.target.checked)}
                      >
                        正常
                      </Checkbox>
                      {checkResults[item.id]?.is_abnormal && (
                        <Tag color="red" style={{ marginLeft: 8 }}>异常</Tag>
                      )}
                    </Form.Item>
                  ))}
                </Form>
              ) : (
                <p style={{ color: '#999', textAlign: 'center' }}>该点位暂无检查项</p>
              )}

              <Divider>现场照片</Divider>
              <Upload {...uploadProps}>
                <div>
                  <CameraOutlined />
                  <div style={{ marginTop: 8 }}>上传照片</div>
                </div>
              </Upload>

              <Divider>异常描述</Divider>
              <Input.TextArea
                rows={3}
                placeholder="如有异常，请描述详情..."
                value={abnormalDescription}
                onChange={e => setAbnormalDescription(e.target.value)}
              />

              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button onClick={resetForm} style={{ marginRight: 8 }}>重置</Button>
                <Button type="primary" loading={loading} onClick={handleSubmit}>
                  提交巡更
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        title="发现异常，创建工单"
        open={showWorkOrderModal}
        onCancel={() => {
          setShowWorkOrderModal(false);
          resetForm();
        }}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateWorkOrder}>
          <Form.Item
            name="title"
            label="工单标题"
            rules={[{ required: true, message: '请输入工单标题' }]}
            initialValue={`${checkpointDetail?.name} - 巡更异常`}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="工单类型"
            rules={[{ required: true, message: '请选择工单类型' }]}
            initialValue="repair"
          >
            <Select>
              <Select.Option value="repair">维修</Select.Option>
              <Select.Option value="cleaning">保洁</Select.Option>
              <Select.Option value="security">安保</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            initialValue="normal"
          >
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="问题描述">
            <Input.TextArea rows={4} value={abnormalDescription} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建工单
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PatrolExecute;
