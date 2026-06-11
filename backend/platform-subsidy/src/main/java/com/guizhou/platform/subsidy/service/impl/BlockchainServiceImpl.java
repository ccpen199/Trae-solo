package com.guizhou.platform.subsidy.service.impl;

import cn.hutool.crypto.digest.DigestUtil;
import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.subsidy.entity.FundFlow;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import com.guizhou.platform.subsidy.entity.SubsidyVerifyRecord;
import com.guizhou.platform.subsidy.service.BlockchainService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class BlockchainServiceImpl implements BlockchainService {

    @Value("${subsidy.blockchain.enabled:true}")
    private Boolean enabled;

    @Value("${subsidy.blockchain.rpc-url:http://127.0.0.1:8545}")
    private String rpcUrl;

    @Value("${subsidy.blockchain.chain-id:1337}")
    private Long chainId;

    @Value("${subsidy.blockchain.private-key:}")
    private String privateKey;

    @Value("${subsidy.blockchain.contract-address:}")
    private String contractAddress;

    private Web3j web3j;
    private Credentials credentials;

    private void init() {
        if (web3j == null && enabled) {
            try {
                web3j = Web3j.build(new HttpService(rpcUrl));
                if (privateKey != null && !privateKey.isEmpty()) {
                    credentials = Credentials.create(privateKey);
                }
            } catch (Exception e) {
                log.error("初始化区块链连接失败", e);
            }
        }
    }

    @Override
    @Async
    public CompletableFuture<String> uploadGrantToChain(SubsidyGrant grant) {
        return CompletableFuture.supplyAsync(() -> {
            if (!enabled) {
                return "mock_" + DigestUtil.sha256Hex(JSON.toJSONString(grant));
            }
            try {
                init();
                String data = JSON.toJSONString(grant);
                return sendTransaction("GRANT", grant.getGrantNo(), data);
            } catch (Exception e) {
                log.error("补贴发放上链失败", e);
                return "error_" + System.currentTimeMillis();
            }
        });
    }

    @Override
    @Async
    public CompletableFuture<String> uploadFundFlowToChain(FundFlow fundFlow) {
        return CompletableFuture.supplyAsync(() -> {
            if (!enabled) {
                return "mock_" + DigestUtil.sha256Hex(JSON.toJSONString(fundFlow));
            }
            try {
                init();
                String data = JSON.toJSONString(fundFlow);
                return sendTransaction("FUND_FLOW", fundFlow.getFlowNo(), data);
            } catch (Exception e) {
                log.error("资金流转上链失败", e);
                return "error_" + System.currentTimeMillis();
            }
        });
    }

    @Override
    @Async
    public CompletableFuture<String> uploadVerifyRecordToChain(SubsidyVerifyRecord record) {
        return CompletableFuture.supplyAsync(() -> {
            if (!enabled) {
                return "mock_" + DigestUtil.sha256Hex(JSON.toJSONString(record));
            }
            try {
                init();
                String data = JSON.toJSONString(record);
                return sendTransaction("VERIFY", record.getVerifyNo(), data);
            } catch (Exception e) {
                log.error("核销记录上链失败", e);
                return "error_" + System.currentTimeMillis();
            }
        });
    }

    @Override
    @Async
    public CompletableFuture<String> uploadAuditLogToChain(String logNo, String data) {
        return CompletableFuture.supplyAsync(() -> {
            if (!enabled) {
                return "mock_" + DigestUtil.sha256Hex(logNo + data);
            }
            try {
                init();
                return sendTransaction("AUDIT_LOG", logNo, data);
            } catch (Exception e) {
                log.error("审计日志上链失败", e);
                return "error_" + System.currentTimeMillis();
            }
        });
    }

    private String sendTransaction(String type, String businessNo, String data) throws Exception {
        if (web3j == null || credentials == null) {
            return "mock_" + DigestUtil.sha256Hex(type + businessNo + data);
        }

        BigInteger nonce = web3j.ethGetTransactionCount(
                credentials.getAddress(), DefaultBlockParameterName.LATEST
        ).send().getTransactionCount();

        BigInteger gasPrice = web3j.ethGasPrice().send().getGasPrice();
        BigInteger gasLimit = BigInteger.valueOf(3000000);

        String encodedData = encodeData(type, businessNo, data);

        RawTransaction rawTransaction = RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, contractAddress, encodedData
        );

        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, chainId, credentials);
        String hexValue = Numeric.toHexString(signedMessage);

        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).send();
        if (ethSendTransaction.hasError()) {
            throw new Exception("交易发送失败: " + ethSendTransaction.getError().getMessage());
        }

        String txHash = ethSendTransaction.getTransactionHash();
        log.info("区块链交易已发送, 类型: {}, 业务号: {}, txHash: {}", type, businessNo, txHash);

        return txHash;
    }

    private String encodeData(String type, String businessNo, String data) {
        String hash = DigestUtil.sha256Hex(data);
        return Numeric.toHexString((type + "|" + businessNo + "|" + hash).getBytes());
    }

    @Override
    public String queryOnChainData(String txHash) {
        if (!enabled || txHash == null || txHash.startsWith("mock_")) {
            return "模拟数据 - " + txHash;
        }
        try {
            init();
            EthGetTransactionReceipt receipt = web3j.ethGetTransactionReceipt(txHash).send();
            if (receipt.getTransactionReceipt().isPresent()) {
                return JSON.toJSONString(receipt.getTransactionReceipt().get());
            }
            return "交易未确认";
        } catch (Exception e) {
            log.error("查询链上数据失败", e);
            return "查询失败: " + e.getMessage();
        }
    }

    @Override
    public boolean verifyOnChainData(String txHash, String originalData) {
        if (txHash == null || originalData == null) {
            return false;
        }
        if (txHash.startsWith("mock_")) {
            String expected = "mock_" + DigestUtil.sha256Hex(originalData);
            return txHash.equals(expected);
        }
        try {
            String onChainData = queryOnChainData(txHash);
            String originalHash = DigestUtil.sha256Hex(originalData);
            return onChainData.contains(originalHash);
        } catch (Exception e) {
            log.error("链上数据校验失败", e);
            return false;
        }
    }

    @Override
    public String generateMerkleRoot(List<String> dataList) {
        if (dataList == null || dataList.isEmpty()) {
            return "";
        }

        String[] hashes = dataList.stream()
                .map(DigestUtil::sha256Hex)
                .toArray(String[]::new);

        while (hashes.length > 1) {
            int newLength = (hashes.length + 1) / 2;
            String[] newHashes = new String[newLength];

            for (int i = 0; i < hashes.length; i += 2) {
                if (i + 1 < hashes.length) {
                    newHashes[i / 2] = DigestUtil.sha256Hex(hashes[i] + hashes[i + 1]);
                } else {
                    newHashes[i / 2] = DigestUtil.sha256Hex(hashes[i] + hashes[i]);
                }
            }

            hashes = newHashes;
        }

        return hashes[0];
    }
}
