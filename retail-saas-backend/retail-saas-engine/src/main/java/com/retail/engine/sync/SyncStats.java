package com.retail.engine.sync;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SyncStats {

    private Long orgId;

    private Long pendingCount;

    private Long successCount;

    private Long failedCount;

    private Long retryingCount;

    private Long conflictCount;

    private Double successRate;
}
