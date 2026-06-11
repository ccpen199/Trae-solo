package com.guizhou.platform.ticket.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class DispatchResultVO {

    private Long ticketId;

    private String ticketNo;

    private String nlpCategory;

    private String nlpKeywords;

    private Double nlpConfidence;

    private List<DepartmentCandidate> candidates;

    private DepartmentCandidate selectedDepartment;

    private Integer dispatchType;

    private String dispatchTypeDesc;

    private String dispatchReason;

    @Data
    public static class DepartmentCandidate {

        private Long departmentId;

        private String departmentName;

        private Double matchScore;

        private Double historyScore;

        private Double ruleScore;

        private Double nlpScore;

        private String matchReason;
    }
}
