package com.guizhou.platform.datashare.service;

import cn.hutool.core.util.DesensitizedUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.SecureUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.datashare.entity.DataDesensitizeRule;
import com.guizhou.platform.datashare.enums.DesensitizeStrategyEnum;
import com.guizhou.platform.datashare.enums.DesensitizeTypeEnum;
import com.guizhou.platform.datashare.mapper.DataDesensitizeRuleMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataDesensitizeService {

    private final DataDesensitizeRuleMapper desensitizeRuleMapper;
    private final StringRedisTemplate stringRedisTemplate;

    @Value("${data-share.desensitize.enabled:true}")
    private boolean desensitizeEnabled;

    @Value("${data-share.desensitize.default-strategy:mask}")
    private String defaultStrategy;

    private static final String RULE_CACHE_PREFIX = "data-share:desensitize:rule:";

    private final Map<String, Pattern> patternCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        for (DesensitizeTypeEnum type : DesensitizeTypeEnum.values()) {
            if (type.getPattern() != null) {
                patternCache.put(type.getCode(), Pattern.compile(type.getPattern()));
            }
        }
    }

    public Object desensitize(Long apiId, String apiCode, Object data) {
        if (!desensitizeEnabled || data == null) {
            return data;
        }

        List<DataDesensitizeRule> rules = getRules(apiId, apiCode);
        if (rules.isEmpty()) {
            return data;
        }

        String jsonString = JSON.toJSONString(data);
        Object parseResult = JSON.parse(jsonString);

        if (parseResult instanceof JSONObject) {
            desensitizeJSONObject((JSONObject) parseResult, rules);
        } else if (parseResult instanceof JSONArray) {
            desensitizeJSONArray((JSONArray) parseResult, rules);
        }

        return parseResult;
    }

    public String desensitizeValue(String value, DataDesensitizeRule rule) {
        if (StrUtil.isBlank(value)) {
            return value;
        }

        String strategy = rule.getDesensitizeStrategy() != null ? rule.getDesensitizeStrategy() : defaultStrategy;

        return switch (DesensitizeStrategyEnum.valueOf(strategy.toUpperCase())) {
            case MASK -> maskValue(value, rule);
            case HASH -> hashValue(value, rule);
            case REPLACE -> rule.getReplaceValue() != null ? rule.getReplaceValue() : "***";
            case TRUNCATE -> truncateValue(value, rule);
            case ENCRYPT -> encryptValue(value, rule);
        };
    }

    public List<DataDesensitizeRule> getRulesByApiId(Long apiId) {
        return desensitizeRuleMapper.selectByApiId(apiId);
    }

    public List<DataDesensitizeRule> getGlobalRules() {
        return desensitizeRuleMapper.selectGlobalRules();
    }

    public void saveRule(DataDesensitizeRule rule) {
        if (rule.getId() == null) {
            desensitizeRuleMapper.insert(rule);
        } else {
            desensitizeRuleMapper.updateById(rule);
        }
        clearRuleCache(rule.getApiId(), rule.getApiCode());
    }

    public void deleteRule(Long id) {
        DataDesensitizeRule rule = desensitizeRuleMapper.selectById(id);
        if (rule == null) {
            throw new BusinessException("脱敏规则不存在");
        }
        desensitizeRuleMapper.deleteById(id);
        clearRuleCache(rule.getApiId(), rule.getApiCode());
    }

    public String autoDetectAndDesensitize(String value) {
        if (StrUtil.isBlank(value)) {
            return value;
        }

        for (DesensitizeTypeEnum type : DesensitizeTypeEnum.values()) {
            if (type.getPattern() != null && matchesPattern(value, type.getCode())) {
                return desensitizeByType(value, type);
            }
        }
        return value;
    }

    private List<DataDesensitizeRule> getRules(Long apiId, String apiCode) {
        List<DataDesensitizeRule> rules = new ArrayList<>();

        String cacheKey = RULE_CACHE_PREFIX + (apiId != null ? apiId : apiCode);
        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return JSON.parseArray(cached, DataDesensitizeRule.class);
        }

        if (apiId != null) {
            rules.addAll(desensitizeRuleMapper.selectByApiId(apiId));
        } else if (apiCode != null) {
            rules.addAll(desensitizeRuleMapper.selectByApiCode(apiCode));
        }
        rules.addAll(desensitizeRuleMapper.selectGlobalRules());

        stringRedisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(rules));

        return rules;
    }

    private void desensitizeJSONObject(JSONObject jsonObject, List<DataDesensitizeRule> rules) {
        for (Map.Entry<String, Object> entry : jsonObject.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();

            if (value instanceof JSONObject) {
                desensitizeJSONObject((JSONObject) value, rules);
            } else if (value instanceof JSONArray) {
                desensitizeJSONArray((JSONArray) value, rules);
            } else if (value instanceof String) {
                for (DataDesensitizeRule rule : rules) {
                    if (fieldName.equalsIgnoreCase(rule.getFieldName())
                            || matchesPattern((String) value, rule.getPattern())) {
                        String desensitized = desensitizeValue((String) value, rule);
                        entry.setValue(desensitized);
                        break;
                    }
                }
            }
        }
    }

    private void desensitizeJSONArray(JSONArray jsonArray, List<DataDesensitizeRule> rules) {
        for (int i = 0; i < jsonArray.size(); i++) {
            Object item = jsonArray.get(i);
            if (item instanceof JSONObject) {
                desensitizeJSONObject((JSONObject) item, rules);
            } else if (item instanceof JSONArray) {
                desensitizeJSONArray((JSONArray) item, rules);
            } else if (item instanceof String) {
                String desensitized = autoDetectAndDesensitize((String) item);
                jsonArray.set(i, desensitized);
            }
        }
    }

    private String maskValue(String value, DataDesensitizeRule rule) {
        int keepLeft = rule.getKeepLeft() != null ? rule.getKeepLeft() : 3;
        int keepRight = rule.getKeepRight() != null ? rule.getKeepRight() : 4;
        String maskChar = rule.getMaskChar() != null ? rule.getMaskChar() : "*";

        return StrUtil.hide(value, keepLeft, value.length() - keepRight);
    }

    private String hashValue(String value, DataDesensitizeRule rule) {
        String algorithm = rule.getHashAlgorithm() != null ? rule.getHashAlgorithm() : "SHA-256";
        return switch (algorithm.toLowerCase()) {
            case "md5" -> SecureUtil.md5(value);
            case "sha1" -> SecureUtil.sha1(value);
            case "sha256" -> SecureUtil.sha256(value);
            default -> SecureUtil.sha256(value);
        };
    }

    private String truncateValue(String value, DataDesensitizeRule rule) {
        int keepLeft = rule.getKeepLeft() != null ? rule.getKeepLeft() : 6;
        if (value.length() <= keepLeft) {
            return value;
        }
        return value.substring(0, keepLeft) + "...";
    }

    private String encryptValue(String value, DataDesensitizeRule rule) {
        String key = rule.getEncryptKey() != null ? rule.getEncryptKey() : "guizhou-datashare-key";
        return SecureUtil.aes(key.getBytes()).encryptBase64(value);
    }

    private boolean matchesPattern(String value, String patternStr) {
        if (StrUtil.isBlank(patternStr) || StrUtil.isBlank(value)) {
            return false;
        }
        Pattern pattern = patternCache.computeIfAbsent(patternStr, Pattern::compile);
        return pattern.matcher(value).matches();
    }

    private String desensitizeByType(String value, DesensitizeTypeEnum type) {
        return switch (type) {
            case PHONE -> DesensitizedUtil.mobilePhone(value);
            case ID_CARD -> DesensitizedUtil.idCardNum(value, 3, 4);
            case BANK_CARD -> DesensitizedUtil.bankCard(value);
            case EMAIL -> DesensitizedUtil.email(value);
            case NAME -> DesensitizedUtil.chineseName(value);
            default -> StrUtil.hide(value, value.length() / 2, value.length() / 2);
        };
    }

    private void clearRuleCache(Long apiId, String apiCode) {
        if (apiId != null) {
            stringRedisTemplate.delete(RULE_CACHE_PREFIX + apiId);
        }
        if (apiCode != null) {
            stringRedisTemplate.delete(RULE_CACHE_PREFIX + apiCode);
        }
    }
}
