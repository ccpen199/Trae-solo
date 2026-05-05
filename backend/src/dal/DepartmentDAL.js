const store = require('../data/store');

class DepartmentDAL {
  async findAll() {
    return [...store.departments];
  }

  async findById(id) {
    return store.findDepartmentById(id);
  }

  async findByName(name, excludeId = null) {
    return store.departments.find(d => 
      d.name === name && (excludeId ? d.id !== parseInt(excludeId) : true)
    );
  }

  async create(data) {
    const newDept = {
      id: store.getNextId('departments'),
      name: data.name,
      manager: data.manager || null,
      description: data.description || null,
      parentId: data.parentId || null,
      status: data.status !== undefined ? data.status : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.departments.push(newDept);
    return newDept;
  }

  async update(id, data) {
    const index = store.departments.findIndex(d => d.id === parseInt(id));
    if (index === -1) return null;
    
    store.departments[index] = {
      ...store.departments[index],
      ...data,
      updatedAt: new Date(),
    };
    return store.departments[index];
  }

  async delete(id) {
    const index = store.departments.findIndex(d => d.id === parseInt(id));
    if (index === -1) return false;
    
    store.departments.splice(index, 1);
    return true;
  }
}

module.exports = DepartmentDAL;
