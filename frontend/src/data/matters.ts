import type { Matter } from '@/types/matter';

export const mockMatters: Matter[] = [
  {
    id: 'matter_001',
    matterCode: 'PENSION_CERT_202606001',
    matterName: '养老待遇资格认证',
    matterType: 'pension_certification',
    applicantName: '张三',
    applicantIdCard: '320101199001011234',
    applicantPhone: '13800138000',
    applyTime: '2026-06-08 09:30:00',
    status: 'completed',
    currentNode: '完成',
    estimatedFinishTime: '2026-06-08',
    actualFinishTime: '2026-06-08 09:32:15',
    acceptOrganization: '江苏省人力资源和社会保障厅',
    handleOrganization: '江苏省社会保险基金管理中心',
    handler: '李主任',
    handlerPhone: '025-12333',
    materials: [
      {
        id: 'mat_001_01',
        name: '身份证照片',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-06-08 09:30:00',
        verified: true,
        verifyTime: '2026-06-08 09:30:30',
        verifyResult: 'pass'
      },
      {
        id: 'mat_001_02',
        name: '人脸照片',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-06-08 09:31:00',
        verified: true,
        verifyTime: '2026-06-08 09:31:30",
        verifyResult: 'pass'
      }
    ],
    approvalNodes: [
      {
        id: 'node_001_01',
        nodeName: '身份核验',
        nodeOrder: 1,
        status: 'completed',
        handler: '系统自动核验',
        handleTime: '2026-06-08 09:30:30',
        handleResult: 'pass',
        startTime: '2026-06-08 09:30:00",
        endTime: '2026-06-08 09:30:30",
        estimatedDuration: 1
      },
      {
        id: 'node_001_02',
        nodeName: '人脸识别',
        nodeOrder: 2,
        status: 'completed',
        handler: '系统自动核验',
        handleTime: '2026-06-08 09:31:30",
        handleResult: 'pass',
        startTime: '2026-06-08 09:31:00",
        endTime: '2026-06-08 09:31:30",
        estimatedDuration: 1
      },
      {
        id: 'node_001_03',
        nodeName: '认证完成',
        nodeOrder: 3,
        status: 'completed',
        handler: '系统自动完成',
        handleTime: '2026-06-08 09:32:15",
        handleResult: 'pass',
        startTime: '2026-06-08 09:31:30",
        endTime: '2026-06-08 09:32:15",
        estimatedDuration: 1
      }
    ],
    traceRecords: [
      {
        id: 'trace_001_01',
        operation: '提交申请',
        operator: '张三',
        operatorRole: '申请人',
        operationTime: '2026-06-08 09:30:00",
        operationDetail: '提交养老待遇资格认证申请',
        previousStatus: 'draft',
        currentStatus: 'submitted'
      },
      {
        id: 'trace_001_02',
        operation: '身份核验通过',
        operator: '系统',
        operatorRole: '系统',
        operationTime: '2026-06-08 09:30:30",
        operationDetail: '身份信息核验通过',
        previousStatus: 'submitted',
        currentStatus: 'accepted'
      },
      {
        id: 'trace_001_03',
        operation: '人脸识别通过',
        operator: '系统',
        operatorRole: '系统',
        operationTime: '2026-06-08 09:31:30",
        operationDetail: '人脸识别核验通过，活体检测通过',
        previousStatus: 'accepted',
        currentStatus: 'approved'
      },
      {
        id: 'trace_001_04',
        operation: '认证完成',
        operator: '系统',
        operatorRole: '系统',
        operationTime: '2026-06-08 09:32:15",
        operationDetail: '养老待遇资格认证完成，有效期至2027年6月',
        previousStatus: 'approved',
        currentStatus: 'completed'
      }
    ],
    feePaid: true,
    isUrgent: false,
    isCrossProvince: false
  },
  {
    id: 'matter_002',
    matterCode: 'TITLE_DECLARE_202605001',
    matterName: '中级工程师职称申报',
    matterType: 'title_declaration',
    applicantName: '张三',
    applicantIdCard: '320101199001011234',
    applicantPhone: '13800138000',
    applyTime: '2026-05-15 14:20:00',
    status: 'reviewing',
    currentNode: '专家评审',
    estimatedFinishTime: '2026-06-20',
    acceptOrganization: '江苏省人力资源和社会保障厅',
    handleOrganization: '江苏省职称评价中心',
    handler: '王评审',
    handlerPhone: '025-12333',
    materials: [
      {
        id: 'mat_002_01',
        name: '身份证',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-05-15 14:20:00',
        verified: true,
        verifyTime: '2026-05-16 09:00:00",
        verifyResult: 'pass'
      },
      {
        id: 'mat_002_02',
        name: '学历证明',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-05-15 14:25:00",
        verified: true,
        verifyTime: '2026-05-16 09:05:00",
        verifyResult: 'pass'
      },
      {
        id: 'mat_002_03',
        name: '业绩材料',
        type: 'required',
        format: 'pdf',
        fileUrl: '',
        uploadTime: '2026-05-15 14:30:00",
        verified: true,
        verifyTime: '2026-05-16 09:10:00",
        verifyResult: 'pass'
      },
      {
        id: 'mat_002_04',
        name: '继续教育证明',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-05-15 14:35:00",
        verified: true,
        verifyTime: '2026-05-16 09:15:00",
        verifyResult: 'pass'
      }
    ],
    approvalNodes: [
      {
        id: 'node_002_01',
        nodeName: '材料初审',
        nodeOrder: 1,
        status: 'completed',
        handler: '张初审',
        handleTime: '2026-05-16 09:30:00",
        handleResult: 'pass',
        startTime: '2026-05-15 14:35:00",
        endTime: '2026-05-16 09:30:00",
        estimatedDuration: 1
      },
      {
        id: 'node_002_02',
        nodeName: '资格审核',
        nodeOrder: 2,
        status: 'completed',
        handler: '李审核',
        handleTime: '2026-05-20 16:00:00",
        handleResult: 'pass',
        startTime: '2026-05-16 09:30:00",
        endTime: '2026-05-20 16:00:00",
        estimatedDuration: 5
      },
      {
        id: 'node_002_03',
        nodeName: '专家评审',
        nodeOrder: 3,
        status: 'processing',
        startTime: '2026-05-21 09:00:00",
        estimatedDuration: 15
      },
      {
        id: 'node_002_04',
        nodeName: '评审公示',
        nodeOrder: 4,
        status: 'pending',
        estimatedDuration: 7
      },
      {
        id: 'node_002_05',
        nodeName: '领取证书',
        nodeOrder: 5,
        status: 'pending',
        estimatedDuration: 3
      }
    ],
    traceRecords: [
      {
        id: 'trace_002_01',
        operation: '提交申请',
        operator: '张三',
        operatorRole: '申请人',
        operationTime: '2026-05-15 14:35:00",
        operationDetail: '提交中级工程师职称申报申请',
        previousStatus: 'draft',
        currentStatus: 'submitted'
      },
      {
        id: 'trace_002_02',
        operation: '材料初审通过',
        operator: '张初审',
        operatorRole: '初审员',
        operationTime: '2026-05-16 09:30:00",
        operationDetail: '申报材料初审通过',
        previousStatus: 'submitted',
        currentStatus: 'accepted'
      },
      {
        id: 'trace_002_03',
        operation: '资格审核通过',
        operator: '李审核',
        operatorRole: '审核员',
        operationTime: '2026-05-20 16:00:00",
        operationDetail: '申报资格审核通过，进入专家评审环节',
        previousStatus: 'accepted',
        currentStatus: 'reviewing'
      }
    ],
    fee: 200,
    feePaid: true,
    paymentTime: '2026-05-15 14:40:00",
    isUrgent: false,
    isCrossProvince: false
  },
  {
    id: 'matter_003',
    matterCode: 'UNEMPLOYMENT_REG_202604001',
    matterName: '失业登记',
    matterType: 'unemployment_registration',
    applicantName: '张三',
    applicantIdCard: '320101199001011234',
    applicantPhone: '13800138000',
    applyTime: '2026-04-10 10:00:00",
    status: 'completed',
    currentNode: '完成',
    estimatedFinishTime: '2026-04-13',
    actualFinishTime: '2026-04-12 15:30:00",
    acceptOrganization: '南京市人力资源和社会保障局',
    handleOrganization: '南京市劳动就业服务管理中心',
    handler: '赵经办',
    handlerPhone: '025-12333',
    materials: [
      {
        id: 'mat_003_01',
        name: '身份证',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-04-10 10:00:00",
        verified: true,
        verifyTime: '2026-04-10 14:00:00",
        verifyResult: 'pass'
      },
      {
        id: 'mat_003_02',
        name: '离职证明',
        type: 'required',
        format: 'image',
        fileUrl: '',
        uploadTime: '2026-04-10 10:05:00",
        verified: true,
        verifyTime: '2026-04-10 14:05:00",
        verifyResult: 'pass'
      }
    ],
    approvalNodes: [
      {
        id: 'node_003_01',
        nodeName: '材料审核',
        nodeOrder: 1,
        status: 'completed',
        handler: '赵经办',
        handleTime: '2026-04-10 14:30:00",
        handleResult: 'pass',
        startTime: '2026-04-10 10:05:00",
        endTime: '2026-04-10 14:30:00",
        estimatedDuration: 1
      },
      {
        id: 'node_003_02',
        nodeName: '信息核实',
        nodeOrder: 2,
        status: 'completed',
        handler: '赵经办',
        handleTime: '2026-04-11 11:00:00",
        handleResult: 'pass',
        startTime: '2026-04-10 14:30:00",
        endTime: '2026-04-11 11:00:00",
        estimatedDuration: 1
      },
      {
        id: 'node_003_03',
        nodeName: '登记完成',
        nodeOrder: 3,
        status: 'completed',
        handler: '系统',
        handleTime: '2026-04-12 15:30:00",
        handleResult: 'pass',
        startTime: '2026-04-11 11:00:00",
        endTime: '2026-04-12 15:30:00",
        estimatedDuration: 1
      }
    ],
    traceRecords: [
      {
        id: 'trace_003_01',
        operation: '提交申请',
        operator: '张三',
        operatorRole: '申请人',
        operationTime: '2026-04-10 10:00:00",
        operationDetail: '提交失业登记申请',
        previousStatus: 'draft',
        currentStatus: 'submitted'
      },
      {
        id: 'trace_003_02',
        operation: '材料审核通过',
        operator: '赵经办',
        operatorRole: '经办员',
        operationTime: '2026-04-10 14:30:00",
        operationDetail: '提交材料审核通过',
        previousStatus: 'submitted',
        currentStatus: 'accepted'
      },
      {
        id: 'trace_003_03',
        operation: '信息核实通过',
        operator: '赵经办',
        operatorRole: '经办员',
        operationTime: '2026-04-11 11:00:00",
        operationDetail: '失业信息核实通过',
        previousStatus: 'accepted',
        currentStatus: 'approved'
      },
      {
        id: 'trace_003_04',
        operation: '登记完成',
        operator: '系统',
        operatorRole: '系统',
        operationTime: '2026-04-12 15:30:00",
        operationDetail: '失业登记完成，发放《就业创业证》电子证照已生成',
        previousStatus: 'approved',
        currentStatus: 'completed'
      }
    ],
    feePaid: true,
    isUrgent: false,
    isCrossProvince: false,
    result: '已完成失业登记，《就业创业证》电子证照已生成'
  }
];

export const mockMatterStats = {
  total: 12,
  processing: 3,
  completed: 8,
  rejected: 1,
  thisMonth: 5
};
