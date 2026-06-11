package com.guizhou.platform.datashare.service;

import com.alibaba.csp.sentinel.Entry;
import com.alibaba.csp.sentinel.SphU;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.datashare.dto.DataRouteDTO;
import com.guizhou.platform.datashare.entity.ApiInfo;
import com.guizhou.platform.datashare.enums.ApiStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteService {

    private final ApiService apiService;
    private final DataPermissionService dataPermissionService;
    private final DataDesensitizeService dataDesensitizeService;
    private final AuditLogService auditLogService;
    private final StringRedisTemplate stringRedisTemplate;
    private final RestTemplate restTemplate;

    @Value("${data-share.route.cache-expire:300}")
    private int cacheExpire;

    @Value("${data-share.rate-limit.default-qps:100}")
    private int defaultQps;

    private static final String ROUTE_CACHE_PREFIX = "data-share:route:";
    private static final String RATE_LIMIT_PREFIX = "data-share:ratelimit:";

    @SentinelResource(value = "routeRequest", blockHandler = "handleBlock")
    public Object route(DataRouteDTO dto) {
        String apiCode = dto.getApiCode();

        ApiInfo apiInfo = apiService.getApiByCode(apiCode, "1.0");
        if (apiInfo == null) {
            throw new BusinessException("API不存在或未发布");
        }
        if (!ApiStatusEnum.PUBLISHED.getCode().equals(apiInfo.getStatus())) {
            throw new BusinessException("API未发布或已下线");
        }

        if (Boolean.TRUE.equals(apiInfo.getNeedAuth())) {
            if (!dataPermissionService.checkPermission(apiCode, dto.getUserId(), dto.getRoleCode(), dto.getDeptCode(), "query")) {
                throw new BusinessException("无访问权限");
            }
        }

        checkRateLimit(apiCode, dto.getUserId());

        String cacheKey = ROUTE_CACHE_PREFIX + apiCode + ":" + JSON.toJSONString(dto.getRequestParams());
        String cachedResult = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cachedResult != null) {
            log.debug("命中路由缓存: {}", cacheKey);
            Object result = JSON.parse(cachedResult);
            recordVisitLog(dto, apiInfo, result, true, null);
            return result;
        }

        Object result = null;
        boolean success = true;
        String errorMsg = null;
        long startTime = System.currentTimeMillis();

        try (Entry entry = SphU.entry("api:" + apiCode)) {
            String targetUrl = buildTargetUrl(apiInfo, dto);
            HttpEntity<Map<String, Object>> requestEntity = buildRequestEntity(dto);

            log.info("路由请求到: {} {}", apiInfo.getRequestMethod(), targetUrl);

            ResponseEntity<String> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.valueOf(apiInfo.getRequestMethod().toUpperCase()),
                    requestEntity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                result = JSON.parse(response.getBody());

                if (Boolean.TRUE.equals(apiInfo.getNeedDesensitize())) {
                    result = dataDesensitizeService.desensitize(apiInfo.getId(), apiInfo.getApiCode(), result);
                }

                if (Boolean.TRUE.equals(apiInfo.getNeedAuth())) {
                    result = dataPermissionService.applyDataScope(result, apiCode, dto.getUserId(), dto.getRoleCode(), dto.getDeptCode());
                }

                stringRedisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(result), cacheExpire, TimeUnit.SECONDS);
            } else {
                success = false;
                errorMsg = "请求失败，HTTP状态码: " + response.getStatusCode();
            }
        } catch (BlockException e) {
            success = false;
            errorMsg = "请求已被限流";
            throw new BusinessException(errorMsg);
        } catch (Exception e) {
            success = false;
            errorMsg = "路由请求异常: " + e.getMessage();
            log.error(errorMsg, e);
            throw new BusinessException(errorMsg);
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            recordVisitLog(dto, apiInfo, result, success, errorMsg);
        }

        return result;
    }

    public Object handleBlock(DataRouteDTO dto, BlockException ex) {
        throw new BusinessException("系统繁忙，请稍后再试");
    }

    private String buildTargetUrl(ApiInfo apiInfo, DataRouteDTO dto) {
        String baseUrl = "http://" + apiInfo.getDeptCode() + "-service";
        String requestUrl = apiInfo.getRequestUrl();

        if (dto.getRequestParams() != null && "GET".equalsIgnoreCase(apiInfo.getRequestMethod())) {
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, Object> entry : dto.getRequestParams().entrySet()) {
                if (sb.length() > 0) {
                    sb.append("&");
                }
                sb.append(entry.getKey()).append("=").append(entry.getValue());
            }
            if (sb.length() > 0) {
                requestUrl += "?" + sb;
            }
        }

        return baseUrl + requestUrl;
    }

    private HttpEntity<Map<String, Object>> buildRequestEntity(DataRouteDTO dto) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (dto.getHeaders() != null) {
            dto.getHeaders().forEach(headers::set);
        }
        if (dto.getUserId() != null) {
            headers.set("X-User-Id", dto.getUserId());
        }
        if (dto.getRoleCode() != null) {
            headers.set("X-Role-Code", dto.getRoleCode());
        }
        if (dto.getDeptCode() != null) {
            headers.set("X-Dept-Code", dto.getDeptCode());
        }

        if ("GET".equalsIgnoreCase(dto.getRequestMethod())) {
            return new HttpEntity<>(null, headers);
        } else {
            return new HttpEntity<>(dto.getRequestParams(), headers);
        }
    }

    private void checkRateLimit(String apiCode, String userId) {
        String apiKey = RATE_LIMIT_PREFIX + "api:" + apiCode;
        String userKey = RATE_LIMIT_PREFIX + "user:" + userId;

        if (!acquireToken(apiKey, defaultQps)) {
            throw new BusinessException("API调用频率超限");
        }

        if (userId != null && !acquireToken(userKey, 1000)) {
            throw new BusinessException("用户调用频率超限");
        }
    }

    private boolean acquireToken(String key, int limit) {
        String count = stringRedisTemplate.opsForValue().get(key);
        if (count == null) {
            stringRedisTemplate.opsForValue().set(key, "1", 1, TimeUnit.SECONDS);
            return true;
        }
        int current = Integer.parseInt(count);
        if (current >= limit) {
            return false;
        }
        stringRedisTemplate.opsForValue().increment(key);
        return true;
    }

    private void recordVisitLog(DataRouteDTO dto, ApiInfo apiInfo, Object result, boolean success, String errorMsg) {
        try {
            com.guizhou.platform.datashare.entity.ApiVisitLog visitLog = new com.guizhou.platform.datashare.entity.ApiVisitLog();
            visitLog.setTraceId(java.util.UUID.randomUUID().toString().replace("-", ""));
            visitLog.setApiId(apiInfo.getId());
            visitLog.setApiCode(apiInfo.getApiCode());
            visitLog.setApiName(apiInfo.getApiName());
            visitLog.setRequestMethod(dto.getRequestMethod());
            visitLog.setRequestUrl(apiInfo.getRequestUrl());
            visitLog.setRequestParam(JSON.toJSONString(dto.getRequestParams()));
            visitLog.setResponseData(result != null ? JSON.toJSONString(result) : null);
            visitLog.setUserId(dto.getUserId());
            visitLog.setDeptCode(dto.getDeptCode());
            visitLog.setRequestTime(LocalDateTime.now());
            visitLog.setResponseTime(LocalDateTime.now());
            visitLog.setSuccess(success);
            visitLog.setHttpStatus(success ? 200 : 500);
            visitLog.setResponseCode(success ? "200" : "500");
            visitLog.setResponseMsg(success ? "success" : errorMsg);
            visitLog.setErrorMsg(errorMsg);

            auditLogService.saveLogAsync(visitLog);
        } catch (Exception e) {
            log.error("记录访问日志失败: {}", e.getMessage());
        }
    }
}
