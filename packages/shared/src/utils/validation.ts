import { PHONE_REGEX, ID_CARD_REGEX, EMAIL_REGEX, SUBDOMAIN_REGEX, PRICE_REGEX } from '../constants/regex';

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validateIdCard(idCard: string): boolean {
  if (!ID_CARD_REGEX.test(idCard)) return false;

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i], 10) * weights[i];
  }

  const checkCode = checkCodes[sum % 11];
  return idCard[17].toUpperCase() === checkCode;
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validateSubdomain(subdomain: string): boolean {
  return SUBDOMAIN_REGEX.test(subdomain);
}

export function validatePrice(price: number): boolean {
  return PRICE_REGEX.test(price.toString()) && price >= 0;
}
