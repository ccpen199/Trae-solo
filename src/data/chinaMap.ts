export interface ProvinceData {
  code: string;
  name: string;
  path: string;
  labelX?: number;
  labelY?: number;
}

export const chinaProvinces: ProvinceData[] = [
  { code: 'BJ', name: '北京', path: 'M580,220 L600,215 L605,230 L595,240 L580,235 Z', labelX: 592, labelY: 230 },
  { code: 'TJ', name: '天津', path: 'M605,230 L620,225 L625,240 L615,250 L605,245 Z', labelX: 615, labelY: 240 },
  { code: 'HE', name: '河北', path: 'M550,180 L620,175 L630,230 L610,260 L580,265 L545,250 L540,210 Z', labelX: 580, labelY: 220 },
  { code: 'SX', name: '山西', path: 'M490,200 L545,195 L550,250 L520,270 L485,265 L475,230 Z', labelX: 515, labelY: 235 },
  { code: 'NM', name: '内蒙古', path: 'M300,80 L550,70 L560,195 L545,195 L490,200 L470,180 L420,170 L380,160 L340,150 L310,140 L280,120 L270,100 Z', labelX: 420, labelY: 130 },
  { code: 'LN', name: '辽宁', path: 'M580,140 L650,130 L660,170 L640,190 L600,190 L585,175 Z', labelX: 620, labelY: 160 },
  { code: 'JL', name: '吉林', path: 'M590,90 L670,80 L680,125 L650,135 L600,140 Z', labelX: 635, labelY: 110 },
  { code: 'HL', name: '黑龙江', path: 'M550,40 L690,30 L700,75 L670,85 L590,90 L560,70 Z', labelX: 625, labelY: 55 },
  { code: 'SH', name: '上海', path: 'M640,370 L660,365 L665,380 L655,390 L640,385 Z', labelX: 652, labelY: 378 },
  { code: 'JS', name: '江苏', path: 'M590,340 L640,335 L650,370 L640,390 L600,395 L580,375 Z', labelX: 615, labelY: 360 },
  { code: 'ZJ', name: '浙江', path: 'M600,395 L640,390 L650,420 L635,445 L600,440 L590,415 Z', labelX: 620, labelY: 415 },
  { code: 'AH', name: '安徽', path: 'M550,360 L590,355 L600,395 L590,415 L555,420 L540,390 Z', labelX: 570, labelY: 385 },
  { code: 'FJ', name: '福建', path: 'M600,440 L635,435 L645,475 L620,495 L595,485 L590,460 Z', labelX: 618, labelY: 460 },
  { code: 'JX', name: '江西', path: 'M530,420 L590,415 L595,460 L580,490 L540,495 L520,465 Z', labelX: 558, labelY: 450 },
  { code: 'SD', name: '山东', path: 'M550,280 L610,270 L620,310 L600,335 L560,340 L535,315 Z', labelX: 575, labelY: 305 },
  { code: 'HA', name: '河南', path: 'M470,320 L535,315 L545,360 L530,380 L485,380 L465,355 Z', labelX: 505, labelY: 345 },
  { code: 'HB', name: '湖北', path: 'M450,380 L520,375 L530,420 L510,440 L465,440 L440,410 Z', labelX: 485, labelY: 405 },
  { code: 'HN', name: '湖南', path: 'M465,440 L510,435 L520,480 L500,510 L465,510 L450,480 Z', labelX: 485, labelY: 470 },
  { code: 'GD', name: '广东', path: 'M480,510 L540,505 L550,540 L530,560 L490,560 L475,535 Z', labelX: 515, labelY: 535 },
  { code: 'GX', name: '广西', path: 'M400,500 L465,495 L480,510 L475,535 L450,555 L405,550 L390,525 Z', labelX: 435, labelY: 525 },
  { code: 'HI', name: '海南', path: 'M440,580 L475,575 L480,595 L460,610 L440,605 Z', labelX: 460, labelY: 592 },
  { code: 'CQ', name: '重庆', path: 'M370,380 L405,375 L415,395 L400,415 L375,410 L365,395 Z', labelX: 390, labelY: 395 },
  { code: 'SC', name: '四川', path: 'M280,340 L370,330 L380,400 L360,430 L310,440 L260,420 L250,380 Z', labelX: 325, labelY: 380 },
  { code: 'GZ', name: '贵州', path: 'M400,440 L450,435 L460,480 L440,500 L405,500 L390,470 Z', labelX: 425, labelY: 465 },
  { code: 'YN', name: '云南', path: 'M290,470 L390,460 L405,500 L385,540 L340,560 L290,540 L270,505 Z', labelX: 340, labelY: 510 },
  { code: 'XZ', name: '西藏', path: 'M100,350 L250,335 L260,430 L230,460 L150,465 L90,440 Z', labelX: 175, labelY: 400 },
  { code: 'SN', name: '陕西', path: 'M400,280 L465,275 L475,320 L465,355 L430,365 L405,350 L395,310 Z', labelX: 435, labelY: 315 },
  { code: 'GS', name: '甘肃', path: 'M260,240 L395,225 L405,280 L390,310 L360,315 L310,320 L280,300 L255,270 Z', labelX: 330, labelY: 275 },
  { code: 'QH', name: '青海', path: 'M160,280 L260,265 L275,330 L250,350 L180,355 L150,330 Z', labelX: 215, labelY: 310 },
  { code: 'NX', name: '宁夏', path: 'M420,260 L445,255 L450,280 L440,295 L420,290 Z', labelX: 435, labelY: 275 },
  { code: 'XJ', name: '新疆', path: 'M30,130 L190,115 L210,220 L180,250 L100,260 L40,235 L15,190 Z', labelX: 110, labelY: 180 },
];
