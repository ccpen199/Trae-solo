package com.guizhou.platform.monitor.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.monitor.dto.request.AlertRuleDTO;
import com.guizhou.platform.monitor.dto.response.AlertVO;
import com.guizhou.platform.monitor.entity.AlertRecord;
import com.guizhou.platform.monitor.entity.AlertRule;
import com.guizhou.platform.monitor.entity.ServiceInstance;
import com.guizhou.platform.monitor.enums.AlertLevelEnum;
import com.guizhou.platform.monitor.mapper.AlertRecordMapper;
import com.guizhou.platform.monitor.mapper.AlertRuleMapper;
import com.guizhou.platform.monitor.mapper.ServiceInstanceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRuleMapper alertRuleMapper;
    private final AlertRecordMapper alertRecordMapper;
    private final ServiceInstanceMapper serviceInstanceMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final RestTemplate restTemplate;

    @Value("${monitor.alert.enabled:true}")
    private boolean alertEnabled;

    @Value("${monitor.alert.dingtalk-webhook:}")
    private String dingtalkWebhook;

    @Value("${monitor.alert.webhook-url:}")
    private String webhookUrl;

    @Value("${monitor.alert.sms-template:}")
    private String smsTemplate;

    public AlertRule createRule(AlertRuleDTO dto) {
        AlertRule rule = new AlertRule();
        BeanUtils.copyProperties(dto, rule);
        alertRuleMapper.insert(rule);
        return rule;
    }

    public AlertRule updateRule(Long ruleId, AlertRuleDTO dto) {
        AlertRule rule = alertRuleMapper.selectById(ruleId);
        if (rule == null) {
            throw new RuntimeException("告警规则不存在");
        }
        BeanUtils.copyProperties(dto, rule);
        rule.setId(ruleId);
        alertRuleMapper.updateById(rule);
        return rule;
    }

    public void deleteRule(Long ruleId) {
        alertRuleMapper.deleteById(ruleId);
    }

    public IPage<AlertRule> listRules(int pageNum, int pageSize) {
        return alertRuleMapper.selectPage(
                new Page<>(pageNum, pageSize),
                new LambdaQueryWrapper<AlertRule>().orderByDesc(AlertRule::getCreateTime)
        );
    }

    public List<AlertRule> getEnabledRules() {
        return alertRuleMapper.selectList(
                new LambdaQueryWrapper<AlertRule>().eq(AlertRule::getEnabled, true)
        );
    }

    public AlertRecord fireAlert(AlertRule rule, ServiceInstance instance, String currentValue) {
        AlertRecord record = new AlertRecord();
        record.setAlertNo("ALT" + IdUtil.getSnowflakeNextIdStr());
        record.setRuleId(rule.getId());
        record.setRuleCode(rule.getRuleCode());
        record.setRuleName(rule.getRuleName());
        record.setServiceId(instance.getId());
        record.setServiceCode(instance.getServiceCode());
        record.setServiceName(instance.getServiceName());
        record.setAlertLevel(rule.getAlertLevel());
        record.setAlertType(rule.getRuleType());
        record.setMetricName(rule.getMetricName());
        record.setCurrentValue(currentValue);
        record.setThresholdValue(rule.getThreshold().toString());
        record.setAlertMessage(buildAlertMessage(rule, instance, currentValue));
        record.setAlertTime(LocalDateTime.now());
        record.setAlertStatus("FIRING");
        record.setNotifyChannels(rule.getNotifyChannels());

        alertRecordMapper.insert(record);

        if (alertEnabled) {
            sendNotification(record, rule.getNotifyChannels());
        }

        log.warn("告警触发: {} - 服务[{}] {} 触发规则[{}] 当前值:{}", 
                record.getAlertLevel(), instance.getServiceCode(), 
                instance.getServiceName(), rule.getRuleName(), currentValue);
        return record;
    }

    public AlertRecord resolveAlert(Long alertId, String handlerId, String handlerName, String handleOpinion) {
        AlertRecord record = alertRecordMapper.selectById(alertId);
        if (record == null) {
            throw new RuntimeException("告警记录不存在");
        }
        record.setAlertStatus("RESOLVED");
        record.setHandlerId(handlerId);
        record.setHandlerName(handlerName);
        record.setHandleTime(LocalDateTime.now());
        record.setHandleOpinion(handleOpinion);
        alertRecordMapper.updateById(record);
        return record;
    }

    public IPage<AlertVO> listAlerts(String alertStatus, String alertLevel, String serviceCode, int pageNum, int pageSize) {
        LambdaQueryWrapper<AlertRecord> wrapper = new LambdaQueryWrapper<>();
        if (alertStatus != null) {
            wrapper.eq(AlertRecord::getAlertStatus, alertStatus);
        }
        if (alertLevel != null) {
            wrapper.eq(AlertRecord::getAlertLevel, alertLevel);
        }
        if (serviceCode != null) {
            wrapper.eq(AlertRecord::getServiceCode, serviceCode);
        }
        wrapper.orderByDesc(AlertRecord::getAlertTime);

        IPage<AlertRecord> page = alertRecordMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
        return page.convert(this::convertToAlertVO);
    }

    public void evaluateRules(ServiceInstance instance, double availability, double avgResponseTime, double errorRate) {
        List<AlertRule> enabledRules = getEnabledRules();
        for (AlertRule rule : enabledRules) {
            if (!matchesService(rule, instance)) {
                continue;
            }
            double metricValue = getMetricValue(rule.getMetricName(), availability, avgResponseTime, errorRate);
            if (evaluateCondition(metricValue, rule.getOperator(), rule.getThreshold().doubleValue())) {
                boolean alreadyFiring = alertRecordMapper.selectCount(
                        new LambdaQueryWrapper<AlertRecord>()
                                .eq(AlertRecord::getRuleId, rule.getId())
                                .eq(AlertRecord::getServiceId, instance.getId())
                                .eq(AlertRecord::getAlertStatus, "FIRING")
                ) > 0;
                if (!alreadyFiring) {
                    fireAlert(rule, instance, String.valueOf(metricValue));
                }
            }
        }
    }

    private boolean matchesService(AlertRule rule, ServiceInstance instance) {
        return true;
    }

    private double getMetricValue(String metricName, double availability, double avgResponseTime, double errorRate) {
        return switch (metricName) {
            case "availability" -> availability;
            case "response_time" -> avgResponseTime;
            case "error_rate" -> errorRate;
            default -> 0.0;
        };
    }

    private boolean evaluateCondition(double value, String operator, double threshold) {
        return switch (operator) {
            case ">" -> value > threshold;
            case ">=" -> value >= threshold;
            case "<" -> value < threshold;
            case "<=" -> value <= threshold;
            case "==" -> value == threshold;
            case "!=" -> value != threshold;
            default -> false;
        };
    }

    private String buildAlertMessage(AlertRule rule, ServiceInstance instance, String currentValue) {
        return String.format("服务[%s]指标[%s]当前值[%s]已触发阈值[%s %s]，告警级别[%s]",
                instance.getServiceName(), rule.getMetricName(), currentValue,
                rule.getOperator(), rule.getThreshold(), rule.getAlertLevel());
    }

    private void sendNotification(AlertRecord record, String channels) {
        if (channels == null || channels.isEmpty()) {
            return;
        }
        String[] channelArray = channels.split(",");
        for (String channel : channelArray) {
            try {
                switch (channel.trim().toUpperCase()) {
                    case "SMS" -> sendSms(record);
                    case "EMAIL" -> sendEmail(record);
                    case "DINGTALK" -> sendDingtalk(record);
                    case "WEBHOOK" -> sendWebhook(record);
                    default -> log.warn("未知的告警通知渠道: {}", channel);
                }
            } catch (Exception e) {
                log.error("发送{}告警通知失败: {}", channel, e.getMessage());
            }
        }
        record.setNotifyResult("NOTIFIED:" + channels);
        alertRecordMapper.updateById(record);
    }

    private void sendSms(AlertRecord record) {
        String message = smsTemplate
                .replace("{serviceName}", record.getServiceName())
                .replace("{level}", record.getAlertLevel())
                .replace("{message}", record.getAlertMessage());
        log.info("发送短信告警: {}", message);
    }

    private void sendEmail(AlertRecord record) {
        log.info("发送邮件告警: 服务[{}] 级别[{}] 消息[{}]", 
                record.getServiceName(), record.getAlertLevel(), record.getAlertMessage());
    }

    private void sendDingtalk(AlertRecord record) {
        if (dingtalkWebhook == null || dingtalkWebhook.isEmpty()) {
            return;
        }
        Map<String, Object> message = new HashMap<>();
        message.put("msgtype", "markdown");
        Map<String, String> markdown = new HashMap<>();
        markdown.put("title", "【贵州数字平台】服务告警");
        markdown.put("text", String.format("### 服务告警通知\n> **服务**: %s\n> **级别**: %s\n> **指标**: %s\n> **当前值**: %s\n> **阈值**: %s\n> **时间**: %s",
                record.getServiceName(), record.getAlertLevel(), record.getMetricName(),
                record.getCurrentValue(), record.getThresholdValue(), record.getAlertTime()));
        message.put("markdown", markdown);
        try {
            restTemplate.postForObject(dingtalkWebhook, message, String.class);
        } catch (Exception e) {
            log.error("发送钉钉告警失败: {}", e.getMessage());
        }
    }

    private void sendWebhook(AlertRecord record) {
        if (webhookUrl == null || webhookUrl.isEmpty()) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("alertNo", record.getAlertNo());
        payload.put("serviceCode", record.getServiceCode());
        payload.put("alertLevel", record.getAlertLevel());
        payload.put("metricName", record.getMetricName());
        payload.put("currentValue", record.getCurrentValue());
        payload.put("thresholdValue", record.getThresholdValue());
        payload.put("message", record.getAlertMessage());
        payload.put("alertTime", record.getAlertTime().toString());
        try {
            restTemplate.postForObject(webhookUrl, payload, String.class);
        } catch (Exception e) {
            log.error("发送Webhook告警失败: {}", e.getMessage());
        }
    }

    private AlertVO convertToAlertVO(AlertRecord record) {
        AlertVO vo = new AlertVO();
        BeanUtils.copyProperties(record, vo);
        return vo;
    }
}
