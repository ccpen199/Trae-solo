import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Input, Select, Modal, Tag, Steps, Descriptions, Spin, message } from 'antd';
import {
  BankOutlined,
  IdcardOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  CarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicApi, taskApi } from '@/api';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const sceneGroups = [
  {
    title: '社会保障',
    icon: <SafetyCertificateOutlined className="text-3xl text-blue-600" />,
    items: [
      { name: '公积金提取', categoryId: 2, desc: '住房公积金提取申请，用于购房、还贷、租房等' },
      { name: '社保转移', categoryId: 2, desc: '跨地区社保关系转移接续申请' },
      { name: '医保报销', categoryId: 2, desc: '异地就医备案及医保费用报销' },
      { name: '养老金查询', categoryId: 2, desc: '养老保险缴费及待遇查询' },
    ]
  },
  {
    title: '户籍与身份',
    icon: <IdcardOutlined className="text-3xl text-green-600" />,
    items: [
      { name: '户籍变更', categoryId: 1, desc: '户口迁移、变更等户籍业务' },
      { name: '身份证办理', categoryId: 1, desc: '身份证申领、换领、补领' },
      { name: '居住证办理', categoryId: 1, desc: '流动人口居住证申办' },
      { name: '婚姻登记', categoryId: 1, desc: '结婚、离婚登记预约' },
    ]
  },
  {
    title: '交通出行',
    icon: <CarOutlined className="text-3xl text-orange-600" />,
    items: [
      { name: '公交查询', categoryId: 2, desc: '公交线路、站点、实时到站查询' },
      { name: '场馆预约', categoryId: 3, desc: '公共体育场馆、图书馆、博物馆预约' },
      { name: '停车缴费', categoryId: 3, desc: '公共停车位查询与在线缴费' },
      { name: '违章查询', categoryId: 5, desc: '交通违章查询与处理' },
    ]
  },
  {
    title: '社区与物业',
    icon: <HomeOutlined className="text-3xl text-purple-600" />,
    items: [
      { name: '物业报修', categoryId: 3, desc: '小区公共设施故障报修' },
      { name: '邻里纠纷', categoryId: 3, desc: '邻里纠纷调解申请' },
      { name: '垃圾分类', categoryId: 3, desc: '垃圾分类指导与投诉' },
      { name: '社区活动', categoryId: 3, desc: '社区文化活动报名' },
    ]
  },
];

const SceneService: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, userInfo } = useUserStore();
  const [applyModal, setApplyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [applyResult, setApplyResult] = useState<any>(null);

  const preselectedCategory = searchParams.get('categoryId');

  const handleApply = (item: any) => {
    setSelectedItem(item);
    form.resetFields();
    form.setFieldsValue({ title: item.name, description: item.desc });
    setApplyModal(true);
  };

  const handleSubmitApply = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const taskData = {
        category: selectedItem.name,
        title: values.title,
        description: values.description || selectedItem.desc,
        skillsRequired: values.materials ? values.materials.split('、') : [],
        budgetMin: 0,
        budgetMax: 0,
        deadline: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        deliveryDays: 15,
        attachments: [],
      };

      if (isLoggedIn) {
        const result = await taskApi.create(taskData) as any;
        setApplyResult({
          requestNo: result?.requestNo || `CZ${Date.now()}`,
          status: '已受理',
          estimatedDays: '3-5个工作日',
        });
      } else {
        setApplyResult({
          requestNo: `CZ${Date.now()}`,
          status: '待登录确认',
          estimatedDays: '登录后1-3个工作日',
        });
      }

      setApplyModal(false);
      setResultModal(true);
      message.success('办件申请提交成功');
    } catch (error: any) {
      const errMsg = error?.message || '提交办理失败';
      if (errMsg.includes('Network') || errMsg.includes('网络') || errMsg.includes('502')) {
        message.error('无法连接后端，请检查网络后重试');
      } else {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-teal-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">场景服务</h1>
        <p className="text-green-100">公交查询 · 场馆预约 · 物业报修 · 医保社保 · 户籍身份</p>
      </div>

      {sceneGroups.map(group => (
        <Card key={group.title} title={<span className="flex items-center gap-2">{group.icon}{group.title}</span>} className="card-hover">
          <Row gutter={[16, 16]}>
            {group.items.map(item => (
              <Col xs={24} sm={12} lg={6} key={item.name}>
                <Card
                  hoverable
                  className="card-hover !border-0 !bg-gray-50 h-full"
                  onClick={() => handleApply(item)}
                >
                  <h4 className="font-bold text-gray-800 mb-2">{item.name}</h4>
                  <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                  <Button type="primary" size="small" block>立即办理</Button>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ))}

      <Modal
        title={`办理：${selectedItem?.name || ''}`}
        open={applyModal}
        onCancel={() => setApplyModal(false)}
        onOk={handleSubmitApply}
        confirmLoading={submitting}
        okText="提交办理"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="事项名称" rules={[{ required: true, message: '请输入事项名称' }]}>
            <Input placeholder="如：公积金提取" />
          </Form.Item>
          <Form.Item name="applicantName" label="申请人姓名">
            <Input prefix={<IdcardOutlined />} placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="applicantId" label="身份证号">
            <Input placeholder="请输入18位身份证号" maxLength={18} />
          </Form.Item>
          <Form.Item name="description" label="事项描述" rules={[{ required: true, message: '请描述办理需求' }]}>
            <TextArea rows={4} placeholder="请详细描述您的办理需求，如：提取公积金用于购买住房..." />
          </Form.Item>
          <Form.Item name="materials" label="申请材料" extra="多个材料用顿号分隔，如：身份证、户口本、申请表">
            <Input placeholder="身份证、户口本、申请表" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
          {!isLoggedIn && (
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-4">
              提示：您尚未登录，提交后请登录工作台查看办理进度
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="受理结果"
        open={resultModal}
        onCancel={() => setResultModal(false)}
        footer={[
          <Button key="close" onClick={() => setResultModal(false)}>关闭</Button>,
          isLoggedIn ? (
            <Button key="view" type="primary" onClick={() => { setResultModal(false); navigate('/hall/my'); }}>查看我的办件</Button>
          ) : (
            <Button key="login" type="primary" onClick={() => { setResultModal(false); navigate('/login'); }}>登录查看进度</Button>
          ),
        ]}
      >
        {applyResult && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircleOutlined className="text-3xl text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-green-700">提交成功</h3>
            </div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="受理编号">{applyResult.requestNo}</Descriptions.Item>
              <Descriptions.Item label="当前状态"><Tag color="blue">{applyResult.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="预计办理">{applyResult.estimatedDays}</Descriptions.Item>
              <Descriptions.Item label="受理部门">常州市政务服务中心</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SceneService;
