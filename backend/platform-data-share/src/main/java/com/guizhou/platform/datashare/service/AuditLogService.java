package com.guizhou.platform.datashare.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.SecureUtil;
import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.datashare.dto.ApiVisitLogQueryDTO;
import com.guizhou.platform.datashare.entity.ApiVisitLog;
import com.guizhou.platform.datashare.mapper.ApiVisitLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.core.IndexedObjectInformation;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.IndexQuery;
import org.springframework.data.elasticsearch.core.query.IndexQueryBuilder;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final ApiVisitLogMapper apiVisitLogMapper;
    private final RocketMQTemplate rocketMQTemplate;
    private final ElasticsearchTemplate elasticsearchTemplate;

    @Value("${data-share.audit.blockchain-enabled:true}")
    private boolean blockchainEnabled;

    @Value("${data-share.audit.es-index:api_visit_log}")
    private String esIndex;

    private static final String AUDIT_LOG_TOPIC = "data-share-audit-log";

    @Async
    public CompletableFuture<Void> saveLogAsync(ApiVisitLog log) {
        return CompletableFuture.runAsync(() -> {
            try {
                if (log.getRequestTime() == null) {
                    log.setRequestTime(LocalDateTime.now());
                }
                if (log.getResponseTime() == null) {
                    log.setResponseTime(LocalDateTime.now());
                }
                if (log.getCostTime() == null && log.getRequestTime() != null && log.getResponseTime() != null) {
                    log.setCostTime(java.time.Duration.between(log.getRequestTime(), log.getResponseTime()).toMillis());
                }

                apiVisitLogMapper.insert(log);

                sendToMQ(log);

                indexToES(log);

                if (blockchainEnabled) {
                    uploadToBlockchain(log);
                }
            } catch (Exception e) {
                log.error("保存审计日志失败: {}", e.getMessage(), e);
            }
        });
    }

    public ApiVisitLog getLog(Long id) {
        return apiVisitLogMapper.selectById(id);
    }

    public PageResult<ApiVisitLog> queryLogs(ApiVisitLogQueryDTO dto) {
        LambdaQueryWrapper<ApiVisitLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(dto.getTraceId() != null, ApiVisitLog::getTraceId, dto.getTraceId())
                .like(dto.getApiCode() != null, ApiVisitLog::getApiCode, dto.getApiCode())
                .like(dto.getApiName() != null, ApiVisitLog::getApiName, dto.getApiName())
                .eq(dto.getUserId() != null, ApiVisitLog::getUserId, dto.getUserId())
                .eq(dto.getDeptCode() != null, ApiVisitLog::getDeptCode, dto.getDeptCode())
                .eq(dto.getClientIp() != null, ApiVisitLog::getClientIp, dto.getClientIp())
                .eq(dto.getSuccess() != null, ApiVisitLog::getSuccess, dto.getSuccess())
                .ge(dto.getStartTime() != null, ApiVisitLog::getRequestTime, dto.getStartTime())
                .le(dto.getEndTime() != null, ApiVisitLog::getRequestTime, dto.getEndTime())
                .eq(ApiVisitLog::getDeleted, false)
                .orderByDesc(ApiVisitLog::getRequestTime);

        Page<ApiVisitLog> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        apiVisitLogMapper.selectPage(page, wrapper);

        return PageResult.of(page.getRecords(), page.getTotal(), dto.getPageNum(), dto.getPageSize());
    }

    public Map<String, Object> getStatistics(LocalDateTime startTime, LocalDateTime endTime) {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<ApiVisitLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(startTime != null, ApiVisitLog::getRequestTime, startTime)
                .le(endTime != null, ApiVisitLog::getRequestTime, endTime)
                .eq(ApiVisitLog::getDeleted, false);

        Long totalCount = apiVisitLogMapper.selectCount(wrapper);
        result.put("totalVisitCount", totalCount);

        wrapper.eq(ApiVisitLog::getSuccess, true);
        Long successCount = apiVisitLogMapper.selectCount(wrapper);
        result.put("successCount", successCount);
        result.put("successRate", totalCount > 0 ? (successCount * 100.0 / totalCount) : 0);

        wrapper.clear();
        wrapper.ge(startTime != null, ApiVisitLog::getRequestTime, startTime)
                .le(endTime != null, ApiVisitLog::getRequestTime, endTime)
                .eq(ApiVisitLog::getDeleted, false)
                .groupBy(ApiVisitLog::getApiCode)
                .orderByDesc(ApiVisitLog::getId);

        List<Map<String, Object>> topApis = new ArrayList<>();
        result.put("topApis", topApis);

        return result;
    }

    public boolean verifyBlockchainHash(Long logId) {
        ApiVisitLog log = apiVisitLogMapper.selectById(logId);
        if (log == null || StrUtil.isBlank(log.getBlockchainHash())) {
            return false;
        }

        String calculatedHash = calculateBlockchainHash(log);
        return calculatedHash.equals(log.getBlockchainHash());
    }

    private void sendToMQ(ApiVisitLog log) {
        try {
            rocketMQTemplate.convertAndSend(AUDIT_LOG_TOPIC, JSON.toJSONString(log));
            log.debug("审计日志已发送到RocketMQ: {}", log.getTraceId());
        } catch (Exception e) {
            log.warn("发送审计日志到MQ失败: {}", e.getMessage());
        }
    }

    private void indexToES(ApiVisitLog log) {
        try {
            String indexName = esIndex + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy.MM"));
            IndexCoordinates indexCoordinates = IndexCoordinates.of(indexName);

            IndexQuery indexQuery = new IndexQueryBuilder()
                    .withId(log.getId().toString())
                    .withObject(JSON.parseObject(JSON.toJSONString(log), Map.class))
                    .build();

            IndexedObjectInformation info = elasticsearchTemplate.index(indexQuery, indexCoordinates);
            log.debug("审计日志已索引到ES: {}", info.getId());
        } catch (Exception e) {
            log.warn("索引审计日志到ES失败: {}", e.getMessage());
        }
    }

    private void uploadToBlockchain(ApiVisitLog log) {
        try {
            String hash = calculateBlockchainHash(log);
            log.setBlockchainHash(hash);
            apiVisitLogMapper.updateById(log);

            Map<String, Object> blockchainData = new HashMap<>();
            blockchainData.put("traceId", log.getTraceId());
            blockchainData.put("hash", hash);
            blockchainData.put("timestamp", System.currentTimeMillis());

            rocketMQTemplate.convertAndSend("blockchain-deposit-topic", JSON.toJSONString(blockchainData));
            log.debug("审计日志已发送到区块链存证: {}", log.getTraceId());
        } catch (Exception e) {
            log.warn("区块链存证失败: {}", e.getMessage());
        }
    }

    private String calculateBlockchainHash(ApiVisitLog log) {
        StringBuilder sb = new StringBuilder();
        sb.append(log.getTraceId()).append("|");
        sb.append(log.getApiCode()).append("|");
        sb.append(log.getUserId()).append("|");
        sb.append(log.getRequestTime()).append("|");
        sb.append(log.getSuccess()).append("|");
        sb.append(log.getCostTime()).append("|");
        sb.append(log.getClientIp());
        return SecureUtil.sha256(sb.toString());
    }
}
