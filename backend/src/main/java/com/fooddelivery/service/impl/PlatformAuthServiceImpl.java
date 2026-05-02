package com.fooddelivery.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fooddelivery.entity.PlatformAuth;
import com.fooddelivery.entity.Store;
import com.fooddelivery.enums.AuditSource;
import com.fooddelivery.enums.PlatformType;
import com.fooddelivery.mapper.PlatformAuthMapper;
import com.fooddelivery.mapper.StoreMapper;
import com.fooddelivery.service.AuditLogService;
import com.fooddelivery.service.PlatformAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformAuthServiceImpl implements PlatformAuthService {

    private final PlatformAuthMapper platformAuthMapper;
    private final StoreMapper storeMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditLogService auditLogService;

    @Value("${system.config.callback-base-url}")
    private String callbackBaseUrl;

    @Value("${order.aggregation.platforms.meituan.callback-path}")
    private String meituanCallbackPath;

    @Value("${order.aggregation.platforms.eleme.callback-path}")
    private String elemeCallbackPath;

    private static final String AUTH_STATE_PREFIX = "auth:state:";
    private static final int STATE_EXPIRE_MINUTES = 30;

    @Override
    public String generateAuthUrl(Long storeId, PlatformType platformType) {
        log.info("生成授权URL: storeId={}, platform={}", storeId, platformType.getName());
        
        Store store = storeMapper.selectById(storeId);
        if (store == null) {
            throw new RuntimeException("店铺不存在");
        }

        String state = IdUtil.simpleUUID();
        String stateKey = AUTH_STATE_PREFIX + state;
        redisTemplate.opsForValue().set(stateKey, storeId + ":" + platformType.getCode(), 
            STATE_EXPIRE_MINUTES, TimeUnit.MINUTES);

        String authUrl;
        String callbackPath = platformType == PlatformType.MEITUAN ? meituanCallbackPath : elemeCallbackPath;
        String redirectUri = callbackBaseUrl + callbackPath;

        switch (platformType) {
            case MEITUAN:
                authUrl = "https://waimai.meituan.com/openapi/oauth/authorize" +
                    "?response_type=code" +
                    "&client_id=meituan_app_id" +
                    "&redirect_uri=" + redirectUri +
                    "&state=" + state +
                    "&scope=all";
                break;
            case ELEME:
                authUrl = "https://open-api.shop.ele.me/authorize" +
                    "?response_type=code" +
                    "&client_id=eleme_app_id" +
                    "&redirect_uri=" + redirectUri +
                    "&state=" + state +
                    "&scope=all";
                break;
            default:
                throw new RuntimeException("不支持的平台类型");
        }

        auditLogService.logCreate(
            "PLATFORM_AUTH",
            null,
            null,
            null,
            "MERCHANT",
            AuditSource.MERCHANT_PORTAL,
            "生成" + platformType.getName() + "授权URL, state=" + state
        );

        return authUrl;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformAuth handleCallback(Long storeId, PlatformType platformType, String code, String state) {
        log.info("处理平台授权回调: storeId={}, platform={}, code={}", 
                storeId, platformType.getName(), code);

        String stateKey = AUTH_STATE_PREFIX + state;
        Object cachedValue = redisTemplate.opsForValue().get(stateKey);
        if (cachedValue == null) {
            throw new RuntimeException("授权状态已过期或无效");
        }

        String accessToken = "mock_access_token_" + IdUtil.simpleUUID();
        String refreshToken = "mock_refresh_token_" + IdUtil.simpleUUID();
        LocalDateTime expireTime = LocalDateTime.now().plusDays(30);

        PlatformAuth existingAuth = getAuthByStoreAndPlatform(storeId, platformType.getCode());
        
        if (existingAuth != null) {
            existingAuth.setAccessToken(accessToken);
            existingAuth.setRefreshToken(refreshToken);
            existingAuth.setExpireTime(expireTime);
            existingAuth.setAuthStatus(1);
            platformAuthMapper.updateById(existingAuth);
            
            auditLogService.logUpdate(
                "PLATFORM_AUTH",
                existingAuth.getId(),
                null,
                null,
                "SYSTEM",
                AuditSource.PLATFORM_CALLBACK,
                "更新" + platformType.getName() + "授权, code=" + code
            );
            
            return existingAuth;
        } else {
            PlatformAuth newAuth = new PlatformAuth();
            newAuth.setStoreId(storeId);
            newAuth.setPlatformType(platformType.getCode());
            newAuth.setPlatformStoreId("mock_store_" + storeId);
            newAuth.setPlatformStoreName("模拟店铺");
            newAuth.setAppId("mock_app_id");
            newAuth.setAppSecret("mock_app_secret");
            newAuth.setAccessToken(accessToken);
            newAuth.setRefreshToken(refreshToken);
            newAuth.setExpireTime(expireTime);
            newAuth.setAuthStatus(1);
            platformAuthMapper.insert(newAuth);

            auditLogService.logCreate(
                "PLATFORM_AUTH",
                newAuth.getId(),
                null,
                null,
                "SYSTEM",
                AuditSource.PLATFORM_CALLBACK,
                "新建" + platformType.getName() + "授权, code=" + code
            );

            return newAuth;
        }
    }

    @Override
    public PlatformAuth getAuthByStoreAndPlatform(Long storeId, Integer platformType) {
        return platformAuthMapper.selectOne(
            new LambdaQueryWrapper<PlatformAuth>()
                .eq(PlatformAuth::getStoreId, storeId)
                .eq(PlatformAuth::getPlatformType, platformType)
                .eq(PlatformAuth::getDeleted, 0)
        );
    }

    @Override
    public List<PlatformAuth> getAuthsByStore(Long storeId) {
        return platformAuthMapper.selectList(
            new LambdaQueryWrapper<PlatformAuth>()
                .eq(PlatformAuth::getStoreId, storeId)
                .eq(PlatformAuth::getDeleted, 0)
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean refreshToken(Long authId) {
        PlatformAuth auth = platformAuthMapper.selectById(authId);
        if (auth == null) {
            return false;
        }

        String newAccessToken = "mock_access_token_" + IdUtil.simpleUUID();
        LocalDateTime newExpireTime = LocalDateTime.now().plusDays(30);

        auth.setAccessToken(newAccessToken);
        auth.setExpireTime(newExpireTime);
        platformAuthMapper.updateById(auth);

        auditLogService.logUpdate(
            "PLATFORM_AUTH",
            authId,
            null,
            null,
            "SYSTEM",
            AuditSource.SYSTEM_AUTO,
            "刷新Token, authId=" + authId
        );

        log.info("Token刷新成功: authId={}", authId);
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean revokeAuth(Long authId) {
        PlatformAuth auth = platformAuthMapper.selectById(authId);
        if (auth == null) {
            return false;
        }

        auth.setAuthStatus(0);
        auth.setAccessToken(null);
        auth.setExpireTime(null);
        platformAuthMapper.updateById(auth);

        auditLogService.logUpdate(
            "PLATFORM_AUTH",
            authId,
            null,
            null,
            null,
            AuditSource.MERCHANT_PORTAL,
            "撤销授权, authId=" + authId
        );

        log.info("授权撤销成功: authId={}", authId);
        return true;
    }

    @Override
    public boolean isAuthValid(Long storeId, Integer platformType) {
        PlatformAuth auth = getAuthByStoreAndPlatform(storeId, platformType);
        if (auth == null) {
            return false;
        }
        if (auth.getAuthStatus() == null || auth.getAuthStatus() != 1) {
            return false;
        }
        if (auth.getExpireTime() == null) {
            return false;
        }
        return auth.getExpireTime().isAfter(LocalDateTime.now());
    }
}
