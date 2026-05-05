const { v4: uuidv4 } = require('uuid');

let departments = [
  { id: 1, name: '技术部', manager: '张三', description: '负责公司技术研发', parentId: null, status: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: '产品部', manager: '李四', description: '负责产品规划和设计', parentId: null, status: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: '市场部', manager: '王五', description: '负责市场营销推广', parentId: null, status: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: '人事部', manager: '赵六', description: '负责人事管理', parentId: null, status: 1, createdAt: new Date(), updatedAt: new Date() },
];

let employees = [
  { id: 1, employeeNo: 'EMP2026050001', name: '张三', gender: 1, birthDate: '1990-01-15', idCard: '110101199001150011', phone: '13800138001', email: 'zhangsan@example.com', address: '北京市朝阳区', employeeType: 1, departmentId: 1, position: '高级工程师', permissionLevel: 2, entryDate: '2020-03-15', status: 1, resignDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, employeeNo: 'EMP2026050002', name: '李四', gender: 1, birthDate: '1992-05-20', idCard: '110101199205200022', phone: '13800138002', email: 'lisi@example.com', address: '北京市海淀区', employeeType: 1, departmentId: 2, position: '产品经理', permissionLevel: 2, entryDate: '2021-06-20', status: 1, resignDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, employeeNo: 'EMP2026050003', name: '王五', gender: 2, birthDate: '1995-08-10', idCard: '110101199508100033', phone: '13800138003', email: 'wangwu@example.com', address: '北京市西城区', employeeType: 1, departmentId: 3, position: '市场专员', permissionLevel: 1, entryDate: '2022-01-10', status: 2, resignDate: '2026-04-01', createdAt: new Date(), updatedAt: new Date() },
];

let educations = [];
let familyMembers = [];
let workExperiences = [];
let projectExperiences = [];
let trainingRecords = [];

let nextId = {
  departments: 5,
  employees: 4,
  educations: 1,
  familyMembers: 1,
  workExperiences: 1,
  projectExperiences: 1,
  trainingRecords: 1,
};

function getNextId(type) {
  return nextId[type]++;
}

function findDepartmentById(id) {
  return departments.find(d => d.id === parseInt(id));
}

function findEmployeeById(id) {
  const emp = employees.find(e => e.id === parseInt(id));
  if (emp) {
    const dept = findDepartmentById(emp.departmentId);
    return { ...emp, department: dept };
  }
  return null;
}

function findEmployeeByNo(employeeNo) {
  const emp = employees.find(e => e.employeeNo === employeeNo);
  if (emp) {
    const dept = findDepartmentById(emp.departmentId);
    return { ...emp, department: dept };
  }
  return null;
}

function generateEmployeeNo() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const seq = String(employees.filter(e => e.employeeNo.startsWith(`EMP${year}${month}`)).length + 1).padStart(4, '0');
  return `EMP${year}${month}${seq}`;
}

module.exports = {
  departments,
  employees,
  educations,
  familyMembers,
  workExperiences,
  projectExperiences,
  trainingRecords,
  getNextId,
  findDepartmentById,
  findEmployeeById,
  findEmployeeByNo,
  generateEmployeeNo,
};
