const EmployeeDAL = require('../dal/EmployeeDAL');

class EmployeeBiz {
  constructor() {
    this.employeeDAL = new EmployeeDAL();
  }

  async getEmployeeList(options = {}) {
    const { page = 1, pageSize = 20, keyword, status, departmentId } = options;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const result = await this.employeeDAL.findAll({
      keyword,
      status: status !== undefined ? parseInt(status) : undefined,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      offset,
      limit,
    });

    return {
      success: true,
      data: {
        list: result.rows,
        total: result.count,
        page: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(result.count / limit),
      },
    };
  }

  async getEmployeeById(id) {
    if (!id) {
      return {
        success: false,
        message: '员工ID不能为空',
      };
    }

    const employee = await this.employeeDAL.findById(id);
    if (!employee) {
      return {
        success: false,
        message: '员工不存在',
      };
    }

    return {
      success: true,
      data: employee,
    };
  }

  async createEmployee(data) {
    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: '员工姓名不能为空',
      };
    }

    const employeeNo = data.employeeNo || await this.employeeDAL.generateEmployeeNo();

    const employee = await this.employeeDAL.create({
      employeeNo,
      name: data.name.trim(),
      gender: data.gender ? parseInt(data.gender) : 1,
      birthDate: data.birthDate || null,
      idCard: data.idCard || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      employeeType: data.employeeType ? parseInt(data.employeeType) : 1,
      departmentId: data.departmentId ? parseInt(data.departmentId) : null,
      position: data.position || null,
      permissionLevel: data.permissionLevel ? parseInt(data.permissionLevel) : 1,
      entryDate: data.entryDate || null,
      status: data.status !== undefined ? parseInt(data.status) : 1,
      resignDate: data.resignDate || null,
    });

    return {
      success: true,
      data: employee,
      message: '创建员工成功',
    };
  }

  async updateEmployee(id, data) {
    if (!id) {
      return {
        success: false,
        message: '员工ID不能为空',
      };
    }

    const existingEmployee = await this.employeeDAL.findById(id);
    if (!existingEmployee) {
      return {
        success: false,
        message: '员工不存在',
      };
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.gender !== undefined) updateData.gender = parseInt(data.gender);
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.idCard !== undefined) updateData.idCard = data.idCard;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.employeeType !== undefined) updateData.employeeType = parseInt(data.employeeType);
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId ? parseInt(data.departmentId) : null;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.permissionLevel !== undefined) updateData.permissionLevel = parseInt(data.permissionLevel);
    if (data.entryDate !== undefined) updateData.entryDate = data.entryDate;
    if (data.status !== undefined) updateData.status = parseInt(data.status);
    if (data.resignDate !== undefined) updateData.resignDate = data.resignDate;

    const updated = await this.employeeDAL.update(id, updateData);

    return {
      success: true,
      data: updated,
      message: '更新员工成功',
    };
  }

  async updateEmployeeStatus(id, status, resignDate = null) {
    if (!id) {
      return {
        success: false,
        message: '员工ID不能为空',
      };
    }

    const existingEmployee = await this.employeeDAL.findById(id);
    if (!existingEmployee) {
      return {
        success: false,
        message: '员工不存在',
      };
    }

    const updateData = {
      status: parseInt(status),
    };

    if (parseInt(status) === 2) {
      updateData.resignDate = resignDate || new Date().toISOString().split('T')[0];
    }

    const updated = await this.employeeDAL.update(id, updateData);

    const statusText = {
      1: '在职',
      2: '离职',
      3: '休假',
    };

    return {
      success: true,
      data: updated,
      message: `员工状态已变更为${statusText[status] || '未知'}`,
    };
  }

  async deleteEmployee(id) {
    if (!id) {
      return {
        success: false,
        message: '员工ID不能为空',
      };
    }

    const employee = await this.employeeDAL.findById(id);
    if (!employee) {
      return {
        success: false,
        message: '员工不存在',
      };
    }

    const deleted = await this.employeeDAL.delete(id);
    if (!deleted) {
      return {
        success: false,
        message: '删除失败',
      };
    }

    return {
      success: true,
      message: '删除员工成功',
    };
  }
}

module.exports = EmployeeBiz;
