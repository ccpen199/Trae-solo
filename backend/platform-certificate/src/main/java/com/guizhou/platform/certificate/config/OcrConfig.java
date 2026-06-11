package com.guizhou.platform.certificate.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "certificate.ocr")
public class OcrConfig {

    private String tessdataPath;
    private String language;
    private Integer dpi;
}
