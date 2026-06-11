package com.guizhou.platform.gateway.filter;

import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.common.result.ResultCode;
import com.guizhou.platform.gateway.model.UserContext;
import com.guizhou.platform.gateway.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    @Value("${gateway.auth.enabled}")
    private Boolean authEnabled;

    @Value("${gateway.auth.token-header}")
    private String tokenHeader;

    @Value("${gateway.auth.token-prefix}")
    private String tokenPrefix;

    @Value("${gateway.auth.white-list}")
    private List<String> whiteList;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!authEnabled) {
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        if (isWhiteList(path)) {
            return chain.filter(exchange);
        }

        String token = extractToken(request);
        if (token == null) {
            return buildErrorResponse(exchange, ResultCode.UNAUTHORIZED);
        }

        if (jwtUtil.isTokenExpired(token)) {
            return buildErrorResponse(exchange, ResultCode.TOKEN_EXPIRED);
        }

        if (!jwtUtil.validateToken(token)) {
            return buildErrorResponse(exchange, ResultCode.TOKEN_INVALID);
        }

        UserContext userContext = buildUserContext(token);
        ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-Id", String.valueOf(userContext.getUserId()))
                .header("X-Username", userContext.getUsername())
                .header("X-Tenant-Id", userContext.getTenantId())
                .header("X-User-Roles", JSON.toJSONString(userContext.getRoles()))
                .header("X-User-Permissions", JSON.toJSONString(userContext.getPermissions()))
                .build();

        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    private boolean isWhiteList(String path) {
        for (String pattern : whiteList) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }

    private String extractToken(ServerHttpRequest request) {
        String bearerToken = request.getHeaders().getFirst(tokenHeader);
        if (bearerToken != null && bearerToken.startsWith(tokenPrefix)) {
            return bearerToken.substring(tokenPrefix.length());
        }
        return null;
    }

    private UserContext buildUserContext(String token) {
        return UserContext.builder()
                .userId(jwtUtil.getUserId(token))
                .username(jwtUtil.getUsername(token))
                .roles(jwtUtil.getRoles(token))
                .permissions(jwtUtil.getPermissions(token))
                .tenantId(jwtUtil.getTenantId(token))
                .build();
    }

    private Mono<Void> buildErrorResponse(ServerWebExchange exchange, ResultCode resultCode) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.OK);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Result<?> result = Result.error(resultCode);
        byte[] bytes = JSON.toJSONString(result).getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
