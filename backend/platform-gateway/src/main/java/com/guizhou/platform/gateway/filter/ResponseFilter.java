package com.guizhou.platform.gateway.filter;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.guizhou.platform.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class ResponseFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpResponse originalResponse = exchange.getResponse();
        DataBufferFactory bufferFactory = originalResponse.bufferFactory();

        ServerHttpResponseDecorator decoratedResponse = new ServerHttpResponseDecorator(originalResponse) {
            @Override
            public Mono<Void> writeWith(org.reactivestreams.Publisher<? extends DataBuffer> body) {
                MediaType contentType = getDelegate().getHeaders().getContentType();

                if (contentType != null && contentType.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                    Flux<? extends DataBuffer> fluxBody = Flux.from(body);
                    return super.writeWith(fluxBody.buffer().map(dataBuffers -> {
                        DataBuffer join = bufferFactory.join(dataBuffers);
                        byte[] content = new byte[join.readableByteCount()];
                        join.read(content);
                        DataBufferUtils.release(join);

                        String responseBody = new String(content, StandardCharsets.UTF_8);
                        String wrappedBody = wrapResponse(responseBody, exchange);

                        byte[] wrappedBytes = wrappedBody.getBytes(StandardCharsets.UTF_8);
                        getDelegate().getHeaders().setContentLength(wrappedBytes.length);
                        return bufferFactory.wrap(wrappedBytes);
                    }));
                }

                return super.writeWith(body);
            }
        };

        return chain.filter(exchange.mutate().response(decoratedResponse).build());
    }

    private String wrapResponse(String responseBody, ServerWebExchange exchange) {
        try {
            JSONObject json = JSON.parseObject(responseBody);

            if (json.containsKey("code") && json.containsKey("message")) {
                return responseBody;
            }

            Result<Object> result = Result.success(json);
            Object traceId = exchange.getAttribute("traceId");
            if (traceId != null) {
                result.traceId(traceId.toString());
            }
            return JSON.toJSONString(result);
        } catch (Exception e) {
            log.warn("响应体不是JSON格式，跳过包装: {}", e.getMessage());
            return responseBody;
        }
    }

    @Override
    public int getOrder() {
        return 100;
    }
}
