package com.coldchain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;

@SpringBootApplication(exclude = {RabbitAutoConfiguration.class, RedisAutoConfiguration.class})
public class ColdchainApplication {
    public static void main(String[] args) {
        SpringApplication.run(ColdchainApplication.class, args);
    }
}
