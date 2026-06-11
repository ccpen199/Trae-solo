export const validateIdCard = (idCard: string): { valid: boolean; message?: string } => {
  if (!idCard) {
    return { valid: false, message: '请输入身份证号' };
  }
  
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idCardRegex.test(idCard)) {
    return { valid: false, message: '身份证号格式不正确' };
  }
  
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard.charAt(i)) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  const lastChar = idCard.charAt(17).toUpperCase();
  
  if (lastChar !== checkCode) {
    return { valid: false, message: '身份证号校验位不正确' };
  }
  
  return { valid: true };
};

export const validatePhone = (phone: string): { valid: boolean; message?: string } => {
  if (!phone) {
    return { valid: false, message: '请输入手机号' };
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '手机号格式不正确' };
  }
  
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; message?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, message: '请输入姓名' };
  }
  
  const nameRegex = /^[\u4e00-\u9fa5·]{2,20}$/;
  if (!nameRegex.test(name.trim())) {
    return { valid: false, message: '姓名应为2-20个中文字符' };
  }
  
  return { valid: true };
};

export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  if (!email) {
    return { valid: true };
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: '邮箱格式不正确' };
  }
  
  return { valid: true };
};

export const validateSmsCode = (code: string): { valid: boolean; message?: string } => {
  if (!code) {
    return { valid: false, message: '请输入验证码' };
  }
  
  const codeRegex = /^\d{6}$/;
  if (!codeRegex.test(code)) {
    return { valid: false, message: '验证码应为6位数字' };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: '请输入密码' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: '密码长度不能少于6位' };
  }
  
  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' };
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: '密码需包含字母和数字' };
  }
  
  return { valid: true };
};

export const validateAddress = (address: string): { valid: boolean; message?: string } => {
  if (!address || !address.trim()) {
    return { valid: false, message: '请输入详细地址' };
  }
  
  if (address.trim().length < 5) {
    return { valid: false, message: '地址信息不完整' };
  }
  
  return { valid: true };
};

export const validateIdCardInfo = (name: string, idCard: string): { valid: boolean; message?: string } => {
  const nameResult = validateName(name);
  if (!nameResult.valid) {
    return nameResult;
  }
  
  const idCardResult = validateIdCard(idCard);
  if (!idCardResult.valid) {
    return idCardResult;
  }
  
  const birthYear = parseInt(idCard.substring(6, 10));
  const birthMonth = parseInt(idCard.substring(10, 12));
  const birthDay = parseInt(idCard.substring(12, 14));
  const genderCode = parseInt(idCard.substring(16, 17));
  
  const currentYear = new Date().getFullYear();
  if (birthYear < 1900 || birthYear > currentYear) {
    return { valid: false, message: '身份证号出生年份不正确' };
  }
  
  if (birthMonth < 1 || birthMonth > 12) {
    return { valid: false, message: '身份证号出生月份不正确' };
  }
  
  if (birthDay < 1 || birthDay > 31) {
    return { valid: false, message: '身份证号出生日期不正确' };
  }
  
  if (genderCode < 0 || genderCode > 9) {
    return { valid: false, message: '身份证号性别位不正确' };
  }
  
  return { valid: true };
};

export const getGenderFromIdCard = (idCard: string): 'male' | 'female' | null => {
  if (!idCard || idCard.length < 17) return null;
  const genderCode = parseInt(idCard.substring(16, 17));
  return genderCode % 2 === 1 ? 'male' : 'female';
};

export const getBirthDateFromIdCard = (idCard: string): string | null => {
  if (!idCard || idCard.length < 14) return null;
  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  return `${year}-${month}-${day}`;
};

export const getAgeFromIdCard = (idCard: string): number | null => {
  const birthDate = getBirthDateFromIdCard(idCard);
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};
