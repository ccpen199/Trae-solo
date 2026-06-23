import { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Package,
  Scale,
  Box,
  Check,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertTriangle,
  Shield,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { post } from '@/utils/request';
import { useNavigate } from 'react-router-dom';

interface SenderInfo {
  name: string;
  phone: string;
  address: string;
  realNameVerified: boolean;
}

interface ReceiverInfo {
  name: string;
  phone: string;
  address: string;
}

interface ItemInfo {
  category: string;
  name: string;
  quantity: number;
  declaredValue: number;
}

interface DimensionInfo {
  weight: number;
  length: number;
  width: number;
  height: number;
}

const itemCategories = [
  { value: 'document', label: '文件', warning: '' },
  { value: 'daily', label: '日用品', warning: '' },
  { value: 'electronics', label: '电子产品', warning: '含锂电池需单独包装，做好防振保护' },
  { value: 'food', label: '食品', warning: '生鲜食品需使用保温包装，液体需密封' },
  { value: 'clothing', label: '服装', warning: '' },
  { value: 'other', label: '其他', warning: '请确保物品不属于禁寄品范围' },
];

const steps = [
  { key: 'sender_receiver', title: '收发件人' },
  { key: 'item', title: '物品信息' },
  { key: 'dimension', title: '重量体积' },
  { key: 'confirm', title: '确认提交' },
];

export default function WaybillNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [sender, setSender] = useState<SenderInfo>({
    name: '',
    phone: '',
    address: '',
    realNameVerified: false,
  });

  const [receiver, setReceiver] = useState<ReceiverInfo>({
    name: '',
    phone: '',
    address: '',
  });

  const [item, setItem] = useState<ItemInfo>({
    category: '',
    name: '',
    quantity: 1,
    declaredValue: 0,
  });

  const [dimension, setDimension] = useState<DimensionInfo>({
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
  });

  const volume = (dimension.length * dimension.width * dimension.height) / 1000000;
  const estimatedFreight = Math.max(8, dimension.weight * 2 + volume * 100 + 5).toFixed(2);

  const selectedCategory = itemCategories.find((c) => c.value === item.category);

  const canProceed = () => {
    if (currentStep === 0) {
      return (
        sender.name &&
        sender.phone &&
        sender.address &&
        sender.realNameVerified &&
        receiver.name &&
        receiver.phone &&
        receiver.address
      );
    }
    if (currentStep === 1) {
      return item.category && item.name && item.quantity > 0;
    }
    if (currentStep === 2) {
      return dimension.weight > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await post<{ id: string; waybillNo: string }>('/waybill', {
        sender,
        receiver,
        item,
        dimension,
        volume,
        freight: parseFloat(estimatedFreight),
      });
      navigate(`/waybills/${result.id}`);
    } catch (err) {
      navigate('/waybills');
    } finally {
      setSubmitting(false);
    }
  };

  const InputField = ({
    label,
    icon: Icon,
    value,
    onChange,
    placeholder,
    type = 'text',
  }: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    value: string | number;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
  }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-300 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            Icon ? 'pl-10 pr-3' : 'px-3'
          }`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">新建运单</h1>
          <p className="mt-1 text-sm text-gray-500">请填写运单信息，完成快递下单</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                        isCompleted
                          ? 'border-primary bg-primary text-white'
                          : isActive
                          ? 'border-primary bg-white text-primary'
                          : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive || isCompleted ? 'text-primary' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 sm:mx-4 ${
                        isCompleted ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {currentStep === 0 && (
            <div className="space-y-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">寄件人信息</h2>
                  {sender.realNameVerified ? (
                    <Tag color="success">
                      <Shield className="mr-1 h-3 w-3" />
                      已实名认证
                    </Tag>
                  ) : (
                    <button
                      onClick={() => navigate('/authentication')}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Shield className="h-4 w-4" />
                      去实名认证
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="姓名"
                    icon={User}
                    value={sender.name}
                    onChange={(v) => setSender({ ...sender, name: v })}
                    placeholder="请输入寄件人姓名"
                  />
                  <InputField
                    label="手机号"
                    icon={Phone}
                    value={sender.phone}
                    onChange={(v) => setSender({ ...sender, phone: v })}
                    placeholder="请输入手机号"
                    type="tel"
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label="详细地址"
                      icon={MapPin}
                      value={sender.address}
                      onChange={(v) => setSender({ ...sender, address: v })}
                      placeholder="请输入详细地址"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sender.realNameVerified}
                        onChange={(e) =>
                          setSender({ ...sender, realNameVerified: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        我已完成实名认证，同意使用实名信息寄件
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">收件人信息</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="姓名"
                    icon={User}
                    value={receiver.name}
                    onChange={(v) => setReceiver({ ...receiver, name: v })}
                    placeholder="请输入收件人姓名"
                  />
                  <InputField
                    label="手机号"
                    icon={Phone}
                    value={receiver.phone}
                    onChange={(v) => setReceiver({ ...receiver, phone: v })}
                    placeholder="请输入手机号"
                    type="tel"
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label="详细地址"
                      icon={Navigation}
                      value={receiver.address}
                      onChange={(v) => setReceiver({ ...receiver, address: v })}
                      placeholder="请输入详细地址"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">物品信息</h2>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">物品类别</label>
                <select
                  value={item.category}
                  onChange={(e) => setItem({ ...item, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">请选择物品类别</option>
                  {itemCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory?.warning && (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">温馨提示</div>
                    <div className="mt-1 text-sm text-yellow-700">{selectedCategory.warning}</div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="物品名称"
                  icon={Package}
                  value={item.name}
                  onChange={(v) => setItem({ ...item, name: v })}
                  placeholder="请输入物品名称"
                />
                <InputField
                  label="数量"
                  value={item.quantity}
                  onChange={(v) => setItem({ ...item, quantity: parseInt(v) || 0 })}
                  placeholder="请输入数量"
                  type="number"
                />
                <div className="sm:col-span-2">
                  <InputField
                    label="声明价值（元）"
                    value={item.declaredValue}
                    onChange={(v) => setItem({ ...item, declaredValue: parseFloat(v) || 0 })}
                    placeholder="请输入声明价值"
                    type="number"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">重量体积</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="重量（kg）"
                  icon={Scale}
                  value={dimension.weight}
                  onChange={(v) => setDimension({ ...dimension, weight: parseFloat(v) || 0 })}
                  placeholder="请输入重量"
                  type="number"
                />
                <div />
                <InputField
                  label="长（cm）"
                  icon={Box}
                  value={dimension.length}
                  onChange={(v) => setDimension({ ...dimension, length: parseFloat(v) || 0 })}
                  placeholder="请输入长度"
                  type="number"
                />
                <InputField
                  label="宽（cm）"
                  value={dimension.width}
                  onChange={(v) => setDimension({ ...dimension, width: parseFloat(v) || 0 })}
                  placeholder="请输入宽度"
                  type="number"
                />
                <InputField
                  label="高（cm）"
                  value={dimension.height}
                  onChange={(v) => setDimension({ ...dimension, height: parseFloat(v) || 0 })}
                  placeholder="请输入高度"
                  type="number"
                />
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-gray-500">计算体积</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {volume.toFixed(4)} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">预估运费</div>
                    <div className="mt-1 text-lg font-semibold text-primary">
                      ¥ {estimatedFreight}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">确认信息</h2>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">寄件人</h3>
                    {sender.realNameVerified && (
                      <Tag color="success">
                        <Shield className="mr-1 h-3 w-3" />
                        已实名
                      </Tag>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">姓名：</span>
                      <span className="text-gray-900">{sender.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">手机号：</span>
                      <span className="text-gray-900">{sender.phone}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">地址：</span>
                      <span className="text-gray-900">{sender.address}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-3 font-medium text-gray-900">收件人</h3>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">姓名：</span>
                      <span className="text-gray-900">{receiver.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">手机号：</span>
                      <span className="text-gray-900">{receiver.phone}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">地址：</span>
                      <span className="text-gray-900">{receiver.address}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-3 font-medium text-gray-900">物品信息</h3>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">类别：</span>
                      <span className="text-gray-900">
                        {itemCategories.find((c) => c.value === item.category)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">名称：</span>
                      <span className="text-gray-900">{item.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">数量：</span>
                      <span className="text-gray-900">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">声明价值：</span>
                      <span className="text-gray-900">¥ {item.declaredValue}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-3 font-medium text-gray-900">重量体积</h3>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">重量：</span>
                      <span className="text-gray-900">{dimension.weight} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-500">体积：</span>
                      <span className="text-gray-900">{volume.toFixed(4)} m³</span>
                    </div>
                    <div>
                      <span className="text-gray-500">尺寸：</span>
                      <span className="text-gray-900">
                        {dimension.length} × {dimension.width} × {dimension.height} cm
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">预估运费：</span>
                      <span className="font-semibold text-primary">¥ {estimatedFreight}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            leftIcon={ArrowLeft}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
              rightIcon={ArrowRight}
              disabled={!canProceed()}
            >
              下一步
            </Button>
          ) : (
            <Button
              loading={submitting}
              onClick={handleSubmit}
              leftIcon={Send}
            >
              提交运单
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
