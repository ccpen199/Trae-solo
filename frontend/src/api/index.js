import request from '@/utils/request'

// 用户管理
export function getUsers(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

export function getUserById(id) {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

export function resetPassword(id, data) {
  return request({
    url: `/users/${id}/reset-password`,
    method: 'post',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

export function getRoles() {
  return request({
    url: '/users/roles',
    method: 'get'
  })
}

export const userApi = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRoles,
  list: getUsers,
  get: getUserById,
  create: createUser,
  update: updateUser,
  delete: deleteUser
}

// 系别管理
export function getDepartments(params) {
  return request({
    url: '/departments',
    method: 'get',
    params
  })
}

export function getDepartmentById(id) {
  return request({
    url: `/departments/${id}`,
    method: 'get'
  })
}

export function createDepartment(data) {
  return request({
    url: '/departments',
    method: 'post',
    data
  })
}

export function updateDepartment(id, data) {
  return request({
    url: `/departments/${id}`,
    method: 'put',
    data
  })
}

export function deleteDepartment(id) {
  return request({
    url: `/departments/${id}`,
    method: 'delete'
  })
}

export const departmentApi = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  list: getDepartments,
  get: getDepartmentById,
  create: createDepartment,
  update: updateDepartment,
  delete: deleteDepartment
}

// 班级管理
export function getClasses(params) {
  return request({
    url: '/classes',
    method: 'get',
    params
  })
}

export function getClassById(id) {
  return request({
    url: `/classes/${id}`,
    method: 'get'
  })
}

export function createClass(data) {
  return request({
    url: '/classes',
    method: 'post',
    data
  })
}

export function updateClass(id, data) {
  return request({
    url: `/classes/${id}`,
    method: 'put',
    data
  })
}

export function deleteClass(id) {
  return request({
    url: `/classes/${id}`,
    method: 'delete'
  })
}

export const classApi = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  list: getClasses,
  get: getClassById,
  create: createClass,
  update: updateClass,
  delete: deleteClass
}

// 学生管理
export function getStudents(params) {
  return request({
    url: '/students',
    method: 'get',
    params
  })
}

export function getStudentById(id) {
  return request({
    url: `/students/${id}`,
    method: 'get'
  })
}

export function createStudent(data) {
  return request({
    url: '/students',
    method: 'post',
    data
  })
}

export function updateStudent(id, data) {
  return request({
    url: `/students/${id}`,
    method: 'put',
    data
  })
}

export function deleteStudent(id) {
  return request({
    url: `/students/${id}`,
    method: 'delete'
  })
}

export const studentApi = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  list: getStudents,
  get: getStudentById,
  create: createStudent,
  update: updateStudent,
  delete: deleteStudent
}

// 课程管理
export function getCourses(params) {
  return request({
    url: '/courses',
    method: 'get',
    params
  })
}

export function getCourseById(id) {
  return request({
    url: `/courses/${id}`,
    method: 'get'
  })
}

export function createCourse(data) {
  return request({
    url: '/courses',
    method: 'post',
    data
  })
}

export function updateCourse(id, data) {
  return request({
    url: `/courses/${id}`,
    method: 'put',
    data
  })
}

export function deleteCourse(id) {
  return request({
    url: `/courses/${id}`,
    method: 'delete'
  })
}

export const courseApi = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  list: getCourses,
  get: getCourseById,
  create: createCourse,
  update: updateCourse,
  delete: deleteCourse
}

// 成绩管理
export function getGrades(params) {
  return request({
    url: '/grades',
    method: 'get',
    params
  })
}

export function getGradeById(id) {
  return request({
    url: `/grades/${id}`,
    method: 'get'
  })
}

export function createGrade(data) {
  return request({
    url: '/grades',
    method: 'post',
    data
  })
}

export function updateGrade(id, data) {
  return request({
    url: `/grades/${id}`,
    method: 'put',
    data
  })
}

export function deleteGrade(id, data) {
  return request({
    url: `/grades/${id}`,
    method: 'delete',
    data
  })
}

export function batchCreateGrade(data) {
  return request({
    url: '/grades/batch',
    method: 'post',
    data
  })
}

export function getMyGrades(params) {
  return request({
    url: '/grades/my',
    method: 'get',
    params
  })
}

export function getGradeStatistics(params) {
  return request({
    url: '/grades/statistics',
    method: 'get',
    params
  })
}

export const gradeApi = {
  getGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  batchCreate: batchCreateGrade,
  getMyGrades,
  getGradeStatistics,
  list: getGrades,
  get: getGradeById,
  create: createGrade,
  update: updateGrade,
  delete: deleteGrade,
  my: getMyGrades,
  statistics: getGradeStatistics
}
