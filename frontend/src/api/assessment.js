import api from './client';

export const getQuestions = (limit = 5) => {
  return api.get('/assessment/questions', { params: { limit } });
};

export const submitAssessment = (answers) => {
  return api.post('/assessment/submit', { answers });
};

export const getHistory = () => {
  return api.get('/assessment/history');
};
