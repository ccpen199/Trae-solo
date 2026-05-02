package com.fooddelivery.config;

import com.fooddelivery.enums.OrderEvent;
import com.fooddelivery.enums.OrderStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.StateMachineContext;
import org.springframework.statemachine.StateMachinePersist;
import org.springframework.statemachine.config.EnableStateMachine;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.StateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.statemachine.persist.DefaultStateMachinePersister;
import org.springframework.statemachine.persist.StateMachinePersister;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@EnableStateMachineFactory
public class OrderStateMachineConfig extends StateMachineConfigurerAdapter<Integer, String> {

    @Override
    public void configure(StateMachineStateConfigurer<Integer, String> states) throws Exception {
        states
            .withStates()
                .initial(OrderStatus.WAITING_PAYMENT.getCode())
                .state(OrderStatus.PENDING_RECEIVE.getCode())
                .state(OrderStatus.WAITING_PAYMENT.getCode())
                .state(OrderStatus.RECEIVED.getCode())
                .state(OrderStatus.PREPARING.getCode())
                .state(OrderStatus.PREPARED.getCode())
                .state(OrderStatus.TAKING.getCode())
                .state(OrderStatus.DELIVERING.getCode())
                .state(OrderStatus.REFUNDING.getCode())
                .end(OrderStatus.COMPLETED.getCode())
                .end(OrderStatus.CANCELLED.getCode())
                .end(OrderStatus.REFUNDED.getCode());
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<Integer, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source(OrderStatus.WAITING_PAYMENT.getCode())
                .target(OrderStatus.PENDING_RECEIVE.getCode())
                .event(OrderEvent.PAYMENT_CONFIRMED.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PENDING_RECEIVE.getCode())
                .target(OrderStatus.RECEIVED.getCode())
                .event(OrderEvent.RECEIVE_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PENDING_RECEIVE.getCode())
                .target(OrderStatus.CANCELLED.getCode())
                .event(OrderEvent.CANCEL_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.RECEIVED.getCode())
                .target(OrderStatus.PREPARING.getCode())
                .event(OrderEvent.START_PREPARE.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.RECEIVED.getCode())
                .target(OrderStatus.CANCELLED.getCode())
                .event(OrderEvent.CANCEL_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PREPARING.getCode())
                .target(OrderStatus.PREPARED.getCode())
                .event(OrderEvent.FINISH_PREPARE.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PREPARING.getCode())
                .target(OrderStatus.CANCELLED.getCode())
                .event(OrderEvent.CANCEL_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PREPARED.getCode())
                .target(OrderStatus.TAKING.getCode())
                .event(OrderEvent.RIDER_TAKE_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PREPARED.getCode())
                .target(OrderStatus.CANCELLED.getCode())
                .event(OrderEvent.CANCEL_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.TAKING.getCode())
                .target(OrderStatus.DELIVERING.getCode())
                .event(OrderEvent.START_DELIVERY.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.DELIVERING.getCode())
                .target(OrderStatus.COMPLETED.getCode())
                .event(OrderEvent.COMPLETE_ORDER.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.PENDING_RECEIVE.getCode())
                .target(OrderStatus.REFUNDING.getCode())
                .event(OrderEvent.APPLY_REFUND.getCode())
                .and()
            .withExternal()
                .source(OrderStatus.RECEIVED.getCode())
                .target(OrderStatus.REFUNDING.getCode())
                .event(OrderEvent.APPLY_REFUND.getCode())
                .and()
            .withExternal()
                .source(OrderStatus.PREPARING.getCode())
                .target(OrderStatus.REFUNDING.getCode())
                .event(OrderEvent.APPLY_REFUND.getCode())
                .and()
            .withExternal()
                .source(OrderStatus.PREPARED.getCode())
                .target(OrderStatus.REFUNDING.getCode())
                .event(OrderEvent.APPLY_REFUND.getCode())
                .and()
            .withExternal()
                .source(OrderStatus.DELIVERING.getCode())
                .target(OrderStatus.REFUNDING.getCode())
                .event(OrderEvent.APPLY_REFUND.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.REFUNDING.getCode())
                .target(OrderStatus.REFUNDED.getCode())
                .event(OrderEvent.REFUND_COMPLETE.getCode())
                .and()
            
            .withExternal()
                .source(OrderStatus.REFUNDING.getCode())
                .target(OrderStatus.PENDING_RECEIVE.getCode())
                .event(OrderEvent.REJECT_REFUND.getCode());
    }

    @Bean
    public StateMachinePersister<Integer, String, String> stateMachinePersister() {
        return new DefaultStateMachinePersister<>(new StateMachinePersist<Integer, String, String>() {
            private final Map<String, StateMachineContext<Integer, String>> contextMap = new HashMap<>();

            @Override
            public void write(StateMachineContext<Integer, String> context, String contextObj) {
                contextMap.put(contextObj, context);
                log.debug("状态机持久化: orderId={}, state={}", contextObj, context.getState());
            }

            @Override
            public StateMachineContext<Integer, String> read(String contextObj) {
                return contextMap.get(contextObj);
            }
        });
    }
}
