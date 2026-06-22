import type { IDCardInfo, FaceVerifyResult } from '@/types';

const MOCK_NAMES = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨帆', '黄磊', '周敏', '吴强', '徐丽'];
const MOCK_NATIONS = ['汉', '汉', '汉', '汉', '汉', '满', '回', '壮'];
const MOCK_ADDRESSES_PREFIX = [
  '北京市朝阳区建国路',
  '上海市浦东新区世纪大道',
  '广州市天河区天河路',
  '深圳市南山区科技园',
  '杭州市西湖区文三路',
];
const MOCK_AUTH = ['朝阳分局', '浦东分局', '天河分局', '南山分局', '西湖分局'];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, '0');
}

export function mockIDCardOCR(seed = Date.now()): IDCardInfo {
  const rng = (min: number, max: number) => Math.floor(Math.sin(seed / (min + 1)) * (max - min) + min) + min;
  void rng;
  const birthY = 1985 + Math.floor(Math.random() * 20);
  const birthM = 1 + Math.floor(Math.random() * 12);
  const birthD = 1 + Math.floor(Math.random() * 28);
  const idNo =
    '11010' +
    (1980 + Math.floor(Math.random() * 30)) +
    pad(birthM) +
    pad(birthD) +
    pad(Math.floor(Math.random() * 9999), 4);

  return {
    name: rand(MOCK_NAMES),
    gender: Math.random() > 0.5 ? '男' : '女',
    nation: rand(MOCK_NATIONS),
    birth: `${birthY}-${pad(birthM)}-${pad(birthD)}`,
    address: `${rand(MOCK_ADDRESSES_PREFIX)}${Math.floor(Math.random() * 999)}号${Math.floor(
      Math.random() * 20 + 1
    )}栋${Math.floor(Math.random() * 2000 + 1)}室`,
    idNo,
    issuingAuthority: rand(MOCK_AUTH),
    validPeriod: `2020.${pad(birthM)}.${pad(birthD)}-2040.${pad(birthM)}.${pad(birthD)}`,
  };
}

export function mockIDCardFrontBase64(name: string, idNo: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'>
    <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#4F9CF9'/><stop offset='100%' stop-color='#2563EB'/>
    </linearGradient></defs>
    <rect width='320' height='200' rx='10' fill='url(#g)'/>
    <rect x='16' y='16' width='288' height='168' rx='6' fill='#FEFEFE'/>
    <text x='30' y='50' font-family='sans-serif' font-size='14' fill='#333'>中华人民共和国</text>
    <text x='30' y='66' font-family='sans-serif' font-size='11' fill='#999'>RESIDENT ID CARD</text>
    <rect x='30' y='80' width='80' height='96' fill='#E2E8F0' rx='2'/>
    <text x='120' y='100' font-family='sans-serif' font-size='13' fill='#333' font-weight='bold'>${name}</text>
    <text x='120' y='120' font-family='sans-serif' font-size='11' fill='#666'>身份证号</text>
    <text x='120' y='138' font-family='monospace' font-size='12' fill='#0F172A' letter-spacing='1'>${idNo}</text>
    <text x='120' y='160' font-family='sans-serif' font-size='10' fill='#94A3B8'>※ 模拟OCR样本 ※</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function mockFaceVerify(action: 'blink' | 'shake' | 'noddle'): FaceVerifyResult {
  void action;
  const passed = Math.random() > 0.08;
  const score = passed ? 0.85 + Math.random() * 0.14 : Math.random() * 0.5;
  return {
    passed,
    score: Math.round(score * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

export function mockFaceSnapshotBase64(name: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
    <circle cx='120' cy='120' r='118' fill='#F0FDFA' stroke='#14B8A6' stroke-width='3'/>
    <circle cx='120' cy='100' r='46' fill='#FDE68A'/>
    <circle cx='104' cy='96' r='5' fill='#1F2937'/>
    <circle cx='136' cy='96' r='5' fill='#1F2937'/>
    <path d='M102 118 Q120 132 138 118' stroke='#1F2937' stroke-width='3' fill='none' stroke-linecap='round'/>
    <rect x='72' y='150' width='96' height='70' rx='18' fill='#0F766E'/>
    <text x='120' y='225' font-family='sans-serif' font-size='12' fill='#0F766E' text-anchor='middle' font-weight='bold'>${name}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
