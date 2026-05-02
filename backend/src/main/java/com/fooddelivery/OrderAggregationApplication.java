package com.fooddelivery;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.fooddelivery.mapper")
public class OrderAggregationApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderAggregationApplication.class, args);
        System.out.println("=========================================");
        System.out.println("  外卖聚合接单系统启动成功");
        System.out.println("  端口: " + System.getProperty("server.port", "8362"));
        System.out.println("  API文档: http://localhost:" + System.getProperty("server.port", "8362") + "/swagger-ui.html");
        System.out.println("=========================================");
    }
}
