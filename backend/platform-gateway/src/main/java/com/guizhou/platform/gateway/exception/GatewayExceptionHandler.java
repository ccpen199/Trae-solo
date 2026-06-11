package com.guizhou.platform.gateway.exception;

import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.common.result.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.cloud.gateway.support.TimeoutException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        String path = exchange.getRequest().getURI().getPath();

        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Result<?> result;
        if (ex instanceof NotFoundException) {
            log.error("服务未找到: {}, Path: {}", ex.getMessage(), path);
            result = Result.error(ResultCode.SERVICE_UNAVAILABLE);
            response.setStatusCode(HttpStatus.OK);
        } else if (ex instanceof TimeoutException) {
            log.error("服务调用超时: {}, Path: {}", ex.getMessage(), path);
            result = Result.error(ResultCode.SERVICE_TIMEOUT);
            response.setStatusCode(HttpStatus.OK);
        } else if (ex instanceof ResponseStatusException rse) {
            log.error("响应状态异常: {}, Path: {}", rse.getReason(), path);
            if (rse.getStatusCode() == HttpStatus.NOT_FOUND) {
                result = Result.error(ResultCode.NOT_FOUND);
            } else if (rse.getStatusCode() == HttpStatus.FORBIDDEN) {
                result = Result.error(ResultCode.FORBIDDEN);
            } else if (rse.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                result = Result.error(ResultCode.UNAUTHORIZED);
            } else if (rse.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                result = Result.error(ResultCode.TOO_MANY_REQUESTS);
            } else {
                result = Result.error(ResultCode.ERROR);
            }
            response.setStatusCode(HttpStatus.OK);
        } else if (ex instanceof org.springframework.web.server.ServerWebInputException) {
            log.error("请求参数异常: {}, Path: {}", ex.getMessage(), path);
            result = Result.error(ResultCode.PARAM_ERROR);
            response.setStatusCode(HttpStatus.OK);
        } else {
            log.error("网关内部异常: {}, Path: {}", ex.getMessage(), path, ex);
            result = Result.error(ResultCode.ERROR);
            response.setStatusCode(HttpStatus.OK);
        }

        Object traceId = exchange.getAttribute("traceId");
        if (traceId != null) {
            result.traceId(traceId.toString());
        }

        byte[] bytes = JSON.toJSONString(result).getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
