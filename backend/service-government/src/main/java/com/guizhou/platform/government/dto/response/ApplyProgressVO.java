package com.guizhou.platform.government.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ApplyProgressVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long applyId;

    private String applyNo;

    private String itemName;

    private Integer applyStatus;

    private String applyStatusDesc;

    private String applicantName;

    private LocalDateTime applyTime;

    private LocalDateTime acceptTime;

    private LocalDateTime completeTime;

    private Integer processDays;

    private Integer remainDays;

    private List<ProgressNodeVO> progressNodes;

    @Data
    public static class ProgressNodeVO implements Serializable {

        private static final long serialVersionUID = 1L;

        private Integer nodeOrder;

        private String nodeName;

        private String nodeDesc;

        private Integer nodeStatus;

        private String nodeStatusDesc;

        private String operatorName;

        private String operatorDept;

        private LocalDateTime arriveTime;

        private LocalDateTime finishTime;

        private Integer durationMinutes;

        private String opinion;
    }
}
