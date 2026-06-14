import { http, HttpResponse } from 'msw';
import CryptoJS from 'crypto-js';
import {
  mockUserInfo,
  mockRoutes,
  mockButtons,
  successResponse,
  errorResponse,
} from '../data/mockData';
import type { LoginParams, SendSmsParams, CaptchaData, SmsData, LoginLogData } from '../../api/auth';

const tokens = new Map<string, string>();
const smsCodes = new Map<string, { code: string; expires: number }>();
const captchaStore = new Map<string, { code: string; expires: number }>();
const loginLogs: LoginLogData[] = [];

const generateCaptcha = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSvgCaptcha = (code: string): string => {
  const width = 120;
  const height = 40;
  const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#1e293b" rx="8"/>`;
  
  for (let i = 0; i < 8; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.3"/>`;
  }
  
  for (let i = 0; i < 30; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    svg += `<circle cx="${cx}" cy="${cy}" r="1" fill="${color}" opacity="0.4"/>`;
  }
  
  const chars = code.split('');
  chars.forEach((char, i) => {
    const x = 20 + i * 25;
    const y = 28 + (Math.random() - 0.5) * 8;
    const rotate = (Math.random() - 0.5) * 20;
    const color = colors[Math.floor(Math.random() * colors.length)];
    svg += `<text x="${x}" y="${y}" font-size="24" font-weight="bold" fill="${color}" transform="rotate(${rotate} ${x} ${y})" style="font-family: Arial, sans-serif;">${char}</text>`;
  });
  
  svg += '</svg>';
  return svg;
};

export const authHandlers = [
  http.get('/api/auth/captcha', async ({ request }) => {
    const url = new URL(request.url);
    const captchaId = url.searchParams.get('id') || CryptoJS.MD5(Date.now().toString()).toString();
    const code = generateCaptcha();
    const expires = Date.now() + 5 * 60 * 1000;
    
    captchaStore.set(captchaId, { code, expires });
    
    const svg = generateSvgCaptcha(code);
    
    return HttpResponse.json(
      successResponse<CaptchaData>({
        captchaId,
        captchaImage: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))),
        expiresIn: 300,
      })
    );
  }),

  http.post('/api/auth/sms/send', async ({ request }) => {
    const body = (await request.json()) as SendSmsParams;
    const { phone, type, captchaId, captcha } = body;

    if (!phone) {
      return HttpResponse.json(errorResponse(400, '手机号不能为空'));
    }

    if (!captchaId || !captcha) {
      return HttpResponse.json(errorResponse(400, '请先完成图形验证码验证'));
    }

    const storedCaptcha = captchaStore.get(captchaId);
    if (!storedCaptcha || Date.now() > storedCaptcha.expires) {
      captchaStore.delete(captchaId);
      return HttpResponse.json(errorResponse(400, '图形验证码已过期，请刷新'));
    }
    if (storedCaptcha.code.toLowerCase() !== captcha.toLowerCase()) {
      return HttpResponse.json(errorResponse(400, '图形验证码错误'));
    }

    captchaStore.delete(captchaId);

    const smsCode = type === 'login' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    smsCodes.set(phone, { code: smsCode, expires });

    return HttpResponse.json(
      successResponse<SmsData>({
        smsId: CryptoJS.MD5(phone + Date.now()).toString(),
        expiresIn: 300,
      }),
      type === 'login' ? '验证码已发送，测试验证码：123456' : '验证码已发送'
    );
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginParams;
    const { username, password, captchaId, captcha, smsCode, phone } = body;

    if (!username || !password) {
      return HttpResponse.json(errorResponse(400, '用户名和密码不能为空'));
    }

    if (!captchaId || !captcha) {
      return HttpResponse.json(errorResponse(400, '请输入图形验证码'));
    }

    const storedCaptcha = captchaStore.get(captchaId);
    if (!storedCaptcha || Date.now() > storedCaptcha.expires) {
      captchaStore.delete(captchaId);
      return HttpResponse.json(errorResponse(400, '图形验证码已过期，请刷新'));
    }
    if (storedCaptcha.code.toLowerCase() !== captcha.toLowerCase()) {
      return HttpResponse.json(errorResponse(400, '图形验证码错误'));
    }

    if (!smsCode || !phone) {
      return HttpResponse.json(errorResponse(400, '请输入短信验证码'));
    }

    if (phone === '13800138000' && smsCode === '123456') {
      // auto-pass for quick login
    } else {
      const storedSms = smsCodes.get(phone);
      if (!storedSms || Date.now() > storedSms.expires) {
        smsCodes.delete(phone);
        return HttpResponse.json(errorResponse(400, '短信验证码已过期'));
      }
      if (storedSms.code !== smsCode) {
        return HttpResponse.json(errorResponse(400, '短信验证码错误'));
      }
    }

    const encryptedPassword = CryptoJS.MD5('123456').toString();
    const inputEncrypted = CryptoJS.MD5(password).toString();

    if (username === 'admin' && inputEncrypted === encryptedPassword) {
      const token = 'mock-token-' + Date.now();
      tokens.set(token, username);
      captchaStore.delete(captchaId);
      smsCodes.delete(phone);

      const lastLogin = loginLogs.length > 0 ? loginLogs[loginLogs.length - 1] : null;

      const loginLog: LoginLogData = {
        id: CryptoJS.MD5(Date.now().toString()).toString(),
        userId: '1',
        username: 'admin',
        ip: '192.168.1.100',
        location: '山东省济南市历下区',
        device: 'Chrome / MacOS',
        loginTime: new Date().toISOString(),
        status: 'success',
      };
      loginLogs.push(loginLog);

      return HttpResponse.json(
        successResponse(
          {
            token,
            userInfo: mockUserInfo,
            lastLogin: lastLogin
              ? {
                  time: lastLogin.loginTime,
                  ip: lastLogin.ip,
                  location: lastLogin.location,
                  device: lastLogin.device,
                }
              : null,
          },
          '登录成功'
        )
      );
    }

    return HttpResponse.json(errorResponse(401, '用户名或密码错误'));
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      tokens.delete(token);
    }
    return HttpResponse.json(successResponse(null, '退出成功'));
  }),

  http.put('/api/auth/password', async ({ request }) => {
    const body = await request.json();
    const { oldPassword, newPassword } = body as { oldPassword: string; newPassword: string };

    if (!oldPassword || !newPassword) {
      return HttpResponse.json(errorResponse(400, '原密码和新密码不能为空'));
    }

    const encryptedOld = CryptoJS.MD5('123456').toString();
    const inputOld = CryptoJS.MD5(oldPassword).toString();

    if (inputOld !== encryptedOld) {
      return HttpResponse.json(errorResponse(400, '原密码错误'));
    }

    return HttpResponse.json(successResponse(null, '密码修改成功'));
  }),

  http.get('/api/auth/userinfo', () => {
    return HttpResponse.json(successResponse(mockUserInfo));
  }),

  http.get('/api/auth/permissions', () => {
    return HttpResponse.json(
      successResponse({
        routes: mockRoutes,
        buttons: mockButtons,
      })
    );
  }),
];
