export const GBT_36276_STANDARD = {
  name: 'GB/T 36276-2018',
  fullName: '电动汽车用动力蓄电池循环寿命要求及试验方法',
  minCycleLife: 1000,
  capacityRetentionThreshold: 80,
  testConditions: {
    temperature: 25,
    chargeRate: '1C',
    dischargeRate: '1C',
    depthOfDischarge: 100,
  },
  monitoringParams: [
    { name: '总电压', unit: 'V', frequency: '1s' },
    { name: '总电流', unit: 'A', frequency: '1s' },
    { name: 'SOC', unit: '%', frequency: '1s' },
    { name: '单体电压', unit: 'V', frequency: '10s' },
    { name: '温度', unit: '°C', frequency: '10s' },
    { name: '循环次数', unit: '次', frequency: '1次/循环' },
    { name: '充电容量', unit: 'Ah', frequency: '1次/充电' },
    { name: '放电容量', unit: 'Ah', frequency: '1次/放电' },
    { name: '内阻', unit: 'mΩ', frequency: '1次/天' },
  ],
}

export const ALERT_LEVELS = {
  critical: { label: '严重', color: '#FF4D4F', priority: 1 },
  warning: { label: '警告', color: '#FFAA00', priority: 2 },
  info: { label: '提示', color: '#00E5FF', priority: 3 },
}

export const ALERT_TYPES = {
  comm: { label: '通信故障', icon: 'Wifi' },
  temp: { label: '温控异常', icon: 'Thermometer' },
  mechanical: { label: '机械故障', icon: 'Settings' },
  battery: { label: '电池异常', icon: 'Battery' },
}

export const CABINET_STATUS = {
  running: { label: '运行中', color: '#00E676' },
  warning: { label: '告警', color: '#FFAA00' },
  fault: { label: '故障', color: '#FF4D4F' },
}

export const BATTERY_STATUS = {
  charging: { label: '充电中', color: '#00E5FF' },
  standby: { label: '待使用', color: '#00E676' },
  in_use: { label: '使用中', color: '#FFAA00' },
  maintenance: { label: '维护中', color: '#FF4D4F' },
}

export const SWAP_PRICE = 5.0
export const RESERVATION_DURATION = 30
export const LOW_BATTERY_THRESHOLD = 20
