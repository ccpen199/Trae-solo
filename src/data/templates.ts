import type { ResumeTemplate } from '../types';

const techTemplate: ResumeTemplate = {
  id: 'tech-frontend',
  name: '前端工程师模板',
  category: 'tech',
  description: '技术岗专用，突出项目指标与技术栈，适合前端开发工程师',
  theme: {
    primaryColor: '#1e3a5f',
    secondaryColor: '#c9a24a',
    fontFamily: 'LXGW WenKai',
    fontSize: 14
  },
  modules: [
    {
      id: 'basic',
      type: 'basic',
      visible: true,
      order: 0,
      fields: {
        name: '张明',
        title: '高级前端工程师',
        phone: '138-0000-0000',
        email: 'zhangming@example.com',
        location: '北京市海淀区',
        github: 'https://github.com/zhangming',
        website: 'https://zhangming.dev',
        avatar: ''
      }
    },
    {
      id: 'education',
      type: 'education',
      visible: true,
      order: 1,
      fields: {
        items: [
          {
            id: 'edu-1',
            school: '清华大学',
            major: '计算机科学与技术',
            degree: '硕士',
            startDate: '2020-09',
            endDate: '2023-06',
            gpa: '3.8/4.0',
            description: '主修方向：软件工程、前端系统设计'
          },
          {
            id: 'edu-2',
            school: '北京邮电大学',
            major: '软件工程',
            degree: '本科',
            startDate: '2016-09',
            endDate: '2020-06',
            gpa: '3.7/4.0',
            description: '连续三年获得一等奖学金'
          }
        ]
      }
    },
    {
      id: 'experience',
      type: 'experience',
      visible: true,
      order: 2,
      fields: {
        items: [
          {
            id: 'exp-1',
            company: '字节跳动',
            position: '高级前端工程师',
            startDate: '2023-07',
            endDate: '至今',
            responsibilities: [
              '负责抖音电商商家后台系统核心模块开发，日均PV超500万',
              '主导微前端架构升级，构建效率提升40%，首屏加载减少35%',
              '设计并实现组件库，覆盖20+业务线，周下载量1万+',
              '带领3人小组完成性能优化专项，LCP从3.2s降至1.5s'
            ]
          },
          {
            id: 'exp-2',
            company: '阿里巴巴',
            position: '前端工程师',
            startDate: '2021-06',
            endDate: '2023-06',
            responsibilities: [
              '参与淘宝搜索结果页重构，使用React 18 + TypeScript',
              '开发可视化搭建平台，降低运营页面开发成本60%',
              '推动单元测试覆盖率从45%提升至85%'
            ]
          }
        ]
      }
    },
    {
      id: 'project',
      type: 'project',
      visible: true,
      order: 3,
      fields: {
        items: [
          {
            id: 'proj-1',
            name: '电商商家运营平台',
            role: '技术负责人',
            startDate: '2023-09',
            endDate: '2024-03',
            techStack: ['React 18', 'TypeScript', 'Vite', 'Zustand', 'TailwindCSS'],
            link: '',
            metrics: [
              '日活跃商家数：30万+',
              '页面加载性能：LCP 1.2s',
              '用户满意度：4.8/5.0',
              'BUG率：0.15‰'
            ],
            description: '从零搭建商家运营后台，涵盖商品管理、订单处理、数据分析等核心模块。采用微前端架构，支持多业务线独立部署。'
          },
          {
            id: 'proj-2',
            name: '低代码可视化搭建平台',
            role: '核心开发',
            startDate: '2022-06',
            endDate: '2023-03',
            techStack: ['Vue 3', 'Pinia', 'Element Plus', 'Monaco Editor'],
            link: 'https://github.com/example/lowcode-platform',
            metrics: [
              '支持80+基础组件',
              '累计生成页面：5000+',
              '运营提效：60%',
              'GitHub Stars：1.2k'
            ],
            description: '基于拖拽的可视化搭建平台，支持组件属性配置、事件绑定、数据联动，输出标准Vue代码。'
          }
        ]
      }
    },
    {
      id: 'skills',
      type: 'skills',
      visible: true,
      order: 4,
      fields: {
        groups: [
          {
            id: 'skill-group-1',
            name: '前端技术栈',
            items: ['React', 'Vue 3', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Next.js', 'Nuxt']
          },
          {
            id: 'skill-group-2',
            name: '工程化工具',
            items: ['Webpack', 'Vite', 'Rollup', 'ESLint', 'Prettier', 'Jest', 'Vitest', 'Cypress']
          },
          {
            id: 'skill-group-3',
            name: '其他能力',
            items: ['Node.js', 'MySQL', 'MongoDB', 'Docker', 'Git', 'CI/CD', '性能优化', '微前端']
          }
        ]
      }
    },
    {
      id: 'selfEvaluation',
      type: 'selfEvaluation',
      visible: true,
      order: 5,
      fields: {
        content: '5年前端开发经验，精通React/Vue生态，具备大型SPA项目架构设计能力。熟悉前端工程化体系，有从0到1搭建组件库和开发工具的实战经验。注重代码质量与用户体验，善于推动技术方案落地并验证业务价值。具备良好的团队协作和沟通能力，曾带领3-5人小团队完成多个核心项目交付。'
      }
    }
  ]
};

const designTemplate: ResumeTemplate = {
  id: 'design-ui',
  name: 'UI设计师模板',
  category: 'design',
  description: '设计岗专用，强化作品集链接与设计成果展示',
  theme: {
    primaryColor: '#14532d',
    secondaryColor: '#86efac',
    fontFamily: 'LXGW WenKai',
    fontSize: 14
  },
  modules: [
    {
      id: 'basic',
      type: 'basic',
      visible: true,
      order: 0,
      fields: {
        name: '李雪',
        title: '高级UI/UX设计师',
        phone: '139-0000-0000',
        email: 'lixue@example.com',
        location: '上海市浦东新区',
        website: 'https://lixue.design',
        portfolio: 'https://www.behance.net/lixue',
        dribbble: 'https://dribbble.com/lixue',
        avatar: ''
      }
    },
    {
      id: 'education',
      type: 'education',
      visible: true,
      order: 1,
      fields: {
        items: [
          {
            id: 'edu-1',
            school: '中央美术学院',
            major: '视觉传达设计',
            degree: '硕士',
            startDate: '2019-09',
            endDate: '2022-06',
            gpa: '3.9/4.0',
            description: '毕业设计获院级优秀作品奖，入选年度设计展'
          },
          {
            id: 'edu-2',
            school: '中国美术学院',
            major: '数字媒体艺术',
            degree: '本科',
            startDate: '2015-09',
            endDate: '2019-06',
            gpa: '3.8/4.0',
            description: '国家奖学金获得者，Adobe认证视觉设计师'
          }
        ]
      }
    },
    {
      id: 'experience',
      type: 'experience',
      visible: true,
      order: 2,
      fields: {
        items: [
          {
            id: 'exp-1',
            company: '腾讯',
            position: '高级UI设计师',
            startDate: '2022-07',
            endDate: '至今',
            responsibilities: [
              '负责微信支付核心流程体验设计，服务用户数超5亿',
              '主导支付安全改版，用户信任度提升28%，转化率提升15%',
              '建立设计系统规范，输出组件200+，覆盖15个业务场景',
              '带教2名初级设计师，完成从需求到落地的全流程辅导'
            ]
          },
          {
            id: 'exp-2',
            company: '网易',
            position: 'UI设计师',
            startDate: '2020-06',
            endDate: '2022-06',
            responsibilities: [
              '负责网易云音乐社区模块视觉设计，DAU超3000万',
              '独立完成年度品牌升级设计，App Store推荐位曝光',
              '产出交互动效规范，与开发协作落地效率提升40%'
            ]
          }
        ]
      }
    },
    {
      id: 'project',
      type: 'project',
      visible: true,
      order: 3,
      fields: {
        items: [
          {
            id: 'proj-1',
            name: '微信支付安全体验升级',
            role: '主设计师',
            startDate: '2023-03',
            endDate: '2023-09',
            link: 'https://www.behance.net/gallery/xxxxx/wechat-pay',
            portfolioLink: 'https://lixue.design/project/wechat-pay',
            tools: ['Figma', 'Principle', 'Sketch', 'After Effects'],
            achievements: [
              '支付成功率提升：+3.2%',
              '用户投诉率降低：-45%',
              '用户满意度评分：4.9/5.0',
              '获得腾讯年度设计大奖'
            ],
            description: '针对支付流程中用户信任感不足的问题，通过信息架构优化、视觉层级重塑、动效反馈增强三大维度进行全面改版。建立了安全支付设计语言，沉淀为公司级设计规范。'
          },
          {
            id: 'proj-2',
            name: '网易云音乐社区改版',
            role: '核心设计',
            startDate: '2021-06',
            endDate: '2021-12',
            link: '',
            portfolioLink: 'https://lixue.design/project/cloudmusic',
            tools: ['Figma', 'Sketch', 'Framer', 'Photoshop'],
            achievements: [
              '社区发帖量增长：+68%',
              '人均停留时长：+22%',
              '互动率提升：+35%',
              'App Store精选推荐'
            ],
            description: '重新定义社区内容消费场景，从信息流展示、内容创作工具、社交互动三个层面进行体验升级。设计了适用于UGC场景的卡片系统和话题组件。'
          },
          {
            id: 'proj-3',
            name: '企业级设计系统 DesignKit',
            role: '设计负责人',
            startDate: '2023-01',
            endDate: '2023-06',
            link: '',
            portfolioLink: 'https://lixue.design/project/designkit',
            tools: ['Figma', 'Zeroheight', 'Notion'],
            achievements: [
              '组件数量：200+',
              '使用团队：15个业务线',
              '设计效率提升：50%',
              '前端还原度：95%'
            ],
            description: '从0到1搭建跨业务线设计系统，包含设计原则、组件规范、设计Token、协作流程四大部分。建立了完整的版本管理和迭代机制。'
          }
        ]
      }
    },
    {
      id: 'skills',
      type: 'skills',
      visible: true,
      order: 4,
      fields: {
        groups: [
          {
            id: 'skill-group-1',
            name: '设计工具',
            items: ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects', 'Principle', 'Framer']
          },
          {
            id: 'skill-group-2',
            name: '设计能力',
            items: ['UI设计', 'UX设计', '交互设计', '动效设计', '品牌设计', '视觉规范', '用户研究', '可用性测试']
          },
          {
            id: 'skill-group-3',
            name: '协作与其他',
            items: ['设计系统搭建', '需求分析', '原型制作', '走查验收', 'Notion', 'Jira', 'Confluence', '基础HTML/CSS']
          }
        ]
      }
    },
    {
      id: 'selfEvaluation',
      type: 'selfEvaluation',
      visible: true,
      order: 5,
      fields: {
        content: '6年互联网产品设计经验，主导过亿级用户产品的体验设计。具备扎实的视觉功底和系统的用户体验思维，擅长从商业目标和用户需求中找到设计平衡点。有完整的设计系统搭建经验，注重设计与开发的协作效率。作品多次获得行业设计奖项，多份作品入选Behance首页推荐。'
      }
    }
  ]
};

const functionTemplate: ResumeTemplate = {
  id: 'function-admin',
  name: '行政运营岗模板',
  category: 'function',
  description: '职能岗专用，侧重流程优化与管理成果',
  theme: {
    primaryColor: '#581c87',
    secondaryColor: '#c4b5fd',
    fontFamily: 'LXGW WenKai',
    fontSize: 14
  },
  modules: [
    {
      id: 'basic',
      type: 'basic',
      visible: true,
      order: 0,
      fields: {
        name: '王芳',
        title: '高级行政运营经理',
        phone: '137-0000-0000',
        email: 'wangfang@example.com',
        location: '深圳市南山区',
        linkedin: 'https://linkedin.com/in/wangfang',
        avatar: ''
      }
    },
    {
      id: 'education',
      type: 'education',
      visible: true,
      order: 1,
      fields: {
        items: [
          {
            id: 'edu-1',
            school: '中山大学',
            major: '行政管理',
            degree: '硕士',
            startDate: '2018-09',
            endDate: '2021-06',
            gpa: '3.7/4.0',
            description: '研究方向：企业行政管理与组织效能'
          },
          {
            id: 'edu-2',
            school: '暨南大学',
            major: '公共事业管理',
            degree: '本科',
            startDate: '2014-09',
            endDate: '2018-06',
            gpa: '3.6/4.0',
            description: '校级优秀毕业生，学生干部经历3年'
          }
        ]
      }
    },
    {
      id: 'experience',
      type: 'experience',
      visible: true,
      order: 2,
      fields: {
        items: [
          {
            id: 'exp-1',
            company: '华为',
            position: '行政运营经理',
            startDate: '2021-07',
            endDate: '至今',
            responsibilities: [
              '管理深圳园区行政团队（15人），覆盖2000+员工办公服务',
              '主导行政采购流程数字化改造，年度采购成本降低22%，节省350万',
              '建立办公服务SLA体系，员工满意度从78%提升至94%',
              '策划组织年度团建、年会等大型活动20+场次，参与人次5000+'
            ]
          },
          {
            id: 'exp-2',
            company: '万科',
            position: '行政专员/主管',
            startDate: '2018-07',
            endDate: '2021-06',
            responsibilities: [
              '负责总部办公日常运维，固定资产盘点准确率100%',
              '搭建会议服务标准化流程，会议执行效率提升40%',
              '主导办公区域搬迁项目（300人规模），零事故完成',
              '建立供应商评价体系，优化供应商结构，合格率提升35%'
            ]
          }
        ]
      }
    },
    {
      id: 'project',
      type: 'project',
      visible: true,
      order: 3,
      fields: {
        items: [
          {
            id: 'proj-1',
            name: '行政采购数字化升级项目',
            role: '项目负责人',
            startDate: '2022-06',
            endDate: '2023-03',
            category: '流程优化',
            metrics: [
              '采购审批周期：7天→2天',
              '年度采购成本：-22%（节省350万）',
              '采购合规率：85%→100%',
              '供应商响应时效：+60%'
            ],
            description: '推动行政采购从线下到线上的全流程转型，引入SRM系统，打通预算、审批、下单、对账全链路。建立采购数据看板，实现成本可视化和动态监控。'
          },
          {
            id: 'proj-2',
            name: '办公服务体验优化专项',
            role: '牵头人',
            startDate: '2022-01',
            endDate: '2022-10',
            category: '运营改善',
            metrics: [
              '员工满意度：78%→94%',
              '服务响应时长：24h→4h',
              '问题工单关闭率：82%→98%',
              '重复工单率：-65%'
            ],
            description: '建立行政服务SLA标准和工单系统，梳理50+项高频服务场景的SOP。引入服务评价机制，形成PDCA持续优化闭环。'
          },
          {
            id: 'proj-3',
            name: '300人办公区整体搬迁项目',
            role: '项目总指挥',
            startDate: '2020-03',
            endDate: '2020-06',
            category: '项目管理',
            metrics: [
              '搬迁周期：14天',
              '资产损耗率：0.3%',
              '员工投诉：0起',
              '业务中断时间：0小时'
            ],
            description: '统筹新办公区装修、工位规划、IT部署、搬迁运输、后勤保障等全流程。制定详细的时间节点和应急预案，确保搬迁过程零事故、业务零中断。'
          }
        ]
      }
    },
    {
      id: 'skills',
      type: 'skills',
      visible: true,
      order: 4,
      fields: {
        groups: [
          {
            id: 'skill-group-1',
            name: '办公软件',
            items: ['Word', 'Excel（高级函数/数据透视表）', 'PPT', 'Outlook', 'Visio', 'Project', '钉钉', '企业微信']
          },
          {
            id: 'skill-group-2',
            name: '专业能力',
            items: ['行政管理', '流程优化', '供应商管理', '活动策划', '预算编制', '固定资产管理', '会务组织', '公文写作']
          },
          {
            id: 'skill-group-3',
            name: '软实力',
            items: ['跨部门沟通', '项目管理', '数据分析', '团队管理', '问题解决', '抗压能力', '服务意识', 'PMP认证']
          }
        ]
      }
    },
    {
      id: 'selfEvaluation',
      type: 'selfEvaluation',
      visible: true,
      order: 5,
      fields: {
        content: '6年大型企业行政运营管理经验，熟悉500强企业行政体系运作。擅长从0到1搭建行政服务体系和标准化流程，具备百万级预算管理和供应商资源整合能力。主导过多项流程优化项目，累计为公司节省成本超500万。具备优秀的跨部门协调和项目推动能力，注重服务细节与员工体验，获得多次公司级表彰。'
      }
    }
  ]
};

const blankTemplate: ResumeTemplate = {
  id: 'blank',
  name: '应届生简历',
  category: 'blank',
  description: '面向应届生与职场新人的完整简历样例，直接编辑即可快速生成专业简历',
  theme: {
    primaryColor: '#1e3a5f',
    secondaryColor: '#c9a24a',
    fontFamily: 'LXGW WenKai',
    fontSize: 14
  },
  modules: [
    {
      id: 'basic',
      type: 'basic',
      visible: true,
      order: 0,
      fields: {
        name: '陈思远',
        title: '前端开发工程师',
        phone: '139-2345-6789',
        email: 'chensiyuan2024@gmail.com',
        location: '杭州',
        website: '',
        github: 'github.com/chensiyuan',
        portfolio: '',
        avatar: ''
      }
    },
    {
      id: 'education',
      type: 'education',
      visible: true,
      order: 1,
      fields: {
        items: [
          {
            id: 'edu-blank-1',
            school: '浙江大学',
            major: '计算机科学与技术',
            degree: '本科',
            startDate: '2020-09',
            endDate: '2024-06',
            gpa: '3.82/4.0（专业前15%）',
            description: '主修数据结构、操作系统、计算机网络、软件工程；获校级一等奖学金2次、ACM校赛银奖'
          }
        ]
      }
    },
    {
      id: 'experience',
      type: 'experience',
      visible: true,
      order: 2,
      fields: {
        items: [
          {
            id: 'exp-blank-1',
            company: '字节跳动',
            position: '前端开发实习生',
            startDate: '2023-07',
            endDate: '2023-12',
            responsibilities: [
              '负责抖音电商后台管理系统开发，使用React + TypeScript重构商品列表页，页面加载速度提升40%',
              '独立完成数据看板模块，对接3个后端API，实现日活/转化率/GMV等核心指标可视化',
              '参与组件库建设，封装5个通用业务组件，被团队3个项目复用，减少重复开发约30%'
            ]
          },
          {
            id: 'exp-blank-2',
            company: '校园创业项目 · 智选课',
            position: '全栈开发负责人',
            startDate: '2022-03',
            endDate: '2023-06',
            responsibilities: [
              '从0到1搭建课程推荐平台，服务校内2000+学生，日均访问量500+',
              '使用Vue 3 + Express + MongoDB技术栈，实现课表冲突检测与智能推荐算法',
              '项目获校级创新创业大赛二等奖，被学校教务处采纳为选课辅助工具'
            ]
          }
        ]
      }
    },
    {
      id: 'project',
      type: 'project',
      visible: true,
      order: 3,
      fields: {
        items: [
          {
            id: 'proj-blank-1',
            name: '低代码搭建平台',
            role: '核心开发者',
            startDate: '2023-09',
            endDate: '2024-03',
            techStack: ['React', 'TypeScript', 'Zustand', 'DnD-Kit'],
            link: 'github.com/chensiyuan/lowcode-builder',
            metrics: ['支持12种组件拖拽配置', '生成页面体积较竞品减小35%', 'GitHub Stars 280+'],
            description: '基于React的可视化页面搭建工具，支持组件拖拽、属性配置、实时预览与代码导出。采用插件化架构，核心引擎仅8KB gzipped。'
          }
        ]
      }
    },
    {
      id: 'skills',
      type: 'skills',
      visible: true,
      order: 4,
      fields: {
        groups: [
          {
            id: 'skill-blank-1',
            name: '前端技术',
            items: ['React', 'Vue 3', 'TypeScript', 'Next.js', 'TailwindCSS', 'Webpack/Vite']
          },
          {
            id: 'skill-blank-2',
            name: '后端与工具',
            items: ['Node.js', 'Express', 'MongoDB', 'Git', 'Docker', 'Linux']
          },
          {
            id: 'skill-blank-3',
            name: '软实力',
            items: ['敏捷开发', '技术分享（内部分享5次）', '英文文档阅读', '跨团队协作']
          }
        ]
      }
    },
    {
      id: 'selfEvaluation',
      type: 'selfEvaluation',
      visible: true,
      order: 5,
      fields: {
        content: '计算机专业应届毕业生，1年大厂前端实习经验。熟悉React/Vue技术栈，有从0到1项目落地经历，注重代码质量与工程规范。在字节跳动实习期间独立负责数据看板模块，页面加载速度优化40%；校园创业项目获校级二等奖并被教务处采纳。对前端工程化和用户体验有持续热情，保持技术博客输出（累计50+篇）。'
      }
    }
  ]
};

export const resumeTemplates: ResumeTemplate[] = [techTemplate, designTemplate, functionTemplate, blankTemplate];
export { techTemplate, designTemplate, functionTemplate, blankTemplate };
export default resumeTemplates;
