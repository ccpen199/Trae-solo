import { useState, useCallback, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Upload,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  Home,
  Ruler,
  Layers,
  Box,
  Flame,
  FileCheck,
  Calendar,
  Banknote,
  Clock,
  CreditCard,
  Car,
  ArrowUpFromLine,
  type LucideIcon,
} from 'lucide-react';
import type {
  PropertyType,
  PropertyLocation,
  PropertySpec,
  RentClause,
  PropertyOwnership,
  PropertyImage,
  OwnershipType,
  FireInspectionStatus,
} from '@/types';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 0, name: '基础信息', icon: Home },
  { id: 1, name: 'VR上传', icon: Eye },
  { id: 2, name: '产权信息', icon: FileCheck },
  { id: 3, name: '租赁条款', icon: Banknote },
  { id: 4, name: '预览发布', icon: Check },
];

const propertyTypes: PropertyType[] = ['写字楼', '商铺', '厂房', '产业园', '综合体'];
const ownershipTypes: OwnershipType[] = ['国有产权', '集体产权', '私有产权', '股份制', '其他'];
const fireStatuses: FireInspectionStatus[] = ['已通过', '待验收', '整改中', '未申请'];
const paymentMethods: RentClause['paymentMethod'][] = ['押一付一', '押一付三', '押二付三', '押三付一'];
const rentUnits: RentClause['rentUnit'][] = ['元/㎡·天', '元/㎡·月'];
const vrSceneNames = ['大堂', '前台', '开放办公区', '会议室', '茶水间', '总裁办公室', '休闲区', '路演厅', '电梯厅', '其他'];

const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省', '山东省', '福建省', '河南省'];
const cities: Record<string, string[]> = {
  '北京市': ['北京市'],
  '上海市': ['上海市'],
  '广东省': ['深圳市', '广州市', '东莞市', '佛山市'],
  '江苏省': ['苏州市', '南京市', '无锡市', '常州市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市'],
  '四川省': ['成都市', '绵阳市', '德阳市'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市'],
  '山东省': ['青岛市', '济南市', '烟台市'],
  '福建省': ['厦门市', '福州市', '泉州市'],
  '河南省': ['郑州市', '洛阳市', '开封市'],
};
const districts: Record<string, string[]> = {
  '北京市': ['朝阳区', '海淀区', '东城区', '西城区', '丰台区'],
  '上海市': ['浦东新区', '黄浦区', '静安区', '徐汇区', '长宁区'],
  '深圳市': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'],
  '广州市': ['天河区', '越秀区', '海珠区', '白云区', '番禺区'],
  '苏州市': ['工业园区', '姑苏区', '吴中区', '相城区', '虎丘区'],
  '杭州市': ['余杭区', '西湖区', '上城区', '拱墅区', '滨江区'],
  '成都市': ['锦江区', '青羊区', '武侯区', '高新区', '天府新区'],
  '武汉市': ['江汉区', '武昌区', '洪山区', '东湖高新区'],
  '青岛市': ['市南区', '市北区', '崂山区', '黄岛区'],
  '厦门市': ['思明区', '湖里区', '集美区', '海沧区'],
  '南京市': ['鼓楼区', '玄武区', '建邺区', '江宁区'],
  '郑州市': ['郑东新区', '金水区', '二七区', '中原区'],
};

interface VrScene {
  id: string;
  name: string;
  file?: File;
  previewUrl?: string;
}

interface FormData {
  basicInfo: {
    name: string;
    code: string;
    type: PropertyType;
    province: string;
    city: string;
    district: string;
    address: string;
    floor: string;
    totalFloors: number;
    area: number;
    usableArea: number;
    tags: string[];
  };
  vrScenes: VrScene[];
  ownership: {
    type: OwnershipType;
    certificateNumber: string;
    ownerName: string;
    ownershipExpireDate: string;
    fireInspectionStatus: FireInspectionStatus;
    fireInspectionDate: string;
    ceilingHeight: number;
    loadCapacity: number;
    columnSpacing: string;
    windowRatio: string;
    hasElevator: boolean;
    hasParking: boolean;
    parkingSpots: number;
  };
  rentClause: {
    monthlyRent: number;
    rentUnit: RentClause['rentUnit'];
    rentIncreaseRate: number;
    depositMonths: number;
    freeRentDays: number;
    minLeaseTerm: number;
    maxLeaseTerm: number;
    paymentMethod: RentClause['paymentMethod'];
  };
}

const initialFormData: FormData = {
  basicInfo: {
    name: '',
    code: '',
    type: '写字楼',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    address: '',
    floor: '',
    totalFloors: 0,
    area: 0,
    usableArea: 0,
    tags: [],
  },
  vrScenes: [],
  ownership: {
    type: '股份制',
    certificateNumber: '',
    ownerName: '',
    ownershipExpireDate: '',
    fireInspectionStatus: '未申请',
    fireInspectionDate: '',
    ceilingHeight: 0,
    loadCapacity: 0,
    columnSpacing: '',
    windowRatio: '',
    hasElevator: true,
    hasParking: true,
    parkingSpots: 0,
  },
  rentClause: {
    monthlyRent: 0,
    rentUnit: '元/㎡·天',
    rentIncreaseRate: 0,
    depositMonths: 0,
    freeRentDays: 0,
    minLeaseTerm: 0,
    maxLeaseTerm: 0,
    paymentMethod: '押三付一',
  },
};

const availableTags = [
  '江景房源', '地铁上盖', '甲级写字楼', '精装修', '24小时空调',
  '品牌开发商', '政策扶持', '人才补贴', '孵化器认证', 'VR可看',
  '黄金位置', '人流密集', '旗舰店首选', '标准厂房', '环评已过',
  '科创园区', '城市地标', '360°景观', '成熟商场', '适合餐饮',
];

const fireStatusColorMap: Record<FireInspectionStatus, string> = {
  已通过: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  待验收: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  整改中: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  未申请: 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30',
};

function TabHeader({ activeTab, onTabClick }: { activeTab: number; onTabClick: (index: number) => void }) {
  return (
    <div className="card-base p-2 mb-6">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === index;
          const isCompleted = index < activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(index)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap flex-1 min-w-[120px]',
                isActive
                  ? 'bg-gradient-to-r from-gold-500/20 to-gold-400/10 text-gold-300 border border-gold-500/40'
                  : isCompleted
                  ? 'text-emerald-400 hover:bg-primary-800/50'
                  : 'text-neutral-500 hover:bg-primary-800/30'
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{tab.name}</span>
              {index < tabs.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gradient-to-b from-transparent via-gold-500/20 to-transparent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn('input-tech', Icon && 'pl-10')}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-tech"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-primary-900">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function BasicInfoStep({
  data,
  onChange,
}: {
  data: FormData['basicInfo'];
  onChange: (data: FormData['basicInfo']) => void;
}) {
  const [tagInput, setTagInput] = useState('');

  const updateField = <K extends keyof FormData['basicInfo']>(key: K, value: FormData['basicInfo'][K]) => {
    onChange({ ...data, [key]: value });
  };

  const addTag = (tag: string) => {
    if (tag && !data.tags.includes(tag) && data.tags.length < 8) {
      updateField('tags', [...data.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateField('tags', data.tags.filter((t) => t !== tag));
  };

  const handleProvinceChange = (province: string) => {
    const cityList = cities[province] || [];
    const firstCity = cityList[0] || '';
    const districtList = districts[firstCity] || [];
    const firstDistrict = districtList[0] || '';
    onChange({ ...data, province, city: firstCity, district: firstDistrict });
  };

  const handleCityChange = (city: string) => {
    const districtList = districts[city] || [];
    const firstDistrict = districtList[0] || '';
    onChange({ ...data, city, district: firstDistrict });
  };

  const cityOptions = cities[data.province] || [];
  const districtOptions = districts[data.city] || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="房源名称"
          icon={Building2}
          value={data.name}
          onChange={(v) => updateField('name', v)}
          placeholder="请输入房源名称"
          required
        />
        <InputField
          label="房源编号"
          value={data.code}
          onChange={(v) => updateField('code', v)}
          placeholder="请输入房源编号"
          required
        />
      </div>

      <SelectField
        label="房源类型"
        value={data.type}
        onChange={(v) => updateField('type', v as PropertyType)}
        options={propertyTypes}
        required
      />

      <div className="card-base p-4">
        <h4 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          地址信息
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SelectField
            label="省份"
            value={data.province}
            onChange={handleProvinceChange}
            options={provinces}
            required
          />
          <SelectField
            label="城市"
            value={data.city}
            onChange={handleCityChange}
            options={cityOptions}
            required
          />
          <SelectField
            label="区域"
            value={data.district}
            onChange={(v) => updateField('district', v)}
            options={districtOptions}
            required
          />
        </div>
        <InputField
          label="详细地址"
          icon={MapPin}
          value={data.address}
          onChange={(v) => updateField('address', v)}
          placeholder="请输入详细地址"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="楼层"
          icon={Layers}
          value={data.floor}
          onChange={(v) => updateField('floor', v)}
          placeholder="如：28层"
        />
        <InputField
          label="总楼层"
          type="number"
          value={data.totalFloors || ''}
          onChange={(v) => updateField('totalFloors', Number(v) || 0)}
          placeholder="如：101"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="总面积 (㎡)"
          icon={Ruler}
          type="number"
          value={data.area || ''}
          onChange={(v) => updateField('area', Number(v) || 0)}
          placeholder="请输入总面积"
          required
        />
        <InputField
          label="实用面积 (㎡)"
          icon={Maximize2}
          type="number"
          value={data.usableArea || ''}
          onChange={(v) => updateField('usableArea', Number(v) || 0)}
          placeholder="请输入实用面积"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-2">
          房源标签
          <span className="text-neutral-500 ml-2">(最多8个)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.tags.map((tag) => (
            <span key={tag} className="chip chip-gold">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-rose-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTags
            .filter((t) => !data.tags.includes(t))
            .slice(0, 12)
            .map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="chip hover:border-gold-500/40 hover:text-gold-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {tag}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function VrUploadStep({
  data,
  onChange,
}: {
  data: VrScene[];
  onChange: (data: VrScene[]) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/') || f.type.startsWith('video/')
      );
      addVrScenes(files);
    },
    [data]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    addVrScenes(files);
    e.target.value = '';
  };

  const addVrScenes = (files: File[]) => {
    const newScenes: VrScene[] = files.map((file, index) => ({
      id: `vr-${Date.now()}-${index}`,
      name: vrSceneNames[index % vrSceneNames.length],
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...data, ...newScenes].slice(0, 12));
  };

  const updateSceneName = (id: string, name: string) => {
    onChange(data.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const removeScene = (id: string) => {
    const scene = data.find((s) => s.id === id);
    if (scene?.previewUrl) {
      URL.revokeObjectURL(scene.previewUrl);
    }
    onChange(data.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer',
          isDragOver
            ? 'border-gold-400 bg-gold-500/10'
            : 'border-primary-600/50 bg-primary-900/30 hover:border-gold-500/40 hover:bg-primary-800/40'
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
              isDragOver ? 'bg-gold-500/20' : 'bg-primary-800'
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8 transition-colors',
                isDragOver ? 'text-gold-400' : 'text-neutral-400'
              )}
            />
          </div>
          <p className="text-lg font-medium text-neutral-200 mb-1">
            {isDragOver ? '释放以上传VR场景' : '拖拽文件到此处上传'}
          </p>
          <p className="text-sm text-neutral-500">
            支持图片和视频文件，最多上传12个VR场景
          </p>
          <div className="mt-4 flex gap-2 justify-center flex-wrap">
            {['大堂', '前台', '开放办公区', '会议室', '茶水间'].map((scene) => (
              <span key={scene} className="chip text-xs">
                {scene}
              </span>
            ))}
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gold-300 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              VR场景列表
              <span className="text-xs text-neutral-500 font-normal">
                ({data.length}/12)
              </span>
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((scene) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-lg overflow-hidden bg-primary-800/50 border border-gold-500/10"
              >
                {scene.previewUrl ? (
                  <img
                    src={scene.previewUrl}
                    alt={scene.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-primary-700/50">
                    <Eye className="w-8 h-8 text-neutral-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <select
                    value={scene.name}
                    onChange={(e) => updateSceneName(scene.id, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded bg-primary-900/80 border border-gold-500/20 text-neutral-200 focus:border-gold-400 focus:outline-none"
                  >
                    {vrSceneNames.map((name) => (
                      <option key={name} value={name} className="bg-primary-900">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => removeScene(scene.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 && (
        <div className="card-base p-8 text-center">
          <Eye className="w-12 h-12 mx-auto text-neutral-500/40 mb-3" />
          <p className="text-neutral-400">暂无VR场景</p>
          <p className="text-sm text-neutral-500 mt-1">上传VR场景可以提升房源吸引力和浏览量</p>
        </div>
      )}
    </div>
  );
}

function OwnershipStep({
  data,
  onChange,
}: {
  data: FormData['ownership'];
  onChange: (data: FormData['ownership']) => void;
}) {
  const updateField = <K extends keyof FormData['ownership']>(
    key: K,
    value: FormData['ownership'][K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="产权类型"
          value={data.type}
          onChange={(v) => updateField('type', v as OwnershipType)}
          options={ownershipTypes}
          required
        />
        <InputField
          label="产权证号"
          value={data.certificateNumber}
          onChange={(v) => updateField('certificateNumber', v)}
          placeholder="请输入产权证号"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="产权人"
          value={data.ownerName}
          onChange={(v) => updateField('ownerName', v)}
          placeholder="请输入产权人名称"
        />
        <InputField
          label="产权到期日"
          icon={Calendar}
          type="date"
          value={data.ownershipExpireDate}
          onChange={(v) => updateField('ownershipExpireDate', v)}
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div className="card-base p-4">
        <h4 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4" />
          消防验收
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="消防验收状态"
            value={data.fireInspectionStatus}
            onChange={(v) => updateField('fireInspectionStatus', v as FireInspectionStatus)}
            options={fireStatuses}
            required
          />
          <InputField
            label="消防验收日期"
            icon={Calendar}
            type="date"
            value={data.fireInspectionDate}
            onChange={(v) => updateField('fireInspectionDate', v)}
            placeholder="YYYY-MM-DD"
          />
        </div>
        {data.fireInspectionStatus && (
          <div className="mt-4">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border backdrop-blur-sm',
                fireStatusColorMap[data.fireInspectionStatus]
              )}
            >
              <Flame className="w-3 h-3" />
              {data.fireInspectionStatus}
            </span>
          </div>
        )}
      </div>

      <div className="card-base p-4">
        <h4 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Box className="w-4 h-4" />
          建筑规格
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputField
            label="层高 (m)"
            type="number"
            value={data.ceilingHeight || ''}
            onChange={(v) => updateField('ceilingHeight', Number(v) || 0)}
            placeholder="如：2.8"
          />
          <InputField
            label="承重 (kg/㎡)"
            type="number"
            value={data.loadCapacity || ''}
            onChange={(v) => updateField('loadCapacity', Number(v) || 0)}
            placeholder="如：350"
          />
          <InputField
            label="柱间距"
            value={data.columnSpacing}
            onChange={(v) => updateField('columnSpacing', v)}
            placeholder="如：9m x 9m"
          />
          <InputField
            label="窗墙比"
            value={data.windowRatio}
            onChange={(v) => updateField('windowRatio', v)}
            placeholder="如：75%"
          />
        </div>
      </div>

      <div className="card-base p-4">
        <h4 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Car className="w-4 h-4" />
          配套设施
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">电梯情况</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateField('hasElevator', true)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                  data.hasElevator
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                    : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                )}
              >
                有电梯
              </button>
              <button
                onClick={() => updateField('hasElevator', false)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                  !data.hasElevator
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                    : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                )}
              >
                无电梯
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">车位情况</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateField('hasParking', true)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                  data.hasParking
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                    : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                )}
              >
                有车位
              </button>
              <button
                onClick={() => updateField('hasParking', false)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                  !data.hasParking
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                    : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                )}
              >
                无车位
              </button>
            </div>
          </div>
          <InputField
            label="车位数量"
            type="number"
            value={data.parkingSpots || ''}
            onChange={(v) => updateField('parkingSpots', Number(v) || 0)}
            placeholder="如：28"
          />
        </div>
      </div>
    </div>
  );
}

function RentClauseStep({
  data,
  onChange,
}: {
  data: FormData['rentClause'];
  onChange: (data: FormData['rentClause']) => void;
}) {
  const updateField = <K extends keyof FormData['rentClause']>(
    key: K,
    value: FormData['rentClause'][K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="月租金"
          icon={Banknote}
          type="number"
          value={data.monthlyRent || ''}
          onChange={(v) => updateField('monthlyRent', Number(v) || 0)}
          placeholder="请输入月租金"
          required
        />
        <SelectField
          label="租金单位"
          value={data.rentUnit}
          onChange={(v) => updateField('rentUnit', v as RentClause['rentUnit'])}
          options={rentUnits}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="年递增率 (%)"
          icon={ArrowUpFromLine}
          type="number"
          value={data.rentIncreaseRate || ''}
          onChange={(v) => updateField('rentIncreaseRate', Number(v) || 0)}
          placeholder="如：5"
        />
        <InputField
          label="押金月数"
          icon={CreditCard}
          type="number"
          value={data.depositMonths || ''}
          onChange={(v) => updateField('depositMonths', Number(v) || 0)}
          placeholder="如：3"
        />
        <InputField
          label="免租期 (天)"
          icon={Clock}
          type="number"
          value={data.freeRentDays || ''}
          onChange={(v) => updateField('freeRentDays', Number(v) || 0)}
          placeholder="如：45"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="最短租期 (月)"
          type="number"
          value={data.minLeaseTerm || ''}
          onChange={(v) => updateField('minLeaseTerm', Number(v) || 0)}
          placeholder="如：24"
        />
        <InputField
          label="最长租期 (月)"
          type="number"
          value={data.maxLeaseTerm || ''}
          onChange={(v) => updateField('maxLeaseTerm', Number(v) || 0)}
          placeholder="如：60"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-2">
          付款方式
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => updateField('paymentMethod', method)}
              className={cn(
                'relative p-3 rounded-lg text-sm font-medium border transition-all',
                data.paymentMethod === method
                  ? 'bg-gradient-to-br from-gold-500/20 to-gold-400/10 border-gold-500/40 text-gold-300'
                  : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-gold-500/30'
              )}
            >
              {method}
              {data.paymentMethod === method && (
                <Check className="absolute top-2 right-2 w-3 h-3 text-gold-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card-base p-4 bg-gradient-to-br from-gold-500/5 to-transparent">
        <h4 className="text-sm font-semibold text-gold-300 mb-3 flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          费用估算示例
        </h4>
        {data.monthlyRent > 0 && data.depositMonths > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-neutral-500 text-xs">首月租金</p>
              <p className="text-lg font-bold text-gold-300">¥{data.monthlyRent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs">押金</p>
              <p className="text-lg font-bold text-neutral-200">
                ¥{(data.monthlyRent * data.depositMonths).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs">首付金额</p>
              <p className="text-lg font-bold text-emerald-400">
                ¥{(data.monthlyRent * (data.depositMonths + 1)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs">首年租金</p>
              <p className="text-lg font-bold text-blue-400">
                ¥{(data.monthlyRent * 12).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewStep({ data }: { data: FormData }) {
  const { basicInfo, vrScenes, ownership, rentClause } = data;

  const InfoItem = ({ label, value, icon: Icon }: { label: string; value: string; icon?: ComponentType<{ className?: string }> }) => (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gold-400/70 mt-0.5 shrink-0" />}
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm text-neutral-200">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-bold text-gold-300">基础信息</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label="房源名称" value={basicInfo.name} icon={Building2} />
          <InfoItem label="房源编号" value={basicInfo.code} />
          <InfoItem label="房源类型" value={basicInfo.type} />
          <InfoItem
            label="地址"
            value={`${basicInfo.province} ${basicInfo.city} ${basicInfo.district} ${basicInfo.address}`}
            icon={MapPin}
          />
          <InfoItem label="楼层" value={`${basicInfo.floor} / ${basicInfo.totalFloors}层`} icon={Layers} />
          <InfoItem label="总面积" value={`${basicInfo.area} ㎡`} icon={Ruler} />
          <InfoItem label="实用面积" value={`${basicInfo.usableArea} ㎡`} icon={Maximize2} />
        </div>
        {basicInfo.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gold-500/10">
            <p className="text-xs text-neutral-500 mb-2">房源标签</p>
            <div className="flex flex-wrap gap-1.5">
              {basicInfo.tags.map((tag) => (
                <span key={tag} className="chip chip-gold text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {vrScenes.length > 0 && (
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-gold-400" />
            <h3 className="text-lg font-bold text-gold-300">VR场景</h3>
            <span className="chip text-xs">{vrScenes.length} 个场景</span>
          </div>
          <div className="divider-gold mb-4" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {vrScenes.map((scene) => (
              <div key={scene.id} className="relative rounded-lg overflow-hidden">
                {scene.previewUrl ? (
                  <img
                    src={scene.previewUrl}
                    alt={scene.name}
                    className="w-full h-20 object-cover"
                  />
                ) : (
                  <div className="w-full h-20 bg-primary-700/50 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent" />
                <p className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-neutral-200 font-medium truncate px-1">
                  {scene.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-bold text-gold-300">产权信息</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label="产权类型" value={ownership.type} />
          <InfoItem label="产权证号" value={ownership.certificateNumber} />
          <InfoItem label="产权人" value={ownership.ownerName} />
          <InfoItem label="产权到期日" value={ownership.ownershipExpireDate} icon={Calendar} />
          <div>
            <p className="text-xs text-neutral-500 mb-1">消防验收状态</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border',
                fireStatusColorMap[ownership.fireInspectionStatus]
              )}
            >
              <Flame className="w-3 h-3" />
              {ownership.fireInspectionStatus}
            </span>
          </div>
          <InfoItem label="消防验收日期" value={ownership.fireInspectionDate} />
        </div>
        <div className="mt-4 pt-4 border-t border-gold-500/10">
          <p className="text-xs text-neutral-500 mb-3">建筑规格</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem label="层高" value={`${ownership.ceilingHeight} m`} icon={Layers} />
            <InfoItem label="承重" value={`${ownership.loadCapacity} kg/㎡`} icon={Box} />
            <InfoItem label="柱间距" value={ownership.columnSpacing} />
            <InfoItem label="窗墙比" value={ownership.windowRatio} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gold-500/10">
          <p className="text-xs text-neutral-500 mb-3">配套设施</p>
          <div className="flex flex-wrap gap-3">
            <span className={cn('chip', ownership.hasElevator ? 'chip-gold' : '')}>
              {ownership.hasElevator ? '✓ 有电梯' : '✗ 无电梯'}
            </span>
            <span className={cn('chip', ownership.hasParking ? 'chip-gold' : '')}>
              {ownership.hasParking ? `✓ 有车位 (${ownership.parkingSpots}个)` : '✗ 无车位'}
            </span>
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-bold text-gold-300">租赁条款</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-neutral-500">月租金</p>
            <p className="text-xl font-bold bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
              ¥{rentClause.monthlyRent.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">{rentClause.rentUnit}</p>
          </div>
          <InfoItem label="年递增率" value={`${rentClause.rentIncreaseRate}%`} icon={ArrowUpFromLine} />
          <InfoItem label="押金" value={`${rentClause.depositMonths} 个月`} icon={CreditCard} />
          <InfoItem label="免租期" value={`${rentClause.freeRentDays} 天`} icon={Clock} />
          <InfoItem label="最短租期" value={`${rentClause.minLeaseTerm} 个月`} />
          <InfoItem label="最长租期" value={`${rentClause.maxLeaseTerm} 个月`} />
          <InfoItem label="付款方式" value={rentClause.paymentMethod} />
        </div>
      </div>
    </div>
  );
}

export default function Publish() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleNext = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsPublishing(false);
    navigate('/properties');
  };

  const renderStepContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <BasicInfoStep
            data={formData.basicInfo}
            onChange={(v) => setFormData({ ...formData, basicInfo: v })}
          />
        );
      case 1:
        return (
          <VrUploadStep
            data={formData.vrScenes}
            onChange={(v) => setFormData({ ...formData, vrScenes: v })}
          />
        );
      case 2:
        return (
          <OwnershipStep
            data={formData.ownership}
            onChange={(v) => setFormData({ ...formData, ownership: v })}
          />
        );
      case 3:
        return (
          <RentClauseStep
            data={formData.rentClause}
            onChange={(v) => setFormData({ ...formData, rentClause: v })}
          />
        );
      case 4:
        return <PreviewStep data={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-mesh-tech p-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/properties')}
              className="w-10 h-10 rounded-lg bg-primary-800/50 border border-gold-500/10 flex items-center justify-center text-neutral-400 hover:text-gold-300 hover:border-gold-500/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold animate-shimmer-gold">发布房源</h1>
              <p className="mt-1 text-sm text-neutral-400">完善房源信息，发布优质房源</p>
            </div>
          </div>
        </motion.div>

        <TabHeader activeTab={activeTab} onTabClick={setActiveTab} />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="card-base p-6 mb-6"
        >
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </motion.div>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={activeTab === 0}
            className={cn(
              'btn-primary',
              activeTab === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>

          <div className="flex items-center gap-2">
            {tabs.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === activeTab
                    ? 'bg-gold-400 w-6'
                    : index < activeTab
                    ? 'bg-emerald-400'
                    : 'bg-neutral-600'
                )}
              />
            ))}
          </div>

          {activeTab < tabs.length - 1 ? (
            <button onClick={handleNext} className="btn-gold">
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="btn-gold"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-700 border-t-current rounded-full animate-spin" />
                  发布中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  确认发布
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Maximize2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}
