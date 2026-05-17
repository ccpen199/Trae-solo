import api, { setToken, getUser, setUser, removeToken, removeUser } from './index';

export const selectRole = (role, phone) => {
  return api.post('/users/select-role', { role, phone });
};

export const getProfile = () => {
  return api.get('/users/profile');
};

export const updateProfile = (data) => {
  return api.put('/users/profile', data);
};

export const toggleOnline = () => {
  return api.post('/users/toggle-online');
};

export const getOnlineTeachers = () => {
  return api.get('/teachers/online');
};

export { setToken, getUser, setUser, removeToken, removeUser };
