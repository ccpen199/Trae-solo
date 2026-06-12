import { useState, useMemo } from 'react';
import { create } from 'zustand';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select, InputNumber, Radio, Card, Collapse, Button, Badge,
  Progress, message, Tooltip, Divider, Space
} from 'antd';
import type { CollapseProps, RadioChangeEvent } from 'antd';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
  Home, MapPin, Maximize2, Building2, Hammer, Check, ChevronRight,
  Save, FileText, ArrowRightLeft, Crown, Star, Coins, Plus, Minus,
  Palette, ShieldCheck, Clock, Award, Gem
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CITY_COEFFICIENTS: Record<string, number> = {
  '北京市': 1.0, '上海市': 1.05, '广州市': 1.1, '深圳市': 1.1,
  '杭州市': 0.9, '成都市': 0.9, '武汉市': 0.85, '南京市': 0.9,
  '重庆市': 0.85, '苏州市': 0.9, '西安市': 0.85, '天津市': 0.9,
  '长沙市': 0.85, '郑州市': 0.85, '青岛市': 0.85, '厦门市': 0.9,
  '宁波市': 0.9, '无锡市': 0.85, '佛山市': 0.9, '大连市': 0.85,
};

const CITIES = Object.keys(CITY_COEFFICIENTS);

const HOUSE_TYPES = ['一室', '两室', '三室', '四室', '复式/别墅'] as const;

const CRAFT_LEVELS = [
  { key: 'basic', name: '基础工艺', desc: '满足国标要求', multiplier: 1.0, color: 'carbon' },
  { key: 'standard', name: '标准工艺', desc: '推荐·耐用10年+', multiplier: 1.2, color: 'terracotta' },
  { key: 'premium', name: '精品工艺', desc: '匠心工艺·终身维护', multiplier: 1.5, color: 'gold' },
] as const;

type CraftLevelKey = typeof CRAFT_LEVELS[number]['key'];

interface RoomItem {
  key: string;
  name: string;
  count: number;
  area: number;
  icon: typeof Home;
}

interface MaterialItem {
  name: string;
  brand: string;
  spec: string;
  quantity: number;
  unit: string;
  price: number;
  brands: { name: string; priceAdj: number }[];
}

interface CostCategory {
  key: string;
  name: string;
  ratio: number;
  items: MaterialItem[];
}

interface QuoteState {
  city: string;
  area: number;
  houseType: string;
  rooms: RoomItem[];
  craftLevel: CraftLevelKey;
  designerLevel: number;
  materialSelections: Record<string, Record<string, number>>;
  setCity: (city: string) => void;
  setArea: (area: number) => void;
  setHouseType: (type: string) => void;
  setRooms: (rooms: RoomItem[]) => void;
  setCraftLevel: (level: CraftLevelKey) => void;
  setDesignerLevel: (level: number) => void;
  setMaterialBrand: (catKey: string, itemIdx: number, brandIdx: number) => void;
}

const initialRooms: RoomItem[] = [
  { key: 'living', name: '客厅', count: 1, area: 25, icon: Home },
  { key: 'bedroom', name: '卧室', count: 3, area: 15, icon: Building2 },
  { key: 'kitchen', name: '厨房', count: 1, area: 8, icon: Home },
  { key: 'bathroom', name: '卫生间', count: 2, area: 5, icon: Home },
  { key: 'balcony', name: '阳台', count: 1, area: 6, icon: Home },
  { key: 'dining', name: '餐厅', count: 1, area: 12, icon: Home },
];

const useQuoteStore = create<QuoteState>((set) => ({
  city: '北京市',
  area: 90,
  houseType: '三室',
  rooms: initialRooms,
  craftLevel: 'standard',
  designerLevel: 1,
  materialSelections: {},
  setCity: (city) => set({ city }),
  setArea: (area) => set({ area }),
  setHouseType: (houseType) => set({ houseType }),
  setRooms: (rooms) => set({ rooms }),
  setCraftLevel: (craftLevel) => set({ craftLevel }),
  setDesignerLevel: (designerLevel) => set({ designerLevel }),
  setMaterialBrand: (catKey, itemIdx, brandIdx) =>
    set((state) => ({
      materialSelections: {
        ...state.materialSelections,
        [catKey]: {
          ...state.materialSelections[catKey],
          [itemIdx]: brandIdx,
        },
      },
    })),
}));

const schema = z.object({
  city: z.string(),
  area: z.number().min(20).max(1000),
  houseType: z.string(),
});

const TIER_BASE_PRICES = { economy: 1200, quality: 1800, luxury: 3000 };

function useQuoteCalculator() {
  const { city, area, craftLevel, designerLevel, materialSelections } = useQuoteStore();
  const cityCoeff = CITY_COEFFICIENTS[city] ?? 0.85;
  const craftMult = CRAFT_LEVELS.find((c) => c.key === craftLevel)?.multiplier ?? 1.2;

  return useMemo(() => {
    const baseCalc = (tier: keyof typeof TIER_BASE_PRICES) => {
      const base = area * TIER_BASE_PRICES[tier] * cityCoeff * craftMult;
      return Math.round(base);
    };

    const economy = baseCalc('economy');
    const quality = baseCalc('quality');
    const luxury = baseCalc('luxury');

    const ratios = { main: 0.45, aux: 0.15, labor: 0.25, design: 0.08, mgmt: 0.07 };

    const buildCategory = (
      key: string,
      name: string,
      ratio: number,
      total: number,
      template: Omit<MaterialItem, 'price'>[]
    ): CostCategory => {
      const catTotal = total * ratio;
      let running = 0;
      const items = template.map((tpl, idx) => {
        const brandIdx = materialSelections[key]?.[idx] ?? 0;
        const brandAdj = tpl.brands[brandIdx]?.priceAdj ?? 0;
        const baseItemPrice = (catTotal / template.length) * (1 + brandAdj);
        const finalPrice = Math.round(baseItemPrice / tpl.quantity);
        running += finalPrice * tpl.quantity;
        return { ...tpl, price: finalPrice };
      });
      const diff = Math.round(catTotal) - running;
      if (items.length > 0 && diff !== 0) {
        items[items.length - 1].price += Math.ceil(diff / items[items.length - 1].quantity);
      }
      return { key, name, ratio, items };
    };

    const mainTemplate: Omit<MaterialItem, 'price'>[] = [
      { name: '地板', brand: '圣象', spec: 'E0级实木复合 15mm', quantity: Math.round(area * 0.7), unit: '㎡', brands: [{ name: '圣象', priceAdj: 0 }, { name: '大自然', priceAdj: 0.08 }, { name: '菲林格尔', priceAdj: 0.15 }] },
      { name: '瓷砖', brand: '东鹏', spec: '800×800mm 通体大理石', quantity: Math.round(area * 0.5), unit: '㎡', brands: [{ name: '东鹏', priceAdj: 0 }, { name: '马可波罗', priceAdj: 0.1 }, { name: '诺贝尔', priceAdj: 0.18 }] },
      { name: '洁具', brand: '箭牌', spec: '马桶+浴室柜+花洒套装', quantity: useQuoteStore.getState().rooms.find(r => r.key === 'bathroom')?.count ?? 2, unit: '套', brands: [{ name: '箭牌', priceAdj: 0 }, { name: '恒洁', priceAdj: 0.12 }, { name: 'TOTO', priceAdj: 0.35 }] },
      { name: '橱柜', brand: '欧派', spec: '石英石台面+地柜3m+吊柜1.5m', quantity: 1, unit: '套', brands: [{ name: '欧派', priceAdj: 0 }, { name: '志邦', priceAdj: 0.08 }, { name: '索菲亚', priceAdj: 0.2 }] },
      { name: '门窗', brand: 'TATA', spec: '实木复合门+五金', quantity: useQuoteStore.getState().rooms.reduce((s, r) => s + r.count, 0) + 2, unit: '樘', brands: [{ name: 'TATA', priceAdj: 0 }, { name: '美心', priceAdj: -0.05 }, { name: '梦天', priceAdj: 0.15 }] },
      { name: '灯具', brand: '雷士', spec: '主灯+筒灯+灯带全屋套装', quantity: 1, unit: '套', brands: [{ name: '雷士', priceAdj: 0 }, { name: '欧普', priceAdj: 0.06 }, { name: '飞利浦', priceAdj: 0.2 }] },
    ];

    const auxTemplate: Omit<MaterialItem, 'price'>[] = [
      { name: '水电材料', brand: '伟星', spec: 'PPR水管+BV电线+穿线管', quantity: area, unit: '㎡', brands: [{ name: '伟星', priceAdj: 0 }, { name: '金牛', priceAdj: -0.05 }, { name: '日丰', priceAdj: 0.08 }] },
      { name: '木工板', brand: '兔宝宝', spec: 'E0级多层实木板 18mm', quantity: Math.round(area * 0.3), unit: '张', brands: [{ name: '兔宝宝', priceAdj: 0 }, { name: '莫干山', priceAdj: 0.05 }, { name: '千年舟', priceAdj: 0.03 }] },
      { name: '乳胶漆', brand: '多乐士', spec: '净味竹炭五合一 面漆', quantity: Math.ceil(area * 2.5 / 35), unit: '桶', brands: [{ name: '多乐士', priceAdj: 0 }, { name: '立邦', priceAdj: 0.05 }, { name: '芬琳', priceAdj: 0.4 }] },
      { name: '胶粘剂', brand: '德高', spec: '瓷砖胶+防水胶+结构胶', quantity: Math.round(area * 0.15), unit: '袋', brands: [{ name: '德高', priceAdj: 0 }, { name: '东方雨虹', priceAdj: 0.03 }, { name: '西卡', priceAdj: 0.15 }] },
      { name: '防水材料', brand: '东方雨虹', spec: '厨卫防水浆料', quantity: Math.round(area * 0.18), unit: '㎡', brands: [{ name: '东方雨虹', priceAdj: 0 }, { name: '德高', priceAdj: 0.08 }, { name: '卓宝', priceAdj: 0.1 }] },
      { name: '五金配件', brand: '海蒂诗', spec: '铰链+滑轨+拉手套装', quantity: useQuoteStore.getState().rooms.reduce((s, r) => s + r.count, 0) * 2, unit: '套', brands: [{ name: '海蒂诗', priceAdj: 0 }, { name: '百隆', priceAdj: 0.15 }, { name: 'DTC', priceAdj: -0.1 }] },
    ];

    const laborTemplate: Omit<MaterialItem, 'price'>[] = [
      { name: '水电工', brand: '持证上岗', spec: '开槽+布管+穿线+安装', quantity: Math.ceil(area / 15), unit: '天', brands: [{ name: '标准工', priceAdj: 0 }, { name: '精工队', priceAdj: 0.15 }, { name: '金牌工', priceAdj: 0.3 }] },
      { name: '泥瓦工', brand: '持证上岗', spec: '贴砖+找平+防水施工', quantity: Math.ceil(area / 12), unit: '天', brands: [{ name: '标准工', priceAdj: 0 }, { name: '精工队', priceAdj: 0.15 }, { name: '金牌工', priceAdj: 0.3 }] },
      { name: '木工', brand: '持证上岗', spec: '吊顶+柜子+造型制作', quantity: Math.ceil(area / 20), unit: '天', brands: [{ name: '标准工', priceAdj: 0 }, { name: '精工队', priceAdj: 0.15 }, { name: '金牌工', priceAdj: 0.3 }] },
      { name: '油漆工', brand: '持证上岗', spec: '批灰+打磨+涂刷', quantity: Math.ceil(area / 10), unit: '天', brands: [{ name: '标准工', priceAdj: 0 }, { name: '精工队', priceAdj: 0.15 }, { name: '金牌工', priceAdj: 0.3 }] },
      { name: '安装工', brand: '持证上岗', spec: '灯具+洁具+五金安装', quantity: Math.ceil(area / 30), unit: '天', brands: [{ name: '标准工', priceAdj: 0 }, { name: '精工队', priceAdj: 0.15 }, { name: '金牌工', priceAdj: 0.3 }] },
    ];

    const designerTiers = [
      { name: '普通设计师', pricePerSqm: 50 },
      { name: '资深设计师', pricePerSqm: 100 },
      { name: '首席设计师', pricePerSqm: 200 },
      { name: '设计总监', pricePerSqm: 400 },
    ];
    const dTier = designerTiers[designerLevel] ?? designerTiers[1];
    const designTemplate: Omit<MaterialItem, 'price'>[] = [
      { name: dTier.name, brand: dTier.name, spec: '方案+施工图+3D效果图+软装搭配', quantity: area, unit: '㎡', brands: designerTiers.map((t) => ({ name: t.name, priceAdj: (t.pricePerSqm - dTier.pricePerSqm) / dTier.pricePerSqm })) },
    ];

    const mgmtTemplate: Omit<MaterialItem, 'price'>[] = [
      { name: '垃圾清运费', brand: '物业标准', spec: '装修垃圾清运至指定点', quantity: 1, unit: '项', brands: [{ name: '标准', priceAdj: 0 }, { name: '加运', priceAdj: 0.3 }, { name: '外运', priceAdj: 0.6 }] },
      { name: '材料搬运费', brand: '人工搬运', spec: '建材搬运至施工现场', quantity: area, unit: '㎡', brands: [{ name: '人工', priceAdj: 0 }, { name: '机械', priceAdj: 0.2 }, { name: '专人', priceAdj: 0.4 }] },
      { name: '成品保护费', brand: '专业保护膜', spec: '入户+公共区域保护', quantity: area, unit: '㎡', brands: [{ name: '标准膜', priceAdj: 0 }, { name: '加厚膜', priceAdj: 0.25 }, { name: '定制膜', priceAdj: 0.5 }] },
      { name: '项目管理费', brand: '监理+巡检', spec: '全程施工管理+8次节点验收', quantity: 1, unit: '项', brands: [{ name: '标准', priceAdj: 0 }, { name: '资深', priceAdj: 0.2 }, { name: '专属', priceAdj: 0.5 }] },
      { name: '税金', brand: '增值税', spec: '3.36% 增值税专票', quantity: 1, unit: '项', brands: [{ name: '专票', priceAdj: 0 }, { name: '普票', priceAdj: -0.01 }, { name: '不开票', priceAdj: -0.03 }] },
    ];

    const buildAllCategories = (total: number): CostCategory[] => [
      buildCategory('main', '主材费', ratios.main, total, mainTemplate),
      buildCategory('aux', '辅材费', ratios.aux, total, auxTemplate),
      buildCategory('labor', '人工费', ratios.labor, total, laborTemplate),
      buildCategory('design', '设计费', ratios.design, total, designTemplate),
      buildCategory('mgmt', '管理费 & 其他', ratios.mgmt, total, mgmtTemplate),
    ];

    return {
      economy, quality, luxury,
      cityCoeff, craftMult,
      categories: buildAllCategories(quality),
      pieData: [
        { name: '主材费', value: Math.round(quality * ratios.main), color: '#C4623A' },
        { name: '辅材费', value: Math.round(quality * ratios.aux), color: '#CBA356' },
        { name: '人工费', value: Math.round(quality * ratios.labor), color: '#6B8E9F' },
        { name: '设计费', value: Math.round(quality * ratios.design), color: '#B8857' },
        { name: '管理费', value: Math.round(quality * ratios.mgmt), color: '#707070' },
      ],
    };
  }, [city, area, craftLevel, designerLevel, materialSelections]);
}

const STEPS = [
  { key: 1, title: '城市面积', icon: MapPin },
  { key: 2, title: '户型结构', icon: Building2 },
  { key: 3, title: '工艺等级', icon: Hammer },
];

function StepCapsules({ current, onChange }: { current: number; onChange: (s: number) => void }) {
  return (
    <div className="flex items-center gap-2 p-1 bg-ivory-100 rounded-2xl mb-6">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = current > s.key;
        const active = current === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 font-medium text-sm',
              active && 'bg-terracotta-500 text-white shadow-glow-terracotta',
              done && !active && 'bg-terracotta-100 text-terracotta-700',
              !active && !done && 'text-carbon-500 hover:bg-ivory-200'
            )}
          >
            <span className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              active && 'bg-white/20 text-white',
              done && !active && 'bg-terracotta-500 text-white',
              !active && !done && 'bg-ivory-300 text-carbon-600'
            )}>
              {done ? <Check className="w-3.5 h-3.5" /> : s.key}
            </span>
            <Icon className="w-4 h-4" />
            <span>{s.title}</span>
            {i < STEPS.length - 1 && (
              <ChevronRight className={cn('w-4 h-4 ml-2', active && 'opacity-50')} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Step1CityArea() {
  const { control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { city: '北京市', area: 90, houseType: '三室' },
    mode: 'onChange',
  });
  const city = useQuoteStore((s) => s.city);
  const area = useQuoteStore((s) => s.area);
  const houseType = useQuoteStore((s) => s.houseType);
  const setCity = useQuoteStore((s) => s.setCity);
  const setArea = useQuoteStore((s) => s.setArea);
  const setHouseType = useQuoteStore((s) => s.setHouseType);

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
      <div>
        <label className="block text-sm font-semibold text-carbon-700 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-terracotta-500" /> 选择城市
        </label>
        <Controller
          name="city"
          control={control}
          render={() => (
            <Select
              value={city}
              onChange={setCity}
              options={CITIES.map((c) => ({ value: c, label: c }))}
              className="w-full"
              size="large"
              style={{ borderRadius: 12 }}
            />
          )}
        />
        <div className="mt-1.5 text-xs text-carbon-500">
          城市系数：×{(CITY_COEFFICIENTS[city] ?? 0.85).toFixed(2)}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-carbon-700 mb-2 flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-terracotta-500" /> 房屋面积
        </label>
        <div className="flex items-end gap-4">
          <Controller
            name="area"
            control={control}
            render={() => (
              <InputNumber
                value={area}
                onChange={(v) => v != null && setArea(v)}
                min={20}
                max={1000}
                size="large"
                className="w-48"
                addonAfter="㎡"
                style={{ borderRadius: 12 }}
              />
            )}
          />
          <span className="text-xs text-carbon-500 pb-2.5">
            （参考：两室一厅约80-100㎡）
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-carbon-700 mb-2 flex items-center gap-2">
          <Home className="w-4 h-4 text-terracotta-500" /> 户型选择
        </label>
        <Controller
          name="houseType"
          control={control}
          render={() => (
            <Radio.Group
              value={houseType}
              onChange={(e: RadioChangeEvent) => setHouseType(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              className="w-full flex flex-wrap gap-2"
            >
              {HOUSE_TYPES.map((t) => (
                <Radio.Button
                  key={t}
                  value={t}
                  className={cn(
                    '!px-5 !py-2.5 !rounded-xl !border-none transition-all',
                    houseType === t
                      ? '!bg-terracotta-500 !text-white shadow-glow-terracotta'
                      : '!bg-ivory-200 !text-carbon-600 hover:!bg-ivory-300'
                  )}
                >
                  {t}
                </Radio.Button>
              ))}
            </Radio.Group>
          )}
        />
      </div>
    </div>
  );
}

function Step2Rooms() {
  const rooms = useQuoteStore((s) => s.rooms);
  const setRooms = useQuoteStore((s) => s.setRooms);
  const totalArea = rooms.reduce((s, r) => s + r.count * r.area, 0);
  const configuredArea = useQuoteStore((s) => s.area);
  const diff = totalArea - configuredArea;

  const updateRoom = (key: string, patch: Partial<RoomItem>) => {
    setRooms(rooms.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
      <div className={cn(
        'flex items-center justify-between p-3 rounded-xl text-sm',
        Math.abs(diff) <= 5 ? 'bg-haze-50 text-haze-700' : 'bg-terracotta-50 text-terracotta-700'
      )}>
        <span>当前配置总面积：<b>{totalArea}</b> ㎡</span>
        <span>
          与输入面积 {configuredArea}㎡ 对比：
          <b className={cn(Math.abs(diff) > 5 && 'text-terracotta-600')}>
            {diff > 0 ? '+' : ''}{diff}㎡
          </b>
        </span>
      </div>

      {rooms.map((r) => (
        <Card
          key={r.key}
          size="small"
          className="!rounded-2xl !border-ivory-200 hover:!border-terracotta-200 transition-all"
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-[120px]">
              <div className="w-10 h-10 rounded-xl bg-terracotta-50 flex items-center justify-center">
                <r.icon className="w-5 h-5 text-terracotta-500" />
              </div>
              <span className="font-semibold text-carbon-700">{r.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-carbon-500">数量</span>
              <button
                onClick={() => updateRoom(r.key, { count: Math.max(1, r.count - 1) })}
                className="w-7 h-7 rounded-lg bg-ivory-200 hover:bg-terracotta-100 hover:text-terracotta-600 text-carbon-600 flex items-center justify-center transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-semibold text-carbon-800">{r.count}</span>
              <button
                onClick={() => updateRoom(r.key, { count: Math.min(20, r.count + 1) })}
                className="w-7 h-7 rounded-lg bg-ivory-200 hover:bg-terracotta-100 hover:text-terracotta-600 text-carbon-600 flex items-center justify-center transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-carbon-500">单面积 (㎡)</span>
              <InputNumber
                value={r.area}
                onChange={(v) => v != null && updateRoom(r.key, { area: v })}
                min={2}
                max={200}
                size="small"
                className="w-24"
                style={{ borderRadius: 8 }}
              />
            </div>

            <div className="text-sm font-semibold text-terracotta-600 min-w-[80px] text-right">
              小计 {r.count * r.area}㎡
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

const CRAFT_DETAILS: Record<string, string[]> = {
  basic: [
    '水管：国标PPR，25mm管径',
    '电线：BV单芯，普通穿线',
    '防水：厨卫两遍涂刷',
    '瓷砖：普通水泥砂浆铺贴',
    '吊顶：轻钢龙骨+石膏板',
    '墙面：普通批灰+两道腻子',
  ],
  standard: [
    '水管：品牌PPR，6分管+纳米抗菌',
    '电线：阻燃多股软线+锡焊工艺',
    '防水：柔性三遍+72小时闭水试验',
    '瓷砖：薄贴法+瓷砖胶+振动找平',
    '吊顶：全轻钢龙骨+双层石膏板',
    '墙面：耐水腻子+全屋挂网防裂',
  ],
  premium: [
    '水管：进口PPR+紫铜管件+热熔升级',
    '电线：低烟无卤+独立回路+施耐德箱',
    '防水：全屋柔性+墙刚地柔+终身质保',
    '瓷砖：德系薄贴+调平器+全屋对缝',
    '吊顶：进口澳松板+隔音棉+L型整板',
    '墙面：冲筋找平+三层腻子+射灯验收',
  ],
};

function Step3Craft() {
  const craftLevel = useQuoteStore((s) => s.craftLevel);
  const setCraftLevel = useQuoteStore((s) => s.setCraftLevel);
  const [expanded, setExpanded] = useState<string>(craftLevel);

  const cardStyle = (key: string) => {
    if (key === 'basic') return 'border-carbon-300 hover:border-carbon-400';
    if (key === 'standard') return 'border-terracotta-400 hover:border-terracotta-500';
    return 'border-yellow-400 hover:border-yellow-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-[fadeIn_0.3s_ease]">
      {CRAFT_LEVELS.map((c) => {
        const selected = craftLevel === c.key;
        return (
          <div
            key={c.key}
            onClick={() => {
              setCraftLevel(c.key as CraftLevelKey);
              setExpanded(c.key);
            }}
            className={cn(
              'cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300',
              cardStyle(c.key),
              selected && c.key === 'standard' && 'shadow-glow-terracotta bg-terracotta-50/30',
              selected && c.key === 'premium' && 'shadow-[0_0_24px_rgba(202,138,4,0.25)] bg-yellow-50/30',
              selected && c.key === 'basic' && 'shadow-[0_0_20px_rgba(112,112,112,0.2)] bg-carbon-50/50',
              !selected && 'bg-white hover:-translate-y-0.5'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {c.key === 'basic' && <Coins className="w-5 h-5 text-carbon-500" />}
                  {c.key === 'standard' && <Star className="w-5 h-5 text-terracotta-500 fill-terracotta-500" />}
                  {c.key === 'premium' && <Gem className="w-5 h-5 text-yellow-500" />}
                  <h4 className={cn(
                    'text-lg font-bold',
                    c.key === 'basic' && 'text-carbon-700',
                    c.key === 'standard' && 'text-terracotta-600',
                    c.key === 'premium' && 'text-yellow-700'
                  )}>{c.name}</h4>
                </div>
                <p className={cn(
                  'text-xs',
                  c.key === 'basic' && 'text-carbon-500',
                  c.key === 'standard' && 'text-terracotta-500',
                  c.key === 'premium' && 'text-yellow-600'
                )}>{c.desc}</p>
              </div>
              <div className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                selected ? (
                  c.key === 'standard' ? 'bg-terracotta-500 border-terracotta-500' :
                  c.key === 'premium' ? 'bg-yellow-500 border-yellow-500' :
                  'bg-carbon-500 border-carbon-500'
                ) : 'border-carbon-300'
              )}>
                {selected && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>

            <div className={cn(
              'text-center py-3 rounded-xl font-bold text-2xl mb-4',
              c.key === 'basic' && 'bg-carbon-50 text-carbon-700',
              c.key === 'standard' && 'bg-terracotta-100 text-terracotta-700',
              c.key === 'premium' && 'bg-yellow-50 text-yellow-700'
            )}>
              {c.multiplier}x <span className="text-sm font-normal">人工系数</span>
            </div>

            {c.key === 'standard' && (
              <Badge.Ribbon text="最受欢迎" color="#C4623A" className="absolute -top-1">
                <div></div>
              </Badge.Ribbon>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(expanded === c.key ? '' : c.key); }}
              className={cn(
                'w-full text-xs py-1.5 rounded-lg mb-2 transition-all',
                c.key === 'basic' && 'bg-carbon-100 text-carbon-600 hover:bg-carbon-200',
                c.key === 'standard' && 'bg-terracotta-100 text-terracotta-600 hover:bg-terracotta-200',
                c.key === 'premium' && 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              )}
            >
              {expanded === c.key ? '收起工艺细节 ▲' : '展开工艺细节 ▼'}
            </button>

            {expanded === c.key && (
              <ul className="space-y-1.5 animate-[slideDown_0.25s_ease]">
                {CRAFT_DETAILS[c.key].map((d, i) => (
                  <li key={i} className="text-xs text-carbon-600 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 mt-0.5 text-haze-500 flex-shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CostBreakdown() {
  const { categories } = useQuoteCalculator();
  const setMaterialBrand = useQuoteStore((s) => s.setMaterialBrand);
  const calc = useQuoteCalculator();
  const total = categories.reduce((s, c) =>
    s + c.items.reduce((si, it) => si + it.price * it.quantity, 0), 0);

  const items: CollapseProps['items'] = categories.map((cat) => {
    const catTotal = cat.items.reduce((s, it) => s + it.price * it.quantity, 0);
    const percent = Math.round((catTotal / total) * 100);
    const barData = cat.items.map((it) => ({
      name: it.name,
      value: Math.round(it.price * it.quantity),
    }));

    return {
      key: cat.key,
      label: (
        <div className="flex items-center justify-between w-full pr-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-carbon-800">{cat.name}</span>
            <Badge
              count={`${percent}%`}
              showZero
              color={
                cat.key === 'main' ? '#C4623A' :
                cat.key === 'aux' ? '#CBA356' :
                cat.key === 'labor' ? '#6B8E9F' :
                cat.key === 'design' ? '#B8857' : '#707070'
              }
              className="!-translate-y-0"
            />
          </div>
          <span className="font-bold text-lg text-carbon-900">
            ¥{catTotal.toLocaleString()}
          </span>
        </div>
      ),
      children: (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-ivory-200">
            <table className="w-full text-sm">
              <thead className="bg-ivory-100">
                <tr className="text-xs text-carbon-600">
                  <th className="text-left p-3 font-semibold">名称</th>
                  <th className="text-left p-3 font-semibold">品牌</th>
                  <th className="text-left p-3 font-semibold">规格</th>
                  <th className="text-right p-3 font-semibold">数量</th>
                  <th className="text-right p-3 font-semibold">单价</th>
                  <th className="text-right p-3 font-semibold">小计</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((it, idx) => (
                  <tr key={idx} className="border-t border-ivory-100 hover:bg-ivory-50/50 transition-colors">
                    <td className="p-3 font-medium text-carbon-700">{it.name}</td>
                    <td className="p-3">
                      <Select
                        value={it.brand}
                        onChange={(_, option: any) => {
                          const brandIdx = it.brands.findIndex((b) => b.name === option.value);
                          if (brandIdx >= 0) setMaterialBrand(cat.key, idx, brandIdx);
                        }}
                        options={it.brands.map((b) => ({
                          value: b.name,
                          label: (
                            <span className="flex justify-between w-full gap-4">
                              <span>{b.name}</span>
                              <span className={cn(
                                b.priceAdj > 0 ? 'text-terracotta-500' :
                                b.priceAdj < 0 ? 'text-haze-600' : 'text-carbon-400'
                              )}>
                                {b.priceAdj > 0 ? '+' : ''}{(b.priceAdj * 100).toFixed(0)}%
                              </span>
                            </span>
                          ),
                        }))}
                        size="small"
                        style={{ width: 120, borderRadius: 8 }}
                        popupMatchSelectWidth={false}
                      />
                    </td>
                    <td className="p-3 text-xs text-carbon-500">{it.spec}</td>
                    <td className="p-3 text-right text-carbon-600">{it.quantity}{it.unit}</td>
                    <td className="p-3 text-right text-carbon-600">¥{it.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold text-terracotta-600">
                      ¥{(it.price * it.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-ivory-50 p-3">
            <div className="text-xs text-carbon-500 mb-2">该类项目金额分布</div>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer>
                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    formatter={(v: number) => [`¥${v.toLocaleString()}`, '金额']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E8E4DD', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#C4623A" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Progress
            percent={percent}
            showInfo={false}
            strokeColor={
              cat.key === 'main' ? '#C4623A' :
              cat.key === 'aux' ? '#CBA356' :
              cat.key === 'labor' ? '#6B8E9F' :
              cat.key === 'design' ? '#B8857' : '#707070'
            }
            trailColor="#F5F2ED"
            strokeLinecap="round"
          />
        </div>
      ),
    };
  });

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-carbon-800 mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5 text-terracotta-500" />
        报价明细
      </h3>
      <Collapse
        items={items.map(item => ({ ...item, style: { paddingInline: 16 } }))}
        defaultActiveKey={['main']}
        size="large"
        className="!rounded-2xl !border-ivory-200 overflow-hidden"
        accordion={false}
      />
      {calc.categories[0] && null}
    </div>
  );
}

interface TierCardProps {
  tier: 'economy' | 'quality' | 'luxury';
  price: number;
  highlight?: boolean;
}

function TierCard({ tier, price, highlight }: TierCardProps) {
  const config = {
    economy: {
      name: '经济档', icon: Coins, border: 'border-carbon-300', badge: null,
      bg: 'bg-white', headerBg: 'bg-carbon-50', titleColor: 'text-carbon-700',
      features: ['品牌主材', '标准工艺'], period: 60,
      warranty: ['基础2年', '水电5年'], accent: '#707070',
    },
    quality: {
      name: '品质档', icon: Star, border: 'border-terracotta-400', badge: '最受欢迎',
      bg: 'bg-gradient-to-b from-terracotta-50/60 to-white', headerBg: 'bg-gradient-to-r from-terracotta-500 to-terracotta-400',
      titleColor: 'text-white', features: ['一线品牌', '升级工艺', '环保保障'],
      period: 70, warranty: ['基础3年', '水电8年', '环保保障'], accent: '#C4623A',
    },
    luxury: {
      name: '豪华档', icon: Crown, border: 'border-yellow-400', badge: null,
      bg: 'bg-gradient-to-b from-yellow-50/60 to-white', headerBg: 'bg-gradient-to-r from-yellow-500 to-amber-400',
      titleColor: 'text-white', features: ['进口主材', '匠心工艺', '全屋定制', '终身维护'],
      period: 90, warranty: ['基础5年', '水电10年', '终身维护'], accent: '#D97706',
    },
  }[tier];

  const Icon = config.icon;

  return (
    <div className={cn(
      'relative rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:-translate-y-1',
      config.border, config.bg,
      highlight && 'shadow-glow-terracotta scale-[1.02] z-10',
      !highlight && 'shadow-card hover:shadow-card-hover'
    )}>
      {config.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.accent}dd)` }}>
            <Award className="w-3 h-3" /> 最受欢迎
          </span>
        </div>
      )}

      <div className={cn('p-4 text-center', config.headerBg)}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Icon className={cn('w-5 h-5', highlight ? 'text-white' : tier === 'luxury' ? 'text-white' : 'text-carbon-500')} />
          <h4 className={cn('text-base font-bold', config.titleColor)}>{config.name}</h4>
        </div>
      </div>

      <div className="p-5 text-center">
        <div className="mb-4">
          <div className="text-xs text-carbon-500 mb-1">总价约</div>
          <div className="text-3xl font-bold" style={{ color: config.accent }}>
            ¥{(price / 10000).toFixed(1)}<span className="text-lg">万</span>
            {tier !== 'quality' && <span className="text-sm font-normal text-carbon-500 ml-1">起</span>}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold text-carbon-600 mb-2">主要特点</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {config.features.map((f, i) => (
              <span key={i} className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium',
                highlight ? 'bg-terracotta-100 text-terracotta-700' :
                tier === 'luxury' ? 'bg-yellow-100 text-yellow-700' :
                'bg-ivory-200 text-carbon-600'
              )}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <Divider className="!my-3" />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Clock className={cn('w-4 h-4 mx-auto mb-1', highlight ? 'text-terracotta-500' : tier === 'luxury' ? 'text-yellow-500' : 'text-carbon-500')} />
            <div className="text-xs text-carbon-500">施工周期</div>
            <div className="font-bold text-carbon-800">{config.period}工作日</div>
          </div>
          <div>
            <ShieldCheck className={cn('w-4 h-4 mx-auto mb-1', highlight ? 'text-terracotta-500' : tier === 'luxury' ? 'text-yellow-500' : 'text-carbon-500')} />
            <div className="text-xs text-carbon-500">质保服务</div>
            <div className="font-bold text-carbon-800 text-xs leading-tight">
              {config.warranty.join('｜')}
            </div>
          </div>
        </div>

        {highlight && (
          <div className="mt-4 p-2.5 rounded-xl bg-terracotta-100/70">
            <div className="text-xs font-bold text-terracotta-700 mb-1">
              ✦ 相比经济档 +38项升级
            </div>
            <div className="text-[10px] text-terracotta-600 leading-relaxed">
              包含：水管升级·电线升级·防水升级·瓷砖工艺升级·吊顶升级·墙面升级·品牌全线升级
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PricePieChart() {
  const { pieData } = useQuoteCalculator();
  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <Card
      size="small"
      className="!rounded-2xl !border-ivory-200 mt-6"
      styles={{ body: { padding: 16 } }}
      title={
        <div className="flex items-center gap-2 text-carbon-800">
          <Award className="w-4 h-4 text-terracotta-500" />
          <span className="font-bold">价格构成</span>
          <span className="text-xs text-carbon-500 ml-auto">总价 ¥{total.toLocaleString()}</span>
        </div>
      }
    >
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(v: number, n: string) => [
                <>¥{v.toLocaleString()}<br /><span className="text-xs opacity-70">{((v / total) * 100).toFixed(1)}%</span></>,
                n
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DD', padding: '8px 12px', fontSize: 13 }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => <span className="text-carbon-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function CalculatorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { economy, quality, luxury } = useQuoteCalculator();
  const { city, area, houseType, craftLevel, rooms, designerLevel } = useQuoteStore();

  const handleSave = () => {
    message.success('方案已保存到我的方案库');
  };

  const handleExport = () => {
    message.info('正在生成PDF报价单...');
    setTimeout(() => message.success('PDF报价单已生成并下载'), 800);
  };

  const handleCompare = () => {
    const params = new URLSearchParams({
      city, area: String(area), houseType, craftLevel,
      designerLevel: String(designerLevel),
      rooms: JSON.stringify(rooms),
      quality: String(quality),
    });
    message.info(`即将跳转到比价页：/owner/compare?${params.toString().slice(0, 30)}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-50 via-ivory-100 to-wood-50 py-6 px-4 md:px-6">
      <div className="max-w-[1680px] mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-carbon-800 mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta-500 text-white flex items-center justify-center shadow-glow-terracotta">
              <Hammer className="w-5 h-5" />
            </div>
            装修报价计算器
            <Badge count="实时计算" color="#C4623A" className="!-translate-y-1" />
          </h1>
          <p className="text-sm text-carbon-500 ml-13 pl-13" style={{ marginLeft: 52 }}>
            输入房屋信息，即刻获取三档精准报价明细
          </p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 xl:col-span-7">
            <Card
              className="!rounded-card !border-ivory-200 shadow-card mb-4"
              styles={{ body: { padding: 20, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' } }}
            >
              <StepCapsules current={currentStep} onChange={setCurrentStep} />

              <div className="bg-ivory-50 rounded-2xl p-5">
                {currentStep === 1 && <Step1CityArea />}
                {currentStep === 2 && <Step2Rooms />}
                {currentStep === 3 && <Step3Craft />}
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  size="large"
                  className="!rounded-xl"
                >
                  上一步
                </Button>
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                  disabled={currentStep === 3}
                  size="large"
                  className="!rounded-xl !bg-terracotta-500 hover:!bg-terracotta-600"
                >
                  下一步
                </Button>
              </div>

              <CostBreakdown />
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-5 xl:col-span-5">
            <div className="sticky top-4 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <TierCard tier="economy" price={economy} />
                <TierCard tier="quality" price={quality} highlight />
                <TierCard tier="luxury" price={luxury} />
              </div>

              <PricePieChart />

              <Card
                className="!rounded-card !border-ivory-200 shadow-card"
                styles={{ body: { padding: 20 } }}
              >
                <h4 className="font-bold text-carbon-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-terracotta-500" />
                  操作中心
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    size="large"
                    icon={<Save className="w-4 h-4" />}
                    className="!rounded-xl !h-11 !font-medium"
                    onClick={handleSave}
                  >
                    保存为方案
                  </Button>
                  <Button
                    size="large"
                    icon={<FileText className="w-4 h-4" />}
                    className="!rounded-xl !h-11 !font-medium"
                    onClick={handleExport}
                  >
                    导出PDF报价单
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRightLeft className="w-4 h-4" />}
                    className="!rounded-xl !h-11 !font-medium !bg-gradient-to-r !from-terracotta-500 !to-terracotta-400 hover:!from-terracotta-600 hover:!to-terracotta-500 !border-none"
                    onClick={handleCompare}
                  >
                    一键发起比价
                  </Button>
                </div>

                <Space size="small" className="mt-4 w-full" direction="vertical">
                  <Tooltip title="报价根据您选择的城市、面积、户型、工艺等级实时计算">
                    <div className="text-xs text-carbon-500 flex items-center gap-1 bg-haze-50 px-3 py-2 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-haze-500" />
                      所有报价已按您的配置实时计算，品牌可随时在左侧替换调整
                    </div>
                  </Tooltip>
                </Space>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
