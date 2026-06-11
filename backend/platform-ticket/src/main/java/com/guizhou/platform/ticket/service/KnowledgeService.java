package com.guizhou.platform.ticket.service;

import com.guizhou.platform.ticket.dto.request.KnowledgeDTO;
import com.guizhou.platform.ticket.entity.KnowledgeArticle;

import java.util.List;

public interface KnowledgeService {

    String createArticle(KnowledgeDTO dto);

    void updateArticle(Long id, KnowledgeDTO dto);

    void deleteArticle(Long id);

    KnowledgeArticle getArticle(Long id);

    List<KnowledgeArticle> searchArticles(String keyword, Integer limit);

    List<KnowledgeArticle> recommendArticles(String content);

    void syncToElasticsearch(Long articleId);
}
