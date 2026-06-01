import request from '../utils/request'

export const checkWhitelist = (phone) => request.post('/whitelist/check', { phone })

export const register = (data) => request.post('/user/register', data)

export const getUserInfo = () => request.get('/user/info')

export const getCommissionOverview = () => request.get('/commission/overview')

export const getEnterpriseInfo = () => request.get('/credit/enterprise')

export const verifyEnterprise = (data) => request.post('/credit/verify-enterprise', data)

export const signAuth = () => request.post('/credit/sign-auth')

export const getBankInfo = () => request.get('/bank/info')

export const bindBank = (data) => request.post('/bank/bind', data)

export const sendVerifyCode = (mobile) => request.post('/bank/send-code', { mobile })

export const checkAdvance = (data) => request.post('/advance/check', data)

export const submitAdvance = (data) => request.post('/advance/apply', data)

export const getAdvanceList = () => request.get('/advance/list')
