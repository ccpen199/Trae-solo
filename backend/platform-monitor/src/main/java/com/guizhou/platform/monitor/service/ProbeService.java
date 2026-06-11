package com.guizhou.platform.monitor.service;

import com.guizhou.platform.monitor.entity.ProbeRecord;
import com.guizhou.platform.monitor.entity.ServiceInstance;
import com.guizhou.platform.monitor.enums.ServiceStatusEnum;
import com.guizhou.platform.monitor.mapper.ProbeRecordMapper;
import com.guizhou.platform.monitor.mapper.ServiceInstanceMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProbeService {

    private final ServiceInstanceMapper serviceInstanceMapper;
    private final ProbeRecordMapper probeRecordMapper;
    private final MonitorService monitorService;
    private final AlertService alertService;
    private final MeterRegistry meterRegistry;

    @Value("${monitor.probe.timeout:5000}")
    private int probeTimeout;

    @Value("${monitor.probe.retry-count:2}")
    private int retryCount;

    @Value("${monitor.probe.thread-pool-size:10}")
    private int threadPoolSize;

    private final RestTemplate restTemplate = new RestTemplate();

    public void executeProbeAll() {
        List<ServiceInstance> services = serviceInstanceMapper.selectList(null);
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(threadPoolSize, services.size()));
        List<Future<ProbeRecord>> futures = new java.util.ArrayList<>();

        for (ServiceInstance service : services) {
            futures.add(executor.submit(() -> probeService(service)));
        }

        for (Future<ProbeRecord> future : futures) {
            try {
                ProbeRecord record = future.get(probeTimeout + 5000L, TimeUnit.MILLISECONDS);
                if (record != null) {
                    probeRecordMapper.insert(record);
                    updateServiceAfterProbe(record);
                }
            } catch (Exception e) {
                log.error("拨测任务执行异常: {}", e.getMessage());
            }
        }
        executor.shutdown();
    }

    public ProbeRecord probeService(ServiceInstance instance) {
        ProbeRecord record = new ProbeRecord();
        record.setServiceId(instance.getId());
        record.setServiceCode(instance.getServiceCode());
        record.setProbeType("HTTP");
        record.setProbeUrl(instance.getHealthUrl());
        record.setProbeTime(LocalDateTime.now());

        boolean success = false;
        int statusCode = 0;
        long responseTime = 0;
        String errorMessage = null;

        for (int attempt = 0; attempt <= retryCount; attempt++) {
            try {
                long startTime = System.currentTimeMillis();
                var response = restTemplate.getForEntity(instance.getHealthUrl(), String.class);
                responseTime = System.currentTimeMillis() - startTime;
                statusCode = response.getStatusCode().value();
                success = statusCode >= 200 && statusCode < 300;
                if (success) break;
            } catch (Exception e) {
                errorMessage = e.getMessage();
                log.debug("拨测失败(第{}次): 服务[{}] URL[{}] 错误[{}]",
                        attempt + 1, instance.getServiceCode(), instance.getHealthUrl(), errorMessage);
            }
        }

        record.setStatusCode(statusCode);
        record.setResponseTime(responseTime);
        record.setSuccess(success);
        record.setErrorMessage(errorMessage);

        Timer.builder("monitor.probe.response.time")
                .tag("service", instance.getServiceCode())
                .register(meterRegistry)
                .record(responseTime, TimeUnit.MILLISECONDS);

        Counter.builder("monitor.probe.requests")
                .tag("service", instance.getServiceCode())
                .tag("status", success ? "success" : "failure")
                .register(meterRegistry)
                .increment();

        return record;
    }

    @Async
    public void probeServiceAsync(ServiceInstance instance) {
        ProbeRecord record = probeService(instance);
        probeRecordMapper.insert(record);
        updateServiceAfterProbe(record);
    }

    private void updateServiceAfterProbe(ProbeRecord record) {
        ServiceInstance instance = serviceInstanceMapper.selectById(record.getServiceId());
        if (instance == null) return;

        instance.setLastProbeTime(record.getProbeTime());
        if (record.getSuccess()) {
            instance.setLastResponseTime(record.getResponseTime());
            instance.setConsecutiveFailures(0);
            if (ServiceStatusEnum.DOWN.getCode().equals(instance.getStatus())) {
                instance.setStatus(ServiceStatusEnum.UP.getCode());
            }
        } else {
            int failures = (instance.getConsecutiveFailures() != null ? instance.getConsecutiveFailures() : 0) + 1;
            instance.setConsecutiveFailures(failures);
            if (failures >= 3) {
                instance.setStatus(ServiceStatusEnum.DOWN.getCode());
            } else if (failures >= 1) {
                instance.setStatus(ServiceStatusEnum.DEGRADED.getCode());
            }
        }

        serviceInstanceMapper.updateById(instance);
        monitorService.updateServiceStatusCache(instance.getServiceCode(), instance.getStatus());

        ServiceHealthVO health = monitorService.getServiceHealth(instance.getId());
        if (health != null) {
            alertService.evaluateRules(instance, health.getAvailability(), health.getAvgResponseTime(), health.getErrorRate());
        }
    }
}
