package com.retailpos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MemberDTO {
    private Long id;
    private String memberCode;
    private String phone;
    private String name;
    private String level;
    private Integer pointsBalance;
    private BigDecimal storedBalance;
    private boolean found;
    private String message;
}
