package com.guizhou.platform.monitor.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class MonitorDashboardVO {

    private Integer totalServices;

    private Integer upCount;

    private Integer downCount;

    private Integer degradedCount;

    private Integer activeAlertCount;

    private Integer criticalAlertCount;

    private Double overallAvailability;

    private Double slaComplianceRate;

    private List<ServiceHealthVO> serviceHealthList;

    private List<AlertVO> recentAlerts;
}
