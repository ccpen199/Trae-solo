package com.guizhou.platform.auth.controller;

import com.guizhou.platform.auth.dto.LoginRequest;
import com.guizhou.platform.auth.dto.LoginResponse;
import com.guizhou.platform.auth.dto.RefreshTokenRequest;
import com.guizhou.platform.auth.dto.SmsCodeRequest;
import com.guizhou.platform.auth.dto.TokenVO;
import com.guizhou.platform.auth.service.AuthService;
import com.guizhou.platform.auth.service.UserService;
import com.guizhou.platform.auth.vo.UserInfoVO;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.auth.security.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "统一身份认证", description = "登录/登出/刷新Token/发送验证码/获取当前用户信息")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Resource
    private AuthService authService;

    @Resource
    private UserService userService;

    @Operation(summary = "统一登录", description = "支持密码/短信/人脸/微信/支付宝五种登录方式")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        return Result.success(authService.login(request, ipAddress, userAgent));
    }

    @Operation(summary = "登出")
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String authorization) {
        authService.logout(authorization);
        return Result.success();
    }

    @Operation(summary = "刷新Token")
    @PostMapping("/refresh-token")
    public Result<TokenVO> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return Result.success(authService.refreshToken(request));
    }

    @Operation(summary = "发送短信验证码")
    @PostMapping("/sms-code")
    public Result<Void> sendSmsCode(@Valid @RequestBody SmsCodeRequest request) {
        authService.sendSmsCode(request.getPhone(), request.getBizType());
        return Result.success();
    }

    @Operation(summary = "获取当前登录用户信息")
    @GetMapping("/current-user")
    public Result<UserInfoVO> getCurrentUser() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.error("未登录");
        }
        return Result.success(userService.getUserInfo(userId));
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
