package com.guizhou.platform.monitor.config;

import com.guizhou.platform.monitor.service.ProbeService;
import com.guizhou.platform.monitor.service.SlaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Slf4j
@Configuration
@EnableScheduling
@RequiredArgsConstructor
@ConditionalOnProperty(name = "monitor.probe.interval", havingValue = "30000", matchIfMissing = true)
public class ScheduleConfig {

    private final ProbeService probeService;
    private final SlaService slaService;

    @Scheduled(fixedDelayString = "${monitor.probe.interval:30000}")
    public void executeProbeTask() {
        log.debug("定时拨测任务开始执行...");
        try {
            probeService.executeProbeAll();
        } catch (Exception e) {
            log.error("定时拨测任务执行异常: {}", e.getMessage());
        }
    }

    @Scheduled(cron = "${monitor.sla.check-cron:0 0 2 1 * ?}")
    @ConditionalOnProperty(name = "monitor.sla.auto-check-enabled", havingValue = "true", matchIfMissing = true)
    public void executeSlaMonthlyCheck() {
        log.info("SLA月度自动考核任务开始执行...");
        try {
            slaService.executeMonthlyCheck();
        } catch (Exception e) {
            log.error("SLA月度考核任务执行异常: {}", e.getMessage());
        }
    }
}
