import type { LogisticsOrder } from '@/types'

export const logisticsOrders: LogisticsOrder[] = [
  {
    id: 'LO-001',
    batchNo: 'B-SDSG-20260501',
    productName: '有机西红柿',
    origin: '山东省寿光市',
    destination: '北京市丰台区',
    status: 'delivered',
    carrier: '顺丰冷链物流',
    vehicleNo: '鲁V56789',
    startTime: '2026-05-18 14:00',
    estimatedArrival: '2026-05-19 06:00',
    currentLocation: { lat: 39.8585, lng: 116.2871, address: '北京市丰台区新发地市场' },
    route: [
      { lat: 36.8551, lng: 118.7337 },
      { lat: 37.2511, lng: 117.9467 },
      { lat: 37.8756, lng: 117.0287 },
      { lat: 38.6538, lng: 116.3278 },
      { lat: 39.1548, lng: 116.6828 },
      { lat: 39.8585, lng: 116.2871 }
    ],
    tempData: [
      { time: '2026-05-18 14:00', temp: 4.2, humidity: 85 },
      { time: '2026-05-18 15:00', temp: 4.0, humidity: 86 },
      { time: '2026-05-18 16:00', temp: 3.8, humidity: 87 },
      { time: '2026-05-18 17:00', temp: 4.1, humidity: 85 },
      { time: '2026-05-18 18:00', temp: 4.3, humidity: 84 },
      { time: '2026-05-18 19:00', temp: 4.5, humidity: 83 },
      { time: '2026-05-18 20:00', temp: 4.0, humidity: 86 },
      { time: '2026-05-18 21:00', temp: 3.9, humidity: 87 },
      { time: '2026-05-18 22:00', temp: 4.2, humidity: 85 },
      { time: '2026-05-18 23:00', temp: 4.1, humidity: 86 },
      { time: '2026-05-19 00:00', temp: 3.8, humidity: 88 },
      { time: '2026-05-19 01:00', temp: 3.7, humidity: 89 }
    ],
    alerts: []
  },
  {
    id: 'LO-002',
    batchNo: 'B-XJAKS-20260510',
    productName: '新疆阿克苏苹果',
    origin: '新疆阿克苏市',
    destination: '广州市白云区',
    status: 'in_transit',
    carrier: '中通冷链',
    vehicleNo: '新A67890',
    startTime: '2026-05-12 16:00',
    estimatedArrival: '2026-05-15 12:00',
    currentLocation: { lat: 31.2304, lng: 107.8533, address: '甘肃省陇南市武都区' },
    route: [
      { lat: 41.1677, lng: 80.2613 },
      { lat: 39.4702, lng: 76.0883 },
      { lat: 38.0235, lng: 82.9686 },
      { lat: 36.0611, lng: 89.8383 },
      { lat: 34.3256, lng: 97.5683 },
      { lat: 33.2936, lng: 101.8764 },
      { lat: 31.2304, lng: 107.8533 }
    ],
    tempData: [
      { time: '2026-05-12 16:00', temp: 2.1, humidity: 78 },
      { time: '2026-05-12 18:00', temp: 2.3, humidity: 77 },
      { time: '2026-05-12 20:00', temp: 2.0, humidity: 79 },
      { time: '2026-05-12 22:00', temp: 1.8, humidity: 80 },
      { time: '2026-05-13 00:00', temp: 2.2, humidity: 78 },
      { time: '2026-05-13 02:00', temp: 2.5, humidity: 76 },
      { time: '2026-05-13 04:00', temp: 5.8, humidity: 72 },
      { time: '2026-05-13 06:00', temp: 4.2, humidity: 74 },
      { time: '2026-05-13 08:00', temp: 2.8, humidity: 77 },
      { time: '2026-05-13 10:00', temp: 2.4, humidity: 78 },
      { time: '2026-05-13 12:00', temp: 2.1, humidity: 79 },
      { time: '2026-05-13 14:00', temp: 2.3, humidity: 78 }
    ],
    alerts: [
      {
        id: 'LA-002-01',
        type: 'temp_high',
        message: '车厢温度短暂升高至5.8℃，已超过4℃上限',
        timestamp: '2026-05-13 04:00',
        resolved: true
      }
    ]
  },
  {
    id: 'LO-003',
    batchNo: 'B-HLWC-20260420',
    productName: '五常大米',
    origin: '黑龙江省五常市',
    destination: '上海市嘉定区',
    status: 'in_transit',
    carrier: '京东物流',
    vehicleNo: '黑A12345',
    startTime: '2026-04-26 08:00',
    estimatedArrival: '2026-04-28 08:00',
    currentLocation: { lat: 35.4158, lng: 117.3228, address: '山东省济宁市任城区' },
    route: [
      { lat: 44.9087, lng: 127.1567 },
      { lat: 43.8868, lng: 125.3245 },
      { lat: 42.8912, lng: 123.4567 },
      { lat: 41.1234, lng: 121.6789 },
      { lat: 39.5678, lng: 119.2345 },
      { lat: 37.8901, lng: 117.5678 },
      { lat: 35.4158, lng: 117.3228 }
    ],
    tempData: [
      { time: '2026-04-26 08:00', temp: 18.5, humidity: 55 },
      { time: '2026-04-26 10:00', temp: 19.2, humidity: 53 },
      { time: '2026-04-26 12:00', temp: 21.0, humidity: 50 },
      { time: '2026-04-26 14:00', temp: 22.5, humidity: 48 },
      { time: '2026-04-26 16:00', temp: 20.8, humidity: 52 },
      { time: '2026-04-26 18:00', temp: 19.5, humidity: 54 },
      { time: '2026-04-26 20:00', temp: 18.0, humidity: 56 },
      { time: '2026-04-26 22:00', temp: 17.2, humidity: 58 },
      { time: '2026-04-27 00:00', temp: 16.8, humidity: 60 },
      { time: '2026-04-27 02:00', temp: 16.5, humidity: 61 },
      { time: '2026-04-27 04:00', temp: 17.0, humidity: 59 },
      { time: '2026-04-27 06:00', temp: 18.3, humidity: 56 }
    ],
    alerts: [
      {
        id: 'LA-003-01',
        type: 'humidity_high',
        message: '车厢湿度超过60%阈值，请关注货物状态',
        timestamp: '2026-04-27 00:00',
        resolved: true
      },
      {
        id: 'LA-003-02',
        type: 'delay',
        message: '运输途中因高速公路施工预计延迟2小时到达',
        timestamp: '2026-04-27 08:00',
        resolved: false
      }
    ]
  }
]
