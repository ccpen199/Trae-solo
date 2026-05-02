export class ElectronicReceiptEngine {
  processSign(waybillId, signData) {
    const { signed_by, signature_data, photos, location, remark } = signData

    const verification = this.verifySign({
      signature_data,
      photos,
      location
    })

    return {
      waybill_id: waybillId,
      signed_by,
      signed_at: new Date().toISOString(),
      signature_image: signature_data,
      photos: photos || [],
      location: location || null,
      remark: remark || '',
      verification
    }
  }

  verifySign(signData) {
    const { signature_data, photos, location } = signData

    const verification = {
      signature_valid: false,
      seal_detected: false,
      location_match: true,
      photo_count: photos?.length || 0,
      warnings: []
    }

    if (signature_data && signature_data.length > 100) {
      verification.signature_valid = true
    } else {
      verification.warnings.push('签名数据异常')
    }

    if (photos && photos.length >= 1) {
      verification.seal_detected = true
    } else {
      verification.warnings.push('缺少回单照片')
    }

    if (!location) {
      verification.warnings.push('签收位置缺失')
      verification.location_match = false
    }

    return verification
  }

  validatePhoto(photo) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    const maxSize = 10 * 1024 * 1024

    if (!allowedTypes.includes(photo.type)) {
      return { valid: false, error: '不支持的图片格式' }
    }

    if (photo.size > maxSize) {
      return { valid: false, error: '图片大小不能超过10MB' }
    }

    return { valid: true }
  }

  generateReceiptNo() {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `RC-${timestamp}-${random}`
  }

  extractSealInfo(photoBase64) {
    return {
      detected: true,
      company_name: '某公司',
      seal_number: 'XXX-XXXX'
    }
  }
}
