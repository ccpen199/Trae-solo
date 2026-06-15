const transportData = [
  { type: 'bus', route: 'K1路', departure: '惠州汽车总站', arrival: '惠阳汽车总站', departureTime: '06:30', arrivalTime: '08:15', price: 15, available: true },
  { type: 'bus', route: 'K2路', departure: '惠州火车站', arrival: '大亚湾', departureTime: '07:00', arrivalTime: '09:30', price: 18, available: true },
  { type: 'bus', route: 'K3路', departure: '河南岸汽车站', arrival: '博罗县城', departureTime: '06:45', arrivalTime: '07:50', price: 12, available: true },
  { type: 'train', route: 'C7001', departure: '惠州南站', arrival: '深圳北站', departureTime: '08:00', arrivalTime: '08:55', price: 35, available: true },
  { type: 'train', route: 'C7003', departure: '惠州站', arrival: '广州东站', departureTime: '09:30', arrivalTime: '11:20', price: 55, available: true },
  { type: 'flight', route: 'ZH9001', departure: '惠州平潭机场', arrival: '北京大兴机场', departureTime: '10:00', arrivalTime: '13:15', price: 1280, available: true },
  { type: 'flight', route: 'CZ3002', departure: '惠州平潭机场', arrival: '上海浦东机场', departureTime: '14:30', arrivalTime: '16:50', price: 890, available: false },
];

const cinemaData = [
  { cinemaName: '万达影城（惠州店）', movieTitle: '速度与激情10', startTime: '10:00', endTime: '12:20', hall: '1号激光厅', price: 45, availableSeats: 120 },
  { cinemaName: '万达影城（惠州店）', movieTitle: '流浪地球3', startTime: '13:30', endTime: '16:15', hall: 'IMAX厅', price: 80, availableSeats: 80 },
  { cinemaName: '中影国际影城（华贸店）', movieTitle: '复仇者联盟5', startTime: '11:00', endTime: '13:45', hall: '3号厅', price: 55, availableSeats: 100 },
  { cinemaName: '中影国际影城（华贸店）', movieTitle: '速度与激情10', startTime: '15:00', endTime: '17:20', hall: '2号厅', price: 50, availableSeats: 95 },
  { cinemaName: '金逸影城（港惠店）', movieTitle: '封神第三部', startTime: '14:00', endTime: '16:50', hall: '杜比厅', price: 65, availableSeats: 60 },
];

const jobData = [
  { company: '惠州TCL科技集团', position: '前端开发工程师', salary: '15K-25K', location: '仲恺高新区', requirements: '3年以上React开发经验', postedDate: '2024-01-15' },
  { company: '德赛电池', position: '产品经理', salary: '20K-35K', location: '惠城区', requirements: '5年以上电子产品经验', postedDate: '2024-01-14' },
  { company: '亿纬锂能', position: '电气工程师', salary: '18K-30K', location: '仲恺高新区', requirements: '本科及以上学历，电气相关专业', postedDate: '2024-01-13' },
  { company: '惠州比亚迪', position: '机械设计工程师', salary: '12K-20K', location: '大亚湾', requirements: '熟练使用SolidWorks', postedDate: '2024-01-12' },
  { company: '中海壳牌', position: '工艺工程师', salary: '25K-40K', location: '大亚湾', requirements: '化工专业，5年以上经验', postedDate: '2024-01-11' },
];

const governmentData = [
  { name: '身份证办理', department: '惠州市公安局', description: '首次申领、换领、补领居民身份证', requiredDocs: ['户口簿', '照片回执', '原身份证（换领）'], processTime: '20个工作日', appointmentUrl: 'https://hzga.gov.cn/idcard' },
  { name: '社保查询与办理', department: '惠州市社保局', description: '社保缴费查询、社保卡办理、社保转移', requiredDocs: ['身份证', '社保卡'], processTime: '即时办理', appointmentUrl: 'https://hzsi.gov.cn' },
  { name: '营业执照办理', department: '惠州市市场监督管理局', description: '个体工商户、公司注册登记', requiredDocs: ['身份证', '经营场所证明', '名称核准通知书'], processTime: '3个工作日', appointmentUrl: 'https://hzamr.gov.cn' },
  { name: '公积金提取', department: '惠州市住房公积金管理中心', description: '购房提取、租房提取、退休提取', requiredDocs: ['身份证', '公积金卡', '相关证明材料'], processTime: '3个工作日', appointmentUrl: 'https://hzgjj.gov.cn' },
  { name: '护照办理', department: '惠州市公安局出入境管理支队', description: '普通护照首次申领、换补发', requiredDocs: ['身份证', '照片', '申请表'], processTime: '7个工作日', appointmentUrl: 'https://hzga.gov.cn/entryexit' },
];

export const getTransportServices = async (req, res) => {
  try {
    const { type, keyword } = req.query;
    let data = [...transportData];
    
    if (type) {
      data = data.filter(item => item.type === type);
    }
    if (keyword) {
      data = data.filter(item => 
        item.route.includes(keyword) || 
        item.departure.includes(keyword) || 
        item.arrival.includes(keyword)
      );
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCinemaServices = async (req, res) => {
  try {
    const { keyword } = req.query;
    let data = [...cinemaData];
    
    if (keyword) {
      data = data.filter(item => 
        item.cinemaName.includes(keyword) || 
        item.movieTitle.includes(keyword)
      );
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getJobServices = async (req, res) => {
  try {
    const { keyword } = req.query;
    let data = [...jobData];
    
    if (keyword) {
      data = data.filter(item => 
        item.position.includes(keyword) || 
        item.company.includes(keyword)
      );
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGovernmentServices = async (req, res) => {
  try {
    const { keyword } = req.query;
    let data = [...governmentData];
    
    if (keyword) {
      data = data.filter(item => 
        item.name.includes(keyword) || 
        item.department.includes(keyword)
      );
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
