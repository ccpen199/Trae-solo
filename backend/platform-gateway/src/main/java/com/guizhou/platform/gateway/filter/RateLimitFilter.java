package com.guizhou.platform.gateway.filter;

import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final RedisTemplate<String, Object> redisTemplate;

    private final DefaultRedisScript<Long> limitScript;

    @Value("${gateway.rate-limit.enabled}")
    private Boolean rateLimitEnabled;

    @Value("${gateway.rate-limit.ip-rate-limit.enabled}")
    private Boolean ipRateLimitEnabled;

    @Value("${gateway.rate-limit.ip-rate-limit.replenish-rate}")
    private Integer replenishRate;

    @Value("${gateway.rate-limit.ip-rate-limit.burst-capacity}")
    private Integer burstCapacity;

    private static final String LIMIT_KEY_PREFIX = "gateway:rate:limit:";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!rateLimitEnabled || !ipRateLimitEnabled) {
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        String ip = getClientIp(request);
        String uri = request.getURI().getPath();
        String limitKey = LIMIT_KEY_PREFIX + ip + ":" + uri;

        try {
            Long result = redisTemplate.execute(
                    limitScript,
                    Collections.singletonList(limitKey),
                    replenishRate,
                    burstCapacity
            );

            if (result != null && result == 0) {
                log.warn("请求过于频繁, IP: {}, URI: {}", ip, uri);
                return buildErrorResponse(exchange, ResultCode.TOO_MANY_REQUESTS);
            }

            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-RateLimit-Limit", String.valueOf(burstCapacity))
                    .header("X-RateLimit-Remaining", String.valueOf(result != null ? result - 1 : 0))
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        } catch (Exception e) {
            log.error("限流处理异常: {}", e.getMessage());
            return chain.filter(exchange);
        }
    }

    private String getClientIp(ServerHttpRequest request) {
        List<String> xForwardedFor = request.getHeaders().get("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            String ip = xForwardedFor.get(0);
            if (ip.contains(",")) {
                return ip.split(",")[0].trim();
            }
            return ip;
        }

        List<String> xRealIp = request.getHeaders().get("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp.get(0);
        }

        return request.getRemoteAddress() != null ?
                request.getRemoteAddress().getAddress().getHostAddress() : "unknown";
    }

    private Mono<Void> buildErrorResponse(ServerWebExchange exchange, ResultCode resultCode) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.OK);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set("Retry-After", "60");

        Result<?> result = Result.error(resultCode);
        byte[] bytes = JSON.toJSONString(result).getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -50;
    }
}
