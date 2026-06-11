package com.guizhou.platform.subsidy;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@EnableAsync
@EnableScheduling
@EnableDiscoveryClient
@EnableTransactionManagement
@MapperScan("com.guizhou.platform.subsidy.mapper")
@SpringBootApplication
public class SubsidyApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubsidyApplication.class, args);
    }
}
