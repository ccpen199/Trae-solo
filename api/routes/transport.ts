import { Router, type Request, type Response } from 'express'

const router = Router()

const busRoutes = [
  { route: '1路', from: '南京站', to: '夫子庙', stations: ['南京站', '中央门', '玄武湖公园', '鼓楼', '珠江路', '新街口', '大行宫', '夫子庙'], directions: ['往夫子庙', '往南京站'] },
  { route: '2路', from: '汉中门', to: '中山陵', stations: ['汉中门', '莫愁湖', '水西门', '朝天宫', '三山街', '中华门', '雨花台', '卡子门', '大明路', '中和桥', '马家圩', '光卡路', '后江沿', '南京市中医院', '洪家园', '卡子门大街南', '紫荆花路', '花神湖', '南京科技馆', '玉兰路', '丁墙村', '翠岛花城', '花神庙', '宁南大道', '天隆寺', '安德门', '能仁里', '雨花西路', '长虹路', '集庆门', '殷高巷', '钓鱼台', '中山南路', '新桥', '内桥', '张府园', '新街口', '洪武北路', '相府营', '网巾市', '总统府', '南京图书馆', '大行宫南', '逸仙桥', '西安门', '明故宫', '解放路', '明故宫东', '中山门', '卫桥', '卫岗', '小卫街', '理工大', '孝陵卫', '大栅门', '钟灵街', '柳营', '顾家营', '五棵松', '中山陵'], directions: ['往中山陵', '往汉中门'] },
  { route: '3路', from: '雨花台', to: '玄武湖', stations: ['雨花台', '雨花南路', '公交总公司驾校', '公交四公司', '安德门', '龙福山庄', '能仁里', '雨花西路', '钓鱼台', '新桥', '升州路', '三山街', '评事街', '水西门', '莫愁湖公园', '大士茶亭', '玉塘村', '茶亭东街', '江东门', '江东门纪念馆', '管子桥', '典雅居', '江东北路', '龙江新城市广场', '龙江花园', '商会大厦黄金楼', '三汊河', '农贸中心', '南医大二附院', '姜家园', '姜家圩', '华严岗门', '察哈尔路', '盐仓桥', '双门楼宾馆', '丁山宾馆', '镇江路', '古平岗', '古林公园', '江苏省委', '玄武门', '玄武湖公园'], directions: ['往玄武湖', '往雨花台'] },
  { route: '5路', from: '火车站', to: '江宁大学城', stations: ['火车站', '中央门', '小营', '太平门', '岗子村', '富贵山', '后宰门', '明故宫', '解放路', '军区总医院', '西安门', '逸仙桥', '大行宫', '新街口', '莫愁路', '汉中商场', '涵洞口', '汉中门大街东', '汉中门大街西', '江东门西街', '江东门', '五洲装饰城', '三角村', '水西门大街江东北路', '裕华名居', '康怡花园', '凤凰花园城', '汉江路', '龙江新城市广场', '中保街', '漓江路', '银城街', '江东北路', '三汊河', '农贸中心', '南医大二附院', '热河南路', '盐仓桥广场西', '大桥南路', '四平路', '晓街', '长江大酒店', '四平路广场南', '大桥南路', '盐仓桥', '双门楼宾馆', '丁山宾馆', '镇江路', '古平岗', '古林公园', '江苏省委', '玄武门', '玄武湖公园'], directions: ['往江宁大学城', '往火车站'] },
  { route: '16路', from: '南京南站', to: '仙林大学城', stations: ['南京南站', '玉盘西街', '茶花路', '岔路口', '江宁装饰城', '气象学院', '双龙街', '卡子门大街南', '卡子门', '红花镇', '后江沿', '光卡路', '马家圩', '中和桥', '大校场', '秦虹桥', '白鹭东街', '七里街', '象房村', '解放南路', '大光路', '通济门', '瑞金路', '解放路', '明故宫', '中山门', '卫桥', '卫岗', '小卫街', '理工大', '孝陵卫', '大栅门', '钟灵街', '柳营', '顾家营', '五棵松', '马群', '钟山学院', '新街', '太阳城', '黄庄', '麒麟门', '麒西路', '晨光村', '华侨公墓', '汤山'], directions: ['往仙林大学城', '往南京南站'] },
]

router.get('/bus', (req: Request, res: Response): void => {
  try {
    const { route, station, direction } = req.query
    const matchedRoutes = busRoutes.filter(r => !route || r.route.includes(String(route)))
    if (matchedRoutes.length === 0) {
      res.json({ code: -1, message: '未找到该线路' })
      return
    }
    const result = matchedRoutes.map(r => {
      const forwardStations = [...r.stations]
      const backwardStations = [...r.stations].reverse()
      
      const directions = r.directions.map((d, idx) => {
        const isForward = idx === 0
        const stations = isForward ? forwardStations : backwardStations
        const filteredStations = !station ? stations : stations.filter(s => s.includes(String(station)))
        return {
          direction: d,
          from: isForward ? r.from : r.to,
          to: isForward ? r.to : r.from,
          arrivals: filteredStations.map(s => ({
            station: s,
            minutes: Math.floor(Math.random() * 15) + 1,
          })),
        }
      })
      
      const filteredDirections = direction 
        ? directions.filter(d => d.direction.includes(String(direction)))
        : directions
      
      return {
        route: r.route,
        from: r.from,
        to: r.to,
        directions: filteredDirections,
      }
    })
    res.json({ code: 0, message: 'success', data: result })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

const metroLines = [
  {
    line: '1号线',
    color: '#0066CC',
    stations: [
      '迈皋桥', '红山动物园', '南京站', '新模范马路', '玄武门', '鼓楼',
      '珠江路', '新街口', '张府园', '三山街', '中华门', '安德门',
      '天隆寺', '软件大道', '花神庙', '南京南站', '双龙大道', '河定桥', '百家湖', '胜太路', '龙眠大道', '南医大·江苏经贸学院', '南京交院', '中国药科大学',
    ],
  },
  {
    line: '2号线',
    color: '#CC0000',
    stations: [
      '鱼嘴', '集庆门大街', '云锦路', '莫愁湖', '汉中门', '上海路',
      '新街口', '大行宫', '西安门', '明故宫', '苜蓿园', '下马坊',
      '孝陵卫', '钟灵街', '马群', '金马路', '仙鹤门', '学则路',
      '仙林中心', '羊山公园', '南大仙林校区', '经天路',
    ],
  },
  {
    line: '3号线',
    color: '#009900',
    stations: [
      '林场', '星火路', '东大成贤学院', '泰冯路', '天润城', '柳洲东路',
      '上元门', '五塘广场', '南京站', '小市', '玄武门', '鸡鸣寺',
      '浮桥', '大行宫', '常府街', '夫子庙', '武定门', '雨花门',
      '卡子门', '大明路', '明发广场', '南京南站', '宏运大道', '胜太西路', '天元西路', '九龙湖', '诚信大道', '东大九龙湖校区', '秣周东路',
    ],
  },
]

router.get('/metro', (_req: Request, res: Response): void => {
  try {
    const result = metroLines.map(line => ({
      ...line,
      nextTrain: Math.floor(Math.random() * 5) + 1,
    }))
    res.json({ code: 0, message: 'success', data: result })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
