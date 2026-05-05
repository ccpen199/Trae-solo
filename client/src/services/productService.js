import api from '../utils/api';

export const productService = {
  getProducts: (params) => {
    return api.get('/products', { params });
  },
  
  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },
  
  getRecommendedProducts: (limit) => {
    return api.get('/products/recommended', { params: { limit } });
  },
  
  getCategories: (params) => {
    return api.get('/products/categories', { params });
  },
  
  getAllCategories: () => {
    return api.get('/products/categories/all');
  },
  
  createProduct: (data) => {
    return api.post('/products', data);
  },
  
  updateProduct: (id, data) => {
    return api.put(`/products/${id}`, data);
  },
  
  deleteProduct: (id) => {
    return api.delete(`/products/${id}`);
  }
};