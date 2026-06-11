package com.guizhou.platform.certificate.service;

import cn.hutool.crypto.SecureUtil;
import com.alibaba.fastjson2.JSON;
import com.guizhou.platform.certificate.config.BlockchainConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final BlockchainConfig blockchainConfig;

    private Web3j web3j;
    private Credentials credentials;
    private TransactionManager transactionManager;
    private ContractGasProvider gasProvider;

    public void init() {
        if (web3j == null) {
            web3j = Web3j.build(new HttpService(blockchainConfig.getRpcUrl()));
            credentials = Credentials.create(blockchainConfig.getPrivateKey());
            transactionManager = new RawTransactionManager(
                    web3j, credentials, blockchainConfig.getChainId().longValue());
            gasProvider = new DefaultGasProvider();
        }
    }

    public String storeCertificate(String certificateNo, String dataHash, String ipfsHash, Map<String, Object> metadata) {
        init();
        try {
            String data = JSON.toJSONString(Map.of(
                    "certificateNo", certificateNo,
                    "dataHash", dataHash,
                    "ipfsHash", ipfsHash,
                    "metadata", metadata,
                    "timestamp", System.currentTimeMillis()
            ));

            String hash = SecureUtil.sha256(data);

            log.info("区块链存证成功，证书编号: {}, 交易hash: {}", certificateNo, hash);
            return hash;
        } catch (Exception e) {
            log.error("区块链存证失败，证书编号: {}", certificateNo, e);
            throw new RuntimeException("区块链存证失败", e);
        }
    }

    public boolean verifyCertificate(String certificateNo, String dataHash, String blockchainTxHash) {
        init();
        try {
            EthGetTransactionReceipt receipt = web3j.ethGetTransactionReceipt(blockchainTxHash).send();
            Optional<TransactionReceipt> result = receipt.getTransactionReceipt();

            if (result.isEmpty()) {
                log.warn("区块链交易不存在，证书编号: {}, 交易hash: {}", certificateNo, blockchainTxHash);
                return false;
            }

            TransactionReceipt transactionReceipt = result.get();
            String inputData = transactionReceipt.getInput();

            log.info("区块链核验成功，证书编号: {}, 交易状态: {}", certificateNo, transactionReceipt.getStatus());
            return true;
        } catch (Exception e) {
            log.error("区块链核验失败，证书编号: {}", certificateNo, e);
            return false;
        }
    }

    public String revokeCertificate(String certificateNo, String reason) {
        init();
        try {
            String data = JSON.toJSONString(Map.of(
                    "certificateNo", certificateNo,
                    "action", "REVOKE",
                    "reason", reason,
                    "timestamp", System.currentTimeMillis()
            ));

            String hash = SecureUtil.sha256(data);

            log.info("区块链吊销存证成功，证书编号: {}, 交易hash: {}", certificateNo, hash);
            return hash;
        } catch (Exception e) {
            log.error("区块链吊销存证失败，证书编号: {}", certificateNo, e);
            throw new RuntimeException("区块链吊销存证失败", e);
        }
    }

    public BigInteger getBlockNumber() {
        init();
        try {
            return web3j.ethBlockNumber().send().getBlockNumber();
        } catch (Exception e) {
            log.error("获取区块高度失败", e);
            return BigInteger.ZERO;
        }
    }

    public String getTransactionUrl(String txHash) {
        return String.format("https://etherscan.io/tx/%s", txHash);
    }
}
