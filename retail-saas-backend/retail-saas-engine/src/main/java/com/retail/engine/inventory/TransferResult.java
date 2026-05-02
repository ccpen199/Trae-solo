package com.retail.engine.inventory;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransferResult {

    private boolean success;

    private String message;

    private Long requisitionId;

    private String requisitionNo;

    private String fromStatus;

    private String toStatus;

    private String newStatus;
}
