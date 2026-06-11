package com.guizhou.platform.monitor.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.monitor.dto.response.SlaReportVO;
import com.guizhou.platform.monitor.entity.AlertRecord;
import com.guizhou.platform.monitor.entity.ServiceInstance;
import com.guizhou.platform.monitor.entity.SlaRecord;
import com.guizhou.platform.monitor.enums.ServiceStatusEnum;
import com.guizhou.platform.monitor.mapper.AlertRecordMapper;
import com.guizhou.platform.monitor.mapper.ServiceInstanceMapper;
import com.guizhou.platform.monitor.mapper.SlaRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ServiceInstanceMapper serviceInstanceMapper;
    private final SlaRecordMapper slaRecordMapper;
    private final AlertRecordMapper alertRecordMapper;

    public Map<String, Object> generateAvailabilityReport(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        List<ServiceInstance> services = serviceInstanceMapper.selectList(null);

        report.put("reportTitle", "服务可用性报表");
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalServices", services.size());

        long upCount = services.stream().filter(s -> ServiceStatusEnum.UP.getCode().equals(s.getStatus())).count();
        long downCount = services.stream().filter(s -> ServiceStatusEnum.DOWN.getCode().equals(s.getStatus())).count();
        report.put("upCount", upCount);
        report.put("downCount", downCount);

        List<Map<String, Object>> serviceReports = services.stream().map(service -> {
            Map<String, Object> item = new HashMap<>();
            item.put("serviceCode", service.getServiceCode());
            item.put("serviceName", service.getServiceName());
            item.put("currentStatus", service.getStatus());

            List<SlaRecord> records = slaRecordMapper.selectList(
                    new LambdaQueryWrapper<SlaRecord>()
                            .eq(SlaRecord::getServiceCode, service.getServiceCode())
                            .ge(SlaRecord::getCheckMonth, startDate.withDayOfMonth(1))
                            .le(SlaRecord::getCheckMonth, endDate.withDayOfMonth(1))
            );
            if (!records.isEmpty()) {
                BigDecimal avgAvailability = records.stream()
                        .map(SlaRecord::getActualAvailability)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(records.size()), 4, RoundingMode.HALF_UP);
                item.put("avgAvailability", avgAvailability);
                long qualifiedCount = records.stream().filter(r -> "QUALIFIED".equals(r.getCheckStatus())).count();
                item.put("slaComplianceRate", BigDecimal.valueOf((double) qualifiedCount / records.size() * 100)
                        .setScale(2, RoundingMode.HALF_UP));
            }
            return item;
        }).collect(Collectors.toList());

        report.put("services", serviceReports);
        return report;
    }

    public Map<String, Object> generateAlertStatistics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        report.put("reportTitle", "告警统计报表");
        report.put("startDate", startDate);
        report.put("endDate", endDate);

        List<AlertRecord> alerts = alertRecordMapper.selectList(
                new LambdaQueryWrapper<AlertRecord>()
                        .ge(AlertRecord::getAlertTime, startDateTime)
                        .le(AlertRecord::getAlertTime, endDateTime)
        );

        report.put("totalAlerts", alerts.size());
        report.put("firingCount", alerts.stream().filter(a -> "FIRING".equals(a.getAlertStatus())).count());
        report.put("resolvedCount", alerts.stream().filter(a -> "RESOLVED".equals(a.getAlertStatus())).count());

        Map<String, Long> levelDistribution = alerts.stream()
                .collect(Collectors.groupingBy(AlertRecord::getAlertLevel, Collectors.counting()));
        report.put("levelDistribution", levelDistribution);

        Map<String, Long> serviceDistribution = alerts.stream()
                .collect(Collectors.groupingBy(AlertRecord::getServiceCode, Collectors.counting()));
        report.put("serviceDistribution", serviceDistribution);

        return report;
    }

    public Map<String, Object> generateSlaComplianceReport(YearMonth month) {
        Map<String, Object> report = new HashMap<>();
        LocalDate checkMonth = month.atDay(1);

        report.put("reportTitle", "SLA达标率报表");
        report.put("checkMonth", checkMonth);

        List<SlaRecord> records = slaRecordMapper.selectList(
                new LambdaQueryWrapper<SlaRecord>().eq(SlaRecord::getCheckMonth, checkMonth)
        );

        report.put("totalRecords", records.size());
        long qualifiedCount = records.stream().filter(r -> "QUALIFIED".equals(r.getCheckStatus())).count();
        report.put("qualifiedCount", qualifiedCount);
        report.put("unqualifiedCount", records.size() - qualifiedCount);

        if (!records.isEmpty()) {
            report.put("complianceRate", BigDecimal.valueOf((double) qualifiedCount / records.size() * 100)
                    .setScale(2, RoundingMode.HALF_UP));
        }

        return report;
    }
}
