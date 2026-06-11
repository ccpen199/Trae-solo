package com.guizhou.platform.auth.service;

import com.guizhou.platform.auth.dto.TokenVO;
import com.guizhou.platform.auth.vo.UserInfoVO;

public interface TokenService {

    TokenVO generateToken(Long userId, String username, UserInfoVO userInfo);

    TokenVO refreshToken(String refreshToken);

    boolean validateAccessToken(String accessToken);

    boolean isTokenBlacklisted(String accessToken);

    void addTokenToBlacklist(String accessToken);

    Long getUserIdFromToken(String accessToken);

    String getUsernameFromToken(String accessToken);
}
