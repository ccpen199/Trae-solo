import type { CaseStudy } from '../../shared/types';

export const cases: CaseStudy[] = [
  {
    id: 'case-001',
    name: '李墨涵',
    babyInfo: {
      gender: 'male',
      birthDate: '2024-03-15 09:30'
    },
    inputSummary: '父母希望名字有文化底蕴，体现书香门第的家风，偏好古典风格，五行缺水需补益。',
    baziSummary: '八字日主甲木，生于春季，木旺，水为印星，需水来滋养木气，喜用神为水。',
    alternatives: ['李墨然', '李涵清', '李墨轩', '李书涵'],
    finalName: '李墨涵',
    explanation: '墨者，笔墨丹青，含文韬武略之气，五行属水；涵者，包容涵养，有海纳百川之度，五行亦属水。二字并用，既补益八字喜用神，又寓文采斐然、气度恢弘之意。音律上李(3)墨(4)涵(2)，抑扬顿挫，朗朗上口。',
    masterId: 'master-001',
    masterName: '李明远',
    isAuthorized: true,
    likes: 328,
    createdAt: '2024-04-10'
  },
  {
    id: 'case-002',
    name: '王思齐',
    babyInfo: {
      gender: 'male',
      birthDate: '2023-11-08 14:20'
    },
    inputSummary: '家族重视品德教育，希望名字出自经典，寓意积极向上，有进取精神。',
    baziSummary: '八字日主庚金，生于冬季，金寒水冷，需火来暖局，土来生金，喜用神为火土。',
    alternatives: ['王见贤', '王修齐', '王德明', '王思义'],
    finalName: '王思齐',
    explanation: '取自《论语》"见贤思齐焉"，寓意见贤思齐、不断进德修业。思字五行属金，齐字五行属金，与日主庚金同气相求。名字既有深厚的文化渊源，又寄托了父母对孩子修身立德的殷切期望。',
    masterId: 'master-002',
    masterName: '王守正',
    isAuthorized: true,
    likes: 512,
    createdAt: '2023-12-05'
  },
  {
    id: 'case-003',
    name: '陈婉清',
    babyInfo: {
      gender: 'female',
      birthDate: '2024-06-22 16:45'
    },
    inputSummary: '女宝宝，父母希望名字温婉清雅，有古典诗意，体现女性柔美气质。',
    baziSummary: '八字日主丁火，生于夏季，火旺，需水来调候，金来泄秀，喜用神为水金。',
    alternatives: ['陈清婉', '陈婉如', '陈清扬', '陈婉宁'],
    finalName: '陈婉清',
    explanation: '婉字取自《诗经》"有美一人，清扬婉兮"，意为温婉美好；清字取自"秋水共长天一色"，意为清澈纯净。婉属土、清属水，土生金、水调候，均为八字所需。名字整体温婉清雅，音韵和谐，颇具古典韵味。',
    masterId: 'master-003',
    masterName: '张清雅',
    isAuthorized: true,
    likes: 456,
    createdAt: '2024-07-18'
  },
  {
    id: 'case-004',
    name: '张瑾瑜',
    babyInfo: {
      gender: 'female',
      birthDate: '2023-09-12 10:00'
    },
    inputSummary: '希望女儿像美玉一样温润美好，有高贵的品格，名字要有文化内涵。',
    baziSummary: '八字日主乙木，生于秋季，金旺木弱，需水来泄金生木，喜用神为水木。',
    alternatives: ['张怀瑾', '张握瑜', '张瑾瑶', '张瑜琳'],
    finalName: '张瑾瑜',
    explanation: '瑾瑜二字均为美玉之意，出自屈原《九章》"怀瑾握瑜兮"，比喻拥有高洁美好的品德。瑾属火、瑜属金，虽非直接喜用，但火克金为官、金克木为财，形成财官相生之格局，寓意才德兼备、福禄双全。',
    masterId: 'master-001',
    masterName: '李明远',
    isAuthorized: true,
    likes: 389,
    createdAt: '2023-10-22'
  },
  {
    id: 'case-005',
    name: '刘轩宇',
    babyInfo: {
      gender: 'male',
      birthDate: '2024-01-30 08:15'
    },
    inputSummary: '男宝宝，希望名字大气有气势，胸怀宽广，志存高远，事业有成。',
    baziSummary: '八字日主戊土，生于冬季，土寒，需火来生土暖局，喜用神为火土。',
    alternatives: ['刘宇轩', '刘星辰', '刘浩然', '刘天翊'],
    finalName: '刘轩宇',
    explanation: '轩意为高敞、气宇轩昂；宇意为宇宙、风度仪表。二字合用寓意气宇不凡、胸怀宇宙、前程远大。轩属土、宇属土，均为八字喜用神，有助身旺之力。名字整体大气磅礴，读来掷地有声，适合男孩。',
    masterId: 'master-004',
    masterName: '陈怀远',
    isAuthorized: true,
    likes: 298,
    createdAt: '2024-02-28'
  },
  {
    id: 'case-006',
    name: '周书瑶',
    babyInfo: {
      gender: 'female',
      birthDate: '2024-05-05 20:30'
    },
    inputSummary: '书香门第，希望传承家风，女儿知书达理，才华横溢，气质优雅。',
    baziSummary: '八字日主辛金，生于夏季，火炎土燥，需水来调候泄秀，喜用神为水。',
    alternatives: ['周书涵', '周诗瑶', '周书雅', '周文瑶'],
    finalName: '周书瑶',
    explanation: '书代表学识、文化，寓意腹有诗书气自华；瑶为美玉，寓意温润美好。书属金，与日主同气；瑶属火，为金之官星，火水既济。名字既有书香门第的文化传承，又有美玉般的温润气质，适合聪慧优雅的女孩。',
    masterId: 'master-003',
    masterName: '张清雅',
    isAuthorized: true,
    likes: 421,
    createdAt: '2024-06-12'
  },
  {
    id: 'case-007',
    name: '吴景明',
    babyInfo: {
      gender: 'male',
      birthDate: '2023-07-18 07:45'
    },
    inputSummary: '父母希望儿子前途光明，事业有成，为人正直光明磊落。',
    baziSummary: '八字日主壬水，生于夏季，火旺水弱，需金来生水助身，喜用神为金水。',
    alternatives: ['吴明远', '吴景行', '吴昭明', '吴明朗'],
    finalName: '吴景明',
    explanation: '景意为光彩、景致，也有景仰之意；明意为光明、明智。取自"春和景明"与"明察秋毫"，寓意前程似锦、光明磊落、智慧明达。景属木、明属水，水生木为食神泄秀，才华得以彰显。名字寓意美好，读音朗朗上口。',
    masterId: 'master-002',
    masterName: '王守正',
    isAuthorized: true,
    likes: 367,
    createdAt: '2023-08-25'
  }
];

export default cases;
