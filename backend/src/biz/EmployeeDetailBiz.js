const EmployeeDetailDAL = require('../dal/EmployeeDetailDAL');
const EmployeeDAL = require('../dal/EmployeeDAL');

class EmployeeDetailBiz {
  constructor() {
    this.employeeDetailDAL = new EmployeeDetailDAL();
    this.employeeDAL = new EmployeeDAL();
  }

  async getEmployeeFullDetails(employeeId, employeeNo) {
    if (!employeeId && !employeeNo) {
      return {
        success: false,
        message: '员工ID或员工编号不能为空',
      };
    }

    let employee = null;
    if (employeeId) {
      employee = await this.employeeDAL.findById(employeeId);
    } else if (employeeNo) {
      employee = await this.employeeDAL.findByEmployeeNo(employeeNo);
    }

    if (!employee) {
      return {
        success: false,
        message: '员工不存在',
      };
    }

    const details = await this.employeeDetailDAL.getEmployeeFullDetails(
      employee.id,
      employee.employeeNo
    );

    return {
      success: true,
      data: {
        employee,
        ...details,
      },
    };
  }

  async createEducation(data) {
    if (!data.employeeId && !data.employeeNo) {
      return {
        success: false,
        message: '员工ID或员工编号不能为空',
      };
    }
    if (!data.school || !data.school.trim()) {
      return {
        success: false,
        message: '学校名称不能为空',
      };
    }

    const item = await this.employeeDetailDAL.createEducation({
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      school: data.school.trim(),
      major: data.major || null,
      degree: data.degree || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
    });

    return {
      success: true,
      data: item,
      message: '创建教育经历成功',
    };
  }

  async createFamilyMember(data) {
    if (!data.employeeId && !data.employeeNo) {
      return {
        success: false,
        message: '员工ID或员工编号不能为空',
      };
    }
    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: '成员姓名不能为空',
      };
    }

    const item = await this.employeeDetailDAL.createFamilyMember({
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      name: data.name.trim(),
      relation: data.relation || null,
      gender: data.gender ? parseInt(data.gender) : 1,
      birthDate: data.birthDate || null,
      phone: data.phone || null,
      address: data.address || null,
      workUnit: data.workUnit || null,
    });

    return {
      success: true,
      data: item,
      message: '创建家庭成员成功',
    };
  }

  async createWorkExperience(data) {
    if (!data.employeeId && !data.employeeNo) {
      return {
        success: false,
        message: '员工ID或员工编号不能为空',
      };
    }
    if (!data.company || !data.company.trim()) {
      return {
        success: false,
        message: '公司名称不能为空',
      };
    }

    const item = await this.employeeDetailDAL.createWorkExperience({
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      company: data.company.trim(),
      position: data.position || null,
      department: data.department || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
    });

    return {
      success: true,
      data: item,
      message: '创建工作经验成功',
    };
  }

  async createProjectExperience(data) {
    if (!data.employeeId && !data.employeeNo) {
      return {
        success: false,
        message: '员工ID或员工编号不能为空',
      };
    }
    if (!data.projectName || !data.projectName.trim()) {
      return {
        success: false,
        message: '项目名称不能为空',
      };
    }

    const item = await this.employeeDetailDAL.createProjectExperience({
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      projectName: data.projectName.trim(),
      role: data.role || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      techStack: data.techStack || null,
    });

    return {
      success: true,
      data: item,
      message: '创建项目经验成功',
    };
  }

  async createTrainingRecord(data) {
    if (!data.employeeId && !data.employeeNo) {
      return {
        success: false,
        message: '员工ID或员工编号不能为空',
      };
    }
    if (!data.trainingName || !data.trainingName.trim()) {
      return {
        success: false,
        message: '培训名称不能为空',
      };
    }

    const item = await this.employeeDetailDAL.createTrainingRecord({
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      trainingName: data.trainingName.trim(),
      trainingType: data.trainingType || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      organization: data.organization || null,
      duration: data.duration ? parseInt(data.duration) : null,
      result: data.result || null,
      certificate: data.certificate || null,
    });

    return {
      success: true,
      data: item,
      message: '创建培训记录成功',
    };
  }

  async updateDetail(type, id, data) {
    if (!id) {
      return {
        success: false,
        message: 'ID不能为空',
      };
    }

    const updateMethods = {
      education: this.employeeDetailDAL.updateEducation.bind(this.employeeDetailDAL),
      familyMember: this.employeeDetailDAL.updateFamilyMember.bind(this.employeeDetailDAL),
      workExperience: this.employeeDetailDAL.updateWorkExperience.bind(this.employeeDetailDAL),
      projectExperience: this.employeeDetailDAL.updateProjectExperience.bind(this.employeeDetailDAL),
      trainingRecord: this.employeeDetailDAL.updateTrainingRecord.bind(this.employeeDetailDAL),
    };

    const method = updateMethods[type];
    if (!method) {
      return {
        success: false,
        message: '不支持的类型',
      };
    }

    const updated = await method(id, data);
    if (!updated) {
      return {
        success: false,
        message: '记录不存在',
      };
    }

    return {
      success: true,
      data: updated,
      message: '更新成功',
    };
  }

  async deleteDetail(type, id) {
    if (!id) {
      return {
        success: false,
        message: 'ID不能为空',
      };
    }

    const deleteMethods = {
      education: this.employeeDetailDAL.deleteEducation.bind(this.employeeDetailDAL),
      familyMember: this.employeeDetailDAL.deleteFamilyMember.bind(this.employeeDetailDAL),
      workExperience: this.employeeDetailDAL.deleteWorkExperience.bind(this.employeeDetailDAL),
      projectExperience: this.employeeDetailDAL.deleteProjectExperience.bind(this.employeeDetailDAL),
      trainingRecord: this.employeeDetailDAL.deleteTrainingRecord.bind(this.employeeDetailDAL),
    };

    const method = deleteMethods[type];
    if (!method) {
      return {
        success: false,
        message: '不支持的类型',
      };
    }

    const deleted = await method(id);
    if (!deleted) {
      return {
        success: false,
        message: '记录不存在',
      };
    }

    return {
      success: true,
      message: '删除成功',
    };
  }
}

module.exports = EmployeeDetailBiz;
