package com.guizhou.platform.auth.service.impl;

import com.guizhou.platform.auth.config.JwtConfig;
import com.guizhou.platform.auth.dto.TokenVO;
import com.guizhou.platform.auth.service.TokenService;
import com.guizhou.platform.auth.vo.UserInfoVO;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class TokenServiceImpl implements TokenService {

    @Resource
    private JwtConfig jwtConfig;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    private static final String BLACKLIST_PREFIX = "auth:blacklist:";
    private static final String REFRESH_PREFIX = "auth:refresh:";

    @Override
    public TokenVO generateToken(Long userId, String username, UserInfoVO userInfo) {
        long now = System.currentTimeMillis();
        Date accessTokenExpiry = new Date(now + jwtConfig.getAccessTokenExpire() * 1000);
        Date refreshTokenExpiry = new Date(now + jwtConfig.getRefreshTokenExpire() * 1000);

        SecretKey key = getSigningKey();

        String accessToken = Jwts.builder()
                .subject(String.valueOf(userId))
                .issuer(jwtConfig.getIssuer())
                .issuedAt(new Date(now))
                .expiration(accessTokenExpiry)
                .claim("username", username)
                .claim("type", "access")
                .signWith(key)
                .compact();

        String refreshToken = Jwts.builder()
                .subject(String.valueOf(userId))
                .issuer(jwtConfig.getIssuer())
                .issuedAt(new Date(now))
                .expiration(refreshTokenExpiry)
                .claim("username", username)
                .claim("type", "refresh")
                .signWith(key)
                .compact();

        redisTemplate.opsForValue().set(
                REFRESH_PREFIX + userId,
                refreshToken,
                jwtConfig.getRefreshTokenExpire(),
                TimeUnit.SECONDS
        );

        return TokenVO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getAccessTokenExpire())
                .scope("all")
                .loginTime(LocalDateTime.now())
                .userInfo(userInfo)
                .build();
    }

    @Override
    public TokenVO refreshToken(String refreshToken) {
        try {
            Claims claims = parseToken(refreshToken);
            String type = claims.get("type", String.class);
            if (!"refresh".equals(type)) {
                throw new BusinessException(ResultCode.TOKEN_INVALID, "无效的刷新令牌");
            }

            Long userId = Long.parseLong(claims.getSubject());
            String username = claims.get("username", String.class);

            Object storedRefreshToken = redisTemplate.opsForValue().get(REFRESH_PREFIX + userId);
            if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
                throw new BusinessException(ResultCode.TOKEN_INVALID, "刷新令牌已失效");
            }

            return generateToken(userId, username, null);
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ResultCode.TOKEN_EXPIRED, "刷新令牌已过期");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("刷新令牌异常", e);
            throw new BusinessException(ResultCode.TOKEN_INVALID, "刷新令牌无效");
        }
    }

    @Override
    public boolean validateAccessToken(String accessToken) {
        if (isTokenBlacklisted(accessToken)) {
            return false;
        }
        try {
            Claims claims = parseToken(accessToken);
            String type = claims.get("type", String.class);
            return "access".equals(type);
        } catch (ExpiredJwtException e) {
            return false;
        } catch (Exception e) {
            log.error("验证访问令牌异常", e);
            return false;
        }
    }

    @Override
    public boolean isTokenBlacklisted(String accessToken) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + accessToken));
    }

    @Override
    public void addTokenToBlacklist(String accessToken) {
        try {
            Claims claims = parseToken(accessToken);
            long expireAt = claims.getExpiration().getTime();
            long now = System.currentTimeMillis();
            long ttlSeconds = (expireAt - now) / 1000;
            if (ttlSeconds > 0) {
                redisTemplate.opsForValue().set(
                        BLACKLIST_PREFIX + accessToken,
                        "1",
                        ttlSeconds,
                        TimeUnit.SECONDS
                );
            }

            String userId = claims.getSubject();
            redisTemplate.delete(REFRESH_PREFIX + userId);
        } catch (ExpiredJwtException e) {
            log.debug("Token已过期，无需加入黑名单");
        } catch (Exception e) {
            log.error("加入Token黑名单异常", e);
        }
    }

    @Override
    public Long getUserIdFromToken(String accessToken) {
        Claims claims = parseToken(accessToken);
        return Long.parseLong(claims.getSubject());
    }

    @Override
    public String getUsernameFromToken(String accessToken) {
        Claims claims = parseToken(accessToken);
        return claims.get("username", String.class);
    }

    private Claims parseToken(String token) {
        SecretKey key = getSigningKey();
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
