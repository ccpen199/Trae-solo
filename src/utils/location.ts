export interface Location {
  lat: number;
  lng: number;
  address: string;
  district: string;
  street?: string;
}

export interface District {
  code: string;
  name: string;
  center: [number, number];
}

export const huizhouDistricts: District[] = [
  { code: 'hcq', name: '惠城区', center: [23.0833, 114.4167] },
  { code: 'hyq', name: '惠阳区', center: [22.7833, 114.4667] },
  { code: 'hdzx', name: '惠东县', center: [22.6833, 114.8333] },
  { code: 'blx', name: '博罗县', center: [23.2833, 114.0167] },
  { code: 'lmx', name: '龙门县', center: [23.6333, 113.8667] },
  { code: 'zkq', name: '仲恺区', center: [23.0167, 114.3833] },
  { code: 'dyw', name: '大亚湾区', center: [22.7167, 114.5833] },
];

export function getDistrictName(code: string): string {
  const district = huizhouDistricts.find(d => d.code === code);
  return district ? district.name : code;
}

export function getRandomDistrict(): string {
  const index = Math.floor(Math.random() * huizhouDistricts.length);
  return huizhouDistricts[index].name;
}

export function generateMockLocation(address?: string): Location {
  const district = huizhouDistricts[Math.floor(Math.random() * huizhouDistricts.length)];
  const streets = ['环城西路', '南岸路', '仲恺大道', '白云五路', '罗浮大道', '中兴中路', '西林路'];
  const street = streets[Math.floor(Math.random() * streets.length)];

  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;

  return {
    lat: district.center[0] + latOffset,
    lng: district.center[1] + lngOffset,
    address: address || `惠州市${district.name}${street}${Math.floor(Math.random() * 1000)}号`,
    district: district.name,
    street,
  };
}
