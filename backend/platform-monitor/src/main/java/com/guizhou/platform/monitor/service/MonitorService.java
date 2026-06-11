package com.guizhou.platform.monitor.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.monitor.dto.response.ServiceHealthVO;
import com.guizhou.platform.monitor.dto.response.MonitorDashboardVO;
import com.guizhou.platform.monitor.dto.response.AlertVO;
import com.guizhou.platform.monitor.entity.AlertRecord;
import com.guizhou.platform.monitor.entity.ProbeRecord;
import com.guizhou.platform.monitor.entity.ServiceInstance;
import com.guizhou.platform.monitor.enums.ServiceStatusEnum;
import com.guizhou.platform.monitor.mapper.AlertRecordMapper;
import com.guizhou.platform.monitor.mapper.ProbeRecordMapper;
import com.guizhou.platform.monitor.mapper.ServiceInstanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonitorService {

    private final ServiceInstanceMapper serviceInstanceMapper;
    private final ProbeRecordMapper probeRecordMapper;
    private final AlertRecordMapper alertRecordMapper;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String SERVICE_STATUS_KEY = "monitor:service:status:";
    private static final String SERVICE_METRICS_KEY = "monitor:service:metrics:";

    public IPage<ServiceInstance> listServices(int pageNum, int pageSize) {
        return serviceInstanceMapper.selectPage(
                new Page<>(pageNum, pageSize),
                new LambdaQueryWrapper<ServiceInstance>().orderByDesc(ServiceInstance::getCreateTime)
        );
    }

    public ServiceHealthVO getServiceHealth(Long serviceId) {
        ServiceInstance instance = serviceInstanceMapper.selectById(serviceId);
        if (instance == null) {
            return null;
        }
        ServiceHealthVO vo = new ServiceHealthVO();
        vo.setServiceId(instance.getId());
        vo.setServiceCode(instance.getServiceCode());
        vo.setServiceName(instance.getServiceName());
        vo.setServiceGroup(instance.getServiceGroup());
        vo.setStatus(instance.getStatus());
        vo.setLastProbeTime(instance.getLastProbeTime());
        vo.setLastResponseTime(instance.getLastResponseTime());
        vo.setConsecutiveFailures(instance.getConsecutiveFailures());
        vo.setInstanceHost(instance.getInstanceHost());
        vo.setInstancePort(instance.getInstancePort());

        calculateServiceMetrics(vo, instance.getServiceCode());
        return vo;
    }

    public List<ServiceHealthVO> getAllServiceHealth() {
        List<ServiceInstance> instances = serviceInstanceMapper.selectList(
                new LambdaQueryWrapper<ServiceInstance>().orderByAsc(ServiceInstance::getServiceCode)
        );
        return instances.stream().map(instance -> {
            ServiceHealthVO vo = new ServiceHealthVO();
            vo.setServiceId(instance.getId());
            vo.setServiceCode(instance.getServiceCode());
            vo.setServiceName(instance.getServiceName());
            vo.setServiceGroup(instance.getServiceGroup());
            vo.setStatus(instance.getStatus());
            vo.setLastProbeTime(instance.getLastProbeTime());
            vo.setLastResponseTime(instance.getLastResponseTime());
            vo.setConsecutiveFailures(instance.getConsecutiveFailures());
            vo.setInstanceHost(instance.getInstanceHost());
            vo.setInstancePort(instance.getInstancePort());
            calculateServiceMetrics(vo, instance.getServiceCode());
            return vo;
        }).collect(Collectors.toList());
    }

    public MonitorDashboardVO getDashboard() {
        MonitorDashboardVO dashboard = new MonitorDashboardVO();

        List<ServiceInstance> allServices = serviceInstanceMapper.selectList(null);
        dashboard.setTotalServices(allServices.size());
        dashboard.setUpCount((int) allServices.stream().filter(s -> ServiceStatusEnum.UP.getCode().equals(s.getStatus())).count());
        dashboard.setDownCount((int) allServices.stream().filter(s -> ServiceStatusEnum.DOWN.getCode().equals(s.getStatus())).count());
        dashboard.setDegradedCount((int) allServices.stream().filter(s -> ServiceStatusEnum.DEGRADED.getCode().equals(s.getStatus())).count());

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        Long activeAlerts = alertRecordMapper.selectCount(
                new LambdaQueryWrapper<AlertRecord>()
                        .eq(AlertRecord::getAlertStatus, "FIRING")
                        .ge(AlertRecord::getAlertTime, todayStart)
        );
        Long criticalAlerts = alertRecordMapper.selectCount(
                new LambdaQueryWrapper<AlertRecord>()
                        .eq(AlertRecord::getAlertStatus, "FIRING")
                        .eq(AlertRecord::getAlertLevel, "CRITICAL")
                        .ge(AlertRecord::getAlertTime, todayStart)
        );
        dashboard.setActiveAlertCount(activeAlerts.intValue());
        dashboard.setCriticalAlertCount(criticalAlerts.intValue());

        List<ServiceHealthVO> healthList = getAllServiceHealth();
        dashboard.setServiceHealthList(healthList);
        dashboard.setOverallAvailability(
                healthList.stream().mapToDouble(ServiceHealthVO::getAvailability).average().orElse(0.0)
        );

        List<AlertRecord> recentAlerts = alertRecordMapper.selectList(
                new LambdaQueryWrapper<AlertRecord>()
                        .eq(AlertRecord::getAlertStatus, "FIRING")
                        .orderByDesc(AlertRecord::getAlertTime)
                        .last("LIMIT 10")
        );
        dashboard.setRecentAlerts(recentAlerts.stream().map(this::convertToAlertVO).collect(Collectors.toList()));

        return dashboard;
    }

    private void calculateServiceMetrics(ServiceHealthVO vo, String serviceCode) {
        LocalDateTime startTime = LocalDate.now().atStartOfDay();
        LocalDateTime endTime = LocalDateTime.now();

        List<ProbeRecord> todayProbes = probeRecordMapper.selectList(
                new LambdaQueryWrapper<ProbeRecord>()
                        .eq(ProbeRecord::getServiceCode, serviceCode)
                        .ge(ProbeRecord::getProbeTime, startTime)
                        .le(ProbeRecord::getProbeTime, endTime)
        );

        if (todayProbes.isEmpty()) {
            vo.setAvailability(0.0);
            vo.setAvgResponseTime(0.0);
            vo.setErrorRate(0.0);
            return;
        }

        long totalProbes = todayProbes.size();
        long successProbes = todayProbes.stream().filter(ProbeRecord::getSuccess).count();
        double availability = (double) successProbes / totalProbes * 100;
        double avgResponseTime = todayProbes.stream()
                .filter(ProbeRecord::getSuccess)
                .mapToLong(ProbeRecord::getResponseTime)
                .average().orElse(0.0);
        double errorRate = (double) (totalProbes - successProbes) / totalProbes * 100;

        vo.setAvailability(Math.round(availability * 10000.0) / 10000.0);
        vo.setAvgResponseTime(Math.round(avgResponseTime * 100.0) / 100.0);
        vo.setErrorRate(Math.round(errorRate * 10000.0) / 10000.0);
    }

    public void updateServiceStatusCache(String serviceCode, String status) {
        stringRedisTemplate.opsForValue().set(SERVICE_STATUS_KEY + serviceCode, status, 5, TimeUnit.MINUTES);
    }

    public void cacheServiceMetrics(String serviceCode, String metrics) {
        stringRedisTemplate.opsForValue().set(SERVICE_METRICS_KEY + serviceCode, metrics, 5, TimeUnit.MINUTES);
    }

    private AlertVO convertToAlertVO(AlertRecord record) {
        AlertVO vo = new AlertVO();
        vo.setId(record.getId());
        vo.setAlertNo(record.getAlertNo());
        vo.setRuleCode(record.getRuleCode());
        vo.setRuleName(record.getRuleName());
        vo.setServiceCode(record.getServiceCode());
        vo.setServiceName(record.getServiceName());
        vo.setAlertLevel(record.getAlertLevel());
        vo.setAlertType(record.getAlertType());
        vo.setMetricName(record.getMetricName());
        vo.setCurrentValue(record.getCurrentValue());
        vo.setThresholdValue(record.getThresholdValue());
        vo.setAlertMessage(record.getAlertMessage());
        vo.setAlertTime(record.getAlertTime());
        vo.setAlertStatus(record.getAlertStatus());
        vo.setHandlerName(record.getHandlerName());
        vo.setHandleTime(record.getHandleTime());
        return vo;
    }
}
