const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

const validateIdCard = (idCard) => {
  if (!idCard || typeof idCard !== 'string') {
    return { valid: false, message: '身份证号不能为空' };
  }

  const upperIdCard = idCard.toUpperCase();

  if (!/^\d{17}[\dX]$/.test(upperIdCard)) {
    return { valid: false, message: '身份证号格式不正确，应为18位数字（最后一位可为X）' };
  }

  const year = parseInt(upperIdCard.substring(6, 10), 10);
  const month = parseInt(upperIdCard.substring(10, 12), 10);
  const day = parseInt(upperIdCard.substring(12, 14), 10);

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return { valid: false, message: '身份证号出生年份无效' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, message: '身份证号出生月份无效' };
  }

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (day < 1 || day > (isLeap ? 29 : 28)) {
      return { valid: false, message: '身份证号出生日期无效' };
    }
  } else {
    if (day < 1 || day > daysInMonth[month - 1]) {
      return { valid: false, message: '身份证号出生日期无效' };
    }
  }

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(upperIdCard[i], 10) * WEIGHTS[i];
  }

  const checkCodeIndex = sum % 11;
  const expectedCheckCode = CHECK_CODES[checkCodeIndex];

  if (upperIdCard[17] !== expectedCheckCode) {
    return { valid: false, message: '身份证号校验码不正确' };
  }

  const birthDate = new Date(year, month - 1, day);
  const age = currentYear - year;
  if (age < 0 || age > 150) {
    return { valid: false, message: '身份证号年龄超出合理范围' };
  }

  return { 
    valid: true, 
    message: '身份证号有效',
    info: {
      provinceCode: upperIdCard.substring(0, 2),
      cityCode: upperIdCard.substring(2, 4),
      countyCode: upperIdCard.substring(4, 6),
      birthYear: year,
      birthMonth: month,
      birthDay: day,
      gender: parseInt(upperIdCard.substring(16, 17), 10) % 2 === 1 ? 'male' : 'female',
      age: age
    }
  };
};

module.exports = { validateIdCard };
