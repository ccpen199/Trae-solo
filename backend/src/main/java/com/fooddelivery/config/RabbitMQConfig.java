package com.fooddelivery.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String PRINT_TASK_QUEUE = "print.task.queue";
    public static final String ORDER_NOTIFY_QUEUE = "order.notify.queue";
    public static final String AFTER_SALE_QUEUE = "after.sale.queue";
    public static final String STATISTICS_QUEUE = "statistics.queue";

    @Bean
    public Queue printTaskQueue() {
        return new Queue(PRINT_TASK_QUEUE, true);
    }

    @Bean
    public Queue orderNotifyQueue() {
        return new Queue(ORDER_NOTIFY_QUEUE, true);
    }

    @Bean
    public Queue afterSaleQueue() {
        return new Queue(AFTER_SALE_QUEUE, true);
    }

    @Bean
    public Queue statisticsQueue() {
        return new Queue(STATISTICS_QUEUE, true);
    }
}
