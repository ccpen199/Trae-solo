import request from '../utils/request';

export const getMyCards = () => request.get('/card/my-cards');
export const applyCard = (data) => request.post('/card/apply-card', data);
export const getQRCode = (cardId) => request.get(`/card/qrcode/${cardId}`);
export const scanGate = (data) => request.post('/card/scan-gate', data);
export const recharge = (data) => request.post('/card/recharge', data);
export const getRenewalCards = () => request.get('/card/renewal/apply');
export const applyRenewal = (data) => request.post('/card/renewal/apply', data);
export const getRenewalList = () => request.get('/card/renewal/list');
export const getTransactions = (params) => request.get('/card/transactions', { params });
export const getPaymentChannels = () => request.get('/card/payment-channels');
export const addPaymentChannel = (data) => request.post('/card/payment-channels', data);
