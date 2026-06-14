export const CATEGORY_LABELS: Record<string, string> = {
  clothing: '衣服',
  book: '图书',
  phone: '手机',
};

export const CONDITION_OPTIONS = [
  { value: '全新', label: '全新' },
  { value: '九成新', label: '九成新' },
  { value: '八成新', label: '八成新' },
  { value: '七成新', label: '七成新' },
  { value: '六成新', label: '六成新' },
];

export const TIME_SLOT_TEMPLATES = [
  { value: 'morning', label: '上午 9:00-12:00' },
  { value: 'afternoon', label: '下午 13:00-17:00' },
  { value: 'evening', label: '晚间 18:00-20:00' },
];

export const BRAND_LISTS: Record<string, string[]> = {
  clothing: ['Nike', 'Adidas', '优衣库', 'ZARA', 'H&M', '波司登', '李宁', '安踏'],
  book: ['人民文学出版社', '中信出版社', '机械工业出版社', '清华大学出版社', '电子工业出版社'],
  phone: ['Apple', 'Huawei', 'Xiaomi', 'OPPO', 'vivo', 'Samsung'],
};

export const MODEL_LISTS: Record<string, { value: string; label: string }[]> = {
  phone: [
    { value: 'iPhone 13', label: 'iPhone 13' },
    { value: 'iPhone 14', label: 'iPhone 14' },
    { value: 'iPhone 15', label: 'iPhone 15' },
    { value: 'Mate 60', label: 'Mate 60' },
    { value: 'P60', label: 'P60' },
    { value: 'Redmi Note 12', label: 'Redmi Note 12' },
    { value: 'Reno 10', label: 'Reno 10' },
    { value: 'X100', label: 'X100' },
    { value: 'Galaxy S23', label: 'Galaxy S23' },
  ],
  book: [
    { value: 'Python编程', label: 'Python编程' },
    { value: '经济学原理', label: '经济学原理' },
    { value: '人类简史', label: '人类简史' },
    { value: '三体', label: '三体' },
    { value: '深度学习', label: '深度学习' },
  ],
  clothing: [],
};
