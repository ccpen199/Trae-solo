const db = require('./src/models/database');

const sampleListings = [
  {
    title: '精装两室一厅 近地铁 拎包入住',
    description: '房屋位于市中心，交通便利，周边配套齐全。房屋精装修，家具家电齐全，拎包即可入住。',
    price_min: 3500,
    price_unit: '月',
    category_id: 2,
    category_code: 'rent',
    city: '上海市',
    district: '浦东新区',
    area: 75,
    rooms: 2,
    bathrooms: 1,
    is_verified: 1
  },
  {
    title: '高薪诚聘 Java 开发工程师',
    description: '岗位职责：负责公司核心系统开发与维护。要求：3年以上Java开发经验，熟悉Spring Boot、MySQL等。',
    price_min: 25000,
    price_max: 40000,
    category_id: 1,
    category_code: 'job',
    job_title: 'Java开发工程师',
    job_salary_min: 25000,
    job_salary_max: 40000,
    job_experience: '3-5年',
    job_education: '本科',
    city: '上海市'
  },
  {
    title: '2020款 特斯拉 Model 3 标准续航',
    description: '个人一手车，车况良好，无事故，定期4S店保养。续航里程468km，支持快充。',
    price_min: 168000,
    category_id: 4,
    category_code: 'car',
    car_brand: '特斯拉',
    car_model: 'Model 3',
    car_year: 2020,
    car_mileage: 3.5,
    city: '上海市'
  },
  {
    title: '专业搬家服务 省心省力',
    description: '提供专业搬家、装卸、搬运服务。经验丰富，价格透明，损坏包赔。全市均可服务。',
    price_min: 200,
    price_unit: '次',
    category_id: 5,
    category_code: 'service',
    service_type: 'moving',
    service_hours: '全天',
    city: '上海市',
    is_verified: 1
  },
  {
    title: '徐汇区 优质学区房 三室两厅',
    description: '对口重点小学，小区环境优美，物业管理完善。房屋南北通透，采光好。',
    price_min: 6800000,
    category_id: 3,
    category_code: 'house',
    city: '上海市',
    district: '徐汇区',
    area: 120,
    rooms: 3,
    bathrooms: 2,
    is_verified: 1,
    is_urgent: 1
  }
];

const insertListing = db.prepare(`
  INSERT INTO listings (
    user_id, category_id, category_code, title, description,
    price_min, price_max, price_unit, city, district,
    area, rooms, bathrooms,
    car_brand, car_model, car_year, car_mileage,
    job_title, job_salary_min, job_salary_max, job_experience, job_education,
    service_type, service_hours,
    is_verified, is_urgent, view_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleListings.forEach(listing => {
  insertListing.run(
    1,
    listing.category_id, listing.category_code, listing.title, listing.description,
    listing.price_min, listing.price_max, listing.price_unit, listing.city, listing.district,
    listing.area, listing.rooms, listing.bathrooms,
    listing.car_brand, listing.car_model, listing.car_year, listing.car_mileage,
    listing.job_title, listing.job_salary_min, listing.job_salary_max, listing.job_experience, listing.job_education,
    listing.service_type, listing.service_hours,
    listing.is_verified || 0, listing.is_urgent || 0, Math.floor(Math.random() * 100)
  );
});

console.log('Sample data inserted successfully!');
