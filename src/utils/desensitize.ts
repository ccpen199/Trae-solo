export const desensitizeIdCard = (idCard: string): string => {
  if (!idCard) return ''
  if (idCard.length === 18) {
    return idCard.substring(0, 6) + '********' + idCard.substring(14)
  }
  if (idCard.length === 15) {
    return idCard.substring(0, 6) + '*****' + idCard.substring(11)
  }
  return idCard.substring(0, 3) + '****' + idCard.substring(idCard.length - 4)
}

export const desensitizePhone = (phone: string): string => {
  if (!phone) return ''
  phone = phone.replace(/\s/g, '')
  if (phone.length === 11) {
    return phone.substring(0, 3) + '****' + phone.substring(7)
  }
  if (phone.length > 7) {
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
  }
  return phone
}

export const desensitizeName = (name: string): string => {
  if (!name) return ''
  if (name.length === 1) {
    return name
  }
  if (name.length === 2) {
    return name.charAt(0) + '*'
  }
  if (name.length === 3) {
    return name.charAt(0) + '*' + name.charAt(2)
  }
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
}

export const desensitizeEmail = (email: string): string => {
  if (!email) return ''
  const atIndex = email.indexOf('@')
  if (atIndex <= 0) return email
  const username = email.substring(0, atIndex)
  const domain = email.substring(atIndex)
  if (username.length <= 1) {
    return '*' + domain
  }
  if (username.length === 2) {
    return username.charAt(0) + '*' + domain
  }
  return username.charAt(0) + '*'.repeat(Math.min(username.length - 2, 4)) + username.charAt(username.length - 1) + domain
}

export const desensitizeBankCard = (bankCard: string): string => {
  if (!bankCard) return ''
  bankCard = bankCard.replace(/\s/g, '')
  if (bankCard.length <= 8) {
    return bankCard
  }
  return bankCard.substring(0, 4) + ' **** **** ' + bankCard.substring(bankCard.length - 4)
}

export const desensitizeAddress = (address: string): string => {
  if (!address) return ''
  if (address.length <= 6) {
    return address
  }
  return address.substring(0, 6) + '***'
}

export const desensitizeIp = (ip: string): string => {
  if (!ip) return ''
  const parts = ip.split('.')
  if (parts.length === 4) {
    return parts[0] + '.' + parts[1] + '.*.*'
  }
  return ip
}

export const desensitizeLicensePlate = (plate: string): string => {
  if (!plate) return ''
  if (plate.length <= 2) return plate
  return plate.substring(0, 2) + '***' + plate.substring(plate.length - 1)
}

export const desensitize = (value: string, type: 'idCard' | 'phone' | 'name' | 'email' | 'bankCard' | 'address' | 'ip' | 'licensePlate'): string => {
  switch (type) {
    case 'idCard':
      return desensitizeIdCard(value)
    case 'phone':
      return desensitizePhone(value)
    case 'name':
      return desensitizeName(value)
    case 'email':
      return desensitizeEmail(value)
    case 'bankCard':
      return desensitizeBankCard(value)
    case 'address':
      return desensitizeAddress(value)
    case 'ip':
      return desensitizeIp(value)
    case 'licensePlate':
      return desensitizeLicensePlate(value)
    default:
      return value
  }
}

export default desensitize
