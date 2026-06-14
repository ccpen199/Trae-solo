import type { ServiceProvider, ServiceItem, Product, GroupBuy, LockerBox } from '@/types';

export const mockProviders: ServiceProvider[] = [
  { id: 'SP001', name: '洁家家政', logo: 'https://picsum.photos/id/103/200/200', category: 'housekeeping', rating: 4.8, orderCount: 1256, status: 'approved', commissionRate: 8, description: '专业家庭深度清洁，10年行业经验，所有服务人员持证上岗，售后72小时保障。', contactName: '李经理', contactPhone: '400-888-0001', applyTime: '2024-03-15', approvedTime: '2024-03-20' },
  { id: 'SP002', name: '顺丰丰巢', logo: 'https://picsum.photos/id/119/200/200', category: 'delivery', rating: 4.6, orderCount: 5680, status: 'approved', commissionRate: 5, description: '智能快递柜服务，24小时自助取寄件，覆盖全小区。', contactName: '王区域', contactPhone: '95338', applyTime: '2023-12-01', approvedTime: '2023-12-15' },
  { id: 'SP003', name: '邻里团优选', logo: 'https://picsum.photos/id/225/200/200', category: 'groupbuy', rating: 4.7, orderCount: 3250, status: 'approved', commissionRate: 6, description: '社区团购，产地直供水果生鲜，次日送达。', contactName: '团长·陈姐', contactPhone: '138****8899', applyTime: '2024-01-10', approvedTime: '2024-01-15' },
  { id: 'SP004', name: '惠民小超', logo: 'https://picsum.photos/id/230/200/200', category: 'mall', rating: 4.5, orderCount: 2180, status: 'approved', commissionRate: 7, description: '社区便利商城，日用百货、零食饮料、粮油食品，30分钟送达。', contactName: '赵店长', contactPhone: '139****6677', applyTime: '2024-02-01', approvedTime: '2024-02-10' },
  { id: 'SP005', name: '修修乐维修', logo: 'https://picsum.photos/id/160/200/200', category: 'maintenance', rating: 4.9, orderCount: 890, status: 'approved', commissionRate: 10, description: '家电、水电、家居维修，上门快修，透明报价，质保30天。', contactName: '刘师傅', contactPhone: '188****1122', applyTime: '2024-05-20', approvedTime: '2024-05-28' },
  { id: 'SP006', name: '绿源生鲜', logo: 'https://picsum.photos/id/292/200/200', category: 'mall', rating: 4.6, orderCount: 0, status: 'pending', commissionRate: 8, description: '有机蔬菜、新鲜肉禽、海鲜水产，产地直供，申请入驻中。', contactName: '陈经理', contactPhone: '137****3344', applyTime: '2026-06-08' },
];

export const mockServiceItems: ServiceItem[] = [
  { id: 'SI001', providerId: 'SP001', providerName: '洁家家政', category: 'housekeeping', title: '全屋深度保洁（含擦玻璃）', cover: 'https://picsum.photos/id/230/600/400', price: 298, originalPrice: 398, rating: 4.9, sales: 526, description: '全屋4小时深度清洁，含厨卫除油、玻璃擦拭、家具除尘、地面洗拖，专业阿姨携带工具上门。', tags: ['热销', '今日特价'], status: 'on' },
  { id: 'SI002', providerId: 'SP001', providerName: '洁家家政', category: 'housekeeping', title: '日常保洁2小时', cover: 'https://picsum.photos/id/103/600/400', price: 98, rating: 4.8, sales: 1120, description: '日常家居基础清洁，客厅卧室厨房卫生间，按小时服务。', tags: ['新人优惠'], status: 'on' },
  { id: 'SI003', providerId: 'SP001', providerName: '洁家家政', category: 'housekeeping', title: '油烟机深度拆洗', cover: 'https://picsum.photos/id/312/600/400', price: 158, originalPrice: 198, rating: 4.7, sales: 235, description: '专业拆洗油烟机，去除重油污，附赠灶具表面清洁。', tags: ['必选'], status: 'on' },
  { id: 'SI004', providerId: 'SP005', providerName: '修修乐维修', category: 'maintenance', title: '空调清洗加氟一条龙', cover: 'https://picsum.photos/id/119/600/400', price: 128, rating: 4.9, sales: 408, description: '内机深度清洗+冷凝器除尘+加氟测压，制冷效果显著提升。', tags: ['夏季必备'], status: 'on' },
  { id: 'SI005', providerId: 'SP005', providerName: '修修乐维修', category: 'maintenance', title: '水电上门维修', cover: 'https://picsum.photos/id/9/600/400', price: 50, originalPrice: 80, rating: 4.6, sales: 312, description: '50元上门检测费，维修费用另算，不修不收费。', tags: ['透明报价'], status: 'on' },
  { id: 'SI006', providerId: 'SP001', providerName: '洁家家政', category: 'housekeeping', title: '洗衣机清洗（滚筒/波轮）', cover: 'https://picsum.photos/id/326/600/400', price: 118, rating: 4.8, sales: 298, description: '拆洗内筒夹层、消毒除菌，去除异味和残留污垢。', tags: [], status: 'on' },
];

export const mockProducts: Product[] = [
  { id: 'PD001', providerId: 'SP004', providerName: '惠民小超', category: '粮油食品', title: '金龙鱼5L调和油', cover: 'https://picsum.photos/id/292/400/400', images: ['https://picsum.photos/id/292/800/800'], price: 69.9, originalPrice: 89.9, stock: 150, sales: 328, rating: 4.8, description: '金龙鱼黄金比例1:1:1食用调和油5L装', tags: ['包邮'] },
  { id: 'PD002', providerId: 'SP004', providerName: '惠民小超', category: '饮料酒水', title: '农夫山泉24瓶装整箱', cover: 'https://picsum.photos/id/431/400/400', images: ['https://picsum.photos/id/431/800/800'], price: 28, originalPrice: 36, stock: 300, sales: 650, rating: 4.9, description: '农夫山泉天然饮用水550ml*24瓶', tags: ['热销'] },
  { id: 'PD003', providerId: 'SP004', providerName: '惠民小超', category: '零食', title: '三只松鼠坚果大礼包', cover: 'https://picsum.photos/id/401/400/400', images: ['https://picsum.photos/id/401/800/800'], price: 99, originalPrice: 158, stock: 80, sales: 210, rating: 4.7, description: '8袋混合装共1528g，每日坚果零食组合', tags: ['特价'] },
  { id: 'PD004', providerId: 'SP004', providerName: '惠民小超', category: '日用百货', title: '维达抽纸整箱24包', cover: 'https://picsum.photos/id/582/400/400', images: ['https://picsum.photos/id/582/800/800'], price: 45.9, originalPrice: 58, stock: 200, sales: 430, rating: 4.8, description: '3层120抽可湿水面巾纸，整箱装更优惠', tags: [] },
  { id: 'PD005', providerId: 'SP004', providerName: '惠民小超', category: '乳饮', title: '伊利纯牛奶250ml*24盒', cover: 'https://picsum.photos/id/1080/400/400', images: ['https://picsum.photos/id/1080/800/800'], price: 59.9, originalPrice: 72, stock: 120, sales: 380, rating: 4.9, description: '全脂灭菌乳，优质奶源，营养早餐', tags: ['新鲜日期'] },
];

export const mockGroupBuys: GroupBuy[] = [
  { id: 'GB001', providerId: 'SP003', providerName: '邻里团优选', title: '山东烟台红富士苹果5斤装', cover: 'https://picsum.photos/id/1025/600/400', price: 29.9, originalPrice: 49.9, minCount: 20, currentCount: 45, endTime: '2026-06-11 20:00:00', description: '产地直发烟台红富士，脆甜多汁，85mm大果，包邮包售后。', status: 'active' },
  { id: 'GB002', providerId: 'SP003', providerName: '邻里团优选', title: '阳澄湖大闸蟹礼盒6只装', cover: 'https://picsum.photos/id/570/600/400', price: 188, originalPrice: 298, minCount: 15, currentCount: 28, endTime: '2026-06-12 18:00:00', description: '公3.5两+母2.5两各3只，顺丰冷链包邮。', status: 'active' },
  { id: 'GB003', providerId: 'SP003', providerName: '邻里团优选', title: '丹东99草莓3斤装', cover: 'https://picsum.photos/id/625/600/400', price: 59, originalPrice: 89, minCount: 25, currentCount: 60, endTime: '2026-06-10 22:00:00', description: '奶油草莓，现摘现发，顺丰包邮。', status: 'full' },
];

export const mockLockerBoxes: LockerBox[] = [
  { id: 'LK001', code: 'A-01', size: 'medium', status: 'occupied', expressCompany: '顺丰速运', pickupCode: '8823#56', storedAt: '2026-06-10 07:45:00', expireAt: '2026-06-12 07:45:00' },
  { id: 'LK002', code: 'A-02', size: 'small', status: 'occupied', expressCompany: '中通快递', pickupCode: '3210#89', storedAt: '2026-06-09 18:20:00', expireAt: '2026-06-11 18:20:00' },
  { id: 'LK003', code: 'A-03', size: 'large', status: 'empty' },
  { id: 'LK004', code: 'A-04', size: 'medium', status: 'occupied', expressCompany: '京东物流', pickupCode: '6742#31', storedAt: '2026-06-10 09:10:00', expireAt: '2026-06-12 09:10:00' },
  { id: 'LK005', code: 'A-05', size: 'small', status: 'empty' },
  { id: 'LK006', code: 'B-01', size: 'large', status: 'occupied', expressCompany: '德邦快递', pickupCode: '1158#02', storedAt: '2026-06-09 14:30:00', expireAt: '2026-06-11 14:30:00' },
  { id: 'LK007', code: 'B-02', size: 'medium', status: 'empty' },
  { id: 'LK008', code: 'B-03', size: 'small', status: 'occupied', expressCompany: '圆通速递', pickupCode: '9407#77', storedAt: '2026-06-10 06:55:00', expireAt: '2026-06-12 06:55:00' },
];

export const categoryList = [
  { key: 'housekeeping', name: '家政保洁', icon: '🧹', color: '#2E7CF6' },
  { key: 'delivery', name: '快递柜', icon: '📦', color: '#10B981' },
  { key: 'groupbuy', name: '社区团购', icon: '🛒', color: '#F59E0B' },
  { key: 'mall', name: '线上商城', icon: '🏬', color: '#8B5CF6' },
  { key: 'maintenance', name: '上门维修', icon: '🔧', color: '#EF4444' },
];

export const mockServiceProviders = mockProviders.map(p => ({
  ...p,
  createdAt: p.applyTime || p.createdAt,
  licenseNo: '9144' + Math.floor(Math.random() * 1000000000),
  serviceScope: p.category === 'housekeeping' ? '全区范围 30分钟上门' : p.category === 'mall' ? '社区配送 30分钟达' : p.category === 'groupbuy' ? '产地直发 次日达' : p.category === 'delivery' ? '全小区快递柜' : '全区家电维修',
}));
