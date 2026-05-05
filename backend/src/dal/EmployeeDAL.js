const store = require('../data/store');

class EmployeeDAL {
  async findAll(options = {}) {
    const { keyword, status, departmentId, offset = 0, limit = 20 } = options;
    
    let filtered = [...store.employees];

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(kw) ||
        e.employeeNo.toLowerCase().includes(kw) ||
        (e.phone && e.phone.includes(kw))
      );
    }

    if (status !== undefined) {
      filtered = filtered.filter(e => e.status === parseInt(status));
    }

    if (departmentId) {
      filtered = filtered.filter(e => e.departmentId === parseInt(departmentId));
    }

    const total = filtered.length;
    const rows = filtered.slice(offset, offset + limit).map(e => ({
      ...e,
      department: store.findDepartmentById(e.departmentId),
    }));

    return { rows, count: total };
  }

  async findById(id) {
    return store.findEmployeeById(id);
  }

  async findByEmployeeNo(employeeNo) {
    return store.findEmployeeByNo(employeeNo);
  }

  async create(data) {
    const newEmp = {
      id: store.getNextId('employees'),
      employeeNo: data.employeeNo || store.generateEmployeeNo(),
      name: data.name,
      gender: data.gender || 1,
      birthDate: data.birthDate || null,
      idCard: data.idCard || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      employeeType: data.employeeType || 1,
      departmentId: data.departmentId || null,
      position: data.position || null,
      permissionLevel: data.permissionLevel || 1,
      entryDate: data.entryDate || null,
      status: data.status !== undefined ? data.status : 1,
      resignDate: data.resignDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.employees.push(newEmp);
    return newEmp;
  }

  async update(id, data) {
    const index = store.employees.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    
    store.employees[index] = {
      ...store.employees[index],
      ...data,
      updatedAt: new Date(),
    };
    return store.employees[index];
  }

  async delete(id) {
    const index = store.employees.findIndex(e => e.id === parseInt(id));
    if (index === -1) return false;
    
    store.employees.splice(index, 1);
    return true;
  }

  async generateEmployeeNo() {
    return store.generateEmployeeNo();
  }
}

module.exports = EmployeeDAL;
