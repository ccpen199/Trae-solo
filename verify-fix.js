import { mockCases } from './src/mock/data.ts';

const chineseNumMap = {
  '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

function extractRoomCount(houseType, layout) {
  const text = (houseType || layout || '');
  if (!text) return null;

  const digitMatch = text.match(/(\d+)\s*[室居室房]/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 10) return num;
  }

  const chineseMatch = text.match(/([一两二三四五六七八九十])\s*[室居室房]/);
  if (chineseMatch) {
    return chineseNumMap[chineseMatch[1]] || null;
  }

  return null;
}

console.log('=== Mock 案例数据验证 ===\n');

console.log('所有案例的居室数信息:');
mockCases.forEach((c) => {
  const extracted = extractRoomCount(c.houseType, c.layout);
  console.log(`  ${c.id}: ${c.title}`);
  console.log(`    houseType=${c.houseType}, rooms=${c.rooms}, bedrooms=${c.bedrooms}, 提取居室数=${extracted}`);
});

console.log('\n=== 筛选测试 ===\n');

function filterByRooms(roomFilters) {
  return mockCases.filter((c) => {
    const roomCount = extractRoomCount(c.houseType, c.layout) || c.rooms || c.bedrooms || 0;
    if (roomFilters.includes(5)) {
      return roomCount >= 5;
    }
    return roomFilters.includes(roomCount);
  });
}

[1, 2, 3, 4, 5].forEach((room) => {
  const result = filterByRooms([room]);
  console.log(`筛选 ${room}室: ${result.length} 个结果`);
  result.forEach((c) => console.log(`  - ${c.title} (${c.houseType})`));
  console.log('');
});

const styles = ['现代简约', '北欧风格', '新中式', '日式', '美式', '法式', '轻奢风格', '工业风', '极简主义', 'ins风', '欧式古典', '地中海'];
console.log('=== 风格筛选测试 ===\n');
styles.forEach((style) => {
  const result = mockCases.filter((c) => c.style === style);
  console.log(`${style}: ${result.length} 个结果`);
});

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆', '苏州', '天津'];
console.log('\n=== 城市筛选测试 ===\n');
cities.forEach((city) => {
  const result = mockCases.filter((c) => c.city === city);
  console.log(`${city}: ${result.length} 个结果`);
});

console.log('\n=== 面积区间测试 ===\n');
const areaRanges = [
  [0, 50], [50, 80], [80, 120], [120, 200], [200, 300]
];
areaRanges.forEach(([min, max]) => {
  const result = mockCases.filter((c) => c.area >= min && c.area <= max);
  console.log(`${min}-${max}㎡: ${result.length} 个结果`);
});

console.log('\n=== 预算区间测试 ===\n');
const budgetRanges = [
  [0, 100000], [100000, 200000], [200000, 400000], [400000, 800000], [800000, 1000000]
];
budgetRanges.forEach(([min, max]) => {
  const result = mockCases.filter((c) => c.budget >= min && c.budget <= max);
  console.log(`${min/10000}万-${max/10000}万: ${result.length} 个结果`);
});
