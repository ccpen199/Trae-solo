import request from './index';

export const getJobs = (params) => {
  return request.get('/jobs', { params });
};

export const getRecommendedJobs = (params) => {
  return request.get('/jobs/recommended', { params });
};

export const getJob = (id) => {
  return request.get(`/jobs/${id}`);
};

export const applyJob = (id, data) => {
  return request.post(`/jobs/${id}/apply`, data);
};

export const getMyResume = () => {
  return request.get('/resumes/me');
};

export const saveResume = (data) => {
  return request.post('/resumes', data);
};

export const getJobApplications = () => {
  return request.get('/job-applications');
};

export const getJobFairs = (params) => {
  return request.get('/job-fairs', { params });
};

export const registerFair = (id, data) => {
  return request.post(`/job-fairs/${id}/register`, data);
};

export const getTrainingCourses = (params) => {
  return request.get('/training-courses', { params });
};

export const getTrainingCourse = (id) => {
  return request.get(`/training-courses/${id}`);
};

export const enrollCourse = (id, data) => {
  return request.post(`/training-courses/${id}/enroll`, data);
};

export const getMyTrainings = () => {
  return request.get('/my-trainings');
};

export const getEmploymentOverview = () => {
  return request.get('/employment/overview');
};
