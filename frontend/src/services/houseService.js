import request from '@/utils/request';

export const houseService = {
  getHouses: async (params = {}) => {
    const response = await request.get('/houses', { params });
    return response.data;
  },

  getHouseDetail: async (id) => {
    const response = await request.get(`/houses/${id}`);
    return response.data;
  },

  createHouse: async (houseData) => {
    const response = await request.post('/houses', houseData);
    return response.data;
  },

  updateHouse: async (id, houseData) => {
    const response = await request.put(`/houses/${id}`, houseData);
    return response.data;
  },

  toggleFavorite: async (id) => {
    const response = await request.post(`/houses/${id}/favorite`);
    return response.data;
  },

  getMyHouses: async (params = {}) => {
    const response = await request.get('/houses/my', { params });
    return response.data;
  },
};
