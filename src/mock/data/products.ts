// 商品库 Mock 数据：分类、品牌、型号

import type { Category, Brand, ProductModel, SerialRule } from '@/types';

export const categories: Category[] = [
  { id: 'cat_phone', name: '手机', icon: 'smartphone', sort: 1 },
  { id: 'cat_camera', name: '相机', icon: 'camera', sort: 2 },
  { id: 'cat_watch', name: '名表', icon: 'watch', sort: 3 },
  { id: 'cat_bag', name: '包包', icon: 'shopping-bag', sort: 4 },
  { id: 'cat_jewelry', name: '珠宝', icon: 'gem', sort: 5 },
];

const uid = (prefix: string, i: number) => `${prefix}_${String(i).padStart(3, '0')}`;

export const brands: Brand[] = [
  { id: 'br_apple', categoryId: 'cat_phone', name: 'Apple', logo: '🍎', country: '美国' },
  { id: 'br_huawei', categoryId: 'cat_phone', name: '华为', logo: '🌸', country: '中国' },
  { id: 'br_xiaomi', categoryId: 'cat_phone', name: '小米', logo: '🟠', country: '中国' },
  { id: 'br_samsung', categoryId: 'cat_phone', name: 'Samsung', logo: '🔵', country: '韩国' },
  { id: 'br_oppo', categoryId: 'cat_phone', name: 'OPPO', logo: '🟢', country: '中国' },
  { id: 'br_vivo', categoryId: 'cat_phone', name: 'vivo', logo: '🔷', country: '中国' },
  { id: 'br_honor', categoryId: 'cat_phone', name: '荣耀', logo: '✨', country: '中国' },
  { id: 'br_oneplus', categoryId: 'cat_phone', name: 'OnePlus', logo: '1️⃣', country: '中国' },

  { id: 'br_canon', categoryId: 'cat_camera', name: 'Canon', logo: '📷', country: '日本' },
  { id: 'br_nikon', categoryId: 'cat_camera', name: 'Nikon', logo: '📸', country: '日本' },
  { id: 'br_sony_cam', categoryId: 'cat_camera', name: 'Sony', logo: '🎥', country: '日本' },
  { id: 'br_fujifilm', categoryId: 'cat_camera', name: 'Fujifilm', logo: '🎞️', country: '日本' },
  { id: 'br_leica', categoryId: 'cat_camera', name: 'Leica', logo: '🔴', country: '德国' },

  { id: 'br_rolex', categoryId: 'cat_watch', name: 'Rolex', logo: '👑', country: '瑞士' },
  { id: 'br_omega', categoryId: 'cat_watch', name: 'Omega', logo: 'Ω', country: '瑞士' },
  { id: 'br_cartier_w', categoryId: 'cat_watch', name: 'Cartier', logo: '🐆', country: '法国' },
  { id: 'br_iwc', categoryId: 'cat_watch', name: 'IWC', logo: '⌚', country: '瑞士' },
  { id: 'br_tagheuer', categoryId: 'cat_watch', name: 'TagHeuer', logo: '🏁', country: '瑞士' },
  { id: 'br_longines', categoryId: 'cat_watch', name: 'Longines', logo: '⏳', country: '瑞士' },

  { id: 'br_hermes', categoryId: 'cat_bag', name: 'Hermes', logo: '🐴', country: '法国' },
  { id: 'br_chanel', categoryId: 'cat_bag', name: 'Chanel', logo: '🔲', country: '法国' },
  { id: 'br_lv', categoryId: 'cat_bag', name: 'Louis Vuitton', logo: 'LV', country: '法国' },
  { id: 'br_gucci', categoryId: 'cat_bag', name: 'Gucci', logo: 'GG', country: '意大利' },
  { id: 'br_dior', categoryId: 'cat_bag', name: 'Dior', logo: '💫', country: '法国' },
  { id: 'br_prada', categoryId: 'cat_bag', name: 'Prada', logo: '🖤', country: '意大利' },
  { id: 'br_burberry', categoryId: 'cat_bag', name: 'Burberry', logo: '🧥', country: '英国' },

  { id: 'br_cartier_j', categoryId: 'cat_jewelry', name: 'Cartier', logo: '🐆', country: '法国' },
  { id: 'br_tiffany', categoryId: 'cat_jewelry', name: 'Tiffany', logo: '💎', country: '美国' },
  { id: 'br_vancleef', categoryId: 'cat_jewelry', name: 'Van Cleef', logo: '🍀', country: '法国' },
  { id: 'br_bvlgari', categoryId: 'cat_jewelry', name: 'Bvlgari', logo: '💍', country: '意大利' },
];

interface ModelSeed {
  brandId: string;
  name: string;
  series: string;
  launchYear: number;
  msrp: number;
  baseRatio: number;
  specs: Record<string, string | number | boolean>;
}

const modelSeeds: ModelSeed[] = [
  { brandId: 'br_apple', name: 'iPhone 15 Pro Max', series: 'iPhone 15', launchYear: 2023, msrp: 9999, baseRatio: 0.62, specs: { storage: '256GB', color: '原色钛金属', screen: '6.7英寸', chip: 'A17 Pro' } },
  { brandId: 'br_apple', name: 'iPhone 15 Pro', series: 'iPhone 15', launchYear: 2023, msrp: 7999, baseRatio: 0.63, specs: { storage: '256GB', color: '蓝色钛金属', screen: '6.1英寸', chip: 'A17 Pro' } },
  { brandId: 'br_apple', name: 'iPhone 14 Pro Max', series: 'iPhone 14', launchYear: 2022, msrp: 9899, baseRatio: 0.52, specs: { storage: '256GB', color: '暗紫色', screen: '6.7英寸', chip: 'A16 Bionic' } },
  { brandId: 'br_apple', name: 'iPhone 14 Pro', series: 'iPhone 14', launchYear: 2022, msrp: 7999, baseRatio: 0.53, specs: { storage: '128GB', color: '深空黑色', screen: '6.1英寸', chip: 'A16 Bionic' } },
  { brandId: 'br_apple', name: 'iPhone 13 Pro', series: 'iPhone 13', launchYear: 2021, msrp: 7999, baseRatio: 0.42, specs: { storage: '256GB', color: '远峰蓝', screen: '6.1英寸', chip: 'A15 Bionic' } },

  { brandId: 'br_huawei', name: 'Mate 60 Pro+', series: 'Mate 60', launchYear: 2023, msrp: 8999, baseRatio: 0.68, specs: { storage: '512GB', color: '砚黑', screen: '6.8英寸', chip: '麒麟9000S' } },
  { brandId: 'br_huawei', name: 'Mate 60 Pro', series: 'Mate 60', launchYear: 2023, msrp: 6999, baseRatio: 0.66, specs: { storage: '512GB', color: '雅川青', screen: '6.82英寸', chip: '麒麟9000S' } },
  { brandId: 'br_huawei', name: 'P60 Pro', series: 'P60', launchYear: 2023, msrp: 6988, baseRatio: 0.58, specs: { storage: '256GB', color: '羽砂白', screen: '6.67英寸', chip: '骁龙8+' } },
  { brandId: 'br_huawei', name: 'Mate X5', series: 'Mate X', launchYear: 2023, msrp: 12999, baseRatio: 0.72, specs: { storage: '512GB', color: '青山黛', screen: '7.85英寸折叠', chip: '麒麟9000S' } },

  { brandId: 'br_xiaomi', name: '小米14 Ultra', series: '小米14', launchYear: 2024, msrp: 6499, baseRatio: 0.60, specs: { storage: '512GB', color: '黑色', screen: '6.73英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_xiaomi', name: '小米14 Pro', series: '小米14', launchYear: 2023, msrp: 4999, baseRatio: 0.58, specs: { storage: '256GB', color: '白色', screen: '6.73英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_xiaomi', name: '小米13 Ultra', series: '小米13', launchYear: 2023, msrp: 5999, baseRatio: 0.50, specs: { storage: '512GB', color: '橄榄绿', screen: '6.73英寸', chip: '骁龙8 Gen2' } },
  { brandId: 'br_xiaomi', name: 'Redmi K70 Pro', series: 'Redmi K', launchYear: 2023, msrp: 3299, baseRatio: 0.55, specs: { storage: '256GB', color: '墨羽', screen: '6.67英寸', chip: '骁龙8 Gen3' } },

  { brandId: 'br_samsung', name: 'Galaxy S24 Ultra', series: 'Galaxy S', launchYear: 2024, msrp: 9699, baseRatio: 0.58, specs: { storage: '512GB', color: '钛灰', screen: '6.8英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_samsung', name: 'Galaxy Z Fold5', series: 'Galaxy Z', launchYear: 2023, msrp: 13999, baseRatio: 0.55, specs: { storage: '512GB', color: '冰萃蓝', screen: '7.6英寸折叠', chip: '骁龙8 Gen2' } },
  { brandId: 'br_samsung', name: 'Galaxy S23 Ultra', series: 'Galaxy S', launchYear: 2023, msrp: 8999, baseRatio: 0.48, specs: { storage: '256GB', color: '悠野绿', screen: '6.8英寸', chip: '骁龙8 Gen2' } },
  { brandId: 'br_samsung', name: 'Galaxy W24', series: '心系天下', launchYear: 2023, msrp: 15999, baseRatio: 0.60, specs: { storage: '1TB', color: '纳多灰', screen: '7.6英寸折叠', chip: '骁龙8 Gen2' } },

  { brandId: 'br_oppo', name: 'Find X7 Ultra', series: 'Find X', launchYear: 2024, msrp: 5999, baseRatio: 0.60, specs: { storage: '256GB', color: '海阔天空', screen: '6.82英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_oppo', name: 'Find X6 Pro', series: 'Find X', launchYear: 2023, msrp: 5999, baseRatio: 0.50, specs: { storage: '256GB', color: '飞泉绿', screen: '6.82英寸', chip: '骁龙8 Gen2' } },
  { brandId: 'br_oppo', name: 'Reno11 Pro', series: 'Reno', launchYear: 2023, msrp: 3499, baseRatio: 0.55, specs: { storage: '256GB', color: '月光宝石', screen: '6.74英寸', chip: '天玑8200' } },
  { brandId: 'br_oppo', name: '一加12', series: '一加', launchYear: 2023, msrp: 4299, baseRatio: 0.58, specs: { storage: '256GB', color: '苍绿', screen: '6.82英寸', chip: '骁龙8 Gen3' } },

  { brandId: 'br_vivo', name: 'X100 Pro', series: 'X', launchYear: 2023, msrp: 4999, baseRatio: 0.60, specs: { storage: '256GB', color: '辰夜黑', screen: '6.78英寸', chip: '天玑9300' } },
  { brandId: 'br_vivo', name: 'X90 Pro+', series: 'X', launchYear: 2022, msrp: 6499, baseRatio: 0.48, specs: { storage: '512GB', color: '华夏红', screen: '6.78英寸', chip: '骁龙8 Gen2' } },
  { brandId: 'br_vivo', name: 'iQOO 12 Pro', series: 'iQOO', launchYear: 2023, msrp: 4999, baseRatio: 0.56, specs: { storage: '256GB', color: '传奇版', screen: '6.78英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_vivo', name: 'S18 Pro', series: 'S', launchYear: 2023, msrp: 3099, baseRatio: 0.55, specs: { storage: '256GB', color: '花似锦', screen: '6.78英寸', chip: '天玑9200+' } },

  { brandId: 'br_honor', name: 'Magic6 Pro', series: 'Magic', launchYear: 2024, msrp: 5699, baseRatio: 0.60, specs: { storage: '256GB', color: '绒黑色', screen: '6.8英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_honor', name: 'Magic V2', series: 'Magic V', launchYear: 2023, msrp: 8999, baseRatio: 0.62, specs: { storage: '512GB', color: '绒紫色', screen: '7.92英寸折叠', chip: '骁龙8 Gen2' } },
  { brandId: 'br_honor', name: 'Magic5 Pro', series: 'Magic', launchYear: 2023, msrp: 5199, baseRatio: 0.50, specs: { storage: '256GB', color: '苔原绿', screen: '6.81英寸', chip: '骁龙8 Gen2' } },
  { brandId: 'br_honor', name: '100 Pro', series: '数字', launchYear: 2023, msrp: 3699, baseRatio: 0.55, specs: { storage: '256GB', color: '月影白', screen: '6.78英寸', chip: '骁龙8 Gen2' } },

  { brandId: 'br_oneplus', name: '一加12', series: '数字', launchYear: 2023, msrp: 4299, baseRatio: 0.58, specs: { storage: '256GB', color: '流翠绿', screen: '6.82英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_oneplus', name: '一加Ace3 Pro', series: 'Ace', launchYear: 2024, msrp: 3399, baseRatio: 0.57, specs: { storage: '256GB', color: '超跑瓷', screen: '6.78英寸', chip: '骁龙8 Gen3' } },
  { brandId: 'br_oneplus', name: '一加11', series: '数字', launchYear: 2023, msrp: 3999, baseRatio: 0.48, specs: { storage: '256GB', color: '无尽黑', screen: '6.7英寸', chip: '骁龙8 Gen2' } },
  { brandId: 'br_oneplus', name: '一加Ace2 Pro', series: 'Ace', launchYear: 2023, msrp: 2999, baseRatio: 0.50, specs: { storage: '256GB', color: '钛空灰', screen: '6.74英寸', chip: '骁龙8 Gen2' } },

  { brandId: 'br_canon', name: 'EOS R5', series: 'EOS R', launchYear: 2020, msrp: 25999, baseRatio: 0.55, specs: { type: '全画幅微单', megapixel: '4500万', video: '8K', mount: 'RF' } },
  { brandId: 'br_canon', name: 'EOS R6 Mark II', series: 'EOS R', launchYear: 2022, msrp: 16499, baseRatio: 0.58, specs: { type: '全画幅微单', megapixel: '2420万', video: '4K60p', mount: 'RF' } },
  { brandId: 'br_canon', name: 'EOS R3', series: 'EOS R', launchYear: 2021, msrp: 36999, baseRatio: 0.58, specs: { type: '全画幅微单', megapixel: '2410万', video: '6K', mount: 'RF' } },
  { brandId: 'br_canon', name: 'EOS R50', series: 'EOS R', launchYear: 2023, msrp: 5599, baseRatio: 0.60, specs: { type: 'APS-C微单', megapixel: '2420万', video: '4K', mount: 'RF-S' } },
  { brandId: 'br_canon', name: 'EOS 5D Mark IV', series: 'EOS', launchYear: 2016, msrp: 19999, baseRatio: 0.38, specs: { type: '全画幅单反', megapixel: '3040万', video: '4K', mount: 'EF' } },

  { brandId: 'br_nikon', name: 'Z8', series: 'Z', launchYear: 2023, msrp: 27999, baseRatio: 0.62, specs: { type: '全画幅微单', megapixel: '4571万', video: '8K', mount: 'Z' } },
  { brandId: 'br_nikon', name: 'Z9', series: 'Z', launchYear: 2021, msrp: 35999, baseRatio: 0.60, specs: { type: '全画幅微单', megapixel: '4571万', video: '8K', mount: 'Z' } },
  { brandId: 'br_nikon', name: 'Z7 II', series: 'Z', launchYear: 2020, msrp: 19799, baseRatio: 0.50, specs: { type: '全画幅微单', megapixel: '4575万', video: '4K', mount: 'Z' } },
  { brandId: 'br_nikon', name: 'Zfc', series: 'Z', launchYear: 2021, msrp: 6499, baseRatio: 0.55, specs: { type: 'APS-C微单', megapixel: '2088万', video: '4K', mount: 'Z DX' } },
  { brandId: 'br_nikon', name: 'D850', series: 'D', launchYear: 2017, msrp: 20800, baseRatio: 0.40, specs: { type: '全画幅单反', megapixel: '4575万', video: '4K', mount: 'F' } },

  { brandId: 'br_sony_cam', name: 'Alpha 1', series: 'Alpha', launchYear: 2021, msrp: 47999, baseRatio: 0.62, specs: { type: '全画幅微单', megapixel: '5010万', video: '8K', mount: 'E' } },
  { brandId: 'br_sony_cam', name: 'Alpha 7R V', series: 'Alpha', launchYear: 2022, msrp: 25999, baseRatio: 0.58, specs: { type: '全画幅微单', megapixel: '6100万', video: '8K', mount: 'E' } },
  { brandId: 'br_sony_cam', name: 'Alpha 7 IV', series: 'Alpha', launchYear: 2021, msrp: 16999, baseRatio: 0.55, specs: { type: '全画幅微单', megapixel: '3300万', video: '4K', mount: 'E' } },
  { brandId: 'br_sony_cam', name: 'Alpha 7C II', series: 'Alpha', launchYear: 2023, msrp: 13999, baseRatio: 0.60, specs: { type: '全画幅微单', megapixel: '3300万', video: '4K', mount: 'E' } },
  { brandId: 'br_sony_cam', name: 'Alpha 6700', series: 'Alpha', launchYear: 2023, msrp: 9999, baseRatio: 0.58, specs: { type: 'APS-C微单', megapixel: '2600万', video: '4K', mount: 'E' } },

  { brandId: 'br_fujifilm', name: 'X-T5', series: 'X-T', launchYear: 2022, msrp: 11990, baseRatio: 0.58, specs: { type: 'APS-C微单', megapixel: '4020万', video: '4K', mount: 'X' } },
  { brandId: 'br_fujifilm', name: 'X-H2S', series: 'X-H', launchYear: 2022, msrp: 16700, baseRatio: 0.58, specs: { type: 'APS-C微单', megapixel: '2616万', video: '6K', mount: 'X' } },
  { brandId: 'br_fujifilm', name: 'X100V', series: 'X100', launchYear: 2020, msrp: 9790, baseRatio: 0.65, specs: { type: '定焦便携', megapixel: '2610万', video: '4K', lens: '23mm' } },
  { brandId: 'br_fujifilm', name: 'GFX 100 II', series: 'GFX', launchYear: 2023, msrp: 48900, baseRatio: 0.62, specs: { type: '中画幅微单', megapixel: '10200万', video: '8K', mount: 'G' } },

  { brandId: 'br_leica', name: 'M11', series: 'M', launchYear: 2022, msrp: 68000, baseRatio: 0.62, specs: { type: '旁轴', megapixel: '6030万', video: '4K', mount: 'M' } },
  { brandId: 'br_leica', name: 'Q3', series: 'Q', launchYear: 2023, msrp: 49800, baseRatio: 0.65, specs: { type: '定焦便携', megapixel: '6000万', video: '8K', lens: '28mm' } },
  { brandId: 'br_leica', name: 'SL3', series: 'SL', launchYear: 2024, msrp: 58900, baseRatio: 0.64, specs: { type: '全画幅微单', megapixel: '6000万', video: '8K', mount: 'L' } },
  { brandId: 'br_leica', name: 'D-LUX 8', series: 'D-LUX', launchYear: 2023, msrp: 14800, baseRatio: 0.62, specs: { type: '便携DC', megapixel: '2500万', video: '4K', zoom: '3.2x' } },

  { brandId: 'br_rolex', name: '潜航者型 126610LN', series: 'Submariner', launchYear: 2020, msrp: 79400, baseRatio: 1.15, specs: { movement: '3235自动', caseSize: '41mm', material: '精钢', waterResist: '300m' } },
  { brandId: 'br_rolex', name: '日志型 126234', series: 'Datejust', launchYear: 2021, msrp: 65900, baseRatio: 0.90, specs: { movement: '3235自动', caseSize: '36mm', material: '精钢/白金', waterResist: '100m' } },
  { brandId: 'br_rolex', name: '格林尼治型II 126710BLRO', series: 'GMT-Master II', launchYear: 2018, msrp: 83200, baseRatio: 1.10, specs: { movement: '3285自动', caseSize: '40mm', material: '精钢', waterResist: '100m' } },
  { brandId: 'br_rolex', name: '宇宙计型迪通拿 126500LN', series: 'Daytona', launchYear: 2023, msrp: 130500, baseRatio: 1.50, specs: { movement: '4131自动', caseSize: '40mm', material: '精钢', waterResist: '100m' } },
  { brandId: 'br_rolex', name: '海使型 136660', series: 'Sea-Dweller', launchYear: 2022, msrp: 103600, baseRatio: 0.98, specs: { movement: '3235自动', caseSize: '43mm', material: '精钢', waterResist: '1220m' } },

  { brandId: 'br_omega', name: '海马300米 210.30.42.20.01.001', series: 'Seamaster', launchYear: 2021, msrp: 46100, baseRatio: 0.68, specs: { movement: '8800自动', caseSize: '42mm', material: '精钢', waterResist: '300m' } },
  { brandId: 'br_omega', name: '海马海洋宇宙600米 215.30.44.21.01.001', series: 'Planet Ocean', launchYear: 2022, msrp: 59200, baseRatio: 0.66, specs: { movement: '8900自动', caseSize: '43.5mm', material: '精钢', waterResist: '600m' } },
  { brandId: 'br_omega', name: '超霸月球表 310.30.42.50.01.001', series: 'Speedmaster', launchYear: 2021, msrp: 55900, baseRatio: 0.70, specs: { movement: '3861手动', caseSize: '42mm', material: '精钢', waterResist: '50m' } },
  { brandId: 'br_omega', name: '碟飞典雅 433.13.41.21.02.001', series: 'De Ville', launchYear: 2022, msrp: 42300, baseRatio: 0.62, specs: { movement: '8800自动', caseSize: '41mm', material: '精钢', waterResist: '30m' } },

  { brandId: 'br_cartier_w', name: '蓝气球 W69012Z4', series: 'Ballon Bleu', launchYear: 2020, msrp: 54000, baseRatio: 0.62, specs: { movement: '049自动', caseSize: '42mm', material: '精钢', waterResist: '30m' } },
  { brandId: 'br_cartier_w', name: '山度士 WSSA0029', series: 'Santos', launchYear: 2023, msrp: 63000, baseRatio: 0.65, specs: { movement: '1847 MC自动', caseSize: '40mm', material: '精钢', waterResist: '100m' } },
  { brandId: 'br_cartier_w', name: '坦克 WSTA0053', series: 'Tank', launchYear: 2022, msrp: 34500, baseRatio: 0.60, specs: { movement: '1847 MC自动', caseSize: '31mm', material: '精钢', waterResist: '30m' } },
  { brandId: 'br_cartier_w', name: '帕莎 WSPA0018', series: 'Pasha', launchYear: 2021, msrp: 47500, baseRatio: 0.60, specs: { movement: '1847 MC自动', caseSize: '41mm', material: '精钢', waterResist: '100m' } },

  { brandId: 'br_iwc', name: '葡萄牙七日链 IW500705', series: 'Portugieser', launchYear: 2020, msrp: 108000, baseRatio: 0.62, specs: { movement: '52010自动', caseSize: '42.3mm', material: '精钢', powerReserve: '168h' } },
  { brandId: 'br_iwc', name: '工程师 IW328903', series: 'Ingenieur', launchYear: 2023, msrp: 68800, baseRatio: 0.65, specs: { movement: '32111自动', caseSize: '40mm', material: '精钢', waterResist: '120m' } },
  { brandId: 'br_iwc', name: '飞行员 IW388102', series: 'Pilot', launchYear: 2021, msrp: 46200, baseRatio: 0.60, specs: { movement: '79320自动', caseSize: '41mm', material: '精钢', waterResist: '60m' } },
  { brandId: 'br_iwc', name: '海洋时计 IW358101', series: 'Aquatimer', launchYear: 2022, msrp: 42800, baseRatio: 0.60, specs: { movement: '32111自动', caseSize: '42mm', material: '精钢', waterResist: '300m' } },

  { brandId: 'br_tagheuer', name: '竞潜 WBP208B.BF0631', series: 'Aquaracer', launchYear: 2023, msrp: 21900, baseRatio: 0.58, specs: { movement: 'SW200自动', caseSize: '43mm', material: '精钢', waterResist: '300m' } },
  { brandId: 'br_tagheuer', name: '卡莱拉 CBN2010.BA0642', series: 'Carrera', launchYear: 2021, msrp: 32400, baseRatio: 0.60, specs: { movement: '80自动', caseSize: '42mm', material: '精钢', waterResist: '100m' } },
  { brandId: 'br_tagheuer', name: '摩纳哥 CBL2113.FC6177', series: 'Monaco', launchYear: 2022, msrp: 53600, baseRatio: 0.62, specs: { movement: 'Heuer 02自动', caseSize: '39mm', material: '精钢', waterResist: '100m' } },
  { brandId: 'br_tagheuer', name: '泰格豪雅Connected SBG8A10.BT6219', series: 'Connected', launchYear: 2023, msrp: 19300, baseRatio: 0.55, specs: { movement: '智能机芯', caseSize: '45mm', material: '钛金属', battery: '全天续航' } },

  { brandId: 'br_longines', name: '康卡斯 L3.781.4.96.6', series: 'HydroConquest', launchYear: 2022, msrp: 14700, baseRatio: 0.55, specs: { movement: 'L888自动', caseSize: '41mm', material: '精钢', waterResist: '300m' } },
  { brandId: 'br_longines', name: '名匠 L2.893.4.78.6', series: 'Master', launchYear: 2023, msrp: 19800, baseRatio: 0.58, specs: { movement: 'L899自动', caseSize: '40mm', material: '精钢', waterResist: '30m' } },
  { brandId: 'br_longines', name: '先行者 L3.810.4.73.2', series: 'Spirit', launchYear: 2021, msrp: 17800, baseRatio: 0.58, specs: { movement: 'L888自动', caseSize: '40mm', material: '精钢', waterResist: '100m' } },
  { brandId: 'br_longines', name: '嘉岚 L4.209.4.87.6', series: 'La Grande Classique', launchYear: 2020, msrp: 9500, baseRatio: 0.52, specs: { movement: 'L178石英', caseSize: '24mm', material: '精钢', waterResist: '30m' } },

  { brandId: 'br_hermes', name: 'Birkin 30', series: 'Birkin', launchYear: 2020, msrp: 280000, baseRatio: 1.20, specs: { material: 'Togo小牛皮', color: '黑金', hardware: '金色', size: '30x22x16cm' } },
  { brandId: 'br_hermes', name: 'Kelly 25', series: 'Kelly', launchYear: 2021, msrp: 220000, baseRatio: 1.15, specs: { material: 'Epsom皮', color: '大象灰', hardware: '金色', size: '25x17x7cm' } },
  { brandId: 'br_hermes', name: 'Constance 24', series: 'Constance', launchYear: 2022, msrp: 95000, baseRatio: 0.88, specs: { material: 'Evercolor皮', color: '蓝调午夜', hardware: '银色', size: '24x16x4.5cm' } },
  { brandId: 'br_hermes', name: 'Lindy 30', series: 'Lindy', launchYear: 2022, msrp: 75000, baseRatio: 0.80, specs: { material: 'Clemence皮', color: '金棕', hardware: '金色', size: '30x19x14cm' } },

  { brandId: 'br_chanel', name: 'Classic Flap 中号', series: 'Classic', launchYear: 2021, msrp: 82500, baseRatio: 0.92, specs: { material: '小羊皮', color: '黑色', hardware: '金色', size: '25.5x15.5x6.5cm' } },
  { brandId: 'br_chanel', name: 'Classic Flap 小号', series: 'Classic', launchYear: 2022, msrp: 72000, baseRatio: 0.90, specs: { material: '漆皮', color: '黑色', hardware: '银色', size: '23x14x6cm' } },
  { brandId: 'br_chanel', name: 'Coco Handle 中号', series: 'Coco', launchYear: 2022, msrp: 55000, baseRatio: 0.78, specs: { material: '鱼子酱牛皮', color: '黑色', hardware: '金色', size: '28x16x12cm' } },
  { brandId: 'br_chanel', name: '19 Bag 大号', series: '19', launchYear: 2023, msrp: 62000, baseRatio: 0.80, specs: { material: '小羊皮', color: '米白', hardware: '混金', size: '36x25x11cm' } },

  { brandId: 'br_lv', name: 'Neverfull MM', series: 'Neverfull', launchYear: 2022, msrp: 16800, baseRatio: 0.70, specs: { material: 'Monogram涂层帆布', color: '老花', lining: '米色', size: '32x29x17cm' } },
  { brandId: 'br_lv', name: 'Speedy 25', series: 'Speedy', launchYear: 2021, msrp: 12800, baseRatio: 0.68, specs: { material: 'Monogram帆布', color: '老花', lining: '棕色', size: '25x19x15cm' } },
  { brandId: 'br_lv', name: 'Alma BB', series: 'Alma', launchYear: 2022, msrp: 14500, baseRatio: 0.70, specs: { material: 'Epi皮革', color: '靛蓝', lining: '红色', size: '23.5x17.5x11cm' } },
  { brandId: 'br_lv', name: 'Pochette Metis', series: 'Pochette', launchYear: 2023, msrp: 19800, baseRatio: 0.80, specs: { material: 'Monogram Reverse', color: '老花拼色', lining: '米色', size: '25x19x7cm' } },
  { brandId: 'br_lv', name: 'Keepall 45', series: 'Keepall', launchYear: 2021, msrp: 18500, baseRatio: 0.65, specs: { material: 'Monogram帆布', color: '老花', lining: '棕色', size: '45x27x20cm' } },

  { brandId: 'br_gucci', name: 'GG Marmont 小号', series: 'GG Marmont', launchYear: 2022, msrp: 19500, baseRatio: 0.68, specs: { material: 'Matelassé皮革', color: '黑色', hardware: '仿古金', size: '26x15x7cm' } },
  { brandId: 'br_gucci', name: 'Dionysus 酒神 小号', series: 'Dionysus', launchYear: 2021, msrp: 21000, baseRatio: 0.65, specs: { material: '涂层帆布', color: '老花', hardware: '银色虎头', size: '28x17x9cm' } },
  { brandId: 'br_gucci', name: 'Jackie 1961 小号', series: 'Jackie', launchYear: 2023, msrp: 18000, baseRatio: 0.70, specs: { material: '皮革', color: '棕色', hardware: '金色', size: '27.5x19x4cm' } },
  { brandId: 'br_gucci', name: 'Ophidia 中号', series: 'Ophidia', launchYear: 2022, msrp: 14000, baseRatio: 0.65, specs: { material: '帆布拼皮', color: '老花', hardware: '金色', size: '30x23x13cm' } },

  { brandId: 'br_dior', name: 'Lady Dior 小号', series: 'Lady', launchYear: 2022, msrp: 41000, baseRatio: 0.72, specs: { material: '小羊皮', color: '藕粉', hardware: '金色', size: '20x18x10cm' } },
  { brandId: 'br_dior', name: 'Saddle 马鞍包 中号', series: 'Saddle', launchYear: 2023, msrp: 27000, baseRatio: 0.70, specs: { material: 'Oblique印花', color: '老花', hardware: '金色', size: '25.5x20x6.5cm' } },
  { brandId: 'br_dior', name: 'Book Tote 小号', series: 'Book Tote', launchYear: 2022, msrp: 26500, baseRatio: 0.72, specs: { material: '刺绣帆布', color: '老虎印花', hardware: '无', size: '36x27.5x16.5cm' } },
  { brandId: 'br_dior', name: '30 Montaigne 中号', series: '30 Montaigne', launchYear: 2021, msrp: 33000, baseRatio: 0.70, specs: { material: '粒面小牛皮', color: '黑色', hardware: '金色CD', size: '28.5x20.5x8cm' } },

  { brandId: 'br_prada', name: 'Re-Edition 2005 腋下包', series: 'Re-Edition', launchYear: 2022, msrp: 12000, baseRatio: 0.72, specs: { material: '再生尼龙', color: '黑色', hardware: '银色', size: '22x18x5cm' } },
  { brandId: 'br_prada', name: 'Galleria 杀手包 中号', series: 'Galleria', launchYear: 2021, msrp: 28500, baseRatio: 0.62, specs: { material: 'Saffiano十字纹皮', color: '黑色', hardware: '金色', size: '33x24x14cm' } },
  { brandId: 'br_prada', name: 'Cleo 小号', series: 'Cleo', launchYear: 2023, msrp: 17500, baseRatio: 0.70, specs: { material: '亮面皮革', color: '薄荷绿', hardware: '银色', size: '27x20x5cm' } },
  { brandId: 'br_prada', name: 'Triangle 三角包 中号', series: 'Triangle', launchYear: 2022, msrp: 14800, baseRatio: 0.68, specs: { material: '尼龙', color: '黑色', hardware: '银色', size: '31x26x12cm' } },

  { brandId: 'br_burberry', name: 'TB Logo 中号托特', series: 'TB', launchYear: 2022, msrp: 17500, baseRatio: 0.62, specs: { material: '帆布拼皮', color: '格纹', hardware: '金色', size: '33x28x15cm' } },
  { brandId: 'br_burberry', name: 'Lola 萝拉 小号', series: 'Lola', launchYear: 2023, msrp: 15500, baseRatio: 0.65, specs: { material: 'Quilted皮革', color: '黑色', hardware: '金色', size: '23x13x6cm' } },
  { brandId: 'br_burberry', name: 'Frances 小号', series: 'Frances', launchYear: 2021, msrp: 23000, baseRatio: 0.62, specs: { material: '粒面皮革', color: '驼色', hardware: '金色', size: '25x20x8cm' } },
  { brandId: 'br_burberry', name: 'Pocket 口袋包 中号', series: 'Pocket', launchYear: 2022, msrp: 13800, baseRatio: 0.60, specs: { material: '帆布拼皮', color: '格纹棕', hardware: '银色', size: '31x26x14cm' } },

  { brandId: 'br_cartier_j', name: 'LOVE 手镯 宽版 18K玫瑰金', series: 'LOVE', launchYear: 2020, msrp: 56000, baseRatio: 0.80, specs: { material: '18K玫瑰金', size: '17号', gemstone: '无', weight: '31g' } },
  { brandId: 'br_cartier_j', name: 'LOVE 戒指 18K黄金', series: 'LOVE', launchYear: 2021, msrp: 16300, baseRatio: 0.78, specs: { material: '18K黄金', size: '54号', gemstone: '无', weight: '7.4g' } },
  { brandId: 'br_cartier_j', name: 'Juste un Clou 钉子手镯', series: 'Juste un Clou', launchYear: 2022, msrp: 44000, baseRatio: 0.78, specs: { material: '18K白金', size: '17号', gemstone: '无', weight: '27g' } },
  { brandId: 'br_cartier_j', name: 'Ballon Blanc de Cartier 项链', series: 'Ballon', launchYear: 2023, msrp: 24800, baseRatio: 0.75, specs: { material: '18K玫瑰金', chain: '42cm', gemstone: '一颗钻石0.05ct', weight: '4.2g' } },

  { brandId: 'br_tiffany', name: 'T系列 T1 宽版手镯 18K金', series: 'T', launchYear: 2021, msrp: 36000, baseRatio: 0.72, specs: { material: '18K黄金', size: '大号', gemstone: '无', weight: '22.5g' } },
  { brandId: 'br_tiffany', name: 'Tiffany T Smile 项链', series: 'T', launchYear: 2022, msrp: 12500, baseRatio: 0.70, specs: { material: '18K玫瑰金', chain: '45cm', gemstone: '无', weight: '3.8g' } },
  { brandId: 'br_tiffany', name: 'HardWear 系列链环耳环', series: 'HardWear', launchYear: 2023, msrp: 15800, baseRatio: 0.72, specs: { material: '18K黄金', style: '链环', gemstone: '无', weight: '11.2g' } },
  { brandId: 'br_tiffany', name: 'Soleste 系列 单钻戒指', series: 'Soleste', launchYear: 2020, msrp: 48000, baseRatio: 0.70, specs: { material: '铂金950', size: '52号', gemstone: '0.5ct VVS2 D色', weight: '5.8g' } },

  { brandId: 'br_vancleef', name: 'Alhambra 四叶草 10花项链', series: 'Vintage Alhambra', launchYear: 2021, msrp: 58000, baseRatio: 0.82, specs: { material: '18K黄金', chain: '90cm', gemstone: '白母贝', weight: '14.5g' } },
  { brandId: 'br_vancleef', name: 'Alhambra 四叶草 五花手链', series: 'Vintage Alhambra', launchYear: 2022, msrp: 38000, baseRatio: 0.80, specs: { material: '18K黄金', size: '17cm', gemstone: '红玉髓', weight: '8.2g' } },
  { brandId: 'br_vancleef', name: 'Perlée 系列 戒指', series: 'Perlée', launchYear: 2023, msrp: 18500, baseRatio: 0.75, specs: { material: '18K玫瑰金', size: '54号', gemstone: '无', weight: '5.6g' } },
  { brandId: 'br_vancleef', name: 'Frivole 系列 耳环', series: 'Frivole', launchYear: 2022, msrp: 42000, baseRatio: 0.78, specs: { material: '18K黄金', style: '三花瓣', gemstone: '祖母绿0.2ct', weight: '6.8g' } },

  { brandId: 'br_bvlgari', name: 'B.zero1 系列 三环戒指', series: 'B.zero1', launchYear: 2021, msrp: 18500, baseRatio: 0.72, specs: { material: '18K玫瑰金', size: '54号', gemstone: '无', weight: '10.2g' } },
  { brandId: 'br_bvlgari', name: 'Serpenti 系列 手镯', series: 'Serpenti', launchYear: 2022, msrp: 48500, baseRatio: 0.75, specs: { material: '18K玫瑰金', size: 'M号', gemstone: '全密镶钻石1.5ct', weight: '45g' } },
  { brandId: 'br_bvlgari', name: 'Serpenti Viper 项链', series: 'Serpenti', launchYear: 2023, msrp: 28500, baseRatio: 0.72, specs: { material: '18K白金', chain: '42cm', gemstone: '蛇眼钻石0.1ct', weight: '9.8g' } },
  { brandId: 'br_bvlgari', name: 'Divas Dream 耳环', series: 'Divas', launchYear: 2022, msrp: 22800, baseRatio: 0.70, specs: { material: '18K玫瑰金', style: '扇形', gemstone: '孔雀石+钻石', weight: '7.2g' } },
];

export const productModels: ProductModel[] = modelSeeds.map((m, i) => ({
  id: uid('mdl', i + 1),
  brandId: m.brandId,
  name: m.name,
  series: m.series,
  launchYear: m.launchYear,
  msrp: m.msrp,
  specs: m.specs,
  basePrice: Math.round(m.msrp * m.baseRatio),
}));

export const serialRules: SerialRule[] = productModels.map((m, i) => ({
  id: uid('sr', i + 1),
  modelId: m.id,
  pattern: '^[A-Z0-9]{10,15}$',
  algo: i % 2 === 0 ? 'checksum_luhn' : 'prefix_date_decode',
  lookupUrl: `https://verify.example.com/${m.brandId}/${m.id}?sn=`,
}));

export const getSerialRuleByModelId = (modelId: string): SerialRule | undefined =>
  serialRules.find((r) => r.modelId === modelId);
