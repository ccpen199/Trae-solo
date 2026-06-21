import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Form,
  InputNumber,
  Upload,
  Select,
  DatePicker,
  Input,
  Checkbox,
  Tag,
  Table,
  Steps,
  Timeline,
  Modal,
  Divider,
  Alert,
  message,
  Empty,
  Space,
  Row,
  Col,
  Typography,
  Badge,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  CreditCard,
  TrendingUp,
  Building2,
  ArrowLeftRight,
  Upload as UploadIcon,
  Search,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { useUserStore } from '@/store/userStore';
import { get, post } from '@/utils/api';
import {
  mockTransactions,
  hospitals,
  cityPolicies,
} from '../../shared/mockData';
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  Hospital,
  CityCode,
  InsuranceType,
} from 'shared/types';
import {
  TRANSACTION_NAMES,
  TRANSACTION_STATUS_NAMES,
  TRANSACTION_STATUS_COLORS,
  CITY_NAMES,
  CITIES,
  INSURANCE_NAMES,
} from 'shared/types';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { RangePicker } = DatePicker;

type ActiveTab = 'SUPPLEMENTARY_PAY' | 'BASE_ADJUSTMENT' | 'HOSPITAL_CHANGE' | 'TRANSFER' | null;

const CARDS: {
  key: ActiveTab;
  title: string;
  desc: string;
  icon: typeof CreditCard;
  gradient: string;
  accent: string;
}[] = [
  {
    key: 'SUPPLEMENTARY_PAY',
    title: '社保补缴',
    desc: '断缴月份一键补缴，最长支持24个月',
    icon: CreditCard,
    gradient: 'from-blue-600 to-blue-800',
    accent: '#2563EB',
  },
  {
    key: 'BASE_ADJUSTMENT',
    title: '基数调整',
    desc: '缴费基数变更，差额自动核算',
    icon: TrendingUp,
    gradient: 'from-indigo-600 to-indigo-800',
    accent: '#4F46E5',
  },
  {
    key: 'HOSPITAL_CHANGE',
    title: '定点医院变更',
    desc: '医保定点医院新增/调整',
    icon: Building2,
    gradient: 'from-cyan-600 to-blue-700',
    accent: '#0891B2',
  },
  {
    key: 'TRANSFER',
    title: '社保转移接续',
    desc: '跨城市社保关系转移合并',
    icon: ArrowLeftRight,
    gradient: 'from-sky-600 to-blue-800',
    accent: '#0284C7',
  },
];

function SupplementaryPayForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { currentCity } = useUserStore();
  const policy = cityPolicies[currentCity];
  const [form] = Form.useForm();
  const [selectedMonths, setSelectedMonths] = useState<Dayjs[]>([]);
  const [baseAmount, setBaseAmount] = useState<number>(policy?.minBase || 6326);
  const [fileList, setFileList] = useState<UploadProps['fileList']>([]);

  const monthOptions = useMemo(() => {
    const arr: Dayjs[] = [];
    const now = dayjs();
    for (let i = 1; i <= 24; i++) {
      arr.push(now.subtract(i, 'month'));
    }
    return arr;
  }, []);

  const calculation = useMemo(() => {
    if (!selectedMonths.length || !baseAmount) {
      return { principal: 0, lateFee: 0, total: 0 };
    }
    const personalRate = 0.105;
    const companyRate = 0.28;
    const monthly = baseAmount * (personalRate + companyRate);
    const principal = Number((monthly * selectedMonths.length).toFixed(2));
    const avgDaysLate = selectedMonths.reduce((acc, m) => {
      return acc + Math.max(0, dayjs().diff(m.endOf('month'), 'day'));
    }, 0) / selectedMonths.length;
    const lateFee = Number((principal * 0.0005 * avgDaysLate).toFixed(2));
    return {
      principal,
      lateFee,
      total: Number((principal + lateFee).toFixed(2)),
    };
  }, [selectedMonths, baseAmount]);

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newList }) => setFileList(newList),
    beforeUpload: () => false,
    multiple: true,
    accept: '.jpg,.jpeg,.png,.pdf',
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedMonths.length) {
        message.warning('请至少选择一个补缴月份');
        return;
      }
      onSubmit({
        ...values,
        months: selectedMonths.map((m) => m.format('YYYY-MM')),
        baseAmount,
        fileList,
        result: calculation,
      });
    } catch (e) {
      // validation failed
    }
  };

  return (
    <Form form={form} layout="vertical" className="fade-in">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <div className="font-medium">补缴须知</div>
            <div>当前城市：{CITY_NAMES[currentCity]} · 基数范围 ¥{policy?.minBase.toLocaleString()} ~ ¥{policy?.maxBase.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <Form.Item
        label={<span className="font-medium text-slate-700">补缴月份 <Tag color="red" className="ml-1">最多24个月</Tag></span>}
        required
      >
        <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
          {monthOptions.map((m) => {
            const val = m.format('YYYY-MM');
            const checked = selectedMonths.some((s) => s.format('YYYY-MM') === val);
            return (
              <div
                key={val}
                onClick={() => {
                  if (checked) {
                    setSelectedMonths(selectedMonths.filter((s) => s.format('YYYY-MM') !== val));
                  } else {
                    setSelectedMonths([...selectedMonths, m]);
                  }
                }}
                className={`text-center py-2 px-1 rounded-md cursor-pointer border text-sm transition-all ${
                  checked
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {m.format('YY年M月')}
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-sm text-slate-500">
          已选 <Text strong className="text-blue-600">{selectedMonths.length}</Text> 个月
          {selectedMonths.length > 0 && (
            <span className="ml-3 text-slate-600">
              {selectedMonths.sort((a, b) => a.valueOf() - b.valueOf())[0].format('YYYY-MM')}
              {' ~ '}
              {selectedMonths.sort((a, b) => b.valueOf() - a.valueOf())[0].format('YYYY-MM')}
            </span>
          )}
        </div>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={<span className="font-medium text-slate-700">缴费基数（元/月）</span>} required>
            <InputNumber
              min={policy?.minBase}
              max={policy?.maxBase}
              value={baseAmount}
              onChange={(v) => setBaseAmount(Number(v))}
              className="w-full"
              addonBefore="¥"
              step={100}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={<span className="font-medium text-slate-700">参保险种</span>}>
            <Select
              mode="multiple"
              defaultValue={['PENSION', 'MEDICAL', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY']}
              options={Object.entries(INSURANCE_NAMES).map(([k, v]) => ({ value: k, label: v }))}
              className="w-full"
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">本金合计</div>
          <div className="text-xl font-semibold text-slate-800 font-mono">¥{calculation.principal.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-xs text-orange-600 mb-1 flex items-center gap-1">
            <Clock size={12} /> 滞纳金（日万分之五）
          </div>
          <div className="text-xl font-semibold text-orange-700 font-mono">¥{calculation.lateFee.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg text-white">
          <div className="text-xs text-blue-100 mb-1">应缴总额</div>
          <div className="text-2xl font-bold font-mono">¥{calculation.total.toLocaleString()}</div>
        </div>
      </div>

      <Form.Item label={<span className="font-medium text-slate-700">证明材料上传</span>}>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon flex justify-center">
            <UploadIcon size={40} className="text-blue-500" />
          </p>
          <p className="ant-upload-text text-slate-700">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint text-slate-400 text-xs">支持身份证、劳动合同、工资流水等，单文件不超过 10MB</p>
        </Upload.Dragger>
      </Form.Item>

      <Form.Item>
        <Button type="primary" size="large" onClick={handleSubmit} className="w-full h-11 text-base">
          提交补缴申请
        </Button>
      </Form.Item>
    </Form>
  );
}

function BaseAdjustmentForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { currentCity } = useUserStore();
  const policy = cityPolicies[currentCity];
  const [form] = Form.useForm();
  const oldBase = 10000;
  const [newBase, setNewBase] = useState<number>(12000);
  const [effectiveMonth, setEffectiveMonth] = useState<Dayjs>(dayjs().add(1, 'month'));

  const diff = useMemo(() => {
    const personalRate = 0.105;
    const companyRate = 0.28;
    const baseDiff = newBase - oldBase;
    const personalMonthly = baseDiff * personalRate;
    const companyMonthly = baseDiff * companyRate;
    return {
      baseDiff,
      personalMonthly: Number(personalMonthly.toFixed(2)),
      companyMonthly: Number(companyMonthly.toFixed(2)),
      totalMonthly: Number((personalMonthly + companyMonthly).toFixed(2)),
    };
  }, [newBase, oldBase]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        ...values,
        effectiveMonth: effectiveMonth.format('YYYY-MM'),
        oldBase,
        newBase,
        result: diff,
      });
    } catch (e) {
      // validation failed
    }
  };

  return (
    <Form form={form} layout="vertical" className="fade-in">
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="基数调整说明"
        description={`${CITY_NAMES[currentCity]}2025年度缴费基数区间：¥${policy?.minBase.toLocaleString()} ～ ¥${policy?.maxBase.toLocaleString()}，调整幅度超过50%将进入人工审核。`}
      />

      <Form.Item label={<span className="font-medium text-slate-700">生效月份</span>} required>
        <DatePicker
          picker="month"
          value={effectiveMonth}
          onChange={(v) => v && setEffectiveMonth(v)}
          disabledDate={(d) => d.isBefore(dayjs().startOf('month'))}
          className="w-full"
          size="large"
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={<span className="font-medium text-slate-700">当前缴费基数</span>}>
            <InputNumber
              value={oldBase}
              disabled
              className="w-full"
              addonBefore="¥"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={<span className="font-medium text-slate-700">调整后基数</span>} required>
            <InputNumber
              min={policy?.minBase}
              max={policy?.maxBase}
              value={newBase}
              onChange={(v) => setNewBase(Number(v))}
              className="w-full"
              addonBefore="¥"
              step={100}
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="mb-4 p-5 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="font-semibold text-slate-800">差额测算（每月）</div>
            <div className="text-sm text-slate-500">自 {effectiveMonth.format('YYYY年MM月')} 起生效</div>
          </div>
        </div>
        <Row gutter={16}>
          <Col span={8}>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">基数差额</div>
              <div className={`text-lg font-bold font-mono ${diff.baseDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diff.baseDiff >= 0 ? '+' : ''}¥{diff.baseDiff.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">个人部分</div>
              <div className={`text-lg font-bold font-mono ${diff.personalMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diff.personalMonthly >= 0 ? '+' : ''}¥{diff.personalMonthly.toLocaleString()}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">企业部分</div>
              <div className={`text-lg font-bold font-mono ${diff.companyMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diff.companyMonthly >= 0 ? '+' : ''}¥{diff.companyMonthly.toLocaleString()}
              </div>
            </div>
          </Col>
        </Row>
        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-slate-600">月缴总额变化：</span>
          <span className={`text-2xl font-bold font-mono ${diff.totalMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {diff.totalMonthly >= 0 ? '+' : ''}¥{diff.totalMonthly.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-2">/月</span>
          </span>
        </div>
      </div>

      <Form.Item
        label={<span className="font-medium text-slate-700">调整原因</span>}
        name="reason"
        rules={[{ required: true, message: '请填写调整原因' }]}
      >
        <Input.TextArea
          placeholder="请填写调整原因，如：薪资调整、岗位变动等"
          rows={3}
          maxLength={200}
          showCount
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" size="large" onClick={handleSubmit} className="w-full h-11 text-base">
          提交基数调整申请
        </Button>
      </Form.Item>
    </Form>
  );
}

function HospitalChangeForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { currentCity } = useUserStore();
  const [city, setCity] = useState<CityCode>(currentCity);
  const [keyword, setKeyword] = useState('');
  const cityHospitals = hospitals[city] || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(
    cityHospitals.filter((h) => h.isDesignated).map((h) => h.id)
  );

  useEffect(() => {
    setCity(currentCity);
  }, [currentCity]);

  useEffect(() => {
    const designated = (hospitals[city] || []).filter((h) => h.isDesignated).map((h) => h.id);
    setSelectedIds(designated);
  }, [city]);

  const filteredHospitals = useMemo(() => {
    if (!keyword) return cityHospitals;
    const kw = keyword.toLowerCase();
    return cityHospitals.filter(
      (h) => h.name.toLowerCase().includes(kw) || h.address.toLowerCase().includes(kw)
    );
  }, [cityHospitals, keyword]);

  const designated = filteredHospitals.filter((h) => selectedIds.includes(h.id));
  const available = filteredHospitals.filter((h) => !selectedIds.includes(h.id));

  const toggleHospital = (h: Hospital) => {
    if (selectedIds.includes(h.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== h.id));
    } else {
      if (selectedIds.length >= 5) {
        message.warning('最多可选择 5 家定点医院');
        return;
      }
      setSelectedIds([...selectedIds, h.id]);
    }
  };

  const handleSubmit = () => {
    const added = cityHospitals.filter((h) => selectedIds.includes(h.id) && !h.isDesignated);
    const removed = cityHospitals.filter((h) => !selectedIds.includes(h.id) && h.isDesignated);
    if (!added.length && !removed.length) {
      message.warning('请至少新增或取消一家医院');
      return;
    }
    onSubmit({
      city,
      addHospitalIds: added.map((h) => h.id),
      removeHospitalIds: removed.map((h) => h.id),
      added,
      removed,
    });
  };

  const HospitalCard = ({ h, checked }: { h: Hospital; checked: boolean }) => (
    <div
      onClick={() => toggleHospital(h)}
      className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
        checked
          ? 'bg-blue-50 border-blue-400 shadow-sm'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onChange={() => toggleHospital(h)} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-800">{h.name}</span>
            <Tag color={h.level === '三甲' ? 'red' : h.level === '社区' ? 'green' : 'blue'}>
              {h.level}
            </Tag>
            {checked && (
              <Tag color="blue" icon={<CheckCircle2 size={12} />}>
                已定点
              </Tag>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin size={12} />
            {h.address}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">参保城市</label>
          <Select
            value={city}
            onChange={(v) => setCity(v)}
            options={CITIES.map((c) => ({ value: c, label: CITY_NAMES[c] }))}
            className="w-full"
            size="large"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">搜索医院</label>
          <Input
            prefix={<Search size={14} className="text-slate-400" />}
            placeholder="输入医院名称或地址"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            size="large"
            allowClear
          />
        </div>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            size="small"
            className="h-full"
            title={
              <div className="flex items-center gap-2">
                <Badge color="blue" />
                <span className="text-slate-700">已定点医院</span>
                <Tag color="blue">{selectedIds.length}/5</Tag>
              </div>
            }
            styles={{ body: { maxHeight: 380, overflowY: 'auto', padding: 12 } }}
          >
            {designated.length === 0 ? (
              <Empty description="暂无定点医院" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              designated.map((h) => <HospitalCard key={h.id} h={h} checked />)
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            size="small"
            className="h-full"
            title={
              <div className="flex items-center gap-2">
                <Badge color="default" />
                <span className="text-slate-700">可选医院</span>
                <Tag>{available.length}</Tag>
              </div>
            }
            styles={{ body: { maxHeight: 380, overflowY: 'auto', padding: 12 } }}
          >
            {available.length === 0 ? (
              <Empty description="无匹配结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              available.map((h) => <HospitalCard key={h.id} h={h} checked={false} />)
            )}
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <Button type="primary" size="large" onClick={handleSubmit} className="w-full h-11 text-base">
          提交定点医院变更
        </Button>
      </div>
    </div>
  );
}

function TransferForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [form] = Form.useForm();
  const [fromCity, setFromCity] = useState<CityCode>('SH');
  const [toCity, setToCity] = useState<CityCode>('BJ');
  const [types, setTypes] = useState<InsuranceType[]>(['PENSION', 'MEDICAL']);

  const handleSubmit = async () => {
    if (!types.length) {
      message.warning('请至少选择一个转移险种');
      return;
    }
    if (fromCity === toCity) {
      message.warning('转出地与转入地不能相同');
      return;
    }
    onSubmit({
      fromCity,
      toCity,
      transferTypes: types,
    });
  };

  return (
    <Form form={form} layout="vertical" className="fade-in">
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="转移接续说明"
        description="社保关系转移一般需要15-45个工作日，转移完成后缴费年限和个人账户金额将累计计算。"
      />

      <Row gutter={16} align="middle">
        <Col span={10}>
          <Form.Item label={<span className="font-medium text-slate-700">转出地</span>} required>
            <Select
              value={fromCity}
              onChange={(v) => setFromCity(v)}
              options={CITIES.map((c) => ({ value: c, label: CITY_NAMES[c] }))}
              className="w-full"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <div className="flex justify-center pb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg">
              <ArrowLeftRight size={20} />
            </div>
          </div>
        </Col>
        <Col span={10}>
          <Form.Item label={<span className="font-medium text-slate-700">转入地</span>} required>
            <Select
              value={toCity}
              onChange={(v) => setToCity(v)}
              options={CITIES.map((c) => ({ value: c, label: CITY_NAMES[c] }))}
              className="w-full"
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={<span className="font-medium text-slate-700">转移险种</span>} required>
        <Checkbox.Group
          value={types}
          onChange={(v) => setTypes(v as InsuranceType[])}
          className="w-full grid grid-cols-3 gap-3"
        >
          {(['PENSION', 'MEDICAL', 'UNEMPLOYMENT'] as InsuranceType[]).map((t) => (
            <Checkbox
              key={t}
              value={t}
              className="!flex !items-center !gap-2 !m-0 p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all data-[checked='true']:border-blue-500 data-[checked='true']:bg-blue-50"
            >
              {INSURANCE_NAMES[t]}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Form.Item>

      <Divider orientation="left" className="!my-4">
        <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <FileText size={14} /> 办理流程指引
        </span>
      </Divider>

      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-5 border border-blue-100 mb-4">
        <Timeline
          mode="left"
          items={[
            {
              color: '#2563EB',
              label: <span className="font-medium text-slate-700">在线申请</span>,
              children: (
                <div className="text-sm text-slate-500">
                  填写转移申请，系统自动校验参保信息（约1-2个工作日）
                </div>
              ),
            },
            {
              color: '#2563EB',
              label: <span className="font-medium text-slate-700">转出地审核</span>,
              children: (
                <div className="text-sm text-slate-500">
                  转出地社保局核对信息，开具《参保缴费凭证》（约5-10个工作日）
                </div>
              ),
            },
            {
              color: '#2563EB',
              label: <span className="font-medium text-slate-700">转入地接收</span>,
              children: (
                <div className="text-sm text-slate-500">
                  转入地社保局接收凭证，生成《转移接续联系函》（约5个工作日）
                </div>
              ),
            },
            {
              color: '#64748B',
              label: <span className="font-medium text-slate-700">资金划转</span>,
              children: (
                <div className="text-sm text-slate-500">
                  个人账户基金划转，缴费年限累计合并（约10-15个工作日）
                </div>
              ),
            },
            {
              color: '#64748B',
              label: <span className="font-medium text-slate-700">办结通知</span>,
              children: (
                <div className="text-sm text-slate-500">
                  转移完成后发送短信通知，可在本平台查看电子凭证
                </div>
              ),
            },
          ]}
        />
      </div>

      <Form.Item>
        <Button type="primary" size="large" onClick={handleSubmit} className="w-full h-11 text-base">
          提交转移接续申请
        </Button>
      </Form.Item>
    </Form>
  );
}

function TransactionDetailModal({
  tx,
  open,
  onClose,
}: {
  tx: Transaction | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!tx) return null;

  const statusIndex: Record<TransactionStatus, number> = {
    SUBMITTED: 0,
    AI_REVIEWING: 1,
    AI_REJECTED: 5,
    MANUAL_REVIEWING: 2,
    MANUAL_REJECTED: 5,
    PROCESSING: 3,
    SUCCESS: 4,
    FAILED: 5,
  };
  const currentStep = statusIndex[tx.status] ?? 0;
  const stepTitles = ['提交申请', 'AI审核', '人工复核', '社保局处理', '办理完成', '异常'];

  return (
    <Modal open={open} onCancel={onClose} title="事务详情" width={720} footer={null}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Title level={5} className="!mb-0">{tx.title}</Title>
          <div className="mt-1">
            <Tag color={TRANSACTION_STATUS_COLORS[tx.status]}>
              {TRANSACTION_STATUS_NAMES[tx.status]}
            </Tag>
            <Text type="secondary" className="ml-2 text-xs">事务单号：{tx.id}</Text>
          </div>
        </div>
        <Text type="secondary" className="text-xs">
          提交时间：{dayjs(tx.submittedAt).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      </div>

      <Steps current={currentStep} size="small" className="mb-6">
        {stepTitles.slice(0, Math.min(currentStep + 2, 5)).map((t, i) => (
          <Step key={i} title={t} />
        ))}
      </Steps>

      <Card size="small" title="办理进度时间轴" className="mb-4">
        <Timeline
          items={tx.timeline.map((item) => ({
            color: item.status === 'SUCCESS' ? 'green' : item.status.includes('REJECTED') ? 'red' : 'blue',
            children: (
              <div>
                <div className="font-medium text-slate-800">
                  {TRANSACTION_STATUS_NAMES[item.status]}
                </div>
                {item.comment && (
                  <div className="text-sm text-slate-500 mt-0.5">{item.comment}</div>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  {dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')} · {item.operator}
                </div>
              </div>
            ),
          }))}
        />
      </Card>

      {tx.requestData && (
        <Card size="small" title="申请信息">
          <Row gutter={[16, 8]}>
            {Object.entries(tx.requestData).map(([k, v]) => (
              <Col span={12} key={k}>
                <div className="text-xs text-slate-400">{k}</div>
                <div className="text-sm text-slate-700 font-mono">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {tx.resultData && (
        <Card size="small" title="办理结果" className="mt-3">
          <Row gutter={[16, 8]}>
            {Object.entries(tx.resultData).map(([k, v]) => (
              <Col span={12} key={k}>
                <div className="text-xs text-slate-400">{k}</div>
                <div className="text-sm text-slate-700 font-mono">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </Modal>
  );
}

function TransactionCenter() {
  const { currentCity, user } = useUserStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [list, setList] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');

  const activeCard = CARDS.find((c) => c.key === activeTab);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await get('/transaction', { params: { userId: 'U001', pageSize: 50 } });
      if (res?.data?.list) {
        setList(res.data.list);
      }
    } catch {
      setList(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSubmit = async (type: TransactionType, data: any) => {
    setSubmitting(true);
    try {
      const res = await post('/transaction', {
        userId: user?.id || 'U001',
        type,
        cityCode: currentCity,
        title: TRANSACTION_NAMES[type] + '申请',
        requestData: data,
      });
      message.success('申请已提交，请在下方查看进度');
      setActiveTab(null);
      loadTransactions();
    } catch (e: any) {
      message.error(e?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '事务类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: TransactionType) => (
        <span className="font-medium text-slate-700">{TRANSACTION_NAMES[v]}</span>
      ),
    },
    {
      title: '事务标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (v: string) => <span className="text-slate-700">{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: TransactionStatus) => (
        <Tag color={TRANSACTION_STATUS_COLORS[v]}>{TRANSACTION_STATUS_NAMES[v]}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 170,
      render: (v: string) => (
        <span className="text-slate-500 text-sm">{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Transaction) => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => {
            setDetailTx(record);
            setDetailOpen(true);
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const filteredList =
    statusFilter === 'ALL' ? list : list.filter((t) => t.status === statusFilter);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={3} className="!mb-1 gov-text-gradient">
          事务办理大厅
        </Title>
        <Text type="secondary">
          当前城市：{CITY_NAMES[currentCity]} · 支持在线办理社保补缴、基数调整、医院变更、转移接续等业务
        </Text>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {CARDS.map((card) => {
          const isActive = activeTab === card.key;
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              hoverable
              onClick={() => setActiveTab(isActive ? null : card.key)}
              styles={{
                body: {
                  padding: 0,
                  overflow: 'hidden',
                },
              }}
              className={`overflow-hidden border-2 transition-all ${
                isActive ? 'ring-2 ring-blue-400 border-blue-400 -translate-y-1 shadow-card-hover' : ''
              }`}
            >
              <div className={`bg-gradient-to-br ${card.gradient} p-5 text-white relative overflow-hidden`}>
                <div
                  className="absolute right-0 top-0 w-24 h-24 rounded-full opacity-20"
                  style={{ background: 'rgba(255,255,255,0.2)', transform: 'translate(30%, -30%)' }}
                />
                <Icon size={32} strokeWidth={1.8} />
              </div>
              <div className="p-4">
                <div className="font-semibold text-slate-800 text-base mb-1">{card.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{card.desc}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {activeTab && activeCard && (
        <Card
          className="mb-6 shadow-card"
          title={
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                style={{ background: activeCard.accent }}
              >
                <activeCard.icon size={20} />
              </div>
              <div>
                <div className="font-semibold text-slate-800">{activeCard.title}申请表</div>
                <div className="text-xs text-slate-400">{activeCard.desc}</div>
              </div>
            </div>
          }
          extra={
            <Button onClick={() => setActiveTab(null)} size="small">
              收起
            </Button>
          }
        >
          {activeTab === 'SUPPLEMENTARY_PAY' && (
            <SupplementaryPayForm onSubmit={(d) => handleSubmit('SUPPLEMENTARY_PAY', d)} />
          )}
          {activeTab === 'BASE_ADJUSTMENT' && (
            <BaseAdjustmentForm onSubmit={(d) => handleSubmit('BASE_ADJUSTMENT', d)} />
          )}
          {activeTab === 'HOSPITAL_CHANGE' && (
            <HospitalChangeForm onSubmit={(d) => handleSubmit('HOSPITAL_CHANGE', d)} />
          )}
          {activeTab === 'TRANSFER' && (
            <TransferForm onSubmit={(d) => handleSubmit('TRANSFER', d)} />
          )}
        </Card>
      )}

      <Card
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-700" />
            <span className="font-semibold text-slate-800">历史事务记录</span>
          </div>
        }
        extra={
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="small"
              style={{ width: 140 }}
              options={[
                { value: 'ALL', label: '全部状态' },
                ...Object.entries(TRANSACTION_STATUS_NAMES).map(([k, v]) => ({
                  value: k,
                  label: v,
                })),
              ]}
            />
            <Button
              size="small"
              icon={<Loader2 size={14} />}
              onClick={loadTransactions}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          locale={{ emptyText: <Empty description="暂无事务记录" /> }}
        />
      </Card>

      <TransactionDetailModal
        tx={detailTx}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}

export default TransactionCenter;
