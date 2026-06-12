import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  ChevronRight, ChevronLeft, Upload, CheckCircle2, Plus, Trash2,
  Info, Sparkles, ShieldCheck, FileText, Eye, Send, Home, DollarSign,
  Palette, Camera, Tag as TagIcon, X, Image as ImageIcon,
} from 'lucide-react';
import {
  Steps, Input, Select, InputNumber, Slider, Button, Avatar,
  Table, Space, Card, Tag, message, Divider, Switch, Rate,
} from 'antd';

const { TextArea } = Input;
const { Option } = Select;

const steps = [
  { id: 1, title: '基本信息', icon: Home },
  { id: 2, title: '方案设计', icon: Palette },
  { id: 3, title: '报价配置', icon: DollarSign },
  { id: 4, title: '质保条款', icon: ShieldCheck },
  { id: 5, title: '预览提交', icon: Eye },
];

const defaultMaterials = [
  { key: '1', name: '客厅地砖', brand: '马可波罗', spec: '800×800mm 柔光砖', quantity: 68, unit: '㎡', price: 268 },
  { key: '2', name: '墙面乳胶漆', brand: '立邦', spec: '净味竹炭五合一', quantity: 320, unit: '㎡', price: 45 },
  { key: '3', name: '实木复合地板', brand: '圣象', spec: '15mm厚 橡木纹', quantity: 86, unit: '㎡', price: 328 },
  { key: '4', name: '定制衣柜', brand: '索菲亚', spec: '颗粒板+PET门', quantity: 18, unit: '㎡', price: 1280 },
];

const imageTemplates = [
  { emoji: '🛋️', label: '客厅', gradient: 'from-terracotta-200 via-haze-200 to-wood-200' },
  { emoji: '🍽️', label: '餐厅', gradient: 'from-wood-200 via-ivory-300 to-terracotta-200' },
  { emoji: '🛏️', label: '主卧', gradient: 'from-haze-200 via-ivory-200 to-wood-200' },
  { emoji: '🍳', label: '厨房', gradient: 'from-terracotta-300 via-wood-200 to-haze-200' },
  { emoji: '🛁', label: '卫浴', gradient: 'from-haze-300 via-terracotta-200 to-ivory-300' },
];

const featureTags = [
  'LDK客餐厨一体', '步入式衣帽间', '岛台设计', '落地窗改造',
  '亲子互动空间', '智能家居预埋', '老人友好', '宠物友好',
  '开放式书房', '家政间', '中西双厨', '阳光房',
];

const PlanCreator = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    owner: '',
    planName: '',
    style: '',
    houseType: '',
    area: 0,
    designConcept: '',
    uploadedImages: [] as { id: number; emoji: string; label: string }[],
    featureTags: [] as string[],
    materials: defaultMaterials,
    warranties: {
      concealed: 5,
      foundation: 2,
      waterproof: 5,
      woodwork: 2,
      paint: 1,
      after: 1,
    },
    warrantyDesc: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeatureTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      featureTags: prev.featureTags.includes(tag)
        ? prev.featureTags.filter((t) => t !== tag)
        : [...prev.featureTags, tag],
    }));
  };

  const addImage = () => {
    const available = imageTemplates.filter(
      (t) => !formData.uploadedImages.find((img) => img.label === t.label)
    );
    if (available.length === 0) {
      message.warning('已添加全部空间');
      return;
    }
    const next = available[0];
    setFormData((prev) => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, { id: Date.now(), emoji: next.emoji, label: next.label }],
    }));
  };

  const removeImage = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((img) => img.id !== id),
    }));
  };

  const addMaterial = () => {
    const newKey = (Date.now()).toString();
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { key: newKey, name: '', brand: '', spec: '', quantity: 0, unit: '项', price: 0 },
      ],
    }));
  };

  const removeMaterial = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.key !== key),
    }));
  };

  const updateMaterial = (key: string, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.key === key ? { ...m, [field]: value } : m
      ),
    }));
  };

  const totalPrice = formData.materials.reduce(
    (sum, m) => sum + (m.quantity || 0) * (m.price || 0),
    0
  );

  const materialColumns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (_: string, record: typeof defaultMaterials[0]) => (
        <Input
          size="small"
          className="!rounded-md"
          placeholder="材料名称"
          value={record.name}
          onChange={(e) => updateMaterial(record.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
      render: (_: string, record: typeof defaultMaterials[0]) => (
        <Input
          size="small"
          className="!rounded-md"
          placeholder="品牌"
          value={record.brand}
          onChange={(e) => updateMaterial(record.key, 'brand', e.target.value)}
        />
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
      width: 180,
      render: (_: string, record: typeof defaultMaterials[0]) => (
        <Input
          size="small"
          className="!rounded-md"
          placeholder="规格"
          value={record.spec}
          onChange={(e) => updateMaterial(record.key, 'spec', e.target.value)}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (_: number, record: typeof defaultMaterials[0]) => (
        <InputNumber
          size="small"
          className="!w-full !rounded-md"
          min={0}
          value={record.quantity}
          onChange={(v) => updateMaterial(record.key, 'quantity', v || 0)}
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (_: string, record: typeof defaultMaterials[0]) => (
        <Select
          size="small"
          className="!w-full"
          value={record.unit}
          onChange={(v) => updateMaterial(record.key, 'unit', v)}
        >
          {['㎡', 'm', '个', '项', '套', '樘'].map((u) => (
            <Option key={u} value={u}>{u}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '单价(元)',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (_: number, record: typeof defaultMaterials[0]) => (
        <InputNumber
          size="small"
          className="!w-full !rounded-md"
          min={0}
          value={record.price}
          onChange={(v) => updateMaterial(record.key, 'price', v || 0)}
        />
      ),
    },
    {
      title: '小计(元)',
      key: 'subtotal',
      width: 120,
      render: (_: unknown, record: typeof defaultMaterials[0]) => (
        <span className="font-mono font-semibold text-carbon-700">
          ¥{((record.quantity || 0) * (record.price || 0)).toLocaleString()}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: unknown, record: typeof defaultMaterials[0]) => (
        <button
          onClick={() => removeMaterial(record.key)}
          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const warrantiesConfig = [
    { key: 'concealed', label: '隐蔽工程', desc: '水电管线、防水层等', icon: '🔧' },
    { key: 'foundation', label: '基础工程', desc: '墙面、地面、吊顶基础', icon: '🧱' },
    { key: 'waterproof', label: '防水工程', desc: '厨房、卫生间、阳台防水', icon: '💧' },
    { key: 'woodwork', label: '木制品工程', desc: '衣柜、橱柜、木门等', icon: '🪵' },
    { key: 'paint', label: '涂饰工程', desc: '乳胶漆、墙纸、艺术漆等', icon: '🎨' },
    { key: 'after', label: '售后响应', desc: '上门维修响应时效', icon: '⏱️' },
  ];

  const StepProgress = () => (
    <div className="mb-8">
      <Steps
        current={currentStep}
        size="small"
        items={steps.map((s, idx) => ({
          title: s.title,
          icon: <s.icon className="w-4 h-4" />,
          status: idx < currentStep ? 'finish' : idx === currentStep ? 'process' : 'wait',
        }))}
        className="[&_.ant-steps-item-process_.ant-steps-item-icon]:!bg-gradient-to-br [&_.ant-steps-item-process_.ant-steps-item-icon]:!from-terracotta-400 [&_.ant-steps-item-process_.ant-steps-item-icon]:!to-terracotta-500 [&_.ant-steps-item-process_.ant-steps-item-icon]:!border-terracotta-400 [&_.ant-steps-item-finish_.ant-steps-item-icon]:!bg-emerald-500 [&_.ant-steps-item-finish_.ant-steps-item-icon]:!border-emerald-500"
      />
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-carbon-700 mb-2">
            所属业主 <span className="text-rose-500">*</span>
          </label>
          <Select
            showSearch
            placeholder="选择业主（可搜索）"
            className="!w-full"
            size="large"
            value={formData.owner || undefined}
            onChange={(v) => updateField('owner', v)}
            optionFilterProp="label"
          >
            {[
              { value: '张女士-阳光花园3栋', label: '张女士 · 阳光花园3栋2301' },
              { value: '王先生-滨江壹号5栋', label: '王先生 · 滨江壹号5栋1202' },
              { value: '李先生-绿城春江月', label: '李先生 · 绿城春江月7栋803' },
              { value: '刘女士-江南府', label: '刘女士 · 江南府10栋1806' },
            ].map((o) => (
              <Option key={o.value} value={o.value} label={o.label}>
                <div className="flex items-center gap-2 py-1">
                  <Avatar size={24} className="!bg-terracotta-400 !text-white !text-[10px]">
                    {o.value[0]}
                  </Avatar>
                  <span>{o.label}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-700 mb-2">
            房屋面积 (㎡) <span className="text-rose-500">*</span>
          </label>
          <InputNumber
            min={0}
            max={1000}
            className="!w-full"
            size="large"
            placeholder="请输入建筑面积"
            value={formData.area || undefined}
            onChange={(v) => updateField('area', v || 0)}
            addonAfter="㎡"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-carbon-700 mb-2">
            方案名称 <span className="text-rose-500">*</span>
          </label>
          <Input
            size="large"
            placeholder="如：现代简约·阳光花园全屋方案"
            value={formData.planName}
            onChange={(e) => updateField('planName', e.target.value)}
            prefix={<FileText className="w-4 h-4 text-ivory-400" />}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-700 mb-2">
            设计风格 <span className="text-rose-500">*</span>
          </label>
          <Select
            placeholder="选择风格"
            className="!w-full"
            size="large"
            value={formData.style || undefined}
            onChange={(v) => updateField('style', v)}
          >
            {[
              { v: '现代简约', e: '🪟' }, { v: '新中式', e: '🏯' },
              { v: '北欧风格', e: '🌲' }, { v: '轻奢风格', e: '✨' },
              { v: '日式侘寂', e: '🎋' }, { v: '美式复古', e: '🏠' },
              { v: '法式奶油', e: '🥐' }, { v: '工业风', e: '🏭' },
            ].map((s) => (
              <Option key={s.v} value={s.v}>
                <span className="mr-2">{s.e}</span>{s.v}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-700 mb-2">
            户型匹配 <span className="text-rose-500">*</span>
          </label>
          <Select
            placeholder="选择户型"
            className="!w-full"
            size="large"
            value={formData.houseType || undefined}
            onChange={(v) => updateField('houseType', v)}
          >
            {['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室两厅', '四室三厅', '复式/别墅'].map((h) => (
              <Option key={h} value={h}>{h}</Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-haze-50/80 to-ivory-50/60 border border-haze-200/50 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-haze-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-haze-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-carbon-800 mb-1">温馨提示</h4>
            <ul className="text-sm text-ivory-600 space-y-1">
              <li>· 准确的面积和户型信息有助于生成更精准的报价</li>
              <li>· 方案名称建议包含「风格 + 小区名」，便于识别和搜索</li>
              <li>· 填写完成后可随时保存为草稿，后续继续编辑</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-carbon-700 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            3D效果图/设计图上传
          </label>
          <button
            onClick={addImage}
            className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            添加空间
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {formData.uploadedImages.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06 }}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${imageTemplates.find((t) => t.label === img.label)?.gradient || 'from-ivory-200 to-haze-200'} border-2 border-white shadow-card overflow-hidden group`}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="text-5xl opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300">
                  {img.emoji}
                </span>
                <span className="text-sm font-semibold text-carbon-700 mt-1">{img.label}</span>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => removeImage(img.id)}
                  className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ delay: idx * 0.06 + 0.2, duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                />
              </div>
            </motion.div>
          ))}

          {Array.from({ length: Math.max(0, 5 - formData.uploadedImages.length) }).map((_, idx) => {
            const { getRootProps, getInputProps, isDragActive } = useDropzone({
              accept: { 'image/*': [] },
              maxFiles: 1,
            });
            return (
              <div
                key={`slot-${idx}`}
                {...getRootProps()}
                onClick={addImage}
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? 'border-terracotta-400 bg-terracotta-50/60 scale-[1.02]'
                    : 'border-ivory-300 bg-ivory-50/40 hover:border-terracotta-300 hover:bg-terracotta-50/30'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-10 h-10 rounded-xl bg-white border border-ivory-200 flex items-center justify-center shadow-sm">
                  <Upload className="w-5 h-5 text-ivory-500" />
                </div>
                <span className="text-xs text-ivory-500">点击上传</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-carbon-700 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terracotta-500" />
          设计理念
        </label>
        <TextArea
          rows={4}
          value={formData.designConcept}
          onChange={(e) => updateField('designConcept', e.target.value)}
          placeholder="描述您的整体设计思路、空间布局理念、色彩搭配策略等，帮助业主理解您的设计方案"
          className="!rounded-xl !resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-carbon-700 mb-3 flex items-center gap-2">
          <TagIcon className="w-4 h-4" />
          特色亮点标签
          <span className="text-xs font-normal text-ivory-500 ml-2">（已选 {formData.featureTags.length} 个）</span>
        </label>
        <div className="flex flex-wrap gap-2.5">
          {featureTags.map((tag) => {
            const selected = formData.featureTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleFeatureTag(tag)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  selected
                    ? 'bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-white border-terracotta-400/50 shadow-md shadow-terracotta-500/25 scale-[1.02]'
                    : 'bg-white text-carbon-700 border-ivory-300 hover:border-terracotta-300 hover:bg-terracotta-50/40 hover:text-terracotta-700'
                }`}
              >
                {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-carbon-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-terracotta-500" />
          材料清单
        </h3>
        <button
          onClick={addMaterial}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4" />
          新增材料
        </button>
      </div>

      <div className="card-base p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table
            columns={materialColumns}
            dataSource={formData.materials}
            pagination={false}
            size="middle"
            className="[&_.ant-table-thead_.ant-table-cell]:!bg-ivory-50/80 [&_.ant-table-thead_.ant-table-cell]:!text-xs [&_.ant-table-thead_.ant-table-cell]:!text-ivory-600 [&_.ant-table-thead_.ant-table-cell]:!font-semibold [&_.ant-table-row]:!border-b [&_.ant-table-row]:!border-ivory-100"
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="!rounded-2xl !border-ivory-200">
          <div className="text-center">
            <p className="text-xs text-ivory-500 mb-1">材料直接费用</p>
            <p className="font-mono text-2xl font-bold text-carbon-800">
              ¥{totalPrice.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card className="!rounded-2xl !border-ivory-200">
          <div className="text-center">
            <p className="text-xs text-ivory-500 mb-1">人工及管理费（30%）</p>
            <p className="font-mono text-2xl font-bold text-haze-700">
              ¥{Math.round(totalPrice * 0.3).toLocaleString()}
            </p>
          </div>
        </Card>
        <Card className="!rounded-2xl !border-terracotta-200 !bg-gradient-to-br !from-terracotta-50/80 !to-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-terracotta-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
          <div className="text-center relative">
            <p className="text-xs text-terracotta-600 mb-1 font-medium">方案报价总计</p>
            <p className="font-mono text-3xl font-bold text-terracotta-600">
              ¥{Math.round(totalPrice * 1.3).toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-haze-50/60 border border-haze-200/50">
        <Switch defaultChecked />
        <span className="text-sm text-carbon-700">报价默认包含 5% 不可预见费（已计入总价）</span>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {warrantiesConfig.map((w, idx) => {
          const value = formData.warranties[w.key as keyof typeof formData.warranties];
          const isHour = w.key === 'after';
          return (
            <motion.div
              key={w.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="card-base p-5 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-haze-100 to-ivory-100 flex items-center justify-center text-2xl shadow-sm border border-haze-200/50">
                  {w.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-carbon-800">{w.label}</h4>
                  <p className="text-xs text-ivory-500 mt-0.5">{w.desc}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-bold text-terracotta-600">
                    {value}
                  </span>
                  <span className="text-xs text-ivory-500 ml-1">
                    {isHour ? '小时' : '年'}
                  </span>
                </div>
              </div>
              <Slider
                min={isHour ? 1 : 1}
                max={isHour ? 48 : 10}
                marks={
                  isHour
                    ? { 1: '1h', 12: '12h', 24: '24h', 48: '48h' }
                    : { 1: '1年', 3: '3年', 5: '5年', 10: '10年' }
                }
                value={value}
                onChange={(v) =>
                  updateField('warranties', {
                    ...formData.warranties,
                    [w.key]: v,
                  })
                }
                tooltip={{ formatter: (v) => `${v}${isHour ? '小时' : '年'}` }}
                styles={{ track: { background: 'linear-gradient(90deg, #C4623A, #D47042)' } }}
              />
            </motion.div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-carbon-700 mb-2">
          补充质保条款说明（选填）
        </label>
        <TextArea
          rows={4}
          value={formData.warrantyDesc}
          onChange={(e) => updateField('warrantyDesc', e.target.value)}
          placeholder="可填写额外的质保承诺、特殊约定、免责条款等内容"
          className="!rounded-xl !resize-none"
        />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-haze-50/60 border border-emerald-200/60 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-medium text-carbon-800 mb-1">平台质保兜底</h4>
            <p className="text-sm text-ivory-600 leading-relaxed">
              平台将为业主提供第三方质保监督服务，若质保期内服务商未履行保修义务，
              平台将启用质保保证金先行赔付，保障业主权益。
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep5 = () => {
    const finalPrice = Math.round(totalPrice * 1.3);
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="space-y-5">
          <Card
            className="!rounded-2xl !overflow-hidden !border-ivory-200"
            cover={
              <div className={`h-52 bg-gradient-to-br ${formData.style.includes('新中式') ? 'from-wood-300 via-wood-400 to-terracotta-400' : formData.style.includes('北欧') ? 'from-ivory-200 via-wood-200 to-haze-200' : 'from-haze-300 via-terracotta-200 to-wood-300'} relative flex items-center justify-center`}>
                <span className="text-8xl opacity-40">
                  {formData.style.includes('新中式') ? '🏯' : formData.style.includes('北欧') ? '🌲' : formData.style.includes('轻奢') ? '✨' : '🪟'}
                </span>
                {formData.featureTags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={tag}
                    className="absolute text-[10px] px-2 py-1 rounded-full bg-white/85 backdrop-blur-sm text-carbon-700 border border-white/80 shadow-sm"
                    style={{
                      top: `${15 + idx * 12}%`,
                      left: `${10 + idx * 8}%`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            }
          >
            <div className="space-y-3">
              <h3 className="font-serif text-xl text-carbon-800 font-semibold line-clamp-1">
                {formData.planName || '未命名方案'}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-lg bg-haze-50 text-haze-700 border border-haze-200 font-medium">
                  {formData.style || '未选择风格'}
                </span>
                <span className="text-ivory-600">{formData.houseType || '未选择户型'}</span>
                <span className="font-mono text-ivory-600">{formData.area || 0}㎡</span>
              </div>
              <Divider className="!my-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-ivory-500 mb-0.5">所属业主</p>
                  <p className="text-carbon-700 font-medium">{formData.owner || '未选择'}</p>
                </div>
                <div>
                  <p className="text-xs text-ivory-500 mb-0.5">上传效果图</p>
                  <p className="text-carbon-700 font-medium font-mono">{formData.uploadedImages.length} 张</p>
                </div>
                <div>
                  <p className="text-xs text-ivory-500 mb-0.5">材料项数</p>
                  <p className="text-carbon-700 font-medium font-mono">{formData.materials.length} 项</p>
                </div>
                <div>
                  <p className="text-xs text-ivory-500 mb-0.5">亮点标签</p>
                  <p className="text-carbon-700 font-medium font-mono">{formData.featureTags.length} 个</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="!rounded-2xl !border-ivory-200">
            <h4 className="font-medium text-carbon-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              设计理念
            </h4>
            <p className="text-sm text-carbon-600 leading-relaxed whitespace-pre-line min-h-[80px]">
              {formData.designConcept || '暂未填写设计理念'}
            </p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="!rounded-2xl !border-terracotta-200 !bg-gradient-to-br !from-terracotta-50/80 !via-white !to-ivory-50/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-terracotta-400/10 to-transparent rounded-full -translate-y-20 translate-x-20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-carbon-800">方案报价</h4>
                <Tag color="orange" className="!m-0 !rounded-full !px-3 !py-1">平台认证报价</Tag>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  { label: '材料直接费用', value: totalPrice },
                  { label: '人工及管理费', value: Math.round(totalPrice * 0.3) },
                  { label: '不可预见费 (5%)', value: Math.round(totalPrice * 0.05) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-ivory-600">{item.label}</span>
                    <span className="font-mono text-carbon-700">¥{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Divider className="!my-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-carbon-800">报价总计</span>
                <div className="text-right">
                  <span className="font-mono text-3xl font-bold text-terracotta-600">
                    ¥{(finalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="!rounded-2xl !border-ivory-200">
            <h4 className="font-medium text-carbon-800 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              质保承诺
            </h4>
            <div className="space-y-2">
              {warrantiesConfig.map((w) => (
                <div key={w.key} className="flex items-center justify-between text-sm py-1.5 border-b border-ivory-100 last:border-b-0">
                  <span className="flex items-center gap-2 text-carbon-700">
                    <span>{w.icon}</span>
                    {w.label}
                  </span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formData.warranties[w.key as keyof typeof formData.warranties]}
                    {w.key === 'after' ? '小时内响应' : '年'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="!rounded-2xl !border-haze-200 !bg-haze-50/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-haze-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-haze-600" />
              </div>
              <div className="text-sm text-ivory-700 leading-relaxed">
                <p className="font-medium text-carbon-800 mb-1">提交前请确认</p>
                <ul className="space-y-0.5">
                  <li>· 方案信息、材料清单和报价已核对无误</li>
                  <li>· 质保条款符合平台最低标准要求</li>
                  <li>· 同意平台《装修方案报价服务协议》</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  };

  const stepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.owner && formData.planName && formData.style && formData.houseType && formData.area > 0;
      case 1:
        return formData.uploadedImages.length >= 1 && formData.designConcept.length >= 20;
      case 2:
        return formData.materials.length >= 1 && totalPrice > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (!stepValid()) {
        message.warning('请完善当前步骤的必填项');
        return;
      }
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      message.success('方案已提交！业主将收到通知');
      navigate('/provider/plans');
    }, 1500);
  };

  const currentIcon = steps[currentStep].icon;

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">创建装修方案</h1>
          <p className="text-ivory-600">
            第 {currentStep + 1} 步 / 共 {steps.length} 步 · {steps[currentStep].title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="large" className="!rounded-btn" onClick={() => navigate('/provider/plans')}>
            保存草稿
          </Button>
        </div>
      </div>

      <StepProgress />

      <div className="card-base p-6 md:p-8 min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderStep4()}
          {currentStep === 4 && renderStep5()}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <Button
          size="large"
          className="!rounded-btn !h-12 !px-6"
          icon={<ChevronLeft className="w-4 h-4" />}
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
        >
          上一步
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            type="primary"
            size="large"
            className="!rounded-btn !h-12 !px-8 !bg-gradient-to-b !from-terracotta-400 !to-terracotta-500 !border-terracotta-500/30 hover:!from-terracotta-500 hover:!to-terracotta-600"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={handleNext}
          >
            下一步
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            loading={submitting}
            className="!rounded-btn !h-12 !px-10 !bg-gradient-to-b !from-terracotta-500 !to-terracotta-600 !border-terracotta-500/30 hover:!from-terracotta-600 hover:!to-terracotta-700 !text-base !font-semibold"
            icon={<Send className="w-4 h-4" />}
            onClick={handleSubmit}
          >
            提交方案
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlanCreator;
