import type { SkillCategory, FaultType } from '@/types';

export const skillCategories: SkillCategory[] = [
  { id: 'aircon', name: '空调维修', icon: 'Snowflake' },
  { id: 'electric', name: '电工', icon: 'Zap' },
  { id: 'plumbing', name: '水管疏通', icon: 'Droplets' },
  { id: 'door_lock', name: '门锁安防', icon: 'Lock' },
  { id: 'appliance', name: '家电维修', icon: 'Tv' },
  { id: 'water_heater', name: '热水器', icon: 'Flame' },
  { id: 'renovation', name: '水电改造', icon: 'Wrench' },
  { id: 'pest_control', name: '消杀除虫', icon: 'Bug' },
];

export const faultTypes: FaultType[] = [
  {
    id: 'aircon',
    name: '空调',
    icon: 'Snowflake',
    skillCategoryId: 'aircon',
    children: [
      { id: 'aircon_not_cool', name: '不制冷', icon: 'Snowflake', skillCategoryId: 'aircon' },
      { id: 'aircon_leak', name: '漏水', icon: 'Droplets', skillCategoryId: 'aircon' },
      { id: 'aircon_noisy', name: '异响', icon: 'Volume2', skillCategoryId: 'aircon' },
      { id: 'aircon_clean', name: '清洗保养', icon: 'Sparkles', skillCategoryId: 'aircon' },
      { id: 'aircon_install', name: '移机安装', icon: 'ArrowLeftRight', skillCategoryId: 'aircon' },
    ],
  },
  {
    id: 'electric',
    name: '电路',
    icon: 'Zap',
    skillCategoryId: 'electric',
    children: [
      { id: 'electric_outlet', name: '插座故障', icon: 'Plug', skillCategoryId: 'electric' },
      { id: 'electric_trip', name: '跳闸断电', icon: 'Power', skillCategoryId: 'electric' },
      { id: 'electric_light', name: '灯具维修', icon: 'Lightbulb', skillCategoryId: 'electric' },
      { id: 'electric_rewire', name: '线路改造', icon: 'Cable', skillCategoryId: 'renovation' },
    ],
  },
  {
    id: 'plumbing',
    name: '水管',
    icon: 'Droplets',
    skillCategoryId: 'plumbing',
    children: [
      { id: 'plumbing_leak', name: '水管漏水', icon: 'Droplet', skillCategoryId: 'plumbing' },
      { id: 'plumbing_clog', name: '下水道堵塞', icon: 'Trash2', skillCategoryId: 'plumbing' },
      { id: 'plumbing_faucet', name: '水龙头更换', icon: 'Diamond', skillCategoryId: 'plumbing' },
      { id: 'plumbing_toilet', name: '马桶维修', icon: 'ShowerHead', skillCategoryId: 'plumbing' },
    ],
  },
  {
    id: 'water_heater',
    name: '热水器',
    icon: 'Flame',
    skillCategoryId: 'water_heater',
    children: [
      { id: 'heater_no_hot', name: '不出热水', icon: 'Thermometer', skillCategoryId: 'water_heater' },
      { id: 'heater_leak', name: '漏水', icon: 'Droplets', skillCategoryId: 'water_heater' },
      { id: 'heater_install', name: '安装更换', icon: 'Settings', skillCategoryId: 'water_heater' },
    ],
  },
  {
    id: 'door_lock',
    name: '门锁',
    icon: 'Lock',
    skillCategoryId: 'door_lock',
    children: [
      { id: 'lock_open', name: '开锁', icon: 'Unlock', skillCategoryId: 'door_lock' },
      { id: 'lock_change', name: '换锁', icon: 'Key', skillCategoryId: 'door_lock' },
      { id: 'lock_smart', name: '智能锁安装', icon: 'Smartphone', skillCategoryId: 'door_lock' },
    ],
  },
  {
    id: 'appliance',
    name: '家电',
    icon: 'Tv',
    skillCategoryId: 'appliance',
    children: [
      { id: 'appliance_fridge', name: '冰箱维修', icon: 'Refrigerator', skillCategoryId: 'appliance' },
      { id: 'appliance_washer', name: '洗衣机维修', icon: 'WashingMachine', skillCategoryId: 'appliance' },
      { id: 'appliance_tv', name: '电视维修', icon: 'Tv', skillCategoryId: 'appliance' },
      { id: 'appliance_kitchen', name: '厨房家电', icon: 'ChefHat', skillCategoryId: 'appliance' },
    ],
  },
  {
    id: 'renovation',
    name: '水电改造',
    icon: 'Wrench',
    skillCategoryId: 'renovation',
    children: [
      { id: 'reno_full', name: '全屋改造', icon: 'Home', skillCategoryId: 'renovation' },
      { id: 'reno_kitchen', name: '厨房水电', icon: 'UtensilsCrossed', skillCategoryId: 'renovation' },
      { id: 'reno_bathroom', name: '卫生间水电', icon: 'Bath', skillCategoryId: 'renovation' },
    ],
  },
  {
    id: 'pest_control',
    name: '消杀',
    icon: 'Bug',
    skillCategoryId: 'pest_control',
    children: [
      { id: 'pest_cockroach', name: '灭蟑螂', icon: 'Bug', skillCategoryId: 'pest_control' },
      { id: 'pest_termite', name: '白蚁防治', icon: 'Bug', skillCategoryId: 'pest_control' },
      { id: 'pest_mouse', name: '灭鼠', icon: 'Rat', skillCategoryId: 'pest_control' },
    ],
  },
];

export function findFaultTypeById(id: string): FaultType | undefined {
  for (const cat of faultTypes) {
    if (cat.id === id) return cat;
    if (cat.children) {
      for (const child of cat.children) {
        if (child.id === id) return child;
      }
    }
  }
  return undefined;
}
