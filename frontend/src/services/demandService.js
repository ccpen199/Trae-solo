import request from '@/utils/request';

export const demandService = {
  createDemand: async (demandData) => {
    const response = await request.post('/demands', demandData);
    return response.data;
  },

  getDemands: async (params = {}) => {
    const response = await request.get('/demands', { params });
    return response.data;
  },

  getDemandDetail: async (id) => {
    const response = await request.get(`/demands/${id}`);
    return response.data;
  },

  getMyDemands: async (params = {}) => {
    const response = await request.get('/demands/my', { params });
    return response.data;
  },

  updateDemandStatus: async (id, status) => {
    const response = await request.put(`/demands/${id}/status`, { status });
    return response.data;
  },
};