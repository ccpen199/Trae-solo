export const desensitizePhone = (phone: string): string => {
  if (!phone || phone.length < 7) {
    return phone || '';
  }
  return phone.slice(0, 3) + '****' + phone.slice(7);
};

export const desensitizeName = (name: string): string => {
  if (!name) {
    return '';
  }
  if (name.length === 1) {
    return name;
  }
  if (name.length === 2) {
    return name[0] + '*';
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
};

export const desensitizeIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 10) {
    return idCard || '';
  }
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
};

export const desensitizeBankCard = (bankCard: string): string => {
  if (!bankCard || bankCard.length < 8) {
    return bankCard || '';
  }
  const cleaned = bankCard.replace(/\s/g, '');
  return cleaned.slice(0, 4) + ' **** **** ' + cleaned.slice(-4);
};

export const desensitizeEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return email || '';
  }
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return '*'.repeat(name.length) + '@' + domain;
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1] + '@' + domain;
};
