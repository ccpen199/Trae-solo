import { v4 as uuidv4 } from 'uuid'
import { getDb, isSeeded } from './database.js'

function randomFloat(min: number, max: number, decimals = 6): number {
  const val = Math.random() * (max - min) + min
  return parseFloat(val.toFixed(decimals))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatTimestamp(d: Date): string {
  return d.toISOString().replace('T', ' ').replace('Z', '')
}

function hoursAgo(h: number): Date {
  const d = new Date()
  d.setHours(d.getHours() - h)
  return d
}

export function seedData(): void {
  if (isSeeded()) return

  const db = getDb()

  const insertDevice = db.prepare(`
    INSERT INTO devices (id, name, type, imei, status, battery_level, signal_strength, firmware_version, settings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLocation = db.prepare(`
    INSERT INTO locations (id, device_id, lat, lng, accuracy, mode, speed, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertGeofence = db.prepare(`
    INSERT INTO geofences (id, device_id, name, type, coordinates, radius, rule, schedule, enabled, alert_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertCall = db.prepare(`
    INSERT INTO call_records (id, device_id, type, direction, caller_number, duration, timestamp, has_recording, recording_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, device_id, type, severity, status, description, location_lat, location_lng, notification_chain, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertWorkOrder = db.prepare(`
    INSERT INTO work_orders (id, alert_id, assignee, status, notes, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMember = db.prepare(`
    INSERT INTO members (id, name, avatar, phone, role, permissions, joined_at, invited_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAnomaly = db.prepare(`
    INSERT INTO behavior_anomalies (id, device_id, type, confidence, description, timestamp, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertPrivacy = db.prepare(`
    INSERT INTO privacy_policies (id, name, description, category, enabled, config)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertRole = db.prepare(`
    INSERT INTO roles (id, name, permissions)
    VALUES (?, ?, ?)
  `)

  const seedAll = db.transaction(() => {
    // --- Roles ---
    insertRole.run('role_1', 'primary_guardian', JSON.stringify(['device:manage', 'member:manage', 'geofence:manage', 'call:manage', 'alert:manage', 'privacy:manage', 'analytics:view']))
    insertRole.run('role_2', 'temporary_caregiver', JSON.stringify(['location:view', 'alert:receive', 'call:make']))
    insertRole.run('role_3', 'school_admin', JSON.stringify(['location:view', 'alert:receive', 'geofence:view', 'device:view']))

    // --- Devices ---
    const device1Id = uuidv4()
    const device2Id = uuidv4()
    const device3Id = uuidv4()

    const defaultSettings = JSON.stringify({
      blockUnknownCalls: true,
      restrictedApps: ['game1', 'social1'],
      classModeEnabled: true,
      classModeSchedule: [{ start: '08:00', end: '11:30' }, { start: '14:00', end: '17:00' }],
      batteryWarningThreshold: 20,
      batteryCriticalThreshold: 10,
    })

    insertDevice.run(device1Id, '小明的守护手表', 'watch', '860012345678901', 'online', 78, 92, '2.1.3', defaultSettings)
    insertDevice.run(device2Id, '小红的智能手表', 'watch', '860012345678902', 'offline', 15, 0, '2.1.2', JSON.stringify({
      ...JSON.parse(defaultSettings),
      blockUnknownCalls: false,
    }))
    insertDevice.run(device3Id, '小刚的守护鞋', 'shoe', '860012345678903', 'sos', 45, 68, '1.8.5', defaultSettings)

    // --- Locations (50+ per device) ---
    const modes: Array<'gps' | 'wifi' | 'cell' | 'fusion'> = ['gps', 'wifi', 'cell', 'fusion']
    const centerLat = 39.9042
    const centerLng = 116.4074

    for (const deviceId of [device1Id, device2Id, device3Id]) {
      let baseLat = deviceId === device1Id ? 39.915 : deviceId === device2Id ? 39.892 : 39.930
      let baseLng = deviceId === device1Id ? 116.404 : deviceId === device2Id ? 116.418 : 116.395

      for (let i = 55; i >= 0; i--) {
        const ts = hoursAgo(i * 0.5)
        baseLat += randomFloat(-0.002, 0.002)
        baseLng += randomFloat(-0.002, 0.002)
        const lat = parseFloat(baseLat.toFixed(6))
        const lng = parseFloat(baseLng.toFixed(6))
        const accuracy = randomFloat(5, 50, 1)
        const mode = randomChoice(modes)
        const speed = randomFloat(0, 12, 1)

        insertLocation.run(uuidv4(), deviceId, lat, lng, accuracy, mode, speed, formatTimestamp(ts))
      }
    }

    // --- Geofences ---
    insertGeofence.run(
      uuidv4(), device1Id, '家',
      'circle',
      JSON.stringify([{ lat: 39.915, lng: 116.404 }]),
      200, 'both',
      JSON.stringify({ start: '08:00', end: '20:00', days: [1, 2, 3, 4, 5] }),
      1, 'high'
    )
    insertGeofence.run(
      uuidv4(), device1Id, '学校',
      'circle',
      JSON.stringify([{ lat: 39.920, lng: 116.410 }]),
      300, 'exit',
      JSON.stringify({ start: '07:30', end: '17:00', days: [1, 2, 3, 4, 5] }),
      1, 'high'
    )
    insertGeofence.run(
      uuidv4(), device2Id, '公园',
      'circle',
      JSON.stringify([{ lat: 39.892, lng: 116.418 }]),
      500, 'enter',
      JSON.stringify({ start: '09:00', end: '18:00', days: [0, 6] }),
      1, 'medium'
    )
    insertGeofence.run(
      uuidv4(), device3Id, '培训中心',
      'polygon',
      JSON.stringify([
        { lat: 39.928, lng: 116.390 },
        { lat: 39.932, lng: 116.390 },
        { lat: 39.932, lng: 116.400 },
        { lat: 39.928, lng: 116.400 },
      ]),
      null, 'both',
      JSON.stringify({ start: '14:00', end: '18:00', days: [1, 3, 5] }),
      1, 'low'
    )

    // --- Call Records (15+) ---
    const callDirections: Array<'inbound' | 'outbound' | 'missed'> = ['inbound', 'outbound', 'missed']
    const callTypes: Array<'audio' | 'video'> = ['audio', 'video']
    const phoneNumbers = ['13800138001', '13900139002', '18600186003', '13700137004', '15800158005', '13600136006']

    for (const deviceId of [device1Id, device2Id, device3Id]) {
      const count = deviceId === device1Id ? 7 : deviceId === device2Id ? 4 : 5
      for (let i = 0; i < count; i++) {
        const direction = randomChoice(callDirections)
        const type = randomChoice(callTypes)
        const duration = direction === 'missed' ? 0 : randomInt(10, 600)
        const hasRecording = direction !== 'missed' && Math.random() > 0.4 ? 1 : 0
        const recordingUrl = hasRecording ? `/recordings/${uuidv4()}.aac` : null
        const ts = hoursAgo(randomInt(1, 168))

        insertCall.run(
          uuidv4(), deviceId, type, direction,
          randomChoice(phoneNumbers), duration,
          formatTimestamp(ts), hasRecording, recordingUrl
        )
      }
    }

    // --- Alerts (10+) ---
    const alertTypes: Array<'sos' | 'geofence' | 'battery' | 'behavior' | 'offline'> = ['sos', 'geofence', 'battery', 'behavior', 'offline']
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low']
    const alertStatuses: Array<'pending' | 'acknowledged' | 'resolved' | 'closed'> = ['pending', 'acknowledged', 'resolved', 'closed']

    const alertDescriptions: Record<string, string[]> = {
      sos: ['设备触发SOS紧急求救信号', '儿童长按SOS按钮发起求救'],
      geofence: ['儿童离开学校围栏区域', '儿童进入危险区域', '儿童偏离回家路线'],
      battery: ['设备电量低于20%，请及时充电', '设备电量严重不足，仅剩5%'],
      behavior: ['检测到异常停留行为', '夜间检测到异常移动信号'],
      offline: ['设备已离线超过30分钟', '设备信号丢失，可能处于信号盲区'],
    }

    const alertData: { id: string; alertType: string; severity: string; status: string; deviceId: string }[] = []

    for (let i = 0; i < 12; i++) {
      const alertType = alertTypes[i % alertTypes.length]
      const severity = randomChoice(severities)
      const status = randomChoice(alertStatuses)
      const deviceId = randomChoice([device1Id, device2Id, device3Id])
      const desc = randomChoice(alertDescriptions[alertType])
      const hasLocation = Math.random() > 0.3
      const locationLat = hasLocation ? randomFloat(39.88, 39.94) : null
      const locationLng = hasLocation ? randomFloat(116.37, 116.44) : null
      const ts = hoursAgo(randomInt(1, 120))
      const chain = JSON.stringify([
        { role: 'guardian', name: '王建国', status: 'responded', notifiedAt: formatTimestamp(hoursAgo(2)), respondedAt: formatTimestamp(hoursAgo(1.5)) },
        { role: 'relative', name: '李美华', status: 'notified', notifiedAt: formatTimestamp(hoursAgo(1.8)), respondedAt: null },
        { role: 'school_admin', name: '张老师', status: 'pending', notifiedAt: null, respondedAt: null },
      ])
      const alertId = uuidv4()

      insertAlert.run(alertId, deviceId, alertType, severity, status, desc, locationLat, locationLng, chain, formatTimestamp(ts))
      alertData.push({ id: alertId, alertType, severity, status, deviceId })
    }

    // --- Work Orders (5+) ---
    const woStatuses: Array<'open' | 'in_progress' | 'resolved' | 'closed'> = ['open', 'in_progress', 'resolved', 'closed']
    const assignees = ['王建国', '李美华', '张老师', '刘警官', '陈社工']

    for (let i = 0; i < 6; i++) {
      const alert = alertData[i % alertData.length]
      const woStatus = randomChoice(woStatuses)
      const createdAt = formatTimestamp(hoursAgo(randomInt(1, 48)))
      const resolvedAt = woStatus === 'resolved' || woStatus === 'closed' ? formatTimestamp(hoursAgo(randomInt(0, 24))) : null
      const notes = JSON.stringify([
        { author: randomChoice(assignees), content: '已联系家长确认情况', timestamp: formatTimestamp(hoursAgo(3)) },
        { author: randomChoice(assignees), content: '问题已核实，正在处理中', timestamp: formatTimestamp(hoursAgo(2)) },
      ])

      insertWorkOrder.run(uuidv4(), alert.id, randomChoice(assignees), woStatus, notes, createdAt, resolvedAt)
    }

    // --- Members ---
    const member1Id = uuidv4()
    const member2Id = uuidv4()

    insertMember.run(
      member1Id, '王建国', '/avatars/wang.jpg', '13800138001', 'primary_guardian',
      JSON.stringify(['device:manage', 'member:manage', 'geofence:manage', 'call:manage', 'alert:manage', 'privacy:manage', 'analytics:view']),
      formatTimestamp(hoursAgo(720)), null
    )
    insertMember.run(
      member2Id, '李美华', '/avatars/li.jpg', '13900139002', 'primary_guardian',
      JSON.stringify(['device:manage', 'member:manage', 'geofence:manage', 'call:manage', 'alert:manage', 'privacy:manage', 'analytics:view']),
      formatTimestamp(hoursAgo(720)), member1Id
    )
    insertMember.run(
      uuidv4(), '赵阿姨', '/avatars/zhao.jpg', '18600186003', 'temporary_caregiver',
      JSON.stringify(['location:view', 'alert:receive', 'call:make']),
      formatTimestamp(hoursAgo(480)), member1Id
    )
    insertMember.run(
      uuidv4(), '刘叔叔', '/avatars/liu.jpg', '13700137004', 'temporary_caregiver',
      JSON.stringify(['location:view', 'alert:receive', 'call:make']),
      formatTimestamp(hoursAgo(240)), member2Id
    )
    insertMember.run(
      uuidv4(), '张老师', '/avatars/zhang.jpg', '15800158005', 'school_admin',
      JSON.stringify(['location:view', 'alert:receive', 'geofence:view', 'device:view']),
      formatTimestamp(hoursAgo(360)), member1Id
    )

    // --- Behavior Anomalies (10+) ---
    const anomalyTypes: Array<'prolonged_stillness' | 'nighttime_movement' | 'signal_anomaly' | 'unusual_route'> = ['prolonged_stillness', 'nighttime_movement', 'signal_anomaly', 'unusual_route']
    const anomalyDescs: Record<string, string[]> = {
      prolonged_stillness: ['设备在同一位置停留超过2小时', '放学后持续停留在学校附近未移动'],
      nighttime_movement: ['凌晨时段检测到设备移动', '深夜23:00后设备位置发生变化'],
      signal_anomaly: ['GPS信号出现异常跳变', '设备信号频繁在GPS与基站间切换'],
      unusual_route: ['检测到偏离常规路线', '设备出现在不常去的区域'],
    }

    for (let i = 0; i < 12; i++) {
      const anomalyType = anomalyTypes[i % anomalyTypes.length]
      const deviceId = randomChoice([device1Id, device2Id, device3Id])
      const confidence = randomFloat(0.55, 0.99, 2)
      const desc = randomChoice(anomalyDescs[anomalyType])
      const ts = hoursAgo(randomInt(1, 168))
      const resolved = Math.random() > 0.6 ? 1 : 0

      insertAnomaly.run(uuidv4(), deviceId, anomalyType, confidence, desc, formatTimestamp(ts), resolved)
    }

    // --- Privacy Policies ---
    insertPrivacy.run(
      uuidv4(), '人脸模糊化', '自动对图像中的人脸区域进行模糊化处理，保护儿童隐私', 'face_blur', 1,
      JSON.stringify({ blurLevel: 'high', autoApply: true })
    )
    insertPrivacy.run(
      uuidv4(), '位置脱敏', '对位置数据进行精度降级处理，只保留区域级定位', 'location_strip', 1,
      JSON.stringify({ precisionLevel: 'district', keepExactForSOS: true })
    )
    insertPrivacy.run(
      uuidv4(), '通话加密', '端到端加密所有通话录音与记录', 'call_encrypt', 1,
      JSON.stringify({ algorithm: 'AES-256', keyRotation: 'daily' })
    )
    insertPrivacy.run(
      uuidv4(), '数据脱敏', '对所有展示数据进行脱敏处理，隐藏手机号等敏感信息', 'data_mask', 0,
      JSON.stringify({ maskPhone: true, maskName: false, maskPattern: 'partial' })
    )
  })

  seedAll()
  console.log('Database seeded successfully')
}
