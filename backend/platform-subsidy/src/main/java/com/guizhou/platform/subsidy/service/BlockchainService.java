package com.guizhou.platform.subsidy.service;

import com.guizhou.platform.subsidy.entity.FundFlow;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import com.guizhou.platform.subsidy.entity.SubsidyVerifyRecord;

import java.util.concurrent.CompletableFuture;

public interface BlockchainService {

    CompletableFuture<String> uploadGrantToChain(SubsidyGrant grant);

    CompletableFuture<String> uploadFundFlowToChain(FundFlow fundFlow);

    CompletableFuture<String> uploadVerifyRecordToChain(SubsidyVerifyRecord record);

    CompletableFuture<String> uploadAuditLogToChain(String logNo, String data);

    String queryOnChainData(String txHash);

    boolean verifyOnChainData(String txHash, String originalData);

    String generateMerkleRoot(List<String> dataList);
}
