import type { Industry, JobRole, JobCategory } from '@shared/types';
import {
  Code,
  Palette,
  LineChart,
  Megaphone,
  Users,
  Building2,
  FlaskConical,
  Brain,
} from 'lucide-react';

export const mockIndustries: Industry[] = [
  {
    id: 'internet',
    name: '互联网',
    icon: 'Code',
    description: '互联网/IT/软件/科技',
    categories: [
      {
        id: 'frontend',
        name: '前端开发',
        jobs: [
          { id: 'job_fe_01', name: '前端工程师', level: 'middle', avgSalary: 25000, hotness: 95 },
          { id: 'job_fe_02', name: '高级前端工程师', level: 'senior', avgSalary: 40000, hotness: 88 },
          { id: 'job_fe_03', name: '前端架构师', level: 'expert', avgSalary: 60000, hotness: 72 },
          { id: 'job_fe_04', name: '全栈工程师', level: 'middle', avgSalary: 30000, hotness: 85 },
        ],
      },
      {
        id: 'backend',
        name: '后端开发',
        jobs: [
          { id: 'job_be_01', name: 'Java工程师', level: 'middle', avgSalary: 28000, hotness: 92 },
          { id: 'job_be_02', name: 'Go工程师', level: 'middle', avgSalary: 32000, hotness: 86 },
          { id: 'job_be_03', name: 'Python工程师', level: 'middle', avgSalary: 26000, hotness: 80 },
          { id: 'job_be_04', name: '后端架构师', level: 'expert', avgSalary: 65000, hotness: 70 },
        ],
      },
      {
        id: 'algorithm',
        name: '算法/AI',
        jobs: [
          { id: 'job_ai_01', name: 'AI算法工程师', level: 'middle', avgSalary: 45000, hotness: 98 },
          { id: 'job_ai_02', name: '推荐算法工程师', level: 'senior', avgSalary: 50000, hotness: 82 },
          { id: 'job_ai_03', name: 'NLP算法工程师', level: 'middle', avgSalary: 42000, hotness: 78 },
          { id: 'job_ai_04', name: 'CV算法工程师', level: 'senior', avgSalary: 48000, hotness: 75 },
        ],
      },
      {
        id: 'mobile',
        name: '移动开发',
        jobs: [
          { id: 'job_mb_01', name: 'iOS开发工程师', level: 'middle', avgSalary: 28000, hotness: 70 },
          { id: 'job_mb_02', name: 'Android开发工程师', level: 'middle', avgSalary: 26000, hotness: 68 },
          { id: 'job_mb_03', name: 'Flutter工程师', level: 'junior', avgSalary: 22000, hotness: 75 },
          { id: 'job_mb_04', name: 'React Native工程师', level: 'middle', avgSalary: 25000, hotness: 72 },
        ],
      },
    ],
  },
  {
    id: 'product',
    name: '产品/设计',
    icon: 'Palette',
    description: '产品经理/交互/视觉',
    categories: [
      {
        id: 'pm',
        name: '产品经理',
        jobs: [
          { id: 'job_pm_01', name: '产品经理', level: 'middle', avgSalary: 28000, hotness: 90 },
          { id: 'job_pm_02', name: '高级产品经理', level: 'senior', avgSalary: 42000, hotness: 85 },
          { id: 'job_pm_03', name: '产品专家', level: 'expert', avgSalary: 55000, hotness: 70 },
          { id: 'job_pm_04', name: '产品总监', level: 'lead', avgSalary: 80000, hotness: 55 },
        ],
      },
      {
        id: 'ux',
        name: '交互设计',
        jobs: [
          { id: 'job_ux_01', name: 'UX设计师', level: 'middle', avgSalary: 22000, hotness: 75 },
          { id: 'job_ux_02', name: '高级UX设计师', level: 'senior', avgSalary: 32000, hotness: 68 },
          { id: 'job_ux_03', name: '交互专家', level: 'expert', avgSalary: 45000, hotness: 55 },
          { id: 'job_ux_04', name: '设计总监', level: 'lead', avgSalary: 60000, hotness: 45 },
        ],
      },
      {
        id: 'ui',
        name: '视觉设计',
        jobs: [
          { id: 'job_ui_01', name: 'UI设计师', level: 'middle', avgSalary: 20000, hotness: 78 },
          { id: 'job_ui_02', name: '高级UI设计师', level: 'senior', avgSalary: 30000, hotness: 70 },
          { id: 'job_ui_03', name: '视觉专家', level: 'expert', avgSalary: 42000, hotness: 58 },
          { id: 'job_ui_04', name: '设计总监', level: 'lead', avgSalary: 58000, hotness: 48 },
        ],
      },
      {
        id: 'growth',
        name: '增长运营',
        jobs: [
          { id: 'job_gr_01', name: '增长产品经理', level: 'middle', avgSalary: 30000, hotness: 82 },
          { id: 'job_gr_02', name: '用户运营', level: 'junior', avgSalary: 15000, hotness: 75 },
          { id: 'job_gr_03', name: '内容运营', level: 'junior', avgSalary: 14000, hotness: 70 },
          { id: 'job_gr_04', name: '活动运营', level: 'middle', avgSalary: 18000, hotness: 68 },
        ],
      },
    ],
  },
  {
    id: 'data',
    name: '数据/商业分析',
    icon: 'LineChart',
    description: '数据分析/BI/数仓',
    categories: [
      {
        id: 'da',
        name: '数据分析',
        jobs: [
          { id: 'job_da_01', name: '数据分析师', level: 'middle', avgSalary: 22000, hotness: 85 },
          { id: 'job_da_02', name: '高级数据分析师', level: 'senior', avgSalary: 35000, hotness: 78 },
          { id: 'job_da_03', name: '数据分析专家', level: 'expert', avgSalary: 50000, hotness: 65 },
          { id: 'job_da_04', name: 'BI经理', level: 'lead', avgSalary: 45000, hotness: 60 },
        ],
      },
      {
        id: 'ds',
        name: '数据科学',
        jobs: [
          { id: 'job_ds_01', name: '数据科学家', level: 'senior', avgSalary: 45000, hotness: 88 },
          { id: 'job_ds_02', name: '机器学习工程师', level: 'middle', avgSalary: 38000, hotness: 85 },
          { id: 'job_ds_03', name: '算法工程师', level: 'middle', avgSalary: 40000, hotness: 80 },
          { id: 'job_ds_04', name: '数据科学专家', level: 'expert', avgSalary: 60000, hotness: 70 },
        ],
      },
      {
        id: 'de',
        name: '数据工程',
        jobs: [
          { id: 'job_de_01', name: '数据工程师', level: 'middle', avgSalary: 28000, hotness: 75 },
          { id: 'job_de_02', name: '大数据工程师', level: 'senior', avgSalary: 38000, hotness: 72 },
          { id: 'job_de_03', name: 'ETL工程师', level: 'junior', avgSalary: 18000, hotness: 65 },
          { id: 'job_de_04', name: '数据架构师', level: 'expert', avgSalary: 55000, hotness: 58 },
        ],
      },
      {
        id: 'bi',
        name: '商业分析',
        jobs: [
          { id: 'job_bi_01', name: '商业分析师', level: 'middle', avgSalary: 25000, hotness: 78 },
          { id: 'job_bi_02', name: '战略分析师', level: 'senior', avgSalary: 40000, hotness: 65 },
          { id: 'job_bi_03', name: '行业研究员', level: 'middle', avgSalary: 28000, hotness: 60 },
          { id: 'job_bi_04', name: '业务分析师', level: 'junior', avgSalary: 18000, hotness: 70 },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    name: '市场/品牌',
    icon: 'Megaphone',
    description: '市场/品牌/公关',
    categories: [
      {
        id: 'brand',
        name: '品牌营销',
        jobs: [
          { id: 'job_br_01', name: '品牌专员', level: 'junior', avgSalary: 12000, hotness: 65 },
          { id: 'job_br_02', name: '品牌经理', level: 'middle', avgSalary: 25000, hotness: 72 },
          { id: 'job_br_03', name: '品牌总监', level: 'lead', avgSalary: 50000, hotness: 55 },
          { id: 'job_br_04', name: 'CMO', level: 'lead', avgSalary: 100000, hotness: 35 },
        ],
      },
      {
        id: 'digital',
        name: '数字营销',
        jobs: [
          { id: 'job_dg_01', name: '数字营销专员', level: 'junior', avgSalary: 13000, hotness: 70 },
          { id: 'job_dg_02', name: 'SEM专员', level: 'junior', avgSalary: 14000, hotness: 68 },
          { id: 'job_dg_03', name: 'SEO优化师', level: 'middle', avgSalary: 18000, hotness: 65 },
          { id: 'job_dg_04', name: '增长黑客', level: 'senior', avgSalary: 35000, hotness: 78 },
        ],
      },
      {
        id: 'pr',
        name: '公关传播',
        jobs: [
          { id: 'job_pr_01', name: '公关专员', level: 'junior', avgSalary: 11000, hotness: 60 },
          { id: 'job_pr_02', name: '公关经理', level: 'middle', avgSalary: 22000, hotness: 65 },
          { id: 'job_pr_03', name: '公关总监', level: 'lead', avgSalary: 45000, hotness: 50 },
          { id: 'job_pr_04', name: '媒介总监', level: 'lead', avgSalary: 42000, hotness: 48 },
        ],
      },
      {
        id: 'content',
        name: '内容营销',
        jobs: [
          { id: 'job_ct_01', name: '内容运营', level: 'junior', avgSalary: 12000, hotness: 72 },
          { id: 'job_ct_02', name: '文案策划', level: 'junior', avgSalary: 13000, hotness: 68 },
          { id: 'job_ct_03', name: '新媒体运营', level: 'junior', avgSalary: 14000, hotness: 75 },
          { id: 'job_ct_04', name: '内容总监', level: 'lead', avgSalary: 40000, hotness: 52 },
        ],
      },
    ],
  },
  {
    id: 'hr',
    name: '人力资源',
    icon: 'Users',
    description: 'HR/招聘/培训',
    categories: [
      {
        id: 'recruit',
        name: '招聘',
        jobs: [
          { id: 'job_rc_01', name: '招聘专员', level: 'junior', avgSalary: 10000, hotness: 70 },
          { id: 'job_rc_02', name: '招聘经理', level: 'middle', avgSalary: 20000, hotness: 65 },
          { id: 'job_rc_03', name: '人才发展经理', level: 'middle', avgSalary: 22000, hotness: 60 },
          { id: 'job_rc_04', name: 'HRBP', level: 'senior', avgSalary: 30000, hotness: 72 },
        ],
      },
      {
        id: 'od',
        name: '组织发展',
        jobs: [
          { id: 'job_od_01', name: 'OD专员', level: 'junior', avgSalary: 12000, hotness: 55 },
          { id: 'job_od_02', name: 'OD经理', level: 'middle', avgSalary: 28000, hotness: 60 },
          { id: 'job_od_03', name: '组织发展专家', level: 'expert', avgSalary: 45000, hotness: 50 },
          { id: 'job_od_04', name: 'HRD', level: 'lead', avgSalary: 60000, hotness: 40 },
        ],
      },
      {
        id: 'training',
        name: '培训发展',
        jobs: [
          { id: 'job_tr_01', name: '培训专员', level: 'junior', avgSalary: 10000, hotness: 60 },
          { id: 'job_tr_02', name: '培训经理', level: 'middle', avgSalary: 20000, hotness: 58 },
          { id: 'job_tr_03', name: '学习发展专家', level: 'senior', avgSalary: 32000, hotness: 52 },
          { id: 'job_tr_04', name: '企业大学校长', level: 'lead', avgSalary: 55000, hotness: 35 },
        ],
      },
      {
        id: 'cnb',
        name: '薪酬绩效',
        jobs: [
          { id: 'job_cn_01', name: '薪酬专员', level: 'junior', avgSalary: 11000, hotness: 58 },
          { id: 'job_cn_02', name: '绩效经理', level: 'middle', avgSalary: 22000, hotness: 55 },
          { id: 'job_cn_03', name: 'C&B专家', level: 'senior', avgSalary: 35000, hotness: 48 },
          { id: 'job_cn_04', name: 'HRD', level: 'lead', avgSalary: 58000, hotness: 38 },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: '金融/投资',
    icon: 'Building2',
    description: '银行/证券/投资',
    categories: [
      {
        id: 'ib',
        name: '投资银行',
        jobs: [
          { id: 'job_ib_01', name: '投行分析师', level: 'junior', avgSalary: 30000, hotness: 75 },
          { id: 'job_ib_02', name: '投资经理', level: 'middle', avgSalary: 50000, hotness: 70 },
          { id: 'job_ib_03', name: '投行VP', level: 'senior', avgSalary: 80000, hotness: 55 },
          { id: 'job_ib_04', name: '投行MD', level: 'lead', avgSalary: 150000, hotness: 30 },
        ],
      },
      {
        id: 'pe',
        name: '私募股权投资',
        jobs: [
          { id: 'job_pe_01', name: 'PE分析师', level: 'junior', avgSalary: 35000, hotness: 78 },
          { id: 'job_pe_02', name: '投资经理', level: 'middle', avgSalary: 55000, hotness: 72 },
          { id: 'job_pe_03', name: '投资总监', level: 'senior', avgSalary: 85000, hotness: 58 },
          { id: 'job_pe_04', name: '合伙人', level: 'lead', avgSalary: 200000, hotness: 25 },
        ],
      },
      {
        id: 'sec',
        name: '证券研究',
        jobs: [
          { id: 'job_sec_01', name: '行业研究员', level: 'junior', avgSalary: 25000, hotness: 70 },
          { id: 'job_sec_02', name: '高级研究员', level: 'middle', avgSalary: 40000, hotness: 65 },
          { id: 'job_sec_03', name: '首席分析师', level: 'senior', avgSalary: 70000, hotness: 50 },
          { id: 'job_sec_04', name: '研究所所长', level: 'lead', avgSalary: 100000, hotness: 35 },
        ],
      },
      {
        id: 'fin',
        name: '企业财务',
        jobs: [
          { id: 'job_fin_01', name: '财务分析师', level: 'junior', avgSalary: 15000, hotness: 68 },
          { id: 'job_fin_02', name: '财务经理', level: 'middle', avgSalary: 28000, hotness: 65 },
          { id: 'job_fin_03', name: '财务总监', level: 'senior', avgSalary: 50000, hotness: 55 },
          { id: 'job_fin_04', name: 'CFO', level: 'lead', avgSalary: 120000, hotness: 30 },
        ],
      },
    ],
  },
  {
    id: 'bio',
    name: '生物/医药',
    icon: 'FlaskConical',
    description: '医疗/制药/生物',
    categories: [
      {
        id: 'rnd',
        name: '药物研发',
        jobs: [
          { id: 'job_rnd_01', name: '研发专员', level: 'junior', avgSalary: 15000, hotness: 65 },
          { id: 'job_rnd_02', name: '高级研究员', level: 'middle', avgSalary: 28000, hotness: 60 },
          { id: 'job_rnd_03', name: '研发科学家', level: 'senior', avgSalary: 45000, hotness: 55 },
          { id: 'job_rnd_04', name: '研发总监', level: 'lead', avgSalary: 70000, hotness: 40 },
        ],
      },
      {
        id: 'clinic',
        name: '临床医学',
        jobs: [
          { id: 'job_cl_01', name: '临床研究员', level: 'junior', avgSalary: 18000, hotness: 70 },
          { id: 'job_cl_02', name: '临床监查员', level: 'middle', avgSalary: 25000, hotness: 68 },
          { id: 'job_cl_03', name: '医学经理', level: 'senior', avgSalary: 40000, hotness: 58 },
          { id: 'job_cl_04', name: '医学总监', level: 'lead', avgSalary: 65000, hotness: 45 },
        ],
      },
      {
        id: 'reg',
        name: '注册事务',
        jobs: [
          { id: 'job_reg_01', name: '注册专员', level: 'junior', avgSalary: 14000, hotness: 62 },
          { id: 'job_reg_02', name: '注册经理', level: 'middle', avgSalary: 26000, hotness: 58 },
          { id: 'job_reg_03', name: '法规事务专家', level: 'senior', avgSalary: 42000, hotness: 50 },
          { id: 'job_reg_04', name: '注册总监', level: 'lead', avgSalary: 60000, hotness: 38 },
        ],
      },
      {
        id: 'qa',
        name: '质量控制',
        jobs: [
          { id: 'job_qa_01', name: 'QA专员', level: 'junior', avgSalary: 12000, hotness: 60 },
          { id: 'job_qa_02', name: 'QA经理', level: 'middle', avgSalary: 22000, hotness: 55 },
          { id: 'job_qa_03', name: '质量总监', level: 'senior', avgSalary: 40000, hotness: 48 },
          { id: 'job_qa_04', name: '质量负责人', level: 'lead', avgSalary: 55000, hotness: 40 },
        ],
      },
    ],
  },
  {
    id: 'consulting',
    name: '咨询/专业服务',
    icon: 'Brain',
    description: '管理咨询/战略/法律',
    categories: [
      {
        id: 'mc',
        name: '管理咨询',
        jobs: [
          { id: 'job_mc_01', name: '咨询顾问', level: 'junior', avgSalary: 25000, hotness: 75 },
          { id: 'job_mc_02', name: '高级顾问', level: 'middle', avgSalary: 40000, hotness: 70 },
          { id: 'job_mc_03', name: '项目经理', level: 'senior', avgSalary: 60000, hotness: 60 },
          { id: 'job_mc_04', name: '合伙人', level: 'lead', avgSalary: 150000, hotness: 30 },
        ],
      },
      {
        id: 'stra',
        name: '战略咨询',
        jobs: [
          { id: 'job_stra_01', name: '战略分析师', level: 'junior', avgSalary: 30000, hotness: 72 },
          { id: 'job_stra_02', name: '战略顾问', level: 'middle', avgSalary: 48000, hotness: 68 },
          { id: 'job_stra_03', name: '战略总监', level: 'senior', avgSalary: 75000, hotness: 55 },
          { id: 'job_stra_04', name: '高级合伙人', level: 'lead', avgSalary: 200000, hotness: 25 },
        ],
      },
      {
        id: 'law',
        name: '法律',
        jobs: [
          { id: 'job_law_01', name: '律师助理', level: 'entry', avgSalary: 10000, hotness: 65 },
          { id: 'job_law_02', name: '执业律师', level: 'middle', avgSalary: 30000, hotness: 60 },
          { id: 'job_law_03', name: '高级律师', level: 'senior', avgSalary: 50000, hotness: 50 },
          { id: 'job_law_04', name: '合伙人', level: 'lead', avgSalary: 100000, hotness: 35 },
        ],
      },
      {
        id: 'acc',
        name: '审计/会计',
        jobs: [
          { id: 'job_acc_01', name: '审计助理', level: 'entry', avgSalary: 10000, hotness: 68 },
          { id: 'job_acc_02', name: '审计师', level: 'junior', avgSalary: 18000, hotness: 65 },
          { id: 'job_acc_03', name: '高级审计师', level: 'middle', avgSalary: 28000, hotness: 58 },
          { id: 'job_acc_04', name: '审计合伙人', level: 'lead', avgSalary: 80000, hotness: 38 },
        ],
      },
    ],
  },
];

export const iconMap: Record<string, any> = {
  Code,
  Palette,
  LineChart,
  Megaphone,
  Users,
  Building2,
  FlaskConical,
  Brain,
};

export const defaultSelectedJobId = 'job_fe_01';
export const defaultSelectedIndustryId = 'internet';
export const defaultSelectedCategoryId = 'frontend';
