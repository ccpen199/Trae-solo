package com.retail.admin.interceptor;

import com.retail.common.exception.BusinessException;
import com.retail.common.result.ResultCode;
import com.retail.common.utils.JwtUtils;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String TOKEN_PREFIX = "Bearer ";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authorization = request.getHeader(HEADER_AUTHORIZATION);
        if (!StringUtils.hasText(authorization) || !authorization.startsWith(TOKEN_PREFIX)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        String token = authorization.substring(TOKEN_PREFIX.length());
        try {
            Claims claims = JwtUtils.parseToken(token);
            request.setAttribute("userId", claims.get("userId"));
            request.setAttribute("orgId", claims.get("orgId"));
            request.setAttribute("username", claims.get("username"));
            request.setAttribute("dataScope", claims.get("dataScope"));
        } catch (Exception e) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        return true;
    }
}
