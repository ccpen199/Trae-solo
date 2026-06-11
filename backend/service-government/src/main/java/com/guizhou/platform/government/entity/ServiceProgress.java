package com.guizhou.platform.government.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_progress")
public class ServiceProgress extends BaseEntity {

    private Long applyId;

    private String applyNo;

    private Integer nodeOrder;

    private String nodeName;

    private String nodeDesc;

    private Integer nodeStatus;

    private String operatorName;

    private String operatorDept;

    private LocalDateTime arriveTime;

    private LocalDateTime finishTime;

    private Integer durationMinutes;

    private String opinion;

    private String remark;
}
