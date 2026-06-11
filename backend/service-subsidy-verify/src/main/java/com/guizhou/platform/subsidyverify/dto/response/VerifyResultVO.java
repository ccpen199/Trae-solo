package com.guizhou.platform.subsidyverify.dto.response;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VerifyResultVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long verifyRecordId;

    private String verifyNo;

    private String voucherNo;

    private Long beneficiaryId;

    private String beneficiaryName;

    private Long merchantId;

    private String merchantName;

    private BigDecimal originalAmount;

    private BigDecimal subsidyAmount;

    private BigDecimal selfPayAmount;

    private Integer verifyStatus;

    private String verifyStatusDesc;

    private LocalDateTime verifyTime;

    private String certificateNo;

    private String transactionNo;

    private String subsidyServiceTxId;
}
