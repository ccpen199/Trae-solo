export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidIdCard(idCard: string): boolean {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
}

export function isValidBankCard(cardNumber: string): boolean {
  return /^\d{16,19}$/.test(cardNumber.replace(/\s/g, ''));
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0;
}

export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateRequired(fields: Record<string, any>, required: string[]): string[] {
  const errors: string[] = [];
  for (const field of required) {
    if (fields[field] === undefined || fields[field] === null || fields[field] === '') {
      errors.push(`${field} 不能为空`);
    }
  }
  return errors;
}

