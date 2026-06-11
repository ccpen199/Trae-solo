package com.guizhou.platform.certificate.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "certificate.blockchain")
public class BlockchainConfig {

    private String rpcUrl;
    private Long chainId;
    private String privateKey;
    private String contractAddress;
}
