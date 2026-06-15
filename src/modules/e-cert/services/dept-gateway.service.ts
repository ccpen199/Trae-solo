import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

export interface DeptCertRecord {
  certCode: string;
  certNo: string;
  userId?: string;
  idCardNo: string;
  name: string;
  fields: Record<string, unknown>;
  issueDept: string;
  issueDeptCode: string;
  issueDate: string;
  expireDate?: string;
  status: 'valid' | 'invalid' | 'expired' | 'revoked';
  sourceId: string;
}

export interface DeptVerifyResult {
  passed: boolean;
  certCode: string;
  certNo: string;
  matchedFields: string[];
  unmatchedFields: string[];
  certStatus: string;
  rawResponse?: Record<string, unknown>;
  verifiedAt: string;
  gatewayCode: string;
  gatewayName: string;
}

export interface DeptGatewayConfig {
  code: string;
  name: string;
  fullName: string;
  apiBaseUrl: string;
  apiKey: string;
  timeout: number;
  enabled: boolean;
  supportedCertCodes: string[];
}

const MOCK_GATEWAY_CONFIGS: DeptGatewayConfig[] = [
  {
    code: 'GA',
    name: '公安厅',
    fullName: '宁夏回族自治区公安厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/ga/api/v1',
    apiKey: 'mock-gateway-ga-key-001',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['SFZ', 'HKZ', 'JZS', 'ZZZ', 'JDZ', 'XSZ', 'CLDJZ', 'JGZ'],
  },
  {
    code: 'RS',
    name: '人社厅',
    fullName: '宁夏回族自治区人力资源和社会保障厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/rs/api/v1',
    apiKey: 'mock-gateway-rs-key-002',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['SBK', 'SYZ'],
  },
  {
    code: 'YB',
    name: '医保局',
    fullName: '宁夏回族自治区医疗保障局',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/yb/api/v1',
    apiKey: 'mock-gateway-yb-key-003',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['YLZ', 'YLBX'],
  },
  {
    code: 'ZJ',
    name: '住建厅',
    fullName: '宁夏回族自治区住房和城乡建设厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/zj/api/v1',
    apiKey: 'mock-gateway-zj-key-004',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['GJJZ', 'FCZ'],
  },
  {
    code: 'GT',
    name: '自然资源厅',
    fullName: '宁夏回族自治区自然资源厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/gt/api/v1',
    apiKey: 'mock-gateway-gt-key-005',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['BDCZH'],
  },
  {
    code: 'MZ',
    name: '民政厅',
    fullName: '宁夏回族自治区民政厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/mz/api/v1',
    apiKey: 'mock-gateway-mz-key-006',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['JHZ', 'LHZ', 'BHZ', 'DBZ', 'WZSTZ', 'LAONIAN', 'TXYZ'],
  },
  {
    code: 'WJ',
    name: '卫健委',
    fullName: '宁夏回族自治区卫生健康委员会',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/wj/api/v1',
    apiKey: 'mock-gateway-wj-key-007',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['CZS', 'YYZZ', 'HSZ'],
  },
  {
    code: 'SC',
    name: '市场监管厅',
    fullName: '宁夏回族自治区市场监督管理厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/sc/api/v1',
    apiKey: 'mock-gateway-sc-key-008',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['YWZ', 'SHXYDM'],
  },
  {
    code: 'JY',
    name: '教育厅',
    fullName: '宁夏回族自治区教育厅',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/jy/api/v1',
    apiKey: 'mock-gateway-jy-key-009',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['SXZ', 'BYZ', 'XWZ', 'JSZG'],
  },
  {
    code: 'SJ',
    name: '税务局',
    fullName: '国家税务总局宁夏回族自治区税务局',
    apiBaseUrl: 'https://gateway-gov.nx.gov.cn/sj/api/v1',
    apiKey: 'mock-gateway-sj-key-010',
    timeout: 10000,
    enabled: true,
    supportedCertCodes: ['SWDJ'],
  },
];

const ALL_DEPT_CODES = [
  'GA', 'RS', 'YB', 'ZJ', 'MZ', 'SJ', 'JY', 'WJ', 'JT', 'NY',
  'SL', 'LY', 'HJ', 'GT', 'WY', 'TY', 'TJJ', 'AJ', 'SC', 'SW',
  'ZF', 'SF', 'CZ', 'FGW', 'KJ', 'GXJ', 'YBJ', 'GJJ', 'RSJ',
  'JRS', 'XJ', 'DX', 'MS', 'WA', 'ZK', 'GAT', 'GAJ', 'GAC',
];

@Injectable()
export class DeptGatewayService {
  private readonly logger = new Logger(DeptGatewayService.name);
  private readonly useMock = true;
  private gatewayConfigs: Map<string, DeptGatewayConfig>;

  constructor(private readonly httpService: HttpService) {
    this.gatewayConfigs = new Map();
    MOCK_GATEWAY_CONFIGS.forEach((config) => {
      this.gatewayConfigs.set(config.code, config);
    });
  }

  private getMockDeptCode(certCode: string): string {
    const certDeptMap: Record<string, string> = {
      SFZ: 'GA', HKZ: 'GA', JHZ: 'MZ', LHZ: 'MZ', CZS: 'WJ',
      JZS: 'GA', ZZZ: 'GA', SBK: 'RS', YLZ: 'YB', YLBX: 'YB',
      GJJZ: 'ZJ', FCZ: 'ZJ', BDCZH: 'GT', YWZ: 'SC', SHXYDM: 'SC',
      SXZ: 'JY', BYZ: 'JY', XWZ: 'JY', YYZZ: 'WJ', HSZ: 'WJ',
      JSZG: 'JY', JDZ: 'GA', XSZ: 'GA', CLDJZ: 'GA',
      BHZ: 'MZ', DBZ: 'MZ', WZSTZ: 'MZ', LAONIAN: 'MZ',
      TXYZ: 'MZ', SYZ: 'RS', JGZ: 'GA', SWDJ: 'SJ',
    };
    return certDeptMap[certCode] ?? 'ZF';
  }

  private getMockDeptInfo(deptCode: string): { code: string; name: string; fullName: string } {
    const info: Record<string, { code: string; name: string; fullName: string }> = {
      GA: { code: 'GA', name: '公安厅', fullName: '宁夏回族自治区公安厅' },
      RS: { code: 'RS', name: '人社厅', fullName: '宁夏回族自治区人力资源和社会保障厅' },
      YB: { code: 'YB', name: '医保局', fullName: '宁夏回族自治区医疗保障局' },
      ZJ: { code: 'ZJ', name: '住建厅', fullName: '宁夏回族自治区住房和城乡建设厅' },
      MZ: { code: 'MZ', name: '民政厅', fullName: '宁夏回族自治区民政厅' },
      SJ: { code: 'SJ', name: '税务局', fullName: '国家税务总局宁夏回族自治区税务局' },
      JY: { code: 'JY', name: '教育厅', fullName: '宁夏回族自治区教育厅' },
      WJ: { code: 'WJ', name: '卫健委', fullName: '宁夏回族自治区卫生健康委员会' },
      SC: { code: 'SC', name: '市场监管厅', fullName: '宁夏回族自治区市场监督管理厅' },
      GT: { code: 'GT', name: '自然资源厅', fullName: '宁夏回族自治区自然资源厅' },
    };
    return info[deptCode] ?? { code: 'ZF', name: '政府办公厅', fullName: '宁夏回族自治区人民政府办公厅' };
  }

  private generateRandomIdCard(): string {
    const areaCodes = ['640101', '640102', '640103', '640104', '640105', '640106', '640201', '640202', '640203', '640204'];
    const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const year = 1960 + Math.floor(Math.random() * 50);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    const seq = String(100 + Math.floor(Math.random() * 900));
    const check = String(Math.floor(Math.random() * 10));
    return `${area}${year}${month}${day}${seq}${check}`;
  }

  private generateRandomCertNo(certCode: string): string {
    const prefixMap: Record<string, string> = {
      SFZ: '64', HKZ: 'NX', JHZ: '宁结', JDZ: '6401',
      SBK: 'NXSB', YLZ: 'NXYB', BDCZH: '宁(2024)', YWZ: '916401',
      BYZ: '10749', JSZG: '202464',
    };
    const prefix = prefixMap[certCode] ?? 'NX';
    const timestamp = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${rand}`;
  }

  private generateMockCertFields(certCode: string, name: string, idCardNo: string): Record<string, unknown> {
    const base = { name, idCardNo };
    const now = new Date();
    const issueDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
    const expireDate = new Date(now.getFullYear() + 8, now.getMonth(), 1);

    switch (certCode) {
      case 'SFZ':
        return {
          ...base,
          gender: Math.random() > 0.5 ? '男' : '女',
          ethnicity: '汉族',
          birthDate: idCardNo.slice(6, 14),
          address: `宁夏银川市兴庆区解放西街${100 + Math.floor(Math.random() * 200)}号`,
          issueAuthority: '银川市公安局兴庆区分局',
          photo: `https://mock-photo.nx.gov.cn/${idCardNo}.jpg`,
        };
      case 'SBK':
        return {
          ...base,
          cardNo: `SB${this.generateRandomCertNo('SBK')}`,
          bankCardNo: `622202${Math.floor(Math.random() * 1e12).toString().padStart(12, '0')}`,
          socialSecurityType: '城镇职工',
          issueDate: issueDate.toISOString().slice(0, 10),
        };
      case 'JDZ':
        return {
          ...base,
          licenseNo: idCardNo,
          licenseType: ['C1', 'C2', 'B1', 'B2', 'A1', 'A2'][Math.floor(Math.random() * 6)],
          firstIssueDate: issueDate.toISOString().slice(0, 10),
          validFrom: issueDate.toISOString().slice(0, 10),
          validTo: expireDate.toISOString().slice(0, 10),
          issueAuthority: '宁夏回族自治区公安厅交通管理局',
          photo: `https://mock-photo.nx.gov.cn/${idCardNo}_driver.jpg`,
        };
      case 'BDCZH':
        return {
          obligee: name,
          obligeeIdCard: idCardNo,
          certificateNo: this.generateRandomCertNo('BDCZH'),
          propertyType: '国有建设用地使用权/房屋所有权',
          propertyNature: '出让/市场化商品房',
          location: `宁夏银川市金凤区正源北街${100 + Math.floor(Math.random() * 200)}号XX小区${1 + Math.floor(Math.random() * 20)}号楼${1 + Math.floor(Math.random() * 30)}层${1 + Math.floor(Math.random() * 4)}0${1 + Math.floor(Math.random() * 3)}室`,
          area: (60 + Math.random() * 150).toFixed(2),
          issueDate: issueDate.toISOString().slice(0, 10),
          issueAuthority: '银川市自然资源局不动产登记中心',
        };
      case 'YWZ':
        return {
          enterpriseName: `宁夏${['恒兴', '金源', '通达', '华信', '盛世', '宏远'][Math.floor(Math.random() * 6)]}有限公司`,
          unifiedSocialCreditCode: `91640100MA${this.generateRandomCertNo('YWZ').slice(-12)}`,
          legalRepresentative: name,
          legalRepIdCard: idCardNo,
          registeredCapital: `${10 + Math.floor(Math.random() * 990)}万元`,
          establishDate: issueDate.toISOString().slice(0, 10),
          businessScope: '一般项目：技术服务、技术开发、技术咨询；信息咨询服务；企业管理咨询。',
          address: `宁夏银川市兴庆区${['科技园区', '创业大厦', '国贸中心', '金融中心'][Math.floor(Math.random() * 4)]}A座${10 + Math.floor(Math.random() * 20)}层`,
          issueAuthority: '银川市市场监督管理局',
        };
      case 'BYZ':
        return {
          ...base,
          schoolName: ['宁夏大学', '北方民族大学', '宁夏医科大学', '宁夏师范学院', '银川科技学院'][Math.floor(Math.random() * 5)],
          major: ['计算机科学与技术', '软件工程', '工商管理', '金融学', '临床医学', '土木工程'][Math.floor(Math.random() * 6)],
          educationLevel: ['本科', '硕士研究生', '博士研究生', '专科'][Math.floor(Math.random() * 4)],
          graduationDate: new Date(now.getFullYear() - Math.floor(Math.random() * 10 + 1), 5, 20).toISOString().slice(0, 10),
          certificateNo: this.generateRandomCertNo('BYZ'),
          principalName: ['李建国', '王建华', '张瑞敏', '刘志强', '陈国强'][Math.floor(Math.random() * 5)],
        };
      case 'JHZ':
        return {
          husbandName: ['张伟', '王磊', '李军', '刘洋', '陈强'][Math.floor(Math.random() * 5)],
          husbandIdCardNo: this.generateRandomIdCard(),
          wifeName: name,
          wifeIdCardNo: idCardNo,
          marriageDate: issueDate.toISOString().slice(0, 10),
          issueAuthority: '银川市兴庆区民政局婚姻登记处',
        };
      default:
        return {
          ...base,
          certificateNo: this.generateRandomCertNo(certCode),
          issueDate: issueDate.toISOString().slice(0, 10),
          issueAuthority: this.getMockDeptInfo(this.getMockDeptCode(certCode)).fullName,
        };
    }
  }

  async pullUserCerts(userId: string, idCardNo: string, name: string, certCodes: string[]): Promise<DeptCertRecord[]> {
    const results: DeptCertRecord[] = [];

    for (const certCode of certCodes) {
      const deptCode = this.getMockDeptCode(certCode);
      const config = this.gatewayConfigs.get(deptCode);

      if (this.useMock) {
        const deptInfo = this.getMockDeptInfo(deptCode);
        const mockRecord: DeptCertRecord = {
          certCode,
          certNo: this.generateRandomCertNo(certCode),
          userId,
          idCardNo,
          name,
          fields: this.generateMockCertFields(certCode, name, idCardNo),
          issueDept: deptInfo.fullName,
          issueDeptCode: deptInfo.code,
          issueDate: new Date(Date.now() - 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10),
          expireDate: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 8).toISOString().slice(0, 10),
          status: 'valid',
          sourceId: `SRC-${deptCode}-${certCode}-${Date.now()}-${Math.random().toString(36).slice(-6)}`,
        };
        results.push(mockRecord);
        this.logger.log(`[MOCK] 从${deptInfo.name}拉取${certCode}证照成功`);
        continue;
      }

      if (!config || !config.enabled) {
        this.logger.warn(`网关未配置或未启用: ${deptCode}, 跳过证照: ${certCode}`);
        continue;
      }

      try {
        const record = await this.callGatewayPullCert(config, certCode, idCardNo, name);
        if (record) {
          record.userId = userId;
          results.push(record);
        }
      } catch (error) {
        this.logger.error(`从${config.name}拉取${certCode}失败: ${error.message}`);
      }
    }

    return results;
  }

  private async callGatewayPullCert(
    config: DeptGatewayConfig,
    certCode: string,
    idCardNo: string,
    name: string,
  ): Promise<DeptCertRecord | null> {
    const url = `${config.apiBaseUrl}/cert/pull`;
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout,
      headers: {
        'X-API-Key': config.apiKey,
        'X-Gateway-Code': config.code,
        'Content-Type': 'application/json',
      },
    };
    const payload = { certCode, idCardNo, name, requestId: `REQ-${Date.now()}-${Math.random().toString(36).slice(-8)}` };

    try {
      const response = await firstValueFrom(this.httpService.post(url, payload, requestConfig));
      const data = response.data as { success: boolean; data?: DeptCertRecord; message?: string };
      if (data.success && data.data) {
        return data.data;
      }
      this.logger.warn(`网关${config.code}返回失败: ${data.message}`);
      return null;
    } catch (error) {
      throw new Error(`调用${config.name}网关失败: ${error.message}`);
    }
  }

  async verifyCert(
    certCode: string,
    certNo: string,
    verifyData: Record<string, string>,
  ): Promise<DeptVerifyResult> {
    const deptCode = this.getMockDeptCode(certCode);
    const config = this.gatewayConfigs.get(deptCode);
    const deptInfo = this.getMockDeptInfo(deptCode);

    if (this.useMock) {
      const verifyFields = Object.keys(verifyData);
      const passed = Math.random() > 0.1;
      const matchRate = passed ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4;
      const splitIndex = Math.floor(verifyFields.length * matchRate);
      const matchedFields = verifyFields.slice(0, splitIndex);
      const unmatchedFields = verifyFields.slice(splitIndex);

      return {
        passed,
        certCode,
        certNo,
        matchedFields,
        unmatchedFields,
        certStatus: 'valid',
        verifiedAt: new Date().toISOString(),
        gatewayCode: deptInfo.code,
        gatewayName: deptInfo.fullName,
        rawResponse: {
          requestId: `MOCK-VERIFY-${Date.now()}`,
          timestamp: Date.now(),
          matchRate: matchRate.toFixed(4),
          gateway: deptInfo.code,
          remarks: passed ? '校验通过' : '部分字段不匹配',
        },
      };
    }

    if (!config || !config.enabled) {
      throw new Error(`委办局网关不可用: ${deptCode}`);
    }

    return this.callGatewayVerifyCert(config, certCode, certNo, verifyData);
  }

  private async callGatewayVerifyCert(
    config: DeptGatewayConfig,
    certCode: string,
    certNo: string,
    verifyData: Record<string, string>,
  ): Promise<DeptVerifyResult> {
    const url = `${config.apiBaseUrl}/cert/verify`;
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout,
      headers: {
        'X-API-Key': config.apiKey,
        'X-Gateway-Code': config.code,
        'Content-Type': 'application/json',
      },
    };
    const payload = {
      certCode,
      certNo,
      verifyData,
      requestId: `REQ-V-${Date.now()}-${Math.random().toString(36).slice(-8)}`,
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, payload, requestConfig));
      const data = response.data as { success: boolean; data?: DeptVerifyResult; message?: string };
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.message || '验真失败');
    } catch (error) {
      throw new Error(`调用${config.name}网关验真失败: ${error.message}`);
    }
  }

  getSupportedDeptCodes(): string[] {
    return Array.from(this.gatewayConfigs.keys());
  }

  getAllDeptCodes(): string[] {
    return [...ALL_DEPT_CODES];
  }

  getGatewayConfig(deptCode: string): DeptGatewayConfig | null {
    return this.gatewayConfigs.get(deptCode) ?? null;
  }

  getDeptSupportedCerts(deptCode: string): string[] {
    const config = this.gatewayConfigs.get(deptCode);
    return config?.supportedCertCodes ?? [];
  }
}
