package com.guizhou.platform.gateway.filter;

import cn.hutool.core.util.IdUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class RequestLogFilter implements GlobalFilter, Ordered {

    private static final String REQUEST_START_TIME = "requestStartTime";
    private static final String TRACE_ID = "traceId";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String traceId = IdUtil.fastSimpleUUID();
        long startTime = System.currentTimeMillis();

        exchange.getAttributes().put(REQUEST_START_TIME, startTime);
        exchange.getAttributes().put(TRACE_ID, traceId);

        ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-Trace-Id", traceId)
                .build();

        logRequest(modifiedRequest, traceId);

        return chain.filter(exchange.mutate().request(modifiedRequest).build())
                .then(Mono.fromRunnable(() -> logResponse(exchange, traceId, startTime)));
    }

    private void logRequest(ServerHttpRequest request, String traceId) {
        String method = request.getMethod() != null ? request.getMethod().name() : "UNKNOWN";
        String path = request.getURI().getPath();
        String query = request.getURI().getQuery();
        String ip = getClientIp(request);
        String userAgent = request.getHeaders().getFirst("User-Agent");

        if (query != null) {
            path = path + "?" + query;
        }

        log.info("[{}] Request: {} {} | IP: {} | User-Agent: {}",
                traceId, method, path, ip, userAgent);
    }

    private void logResponse(ServerWebExchange exchange, String traceId, long startTime) {
        long duration = System.currentTimeMillis() - startTime;
        int status = exchange.getResponse().getStatusCode() != null ?
                exchange.getResponse().getStatusCode().value() : 0;

        log.info("[{}] Response: Status={} | Duration={}ms", traceId, status, duration);
    }

    private String getClientIp(ServerHttpRequest request) {
        var xForwardedFor = request.getHeaders().get("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            String ip = xForwardedFor.get(0);
            if (ip.contains(",")) {
                return ip.split(",")[0].trim();
            }
            return ip;
        }

        var xRealIp = request.getHeaders().get("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp.get(0);
        }

        return request.getRemoteAddress() != null ?
                request.getRemoteAddress().getAddress().getHostAddress() : "unknown";
    }

    @Override
    public int getOrder() {
        return -200;
    }
}
