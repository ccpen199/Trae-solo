package com.retail.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.env.ConfigurableEnvironment;

@SpringBootApplication
@ComponentScan(basePackages = {"com.retail"})
@MapperScan("com.retail.mapper")
public class RetailAdminApplication {

    public static void main(String[] args) {
        ConfigurableEnvironment env = SpringApplication.run(RetailAdminApplication.class, args).getEnvironment();
        String port = env.getProperty("server.port", "18080");
        String contextPath = env.getProperty("server.servlet.context-path", "/api");
        System.out.println("==============================================");
        System.out.println("   连锁门店总部管理系统启动成功!");
        System.out.println("   访问地址: http://localhost:" + port + contextPath);
        System.out.println("   API文档: http://localhost:" + port + contextPath + "/doc.html");
        System.out.println("   端口说明: " + port + " (避免8080常用端口冲突)");
        System.out.println("==============================================");
    }
}
