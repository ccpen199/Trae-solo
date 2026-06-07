import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  message,
  Space,
  Tooltip,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Checkbox,
  Table,
  Descriptions,
  Row,
  Col,
  Statistic,
  List,
  Popconfirm,
  Tabs,
  Divider,
  Alert,
  Radio,
} from 'antd';
import {
  ShareAltOutlined,
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
  ExpandOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined,
  GlobalOutlined,
  LinkOutlined,
  CalendarOutlined,
  EyeOutlined,
  HistoryOutlined,
  SendOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getListingAnnotations,
  createListingAnnotation,
  deleteListingAnnotation,
  getListingShares,
  createListingShare,
  trackShareView,
} from '@/api';

interface Annotation {
  id: number;
  name: string;
  position_x: number;
  position_y: number;
  description: string;
  room: string;
  created_by: number;
  creator_name: string;
  created_at: string;
}

interface ShareRecord {
  id: number;
  listing_id: number;
  share_code: string;
  share_type: string;
  agent_id: number;
  agent_name: string;
  client_name: string;
  client_phone: string;
  view_count: number;
  expires_at: string;
  can_annotate: number;
  created_by: number;
  created_at: string;
  last_viewed_at: string;
}

const VRViewer: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const effectiveListingId = Number(listingId) || 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingAnnotation, setAddingAnnotation] = useState(false);
  const [annotationModal, setAnnotationModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [annotationForm] = Form.useForm();
  const [shareForm] = Form.useForm();

  const rooms = [
    { name: '客厅', rotation: 0, bg: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' },
    { name: '主卧', rotation: 90, bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' },
    { name: '次卧', rotation: 180, bg: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)' },
    { name: '厨房', rotation: 270, bg: 'linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)' },
  ];

  const currentRoom = rooms.find((r) => r.rotation === ((rotation % 360) + 360) % 360) || rooms[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [annRes, shareRes]: any[] = await Promise.all([
        getListingAnnotations(effectiveListingId),
        getListingShares(effectiveListingId),
      ]);
      setAnnotations(annRes?.list ?? []);
      setShares(shareRes?.list ?? []);
    } catch {
      message.error('加载VR数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [effectiveListingId]);

  const handleRotate = (dir: 'left' | 'right') => {
    setRotation((prev) => {
      const next = dir === 'left' ? prev - 90 : prev + 90;
      return next;
    });
  };

  const handleViewerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!addingAnnotation) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPendingPos({ x, y });
      annotationForm.setFieldsValue({
        position_x: x.toFixed(1),
        position_y: y.toFixed(1),
        room: currentRoom.name,
      });
      setAnnotationModal(true);
      setAddingAnnotation(false);
    },
    [addingAnnotation, currentRoom.name, annotationForm]
  );

  const handleAddAnnotation = async (values: any) => {
    if (!pendingPos) return;
    try {
      await createListingAnnotation(effectiveListingId, {
        ...values,
        position_x: pendingPos.x,
        position_y: pendingPos.y,
        created_by: 1,
      });
      message.success('标注添加成功');
      setAnnotationModal(false);
      setPendingPos(null);
      annotationForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(e.message || '添加失败');
    }
  };

  const handleDeleteAnnotation = async (id: number) => {
    try {
      await deleteListingAnnotation(id);
      message.success('标注已删除');
      fetchData();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const handleCreateShare = async (values: any) => {
    try {
      const res: any = await createListingShare(effectiveListingId, {
        ...values,
        expires_at: values.expires_at ? values.expires_at.format('YYYY-MM-DD 23:59:59') : undefined,
        created_by: 1,
      });

      const url = `${window.location.origin}/vr/${effectiveListingId}?share=${res.data.share_code}`;
      navigator.clipboard.writeText(url).then(() => {
        message.success(`分享链接已复制: ${res.data.share_code}`);
      }).catch(() => {
        message.info(`分享链接: ${url}`);
      });

      setShareModal(false);
      shareForm.resetFields();
      fetchData();

      setTimeout(async () => {
        await trackShareView(res.data.share_code);
        fetchData();
      }, 500);
    } catch (e: any) {
      message.error(e.message || '创建分享失败');
    }
  };

  const getShareTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; icon: any; text: string }> = {
      agent: { color: 'blue', icon: <TeamOutlined />, text: '经纪人协作' },
      client: { color: 'green', icon: <UserOutlined />, text: '客户访问' },
      public: { color: 'default', icon: <GlobalOutlined />, text: '公开链接' },
    };
    const t = typeMap[type] || typeMap.public;
    return <Tag color={t.color} icon={t.icon}>{t.text}</Tag>;
  };

  const roomAnnotations = annotations.filter(a => a.room === currentRoom.name);

  const annotationColumns: ColumnsType<Annotation> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '标注名称', dataIndex: 'name', key: 'name' },
    { title: '所属房间', dataIndex: 'room', key: 'room', width: 100 },
    { title: '位置', key: 'pos', width: 120, render: (_, r) => `X:${r.position_x.toFixed(1)}%, Y:${r.position_y.toFixed(1)}%` },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name', width: 120 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm title="确定删除该标注?" onConfirm={() => handleDeleteAnnotation(record.id)}>
          <Button size="small" danger type="link" icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  const shareColumns: ColumnsType<ShareRecord> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '分享码', dataIndex: 'share_code', key: 'share_code', width: 180, render: (v) => <Tag color="purple">{v}</Tag> },
    { title: '类型', dataIndex: 'share_type', key: 'share_type', width: 120, render: (v) => getShareTypeTag(v) },
    { title: '经纪人', dataIndex: 'agent_name', key: 'agent_name', width: 100 },
    { title: '客户', dataIndex: 'client_name', key: 'client_name', width: 100 },
    { title: '客户电话', dataIndex: 'client_phone', key: 'client_phone', width: 130 },
    { title: '查看次数', dataIndex: 'view_count', key: 'view_count', width: 100, render: (v) => <Tag color={v > 10 ? 'red' : 'blue'}>{v}次</Tag> },
    { title: '可标注', dataIndex: 'can_annotate', key: 'can_annotate', width: 80, render: (v) => v ? '是' : '否' },
    { title: '到期时间', dataIndex: 'expires_at', key: 'expires_at', width: 160 },
    { title: '最后访问', dataIndex: 'last_viewed_at', key: 'last_viewed_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="复制链接">
            <Button
              size="small"
              type="link"
              icon={<LinkOutlined />}
              onClick={() => {
                const url = `${window.location.origin}/vr/${effectiveListingId}?share=${record.share_code}`;
                navigator.clipboard.writeText(url).then(() => message.success('链接已复制'));
              }}
            >
              复制
            </Button>
          </Tooltip>
          <Tooltip title="发起带看">
            <Button
              size="small"
              type="link"
              icon={<SendOutlined />}
              onClick={() => {
                message.info(`已向 ${record.client_name || '客户'} 发送带看邀请`);
              }}
            >
              带看
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const shareStats = [
    { title: 'VR标注总数', value: annotations.length, icon: <PushpinOutlined />, color: '#1677ff' },
    { title: '分享次数', value: shares.length, icon: <ShareAltOutlined />, color: '#52c41a' },
    { title: '总访问量', value: shares.reduce((sum, s) => sum + s.view_count, 0), icon: <EyeOutlined />, color: '#722ed1' },
  ];

  const tabItems = [
    {
      key: 'annotations',
      label: 'VR标注列表',
      children: (
        <Table
          columns={annotationColumns}
          dataSource={annotations}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
    {
      key: 'shares',
      label: '分享与带看记录',
      children: (
        <Table
          columns={shareColumns}
          dataSource={shares}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>VR看房</h2>
        <p>沉浸式虚拟看房体验 · 房源ID: {effectiveListingId} · 支持VR标注和协作分享</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {shareStats.map((stat, i) => (
          <Col xs={12} sm={8} key={i}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => handleRotate('left')}>向左转</Button>
            <Button icon={<RightOutlined />} onClick={() => handleRotate('right')}>向右转</Button>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>{currentRoom.name}</Tag>
            <Tag color="default">当前视角标注: {roomAnnotations.length} 个</Tag>
          </Space>
          <Space>
            <Button
              type={addingAnnotation ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              onClick={() => {
                setAddingAnnotation(!addingAnnotation);
                setPendingPos(null);
                if (addingAnnotation) {
                  message.info('已退出标注模式');
                } else {
                  message.info('点击全景视图中的位置添加标注');
                }
              }}
            >
              {addingAnnotation ? '取消标注' : '添加标注'}
            </Button>
            <Tooltip title="分享VR看房链接">
              <Button type="primary" icon={<ShareAltOutlined />} onClick={() => setShareModal(true)}>
                分享VR
              </Button>
            </Tooltip>
          </Space>
        </div>

        <div
          className="vr-viewer"
          ref={containerRef}
          onClick={handleViewerClick}
          style={{ cursor: addingAnnotation ? 'crosshair' : 'default' }}
        >
          <div
            className="vr-viewer-inner"
            style={{
              transform: `rotateY(${rotation}deg)`,
              background: currentRoom.bg,
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              transform: `rotateY(${-rotation}deg)`,
            }}>
              <ExpandOutlined style={{ fontSize: 64, color: '#8c8c8c', marginBottom: 16 }} />
              <h2 style={{ color: '#595959', fontSize: 24 }}>{currentRoom.name}</h2>
              <p style={{ color: '#8c8c8c' }}>360°全景视图 · 点击左右按钮切换视角</p>
              {addingAnnotation && (
                <Tag color="red" style={{ marginTop: 16 }}>
                  标注模式: 点击视图中任意位置添加标注
                </Tag>
              )}
            </div>
          </div>

          {roomAnnotations.map((ann) => (
            <Tooltip title={
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{ann.name}</div>
                {ann.description && <div style={{ fontSize: 12 }}>{ann.description}</div>}
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                  创建人: {ann.creator_name || '系统'} · {ann.created_at?.slice(0, 16)}
                </div>
              </div>
            } key={ann.id}>
              <div
                className="vr-annotation"
                style={{ left: `${ann.position_x}%`, top: `${ann.position_y}%` }}
              >
                <PushpinOutlined style={{ marginRight: 4 }} />
                {ann.name}
              </div>
            </Tooltip>
          ))}

          {pendingPos && (
            <div
              style={{
                position: 'absolute',
                left: `${pendingPos.x}%`,
                top: `${pendingPos.y}%`,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#1677ff',
                border: '2px solid #fff',
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
                animation: 'pulse 1.5s infinite',
              }}
            />
          )}
        </div>

        {roomAnnotations.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left" plain>
              <Space>
                <PushpinOutlined />
                当前房间标注 ({roomAnnotations.length})
              </Space>
            </Divider>
            <List
              size="small"
              dataSource={roomAnnotations}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Popconfirm title="删除该标注?" onConfirm={() => handleDeleteAnnotation(item.id)}>
                      <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Tag color="blue">{item.room}</Tag>}
                    title={<span style={{ fontWeight: 500 }}>{item.name}</span>}
                    description={
                      <span style={{ fontSize: 12 }}>
                        位置: X:{item.position_x.toFixed(1)}%, Y:{item.position_y.toFixed(1)}%
                        {item.description && ` · ${item.description}`}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        <Divider />
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="添加VR标注"
        open={annotationModal}
        onCancel={() => {
          setAnnotationModal(false);
          setPendingPos(null);
          annotationForm.resetFields();
        }}
        width={500}
        footer={null}
      >
        <Form
          form={annotationForm}
          layout="vertical"
          onFinish={handleAddAnnotation}
        >
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="房源ID">{effectiveListingId}</Descriptions.Item>
            <Descriptions.Item label="当前房间">{currentRoom.name}</Descriptions.Item>
            <Descriptions.Item label="X坐标" span={1}>
              {pendingPos?.x.toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="Y坐标" span={1}>
              {pendingPos?.y.toFixed(1)}%
            </Descriptions.Item>
          </Descriptions>

          <Form.Item
            label="标注名称"
            name="name"
            rules={[{ required: true, message: '请输入标注名称' }]}
          >
            <Input placeholder="如：江景落地窗、嵌入式衣柜" />
          </Form.Item>

          <Form.Item
            label="所属房间"
            name="room"
            rules={[{ required: true, message: '请选择房间' }]}
          >
            <Select>
              {rooms.map(r => (
                <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="标注描述" name="description">
            <Input.TextArea rows={2} placeholder="详细描述该标注点的特点..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setAnnotationModal(false);
                setPendingPos(null);
              }}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                确认添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分享VR看房"
        open={shareModal}
        onCancel={() => {
          setShareModal(false);
          shareForm.resetFields();
        }}
        width={550}
        footer={null}
      >
        <Form
          form={shareForm}
          layout="vertical"
          onFinish={handleCreateShare}
          initialValues={{
            share_type: 'client',
            can_annotate: false,
          }}
        >
          <Form.Item
            label="分享类型"
            name="share_type"
            rules={[{ required: true, message: '请选择分享类型' }]}
          >
            <Radio.Group>
              <Radio.Button value="agent"><TeamOutlined /> 经纪人协作</Radio.Button>
              <Radio.Button value="client"><UserOutlined /> 客户访问</Radio.Button>
              <Radio.Button value="public"><GlobalOutlined /> 公开链接</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="经纪人"
            name="agent_id"
          >
            <Select placeholder="请选择经纪人（可选）">
              <Select.Option value={1}>张明辉 (链家地产)</Select.Option>
              <Select.Option value={2}>李婉如 (中原地产)</Select.Option>
              <Select.Option value={3}>王建国 (我爱我家)</Select.Option>
              <Select.Option value={4}>陈丽华 (太平洋房屋)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.share_type !== cur.share_type}>
            {({ getFieldValue }) => getFieldValue('share_type') === 'client' && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="客户姓名" name="client_name">
                    <Input placeholder="请输入客户姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="客户电话" name="client_phone">
                    <Input placeholder="请输入客户电话" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form.Item>

          <Form.Item
            label="有效期"
            name="expires_at"
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择到期时间（默认30天）" />
          </Form.Item>

          <Form.Item
            name="can_annotate"
            valuePropName="checked"
          >
            <Checkbox>允许被分享人添加标注</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShareModal(false);
                shareForm.resetFields();
              }}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<ShareAltOutlined />}>
                生成分享链接
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Alert
          message="访问权限说明"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li><b>经纪人协作</b>: 可查看所有标注，可添加新标注，用于经纪人之间的房源协作</li>
              <li><b>客户访问</b>: 仅可查看公共标注，可选是否允许客户添加标注，带看追踪精准</li>
              <li><b>公开链接</b>: 仅可查看，无标注权限，用于朋友圈、公众号等公域推广</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Modal>

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VRViewer;
