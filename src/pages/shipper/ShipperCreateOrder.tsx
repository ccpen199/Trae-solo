import { useState, useMemo } from "react";
import {
  Card,
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  Cascader,
  Radio,
  Checkbox,
  Slider,
  Button,
  DatePicker,
  TimePicker,
  Switch,
  Tag,
  Alert,
  Divider,
  Row,
  Col,
  Rate,
  Tooltip,
} from "antd";
import {
  MapPin,
  Package,
  Banknote,
  ClipboardCheck,
  Truck,
  Navigation,
  Calendar,
  ShieldAlert,
  Star,
  Info,
  Calculator,
  ChevronRight,
  ChevronLeft,
  Send,
  FileText,
  Layers,
  Weight,
  Box,
  Archive,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { CascaderProps } from "antd";

const { Step } = Steps;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const provinceCityOptions: CascaderProps["options"] = [
  {
    value: "beijing",
    label: "北京市",
    children: [
      { value: "beijing-city", label: "北京市" },
      { value: "tongzhou", label: "通州区" },
      { value: "chaoyang", label: "朝阳区" },
      { value: "haidian", label: "海淀区" },
    ],
  },
  {
    value: "shanghai",
    label: "上海市",
    children: [
      { value: "shanghai-city", label: "上海市" },
      { value: "pudong", label: "浦东新区" },
      { value: "minhang", label: "闵行区" },
      { value: "jiading", label: "嘉定区" },
    ],
  },
  {
    value: "guangdong",
    label: "广东省",
    children: [
      { value: "guangzhou", label: "广州市" },
      { value: "shenzhen", label: "深圳市" },
      { value: "dongguan", label: "东莞市" },
      { value: "foshan", label: "佛山市" },
    ],
  },
  {
    value: "sichuan",
    label: "四川省",
    children: [
      { value: "chengdu", label: "成都市" },
      { value: "mianyang", label: "绵阳市" },
      { value: "deyang", label: "德阳市" },
    ],
  },
  {
    value: "chongqing",
    label: "重庆市",
    children: [
      { value: "chongqing-city", label: "重庆市" },
      { value: "yubei", label: "渝北区" },
      { value: "jiangbei", label: "江北区" },
    ],
  },
  {
    value: "tianjin",
    label: "天津市",
    children: [
      { value: "tianjin-city", label: "天津市" },
      { value: "binhai", label: "滨海新区" },
    ],
  },
  {
    value: "jiangsu",
    label: "江苏省",
    children: [
      { value: "nanjing", label: "南京市" },
      { value: "suzhou", label: "苏州市" },
      { value: "wuxi", label: "无锡市" },
    ],
  },
  {
    value: "zhejiang",
    label: "浙江省",
    children: [
      { value: "hangzhou", label: "杭州市" },
      { value: "ningbo", label: "宁波市" },
      { value: "wenzhou", label: "温州市" },
    ],
  },
];

const cargoCategoryOptions = [
  { value: "electronics", label: "电子产品" },
  { value: "clothing", label: "服装鞋帽" },
  { value: "food", label: "食品饮料" },
  { value: "fresh", label: "生鲜冷链" },
  { value: "machinery", label: "机械设备" },
  { value: "building", label: "建材五金" },
  { value: "chemical", label: "化工原料" },
  { value: "daily", label: "日用百货" },
  { value: "furniture", label: "家具家电" },
  { value: "medicine", label: "医药器械" },
  { value: "automotive", label: "汽车配件" },
  { value: "other", label: "其他" },
];

const vehicleTypeOptions = [
  { label: "4.2米厢式货车", value: "truck_4_2_box", load: "1-3吨", volume: "10-15m³" },
  { label: "4.2米高栏货车", value: "truck_4_2_fence", load: "1-3吨", volume: "12-18m³" },
  { label: "6.8米厢式货车", value: "truck_6_8_box", load: "5-8吨", volume: "30-40m³" },
  { label: "6.8米高栏货车", value: "truck_6_8_fence", load: "5-10吨", volume: "35-45m³" },
  { label: "9.6米厢式货车", value: "truck_9_6_box", load: "10-18吨", volume: "55-65m³" },
  { label: "9.6米高栏货车", value: "truck_9_6_fence", load: "10-20吨", volume: "60-70m³" },
  { label: "9.6米冷藏车", value: "truck_9_6_cold", load: "10-15吨", volume: "50-60m³" },
  { label: "13米高栏货车", value: "truck_13_fence", load: "25-32吨", volume: "85-100m³" },
  { label: "13米平板货车", value: "truck_13_flat", load: "25-35吨", volume: "90-110m³" },
  { label: "17.5米平板货车", value: "truck_17_5_flat", load: "30-40吨", volume: "120-140m³" },
];

const priceTrendOption = {
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(10,35,66,0.95)",
    borderColor: "transparent",
    textStyle: { color: "#fff", fontSize: 11 },
    formatter: (params: any) => {
      const p = params[0];
      return `<div>${p.axisValue}<br/><span style="color:#FF6B1A">市场价：¥${p.value.toLocaleString()}</span></div>`;
    },
  },
  grid: { left: 0, right: 0, top: 5, bottom: 0, containLabel: false },
  xAxis: {
    type: "category",
    show: false,
    boundaryGap: false,
    data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  },
  yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
  series: [
    {
      type: "line",
      smooth: true,
      symbol: "none",
      data: [11800, 12200, 11500, 12800, 13200, 12500, 13500, 13800, 13200, 14000, 13600, 12800],
      lineStyle: { color: "#FF6B1A", width: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(255,107,26,0.3)" },
            { offset: 1, color: "rgba(255,107,26,0.02)" },
          ],
        },
      },
    },
  ],
};

interface FormValues {
  startProvince?: string[];
  startAddress?: string;
  startContact?: string;
  startPhone?: string;
  endProvince?: string[];
  endAddress?: string;
  endContact?: string;
  endPhone?: string;
  pickupTime?: any;
  deliveryTime?: any;
  cargoName?: string;
  cargoCategory?: string;
  cargoWeight?: number;
  cargoVolume?: number;
  cargoQuantity?: number;
  isHazardous?: boolean;
  hazardousType?: string;
  freightAmount?: number;
  prepayRatio?: number;
  vehicleTypes?: string[];
  minCreditScore?: number;
  insuranceRequired?: boolean;
  remark?: string;
}

export default function ShipperCreateOrder() {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm<FormValues>();
  const [formValues, setFormValues] = useState<FormValues>({});

  const distance = 1215;
  const marketPrice = 12800;

  const priceCompetitiveness = useMemo(() => {
    const price = formValues.freightAmount || 0;
    if (!price) return { level: 0, text: "未报价", desc: "请输入运费报价" };
    const diff = (marketPrice - price) / marketPrice;
    if (diff > 0.1) return { level: 5, text: "极具竞争力", desc: "低于市场价10%以上，司机抢单意愿极强" };
    if (diff > 0.05) return { level: 4, text: "很有竞争力", desc: "低于市场价5%-10%，预计30分钟内匹配" };
    if (diff > -0.02) return { level: 3, text: "合理区间", desc: "接近市场价，预计2小时内匹配" };
    if (diff > -0.08) return { level: 2, text: "竞争力一般", desc: "略高于市场价，建议适当调整" };
    return { level: 1, text: "竞争力较弱", desc: "高于市场价较多，建议优化报价" };
  }, [formValues.freightAmount]);

  const estimatedCost = useMemo(() => {
    const freight = formValues.freightAmount || 0;
    const insurance = formValues.insuranceRequired ? Math.round(freight * 0.005) : 0;
    const platformFee = Math.round(freight * 0.015);
    return {
      freight,
      insurance,
      platformFee,
      total: freight + insurance + platformFee,
    };
  }, [formValues.freightAmount, formValues.insuranceRequired]);

  const steps = [
    {
      title: "线路信息",
      icon: <Navigation size={16} />,
    },
    {
      title: "货物信息",
      icon: <Package size={16} />,
    },
    {
      title: "价格设置",
      icon: <Banknote size={16} />,
    },
    {
      title: "确认发布",
      icon: <ClipboardCheck size={16} />,
    },
  ];

  const next = async () => {
    try {
      const values = await form.validateFields();
      setFormValues({ ...formValues, ...values });
      setCurrent(current + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const renderStep0 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-orange flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
              <span className="font-bold text-deep-blue-900">起点信息 - 装货地址</span>
            </div>
            <div className="space-y-4">
              <Form.Item
                name="startProvince"
                label="起始省市"
                rules={[{ required: true, message: "请选择起始省市" }]}
                className="!mb-3"
              >
                <Cascader
                  size="large"
                  options={provinceCityOptions}
                  placeholder="请选择省/市/区"
                  className="!w-full"
                  showSearch
                />
              </Form.Item>
              <Form.Item
                name="startAddress"
                label="详细地址"
                rules={[{ required: true, message: "请输入详细装货地址" }]}
                className="!mb-3"
              >
                <Input
                  size="large"
                  placeholder="请输入详细地址，如：浦东新区张江高科技园区博云路2号"
                  prefix={<MapPin size={14} className="text-gray-400" />}
                />
              </Form.Item>
              <div className="flex gap-3">
                <Form.Item name="startContact" label="联系人" className="!mb-0 !flex-1">
                  <Input size="large" placeholder="姓名" />
                </Form.Item>
                <Form.Item name="startPhone" label="联系电话" className="!mb-0 !flex-1">
                  <Input size="large" placeholder="手机号" />
                </Form.Item>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-deep-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-deep-blue flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
              <span className="font-bold text-deep-blue-900">终点信息 - 卸货地址</span>
            </div>
            <div className="space-y-4">
              <Form.Item
                name="endProvince"
                label="目的省市"
                rules={[{ required: true, message: "请选择目的省市" }]}
                className="!mb-3"
              >
                <Cascader
                  size="large"
                  options={provinceCityOptions}
                  placeholder="请选择省/市/区"
                  className="!w-full"
                  showSearch
                />
              </Form.Item>
              <Form.Item
                name="endAddress"
                label="详细地址"
                rules={[{ required: true, message: "请输入详细卸货地址" }]}
                className="!mb-3"
              >
                <Input
                  size="large"
                  placeholder="请输入详细地址，如：朝阳区望京SOHO T3"
                  prefix={<MapPin size={14} className="text-gray-400" />}
                />
              </Form.Item>
              <div className="flex gap-3">
                <Form.Item name="endContact" label="联系人" className="!mb-0 !flex-1">
                  <Input size="large" placeholder="姓名" />
                </Form.Item>
                <Form.Item name="endPhone" label="联系电话" className="!mb-0 !flex-1">
                  <Input size="large" placeholder="手机号" />
                </Form.Item>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-deep-blue to-blue-400 flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
              <span className="font-bold text-deep-blue-900">地图选点</span>
              <Tag color="blue" className="!ml-2">占位</Tag>
            </div>
            <div className="h-56 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm mb-3">
                  <MapPin size={22} className="text-primary-orange" />
                </div>
                <div className="text-sm font-medium text-deep-blue-900 mb-1">地图选点组件占位</div>
                <div className="text-xs text-gray-400">点击地图可快速选择装/卸货位置</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-primary-orange" />
                <span className="font-semibold text-sm text-deep-blue-900">装货时间</span>
              </div>
              <Form.Item name="pickupTime" className="!mb-0">
                <DatePicker showTime size="large" className="!w-full" placeholder="选择装货时间" />
              </Form.Item>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-deep-blue" />
                <span className="font-semibold text-sm text-deep-blue-900">要求送达</span>
              </div>
              <Form.Item name="deliveryTime" className="!mb-0">
                <DatePicker showTime size="large" className="!w-full" placeholder="选择送达时间" />
              </Form.Item>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-deep-blue to-blue-600 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} />
              <span className="font-bold">智能里程估算</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-white/60 mb-1">预计里程</div>
                <div className="text-2xl font-bold">{distance.toLocaleString()} <span className="text-sm font-normal">km</span></div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">预计时长</div>
                <div className="text-2xl font-bold">16.5 <span className="text-sm font-normal">小时</span></div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">市场价参考</div>
                <div className="text-2xl font-bold text-orange-300">¥{marketPrice.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                <Package size={16} className="text-primary-orange" />
              </div>
              <span className="font-bold text-deep-blue-900">基础信息</span>
            </div>
            <Row gutter={20}>
              <Col span={12}>
                <Form.Item
                  name="cargoName"
                  label="货物名称"
                  rules={[{ required: true, message: "请输入货物名称" }]}
                  className="!mb-5"
                >
                  <Input size="large" placeholder="如：智能手机、服装、钢材等" prefix={<Layers size={14} className="text-gray-400" />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="cargoCategory"
                  label="货物品类"
                  rules={[{ required: true, message: "请选择货物品类" }]}
                  className="!mb-5"
                >
                  <Select size="large" placeholder="请选择品类" options={cargoCategoryOptions} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="p-6 rounded-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-deep-blue/10 flex items-center justify-center">
                <Weight size={16} className="text-deep-blue" />
              </div>
              <span className="font-bold text-deep-blue-900">规格参数</span>
            </div>
            <Row gutter={20}>
              <Col span={8}>
                <Form.Item
                  name="cargoWeight"
                  label={
                    <span className="flex items-center gap-1">
                      重量 <span className="text-gray-400">(吨)</span>
                    </span>
                  }
                  rules={[{ required: true, message: "请输入货物重量" }]}
                  className="!mb-5"
                >
                  <InputNumber size="large" className="!w-full" min={0} step={0.1} placeholder="0.00" prefix={<Weight size={12} className="text-gray-400" />} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cargoVolume"
                  label={
                    <span className="flex items-center gap-1">
                      体积 <span className="text-gray-400">(m³)</span>
                    </span>
                  }
                  rules={[{ required: true, message: "请输入货物体积" }]}
                  className="!mb-5"
                >
                  <InputNumber size="large" className="!w-full" min={0} step={0.1} placeholder="0.00" prefix={<Box size={12} className="text-gray-400" />} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="cargoQuantity"
                  label={
                    <span className="flex items-center gap-1">
                      件数 <span className="text-gray-400">(件)</span>
                    </span>
                  }
                  className="!mb-5"
                >
                  <InputNumber size="large" className="!w-full" min={0} step={1} placeholder="0" prefix={<Archive size={12} className="text-gray-400" />} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="p-6 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/50 to-orange-50/50 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <ShieldAlert size={16} className="text-red-500" />
                </div>
                <span className="font-bold text-deep-blue-900">危险品运输</span>
              </div>
              <Form.Item name="isHazardous" valuePropName="checked" className="!mb-0">
                <Switch defaultChecked={false} />
              </Form.Item>
            </div>
            {formValues.isHazardous && (
              <div className="animate-fade-in">
                <Alert
                  type="warning"
                  showIcon
                  message="危险品运输须知"
                  description="请确保已正确选择危险品类别，司机需持有相应资质证件，平台将额外进行安全审核。"
                  className="!mb-4"
                />
                <Form.Item name="hazardousType" label="危险品类别" rules={[{ required: formValues.isHazardous, message: "请选择危险品类别" }]} className="!mb-0">
                  <Select size="large" placeholder="请选择危险品类别">
                    <Option value="explosive">爆炸品</Option>
                    <Option value="gas">压缩气体和液化气体</Option>
                    <Option value="flammable">易燃液体</Option>
                    <Option value="flammable_solid">易燃固体</Option>
                    <Option value="oxidizer">氧化剂和有机过氧化物</Option>
                    <Option value="toxic">毒害品和感染性物品</Option>
                    <Option value="corrosive">腐蚀品</Option>
                    <Option value="miscellaneous">其他危险品</Option>
                  </Select>
                </Form.Item>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText size={16} className="text-gray-500" />
              </div>
              <span className="font-bold text-deep-blue-900">备注信息</span>
            </div>
            <Form.Item name="remark" className="!mb-0">
              <TextArea rows={3} placeholder="填写特殊要求、装卸注意事项、包装方式等信息..." maxLength={500} showCount />
            </Form.Item>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-gray-100">
            <div className="text-sm font-bold text-deep-blue-900 mb-4">💡 智能建议</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50">
                <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px]">✓</span>
                </div>
                <div>
                  <div className="font-medium text-deep-blue-800">建议车型：13米高栏</div>
                  <div className="text-xs text-gray-500 mt-0.5">根据12吨/65m³ 匹配最佳车型</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50">
                <div className="w-5 h-5 rounded-full bg-info-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px]">i</span>
                </div>
                <div>
                  <div className="font-medium text-deep-blue-800">预计油耗约 ¥4,200</div>
                  <div className="text-xs text-gray-500 mt-0.5">按当前柴油价 7.2 元/升估算</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50">
                <div className="w-5 h-5 rounded-full bg-primary-orange flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info size={12} className="text-white" />
                </div>
                <div>
                  <div className="font-medium text-deep-blue-800">建议购买运输保险</div>
                  <div className="text-xs text-gray-500 mt-0.5">保费 ¥64，覆盖全程运输风险</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                  <Banknote size={16} className="text-primary-orange" />
                </div>
                <span className="font-bold text-deep-blue-900">运费报价</span>
              </div>
              <Tag color="orange" className="!rounded-full !px-3">
                市场价参考 <span className="font-bold ml-1">¥{marketPrice.toLocaleString()}</span>
              </Tag>
            </div>

            <div className="h-24 -mx-2">
              <ReactECharts option={priceTrendOption} style={{ height: "100%", width: "100%" }} notMerge />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Form.Item
                name="freightAmount"
                label={<span className="font-medium text-deep-blue-900">期望运费（元）</span>}
                rules={[{ required: true, message: "请输入期望运费" }]}
                className="!mb-0"
              >
                <InputNumber
                  size="large"
                  className="!w-full"
                  min={0}
                  step={100}
                  placeholder="请输入运费金额"
                  style={{ fontSize: 24, fontWeight: 700 }}
                  prefix={<span className="text-primary-orange text-xl font-bold">¥</span>}
                />
              </Form.Item>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-deep-blue-900 flex items-center gap-1">
                    价格竞争力评估
                    <Tooltip title="根据当前市场价对比评估">
                      <Info size={12} className="text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Rate
                    allowHalf
                    disabled
                    value={priceCompetitiveness.level}
                    character={({ index }: { index: number }) => (
                      <Star
                        size={20}
                        fill={index! < priceCompetitiveness.level ? "#FF6B1A" : "none"}
                        className={index! < priceCompetitiveness.level ? "text-primary-orange" : "text-gray-200"}
                        strokeWidth={1.5}
                      />
                    )}
                  />
                  <span className="text-sm font-bold text-primary-orange ml-1">{priceCompetitiveness.text}</span>
                </div>
                <div className="text-xs text-gray-500">{priceCompetitiveness.desc}</div>
              </div>
            </div>

            <Divider className="!my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-deep-blue-900">预付款比例</span>
                <span className="text-primary-orange font-bold text-lg">{formValues.prepayRatio || 30}%</span>
              </div>
              <Form.Item name="prepayRatio" initialValue={30} className="!mb-0">
                <Slider min={0} max={100} step={5} marks={{ 0: "0%", 30: "30%", 50: "50%", 70: "70%", 100: "100%" }} />
              </Form.Item>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>💡 预付款比例越高，司机接单意愿越强</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-gray-100 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-deep-blue/10 flex items-center justify-center">
                <ShieldAlert size={16} className="text-deep-blue" />
              </div>
              <span className="font-bold text-deep-blue-900">资质与安全要求</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-deep-blue-900 flex items-center gap-1">
                  <Truck size={14} /> 要求车辆类型
                </span>
                <span className="text-xs text-gray-400">可多选，至少选择一种</span>
              </div>
              <Form.Item
                name="vehicleTypes"
                rules={[{ required: true, message: "请至少选择一种车型" }]}
                className="!mb-0"
              >
                <Checkbox.Group className="w-full">
                  <Row gutter={[12, 12]}>
                    {vehicleTypeOptions.map((v) => (
                      <Col span={8} key={v.value}>
                        <Checkbox value={v.value} className="!w-full">
                          <div className="p-3 rounded-xl border border-gray-200 hover:border-primary-orange hover:bg-orange-50/30 transition-colors -ml-1 !w-[calc(100%+4px)]">
                            <div className="text-sm font-semibold text-deep-blue-900">{v.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{v.load} · {v.volume}</div>
                          </div>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>

            <Divider className="!my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-deep-blue-900 flex items-center gap-1">
                    <Star size={14} /> 司机最低信用分要求
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-orange">{formValues.minCreditScore || 700}</span>
                  <Tag
                    color={(formValues.minCreditScore || 700) >= 850 ? "green" : (formValues.minCreditScore || 700) >= 750 ? "blue" : "orange"}
                    className="!rounded-full !m-0"
                  >
                    {(formValues.minCreditScore || 700) >= 850 ? "AAA" : (formValues.minCreditScore || 700) >= 750 ? "AA" : "A"}
                  </Tag>
                </div>
              </div>
              <Form.Item name="minCreditScore" initialValue={700} className="!mb-0">
                <Slider min={500} max={900} step={10} marks={{ 500: "500", 650: "650", 800: "800", 900: "900" }} />
              </Form.Item>
            </div>

            <Divider className="!my-4" />

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center">
                  <ShieldAlert size={18} className="text-success-500" />
                </div>
                <div>
                  <div className="font-semibold text-deep-blue-900 text-sm">购买运输保险</div>
                  <div className="text-xs text-gray-500 mt-0.5">货损货差、交通事故全程保障，保费 ¥{estimatedCost.insurance.toLocaleString()}</div>
                </div>
              </div>
              <Form.Item name="insuranceRequired" valuePropName="checked" className="!mb-0" initialValue={true}>
                <Switch defaultChecked />
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-6 p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50">
            <div className="text-sm font-bold text-deep-blue-900 mb-4 flex items-center gap-2">
              <Calculator size={16} className="text-primary-orange" />
              费用明细预览
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">基础运费</span>
                <span className="text-sm font-semibold text-deep-blue-900">¥{estimatedCost.freight.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  运输保险
                  {formValues.insuranceRequired ? <Tag color="green" className="!text-[10px] !m-0 !px-1.5 !py-0">已购买</Tag> : <Tag className="!text-[10px] !m-0 !px-1.5 !py-0">未购买</Tag>}
                </span>
                <span className="text-sm font-semibold text-deep-blue-900">¥{estimatedCost.insurance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  平台服务费
                  <Tooltip title="运费的1.5%">
                    <Info size={10} className="text-gray-400 cursor-help" />
                  </Tooltip>
                </span>
                <span className="text-sm font-semibold text-deep-blue-900">¥{estimatedCost.platformFee.toLocaleString()}</span>
              </div>
            </div>
            <Divider className="!my-3" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-deep-blue-900">合计费用</span>
              <span className="text-2xl font-bold text-primary-orange">¥{estimatedCost.total.toLocaleString()}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">预付款（{formValues.prepayRatio || 30}%）</span>
                <span className="font-semibold text-deep-blue-900">¥{Math.round(estimatedCost.total * (formValues.prepayRatio || 30) / 100).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">签收后支付</span>
                <span className="font-semibold text-deep-blue-900">¥{Math.round(estimatedCost.total * (100 - (formValues.prepayRatio || 30)) / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const getCargoCategoryLabel = (val: string) => cargoCategoryOptions.find((c) => c.value === val)?.label || val;
    const getVehicleLabels = (vals: string[] = []) => vals.map((v) => vehicleTypeOptions.find((opt) => opt.value === v)?.label).filter(Boolean).join("、") || "未选择";

    return (
      <div className="space-y-6 animate-fade-in">
        <Alert
          type="info"
          showIcon
          message="请仔细核对以下信息，确认无误后点击发布"
          description="发布后司机将收到匹配通知，您也可以随时在运单列表中查看状态"
          className="!rounded-2xl"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Navigation size={16} className="text-primary-orange" />
                </div>
                <span className="font-bold text-deep-blue-900">线路信息</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                  <div className="w-3 h-3 rounded-full bg-primary-orange mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 mb-1">装货地址</div>
                    <div className="font-semibold text-deep-blue-900">
                      {formValues.startProvince?.join(" / ") || "上海市 / 上海市 / 浦东新区"}
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {formValues.startAddress || "浦东新区张江高科技园区博云路2号 浦软大厦1楼"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formValues.startContact || "王经理"} · {formValues.startPhone || "138****8888"} · 装货时间：{formValues.pickupTime?.format?.("YYYY-MM-DD HH:mm") || "2026-06-21 08:00"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="w-3 h-3 rounded-full bg-deep-blue mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 mb-1">卸货地址</div>
                    <div className="font-semibold text-deep-blue-900">
                      {formValues.endProvince?.join(" / ") || "北京市 / 北京市 / 朝阳区"}
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {formValues.endAddress || "朝阳区望京街道阜通东大街6号 望京SOHO T3"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formValues.endContact || "李主管"} · {formValues.endPhone || "139****6666"} · 要求送达：{formValues.deliveryTime?.format?.("YYYY-MM-DD HH:mm") || "2026-06-22 18:00"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-deep-blue/10 flex items-center justify-center">
                  <Package size={16} className="text-deep-blue" />
                </div>
                <span className="font-bold text-deep-blue-900">货物信息</span>
              </div>
              <Row gutter={20}>
                <Col span={12}>
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">货物名称</div>
                    <div className="font-semibold text-deep-blue-900">{formValues.cargoName || "电子产品（手机/平板）"}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">货物品类</div>
                    <div className="font-semibold text-deep-blue-900">{getCargoCategoryLabel(formValues.cargoCategory || "electronics")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">是否危险品</div>
                    <div>
                      {formValues.isHazardous ? (
                        <Tag color="red" className="!m-0">{formValues.hazardousType || "危险品"}</Tag>
                      ) : (
                        <Tag color="green" className="!m-0">普通货物</Tag>
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">重量</div>
                      <div className="text-lg font-bold text-deep-blue-900">{formValues.cargoWeight || 12}<span className="text-xs font-normal ml-0.5">吨</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">体积</div>
                      <div className="text-lg font-bold text-deep-blue-900">{formValues.cargoVolume || 65}<span className="text-xs font-normal ml-0.5">m³</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">件数</div>
                      <div className="text-lg font-bold text-deep-blue-900">{formValues.cargoQuantity || 800}<span className="text-xs font-normal ml-0.5">件</span></div>
                    </div>
                  </div>
                  {formValues.remark && (
                    <div className="mt-4 p-3 rounded-xl bg-gray-50 text-xs text-gray-600">
                      <div className="text-gray-400 mb-1">备注：</div>
                      {formValues.remark}
                    </div>
                  )}
                </Col>
              </Row>
            </div>

            <div className="p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-deep-blue/10 flex items-center justify-center">
                  <ShieldAlert size={16} className="text-deep-blue" />
                </div>
                <span className="font-bold text-deep-blue-900">车辆与资质要求</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400 mb-2">车辆类型要求</div>
                  <div className="flex flex-wrap gap-2">
                    {getVehicleLabels(formValues.vehicleTypes || ["truck_13_fence"]).split("、").map((label) => (
                      <Tag key={label} color="blue" className="!m-0 !rounded-lg !px-3 !py-1">{label}</Tag>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">司机信用分要求</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary-orange">{formValues.minCreditScore || 700}</div>
                    <div className="text-xs text-gray-500">及以上</div>
                    <Tag color="orange" className="!m-0 !rounded-full">{(formValues.minCreditScore || 700) >= 850 ? "AAA级" : (formValues.minCreditScore || 700) >= 750 ? "AA级" : "A级"}及以上</Tag>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">运输保险</div>
                  <Tag color={formValues.insuranceRequired !== false ? "green" : "default"} className="!m-0">
                    {formValues.insuranceRequired !== false ? "已购买 · 保费 ¥" + estimatedCost.insurance.toLocaleString() : "未购买"}
                  </Tag>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-deep-blue to-blue-700 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-orange/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative">
                <div className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                  <Banknote size={16} />
                  费用结算单
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-sm text-white/70">基础运费</span>
                    <span className="text-sm font-semibold">¥{estimatedCost.freight.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-sm text-white/70">运输保险</span>
                    <span className="text-sm font-semibold">¥{estimatedCost.insurance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-sm text-white/70">平台服务费（1.5%）</span>
                    <span className="text-sm font-semibold">¥{estimatedCost.platformFee.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">总计应付</span>
                    <span className="text-3xl font-bold text-orange-300">¥{estimatedCost.total.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">立即支付预付款</span>
                      <span className="font-bold text-white">¥{Math.round(estimatedCost.total * (formValues.prepayRatio || 30) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">签收后支付尾款</span>
                      <span className="font-bold text-white">¥{Math.round(estimatedCost.total * (100 - (formValues.prepayRatio || 30)) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
              <div className="font-semibold text-deep-blue-900 mb-2">📋 发布须知</div>
              <div className="text-gray-500 leading-relaxed">
                · 发布后预付款将冻结，匹配成功后转入托管账户<br />
                · 2小时内未匹配可取消发布，全额退款<br />
                · 货物签收后48小时内无异议，自动结算尾款<br />
                · 如遇纠纷，可申请平台介入仲裁
              </div>
              <Form.Item name="agreement" valuePropName="checked" className="!mt-4 !mb-0">
                <Checkbox className="!text-xs">
                  我已阅读并同意
                  <span className="text-primary-orange mx-0.5">《运输服务协议》</span>
                  和
                  <span className="text-primary-orange mx-0.5">《平台规则》</span>
                </Checkbox>
              </Form.Item>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue-900">发布货源</h1>
          <p className="text-sm text-gray-500 mt-1">填写详细信息，智能匹配最佳运力</p>
        </div>
      </div>

      <Card className="!rounded-2xl !border border-gray-100">
        <div className="max-w-5xl mx-auto mb-8">
          <Steps
            current={current}
            size="default"
            items={steps.map((s, idx) => ({
              title: s.title,
              icon: (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold transition-all ${
                    idx < current
                      ? "bg-success-500 text-white"
                      : idx === current
                      ? "bg-gradient-primary text-white shadow-soft-orange"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {idx < current ? <span>✓</span> : s.icon}
                </div>
              ),
            }))}
            className="!py-2"
          />
        </div>
      </Card>

      <Card className="!rounded-2xl !border border-gray-100">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, all) => setFormValues({ ...formValues, ...all })}
          initialValues={{
            isHazardous: false,
            insuranceRequired: true,
            prepayRatio: 30,
            minCreditScore: 700,
          }}
        >
          <div className="max-w-6xl mx-auto">{stepContent[current]()}</div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 max-w-6xl mx-auto">
            <Button
              onClick={prev}
              disabled={current === 0}
              icon={<ChevronLeft size={16} />}
              className="!h-11 !px-6 !rounded-xl !font-medium !border-gray-200"
            >
              上一步
            </Button>
            <div className="flex items-center gap-3">
              <Button className="!h-11 !px-6 !rounded-xl !font-medium !border-gray-200">
                保存草稿
              </Button>
              {current < steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={next}
                  icon={<ChevronRight size={16} />}
                  className="!h-11 !px-8 !rounded-xl !font-medium !bg-gradient-primary !border-0 hover:!brightness-105 shadow-soft-orange"
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<Send size={16} />}
                  className="!h-11 !px-8 !rounded-xl !font-bold !bg-gradient-primary !border-0 hover:!brightness-105 shadow-soft-orange !text-base"
                >
                  确认发布货源
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
}
