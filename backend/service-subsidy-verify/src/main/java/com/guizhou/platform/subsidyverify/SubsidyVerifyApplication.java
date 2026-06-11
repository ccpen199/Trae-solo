package com.guizhou.platform.subsidyverify;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@EnableAsync
@EnableDiscoveryClient
@EnableFeignClients
@EnableTransactionManagement
@MapperScan("com.guizhou.platform.subsidyverify.mapper")
@SpringBootApplication
public class SubsidyVerifyApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubsidyVerifyApplication.class, args);
    }
}
