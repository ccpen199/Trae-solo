package com.retailpos;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.retailpos.mapper")
public class RetailPosApplication {
    public static void main(String[] args) {
        SpringApplication.run(RetailPosApplication.class, args);
    }
}
