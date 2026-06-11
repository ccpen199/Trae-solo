package com.guizhou.platform.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private String secret;

    private Long accessTokenExpire;

    private Long refreshTokenExpire;

    private String issuer;

    private String tokenPrefix = "Bearer ";

    private String header = "Authorization";
}
