package com.guizhou.platform.ticket.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ticket.nlp")
public class NlpConfig {

    private Boolean enabled = true;

    private String endpoint = "http://127.0.0.1:8501/predict";

    private Integer timeout = 5000;

    private Double keywordsWeight = 0.3;

    private Double categoryWeight = 0.4;

    private Double urgencyWeight = 0.3;
}
