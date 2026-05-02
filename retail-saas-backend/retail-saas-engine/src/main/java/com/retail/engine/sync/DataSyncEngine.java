package com.retail.engine.sync;

public interface DataSyncEngine {

    SyncResult enqueueSync(String syncDirection, Long orgId, String dataType, 
                           String dataKey, Object dataContent);

    SyncResult processSync(Long queueId);

    SyncResult retrySync(Long queueId);

    ConflictResolutionResult resolveConflict(Long conflictId, String strategy, Long operatorId);

    SyncStats getSyncStats(Long orgId);

    void triggerFullSync(Long orgId);
}
