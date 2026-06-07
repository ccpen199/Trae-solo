import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Upload, message, Descriptions } from 'antd';
import { CameraOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons';
import { orderAPI } from '../../api';

const { TextArea } = Input;

export default function CheckIn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = { ...values };
      if (values.photos) {
        data.photos = values.photos.fileList?.map((f) => f.thumbUrl || f.url).filter(Boolean) || [];
      }
      await orderAPI.addTracking(id, data);
      message.success('追踪记录已提交');
      navigate('/courier/tasks');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="打卡 / 上传追踪" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 24 }}>
          <Descriptions.Item label="订单编号">{id}</Descriptions.Item>
          <Descriptions.Item label="当前时间">
            {new Date().toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="photos" label="拍照凭证" valuePropName="fileList" getValueFromEvent={(e) => {
            if (Array.isArray(e)) return e;
            return e?.fileList;
          }}>
            <Upload
              listType="picture-card"
              maxCount={5}
              beforeUpload={() => false}
            >
              <div>
                <CameraOutlined style={{ fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>拍照/上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="location" label="当前位置">
            <Input
              prefix={<EnvironmentOutlined />}
              placeholder="点击获取位置"
              defaultValue="自动定位中..."
            />
          </Form.Item>

          <Form.Item name="note" label="备注说明">
            <TextArea rows={3} placeholder="请输入备注说明" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              size="large"
              block
            >
              提交追踪记录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
