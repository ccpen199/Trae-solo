import request from './index';

export const getExams = (params) => {
  return request.get('/exams', { params });
};

export const getExam = (id) => {
  return request.get(`/exams/${id}`);
};

export const getExamAnnouncements = (params) => {
  return request.get('/exam-announcements', { params });
};

export const createExamRegistration = (data) => {
  return request.post('/exam-registrations', data);
};

export const getExamRegistrations = () => {
  return request.get('/exam-registrations');
};

export const payExamRegistration = (id) => {
  return request.post(`/exam-registrations/${id}/pay`);
};

export const getAdmissionTicket = (id) => {
  return request.get(`/admission-tickets/${id}`);
};

export const getExamResults = () => {
  return request.get('/exam-results');
};

export const verifyCertificate = (params) => {
  return request.get('/certificate-verify', { params });
};

export const getCertificates = (params) => {
  return request.get('/certificates', { params });
};

export const getExamOverview = () => {
  return request.get('/exam/overview');
};
