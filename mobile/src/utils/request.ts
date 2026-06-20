import Taro from '@tarojs/taro';

const BASE_URL = process.env.TARO_APP_API_BASE || 'http://localhost:3002/api';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  loading?: boolean;
  loadingText?: string;
}

export const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {}, loading = false, loadingText = '加载中...' } = options;

  if (loading) {
    Taro.showLoading({ title: loadingText, mask: true });
  }

  const token = Taro.getStorageSync('authToken');
  const finalHeader: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...header,
  };

  try {
    const res = await Taro.request({
      url: BASE_URL + url,
      method,
      data,
      header: finalHeader,
    });

    if (loading) Taro.hideLoading();

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const result = res.data as any;
      if (result.code === 0 || result.code === 200) {
        return result.data as T;
      } else {
        Taro.showToast({ title: result.message || '请求失败', icon: 'none' });
        console.error('[Request] 业务错误:', url, result);
        throw new Error(result.message || '业务错误');
      }
    } else if (res.statusCode === 401) {
      Taro.removeStorageSync('authToken');
      Taro.navigateTo({ url: '/pages/login/index' });
      throw new Error('未授权');
    } else {
      Taro.showToast({ title: `HTTP ${res.statusCode}`, icon: 'none' });
      console.error('[Request] HTTP错误:', url, res.statusCode);
      throw new Error(`HTTP ${res.statusCode}`);
    }
  } catch (err: any) {
    if (loading) Taro.hideLoading();
    console.error('[Request] 网络错误:', url, err);
    throw err;
  }
};

export default request;
