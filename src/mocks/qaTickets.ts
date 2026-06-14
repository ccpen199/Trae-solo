import type { QATicket } from '@/types'

export const qaTickets: QATicket[] = [
  {
    id: 'QA-001',
    title: '西红柿叶片出现黄斑如何处理',
    description: '大棚种植的有机西红柿近一周内叶片陆续出现黄褐色斑点，边缘发黄，部分叶片干枯卷曲，不知是否为病害，请专家诊断并给出防治建议',
    images: [''],
    status: 'closed',
    category: '蔬菜',
    asker: '寿光绿源种植基地-李师傅',
    expert: '山东省农科院-张教授',
    answer: '根据描述和图片判断为番茄早疫病，建议：1.及时摘除病叶并销毁；2.喷施多抗霉素或百菌清进行防治；3.加强通风降低棚内湿度；4.避免大水漫灌，采用滴灌方式；5.合理密植保持通风透光',
    createDate: '2026-04-10',
    answerDate: '2026-04-11',
    rating: 5
  },
  {
    id: 'QA-002',
    title: '五常大米存储条件咨询',
    description: '今年新收的稻花香2号大米，大约5吨，请问最佳的储存条件和保质期是多长？需要什么样的仓储设施？',
    status: 'answered',
    category: '粮食',
    asker: '五常金禾米业-王经理',
    expert: '国家粮食储备研究院-刘研究员',
    answer: '稻花香2号大米的储存建议：1.储存温度控制在15℃以下，相对湿度65%以下；2.使用恒温恒湿仓库，避免阳光直射；3.真空包装可保存12-18个月，普通编织袋包装建议6个月内销售；4.定期检测水分含量不超过14.5%；5.注意防虫防鼠',
    createDate: '2026-05-20',
    answerDate: '2026-05-21',
    rating: 4
  },
  {
    id: 'QA-003',
    title: '苹果树坐果率低如何改善',
    description: '今年阿克苏果园的苹果树花期正常但坐果率明显偏低，去年同期的坐果率在60%左右，今年只有35%，请问可能是什么原因？应该如何改善？',
    images: [''],
    status: 'assigned',
    category: '水果',
    asker: '阿克苏红旗坡农场-马场长',
    expert: '新疆农业大学-陈教授',
    createDate: '2026-05-25'
  },
  {
    id: 'QA-004',
    title: '普洱茶发酵工艺疑问',
    description: '我们今年春茶渥堆发酵过程中发现堆温上不去，一直维持在40℃左右，正常应该能达到55℃以上，请问可能是什么原因？是否需要调整工艺参数？',
    status: 'pending',
    category: '茶叶',
    asker: '普洱古树茶庄园-赵师傅',
    createDate: '2026-05-28'
  }
]
