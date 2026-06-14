import type { ProcessRecord } from '@/types'

export const processRecords: ProcessRecord[] = [
  {
    id: 'PR-001',
    batchNo: 'B-SDSG-20260501',
    productName: '有机西红柿',
    sourceBatch: 'SB-SDSG-20260501',
    steps: [
      {
        id: 'PS-001-01',
        name: '原料接收',
        description: '接收寿光绿源种植基地有机西红柿原料，核验溯源码和检测报告',
        timestamp: '2026-05-18 08:00',
        operator: '王建国',
        completed: true
      },
      {
        id: 'PS-001-02',
        name: '分拣清洗',
        description: '按大小色泽分级分拣，纯净水清洗去除表面杂质',
        timestamp: '2026-05-18 09:00',
        operator: '李秀芬',
        completed: true
      },
      {
        id: 'PS-001-03',
        name: '包装封箱',
        description: '5kg规格气调包装封箱，贴溯源标签和批次码',
        timestamp: '2026-05-18 09:30',
        operator: '赵明辉',
        completed: true
      },
      {
        id: 'PS-001-04',
        name: '冷库预冷',
        description: '成品入冷库预冷至4℃，等待装车发运',
        timestamp: '2026-05-18 11:00',
        operator: '孙志强',
        completed: true
      }
    ],
    qualityChecks: [
      {
        id: 'QC-001-01',
        type: '外观检测',
        result: 'passed',
        inspector: '质检员-刘芳',
        date: '2026-05-18 09:15',
        notes: '果形完整色泽均匀无机械损伤'
      },
      {
        id: 'QC-001-02',
        type: '农残快检',
        result: 'passed',
        inspector: '质检员-刘芳',
        date: '2026-05-18 09:20',
        notes: '有机磷和氨基甲酸酯类农残均未检出'
      },
      {
        id: 'QC-001-03',
        type: '包装检验',
        result: 'passed',
        inspector: '质检员-周敏',
        date: '2026-05-18 10:00',
        notes: '包装密封完好标签信息完整'
      }
    ],
    outputBatch: 'OB-SDSG-20260518',
    status: 'completed'
  },
  {
    id: 'PR-002',
    batchNo: 'B-HLWC-20260420',
    productName: '五常大米',
    sourceBatch: 'SB-HLWC-20260420',
    steps: [
      {
        id: 'PS-002-01',
        name: '稻谷接收',
        description: '接收五常稻花香种植合作社稻谷原料，核验产地证明和品质报告',
        timestamp: '2026-04-22 08:30',
        operator: '张国庆',
        completed: true
      },
      {
        id: 'PS-002-02',
        name: '脱壳碾磨',
        description: '砻谷机脱壳后经碾米机碾白加工',
        timestamp: '2026-04-23 09:00',
        operator: '刘海波',
        completed: true
      },
      {
        id: 'PS-002-03',
        name: '色选抛光',
        description: '光电色选机剔除异色粒，抛光机抛光提升米粒光泽',
        timestamp: '2026-04-24 10:00',
        operator: '陈伟东',
        completed: true
      },
      {
        id: 'PS-002-04',
        name: '真空包装',
        description: '10kg规格真空包装，贴溯源码和批次标签',
        timestamp: '2026-04-25 08:00',
        operator: '王丽华',
        completed: true
      }
    ],
    qualityChecks: [
      {
        id: 'QC-002-01',
        type: '品质检测',
        result: 'passed',
        inspector: '质检员-赵红',
        date: '2026-04-24',
        notes: '直链淀粉含量15.2%胶稠度82mm食味值87均达标'
      },
      {
        id: 'QC-002-02',
        type: '重金属检测',
        result: 'pending',
        inspector: '质检员-赵红',
        date: '2026-04-25',
        notes: '已送检等待结果'
      }
    ],
    outputBatch: 'OB-HLWC-20260425',
    status: 'quality_check'
  },
  {
    id: 'PR-003',
    batchNo: 'B-YNPE-20260315',
    productName: '云南普洱茶',
    sourceBatch: 'SB-YNPE-20260315',
    steps: [
      {
        id: 'PS-003-01',
        name: '鲜叶接收',
        description: '接收普洱古树茶庄园大叶种春茶鲜叶，核验采摘记录',
        timestamp: '2026-03-15 14:00',
        operator: '周文华',
        completed: true
      },
      {
        id: 'PS-003-02',
        name: '杀青揉捻',
        description: '铁锅手工杀青后揉捻成型',
        timestamp: '2026-03-15 16:00',
        operator: '制茶师-杨师傅',
        completed: true
      },
      {
        id: 'PS-003-03',
        name: '晒青渥堆',
        description: '日光晒青后渥堆发酵45天',
        timestamp: '2026-03-18 08:00',
        operator: '制茶师-杨师傅',
        completed: false
      },
      {
        id: 'PS-003-04',
        name: '压饼干燥',
        description: '蒸软后石磨压饼定型，自然晾干',
        timestamp: '',
        operator: '制茶师-杨师傅',
        completed: false
      }
    ],
    qualityChecks: [
      {
        id: 'QC-003-01',
        type: '鲜叶检测',
        result: 'passed',
        inspector: '质检员-李静',
        date: '2026-03-15',
        notes: '鲜叶完整度好无病虫害农残未检出'
      },
      {
        id: 'QC-003-02',
        type: '成品检测',
        result: 'pending',
        inspector: '质检员-李静',
        date: '',
        notes: '发酵未完成待检'
      }
    ],
    outputBatch: 'OB-YNPE-PENDING',
    status: 'processing'
  }
]
