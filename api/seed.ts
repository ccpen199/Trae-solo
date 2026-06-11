import { v4 as uuidv4 } from 'uuid'
import db from './database.js'

const names = [
  '张建国', '李秀英', '王德明', '刘桂兰', '陈志强',
  '杨淑芬', '赵文华', '黄世民', '周美玲', '吴国栋',
  '徐慧敏', '孙长青', '马凤芝', '朱永康', '胡玉兰',
  '郭庆丰', '何春梅', '林正义', '高丽华', '罗振邦',
  '梁秀珍', '宋明远', '郑桂花', '谢洪涛', '韩翠萍',
  '唐伟民', '冯雪琴', '董建成', '萧瑞芳', '程光明',
  '曹玉珍', '袁家兴', '邓素芬', '许志远', '傅秋霞',
  '沈国华', '曾丽娟', '彭福来', '吕秀荣', '苏守信',
  '蒋美英', '蔡德厚', '贾惠芬', '潘树森', '丁彩云',
  '魏长安', '薛凤英', '叶启明', '阎淑贤', '余庆华',
  '段金凤', '钟永祥'
]

const regions = [
  '济南市', '青岛市', '烟台市', '潍坊市', '临沂市',
  '济宁市', '淄博市', '威海市', '德州市', '泰安市'
]

const failureReasons = ['人脸不匹配', '活体检测失败', '网络异常', '系统超时', '信息不一致']

const actions = [
  '提交认证', '认证通过', '认证失败', '人脸识别', '活体检测',
  '提交审核', '审核通过', '审核驳回', '生成凭证', '查询状态'
]

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const d = new Date(s + Math.random() * (e - s))
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

function generateIdCard(index: number): string {
  const prefixes = ['370102', '370203', '370602', '370705', '371302', '370811', '370303', '371002', '371402', '370902']
  const prefix = prefixes[index % prefixes.length]
  const birth = randomDate('1945-01-01', '1965-12-31').replace(/-/g, '').substring(0, 8)
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  const body = prefix + birth + seq
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checks = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(body[i]) * weights[i]
  }
  return body + checks[sum % 11]
}

function generateSocialSecurityNo(index: number): string {
  return 'SD' + String(370100 + index * 37).substring(0, 6) + String(Math.floor(Math.random() * 99999999)).padStart(8, '0')
}

function generateDeviceFingerprint(): string {
  const chars = 'abcdef0123456789'
  let fp = ''
  for (let i = 0; i < 32; i++) {
    fp += chars[Math.floor(Math.random() * chars.length)]
  }
  return fp
}

function generateIpAddress(): string {
  return `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function generateCertNo(index: number): string {
  return 'CERT' + String(2025000 + index).padStart(10, '0')
}

export function seedDatabase(): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM certifications').get() as { cnt: number }
  if (count.cnt > 0) return

  const insertCert = db.prepare(`
    INSERT INTO certifications (certification_id, id_card, name, social_security_no, status, failure_reason, device_fingerprint, cert_no, verify_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAlert = db.prepare(`
    INSERT INTO alerts (alert_id, type, level, id_card, detail, status, trigger_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertReview = db.prepare(`
    INSERT INTO review_orders (order_id, certification_id, id_card, name, status, review_comment, reviewer, review_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (log_id, certification_id, id_card, action, device_fingerprint, ip_address, detail, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertScreenshot = db.prepare(`
    INSERT INTO screenshots (screenshot_id, certification_id, frame_url, frame_order, captured_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  const certifications: Array<{
    certification_id: string
    id_card: string
    name: string
    social_security_no: string
    status: string
    failure_reason: string | null
    device_fingerprint: string
    cert_no: string | null
    verify_time: string | null
    created_at: string
  }> = []

  db.transaction(() => {
    for (let i = 0; i < 55; i++) {
      const id = uuidv4()
      const name = names[i % names.length]
      const idCard = generateIdCard(i)
      const ssNo = generateSocialSecurityNo(i)
      const device = generateDeviceFingerprint()
      const createdAt = randomDate('2025-01-01', '2026-06-09')

      const rand = Math.random()
      let status: string
      let failureReason: string | null = null
      let certNo: string | null = null

      if (rand < 0.65) {
        status = 'success'
        certNo = generateCertNo(i)
      } else if (rand < 0.85) {
        status = 'failed'
        failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)]
      } else if (rand < 0.93) {
        status = 'reviewing'
      } else {
        status = 'pending'
      }

      const verifyTime = status === 'pending' ? null : createdAt

      certifications.push({
        certification_id: id,
        id_card: idCard,
        name,
        social_security_no: ssNo,
        status,
        failure_reason: failureReason,
        device_fingerprint: device,
        cert_no: certNo,
        verify_time: verifyTime,
        created_at: createdAt
      })

      insertCert.run(id, idCard, name, ssNo, status, failureReason, device, certNo, verifyTime, createdAt)
    }

    const alertTypes = ['high_frequency', 'remote_cluster', 'face_mismatch'] as const
    const alertLevels = ['warning', 'critical'] as const
    const alertDetails = {
      high_frequency: '同一身份证号在短时间内多次发起认证请求',
      remote_cluster: '检测到来自异地集群的认证请求',
      face_mismatch: '人脸比对相似度低于阈值，疑似替人认证'
    }

    for (let i = 0; i < 12; i++) {
      const type = alertTypes[i % alertTypes.length]
      const level = alertLevels[Math.floor(Math.random() * alertLevels.length)]
      const cert = certifications[Math.floor(Math.random() * certifications.length)]
      const status = Math.random() > 0.4 ? 'pending' : 'processed'
      const triggerTime = randomDate('2025-03-01', '2026-06-09')

      insertAlert.run(
        uuidv4(),
        type,
        level,
        cert.id_card,
        alertDetails[type],
        status,
        triggerTime
      )
    }

    const reviewers = ['王审核员', '李审核员', '张审核员', '赵审核员']
    const reviewComments = [
      '经核实，该人员身份信息真实有效',
      '人脸比对结果存疑，需进一步核实',
      '活体检测异常，疑似使用照片冒充',
      '信息与系统记录不一致，已驳回',
      '已转交上级部门处理',
      '复核通过，认证有效'
    ]

    const failedCerts = certifications.filter(c => c.status !== 'success')

    for (let i = 0; i < 18; i++) {
      const cert = failedCerts[i % failedCerts.length]
      if (!cert) continue

      const rand = Math.random()
      let reviewStatus: string
      let comment: string | null = null
      let reviewer: string | null = null
      let reviewTime: string | null = null

      if (rand < 0.3) {
        reviewStatus = 'pending'
      } else if (rand < 0.55) {
        reviewStatus = 'approved'
        comment = reviewComments[0]
        reviewer = reviewers[Math.floor(Math.random() * reviewers.length)]
        reviewTime = randomDate('2025-06-01', '2026-06-09')
      } else if (rand < 0.8) {
        reviewStatus = 'rejected'
        comment = reviewComments[Math.floor(Math.random() * 3) + 2]
        reviewer = reviewers[Math.floor(Math.random() * reviewers.length)]
        reviewTime = randomDate('2025-06-01', '2026-06-09')
      } else {
        reviewStatus = 'transferred'
        comment = reviewComments[4]
        reviewer = reviewers[Math.floor(Math.random() * reviewers.length)]
        reviewTime = randomDate('2025-06-01', '2026-06-09')
      }

      insertReview.run(
        uuidv4(),
        cert.certification_id,
        cert.id_card,
        cert.name,
        reviewStatus,
        comment,
        reviewer,
        reviewTime
      )
    }

    for (let i = 0; i < 35; i++) {
      const cert = certifications[Math.floor(Math.random() * certifications.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const timestamp = randomDate('2025-01-01', '2026-06-09')
      const region = regions[Math.floor(Math.random() * regions.length)]

      const details: Record<string, string> = {
        '提交认证': `在${region}社保终端提交养老认证申请`,
        '认证通过': `认证通过，已生成电子凭证`,
        '认证失败': `认证失败：${failureReasons[Math.floor(Math.random() * failureReasons.length)]}`,
        '人脸识别': `人脸识别比对完成`,
        '活体检测': `活体检测流程完成`,
        '提交审核': `已提交人工审核`,
        '审核通过': `人工审核通过`,
        '审核驳回': `人工审核驳回`,
        '生成凭证': `生成养老认证电子凭证`,
        '查询状态': `查询认证状态`
      }

      insertAudit.run(
        uuidv4(),
        cert.certification_id,
        cert.id_card,
        action,
        cert.device_fingerprint,
        generateIpAddress(),
        details[action],
        timestamp
      )
    }

    for (let i = 0; i < 25; i++) {
      const cert = certifications[Math.floor(Math.random() * certifications.length)]
      const frameOrder = Math.floor(Math.random() * 5) + 1
      const capturedAt = cert.verify_time || cert.created_at

      insertScreenshot.run(
        uuidv4(),
        cert.certification_id,
        `/screenshots/${cert.certification_id}/frame_${frameOrder}.jpg`,
        frameOrder,
        capturedAt
      )
    }
  })()
}
