const DepartmentDAL = require('../dal/DepartmentDAL');

class DepartmentBiz {
  constructor() {
    this.departmentDAL = new DepartmentDAL();
  }

  async getDepartmentList() {
    const departments = await this.departmentDAL.findAll();
    return {
      success: true,
      data: departments,
    };
  }

  async getDepartmentById(id) {
    if (!id) {
      return {
        success: false,
        message: '部门ID不能为空',
      };
    }

    const department = await this.departmentDAL.findById(id);
    if (!department) {
      return {
        success: false,
        message: '部门不存在',
      };
    }

    return {
      success: true,
      data: department,
    };
  }

  async createDepartment(data) {
    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: '部门名称不能为空',
      };
    }

    const existingDepartment = await this.departmentDAL.findByName(data.name.trim());
    if (existingDepartment) {
      return {
        success: false,
        message: '部门名称已存在',
      };
    }

    const department = await this.departmentDAL.create({
      name: data.name.trim(),
      manager: data.manager || null,
      description: data.description || null,
      parentId: data.parentId || null,
      status: data.status !== undefined ? data.status : 1,
    });

    return {
      success: true,
      data: department,
      message: '创建部门成功',
    };
  }

  async updateDepartment(id, data) {
    if (!id) {
      return {
        success: false,
        message: '部门ID不能为空',
      };
    }

    const existingDepartment = await this.departmentDAL.findById(id);
    if (!existingDepartment) {
      return {
        success: false,
        message: '部门不存在',
      };
    }

    if (data.name && data.name.trim()) {
      const duplicateDepartment = await this.departmentDAL.findByName(data.name.trim(), id);
      if (duplicateDepartment) {
        return {
          success: false,
          message: '部门名称已存在',
        };
      }
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.manager !== undefined) updateData.manager = data.manager;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.departmentDAL.update(id, updateData);

    return {
      success: true,
      data: updated,
      message: '更新部门成功',
    };
  }

  async deleteDepartment(id) {
    if (!id) {
      return {
        success: false,
        message: '部门ID不能为空',
      };
    }

    const department = await this.departmentDAL.findById(id);
    if (!department) {
      return {
        success: false,
        message: '部门不存在',
      };
    }

    const deleted = await this.departmentDAL.delete(id);
    if (!deleted) {
      return {
        success: false,
        message: '删除失败',
      };
    }

    return {
      success: true,
      message: '删除部门成功',
    };
  }
}

module.exports = DepartmentBiz;
