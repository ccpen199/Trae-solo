package com.guizhou.platform.gateway.config;

import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayFlowRule;
import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayRuleManager;
import com.alibaba.csp.sentinel.adapter.gateway.sc.SentinelGatewayFilter;
import com.alibaba.csp.sentinel.adapter.gateway.sc.callback.BlockRequestHandler;
import com.alibaba.csp.sentinel.adapter.gateway.sc.callback.GatewayCallbackManager;
import com.alibaba.csp.sentinel.adapter.gateway.sc.exception.SentinelGatewayBlockExceptionHandler;
import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.common.result.ResultCode;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.ServerResponse;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Configuration
public class GatewayConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.addAllowedOriginPattern("*");
        corsConfig.addAllowedHeader("*");
        corsConfig.addAllowedMethod("*");
        corsConfig.setAllowCredentials(true);
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        return new CorsWebFilter(source);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public DefaultRedisScript<Long> limitScript() {
        DefaultRedisScript<Long> limitScript = new DefaultRedisScript<>();
        limitScript.setScriptText(
                "local key = KEYS[1]\n" +
                "local rate = tonumber(ARGV[1])\n" +
                "local capacity = tonumber(ARGV[2])\n" +
                "local now = redis.call('TIME')[1]\n" +
                "local last_time = tonumber(redis.call('hget', key, 'last_time') or 0)\n" +
                "local tokens = tonumber(redis.call('hget', key, 'tokens') or capacity)\n" +
                "local delta = now - last_time\n" +
                "tokens = math.min(capacity, tokens + delta * rate)\n" +
                "if tokens >= 1 then\n" +
                "    tokens = tokens - 1\n" +
                "    redis.call('hset', key, 'tokens', tokens)\n" +
                "    redis.call('hset', key, 'last_time', now)\n" +
                "    redis.call('expire', key, 60)\n" +
                "    return math.floor(tokens) + 1\n" +
                "else\n" +
                "    return 0\n" +
                "end"
        );
        limitScript.setResultType(Long.class);
        return limitScript;
    }

    @Bean
    public GatewayCallbackManager gatewayCallbackManager() {
        BlockRequestHandler blockRequestHandler = (exchange, t) ->
                ServerResponse.status(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromValue(
                                JSON.toJSONString(Result.error(ResultCode.TOO_MANY_REQUESTS))
                                        .getBytes(StandardCharsets.UTF_8)
                        ));
        GatewayCallbackManager.setBlockHandler(blockRequestHandler);
        return new GatewayCallbackManager();
    }

    @Bean
    @Order(-1)
    public GlobalFilter sentinelGatewayFilter() {
        return new SentinelGatewayFilter();
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SentinelGatewayBlockExceptionHandler sentinelGatewayBlockExceptionHandler() {
        return new SentinelGatewayBlockExceptionHandler(
                Collections.emptyList(),
                new org.springframework.cloud.gateway.handler.predicate.PathRoutePredicateFactory()
        );
    }

    @Bean
    public void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();
        rules.add(new GatewayFlowRule("platform-data-share")
                .setCount(100)
                .setIntervalSec(1)
        );
        rules.add(new GatewayFlowRule("platform-auth")
                .setCount(50)
                .setIntervalSec(1)
        );
        GatewayRuleManager.loadRules(rules);
    }
}
