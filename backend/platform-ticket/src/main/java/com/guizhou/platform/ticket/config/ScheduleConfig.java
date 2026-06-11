package com.guizhou.platform.ticket.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.ticket.entity.Ticket;
import com.guizhou.platform.ticket.enums.TicketStatusEnum;
import com.guizhou.platform.ticket.mapper.TicketMapper;
import jakarta.annotation.Resource;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "ticket.schedule")
public class ScheduleConfig {

    private String timeoutCheckCron = "0 */10 * * * ?";

    private String statisticsCron = "0 0 3 * * ?";

    private String hotspotCron = "0 0 4 * * ?";

    @Resource
    private TicketMapper ticketMapper;

    @Resource
    private RocketMQTemplate rocketMQTemplate;

    @Scheduled(cron = "0 */10 * * * ?")
    public void checkTimeoutTickets() {
        log.info("开始检查超时工单...");

        LocalDateTime now = LocalDateTime.now();

        List<Ticket> pendingTickets = ticketMapper.selectList(new LambdaQueryWrapper<Ticket>()
                .eq(Ticket::getStatus, TicketStatusEnum.PENDING.getCode())
                .lt(Ticket::getCreateTime, now.minusHours(24))
                .eq(Ticket::getDeleted, false));

        for (Ticket ticket : pendingTickets) {
            try {
                rocketMQTemplate.convertAndSend("ticket-timeout-warning",
                        "工单[" + ticket.getTicketNo() + "]已超过24小时未受理");
                log.warn("工单超时预警: ticketNo={}, 状态=待受理超过24小时", ticket.getTicketNo());
            } catch (Exception e) {
                log.error("发送超时预警消息失败: {}", e.getMessage());
            }
        }

        List<Ticket> processingTickets = ticketMapper.selectList(new LambdaQueryWrapper<Ticket>()
                .in(Ticket::getStatus, List.of(
                        TicketStatusEnum.ASSIGNED.getCode(),
                        TicketStatusEnum.PROCESSING.getCode()))
                .lt(Ticket::getDeadline, now)
                .eq(Ticket::getDeleted, false));

        for (Ticket ticket : processingTickets) {
            try {
                rocketMQTemplate.convertAndSend("ticket-overdue-warning",
                        "工单[" + ticket.getTicketNo() + "]已超过处理时限");
                log.warn("工单逾期预警: ticketNo={}, 超过截止时间", ticket.getTicketNo());
            } catch (Exception e) {
                log.error("发送逾期预警消息失败: {}", e.getMessage());
            }
        }

        log.info("超时工单检查完成: 待受理超时={}, 处理逾期={}", pendingTickets.size(), processingTickets.size());
    }
}
