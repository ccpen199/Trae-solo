import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { AppModule } from '../src/app.module';
import { Role } from '../src/modules/auth/entities/role.entity';
import { Permission } from '../src/modules/auth/entities/permission.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { UserRole } from '../src/modules/auth/entities/user-role.entity';
import { RolePermission } from '../src/modules/auth/entities/role-permission.entity';
import { Sm4Util } from '../src/common/utils/sm4.util';
import systemConfig from '../src/config/system-config.json';
import { ServiceCategory } from '../src/modules/service-hub/entities/service-category.entity';
import { ServiceItem } from '../src/modules/service-hub/entities/service-item.entity';
import { ServiceSubitem } from '../src/modules/service-hub/entities/service-subitem.entity';
import { CertCatalog } from '../src/modules/e-cert/entities/cert-catalog.entity';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const sm4Util = app.get(Sm4Util);

  console.log('========== 初始化数据开始 ==========');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const roleRepo = queryRunner.manager.getRepository(Role);
    const permissionRepo = queryRunner.manager.getRepository(Permission);
    const userRepo = queryRunner.manager.getRepository(User);
    const userRoleRepo = queryRunner.manager.getRepository(UserRole);
    const rolePermissionRepo = queryRunner.manager.getRepository(RolePermission);

    console.log('1. 初始化权限数据...');
    const permissions = [
      { code: 'auth:login', name: '登录认证', module: 'auth', action: 'login' },
      { code: 'auth:userinfo', name: '查看用户信息', module: 'auth', action: 'read' },
      { code: 'service:item:read', name: '查询办事事项', module: 'service-hub', action: 'read' },
      { code: 'service:application:create', name: '创建申报单', module: 'service-hub', action: 'create' },
      { code: 'service:application:read', name: '查询申报单', module: 'service-hub', action: 'read' },
      { code: 'service:application:revoke', name: '撤销申报单', module: 'service-hub', action: 'delete' },
      { code: 'cert:catalog:read', name: '查询证照目录', module: 'e-cert', action: 'read' },
      { code: 'cert:my:read', name: '查询我的证照', module: 'e-cert', action: 'read' },
      { code: 'cert:authorize', name: '授权证照调用', module: 'e-cert', action: 'authorize' },
      { code: 'cert:verify', name: '证照验真', module: 'e-cert', action: 'verify' },
      { code: 'cert:dept:pull', name: '从委办局同步证照', module: 'e-cert', action: 'sync' },
      { code: 'dashboard:read', name: '查看数据看板', module: 'city-data', action: 'read' },
      { code: 'dashboard:profile:update', name: '更新用户画像', module: 'city-data', action: 'update' },
      { code: 'recommend:read', name: '查看推荐', module: 'city-data', action: 'read' },
      { code: 'ticket:create', name: '提交工单', module: 'ticket', action: 'create' },
      { code: 'ticket:read', name: '查询工单', module: 'ticket', action: 'read' },
      { code: 'ticket:urgency', name: '工单催办', module: 'ticket', action: 'urgency' },
      { code: 'ticket:satisfaction', name: '满意度评价', module: 'ticket', action: 'evaluate' },
      { code: 'admin:ticket:dispatch', name: '工单分派', module: 'ticket-admin', action: 'dispatch' },
      { code: 'admin:ticket:reply', name: '工单回复', module: 'ticket-admin', action: 'reply' },
      { code: 'admin:ticket:close', name: '工单办结', module: 'ticket-admin', action: 'close' },
      { code: 'admin:item:manage', name: '事项管理', module: 'service-admin', action: 'manage' },
      { code: 'admin:cert:manage', name: '证照管理', module: 'cert-admin', action: 'manage' },
      { code: 'admin:audit:read', name: '审计日志查询', module: 'system', action: 'audit-read' },
      { code: 'admin:system:config', name: '系统配置', module: 'system', action: 'config' },
    ];

    const savedPermissions: Permission[] = [];
    for (const p of permissions) {
      const exists = await permissionRepo.findOne({ where: { code: p.code } });
      if (!exists) {
        const perm = permissionRepo.create({
          code: p.code,
          name: p.name,
          module: p.module,
          action: p.action,
          description: p.name,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
        });
        savedPermissions.push(await permissionRepo.save(perm));
      } else {
        savedPermissions.push(exists);
      }
    }
    console.log(`   权限数据初始化完成，共 ${savedPermissions.length} 条`);

    console.log('2. 初始化角色数据...');
    const roles = [
      { code: 'SUPER_ADMIN', name: '超级管理员', description: '拥有所有权限，系统初始化角色', isSystem: true },
      { code: 'DEPT_ADMIN', name: '委办局管理员', description: '委办局事项管理人员', isSystem: true },
      { code: 'DEPT_STAFF', name: '委办局办事员', description: '委办局工单、申报处理人员', isSystem: true },
      { code: 'NATURAL_USER', name: '个人用户', description: '自然人注册用户', isSystem: true },
      { code: 'LEGAL_USER', name: '法人用户', description: '企业法人注册用户', isSystem: true },
    ];

    const savedRoles: Role[] = [];
    for (const r of roles) {
      const exists = await roleRepo.findOne({ where: { code: r.code } });
      if (!exists) {
        const role = roleRepo.create({
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
        });
        savedRoles.push(await roleRepo.save(role));
      } else {
        savedRoles.push(exists);
      }
    }
    console.log(`   角色数据初始化完成，共 ${savedRoles.length} 条`);

    console.log('3. 初始化角色-权限关联...');
    const superAdmin = savedRoles.find(r => r.code === 'SUPER_ADMIN');
    const deptAdmin = savedRoles.find(r => r.code === 'DEPT_ADMIN');
    const deptStaff = savedRoles.find(r => r.code === 'DEPT_STAFF');
    const naturalUser = savedRoles.find(r => r.code === 'NATURAL_USER');
    const legalUser = savedRoles.find(r => r.code === 'LEGAL_USER');

    const rolePermMap: Record<string, string[]> = {
      SUPER_ADMIN: savedPermissions.map(p => p.code),
      DEPT_ADMIN: [
        'service:item:read', 'cert:catalog:read', 'cert:verify', 'cert:dept:pull',
        'admin:ticket:dispatch', 'admin:ticket:reply', 'admin:ticket:close',
        'admin:item:manage', 'admin:cert:manage', 'admin:audit:read'
      ],
      DEPT_STAFF: [
        'service:item:read', 'cert:catalog:read', 'cert:verify', 'cert:my:read',
        'admin:ticket:reply', 'admin:ticket:close'
      ],
      NATURAL_USER: [
        'auth:login', 'auth:userinfo', 'service:item:read',
        'service:application:create', 'service:application:read', 'service:application:revoke',
        'cert:catalog:read', 'cert:my:read', 'cert:authorize', 'cert:verify', 'cert:dept:pull',
        'dashboard:read', 'dashboard:profile:update', 'recommend:read',
        'ticket:create', 'ticket:read', 'ticket:urgency', 'ticket:satisfaction'
      ],
      LEGAL_USER: [
        'auth:login', 'auth:userinfo', 'service:item:read',
        'service:application:create', 'service:application:read', 'service:application:revoke',
        'cert:catalog:read', 'cert:my:read', 'cert:authorize', 'cert:verify', 'cert:dept:pull',
        'dashboard:read', 'dashboard:profile:update', 'recommend:read',
        'ticket:create', 'ticket:read', 'ticket:urgency', 'ticket:satisfaction'
      ],
    };

    for (const role of savedRoles) {
      const permCodes = rolePermMap[role.code] || [];
      for (const pc of permCodes) {
        const perm = savedPermissions.find(p => p.code === pc);
        if (perm) {
          const exists = await rolePermissionRepo.findOne({
            where: { roleId: role.id, permissionId: perm.id }
          });
          if (!exists) {
            const rp = rolePermissionRepo.create({
              roleId: role.id,
              permissionId: perm.id,
              createdAt: dayjs().toDate(),
              updatedAt: dayjs().toDate(),
            });
            await rolePermissionRepo.save(rp);
          }
        }
      }
    }
    console.log('   角色权限关联初始化完成');

    console.log('4. 初始化管理员账号...');
    const adminIdCard = sm4Util.encrypt('640101199001011234');
    const adminPhone = sm4Util.encrypt('13900000001');
    const adminPassword = await bcrypt.hash('NxGov@2024', 10);

    let adminUser = await userRepo.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      adminUser = userRepo.create({
        username: 'admin',
        realName: '系统管理员',
        idCard: adminIdCard,
        phone: adminPhone,
        email: 'admin@nx.gov.cn',
        passwordHash: adminPassword,
        userType: 'admin',
        status: 'active',
        avatar: null,
        lastLoginIp: null,
        lastLoginTime: null,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      });
      adminUser = await userRepo.save(adminUser);
      const ur = userRoleRepo.create({
        userId: adminUser.id,
        roleId: superAdmin.id,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      });
      await userRoleRepo.save(ur);
      console.log('   管理员账号创建成功: admin / NxGov@2024');
    } else {
      console.log('   管理员账号已存在，跳过');
    }

    let testUser = await userRepo.findOne({ where: { username: 'test_user' } });
    if (!testUser) {
      const testIdCard = sm4Util.encrypt('640102199505058888');
      const testPhone = sm4Util.encrypt('13800001111');
      const testPassword = await bcrypt.hash('Test@123456', 10);

      testUser = userRepo.create({
        username: 'test_user',
        realName: '测试用户',
        idCard: testIdCard,
        phone: testPhone,
        email: 'test@nx.gov.cn',
        passwordHash: testPassword,
        userType: 'natural',
        status: 'active',
        avatar: null,
        lastLoginIp: null,
        lastLoginTime: null,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      });
      testUser = await userRepo.save(testUser);
      const ur = userRoleRepo.create({
        userId: testUser.id,
        roleId: naturalUser.id,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      });
      await userRoleRepo.save(ur);
      console.log('   测试用户创建成功: test_user / Test@123456');
    }

    console.log('5. 初始化证照目录...');
    const certCatalogRepo = queryRunner.manager.getRepository(CertCatalog);
    const certTypes = (systemConfig as any).certTypes || [];

    const certFieldsPresets: Record<string, any[]> = {
      SFZ: [
        { name: 'name', label: '姓名', type: 'string', encrypted: false, masked: false },
        { name: 'gender', label: '性别', type: 'string', encrypted: false, masked: false },
        { name: 'ethnicity', label: '民族', type: 'string', encrypted: false, masked: false },
        { name: 'birthDate', label: '出生日期', type: 'date', encrypted: false, masked: false },
        { name: 'address', label: '住址', type: 'string', encrypted: true, masked: true },
        { name: 'idNumber', label: '公民身份号码', type: 'string', encrypted: true, masked: true },
        { name: 'issuingAuthority', label: '签发机关', type: 'string', encrypted: false, masked: false },
        { name: 'validPeriod', label: '有效期', type: 'string', encrypted: false, masked: false },
      ],
      HKZ: [
        { name: 'householderName', label: '户主姓名', type: 'string', encrypted: false, masked: false },
        { name: 'householdNumber', label: '户号', type: 'string', encrypted: true, masked: true },
        { name: 'address', label: '住址', type: 'string', encrypted: true, masked: true },
        { name: 'members', label: '家庭成员', type: 'array', encrypted: true, masked: false },
      ],
      JHZ: [
        { name: 'husbandName', label: '男方姓名', type: 'string', encrypted: false, masked: false },
        { name: 'wifeName', label: '女方姓名', type: 'string', encrypted: false, masked: false },
        { name: 'husbandIdNumber', label: '男方身份证号', type: 'string', encrypted: true, masked: true },
        { name: 'wifeIdNumber', label: '女方身份证号', type: 'string', encrypted: true, masked: true },
        { name: 'registrationDate', label: '登记日期', type: 'date', encrypted: false, masked: false },
        { name: 'issuingAuthority', label: '发证机关', type: 'string', encrypted: false, masked: false },
      ],
      SBK: [
        { name: 'name', label: '姓名', type: 'string', encrypted: false, masked: false },
        { name: 'idNumber', label: '身份证号', type: 'string', encrypted: true, masked: true },
        { name: 'socialSecurityNumber', label: '社保号', type: 'string', encrypted: true, masked: true },
        { name: 'cardNumber', label: '卡号', type: 'string', encrypted: true, masked: true },
        { name: 'issuingDate', label: '发卡日期', type: 'date', encrypted: false, masked: false },
      ],
      YLZ: [
        { name: 'name', label: '姓名', type: 'string', encrypted: false, masked: false },
        { name: 'idNumber', label: '身份证号', type: 'string', encrypted: true, masked: true },
        { name: 'medicalInsuranceNumber', label: '医保编号', type: 'string', encrypted: true, masked: true },
        { name: 'insuredArea', label: '参保地', type: 'string', encrypted: false, masked: false },
        { name: 'insuredStatus', label: '参保状态', type: 'string', encrypted: false, masked: false },
      ],
      JDZ: [
        { name: 'name', label: '姓名', type: 'string', encrypted: false, masked: false },
        { name: 'idNumber', label: '身份证号', type: 'string', encrypted: true, masked: true },
        { name: 'licenseNumber', label: '驾驶证号', type: 'string', encrypted: true, masked: true },
        { name: 'licenseType', label: '准驾车型', type: 'string', encrypted: false, masked: false },
        { name: 'validFrom', label: '有效起始日期', type: 'date', encrypted: false, masked: false },
        { name: 'validFor', label: '有效期', type: 'string', encrypted: false, masked: false },
      ],
    };

    for (const ct of certTypes) {
      const exists = await certCatalogRepo.findOne({ where: { code: ct.code } });
      if (!exists) {
        const fieldsDef = (certFieldsPresets[ct.code] || [
          { name: 'certNumber', label: '证照编号', type: 'string', encrypted: true, masked: true },
          { name: 'name', label: '持有人', type: 'string', encrypted: false, masked: false },
          { name: 'issueDate', label: '发证日期', type: 'date', encrypted: false, masked: false },
          { name: 'expireDate', label: '到期日期', type: 'date', encrypted: false, masked: false },
          { name: 'issuingAuthority', label: '发证机关', type: 'string', encrypted: false, masked: false },
        ]) as any[];
        const catalog = certCatalogRepo.create({
          code: ct.code,
          name: ct.name,
          category: ct.category || '其他',
          deptCode: ct.dept || 'OTHER',
          validPeriod: 0,
          certFieldsDef: fieldsDef,
          description: ct.name + ' - 宁夏政务电子证照',
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
        });
        await certCatalogRepo.save(catalog);
      }
    }
    console.log(`   证照目录初始化完成，共 ${certTypes.length} 类`);

    console.log('6. 初始化事项分类...');
    const categoryRepo = queryRunner.manager.getRepository(ServiceCategory);
    const itemRepo = queryRunner.manager.getRepository(ServiceItem);
    const subitemRepo = queryRunner.manager.getRepository(ServiceSubitem);

    const categoryTree = [
      { code: 'ROOT', name: '全部事项', level: 0, deptCode: 'ALL', children: [
        { code: 'GA_CAT', name: '公安服务', level: 1, deptCode: 'GA', children: [
          { code: 'GA_HUKOU', name: '户籍办理', level: 2, deptCode: 'GA', children: [] },
          { code: 'GA_IDCARD', name: '身份证办理', level: 2, deptCode: 'GA', children: [] },
          { code: 'GA_TRAFFIC', name: '交管服务', level: 2, deptCode: 'GA', children: [] },
          { code: 'GA_EXIT', name: '出入境办理', level: 2, deptCode: 'GA', children: [] },
        ]},
        { code: 'RS_CAT', name: '人社服务', level: 1, deptCode: 'RS', children: [
          { code: 'RS_SOCIAL', name: '社会保障', level: 2, deptCode: 'RS', children: [] },
          { code: 'RS_EMPLOY', name: '就业服务', level: 2, deptCode: 'RS', children: [] },
          { code: 'RS_TALENT', name: '人才服务', level: 2, deptCode: 'RS', children: [] },
        ]},
        { code: 'YB_CAT', name: '医保服务', level: 1, deptCode: 'YB', children: [
          { code: 'YB_INSUR', name: '参保登记', level: 2, deptCode: 'YB', children: [] },
          { code: 'YB_SETTLE', name: '医保结算', level: 2, deptCode: 'YB', children: [] },
          { code: 'YB_REIM', name: '医保报销', level: 2, deptCode: 'YB', children: [] },
        ]},
        { code: 'ZJ_CAT', name: '住建服务', level: 1, deptCode: 'ZJ', children: [
          { code: 'ZJ_GJJ', name: '住房公积金', level: 2, deptCode: 'GJJ', children: [] },
          { code: 'ZJ_HOUSE', name: '不动产登记', level: 2, deptCode: 'GT', children: [] },
          { code: 'ZJ_BUILD', name: '工程建设', level: 2, deptCode: 'ZJ', children: [] },
        ]},
        { code: 'MZ_CAT', name: '民政服务', level: 1, deptCode: 'MZ', children: [
          { code: 'MZ_MARRY', name: '婚姻登记', level: 2, deptCode: 'MZ', children: [] },
          { code: 'MZ_WELF', name: '社会福利', level: 2, deptCode: 'MZ', children: [] },
          { code: 'MZ_FUN', name: '殡葬服务', level: 2, deptCode: 'MZ', children: [] },
        ]},
        { code: 'EDU_CAT', name: '教育服务', level: 1, deptCode: 'JY', children: [
          { code: 'EDU_ENROLL', name: '入学报名', level: 2, deptCode: 'JY', children: [] },
          { code: 'EDU_CERT', name: '教育认证', level: 2, deptCode: 'JY', children: [] },
        ]},
        { code: 'TAX_CAT', name: '税务服务', level: 1, deptCode: 'SJ', children: [
          { code: 'TAX_DECL', name: '申报纳税', level: 2, deptCode: 'SJ', children: [] },
          { code: 'TAX_INV', name: '发票管理', level: 2, deptCode: 'SJ', children: [] },
        ]},
        { code: 'SC_CAT', name: '市场监管', level: 1, deptCode: 'SC', children: [
          { code: 'SC_REG', name: '企业注册', level: 2, deptCode: 'SC', children: [] },
          { code: 'SC_CERT', name: '许可认证', level: 2, deptCode: 'SC', children: [] },
        ]},
      ]}
    ];

    const savedCategories: Map<string, ServiceCategory> = new Map();

    async function saveCategories(cats: any[], parentId: string | null) {
      for (const cat of cats) {
        let exists = await categoryRepo.findOne({ where: { code: cat.code } });
        if (!exists) {
          exists = categoryRepo.create({
            code: cat.code,
            name: cat.name,
            level: cat.level,
            sort: 0,
            deptCode: cat.deptCode,
            parentId: parentId,
            createdAt: dayjs().toDate(),
            updatedAt: dayjs().toDate(),
          });
          exists = await categoryRepo.save(exists);
        }
        savedCategories.set(cat.code, exists);
        if (cat.children && cat.children.length > 0) {
          await saveCategories(cat.children, exists.id);
        }
      }
    }
    await saveCategories(categoryTree, null);
    console.log(`   事项分类初始化完成，共 ${savedCategories.size} 个分类`);

    console.log('7. 初始化示例事项和子项...');
    const svcTypeMap: Record<string, any> = {
      '行政许可': 'administrative_license',
      '行政确认': 'administrative_confirmation',
      '公共服务': 'public_service',
      '行政给付': 'administrative_collection',
      '行政检查': 'administrative_penalty',
    };
    const handlingMap: Record<string, any> = {
      '线上': 'online',
      '线下': 'offline',
      '线上线下融合': 'hybrid',
      '线上预约+线下办理': 'hybrid',
    };
    const sampleItems = [
      {
        code: 'GA_SFZ_BANLI',
        title: '居民身份证申领',
        deptCode: 'GA',
        categoryCode: 'GA_IDCARD',
        serviceType: svcTypeMap['行政确认'],
        handlingMode: handlingMap['线下'],
        promiseDays: 20,
        chargeStandard: '20元/证',
        legalBasis: '《中华人民共和国居民身份证法》',
        materialsRequired: [
          { name: '居民户口簿', required: true, certType: 'HKZ', description: '原件核验' },
          { name: '《居民身份证申领登记表》', required: true, certType: null, description: '现场填写' },
        ],
        subitems: [
          { code: 'GA_SFZ_BANLI_XINSHOU', name: '首次申领居民身份证', description: '年满16周岁首次申领' },
          { code: 'GA_SFZ_BANLI_HUANLING', name: '居民身份证换领', description: '有效期满、信息变更换领' },
          { code: 'GA_SFZ_BANLI_BULING', name: '居民身份证补领', description: '证件丢失补领' },
        ],
      },
      {
        code: 'GA_HUKOU_QIANRU',
        title: '户口迁入登记',
        deptCode: 'GA',
        categoryCode: 'GA_HUKOU',
        serviceType: svcTypeMap['行政确认'],
        handlingMode: handlingMap['线上线下融合'],
        promiseDays: 7,
        chargeStandard: '免费',
        legalBasis: '《中华人民共和国户口登记条例》',
        materialsRequired: [
          { name: '居民户口簿', required: true, certType: 'HKZ' },
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '户口迁移证', required: true, certType: null },
        ],
        subitems: [
          { code: 'GA_HUKOU_QIANRU_GANBU', name: '干部调动户口迁入', description: '组织人事部门调动' },
          { code: 'GA_HUKOU_QIANRU_TALENT', name: '人才引进户口迁入', description: '符合人才引进政策' },
          { code: 'GA_HUKOU_QIANRU_TOUKAO', name: '投靠落户', description: '夫妻/父母/子女投靠' },
          { code: 'GA_HUKOU_QIANRU_GOUFANG', name: '购房落户', description: '购买商品住房' },
        ],
      },
      {
        code: 'MZ_JIEHUN_DENGJI',
        title: '结婚登记',
        deptCode: 'MZ',
        categoryCode: 'MZ_MARRY',
        serviceType: svcTypeMap['行政确认'],
        handlingMode: handlingMap['线上预约+线下办理'],
        promiseDays: 1,
        chargeStandard: '免费',
        legalBasis: '《中华人民共和国民法典》婚姻家庭编',
        materialsRequired: [
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '居民户口簿', required: true, certType: 'HKZ' },
          { name: '双方近期半身免冠合影照片', required: true, certType: null },
        ],
        subitems: [
          { code: 'MZ_JIEHUN_DENGJI_CHUCI', name: '初婚登记', description: '双方均为初婚' },
          { code: 'MZ_JIEHUN_DENGJI_ZAIHUN', name: '再婚登记', description: '一方或双方再婚（需提供离婚证明）' },
          { code: 'MZ_JIEHUN_DENGJI_BUMING', name: '补领结婚证', description: '结婚证遗失或损毁补领' },
        ],
      },
      {
        code: 'RS_SHEBAO_CANBAO',
        title: '社会保险参保登记',
        deptCode: 'RS',
        categoryCode: 'RS_SOCIAL',
        serviceType: svcTypeMap['公共服务'],
        handlingMode: handlingMap['线上'],
        promiseDays: 3,
        chargeStandard: '免费',
        legalBasis: '《中华人民共和国社会保险法》',
        materialsRequired: [
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '居民户口簿', required: true, certType: 'HKZ' },
        ],
        subitems: [
          { code: 'RS_SHEBAO_CANBAO_ZIYOU', name: '灵活就业人员参保', description: '个体工商户、自由职业者' },
          { code: 'RS_SHEBAO_CANBAO_NONGCUN', name: '城乡居民养老参保', description: '农村居民、城镇居民' },
          { code: 'RS_SHEBAO_CANBAO_DANWEI', name: '单位职工新增参保', description: '企业统一办理' },
        ],
      },
      {
        code: 'YB_BAOXIAO_CHUZHONG',
        title: '住院费用医保报销',
        deptCode: 'YB',
        categoryCode: 'YB_REIM',
        serviceType: svcTypeMap['行政给付'],
        handlingMode: handlingMap['线上线下融合'],
        promiseDays: 15,
        chargeStandard: '免费',
        legalBasis: '《国家基本医疗保险诊疗项目》',
        materialsRequired: [
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '医疗保险证', required: true, certType: 'YLZ' },
          { name: '住院发票', required: true, certType: null },
          { name: '费用明细清单', required: true, certType: null },
          { name: '出院小结', required: true, certType: null },
        ],
        subitems: [
          { code: 'YB_BAOXIAO_CHUZHONG_BENDI', name: '本地住院报销', description: '统筹区内住院' },
          { code: 'YB_BAOXIAO_CHUZHONG_YIDI', name: '异地住院报销', description: '统筹区外住院（需备案）' },
        ],
      },
      {
        code: 'ZJ_GJJ_TIQUSHENQING',
        title: '住房公积金提取申请',
        deptCode: 'GJJ',
        categoryCode: 'ZJ_GJJ',
        serviceType: svcTypeMap['公共服务'],
        handlingMode: handlingMap['线上'],
        promiseDays: 3,
        chargeStandard: '免费',
        legalBasis: '《住房公积金管理条例》',
        materialsRequired: [
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '住房公积金缴存证明', required: true, certType: 'GJJZ' },
        ],
        subitems: [
          { code: 'ZJ_GJJ_TIQU_GOUFANG', name: '购买自住住房提取', description: '购房合同或产权证' },
          { code: 'ZJ_GJJ_TIQU_HUANKUAN', name: '偿还住房贷款提取', description: '贷款合同、还款明细' },
          { code: 'ZJ_GJJ_TIQU_ZUFANG', name: '无房租房提取', description: '无房证明、租房合同' },
          { code: 'ZJ_GJJ_TIQU_TUIXIU', name: '退休销户提取', description: '退休证' },
        ],
      },
      {
        code: 'GT_BDCZH_DENGJI',
        title: '不动产权证书登记',
        deptCode: 'GT',
        categoryCode: 'ZJ_HOUSE',
        serviceType: svcTypeMap['行政确认'],
        handlingMode: handlingMap['线上线下融合'],
        promiseDays: 5,
        chargeStandard: '住宅80元/件，非住宅550元/件',
        legalBasis: '《不动产登记暂行条例》',
        materialsRequired: [
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '不动产权属来源证明', required: true, certType: null },
          { name: '房产测绘报告', required: true, certType: null },
        ],
        subitems: [
          { code: 'GT_BDCZH_DENGJI_SHOUCI', name: '首次登记', description: '新建房屋首次办理登记' },
          { code: 'GT_BDCZH_DENGJI_ZHUANYI', name: '转移登记', description: '买卖、赠与、继承等' },
          { code: 'GT_BDCZH_DENGJI_DIYA', name: '抵押登记', description: '办理贷款抵押' },
          { code: 'GT_BDCZH_DENGJI_BULING', name: '补（换）证登记', description: '证书遗失补领' },
        ],
      },
      {
        code: 'SC_YYZZ_ZHUCE',
        title: '营业执照办理（个体/企业）',
        deptCode: 'SC',
        categoryCode: 'SC_REG',
        serviceType: svcTypeMap['行政许可'],
        handlingMode: handlingMap['线上线下融合'],
        promiseDays: 3,
        chargeStandard: '免费',
        legalBasis: '《中华人民共和国公司法》《个体工商户条例》',
        materialsRequired: [
          { name: '经营者身份证', required: true, certType: 'SFZ' },
          { name: '经营场所证明', required: true, certType: null },
        ],
        subitems: [
          { code: 'SC_YYZZ_ZHUCE_GETI', name: '个体工商户注册', description: '个人经营' },
          { code: 'SC_YYZZ_ZHUCE_YOUXIAN', name: '有限责任公司设立', description: '50人以下股东' },
          { code: 'SC_YYZZ_ZHUCE_GEFEN', name: '股份有限公司设立', description: '发起设立' },
          { code: 'SC_YYZZ_BIANJI', name: '营业执照变更', description: '名称、地址、经营范围等变更' },
          { code: 'SC_YYZZ_ZHUXIAO', name: '营业执照注销', description: '主体注销登记' },
        ],
      },
      {
        code: 'GA_JDC_DRIVING',
        title: '机动车驾驶证相关业务',
        deptCode: 'GAT',
        categoryCode: 'GA_TRAFFIC',
        serviceType: svcTypeMap['行政许可'],
        handlingMode: handlingMap['线上线下融合'],
        promiseDays: 3,
        chargeStandard: '工本费10元',
        legalBasis: '《机动车驾驶证申领和使用规定》',
        materialsRequired: [
          { name: '居民身份证', required: true, certType: 'SFZ' },
          { name: '身体条件证明', required: true, certType: null },
        ],
        subitems: [
          { code: 'GA_JDC_DRIVING_SHENLING', name: '驾驶证初次申领', description: 'C1/C2/A1/B2等准驾车型' },
          { code: 'GA_JDC_DRIVING_HUANZHENG', name: '驾驶证期满换证', description: '有效期满提前90天' },
          { code: 'GA_JDC_DRIVING_BULING', name: '驾驶证补领', description: '驾驶证遗失补领' },
          { code: 'GA_JDC_DRIVING_ZENGJIA', name: '增加准驾车型', description: '申请增加其他准驾' },
        ],
      },
      {
        code: 'JY_RUYOU_BAOMING',
        title: '义务教育入学报名',
        deptCode: 'JY',
        categoryCode: 'EDU_ENROLL',
        serviceType: svcTypeMap['公共服务'],
        handlingMode: handlingMap['线上'],
        promiseDays: 15,
        chargeStandard: '免费',
        legalBasis: '《中华人民共和国义务教育法》',
        materialsRequired: [
          { name: '居民户口簿', required: true, certType: 'HKZ' },
          { name: '监护人身份证', required: true, certType: 'SFZ' },
          { name: '房产证明或租赁备案', required: true, certType: null },
          { name: '儿童预防接种证', required: true, certType: null },
        ],
        subitems: [
          { code: 'JY_RUYOU_YOUERYUAN', name: '幼儿园报名', description: '3-6岁适龄儿童' },
          { code: 'JY_RUYOU_XIAOXUE', name: '小学报名', description: '年满6周岁儿童' },
          { code: 'JY_RUYOU_CHUZHONG', name: '初中报名', description: '小学升初中' },
        ],
      },
    ];

    let itemCount = 0;
    let subitemCount = 0;
    for (const si of sampleItems) {
      const category = savedCategories.get(si.categoryCode);
      if (!category) continue;

      let item = await itemRepo.findOne({ where: { code: si.code } });
      if (!item) {
        item = itemRepo.create({
          code: si.code,
          title: si.title,
          categoryId: category.id,
          deptCode: si.deptCode,
          serviceType: si.serviceType,
          handlingMode: si.handlingMode,
          promiseDays: si.promiseDays,
          chargeStandard: si.chargeStandard,
          legalBasis: si.legalBasis,
          materialsRequired: si.materialsRequired,
          description: si.title,
          keywords: si.title + ',' + category.name,
          hotLevel: Math.floor(Math.random() * 5) + 1,
          status: 'published',
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
        });
        item = await itemRepo.save(item);
        itemCount++;
      }

      for (const sub of si.subitems) {
        let subitem = await subitemRepo.findOne({ where: { code: sub.code } });
        if (!subitem) {
          subitem = subitemRepo.create({
            itemId: item.id,
            code: sub.code,
            name: sub.name,
            description: sub.description,
            sort: 0,
            conditions: { remark: sub.description },
            materials: si.materialsRequired as any,
            processingFlow: JSON.stringify([
              { step: 1, name: '提交申请', description: '用户在线或线下提交申请材料' },
              { step: 2, name: '受理审核', description: '窗口或系统在线核验材料' },
              { step: 3, name: '审批办理', description: '业务部门按流程审批' },
              { step: 4, name: '结果送达', description: '邮寄或线上返回办理结果' },
            ]),
            createdAt: dayjs().toDate(),
            updatedAt: dayjs().toDate(),
          });
          await subitemRepo.save(subitem);
          subitemCount++;
        }
      }
    }
    console.log(`   示例事项初始化完成：${itemCount} 个事项，${subitemCount} 个子项`);

    await queryRunner.commitTransaction();
    console.log('========== 初始化数据全部完成 ==========');
    console.log('');
    console.log('默认账号:');
    console.log('  超级管理员: admin / NxGov@2024');
    console.log('  个人测试用户: test_user / Test@123456');
    console.log('');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('初始化数据失败:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }

  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
