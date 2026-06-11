package com.guizhou.platform.ticket.service;

import java.util.List;

public interface NlpService {

    String analyzeCategory(String content);

    Integer analyzePriority(String content);

    List<String> extractKeywords(String content);

    Double analyzeConfidence(String content);

    boolean isAvailable();
}
