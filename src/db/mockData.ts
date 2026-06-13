import { db, generateId } from './index';
import type {
  Book,
  ReadingSession,
  Note,
  NoteParagraph,
  PageAnchor,
  Entity,
  EntityRelation,
  Tag,
} from '@/types';
import dayjs from 'dayjs';

const TAGS: Omit<Tag, 'id' | 'createdAt'>[] = [
  { name: '计算机科学', color: '#3B5998' },
  { name: '心理学', color: '#4A8B7A' },
  { name: '文学小说', color: '#B8860B' },
  { name: '思维模型', color: '#C41E3A' },
  { name: '编程', color: '#5B6ABF' },
];

const BOOKS: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'tagIds' | 'progress'>[] = [
  {
    title: '深入理解计算机系统',
    subtitle: '从程序员的角度',
    authors: ['Randal E. Bryant', "David R. O'Hallaron"],
    publisher: '机械工业出版社',
    publishDate: '2016-11',
    isbn13: '9787111544937',
    category: '计算机科学',
    totalPages: 563,
    currentPage: 237,
    status: 'reading',
    startDate: dayjs().subtract(45, 'day').toISOString(),
    summary: '从程序员视角详细阐述计算机系统的底层原理',
  },
  {
    title: '思考，快与慢',
    authors: ['丹尼尔·卡尼曼'],
    publisher: '中信出版社',
    publishDate: '2012-07',
    isbn13: '9787508633558',
    category: '心理学',
    totalPages: 436,
    currentPage: 297,
    status: 'reading',
    startDate: dayjs().subtract(30, 'day').toISOString(),
    summary: '诺奖得主关于人类思维两个系统的开创性研究',
  },
  {
    title: '百年孤独',
    authors: ['加西亚·马尔克斯'],
    publisher: '南海出版公司',
    publishDate: '2011-06',
    isbn13: '9787544253994',
    category: '文学小说',
    totalPages: 360,
    currentPage: 360,
    status: 'completed',
    startDate: dayjs().subtract(60, 'day').toISOString(),
    endDate: dayjs().subtract(20, 'day').toISOString(),
    summary: '魔幻现实主义代表作，布恩迪亚家族七代人的传奇',
  },
];

const NOTE_TEMPLATES = [
  {
    bookIdx: 0,
    title: '缓存局部性原理',
    content: '局部性原理是计算机系统设计中最基本的概念之一。程序在执行时往往呈现出空间局部性和时间局部性两种特征。空间局部性指一旦程序访问了某个存储位置，其附近的位置也很可能被访问；时间局部性指一旦程序访问了某个存储位置，在不久的将来很可能再次访问该位置。这一原理直接影响了缓存层次结构的设计。',
    page: 45,
    sourceType: 'ocr' as const,
  },
  {
    bookIdx: 0,
    title: '程序的数据表示',
    content: '在计算机系统中，所有的信息——包括整数、浮点数、字符串——都是由一串比特来表示的。区分不同数据对象的唯一方法是我们看到这些数据对象的上下文。在不同的上下文中，同样的比特序列可以代表完全不同的东西。理解这一点对于编写正确的程序至关重要。',
    page: 28,
    sourceType: 'ocr' as const,
  },
  {
    bookIdx: 0,
    title: '存储器层次结构',
    content: '存储器层次结构的核心思想是：每层存储设备都作为下一层存储设备的缓存。L1缓存是L2的缓存，L2是L3的缓存，L3是主存的缓存，主存是磁盘的缓存。这种层次结构之所以有效，正是因为程序的局部性特征。',
    page: 378,
    sourceType: 'manual' as const,
  },
  {
    bookIdx: 1,
    title: '系统1与系统2',
    content: '卡尼曼将人的思维分为两个系统：系统1是快速、自动、直觉的思维方式，几乎不需要耗费精力；系统2是缓慢、刻意、理性的思维方式，需要集中注意力。系统1不断为系统2提供印象、直觉和感觉，系统2则负责对这些建议进行审查和执行。',
    page: 20,
    sourceType: 'ocr' as const,
  },
  {
    bookIdx: 1,
    title: '锚定效应',
    content: '锚定效应是一种普遍存在的认知偏差：人们在做判断时，会过度依赖最先获得的信息（即"锚点"）。即使这个锚点与判断完全无关，它也会显著地影响最终的结果。在谈判、定价、评估等各种场景中，锚定效应都在不知不觉中发挥作用。',
    page: 119,
    sourceType: 'ocr' as const,
  },
  {
    bookIdx: 1,
    title: '可得性启发法',
    content: '人们倾向于根据从记忆中提取相关实例的容易程度来评估事件的发生频率或概率。如果某个事件很容易被回忆起来（比如最近发生的事、特别生动的事件），人们就会高估其发生的概率。这就是可得性启发法的核心逻辑。',
    page: 156,
    sourceType: 'manual' as const,
  },
  {
    bookIdx: 2,
    title: '马孔多的建立',
    content: '何塞·阿尔卡蒂奥·布恩迪亚带领一群年轻人翻山越岭，在一条大河边建立了马孔多。这个村庄最初只有二十户人家，河水清澈见底，河床里的石头光滑洁白，像史前巨蛋。那是一个尚未被世界发现的地方，连死神都还没有到达。',
    page: 1,
    sourceType: 'ocr' as const,
  },
  {
    bookIdx: 2,
    title: '布恩迪亚上校的战争',
    content: '奥雷里亚诺·布恩迪亚上校发动了三十二场武装起义，三十二场都失败了。他有一次被叛军判处死刑，又一次被自己人试图枪决。他在十四次暗杀中幸存下来，七十三次伏击和一次枪决也未能要了他的命。',
    page: 148,
    sourceType: 'ocr' as const,
  },
  {
    bookIdx: 2,
    title: '孤独的主题',
    content: '布恩迪亚家族的每一个成员都深陷于各自的孤独之中。孤独是这个家族最深刻的印记，它像遗传疾病一样代代相传。无论是战争的英雄还是安静的工匠，他们都无法逃脱孤独的宿命——因为他们在本质上都缺乏爱的能力。',
    page: 320,
    sourceType: 'manual' as const,
  },
];

const ENTITIES_DATA: { name: string; type: 'person' | 'concept' | 'event'; description: string }[] = [
  { name: '冯·诺依曼', type: 'person', description: '计算机科学先驱，冯·诺依曼体系结构提出者' },
  { name: '丹尼尔·卡尼曼', type: 'person', description: '2002年诺贝尔经济学奖获得者，行为经济学奠基人' },
  { name: '加西亚·马尔克斯', type: 'person', description: '哥伦比亚作家，1982年诺贝尔文学奖获得者' },
  { name: '布恩迪亚上校', type: 'person', description: '《百年孤独》核心人物，发动三十二场起义' },
  { name: '图灵', type: 'person', description: '英国数学家，计算机科学之父' },
  { name: '缓存局部性', type: 'concept', description: '程序倾向于访问近期访问过的数据及其邻近数据的特性' },
  { name: '系统1与系统2', type: 'concept', description: '卡尼曼提出的双系统思维理论' },
  { name: '锚定效应', type: 'concept', description: '过度依赖首先获得信息的认知偏差' },
  { name: '魔幻现实主义', type: 'concept', description: '将魔幻元素融入现实叙事的文学流派' },
  { name: '可得性启发法', type: 'concept', description: '根据回忆容易程度评估概率的认知偏差' },
  { name: '程序局部性原理', type: 'concept', description: '计算机程序的空间和时间局部性特征' },
  { name: '马孔多小镇建立', type: 'event', description: '布恩迪亚家族建立马孔多村庄' },
  { name: '2002诺贝尔经济学奖', type: 'event', description: '卡尼曼因前景理论获诺贝尔经济学奖' },
  { name: '第三次科技革命', type: 'event', description: '以计算机和信息技术为核心的科技革命' },
];

const RELATIONS_DATA: { source: string; target: string; relation: string }[] = [
  { source: '冯·诺依曼', target: '程序局部性原理', relation: '提出' },
  { source: '冯·诺依曼', target: '第三次科技革命', relation: '推动' },
  { source: '缓存局部性', target: '程序局部性原理', relation: '属于' },
  { source: '图灵', target: '第三次科技革命', relation: '推动' },
  { source: '图灵', target: '冯·诺依曼', relation: '同时代' },
  { source: '丹尼尔·卡尼曼', target: '系统1与系统2', relation: '提出' },
  { source: '丹尼尔·卡尼曼', target: '锚定效应', relation: '研究' },
  { source: '丹尼尔·卡尼曼', target: '2002诺贝尔经济学奖', relation: '获得' },
  { source: '丹尼尔·卡尼曼', target: '可得性启发法', relation: '研究' },
  { source: '系统1与系统2', target: '锚定效应', relation: '导致' },
  { source: '系统1与系统2', target: '可得性启发法', relation: '相关' },
  { source: '锚定效应', target: '可得性启发法', relation: '类似' },
  { source: '加西亚·马尔克斯', target: '魔幻现实主义', relation: '代表' },
  { source: '加西亚·马尔克斯', target: '马孔多小镇建立', relation: '创作' },
  { source: '布恩迪亚上校', target: '马孔多小镇建立', relation: '经历' },
  { source: '布恩迪亚上校', target: '魔幻现实主义', relation: '体现' },
  { source: '缓存局部性', target: '锚定效应', relation: '跨域关联' },
  { source: '冯·诺依曼', target: '丹尼尔·卡尼曼', relation: '跨学科' },
  { source: '程序局部性原理', target: '系统1与系统2', relation: '跨域类比' },
  { source: '第三次科技革命', target: '2002诺贝尔经济学奖', relation: '时代背景' },
  { source: '图灵', target: '程序局部性原理', relation: '奠基' },
];

export async function seedMockData(): Promise<void> {
  const bookCount = await db.books.count();
  if (bookCount > 0) return;

  const tagIds: string[] = [];
  for (const t of TAGS) {
    const id = generateId();
    await db.tags.add({ ...t, id, createdAt: new Date().toISOString() });
    tagIds.push(id);
  }

  const bookIds: string[] = [];
  for (let i = 0; i < BOOKS.length; i++) {
    const b = BOOKS[i];
    const id = generateId();
    const progress = Math.round((b.currentPage / b.totalPages) * 100);
    const tagIdList: string[] = [];
    if (i === 0) tagIdList.push(tagIds[0], tagIds[4]);
    if (i === 1) tagIdList.push(tagIds[1], tagIds[3]);
    if (i === 2) tagIdList.push(tagIds[2]);

    await db.books.add({
      ...b,
      id,
      progress,
      tagIds: tagIdList,
      createdAt: dayjs().subtract(60 - i * 15, 'day').toISOString(),
      updatedAt: dayjs().subtract(1, 'day').toISOString(),
    });
    bookIds.push(id);
  }

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const sessionsPerDay = Math.floor(Math.random() * 3) + 1;
    for (let s = 0; s < sessionsPerDay; s++) {
      const bookIdx = Math.floor(Math.random() * 3);
      const duration = (Math.floor(Math.random() * 5) + 1) * 15 * 60;
      const startHour = 7 + Math.floor(Math.random() * 14);
      const startTime = dayjs()
        .subtract(dayOffset, 'day')
        .hour(startHour)
        .minute(Math.floor(Math.random() * 60))
        .toISOString();

      await db.readingSessions.add({
        id: generateId(),
        bookId: bookIds[bookIdx],
        mode: ['manual', 'dwell', 'voice'][Math.floor(Math.random() * 3)] as any,
        durationSeconds: duration,
        startTime,
        endTime: dayjs(startTime).add(duration, 'second').toISOString(),
        startPage: Math.floor(Math.random() * 200) + 1,
        endPage: Math.floor(Math.random() * 200) + 200,
      });
    }
  }

  const noteIds: string[] = [];
  for (const nt of NOTE_TEMPLATES) {
    const noteId = generateId();
    await db.notes.add({
      id: noteId,
      bookId: bookIds[nt.bookIdx],
      title: nt.title,
      content: nt.content,
      sourceType: nt.sourceType,
      createdAt: dayjs().subtract(Math.floor(Math.random() * 25) + 1, 'day').toISOString(),
      updatedAt: dayjs().subtract(Math.floor(Math.random() * 5), 'day').toISOString(),
    });
    noteIds.push(noteId);

    const paragraphs = nt.content.split(/(?<=[。！？；])/g).filter(p => p.trim());
    for (let pi = 0; pi < paragraphs.length; pi++) {
      await db.noteParagraphs.add({
        id: generateId(),
        noteId,
        orderIndex: pi,
        text: paragraphs[pi].trim(),
      });
    }

    await db.pageAnchors.add({
      id: generateId(),
      noteId,
      pageNumber: nt.page,
      confidence: 0.85 + Math.random() * 0.1,
    });
  }

  const entityIdMap = new Map<string, string>();
  for (const e of ENTITIES_DATA) {
    const eid = generateId();
    const relatedNotes = noteIds.filter(() => Math.random() > 0.7).slice(0, 3);
    await db.entities.add({
      id: eid,
      name: e.name,
      type: e.type,
      description: e.description,
      noteIds: relatedNotes,
      createdAt: new Date().toISOString(),
    });
    entityIdMap.set(e.name, eid);
  }

  for (const r of RELATIONS_DATA) {
    const sourceId = entityIdMap.get(r.source);
    const targetId = entityIdMap.get(r.target);
    if (!sourceId || !targetId) continue;
    const relatedNote = noteIds[Math.floor(Math.random() * noteIds.length)];
    await db.entityRelations.add({
      id: generateId(),
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      relationType: r.relation,
      noteId: relatedNote,
    });
  }
}

export async function initMockIfEmpty(): Promise<void> {
  const count = await db.books.count();
  if (count === 0) {
    await seedMockData();
  }
}
