package com.guizhou.platform.subsidy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "subsidy.schedule")
public class ScheduleConfig {

    private String grantSettleCron = "0 0 2 * * ?";

    private String riskScanCron = "0 */5 * * * ?";

    private String statisticsCron = "0 0 3 * * ?";
}
