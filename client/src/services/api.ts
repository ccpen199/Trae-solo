import request from '../utils/request';

export const login = (params?: any) => request.post<any, any>('/user/login', params);
export const getProfile = () => request.get<any, any>('/user/profile');
export const updateProfile = (data: any) => request.put<any, any>('/user/profile', data);

export const getCheckinStatus = () => request.get<any, any>('/user/checkin/status');
export const doCheckin = () => request.post<any, any>('/user/checkin');

export const uploadSteps = (steps: number, source = 'healthkit') =>
  request.post<any, any>('/user/steps', { steps, source });
export const getTodaySteps = () => request.get<any, any>('/user/steps/today');
export const claimStepReward = () => request.post<any, any>('/user/steps/claim');
export const getStepRecords = (page = 1, pageSize = 30) =>
  request.get<any, any>('/user/steps/records', { params: { page, pageSize } });

export const reportVideoWatch = (videoId: string, duration: number, watchDuration: number) =>
  request.post<any, any>('/user/video/watch', { videoId, duration, watchDuration });
export const getVideoStats = () => request.get<any, any>('/user/video/stats');

export const getInviteStats = () => request.get<any, any>('/user/invite/stats');

export const getTaskList = () => request.get<any, any[]>('/task/list');
export const completeTask = (taskId: number, extra?: any) =>
  request.post<any, any>(`/task/${taskId}/complete`, extra);
export const claimTaskReward = (taskId: number) =>
  request.post<any, any>(`/task/${taskId}/claim`);

export const getCoinRecords = (page = 1, pageSize = 20) =>
  request.get<any, any>('/coin/records', { params: { page, pageSize } });
export const getExchangeRate = () => request.get<any, any>('/coin/exchange-rate');
export const exchangeCoins = (coinAmount: number) =>
  request.post<any, any>('/coin/exchange', { coinAmount });

export const createWithdrawal = (amount: number, channel = 'wechat') =>
  request.post<any, any>('/withdrawal', { amount, channel });
export const getWithdrawalList = (page = 1, pageSize = 20) =>
  request.get<any, any>('/withdrawal', { params: { page, pageSize } });
export const getWithdrawalDetail = (id: number) =>
  request.get<any, any>(`/withdrawal/${id}`);

export const getAdConfigs = () => request.get<any, any[]>('/ad/configs');
export const reportAdImpression = (id: number) => request.post<any, any>(`/ad/${id}/impression`);
export const reportAdClick = (id: number, revenue?: number) =>
  request.post<any, any>(`/ad/${id}/click`, { revenue });
