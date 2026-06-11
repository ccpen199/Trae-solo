package com.guizhou.platform.ticket.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.ticket.dto.request.KnowledgeDTO;
import com.guizhou.platform.ticket.entity.KnowledgeArticle;
import com.guizhou.platform.ticket.mapper.KnowledgeArticleMapper;
import com.guizhou.platform.ticket.service.KnowledgeService;
import com.guizhou.platform.ticket.service.NlpService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.core.query.StringQuery;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class KnowledgeServiceImpl implements KnowledgeService {

    @Resource
    private KnowledgeArticleMapper articleMapper;

    @Resource
    private NlpService nlpService;

    @Resource(required = false)
    private ElasticsearchOperations elasticsearchOperations;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String createArticle(KnowledgeDTO dto) {
        KnowledgeArticle article = new KnowledgeArticle();
        BeanUtils.copyProperties(dto, article);
        article.setArticleNo("KA" + System.currentTimeMillis());
        article.setArticleStatus(1);
        article.setViewCount(0);
        article.setHelpfulCount(0);
        articleMapper.insert(article);

        syncToElasticsearch(article.getId());
        log.info("知识库文章创建成功: {}", article.getArticleNo());
        return article.getArticleNo();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateArticle(Long id, KnowledgeDTO dto) {
        KnowledgeArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException("文章不存在");
        }

        if (dto.getTitle() != null) {
            article.setTitle(dto.getTitle());
        }
        if (dto.getContent() != null) {
            article.setContent(dto.getContent());
        }
        if (dto.getSummary() != null) {
            article.setSummary(dto.getSummary());
        }
        if (dto.getCategory() != null) {
            article.setCategory(dto.getCategory());
        }
        if (dto.getTags() != null) {
            article.setTags(dto.getTags());
        }
        if (dto.getKeywords() != null) {
            article.setKeywords(dto.getKeywords());
        }
        articleMapper.updateById(article);

        syncToElasticsearch(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteArticle(Long id) {
        KnowledgeArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException("文章不存在");
        }
        articleMapper.deleteById(id);
    }

    @Override
    public KnowledgeArticle getArticle(Long id) {
        KnowledgeArticle article = articleMapper.selectById(id);
        if (article != null) {
            article.setViewCount(article.getViewCount() + 1);
            articleMapper.updateById(article);
        }
        return article;
    }

    @Override
    public List<KnowledgeArticle> searchArticles(String keyword, Integer limit) {
        if (limit == null) {
            limit = 10;
        }

        if (elasticsearchOperations != null) {
            try {
                String esQuery = "{\"multi_match\":{\"query\":\"" + keyword + "\",\"fields\":[\"title\",\"content\",\"keywords\"]}}";
                StringQuery query = new StringQuery(esQuery);
                SearchHits<KnowledgeArticle> hits = elasticsearchOperations.search(query, KnowledgeArticle.class);
                return hits.getSearchHits().stream()
                        .limit(limit)
                        .map(SearchHit::getContent)
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("ES搜索失败，降级为数据库查询: {}", e.getMessage());
            }
        }

        return articleMapper.selectList(new LambdaQueryWrapper<KnowledgeArticle>()
                        .eq(KnowledgeArticle::getArticleStatus, 1)
                        .and(w -> w.like(KnowledgeArticle::getTitle, keyword)
                                .or().like(KnowledgeArticle::getContent, keyword)
                                .or().like(KnowledgeArticle::getKeywords, keyword))
                        .orderByDesc(KnowledgeArticle::getViewCount))
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public List<KnowledgeArticle> recommendArticles(String content) {
        List<String> keywords = nlpService.extractKeywords(content);
        if (keywords.isEmpty()) {
            return List.of();
        }

        String keyword = keywords.get(0);
        return searchArticles(keyword, 5);
    }

    @Override
    public void syncToElasticsearch(Long articleId) {
        if (elasticsearchOperations == null) {
            log.warn("Elasticsearch未配置，跳过同步");
            return;
        }

        try {
            KnowledgeArticle article = articleMapper.selectById(articleId);
            if (article != null) {
                article.setEsId(String.valueOf(article.getId()));
                elasticsearchOperations.save(article);
                log.info("知识库文章同步ES成功: id={}", articleId);
            }
        } catch (Exception e) {
            log.error("同步ES失败: articleId={}, error={}", articleId, e.getMessage());
        }
    }
}
