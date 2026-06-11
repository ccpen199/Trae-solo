package com.guizhou.platform.subsidy.enums;

import lombok.Getter;

@Getter
public enum FundFlowTypeEnum {

    BUDGET_ALLOCATE(1, "财政预算下达", "TREASURY", "BANK"),
    BANK_TRANSFER(2, "银行资金划转", "BANK", "BANK"),
    SUBSIDY_GRANT(3, "补贴发放", "BANK", "BENEFICIARY"),
    SUBSIDY_VERIFY(4, "补贴核销", "BENEFICIARY", "MERCHANT"),
    MERCHANT_SETTLE(5, "商户结算", "MERCHANT", "BANK"),
    REFUND(6, "资金退回", "BENEFICIARY", "TREASURY"),
    FROZEN(7, "资金冻结", "BENEFICIARY", "FROZEN"),
    UNFROZEN(8, "资金解冻", "FROZEN", "BENEFICIARY");

    private final Integer code;
    private final String desc;
    private final String fromType;
    private final String toType;

    FundFlowTypeEnum(Integer code, String desc, String fromType, String toType) {
        this.code = code;
        this.desc = desc;
        this.fromType = fromType;
        this.toType = toType;
    }

    public static FundFlowTypeEnum getByCode(Integer code) {
        for (FundFlowTypeEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
