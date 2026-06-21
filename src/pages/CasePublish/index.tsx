import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Gavel,
  MapPin,
  Upload as UploadIcon,
  X,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle,
  Tag as TagIcon,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Eye,
  Send,
  Inbox,
} from 'lucide-react';
import {
  Steps,
  Form,
  Input,
  Select,
  Upload,
  DatePicker,
  InputNumber,
  Tag,
  Button,
  Card,
  message,
  Modal,
  Divider,
  Empty,
} from 'antd';
import { RcFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { CASE_CAUSES, PROVINCES } from '@/constants';
import { formatMoney, formatDate, formatFileSize } from '@/utils/format';

const { TextArea } = Input;

interface FormData {
  title: string;
  cause: string;
  province: string;
  city: string;
  description: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  amount: number;
  deadline: dayjs.Dayjs;
  deposit: number;
  tags: string[];
  files: { name: string; size: number; type: string; file?: RcFile }[];
}

const CasePublish: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm<FormData>();
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    cause: '',
    province: '',
    city: '',
    description: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    amount: 0,
    deadline: dayjs().add(7, 'day'),
    deposit: 0,
    tags: [],
    files: [],
  });

  const cities = useMemo(() => {
    const province = PROVINCES.find((p) => p.value === formData.province);
    return province?.cities || [];
  }, [formData.province]);

  const steps = [
    { title: '基本信息', icon: <FileText className="w-4 h-4" /> },
    { title: '案件详情', icon: <Gavel className="w-4 h-4" /> },
    { title: '证据上传', icon: <UploadIcon className="w-4 h-4" /> },
    { title: '费用设置', icon: <DollarSign className="w-4 h-4" /> },
    { title: '预览提交', icon: <Eye className="w-4 h-4" /> },
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-green-600" />;
    if (type.includes('spreadsheet') || type.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-green-700" />;
    return <File className="w-5 h-5 text-primary-500" />;
  };

  const beforeUpload = (file: RcFile) => {
    const newFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    };
    setFormData((prev) => ({ ...prev, files: [...prev.files, newFile] }));
    return false;
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleAmountChange = (value: number | null) => {
    const amount = value || 0;
    setFormData((prev) => ({
      ...prev,
      amount,
      deposit: Math.round(amount * 0.01),
    }));
  };

  const next = async () => {
    try {
      const values = await form.validateFields();
      setFormData((prev) => ({ ...prev, ...values }));
      setCurrent(current + 1);
    } catch {
      message.warning('请完善当前步骤的必填项');
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: '确认发布案件',
      icon: <AlertCircle className="w-5 h-5 text-accent-gold" />,
      content: (
        <div className="space-y-2">
          <p>您即将发布以下案件：</p>
          <div className="p-3 bg-neutral-ink-50 rounded-lg">
            <p className="font-medium text-primary-900">{formData.title}</p>
            <p className="text-sm text-neutral-ink-500 mt-1">
              标的金额：¥{formatMoney(formData.amount, 0)} · 诚意金：¥{formatMoney(formData.deposit, 0)}
            </p>
          </div>
          <p className="text-sm text-neutral-ink-600">
            发布后案件将进入案源市场，律师可以查看并投标。诚意金将在确认中标后划转。
          </p>
        </div>
      ),
      okText: '确认发布',
      cancelText: '取消',
      okButtonProps: {
        className: '!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light',
      },
      onOk: () => {
        message.loading({ content: '正在发布案件...', key: 'publish' });
        setTimeout(() => {
          message.success({ content: '案件发布成功！', key: 'publish' });
          navigate('/cases');
        }, 1500);
      },
    });
  };

  const causeInfo = CASE_CAUSES.find((c) => c.value === formData.cause);
  const provinceInfo = PROVINCES.find((p) => p.value === formData.province);

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary-900">填写基本信息</p>
                  <p className="text-sm text-neutral-ink-600 mt-1">
                    请准确填写案件的基本信息，这些信息将展示在案源市场中
                  </p>
                </div>
              </div>
            </div>

            <Form.Item
              label="案件标题"
              name="title"
              rules={[{ required: true, message: '请输入案件标题' }, { max: 100, message: '标题不超过100字' }]}
              initialValue={formData.title}
            >
              <Input
                size="large"
                placeholder="请简要描述案件，例如：某科技公司580万合同纠纷案件"
                showCount
                maxLength={100}
              />
            </Form.Item>

            <Form.Item
              label="案件案由"
              name="cause"
              rules={[{ required: true, message: '请选择案件案由' }]}
              initialValue={formData.cause}
            >
              <Select
                size="large"
                placeholder="请选择案件所属的案由分类"
                showSearch
                optionFilterProp="label"
                options={CASE_CAUSES.map((c) => ({ value: c.value, label: c.label }))}
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="所在省份"
                name="province"
                rules={[{ required: true, message: '请选择省份' }]}
                initialValue={formData.province}
              >
                <Select
                  size="large"
                  placeholder="请选择省份/直辖市"
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, province: value, city: '' }));
                    form.setFieldValue('city', '');
                  }}
                  options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
                />
              </Form.Item>

              <Form.Item
                label="所在城市"
                name="city"
                rules={[{ required: true, message: '请选择城市' }]}
                initialValue={formData.city}
              >
                <Select
                  size="large"
                  placeholder="请选择城市/区县"
                  disabled={!formData.province}
                  showSearch
                  optionFilterProp="label"
                  options={cities.map((c) => ({ value: c, label: c }))}
                />
              </Form.Item>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary-900">完善案件详情</p>
                  <p className="text-sm text-neutral-ink-600 mt-1">
                    详细的案件描述有助于律师更准确地评估案件并给出报价
                  </p>
                </div>
              </div>
            </div>

            <Form.Item
              label="案件描述"
              name="description"
              rules={[
                { required: true, message: '请填写案件描述' },
                { min: 50, message: '案件描述至少50字' },
                { max: 5000, message: '案件描述不超过5000字' },
              ]}
              initialValue={formData.description}
            >
              <TextArea
                rows={10}
                placeholder="请详细描述案件情况，包括但不限于：&#10;1. 案件背景与起因&#10;2. 争议焦点与核心诉求&#10;3. 已有的证据材料&#10;4. 对律师的特殊要求（如专业领域、地域等）"
                showCount
                maxLength={5000}
                className="resize-none"
              />
            </Form.Item>

            <Divider orientation="left" orientationMargin={0}>
              <span className="text-sm font-medium text-neutral-ink-700">委托人信息</span>
            </Divider>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                label="委托人姓名/名称"
                name="clientName"
                rules={[{ required: true, message: '请输入委托人信息' }]}
                initialValue={formData.clientName}
              >
                <Input size="large" placeholder="姓名或公司名称" prefix={<User className="w-4 h-4 text-neutral-ink-400" />} />
              </Form.Item>

              <Form.Item
                label="联系电话"
                name="clientPhone"
                rules={[{ required: true, message: '请输入联系电话' }]}
                initialValue={formData.clientPhone}
              >
                <Input size="large" placeholder="请输入手机号码" prefix={<Phone className="w-4 h-4 text-neutral-ink-400" />} />
              </Form.Item>

              <Form.Item
                label="电子邮箱"
                name="clientEmail"
                rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
                initialValue={formData.clientEmail}
              >
                <Input size="large" placeholder="选填，用于接收重要通知" prefix={<Mail className="w-4 h-4 text-neutral-ink-400" />} />
              </Form.Item>
            </div>

            <Form.Item
              label="标的金额（元）"
              name="amount"
              rules={[{ required: true, message: '请输入标的金额' }]}
              initialValue={formData.amount}
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="请输入案件标的金额"
                min={0}
                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/[¥\s,]/g, '') as unknown as number}
                onChange={handleAmountChange}
                prefix={<DollarSign className="w-4 h-4" />}
              />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary-900">上传证据材料</p>
                  <p className="text-sm text-neutral-ink-600 mt-1">
                    上传与案件相关的证据材料，有助于律师更全面地了解案情。支持 PDF、Word、图片等格式，单个文件不超过 50MB
                  </p>
                </div>
              </div>
            </div>

            <Upload.Dragger
              multiple
              beforeUpload={beforeUpload}
              showUploadList={false}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
              className="!border-2 !border-dashed !border-neutral-ink-200 hover:!border-accent-gold !bg-neutral-ivory/50"
            >
              <div className="py-8 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gold/10 flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-accent-gold" />
                </div>
                <p className="text-base font-medium text-primary-900 mb-1">点击或拖拽文件到此处上传</p>
                <p className="text-sm text-neutral-ink-500">
                  支持 PDF、Word、Excel、图片、压缩包等格式，单个文件不超过 50MB
                </p>
              </div>
            </Upload.Dragger>

            {formData.files.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-ink-700">
                    已上传 {formData.files.length} 个文件
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={() => setFormData((prev) => ({ ...prev, files: [] }))}
                  >
                    清空全部
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-neutral-ink-100 rounded-lg hover:border-primary-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-neutral-ink-50 flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-ink-900 truncate">{file.name}</p>
                          <p className="text-xs text-neutral-ink-500 mt-0.5">
                            {formatFileSize(file.size)} · {file.type || '未知类型'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<X className="w-4 h-4" />}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFile(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8">
                <Empty description="暂无上传的证据材料" />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary-900">设置费用与标签</p>
                  <p className="text-sm text-neutral-ink-600 mt-1">
                    诚意金将由平台托管，确认中标律师后划转。合理的标签设置有助于精准匹配律师
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="lc-input-label">投标截止日期</label>
                <Form.Item
                  name="deadline"
                  rules={[{ required: true, message: '请选择截止日期' }]}
                  initialValue={formData.deadline}
                  className="!mb-0"
                >
                  <DatePicker
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请选择投标截止日期"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    suffixIcon={<Calendar className="w-4 h-4 text-neutral-ink-400" />}
                  />
                </Form.Item>
                <p className="text-xs text-neutral-ink-500">建议设置 7-30 天，给律师充分时间了解案情</p>
              </div>

              <div className="space-y-2">
                <label className="lc-input-label">诚意金（元）</label>
                <Form.Item
                  name="deposit"
                  rules={[{ required: true, message: '请输入诚意金金额' }]}
                  initialValue={formData.deposit}
                  className="!mb-0"
                >
                  <InputNumber
                    size="large"
                    style={{ width: '100%' }}
                    min={0}
                    formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => (parseFloat(value?.replace(/[¥\s,]/g, '') || '0') || 0) as unknown as 0}
                    prefix={<DollarSign className="w-4 h-4" />}
                  />
                </Form.Item>
                <p className="text-xs text-neutral-ink-500">
                  系统默认按标的金额 1% 计算，当前：
                  <span className="text-accent-gold font-medium">¥{formatMoney(formData.deposit, 0)}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="lc-input-label flex items-center gap-1.5">
                <TagIcon className="w-4 h-4" />
                案件标签
              </label>
              <div className="flex gap-2 flex-wrap items-center">
                {formData.tags.map((tag) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleRemoveTag(tag)}
                    className="!px-3 !py-1 !text-sm !m-0"
                    color="blue"
                  >
                    {tag}
                  </Tag>
                ))}
                {formData.tags.length < 10 && (
                  <Input
                    size="small"
                    placeholder="输入标签后回车"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onPressEnter={handleAddTag}
                    style={{ width: 140 }}
                    suffix={
                      <Button type="text" size="small" onClick={handleAddTag}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                )}
              </div>
              <p className="text-xs text-neutral-ink-500">最多添加 10 个标签，例如：风险代理、紧急、需要出庭等</p>
            </div>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-neutral-ivory border border-neutral-ink-100">
                <div className="text-sm text-neutral-ink-500 mb-1">标的金额</div>
                <div className="text-xl font-serif font-bold text-accent-gold">
                  ¥{formatMoney(formData.amount, 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-neutral-ivory border border-neutral-ink-100">
                <div className="text-sm text-neutral-ink-500 mb-1">诚意金</div>
                <div className="text-xl font-serif font-bold text-primary-900">
                  ¥{formatMoney(formData.deposit, 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-neutral-ivory border border-neutral-ink-100">
                <div className="text-sm text-neutral-ink-500 mb-1">投标截止</div>
                <div className="text-xl font-serif font-bold text-primary-900">
                  {formatDate(formData.deadline?.toDate())}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-accent-gold/10 rounded-lg border border-accent-gold/30">
              <div className="flex items-start gap-2">
                <Eye className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary-900">预览案件信息</p>
                  <p className="text-sm text-neutral-ink-600 mt-1">
                    请仔细核对以下信息，确认无误后提交发布
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="lc-section-title !text-base !mb-3">基本信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1">案件标题</div>
                    <div className="font-medium text-primary-900">{formData.title || '-'}</div>
                  </div>
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1">案件案由</div>
                    <div className="font-medium text-primary-900">{causeInfo?.label || '-'}</div>
                  </div>
                  <div className="lc-card p-4 md:col-span-2">
                    <div className="text-xs text-neutral-ink-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      所在地区
                    </div>
                    <div className="font-medium text-primary-900">
                      {provinceInfo?.label || '-'}{formData.city ? ` · ${formData.city}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="lc-section-title !text-base !mb-3">案件详情</h4>
                <div className="lc-card p-5">
                  <div className="text-xs text-neutral-ink-500 mb-2">案件描述</div>
                  <p className="text-sm text-neutral-ink-700 leading-relaxed whitespace-pre-wrap">
                    {formData.description || '-'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1">委托人</div>
                    <div className="font-medium text-primary-900">{formData.clientName || '-'}</div>
                  </div>
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1">联系电话</div>
                    <div className="font-medium text-primary-900">{formData.clientPhone || '-'}</div>
                  </div>
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1">标的金额</div>
                    <div className="font-serif font-bold text-lg text-accent-gold">
                      ¥{formatMoney(formData.amount, 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="lc-section-title !text-base !mb-3">证据材料</h4>
                {formData.files.length > 0 ? (
                  <div className="lc-card p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.files.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-2">
                          {getFileIcon(file.type)}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-neutral-ink-900 truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-neutral-ink-500">
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="lc-card p-8 text-center text-neutral-ink-500">未上传证据材料</div>
                )}
              </div>

              <div>
                <h4 className="lc-section-title !text-base !mb-3">费用设置</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      投标截止
                    </div>
                    <div className="font-medium text-primary-900">
                      {formatDate(formData.deadline?.toDate())}
                    </div>
                  </div>
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      诚意金
                    </div>
                    <div className="font-serif font-bold text-lg text-accent-gold">
                      ¥{formatMoney(formData.deposit, 0)}
                    </div>
                  </div>
                  <div className="lc-card p-4">
                    <div className="text-xs text-neutral-ink-500 mb-1 flex items-center gap-1">
                      <TagIcon className="w-3 h-3" />
                      案件标签
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {formData.tags.length > 0 ? (
                        formData.tags.map((tag) => (
                          <Tag key={tag} color="blue" className="!m-0">
                            {tag}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-ink-500">无</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1.5 text-sm text-neutral-ink-500 hover:text-primary-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回案源市场
        </button>
      </div>

      <Card className="lc-card border-0">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-primary-900 mb-2">发布案件</h1>
          <p className="text-neutral-ink-500">
            填写案件信息，发布到案源市场，让优秀律师为您提供专业服务
          </p>
        </div>

        <div className="mb-10 px-4 md:px-8">
          <Steps
            current={current}
            items={steps.map((s) => ({
              title: s.title,
              icon: s.icon,
            }))}
            className="lc-steps"
          />
        </div>

        <div className="px-4 md:px-8 pb-8 min-h-[400px]">
          <Form
            form={form}
            layout="vertical"
            className="max-w-4xl mx-auto"
            onValuesChange={(_, allValues) => {
              if (current === 3 && allValues.amount !== undefined) {
                handleAmountChange(allValues.amount);
              }
            }}
          >
            {renderStepContent()}
          </Form>
        </div>

        <Divider className="!my-0" />

        <div className="px-4 md:px-8 py-5 flex items-center justify-between">
          <div>
            {current > 0 && (
              <span className="text-sm text-neutral-ink-500">
                第 {current + 1} / {steps.length} 步
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {current > 0 && (
              <Button size="large" icon={<ArrowLeft className="w-4 h-4" />} onClick={prev}>
                上一步
              </Button>
            )}
            {current < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={next}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="end"
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light !font-semibold"
                onClick={handleSubmit}
                icon={<Send className="w-4 h-4" />}
              >
                确认发布
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default CasePublish;
