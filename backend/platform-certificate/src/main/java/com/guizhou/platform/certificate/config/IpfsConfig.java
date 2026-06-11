package com.guizhou.platform.certificate.config;

import io.ipfs.api.IPFS;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "certificate.ipfs")
public class IpfsConfig {

    private String host;
    private int port;
    private String version;
    private int timeout;

    @Bean
    public IPFS ipfs() {
        IPFS ipfs = new IPFS(host, port, version, timeout);
        return ipfs;
    }
}
