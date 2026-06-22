import { Router, type Request, type Response } from 'express';
import type { ApiResponse, ServiceCategory } from '../../shared/types.js';

const router = Router();

const serviceCategories: ServiceCategory[] = [
  {
    id: 'household',
    name: '户籍办理',
    icon: 'Users',
    description: '户口登记、迁移、身份证办理等户政服务',
    items: [
      {
        id: 'birth-reg',
        name: '出生登记',
        icon: 'Baby',
        description: '新生儿户口登记办理',
        requiredDocs: ['出生医学证明', '父母结婚证', '父母户口簿', '父母身份证'],
        handlingTime: '即时办理',
        fee: '免费',
      },
      {
        id: 'id-card',
        name: '身份证办理',
        icon: 'CreditCard',
        description: '首次申领、换领、补领居民身份证',
        requiredDocs: ['居民户口簿', '原居民身份证（换领时）'],
        handlingTime: '20个工作日',
        fee: '首次申领免费，换领20元，补领40元',
      },
      {
        id: 'house-move',
        name: '户口迁移',
        icon: 'MapPin',
        description: '市内迁移、市外迁入迁出',
        requiredDocs: ['迁移理由相关证明材料', '居民户口簿', '居民身份证'],
        handlingTime: '材料齐全当场办理',
        fee: '免费',
      },
    ],
  },
  {
    id: 'social-security',
    name: '社会保障',
    icon: 'ShieldCheck',
    description: '社保缴纳、医保报销、退休办理等',
    items: [
      {
        id: 'social-insurance',
        name: '社保参保登记',
        icon: 'FileCheck',
        description: '职工、灵活就业人员社保登记',
        requiredDocs: ['身份证', '户口簿', '劳动合同（职工参保）'],
        handlingTime: '5个工作日',
        fee: '免费',
      },
      {
        id: 'medical-reimbursement',
        name: '医保报销',
        icon: 'HeartPulse',
        description: '门诊、住院医疗费用报销',
        requiredDocs: ['医疗费用发票', '费用清单', '出院小结', '社保卡'],
        handlingTime: '15个工作日',
        fee: '免费',
      },
      {
        id: 'retirement',
        name: '退休办理',
        icon: 'CalendarClock',
        description: '职工退休手续办理、养老金核定',
        requiredDocs: ['身份证', '户口簿', '职工档案', '养老保险缴费证明'],
        handlingTime: '30个工作日',
        fee: '免费',
      },
    ],
  },
  {
    id: 'housing',
    name: '住房服务',
    icon: 'Home',
    description: '不动产登记、公积金、住房保障等',
    items: [
      {
        id: 'real-estate-reg',
        name: '不动产登记',
        icon: 'Building',
        description: '房屋所有权首次登记、转移登记等',
        requiredDocs: ['不动产权属证书', '买卖合同', '完税证明', '身份证明'],
        handlingTime: '5个工作日',
        fee: '住宅80元/件，非住宅550元/件',
      },
      {
        id: 'housing-fund',
        name: '公积金提取',
        icon: 'Wallet',
        description: '购房、租房、退休等提取住房公积金',
        requiredDocs: ['身份证', '提取理由证明材料', '公积金卡'],
        handlingTime: '3个工作日',
        fee: '免费',
      },
      {
        id: 'affordable-housing',
        name: '保障房申请',
        icon: 'KeyRound',
        description: '公租房、经济适用房申请',
        requiredDocs: ['身份证', '户口簿', '收入证明', '住房证明'],
        handlingTime: '30个工作日',
        fee: '免费',
      },
    ],
  },
  {
    id: 'education',
    name: '教育服务',
    icon: 'GraduationCap',
    description: '入学报名、学历认证、职业培训等',
    items: [
      {
        id: 'school-enroll',
        name: '入学报名',
        icon: 'BookOpen',
        description: '小学、初中新生入学报名',
        requiredDocs: ['户口簿', '房产证（或租赁合同）', '儿童预防接种证'],
        handlingTime: '按招生公告时间',
        fee: '免费',
      },
      {
        id: 'edu-cert',
        name: '学历认证',
        icon: 'Award',
        description: '学历学位认证办理',
        requiredDocs: ['身份证', '学历证书', '学位证书'],
        handlingTime: '10个工作日',
        fee: '免费',
      },
      {
        id: 'vocational-training',
        name: '职业技能培训',
        icon: 'Briefcase',
        description: '职业技能等级认定、培训补贴申请',
        requiredDocs: ['身份证', '职业资格证书', '培训证明材料'],
        handlingTime: '15个工作日',
        fee: '按项目收费，部分免费',
      },
    ],
  },
  {
    id: 'medical',
    name: '医疗健康',
    icon: 'Stethoscope',
    description: '预约挂号、健康证办理、疫苗接种等',
    items: [
      {
        id: 'appointment',
        name: '预约挂号',
        icon: 'Calendar',
        description: '市级医院专家门诊预约',
        requiredDocs: ['身份证', '医保卡'],
        handlingTime: '即时办理',
        fee: '按医院收费标准',
      },
      {
        id: 'health-cert',
        name: '健康证办理',
        icon: 'FileHeart',
        description: '从业人员健康证明办理',
        requiredDocs: ['身份证', '1寸免冠照片2张'],
        handlingTime: '5个工作日',
        fee: '免费',
      },
      {
        id: 'vaccination',
        name: '疫苗接种',
        icon: 'Syringe',
        description: '儿童常规疫苗、成人疫苗接种',
        requiredDocs: ['身份证', '儿童预防接种本（儿童接种）'],
        handlingTime: '即时办理',
        fee: '一类疫苗免费，二类疫苗按规定收费',
      },
    ],
  },
  {
    id: 'transport',
    name: '交通出行',
    icon: 'Car',
    description: '驾驶证办理、车辆登记、公交服务等',
    items: [
      {
        id: 'driver-license',
        name: '驾驶证办理',
        icon: 'License',
        description: '驾驶证申领、换证、补证',
        requiredDocs: ['身份证', '身体条件证明', '驾驶证（换证补证时）'],
        handlingTime: '3个工作日',
        fee: '工本费10元',
      },
      {
        id: 'vehicle-reg',
        name: '车辆登记',
        icon: 'Truck',
        description: '机动车注册登记、转移登记',
        requiredDocs: ['身份证', '购车发票', '车辆合格证', '交强险保单'],
        handlingTime: '1个工作日',
        fee: '工本费125元',
      },
      {
        id: 'transit-card',
        name: '公交卡办理',
        icon: 'Ticket',
        description: '市民卡、公交卡办理充值',
        requiredDocs: ['身份证'],
        handlingTime: '即时办理',
        fee: '押金20元',
      },
    ],
  },
];

router.get('/', (req: Request, res: Response): void => {
  try {
    const response: ApiResponse<ServiceCategory[]> = {
      success: true,
      data: serviceCategories,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch services',
    };
    res.status(500).json(response);
  }
});

router.get('/:category', (req: Request, res: Response): void => {
  try {
    const { category } = req.params;
    const cat = serviceCategories.find((c) => c.id === category);
    if (!cat) {
      const response: ApiResponse = {
        success: false,
        error: 'Service category not found',
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<ServiceCategory> = {
      success: true,
      data: cat,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch service category',
    };
    res.status(500).json(response);
  }
});

router.post('/sos/call', (req: Request, res: Response): void => {
  try {
    const { name, phone, location, description } = req.body;
    if (!name || !phone) {
      const response: ApiResponse = {
        success: false,
        error: 'Name and phone are required',
      };
      res.status(400).json(response);
      return;
    }
    const sosRecord = {
      id: Math.random().toString(36).slice(2, 10),
      name,
      phone,
      location: location || null,
      description: description || null,
      status: 'received',
      createdAt: new Date().toISOString(),
    };
    const response: ApiResponse<typeof sosRecord> = {
      success: true,
      data: sosRecord,
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process SOS call',
    };
    res.status(500).json(response);
  }
});

export default router;
