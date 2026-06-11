package com.guizhou.platform.subsidy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "subsidy.risk-engine")
public class RiskEngineConfig {

    private Boolean enabled = true;

    private Long scanInterval = 300000L;

    private Integer warningThreshold = 80;

    private Boolean autoFreeze = true;
}
