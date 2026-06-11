package com.guizhou.platform.auth.service;

import com.guizhou.platform.auth.dto.LoginRequest;
import com.guizhou.platform.auth.dto.LoginResponse;
import com.guizhou.platform.auth.dto.RefreshTokenRequest;
import com.guizhou.platform.auth.dto.TokenVO;
import com.guizhou.platform.auth.vo.UserInfoVO;

public interface AuthService {

    LoginResponse login(LoginRequest request, String ipAddress, String userAgent);

    TokenVO refreshToken(RefreshTokenRequest request);

    void logout(String accessToken);

    void sendSmsCode(String phone, String bizType);

    UserInfoVO getCurrentUserInfo();
}
