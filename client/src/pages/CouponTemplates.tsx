import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Tag,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  CheckOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { couponApi, financeApi } from '@/services/api';
import { getStatusBadgeProps, getCouponTypeText } from '@/stores/store';
import { CouponStatus, CouponType, DistributionChannel } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const CouponTemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const { data: templates, isLoading } = useQuery(
    ['coupon-templates', pagination.current, pagination.pageSize],
    () => couponApi.listTemplates({
      page: pagination.current,
      limit: pagination.pageSize
    }),
    {
      onSuccess: (data) => {
        setPagination(prev => ({ ...prev, total: data.total }));
      }
    }
  );

  const { data: budgets } = useQuery(
    ['budgets'],
    () => financeApi.listBudgets({ limit: 100 })
  );

  const createMutation = useMutation(
    (data: any) => couponApi.createTemplate(data),
    {
      onSuccess: () => {
        message.success('券模板创建成功');
        setIsModalVisible(false);
        form.resetFields();
        queryClient.invalidateQueries(['coupon-templates']);
      },
      onError: () => {
        message.error('创建失败，请重试');
      }
    }
  );

  const updateMutation = useMutation(
    ({ templateId, data }: { templateId: string; data: any }) =>
      couponApi.updateTemplate(templateId, data),
    {
      onSuccess: () => {
        message.success('更新成功');
        setIsModalVisible(false);
        setEditingTemplate(null);
        form.resetFields();
        queryClient.invalidateQueries(['coupon-templates']);
      },
      onError: () => {
        message.error('更新失败，请重试');
      }
    }
  );

  const approveMutation = useMutation(
    (templateId: string) => couponApi.approveTemplate(templateId),
    {
      onSuccess: () => {
        message.success('审核通过，已进入待发放状态');
        queryClient.invalidateQueries(['coupon-templates']);
      },
      onError: () => {
        message.error('审核失败，请重试');
      }
    }
  );

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{getCouponTypeText(type)}</Tag>
      ),
      filters: [
        { text: '满减券', value: 'fixed_discount' },
        { text: '折扣券', value: 'percentage_discount' },
        { text: '免邮券', value: 'free_shipping' }
      ],
      onFilter: (value: string, record: any) => record.type === value
    },
    {
      title: '面值',
      dataIndex: 'value',
      key: 'value',
      render: (val: number, record: any) => {
        if (record.type === 'percentage_discount') {
          return (
            <span>
              {val}折
              {record.maxDiscountAmount && (
                <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>
                  (最高减¥{record.maxDiscountAmount})
                </span>
              )}
            </span>
          );
        }
        return `¥${val}`;
      }
    },
    {
      title: '使用门槛',
      dataIndex: 'minOrderAmount',
      key: 'minOrderAmount',
      render: (val: number) => (val > 0 ? `满¥${val}` : '无门槛')
    },
    {
      title: '数量',
      key: 'quantity',
      render: (_: any, record: any) => (
        <span>
          {record.usedQuantity} / {record.totalQuantity}
          <div
            style={{
              width: 60,
              height: 4,
              background: '#f0f0f0',
              borderRadius: 2,
              marginTop: 4
            }}
          >
            <div
              style={{
                width: `${Math.min((record.usedQuantity / record.totalQuantity) * 100, 100)}%`,
                height: '100%',
                background:
                  record.usedQuantity / record.totalQuantity > 0.9
                    ? '#ff4d4f'
                    : '#52c41a',
                borderRadius: 2
              }}
            />
          </div>
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const badge = getStatusBadgeProps(status);
        return <Tag color={badge.color}>{badge.text}</Tag>;
      }
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12 }}>
          {record.validityType === 'fixed'
            ? `${dayjs(record.validFrom).format('MM-DD')} ~ ${dayjs(record.validTo).format('MM-DD')}`
            : `领取后${record.validDays}天有效`}
        </span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {record.status === CouponStatus.CREATED && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                审核
              </Button>
            </>
          )}
          {record.status === CouponStatus.PENDING_DISTRIBUTION && (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleDistribute(record)}
            >
              发放
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleView = (record: any) => {
    message.info('查看详情功能开发中');
  };

  const handleEdit = (record: any) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      ...record,
      validityType: record.validityType,
      validDateRange:
        record.validityType === 'fixed' && record.validFrom && record.validTo
          ? [dayjs(record.validFrom), dayjs(record.validTo)]
          : undefined,
      budgetId: record.budgetId,
      applicableStores: record.applicableStores,
      applicableProducts: record.applicableProducts
    });
    setIsModalVisible(true);
  };

  const handleApprove = (templateId: string) => {
    Modal.confirm({
      title: '确认审核通过',
      content: '审核通过后，该券模板将进入待发放状态，是否继续？',
      okText: '确认通过',
      cancelText: '取消',
      onOk: () => approveMutation.mutate(templateId)
    });
  };

  const handleDistribute = (record: any) => {
    message.info(`跳转到发放页面: ${record.id}`);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      type: CouponType.FIXED_DISCOUNT,
      validityType: 'relative',
      minOrderAmount: 0,
      totalQuantity: 100,
      maxPerUser: 1,
      isStackable: false,
      stackPriority: 0,
      distributionChannel: DistributionChannel.DIRECT,
      validDays: 30
    });
    setIsModalVisible(true);
  };

  const onFinish = (values: any) => {
    const data = {
      ...values,
      validFrom: values.validDateRange?.[0]?.toDate(),
      validTo: values.validDateRange?.[1]?.toDate()
    };
    
    if (editingTemplate) {
      updateMutation.mutate({ templateId: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <Card
        title="券模板管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建模板
          </Button>
        }
      >
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginBottom: 16 }}
          onFinish={(values) => console.log('Search:', values)}
        >
          <Form.Item name="keyword">
            <Input
              placeholder="搜索模板名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态筛选" style={{ width: 150 }} allowClear>
              <Select.Option value={CouponStatus.CREATED}>已创建</Select.Option>
              <Select.Option value={CouponStatus.PENDING_DISTRIBUTION}>待发放</Select.Option>
              <Select.Option value={CouponStatus.PENDING_USE}>发放中</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => searchForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={templates?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑券模板' : '新建券模板'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTemplate(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            type: CouponType.FIXED_DISCOUNT,
            validityType: 'relative',
            minOrderAmount: 0,
            totalQuantity: 100,
            maxPerUser: 1,
            isStackable: false,
            stackPriority: 0,
            distributionChannel: DistributionChannel.DIRECT
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="例如：新用户首单立减券" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="budgetId"
                label="关联预算"
                rules={[{ required: true, message: '请选择关联预算' }]}
              >
                <Select placeholder="请选择预算">
                  {budgets?.data?.map((budget: any) => (
                    <Select.Option key={budget.id} value={budget.id}>
                      {budget.name} (剩余: ¥{budget.remainingBudget})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入券模板描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="券类型"
                rules={[{ required: true, message: '请选择券类型' }]}
              >
                <Select>
                  <Select.Option value={CouponType.FIXED_DISCOUNT}>满减券</Select.Option>
                  <Select.Option value={CouponType.PERCENTAGE_DISCOUNT}>折扣券</Select.Option>
                  <Select.Option value={CouponType.FREE_SHIPPING}>免邮券</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="value"
                label="面值"
                rules={[{ required: true, message: '请输入面值' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="金额或折扣"
                  style={{ width: '100%' }}
                  addonAfter={
                    <Form.Item name="type" noStyle>
                      {(value) =>
                        value === CouponType.PERCENTAGE_DISCOUNT ? '折' : '元'
                      }
                    </Form.Item>
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxDiscountAmount" label="最高减免">
                <InputNumber
                  min={0}
                  placeholder="折扣券适用"
                  style={{ width: '100%' }}
                  addonAfter="元"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="minOrderAmount" label="使用门槛">
                <InputNumber
                  min={0}
                  placeholder="0为无门槛"
                  style={{ width: '100%' }}
                  addonBefore="满"
                  addonAfter="元可用"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="totalQuantity" label="总数量">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxPerUser" label="每人限领">
                <InputNumber min={1} style={{ width: '100%' }} addonAfter="张" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="validityType"
                label="有效期类型"
                rules={[{ required: true, message: '请选择有效期类型' }]}
              >
                <Select>
                  <Select.Option value="fixed">固定日期</Select.Option>
                  <Select.Option value="relative">领取后有效</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const validityType = getFieldValue('validityType');
                  if (validityType === 'fixed') {
                    return (
                      <Form.Item
                        name="validDateRange"
                        label="有效期"
                        rules={[{ required: true, message: '请选择有效期' }]}
                      >
                        <RangePicker style={{ width: '100%' }} />
                      </Form.Item>
                    );
                  }
                  return (
                    <Form.Item name="validDays" label="有效天数">
                      <InputNumber min={1} style={{ width: '100%' }} addonAfter="天" />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="distributionChannel"
                label="发放渠道"
                rules={[{ required: true, message: '请选择发放渠道' }]}
              >
                <Select>
                  <Select.Option value={DistributionChannel.DIRECT}>直接发放</Select.Option>
                  <Select.Option value={DistributionChannel.TARGETED}>定向投放</Select.Option>
                  <Select.Option value={DistributionChannel.PROMOTION}>活动推广</Select.Option>
                  <Select.Option value={DistributionChannel.REFERRAL}>邀请奖励</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isStackable" label="可叠加" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stackPriority"
                label="叠加优先级"
                tooltip="数字越小优先级越高"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="applicableStores" label="适用门店">
                <Select mode="tags" placeholder="输入门店ID" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="applicableProducts" label="适用商品">
            <Select mode="tags" placeholder="输入商品ID，留空表示全部适用" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponTemplatesPage;
