package com.guizhou.platform.ticket.service.impl;

import com.guizhou.platform.ticket.config.NlpConfig;
import com.guizhou.platform.ticket.service.NlpService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class NlpServiceImpl implements NlpService {

    @Resource
    private NlpConfig nlpConfig;

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new HashMap<>();

    static {
        CATEGORY_KEYWORDS.put("咨询", List.of("咨询", "请问", "了解", "查询", "如何", "怎么", "什么"));
        CATEGORY_KEYWORDS.put("投诉", List.of("投诉", "不满", "差评", "反映", "问题", "违规", "不合理"));
        CATEGORY_KEYWORDS.put("建议", List.of("建议", "希望", "提议", "改善", "优化", "提升"));
        CATEGORY_KEYWORDS.put("求助", List.of("求助", "困难", "帮忙", "紧急", "急需", "无法"));
        CATEGORY_KEYWORDS.put("举报", List.of("举报", "违法", "腐败", "违规操作", "弄虚作假"));
    }

    private static final Map<String, Integer> PRIORITY_KEYWORDS = new HashMap<>();

    static {
        PRIORITY_KEYWORDS.put("紧急", 3);
        PRIORITY_KEYWORDS.put("急迫", 3);
        PRIORITY_KEYWORDS.put("马上", 3);
        PRIORITY_KEYWORDS.put("立刻", 3);
        PRIORITY_KEYWORDS.put("重要", 2);
        PRIORITY_KEYWORDS.put("严重", 2);
        PRIORITY_KEYWORDS.put("尽快", 2);
        PRIORITY_KEYWORDS.put("影响", 2);
        PRIORITY_KEYWORDS.put("希望", 1);
        PRIORITY_KEYWORDS.put("建议", 0);
        PRIORITY_KEYWORDS.put("咨询", 0);
    }

    @Override
    public String analyzeCategory(String content) {
        if (content == null || content.isBlank()) {
            return "咨询";
        }

        if (nlpConfig != null && nlpConfig.getEnabled()) {
            try {
                return callNlpEndpoint("category", content);
            } catch (Exception e) {
                log.warn("NLP服务调用失败，使用规则引擎: {}", e.getMessage());
            }
        }

        return ruleBasedCategory(content);
    }

    @Override
    public Integer analyzePriority(String content) {
        if (content == null || content.isBlank()) {
            return 1;
        }

        int maxPriority = 0;
        for (Map.Entry<String, Integer> entry : PRIORITY_KEYWORDS.entrySet()) {
            if (content.contains(entry.getKey())) {
                maxPriority = Math.max(maxPriority, entry.getValue());
            }
        }
        return maxPriority;
    }

    @Override
    public List<String> extractKeywords(String content) {
        if (content == null || content.isBlank()) {
            return Collections.emptyList();
        }

        if (nlpConfig != null && nlpConfig.getEnabled()) {
            try {
                String result = callNlpEndpoint("keywords", content);
                if (result != null && !result.isBlank()) {
                    return Arrays.asList(result.split(","));
                }
            } catch (Exception e) {
                log.warn("NLP关键词提取失败，使用规则引擎: {}", e.getMessage());
            }
        }

        return ruleBasedKeywords(content);
    }

    @Override
    public Double analyzeConfidence(String content) {
        if (content == null || content.isBlank()) {
            return 0.3;
        }

        String category = analyzeCategory(content);
        if (category == null) {
            return 0.3;
        }

        List<String> keywords = CATEGORY_KEYWORDS.getOrDefault(category, Collections.emptyList());
        long matchCount = keywords.stream().filter(content::contains).count();

        if (matchCount >= 3) {
            return 0.9;
        } else if (matchCount >= 2) {
            return 0.75;
        } else if (matchCount >= 1) {
            return 0.6;
        }
        return 0.4;
    }

    @Override
    public boolean isAvailable() {
        return nlpConfig != null && nlpConfig.getEnabled();
    }

    private String ruleBasedCategory(String content) {
        Map<String, Integer> scores = new HashMap<>();
        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {
            int score = 0;
            for (String keyword : entry.getValue()) {
                if (content.contains(keyword)) {
                    score++;
                }
            }
            if (score > 0) {
                scores.put(entry.getKey(), score);
            }
        }

        return scores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("咨询");
    }

    private List<String> ruleBasedKeywords(String content) {
        Set<String> keywords = new LinkedHashSet<>();
        Pattern pattern = Pattern.compile("[\\u4e00-\\u9fa5]{2,4}");
        Matcher matcher = pattern.matcher(content);

        while (matcher.find() && keywords.size() < 10) {
            String word = matcher.group();
            if (word.length() >= 2) {
                for (List<String> categoryWords : CATEGORY_KEYWORDS.values()) {
                    if (categoryWords.contains(word)) {
                        keywords.add(word);
                    }
                }
            }
        }

        for (Map.Entry<String, List<String>> entry : CATEGORY_KEYWORDS.entrySet()) {
            for (String kw : entry.getValue()) {
                if (content.contains(kw) && keywords.size() < 10) {
                    keywords.add(kw);
                }
            }
        }

        return new ArrayList<>(keywords);
    }

    private String callNlpEndpoint(String action, String content) {
        log.info("调用NLP服务: action={}, content_length={}", action, content.length());
        return null;
    }
}
