package com.fooddelivery.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fooddelivery.dto.CommonResponse;
import com.fooddelivery.entity.SysUser;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.mapper.SysUserMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SysUserMapper sysUserMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    @PostMapping("/login")
    public CommonResponse.Result<LoginResult> login(@RequestBody LoginRequest request) {
        log.info("用户登录请求: username={}", request.getUsername());
        
        SysUser user = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, request.getUsername())
                .eq(SysUser::getDeleted, 0)
        );

        if (user == null) {
            return CommonResponse.Result.error("用户不存在");
        }

        if (user.getStatus() != 1) {
            return CommonResponse.Result.error("用户已被禁用");
        }

        String token = generateToken(user);
        
        LoginResult result = new LoginResult();
        result.setToken(token);
        result.setExpireTime(System.currentTimeMillis() + jwtExpiration);

        log.info("用户登录成功: username={}, role={}", user.getUsername(), RoleType.fromCode(user.getRoleType()).getName());
        return CommonResponse.Result.success(result);
    }

    @PostMapping("/logout")
    public CommonResponse.Result<Null> logout(HttpServletRequest request) {
        log.info("用户登出");
        return CommonResponse.Result.success();
    }

    @GetMapping("/userinfo")
    public CommonResponse.Result<UserInfoResult> getUserInfo(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                var claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
                
                Long userId = claims.get("userId", Long.class);
                SysUser user = sysUserMapper.selectById(userId);
                
                if (user != null) {
                    UserInfoResult result = new UserInfoResult();
                    result.setId(user.getId());
                    result.setUsername(user.getUsername());
                    result.setNickname(user.getNickname());
                    result.setPhone(user.getPhone());
                    result.setAvatar(user.getAvatar());
                    result.setRoleType(user.getRoleType());
                    result.setRoleName(RoleType.fromCode(user.getRoleType()).getName());
                    result.setMerchantId(user.getMerchantId());
                    result.setStoreId(user.getStoreId());
                    return CommonResponse.Result.success(result);
                }
            } catch (Exception e) {
                log.warn("Token解析失败", e);
            }
        }
        return CommonResponse.Result.error(401, "未授权");
    }

    private String generateToken(SysUser user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("username", user.getUsername());
        claims.put("roleType", user.getRoleType());
        claims.put("storeId", user.getStoreId());
        claims.put("merchantId", user.getMerchantId());

        return Jwts.builder()
            .claims(claims)
            .subject(user.getUsername())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact();
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class LoginResult {
        private String token;
        private Long expireTime;
    }

    @Data
    public static class UserInfoResult {
        private Long id;
        private String username;
        private String nickname;
        private String phone;
        private String avatar;
        private Integer roleType;
        private String roleName;
        private Long merchantId;
        private Long storeId;
        private String storeName;
    }
}
