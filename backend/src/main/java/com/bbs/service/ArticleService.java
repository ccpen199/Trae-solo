package com.bbs.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bbs.common.PageResult;
import com.bbs.dto.ArticleDTO;
import com.bbs.entity.Article;
import com.bbs.entity.Category;
import com.bbs.entity.SubCategory;
import com.bbs.entity.User;
import com.bbs.mapper.ArticleMapper;
import com.bbs.mapper.CategoryMapper;
import com.bbs.mapper.SubCategoryMapper;
import com.bbs.mapper.UserMapper;
import javax.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ArticleService {
    
    private final ArticleMapper articleMapper;
    private final CategoryMapper categoryMapper;
    private final SubCategoryMapper subCategoryMapper;
    private final UserMapper userMapper;
    private final JdbcTemplate jdbcTemplate;
    
    public PageResult<Article> getArticlePage(Long current, Long size, Long categoryId, Long subCategoryId, String keyword) {
        Page<Article> page = new Page<>(current, size);
        
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<Article>()
                .eq(Article::getDeleted, false)
                .eq(Article::getStatus, 1)
                .orderByDesc(Article::getIsTop)
                .orderByDesc(Article::getCreatedAt);
        
        if (categoryId != null) {
            wrapper.eq(Article::getCategoryId, categoryId);
        }
        if (subCategoryId != null) {
            wrapper.eq(Article::getSubCategoryId, subCategoryId);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getContent, keyword)
                    .or()
                    .like(Article::getKeywords, keyword)
            );
        }
        
        Page<Article> result = articleMapper.selectPage(page, wrapper);
        
        for (Article article : result.getRecords()) {
            enrichArticle(article);
        }
        
        return PageResult.of(result.getRecords(), result.getTotal(), result.getSize(), result.getCurrent());
    }
    
    public Article getArticleById(Long id, boolean incrementView, HttpServletRequest request) {
        Article article = articleMapper.selectArticleWithDetails(id);
        
        if (article == null || article.getDeleted()) {
            throw new IllegalArgumentException("文章不存在");
        }
        
        if (incrementView && !article.getIsLocked()) {
            articleMapper.incrementViewCount(id);
            article.setViewCount(article.getViewCount() + 1);
            
            recordAccess(id, request);
        }
        
        enrichArticle(article);
        return article;
    }
    
    private void enrichArticle(Article article) {
        if (article.getCategoryId() != null && article.getCategoryName() == null) {
            Category category = categoryMapper.selectById(article.getCategoryId());
            if (category != null) {
                article.setCategoryName(category.getCategoryName());
            }
        }
        
        if (article.getSubCategoryId() != null && article.getSubCategoryName() == null) {
            SubCategory subCategory = subCategoryMapper.selectById(article.getSubCategoryId());
            if (subCategory != null) {
                article.setSubCategoryName(subCategory.getSubCategoryName());
            }
        }
        
        if (article.getUserId() != null && article.getAuthorName() == null) {
            User user = userMapper.selectById(article.getUserId());
            if (user != null) {
                article.setAuthorName(user.getUsername());
                article.setAuthorNickname(user.getNickname());
            }
        }
    }
    
    private void recordAccess(Long articleId, HttpServletRequest request) {
        String ip = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        
        jdbcTemplate.update(
                "INSERT INTO access_stats (article_id, ip_address, user_agent, access_time) VALUES (?, ?, ?, ?)",
                articleId, ip, userAgent, LocalDateTime.now()
        );
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
    
    @Transactional
    public Article createArticle(ArticleDTO dto, Long userId) {
        validateCategory(dto.getCategoryId(), dto.getSubCategoryId());
        
        Article article = new Article();
        article.setTitle(dto.getTitle());
        article.setContent(dto.getContent());
        article.setSummary(dto.getSummary() != null ? dto.getSummary() : generateSummary(dto.getContent()));
        article.setKeywords(dto.getKeywords());
        article.setCategoryId(dto.getCategoryId());
        article.setSubCategoryId(dto.getSubCategoryId());
        article.setUserId(userId);
        article.setViewCount(0L);
        article.setIsLocked(false);
        article.setIsTop(dto.getIsTop() != null ? dto.getIsTop() : false);
        article.setStatus(1);
        article.setDeleted(false);
        
        articleMapper.insert(article);
        return article;
    }
    
    @Transactional
    public Article updateArticle(ArticleDTO dto, Long userId, boolean isAdmin) {
        Article existing = articleMapper.selectById(dto.getId());
        if (existing == null || existing.getDeleted()) {
            throw new IllegalArgumentException("文章不存在");
        }
        
        if (!isAdmin && !existing.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权限修改此文章");
        }
        
        if (existing.getIsLocked() && !isAdmin) {
            throw new IllegalArgumentException("文章已被锁定，无法修改");
        }
        
        if (dto.getCategoryId() != null) {
            validateCategory(dto.getCategoryId(), dto.getSubCategoryId());
        }
        
        if (dto.getTitle() != null) existing.setTitle(dto.getTitle());
        if (dto.getContent() != null) {
            existing.setContent(dto.getContent());
            existing.setSummary(generateSummary(dto.getContent()));
        }
        if (dto.getSummary() != null) existing.setSummary(dto.getSummary());
        if (dto.getKeywords() != null) existing.setKeywords(dto.getKeywords());
        if (dto.getCategoryId() != null) existing.setCategoryId(dto.getCategoryId());
        if (dto.getSubCategoryId() != null) existing.setSubCategoryId(dto.getSubCategoryId());
        if (isAdmin && dto.getIsTop() != null) existing.setIsTop(dto.getIsTop());
        if (isAdmin && dto.getIsLocked() != null) existing.setIsLocked(dto.getIsLocked());
        
        articleMapper.updateById(existing);
        return existing;
    }
    
    @Transactional
    public void deleteArticle(Long id, Long userId, boolean isAdmin) {
        Article article = articleMapper.selectById(id);
        if (article == null || article.getDeleted()) {
            throw new IllegalArgumentException("文章不存在");
        }
        
        if (!isAdmin && !article.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权限删除此文章");
        }
        
        article.setDeleted(true);
        articleMapper.updateById(article);
    }
    
    private void validateCategory(Long categoryId, Long subCategoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("请选择分类");
        }
        
        Category category = categoryMapper.selectById(categoryId);
        if (category == null || category.getDeleted() || category.getStatus() != 1) {
            throw new IllegalArgumentException("分类不存在或已禁用");
        }
        
        if (subCategoryId != null) {
            SubCategory subCategory = subCategoryMapper.selectById(subCategoryId);
            if (subCategory == null || subCategory.getDeleted() || subCategory.getStatus() != 1) {
                throw new IllegalArgumentException("子分类不存在或已禁用");
            }
            if (!subCategory.getCategoryId().equals(categoryId)) {
                throw new IllegalArgumentException("子分类不属于该大类");
            }
        }
    }
    
    private String generateSummary(String content) {
        if (content == null) return "";
        String text = content.replaceAll("<[^>]+>", "");
        return text.length() > 200 ? text.substring(0, 200) + "..." : text;
    }
    
    public List<Article> getRecentArticles(int limit) {
        return articleMapper.selectRecentArticles(limit);
    }
    
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalArticles", articleMapper.countTotalArticles());
        stats.put("totalViews", articleMapper.sumTotalViews());
        return stats;
    }
    
    @Transactional
    public Article lockArticle(Long id, boolean locked) {
        Article article = articleMapper.selectById(id);
        if (article == null || article.getDeleted()) {
            throw new IllegalArgumentException("文章不存在");
        }
        article.setIsLocked(locked);
        articleMapper.updateById(article);
        return article;
    }
    
    @Transactional
    public Article topArticle(Long id, boolean isTop) {
        Article article = articleMapper.selectById(id);
        if (article == null || article.getDeleted()) {
            throw new IllegalArgumentException("文章不存在");
        }
        article.setIsTop(isTop);
        articleMapper.updateById(article);
        return article;
    }
}
