package com.retail.engine.sync;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConflictResolutionResult {

    private boolean success;

    private String message;

    private Long conflictId;

    private String resolveStrategy;

    private String resolveStatus;
}
