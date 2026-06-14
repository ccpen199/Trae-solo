import dayjs from 'dayjs';

export interface IdCardInfo {
  birthday: string;
  age: number;
  gender: '男' | '女';
  isAdult: boolean;
  province: string;
}

const genderMap: Record<string, string> = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
  '71': '台湾', '81': '香港', '82': '澳门', '91': '国外',
};

export const parseIdCard = (idCard: string): IdCardInfo | null => {
  if (!idCard || (idCard.length !== 18 && idCard.length !== 15)) return null;

  let birthday: string;
  let genderCode: string;
  let provinceCode: string;

  if (idCard.length === 18) {
    birthday = `${idCard.substring(6, 10)}-${idCard.substring(10, 12)}-${idCard.substring(12, 14)}`;
    genderCode = idCard.substring(16, 17);
    provinceCode = idCard.substring(0, 2);
  } else {
    birthday = `19${idCard.substring(6, 8)}-${idCard.substring(8, 10)}-${idCard.substring(10, 12)}`;
    genderCode = idCard.substring(14, 15);
    provinceCode = idCard.substring(0, 2);
  }

  const age = dayjs().diff(dayjs(birthday), 'year');
  const gender: '男' | '女' = Number(genderCode) % 2 === 1 ? '男' : '女';
  const isAdult = age >= 18;
  const province = genderMap[provinceCode] || '未知';

  return { birthday, age, gender, isAdult, province };
};

export const getAgeFromIdCard = (idCard: string): number => {
  const info = parseIdCard(idCard);
  return info?.age ?? -1;
};

export const getGenderFromIdCard = (idCard: string): '男' | '女' | '-' => {
  const info = parseIdCard(idCard);
  return info?.gender ?? '-';
};

export const isAdultFromIdCard = (idCard: string): boolean => {
  const info = parseIdCard(idCard);
  return info?.isAdult ?? true;
};
