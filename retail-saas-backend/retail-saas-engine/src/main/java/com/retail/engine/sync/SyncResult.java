package com.retail.engine.sync;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SyncResult {

    private boolean success;

    private String message;

    private Long queueId;

    private String syncDirection;

    private String dataType;

    private String dataKey;

    private String status;

    private Integer retryCount;

    private String errorMsg;
}
