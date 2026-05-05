const store = require('../data/store');

class EmployeeDetailDAL {
  async getEmployeeFullDetails(employeeId, employeeNo) {
    let empId = employeeId;
    if (!empId && employeeNo) {
      const emp = store.findEmployeeByNo(employeeNo);
      if (emp) empId = emp.id;
    }

    const [educations, familyMembers, workExperiences, projectExperiences, trainingRecords] = await Promise.all([
      this.findEducationsByEmployee(empId, employeeNo),
      this.findFamilyMembersByEmployee(empId, employeeNo),
      this.findWorkExperiencesByEmployee(empId, employeeNo),
      this.findProjectExperiencesByEmployee(empId, employeeNo),
      this.findTrainingRecordsByEmployee(empId, employeeNo),
    ]);

    return {
      educations,
      familyMembers,
      workExperiences,
      projectExperiences,
      trainingRecords,
    };
  }

  async findEducationsByEmployee(employeeId, employeeNo) {
    return store.educations.filter(e => 
      (employeeId && e.employeeId === parseInt(employeeId)) ||
      (employeeNo && e.employeeNo === employeeNo)
    );
  }

  async findFamilyMembersByEmployee(employeeId, employeeNo) {
    return store.familyMembers.filter(e => 
      (employeeId && e.employeeId === parseInt(employeeId)) ||
      (employeeNo && e.employeeNo === employeeNo)
    );
  }

  async findWorkExperiencesByEmployee(employeeId, employeeNo) {
    return store.workExperiences.filter(e => 
      (employeeId && e.employeeId === parseInt(employeeId)) ||
      (employeeNo && e.employeeNo === employeeNo)
    );
  }

  async findProjectExperiencesByEmployee(employeeId, employeeNo) {
    return store.projectExperiences.filter(e => 
      (employeeId && e.employeeId === parseInt(employeeId)) ||
      (employeeNo && e.employeeNo === employeeNo)
    );
  }

  async findTrainingRecordsByEmployee(employeeId, employeeNo) {
    return store.trainingRecords.filter(e => 
      (employeeId && e.employeeId === parseInt(employeeId)) ||
      (employeeNo && e.employeeNo === employeeNo)
    );
  }

  async createEducation(data) {
    const item = {
      id: store.getNextId('educations'),
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      school: data.school,
      major: data.major || null,
      degree: data.degree || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.educations.push(item);
    return item;
  }

  async createFamilyMember(data) {
    const item = {
      id: store.getNextId('familyMembers'),
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      name: data.name,
      relation: data.relation || null,
      gender: data.gender || 1,
      birthDate: data.birthDate || null,
      phone: data.phone || null,
      address: data.address || null,
      workUnit: data.workUnit || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.familyMembers.push(item);
    return item;
  }

  async createWorkExperience(data) {
    const item = {
      id: store.getNextId('workExperiences'),
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      company: data.company,
      position: data.position || null,
      department: data.department || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.workExperiences.push(item);
    return item;
  }

  async createProjectExperience(data) {
    const item = {
      id: store.getNextId('projectExperiences'),
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      projectName: data.projectName,
      role: data.role || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      description: data.description || null,
      techStack: data.techStack || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.projectExperiences.push(item);
    return item;
  }

  async createTrainingRecord(data) {
    const item = {
      id: store.getNextId('trainingRecords'),
      employeeId: data.employeeId,
      employeeNo: data.employeeNo,
      trainingName: data.trainingName,
      trainingType: data.trainingType || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      organization: data.organization || null,
      duration: data.duration || null,
      result: data.result || null,
      certificate: data.certificate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.trainingRecords.push(item);
    return item;
  }

  async updateEducation(id, data) {
    const index = store.educations.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    store.educations[index] = { ...store.educations[index], ...data, updatedAt: new Date() };
    return store.educations[index];
  }

  async updateFamilyMember(id, data) {
    const index = store.familyMembers.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    store.familyMembers[index] = { ...store.familyMembers[index], ...data, updatedAt: new Date() };
    return store.familyMembers[index];
  }

  async updateWorkExperience(id, data) {
    const index = store.workExperiences.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    store.workExperiences[index] = { ...store.workExperiences[index], ...data, updatedAt: new Date() };
    return store.workExperiences[index];
  }

  async updateProjectExperience(id, data) {
    const index = store.projectExperiences.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    store.projectExperiences[index] = { ...store.projectExperiences[index], ...data, updatedAt: new Date() };
    return store.projectExperiences[index];
  }

  async updateTrainingRecord(id, data) {
    const index = store.trainingRecords.findIndex(e => e.id === parseInt(id));
    if (index === -1) return null;
    store.trainingRecords[index] = { ...store.trainingRecords[index], ...data, updatedAt: new Date() };
    return store.trainingRecords[index];
  }

  async deleteEducation(id) {
    const index = store.educations.findIndex(e => e.id === parseInt(id));
    if (index === -1) return false;
    store.educations.splice(index, 1);
    return true;
  }

  async deleteFamilyMember(id) {
    const index = store.familyMembers.findIndex(e => e.id === parseInt(id));
    if (index === -1) return false;
    store.familyMembers.splice(index, 1);
    return true;
  }

  async deleteWorkExperience(id) {
    const index = store.workExperiences.findIndex(e => e.id === parseInt(id));
    if (index === -1) return false;
    store.workExperiences.splice(index, 1);
    return true;
  }

  async deleteProjectExperience(id) {
    const index = store.projectExperiences.findIndex(e => e.id === parseInt(id));
    if (index === -1) return false;
    store.projectExperiences.splice(index, 1);
    return true;
  }

  async deleteTrainingRecord(id) {
    const index = store.trainingRecords.findIndex(e => e.id === parseInt(id));
    if (index === -1) return false;
    store.trainingRecords.splice(index, 1);
    return true;
  }

  async clearByEmployeeId(employeeId) {
    store.educations = store.educations.filter(e => e.employeeId !== parseInt(employeeId));
    store.familyMembers = store.familyMembers.filter(e => e.employeeId !== parseInt(employeeId));
    store.workExperiences = store.workExperiences.filter(e => e.employeeId !== parseInt(employeeId));
    store.projectExperiences = store.projectExperiences.filter(e => e.employeeId !== parseInt(employeeId));
    store.trainingRecords = store.trainingRecords.filter(e => e.employeeId !== parseInt(employeeId));
  }
}

module.exports = EmployeeDetailDAL;
