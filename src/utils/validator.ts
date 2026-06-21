export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function validateIdCard(idCard: string): boolean {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return reg.test(idCard);
}

export function validateEmail(email: string): boolean {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return reg.test(email);
}

export function validateCreditCode(code: string): boolean {
  const reg = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
  return reg.test(code);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度不能少于8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需要包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需要包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需要包含数字' };
  }
  return { valid: true };
}

export function validateLicenseNumber(number: string): boolean {
  const reg = /^\d{17}$/;
  return reg.test(number);
}

export function required(value: any): string | undefined {
  if (value === undefined || value === null || value === '') {
    return '此字段为必填项';
  }
  return undefined;
}

export function minLength(min: number) {
  return (value: string): string | undefined => {
    if (value && value.length < min) {
      return `最少需要${min}个字符`;
    }
    return undefined;
  };
}

export function maxLength(max: number) {
  return (value: string): string | undefined => {
    if (value && value.length > max) {
      return `最多允许${max}个字符`;
    }
    return undefined;
  };
}

export function minValue(min: number) {
  return (value: number): string | undefined => {
    if (value !== undefined && value < min) {
      return `数值不能小于${min}`;
    }
    return undefined;
  };
}

export function maxValue(max: number) {
  return (value: number): string | undefined => {
    if (value !== undefined && value > max) {
      return `数值不能大于${max}`;
    }
    return undefined;
  };
}

export function validateFileSize(maxSizeMB: number) {
  return (file: File): string | undefined => {
    if (file && file.size > maxSizeMB * 1024 * 1024) {
      return `文件大小不能超过${maxSizeMB}MB`;
    }
    return undefined;
  };
}

export function validateFileType(allowedTypes: string[]) {
  return (file: File): string | undefined => {
    if (file && !allowedTypes.includes(file.type)) {
      return `仅支持以下格式：${allowedTypes.join(', ')}`;
    }
    return undefined;
  };
}
