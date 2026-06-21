import type { Ticket, TicketTimeline, RectificationRecord, ReviewRecord, DispatchRule } from '@/types'

function generateTimeline(ticket: Partial<Ticket>): TicketTimeline[] {
  const timeline: TicketTimeline[] = []
  const baseTime = ticket.submitTime || '2024-01-15 09:30:00'
  
  timeline.push({
    id: 'tl_001',
    status: 'pending',
    title: '提交成功',
    description: '诉求已提交成功，等待系统分拨',
    operator: ticket.anonymous ? '匿名用户' : ticket.userName,
    operatorRole: '诉求人',
    time: baseTime
  })

  if (ticket.assignTime) {
    timeline.push({
      id: 'tl_002',
      status: 'assigned',
      title: '系统分拨',
      description: `工单已自动分拨至 ${ticket.departmentName}`,
      operator: '系统',
      operatorRole: '智能分拨系统',
      time: ticket.assignTime
    })
  }

  if (ticket.acceptTime) {
    timeline.push({
      id: 'tl_003',
      status: 'accepted',
      title: '部门受理',
      description: `${ticket.departmentName}已受理您的诉求`,
      operator: ticket.assignee,
      operatorRole: ticket.assigneeRole,
      time: ticket.acceptTime
    })
  }

  if (ticket.status === 'processing' || ticket.status === 'replied' || ticket.status === 'completed' || ticket.status === 'closed') {
    timeline.push({
      id: 'tl_004',
      status: 'processing',
      title: '处理中',
      description: '相关部门正在积极处理您的诉求',
      operator: ticket.assignee,
      operatorRole: ticket.assigneeRole,
      time: ticket.firstReplyTime || ticket.acceptTime
    })
  }

  if (ticket.replies && ticket.replies.length > 0) {
    ticket.replies.forEach((reply, idx) => {
      timeline.push({
        id: `tl_reply_${idx}`,
        status: 'replied',
        title: '官方回复',
        description: reply.content,
        operator: reply.operator,
        operatorRole: reply.operatorRole,
        attachments: reply.attachments,
        time: reply.time
      })
    })
  }

  if (ticket.rating && ticket.closeTime) {
    timeline.push({
      id: 'tl_005',
      status: 'completed',
      title: '满意度评价',
      description: `您已完成评价：${ticket.rating}星${ticket.comment ? ` - ${ticket.comment}` : ''}`,
      operator: ticket.anonymous ? '匿名用户' : ticket.userName,
      operatorRole: '诉求人',
      time: ticket.closeTime
    })
  }

  if (ticket.rectificationStatus && ticket.rectificationStatus !== 'verified') {
    timeline.push({
      id: 'tl_006',
      status: 'rectifying',
      title: '整改中',
      description: '因评价不满意，已启动整改程序',
      operator: '系统',
      operatorRole: '整改督办',
      time: ticket.closeTime
    })
  }

  if (ticket.reviewStatus) {
    timeline.push({
      id: 'tl_007',
      status: 'reviewing',
      title: '复查中',
      description: '已申请复查，等待复核',
      operator: ticket.anonymous ? '匿名用户' : ticket.userName,
      operatorRole: '诉求人',
      time: ticket.archiveTime || ticket.closeTime
    })
  }

  return timeline
}

export const mockTickets: Ticket[] = [
  {
    id: 't_001',
    ticketNo: 'GD2024011500001',
    type: 'complaint',
    title: '社保办事大厅排队太长',
    content: '今天去市人社局办事大厅办理社保业务，取号后等了两个多小时才轮到，窗口只开了两个，但办事群众有几十人。建议增加办事窗口或推行网上预约分流。',
    category: '政务服务',
    subCategory: '办事大厅',
    userId: 'u_001',
    userName: '张三',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    location: '抚州市临川区文昌大道1290号市人社局办事大厅',
    anonymous: false,
    priority: 'medium',
    status: 'processing',
    replyMethod: 'message',
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    assignee: '赵六',
    assigneeRole: '市人社局办公室主任',
    slaHours: 72,
    remainingHours: 48,
    isOverdue: false,
    attachments: ['/tickets/photo1.jpg', '/tickets/photo2.jpg'],
    replies: [
      {
        id: 'tr_001',
        content: '您好，感谢您的反馈。我们已关注到办事大厅排队问题，正计划进行以下改进：1. 增加临时窗口；2. 优化预约系统；3. 推行更多事项全程网办。预计两周内完成整改。',
        operator: '赵六',
        operatorRole: '市人社局办公室主任',
        time: '2024-01-15 11:00:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-15 09:30:00',
    assignTime: '2024-01-15 10:00:00',
    acceptTime: '2024-01-15 10:30:00',
    firstReplyTime: '2024-01-15 11:00:00',
    currentStep: 3,
    totalSteps: 5
  },
  {
    id: 't_002',
    ticketNo: 'GD2024011400002',
    type: 'suggestion',
    title: '建议增加公积金业务线上办理种类',
    content: '目前公积金业务很多还是需要到线下网点办理，希望能增加更多线上可办理的业务种类，比如公积金贷款提前还款、公积金信息变更等，方便群众办事。',
    category: '政务服务',
    subCategory: '线上服务',
    userId: 'u_002',
    userName: '李四',
    phone: '13800138002',
    email: 'lisi@example.com',
    anonymous: false,
    priority: 'low',
    status: 'evaluating',
    replyMethod: 'sms',
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    assignee: '钱主任',
    assigneeRole: '市公积金中心业务科',
    slaHours: 72,
    remainingHours: 0,
    isOverdue: false,
    attachments: [],
    replies: [
      {
        id: 'tr_002',
        content: '感谢您的建议！我们正在推进公积金业务数字化转型，计划在今年第二季度上线公积金贷款提前还款、个人信息变更等功能，届时将通过本平台发布公告。',
        operator: '钱主任',
        operatorRole: '市公积金中心业务科',
        time: '2024-01-14 16:00:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-14 10:20:00',
    assignTime: '2024-01-14 11:00:00',
    acceptTime: '2024-01-14 11:30:00',
    firstReplyTime: '2024-01-14 16:00:00',
    closeTime: '2024-01-14 17:00:00',
    currentStep: 4,
    totalSteps: 5
  },
  {
    id: 't_003',
    ticketNo: 'GD2024011300003',
    type: 'consultation',
    title: '新生儿医保如何参保',
    content: '孩子刚满月，想给他办理医保参保，请问需要什么材料？去哪里办理？参保后多久可以享受医保待遇？',
    category: '医疗保险',
    subCategory: '参保缴费',
    userId: 'u_006',
    userName: '周八',
    phone: '13800138006',
    email: 'zhouba@example.com',
    anonymous: false,
    priority: 'high',
    status: 'completed',
    replyMethod: 'message',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    assignee: '郑十',
    assigneeRole: '市医保局业务科',
    slaHours: 24,
    remainingHours: 0,
    isOverdue: false,
    attachments: [],
    replies: [
      {
        id: 'tr_003',
        content: '您好！新生儿医保参保办理指南如下：1. 所需材料：父母双方身份证、户口簿、新生儿出生医学证明；2. 办理地点：户籍所在地或居住地社区居委会/村委会，也可通过本平台在线办理；3. 待遇享受：出生后6个月内参保的，从出生之日起即可享受医保待遇。建议您尽快办理。',
        operator: '郑十',
        operatorRole: '市医保局业务科',
        time: '2024-01-13 09:30:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-13 08:45:00',
    assignTime: '2024-01-13 09:00:00',
    acceptTime: '2024-01-13 09:15:00',
    firstReplyTime: '2024-01-13 09:30:00',
    closeTime: '2024-01-13 10:00:00',
    rating: 5,
    comment: '回复非常详细及时，解决了我的疑问，谢谢！',
    evaluationId: 'e_003',
    currentStep: 5,
    totalSteps: 5
  },
  {
    id: 't_004',
    ticketNo: 'GD2024011200004',
    type: 'praise',
    title: '点赞市不动产登记中心服务',
    content: '今天去市不动产登记中心办理房产过户，窗口工作人员服务态度非常好，耐心解答疑问，办事效率也很高，不到一个小时就办完了所有手续。为你们的优质服务点赞！',
    category: '政务服务',
    subCategory: '服务态度',
    userId: 'u_001',
    userName: '张三',
    phone: '13800138001',
    location: '抚州市政务服务中心不动产登记窗口',
    anonymous: false,
    priority: 'low',
    status: 'completed',
    replyMethod: 'message',
    departmentId: 'd_011',
    departmentName: '抚州市自然资源局',
    assignee: '不动产登记中心',
    assigneeRole: '市不动产登记中心',
    slaHours: 72,
    remainingHours: 0,
    isOverdue: false,
    attachments: [],
    replies: [
      {
        id: 'tr_004',
        content: '感谢您的认可和鼓励！我们将继续优化服务流程，提升服务质量，为群众提供更加优质高效的政务服务。',
        operator: '不动产登记中心',
        operatorRole: '市不动产登记中心',
        time: '2024-01-12 17:30:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-12 16:40:00',
    assignTime: '2024-01-12 17:00:00',
    acceptTime: '2024-01-12 17:15:00',
    firstReplyTime: '2024-01-12 17:30:00',
    closeTime: '2024-01-12 18:00:00',
    rating: 5,
    comment: '政务服务越来越好！',
    evaluationId: 'e_004',
    currentStep: 5,
    totalSteps: 5
  },
  {
    id: 't_005',
    ticketNo: 'GD2024011500005',
    type: 'complaint',
    title: '小区附近广场舞噪音扰民',
    content: '临川区青云峰路某小区附近，每天晚上广场舞音响声音很大，严重影响周边居民休息和孩子学习。希望相关部门能协调解决，规定广场舞时间和音量。',
    category: '城市管理',
    subCategory: '噪音扰民',
    userId: 'u_002',
    userName: '李四',
    phone: '13800138002',
    location: '临川区青云峰路',
    anonymous: true,
    priority: 'urgent',
    status: 'accepted',
    replyMethod: 'phone',
    departmentId: 'd_012',
    departmentName: '抚州市城市管理局',
    assignee: '孙队长',
    assigneeRole: '城管执法大队',
    slaHours: 24,
    remainingHours: 20,
    isOverdue: false,
    attachments: ['/tickets/noise_video.mp4'],
    replies: [],
    timeline: [],
    submitTime: '2024-01-15 20:30:00',
    assignTime: '2024-01-15 21:00:00',
    acceptTime: '2024-01-15 21:30:00',
    currentStep: 2,
    totalSteps: 5
  },
  {
    id: 't_006',
    ticketNo: 'GD2024011100006',
    type: 'suggestion',
    title: '建议优化政务APP界面',
    content: '目前政务服务APP界面略显复杂，老年人使用起来不太方便。建议增加"长辈模式"，字体更大、图标更清晰、功能更简化，方便老年群众使用。',
    category: '政务服务',
    subCategory: '平台建设',
    userId: 'u_007',
    userName: '吴九',
    phone: '13800138007',
    anonymous: false,
    priority: 'medium',
    status: 'pending',
    replyMethod: 'message',
    slaHours: 72,
    remainingHours: 72,
    isOverdue: false,
    attachments: [],
    replies: [],
    timeline: [],
    submitTime: '2024-01-15 14:20:00',
    currentStep: 0,
    totalSteps: 5
  },
  {
    id: 't_007',
    ticketNo: 'GD2024011000007',
    type: 'consultation',
    title: '异地驾驶证能否在抚州换证',
    content: '我的驾驶证是外地考的，现在到期了，能不能在抚州办理换证？需要什么材料？',
    category: '交通运输',
    subCategory: '驾驶证',
    userId: 'u_002',
    userName: '李四',
    phone: '13800138002',
    anonymous: false,
    priority: 'medium',
    status: 'completed',
    replyMethod: 'message',
    departmentId: 'd_005',
    departmentName: '抚州市交通运输局',
    assignee: '车管所',
    assigneeRole: '市车管所',
    slaHours: 48,
    remainingHours: 0,
    isOverdue: false,
    attachments: [],
    replies: [
      {
        id: 'tr_005',
        content: '您好！可以在抚州办理异地驾驶证换证。所需材料：1. 身份证原件；2. 原驾驶证；3. 县级以上医院出具的身体条件证明。您可通过本平台预约后到车管所办理，也可选择"交管12123"APP线上申请。',
        operator: '车管所',
        operatorRole: '市车管所',
        time: '2024-01-10 10:30:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-10 09:15:00',
    assignTime: '2024-01-10 09:45:00',
    acceptTime: '2024-01-10 10:00:00',
    firstReplyTime: '2024-01-10 10:30:00',
    closeTime: '2024-01-10 11:00:00',
    rating: 5,
    comment: '解答很清楚，谢谢！',
    evaluationId: 'e_007',
    currentStep: 5,
    totalSteps: 5
  },
  {
    id: 't_008',
    ticketNo: 'GD2024010900008',
    type: 'complaint',
    title: '医保报销到账太慢',
    content: '上个月住院的医保报销材料提交快一个月了，报销款还没到账。打电话询问说还在审核中，请问报销到底需要多长时间？',
    category: '医疗保险',
    subCategory: '报销结算',
    userId: 'u_006',
    userName: '周八',
    phone: '13800138006',
    anonymous: false,
    priority: 'high',
    status: 'rectifying',
    replyMethod: 'sms',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    assignee: '郑十',
    assigneeRole: '市医保局审核科',
    slaHours: 24,
    remainingHours: 0,
    isOverdue: true,
    attachments: [],
    replies: [
      {
        id: 'tr_006',
        content: '您好，非常抱歉让您久等了。经查询，您的报销材料因缺少费用明细清单被退回医院补充，现材料已齐全，我们将在3个工作日内完成审核拨付。',
        operator: '郑十',
        operatorRole: '市医保局审核科',
        time: '2024-01-15 09:00:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-09 15:30:00',
    assignTime: '2024-01-09 16:00:00',
    acceptTime: '2024-01-09 16:30:00',
    firstReplyTime: '2024-01-15 09:00:00',
    closeTime: '2024-01-15 10:00:00',
    rating: 2,
    comment: '虽然回复了解释，但是报销等了快一个月，心里还是比较着急。希望医保报销能提速！',
    evaluationId: 'e_010',
    rectificationStatus: 'processing',
    currentStep: 6,
    totalSteps: 7
  },
  {
    id: 't_009',
    ticketNo: 'GD2024010800009',
    type: 'help',
    title: '请求帮助寻找走失老人',
    content: '我爷爷今年78岁，患有轻度阿尔茨海默症，今天上午9点左右从家中走失，走时穿灰色外套，戴黑色帽子。家属非常着急，恳请相关部门协助寻找。',
    category: '求助服务',
    subCategory: '人员走失',
    userId: 'u_003',
    userName: '王五',
    phone: '13900139003',
    location: '临川区大公路附近',
    anonymous: false,
    priority: 'urgent',
    status: 'processing',
    replyMethod: 'phone',
    departmentId: 'd_010',
    departmentName: '抚州市公安局',
    assignee: '李警官',
    assigneeRole: '临川分局民警',
    slaHours: 12,
    remainingHours: 6,
    isOverdue: false,
    attachments: ['/tickets/old_man_photo.jpg'],
    replies: [
      {
        id: 'tr_007',
        content: '您好，我们已接到您的求助，已通知辖区派出所和巡逻警力开展搜寻工作。请您保持电话畅通，如有进展我们会第一时间与您联系。',
        operator: '李警官',
        operatorRole: '临川分局民警',
        time: '2024-01-08 10:30:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-08 10:00:00',
    assignTime: '2024-01-08 10:15:00',
    acceptTime: '2024-01-08 10:20:00',
    firstReplyTime: '2024-01-08 10:30:00',
    currentStep: 3,
    totalSteps: 5,
    isKeySupervision: true
  },
  {
    id: 't_010',
    ticketNo: 'GD2024010700010',
    type: 'complaint',
    title: '小区物业乱收费问题',
    content: '我们小区物业最近擅自提高物业费，而且没有公示任何收费依据和明细，业主们都很有意见。希望市场监管部门能介入调查。',
    category: '市场监管',
    subCategory: '物业收费',
    userId: 'u_004',
    userName: '陈七',
    phone: '13700137004',
    location: '临川区学府路某小区',
    anonymous: false,
    priority: 'high',
    status: 'replied',
    replyMethod: 'message',
    departmentId: 'd_009',
    departmentName: '抚州市市场监督管理局',
    assignee: '刘科长',
    assigneeRole: '市市监局价格科',
    slaHours: 72,
    remainingHours: 12,
    isOverdue: false,
    attachments: ['/tickets/fee_notice.jpg'],
    replies: [
      {
        id: 'tr_008',
        content: '您好，您反映的问题我们已受理。根据《物业管理条例》规定，调整物业费需经业主大会同意。我们已约谈该小区物业公司，要求其提供收费依据，如经查实存在违规收费行为，我们将依法依规进行处理。',
        operator: '刘科长',
        operatorRole: '市市监局价格科',
        time: '2024-01-08 15:00:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-07 14:00:00',
    assignTime: '2024-01-07 15:00:00',
    acceptTime: '2024-01-07 16:00:00',
    firstReplyTime: '2024-01-08 15:00:00',
    currentStep: 4,
    totalSteps: 5
  },
  {
    id: 't_011',
    ticketNo: 'GD2024010600011',
    type: 'complaint',
    title: '道路施工影响出行',
    content: '玉茗大道南段道路施工已经两个多月了，一直没有完工，周边居民出行很不方便。请问什么时候能完工？能不能加快施工进度？',
    category: '城市建设',
    subCategory: '道路施工',
    userId: 'u_005',
    userName: '孙六',
    phone: '13600136005',
    location: '临川区玉茗大道南段',
    anonymous: false,
    priority: 'medium',
    status: 'reviewing',
    replyMethod: 'sms',
    departmentId: 'd_012',
    departmentName: '抚州市城市管理局',
    assignee: '王工程师',
    assigneeRole: '市政工程科',
    slaHours: 72,
    remainingHours: 0,
    isOverdue: false,
    attachments: [],
    replies: [
      {
        id: 'tr_009',
        content: '您好，玉茗大道南段改造工程因地下管线复杂，施工难度超出预期，我们正在优化施工方案，力争春节前完成主路面施工。施工期间给您带来不便，敬请谅解。',
        operator: '王工程师',
        operatorRole: '市政工程科',
        time: '2024-01-07 10:00:00'
      }
    ],
    timeline: [],
    submitTime: '2024-01-06 16:00:00',
    assignTime: '2024-01-06 17:00:00',
    acceptTime: '2024-01-07 08:30:00',
    firstReplyTime: '2024-01-07 10:00:00',
    closeTime: '2024-01-08 09:00:00',
    rating: 2,
    comment: '施工太慢了，影响太大',
    evaluationId: 'e_011',
    rectificationStatus: 'verified',
    reviewStatus: 'pending',
    currentStep: 7,
    totalSteps: 7
  }
]

mockTickets.forEach(ticket => {
  ticket.timeline = generateTimeline(ticket)
})

export const mockRectificationRecords: RectificationRecord[] = [
  {
    id: 'rect_001',
    ticketId: 't_008',
    status: 'processing',
    triggerReason: '用户评价2星，对医保报销速度不满意',
    responsibleDept: '抚州市医疗保障局',
    responsiblePerson: '郑十',
    plan: '1. 优化报销审核流程，增加审核人员；2. 建立报销进度查询功能；3. 承诺常规报销10个工作日内完成。',
    progress: '已完成流程优化方案制定，正在增加审核人员',
    deadline: '2024-01-22 00:00:00',
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 'rect_002',
    ticketId: 't_011',
    status: 'completed',
    triggerReason: '用户评价2星，对道路施工进度不满意',
    responsibleDept: '抚州市城市管理局',
    responsiblePerson: '王工程师',
    plan: '1. 增加施工人员和设备，实施两班倒；2. 优化施工工序，平行作业；3. 每周公布施工进度。',
    result: '已增加施工力量，预计提前10天完成主路面施工。已建立每周进度通报机制。',
    deadline: '2024-01-20 00:00:00',
    createTime: '2024-01-08 10:00:00',
    completeTime: '2024-01-16 17:00:00',
    verifyTime: '2024-01-17 09:00:00',
    userSatisfied: false
  }
]

export const mockReviewRecords: ReviewRecord[] = [
  {
    id: 'rev_001',
    ticketId: 't_011',
    reason: '对整改结果不满意，道路施工仍然缓慢，出行受影响严重',
    applicant: '孙六',
    applicantId: 'u_005',
    status: 'pending',
    applyTime: '2024-01-18 10:00:00'
  }
]

export const mockDispatchRules: DispatchRule[] = [
  {
    id: 'rule_001',
    name: '社保类问题',
    keywords: ['社保', '养老', '就业', '工伤', '失业', '人社', '五险', '养老保险', '失业保险'],
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    category: '社会保障',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_002',
    name: '医保类问题',
    keywords: ['医保', '报销', '医疗', '看病', '住院', '医保卡', '医疗保险', '新农合'],
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    category: '医疗保险',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_003',
    name: '教育体育类问题',
    keywords: ['教育', '学校', '入学', '体育', '老师', '学生', '学区', '报名', '幼儿园'],
    departmentId: 'd_003',
    departmentName: '抚州市教育体育局',
    category: '教育服务',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_004',
    name: '公积金类问题',
    keywords: ['公积金', '住房', '贷款', '提取', '房贷', '公积金贷款'],
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    category: '住房公积金',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_005',
    name: '交通类问题',
    keywords: ['交通', '驾驶证', '车辆', '运输', '车管所', '违章', '驾照', '行驶证'],
    departmentId: 'd_005',
    departmentName: '抚州市交通运输局',
    category: '交通运输',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_006',
    name: '文旅类问题',
    keywords: ['文化', '旅游', '广电', '文物', '景区', '图书馆', '博物馆'],
    departmentId: 'd_006',
    departmentName: '抚州市文化广电新闻出版旅游局',
    category: '文化旅游',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_007',
    name: '公安类问题',
    keywords: ['公安', '户籍', '身份证', '违章', '治安', '报警', '派出所', '走失', '盗窃'],
    departmentId: 'd_010',
    departmentName: '抚州市公安局',
    category: '公安服务',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_008',
    name: '市场监管类问题',
    keywords: ['市场', '营业执照', '消费', '食品', '投诉', '价格', '物业', '乱收费'],
    departmentId: 'd_009',
    departmentName: '抚州市市场监督管理局',
    category: '市场监管',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_009',
    name: '城管类问题',
    keywords: ['城管', '市容', '噪音', '卫生', '道路', '施工', '违建', '广场舞', '摆摊'],
    departmentId: 'd_012',
    departmentName: '抚州市城市管理局',
    category: '城市管理',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_010',
    name: '自然资源类问题',
    keywords: ['不动产', '房产', '土地', '规划', '过户', '房产证', '不动产登记'],
    departmentId: 'd_011',
    departmentName: '抚州市自然资源局',
    category: '自然资源',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_011',
    name: '民政类问题',
    keywords: ['民政', '低保', '救助', '婚姻', '结婚', '离婚', '殡葬', '养老', '福利院'],
    departmentId: 'd_007',
    departmentName: '抚州市民政局',
    category: '民政服务',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  },
  {
    id: 'rule_012',
    name: '税务类问题',
    keywords: ['税务', '税收', '发票', '纳税', '个税', '增值税', '税务局'],
    departmentId: 'd_008',
    departmentName: '国家税务总局抚州市税务局',
    category: '税务服务',
    priority: 1,
    enabled: true,
    createTime: '2023-12-01 00:00:00',
    updateTime: '2024-01-10 00:00:00'
  }
]

export const evaluationTags = [
  { id: 'tag_001', label: '服务热情', category: 'positive' as const, sort: 1 },
  { id: 'tag_002', label: '办事高效', category: 'positive' as const, sort: 2 },
  { id: 'tag_003', label: '解答专业', category: 'positive' as const, sort: 3 },
  { id: 'tag_004', label: '流程简便', category: 'positive' as const, sort: 4 },
  { id: 'tag_005', label: '回复及时', category: 'positive' as const, sort: 5 },
  { id: 'tag_006', label: '态度很好', category: 'positive' as const, sort: 6 },
  { id: 'tag_007', label: '非常满意', category: 'positive' as const, sort: 7 },
  { id: 'tag_008', label: '流程复杂', category: 'negative' as const, sort: 8 },
  { id: 'tag_009', label: '效率低下', category: 'negative' as const, sort: 9 },
  { id: 'tag_010', label: '态度不好', category: 'negative' as const, sort: 10 },
  { id: 'tag_011', label: '结果不满意', category: 'negative' as const, sort: 11 },
  { id: 'tag_012', label: '材料过多', category: 'negative' as const, sort: 12 },
  { id: 'tag_013', label: '回复不及时', category: 'negative' as const, sort: 13 },
  { id: 'tag_014', label: '一般般', category: 'neutral' as const, sort: 14 },
  { id: 'tag_015', label: '有待改进', category: 'neutral' as const, sort: 15 }
]
