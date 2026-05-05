package com.bbs;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.bbs.mapper")
public class BbsForumApplication {
    public static void main(String[] args) {
        SpringApplication.run(BbsForumApplication.class, args);
    }
}
