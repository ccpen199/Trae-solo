export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) {
    return phone || "";
  }
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}

export function maskIdCard(idCard: string): string {
  if (!idCard) {
    return "";
  }
  if (idCard.length === 15) {
    return idCard.slice(0, 6) + "********" + idCard.slice(-3);
  }
  if (idCard.length === 18) {
    return idCard.slice(0, 6) + "********" + idCard.slice(-4);
  }
  return idCard;
}

export function maskName(name: string): string {
  if (!name) {
    return "";
  }
  if (name.length <= 1) {
    return name;
  }
  if (name.length === 2) {
    return name[0] + "*";
  }
  return name[0] + "*".repeat(name.length - 2) + name.slice(-1);
}
