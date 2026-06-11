package com.guizhou.platform.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class QueryBillDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "账单类型不能为空")
    private Integer billType;

    @NotBlank(message = "户号不能为空")
    private String accountNo;

    private String companyCode;

    private String billMonth;
}
