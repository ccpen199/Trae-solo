import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { getDatabase, getDatabasePath, closeDatabase } from './database.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '../../')
const defaultPassword = '123456'
const passwordHash = bcrypt.hashSync(defaultPassword, 10)

const universities = [
  { name: '北京大学', shortName: '北大', province: '北京市', city: '北京市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 哲学', 'A+ 经济学', 'A+ 法学', 'A+ 社会学', 'A+ 中国语言文学', 'A+ 历史学', 'A+ 数学', 'A+ 物理学', 'A+ 化学']), masterPoints: 50, doctorPoints: 45, employmentRate: 98.5, description: '北京大学创立于1898年，是中国第一所国立综合性大学。' },
  { name: '清华大学', shortName: '清华', province: '北京市', city: '北京市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 马克思主义理论', 'A+ 化学', 'A+ 生物学', 'A+ 力学', 'A+ 机械工程', 'A+ 仪器科学与技术', 'A+ 材料科学与工程', 'A+ 动力工程及工程热物理', 'A+ 电气工程']), masterPoints: 48, doctorPoints: 42, employmentRate: 98.2, description: '清华大学的前身是清华学堂，成立于1911年。' },
  { name: '复旦大学', shortName: '复旦', province: '上海市', city: '上海市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 哲学', 'A+ 应用经济学', 'A+ 政治学', 'A+ 中国语言文学', 'A+ 新闻传播学', 'A+ 数学', 'A+ 物理学', 'A+ 化学', 'A+ 基础医学']), masterPoints: 46, doctorPoints: 40, employmentRate: 97.8, description: '复旦大学始建于1905年，是一所世界知名的综合性研究型大学。' },
  { name: '上海交通大学', shortName: '上海交大', province: '上海市', city: '上海市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 机械工程', 'A+ 船舶与海洋工程', 'A+ 临床医学', 'A+ 生物学', 'A+ 工商管理', 'A 材料科学与工程', 'A 动力工程及工程热物理', 'A 信息与通信工程']), masterPoints: 45, doctorPoints: 38, employmentRate: 97.5, description: '上海交通大学创建于1896年，以工科闻名。' },
  { name: '浙江大学', shortName: '浙大', province: '浙江省', city: '杭州市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 生态学', 'A+ 光学工程', 'A+ 控制科学与工程', 'A+ 计算机科学与技术', 'A+ 农业工程', 'A+ 软件工程', 'A+ 临床医学', 'A 数学', 'A 物理学']), masterPoints: 47, doctorPoints: 41, employmentRate: 97.2, description: '浙江大学成立于1897年，是中国人自己创办最早的高等学府之一。' },
  { name: '南京大学', shortName: '南大', province: '江苏省', city: '南京市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 天文学', 'A+ 地质学', 'A+ 图书情报与档案管理', 'A 哲学', 'A 社会学', 'A 中国语言文学', 'A 外国语言文学', 'A 物理学', 'A 化学']), masterPoints: 44, doctorPoints: 39, employmentRate: 96.8, description: '南京大学前身是创建于1902年的三江师范学堂。' },
  { name: '中国科学技术大学', shortName: '中科大', province: '安徽省', city: '合肥市', level: '985', type: '理工', subjects: JSON.stringify(['A+ 物理学', 'A+ 化学', 'A+ 天文学', 'A+ 地球物理学', 'A+ 科学技术史', 'A+ 核科学与技术', 'A 数学', 'A 生物学']), masterPoints: 38, doctorPoints: 35, employmentRate: 96.5, description: '中国科学技术大学1958年创办于北京，1970年迁至合肥。' },
  { name: '武汉大学', shortName: '武大', province: '湖北省', city: '武汉市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 马克思主义理论', 'A+ 地球物理学', 'A+ 测绘科学与技术', 'A+ 图书情报与档案管理', 'A 法学', 'A 生物学', 'A 水利工程', 'A 临床医学']), masterPoints: 43, doctorPoints: 37, employmentRate: 96.2, description: '武汉大学创建于1893年，是中国历史最悠久的大学之一。' },
  { name: '中山大学', shortName: '中大', province: '广东省', city: '广州市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 生态学', 'A+ 工商管理', 'A 哲学', 'A 中国语言文学', 'A 化学', 'A 生物学', 'A 基础医学', 'A 临床医学']), masterPoints: 42, doctorPoints: 36, employmentRate: 95.8, description: '中山大学由孙中山先生创办，是直属教育部的综合性研究型大学。' },
  { name: '西安交通大学', shortName: '西安交大', province: '陕西省', city: '西安市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 动力工程及工程热物理', 'A+ 电气工程', 'A 数学', 'A 力学', 'A 机械工程', 'A 工商管理', 'A 公共管理', 'B+ 计算机科学与技术']), masterPoints: 40, doctorPoints: 34, employmentRate: 95.5, description: '西安交通大学的前身是1896年创建于上海的南洋公学。' },
  { name: '哈尔滨工业大学', shortName: '哈工大', province: '黑龙江省', city: '哈尔滨市', level: '985', type: '理工', subjects: JSON.stringify(['A+ 机械工程', 'A+ 控制科学与工程', 'A+ 环境科学与工程', 'A 力学', 'A 材料科学与工程', 'A 计算机科学与技术', 'A 土木工程', 'A 管理科学与工程']), masterPoints: 39, doctorPoints: 33, employmentRate: 95.2, description: '哈尔滨工业大学始建于1920年，被誉为工程师的摇篮。' },
  { name: '北京航空航天大学', shortName: '北航', province: '北京市', city: '北京市', level: '985', type: '理工', subjects: JSON.stringify(['A+ 仪器科学与技术', 'A+ 材料科学与工程', 'A+ 航空宇航科学与技术', 'A+ 软件工程', 'A 控制科学与工程', 'A 计算机科学与技术', 'A 管理科学与工程']), masterPoints: 36, doctorPoints: 30, employmentRate: 97.0, description: '北京航空航天大学创建于1952年，是中国第一所航空航天高等学府。' },
  { name: '同济大学', shortName: '同济', province: '上海市', city: '上海市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 土木工程', 'A+ 环境科学与工程', 'A+ 城乡规划学', 'A 马克思主义理论', 'A 数学', 'A 机械工程', 'A 临床医学', 'A 管理科学与工程']), masterPoints: 38, doctorPoints: 32, employmentRate: 95.0, description: '同济大学创建于1907年，以建筑、土木、海洋、环境等学科闻名。' },
  { name: '北京师范大学', shortName: '北师大', province: '北京市', city: '北京市', level: '985', type: '师范', subjects: JSON.stringify(['A+ 教育学', 'A+ 心理学', 'A+ 中国语言文学', 'A+ 中国史', 'A+ 地理学', 'A+ 戏剧与影视学', 'A 马克思主义理论', 'A 外国语言文学']), masterPoints: 35, doctorPoints: 28, employmentRate: 94.8, description: '北京师范大学是中国师范教育的最高学府。' },
  { name: '中国人民大学', shortName: '人大', province: '北京市', city: '北京市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 理论经济学', 'A+ 应用经济学', 'A+ 法学', 'A+ 社会学', 'A+ 马克思主义理论', 'A+ 新闻传播学', 'A+ 统计学', 'A+ 工商管理', 'A+ 公共管理']), masterPoints: 34, doctorPoints: 26, employmentRate: 96.0, description: '中国人民大学是一所以人文社会科学为主的综合性研究型全国重点大学。' },
  { name: '北京理工大学', shortName: '北理工', province: '北京市', city: '北京市', level: '985', type: '理工', subjects: JSON.stringify(['A+ 兵器科学与技术', 'A 机械工程', 'A 控制科学与工程', 'A 光学工程', 'B+ 材料科学与工程', 'B+ 信息与通信工程', 'B+ 计算机科学与技术']), masterPoints: 32, doctorPoints: 25, employmentRate: 94.5, description: '北京理工大学创立于1940年，前身是延安自然科学院。' },
  { name: '东南大学', shortName: '东南', province: '江苏省', city: '南京市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 建筑学', 'A+ 土木工程', 'A+ 交通运输工程', 'A+ 生物医学工程', 'A+ 艺术学理论', 'A 电子科学与技术', 'A 信息与通信工程', 'A 控制科学与工程']), masterPoints: 33, doctorPoints: 27, employmentRate: 94.2, description: '东南大学创立于1902年，是中国著名的建筑老八校之一。' },
  { name: '四川大学', shortName: '川大', province: '四川省', city: '成都市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 口腔医学', 'A 中国语言文学', 'A 马克思主义理论', 'A 数学', 'A 化学', 'A 生物学', 'A 材料科学与工程', 'A 生物医学工程']), masterPoints: 35, doctorPoints: 28, employmentRate: 93.8, description: '四川大学始建于1896年，是西南地区学术重镇。' },
  { name: '吉林大学', shortName: '吉大', province: '吉林省', city: '长春市', level: '985', type: '综合', subjects: JSON.stringify(['A 马克思主义理论', 'A 化学', 'A 哲学', 'B+ 法学', 'B+ 政治学', 'B+ 考古学', 'B+ 数学', 'B+ 物理学']), masterPoints: 34, doctorPoints: 27, employmentRate: 93.5, description: '吉林大学始建于1946年，是教育部直属的全国重点综合性大学。' },
  { name: '山东大学', shortName: '山大', province: '山东省', city: '济南市', level: '985', type: '综合', subjects: JSON.stringify(['A+ 数学', 'A 马克思主义理论', 'A 中国语言文学', 'B+ 应用经济学', 'B+ 外国语言文学', 'B+ 物理学', 'B+ 化学', 'B+ 生物学']), masterPoints: 33, doctorPoints: 26, employmentRate: 93.2, description: '山东大学始建于1901年，是继京师大学堂之后中国创办的第二所国立大学。' },
  { name: '北京邮电大学', shortName: '北邮', province: '北京市', city: '北京市', level: '211', type: '理工', subjects: JSON.stringify(['A+ 信息与通信工程', 'A+ 计算机科学与技术', 'A 电子科学与技术', 'B+ 软件工程', 'B 管理科学与工程']), masterPoints: 28, doctorPoints: 18, employmentRate: 96.5, description: '北京邮电大学是中国信息科技人才的重要培养基地。' },
  { name: '上海财经大学', shortName: '上财', province: '上海市', city: '上海市', level: '211', type: '财经', subjects: JSON.stringify(['A+ 应用经济学', 'A 工商管理', 'A 统计学', 'B+ 理论经济学', 'B+ 马克思主义理论']), masterPoints: 22, doctorPoints: 12, employmentRate: 95.8, description: '上海财经大学是中国历史最为悠久的财经高等学府。' },
  { name: '中央财经大学', shortName: '央财', province: '北京市', city: '北京市', level: '211', type: '财经', subjects: JSON.stringify(['A+ 应用经济学', 'A+ 马克思主义理论', 'B+ 统计学', 'B 工商管理', 'B 公共管理']), masterPoints: 20, doctorPoints: 10, employmentRate: 95.2, description: '中央财经大学是新中国成立后中央人民政府创办的第一所新型高等财经院校。' },
  { name: '对外经济贸易大学', shortName: '贸大', province: '北京市', city: '北京市', level: '211', type: '财经', subjects: JSON.stringify(['A 应用经济学', 'A 工商管理', 'B+ 法学', 'B+ 外国语言文学', 'B 统计学']), masterPoints: 18, doctorPoints: 8, employmentRate: 94.5, description: '对外经济贸易大学是中国历史最悠久的从事对外经济贸易教学与研究的高校。' },
  { name: '北京外国语大学', shortName: '北外', province: '北京市', city: '北京市', level: '211', type: '语言', subjects: JSON.stringify(['A+ 外国语言文学', 'A 中国语言文学', 'B+ 法学', 'B 政治学', 'B 新闻传播学']), masterPoints: 16, doctorPoints: 6, employmentRate: 93.8, description: '北京外国语大学是中国外国语类高等院校中历史悠久、教授语种最多、办学层次齐全的全国重点大学。' },
  { name: '上海外国语大学', shortName: '上外', province: '上海市', city: '上海市', level: '211', type: '语言', subjects: JSON.stringify(['A+ 外国语言文学', 'B+ 政治学', 'B 新闻传播学', 'B 工商管理', 'C+ 教育学']), masterPoints: 15, doctorPoints: 5, employmentRate: 93.2, description: '上海外国语大学是新中国成立后兴办的第一所高等外语学府。' },
  { name: '中国政法大学', shortName: '法大', province: '北京市', city: '北京市', level: '211', type: '政法', subjects: JSON.stringify(['A+ 法学', 'B+ 政治学', 'B+ 马克思主义理论', 'B 社会学', 'B 哲学']), masterPoints: 18, doctorPoints: 8, employmentRate: 92.8, description: '中国政法大学是中国政治学、法学、社会学等学科的重要教学研究中心。' },
  { name: '北京协和医学院', shortName: '协和', province: '北京市', city: '北京市', level: '双一流', type: '医药', subjects: JSON.stringify(['A+ 基础医学', 'A+ 临床医学', 'A+ 药学', 'A 生物学', 'A 护理学']), masterPoints: 12, doctorPoints: 15, employmentRate: 98.0, description: '北京协和医学院是中国最高医学研究机构和最高医学教育机构。' },
  { name: '南京邮电大学', shortName: '南邮', province: '江苏省', city: '南京市', level: '双一流', type: '理工', subjects: JSON.stringify(['A 信息与通信工程', 'B+ 电子科学与技术', 'B+ 计算机科学与技术', 'B 软件工程', 'B 光学工程']), masterPoints: 22, doctorPoints: 12, employmentRate: 94.0, description: '南京邮电大学是中国邮电通信人才培养的重要基地。' },
  { name: '杭州电子科技大学', shortName: '杭电', province: '浙江省', city: '杭州市', level: '普通本科', type: '理工', subjects: JSON.stringify(['B+ 电子科学与技术', 'B+ 计算机科学与技术', 'B 控制科学与工程', 'B 软件工程', 'C+ 信息与通信工程']), masterPoints: 18, doctorPoints: 6, employmentRate: 92.5, description: '杭州电子科技大学是一所电子信息特色突出的教学研究型大学。' },
]

const majors = [
  { name: '计算机科学与技术', code: '080901', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 95.5, avgSalary: 18000, courses: JSON.stringify(['数据结构', '操作系统', '计算机网络', '数据库原理', '编译原理']) },
  { name: '软件工程', code: '080902', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 96.2, avgSalary: 17500, courses: JSON.stringify(['软件工程导论', '需求分析', '软件设计', '软件测试', '项目管理']) },
  { name: '人工智能', code: '080717T', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 97.0, avgSalary: 22000, courses: JSON.stringify(['机器学习', '深度学习', '计算机视觉', '自然语言处理', '强化学习']) },
  { name: '电子信息工程', code: '080701', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 93.8, avgSalary: 14000, courses: JSON.stringify(['电路分析', '模拟电子技术', '数字电子技术', '信号与系统', '通信原理']) },
  { name: '通信工程', code: '080703', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 92.5, avgSalary: 13500, courses: JSON.stringify(['通信原理', '移动通信', '光纤通信', '程控交换', '现代通信网']) },
  { name: '自动化', code: '080801', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 93.2, avgSalary: 13000, courses: JSON.stringify(['自动控制原理', '现代控制理论', '过程控制', '运动控制', '智能控制']) },
  { name: '电气工程及其自动化', code: '080601', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 94.0, avgSalary: 12500, courses: JSON.stringify(['电路理论', '电机学', '电力系统分析', '继电保护', '高电压技术']) },
  { name: '机械工程', code: '080201', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 91.5, avgSalary: 11000, courses: JSON.stringify(['工程力学', '机械设计', '机械原理', '材料力学', '流体力学']) },
  { name: '土木工程', code: '081001', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 90.8, avgSalary: 10500, courses: JSON.stringify(['结构力学', '材料力学', '土力学', '混凝土结构', '钢结构']) },
  { name: '建筑学', code: '082801', category: '工学', subjectRequirements: JSON.stringify(['物理']), employmentRate: 92.0, avgSalary: 12000, courses: JSON.stringify(['建筑设计基础', '建筑史', '建筑构造', '建筑物理', '城市规划']) },
  { name: '金融学', code: '020301K', category: '经济学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 90.5, avgSalary: 15000, courses: JSON.stringify(['货币银行学', '证券投资学', '国际金融', '公司金融', '金融工程']) },
  { name: '经济学', code: '020101', category: '经济学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 88.2, avgSalary: 11500, courses: JSON.stringify(['微观经济学', '宏观经济学', '计量经济学', '政治经济学', '经济思想史']) },
  { name: '国际经济与贸易', code: '020401', category: '经济学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 87.5, avgSalary: 10000, courses: JSON.stringify(['国际贸易理论', '国际贸易实务', '国际结算', '外贸函电', '海关实务']) },
  { name: '财政学', code: '020201K', category: '经济学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 89.0, avgSalary: 9500, courses: JSON.stringify(['财政学', '税收学', '国家预算', '税务筹划', '地方财政']) },
  { name: '会计学', code: '120203K', category: '管理学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 92.8, avgSalary: 11000, courses: JSON.stringify(['基础会计', '中级财务会计', '高级财务会计', '管理会计', '审计学']) },
  { name: '工商管理', code: '120201K', category: '管理学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 88.5, avgSalary: 10500, courses: JSON.stringify(['管理学原理', '市场营销学', '运营管理', '人力资源管理', '战略管理']) },
  { name: '市场营销', code: '120202', category: '管理学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 87.8, avgSalary: 9800, courses: JSON.stringify(['市场营销学', '消费者行为学', '市场调研', '品牌管理', '广告学']) },
  { name: '人力资源管理', code: '120206', category: '管理学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 89.2, avgSalary: 9500, courses: JSON.stringify(['人力资源管理', '组织行为学', '薪酬管理', '绩效管理', '招聘与配置']) },
  { name: '信息管理与信息系统', code: '120102', category: '管理学', subjectRequirements: JSON.stringify(['物理']), employmentRate: 90.5, avgSalary: 10800, courses: JSON.stringify(['管理信息系统', '数据库原理', '系统分析与设计', 'IT项目管理', '企业资源规划']) },
  { name: '法学', code: '030101K', category: '法学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 85.2, avgSalary: 9000, courses: JSON.stringify(['法理学', '宪法学', '民法学', '刑法学', '诉讼法学']) },
  { name: '知识产权', code: '030102T', category: '法学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 86.5, avgSalary: 10500, courses: JSON.stringify(['知识产权法', '专利法', '商标法', '著作权法', '国际知识产权']) },
  { name: '汉语言文学', code: '050101', category: '文学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 86.8, avgSalary: 8500, courses: JSON.stringify(['中国古代文学', '中国现代文学', '外国文学', '文学理论', '现代汉语']) },
  { name: '新闻学', code: '050301', category: '文学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 85.5, avgSalary: 9200, courses: JSON.stringify(['新闻学概论', '传播学概论', '新闻采访', '新闻写作', '新闻编辑']) },
  { name: '英语', code: '050201', category: '文学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 88.2, avgSalary: 9500, courses: JSON.stringify(['综合英语', '英语听力', '英语口语', '英语写作', '翻译理论与实践']) },
  { name: '数学与应用数学', code: '070101', category: '理学', subjectRequirements: JSON.stringify(['物理']), employmentRate: 89.5, avgSalary: 10000, courses: JSON.stringify(['数学分析', '高等代数', '解析几何', '常微分方程', '概率论']) },
  { name: '信息与计算科学', code: '070102', category: '理学', subjectRequirements: JSON.stringify(['物理']), employmentRate: 91.0, avgSalary: 11500, courses: JSON.stringify(['数学分析', '数值分析', '运筹学', '优化理论', '算法设计']) },
  { name: '物理学', code: '070201', category: '理学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 87.2, avgSalary: 9000, courses: JSON.stringify(['理论力学', '热力学与统计物理', '电动力学', '量子力学', '固体物理']) },
  { name: '化学', code: '070301', category: '理学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 86.5, avgSalary: 8800, courses: JSON.stringify(['无机化学', '有机化学', '分析化学', '物理化学', '结构化学']) },
  { name: '生物科学', code: '071001', category: '理学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 85.8, avgSalary: 8500, courses: JSON.stringify(['植物学', '动物学', '微生物学', '遗传学', '分子生物学']) },
  { name: '临床医学', code: '100201K', category: '医学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 92.5, avgSalary: 15000, courses: JSON.stringify(['人体解剖学', '生理学', '病理学', '药理学', '内科学', '外科学']) },
  { name: '口腔医学', code: '100301K', category: '医学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 94.0, avgSalary: 18000, courses: JSON.stringify(['口腔解剖生理学', '口腔组织病理学', '口腔内科学', '口腔外科学', '口腔修复学']) },
  { name: '预防医学', code: '100401K', category: '医学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 90.2, avgSalary: 11000, courses: JSON.stringify(['流行病学', '卫生统计学', '环境卫生学', '营养与食品卫生学', '职业卫生与职业医学']) },
  { name: '药学', code: '100701', category: '医学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 91.5, avgSalary: 10500, courses: JSON.stringify(['药剂学', '药理学', '药物化学', '天然药物化学', '药物分析']) },
  { name: '教育学', code: '040101', category: '教育学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 87.8, avgSalary: 8000, courses: JSON.stringify(['教育学原理', '教育心理学', '课程与教学论', '教育史', '教育研究方法']) },
  { name: '教育技术学', code: '040104', category: '教育学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 88.5, avgSalary: 8500, courses: JSON.stringify(['教育技术学', '教学系统设计', '教育传播学', '多媒体技术', '网络教育应用']) },
  { name: '历史学', code: '060101', category: '历史学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 84.2, avgSalary: 7800, courses: JSON.stringify(['中国古代史', '中国近现代史', '世界史', '史学理论', '历史文选']) },
  { name: '考古学', code: '060103', category: '历史学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 83.5, avgSalary: 8200, courses: JSON.stringify(['考古学概论', '中国考古学', '世界考古学', '考古技术', '文物学']) },
  { name: '哲学', code: '010101', category: '哲学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 82.8, avgSalary: 7500, courses: JSON.stringify(['马克思主义哲学', '中国哲学', '西方哲学', '逻辑学', '伦理学']) },
  { name: '农学', code: '090101', category: '农学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 86.5, avgSalary: 8000, courses: JSON.stringify(['植物生理学', '生物化学', '遗传学', '作物栽培学', '作物育种学']) },
  { name: '园艺', code: '090102', category: '农学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 87.2, avgSalary: 8200, courses: JSON.stringify(['园艺植物栽培学', '园艺植物育种学', '园艺植物病理学', '园艺植物昆虫学', '设施园艺学']) },
  { name: '林学', code: '090201', category: '农学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 85.8, avgSalary: 7800, courses: JSON.stringify(['森林生态学', '森林培育学', '林木遗传育种学', '森林经理学', '森林保护学']) },
  { name: '环境科学', code: '082503', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 88.5, avgSalary: 9500, courses: JSON.stringify(['环境化学', '环境生物学', '环境监测', '环境工程原理', '环境影响评价']) },
  { name: '环境工程', code: '082502', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学', '生物']), employmentRate: 89.2, avgSalary: 10000, courses: JSON.stringify(['水污染控制工程', '大气污染控制工程', '固体废物处理与处置', '环境微生物学', '环境规划']) },
  { name: '材料科学与工程', code: '080401', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 90.5, avgSalary: 10500, courses: JSON.stringify(['材料科学基础', '物理化学', '材料力学性能', '材料物理性能', '材料分析方法']) },
  { name: '高分子材料与工程', code: '080407', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 91.2, avgSalary: 11000, courses: JSON.stringify(['高分子化学', '高分子物理', '高分子材料成型加工', '聚合反应工程', '高分子材料研究方法']) },
  { name: '新能源科学与工程', code: '080503T', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 93.5, avgSalary: 13000, courses: JSON.stringify(['新能源概论', '太阳能利用', '风能利用', '生物质能利用', '储能技术']) },
  { name: '机器人工程', code: '080803T', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 94.2, avgSalary: 15500, courses: JSON.stringify(['机器人学导论', '机器人控制', '机器视觉', '嵌入式系统', '人工智能']) },
  { name: '数据科学与大数据技术', code: '080910T', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 95.8, avgSalary: 18500, courses: JSON.stringify(['数据结构', '数据库原理', '机器学习', '数据挖掘', '大数据分布式计算']) },
  { name: '网络空间安全', code: '080911TK', category: '工学', subjectRequirements: JSON.stringify(['物理', '化学']), employmentRate: 94.8, avgSalary: 17000, courses: JSON.stringify(['密码学', '网络安全', '系统安全', '应用安全', '网络攻防']) },
  { name: '视觉传达设计', code: '130502', category: '艺术学', subjectRequirements: JSON.stringify(['不限']), employmentRate: 87.5, avgSalary: 9000, courses: JSON.stringify(['设计史', '平面构成', '色彩构成', '字体设计', '包装设计']) },
]

const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '山东省', '四川省', '湖北省', '河南省', '河北省']
const years = [2023, 2024, 2025]

function generateAdmissionData(universities: any[], majors: any[]) {
  const scores: any[] = []
  const baseScoreMap: Record<string, number> = {
    '985': 650,
    '211': 600,
    '双一流': 580,
    '普通本科': 500,
  }

  universities.forEach((uni, uniIdx) => {
    const baseScore = baseScoreMap[uni.level] || 500
    const majorCount = Math.min(8, majors.length)
    const selectedMajors = majors.slice(uniIdx % 5, uniIdx % 5 + majorCount)

    selectedMajors.forEach((major, majorIdx) => {
      years.forEach((year) => {
        provinces.forEach((province) => {
          const yearOffset = year === 2023 ? -5 : year === 2024 ? 0 : 5
          const majorOffset = majorIdx * 3
          const randomOffset = Math.floor(Math.random() * 15) - 7

          const minScore = baseScore + yearOffset + majorOffset + randomOffset
          const maxScore = minScore + Math.floor(Math.random() * 30) + 15
          const avgScore = Math.floor((minScore + maxScore) / 2)
          const minRank = Math.floor((750 - minScore) * 150 + Math.random() * 5000)
          const planCount = Math.floor(Math.random() * 10) + 3

          scores.push({
            university_id: uniIdx + 1,
            major_id: majors.indexOf(major) + 1,
            year,
            province,
            min_score: minScore,
            max_score: maxScore,
            avg_score: avgScore,
            min_rank: minRank,
            plan_count: planCount,
          })
        })
      })
    })
  })

  return scores
}

const users = [
  { phone: '13800000001', role: 'student', name: '张明', password_hash: passwordHash, school_name: '北京市第一中学', province: '北京市', relationship: null, expert_certified: 0 },
  { phone: '13800000002', role: 'parent', name: '张父', password_hash: passwordHash, school_name: null, province: '北京市', relationship: '父亲', expert_certified: 0 },
  { phone: '13800000003', role: 'teacher', name: '李老师', password_hash: passwordHash, school_name: '北京市第一中学', province: '北京市', relationship: null, expert_certified: 0 },
  { phone: '13800000004', role: 'expert', name: '王专家', password_hash: passwordHash, school_name: null, province: '北京市', relationship: null, expert_certified: 1 },
  { phone: '13800000005', role: 'admin', name: '管理员', password_hash: passwordHash, school_name: null, province: '北京市', relationship: null, expert_certified: 0 },
]

const studentProfile = {
  user_id: 1,
  score: 650,
  rank: 3200,
  province: '北京市',
  subjects: JSON.stringify(['物理', '化学', '生物']),
  batch: '本科批',
  target_cities: JSON.stringify(['北京市', '上海市', '杭州市']),
}

const assessmentResult = {
  user_id: 1,
  holland_scores: JSON.stringify({ R: 65, I: 78, A: 45, S: 52, E: 58, C: 48 }),
  mbti_type: 'INTJ',
}

const qaQuestions = [
  { user_id: 1, title: '新高考选科物理+化学+生物可以报考哪些专业？', content: '我是高一学生，目前考虑选科物理+化学+生物的组合，想了解这个组合可以报考哪些专业，以及未来的就业方向如何？', category: '选科咨询', status: 'answered', view_count: 1256 },
  { user_id: 1, title: '650分左右可以报考哪些985大学的计算机专业？', content: '我今年高考预估分数在650分左右，省排名大约3000名，想报考计算机相关专业，请问哪些985大学比较合适？', category: '志愿填报', status: 'answered', view_count: 2341 },
  { user_id: 2, title: '如何判断冲稳保的梯度是否合理？', content: '孩子今年高考，在准备志愿方案，想请教一下如何判断冲稳保三个梯队的梯度设置是否合理，有什么判断标准吗？', category: '志愿填报', status: 'pending', view_count: 567 },
]

const qaAnswers = [
  { question_id: 1, user_id: 4, content: '物理+化学+生物是传统的理科组合，这个组合几乎可以报考所有理工科专业。具体包括：1. 工学类：计算机、电子信息、自动化、机械、土木等；2. 理学类：数学、物理、化学、生物等；3. 医学类：临床医学、口腔医学、药学等；4. 农学类各专业。这个组合的就业面非常广，尤其是计算机、电子信息等专业，目前就业前景非常好。', is_expert: 1, like_count: 89 },
  { question_id: 2, user_id: 4, content: '650分左右、省排名3000名报考计算机专业，推荐考虑以下学校：1. 冲：上海交通大学、浙江大学、南京大学（可能需要运气）；2. 稳：北京航空航天大学、同济大学、北京邮电大学、哈尔滨工业大学（深圳）；3. 保：华中科技大学、东南大学、西安交通大学、北京理工大学。建议重点关注北京邮电大学和哈尔滨工业大学深圳校区，性价比非常高。', is_expert: 1, like_count: 156 },
]

const liveSessions = [
  { expert_id: 4, title: '2025年高考志愿填报趋势分析', description: '分析2025年高考志愿填报的新趋势，包括热门专业变化、院校分数线预测、新高考政策解读等。', scheduled_at: '2025-06-10 19:00:00', duration: 90, status: 'scheduled', stream_url: 'https://live.example.com/1', playback_url: 'https://playback.example.com/1' },
  { expert_id: 4, title: '计算机类专业报考全攻略', description: '详细介绍计算机科学与技术、软件工程、人工智能、网络空间安全等专业的区别、院校推荐、就业前景。', scheduled_at: '2025-06-15 20:00:00', duration: 120, status: 'scheduled', stream_url: null, playback_url: null },
  { expert_id: 4, title: '如何科学设置冲稳保梯度', description: '结合历年数据，讲解如何根据分数和位次合理设置志愿冲稳保梯度，降低滑档风险。', scheduled_at: '2025-06-20 19:30:00', duration: 90, status: 'scheduled', stream_url: null, playback_url: null },
]

const liveReservations = [
  { session_id: 1, user_id: 1 },
  { session_id: 1, user_id: 2 },
  { session_id: 2, user_id: 1 },
]

const collaborationSpaces = [
  { owner_id: 1, name: '张明的志愿讨论组', plan_id: 1 },
]

const collaborationMembers = [
  { space_id: 1, user_id: 1, role: 'owner' },
  { space_id: 1, user_id: 2, role: 'parent' },
  { space_id: 1, user_id: 3, role: 'teacher' },
]

const discussionMessages = [
  { space_id: 1, user_id: 1, content: '我想报考计算机专业，大家觉得北航和同济哪个更好？', item_id: null },
  { space_id: 1, user_id: 2, content: '我觉得北航的计算机更好，而且北京的机会也多一些。', item_id: null },
  { space_id: 1, user_id: 3, content: '北航的计算机确实很强，但同济在上海，地理位置也很好。建议考虑未来想在哪发展。', item_id: null },
]

const volunteerPlans = [
  { user_id: 1, name: '我的志愿方案', slip_risk: 15.5, adjustment_risk: 22.3, conflict_warnings: JSON.stringify(['注意检查专业选科要求']) },
]

const planItems = [
  { plan_id: 1, university_id: 7, major_id: 1, order_index: 1, tier: 'reach', probability: 45.5, match_reasons: JSON.stringify(['分数接近', '专业匹配度高', '城市符合偏好']) },
  { plan_id: 1, university_id: 21, major_id: 1, order_index: 2, tier: 'stable', probability: 78.2, match_reasons: JSON.stringify(['分数有优势', '专业实力强', '就业前景好']) },
  { plan_id: 1, university_id: 30, major_id: 2, order_index: 3, tier: 'safe', probability: 92.5, match_reasons: JSON.stringify(['分数充足', '地理位置好', '专业热门']) },
]

const provinceHeatmapData = provinces.map((province, idx) => ({
  province,
  university_id: idx % 10 + 1,
  search_count: Math.floor(Math.random() * 10000) + 1000,
  application_count: Math.floor(Math.random() * 5000) + 500,
  date: '2025-06-01',
}))

function readMigrationFile(): string {
  const migrationPath = path.join(projectRoot, 'migrations', '001_init.sql')
  return fs.readFileSync(migrationPath, 'utf8')
}

function initDatabase(): void {
  console.log('开始初始化数据库...')

  const db = getDatabase()

  try {
    db.exec('BEGIN TRANSACTION')

    console.log('执行数据库迁移...')
    const migrationSql = readMigrationFile()
    db.exec(migrationSql)
    console.log('数据库迁移完成')

    console.log('插入大学数据...')
    const insertUniversity = db.prepare(`
      INSERT INTO universities (name, short_name, province, city, level, type, subjects, master_points, doctor_points, employment_rate, description)
      VALUES (@name, @shortName, @province, @city, @level, @type, @subjects, @masterPoints, @doctorPoints, @employmentRate, @description)
    `)
    const insertManyUniversities = db.transaction((unis: any[]) => {
      for (const uni of unis) insertUniversity.run(uni)
    })
    insertManyUniversities(universities)
    console.log(`插入 ${universities.length} 所大学`)

    console.log('插入专业数据...')
    const insertMajor = db.prepare(`
      INSERT INTO majors (name, code, category, subject_requirements, employment_rate, avg_salary, courses)
      VALUES (@name, @code, @category, @subjectRequirements, @employmentRate, @avgSalary, @courses)
    `)
    const insertManyMajors = db.transaction((mjs: any[]) => {
      for (const mj of mjs) insertMajor.run(mj)
    })
    insertManyMajors(majors)
    console.log(`插入 ${majors.length} 个专业`)

    console.log('生成投档分数数据...')
    const admissionScores = generateAdmissionData(universities, majors)
    const insertScore = db.prepare(`
      INSERT INTO admission_scores (university_id, major_id, year, province, min_score, max_score, avg_score, min_rank, plan_count)
      VALUES (@university_id, @major_id, @year, @province, @min_score, @max_score, @avg_score, @min_rank, @plan_count)
    `)
    const insertManyScores = db.transaction((scores: any[]) => {
      for (const s of scores) insertScore.run(s)
    })
    insertManyScores(admissionScores)
    console.log(`插入 ${admissionScores.length} 条投档分数记录`)

    console.log('插入用户数据...')
    const insertUser = db.prepare(`
      INSERT INTO users (phone, role, name, password_hash, school_name, province, relationship, expert_certified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertManyUsers = db.transaction((usrs: any[]) => {
      for (const u of usrs) insertUser.run(u.phone, u.role, u.name, u.password_hash, u.school_name, u.province, u.relationship, u.expert_certified)
    })
    insertManyUsers(users)
    console.log(`插入 ${users.length} 个用户`)

    console.log('插入学生档案数据...')
    db.prepare(`
      INSERT INTO student_profiles (user_id, score, rank, province, subjects, batch, target_cities)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(studentProfile.user_id, studentProfile.score, studentProfile.rank, studentProfile.province, studentProfile.subjects, studentProfile.batch, studentProfile.target_cities)

    console.log('插入测评结果数据...')
    db.prepare(`
      INSERT INTO assessment_results (user_id, holland_scores, mbti_type)
      VALUES (?, ?, ?)
    `).run(assessmentResult.user_id, assessmentResult.holland_scores, assessmentResult.mbti_type)

    console.log('插入问答数据...')
    const insertQuestion = db.prepare(`
      INSERT INTO qa_questions (user_id, title, content, category, status, view_count)
      VALUES (@user_id, @title, @content, @category, @status, @view_count)
    `)
    const insertManyQuestions = db.transaction((qs: any[]) => {
      for (const q of qs) insertQuestion.run(q)
    })
    insertManyQuestions(qaQuestions)

    const insertAnswer = db.prepare(`
      INSERT INTO qa_answers (question_id, user_id, content, is_expert, like_count)
      VALUES (@question_id, @user_id, @content, @is_expert, @like_count)
    `)
    const insertManyAnswers = db.transaction((as: any[]) => {
      for (const a of as) insertAnswer.run(a)
    })
    insertManyAnswers(qaAnswers)
    console.log(`插入 ${qaQuestions.length} 个问题，${qaAnswers.length} 个回答`)

    console.log('插入直播数据...')
    const insertLive = db.prepare(`
      INSERT INTO live_sessions (expert_id, title, description, scheduled_at, duration, status, stream_url, playback_url)
      VALUES (@expert_id, @title, @description, @scheduled_at, @duration, @status, @stream_url, @playback_url)
    `)
    const insertManyLives = db.transaction((ls: any[]) => {
      for (const l of ls) insertLive.run(l)
    })
    insertManyLives(liveSessions)

    const insertReservation = db.prepare(`
      INSERT INTO live_reservations (session_id, user_id)
      VALUES (@session_id, @user_id)
    `)
    const insertManyReservations = db.transaction((rs: any[]) => {
      for (const r of rs) insertReservation.run(r)
    })
    insertManyReservations(liveReservations)
    console.log(`插入 ${liveSessions.length} 场直播，${liveReservations.length} 个预约`)

    console.log('插入协作空间数据...')
    const insertSpace = db.prepare(`
      INSERT INTO collaboration_spaces (owner_id, name, plan_id)
      VALUES (@owner_id, @name, @plan_id)
    `)
    const insertManySpaces = db.transaction((ss: any[]) => {
      for (const s of ss) insertSpace.run(s)
    })
    insertManySpaces(collaborationSpaces)

    const insertMember = db.prepare(`
      INSERT INTO collaboration_members (space_id, user_id, role)
      VALUES (@space_id, @user_id, @role)
    `)
    const insertManyMembers = db.transaction((ms: any[]) => {
      for (const m of ms) insertMember.run(m)
    })
    insertManyMembers(collaborationMembers)

    const insertMessage = db.prepare(`
      INSERT INTO discussion_messages (space_id, user_id, content)
      VALUES (@space_id, @user_id, @content)
    `)
    const insertManyMessages = db.transaction((msgs: any[]) => {
      for (const m of msgs) insertMessage.run(m)
    })
    insertManyMessages(discussionMessages)
    console.log(`插入 ${collaborationSpaces.length} 个协作空间，${collaborationMembers.length} 个成员，${discussionMessages.length} 条消息`)

    console.log('插入志愿方案数据...')
    const insertPlan = db.prepare(`
      INSERT INTO volunteer_plans (user_id, name, slip_risk, adjustment_risk, conflict_warnings)
      VALUES (@user_id, @name, @slip_risk, @adjustment_risk, @conflict_warnings)
    `)
    const insertManyPlans = db.transaction((ps: any[]) => {
      for (const p of ps) insertPlan.run(p)
    })
    insertManyPlans(volunteerPlans)

    const insertPlanItem = db.prepare(`
      INSERT INTO plan_items (plan_id, university_id, major_id, order_index, tier, probability, match_reasons)
      VALUES (@plan_id, @university_id, @major_id, @order_index, @tier, @probability, @match_reasons)
    `)
    const insertManyPlanItems = db.transaction((items: any[]) => {
      for (const item of items) insertPlanItem.run(item)
    })
    insertManyPlanItems(planItems)
    console.log(`插入 ${volunteerPlans.length} 个志愿方案，${planItems.length} 个志愿项`)

    console.log('插入热力图数据...')
    const insertHeatmap = db.prepare(`
      INSERT INTO province_heatmap (province, university_id, search_count, application_count, date)
      VALUES (@province, @university_id, @search_count, @application_count, @date)
    `)
    const insertManyHeatmaps = db.transaction((hs: any[]) => {
      for (const h of hs) insertHeatmap.run(h)
    })
    insertManyHeatmaps(provinceHeatmapData)
    console.log(`插入 ${provinceHeatmapData.length} 条热力图数据`)

    db.exec('COMMIT')
    console.log('\n数据库初始化完成！')
    console.log(`数据库路径: ${getDatabasePath()}`)
    console.log('\n示例账号（密码均为 123456）：')
    console.log('  考生: 13800000001')
    console.log('  家长: 13800000002')
    console.log('  教师: 13800000003')
    console.log('  专家: 13800000004')
    console.log('  管理员: 13800000005')

    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM universities) as universities,
        (SELECT COUNT(*) FROM majors) as majors,
        (SELECT COUNT(*) FROM admission_scores) as admission_scores,
        (SELECT COUNT(*) FROM users) as users
    `).get() as any
    console.log('\n数据统计：')
    console.log(`  大学数量: ${stats.universities}`)
    console.log(`  专业数量: ${stats.majors}`)
    console.log(`  投档分数记录: ${stats.admission_scores}`)
    console.log(`  用户数量: ${stats.users}`)

  } catch (error) {
    db.exec('ROLLBACK')
    console.error('数据库初始化失败:', error)
    throw error
  } finally {
    closeDatabase()
  }
}

function resetDatabase(): void {
  const dbPath = getDatabasePath()
  if (fs.existsSync(dbPath)) {
    console.log(`删除现有数据库: ${dbPath}`)
    fs.unlinkSync(dbPath)

    const walPath = dbPath + '-wal'
    const shmPath = dbPath + '-shm'
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath)
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath)
  }
  initDatabase()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.includes('--reset')) {
    resetDatabase()
  } else {
    initDatabase()
  }
}

export { initDatabase, resetDatabase }
