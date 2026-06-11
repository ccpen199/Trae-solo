package com.guizhou.platform.datashare;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@MapperScan("com.guizhou.platform.datashare.mapper")
@SpringBootApplication(scanBasePackages = {"com.guizhou.platform.datashare", "com.guizhou.platform.common"})
public class DataShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataShareApplication.class, args);
    }
}
